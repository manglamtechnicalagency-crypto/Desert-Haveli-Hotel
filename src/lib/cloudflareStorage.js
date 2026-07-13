import { supabase } from "./supabaseClient";

export async function uploadToR2(file, key) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your admin session has expired. Please sign in again.");
  const response = await fetch("/api/media/presign", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ key, contentType: file.type, size: file.size })
  });
  const result = await response.json();
  if (!response.ok || !result.url) throw new Error(result.message || "Could not prepare Cloudflare upload.");
  const upload = await fetch(result.url, { method: "PUT", headers: { "content-type": file.type }, body: file });
  if (!upload.ok) throw new Error("Cloudflare R2 upload failed.");
  return key;
}

export async function deleteFromR2(key) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your admin session has expired. Please sign in again.");
  const response = await fetch("/api/media/delete", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ key }) });
  if (!response.ok) throw new Error("Could not delete the Cloudflare media file.");
}

export function cloudflareMediaUrl(key) {
  if (!key) return null;
  const base = import.meta.env.VITE_R2_PUBLIC_BASE_URL;
  return base ? `${base.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}` : null;
}
