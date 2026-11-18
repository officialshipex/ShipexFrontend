import { useEffect, useRef } from "react";
import { FiInfo } from "react-icons/fi";

/* Overhead charges of a B2B rate card — same sections, rows and rules as QuickPost's Cargo rate card
   (src/pages/cargo/CargoRateCard.tsx). The backend engine (B2B/utils/b2bRateEngine.js) reads these keys.

   Each charge has ONE type (no type dropdown). Row kinds:
   perKgMin — ₹ per kg of chargeable weight, at least the minimum ₹ (higher is charged; a minimum alone = fixed ₹)
   pctMin   — % of the base named in the description, at least the minimum ₹
   pct — %;  flat — ₹;  kg — weight;  count — a number;  plain — calculation rule (divisor) */
// the type saved for each kind (the rate engine reads it)
const STORED_TYPE = { perKgMin: "perKg", pctMin: "percentage", pct: "percentage", flat: "flat", kg: "flat", count: "flat", plain: "formula" };
const KIND_LABEL = { perKgMin: "₹/kg · Min ₹", pctMin: "% · Min ₹", pct: "Percent", flat: "Fixed ₹", kg: "Weight", count: "Count", plain: "Rule" };
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
    title: "Per kg / minimum",
    note: "₹ per kg of the chargeable weight, at least the minimum ₹ — the higher is charged. A minimum alone is a fixed charge. 0 = not charged.",
    rows: [
      { key: "pickupCharge", label: "FM (Pickup) Charges", desc: "First-mile pickup", kind: "perKgMin" },
      { key: "handlingCharge", label: "Handling Charges", desc: "Cargo handling per shipment", kind: "perKgMin" },
      { key: "greenTax", label: "Green Tax", desc: "Environmental surcharge", kind: "perKgMin" },
      { key: "deliveryCharge", label: "Delivery Charges (specific places)", desc: "Only for deliveries to the cities / states / zones listed (e.g. NE states)", kind: "perKgMin" },
      { key: "appointmentDelivery", label: "Appointment Delivery", desc: "Delivery by appointment", kind: "perKgMin", ifApplicable: true },
      { key: "csdDelivery", label: "CSD / Army Delivery", desc: "Delivery to CSD / army locations", kind: "perKgMin", ifApplicable: true },
      { key: "floorDelivery", label: "Floor Delivery", desc: "Delivery above ground floor", kind: "perKgMin", ifApplicable: true },
      { key: "demurrage", label: "Demurrage", desc: "Storage when the consignee delays", kind: "perKgMin", ifApplicable: true },
      { key: "reattemptCharge", label: "Re-attempt Charges", desc: "Each extra delivery attempt", kind: "perKgMin", ifApplicable: true },
    ],
    pkgSlabs: true,
  },
  {
    title: "Fixed",
    note: "One fixed amount or number each.",
    rows: [
      { key: "docketCharge", label: "LR Charges (per LR)", desc: "Per LR (waybill)", kind: "flat" },
      { key: "minimumBilling", label: "Min. LR Billing", desc: "Minimum per LR: freight + LR + ROV are topped up to this ₹ (0 = off)", kind: "flat" },
      { key: "minChargeableWeight", label: "Min. Chargeable Weight", desc: "0 = use the service's minimum weight", kind: "kg" },
      { key: "divisor", label: "Volumetric Divisor", desc: "Volumetric weight = L × W × H ÷ divisor", kind: "plain" },
      { key: "reattemptFreeCount", label: "Re-attempt Free Count", desc: "Delivery attempts not charged", kind: "count" },
    ],
  },
  {
    title: "Percentage",
    note: "A % of the base named, at least the minimum ₹ where there is one.",
    rows: [
      { key: "fuelCharge", label: "Fuel Surcharge (FSC)", desc: "% of base freight", kind: "pct" },
      { key: "codCharges", label: "COD Charges", desc: "% of invoice value — COD orders only", kind: "pctMin" },
      { key: "rovOwner", label: "Risk Charges — Owner", desc: "% of invoice value; used when no owner-risk slabs are set below", kind: "pctMin" },
      { key: "rovCarrier", label: "Risk Charges — Carrier", desc: "% of invoice value", kind: "pctMin" },
      { key: "fodCharges", label: "To Pay", desc: "% of invoice value — freight collected at destination", kind: "pctMin", ifApplicable: true },
      { key: "gst", label: "GST Rate", desc: "GST % on the final subtotal", kind: "pct" },
    ],
    slabs: true,
  },
];
const ALL_ROWS = SECTIONS.flatMap((s) => s.rows);

// Rows whose saved TYPE changes the price (the engine computes them by type). A stored card set with another type
// (e.g. pickup saved as "% of freight") is flagged until an admin checks the value — never silently re-priced.
const TYPE_MATTERS = new Set(
  ALL_ROWS.filter((r) => r.kind === "perKgMin" || ["fuelCharge", "docketCharge", "rovOwner", "rovCarrier", "fodCharges"].includes(r.key)).map((r) => r.key)
);
const isSetField = (f) => Boolean(f) && (n(f.value) > 0 || n(f.min) > 0);
export const typeWords = (f = {}) => {
  const v = f.value ?? 0;
  const m = n(f.min) > 0 ? ` (min ₹${f.min})` : "";
  if (f.type === "percentage") return `${v}%${m}`;
  if (f.type === "perKg") return `₹${v} per kg${m}`;
  return `₹${v} flat${m}`;
};
/* ODA by the courier's distance, in admin-set bands: each band = "above From km" up to the next band's From (the first
   band also covers 0 km and an unknown distance); charged max(kg × ₹/kg, minimum). A band at 0 / 0 falls back to the
   charged band below it (backend B2B/utils/b2bRateEngine.js odaSlabRuleFor). */
const OLD_ODA_KEYS = ["odaCharges", "odaCharges50to150", "odaCharges150plus"];
const OLD_ODA_FROM = [0, 50, 150];
export const OLD_ODA_LABEL = { odaCharges: "ODA 0–50 km", odaCharges50to150: "ODA 50–150 km", odaCharges150plus: "ODA above 150 km" };
const odaBandsCharged = (overheads = {}) =>
  Array.isArray(overheads.odaSlabs) && overheads.odaSlabs.some((s) => n(s?.perKg) > 0 || n(s?.min) > 0);
// Bands to show for a stored card: its own, else its three earlier fixed rows (0 / 50 / 150 km) as bands —
// ₹/kg as is; a flat ₹ is the same charge as ₹0/kg with that minimum; a % row is shown as entered (flagged to check)
export const odaBandsOf = (overheads = {}) => {
  const saved = Array.isArray(overheads.odaSlabs) ? overheads.odaSlabs : [];
  if (saved.length) return saved.map((s) => ({ ...s }));
  return OLD_ODA_KEYS.map((k, i) => {
    const o = overheads[k] || {};
    const v = n(o.value);
    const m = n(o.min);
    return o.type === "flat" ? { from: OLD_ODA_FROM[i], perKg: 0, min: Math.max(v, m) } : { from: OLD_ODA_FROM[i], perKg: v, min: m };
  });
};
// Bands as saved: numbers, sorted by From, fully blank rows dropped
const cleanOdaBands = (bands) =>
  bands
    .filter((b) => String(b.from ?? "").trim() !== "" || n(b.perKg) > 0 || n(b.min) > 0)
    .map((b) => ({ from: n(b.from), perKg: n(b.perKg), min: n(b.min) }))
    .sort((a, b) => a.from - b.from);
// Same rules the server checks: no band below 0 km, no two bands starting at the same km
export const odaBandProblem = (overheads = {}) => {
  const bands = cleanOdaBands(odaBandsOf(overheads));
  if (bands.some((b) => b.from < 0)) return "ODA distance bands: a band cannot start below 0 km.";
  for (let i = 1; i < bands.length; i++) if (bands[i].from === bands[i - 1].from) return `ODA distance bands: two bands start at ${bands[i].from} km.`;
  return null;
};
// "0–50 km" / "150+ km" for each band, by the next band's From
const odaRangeOf = (bands, i) => {
  const sorted = bands
    .map((b, j) => ({ ...b, j }))
    .filter((b) => String(b.from ?? "").trim() !== "")
    .sort((a, b) => n(a.from) - n(b.from));
  const at = sorted.findIndex((b) => b.j === i);
  if (at < 0) return "";
  const next = sorted[at + 1];
  return `${n(sorted[at].from)}${next ? `–${n(next.from)}` : "+"} km`;
};
const viewOdaBands = (bands) => {
  const charged = bands.map((b, i) => ({ b, i })).filter(({ b }) => n(b.perKg) > 0 || n(b.min) > 0);
  if (!charged.length) return "Not charged";
  return charged.map(({ b, i }) => `${odaRangeOf(bands, i)}: ₹${n(b.perKg)}/kg (min ₹${n(b.min)})`).join(" · ");
};

// { key: field as saved } for charges saved with another type than their row's, while set
export const typeMismatchesOf = (overheads = {}) =>
  Object.fromEntries([
    ...ALL_ROWS.filter((r) => TYPE_MATTERS.has(r.key))
      .filter((r) => {
        const f = overheads[r.key];
        return isSetField(f) && Boolean(f?.type) && f.type !== STORED_TYPE[r.kind];
      })
      .map((r) => [r.key, { ...overheads[r.key] }]),
    // ODA rows saved as "% of freight" can't become ₹/kg by themselves (₹/kg and flat convert exactly)
    ...(odaBandsCharged(overheads) ? [] : OLD_ODA_KEYS.filter((k) => isSetField(overheads[k]) && overheads[k]?.type === "percentage").map((k) => [k, { ...overheads[k] }])),
  ]);
export const labelOf = (key) => ALL_ROWS.find((r) => r.key === key)?.label || OLD_ODA_LABEL[key] || key;
// "Assam, Meghalaya ,NE" -> ["Assam", "Meghalaya", "NE"]
export const placesOf = (places) =>
  (Array.isArray(places) ? places : typeof places === "string" ? places.split(",") : []).map((p) => String(p ?? "").trim()).filter(Boolean);

// Before saving: every row is saved with its own type (one type per charge); delivery places as a list
export const withFixedTypes = (overheads = {}) => {
  const out = { ...overheads };
  ALL_ROWS.forEach((row) => {
    out[row.key] = { ...(out[row.key] || {}), type: STORED_TYPE[row.kind] };
  });
  out.deliveryCharge = { ...out.deliveryCharge, places: placesOf(out.deliveryCharge?.places) };
  // package handling = the slab table only; the three earlier fixed rows are cleared so they never apply with it
  out.packageHandlingSlabs = cleanPkgSlabs(pkgSlabsOf(overheads));
  OLD_PKG_KEYS.forEach((k) => (out[k] = { type: "perKg", value: 0, min: 0 }));
  // ODA = the distance bands only; the three earlier fixed rows are cleared so they never apply with them
  out.odaSlabs = cleanOdaBands(odaBandsOf(overheads));
  OLD_ODA_KEYS.forEach((k) => (out[k] = { type: "perKg", value: 0, min: 0 }));
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
    case "perKgMin":
      return `₹${v}/kg${minTxt}`;
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

// savedAs: { key: field as saved } of charges saved with another type (shown until checked);
// checked: keys the admin ticked as checked; onCheck(key, on)
export default function OverheadCharges({ data, mode = "view", onChange, savedAs = {}, checked = [], onCheck = () => {} }) {
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

  // ODA distance bands (edited in valuesRef like every other input; committed on blur / add / remove)
  const odaNow = () => odaBandsOf(valuesRef.current);
  const OdaInput = ({ index, field, placeholder = "" }) => (
    <input
      defaultValue={odaNow()[index]?.[field] ?? ""}
      placeholder={placeholder}
      inputMode="decimal"
      aria-label={`ODA band ${index + 1} ${placeholder}`}
      className="w-24 border rounded px-2 py-1 text-[12px] text-center focus:outline-none focus:ring-1 focus:ring-brand-primary text-gray-800"
      onChange={(e) => {
        const bands = odaNow();
        // what is shown must be what is saved: undo a keystroke that isn't a number
        if (!/^\d*\.?\d*$/.test(e.target.value)) {
          e.target.value = bands[index]?.[field] ?? "";
          return;
        }
        bands[index] = { ...bands[index], [field]: e.target.value };
        valuesRef.current.odaSlabs = bands;
      }}
      onBlur={commit}
    />
  );
  const addOdaBand = () => {
    const bands = odaNow();
    const top = Math.max(0, ...bands.map((b) => n(b.from)));
    valuesRef.current.odaSlabs = [...bands, { from: bands.length ? top + 50 : 0, perKg: 0, min: 0 }];
    commit();
  };
  const removeOdaBand = (i) => {
    // removing every band must not bring the old fixed rows back: an empty list is kept as one blank band
    const left = odaNow().filter((_, j) => j !== i);
    valuesRef.current.odaSlabs = left.length ? left : [{ from: "", perKg: 0, min: 0 }];
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
    const hasMin = row.kind === "perKgMin" || row.kind === "pctMin";
    const unit =
      row.kind === "perKgMin"
        ? "₹/kg"
        : row.kind === "pctMin" || row.kind === "pct"
          ? "%"
          : row.kind === "flat"
            ? "₹"
            : row.kind === "kg"
              ? "kg"
              : "";
    return (
      <div className="flex flex-wrap items-center gap-1.5">
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

  // notices under a row's name: Min. LR Billing's old Minimum Freight, Green Tax's Delhi-only tick
  const rowExtra = (row) => {
    if (row.key === "minimumBilling" && Number(data.minimumFreight?.value || 0) > 0) {
      return (
        <span className="text-[10.5px] text-amber-700 leading-snug mt-0.5">
          This card still has the old Minimum Freight ₹{data.minimumFreight.value}. It applies until you save; saving keeps only Min. LR Billing.
        </span>
      );
    }
    if (row.key === "greenTax") {
      return mode === "view" ? (
        data.greenTax?.delhiOnly ? <span className="text-[10.5px] text-brand-primary font-[600] mt-0.5">Delhi shipments only</span> : null
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
      );
    }
    return null;
  };

  const rowLabel = (row) => (
    <>
      {row.label}
      <span className="ml-1.5 text-[10px] font-[600] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">{KIND_LABEL[row.kind]}</span>
      {row.ifApplicable && <span className="ml-1 text-[10px] font-[600] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">If applicable</span>}
    </>
  );

  const rowNotices = (row) => (
    <>
      {savedAs[row.key] && (
        <span className="mt-1 p-1.5 rounded bg-amber-50 border border-amber-200 text-[10.5px] text-amber-800 leading-snug">
          Saved earlier as <b>{typeWords(savedAs[row.key])}</b>, and charged that way until this card is saved. This charge is now{" "}
          <b>{KIND_LABEL[row.kind]}</b>: check the value and minimum{mode === "view" ? " (Edit)." : ", then tick Checked."}
          {mode !== "view" && (
            <label className="mt-1 flex items-center gap-1.5 font-[600] cursor-pointer select-none">
              <input type="checkbox" checked={checked.includes(row.key)} onChange={(e) => onCheck(row.key, e.target.checked)} />
              Checked
            </label>
          )}
        </span>
      )}
      {row.key === "deliveryCharge" &&
        (mode === "view" ? (
          <span className="text-[10.5px] text-brand-primary font-[600] mt-0.5">
            {placesOf(data.deliveryCharge?.places).length
              ? `Only: ${placesOf(data.deliveryCharge?.places).join(", ")}`
              : "No places set — not charged"}
          </span>
        ) : (
          <input
            defaultValue={
              Array.isArray(valuesRef.current.deliveryCharge?.places)
                ? valuesRef.current.deliveryCharge.places.join(", ")
                : valuesRef.current.deliveryCharge?.places ?? ""
            }
            placeholder="e.g. Assam, Meghalaya, Tripura or NE"
            aria-label="Delivery charge places"
            className="mt-1 w-full max-w-[320px] border rounded px-2 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-brand-primary text-gray-800"
            onChange={(e) => {
              valuesRef.current.deliveryCharge = { ...(valuesRef.current.deliveryCharge || {}), places: e.target.value };
            }}
            onBlur={commit}
          />
        ))}
      {rowExtra(row)}
    </>
  );

  return (
    <div className="bg-white rounded-xl border mt-4 shadow-sm">
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl flex justify-between items-center">
        <div>
          <h3 className="text-[13px] font-[700] text-gray-700">Overhead Charges & Calculation Rules</h3>
          <p className="text-[11px] text-gray-500 font-[400] mt-0.5">
            Per kg / minimum charges, fixed charges and percentages for B2B cargo calculation.
          </p>
        </div>
      </div>

      <div className="mx-3 sm:mx-4 mt-3 p-2.5 bg-brand-primary/70 border border-brand-primary/16 rounded-lg flex items-start gap-2 text-[11px] text-brand-primary">
        <FiInfo className="mt-0.5 text-brand-primary text-sm flex-shrink-0" />
        <div>
          <span className="font-[600]">Calculation Breakdown: </span>
          <span className="text-brand-primary">
            When both a <strong>rate</strong> and a <strong>Min ₹</strong> are set, the system charges <strong>WHICHEVER IS HIGHER</strong>.
            A charge left at 0 is not charged. % charges are of the base freight (FSC) or the invoice value (COD, Risk, To Pay).
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
                        <Row key={row.key} label={rowLabel(row)} description={row.desc} extra={rowNotices(row)}>
                          {mode === "view" ? viewOverhead(row, data[row.key]) : renderEdit(row)}
                        </Row>
                      ))}
                    </div>
                  ) : null
                )}
              </div>

              {/* ODA: per kg / minimum in distance bands the admin sets (km is not fixed) */}
              {section.pkgSlabs && (
                <div className="border rounded-lg bg-white mt-3 px-3 py-2.5">
                  <div className="text-[12px] font-[600] text-gray-700">ODA Charges (by the courier's distance)</div>
                  <div className="text-[10px] text-gray-400 leading-tight mt-0.5 mb-2">
                    Only when the courier marks the pin as ODA. Each band starts above its "From km" and runs to the next band's From; the first band
                    also covers 0 km and an unknown distance. Charge = the higher of (chargeable kg × ₹ per kg) and the minimum ₹. A band left at 0 / 0
                    uses the charged band below it.
                  </div>
                  {OLD_ODA_KEYS.filter((k) => savedAs[k]).map((k) => (
                    <div key={k} className="mb-2 p-1.5 rounded bg-amber-50 border border-amber-200 text-[10.5px] text-amber-800 leading-snug">
                      {OLD_ODA_LABEL[k]} was saved as <b>{typeWords(savedAs[k])}</b> (of freight), and is charged that way until this card is saved. ODA
                      is now ₹ per kg + minimum: check that band{mode === "view" ? " (Edit)." : ", then tick Checked."}
                      {mode !== "view" && (
                        <label className="mt-1 flex items-center gap-1.5 font-[600] cursor-pointer select-none">
                          <input type="checkbox" checked={checked.includes(k)} onChange={(e) => onCheck(k, e.target.checked)} />
                          Checked
                        </label>
                      )}
                    </div>
                  ))}
                  {mode === "view" ? (
                    <span className="text-[12px] font-[600] text-gray-800">{viewOdaBands(odaBandsOf(data))}</span>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="hidden sm:flex gap-1.5 text-[11px] font-[600] text-gray-500">
                        <span className="w-24">From (above) km</span>
                        <span className="w-24">Per kg charge ₹</span>
                        <span className="w-24">Minimum charge ₹</span>
                        <span className="w-24">Band</span>
                      </div>
                      {odaNow().map((_, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-1.5">
                          <OdaInput index={i} field="from" placeholder="From km" />
                          <OdaInput index={i} field="perKg" placeholder="₹ / kg" />
                          <OdaInput index={i} field="min" placeholder="Min ₹" />
                          <span className="w-24 text-[11px] text-gray-500">{odaRangeOf(odaBandsOf(data), i)}</span>
                          <button type="button" onClick={() => removeOdaBand(i)} className="px-2 py-1 text-[11px] font-[600] text-red-600 hover:bg-red-50 rounded">
                            Remove
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addOdaBand} className="px-3 py-1 text-[12px] font-[600] text-brand-primary border border-dashed border-brand-primary rounded">
                        + Add distance band
                      </button>
                    </div>
                  )}
                </div>
              )}

              {section.pkgSlabs && (
                <div className="border rounded-lg bg-white mt-3 px-3 py-2.5">
                  <div className="text-[12px] font-[600] text-gray-700">Package Handling (per box, by box weight)</div>
                  <div className="text-[10px] text-gray-400 leading-tight mt-0.5 mb-2">
                    Each box: the higher of (box kg × ₹ per kg) and the minimum ₹ of its slab. A box weighing exactly a slab's "To" weight goes to
                    the next slab; leave the last "To" blank for no upper limit.
                  </div>
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
                  <div className="text-[12px] font-[600] text-gray-700">Risk Charges — Owner, by invoice value (slabs)</div>
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
