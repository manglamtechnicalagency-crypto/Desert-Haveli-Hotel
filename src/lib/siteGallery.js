import { supabase } from "./supabaseClient";
import { SITE_IMAGES_BUCKET } from "./siteImages";
import { cloudflareMediaUrl, deleteFromR2, uploadToR2 } from "./cloudflareStorage";
import { deleteMedia, mediaUrl, uploadMedia } from "./mediaStorage";

export const GALLERY_SECTION_KEY = "room-gallery";
export const GALLERY_CATEGORIES = ["Rooms", "Reception", "Room View", "Interior", "Exterior", "Rooftop View", "Hotel Gallery", "Restaurant", "Fort View", "Jaisalmer", "Custom"];
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export function galleryImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("cloudinary://")) return mediaUrl(path);
  if (import.meta.env.VITE_R2_PUBLIC_BASE_URL) return cloudflareMediaUrl(path);
  const { data } = supabase.storage.from(SITE_IMAGES_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

export async function fetchPublicGalleryImages() {
  const { data, error } = await supabase.from("site_gallery_images").select("*").eq("section_key", GALLERY_SECTION_KEY).eq("is_active", true).order("display_order");
  if (error) throw error;
  return data || [];
}

export async function fetchAdminGalleryImages() {
  const { data, error } = await supabase.from("site_gallery_images").select("*").eq("section_key", GALLERY_SECTION_KEY).order("display_order");
  if (error) throw error;
  return data || [];
}

export async function uploadGalleryImage(file, { category = "Rooms", title = "", altText = "", caption = "" } = {}) {
  if (!file || !ACCEPTED.includes(file.type)) throw new Error("Only JPG, PNG, and WEBP gallery images are accepted.");
  if (file.size > MAX_BYTES) throw new Error("Gallery image is larger than 10MB.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "");
  const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
  await uploadMedia(file, path, { resourceType: "image" });
  const { count } = await supabase.from("site_gallery_images").select("id", { count: "exact", head: true }).eq("section_key", GALLERY_SECTION_KEY);
  const { data, error } = await supabase.from("site_gallery_images").insert({ section_key: GALLERY_SECTION_KEY, storage_path: path, category, title: title || file.name, alt_text: altText || title || file.name, caption, display_order: count || 0, is_active: true }).select().single();
  if (error) { await deleteMedia(path).catch(() => {}); throw error; }
  return data;
}

export async function deleteGalleryImage(image) {
  if (image.storage_path?.startsWith("cloudinary://") || import.meta.env.VITE_R2_PUBLIC_BASE_URL) await deleteMedia(image.storage_path);
  else await supabase.storage.from(SITE_IMAGES_BUCKET).remove([image.storage_path]);
  const { error } = await supabase.from("site_gallery_images").delete().eq("id", image.id);
  if (error) throw error;
}
