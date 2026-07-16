import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { createAvailabilityBlock, deleteAvailabilityBlock } from "../lib/roomsApi";

const EMPTY_BLOCK = {
  status: "manual_block",
  start_date: "",
  end_date: "",
  reason: "",
  internal_note: "",
  public_message: "",
  prevent_booking: true,
  hide_from_website: false,
};

export default function RoomAvailabilityPanel({ roomId, profile }) {
  const [blocks, setBlocks] = useState([]);
  const [form, setForm] = useState(EMPTY_BLOCK);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await supabase.from("room_availability").select("*").eq("room_id", roomId).order("start_date");
    setBlocks(data || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.start_date) return setError("Start date is required.");
    if (!form.end_date) return setError("End date is required.");
    if (form.end_date < form.start_date) return setError("End date cannot be before start date.");
    try {
      await createAvailabilityBlock({ room_id: roomId, ...form }, profile);
      setForm(EMPTY_BLOCK);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="admin-section">
      <h2>Availability blocks</h2>
      <p className="admin-hint">
        A blocked room cannot be booked while the block is active. Once the end date passes, the room automatically
        returns to normal status unless another block applies.
      </p>
      <form className="admin-inline-form" onSubmit={submit}>
        <label>
          Status
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="unavailable">Unavailable</option>
            <option value="under_maintenance">Under maintenance</option>
            <option value="fully_booked">Fully booked</option>
            <option value="temporarily_closed">Temporarily closed</option>
            <option value="manual_block">Manual block</option>
          </select>
        </label>
        <label>
          Start date *
          <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} required />
        </label>
        <label>
          End date *
          <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} required />
        </label>
        <label>
          Reason
          <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
        </label>
        <label>
          Public message
          <input value={form.public_message} onChange={(e) => setForm((f) => ({ ...f, public_message: e.target.value }))} />
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={form.prevent_booking}
            onChange={(e) => setForm((f) => ({ ...f, prevent_booking: e.target.checked }))}
          />
          Prevent booking
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={form.hide_from_website}
            onChange={(e) => setForm((f) => ({ ...f, hide_from_website: e.target.checked }))}
          />
          Hide from website
        </label>
        <button className="btn secondary" type="submit">
          Add block
        </button>
      </form>

      {error && <p className="admin-form-error">{error}</p>}

      {blocks.length === 0 ? (
        <p className="admin-empty">No availability blocks.</p>
      ) : (
        <ul className="admin-simple-list">
          {blocks.map((b) => (
            <li key={b.id}>
              <span>
                <span className="admin-status-pill" data-status={b.status}>
                  {(b.status || "unknown").replace(/_/g, " ")}
                </span>{" "}
                {b.start_date} → {b.end_date} {b.end_date < today ? "(past)" : ""} {b.reason ? `— ${b.reason}` : ""}
              </span>
              <button
                className="btn small danger"
                onClick={async () => {
                  await deleteAvailabilityBlock(b.id);
                  load();
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
