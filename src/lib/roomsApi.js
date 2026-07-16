import { supabase } from "./supabaseClient";
import { cloudflareMediaUrl, deleteFromR2, uploadToR2 } from "./cloudflareStorage";
import { deleteMedia, mediaUrl, uploadMedia } from "./mediaStorage";

const ROOM_IMAGES_BUCKET = "room-images";

export function publicImageUrl(storagePath) {
  if (!storagePath) return null;
  if (storagePath.startsWith("cloudinary://")) return mediaUrl(storagePath);
  if (import.meta.env.VITE_R2_PUBLIC_BASE_URL) return cloudflareMediaUrl(storagePath);
  const { data } = supabase.storage.from(ROOM_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl || null;
}

/* ---------------------------------------------------------------------- */
/* Public site reads                                                       */
/* ---------------------------------------------------------------------- */

// Fetch only the current public inventory. Keep these predicates explicit in
// addition to RLS so an archived/deleted/draft record can never reappear on
// the guest site because of a permissive policy or stale backend data.
export async function fetchPublicRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select(
      `id, room_number, name, slug, short_description, full_description, highlight_text,
       booking_note, public_availability_message, max_guests, max_adults, max_children,
       bed_count, bed_type, bathroom_count, room_size, room_size_unit,
       base_price, promotional_price, promotional_price_start_date, promotional_price_end_date, weekend_price, currency, tax_percentage, service_charge,
       availability_status, is_bookable, is_visible, is_archived, is_deleted, status, display_order,
       room_images ( id, storage_path, alt_text, caption, display_order, is_primary ),
       room_features ( id, name, description, icon_key, point_value, display_order, is_highlighted, is_active ),
       room_price_overrides ( date, price, discount_type, discount_value, pricing_label ),
       room_pricing_rules ( rule_name, rule_type, start_date, end_date, days_of_week, fixed_price, adjustment_type, adjustment_value, priority, is_active, id, created_at )`
    )
    .eq("status", "published")
    .eq("is_visible", true)
    .eq("is_bookable", true)
    .eq("is_archived", false)
    .eq("is_deleted", false)
    .order("display_order", { ascending: true })
    .order("priority", { referencedTable: "room_pricing_rules", ascending: false })
    .order("id", { referencedTable: "room_pricing_rules", ascending: true });

  if (error) throw error;

  return (data || []).map((room) => ({
    ...room,
    room_images: (room.room_images || []).sort((a, b) => a.display_order - b.display_order),
    room_features: (room.room_features || [])
      .filter((f) => f.is_active)
      .sort((a, b) => a.display_order - b.display_order),
  }));
}

export async function fetchApprovedFeedback() {
  const { data, error } = await supabase
    .from("guest_feedback")
    .select("id, guest_name, rating, review_text, stay_details, created_at")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw error;
  return data || [];
}

export async function submitGuestFeedback({ guest_name, rating, review_text, stay_details }) {
  const { error } = await supabase.from("guest_feedback").insert({
    guest_name,
    rating,
    review_text,
    stay_details,
    is_approved: false,
  });
  if (error) throw error;
}

/* ---------------------------------------------------------------------- */
/* Admin auth                                                              */
/* ---------------------------------------------------------------------- */

export async function signInAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Server-side, authoritative lockout state (ISSUE-002 fix). Backed by the
// admin_login_attempts table + SECURITY DEFINER RPCs, so it survives a page
// reload -- unlike the old client-only `attempts`/`lockedUntil` React state.
// These RPCs are intentionally callable by `anon` (there is no session yet
// at login time), but are tightly scoped: they only ever read/write the one
// row keyed by the email passed in, never anything else.
export async function checkLoginLockout(email) {
  const { data, error } = await supabase.rpc("check_login_lockout", { p_email: email });
  if (error) throw error;
  return (data && data[0]) || { is_locked: false, locked_until: null, failed_count: 0 };
}

export async function recordLoginAttempt(email, success) {
  const { data, error } = await supabase.rpc("record_login_attempt", { p_email: email, p_success: success });
  if (error) throw error;
  return (data && data[0]) || { is_locked: false, locked_until: null, failed_count: 0 };
}

export async function requestPinReset(email) {
  const response = await fetch("/api/admin/request-pin-reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Unable to send OTP.");
  return payload;
}

export async function verifyPinReset(email, otp) {
  const response = await fetch("/api/admin/verify-pin-reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Invalid or expired OTP.");
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: payload.token_hash, type: "recovery" });
  if (error) throw error;
  return data;
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}

// Returns the admin_profiles row for the current session, or null if not an
// admin / not signed in / deactivated. This is a real query against a
// server-enforced RLS table, not a client-side trust decision.
export async function fetchCurrentAdminProfile() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("id, full_name, role, is_active")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) return null;
  if (!data || !data.is_active) return null;
  return data;
}

/* ---------------------------------------------------------------------- */
/* Admin: rooms                                                            */
/* ---------------------------------------------------------------------- */

export async function fetchAdminRooms({ search = "", availability = "", status = "", visibility = "", archived = "not_archived" } = {}) {
  let query = supabase
    .from("rooms")
    .select(
      `id, room_number, name, slug, room_type, base_price, promotional_price, weekend_price, currency,
       status, availability_status, is_visible, is_bookable, is_archived, is_deleted, updated_at, display_order,
       room_images ( storage_path, is_primary )`
    )
    .order("display_order", { ascending: true });

  if (archived === "archived") query = query.eq("is_archived", true);
  else if (archived === "not_archived") query = query.eq("is_archived", false);

  query = query.eq("is_deleted", false);

  if (status) query = query.eq("status", status);
  if (availability) query = query.eq("availability_status", availability);
  if (visibility === "visible") query = query.eq("is_visible", true);
  if (visibility === "hidden") query = query.eq("is_visible", false);
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,room_number.ilike.%${search}%,room_type.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchAdminRoomById(id) {
  const { data, error } = await supabase
    .from("rooms")
    .select(
      `*, room_images ( * ), room_features ( * ), room_price_overrides ( * ), room_pricing_rules ( * ), room_availability ( * )`
    )
    .eq("id", id)
    .order("priority", { referencedTable: "room_pricing_rules", ascending: false })
    .order("id", { referencedTable: "room_pricing_rules", ascending: true })
    .maybeSingle();
  if (error) throw error;
  return data;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export { slugify };

async function writeAuditLog({ adminId, role, action, entityType, entityId, previousData, newData }) {
  await supabase.from("room_audit_logs").insert({
    admin_id: adminId,
    role,
    action,
    entity_type: entityType,
    entity_id: entityId,
    previous_data: previousData ?? null,
    new_data: newData ?? null,
  });
}

export async function createRoom(payload, admin) {
  const { data, error } = await supabase
    .from("rooms")
    .insert({ ...payload, created_by: admin.id, updated_by: admin.id })
    .select()
    .single();
  if (error) throw error;
  await writeAuditLog({ adminId: admin.id, role: admin.role, action: "create", entityType: "room", entityId: data.id, newData: payload });
  return data;
}

export async function updateRoom(id, payload, admin, previousData) {
  const { data, error } = await supabase
    .from("rooms")
    .update({ ...payload, updated_by: admin.id })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await writeAuditLog({ adminId: admin.id, role: admin.role, action: "update", entityType: "room", entityId: id, previousData, newData: payload });
  return data;
}

export async function duplicateRoom(id, admin) {
  const original = await fetchAdminRoomById(id);
  if (!original) throw new Error("Room not found");

  const {
    id: _id,
    room_images,
    room_features,
    room_price_overrides,
    room_pricing_rules,
    room_availability,
    created_at,
    updated_at,
    ...rest
  } = original;

  let suffix = 1;
  let newRoomNumber = `${rest.room_number}-copy`;
  let newSlug = `${rest.slug}-copy`;
  // Avoid unique-constraint collisions if duplicated more than once.
  // (Best-effort client-side check; the DB unique constraint is the real guard.)
  const { data: clash } = await supabase.from("rooms").select("room_number").eq("room_number", newRoomNumber);
  if (clash && clash.length > 0) {
    suffix = clash.length + 1;
    newRoomNumber = `${rest.room_number}-copy-${suffix}`;
    newSlug = `${rest.slug}-copy-${suffix}`;
  }

  const duplicate = await createRoom(
    {
      ...rest,
      room_number: newRoomNumber,
      slug: newSlug,
      name: `${rest.name} (Copy)`,
      status: "draft",
      is_featured: false,
    },
    admin
  );

  if (room_features?.length) {
    await supabase.from("room_features").insert(
      room_features.map(({ id: _fid, room_id: _rid, created_at: _ca, updated_at: _ua, ...f }) => ({
        ...f,
        room_id: duplicate.id,
      }))
    );
  }

  return duplicate;
}

export async function archiveRoom(id, admin) {
  const { data, error } = await supabase
    .from("rooms")
    .update({ is_archived: true, archived_at: new Date().toISOString(), archived_by: admin.id, updated_by: admin.id })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await writeAuditLog({ adminId: admin.id, role: admin.role, action: "archive", entityType: "room", entityId: id });
  return data;
}

export async function restoreRoom(id, admin) {
  const { data, error } = await supabase
    .from("rooms")
    .update({ is_archived: false, archived_at: null, archived_by: null, updated_by: admin.id })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await writeAuditLog({ adminId: admin.id, role: admin.role, action: "restore", entityType: "room", entityId: id });
  return data;
}

// Hard delete. RLS restricts this to super_admin at the database level too,
// so even if the UI hid the button, a non-super_admin call is rejected server-side.
export async function permanentlyDeleteRoom(id, admin) {
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) throw error;
  await writeAuditLog({ adminId: admin.id, role: admin.role, action: "delete", entityType: "room", entityId: id });
}

/* ---------------------------------------------------------------------- */
/* Admin: images                                                            */
/* ---------------------------------------------------------------------- */

const ACCEPTED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches the bucket's file_size_limit

export function validateImageFile(file) {
  if (!ACCEPTED_MIME.includes(file.type)) {
    return "Only JPG, PNG, and WEBP images are accepted.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Image is larger than 5MB.";
  }
  return null;
}

function readImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export async function uploadRoomImage(roomId, file, { isPrimary = false, displayOrder = 0, altText = "" } = {}) {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const dims = await readImageDimensions(file);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
  const storagePath = `rooms/${roomId}/${uniqueName}`;

  if (import.meta.env.VITE_R2_PUBLIC_BASE_URL) {
    await uploadMedia(file, storagePath, { resourceType: "image" });
  } else {
    const { error: storageError } = await supabase.storage
      .from(ROOM_IMAGES_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (storageError) throw storageError;
  }

  if (isPrimary) {
    // Clear any existing primary flag first so the unique partial index never conflicts.
    await supabase.from("room_images").update({ is_primary: false }).eq("room_id", roomId).eq("is_primary", true);
  }

  const { data, error } = await supabase
    .from("room_images")
    .insert({
      room_id: roomId,
      storage_path: storagePath,
      alt_text: altText,
      mime_type: file.type,
      file_size: file.size,
      width: dims.width,
      height: dims.height,
      display_order: displayOrder,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (error) {
    // Roll back the orphaned storage object if the DB insert failed.
    await deleteMedia(storagePath).catch(() => {});
    throw error;
  }
  return data;
}

export async function deleteRoomImage(image) {
  if (image.storage_path?.startsWith("cloudinary://") || import.meta.env.VITE_R2_PUBLIC_BASE_URL) await deleteMedia(image.storage_path);
  else await supabase.storage.from(ROOM_IMAGES_BUCKET).remove([image.storage_path]);
  const { error } = await supabase.from("room_images").delete().eq("id", image.id);
  if (error) throw error;
}

export async function setPrimaryImage(roomId, imageId) {
  await supabase.from("room_images").update({ is_primary: false }).eq("room_id", roomId).eq("is_primary", true);
  const { error } = await supabase.from("room_images").update({ is_primary: true }).eq("id", imageId);
  if (error) throw error;
}

export async function reorderRoomImages(orderedImageIds) {
  await Promise.all(
    orderedImageIds.map((id, index) => supabase.from("room_images").update({ display_order: index }).eq("id", id))
  );
}

/* ---------------------------------------------------------------------- */
/* Admin: features                                                         */
/* ---------------------------------------------------------------------- */

export async function upsertRoomFeature(feature) {
  const { data, error } = await supabase.from("room_features").upsert(feature).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRoomFeature(id) {
  const { error } = await supabase.from("room_features").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderRoomFeatures(orderedFeatureIds) {
  await Promise.all(
    orderedFeatureIds.map((id, index) => supabase.from("room_features").update({ display_order: index }).eq("id", id))
  );
}

export async function copyFeaturesFromRoom(sourceRoomId, targetRoomId) {
  const { data: sourceFeatures, error } = await supabase.from("room_features").select("*").eq("room_id", sourceRoomId);
  if (error) throw error;
  if (!sourceFeatures?.length) return [];
  const rows = sourceFeatures.map(({ id: _id, room_id: _rid, created_at: _ca, updated_at: _ua, ...f }) => ({
    ...f,
    room_id: targetRoomId,
  }));
  const { data, error: insertError } = await supabase.from("room_features").insert(rows).select();
  if (insertError) throw insertError;
  return data;
}

/* ---------------------------------------------------------------------- */
/* Admin: pricing                                                          */
/* ---------------------------------------------------------------------- */

export async function upsertPriceOverride(override) {
  const { data, error } = await supabase
    .from("room_price_overrides")
    .upsert(override, { onConflict: "room_id,date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePriceOverride(id) {
  const { error } = await supabase.from("room_price_overrides").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertPricingRule(rule) {
  const { data, error } = await supabase.from("room_pricing_rules").upsert(rule).select().single();
  if (error) throw error;
  return data;
}

export async function deletePricingRule(id) {
  const { error } = await supabase.from("room_pricing_rules").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------------------------------------------------------------- */
/* Admin: availability                                                     */
/* ---------------------------------------------------------------------- */

export async function createAvailabilityBlock(block, admin) {
  if (!block.start_date || !block.end_date) throw new Error("Start and end date are required.");
  if (block.end_date < block.start_date) throw new Error("End date cannot be before start date.");

  const { data: overlaps, error: overlapError } = await supabase
    .from("room_availability")
    .select("id, start_date, end_date")
    .eq("room_id", block.room_id)
    .lte("start_date", block.end_date)
    .gte("end_date", block.start_date);
  if (overlapError) throw overlapError;
  if (overlaps && overlaps.length > 0) {
    throw new Error("This date range overlaps an existing availability block for this room.");
  }

  const { data, error } = await supabase
    .from("room_availability")
    .insert({ ...block, created_by: admin.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAvailabilityBlock(id) {
  const { error } = await supabase.from("room_availability").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------------------------------------------------------------- */
/* Admin: dashboard stats                                                   */
/* ---------------------------------------------------------------------- */

export async function fetchDashboardStats() {
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("id, name, room_number, status, availability_status, is_visible, is_archived, base_price, updated_at")
    .eq("is_deleted", false);
  if (error) throw error;

  const active = (rooms || []).filter((r) => !r.is_archived);
  const archived = (rooms || []).filter((r) => r.is_archived);
  const prices = active.map((r) => r.base_price).filter((p) => p != null);

  const today = new Date().toISOString().slice(0, 10);
  const { data: todaysOverrides } = await supabase
    .from("room_price_overrides")
    .select("room_id")
    .eq("date", today);
  const { data: todaysBlocks } = await supabase
    .from("room_availability")
    .select("room_id")
    .lte("start_date", today)
    .gte("end_date", today);

  return {
    totalRooms: active.length,
    publishedRooms: active.filter((r) => r.status === "published").length,
    draftRooms: active.filter((r) => r.status === "draft").length,
    availableRooms: active.filter((r) => r.availability_status === "available").length,
    unavailableRooms: active.filter((r) => r.availability_status !== "available").length,
    maintenanceRooms: active.filter((r) => r.availability_status === "under_maintenance").length,
    hiddenRooms: active.filter((r) => !r.is_visible).length,
    archivedRooms: archived.length,
    averagePrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
    highestPrice: prices.length ? Math.max(...prices) : null,
    lowestPrice: prices.length ? Math.min(...prices) : null,
    specialPricingToday: new Set((todaysOverrides || []).map((o) => o.room_id)).size,
    unavailableToday: new Set((todaysBlocks || []).map((b) => b.room_id)).size,
    recentlyUpdated: [...active].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5),
  };
}
