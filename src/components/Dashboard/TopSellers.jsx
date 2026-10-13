import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Loader from "../../Loader";

const headers = ["Total Orders", "Revenue", "Delivery Rate", "COD Amount", "RTO Rate", "Wallet Balance"];

const fmtN = (n) => Number(n || 0).toLocaleString("en-IN");
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

const rtoColor = (v) => (v < 5 ? "text-green-600 bg-green-50" : v < 15 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50");
const deliveryColor = (v) => (v >= 80 ? "text-green-600 bg-green-50" : v >= 50 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50");
const rankColors = ["bg-yellow-400 text-white", "bg-gray-400 text-white", "bg-amber-600 text-white"];

const Avatar = ({ s, size }) =>
  s.profileImage ? (
    <img src={s.profileImage} alt={s.name} className={`${size} rounded-full object-cover shrink-0 border border-gray-300`} />
  ) : (
    <div className={`${size} rounded-full bg-brand-secondary/16 text-brand-primary flex items-center justify-center shrink-0 font-[600] text-[12px] border border-brand-primary/20`}>
      {initials(s.name)}
    </div>
  );

const TopSellers = ({ selectedDateRange, refresh }) => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const token = Cookies.get("session");
        const params = {};
        if (selectedDateRange && selectedDateRange.length > 0) {
          params.startDate = new Date(selectedDateRange[0].startDate);
          params.endDate = new Date(selectedDateRange[0].endDate);
        }
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/dashboard/topSellersData`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        if (!cancelled) setSellers(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching top sellers:", err);
        if (!cancelled) setSellers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedDateRange, refresh]);

  const empty = <div className="py-10 text-center text-[12px] text-gray-500">No seller data available for this period</div>;

  return (
    <div className="w-full mt-4 mb-4">
      <h3 className="text-[14px] font-[600] text-gray-700 mb-2">Top Performing Sellers</h3>

      {/* Desktop */}
      <div className="hidden md:block overflow-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-[12px]">
          <thead className="bg-brand-primary">
            <tr className="text-white font-[600]">
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left">Seller Details</th>
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 text-center whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={headers.length + 2} className="py-10">
                  <div className="flex justify-center"><Loader /></div>
                </td>
              </tr>
            ) : sellers.length === 0 ? (
              <tr><td colSpan={headers.length + 2}>{empty}</td></tr>
            ) : (
              sellers.map((s, i) => (
                <tr key={i} className="bg-white text-gray-700 border-b border-gray-300">
                  <td className="px-3 py-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-[600] ${rankColors[i] || "bg-gray-200 text-gray-600"}`}>
                      {i + 1}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar s={s} size="w-9 h-9" />
                      <div className="flex flex-col">
                        <span className="font-[600]">{s.name}</span>
                        <span className="text-gray-500 font-[500] text-[10px]">{s.company !== "—" ? s.company : s.email}</span>
                        {s.company !== "—" && <span className="text-gray-400 text-[10px]">{s.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">{fmtN(s.totalOrders)}</td>
                  <td className="px-3 py-2 text-center text-brand-primary">{fmt(s.totalRevenue)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full ${deliveryColor(parseFloat(s.deliveryRate || 0))}`}>{s.deliveryRate}%</span>
                  </td>
                  <td className="px-3 py-2 text-center">{fmt(s.codAmount)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full ${rtoColor(parseFloat(s.rtoRate || 0))}`}>{s.rtoRate}%</span>
                  </td>
                  <td className="px-3 py-2 text-center text-brand-primary">{fmt(s.walletBalance)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden w-full space-y-2 max-h-[480px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Loader /></div>
        ) : sellers.length === 0 ? (
          empty
        ) : (
          sellers.map((s, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 w-full box-border">
              <div className="flex items-center bg-brand-secondary/16 rounded-lg p-2 gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-[600] shrink-0 ${rankColors[i] || "bg-gray-200 text-gray-600"}`}>
                  {i + 1}
                </div>
                <Avatar s={s} size="w-10 h-10" />
                <div className="min-w-0">
                  <div className="text-[12px] font-[600] text-gray-700 truncate">{s.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{s.company !== "—" ? s.company : s.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                {[
                  { label: "Orders", value: fmtN(s.totalOrders), color: "text-gray-700" },
                  { label: "Revenue", value: fmt(s.totalRevenue), color: "text-brand-primary" },
                  { label: "COD", value: fmt(s.codAmount), color: "text-gray-700" },
                  { label: "Wallet", value: fmt(s.walletBalance), color: "text-brand-primary" },
                  { label: "Delivery Rate", value: `${s.deliveryRate}%`, color: "text-gray-700" },
                  { label: "RTO Rate", value: `${s.rtoRate}%`, color: "text-red-500" },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 border border-brand-primary rounded-lg px-2 py-1">
                    <div className="text-gray-500">{item.label}</div>
                    <div className={`font-[600] ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopSellers;
