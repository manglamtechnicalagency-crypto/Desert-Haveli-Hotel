import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";

const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];

function config() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error("Media provider unavailable");
    error.statusCode = 503;
    throw error;
  }
  return {
    bucket: process.env.R2_BUCKET_NAME,
    publicBaseUrl: (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, ""),
    client: new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }
    })
  };
}

export function json(data, status = 200) {
  return { status, headers: { "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify(data) };
}

export function getBearer(req) {
  const value = req.headers.authorization || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

export async function requireAdmin(req) {
  const token = getBearer(req);
  if (!token || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Unauthorised");
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) throw new Error("Unauthorised");
  const { data: profile, error } = await admin.from("admin_profiles").select("id, role, is_active").eq("id", userData.user.id).maybeSingle();
  if (error || !profile?.is_active || !["super_admin", "admin", "editor"].includes(profile.role)) throw new Error("Forbidden");
  return { admin, user: userData.user, profile };
}

export async function presign(req, key, contentType, size) {
  const { bucket, client } = config();
  if (!key || !contentType || !Number.isSafeInteger(size) || size <= 0) throw new Error("Invalid media request");
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ContentLength: size });
  return getSignedUrl(client, command, { expiresIn: 300 });
}

export async function removeObject(key) {
  const { bucket, client } = config();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function publicUrl(key) {
  const { publicBaseUrl } = config();
  if (!publicBaseUrl) throw new Error("R2_PUBLIC_BASE_URL is not configured");
  return `${publicBaseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
