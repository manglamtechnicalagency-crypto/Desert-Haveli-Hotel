import crypto from "node:crypto";
import { requireAdmin } from "../_lib/r2.mjs";

function sign(params, secret) {
  const payload = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  try {
    await requireAdmin(req);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary server configuration is incomplete.");

    const { publicId, folder, resourceType = "auto" } = req.body || {};
    if (!/^[a-zA-Z0-9._/-]{1,240}$/.test(publicId || "") || !/^[a-zA-Z0-9_/-]{1,120}$/.test(folder || "")) {
      throw new Error("Invalid Cloudinary media path.");
    }
    if (!["image", "video", "auto"].includes(resourceType)) throw new Error("Invalid Cloudinary resource type.");
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { folder, public_id: publicId, timestamp };
    return res.status(200).json({
      success: true,
      cloudName,
      apiKey,
      timestamp,
      signature: sign(params, apiSecret),
      folder,
      publicId,
      resourceType,
    });
  } catch (error) {
    return res.status(error.message === "Unauthorised" ? 401 : error.message === "Forbidden" ? 403 : 400)
      .json({ success: false, message: error.message });
  }
}
