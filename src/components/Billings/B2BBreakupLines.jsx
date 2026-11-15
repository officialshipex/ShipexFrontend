import { b2bBreakupRows, b2bIfApplicable } from "../../utils/b2bPriceBreakup";

// A booked B2B order's charges (order.rateBreakup = the rate engine's working) as labelled rows — the same rows
// the courier selection showed before booking — then the "if applicable" charges, which were not billed.
export default function B2BBreakupLines({ w, valueClass = "font-[600]" }) {
  const ifApplicable = b2bIfApplicable(w);
  return (
    <>
      {b2bBreakupRows(w).map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3">
          <span className="text-gray-500">{label}</span>
          <span className={valueClass}>{value}</span>
        </div>
      ))}
      {ifApplicable.length > 0 && (
        <div className="border-t border-dashed pt-1 mt-1">
          <p className="text-gray-500 font-[600]">If applicable (not billed)</p>
          {ifApplicable.map((t) => (
            <p key={t} className="text-gray-400 leading-snug">{t}</p>
          ))}
        </div>
      )}
    </>
  );
}
