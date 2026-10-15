import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import { Info, X, RotateCcw } from "lucide-react";
import ThreeDotLoader from "../../Loader";

// COD of orders the courier returned after delivery (RTO after "Delivered") is adjusted automatically by the backend
// (COD/codReversal.js): taken out of "COD to be remitted", removed from an unpaid remittance, or recovered from the
// next remittance when it was already paid. These pieces show the seller and the admin why amounts changed.

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const inr = (n) => `₹${(Number(n) || 0).toFixed(2)}`;

// Reasons attached to one remittance (detail popups).
export const CodAdjustmentNotes = ({ adjustments, recoveredAmount }) => {
  const list = Array.isArray(adjustments) ? adjustments : [];
  if (!list.length && !(Number(recoveredAmount) > 0)) return null;
  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
      <p className="font-[600] flex items-center gap-1 mb-1">
        <Info className="w-3.5 h-3.5" /> Why the amount of this remittance changed
      </p>
      <ul className="space-y-1 list-disc pl-4">
        {list.map((a, i) => (
          <li key={i}>
            {a.note}
            {a.date && <span className="text-amber-600"> ({dayjs(a.date).format("DD MMM YYYY")})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Small marker for a remittance row; opens the reasons.
export const CodAdjustmentBadge = ({ adjustments, recoveredAmount, remittanceId }) => {
  const [open, setOpen] = useState(false);
  const list = Array.isArray(adjustments) ? adjustments : [];
  if (!list.length) return null;
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title={list.map((a) => a.note).join("\n")}
        className="mt-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-[600] hover:bg-amber-200 whitespace-nowrap"
      >
        <Info className="w-3 h-3" /> Adjusted
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-4 animate-popup-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[13px] font-[600] text-gray-700">Remittance {remittanceId}</h3>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <CodAdjustmentNotes adjustments={list} recoveredAmount={recoveredAmount} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

// Amount still to be recovered from the next COD remittance(s).
export const CodRecoveryBanner = ({ amount, onView }) => {
  if (!(Number(amount) > 0)) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
      <RotateCcw className="w-4 h-4 shrink-0" />
      <span>
        <b>{inr(amount)}</b> will be recovered from the next COD remittance: COD already paid for orders the courier
        returned (RTO) after delivery.
      </span>
      {onView && (
        <button onClick={onView} className="ml-auto font-[600] underline hover:text-amber-900 whitespace-nowrap">
          View details
        </button>
      )}
    </div>
  );
};

const STAGE_LABEL = {
  queued: 'Removed from "COD to be remitted"',
  pending_remittance: "Removed from unpaid remittance",
  paid_remittance: "Recovered from next remittance",
};
const RECOVERY_LABEL = {
  none: "—",
  pending: "To be recovered",
  partial: "Partly recovered",
  recovered: "Recovered",
  cancelled: "Cancelled",
};

// Every returned-after-delivery adjustment. A seller gets their own; admin gets all, or one seller with `userId`.
export const CodReversalsModal = ({ open, onClose, userId, isAdmin }) => {
  const [rows, setRows] = useState([]);
  const [due, setDue] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const token = Cookies.get("session");
        const params = { page, limit: 100 };
        if (userId) params.userId = userId;
        const res = await axios.get(`${REACT_APP_BACKEND_URL}/cod/codReversals`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        if (cancelled) return;
        setRows(res.data?.results || []);
        setDue(res.data?.summary?.recoveryDue || 0);
        setTotalPages(res.data?.totalPages || 1);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Could not load the adjustments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, page, userId]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[250] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col animate-popup-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="text-[14px] font-[600] text-gray-700">COD orders returned after delivery</h3>
            <p className="text-[11px] text-gray-500">
              The courier marked these orders RTO after they were delivered, so their COD was adjusted automatically.
              {Number(due) > 0 && (
                <>
                  {" "}Still to be recovered: <b className="text-amber-700">{inr(due)}</b>
                </>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="py-10 flex justify-center">
              <ThreeDotLoader />
            </div>
          ) : error ? (
            <p className="py-10 text-center text-[12px] text-red-600">{error}</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-gray-500">No returned COD orders.</p>
          ) : (
            <table className="w-full text-[12px] border-collapse">
              <thead className="bg-brand-primary text-white sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">Date</th>
                  {isAdmin && <th className="text-left px-3 py-2">Seller</th>}
                  <th className="text-left px-3 py-2">Order / AWB</th>
                  <th className="text-left px-3 py-2">COD</th>
                  <th className="text-left px-3 py-2">What was done</th>
                  <th className="text-left px-3 py-2">Recovery</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-t border-gray-100 align-top">
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{dayjs(r.date).format("DD MMM YYYY")}</td>
                    {isAdmin && (
                      <td className="px-3 py-2 text-gray-600">
                        <p>{r.user?.name || "—"}</p>
                        <p className="text-[10px] text-gray-400">{r.user?.userId}</p>
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <p className="text-brand-primary font-[600]">#{r.orderId}</p>
                      <p className="text-[10px] text-gray-500">{r.awb}</p>
                      <p className="text-[10px] text-gray-500">{r.toStatus}</p>
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{inr(r.codAmount)}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[340px]">
                      <p className="font-[600] text-gray-700">
                        {STAGE_LABEL[r.stage] || r.stage}
                        {r.remittanceId ? ` (${r.remittanceId})` : ""}
                        {r.status === "undone" && <span className="ml-1 text-brand-primary">· delivered again</span>}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{r.status === "undone" ? r.undoNote : r.note}</p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.recoveryAmount > 0 ? (
                        <>
                          <p className="text-gray-700">
                            {inr(r.recoveredAmount)} / {inr(r.recoveryAmount)}
                          </p>
                          <p className={`text-[10px] font-[600] ${r.recoveryStatus === "recovered" ? "text-brand-primary" : r.recoveryStatus === "cancelled" ? "text-gray-400" : "text-amber-600"}`}>
                            {RECOVERY_LABEL[r.recoveryStatus] || r.recoveryStatus}
                          </p>
                          {(r.recoveredIn || []).map((x, i) => (
                            <p key={i} className="text-[10px] text-gray-400">
                              {inr(x.amount)} in {x.remittanceId}
                            </p>
                          ))}
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 px-4 py-2 border-t text-[12px]">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border rounded disabled:opacity-40">
              Prev
            </button>
            <span className="text-gray-500">
              {page} / {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border rounded disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
