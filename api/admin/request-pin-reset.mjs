import { hashOtp, randomOtp, recoveryConfig, sendOtpEmail, OTP_TTL_SECONDS } from "../_lib/pinRecovery.mjs";
import { assertEmail, assertRequestBody, checkRateLimit, rateLimitResponse, requestId, safeErrorResponse } from "../_lib/security.mjs";

export default async function handler(req, res) {
  const id = requestId(req);
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed", requestId: id } });
  try {
    const ipLimit = checkRateLimit(req, "auth");
    if (!ipLimit.allowed) return rateLimitResponse(res, id, ipLimit.retryAfter);
    const body = assertRequestBody(req.body, ["email"]);
    const suppliedEmail = assertEmail(body.email);
    const accountLimit = checkRateLimit(req, "auth", suppliedEmail);
    if (!accountLimit.allowed) return rateLimitResponse(res, id, accountLimit.retryAfter);
    const { email, supabase } = recoveryConfig();
    if (!email || suppliedEmail !== email) return res.status(200).json({ success: true, message: "If the address is eligible, recovery instructions will be sent." });

    await supabase.from("admin_pin_recovery_challenges").delete().eq("email", email).is("consumed_at", null);
    const otp = randomOtp();
    const { error } = await supabase.from("admin_pin_recovery_challenges").insert({ email, otp_hash: hashOtp(otp), expires_at: new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString() });
    if (error) throw error;
    await sendOtpEmail(email, otp);
    return res.status(200).json({ success: true, message: "If the address is eligible, recovery instructions will be sent." });
  } catch (error) {
    return safeErrorResponse(res, error, id);
  }
}
