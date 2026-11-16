// Price breakup rows of one B2B rate (rates[].working from the backend's B2B/utils/b2bRateEngine.js
// calculateB2BCargoRate — the same numbers the booking charges). Same rows as QuickPost's
// src/utils/b2bPriceBreakup.ts, every charge line even when ₹0.
const money = (v) => `₹${Number(v || 0).toFixed(2)}`;

// Core rows always show; optional charges (handling, package handling, appointment, COD, green tax, min. LR billing
// top-up) only when charged, so ₹0 lines don't look like double charges. Every charged line is listed, so the rows
// add up to the total.
export const b2bBreakupRows = (w = {}) => {
  const rows = [
    // [label, value, always shown, amount]
    ["Zone", w.zone || "—", true],
    ["Chargeable Weight", `${w.billable_weight || 0} kg`, true],
    ["Freight / Kg", money(w.rate ?? 0), true],
    ["Freight Charges", money(w.freight), true],
    [w.fsc_percent != null ? `Fuel Surcharge (FSC ${w.fsc_percent}%)` : "Fuel Surcharge (FSC)", money(w.fsc), true],
    ["Docket (LR) Charges", money(w.docket_charges), true],
    ["Pickup (FM) Charges", money(w.pickup_charge), true],
    [w.rov_type ? `ROV (${w.rov_type} Risk)` : "ROV", money(w.rov), true],
    [`${w.oda_label || "ODA"}${w.oda_distance_km != null ? ` · ${w.oda_distance_km} km` : ""}`, money(w.oda), true],
    ["Handling Charges (per shipment)", money(w.handling_charge), false, w.handling_charge],
    ["Package Handling (per box)", money(w.package_handling), false, w.package_handling],
    ["Appointment Charges", money(w.appointment_charge), false, w.appointment_charge],
    ["COD Charges", money(w.cod_charges), false, w.cod_charges],
    ["Green Tax", money(w.green_tax), false, w.green_tax],
    ["Min. LR Billing Top-up", money(w.min_billing_topup), false, w.min_billing_topup],
    ["GST", money(w.gst), true],
  ];
  return rows.filter(([, , always, amount]) => always || Number(amount || 0) !== 0).map(([l, v]) => [l, v]);
};

// Charges billed only if that event happens — listed under the breakup, never in the total.
export const b2bIfApplicable = (w = {}) => (Array.isArray(w.if_applicable) ? w.if_applicable : []);
