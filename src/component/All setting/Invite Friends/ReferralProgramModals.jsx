import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import { X, Gift, Coins, Award, Plus, Trash2, Pencil, Search } from "lucide-react";
import Loader from "../../../Loader";
import { Notification } from "../../../Notification";

// Admin: the company's user-referral programme (joining bonus + default monthly commission %) and the joining
// bonuses paid. Backend /referral/settings and /referral/bonuses (admin only).

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${Cookies.get("session")}` } });
const inputCls = "w-full py-2 px-3 border rounded-lg text-[12px] font-[600] text-gray-700 outline-none focus:border-brand-primary";
const labelCls = "block text-[11px] font-[700] text-gray-600 mb-1";

function Shell({ title, onClose, children, footer, wide }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className={`bg-white rounded-lg shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[calc(100vh-2rem)] flex flex-col animate-popup-in`}>
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between shrink-0">
          <h2 className="text-[14px] font-bold text-gray-700">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-4 py-3 bg-gray-50 border-t flex gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export function ReferralSettingsModal({ onClose }) {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${REACT_APP_BACKEND_URL}/referral/settings`, auth())
      .then((res) => setS(res.data?.settings))
      .catch((err) => { Notification(err.response?.data?.message || "Could not load the referral programme", "error"); onClose(); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setBonus = (k, v) => setS((p) => ({ ...p, joiningBonus: { ...p.joiningBonus, [k]: v } }));
  const save = async () => {
    try {
      setSaving(true);
      const { data } = await axios.put(`${REACT_APP_BACKEND_URL}/referral/settings`, { joiningBonus: s.joiningBonus }, auth());
      Notification(data?.message || "Referral programme saved", "success");
      onClose();
    } catch (err) {
      Notification(err.response?.data?.message || "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  const b = s?.joiningBonus;
  return (
    <Shell
      title="Referral Programme"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={save} disabled={saving || !s} className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg text-[12px] font-bold disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
        </>
      }
    >
      {!s ? (
        <div className="flex justify-center py-10"><Loader /></div>
      ) : (
        <div className="p-4 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-[13px] font-bold text-gray-700">
              <input type="checkbox" checked={b.enabled} onChange={(e) => setBonus("enabled", e.target.checked)} className="w-4 h-4 accent-brand-primary" />
              <Gift className="w-4 h-4 text-brand-primary" /> Joining bonus
            </label>
            <p className="text-[11px] text-gray-500 mt-1">Paid once into the referrer's wallet when the referred user completes KYC and their <b>first</b> recharge is at least the amount below, within the days below of signing up.</p>
            {b.enabled && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><label className={labelCls}>Bonus (₹)</label><input type="number" min="0" value={b.amount} onChange={(e) => setBonus("amount", Number(e.target.value))} className={inputCls} /></div>
                <div><label className={labelCls}>First recharge at least (₹)</label><input type="number" min="0" value={b.minFirstRecharge} onChange={(e) => setBonus("minFirstRecharge", Number(e.target.value))} className={inputCls} /></div>
                <div><label className={labelCls}>Within (days of sign-up)</label><input type="number" min="1" value={b.withinDays} onChange={(e) => setBonus("withinDays", Number(e.target.value))} className={inputCls} /></div>
                <label className="flex items-end gap-2 pb-2 text-[12px] text-gray-600">
                  <input type="checkbox" checked={b.requireKyc} onChange={(e) => setBonus("requireKyc", e.target.checked)} className="w-4 h-4 accent-brand-primary" /> KYC required
                </label>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
            <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700"><Coins className="w-4 h-4 text-brand-primary" /> Monthly commission</div>
            <p className="text-[11px] text-gray-500 mt-1">Set in <b>Commission Plans</b>: slabs by the referred users' in-transit shipments in the month, each with its ₹ per shipment and badge — a default plan for everyone and plans for selected referrers. Credited to the referrer's wallet at month end.</p>
          </div>
        </div>
      )}
    </Shell>
  );
}

// ── Commission plans ─────────────────────────────────────────────────────────
export function SlabBadge({ badge, color }) {
  if (!badge) return null;
  const c = color || "#16a34a";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ color: c, backgroundColor: `${c}14`, border: `1px solid ${c}40` }}>
      <Award className="w-3 h-3" />{badge}
    </span>
  );
}

const slabText = (s) => `${Number(s.minShipments).toLocaleString("en-IN")}${s.maxShipments ? ` - ${Number(s.maxShipments).toLocaleString("en-IN")}` : "+"}`;
const userLabel = (u) => u?.company || u?.fullname || "-";

function ReferrerPicker({ value, onChange }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => {
      axios.get(`${REACT_APP_BACKEND_URL}/referral/referrers`, { ...auth(), params: { q: q.trim() } })
        .then((res) => setResults(res.data?.users || []))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  const has = (id) => value.some((u) => u._id === id);
  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {value.map((u) => (
            <span key={u._id} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-brand-secondary/20 border border-brand-secondary/40 text-[11px] font-bold text-gray-700">
              {userLabel(u)}
              <button type="button" onClick={() => onChange(value.filter((v) => v._id !== u._id))} className="text-gray-500 hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search referrers by name, company, email or user ID" className={`${inputCls} pl-8`} />
      </div>
      <div className="mt-1 max-h-36 overflow-y-auto border rounded-lg divide-y">
        {results.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-gray-400">No referrers found (only users who referred someone are listed).</p>
        ) : results.map((u) => (
          <label key={u._id} className="flex items-center gap-2 px-3 py-1.5 text-[12px] cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={has(u._id)} onChange={() => onChange(has(u._id) ? value.filter((v) => v._id !== u._id) : [...value, u])} className="w-3.5 h-3.5 accent-brand-primary" />
            <span className="font-[600] text-gray-700 truncate">{userLabel(u)}</span>
            <span className="text-gray-400 whitespace-nowrap">{u.userId} · {u.referred} referred</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function PlanEditor({ plan, onClose, onSaved }) {
  const [d, setD] = useState({ ...plan, slabs: plan.slabs.map((s) => ({ ...s })), users: [...(plan.users || [])] });
  const [saving, setSaving] = useState(false);
  const setSlab = (i, k, v) => setD((p) => ({
    ...p,
    slabs: p.slabs.map((s, j) => (j !== i ? s : { ...s, [k]: k === "badge" || k === "color" ? v : k === "maxShipments" && v === "" ? null : Number(v) })),
  }));
  const save = async () => {
    try {
      setSaving(true);
      const body = { name: d.name, slabs: d.slabs, users: d.users.map((u) => u._id) };
      const { data } = d._id
        ? await axios.put(`${REACT_APP_BACKEND_URL}/referral/plans/${d._id}`, body, auth())
        : await axios.post(`${REACT_APP_BACKEND_URL}/referral/plans`, body, auth());
      Notification(data?.message || "Commission plan saved", "success");
      onSaved();
      onClose();
    } catch (err) {
      Notification(err.response?.data?.message || "Could not save the plan", "error");
    } finally {
      setSaving(false);
    }
  };
  const small = "w-full py-1.5 px-2 border rounded text-[12px] outline-none focus:border-brand-primary";
  return (
    <Shell
      title={d._id ? `Edit ${d.name}` : "New Commission Plan"}
      onClose={onClose}
      wide
      footer={
        <>
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg text-[12px] font-bold disabled:opacity-50">{saving ? "Saving..." : "Save Plan"}</button>
        </>
      }
    >
      <div className="p-4 space-y-4">
        <div><label className={labelCls}>Plan name</label><input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={inputCls} /></div>
        {d.isDefault ? (
          <p className="text-[11px] text-gray-500 bg-gray-50 rounded px-3 py-2">This is the default plan — it applies to every referrer who is not on another plan.</p>
        ) : (
          <div><label className={labelCls}>Applies to</label><ReferrerPicker value={d.users} onChange={(users) => setD({ ...d, users })} /></div>
        )}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] font-bold text-gray-700">Slabs</p>
            <button
              type="button"
              onClick={() => setD((p) => ({ ...p, slabs: [...p.slabs, { minShipments: (p.slabs[p.slabs.length - 1]?.maxShipments ?? p.slabs[p.slabs.length - 1]?.minShipments ?? 0) + 1, maxShipments: null, ratePerShipment: 0, badge: "", color: "#16a34a" }] }))}
              className="text-[12px] font-bold text-brand-primary inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add slab
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mb-2">The month's in-transit shipments of all the referrer's referred users pick the slab on the last day of the month; commission = all those shipments × that slab's ₹ rate. Leave "To" empty for "and above".</p>
          <div className="grid grid-cols-[1fr_1fr_80px_1fr_48px_28px] gap-2 text-[11px] font-bold text-gray-500 mb-1"><span>From</span><span>To</span><span>₹ / shipment</span><span>Badge</span><span>Color</span><span /></div>
          <div className="space-y-2">
            {d.slabs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_80px_1fr_48px_28px] gap-2 items-center">
                <input type="number" min="0" value={s.minShipments} onChange={(e) => setSlab(i, "minShipments", e.target.value)} className={small} />
                <input type="number" min="0" value={s.maxShipments ?? ""} placeholder="and above" onChange={(e) => setSlab(i, "maxShipments", e.target.value)} className={small} />
                <input type="number" min="0" step="0.05" value={s.ratePerShipment} onChange={(e) => setSlab(i, "ratePerShipment", e.target.value)} className={small} />
                <input value={s.badge} onChange={(e) => setSlab(i, "badge", e.target.value)} placeholder="e.g. Gold" className={small} />
                <input type="color" value={s.color || "#16a34a"} onChange={(e) => setSlab(i, "color", e.target.value)} className="h-8 w-full border rounded cursor-pointer" />
                <button type="button" onClick={() => setD((p) => ({ ...p, slabs: p.slabs.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function ReferralPlansModal({ onClose }) {
  const [plans, setPlans] = useState(null);
  const [editing, setEditing] = useState(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    axios.get(`${REACT_APP_BACKEND_URL}/referral/plans`, auth())
      .then((res) => setPlans(res.data?.plans || []))
      .catch((err) => { Notification(err.response?.data?.message || "Could not load the plans", "error"); setPlans([]); });
  }, [reload]);
  const def = plans?.find((p) => p.isDefault);
  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? Its referrers go back to the default plan.`)) return;
    try {
      const { data } = await axios.delete(`${REACT_APP_BACKEND_URL}/referral/plans/${p._id}`, auth());
      Notification(data?.message || "Plan deleted", "success");
      setReload((x) => x + 1);
    } catch (err) {
      Notification(err.response?.data?.message || "Could not delete", "error");
    }
  };
  return (
    <Shell title="Referral Commission Plans" onClose={onClose} wide>
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-gray-500 max-w-xl">The default plan covers every referrer; a plan for selected referrers overrides it for them. Commission is calculated and credited to the wallet at month end.</p>
          {def && (
            <button onClick={() => setEditing({ name: "", users: [], slabs: def.slabs.map((s) => ({ ...s })) })} className="px-3 py-2 bg-brand-primary text-white rounded-lg text-[12px] font-bold inline-flex items-center gap-1">
              <Plus className="w-4 h-4" /> Plan for selected referrers
            </button>
          )}
        </div>
        {!plans ? (
          <div className="flex justify-center py-10"><Loader /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {plans.map((p) => (
              <div key={p._id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-700 truncate">
                      {p.name} {p.isDefault && <span className="ml-1 text-[9px] font-bold uppercase text-brand-primary">Default</span>}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{p.isDefault ? "Every referrer not on another plan" : p.users.map(userLabel).join(", ")}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(p)} className="p-1 text-gray-500 hover:text-brand-primary"><Pencil className="w-4 h-4" /></button>
                    {!p.isDefault && <button onClick={() => remove(p)} className="p-1 text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
                <table className="w-full mt-2 text-[11px]">
                  <tbody>
                    {p.slabs.map((s) => (
                      <tr key={s.minShipments} className="border-t border-gray-100">
                        <td className="py-1 text-gray-500">{slabText(s)} shipments</td>
                        <td className="py-1 font-bold text-gray-700">₹{s.ratePerShipment} / shipment</td>
                        <td className="py-1 text-right"><SlabBadge badge={s.badge} color={s.color} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
      {editing && <PlanEditor plan={editing} onClose={() => setEditing(null)} onSaved={() => setReload((x) => x + 1)} />}
    </Shell>
  );
}

// One user's plan (user details screen)
export function UserPlanModal({ userId, onClose, onSaved }) {
  const [plans, setPlans] = useState(null);
  const [current, setCurrent] = useState("");
  const [choice, setChoice] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    Promise.all([
      axios.get(`${REACT_APP_BACKEND_URL}/referral/plans`, auth()),
      axios.get(`${REACT_APP_BACKEND_URL}/referral/plans/user/${userId}`, auth()),
    ])
      .then(([a, b]) => { setPlans(a.data?.plans || []); setCurrent(b.data?.plan?._id || ""); setChoice(b.data?.plan?._id || ""); })
      .catch((err) => { Notification(err.response?.data?.message || "Could not load the plans", "error"); onClose(); });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps
  const chosen = plans?.find((p) => p._id === choice);
  const save = async () => {
    try {
      setSaving(true);
      const { data } = await axios.put(`${REACT_APP_BACKEND_URL}/referral/plans/assign`, { userId, planId: chosen?.isDefault ? null : choice }, auth());
      Notification(data?.message || "Commission plan updated", "success");
      onSaved(data?.plan?.name || chosen?.name || "");
      onClose();
    } catch (err) {
      Notification(err.response?.data?.message || "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Shell
      title="Referral Commission Plan"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={save} disabled={saving || !choice || choice === current} className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg text-[12px] font-bold disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
        </>
      }
    >
      {!plans ? (
        <div className="flex justify-center py-10"><Loader /></div>
      ) : (
        <div className="p-4 space-y-2">
          <p className="text-[11px] text-gray-500">The monthly commission this user earns on the shipments of the users they referred. Create or edit plans in Referral → Commission Plans.</p>
          {plans.map((p) => (
            <label key={p._id} className={`block border rounded-lg p-2.5 cursor-pointer ${choice === p._id ? "border-brand-primary bg-brand-secondary/10" : "hover:bg-gray-50"}`}>
              <div className="flex items-center gap-2">
                <input type="radio" checked={choice === p._id} onChange={() => setChoice(p._id)} className="accent-brand-primary" />
                <span className="text-[12px] font-bold text-gray-700">{p.name}</span>
                {p.isDefault && <span className="text-[9px] font-bold uppercase text-brand-primary">Default</span>}
              </div>
              <div className="mt-1 pl-5 flex flex-wrap gap-1">
                {p.slabs.map((s) => (
                  <span key={s.minShipments} className="text-[10px] text-gray-600 border rounded-full px-2 py-0.5">{slabText(s)}: <b>₹{s.ratePerShipment}</b> / shipment{s.badge ? ` · ${s.badge}` : ""}</span>
                ))}
              </div>
            </label>
          ))}
        </div>
      )}
    </Shell>
  );
}

export function ReferralBonusesModal({ onClose }) {
  const [rows, setRows] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    axios.get(`${REACT_APP_BACKEND_URL}/referral/bonuses`, { ...auth(), params: { page, limit: 50 } })
      .then((res) => { setRows(res.data?.bonuses || []); setTotalPages(res.data?.totalPages || 1); })
      .catch(() => setRows([]));
  }, [page]);

  const name = (u) => u?.company || u?.fullname || "-";
  return (
    <Shell title="Joining Bonuses Paid" onClose={onClose} wide>
      {!rows ? (
        <div className="flex justify-center py-10"><Loader /></div>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-[12px] text-gray-400">No joining bonus has been paid yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead className="bg-brand-primary text-white text-[12px] font-[600]">
              <tr className="text-left">
                <th className="py-2 px-3">Credited</th>
                <th className="py-2 px-3">Referrer</th>
                <th className="py-2 px-3">Referred User</th>
                <th className="py-2 px-3">First Recharge</th>
                <th className="py-2 px-3">Bonus</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {rows.map((r) => (
                <tr key={r._id} className="border-b border-gray-200">
                  <td className="py-2 px-3">{r.status === "credited" ? dayjs(r.creditedAt).format("DD MMM YYYY") : <span className="text-amber-600 font-bold">Processing</span>}</td>
                  <td className="py-2 px-3"><p className="font-bold">{name(r.referrer)}</p><p className="text-[10px] text-gray-400">{r.referrer?.userId}</p></td>
                  <td className="py-2 px-3"><p className="font-bold">{name(r.referredUser)}</p><p className="text-[10px] text-gray-400">{r.referredUser?.userId}</p></td>
                  <td className="py-2 px-3">₹{Number(r.rechargeAmount || 0).toFixed(2)}</td>
                  <td className="py-2 px-3 font-bold text-brand-primary">₹{Number(r.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-end items-center gap-2 px-3 py-2">
              <button disabled={page <= 1} onClick={() => { setRows(null); setPage((p) => p - 1); }} className="px-3 py-1 border rounded text-[12px] disabled:opacity-40">Previous</button>
              <span className="text-[12px] text-gray-500">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => { setRows(null); setPage((p) => p + 1); }} className="px-3 py-1 border rounded text-[12px] disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}
