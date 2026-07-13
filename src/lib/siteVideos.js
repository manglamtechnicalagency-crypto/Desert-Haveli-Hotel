import { supabase } from "./supabaseClient";
import { SITE_IMAGES_BUCKET } from "./siteImages";
import { cloudflareMediaUrl, uploadToR2 } from "./cloudflareStorage";

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 15;
const TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export function validateVideoFile(file) {
  if (!file || !TYPES.includes(file.type)) throw new Error("Unsupported video format. Use MP4, WebM or MOV.");
  if (file.size > MAX_VIDEO_BYTES) throw new Error("Video size exceeds the maximum allowed limit of 200 MB.");
}

export function readVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => { const result = { duration: video.duration, width: video.videoWidth, height: video.videoHeight, url }; URL.revokeObjectURL(url); resolve(result); };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The selected file does not contain a valid video stream.")); };
    video.src = url;
  });
}

export async function uploadSiteVideo(file, sectionKey, metadata = {}) {
  validateVideoFile(file);
  const details = await readVideoMetadata(file);
  if (!Number.isFinite(details.duration) || details.duration > MAX_VIDEO_SECONDS + 0.05) throw new Error("Video duration exceeds the 15-second limit. Please upload a shorter video.");
  const path = `website-videos/${sectionKey}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
  await uploadToR2(file, path);
  const { data, error } = await supabase.from("site_videos").insert({ section_key: sectionKey, storage_path: path, original_filename: file.name, mime_type: file.type, file_size: file.size, duration_seconds: details.duration, width: details.width, height: details.height, title: metadata.title || file.name, caption: metadata.caption || "", status: "ready", is_active: true }).select().single();
  if (error) throw error;
  return data;
}

export async function fetchAdminVideos() {
  const { data, error } = await supabase.from("site_videos").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export function siteVideoUrl(storagePath) {
  if (!storagePath) return null;
  if (import.meta.env.VITE_R2_PUBLIC_BASE_URL) return cloudflareMediaUrl(storagePath);
  const { data } = supabase.storage.from(SITE_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl || null;
}
