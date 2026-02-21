import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ChevronDown, Wallet, Banknote, Minus, Send, Filter } from "lucide-react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import dayjs from "dayjs";
import ThreeDotLoader from "../../Loader";
import Cookies from "js-cookie";
import PaginationFooter from "../../Common/PaginationFooter";
import { FiCopy, FiCheck } from "react-icons/fi";
import { FaBars } from "react-icons/fa";
import CodRemittanceFilterPanel from "../../Common/CodRemittanceFilterPanel";
import NoDataFound from "../../assets/nodatafound.png";
import DateFilter from "../../filter/DateFilter";
import { motion, AnimatePresence } from "framer-motion";
import RemittanceDetails from "./RemittanceDetails";


const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const Remittance = ({
  setFiltersApplied,
  clearFiltersTrigger,
  setClearFiltersTrigger,
}) => {
  const [dateRange, setDateRange] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [remited, setremited] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [remitedData, setremitedData] = useState([]);
  const [status, setStatus] = useState("");
  const [remittanceId, setRemittanceId] = useState("");
  const [utr, setUtr] = useState("");
  const [selectedRemittances, setSelectedRemittances] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const actionRef = useRef(null);
  const [openRemittancePopup, setOpenRemittancePopup] = useState(false);
  const [selectedRemittanceId, setSelectedRemittanceId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [detailsPopupId, setDetailsPopupId] = useState(null);
  const [clearTrigger, setClearTrigger] = useState(0);

  useEffect(() => {
    if (clearFiltersTrigger) {
      handleClearFilters();
      if (setFiltersApplied) setFiltersApplied(false);
      if (setClearFiltersTrigger) setClearFiltersTrigger(false);
    }
  }, [clearFiltersTrigger]);

  const navigate = useNavigate();
  const { id } = useParams();

  const openRemittanceDetails = (id) => {
    setSelectedRemittanceId(id);
    setOpenRemittancePopup(true);
  };

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
    setRemittanceId("");
    setUtr("");
    setStatus("");
    setDateRange(null);
    setClearTrigger(prev => prev + 1);
    setPage(1);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const remitancedata = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("session");
        let url = `${REACT_APP_BACKEND_URL}/cod/codRemittanceData?page=${page}`;
        if (limit) url += `&limit=${limit}`;
        if (remittanceId) url += `&remittanceIdFilter=${remittanceId}`;
        if (utr) url += `&utrFilter=${utr}`;
        if (status) url += `&statusFilter=${status}`;
        if (dateRange?.[0]) {
          url += `&fromDate=${dateRange[0].startDate.toISOString()}`;
          url += `&toDate=${dateRange[0].endDate.toISOString()}`;
        }

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { id }
        });

        if (response.data.success) {
          setremited(response.data.data);
          setremitedData(response.data.data.remittanceData);
          setTotalPages(response.data.totalPages);
        }
      } catch (error) {
        console.log("Error fetching remittance data:", error);
      } finally {
        setLoading(false);
      }
    };
    remitancedata();
    if (remittanceId || utr || status || dateRange) {
      if (setFiltersApplied) setFiltersApplied(true);
    } else {
      if (setFiltersApplied) setFiltersApplied(false);
    }
  }, [refresh, remittanceId, utr, status, dateRange, page, limit]);

  const handleSelectAll = () => {
    if (selectedRemittances.length === remitedData.length && remitedData.length > 0) {
      setSelectedRemittances([]);
    } else {
      setSelectedRemittances(remitedData.map((r) => r.remittanceId));
    }
  };

  const handleCheckboxChange = (remittanceId) => {
    setSelectedRemittances(prev =>
      prev.includes(remittanceId) ? prev.filter(item => item !== remittanceId) : [...prev, remittanceId]
    );
  };

  const handleExport = async () => {
    try {
      const token = Cookies.get("session");
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/cod/exportOrderInRemittance`,
        {
          params: { ids: selectedRemittances },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const exportData = response.data.orders;
      const flattenedData = exportData.map((order) => ({
        "Order ID": order.orderId || "",
        "Courier Service": order.courierServiceName || "",
        "AWB Number": order.awb_number || "",
        "Payment Method": order.paymentMethod || "",
        "Payment Amount": order.paymentAmount || 0,
        "Delivery Date": order.deliveryDate || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(flattenedData);
      worksheet["!cols"] = [
        { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 25 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Remittance Orders");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(data, `remittance_orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const summaryItems = [
    { title: "COD To Be Remitted", value: remited?.CODToBeRemitted, icon: <Wallet size={20} /> },
    { title: "Last COD Remitted", value: remited?.LastCODRemitted, icon: <Send size={20} /> },
    { title: "Total COD Remitted", value: remited?.TotalCODRemitted, icon: <Banknote size={20} /> },
    { title: "Total Deduction from COD", value: remited?.TotalDeductionfromCOD, icon: <Minus size={20} /> },
    { title: "Remittance Initiated", value: remited?.RemittanceInitiated, icon: <Wallet size={20} /> },
  ];

  const isAnyFilterApplied = remittanceId || utr || status || dateRange;

  return (
    <div className="space-y-2">
      {/* Summary Grid */}
      <div className="text-[12px] font-[600]">
        {/* Mobile View: Single Box */}
        <div className="md:hidden border text-[10px] border-[#0CBB7D] bg-white rounded-lg px-3 py-2 space-y-2">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="flex items-center">
              <span className="text-gray-500 w-1/2">{item.title}</span>
              <span className="mx-1 text-gray-500">:</span>
              <span className="text-gray-700 w-1/2 text-right">
                ₹{typeof item.value === "number" ? item.value.toFixed(2) : (Number(item.value) || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Desktop View: Grid Layout */}
        <div className="hidden md:grid md:grid-cols-5 gap-2 my-2">
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
                  ₹{typeof item.value === "number" ? item.value.toFixed(2) : (Number(item.value) || 0).toFixed(2)}
                </span>
                <span className="text-[12px] font-[600] text-gray-500">{item.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Section */}
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
            <button onClick={handleClearFilters} className="text-[11px] font-[600] text-red-500 hover:text-red-600 px-1">
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
              className={`h-9 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 border transition-all ${selectedRemittances.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"}`}
            >
              Actions
              <ChevronDown className={`w-4 h-4 transition-transform ${actionOpen ? "rotate-180" : ""}`} />
            </button>
            {actionOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-40 text-[12px] z-[100] animate-popup-in overflow-hidden">
                <div className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600" onClick={handleExport}>
                  Export
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="h-[calc(100vh-365px)] overflow-y-auto bg-white">
          <table className="w-full text-[12px] border-collapse sticky-header">
            <thead className="bg-[#0CBB7D] text-white font-[600] sticky top-0 z-10">
              <tr>
                <th className="py-2 px-3 w-10">
                  <div className="flex justify-center items-center">
                    <input
                      type="checkbox"
                      checked={remitedData.length > 0 && selectedRemittances.length === remitedData.length}
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-[#0CBB7D]"
                    />
                  </div>
                </th>
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-left py-2 px-3">Remittance ID</th>
                <th className="text-left py-2 px-3">UTR</th>
                <th className="text-left py-2 px-3">COD Available</th>
                <th className="text-left py-2 px-3">Amount Credited to Wallet</th>
                <th className="text-left py-2 px-3">Adjusted Amount</th>
                <th className="text-left py-2 px-3">Early COD Charges</th>
                <th className="text-left py-2 px-3">Remittance Amount</th>
                <th className="text-left py-2 px-3">Remittance Method</th>
                <th className="text-left py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : remitedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img src={NoDataFound} alt="No Data Found" className="w-60 h-60 mb-2" />
                      
                    </div>
                  </td>
                </tr>
              ) : (
                remitedData.map((row, index) => (
                  <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex justify-center items-center">
                        <input
                          type="checkbox"
                          checked={selectedRemittances.includes(row.remittanceId)}
                          onChange={() => handleCheckboxChange(row.remittanceId)}
                          className="cursor-pointer accent-[#0CBB7D]"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      <p className="font-medium">{dayjs(row.date).format("DD MMM YYYY")}</p>
                      <p className="text-[12px] text-gray-500">{dayjs(row.date).format("hh:mm A")}</p>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 group">
                        <span
                          className="text-[#0CBB7D] font-medium cursor-pointer hover:underline"
                          onClick={() => openRemittanceDetails(row.remittanceId)}
                        >
                          {row.remittanceId}
                        </span>
                        <button onClick={() => handleCopy(row.remittanceId, row.remittanceId + '_remId')}>
                          {copiedId === row.remittanceId + '_remId' ? (
                            <FiCheck className="text-green-500 w-3 h-3" />
                          ) : (
                            <FiCopy className="text-gray-400 opacity-0 group-hover:opacity-100 w-3 h-3 transition-opacity" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[#0CBB7D] font-medium">
                      <div className="flex items-center gap-1 group">
                        <span>{row.utr || "N/N"}</span>
                        {row.utr && (
                          <button onClick={() => handleCopy(row.utr, row.remittanceId + '_utr')}>
                            {copiedId === row.remittanceId + '_utr' ? (
                              <FiCheck className="text-[#0CBB7D] w-3 h-3" />
                            ) : (
                              <FiCopy className="text-gray-400 opacity-0 group-hover:opacity-100 w-3 h-3 transition-opacity" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-600">₹{(Number(row?.orderDetails?.codcal) || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-gray-600">₹{(Number(row?.amountCreditedToWallet) || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-gray-600">₹{(Number(row.adjustedAmount) || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-red-500">₹{(Number(row.earlyCodCharges) || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-[#0CBB7D]">₹{(Number(row.codAvailable) || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-gray-500">{row.remittanceMethod}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${row.status === "Paid" ? "bg-green-100 text-[#0CBB7D]" : "bg-red-100 text-red-600"}`}>
                        {row.status}
                      </span>
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
        <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-100 flex-1">
            <input
              type="checkbox"
              checked={remitedData.length > 0 && selectedRemittances.length === remitedData.length}
              onChange={handleSelectAll}
              className="cursor-pointer accent-[#0CBB7D] w-4"
            />
            <span className="text-[10px] font-[600] text-gray-700 tracking-wider text-right">Select All</span>
          </div>

          <div className="relative" ref={actionRef}>
            <button
              disabled={selectedRemittances.length === 0}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-[30px] px-3 rounded-lg flex items-center justify-center border transition-all ${selectedRemittances.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] bg-white shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"}`}
            >
              <FaBars className="w-3 h-3" />
            </button>
            {actionOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-36 text-[11px] z-[100] animate-popup-in overflow-hidden">
                <div className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600" onClick={handleExport}>
                  Export
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-[calc(100vh-380px)] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <ThreeDotLoader />
            </div>
          ) : remitedData.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center">
              <img src={NoDataFound} alt="No Data Found" className="w-60 h-60" />
            </div>
          ) : (
            remitedData.map((row) => (
              <div key={row.remittanceId} className="bg-white rounded-lg shadow-sm animate-popup-in border border-gray-200 px-3 py-2 relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedRemittances.includes(row.remittanceId)}
                      onChange={() => handleCheckboxChange(row.remittanceId)}
                      className="cursor-pointer accent-[#0CBB7D] w-4"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          
                          <div className="flex items-center gap-1 group">
                            <span className="text-gray-400 text-[10px] leading-none">Remittance ID :</span>
                            <span className="font-[600] text-[#0CBB7D] text-[10px] hover:underline cursor-pointer" onClick={() => openRemittanceDetails(row.remittanceId)}>
                              {row.remittanceId}
                            </span>
                            <button onClick={() => handleCopy(row.remittanceId, row.remittanceId + '_mob')}>
                              {copiedId === row.remittanceId + '_mob' ? (
                                <FiCheck className="w-2.5 h-2.5 text-green-500" />
                              ) : (
                                <FiCopy className="w-2.5 h-2.5 text-gray-300" />
                              )}
                            </button>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap ${row.status === "Paid" ? "bg-green-100 text-[#0CBB7D]" : "bg-red-100 text-red-600"}`}>
                          {row.status}
                        </span>
                      </div>
                      <span className="text-gray-400 text-[10px] mt-0.5">{dayjs(row.date).format("DD MMM YYYY")}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="flex flex-col items-end">
                      {/* <span className="text-gray-400 text-[8px] font-bold uppercase leading-none">Amount</span> */}
                      <p className="font-bold text-[#0CBB7D] text-[10px] tracking-tight">₹{(Number(row.codAvailable) || 0).toFixed(2)}</p>
                      <p
                        className="text-[9px] text-[#0CBB7D] font-bold border-b border-dashed border-[#0CBB7D] cursor-pointer hover:opacity-80 mt-0.5"
                        onClick={() => setDetailsPopupId(detailsPopupId === row.remittanceId ? null : row.remittanceId)}
                      >
                        Details
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] mb-2 p-1.5 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-gray-400">UTR Number</p>
                    <div className="flex items-center gap-1 group">
                      <p className="font-bold text-[#0CBB7D]">{row.utr || "N/N"}</p>
                      {row.utr && (
                        <button onClick={() => handleCopy(row.utr, row.remittanceId + '_utr_mob')}>
                          {copiedId === row.remittanceId + '_utr_mob' ? (
                            <FiCheck className="w-2.5 h-2.5 text-green-500" />
                          ) : (
                            <FiCopy className="w-2.5 h-2.5 text-gray-300 shadow-sm" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400">Method</p>
                    <p className="font-bold text-[#0CBB7D]">{row.remittanceMethod || "N/A"}</p>
                  </div>
                </div>

                <AnimatePresence>
                  {detailsPopupId === row.remittanceId && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDetailsPopupId(null)}></div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                        className="absolute right-3 top-12 w-56 bg-white border border-gray-100 rounded-lg shadow-xl p-3 z-50"
                      >
                        <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-50">
                          <span className="font-bold text-gray-700 text-[10px] uppercase italic">Financial Breakdown</span>
                          <button onClick={() => setDetailsPopupId(null)} className="text-gray-400 hover:text-red-500">
                            <span className="text-sm">×</span>
                          </button>
                        </div>
                        <div className="space-y-1.5 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium text-left">Total COD</span>
                            <span className="text-gray-700 font-bold">₹{(Number(row?.orderDetails?.codcal) || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium text-left">Wallet Transfer</span>
                            <span className="text-red-500 font-bold">₹{(Number(row?.amountCreditedToWallet) || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium text-left font-bold">Early COD Fee</span>
                            <span className="text-red-500 font-bold">₹{(Number(row.earlyCodCharges) || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-50 pt-1">
                            <span className="text-gray-400 font-medium font-bold italic text-left">Adjusted Amt</span>
                            <span className="text-gray-700 font-bold">₹{(Number(row.adjustedAmount) || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-50 pt-1 bg-green-50 p-1 rounded">
                            <span className="text-gray-600 font-bold italic text-left">Final Payout</span>
                            <span className="text-[#0CBB7D] font-bold">₹{(Number(row.codAvailable) || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>

      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={totalPages}
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
              <RemittanceDetails remittanceId={selectedRemittanceId} />
            </div>
          </div>
        </div>
      )}

      <CodRemittanceFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        remittanceId={remittanceId}
        utr={utr}
        status={status}
        showUserFilter={false}
        onClearFilters={handleClearFilters}
        onApplyFilters={(filters) => {
          setRemittanceId(filters.remittanceId);
          setUtr(filters.utr);
          setStatus(filters.status);
          setPage(1);
          setIsFilterPanelOpen(false);
        }}
      />
    </div>
  );
};

export default Remittance;