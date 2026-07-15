import crypto from "node:crypto";
import { requireAdmin } from "../_lib/r2.mjs";

function sign(publicId, timestamp, secret) {
  return crypto.createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${secret}`).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  try {
    await requireAdmin(req);
    const { cloudName, apiKey, apiSecret } = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    };
    const { publicId, resourceType = "image" } = req.body || {};
    if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary server configuration is incomplete.");
    if (!/^[a-zA-Z0-9._/-]{1,240}$/.test(publicId || "") || !["image", "video"].includes(resourceType)) throw new Error("Invalid Cloudinary media path.");
    const timestamp = Math.floor(Date.now() / 1000);
    const body = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: apiKey, signature: sign(publicId, timestamp, apiSecret) });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
    const result = await response.json();
    if (!response.ok || !["ok", "not found"].includes(result.result)) throw new Error(result.error?.message || "Cloudinary delete failed.");
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(error.message === "Unauthorised" ? 401 : error.message === "Forbidden" ? 403 : 400)
      .json({ success: false, message: error.message });
  }
}
