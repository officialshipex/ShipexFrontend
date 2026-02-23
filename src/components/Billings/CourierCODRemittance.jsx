import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ChevronDown, Wallet, Banknote, Clock, CheckCircle, Filter, Download, X, Search, Upload } from "lucide-react";
import dayjs from "dayjs";
import ThreeDotLoader from "../../Loader";
import Cookies from "js-cookie";
import PaginationFooter from "../../Common/PaginationFooter";
import { FaBars } from "react-icons/fa";
import CourierCodPoopup from "./CourierCodPoopup";
import NoDataFound from "../../assets/nodatafound.png";
import DateFilter from "../../filter/DateFilter";
import UserFilter from "../../filter/UserFilter";
import { FiCopy, FiCheck, FiExternalLink, FiUpload, FiMoreHorizontal, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { getCarrierLogo } from "../../Common/getCarrierLogo";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CourierCODRemittance = ({ isSidebarAdmin }) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const [remitedData, setremitedData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [summary, setSummary] = useState({
    totalCODAmount: 0,
    paidCODAmount: 0,
    pendingCODAmount: 0
  });

  // Applied Filters (for API calls)
  const [appliedFilters, setAppliedFilters] = useState({
    selectedUserId: null,
    orderId: "",
    awbNumber: "",
    status: "",
    couriers: []
  });

  // Local Filters (for the filter panel)
  const [localFilters, setLocalFilters] = useState({
    selectedUserId: null,
    orderId: "",
    awbNumber: "",
    status: "",
    couriers: []
  });

  const [dateRange, setDateRange] = useState(null);

  // Internal State
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [copiedId, setCopiedId] = useState(null);

  const [courierSearch, setCourierSearch] = useState("");
  const [courierOptions, setCourierOptions] = useState([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [courierDropdownOpen, setCourierDropdownOpen] = useState(false);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const statusRef = useRef(null);
  const courierRef = useRef(null);
  const bulkActionRef = useRef(null);
  const [clearUserTrigger, setClearUserTrigger] = useState(0);

  const [employeeAccess, setEmployeeAccess] = useState({
    isAdmin: false,
    canView: false,
    canAction: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusRef.current && !statusRef.current.contains(event.target)) setStatusDropdownOpen(false);
      if (courierRef.current && !courierRef.current.contains(event.target)) setCourierDropdownOpen(false);
      if (bulkActionRef.current && !bulkActionRef.current.contains(event.target)) setBulkActionOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearFilters = () => {
    const cleared = {
      selectedUserId: null,
      orderId: "",
      awbNumber: "",
      status: "",
      couriers: []
    };
    setAppliedFilters(cleared);
    setLocalFilters(cleared);
    setDateRange(null);
    setClearTrigger(prev => prev + 1);
    setClearUserTrigger(prev => prev + 1);
    setIsFilterPanelOpen(false);
    setPage(1);
    setCourierDropdownOpen(false);
    setStatusDropdownOpen(false);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("session");
        if (!token) return;

        if (isSidebarAdmin) {
          setEmployeeAccess({ isAdmin: true, canView: true, canAction: true });
        } else {
          const empRes = await axios.get(`${REACT_APP_BACKEND_URL}/staffRole/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const employee = empRes.data.employee;
          const canView = !!employee?.accessRights?.finance?.["Courier COD Remittance"]?.view;
          const canAction = !!employee?.accessRights?.finance?.["Courier COD Remittance"]?.action;
          setEmployeeAccess({ canView, canAction });
          if (!canView) return;
        }

        let url = `${REACT_APP_BACKEND_URL}/cod/courierCodRemittance?page=${page}&limit=${limit}`;
        if (appliedFilters.selectedUserId) {
          url += `&selectedUserId=${encodeURIComponent(appliedFilters.selectedUserId)}`;
          url += `&userSearch=${encodeURIComponent(appliedFilters.selectedUserId)}`;
          url += `&userId=${encodeURIComponent(appliedFilters.selectedUserId)}`;
        }
        if (appliedFilters.orderId) url += `&orderID=${encodeURIComponent(appliedFilters.orderId)}`;
        if (appliedFilters.awbNumber) url += `&awbNumber=${encodeURIComponent(appliedFilters.awbNumber)}`;
        if (appliedFilters.status) url += `&statusFilter=${appliedFilters.status}`;
        if (appliedFilters.couriers.length > 0) {
          url += `&courierProvider=${encodeURIComponent(appliedFilters.couriers.join(","))}`;
        }
        if (dateRange && dateRange[0]?.startDate && dateRange[0]?.endDate) {
          url += `&startDate=${encodeURIComponent(dateRange[0].startDate.toISOString())}`;
          url += `&endDate=${encodeURIComponent(dateRange[0].endDate.toISOString())}`;
        }

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setremitedData(response.data.data.orders);
          setSummary({
            totalCODAmount: response.data.data.totalCODAmount,
            paidCODAmount: response.data.data.paidCODAmount,
            pendingCODAmount: response.data.data.pendingCODAmount
          });
          setTotalPages(response.data.totalPages);

          if (response.data.data.orders.length > 0) {
            const couriers = Array.from(new Set(response.data.data.orders.map(o => o.courierServiceName).filter(Boolean)));
            setCourierOptions(prev => Array.from(new Set([...prev, ...couriers])));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, limit, refresh, appliedFilters, dateRange, isSidebarAdmin]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(remitedData.map(r => r._id || r.orderID));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleExport = () => {
    if (selectedIds.length === 0) return;
    const dataToExport = remitedData.filter(r => selectedIds.includes(r._id || r.orderID));
    const formattedData = dataToExport.map((row) => ({
      Date: dayjs(row.date).format("DD MMM YYYY"),
      "User Name": row.userName || "N/A",
      "Email": row.Email || "N/A",
      "Phone": row.PhoneNumber || "N/A",
      "Order ID": row.orderID,
      "AWB Number": row.AwbNumber,
      "Courier Name": row.courierServiceName,
      "COD Amount": row.CODAmount || 0,
      Status: row.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Courier COD");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `courier_cod_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const summaryItems = [
    { label: "Total COD Amount", value: summary.totalCODAmount, icon: <Banknote size={20} /> },
    { label: "Paid COD Amount", value: summary.paidCODAmount, icon: <CheckCircle size={20} /> },
    { label: "Pending COD Amount", value: summary.pendingCODAmount, icon: <Clock size={20} /> },
  ];

  const fieldStyle = "w-full h-[36px] px-3 text-[12px] font-[600] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0CBB7D] transition-all bg-white";

  const isAnyFilterApplied = appliedFilters.selectedUserId || appliedFilters.orderId || appliedFilters.awbNumber || appliedFilters.status || appliedFilters.couriers.length > 0 || dateRange;

  const filteredCourierOptions = courierOptions.filter(c => c.toLowerCase().includes(courierSearch.toLowerCase()));

  const toggleCourier = (name) => {
    setLocalFilters(prev => ({
      ...prev,
      couriers: prev.couriers.includes(name)
        ? prev.couriers.filter(c => c !== name)
        : [...prev.couriers, name]
    }));
  };

  return (
    <div className="space-y-2">
      {/* Summary Grid */}
      <div className="text-[12px] font-[600]">
        <div className="md:hidden border text-[10px] border-[#0CBB7D] bg-white rounded-lg px-3 py-2 space-y-2">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-gray-500 w-1/2">{item.label}</span>
              <span className="mx-1 text-gray-500">:</span>
              <span className="text-gray-700 w-1/2 text-right">₹{(Number(item.value) || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="hidden md:grid md:grid-cols-3 gap-2 my-2">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-2 bg-white rounded-lg border border-[#0CBB7D] hover:shadow-sm transition-shadow">
              <div className="bg-[#0CBB7D] text-white p-2 rounded-full">{item.icon}</div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-gray-700">₹{(Number(item.value) || 0).toFixed(2)}</span>
                <span className="text-[12px] text-gray-500">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:flex flex-row gap-2 items-center z-20">
        <DateFilter
          onDateChange={(range) => { setDateRange(range); setPage(1); }}
          clearTrigger={clearTrigger}
          noInitialFilter={true}
        />

        <button
          onClick={() => setIsFilterPanelOpen(true)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm h-9"
        >
          <Filter className="w-4 h-4 text-[#0CBB7D]" />
          More Filters
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {isAnyFilterApplied && (
            <button onClick={handleClearFilters} className="text-[12px] text-red-500 hover:underline font-bold px-2 whitespace-nowrap">
              Clear All Filters
            </button>
          )}
          <button onClick={() => setShowUpload(true)} disabled={!employeeAccess.canAction && !employeeAccess.isAdmin} className={`h-[36px] px-3 rounded-lg text-[12px] font-bold transition-all focus:scale-95 flex items-center justify-center gap-1 ${employeeAccess.canAction || employeeAccess.isAdmin ? "bg-[#0CBB7D] text-white hover:bg-opacity-90 shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <button
            onClick={handleExport}
            disabled={selectedIds.length === 0}
            className={`h-9 px-4 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1 border transition-all ${selectedIds.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50 shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"}`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Mobile Filter Row & Select All Combined Action Bar */}
      <div className="md:hidden flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <DateFilter
              onDateChange={(range) => { setDateRange(range); setPage(1); }}
              clearTrigger={clearTrigger}
              noInitialFilter={true}
            />
          </div>

          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 h-[34px] bg-white border border-gray-300 rounded-lg text-[10px] font-bold text-gray-700 whitespace-nowrap"
          >
            <Filter className="w-3 h-3 text-[#0CBB7D]" />
            More Filters
          </button>

          <button
            onClick={() => setShowUpload(true)}
            disabled={!employeeAccess.canAction && !employeeAccess.isAdmin}
            className={`p-2.5 rounded-lg active:scale-95 transition-transform ${employeeAccess.canAction || employeeAccess.isAdmin ? "bg-[#0CBB7D] text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            <FiUpload className="w-3 h-3" />
          </button>

          {isAnyFilterApplied && (
            <button onClick={handleClearFilters} className="p-2.5 bg-red-50 text-red-500 rounded-lg border border-red-100">
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between bg-white p-2 gap-2 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg w-full">
            <input
              type="checkbox"
              checked={remitedData.length > 0 && selectedIds.length === remitedData.length}
              onChange={handleSelectAll}
              className="w-3 h-3 accent-[#0CBB7D] cursor-pointer shadow-sm"
            />
            <span className="text-[10px] font-bold text-gray-700 tracking-tight">Select All</span>
          </div>

          <div className="relative" ref={bulkActionRef} >
            <button
              onClick={() => setBulkActionOpen(!bulkActionOpen)}
              className={`py-[8px] px-3 rounded-lg border transition-all ${selectedIds.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] shadow-sm" : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"}`}
              disabled={selectedIds.length === 0}
            >
              <FaBars className="w-3 h-3" />
            </button>

            {bulkActionOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-popup-in">
                <button
                  onClick={() => { handleExport(); setBulkActionOpen(false); }}
                  className="w-full px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-green-50 hover:text-[#0CBB7D] flex items-center gap-2.5 transition-colors border-b border-gray-50"
                >
                  <Download className="w-3 h-3 text-[#0CBB7D]" />
                  Export
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="h-[calc(100vh-300px)] overflow-y-auto bg-white overflow-hidden shadow-sm shadow-green-50/50">
          <table className="w-full text-[12px] border-collapse sticky-header">
            <thead className="bg-[#0CBB7D] text-white font-bold sticky top-0 z-10 text-left">
              <tr>
                <th className="py-2 px-3">
                  <div className="flex justify-center items-center">
                    <input type="checkbox" checked={remitedData.length > 0 && selectedIds.length === remitedData.length} onChange={handleSelectAll} className="cursor-pointer accent-[#0CBB7D] w-3 h-3" />
                  </div>
                </th>
                <th className="py-2 px-3">User Details</th>
                <th className="py-2 px-3">Order ID</th>
                <th className="py-2 px-3">Shipping Details</th>
                <th className="py-2 px-3">COD Amount</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center"><ThreeDotLoader /></td></tr>
              ) : remitedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <img src={NoDataFound} alt="No Data" className="w-60 h-60 mx-auto" />
                  </td>
                </tr>
              ) : (
                remitedData.map((row, index) => {
                  const rowId = row._id || row.orderID;
                  return (
                    <tr key={index} className="border-t border-gray-200 hover:bg-green-50/30 transition-colors">
                      <td className="py-2 px-3">
                        <div className="flex justify-center items-center">
                          <input type="checkbox" checked={selectedIds.includes(rowId)} onChange={() => handleSelectRow(rowId)} className="cursor-pointer accent-[#0CBB7D] w-3 h-3" />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {/* <p className="text-gray-700">{row.userId}</p> */}
                        <p className="text-gray-700">{row.userName}</p>
                        <p className="text-gray-700">{row.Email}</p>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2 group">
                          <Link to={`/dashboard/order/neworder/updateOrder/${row.orderID}`} className="text-[#0CBB7D] font-bold hover:underline transition-all">
                            {row.orderID}
                          </Link>
                          <button onClick={() => handleCopy(row.orderID, row.orderID)} className="p-1 hover:bg-green-100 rounded text-gray-400 hover:text-[#0CBB7D] transition-all opacity-0 group-hover:opacity-100">
                            {copiedId === row.orderID ? <FiCheck className="text-green-500 w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3 leading-tight">
                        <div className="flex items-center gap-2 group">
                          <Link to={`/dashboard/order/tracking/${row.AwbNumber}`} className="text-[#0CBB7D] font-bold flex items-center gap-1 hover:underline">
                            {row.AwbNumber}

                          </Link>
                          <button onClick={() => handleCopy(row.AwbNumber, row.AwbNumber + '_awb')} className="p-1 hover:bg-green-100 rounded text-gray-400 hover:text-[#0CBB7D] transition-all opacity-0 group-hover:opacity-100">
                            {copiedId === row.AwbNumber + '_awb' ? <FiCheck className="text-green-500 w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-gray-700 text-[12px]">{row.courierServiceName}</p>
                          <p className="text-[12px] text-gray-500 whitespace-nowrap">Delivered On : {dayjs(row.date).format("DD MMM YYYY")}</p>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-gray-700">₹{(Number(row.CODAmount) || 0).toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] shadow-sm ${row.status === "Paid" ? "bg-green-100 text-[#0CBB7D]" : "bg-red-100 text-red-600"}`}>{row.status}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col space-y-2 h-[calc(100vh-320px)] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-20"><ThreeDotLoader /></div>
        ) : remitedData.length === 0 ? (
          <div className="flex justify-center items-center py-20 flex-col">
            <img src={NoDataFound} className="w-60 h-60 opacity-50" />
          </div>
        ) : (
          remitedData.map((row, index) => {
            const rowId = row._id || row.orderID;
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 text-[10px] animate-popup-in">
                {/* Header Bar */}
                <div className="flex gap-2 justify-between rounded-lg bg-green-50 py-1.5 px-2 items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(rowId)}
                      onChange={() => handleSelectRow(rowId)}
                      className="w-3 h-3 accent-[#0CBB7D] cursor-pointer"
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
                      {row?.courierServiceName || "N/A"}
                    </span>
                    <span className="text-gray-500 text-[10px]">
                      Delivered On : {dayjs(row.date).format("DD MMM YYYY")}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${row.status === "Paid" ? "bg-green-100 text-[#0CBB7D]" : "bg-red-100 text-red-600"}`}>
                      {row.status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-2 mb-1 p-0.5 items-center">
                  <div>
                    <p className="text-gray-500 font-[600] text-[10px] tracking-tighter">Order ID</p>
                    <div className="flex items-center gap-1">
                      <Link to={`/dashboard/order/neworder/updateOrder/${row.orderID}`} className="text-[#0CBB7D] font-[600] text-[10px] hover:underline truncate max-w-[60px]">
                        #{row.orderID}
                      </Link>
                      <button onClick={() => handleCopy(row.orderID, row.orderID + '_m')}>
                        {copiedId === row.orderID + '_m' ? <FiCheck className="w-2 h-2 text-[#0CBB7D]" /> : <FiCopy className="w-3 h-3 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-500 font-[600] text-[10px] tracking-tighter">COD Amount</p>
                    <p className="font-bold text-[10px] text-gray-700">
                      ₹{(Number(row.CODAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-500 font-[600] text-[10px] tracking-tighter">AWB Number</p>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-[#0CBB7D] font-[600] truncate text-[10px] max-w-[70px]">
                        {row.AwbNumber || "N/A"}
                      </span>
                      <button onClick={() => handleCopy(row.AwbNumber, row.AwbNumber + '_m_m')}>
                        {copiedId === row.AwbNumber + '_m_m' ? <FiCheck className="w-2 h-2 text-[#0CBB7D]" /> : <FiCopy className="w-3 h-3 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="mt-2 flex items-center justify-between px-0.5 border-t border-gray-100 pt-2">
                  <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                    <div className="w-7 h-7 rounded-full bg-[#0CBB7D]/10 border border-[#0CBB7D]/20 flex items-center justify-center font-bold text-[#0CBB7D] text-[10px] shrink-0 shadow-sm uppercase">
                      {row.userName?.charAt(0) || "U"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-700 text-[10px] truncate w-full" title={row.userName}>
                        {row.userName || "N/A"}
                      </p>
                      <p className="text-gray-500 text-[10px] truncate w-full" title={row.Email}>
                        {row.Email || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <p className="text-gray-700 font-bold text-[10px] tracking-tight">
                      {row.PhoneNumber || "N/A"}
                    </p>
                    {/* {row.userId && (
                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        ID: {row.userId}
                      </span>
                    )} */}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <PaginationFooter page={page} setPage={setPage} totalPages={totalPages} limit={limit} setLimit={setLimit} />

      {showUpload && <CourierCodPoopup onClose={() => setShowUpload(false)} setRefresh={setRefresh} />}

      {/* Enhanced Side Filter Panel */}
      <AnimatePresence>
        {isFilterPanelOpen && (
          <div className="fixed inset-0 z-[110] flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-all" onClick={() => setIsFilterPanelOpen(false)}></div>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "0%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[340px] bg-white h-full shadow-2xl flex flex-col border-l border-gray-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
                <h2 className="text-[16px] font-bold text-gray-700 tracking-tight">Filters</h2>
                <button onClick={() => setIsFilterPanelOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-all group">
                  <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                {/* User Selector */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[12px] font-[600] text-gray-700">Search User</label>
                  </div>
                  <UserFilter
                    onUserSelect={(id) => setLocalFilters(prev => ({ ...prev, selectedUserId: id }))}
                    clearTrigger={clearUserTrigger}
                  />

                </div>

                {/* Order ID */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-[600] text-gray-700 tracking-wide">Order ID</label>
                  <input
                    type="text"
                    placeholder="Enter Order ID"
                    className="w-full h-9 px-3 text-[12px] font-[600] border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] transition-all text-gray-700 placeholder:text-gray-400 placeholder:font-[500]"
                    value={localFilters.orderId}
                    onChange={e => setLocalFilters(prev => ({ ...prev, orderId: e.target.value }))}
                  />
                </div>

                {/* AWB Number */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-[600] text-gray-700 tracking-wide">AWB Number</label>
                  <input
                    type="text"
                    placeholder="Enter AWB Number"
                    className="w-full h-9 px-3 text-[12px] font-[600] border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] transition-all text-gray-700 placeholder:text-gray-400 placeholder:font-[500]"
                    value={localFilters.awbNumber}
                    onChange={e => setLocalFilters(prev => ({ ...prev, awbNumber: e.target.value }))}
                  />
                </div>

                {/* Status Dropdown */}
                <div className="space-y-1.5" ref={statusRef}>
                  <label className="text-[12px] font-[600] text-gray-700 tracking-wide">Status</label>
                  <div className="relative">
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className={`w-full h-9 px-3 text-[12px] font-[600] border rounded-lg focus:outline-none flex items-center justify-between transition-all bg-white text-left ${statusDropdownOpen ? "border-[#0CBB7D]" : "border-gray-300"}`}
                    >
                      <span className={localFilters.status ? "text-gray-700" : "text-gray-400"}>
                        {localFilters.status || "Select Status"}
                      </span>
                      <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {statusDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-[120] py-1 border border-gray-200"
                        >
                          {["Paid", "Pending"].map(s => (
                            <div
                              key={s}
                              onClick={() => { setLocalFilters(prev => ({ ...prev, status: s })); setStatusDropdownOpen(false); }}
                              className={`px-3 py-2 text-[12px] font-[600] cursor-pointer transition-colors ${localFilters.status === s ? "bg-green-50 text-[#0CBB7D]" : "text-gray-500 hover:bg-gray-50 hover:text-[#0CBB7D]"}`}
                            >
                              {s}
                            </div>
                          ))}
                          {localFilters.status && (
                            <div
                              onClick={() => { setLocalFilters(prev => ({ ...prev, status: "" })); setStatusDropdownOpen(false); }}
                              className="mx-1 mt-1 px-3 py-2 text-[11px] text-red-500 font-bold border-t border-gray-50 hover:bg-red-50 transition-colors text-center cursor-pointer"
                            >
                              Clear Selection
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Courier Selection Dropdown */}
                <div className="space-y-1.5" ref={courierRef}>
                  <label className="text-[12px] font-[600] text-gray-700 tracking-wide">Courier Service</label>
                  <div className="relative">
                    <button
                      onClick={() => setCourierDropdownOpen(!courierDropdownOpen)}
                      className={`w-full h-9 px-3 text-[12px] font-[600] border rounded-lg focus:outline-none flex items-center justify-between transition-all bg-white text-left ${courierDropdownOpen ? "border-[#0CBB7D]" : "border-gray-300"}`}
                    >
                      <span className={localFilters.couriers.length > 0 ? "text-gray-700" : "text-gray-400"}>
                        {localFilters.couriers.length > 0 ? `${localFilters.couriers.length} Selected` : "Select Couriers"}
                      </span>
                      <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${courierDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {courierDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-[120] p-2 space-y-2"
                        >
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="text"
                              value={courierSearch}
                              onChange={e => setCourierSearch(e.target.value)}
                              placeholder="Search couriers..."
                              className="w-full h-8 pl-8 pr-3 text-[11px] font-[500] border border-gray-200 rounded-md focus:border-[#0CBB7D] focus:outline-none transition-all"
                            />
                          </div>

                          <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1 custom-scrollbar-thin">
                            {filteredCourierOptions.length > 0 ? filteredCourierOptions.map(c => (
                              <label key={c} className={`flex items-center gap-2.5 p-1.5 rounded-md cursor-pointer transition-all ${localFilters.couriers.includes(c) ? "bg-green-50 text-[#0CBB7D]" : "hover:bg-gray-50 text-gray-600"}`}>
                                <input
                                  type="checkbox"
                                  checked={localFilters.couriers.includes(c)}
                                  onChange={() => toggleCourier(c)}
                                  className="w-3.5 h-3.5 accent-[#0CBB7D] rounded border-gray-300"
                                />
                                <span className="text-[11px] font-[600]">{c}</span>
                              </label>
                            )) : <p className="text-[10px] text-gray-400 text-center py-4 font-bold">No couriers found</p>}
                          </div>

                          {localFilters.couriers.length > 0 && (
                            <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                              <span className="text-[10px] text-gray-400 font-bold">{localFilters.couriers.length} selected</span>
                              <button
                                onClick={() => setLocalFilters(prev => ({ ...prev, couriers: [] }))}
                                className="text-[10px] text-red-500 font-bold hover:underline"
                              >
                                Clear All
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-100 bg-white flex gap-3 mt-auto">
                <button
                  onClick={handleClearFilters}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-lg text-[12px] font-[600] hover:bg-gray-50 hover:text-red-500 transition-all shadow-sm active:scale-95"
                >
                  Reset All
                </button>
                <button
                  onClick={() => {
                    setAppliedFilters(localFilters);
                    setPage(1);
                    setIsFilterPanelOpen(false);
                    setCourierDropdownOpen(false);
                    setStatusDropdownOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-[#0CBB7D] text-white rounded-lg text-[12px] font-[600] hover:bg-green-600 transition-all shadow-md active:scale-95"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourierCODRemittance;
