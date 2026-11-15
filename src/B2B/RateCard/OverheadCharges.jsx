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
const BOX_TYPES = ["perKg", "flat"]; // package handling is per box: no freight to take a % of

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
      { key: "minimumFreight", label: "Minimum Freight", desc: "Minimum base freight per booking", kind: "flat" },
      { key: "minimumBilling", label: "Min. LR Billing", desc: "Freight + LR + ROV topped up to this ₹ (0 = off)", kind: "flat" },
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
    note: "Per box, by that box's weight. ₹/kg uses the box weight.",
    rows: [
      { key: "packageHandling0to250", label: "Box up to 250 kg", desc: "Per box", kind: "any", types: BOX_TYPES },
      { key: "packageHandling250to400", label: "Box 250–400 kg", desc: "Per box", kind: "any", types: BOX_TYPES },
      { key: "packageHandling400plus", label: "Box 400 kg and above", desc: "Per box", kind: "any", types: BOX_TYPES },
    ],
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
  return out;
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
                            row.key === "greenTax" ? (
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
