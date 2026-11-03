import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { X, Crown, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

/* Recharge plans for sellers without a sales person (backend: /rate-plans/my). One recharge of a plan's amount
   moves the seller to that plan at once; at month end the month's recharges must reach the plan's amount again
   or the plan moves down. Choosing a plan opens the wallet recharge page with that amount filled in. */

const inr = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "");
const ZONES = ["zoneA", "zoneB", "zoneC", "zoneD", "zoneE"];

export default function UpgradePlanModal({ onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/rate-plans/my`, { headers: { Authorization: `Bearer ${Cookies.get("session")}` } })
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.response?.data?.message || "Could not load the plans. Please try again."));
  }, []);

  const recharge = (amount) => {
    onClose();
    navigate(`/dashboard/rechargeWallet?amount=${Math.max(1000, Math.round(amount))}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Upgrade plan" className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2"><Crown size={16} className="text-amber-500" />Upgrade plan</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto p-4">
          {error ? <p className="text-[12px] text-red-600">{error}</p> : !data ? <p className="text-[12px] text-gray-400 py-8 text-center">Loading plans…</p> : !data.enabled ? (
            <p className="text-[12px] text-gray-500 py-6 text-center">Recharge plans are not available right now.</p>
          ) : (
            <div className="space-y-4">
              {!data.managed && data.message && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-[12px] text-amber-800"><AlertCircle size={14} className="mt-0.5 shrink-0" />{data.message}</div>
              )}
              {data.managed && data.plans.length > 0 && !data.plans.some((p) => p.isHigher) && (
                <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-100 text-[12px] text-green-800">You are on the highest plan.</div>
              )}
              {data.managed && (
                <p className="text-[12px] text-gray-600">Recharge your wallet with a plan's amount in <b>one payment</b> and your rates move to that plan at once. To keep it, your recharges in each month need to add up to the plan's amount; otherwise from the 1st of next month you move to the plan your recharges reached.</p>
              )}
              {data.keep && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-[12px]">
                  <div className="font-[600] text-gray-700">Keep {data.keep.planName} next month</div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden mt-2"><div className="h-full bg-brand-primary" style={{ width: `${Math.min(100, Math.round((data.keep.recharged / Math.max(1, data.keep.amount)) * 100))}%` }} /></div>
                  <div className="text-gray-500 mt-1">{inr(data.keep.recharged)} of {inr(data.keep.amount)} recharged this month{data.keep.remaining > 0 ? ` · recharge ${inr(data.keep.remaining)} more by month end` : " · plan kept"}</div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {data.plans.map((p) => (
                  <div key={p.planName} className={`rounded-lg border p-3 flex flex-col ${p.isCurrent ? "border-brand-primary bg-green-50" : "border-gray-200"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-[700] text-gray-800">{p.planName}</span>
                      {p.isCurrent && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-primary text-white text-[10px] font-[700]"><CheckCircle2 size={11} />Current</span>}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Recharge {inr(p.minRecharge)}</div>
                    {p.preview && (
                      <div className="mt-2 text-[11px]">
                        <div className="text-gray-400 mb-1">500 g from</div>
                        <div className="grid grid-cols-5 gap-1 text-center">
                          {ZONES.map((z) => (
                            <div key={z}><div className="text-[10px] text-gray-400">{z.slice(-1)}</div><div className="font-[600] text-gray-700">{p.preview[z] == null ? "—" : `₹${p.preview[z]}`}</div></div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-auto pt-3">
                      {data.managed && p.isHigher && (
                        <button onClick={() => recharge(p.minRecharge)} className="w-full py-2 rounded-lg bg-brand-primary text-white text-[11px] font-[600] hover:opacity-90">Recharge {inr(p.minRecharge)}</button>
                      )}
                      {data.managed && p.isCurrent && data.keep && data.keep.remaining > 0 && (
                        <button onClick={() => recharge(data.keep.remaining)} className="w-full py-2 rounded-lg border border-brand-primary text-brand-primary text-[11px] font-[600] hover:bg-green-50">Recharge to keep</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400">Prices are forward freight per shipment for 500 g with the cheapest courier, before GST and COD. Zones: A within city, B within state, C metro to metro, D rest of India, E special areas.</p>
              {data.history?.length > 0 && (
                <div>
                  <h4 className="text-[12px] font-[600] text-gray-700 mb-1">Plan changes</h4>
                  <ul className="divide-y divide-gray-100 text-[11px]">
                    {data.history.map((h, i) => (
                      <li key={i} className="py-1.5 flex items-center gap-2">
                        {h.action === "upgraded" ? <ArrowUpRight size={13} className="text-green-600" /> : h.action === "downgraded" ? <ArrowDownRight size={13} className="text-red-500" /> : <Minus size={13} className="text-gray-400" />}
                        <span className="text-gray-500 w-[90px] shrink-0">{fmtDate(h.at)}</span>
                        <span className="text-gray-700">{h.action === "kept" ? `Kept ${h.toPlan}` : `${h.fromPlan} → ${h.toPlan}`}</span>
                        {h.amount != null && <span className="ml-auto text-gray-400">{h.action === "upgraded" ? `recharge ${inr(h.amount)}` : `${inr(h.amount)} in the month`}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
