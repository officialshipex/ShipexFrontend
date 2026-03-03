import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { FaCalendarAlt, FaWallet, FaRupeeSign, FaFilter, FaBars, FaBook, FaUndo, FaBookOpen } from "react-icons/fa";
import dayjs from "dayjs";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ChevronDown, Filter, X } from "lucide-react";
import ThreeDotLoader from "../../Loader"
import { motion, AnimatePresence } from "framer-motion";
import { getCarrierLogo } from "../../Common/getCarrierLogo";
import WalletHistoryForm from "./WalletHistoryForm";
import Cookies from "js-cookie";
import { Notification } from "../../Notification"
import UserFilter from "../../filter/UserFilter";
import DateFilter from "../../filter/DateFilter";
import OrderAwbFilter from "../../filter/OrderAwbFilter";
import PaginationFooter from "../../Common/PaginationFooter";
import NoDataFound from "../../assets/nodatafound.png";
import { FiCopy, FiCheck, FiBookOpen } from "react-icons/fi";

import PassbookFilterPanel from "../../Common/PassbookFilterPanel";

const Passbooks = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [awbNumber, setAwbNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [clearTrigger, setClearTrigger] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [pricePopupPos, setPricePopupPos] = useState(null);
  const pricePopupTimerRef = useRef(null);
  const [mobilePricePopupId, setMobilePricePopupId] = useState(null);

  const desktopActionRef = useRef();
  const mobileActionRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  // Ref to skip fetch while nav-state is being applied (prevents showing all-data flash)
  const skipNextFetchRef = useRef(false);

  const handleClearFilters = () => {
    setSelectedUserId(null);
    setDateRange(null);
    setCategory("");
    setDescription("");
    setAwbNumber("");
    setOrderId("");
    setClearTrigger((prev) => !prev);
    setShowFilters(false);
    setPage(1);
  };

  useEffect(() => {
    if (location.state?.awbNumber) {
      // Mark that we're about to update multiple states from nav
      // The fetchTransactions dependency useEffect will fire multiple times
      // during state settling — skip those and let the final settled state fire
      skipNextFetchRef.current = true;
      setAwbNumber(location.state.awbNumber.trim());
      setSelectedUserId(null);
      setDateRange(null);
      setCategory("");
      setDescription("");
      setOrderId("");
      setPage(1);
    }
  }, [location.state]);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchTransactions = async () => {
    try {
      const token = Cookies.get("session");
      let fromDate = "";
      let toDate = "";

      if (dateRange && dateRange[0]) {
        fromDate = dayjs(dateRange[0].startDate).toISOString();
        toDate = dayjs(dateRange[0].endDate).toISOString();
      }

      setLoading(true);
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/adminBilling/allPassbook`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            userSearch: selectedUserId || "",
            fromDate,
            toDate,
            category,
            description,
            page,
            limit,
            orderId: orderId || "",
            awbNumber: awbNumber || ""
          },
        }
      );
      setTransactions(response.data.results || []);
      setTotal(response.data.total || 0);
      setLoading(false);
    } catch (error) {
      Notification("Error fetching transactions", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (skipNextFetchRef.current) {
      // States are still settling from nav — skip this intermediate fetch
      skipNextFetchRef.current = false;
      return;
    }
    fetchTransactions();
  }, [selectedUserId, dateRange, page, limit, category, description, awbNumber, orderId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopActionRef.current && !desktopActionRef.current.contains(event.target)) setDesktopDropdownOpen(false);
      if (mobileActionRef.current && !mobileActionRef.current.contains(event.target)) setMobileDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length && transactions.length > 0) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map((t) => t.id || t._id));
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedTransactions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedTransactions.length === 0) {
      Notification("Please select transactions to export.", "info");
      return;
    }
    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/adminBilling/exportPassbook`,
        { transactionsId: selectedTransactions },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "passbook_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Notification("Export successful!", "success");
      setDesktopDropdownOpen(false);
      setMobileDropdownOpen(false);
    } catch (error) {
      Notification("Failed to export passbook data.", "error");
    }
  };

  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReverse = async (transaction) => {
    if (
      window.confirm(
        `Are you sure you want to reverse ₹${transaction.amount} for ${transaction.user.name}?`
      )
    ) {
      try {
        const res = await axios.post(
          `${REACT_APP_BACKEND_URL}/adminBilling/reverseTransaction`,
          { transaction }
        );

        if (res.data.success) {
          Notification("Transaction reversed successfully.", "success");
          fetchTransactions();
        } else if (res.data.error) {
          Notification(`Error: ${res.data.error}`, "error");
        } else {
          Notification("Unexpected response from server.", "error");
        }

        // console.log("Reversing Transaction response:", res.data);
      } catch (error) {
        console.error("Error reversing transaction:", error);

        // Extract and display backend error message if available
        if (error.response && error.response.data && error.response.data.error) {
          Notification(error.response.data.error, "error");
        } else {
          Notification("Failed to reverse transaction. Please try again later.", "error");
        }
      }
    }
  };

  const isAnyFilterApplied = selectedUserId || (dateRange && dateRange[0]?.endDate) || category || description || awbNumber || orderId;

  return (
    <div className="space-y-2">
      {/* Desktop Filter Section */}
      <div className="hidden md:flex gap-2 relative items-center mb-2">
        <div className="w-[200px]">
          <DateFilter
            onDateChange={(range) => {
              setDateRange(range);
              setPage(1);
            }}
            clearTrigger={clearTrigger}
            noInitialFilter={true}
          />
        </div>

        <button
          onClick={() => setIsFilterPanelOpen(true)}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap min-w-[120px] h-9"
        >
          <Filter className="w-4 h-4 text-[#0CBB7D]" />
          More Filters
        </button>

        <div className="flex items-center gap-2 ml-auto" ref={desktopActionRef}>
          {isAnyFilterApplied && (
            <button
              onClick={handleClearFilters}
              className="text-[12px] text-red-500 hover:underline font-[600] px-2 whitespace-nowrap"
            >
              Clear All Filters
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
              disabled={selectedTransactions.length === 0}
              className={`py-2 px-3 h-9 text-[12px] border rounded-lg font-[600] flex items-center gap-1 transition ${selectedTransactions.length === 0
                ? "border-gray-300 text-gray-400 cursor-not-allowed"
                : "text-[#0CBB7D] border-[#0CBB7D] bg-white hover:bg-green-50 shadow-sm"
                }`}
            >
              <span>Actions</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${desktopDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {desktopDropdownOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-[100] animate-popup-in overflow-hidden">
                <ul className="font-[600] text-[12px]">
                  <li
                    className="px-4 py-2 text-gray-700 hover:bg-green-50 cursor-pointer transition border-b border-gray-50"
                    onClick={handleExport}
                  >
                    Export Excel
                  </li>
                  <li
                    className="px-4 py-2 text-gray-700 hover:bg-green-50 cursor-pointer transition"
                    onClick={() => {
                      setShowForm(true);
                      setDesktopDropdownOpen(false);
                    }}
                  >
                    Update Passbook
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Section */}
      <div className="flex w-full flex-col md:hidden mb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <DateFilter
              onDateChange={(range) => {
                setDateRange(range);
                setPage(1);
              }}
              clearTrigger={clearTrigger}
              noInitialFilter={true}
            />
          </div>
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[10px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap h-[32px] min-w-[100px]"
          >
            <Filter className="w-3 h-3 text-[#0CBB7D]" />
            More Filters
          </button>
        </div>

        {isAnyFilterApplied && (
          <div className="flex justify-end pr-1">
            <button
              onClick={handleClearFilters}
              className="text-[11px] font-[600] text-red-500 hover:text-red-600 transition-colors tracking-tight"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block relative">
        <div className="h-[calc(100vh-235px)] overflow-y-auto bg-white shadow-sm">
          <table className="min-w-full border-collapse text-[12px] text-left relative">
            <thead className="sticky top-0 z-40 bg-[#0CBB7D] text-white font-[600]">
              <tr>
                <th className="py-2 px-3 text-left shadow-[0_1px_0_0_#0CBB7D]">
                  <div className="flex justify-center items-center">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-[#0CBB7D] w-4"
                    />
                  </div>
                </th>
                <th className="py-2 px-3 shadow-[0_1px_0_0_#0CBB7D]">User Details</th>
                <th className="py-2 px-3 shadow-[0_1px_0_0_#0CBB7D]">Date</th>
                <th className="py-2 px-3 shadow-[0_1px_0_0_#0CBB7D]">Order ID</th>
                <th className="py-2 px-3 shadow-[0_1px_0_0_#0CBB7D]">AWB Number</th>
                <th className="py-2 px-3 shadow-[0_1px_0_0_#0CBB7D]">Category</th>
                <th className="py-2 px-3 shadow-[0_1px_0_0_#0CBB7D]">Amount</th>
                <th className="py-2 px-3 shadow-[0_1px_0_0_#0CBB7D]">Available Balance</th>
                <th className="py-2 px-3 shadow-[0_1px_0_0_#0CBB7D] w-[20%] text-left">Description</th>
                <th className="py-2 px-3 shadow-[0_1px_0_0_#0CBB7D]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-10">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-gray-500 font-medium">
                    <img src={NoDataFound} alt="No Data Found" className="mx-auto w-[200px]" />
                  </td>
                </tr>
              ) : (
                transactions.map((row, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex justify-center items-center">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(row.id || row._id)}
                          onChange={() => handleCheckboxChange(row.id || row._id)}
                          className="cursor-pointer accent-[#0CBB7D] w-4"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <p className="text-[#0CBB7D]">{row.user.userId}</p>
                      <p className="text-gray-700">{row.user.name}</p>
                      <p className="text-gray-700 truncate max-w-[150px]">{row.user.email}</p>
                      <p>{row.user.phoneNumber}</p>
                    </td>
                    <td className="py-2 px-3">
                      <p className="text-gray-700">{dayjs(row.date).format("DD MMM YYYY")}</p>
                      <p className="text-gray-500">{new Date(row.date).toLocaleTimeString()}</p>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 group">
                        <Link to={`/dashboard/order/neworder/updateOrder/${row.orderId}`} className="text-[#0CBB7D] hover:underline block">
                          {row.orderId}
                        </Link>
                        <button onClick={() => handleCopy(row.orderId, row.id + '_orderId')}>
                          {copiedId === row.id + '_orderId' ? <FiCheck className="w-3 h-3 text-[#0CBB7D]" /> : <FiCopy className="w-3 h-3 text-gray-400 transition-opacity opacity-0 group-hover:opacity-100" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 group">
                        <p className="text-[#0CBB7D] cursor-pointer hover:underline" onClick={() => handleTrackingByAwb(row.awb_number)}>
                          {row.awb_number}
                        </p>
                        <button onClick={() => handleCopy(row.awb_number, row.id + '_awb')}>
                          {copiedId === row.id + '_awb' ? <FiCheck className="w-3 h-3 text-[#0CBB7D]" /> : <FiCopy className="w-3 h-3 text-gray-400 transition-opacity opacity-0 group-hover:opacity-100" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${row.category === "debit" ? "bg-red-100 text-red-600" : "bg-green-100 text-[#0CBB7D]"}`}>
                        {row.category}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 justify-start">
                        <span className={`text-[12px] ${row.category === "debit" ? "text-red-500" : "text-[#0CBB7D]"} font-medium`}>
                          ₹{Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {row.category === "debit" && (
                          <div
                            className="relative cursor-help ml-0.5"
                            onMouseEnter={(e) => {
                              if (pricePopupTimerRef.current) clearTimeout(pricePopupTimerRef.current);
                              const rect = e.currentTarget.getBoundingClientRect();
                              const dir = rect.top < window.innerHeight * 0.4 ? "bottom" : "top";
                              setPricePopupPos({
                                x: rect.left + rect.width / 2,
                                y: dir === "top" ? rect.top - 10 : rect.bottom + 10,
                                dir,
                                order: row
                              });
                            }}
                            onMouseLeave={() => {
                              pricePopupTimerRef.current = setTimeout(() => {
                                setPricePopupPos(null);
                              }, 150);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#0CBB7D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              <path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-700">₹{Number(row.balanceAfterTransaction).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-3">
                      <p className="line-clamp-2 text-[12px] leading-relaxed" title={row.description}>{row.description}</p>
                    </td>
                    <td className="py-2 px-3">
                      {row.category === "debit" && (
                        <button
                          className="bg-[#0CBB7D]/10 text-[#0CBB7D] p-2 rounded-full hover:bg-[#0CBB7D] hover:text-white transition-all shadow-sm relative group"
                          onClick={() => handleReverse(row)}
                        >
                          <FaUndo size={12} />
                          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-[10px] bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-[100]">
                            Reverse Amount
                          </span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-100 flex-1">
            <input
              type="checkbox"
              checked={selectedTransactions.length === transactions.length && transactions.length > 0}
              onChange={handleSelectAll}
              className="cursor-pointer accent-[#0CBB7D] w-4"
            />
            <span className="text-[10px] font-[600] text-gray-600 tracking-tight">Select All</span>
          </div>

          <div ref={mobileActionRef} className="relative">
            <button
              className={`h-[30px] px-3 rounded-lg font-[600] flex items-center gap-2 transition bg-white border ${selectedTransactions.length === 0
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "text-[#0CBB7D] border-[#0CBB7D]"
                }`}
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              disabled={selectedTransactions.length === 0}
            >
              <FaBars className="w-3 h-3" />
            </button>
            {mobileDropdownOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-[100] animate-popup-in overflow-hidden">
                <ul className="font-[600] text-[11px]">
                  <li className="px-4 py-2 text-gray-700 hover:bg-green-50 cursor-pointer border-b border-gray-50" onClick={handleExport}>
                    Export Excel
                  </li>
                  <li className="px-4 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => {
                    setShowForm(true);
                    setMobileDropdownOpen(false);
                  }}>
                    Update Passbook
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="h-[calc(100vh-275px)] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-10"><ThreeDotLoader /></div>
          ) : transactions.length > 0 ? (
            transactions.map((row, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 border border-gray-100 text-[10px] animate-popup-in">
                {/* Header Bar */}
                <div className="flex gap-2 justify-between rounded-lg bg-green-50 py-1.5 px-2 items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(row.id || row._id)}
                      onChange={() => handleCheckboxChange(row.id || row._id)}
                      className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                    />
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center p-0.5 border shadow-xs overflow-hidden shrink-0">
                      <img
                        src={getCarrierLogo(row?.courierServiceName)}
                        alt=""
                        onError={(e) => { e.target.src = '/default-courier-logo.png' }}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-w-0 ml-1">
                    <span className="text-gray-700 font-[600] truncate text-[10px] tracking-tight">
                      {row?.courierServiceName || "Transaction"}
                    </span>
                    <span className="text-gray-500 font-[600] text-[8px]">
                      {dayjs(row.date).format("DD MMM YYYY")}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[9px] ${row.category === "debit" ? "bg-red-100 text-red-600" : "bg-green-100 text-[#0CBB7D]"}`}>
                      {row.category}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-y-1 mb-1 p-0.5">
                  <div>
                    <p className="text-gray-700 text-[10px]">Order ID</p>
                    <div className="flex items-center gap-1">
                      <Link to={`/dashboard/order/neworder/updateOrder/${row.orderId}`} className="text-[#0CBB7D] font-[600] hover:text-[#0CBB7D] text-[10px]">
                        {row.orderId}
                      </Link>
                      <button onClick={() => handleCopy(row.orderId, row.id + '_orderId_mobile')}>
                        {copiedId === row.id + '_orderId_mobile' ? <FiCheck className="w-2.5 h-2.5 text-[#0CBB7D]" /> : <FiCopy className="w-2.5 h-2.5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-700 text-[10px]">AWB Number</p>
                    <div className="flex items-center justify-end gap-1">
                      <p className="text-[#0CBB7D] font-[600] truncate hover:underline text-[10px]" onClick={() => handleTrackingByAwb(row.awb_number)}>
                        {row.awb_number || "N/A"}
                      </p>
                      {row.awb_number && (
                        <button onClick={() => handleCopy(row.awb_number, row.id + '_awb_mobile')}>
                          {copiedId === row.id + '_awb_mobile' ? <FiCheck className="w-2.5 h-2.5 text-[#0CBB7D]" /> : <FiCopy className="w-2.5 h-2.5 text-gray-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-gray-50 pt-1 mt-1 col-span-2 flex justify-between items-center">
                    <div>
                      <p className="text-gray-700 text-[10px]">Amount</p>
                      <div className="flex items-center gap-1">
                        <p className={`font-[600] text-[10px] ${row.category === "debit" ? "text-red-500" : "text-[#0CBB7D]"}`}>
                          ₹{Number(row.amount).toFixed(2)}
                        </p>
                        {row.category === "debit" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMobilePricePopupId(mobilePricePopupId === (row.id || row._id) ? null : (row.id || row._id));
                            }}
                            className="text-[#0CBB7D] p-1.5 -m-1.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              <path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-700 text-[10px]">Balance After</p>
                      <p className="text-gray-700 font-[600] text-[10px]">₹{Number(row.balanceAfterTransaction).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Description & Action Bar */}
                <div className="mt-1 p-1.5 bg-gray-50 rounded-lg flex justify-between items-center group">
                  <div className="min-w-0 flex-1 pr-2 text-gray-500 leading-snug text-[10px]">
                    <span className="font-bold text-gray-400 text-[10px] mr-1">Description :</span>
                    {row.description || "No description provided"}
                  </div>
                  {row.category === "debit" && (
                    <button
                      onClick={() => handleReverse(row)}
                      className="bg-white text-[#0CBB7D] p-1.5 rounded-full shadow-sm border border-green-100 shrink-0"
                    >
                      <FaUndo size={10} />
                    </button>
                  )}
                </div>

                {/* User Info */}
                <div className="mt-2 flex items-center justify-between px-0.5">

                  {/* Left Side (Avatar + Name + Email) */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-white border border-[#0CBB7D]/20 flex items-center justify-center font-bold text-[#0CBB7D] text-[10px] shrink-0 shadow-sm">
                      {row.user?.name?.charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-gray-700 text-[10px] truncate">
                        {row.user?.name}
                      </p>
                      <p className="text-gray-400 text-[10px] leading-none truncate">
                        {row.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Right Side (User ID) */}
                  <p className="text-[#0CBB7D] font-bold text-[10px] tracking-widest shrink-0">
                    {row.user?.userId}
                  </p>

                </div>

              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-10 flex flex-col items-center">
              <img src={NoDataFound} alt="No Data Found" className="w-[150px]" />
            </div>
          )}
        </div>
      </div>

      <PassbookFilterPanel
        key={`${awbNumber}-${orderId}-${category}-${description}-${selectedUserId}`}
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        selectedUserId={selectedUserId}
        awbNumber={awbNumber}
        orderId={orderId}
        category={category}
        description={description}
        onClearFilters={handleClearFilters}
        onApplyFilters={(filters) => {
          setSelectedUserId(filters.selectedUserId);
          setAwbNumber(filters.awbNumber);
          setOrderId(filters.orderId);
          setCategory(filters.category);
          setDescription(filters.description);
          setPage(1);
          setIsFilterPanelOpen(false);
        }}
      />

      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={Math.ceil(total / limit)}
        limit={limit}
        setLimit={setLimit}
      />

      {/* Floating Action Button */}
      <div className="fixed sm:bottom-10 bottom-8 right-6 sm:right-4 z-50">
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#0CBB7D] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-2xl hover:opacity-90 transition-all hover:scale-110 active:scale-95 group"
        >
          <FaBook size={16} />
          <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Update Passbook
          </span>
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden relative"
            >
              <button
                onClick={() => setShowForm(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-red-500 transition-colors z-10"
              >
                <span className="text-2xl font-bold">×</span>
              </button>
              <div className="p-1">
                <WalletHistoryForm onClose={() => setShowForm(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Price Breakup Modal */}
      <AnimatePresence>
        {mobilePricePopupId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobilePricePopupId(null)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-xs relative z-10"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800 text-[12px] uppercase">Price Breakup</h3>
                <X className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => setMobilePricePopupId(null)} />
              </div>
              <div className="space-y-2 text-[12px]">
                {(() => {
                  const row = transactions.find(t => (t.id || t._id) === mobilePricePopupId);
                  if (!row) return null;
                  if (row.orderType === "B2C") {
                    return (
                      <div className="space-y-1.5">
                        <div className="flex justify-between"><span className="text-gray-500">Freight</span><span className="font-bold">₹ {row.priceBreakup?.freight ?? 0}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">COD</span><span className="font-bold">₹ {row.priceBreakup?.cod ?? 0}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">GST</span><span className="font-bold">₹ {row.priceBreakup?.gst ?? 0}</span></div>
                        <div className="flex justify-between border-t pt-2 mt-1"><span className="font-bold text-gray-800">Total</span><span className="font-bold text-[#0CBB7D]">₹ {row.priceBreakup?.total ?? row.amount ?? 0}</span></div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="space-y-1.5">
                        {row.rateBreakup && Object.keys(row.rateBreakup).length > 0
                          ? Object.entries(row.rateBreakup).map(([key, val]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-500 capitalize">{key}</span>
                              <span className="font-bold">{typeof val === "number" ? `₹ ${val}` : val}</span>
                            </div>
                          ))
                          : <p className="text-gray-400 italic text-center py-2">No breakup available</p>
                        }
                        <div className="flex justify-between border-t border-dashed pt-2 mt-1"><span className="font-bold text-gray-800">Total</span><span className="font-bold text-[#0CBB7D]">₹ {row.amount || 0}</span></div>
                      </div>
                    );
                  }
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Price Breakdown Popup (Fixed position) */}
      {pricePopupPos && (
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            left: pricePopupPos.x,
            ...(pricePopupPos.dir === "top"
              ? { bottom: window.innerHeight - pricePopupPos.y }
              : { top: pricePopupPos.y }),
            transform: "translateX(-50%)",
            pointerEvents: "auto",
          }}
          className="bg-white border shadow-2xl rounded-lg p-3 w-60 text-[10px] text-gray-700 whitespace-normal max-h-[300px] overflow-y-auto custom-scrollbar"
          onMouseEnter={() => {
            if (pricePopupTimerRef.current) clearTimeout(pricePopupTimerRef.current);
          }}
          onMouseLeave={() => {
            pricePopupTimerRef.current = setTimeout(() => {
              setPricePopupPos(null);
            }, 150);
          }}
        >
          <div className="sticky top-0 bg-white pb-1 mb-2 border-b z-10">
            <p className="font-[700] text-gray-800">Price Breakup</p>
          </div>
          {pricePopupPos.order.orderType === "B2C" ? (
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Freight</span><span className="font-[600]">₹ {pricePopupPos.order.priceBreakup?.freight ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">COD</span><span className="font-[600]">₹ {pricePopupPos.order.priceBreakup?.cod ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">GST</span><span className="font-[600]">₹ {pricePopupPos.order.priceBreakup?.gst ?? 0}</span></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span className="font-[700] text-gray-800">Total</span><span className="font-[700] text-[#0CBB7D]">₹ {pricePopupPos.order.priceBreakup?.total ?? pricePopupPos.order.amount ?? 0}</span></div>
            </div>
          ) : (
            <div className="space-y-1">
              {pricePopupPos.order.rateBreakup && Object.keys(pricePopupPos.order.rateBreakup).length > 0
                ? Object.entries(pricePopupPos.order.rateBreakup).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500 capitalize">{key}</span>
                    <span className="font-[600]">{typeof val === "number" ? `₹ ${val}` : val}</span>
                  </div>
                ))
                : <p className="text-gray-400 italic">No breakup available</p>
              }
              <div className="flex justify-between border-t pt-1 mt-1"><span className="font-[700] text-gray-800">Total</span><span className="font-[700] text-[#0CBB7D]">₹ {pricePopupPos.order.amount || 0}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Passbooks;
