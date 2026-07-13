import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  archiveRoom,
  duplicateRoom,
  fetchAdminRooms,
  permanentlyDeleteRoom,
  publicImageUrl,
  restoreRoom,
} from "../lib/roomsApi";
import { formatCurrency } from "../lib/pricing";
import { useAdminAuth, hasRole } from "./AdminAuthContext";

const PAGE_SIZE = 10;

export default function AdminRoomsListPage({ archiveView = false }) {
  const { profile } = useAdminAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [page, setPage] = useState(1);

  const search = params.get("q") || "";
  const availability = params.get("availability") || "";
  const status = params.get("status") || "";
  const visibility = params.get("visibility") || "";
  const sort = params.get("sort") || "order";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminRooms({
        search,
        availability,
        status,
        visibility,
        archived: archiveView ? "archived" : "not_archived",
      });
      setRooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, availability, status, visibility, archiveView]);

  const sorted = useMemo(() => {
    const list = [...rooms];
    if (sort === "price") list.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
    else if (sort === "updated") list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    else list.sort((a, b) => a.display_order - b.display_order);
    return list;
  }, [rooms, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRooms = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setPage(1);
  }

  async function handleAction(action, room) {
    setBusyId(room.id);
    setError("");
    try {
      if (action === "archive") await archiveRoom(room.id, profile);
      if (action === "restore") await restoreRoom(room.id, profile);
      if (action === "duplicate") {
        const copy = await duplicateRoom(room.id, profile);
        navigate(`/admin/rooms/${copy.id}/edit`);
        return;
      }
      if (action === "delete") {
        if (!window.confirm(`Permanently delete room "${room.name}" (#${room.room_number})? This cannot be undone and will remove its images, pricing, and availability history.`)) {
          setBusyId(null);
          return;
        }
        await permanentlyDeleteRoom(room.id, profile);
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={`admin-page ${archiveView ? "admin-archive-page" : ""}`}>
      <div className="admin-page-header">
        <div><span className="admin-kicker">INVENTORY MANAGEMENT</span><h1>{archiveView ? "Archived Rooms" : "Rooms"}</h1><p>{archiveView ? "Restore rooms or permanently remove old inventory." : "Manage rooms, images, pricing, visibility, and availability."}</p></div>
        {!archiveView && (
          <Link className="btn primary" to="/admin/rooms/new">
            + Add Room
          </Link>
        )}
      </div>

      {archiveView && (
        <section className="admin-archive-intro">
          <div className="admin-archive-intro-icon">↺</div>
          <div>
            <span className="admin-kicker">RECOVERY WORKSPACE</span>
            <h2>Archived rooms stay out of the guest website</h2>
            <p>Restore a room when it is ready to return to inventory. Permanent deletion removes its images, pricing, availability history, and audit trail.</p>
          </div>
          <Link className="btn secondary" to="/admin/rooms">Back to active rooms</Link>
        </section>
      )}

      <div className="admin-list-toolbar"><div className="admin-result-summary"><strong>{loading ? "—" : sorted.length}</strong><span>{archiveView ? "archived rooms" : "rooms in view"}</span></div><div className="admin-filters">
        <input
          type="search"
          placeholder="Search by name, number, or type…"
          defaultValue={search}
          onChange={(e) => updateParam("q", e.target.value)}
        />
        <select value={availability} onChange={(e) => updateParam("availability", e.target.value)}>
          <option value="">All availability</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
          <option value="under_maintenance">Under maintenance</option>
          <option value="fully_booked">Fully booked</option>
          <option value="temporarily_closed">Temporarily closed</option>
          <option value="manual_block">Manually blocked</option>
        </select>
        <select value={status} onChange={(e) => updateParam("status", e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <select value={visibility} onChange={(e) => updateParam("visibility", e.target.value)}>
          <option value="">All visibility</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
        <select value={sort} onChange={(e) => updateParam("sort", e.target.value)}>
          <option value="order">Sort: display order</option>
          <option value="price">Sort: price</option>
          <option value="updated">Sort: latest update</option>
        </select>
      </div><button className="admin-clear-filters" type="button" onClick={() => { setParams({}); setPage(1); }}>Clear filters</button></div>

      {error && <p className="admin-form-error">{error}</p>}

      {!loading && archiveView && sorted.length > 0 && <div className="admin-archive-summary"><span><strong>{sorted.length}</strong> archived {sorted.length === 1 ? "room" : "rooms"}</span><span>Nothing here is currently bookable</span></div>}

      {loading ? (
        <p>Loading rooms…</p>
      ) : sorted.length === 0 ? (
        <p className="admin-empty">
          {archiveView ? "No archived rooms." : "No rooms match your filters yet."}
        </p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Availability</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRooms.map((room) => {
                  const primary = room.room_images?.find((i) => i.is_primary) || room.room_images?.[0];
                  return (
                    <tr key={room.id}>
                      <td data-label="Image">
                        {primary ? (
                          <img className="admin-thumb" src={publicImageUrl(primary.storage_path)} alt="" loading="lazy" />
                        ) : (
                          <span className="admin-thumb-placeholder">No image</span>
                        )}
                      </td>
                      <td data-label="Room">
                        <strong>#{room.room_number}</strong> {room.name}
                      </td>
                      <td data-label="Type">{room.room_type || "—"}</td>
                      <td data-label="Price">{formatCurrency(room.base_price, room.currency)}</td>
                      <td data-label="Availability">
                        <span className="admin-status-pill" data-status={room.availability_status}>
                          {(room.availability_status || "unknown").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className="admin-status-pill" data-status={room.status}>
                          {room.status}
                        </span>
                      </td>
                      <td data-label="Visibility">{room.is_visible ? "Visible" : "Hidden"}</td>
                      <td data-label="Updated">{new Date(room.updated_at).toLocaleDateString()}</td>
                      <td data-label="Actions" className="admin-row-actions">
                        {!archiveView ? (
                          <>
                            <Link className="btn small ghost-light" to={`/admin/rooms/${room.id}/edit`}>
                              Edit
                            </Link>
                            <button
                              className="btn small ghost-light"
                              disabled={busyId === room.id}
                              onClick={() => handleAction("duplicate", room)}
                            >
                              Duplicate
                            </button>
                            <button
                              className="btn small secondary"
                              disabled={busyId === room.id}
                              onClick={() => handleAction("archive", room)}
                            >
                              Archive
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn small secondary"
                              disabled={busyId === room.id}
                              onClick={() => handleAction("restore", room)}
                            >
                              Restore
                            </button>
                            {hasRole(profile, ["super_admin"]) && (
                              <button
                                className="btn small danger"
                                disabled={busyId === room.id}
                                onClick={() => handleAction("delete", room)}
                              >
                                Delete permanently
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
