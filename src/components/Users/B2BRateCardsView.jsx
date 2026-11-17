// A seller's B2B (Cargo) rate card: per service, the zone-to-zone price matrix (₹/kg) and every charge, in words.
// Data from GET /b2b/myRateCard?userId= (Shipex-backend B2B/utils/b2bRateCardView.js) — that seller's own copy.
// Used in Users -> user details -> Ratecard Management -> B2B (the B2C side keeps the B2C weight-slab table).
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const B2BRateCardsView = ({ userId, reloadKey = 0 }) => {
  const [cards, setCards] = useState([]);
  const [planName, setPlanName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setCards([]); // never show the previous seller's rates while this one loads
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/b2b/myRateCard`, {
        headers: { Authorization: `Bearer ${Cookies.get("session")}` },
        params: userId ? { userId } : {},
      });
      setCards(res.data?.rateCards || []);
      setPlanName(res.data?.planName || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load the B2B rate card");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  if (loading) return <p className="text-center py-8 text-[12px] text-gray-500">Loading B2B rate cards…</p>;
  if (error) return <p className="text-center py-8 text-[12px] text-red-500">{error}</p>;
  if (!cards.length) {
    return <p className="text-center py-8 text-[12px] text-gray-500">No B2B rate cards{planName ? ` in plan "${planName}"` : ""} yet.</p>;
  }

  return (
    <div className="space-y-3">
      {planName && (
        <p className="text-[10px] sm:text-[12px] text-gray-500">
          B2B plan: <span className="font-[600] text-gray-700">{planName}</span> · prices are ₹ per kg, from zone (rows) to zone (columns)
        </p>
      )}
      {cards.map((card) => (
        <div key={card._id || card.courierServiceName} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
            <div className="min-w-0">
              <p className="text-[12px] sm:text-[13px] font-[600] text-gray-700 truncate">{card.courierServiceName}</p>
              <p className="text-[10px] sm:text-[11px] text-gray-500">{card.mode}</p>
            </div>
            <span className={`text-[10px] font-[600] px-2 py-0.5 rounded-full shrink-0 ${card.status === "Active" ? "bg-brand-primary/10 text-brand-primary" : "bg-gray-100 text-gray-400"}`}>
              {card.status}
            </span>
          </div>

          {card.zones?.from?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-brand-secondary text-white">
                    <th className="px-2 py-1.5 text-[10px] sm:text-[12px] font-[600] text-left whitespace-nowrap">From \ To</th>
                    {card.zones.to.map((z) => (
                      <th key={z} className="px-2 py-1.5 text-[10px] sm:text-[12px] font-[600] whitespace-nowrap">{z}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {card.zones.from.map((from) => (
                    <tr key={from} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 text-[10px] sm:text-[12px] font-[600] text-gray-700 text-left whitespace-nowrap">{from}</td>
                      {card.zones.to.map((to) => {
                        const price = card.zones.prices?.[from]?.[to];
                        return (
                          <td key={to} className="px-2 py-1.5 text-[10px] sm:text-[12px] text-gray-600 whitespace-nowrap">
                            {price != null ? `₹${price}` : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-3 py-2 text-[12px] text-gray-400">No zone prices set.</p>
          )}

          <div className="px-3 py-2 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            {(card.charges || []).map((c) => (
              <div key={c.label} className="flex justify-between gap-2">
                <span className="text-[10px] sm:text-[12px] text-gray-500">{c.label}</span>
                <span className="text-[10px] sm:text-[12px] text-gray-700 text-right">{c.value}</span>
              </div>
            ))}
          </div>
          {card.ifApplicable?.length > 0 && (
            <div className="px-3 pb-2">
              <p className="text-[9px] font-[600] text-gray-400 uppercase tracking-wide mb-0.5">Charged only if it happens</p>
              <p className="text-[10px] sm:text-[12px] text-gray-500">{card.ifApplicable.map((c) => `${c.label}: ${c.value}`).join(" · ")}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default B2BRateCardsView;
