import crypto from "node:crypto";
import { requireAdmin } from "../_lib/r2.mjs";
import { assertRequestBody, checkRateLimit, rateLimitResponse, requestId, safeErrorResponse } from "../_lib/security.mjs";

function sign(publicId, timestamp, secret) {
  return crypto.createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${secret}`).digest("hex");
}

export default async function handler(req, res) {
  const id = requestId(req);
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed", requestId: id } });
  try {
    const ipLimit = checkRateLimit(req, "admin");
    if (!ipLimit.allowed) return rateLimitResponse(res, id, ipLimit.retryAfter);
    const { user } = await requireAdmin(req);
    const accountLimit = checkRateLimit(req, "admin", user.id);
    if (!accountLimit.allowed) return rateLimitResponse(res, id, accountLimit.retryAfter);
    const { cloudName, apiKey, apiSecret } = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    };
    const { publicId, resourceType = "image" } = assertRequestBody(req.body, ["publicId", "resourceType"]);
    if (!cloudName || !apiKey || !apiSecret) { const error = new Error("Media provider unavailable"); error.statusCode = 503; throw error; }
    if (!/^[a-zA-Z0-9._/-]{1,240}$/.test(publicId || "") || publicId.includes("..") || publicId.startsWith("/") || !["image", "video"].includes(resourceType)) { const error = new Error("Invalid Cloudinary media path."); error.statusCode = 422; throw error; }
    const timestamp = Math.floor(Date.now() / 1000);
    const body = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: apiKey, signature: sign(publicId, timestamp, apiSecret) });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
    const result = await response.json();
    if (!response.ok || !["ok", "not found"].includes(result.result)) { const error = new Error("Media provider request failed"); error.statusCode = 502; throw error; }
    return res.status(200).json({ success: true });
  } catch (error) {
    return safeErrorResponse(res, error, id);
  }
}
