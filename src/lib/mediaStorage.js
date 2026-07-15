import { supabase } from "./supabaseClient";
import { cloudflareMediaUrl, deleteFromR2, uploadToR2 } from "./cloudflareStorage";

export function isCloudinaryPath(path) { return typeof path === "string" && path.startsWith("cloudinary://"); }

function parsePath(path) {
  const [, resourceType, publicId] = String(path || "").match(/^cloudinary:\/\/(image|video)\/(.+)$/) || [];
  return resourceType && publicId ? { resourceType, publicId } : null;
}

export function mediaUrl(path) {
  if (!path) return null;
  const parsed = parsePath(path);
  if (!parsed) return cloudflareMediaUrl(path) || supabase.storage.from("site-images").getPublicUrl(path).data?.publicUrl || null;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return null;
  return `https://res.cloudinary.com/${cloudName}/${parsed.resourceType}/upload/f_auto,q_auto/${parsed.publicId}`;
}

export async function uploadMedia(file, key, { resourceType = "auto" } = {}) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return uploadToR2(file, key);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your admin session has expired. Please sign in again.");
  const cleanKey = key.replace(/^\/+|\/+$/g, "");
  const publicId = cleanKey.replace(/\.[^.]+$/, "");
  const folder = publicId.split("/").slice(0, -1).join("/") || "desert-haveli";
  const leafId = publicId.split("/").pop();
  const signed = await fetch("/api/media/cloudinary-sign", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ publicId: leafId, folder, resourceType }) });
  const signature = await signed.json();
  if (!signed.ok) throw new Error(signature.message || "Could not prepare Cloudinary upload.");
  const form = new FormData();
  form.append("file", file); form.append("api_key", signature.apiKey); form.append("timestamp", signature.timestamp); form.append("signature", signature.signature); form.append("folder", signature.folder); form.append("public_id", signature.publicId);
  const upload = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType === "auto" ? "auto" : resourceType}/upload`, { method: "POST", body: form });
  const result = await upload.json();
  if (!upload.ok || !result.public_id) throw new Error(result.error?.message || "Cloudinary upload failed.");
  return `cloudinary://${result.resource_type}/${result.public_id}`;
}

export async function deleteMedia(path) {
  const parsed = parsePath(path);
  if (!parsed) return deleteFromR2(path);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your admin session has expired. Please sign in again.");
  const response = await fetch("/api/media/cloudinary-delete", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(parsed) });
  if (!response.ok) throw new Error("Could not delete the Cloudinary media file.");
}
