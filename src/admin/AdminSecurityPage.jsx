import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminSecurityPage() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!/^\d{6}$/.test(pin)) return setError("Your PIN must contain six digits.");
    if (pin !== confirmPin) return setError("The PIN entries do not match.");
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: pin });
      if (updateError) throw updateError;
      setPin("");
      setConfirmPin("");
      setMessage("Your admin PIN has been reset successfully.");
    } catch (err) {
      setError(err.message || "Unable to reset PIN.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header"><div><span className="admin-kicker">ACCOUNT SECURITY</span><h1>Security</h1><p>Reset the six-digit PIN used to access the admin panel.</p></div></div>
      <section className="admin-section admin-security-card">
        <form className="admin-content-editor" onSubmit={submit}>
          <label htmlFor="security-new-pin">New six-digit PIN<input id="security-new-pin" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
          <label htmlFor="security-confirm-pin">Confirm new PIN<input id="security-confirm-pin" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          {message && <p className="admin-form-success" role="status">{message}</p>}
          <button className="btn primary" type="submit" disabled={loading}>{loading ? "Saving…" : "Reset PIN"}</button>
        </form>
      </section>
    </div>
  );
}
