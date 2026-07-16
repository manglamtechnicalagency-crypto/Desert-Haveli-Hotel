import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function boundedEnvNumber(name, fallback, min, max) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

export const OTP_TTL_SECONDS = boundedEnvNumber("ADMIN_PIN_RECOVERY_OTP_TTL_SECONDS", 10 * 60, 60, 60 * 60);
export const MAX_OTP_ATTEMPTS = boundedEnvNumber("ADMIN_PIN_RECOVERY_MAX_OTP_ATTEMPTS", 5, 1, 10);

export function recoveryConfig() {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "RESEND_FROM_EMAIL"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error("PIN recovery is not configured");
    error.statusCode = 503;
    throw error;
  }
  return {
    email: (process.env.ADMIN_LOGIN_EMAIL || "").trim().toLowerCase(),
    supabase: createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } }),
  };
}

export function normaliseEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function randomOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

export async function sendOtpEmail(to, otp) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject: "Your Desert Haveli admin PIN recovery code",
      text: `Your three-digit admin recovery OTP is ${otp}. It expires in ${OTP_TTL_SECONDS / 60} minutes. If you did not request this, you can ignore this email.`,
    }),
  });
  if (!response.ok) {
    const error = new Error("Unable to send recovery email");
    error.statusCode = 502;
    throw error;
  }
}
