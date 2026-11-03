import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FaTrash } from "react-icons/fa";
import { Notification } from "../../Notification";

/* Admin: recharge plans for sellers without a sales person (backend /rate-plans/admin). One recharge of a plan's
   amount moves a seller to that rate card at once; at month end the month's recharges must reach it again or the
   seller moves down. Sellers with a sales person, an admin-assigned plan or custom rates are never moved. */

const api = () => ({ headers: { Authorization: `Bearer ${Cookies.get("session")}` } });

export default function RechargePlansModal({ isOpen, onClose }) {
  const [enabled, setEnabled] = useState(true);
  const [steps, setSteps] = useState(null);
  const [planNames, setPlanNames] = useState([]);
  const [counts, setCounts] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setSteps(null);
    setError("");
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/rate-plans/admin`, api())
      .then((res) => {
        setEnabled(res.data?.settings?.enabled !== false);
        setSteps(res.data?.settings?.plans || []);
        setPlanNames(res.data?.planNames || []);
        setCounts(res.data?.sellersOnRechargePlans || {});
      })
      .catch((e) => {
        setError(e?.response?.data?.message || "Could not load recharge plans.");
        setSteps([]);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  // plans in the list that have no courier rates (switching on is refused while there are any)
  const missing = (steps || []).map((s) => s.planName).filter((p) => p && !planNames.includes(p));
  const update = (i, patch) => setSteps((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/rate-plans/admin`, { enabled, plans: steps }, api());
      Notification(res.data?.message || "Recharge plans saved", "success");
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save the recharge plans.");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full border border-gray-300 rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-brand-primary";
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">Recharge Plans</h2>
        </div>
        <div className="overflow-y-auto p-4 space-y-3">
          <p className="text-[11px] text-gray-500">
            For sellers without a sales person. One recharge of a plan's amount moves the seller to that rate card at once. At month end the month's recharges must reach the plan's amount again, otherwise the seller moves to the plan their recharges reached (never below the first). Sellers with a sales person, a plan you assigned, or custom rates are never moved.
          </p>
          <label className="flex items-center gap-2 text-[12px] font-[600] text-gray-700 cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-brand-primary" />
            Recharge plans switched on
          </label>
          {!enabled && (
            <div className="px-3 py-2 rounded-lg bg-sky-50 border border-sky-100 text-[11px] text-sky-800">
              Switched off: sellers don't see "Upgrade plan" and recharges don't change anyone's plan. Sellers already moved by a recharge keep their plan.
            </div>
          )}
          {steps && planNames.length === 0 && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-[11px] text-amber-800">
              No rate card has courier rates yet. Create the rate cards (Bronze, Silver, …) with their courier rates first, then come back here.
            </div>
          )}
          {steps && enabled && missing.length > 0 && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-[11px] text-amber-800">
              Before switching on, every plan needs courier rates. Missing for: <b>{missing.join(", ")}</b> — add their rate cards, or remove them from the list.
            </div>
          )}
          {error && <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-[12px] text-red-600">{error}</div>}
          {!steps ? (
            <p className="text-[12px] text-gray-400">Loading…</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_120px_32px] gap-2 text-[11px] font-[600] text-gray-500">
                <span>Rate card plan</span>
                <span>Recharge (₹)</span>
                <span />
              </div>
              {steps.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_32px] gap-2 items-center">
                  <div>
                    <select value={s.planName} onChange={(e) => update(i, { planName: e.target.value })} className={field}>
                      <option value="">Choose a plan</option>
                      {[...new Set([...planNames, s.planName].filter(Boolean))].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    {counts[s.planName] ? <div className="text-[10px] text-gray-400 mt-0.5">{counts[s.planName]} seller(s) on it by recharge</div> : null}
                    {s.planName && !planNames.includes(s.planName) && <div className="text-[10px] text-amber-600 mt-0.5">No courier rates for this plan — sellers won't see it.</div>}
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={s.minRecharge || ""}
                    onChange={(e) => update(i, { minRecharge: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                    className={`${field} text-right`}
                  />
                  <button type="button" aria-label="Remove" onClick={() => setSteps((st) => st.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 flex justify-center">
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
              {steps.length < 10 && (
                <button type="button" onClick={() => setSteps((st) => [...st, { planName: "", minRecharge: 0 }])} className="px-3 py-1.5 rounded-lg border border-dashed border-brand-primary text-brand-primary text-[11px] font-[600]">
                  + Add plan
                </button>
              )}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-[10px] sm:text-[12px] font-[600]">Cancel</button>
          <button disabled={busy || !steps?.length} onClick={save} className="px-3 py-2 rounded-lg bg-brand-primary text-white text-[10px] sm:text-[12px] font-[600] disabled:opacity-50">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
