import { useEffect, useRef } from "react";
import { FiInfo } from "react-icons/fi";

/* Overhead charges of a B2B rate card — same sections, rows and rules as QuickPost's Cargo rate card
   (src/pages/cargo/CargoRateCard.tsx). The backend engine (B2B/utils/b2bRateEngine.js) reads these keys.

   Row kinds:
   any    — pick % of freight / ₹ per kg / flat ₹, plus a minimum ₹ (the higher of the two is charged)
   pctMin — % (of the base named in the description) plus a minimum ₹
   pct / flat / kg / count / plain — one number */
const TYPE_OPTIONS = [
  { value: "percentage", label: "% of freight", unit: "%" },
  { value: "perKg", label: "₹ per kg", unit: "₹/kg" },
  { value: "flat", label: "Flat ₹", unit: "₹" },
];
// Package handling by box weight: from kg (included) – to kg (not included; blank = no upper limit), charged per
// box as max(box kg × perKg, min). Cards saved before the slab table get their three fixed rows shown as slabs.
const OLD_PKG_KEYS = ["packageHandling0to250", "packageHandling250to400", "packageHandling400plus"];
const DEFAULT_PKG_SLABS = [
  { from: 0, to: 250, min: 0, perKg: 0 },
  { from: 250, to: 400, min: 0, perKg: 0 },
  { from: 400, min: 0, perKg: 0 },
];
export const pkgSlabsOf = (overheads = {}) => {
  const saved = Array.isArray(overheads.packageHandlingSlabs) ? overheads.packageHandlingSlabs : [];
  if (saved.length) return saved.map((s) => ({ ...s }));
  return DEFAULT_PKG_SLABS.map((d, i) => {
    const old = overheads[OLD_PKG_KEYS[i]] || {};
    const v = Number(old.value || 0);
    const m = Number(old.min || 0);
    // a flat ₹ per box is the same as a minimum with no per-kg rate
    return old.type === "flat" ? { ...d, perKg: 0, min: Math.max(v, m) } : { ...d, perKg: v, min: m };
  });
};
const n = (v) => (v === "" || v == null || !Number.isFinite(Number(v)) ? 0 : Number(v));
// Slabs as saved: numbers, sorted by From, fully blank rows dropped
const cleanPkgSlabs = (slabs) =>
  slabs
    .filter((s) => String(s.from ?? "").trim() !== "" || String(s.to ?? "").trim() !== "" || n(s.perKg) > 0 || n(s.min) > 0)
    .map((s) => ({ from: n(s.from), ...(n(s.to) > 0 ? { to: n(s.to) } : {}), perKg: n(s.perKg), min: n(s.min) }))
    .sort((a, b) => a.from - b.from);
// Same rules the server checks: To above From, only the last slab open-ended, no overlaps
export const pkgSlabProblem = (overheads = {}) => {
  const sorted = cleanPkgSlabs(pkgSlabsOf(overheads));
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const next = sorted[i + 1];
    const name = `${s.from}–${s.to ?? "above"} kg`;
    if (s.to != null && s.to <= s.from) return `Package handling slab ${name}: "To" must be more than "From".`;
    if (next && s.to == null) return `Package handling slab ${name}: only the last slab can be left without a "To" weight.`;
    if (next && s.to != null && next.from < s.to) return `Package handling slabs ${name} and ${next.from}–${next.to ?? "above"} kg overlap.`;
  }
  return null;
};
const viewPkgSlabs = (slabs) => {
  const charged = slabs.filter((s) => n(s.perKg) > 0 || n(s.min) > 0);
  if (!charged.length) return "Not charged";
  return charged.map((s) => `${s.from}–${n(s.to) > 0 ? `${s.to} kg` : "above"}: ₹${n(s.perKg)}/kg (min ₹${n(s.min)})`).join(" · ");
};

// Owner-risk bands (Gati): up to ₹10K, up to ₹25K, up to ₹50L, above ₹50L
export const DEFAULT_OWNER_SLABS = [
  { upto: 10000, value: 0, min: 0 },
  { upto: 25000, value: 0, min: 0 },
  { upto: 5000000, value: 0, min: 0 },
  { value: 0, min: 0 },
];

const SECTIONS = [
  {
    title: "Weight & freight rules",
    note: "How the chargeable weight and base freight are worked out.",
    rows: [
      { key: "divisor", label: "Volumetric Divisor", desc: "Volumetric weight = L × W × H ÷ divisor", kind: "plain" },
      { key: "minChargeableWeight", label: "Min. Chargeable Weight", desc: "kg; 0 = use the service's minimum weight", kind: "kg" },
      { key: "minimumBilling", label: "Min. LR Billing", desc: "Minimum per LR: freight + LR + ROV are topped up to this ₹ (0 = off)", kind: "flat" },
      { key: "fuelCharge", label: "Fuel Surcharge (FSC)", desc: "% of base freight", kind: "pct" },
      { key: "gst", label: "GST Rate", desc: "GST % on the final subtotal", kind: "pct" },
    ],
  },
  {
    title: "Charged on every shipment",
    note: "Added to every quote and booking when set.",
    rows: [
      { key: "docketCharge", label: "Docket / LR Charge", desc: "Per LR (waybill)", kind: "any" },
      { key: "pickupCharge", label: "Pickup (FM) Charge", desc: "First-mile pickup", kind: "any" },
      { key: "handlingCharge", label: "Handling Charge", desc: "Cargo handling per shipment", kind: "any" },
      { key: "codCharges", label: "COD Charges", desc: "% of invoice value or minimum ₹ — COD orders only", kind: "pctMin" },
      { key: "greenTax", label: "Green Tax", desc: "Environmental surcharge", kind: "any" },
      { key: "appointmentDelivery", label: "Appointment Delivery", desc: "Only when the order is booked as appointment delivery", kind: "any" },
    ],
  },
  {
    title: "Risk (ROV)",
    note: "ROV is a % of the declared invoice value, at least the minimum ₹.",
    rows: [
      { key: "rovOwner", label: "ROV Owner Risk", desc: "Used when no owner-risk slabs are set below", kind: "pctMin" },
      { key: "rovCarrier", label: "ROV Carrier Risk", desc: "% of invoice value or minimum ₹", kind: "pctMin" },
    ],
    slabs: true,
  },
  {
    title: "ODA (out of delivery area)",
    note: "Only when the courier marks the pin as ODA. The distance tier uses the courier's distance (Gati); without a distance, the first row applies.",
    rows: [
      { key: "odaCharges", label: "ODA 0–50 km", desc: "Also used when the courier gives no distance", kind: "any" },
      { key: "odaCharges50to150", label: "ODA 50–150 km", desc: "0 = use the 0–50 km row", kind: "any" },
      { key: "odaCharges150plus", label: "ODA above 150 km", desc: "0 = use the rows above", kind: "any" },
    ],
  },
  {
    title: "Package handling",
    note: "Per box, by that box's weight: the higher of (box kg × ₹ per kg) and the minimum ₹. A box weighing exactly a slab's \"To\" weight goes to the next slab. Leave the last \"To\" blank for no upper limit.",
    rows: [],
    pkgSlabs: true,
  },
  {
    title: "If applicable (never added to the quote)",
    note: "Billed only if it happens. Shown to the seller under the price breakup.",
    rows: [
      { key: "fodCharges", label: "To-Pay (FOD)", desc: "Freight collected at destination", kind: "any" },
      { key: "csdDelivery", label: "CSD / Army Delivery", desc: "Delivery to CSD / army locations", kind: "any" },
      { key: "floorDelivery", label: "Floor Delivery", desc: "Delivery above ground floor", kind: "any" },
      { key: "demurrage", label: "Demurrage", desc: "Storage when the consignee delays", kind: "any" },
      { key: "reattemptCharge", label: "Re-attempt", desc: "Each extra delivery attempt", kind: "any" },
      { key: "reattemptFreeCount", label: "Free Re-attempts", desc: "Attempts not charged", kind: "count" },
    ],
  },
];

const typeOptionsFor = (row) => TYPE_OPTIONS.filter((t) => !row.types || row.types.includes(t.value));
const shownType = (row, f = {}) => {
  const opts = typeOptionsFor(row);
  return opts.some((t) => t.value === f.type) ? f.type : opts[0].value;
};

// Before saving: each row's type is what its dropdown shows (an old/unknown type becomes the first option shown)
export const withShownTypes = (overheads = {}) => {
  const out = { ...overheads };
  SECTIONS.forEach((s) =>
    s.rows.forEach((row) => {
      if (row.kind !== "any" || !out[row.key]) return;
      const type = shownType(row, out[row.key]);
      if (out[row.key].type !== type) out[row.key] = { ...out[row.key], type };
    })
  );
  // package handling = the slab table only; the three earlier fixed rows are cleared so they never apply with it
  out.packageHandlingSlabs = cleanPkgSlabs(pkgSlabsOf(overheads));
  OLD_PKG_KEYS.forEach((k) => (out[k] = { type: "perKg", value: 0, min: 0 }));
  // one minimum only: Min. LR Billing (an old Minimum Freight was moved into it when the card was opened)
  out.minimumFreight = { type: "flat", value: 0 };
  return out;
};

// When a stored card is opened: Minimum Freight is no longer on the screen, so a card that still has one shows it
// as its Min. LR Billing (when that is not set); saving then keeps only Min. LR Billing.
export const withMinFreightMoved = (overheads = {}) => {
  const old = Number(overheads.minimumFreight?.value || 0);
  if (!(old > 0) || Number(overheads.minimumBilling?.value || 0) > 0) return overheads;
  return { ...overheads, minimumBilling: { type: "flat", ...(overheads.minimumBilling || {}), value: old } };
};

const viewOverhead = (row, f = {}) => {
  const v = f.value ?? 0;
  const m = Number(f.min ?? 0);
  const minTxt = m > 0 ? ` (min ₹${m})` : "";
  switch (row.kind) {
    case "any": {
      const type = shownType(row, f);
      if (type === "percentage") return `${v}% of freight${minTxt}`;
      if (type === "perKg") return `₹${v}/kg${minTxt}`;
      return `₹${v}${minTxt}`;
    }
    case "pctMin":
      return `${v}% OR Min ₹${m} (whichever is higher)`;
    case "flat":
      return `₹${v}`;
    case "pct":
      return `${v}%`;
    case "kg":
      return Number(v) > 0 ? `${v} kg` : "Service minimum";
    default:
      return String(v);
  }
};

const viewSlabs = (slabs = []) => {
  const set = slabs.filter((s) => Number(s?.value || 0) > 0 || Number(s?.min || 0) > 0);
  if (!set.length) return "Not set — ROV Owner Risk row applies";
  return set
    .map((s) => `${Number(s.upto) > 0 ? `≤ ₹${Number(s.upto).toLocaleString("en-IN")}` : "Above"}: ${s.value}% (min ₹${s.min})`)
    .join(" · ");
};

export default function OverheadCharges({ data, mode = "view", onChange }) {
  const valuesRef = useRef(JSON.parse(JSON.stringify(data)));

  useEffect(() => {
    valuesRef.current = JSON.parse(JSON.stringify(data));
  }, [data]);

  const commit = () => {
    onChange({ ...valuesRef.current });
  };

  const Input = ({ path, width = "w-16", placeholder = "" }) => {
    const [key, field] = path;
    return (
      <input
        defaultValue={valuesRef.current[key]?.[field] ?? ""}
        placeholder={placeholder}
        inputMode="decimal"
        className={`${width} border rounded px-2 py-1 text-[12px]
        focus:outline-none focus:ring-1 focus:ring-brand-primary text-gray-800`}
        onChange={(e) => {
          if (!valuesRef.current[key]) valuesRef.current[key] = {};
          valuesRef.current[key][field] = e.target.value;
        }}
        onBlur={commit}
      />
    );
  };

  // always at least 4 rows, so a band can be added back later (0% / min ₹0 rows are ignored when pricing)
  const slabsNow = () => {
    const saved = Array.isArray(valuesRef.current.rovOwnerSlabs) ? valuesRef.current.rovOwnerSlabs : [];
    const shown = saved.length ? saved.map((s) => ({ ...s })) : DEFAULT_OWNER_SLABS.map((s) => ({ ...s }));
    while (shown.length < DEFAULT_OWNER_SLABS.length) shown.push({ value: 0, min: 0 });
    return shown;
  };

  const SlabInput = ({ index, field, width = "w-16", placeholder = "" }) => (
    <input
      defaultValue={slabsNow()[index]?.[field] ?? ""}
      placeholder={placeholder}
      inputMode="decimal"
      className={`${width} border rounded px-2 py-1 text-[12px]
      focus:outline-none focus:ring-1 focus:ring-brand-primary text-gray-800`}
      onChange={(e) => {
        const slabs = slabsNow().map((s) => ({ ...s }));
        slabs[index] = { ...slabs[index], [field]: e.target.value };
        valuesRef.current.rovOwnerSlabs = slabs;
      }}
      onBlur={commit}
    />
  );

  // package-handling slab table (edited in valuesRef like every other input; committed on blur / add / remove)
  const pkgNow = () => pkgSlabsOf(valuesRef.current);
  const PkgInput = ({ index, field, placeholder = "" }) => (
    <input
      defaultValue={pkgNow()[index]?.[field] ?? ""}
      placeholder={placeholder}
      inputMode="decimal"
      aria-label={`Package slab ${index + 1} ${placeholder}`}
      className="w-24 border rounded px-2 py-1 text-[12px] text-center focus:outline-none focus:ring-1 focus:ring-brand-primary text-gray-800"
      onChange={(e) => {
        const slabs = pkgNow();
        // what is shown must be what is saved: undo a keystroke that isn't a number
        if (!/^\d*\.?\d*$/.test(e.target.value)) {
          e.target.value = slabs[index]?.[field] ?? "";
          return;
        }
        slabs[index] = { ...slabs[index], [field]: e.target.value };
        valuesRef.current.packageHandlingSlabs = slabs;
      }}
      onBlur={commit}
    />
  );
  const addPkgSlab = () => {
    const slabs = pkgNow();
    const last = slabs[slabs.length - 1];
    valuesRef.current.packageHandlingSlabs = [...slabs, { from: last?.to ?? "", to: "", min: 0, perKg: 0 }];
    commit();
  };
  const removePkgSlab = (i) => {
    // removing every row must not bring the old fixed rows back: an empty list is kept as one blank row
    const left = pkgNow().filter((_, j) => j !== i);
    valuesRef.current.packageHandlingSlabs = left.length ? left : [{ from: "", to: "", min: 0, perKg: 0 }];
    commit();
  };

  const Row = ({ label, description, extra, children }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-3 py-2.5 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <div className="flex flex-col">
        <span className="text-[12px] font-[600] text-gray-700">{label}</span>
        {description && (
          <span className="text-[10px] text-gray-400 font-[400] leading-tight mt-0.5">{description}</span>
        )}
        {extra}
      </div>
      <div className="text-[12px] font-[600] text-gray-800 flex-shrink-0 self-start sm:self-auto mt-1 sm:mt-0">
        {children}
      </div>
    </div>
  );

  const renderEdit = (row) => {
    const f = data[row.key] || {};
    const hasMin = row.kind === "any" || row.kind === "pctMin";
    const unit =
      row.kind === "any"
        ? TYPE_OPTIONS.find((t) => t.value === shownType(row, f))?.unit
        : row.kind === "pctMin" || row.kind === "pct"
          ? "%"
          : row.kind === "flat"
            ? "₹"
            : row.kind === "kg"
              ? "kg"
              : "";
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {row.kind === "any" && (
          <select
            value={shownType(row, f)}
            onChange={(e) => {
              valuesRef.current[row.key] = { ...(valuesRef.current[row.key] || {}), type: e.target.value };
              commit();
            }}
            className="border rounded px-1.5 py-1 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary text-gray-800"
          >
            {typeOptionsFor(row).map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-1">
          <Input path={[row.key, "value"]} width={row.key === "divisor" ? "w-24" : "w-16"} />
          {unit && <span className="text-gray-500 text-[11px]">{unit}</span>}
        </div>
        {hasMin && (
          <>
            <span className="text-gray-400 text-[11px]">|</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-[11px]">Min ₹</span>
              <Input path={[row.key, "min"]} placeholder="Min ₹" />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border mt-4 shadow-sm">
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl flex justify-between items-center">
        <div>
          <h3 className="text-[13px] font-[700] text-gray-700">Overhead Charges & Calculation Rules</h3>
          <p className="text-[11px] text-gray-500 font-[400] mt-0.5">
            Define percentages, per-kg rates, flat amounts and minimums for B2B cargo calculation.
          </p>
        </div>
      </div>

      <div className="mx-3 sm:mx-4 mt-3 p-2.5 bg-brand-primary/70 border border-brand-primary/16 rounded-lg flex items-start gap-2 text-[11px] text-brand-primary">
        <FiInfo className="mt-0.5 text-brand-primary text-sm flex-shrink-0" />
        <div>
          <span className="font-[600]">Calculation Breakdown: </span>
          <span className="text-brand-primary">
            When both a <strong>rate</strong> and a <strong>Min ₹</strong> are set, the system charges <strong>WHICHEVER IS HIGHER</strong>.
            A charge left at 0 is not charged.
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-4">
        {SECTIONS.map((section) => {
          const half = Math.ceil(section.rows.length / 2);
          return (
            <div key={section.title}>
              <div className="mb-1.5">
                <div className="text-[12px] font-[700] text-gray-700 uppercase tracking-wide">{section.title}</div>
                <div className="text-[10.5px] text-gray-500">{section.note}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[section.rows.slice(0, half), section.rows.slice(half)].map((col, ci) =>
                  col.length ? (
                    <div key={ci} className="border rounded-lg divide-y bg-white">
                      {col.map((row) => (
                        <Row
                          key={row.key}
                          label={row.label}
                          description={row.desc}
                          extra={
                            row.key === "minimumBilling" && Number(data.minimumFreight?.value || 0) > 0 ? (
                              <span className="text-[10.5px] text-amber-700 leading-snug mt-0.5">
                                This card still has the old Minimum Freight ₹{data.minimumFreight.value}. It applies until you save; saving keeps only Min. LR Billing.
                              </span>
                            ) : row.key === "greenTax" ? (
                              mode === "view" ? (
                                data.greenTax?.delhiOnly ? (
                                  <span className="text-[10.5px] text-brand-primary font-[600] mt-0.5">Delhi shipments only</span>
                                ) : null
                              ) : (
                                <label className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(data.greenTax?.delhiOnly)}
                                    onChange={(e) => {
                                      valuesRef.current.greenTax = { ...(valuesRef.current.greenTax || {}), delhiOnly: e.target.checked };
                                      commit();
                                    }}
                                  />
                                  Only when pickup or delivery is in Delhi
                                </label>
                              )
                            ) : null
                          }
                        >
                          {mode === "view" ? viewOverhead(row, data[row.key]) : renderEdit(row)}
                        </Row>
                      ))}
                    </div>
                  ) : null
                )}
              </div>

              {section.pkgSlabs && (
                <div className="border rounded-lg bg-white px-3 py-2.5">
                  {mode === "view" ? (
                    <span className="text-[12px] font-[600] text-gray-800">{viewPkgSlabs(pkgSlabsOf(data))}</span>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="hidden sm:flex gap-1.5 text-[11px] font-[600] text-gray-500">
                        <span className="w-24">From weight (kg)</span>
                        <span className="w-24">To weight (kg)</span>
                        <span className="w-24">Minimum charge ₹</span>
                        <span className="w-24">Per kg charge ₹</span>
                      </div>
                      {pkgNow().map((_, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-1.5">
                          <PkgInput index={i} field="from" placeholder="From kg" />
                          <PkgInput index={i} field="to" placeholder="above" />
                          <PkgInput index={i} field="min" placeholder="Min ₹" />
                          <PkgInput index={i} field="perKg" placeholder="₹ / kg" />
                          <button type="button" onClick={() => removePkgSlab(i)} className="px-2 py-1 text-[11px] font-[600] text-red-600 hover:bg-red-50 rounded">
                            Remove
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addPkgSlab} className="px-3 py-1 text-[12px] font-[600] text-brand-primary border border-dashed border-brand-primary rounded">
                        + Add slab
                      </button>
                    </div>
                  )}
                </div>
              )}

              {section.slabs && (
                <div className="border rounded-lg bg-white mt-3 px-3 py-2.5">
                  <div className="text-[12px] font-[600] text-gray-700">Owner Risk by invoice value (slabs)</div>
                  <div className="text-[10px] text-gray-400 leading-tight mt-0.5 mb-2">
                    The first band whose "up to ₹" covers the invoice value applies; leave "up to" blank for the last band (above).
                    Bands at 0% and min ₹0 are ignored.
                  </div>
                  {mode === "view" ? (
                    <span className="text-[12px] font-[600] text-gray-800">{viewSlabs(data.rovOwnerSlabs)}</span>
                  ) : (
                    <div className="space-y-1.5">
                      {slabsNow().map((_, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-1.5">
                          <span className="text-gray-500 text-[11px] w-14">up to ₹</span>
                          <SlabInput index={i} field="upto" width="w-24" placeholder="above" />
                          <SlabInput index={i} field="value" />
                          <span className="text-gray-500 text-[11px]">% of invoice</span>
                          <span className="text-gray-400 text-[11px]">|</span>
                          <span className="text-gray-500 text-[11px]">Min ₹</span>
                          <SlabInput index={i} field="min" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
