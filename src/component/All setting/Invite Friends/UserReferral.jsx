import React, { useState, useEffect } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import axios from "axios";
import dayjs from "dayjs";
import Cookies from "js-cookie";
import { Filter, Users, Truck, CircleDollarSign, Wallet, Lock, Info, ExternalLink } from "lucide-react";
import Loader from "../../../Loader";
import { Notification } from "../../../Notification";
import ReferralFilterPanel from "../../../Common/ReferralFilterPanel";
import NotFound from "../../../assets/nodatafound.png";
import PaginationFooter from "../../../Common/PaginationFooter";

const Referral = () => {
  const [stats, setStats] = useState({
    referredFriends: 0,
    referralOrders: 0,
    totalShipping: 0,
    totalCommission: 0,
    withdrawn: 0,
    remaining: 0,
  });

  const [referralUrl, setReferralUrl] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commissionPercentage, setCommissionPercentage] = useState(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("session");
        if (!token) return;

        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/user/getUserDetails`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReferralCode(response.data.user.referralCode);
      } catch (err) {
        console.error("Error fetching user details", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (referralCode) {
      setReferralUrl(`${window.location.origin}/register?code=${referralCode}`);
      fetchReferralData();
    }
  }, [referralCode, selectedMonth, selectedYear, page, limit]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("session");
      if (!token) return;

      const { data } = await axios.get(
        `${REACT_APP_BACKEND_URL}/referral/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { month: selectedMonth, year: selectedYear, page, limit },
        }
      );
      setStats(data.stats);
      setMonthlyData(data.monthlyData);
      setTotalPages(data.totalPages || 1);
      setCommissionPercentage(data.referralCommissionPercentage);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load referral data", err);
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedMonth("");
    setSelectedYear("");
    setPage(1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    Notification("Referral link copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const statsArray = [
    { title: "Referred Friends", value: stats.referredFriends, icon: <Users className="w-4 h-4" /> },
    { title: "Referral Orders", value: stats.referralOrders, icon: <Truck className="w-4 h-4" /> },
    { title: "Total Shipping", value: `₹${Number(stats.totalShipping || 0).toFixed(2)}`, icon: <CircleDollarSign className="w-4 h-4" /> },
    { title: "Total Commission", value: `₹${Number(stats.totalCommission || 0).toFixed(2)}`, icon: <Wallet className="w-4 h-4" /> },
    { title: "Withdrawn", value: `₹${Number(stats.withdrawn || 0).toFixed(2)}`, icon: <Lock className="w-4 h-4" /> },
    { title: "Remaining", value: `₹${Number(stats.remaining || 0).toFixed(2)}`, icon: <Info className="w-4 h-4" /> },
  ];

  const isAnyFilterApplied = selectedMonth || selectedYear;

  return (
    <div className="space-y-2">
      {/* Header & Description */}
      <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm relative overflow-hidden">
        {/* <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
          <ExternalLink className="w-12 h-12 text-[#0CBB7D]" />
        </div> */}
        <h1 className="text-[14px] font-[700] text-gray-700 mb-1">Referral Dashboard</h1>
        <p className="text-gray-500 text-[11px] max-w-2xl">
          Get commission from referral revenue at the end of every month. You can withdraw this commission directly to your wallet.
          {commissionPercentage !== null && (
            <span className="block mt-1 font-bold text-[#0CBB7D]">You currently earn {commissionPercentage}% commission on your referral revenue.</span>
          )}
        </p>
      </div>

      {/* Stats Cards - Mobile View */}
      <div className="sm:hidden bg-white border border-[#0CBB7D] rounded-lg p-3 shadow-sm space-y-1">
        {statsArray.map((card, i) => (
          <div key={i} className="flex justify-between items-center last:border-0 last:pb-0">
            {/* <div className="flex items-center gap-3"> */}
              
              <span className="text-[10px] font-bold text-gray-500">{card.title}</span>
            {/* </div> */}
            <span className="text-[10px] font-bold text-gray-700">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Stats Cards - Desktop View */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {statsArray.map((card, i) => (
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

      {/* Link & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-2 items-stretch">
        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-2 flex items-center gap-3 shadow-sm overflow-hidden">
          <span className="text-[12px] font-bold text-gray-500 whitespace-nowrap ml-1">Your Referral Link:</span>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="w-full bg-gray-50 border-none px-2 py-1 text-[12px] text-gray-700 focus:outline-none truncate rounded"
            />
          </div>
          <button
            onClick={handleCopy}
            className={`p-2 rounded-lg transition-all flex-shrink-0 ${copied ? "bg-[#0CBB7D] text-white" : "bg-gray-100 text-[#0CBB7D] hover:bg-green-100"}`}
          >
            {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm h-full"
          >
            <Filter className="w-4 h-4 text-[#0CBB7D]" />
            More Filter
          </button>
          {isAnyFilterApplied && (
            <button
              onClick={handleClearFilters}
              className="text-[11px] text-red-500 hover:underline font-[600] px-2"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Table / Cards Container */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden bg-white shadow-sm">
            <div className="h-[calc(100vh-340px)] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="bg-[#0CBB7D] text-white font-[600] sticky top-0 z-10 text-[12px]">
                  <tr className="text-left">
                    <th className="py-2 px-3">Period</th>
                    <th className="py-2 px-3 text-center">Orders</th>
                    <th className="py-2 px-3">Shipping Charges</th>
                    <th className="py-2 px-3">Commission</th>
                    <th className="py-2 px-3">Date Range</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-gray-700">
                  {monthlyData.length > 0 ? (
                    monthlyData.map((row, i) => (
                      <tr key={i} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-gray-900">{row.month}</td>
                        <td className="py-3 px-3 font-bold">{row.referralOrders}</td>
                        <td className="py-3 px-3 font-bold text-[#0CBB7D]">₹{Number(row.shippingCharges || 0).toFixed(2)}</td>
                        <td className="py-3 px-3 font-bold text-[#0CBB7D]">₹{Number(row.commission || 0).toFixed(2)}</td>
                        <td className="py-3 px-3">
                          <span className="text-gray-500 rounded text-[12px]">
                            {dayjs(row.fromDate).format("DD MMM YYYY")} - {dayjs(row.toDate).format("DD MMM YYYY")}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center">
                        <div className="flex flex-col items-center">
                          <img src={NotFound} alt="No Data" className="w-40 h-40 opacity-50" />
                          <p className="text-gray-400 mt-2 font-medium">No referral data found for selection</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-2">
            {monthlyData.length > 0 ? (
              monthlyData.map((row, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm animate-popup-in">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-50 pb-2">
                    <h3 className="font-bold text-gray-800 text-[13px] leading-tight">{row.month}</h3>
                    <span className="text-[9px] bg-green-50 text-[#0CBB7D] px-2 py-0.5 rounded font-bold uppercase tracking-tight border border-green-100/50">Active Period</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-gray-50/50 p-1.5 rounded border border-gray-100/50">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Orders</p>
                      <p className="text-[11px] font-bold text-gray-700">{row.referralOrders}</p>
                    </div>
                    <div className="bg-gray-50/50 p-1.5 rounded border border-gray-100/50">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Freight</p>
                      <p className="text-[11px] font-bold text-gray-700">₹{Math.round(row.shippingCharges || 0)}</p>
                    </div>
                    <div className="bg-green-50/30 p-1.5 rounded border border-green-100/20">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Reward</p>
                      <p className="text-[11px] font-bold text-[#0CBB7D]">₹{Math.round(row.commission || 0)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1.5 mt-1 border-t border-gray-50">
                    <span className="font-medium bg-gray-50 px-1.5 py-0.5 rounded">Duration</span>
                    <span className="font-medium text-gray-500">{dayjs(row.fromDate).format("DD MMM")} - {dayjs(row.toDate).format("DD MMM YY")}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg p-10 text-center border">
                <img src={NotFound} alt="No Data" className="w-32 h-32 mx-auto opacity-50 mb-2" />
                <p className="text-gray-400 text-[12px]">No records found</p>
              </div>
            )}
          </div>

          {monthlyData.length > 0 && (
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
        showUserFilter={false} // Users only see their own
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onClearFilters={handleClearFilters}
        onApplyFilters={(filters) => {
          setSelectedMonth(filters.selectedMonth);
          setSelectedYear(filters.selectedYear);
          setIsFilterPanelOpen(false);
          setPage(1);
        }}
      />
    </div>
  );
};

export default Referral;

