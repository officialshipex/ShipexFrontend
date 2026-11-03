import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle, Ban, Trash2 } from "lucide-react";

// Confirmation popup for Bulk Cancel / Bulk Delete on the orders pages. Call it and wait for the answer:
//   if (!(await confirmBulkAction({ action: "cancel", count: selectedOrders.length }))) return;
// cancel = cancel the booked shipments with the courier (orders stay, in Cancelled, freight refunded)
// delete = remove not-yet-booked orders from the system for good (booked shipments are never deleted)

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const COPY = {
  cancel: {
    title: (n) => `Cancel ${plural(n, "shipment")}?`,
    unit: "shipment",
    points: [
      "Only the courier booking is cancelled — the orders are NOT deleted.",
      "The orders move to the Cancelled tab and the freight is refunded to the wallet.",
      "Shipments the courier has already picked up cannot be cancelled and are skipped.",
    ],
    confirm: (n) => `Yes, cancel ${plural(n, "shipment")}`,
  },
  delete: {
    title: (n) => `Delete ${plural(n, "order")} permanently?`,
    unit: "order",
    points: [
      "The orders are removed completely from the system and cannot be recovered.",
      "Only orders not yet booked with a courier are deleted — booked shipments are never deleted (cancel those instead).",
    ],
    confirm: (n) => `Yes, delete ${plural(n, "order")}`,
  },
};

const Dialog = ({ action, count, orderNumber, onAnswer }) => {
  const copy = COPY[action];
  const Icon = action === "delete" ? Trash2 : Ban;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onAnswer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAnswer]);

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={() => onAnswer(false)} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-4 sm:p-5 animate-popup-in">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-red-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] font-[600] text-gray-800">{copy.title(count)}</h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {orderNumber ? (
                <>Order <span className="font-[600] text-gray-800">#{orderNumber}</span></>
              ) : (
                <><span className="font-[600] text-gray-800">{count}</span> {copy.unit}{count === 1 ? "" : "s"} selected</>
              )}
            </p>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {copy.points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-[12px] text-gray-600 leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-[2px] shrink-0" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-5">
          <button
            autoFocus
            onClick={() => onAnswer(false)}
            className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-600 text-[12px] font-[600] hover:bg-gray-300"
          >
            No, go back
          </button>
          <button
            onClick={() => onAnswer(true)}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-[600]"
          >
            {copy.confirm(count)}
          </button>
        </div>
      </div>
    </div>
  );
};

// orderNumber (optional): a single order's number, shown instead of "N selected"
export const confirmBulkAction = ({ action, count = 1, orderNumber }) =>
  new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    let done = false;
    const onAnswer = (yes) => {
      if (done) return;
      done = true;
      root.unmount();
      host.remove();
      resolve(yes);
    };
    root.render(<Dialog action={action} count={count} orderNumber={orderNumber} onAnswer={onAnswer} />);
  });
