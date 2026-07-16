import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { deletePriceOverride, deletePricingRule, upsertPriceOverride, upsertPricingRule } from "../lib/roomsApi";
import { formatCurrency, getNightlyPrice } from "../lib/pricing";

const EMPTY_OVERRIDE = { date: "", price: "", discount_type: "none", discount_value: "0", minimum_stay: "1", pricing_label: "" };
const EMPTY_RULE = {
  rule_name: "",
  rule_type: "weekend",
  start_date: "",
  end_date: "",
  fixed_price: "",
  adjustment_type: "percentage",
  adjustment_value: "",
  priority: "0",
};

export default function RoomPricingPanel({ roomId, room }) {
  const [overrides, setOverrides] = useState([]);
  const [rules, setRules] = useState([]);
  const [overrideForm, setOverrideForm] = useState(EMPTY_OVERRIDE);
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE);
  const [error, setError] = useState("");
  const [previewDate, setPreviewDate] = useState(new Date().toISOString().slice(0, 10));

  async function load() {
    const [{ data: o }, { data: r }] = await Promise.all([
      supabase.from("room_price_overrides").select("*").eq("room_id", roomId).order("date"),
      supabase
        .from("room_pricing_rules")
        .select("*")
        .eq("room_id", roomId)
        .order("priority", { ascending: false })
        .order("id", { ascending: true }),
    ]);
    setOverrides(o || []);
    setRules(r || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function submitOverride(e) {
    e.preventDefault();
    setError("");
    try {
      if (!overrideForm.date) throw new Error("Date is required.");
      if (overrideForm.price !== "" && Number(overrideForm.price) < 0) throw new Error("Price cannot be negative.");
      await upsertPriceOverride({
        room_id: roomId,
        date: overrideForm.date,
        price: overrideForm.price === "" ? null : Number(overrideForm.price),
        discount_type: overrideForm.discount_type,
        discount_value: Number(overrideForm.discount_value || 0),
        minimum_stay: Number(overrideForm.minimum_stay || 1),
        pricing_label: overrideForm.pricing_label || null,
      });
      setOverrideForm(EMPTY_OVERRIDE);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitRule(e) {
    e.preventDefault();
    setError("");
    try {
      if (!ruleForm.rule_name.trim()) throw new Error("Rule name is required.");
      await upsertPricingRule({
        room_id: roomId,
        rule_name: ruleForm.rule_name.trim(),
        rule_type: ruleForm.rule_type,
        start_date: ruleForm.start_date || null,
        end_date: ruleForm.end_date || null,
        fixed_price: ruleForm.fixed_price === "" ? null : Number(ruleForm.fixed_price),
        adjustment_type: ruleForm.fixed_price === "" ? ruleForm.adjustment_type : null,
        adjustment_value: ruleForm.fixed_price === "" ? Number(ruleForm.adjustment_value || 0) : null,
        priority: Number(ruleForm.priority || 0),
        is_active: true,
      });
      setRuleForm(EMPTY_RULE);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const preview = getNightlyPrice(room, overrides, rules, previewDate);

  return (
    <section className="admin-section">
      <h2>Date-specific pricing (highest priority)</h2>
      <form className="admin-inline-form" onSubmit={submitOverride}>
        <label>
          Date
          <input type="date" value={overrideForm.date} onChange={(e) => setOverrideForm((f) => ({ ...f, date: e.target.value }))} required />
        </label>
        <label>
          Price
          <input type="number" min="0" value={overrideForm.price} onChange={(e) => setOverrideForm((f) => ({ ...f, price: e.target.value }))} />
        </label>
        <label>
          Label
          <input
            value={overrideForm.pricing_label}
            onChange={(e) => setOverrideForm((f) => ({ ...f, pricing_label: e.target.value }))}
            placeholder="e.g. Diwali special"
          />
        </label>
        <label>
          Min. stay
          <input
            type="number"
            min="1"
            value={overrideForm.minimum_stay}
            onChange={(e) => setOverrideForm((f) => ({ ...f, minimum_stay: e.target.value }))}
          />
        </label>
        <button className="btn secondary" type="submit">
          Set date price
        </button>
      </form>
      {overrides.length > 0 && (
        <ul className="admin-simple-list">
          {overrides.map((o) => (
            <li key={o.id}>
              <span>
                {o.date} — {o.price != null ? formatCurrency(o.price, room.currency) : "cleared"} {o.pricing_label ? `(${o.pricing_label})` : ""}
              </span>
              <button
                className="btn small danger"
                onClick={async () => {
                  await deletePriceOverride(o.id);
                  load();
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Date-range / weekend / seasonal rules</h2>
      <form className="admin-inline-form" onSubmit={submitRule}>
        <label>
          Rule name
          <input value={ruleForm.rule_name} onChange={(e) => setRuleForm((f) => ({ ...f, rule_name: e.target.value }))} required />
        </label>
        <label>
          Type
          <select value={ruleForm.rule_type} onChange={(e) => setRuleForm((f) => ({ ...f, rule_type: e.target.value }))}>
            <option value="weekend">Weekend</option>
            <option value="weekday">Weekday</option>
            <option value="seasonal">Seasonal</option>
            <option value="festival">Festival</option>
            <option value="promotional">Promotional</option>
          </select>
        </label>
        <label>
          Start date
          <input type="date" value={ruleForm.start_date} onChange={(e) => setRuleForm((f) => ({ ...f, start_date: e.target.value }))} />
        </label>
        <label>
          End date
          <input type="date" value={ruleForm.end_date} onChange={(e) => setRuleForm((f) => ({ ...f, end_date: e.target.value }))} />
        </label>
        <label>
          Fixed price
          <input type="number" min="0" value={ruleForm.fixed_price} onChange={(e) => setRuleForm((f) => ({ ...f, fixed_price: e.target.value }))} />
        </label>
        <label>
          Or % adjustment
          <input
            type="number"
            value={ruleForm.adjustment_value}
            onChange={(e) => setRuleForm((f) => ({ ...f, adjustment_value: e.target.value }))}
            disabled={ruleForm.fixed_price !== ""}
          />
        </label>
        <label>
          Priority
          <input type="number" value={ruleForm.priority} onChange={(e) => setRuleForm((f) => ({ ...f, priority: e.target.value }))} />
        </label>
        <button className="btn secondary" type="submit">
          Add rule
        </button>
      </form>
      {rules.length > 0 && (
        <ul className="admin-simple-list">
          {rules.map((r) => (
            <li key={r.id}>
              <span>
                {r.rule_name} ({r.rule_type}) {r.start_date || "…"} → {r.end_date || "…"} · priority {r.priority}
              </span>
              <button
                className="btn small danger"
                onClick={async () => {
                  await deletePricingRule(r.id);
                  load();
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="admin-form-error">{error}</p>}

      <div className="admin-price-preview">
        <label>
          Preview price for date
          <input type="date" value={previewDate} onChange={(e) => setPreviewDate(e.target.value)} />
        </label>
        <p>
          Effective price: <strong>{preview.price != null ? formatCurrency(preview.price, room.currency) : "Enquire for price"}</strong>{" "}
          <span className="admin-status-pill" data-status={preview.source}>
            {preview.label}
          </span>
        </p>
      </div>
    </section>
  );
}
