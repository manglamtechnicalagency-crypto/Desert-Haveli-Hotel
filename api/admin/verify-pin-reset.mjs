import { hashOtp, MAX_OTP_ATTEMPTS, recoveryConfig } from "../_lib/pinRecovery.mjs";
import { assertEmail, assertRequestBody, checkRateLimit, rateLimitResponse, requestId, safeErrorResponse } from "../_lib/security.mjs";

function invalidRecoveryRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

export default async function handler(req, res) {
  const id = requestId(req);
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed", requestId: id } });
  try {
    const ipLimit = checkRateLimit(req, "auth");
    if (!ipLimit.allowed) return rateLimitResponse(res, id, ipLimit.retryAfter);
    const body = assertRequestBody(req.body, ["email", "otp"]);
    const suppliedEmail = assertEmail(body.email);
    const accountLimit = checkRateLimit(req, "auth", suppliedEmail);
    if (!accountLimit.allowed) return rateLimitResponse(res, id, accountLimit.retryAfter);
    const { email, supabase } = recoveryConfig();
    const otp = String(body.otp || "").replace(/\D/g, "");
    if (suppliedEmail !== email || !/^\d{6}$/.test(otp)) throw invalidRecoveryRequest("Invalid or expired recovery code.");

    const { data: challenge, error: readError } = await supabase.from("admin_pin_recovery_challenges").select("id, otp_hash, expires_at, attempts, consumed_at").eq("email", email).is("consumed_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (readError || !challenge || challenge.consumed_at || new Date(challenge.expires_at).getTime() < Date.now()) throw invalidRecoveryRequest("Invalid or expired OTP.");
    if (challenge.attempts >= MAX_OTP_ATTEMPTS) throw invalidRecoveryRequest("Too many incorrect OTP attempts. Request a new code.");

    if (hashOtp(otp) !== challenge.otp_hash) {
      await supabase.from("admin_pin_recovery_challenges").update({ attempts: challenge.attempts + 1 }).eq("id", challenge.id);
      throw invalidRecoveryRequest("Invalid or expired OTP.");
    }

    const { data: link, error: linkError } = await supabase.auth.admin.generateLink({ type: "recovery", email });
    if (linkError || !link?.properties?.hashed_token) throw linkError || new Error("Could not create recovery session.");
    await supabase.from("admin_pin_recovery_challenges").update({ consumed_at: new Date().toISOString() }).eq("id", challenge.id);
    return res.status(200).json({ success: true, token_hash: link.properties.hashed_token });
  } catch (error) {
    return safeErrorResponse(res, error, id);
  }
}
