import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createRoom,
  deleteRoomFeature,
  deleteRoomImage,
  fetchAdminRoomById,
  publicImageUrl,
  setPrimaryImage,
  slugify,
  updateRoom,
  uploadRoomImage,
  upsertRoomFeature,
} from "../lib/roomsApi";
import { useAdminAuth } from "./AdminAuthContext";
import RoomPricingPanel from "./RoomPricingPanel";
import RoomAvailabilityPanel from "./RoomAvailabilityPanel";

const EMPTY_ROOM = {
  room_number: "",
  name: "",
  slug: "",
  internal_code: "",
  category: "",
  room_type: "",
  short_description: "",
  full_description: "",
  highlight_text: "",
  booking_note: "",
  public_availability_message: "",
  internal_note: "",
  max_guests: "",
  max_adults: "",
  max_children: "",
  bed_count: "",
  bed_type: "",
  bathroom_count: "",
  room_size: "",
  room_size_unit: "sqft",
  floor_number: "",
  base_price: "",
  promotional_price: "",
  promotional_price_start_date: "",
  promotional_price_end_date: "",
  weekend_price: "",
  currency: "INR",
  tax_percentage: "0",
  service_charge: "0",
  extra_adult_charge: "0",
  extra_child_charge: "0",
  status: "draft",
  availability_status: "available",
  is_visible: true,
  is_bookable: true,
  is_featured: false,
  display_order: 0,
};

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export default function AdminRoomFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { profile } = useAdminAuth();

  const [room, setRoom] = useState(EMPTY_ROOM);
  const [images, setImages] = useState([]);
  const [features, setFeatures] = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (!isEdit) return;
    fetchAdminRoomById(id)
      .then((data) => {
        if (!data) {
          setError("Room not found.");
          return;
        }
        const normalised = { ...EMPTY_ROOM, ...data };
        setRoom(normalised);
        setImages((data.room_images || []).sort((a, b) => a.display_order - b.display_order));
        setFeatures((data.room_features || []).sort((a, b) => a.display_order - b.display_order));
        setInitialSnapshot(JSON.stringify(normalised));
        setSlugTouched(true);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    function beforeUnload(e) {
      if (initialSnapshot && JSON.stringify(room) !== initialSnapshot) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [room, initialSnapshot]);

  function update(field, value) {
    setRoom((r) => {
      const next = { ...r, [field]: value };
      if (field === "name" && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  function buildPayload(statusOverride) {
    return {
      room_number: room.room_number.trim(),
      name: room.name.trim(),
      slug: room.slug.trim() || slugify(room.name),
      internal_code: room.internal_code || null,
      category: room.category || null,
      room_type: room.room_type || null,
      short_description: room.short_description || null,
      full_description: room.full_description || null,
      highlight_text: room.highlight_text || null,
      booking_note: room.booking_note || null,
      public_availability_message: room.public_availability_message || null,
      internal_note: room.internal_note || null,
      max_guests: toNumberOrNull(room.max_guests),
      max_adults: toNumberOrNull(room.max_adults),
      max_children: toNumberOrNull(room.max_children),
      bed_count: toNumberOrNull(room.bed_count),
      bed_type: room.bed_type || null,
      bathroom_count: toNumberOrNull(room.bathroom_count),
      room_size: toNumberOrNull(room.room_size),
      room_size_unit: room.room_size_unit || "sqft",
      floor_number: toNumberOrNull(room.floor_number),
      base_price: toNumberOrNull(room.base_price),
      promotional_price: toNumberOrNull(room.promotional_price),
      promotional_price_start_date: room.promotional_price_start_date || null,
      promotional_price_end_date: room.promotional_price_end_date || null,
      weekend_price: toNumberOrNull(room.weekend_price),
      currency: room.currency || "INR",
      tax_percentage: toNumberOrNull(room.tax_percentage) ?? 0,
      service_charge: toNumberOrNull(room.service_charge) ?? 0,
      extra_adult_charge: toNumberOrNull(room.extra_adult_charge) ?? 0,
      extra_child_charge: toNumberOrNull(room.extra_child_charge) ?? 0,
      status: statusOverride || room.status,
      availability_status: room.availability_status,
      is_visible: room.is_visible,
      is_bookable: room.is_bookable,
      is_featured: room.is_featured,
      display_order: toNumberOrNull(room.display_order) ?? 0,
    };
  }

  function validate() {
    if (!room.room_number.trim()) return "Room number is required.";
    if (!room.name.trim()) return "Room name is required.";
    if (room.base_price !== "" && Number(room.base_price) < 0) return "Base price cannot be negative.";
    return "";
  }

  async function handleSave(statusOverride) {
    if (saving) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = buildPayload(statusOverride);
      if (isEdit) {
        const updated = await updateRoom(id, payload, profile, room);
        setRoom({ ...EMPTY_ROOM, ...updated });
        setInitialSnapshot(JSON.stringify({ ...EMPTY_ROOM, ...updated }));
        setSuccess("Room saved.");
      } else {
        const created = await createRoom(payload, profile);
        setSuccess("Room created. You can now add images, features, pricing, and availability.");
        navigate(`/admin/rooms/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      if (err.message?.includes("rooms_room_number_unique")) setError("That room number is already in use.");
      else if (err.message?.includes("rooms_slug_unique")) setError("That slug is already in use.");
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (initialSnapshot) setRoom(JSON.parse(initialSnapshot));
    else setRoom(EMPTY_ROOM);
  }

  async function handleImageUpload(fileList) {
    setError("");
    const files = Array.from(fileList);
    for (const file of files) {
      try {
        const img = await uploadRoomImage(id, file, {
          isPrimary: images.length === 0,
          displayOrder: images.length,
        });
        setImages((prev) => [...prev, img]);
      } catch (err) {
        setError(`${file.name}: ${err.message}`);
      }
    }
  }

  async function handleDeleteImage(image) {
    if (!window.confirm("Delete this image?")) return;
    try {
      await deleteRoomImage(image);
      setImages((prev) => prev.filter((i) => i.id !== image.id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetPrimary(image) {
    try {
      await setPrimaryImage(id, image.id);
      setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === image.id })));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddFeature() {
    try {
      const created = await upsertRoomFeature({
        room_id: id,
        name: "New feature",
        point_value: 1,
        display_order: features.length,
        is_active: true,
        is_highlighted: false,
      });
      setFeatures((prev) => [...prev, created]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateFeature(feature, patch) {
    try {
      const updated = await upsertRoomFeature({ ...feature, ...patch });
      setFeatures((prev) => prev.map((f) => (f.id === feature.id ? updated : f)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteFeature(feature) {
    try {
      await deleteRoomFeature(feature.id);
      setFeatures((prev) => prev.filter((f) => f.id !== feature.id));
    } catch (err) {
      setError(err.message);
    }
  }

  const dirty = useMemo(() => initialSnapshot && JSON.stringify(room) !== initialSnapshot, [room, initialSnapshot]);

  if (loading) return <p>Loading room…</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><span className="admin-kicker">ROOM INVENTORY</span><h1>{isEdit ? `Edit Room #${room.room_number || ""}` : "Add Room"}</h1><p>{isEdit ? "Update the guest-facing room profile and operational settings." : "Create a room profile, then add photos, amenities, pricing, and dates."}</p></div>
        {dirty && <span className="admin-dirty-flag">Unsaved changes</span>}
      </div>

      {error && (
        <p className="admin-form-error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="admin-form-success">{success}</p>}

      <div className="admin-tabs" role="tablist">
        <button className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}>
          Details
        </button>
        <button
          className={activeTab === "images" ? "active" : ""}
          onClick={() => setActiveTab("images")}
          disabled={!isEdit}
          title={!isEdit ? "Save the room first to add photos" : undefined}
        >
          Photos
        </button>
        <button
          className={activeTab === "features" ? "active" : ""}
          onClick={() => setActiveTab("features")}
          disabled={!isEdit}
          title={!isEdit ? "Save the room first to add amenities" : undefined}
        >
          Amenities
        </button>
        <button
          className={activeTab === "pricing" ? "active" : ""}
          onClick={() => setActiveTab("pricing")}
          disabled={!isEdit}
          title={!isEdit ? "Save the room first to manage special pricing" : undefined}
        >
          Special Pricing
        </button>
        <button
          className={activeTab === "availability" ? "active" : ""}
          onClick={() => setActiveTab("availability")}
          disabled={!isEdit}
          title={!isEdit ? "Save the room first to block dates" : undefined}
        >
          Block Dates
        </button>
      </div>

      <p className="admin-hint admin-tabs-hint">
        Start with <strong>Details</strong> — name, description, and price. Everything else is optional.
      </p>

      {activeTab === "details" && (
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <fieldset className="admin-fieldset admin-fieldset-primary">
            <legend>The essentials</legend>
            <div className="admin-grid-2">
              <label>
                Room number *
                <input value={room.room_number} onChange={(e) => update("room_number", e.target.value)} required />
              </label>
              <label>
                Room name *
                <input value={room.name} onChange={(e) => update("name", e.target.value)} required placeholder="e.g. Heritage Prince Room" />
              </label>
            </div>
            <label>
              Description <span className="admin-hint-inline">(what guests see on the website)</span>
              <textarea
                rows={3}
                value={room.short_description || ""}
                onChange={(e) => update("short_description", e.target.value)}
                placeholder="A short, friendly description of the room"
              />
            </label>
            <label>
              Price per night
              <input
                type="number"
                min="0"
                value={room.base_price}
                onChange={(e) => update("base_price", e.target.value)}
                placeholder="Leave blank for price on request"
              />
            </label>
            <p className="admin-hint">
              {isEdit ? (
                <>
                  Add or change photos in the{" "}
                  <button type="button" className="admin-link-button" onClick={() => setActiveTab("images")}>
                    Photos
                  </button>{" "}
                  tab above.
                </>
              ) : (
                "Save this room once, then add photos in the Photos tab."
              )}
            </p>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend>Availability</legend>
            <label>
              Current status
              <select value={room.availability_status} onChange={(e) => update("availability_status", e.target.value)}>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="under_maintenance">Under maintenance</option>
                <option value="fully_booked">Fully booked</option>
                <option value="temporarily_closed">Temporarily closed</option>
                <option value="manual_block">Manually blocked</option>
              </select>
            </label>
            <p className="admin-hint">To block specific future dates instead, use the Block Dates tab above.</p>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend>Publish</legend>
            <div className="admin-grid-2">
              <label className="admin-checkbox">
                <input type="checkbox" checked={room.is_visible} onChange={(e) => update("is_visible", e.target.checked)} />
                Visible on public site
              </label>
              <label className="admin-checkbox">
                <input type="checkbox" checked={room.is_bookable} onChange={(e) => update("is_bookable", e.target.checked)} />
                Bookable
              </label>
            </div>
          </fieldset>

          <details className="admin-advanced">
            <summary>More details (optional)</summary>
            <div className="admin-advanced-body">
              <fieldset className="admin-fieldset">
                <legend>Identifiers</legend>
                <div className="admin-grid-2">
                  <label>
                    Slug
                    <input
                      value={room.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        update("slug", e.target.value);
                      }}
                    />
                  </label>
                  <label>
                    Internal code
                    <input value={room.internal_code || ""} onChange={(e) => update("internal_code", e.target.value)} />
                  </label>
                  <label>
                    Category
                    <input value={room.category || ""} onChange={(e) => update("category", e.target.value)} />
                  </label>
                  <label>
                    Room type
                    <input value={room.room_type || ""} onChange={(e) => update("room_type", e.target.value)} />
                  </label>
                </div>
              </fieldset>

              <fieldset className="admin-fieldset">
                <legend>Extra description fields</legend>
                <label>
                  Full description
                  <textarea rows={4} value={room.full_description || ""} onChange={(e) => update("full_description", e.target.value)} />
                </label>
                <div className="admin-grid-2">
                  <label>
                    Highlight text
                    <input value={room.highlight_text || ""} onChange={(e) => update("highlight_text", e.target.value)} />
                  </label>
                  <label>
                    Booking note
                    <input value={room.booking_note || ""} onChange={(e) => update("booking_note", e.target.value)} />
                  </label>
                  <label>
                    Public availability message
                    <input
                      value={room.public_availability_message || ""}
                      onChange={(e) => update("public_availability_message", e.target.value)}
                      placeholder="e.g. Contact hotel for current pricing"
                    />
                  </label>
                  <label>
                    Internal note (staff only)
                    <input value={room.internal_note || ""} onChange={(e) => update("internal_note", e.target.value)} />
                  </label>
                </div>
              </fieldset>

              <fieldset className="admin-fieldset">
                <legend>Capacity and specifications</legend>
                <div className="admin-grid-4">
                  <label>
                    Max guests
                    <input type="number" min="0" value={room.max_guests} onChange={(e) => update("max_guests", e.target.value)} />
                  </label>
                  <label>
                    Max adults
                    <input type="number" min="0" value={room.max_adults} onChange={(e) => update("max_adults", e.target.value)} />
                  </label>
                  <label>
                    Max children
                    <input type="number" min="0" value={room.max_children} onChange={(e) => update("max_children", e.target.value)} />
                  </label>
                  <label>
                    Bed count
                    <input type="number" min="0" value={room.bed_count} onChange={(e) => update("bed_count", e.target.value)} />
                  </label>
                  <label>
                    Bed type
                    <input value={room.bed_type || ""} onChange={(e) => update("bed_type", e.target.value)} />
                  </label>
                  <label>
                    Bathrooms
                    <input type="number" min="0" value={room.bathroom_count} onChange={(e) => update("bathroom_count", e.target.value)} />
                  </label>
                  <label>
                    Room size
                    <input type="number" min="0" value={room.room_size} onChange={(e) => update("room_size", e.target.value)} />
                  </label>
                  <label>
                    Size unit
                    <select value={room.room_size_unit} onChange={(e) => update("room_size_unit", e.target.value)}>
                      <option value="sqft">sq ft</option>
                      <option value="sqm">sq m</option>
                    </select>
                  </label>
                  <label>
                    Floor number
                    <input type="number" value={room.floor_number} onChange={(e) => update("floor_number", e.target.value)} />
                  </label>
                </div>
              </fieldset>

              <fieldset className="admin-fieldset">
                <legend>Advanced pricing</legend>
                <div className="admin-grid-4">
                  <label>
                    Promotional price
                    <input type="number" min="0" value={room.promotional_price} onChange={(e) => update("promotional_price", e.target.value)} />
                  </label>
                  <label>
                    Promo starts
                    <input
                      type="date"
                      value={room.promotional_price_start_date || ""}
                      onChange={(e) => update("promotional_price_start_date", e.target.value)}
                    />
                  </label>
                  <label>
                    Promo ends
                    <input
                      type="date"
                      value={room.promotional_price_end_date || ""}
                      onChange={(e) => update("promotional_price_end_date", e.target.value)}
                    />
                  </label>
                  <label>
                    Weekend price
                    <input type="number" min="0" value={room.weekend_price} onChange={(e) => update("weekend_price", e.target.value)} />
                  </label>
                  <label>
                    Currency
                    <input value={room.currency} onChange={(e) => update("currency", e.target.value)} />
                  </label>
                  <label>
                    Tax %
                    <input type="number" min="0" value={room.tax_percentage} onChange={(e) => update("tax_percentage", e.target.value)} />
                  </label>
                  <label>
                    Service charge
                    <input type="number" min="0" value={room.service_charge} onChange={(e) => update("service_charge", e.target.value)} />
                  </label>
                  <label>
                    Extra adult charge
                    <input type="number" min="0" value={room.extra_adult_charge} onChange={(e) => update("extra_adult_charge", e.target.value)} />
                  </label>
                  <label>
                    Extra child charge
                    <input type="number" min="0" value={room.extra_child_charge} onChange={(e) => update("extra_child_charge", e.target.value)} />
                  </label>
                </div>
                <p className="admin-hint">
                  For date-specific, weekend, or seasonal pricing rules, save the room first and use the Special Pricing tab above.
                </p>
              </fieldset>

              <fieldset className="admin-fieldset">
                <legend>Sorting</legend>
                <div className="admin-grid-2">
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={room.is_featured} onChange={(e) => update("is_featured", e.target.checked)} />
                    Featured on homepage
                  </label>
                  <label>
                    Display order
                    <input type="number" value={room.display_order} onChange={(e) => update("display_order", e.target.value)} />
                  </label>
                </div>
              </fieldset>
            </div>
          </details>

          <div className="admin-form-actions">
            <button className="btn secondary" type="button" disabled={saving} onClick={() => handleSave("draft")}>
              Save as Draft
            </button>
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button className="btn primary" type="button" disabled={saving} onClick={() => handleSave("published")}>
              Save &amp; Publish
            </button>
            <button className="btn ghost-light" type="button" disabled={saving} onClick={handleReset}>
              Reset
            </button>
            <button className="btn ghost-light" type="button" onClick={() => navigate("/admin/rooms")}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {activeTab === "images" && isEdit && (
        <section className="admin-section">
          <h2>Photos</h2>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => handleImageUpload(e.target.files)}
          />
          <p className="admin-hint">JPG, PNG, or WEBP. Max 5MB each. The first photo you upload becomes the main photo automatically — you can change that anytime with "Make primary".</p>
          <div className="admin-image-grid">
            {images.map((img) => (
              <figure key={img.id} className={`admin-image-card ${img.is_primary ? "primary" : ""}`}>
                <img className="admin-image-thumb" src={publicImageUrl(img.storage_path)} alt={img.alt_text || ""} loading="lazy" />
                {img.is_primary && <span className="admin-primary-badge">Primary</span>}
                <figcaption>
                  {!img.is_primary && (
                    <button className="btn small ghost-light" onClick={() => handleSetPrimary(img)}>
                      Make primary
                    </button>
                  )}
                  <button className="btn small danger" onClick={() => handleDeleteImage(img)}>
                    Delete
                  </button>
                </figcaption>
              </figure>
            ))}
            {images.length === 0 && <p className="admin-empty">No images uploaded yet.</p>}
          </div>
        </section>
      )}

      {activeTab === "features" && isEdit && (
        <section className="admin-section">
          <div className="admin-page-header">
            <h2>Amenities</h2>
            <button className="btn secondary" onClick={handleAddFeature}>
              + Add amenity
            </button>
          </div>
          <div className="admin-feature-list">
            {features.map((f) => (
              <div className="admin-feature-row" key={f.id}>
                <input
                  value={f.name}
                  onChange={(e) => setFeatures((prev) => prev.map((x) => (x.id === f.id ? { ...x, name: e.target.value } : x)))}
                  onBlur={(e) => handleUpdateFeature(f, { name: e.target.value })}
                />
                <input
                  type="number"
                  className="admin-feature-points"
                  value={f.point_value}
                  onChange={(e) => setFeatures((prev) => prev.map((x) => (x.id === f.id ? { ...x, point_value: e.target.value } : x)))}
                  onBlur={(e) => handleUpdateFeature(f, { point_value: Number(e.target.value) })}
                  title="Point value"
                />
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={f.is_highlighted}
                    onChange={(e) => handleUpdateFeature(f, { is_highlighted: e.target.checked })}
                  />
                  Highlight
                </label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={f.is_active}
                    onChange={(e) => handleUpdateFeature(f, { is_active: e.target.checked })}
                  />
                  Active
                </label>
                <button className="btn small danger" onClick={() => handleDeleteFeature(f)}>
                  Remove
                </button>
              </div>
            ))}
            {features.length === 0 && <p className="admin-empty">No features yet.</p>}
          </div>
        </section>
      )}

      {activeTab === "pricing" && isEdit && <RoomPricingPanel roomId={id} room={room} />}
      {activeTab === "availability" && isEdit && <RoomAvailabilityPanel roomId={id} profile={profile} />}
    </div>
  );
}
