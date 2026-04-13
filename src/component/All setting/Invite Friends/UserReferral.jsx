import React, { useState, useEffect, useRef } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import axios from "axios";
import dayjs from "dayjs";
import Cookies from "js-cookie";
import { Filter, Users, Truck, CircleDollarSign, Wallet, Lock, Info, ExternalLink, ChevronDown, Download, CheckSquare, Square } from "lucide-react";
import * as XLSX from "xlsx";
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
  const [withdrawing, setWithdrawing] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const actionDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target)) {
        setIsActionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      Notification("Please enter a valid amount", "error");
      return;
    }
    if (amount > Number(stats.remaining)) {
      Notification("Insufficient referral commission balance", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to transfer ₹${amount.toFixed(2)} to your wallet?`)) {
      return;
    }

    try {
      setWithdrawing(true);
      const token = Cookies.get("session");
      const { data } = await axios.post(
        `${REACT_APP_BACKEND_URL}/referral/withdraw`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        Notification(data.message, "success");
        setIsWithdrawModalOpen(false);
        setWithdrawAmount("");
        fetchReferralData(); // Refresh stats
      }
    } catch (err) {
      console.error("Withdrawal failed", err);
      Notification(err.response?.data?.message || "Transfer failed. Please try again.", "error");
      setWithdrawing(false);
    }
  };

  const handleExport = () => {
    if (selectedRows.length === 0) {
      Notification("Please select at least one row to export", "error");
      return;
    }

    const exportData = selectedRows.map(row => ({
      Month: row.month,
      Orders: row.referralOrders,
      "Shipping Charges": row.shippingCharges,
      Commission: row.commission,
      "From Date": dayjs(row.fromDate).format("DD-MM-YYYY"),
      "To Date": dayjs(row.toDate).format("DD-MM-YYYY")
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Referral Stats");
    XLSX.writeFile(wb, `Referral_Stats_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    Notification("Exporting selected data to Excel...", "success");
    setIsActionDropdownOpen(false);
  };

  const handleSelectRow = (row) => {
    setSelectedRows(prev => {
      const exists = prev.find(r => r._id === row._id);
      if (exists) return prev.filter(r => r._id !== row._id);
      return [...prev, row];
    });
  };

  const statsArray = [
    { title: "Referred Friends", value: stats.referredFriends, icon: <Users className="w-4 h-4" /> },
    { title: "Referral Orders", value: stats.referralOrders, icon: <Truck className="w-4 h-4" /> },
    { title: "Total Shipping", value: `₹${Number(stats.totalShipping || 0).toFixed(2)}`, icon: <CircleDollarSign className="w-4 h-4" /> },
    { title: "Total Commission", value: `₹${Number(stats.totalCommission || 0).toFixed(2)}`, icon: <Wallet className="w-4 h-4" /> },
    { title: "Withdrawn", value: `₹${Number(stats.withdrawn || 0).toFixed(2)}`, icon: <Lock className="w-4 h-4" /> },
    { 
      title: "Remaining", 
      value: `₹${Number(stats.remaining || 0).toFixed(2)}`, 
      icon: <Info className="w-4 h-4" />,
      showWithdraw: Number(stats.remaining || 0) > 0
    },
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
      <div className="sm:hidden bg-white border border-[#0CBB7D] rounded-lg p-3 shadow-sm space-y-2">
        {statsArray.map((card, i) => (
          <div key={i} className="flex justify-between items-center last:border-0 last:pb-0">
            <span className="text-[10px] font-bold text-gray-500">{card.title}</span>
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
          {/* Action Button */}
          <div className="relative h-full" ref={actionDropdownRef}>
            <button
              onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
              className={`h-9 px-4 bg-white rounded-lg text-[12px] font-bold flex items-center gap-1 border transition-all ${
                selectedRows.length > 0 || isAnyFilterApplied 
                ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50 shadow-sm" 
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Actions
              <ChevronDown className={`w-4 h-4 transition-transform ${isActionDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            
            {isActionDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-popup-in">
                <button
                  onClick={() => {
                    setIsWithdrawModalOpen(true);
                    setIsActionDropdownOpen(false);
                  }}
                  disabled={Number(stats.remaining || 0) <= 0}
                  className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wallet className="w-4 h-4 text-[#0CBB7D]" />
                  Transfer to Wallet
                </button>
                <button
                  onClick={handleExport}
                  disabled={selectedRows.length === 0}
                  className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-t"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  Export Selected (Excel)
                </button>
              </div>
            )}
          </div>

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
              Clear
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
                    <th className="py-2 px-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedRows.length === monthlyData.length && monthlyData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRows(monthlyData);
                          else setSelectedRows([]);
                        }}
                        className="rounded w-3 h-3 border-gray-300 accent-[#0CBB7D]"
                      />
                    </th>
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
                      <tr key={i} className={`border-b border-gray-300 hover:bg-gray-50 transition-colors ${selectedRows.find(r => r._id === row._id) ? "bg-green-50/50" : ""}`}>
                        <td className="py-3 px-3 text-center">
                           <input 
                            type="checkbox" 
                            checked={!!selectedRows.find(r => r._id === row._id)}
                            onChange={() => handleSelectRow(row)}
                            className="rounded w-3 h-3 border-gray-300 accent-[#0CBB7D]"
                          />
                        </td>
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
                <img src={NotFound} alt="No Data" className="w-60 h-60 mx-auto opacity-50 mb-2" />
                {/* <p className="text-gray-400 text-[12px]">No records found</p> */}
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

      {/* Referral Filter Panel */}
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

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-popup-in">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-gray-700">Withdraw Commission</h2>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiCheck className="w-5 h-5 rotate-45" /> {/* Use Check as a pseudo X or just import X */}
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-[12px] text-gray-500 mb-1">Available for Withdrawal</p>
                <p className="text-[24px] font-bold text-[#0CBB7D]">₹{Number(stats.remaining || 0).toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-gray-700">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Enter amount to transfer"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0CBB7D]/20 focus:border-[#0CBB7D]"
                />
                <p className="text-[10px] text-gray-400 italic">This amount will be instantly added to your Shipex wallet balance.</p>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t flex gap-2">
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-bold text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > Number(stats.remaining)}
                className="flex-1 px-4 py-2 bg-[#0CBB7D] text-white rounded-lg text-[12px] font-bold hover:bg-green-600 disabled:opacity-50 transition-all shadow-sm"
              >
                {withdrawing ? "Processing..." : "Transfer Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referral;

