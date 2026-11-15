// Price breakup rows of one B2B rate (rates[].working from the backend's B2B/utils/b2bRateEngine.js
// calculateB2BCargoRate — the same numbers the booking charges). Same rows as QuickPost's
// src/utils/b2bPriceBreakup.ts, every charge line even when ₹0.
const money = (v) => `₹${Number(v || 0).toFixed(2)}`;

export const b2bBreakupRows = (w = {}) => [
  ["Zone", w.zone || "—"],
  ["Chargeable Weight", `${w.billable_weight || 0} kg`],
  ["Freight / Kg", money(w.rate ?? 0)],
  ["Freight Charges", money(w.freight)],
  ["Docket (LR) Charges", money(w.docket_charges)],
  ["Pickup (FM) Charges", money(w.pickup_charge)],
  ["Handling Charges", money(w.handling_charge)],
  ["Package Handling", money(w.package_handling)],
  ["Appointment Charges", money(w.appointment_charge)],
  ["COD Charges", money(w.cod_charges)],
  [w.rov_type ? `ROV (${w.rov_type} Risk)` : "ROV", money(w.rov)],
  [w.fsc_percent != null ? `FSC (${w.fsc_percent}%)` : "FSC", money(w.fsc)],
  [`${w.oda_label || "ODA"}${w.oda_distance_km != null ? ` · ${w.oda_distance_km} km` : ""}`, money(w.oda)],
  ["Green Tax", money(w.green_tax)],
  ["Min. Billing Top-up", money(w.min_billing_topup)],
  ["GST", money(w.gst)],
];

// Charges billed only if that event happens — listed under the breakup, never in the total.
export const b2bIfApplicable = (w = {}) => (Array.isArray(w.if_applicable) ? w.if_applicable : []);
