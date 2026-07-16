import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { signInAdmin, checkLoginLockout, recordLoginAttempt, requestPinReset, verifyPinReset } from "../lib/roomsApi";
import { useAdminAuth } from "./AdminAuthContext";
import { supabase } from "../lib/supabaseClient";

const PIN_LENGTH = 6;
const ADMIN_LOGIN_EMAIL = import.meta.env.VITE_ADMIN_LOGIN_EMAIL;

export default function AdminLoginPage() {
  const { status, refreshProfile } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [digits, setDigits] = useState(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // These two are now a thin UI mirror of the server-authoritative lockout
  // state returned by the check_login_lockout / record_login_attempt RPCs
  // (SECURITY DEFINER functions backed by the admin_login_attempts table).
  // They are NOT the source of truth -- a page reload re-fetches the real
  // state from the database instead of resetting to "not locked".
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState("email");
  const [recoveryOtp, setRecoveryOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const inputsRef = useRef([]);
  const restorePinFocusRef = useRef(false);

  const locked = lockedUntil && Date.now() < lockedUntil;

  // On mount (including after a full page reload), ask the server what the
  // real lockout state is instead of trusting fresh-initialized local state.
  useEffect(() => {
    if (!ADMIN_LOGIN_EMAIL) return;
    checkLoginLockout(ADMIN_LOGIN_EMAIL)
      .then((state) => {
        if (state.is_locked) {
          setLockedUntil(new Date(state.locked_until).getTime());
          setError(`Too many incorrect attempts. Try again shortly.`);
        }
        setAttempts(state.failed_count || 0);
      })
      .catch(() => {
        // If the lockout check itself fails, fail closed on the UI side by
        // leaving the form usable -- the server-side RPC is still the real
        // gate on the next submit via recordLoginAttempt's response.
      });
  }, []);

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => {
      if (Date.now() >= lockedUntil) setLockedUntil(null);
    }, 500);
    return () => clearInterval(t);
  }, [locked, lockedUntil]);

  // Invalid submissions clear all fields while they are still disabled by
  // `loading`. Defer focus restoration until the subsequent enabled render;
  // focusing earlier is ignored by the browser and leaves focus on <body>.
  useEffect(() => {
    if (!loading && restorePinFocusRef.current) {
      restorePinFocusRef.current = false;
      inputsRef.current[0]?.focus();
    }
  }, [loading]);

  if (status === "signed-in") {
    const from = location.state?.from?.pathname || "/admin";
    return <Navigate to={from} replace />;
  }

  if (!ADMIN_LOGIN_EMAIL) {
    return (
      <div className="admin-auth-screen">
        <div className="admin-auth-card">
          <h1>Admin login not configured</h1>
          <p>VITE_ADMIN_LOGIN_EMAIL is missing from the environment. Add it and redeploy.</p>
        </div>
      </div>
    );
  }

  function updateDigit(index, value) {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < PIN_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    if (clean && index === PIN_LENGTH - 1 && next.every((d) => d !== "")) {
      submitPin(next.join(""));
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = Array(PIN_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
    setDigits(next);
    const lastFilled = Math.min(pasted.length, PIN_LENGTH) - 1;
    inputsRef.current[lastFilled]?.focus();
    if (pasted.length === PIN_LENGTH) submitPin(pasted);
  }

  async function submitPin(pin) {
    if (loading || locked) return;
    setError("");
    setLoading(true);
    let postAttemptState = null;
    try {
      // Authoritative, server-side check first -- this survives a page
      // reload because it reads from the admin_login_attempts table via a
      // SECURITY DEFINER RPC, not from component state.
      const preCheck = await checkLoginLockout(ADMIN_LOGIN_EMAIL);
      if (preCheck.is_locked) {
        setLockedUntil(new Date(preCheck.locked_until).getTime());
        setError("Too many incorrect attempts. Try again shortly.");
        return;
      }

      let success = false;
      try {
        await signInAdmin(ADMIN_LOGIN_EMAIL, pin);
        success = true;
      } finally {
        postAttemptState = await recordLoginAttempt(ADMIN_LOGIN_EMAIL, success).catch(() => null);
        if (postAttemptState) {
          setAttempts(postAttemptState.failed_count || 0);
          setLockedUntil(postAttemptState.is_locked ? new Date(postAttemptState.locked_until).getTime() : null);
          if ((postAttemptState.failed_count || 0) >= 3 || postAttemptState.is_locked) setRecoveryOpen(true);
        }
      }

      if (!success) throw new Error("Incorrect PIN.");

      await refreshProfile();
      navigate("/admin", { replace: true });
    } catch (err) {
      setDigits(Array(PIN_LENGTH).fill(""));
      restorePinFocusRef.current = true;
      if (postAttemptState?.is_locked) {
        setError("Too many incorrect attempts. Try again shortly.");
      } else {
        setError("Incorrect PIN.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendRecoveryOtp(event) {
    event.preventDefault();
    setRecoveryLoading(true);
    setRecoveryError("");
    setRecoveryMessage("");
    try {
      await requestPinReset(ADMIN_LOGIN_EMAIL);
      setRecoveryStep("otp");
      setRecoveryMessage("OTP sent. Check the administrator email address.");
    } catch (err) {
      setRecoveryError(err.message);
    } finally {
      setRecoveryLoading(false);
    }
  }

  async function verifyRecoveryOtp(event) {
    event.preventDefault();
    if (!/^\d{6}$/.test(recoveryOtp)) return setRecoveryError("Enter six-digit recovery code.");
    if (!/^\d{6}$/.test(newPin) || newPin !== confirmPin) return setRecoveryError("Enter matching six-digit PINs.");
    setRecoveryLoading(true);
    setRecoveryError("");
    try {
      await verifyPinReset(ADMIN_LOGIN_EMAIL, recoveryOtp);
      const { error: updateError } = await supabase.auth.updateUser({ password: newPin });
      if (updateError) throw updateError;
      await refreshProfile();
      navigate("/admin", { replace: true });
    } catch (err) {
      setRecoveryError(err.message || "Unable to reset PIN.");
    } finally {
      setRecoveryLoading(false);
    }
  }

  return (
    <div className="admin-auth-screen">
      <div className="admin-auth-shell">
        <aside className="admin-auth-intro">
          <span className="admin-auth-kicker">Desert Haveli Guest House</span>
          <h2>Manage your heritage stay, beautifully.</h2>
          <p>Keep rooms, pricing, availability, and guest-facing details accurate from one private workspace.</p>
          <div className="admin-auth-features" aria-hidden="true">
            <span>Room inventory</span>
            <span>Live pricing</span>
            <span>Availability</span>
          </div>
        </aside>
        <div className="admin-auth-card">
          <div className="admin-auth-brand">
            <span className="brand-mark">DH</span>
            <span><strong>Desert Haveli</strong><small>Private administration</small></span>
          </div>
          <span className="admin-auth-eyebrow">Secure access</span>
          <h1>Welcome back</h1>
          <p>Enter your six-digit PIN to open the management dashboard.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitPin(digits.join(""));
          }}
        >
          <label htmlFor="pin-0">6-digit access PIN</label>
          <div className="admin-pin-row" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                id={`pin-${index}`}
                ref={(el) => (inputsRef.current[index] = el)}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete="off"
                value={digit}
                disabled={loading || locked}
                onChange={(e) => updateDigit(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                aria-label={`PIN digit ${index + 1}`}
              />
            ))}
          </div>
          {error && (
            <p className="admin-form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn primary" type="submit" disabled={loading || locked || digits.some((d) => !d)}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <small className="admin-auth-help">For authorised hotel staff only. Contact the administrator if you need access.</small>
        </form>
        {recoveryOpen && (
          <div className="admin-recovery-modal" role="dialog" aria-modal="true" aria-labelledby="recovery-title">
            <div className="admin-recovery-card">
              <button className="admin-recovery-close" type="button" onClick={() => setRecoveryOpen(false)} aria-label="Close PIN recovery">×</button>
              <span className="admin-auth-eyebrow">PIN recovery</span>
              <h2 id="recovery-title">Reset your access PIN</h2>
              {recoveryStep === "email" ? (
                <form onSubmit={sendRecoveryOtp}>
                  <p>After three incorrect trials, verify the administrator email to receive a six-digit recovery code.</p>
                  <span className="admin-recovery-locked-email"><strong>Administrator email</strong><span>{ADMIN_LOGIN_EMAIL}</span><small>Recovery is restricted to this configured address.</small></span>
                  <button className="btn primary" type="submit" disabled={recoveryLoading}>{recoveryLoading ? "Sending…" : "Send OTP"}</button>
                </form>
              ) : (
                <form onSubmit={verifyRecoveryOtp}>
                  <p>{recoveryMessage || "Enter the six-digit recovery code sent to your email, then choose a new six-digit PIN."}</p>
                  <label htmlFor="recovery-otp">Six-digit recovery code</label>
                  <input id="recovery-otp" inputMode="numeric" maxLength={6} value={recoveryOtp} onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
                  <label htmlFor="new-pin">New six-digit PIN</label>
                  <input id="new-pin" type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
                  <label htmlFor="confirm-pin">Confirm new PIN</label>
                  <input id="confirm-pin" type="password" inputMode="numeric" maxLength={6} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
                  <button className="btn primary" type="submit" disabled={recoveryLoading}>{recoveryLoading ? "Resetting…" : "Reset PIN and open panel"}</button>
                  <button className="admin-link-button" type="button" onClick={() => { setRecoveryStep("email"); setRecoveryMessage(""); setRecoveryError(""); }}>Send a new OTP</button>
                </form>
              )}
              {recoveryError && <p className="admin-form-error" role="alert">{recoveryError}</p>}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
