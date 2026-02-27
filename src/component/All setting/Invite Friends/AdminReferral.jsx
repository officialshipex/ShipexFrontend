import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import { Filter, ChevronDown, Users, Truck, CircleDollarSign, Wallet, MoreHorizontal, Eye } from "lucide-react";
import Loader from "../../../Loader";
import ReferralDetailsModal from "./ReferralDetailsModal";
import ReferralFilterPanel from "../../../Common/ReferralFilterPanel";
import NotFound from "../../../assets/nodatafound.png";
import UserFilter from "../../../filter/UserFilter";
import PaginationFooter from "../../../Common/PaginationFooter";

const AdminReferral = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalCommission: 0,
    totalShipping: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [selectedReferById, setSelectedReferById] = useState(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [clearTrigger, setClearTrigger] = useState(0);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchReferralStats();
  }, [selectedMonth, selectedYear, selectedReferById, page, limit]);

  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("session");
      if (!token) return;

      const res = await axios.get(
        `${REACT_APP_BACKEND_URL}/referral/getAllReferralStats`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            month: selectedMonth,
            year: selectedYear,
            referById: selectedReferById,
            page,
            limit,
          },
        }
      );
      setData(res.data?.referrals || []);
      setSummary(res.data?.summary || {});
      setTotalPages(res.data?.totalPages || 1);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin referral data:", err);
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedReferById(null);
    setSelectedMonth("");
    setSelectedYear("");
    setClearTrigger(prev => prev + 1);
    setPage(1);
  };

  const isAnyFilterApplied = selectedMonth || selectedYear || selectedReferById;

  const summaryCards = [
    { title: "Total Referrers", value: summary.totalUsers || 0, icon: <Users className="w-4 h-4" /> },
    { title: "Total Referral Orders", value: summary.totalOrders || 0, icon: <Truck className="w-4 h-4" /> },
    {
      title: "Total Shipping",
      value: `₹${Number(summary.totalShipping || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <CircleDollarSign className="w-4 h-4" />
    },
    {
      title: "Total Commission",
      value: `₹${Number(summary.totalCommission || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <Wallet className="w-4 h-4" />
    },
  ];

  return (
    <div className="space-y-2 sm:px-2">
      {/* Summary Section - Mobile View */}
      <div className="sm:hidden bg-white border border-[#0CBB7D] rounded-lg p-3 shadow-sm space-y-1">
        {summaryCards.map((card, i) => (
          <div key={i} className="flex justify-between items-center last:border-0 last:pb-0">
            {/* <div className="flex items-center gap-3"> */}
              
              <span className="text-[10px] font-bold text-gray-500">{card.title}</span>
            {/* </div> */}
            <span className="text-[10px] font-bold text-gray-700">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Summary Grid - Desktop/Tablet View */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-2">
        {summaryCards.map((card, i) => (
          <div key={i} className="bg-white border border-[#0CBB7D] rounded-lg p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
            <div className="p-2 rounded-full flex justify-center items-center bg-[#0CBB7D] text-white">
              {card.icon}
            </div>
            <div className="flex flex-col font-[600] leading-tight overflow-hidden">
              <p className="text-[12px] text-gray-500 truncate">{card.title}</p>
              <p className="text-[12px] font-[600] text-gray-700 truncate">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="">
          <UserFilter onUserSelect={setSelectedReferById} clearTrigger={clearTrigger} />
        </div>
        <button
          onClick={() => setIsFilterPanelOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm h-9 whitespace-nowrap"
        >
          <Filter className="w-4 h-4 text-[#0CBB7D]" />
          <span className="hidden xs:inline">More Filters</span>
          <span className="xs:hidden">More Filters</span>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {isAnyFilterApplied && (
            <button
              onClick={handleClearFilters}
              className="text-[12px] text-red-500 hover:underline font-[600] px-2 whitespace-nowrap"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden bg-white shadow-sm">
            <div className="h-[calc(100vh-235px)] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="bg-[#0CBB7D] text-white font-[600] sticky top-0 z-10">
                  <tr className="text-left text-[12px]">
                    <th className="py-2 px-3">Refer By (User ID)</th>
                    <th className="py-2 px-3">Contact Details</th>
                    <th className="py-2 px-3">Referral Orders</th>
                    <th className="py-2 px-3">Total Shipping</th>
                    <th className="py-2 px-3">Commission</th>
                    <th className="py-2 px-3">Period</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-gray-700">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center">
                        <div className="flex flex-col items-center">
                          <img src={NotFound} alt="No Data" className="w-60 h-60" />
                          {/* <p className="text-gray-400 font-medium mt-2">No referral data found</p> */}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.map((row, i) => (
                      <tr key={i} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-3">
                          <p className="font-bold text-[#0CBB7D]">{row.userId || "-"}</p>
                          <p className="text-gray-900 font-medium">{row.userName}</p>
                        </td>
                        <td className="py-2 px-3">
                          <p>{row.email || "-"}</p>
                          <p className="text-gray-400">{row.mobile || "-"}</p>
                        </td>
                        <td className="py-2 px-3 font-bold text-gray-700">
                          {row.totalOrderCount || 0}
                        </td>
                        <td className="py-2 px-3 font-bold text-[#0CBB7D]">
                          ₹{Number(row.totalShipping || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 font-bold text-[#0CBB7D]">
                          ₹{Number(row.totalCommission || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-gray-600 text-[12px]">
                            {dayjs().month(row.month - 1).format("MMMM")} {row.year}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => setSelectedReferral(row)}
                            className="px-3 py-1 bg-green-50 hover:bg-green-100 text-[#0CBB7D] rounded-lg text-[11px] font-bold transition-all"
                            title="View Details"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-2">
            {data.length === 0 ? (
              <div className="bg-white rounded-lg p-10 text-center border">
                <img src={NotFound} alt="No Data" className="w-60 h-60 mx-auto" />
                {/* <p className="text-gray-400 text-[12px]">No data found</p> */}
              </div>
            ) : (
              data.map((row, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm relative animate-popup-in">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-50 pb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[#0CBB7D] font-bold text-[11px] leading-tight">{row.userId || "-"}</p>
                      <h4 className="text-gray-800 font-bold text-[13px] truncate leading-tight">{row.userName}</h4>
                    </div>
                    <button
                      onClick={() => setSelectedReferral(row)}
                      className="px-3 py-1 bg-green-50 text-[#0CBB7D] rounded-lg text-[11px] font-bold border border-green-100 hover:bg-green-100 transition-all ml-2 h-7 flex items-center shrink-0"
                    >
                      Details
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-gray-50/50 p-1.5 rounded border border-gray-100/50">
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-tight">Orders</p>
                      <p className="font-bold text-gray-700 text-[11px]">{row.totalOrderCount || 0}</p>
                    </div>
                    <div className="bg-gray-50/50 p-1.5 rounded border border-gray-100/50">
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-tight">Freight</p>
                      <p className="font-bold text-gray-700 text-[11px]">₹{Math.round(row.totalShipping || 0)}</p>
                    </div>
                    <div className="bg-green-50/30 p-1.5 rounded border border-green-100/20">
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-tight">Reward</p>
                      <p className="font-bold text-[#0CBB7D] text-[11px]">₹{Math.round(row.totalCommission || 0)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-gray-50/30 px-2 py-1.5 rounded">
                    <div className="flex flex-col min-w-0">
                      <p className="text-gray-600 truncate font-medium">{row.email}</p>
                      <p className="text-gray-400 text-[10px]">{row.mobile}</p>
                    </div>
                    <span className="bg-white border px-1.5 py-0.5 rounded text-[10px] text-gray-500 font-medium shrink-0 ml-2">
                      {dayjs().month(row.month - 1).format("MMM YY")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {data.length > 0 && (
            <PaginationFooter
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              limit={limit}
              setLimit={setLimit}
            />
          )}
        </>
      )}

      {/* Filter Panel */}
      <ReferralFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        selectedReferById={selectedReferById}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onClearFilters={handleClearFilters}
        onApplyFilters={(filters) => {
          setSelectedReferById(filters.selectedReferById);
          setSelectedMonth(filters.selectedMonth);
          setSelectedYear(filters.selectedYear);
          setIsFilterPanelOpen(false);
          setPage(1);
        }}
        showUserFilter={false}
      />

      {/* Modal */}
      {selectedReferral && (
        <ReferralDetailsModal
          referral={selectedReferral}
          onClose={() => setSelectedReferral(null)}
        />
      )}
    </div>
  );
};

export default AdminReferral;

