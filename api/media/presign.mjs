import { presign, requireAdmin } from "../_lib/r2.mjs";
import { assertMediaRequest, assertRequestBody, checkRateLimit, rateLimitResponse, requestId, safeErrorResponse } from "../_lib/security.mjs";

export default async function handler(req, res) {
  const id = requestId(req);
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed", requestId: id } });
  try {
    const ipLimit = checkRateLimit(req, "upload");
    if (!ipLimit.allowed) return rateLimitResponse(res, id, ipLimit.retryAfter);
    const { user } = await requireAdmin(req);
    const accountLimit = checkRateLimit(req, "upload", user.id);
    if (!accountLimit.allowed) return rateLimitResponse(res, id, accountLimit.retryAfter);
    const { key, contentType, size } = assertRequestBody(req.body, ["key", "contentType", "size"]);
    const numericSize = assertMediaRequest({ key, contentType, size });
    const url = await presign(req, key, contentType, numericSize);
    return res.status(200).json({ success: true, url });
  } catch (error) {
    return safeErrorResponse(res, error, id);
  }
}
