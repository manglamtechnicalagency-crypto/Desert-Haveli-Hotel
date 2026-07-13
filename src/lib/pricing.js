// Single authoritative price-calculation service.
// Priority order (highest first):
//   1. Exact date-specific override (room_price_overrides)
//   2. Date-range / weekend / weekday / seasonal rule (room_pricing_rules), by `priority` desc
//   3. Promotional price on the room
//   4. Weekend price on the room (Fri/Sat night, matching common hospitality convention)
//   5. Base price
//
// A "night" is identified by its check-in date (the date the guest occupies the
// room). The check-out date itself is never billed as an occupied night.

function toISODate(date) {
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function isWeekendNight(isoDate) {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay(); // 0 Sun ... 6 Sat
  // Friday (5) and Saturday (6) nights are treated as "weekend" nights.
  return day === 5 || day === 6;
}

function applyAdjustment(basePrice, adjustmentType, adjustmentValue) {
  if (adjustmentValue == null) return basePrice;
  if (adjustmentType === "percentage") {
    return Math.max(0, basePrice + (basePrice * adjustmentValue) / 100);
  }
  // "fixed" adjustment is an absolute delta applied to the base price.
  return Math.max(0, basePrice + adjustmentValue);
}

function ruleMatchesDate(rule, isoDate) {
  if (!rule.is_active) return false;
  if (rule.start_date && isoDate < rule.start_date) return false;
  if (rule.end_date && isoDate > rule.end_date) return false;
  if (rule.rule_type === "weekend" && !isWeekendNight(isoDate)) return false;
  if (rule.rule_type === "weekday" && isWeekendNight(isoDate)) return false;
  if (Array.isArray(rule.days_of_week) && rule.days_of_week.length > 0) {
    const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
    if (!rule.days_of_week.includes(day)) return false;
  }
  return true;
}

/**
 * Compute the effective nightly price + a breakdown of why, for one specific night.
 * @param {object} room - a row from `rooms`
 * @param {object[]} overrides - rows from `room_price_overrides` for this room
 * @param {object[]} rules - rows from `room_pricing_rules` for this room
 * @param {string|Date} date - the night being priced (check-in date of that night)
 */
export function getNightlyPrice(room, overrides, rules, date) {
  const isoDate = toISODate(date);

  const override = (overrides || []).find((o) => o.date === isoDate);
  if (override && override.price != null) {
    let price = Number(override.price);
    if (override.discount_type === "fixed") price = Math.max(0, price - Number(override.discount_value || 0));
    if (override.discount_type === "percentage") {
      price = Math.max(0, price - (price * Number(override.discount_value || 0)) / 100);
    }
    return {
      price,
      source: "date_override",
      label: override.pricing_label || "Custom price",
      minimumStay: override.minimum_stay || 1,
    };
  }

  const matchingRules = (rules || [])
    .filter((r) => ruleMatchesDate(r, isoDate))
    .sort((a, b) => {
      const byPriority = (b.priority || 0) - (a.priority || 0);
      if (byPriority !== 0) return byPriority;
      // Deterministic tiebreak (QA-DEFECT-006): if two rules share the same
      // priority, the one with the lower `id` wins, consistently, regardless
      // of the order rows arrived in from the query. This is defense in
      // depth -- the query level should already order by id ascending as a
      // secondary sort, but this function must not depend on that alone.
      const aId = a.id != null ? String(a.id) : "";
      const bId = b.id != null ? String(b.id) : "";
      return aId.localeCompare(bId);
    });

  if (matchingRules.length > 0) {
    const rule = matchingRules[0];
    const price =
      rule.fixed_price != null
        ? Number(rule.fixed_price)
        : applyAdjustment(Number(room.base_price || 0), rule.adjustment_type, rule.adjustment_value);
    return { price, source: "pricing_rule", label: rule.rule_name, minimumStay: 1 };
  }

  // Promotional price now supports an optional expiry window (ISSUE-026 /
  // QA-DEFECT-007). Null bounds mean "no bound on that side", so any room
  // that has a promotional_price set but no dates yet keeps its previous
  // always-on behaviour (backward compatible).
  const promoStarted = !room.promotional_price_start_date || isoDate >= room.promotional_price_start_date;
  const promoNotEnded = !room.promotional_price_end_date || isoDate <= room.promotional_price_end_date;
  if (room.promotional_price != null && promoStarted && promoNotEnded) {
    return { price: Number(room.promotional_price), source: "promotional", label: "Promotional price", minimumStay: 1 };
  }

  if (isWeekendNight(isoDate) && room.weekend_price != null) {
    return { price: Number(room.weekend_price), source: "weekend", label: "Weekend price", minimumStay: 1 };
  }

  return { price: room.base_price != null ? Number(room.base_price) : null, source: "base", label: "Base price", minimumStay: 1 };
}

/**
 * Compute a full stay breakdown for [checkIn, checkOut) — one entry per night,
 * check-out date itself is excluded. Applies tax/service charge consistently.
 */
export function getStayBreakdown(room, overrides, rules, checkIn, checkOut) {
  const nights = [];
  let cursor = new Date(`${toISODate(checkIn)}T00:00:00Z`);
  const end = new Date(`${toISODate(checkOut)}T00:00:00Z`);

  while (cursor < end) {
    const iso = toISODate(cursor);
    nights.push({ date: iso, ...getNightlyPrice(room, overrides, rules, iso) });
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  const subtotal = nights.reduce((sum, n) => sum + (n.price || 0), 0);
  const taxPct = Number(room.tax_percentage || 0);
  const serviceCharge = Number(room.service_charge || 0);
  const tax = (subtotal * taxPct) / 100;
  const total = subtotal + tax + serviceCharge;

  return { nights, subtotal, tax, serviceCharge, total, nightCount: nights.length };
}

/** Effective "today" price shown on room cards (single-night view, no tax breakdown). */
export function getTodayPrice(room, overrides, rules) {
  return getNightlyPrice(room, overrides, rules, new Date());
}

export function formatCurrency(amount, currency = "INR") {
  if (amount == null) return "Enquire for price";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}
