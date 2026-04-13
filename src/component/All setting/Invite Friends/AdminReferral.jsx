import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import { Filter, ChevronDown, Users, Truck, CircleDollarSign, Wallet, MoreHorizontal, Eye, Download, Search, X } from "lucide-react";
import * as XLSX from "xlsx";
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
  const [selectedRows, setSelectedRows] = useState([]);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const actionDropdownRef = useRef(null);

  // Global Transfer Modal States
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");

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
      setSelectedRows([]); // Clear selection when data changes
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin referral data:", err);
      setLoading(false);
    }
  };

  // User Search logic for Global Transfer
  useEffect(() => {
    const fetchUsersSearch = async () => {
      if (globalSearch.trim().length < 2) return setUserSuggestions([]);
      try {
        const token = Cookies.get("session");
        const res = await axios.get(`${REACT_APP_BACKEND_URL}/admin/searchUser?query=${globalSearch}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserSuggestions(res.data.users || []);
      } catch (err) {
        console.error("User search failed", err);
      }
    };
    const debounce = setTimeout(fetchUsersSearch, 300);
    return () => clearTimeout(debounce);
  }, [globalSearch]);

  const fetchUserReferralStats = async (userIdMongo) => {
    try {
      setIsStatsLoading(true);
      const token = Cookies.get("session");
      const res = await axios.get(`${REACT_APP_BACKEND_URL}/referral/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { targetUserId: userIdMongo }
      });
      setUserStats(res.data.stats);
    } catch (err) {
      console.error("Error fetching user stats:", err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleGlobalTransfer = async () => {
    if (!selectedUser || !transferAmount || transferAmount <= 0) return;

    if (transferAmount > (userStats?.remaining || 0)) {
      alert("Insufficient referral balance for this user.");
      return;
    }

    if (!window.confirm(`Transfer ₹${transferAmount} to ${selectedUser.fullname}'s wallet?`)) return;

    try {
      setIsProcessing(true);
      const token = Cookies.get("session");
      const { data } = await axios.post(
        `${REACT_APP_BACKEND_URL}/referral/withdraw`,
        { amount: Number(transferAmount), targetUserId: selectedUser._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        alert(data.message);
        setIsTransferModalOpen(false);
        setSelectedUser(null);
        setTransferAmount("");
        fetchReferralStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Transfer failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (selectedRows.length === 0) return;
    const exportData = selectedRows.map(row => ({
      "Referrer ID": row.userId,
      "Referrer Name": row.userName,
      Email: row.email,
      Mobile: row.mobile,
      Orders: row.totalOrderCount,
      "Shipping Revenue": row.totalShipping,
      Commission: row.totalCommission,
      Month: row.month,
      Year: row.year
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Referral Records");
    XLSX.writeFile(wb, `Referral_Payouts_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    setIsActionDropdownOpen(false);
  };

  const handleSelectRow = (row) => {
    setSelectedRows(prev => {
      const exists = prev.find(r => r._id === row._id);
      if (exists) return prev.filter(r => r._id !== row._id);
      return [...prev, row];
    });
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
        <div className="flex items-center gap-2">
          {/* Action Button */}
          <div className="relative h-full" ref={actionDropdownRef}>
            <button
              onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
              className={`h-9 px-4 rounded-lg bg-white text-[12px] font-bold flex items-center gap-1 border transition-all ${selectedRows.length > 0 || isAnyFilterApplied
                  ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50 shadow-sm"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
            >
              Actions
              <ChevronDown className={`w-4 h-4 transition-transform ${isActionDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isActionDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-popup-in">
                <button
                  onClick={() => { setIsTransferModalOpen(true); setIsActionDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4 text-[#0CBB7D]" />
                  Transfer Referral Amount
                </button>
                <button
                  onClick={handleExport}
                  disabled={selectedRows.length === 0}
                  className="w-full text-left px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  Export Selected (Excel)
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsFilterPanelOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm h-9 whitespace-nowrap"
        >
          <Filter className="w-4 h-4 text-[#0CBB7D]" />
          <span className="hidden xs:inline">More Filters</span>
          <span className="xs:hidden">Filters</span>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {isAnyFilterApplied && (
            <button
              onClick={handleClearFilters}
              className="text-[12px] text-red-500 hover:underline font-[600] px-2 whitespace-nowrap"
            >
              Clear
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
                    <th className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === data.length && data.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRows(data);
                          else setSelectedRows([]);
                        }}
                        className="rounded w-3 h-3 border-gray-300 accent-[#0CBB7D]"
                      />
                    </th>
                    <th className="py-2 px-3">Refer By (User ID)</th>
                    <th className="py-2 px-3">Contact Details</th>
                    <th className="py-2 px-3 text-center">Referral Orders</th>
                    <th className="py-2 px-3 text-right">Total Shipping</th>
                    <th className="py-2 px-3 text-right">Commission</th>
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
                      <tr key={i} className={`border-b border-gray-300 hover:bg-gray-50 transition-colors ${selectedRows.find(r => r._id === row._id) ? "bg-green-50/50" : ""}`}>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!selectedRows.find(r => r._id === row._id)}
                            onChange={() => handleSelectRow(row)}
                            className="rounded w-3 h-3 border-gray-300 accent-[#0CBB7D]"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <p className="font-bold text-[#0CBB7D]">{row.userId || "-"}</p>
                          <p className="text-gray-900 font-medium">{row.userName}</p>
                        </td>
                        <td className="py-2 px-3">
                          <p>{row.email || "-"}</p>
                          <p className="text-gray-400">{row.mobile || "-"}</p>
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-gray-700">
                          {row.totalOrderCount || 0}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#0CBB7D]">
                          ₹{Number(row.totalShipping || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#0CBB7D]">
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

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-popup-in">
            <div className="px-5 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-[16px] font-bold text-gray-700">Global Referral Transfer</h2>
              <button
                onClick={() => { setIsTransferModalOpen(false); setSelectedUser(null); setUserStats(null); setGlobalSearch(""); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Search Area using Standard UserFilter */}
              <div className="relative">
                <label className="block text-[12px] font-bold text-gray-600 mb-2">Search User (ID / Name / Email)</label>
                <UserFilter
                  onUserSelect={(id) => {
                    if (id) {
                      // Fetch full user details if needed, but for now we fetch stats
                      // In Shipex, UserFilter only gives ID. Let's find the user from suggestions or fetch
                      // Actually, let's just use the ID to fetch their stats and details
                      fetchUserReferralStats(id);
                      // To show name/details, we might need a separate call or update UserFilter
                      // For now, let's just fetch everything by ID
                      const fetchSelectedUserDetails = async () => {
                        try {
                          const token = Cookies.get("session");
                          const res = await axios.get(`${REACT_APP_BACKEND_URL}/user/getUserById?id=${id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          if (res.data.success && res.data.userDetails) {
                            setSelectedUser(res.data.userDetails);
                          }
                        } catch (err) {
                          console.error("Error fetching target user details:", err);
                        }
                      };
                      fetchSelectedUserDetails();
                    } else {
                      setSelectedUser(null);
                      setUserStats(null);
                    }
                  }}
                  clearTrigger={!isTransferModalOpen}
                />
              </div>

              {/* Selected User Details */}
              {selectedUser && (
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 animate-fade-in relative z-0">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-800">{selectedUser.fullname}</h3>
                      <p className="text-[11px] text-gray-500">Wallet Balance: ₹{selectedUser.walletAmount?.toFixed(2)}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#0CBB7D] text-white text-[10px] font-bold rounded">Target User</span>
                  </div>

                  {isStatsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-[#0CBB7D] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : userStats ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded-lg border border-green-100">
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Total Earned</p>
                        <p className="text-[11px] font-bold text-gray-700">₹{userStats.totalCommission?.toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-green-100">
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Paid Out</p>
                        <p className="text-[11px] font-bold text-gray-700">₹{userStats.withdrawn?.toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-green-100">
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Remaining</p>
                        <p className="text-[12px] font-bold text-[#0CBB7D]">₹{userStats.remaining?.toFixed(2)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 text-center py-2">Loading stats...</p>
                  )}

                  {userStats && (
                    <div className="mt-6 space-y-3">
                      <label className="block text-[12px] font-bold text-gray-700">Transfer Amount (₹)</label>
                      <input
                        type="number"
                        placeholder="Enter payout amount"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="w-full px-4 py-2 border border-green-200 rounded-lg text-[14px] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0CBB7D]/20 transition-all"
                      />
                      <button
                        onClick={handleGlobalTransfer}
                        disabled={isProcessing || !transferAmount || Number(transferAmount) <= 0 || Number(transferAmount) > (userStats?.remaining || 0)}
                        className="w-full py-2.5 bg-[#0CBB7D] text-white rounded-lg text-[12px] font-bold hover:bg-green-600 transition-all shadow-md disabled:opacity-50"
                      >
                        {isProcessing ? "Processing..." : "Transfer to Wallet"}
                      </button>
                      {Number(transferAmount) > (userStats?.remaining || 0) && (
                        <p className="text-[10px] text-red-500 font-bold">⚠️ Amount exceeds available referral commission!</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReferral;

