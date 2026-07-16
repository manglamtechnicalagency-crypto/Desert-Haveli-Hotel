import crypto from "node:crypto";
import { requireAdmin } from "../_lib/r2.mjs";
import { assertRequestBody, checkRateLimit, rateLimitResponse, requestId, safeErrorResponse } from "../_lib/security.mjs";

function sign(params, secret) {
  const payload = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

export default async function handler(req, res) {
  const id = requestId(req);
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed", requestId: id } });
  try {
    const ipLimit = checkRateLimit(req, "upload");
    if (!ipLimit.allowed) return rateLimitResponse(res, id, ipLimit.retryAfter);
    const { user } = await requireAdmin(req);
    const accountLimit = checkRateLimit(req, "upload", user.id);
    if (!accountLimit.allowed) return rateLimitResponse(res, id, accountLimit.retryAfter);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) { const error = new Error("Media provider unavailable"); error.statusCode = 503; throw error; }

    const { publicId, folder, resourceType = "auto" } = assertRequestBody(req.body, ["publicId", "folder", "resourceType"]);
    if (!/^[a-zA-Z0-9._/-]{1,240}$/.test(publicId || "") || !/^[a-zA-Z0-9_/-]{1,120}$/.test(folder || "") || publicId.includes("..") || folder.includes("..") || publicId.startsWith("/") || folder.startsWith("/") || publicId.includes("//") || folder.includes("//") || publicId.includes("\\") || folder.includes("\\")) {
      const error = new Error("Invalid Cloudinary media path."); error.statusCode = 422; throw error;
    }
    if (!["image", "video", "auto"].includes(resourceType)) { const error = new Error("Invalid Cloudinary resource type."); error.statusCode = 422; throw error; }
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
    return safeErrorResponse(res, error, id);
  }
}
