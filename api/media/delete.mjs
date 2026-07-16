import { removeObject, requireAdmin } from "../_lib/r2.mjs";
import { assertRequestBody, assertStorageKey, checkRateLimit, rateLimitResponse, requestId, safeErrorResponse } from "../_lib/security.mjs";

export default async function handler(req, res) {
  const id = requestId(req);
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed", requestId: id } });
  try {
    const ipLimit = checkRateLimit(req, "admin");
    if (!ipLimit.allowed) return rateLimitResponse(res, id, ipLimit.retryAfter);
    const { user } = await requireAdmin(req);
    const accountLimit = checkRateLimit(req, "admin", user.id);
    if (!accountLimit.allowed) return rateLimitResponse(res, id, accountLimit.retryAfter);
    const { key } = assertRequestBody(req.body, ["key"]);
    assertStorageKey(key);
    await removeObject(key);
    return res.status(200).json({ success: true });
  } catch (error) {
    return safeErrorResponse(res, error, id);
  }
}
