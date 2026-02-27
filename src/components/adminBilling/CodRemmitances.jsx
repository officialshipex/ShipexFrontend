import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Wallet, Banknote, Minus, Send, Filter } from "lucide-react";
import Cookies from "js-cookie";
import ThreeDotLoader from "../../Loader";
import { Notification } from "../../Notification";
import { FiCopy, FiCheck } from "react-icons/fi";
import { FaBars } from "react-icons/fa";
import SellerRemittanceDatas from "../Billings/SellerRemittanceDatas";
import PaginationFooter from "../../Common/PaginationFooter";
import CodRemittanceFilterPanel from "../../Common/CodRemittanceFilterPanel";
import NoDataFound from "../../assets/nodatafound.png";
import DateFilter from "../../filter/DateFilter";
import { motion, AnimatePresence } from "framer-motion";

const CodRemittances = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [status, setStatus] = useState("");
  const [utr, setUtr] = useState("");
  const [remittanceId, setRemittanceId] = useState("");
  const [provider, setProvider] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const actionRef = useRef(null);
  const [openRemittancePopup, setOpenRemittancePopup] = useState(false);
  const [selectedRemittanceId, setSelectedRemittanceId] = useState(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [selectedRemittances, setSelectedRemittances] = useState([]);
  const [detailsPopupId, setDetailsPopupId] = useState(null);

  const navigate = useNavigate();
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
        `${REACT_APP_BACKEND_URL}/adminBilling/allCodRemittance`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            userSearch: selectedUserId || "",
            fromDate,
            toDate,
            status,
            page,
            limit,
            remittanceId,
            utr,
            provider
          },
        }
      );
      setSummary(response.data.summary);
      setTransactions(response.data.results || []);
      setTotal(response.data.total || 0);
      setLoading(false);
    } catch (error) {
      Notification("Error fetching transactions", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedUserId, dateRange, status, remittanceId, utr, provider, page, limit]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionRef.current && !actionRef.current.contains(event.target)) {
        setActionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearFilters = () => {
    setSelectedUserId(null);
    setDateRange(null);
    setStatus("");
    setRemittanceId("");
    setUtr("");
    setProvider("");
    setClearTrigger(prev => prev + 1);
    setPage(1);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectAll = () => {
    if (selectedRemittances.length === transactions.length && transactions.length > 0) {
      setSelectedRemittances([]);
    } else {
      setSelectedRemittances(transactions.map((r) => r._id));
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedRemittances(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const openRemittanceDetails = (id) => {
    setSelectedRemittanceId(id);
    setOpenRemittancePopup(true);
  };

  const handleExportExcel = () => {
    Notification(`Exporting ${selectedRemittances.length} selected remittances`, "success");
    setActionOpen(false);
  };

  const isAnyFilterApplied = selectedUserId || status || remittanceId || utr || provider;

  const summaryItems = [
    { title: "Total COD Remitted", value: summary?.totalCodRemitted, icon: <Banknote size={20} /> },
    { title: "Total Deduction from COD", value: summary?.totalDeductions, icon: <Minus size={20} /> },
    { title: "Remittance Initiated", value: summary?.totalRemittanceInitiated, icon: <Send size={20} /> },
    { title: "COD To Be Remitted", value: summary?.CODToBeRemitted || 0, icon: <Wallet size={20} /> },
  ];

  return (
    <div className="space-y-2">
      {/* Summary Grid */}
      <div className="text-[12px] font-[600]">
        {/* ✅ Mobile View: Single Box */}
        <div className="md:hidden border text-[10px] border-[#0CBB7D] bg-white rounded-lg px-3 py-2 space-y-2">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="flex items-center">
              <span className="text-gray-500 w-1/2">{item.title}</span>
              <span className="mx-1 text-gray-500">:</span>
              <span className="text-gray-700 w-1/2 text-right">
                {typeof item.value === "number" ? item.value.toFixed(2) : item.value}
              </span>
            </div>
          ))}
        </div>

        {/* ✅ Desktop View: Grid Layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-2 my-2">
          {summaryItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-start text-start gap-4 p-2 bg-white rounded-lg border border-[#0CBB7D] hover:shadow-sm transition-shadow duration-300"
            >
              <div className="bg-[#0CBB7D] text-white p-2 rounded-full">
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-[600] text-gray-700">
                  {typeof item.value === "number" ? item.value.toFixed(2) : item.value}
                </span>
                <span className="text-[12px] font-[600] text-gray-500">{item.title}</span>
              </div>
            </div>
          ))}
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
          <div className="flex justify-end mt-1 px-1">
            <button
              onClick={handleClearFilters}
              className="text-[11px] font-[600] text-red-500 hover:text-red-600 px-1"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Desktop Filter Section */}
      <div className="hidden md:flex gap-2 relative sm:items-center">
        <DateFilter
          onDateChange={(range) => {
            setDateRange(range);
            setPage(1);
          }}
          clearTrigger={clearTrigger}
          noInitialFilter={true}
        />

        <button
          onClick={() => setIsFilterPanelOpen(true)}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap h-9"
        >
          <Filter className="w-4 h-4 text-[#0CBB7D]" />
          More Filters
        </button>

        <div className="flex items-center gap-2 ml-auto" ref={actionRef}>
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
              disabled={selectedRemittances.length === 0}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-9 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 border transition-all ${selectedRemittances.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
            >
              Actions
              <ChevronDown className={`w-4 h-4 transition-transform ${actionOpen ? "rotate-180" : ""}`} />
            </button>

            {actionOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-40 text-[12px] z-[100] animate-popup-in overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                  onClick={handleExportExcel}
                >
                  Export
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table - REVERTED TO OLD DESIGN */}
      <div className="hidden md:block">
        <div className="h-[calc(100vh-295px)] overflow-y-auto bg-white">
          <table className="w-full text-[12px] border-collapse">
            <thead className="bg-[#0CBB7D] text-white font-[600] sticky top-0 z-10">
              <tr className="text-white bg-[#0CBB7D] text-[12px] font-600">
                <th className="py-2 px-3 w-10">
                  <div className="flex justify-center items-center">
                    <input
                      type="checkbox"
                      checked={transactions.length > 0 && selectedRemittances.length === transactions.length}
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-[#0CBB7D]"
                    />
                  </div>
                </th>
                <th className="text-left py-2 px-3">User Details</th>
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-left py-2 px-3">Remittance ID</th>
                <th className="text-left py-2 px-3">UTR</th>
                <th className="text-left py-2 px-3">Total COD Amount</th>
                <th className="text-left py-2 px-3">Amount Credited to Wallet</th>
                <th className="text-left py-2 px-3">Early COD Charges</th>
                <th className="text-left py-2 px-3">Adjusted Amount</th>
                <th className="text-left py-2 px-3">Remittance Method</th>
                <th className="text-left py-2 px-3">Remittance Amount</th>
                <th className="text-left py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img src={NoDataFound} alt="No Data Found" className="w-48 h-48 mb-2" />
                      <p className="text-gray-400 font-medium">No remittances found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((row, index) => (
                  <tr key={index} className="border-t border-gray-300 hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="flex justify-center items-center">
                        <input
                          type="checkbox"
                          checked={selectedRemittances.includes(row._id)}
                          onChange={() => handleCheckboxChange(row._id)}
                          className="cursor-pointer accent-[#0CBB7D]"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-700 w-[180px] max-w-[180px]">
                      <p className="text-[#0CBB7D] font-medium truncate">
                        {row.user?.userId}
                      </p>

                      <p className="font-medium truncate">
                        {row.user?.name}
                      </p>

                      <p className="text-gray-500 truncate">
                        {row.user?.email}
                      </p>

                      <p className="text-gray-500 truncate">
                        {row.user?.phoneNumber}
                      </p>
                    </td>
                    <td className="py-2 px-3">
                      <p>{dayjs(row.date).format("DD MMM YYYY")}</p>
                      <p>{dayjs(row.date).format("hh:mm A")}</p>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 group">
                        <span className="text-[#0CBB7D] font-medium cursor-pointer hover:underline" onClick={() => openRemittanceDetails(row.remittanceId)}>
                          {row.remittanceId}
                        </span>
                        <button onClick={() => handleCopy(row.remittanceId, row._id + '_remId')}>
                          {copiedId === row._id + '_remId' ? <FiCheck className="text-green-500" /> : <FiCopy className="text-gray-400 opacity-0 group-hover:opacity-100" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[#0CBB7D] font-medium">
                      <div className="flex items-center gap-1 group">
                        <span>{row.utr || "N/A"}</span>
                        {row.utr && (
                          <button onClick={() => handleCopy(row.utr, row._id + '_utr')}>
                            {copiedId === row._id + '_utr' ? <FiCheck className="text-green-500" /> : <FiCopy className="text-gray-400 opacity-0 group-hover:opacity-100" />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3">{row.codAvailable?.toFixed(2)}</td>
                    <td className="py-2 px-3">{row.amountCreditedToWallet?.toFixed(2)}</td>
                    <td className="py-2 px-3">{row.earlyCodCharges?.toFixed(2)}</td>
                    <td className="py-2 px-3">{row.adjustedAmount?.toFixed(2)}</td>
                    <td className="py-2 px-3">{row.remittanceMethod}</td>
                    <td className="py-2 px-3 font-medium text-[#0CBB7D]">{row.remittanceInitiated?.toFixed(2)}</td>
                    <td className={`py-2 px-3`}>
                      <p className={`rounded px-2 py-0.5 text-[10px] text-center ${row.status === "Paid" ? "bg-green-100 text-[#0CBB7D]" : "text-red-600 bg-red-100"}`}>{row.status}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col space-y-2">
        {/* Select All Bar (Same as Passbooks.jsx) */}
        <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-100 flex-1">
            <input
              type="checkbox"
              checked={transactions.length > 0 && selectedRemittances.length === transactions.length}
              onChange={handleSelectAll}
              className="cursor-pointer accent-[#0CBB7D] w-4"
            />
            <span className="text-[10px] font-[600] text-gray-700 tracking-wider">Select All</span>
          </div>

          <div className="relative" ref={actionRef}>
            <button
              disabled={selectedRemittances.length === 0}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-[30px] px-3 rounded-lg flex items-center justify-center border transition-all ${selectedRemittances.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] bg-white shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
            >
              <FaBars className="w-3 h-3" />
            </button>
            {actionOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-36 text-[11px] z-[100] animate-popup-in overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                  onClick={handleExportExcel}
                >
                  Export
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-[calc(100vh-390px)] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <ThreeDotLoader />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center">
              <img src={NoDataFound} alt="No Data Found" className="w-60 h-60" />
            </div>
          ) : (
            transactions.map((row) => (
              <div key={row._id} className="bg-white rounded-lg shadow-sm animate-popup-in border border-gray-200 px-3 py-2 relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedRemittances.includes(row._id)}
                      onChange={() => handleCheckboxChange(row._id)}
                      className="cursor-pointer accent-[#0CBB7D] w-4"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          {/* <span className="text-gray-400 text-[8px] font-bold uppercase leading-none">Remittance ID</span> */}
                          <div className="flex items-center gap-1 group">
                            <span className="font-[600] text-gray-700 text-[10px] hover:underline cursor-pointer" onClick={() => openRemittanceDetails(row.remittanceId)}>
                              Remmitance Id : <span className="font-bold text-[#0CBB7D]">{row.remittanceId}</span>
                            </span>
                            <button onClick={() => handleCopy(row.remittanceId, row.remittanceId + '_remId_mob')}>
                              {copiedId === row.remittanceId + '_remId_mob' ? <FiCheck className="w-2.5 h-2.5 text-green-500" /> : <FiCopy className="w-2.5 h-2.5 text-gray-300" />}
                            </button>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap ${row.status === "Paid" ? "bg-green-100 text-[#0CBB7D]" : "bg-red-100 text-red-600"}`}>
                          {row.status}
                        </span>
                      </div>
                      <span className="text-gray-500 text-[10px]">{dayjs(row.date).format("DD MMM YYYY")}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="flex flex-col items-end">
                      {/* <span className="text-gray-400 text-[8px] font-bold uppercase leading-none">Amount</span> */}
                      <p className="font-bold text-[#0CBB7D] text-[10px] tracking-tight">₹{row.remittanceInitiated?.toFixed(2)}</p>
                      <p
                        className="text-[9px] text-[#0CBB7D] font-bold border-b border-dashed border-[#0CBB7D] cursor-pointer hover:opacity-80"
                        onClick={() => setDetailsPopupId(detailsPopupId === row.remittanceId ? null : row.remittanceId)}
                      >
                        Details
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                  <div>
                    <p className="text-gray-400">UTR Number</p>
                    <div className="flex items-center gap-1 group">
                      <p className="font-bold text-[#0CBB7D]">{row.utr || "N/A"}</p>
                      {row.utr && row.utr !== "N/A" && (
                        <button onClick={() => handleCopy(row.utr, row.remittanceId + '_utr_mob')}>
                          {copiedId === row.remittanceId + '_utr_mob' ? <FiCheck className="w-2.5 h-2.5 text-green-500" /> : <FiCopy className="w-2.5 h-2.5 text-gray-300" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400">Method</p>
                    <p className="font-bold text-[#0CBB7D]">{row.remittanceMethod || "N/A"}</p>
                  </div>
                </div>

                {/* Details Popup Breakdown */}
                <AnimatePresence>
                  {detailsPopupId === row.remittanceId && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDetailsPopupId(null)}></div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                        className="absolute right-3 top-12 w-56 bg-white border border-gray-100 rounded-lg shadow-xl p-3 z-50 animate-popup-in"
                      >
                        <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-50">
                          <span className="font-bold text-gray-700 text-[10px] uppercase italic">Financial Breakdown</span>
                          <button onClick={() => setDetailsPopupId(null)} className="text-gray-400 hover:text-red-500">
                            <span className="text-sm">×</span>
                          </button>
                        </div>
                        <div className="space-y-1.5 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">Total COD Amount</span>
                            <span className="text-gray-700 font-bold">₹{row.codAvailable?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">Credited to Wallet</span>
                            <span className="text-[#0CBB7D] font-bold">₹{row.amountCreditedToWallet?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium font-bold">Early COD Charges</span>
                            <span className="text-red-500 font-bold">₹{row.earlyCodCharges?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-50 pt-1">
                            <span className="text-gray-400 font-medium font-bold italic">Adjusted Amount</span>
                            <span className="text-gray-700 font-bold">₹{row.adjustedAmount?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-50 pt-1">
                            <span className="text-gray-600 font-bold italic">Final Remittance</span>
                            <span className="text-[#0CBB7D] font-bold">₹{row.remittanceInitiated?.toFixed(2)}</span>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex w-full items-center gap-2">
                    <div className="w-6 h-6 rounded-full border bg-white border-gray-300 flex items-center justify-center text-[#0CBB7D] font-[600] text-[10px]">
                      {row.user?.name?.charAt(0)}
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <p className="font-bold text-gray-700 text-[10px] truncate">{row.user?.name}</p>
                        <p className="text-gray-500 text-[10px] truncate">{row.user?.email}</p>
                      </div>
                      <p className="text-[#0CBB7D] font-[600] text-[10px] truncate">{row.user?.userId}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={Math.ceil(total / limit)}
        limit={limit}
        setLimit={setLimit}
      />

      {openRemittancePopup && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden relative animate-popup-in">
            <button
              onClick={() => setOpenRemittancePopup(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-red-500 transition-colors z-[110]"
            >
              <span className="text-2xl font-bold">×</span>
            </button>
            <div className="p-1">
              <SellerRemittanceDatas remittanceId={selectedRemittanceId} />
            </div>
          </div>
        </div>
      )}

      <CodRemittanceFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        selectedUserId={selectedUserId}
        remittanceId={remittanceId}
        utr={utr}
        status={status}
        provider={provider}
        onClearFilters={handleClearFilters}
        onApplyFilters={(filters) => {
          setSelectedUserId(filters.selectedUserId);
          setRemittanceId(filters.remittanceId);
          setUtr(filters.utr);
          setStatus(filters.status);
          setProvider(filters.provider);
          setPage(1);
          setIsFilterPanelOpen(false);
        }}
      />
    </div>
  );
};

export default CodRemittances;
