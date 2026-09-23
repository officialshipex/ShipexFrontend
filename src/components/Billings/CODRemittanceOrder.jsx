import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ChevronDown, Wallet, Banknote, Minus, Send, Filter, X, Download, Search, Upload, Clock, CheckCircle, FileSpreadsheet } from "lucide-react";
import dayjs from "dayjs";
import ThreeDotLoader from "../../Loader";
import Cookies from "js-cookie";
import PaginationFooter from "../../Common/PaginationFooter";
import { FiCopy, FiCheck, FiUpload, FiTrash2 } from "react-icons/fi";
import { FaBars } from "react-icons/fa";
import NoDataFound from "../../Common/NoDataFound";
import DateFilter from "../../filter/DateFilter";
import UserFilter from "../../filter/UserFilter";
import { motion, AnimatePresence } from "framer-motion";
import RemittanceDetails from "./SellerRemittanceDatas";
import { Notification } from "../../Notification";
import TranseferCODModal from "./TransferCODModal";
import CodUploadPoopup from "./CodUploadPoopup";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CODRemittanceOrder = ({ isSidebarAdmin }) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [remitedSummary, setRemitedSummary] = useState({});
  const [remitedData, setremitedData] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [selectedRemittanceIds, setSelectedRemittanceIds] = useState([]);

  // Applied Filters
  const [appliedFilters, setAppliedFilters] = useState({
    selectedUserId: null,
    remittanceId: "",
    status: "",
  });

  // Local Filters
  const [localFilters, setLocalFilters] = useState({
    selectedUserId: null,
    remittanceId: "",
    status: "",
  });

  const [dateRange, setDateRange] = useState(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const bulkActionDesktopRef = useRef(null);
  const bulkActionMobileRef = useRef(null);
  const statusRef = useRef(null);

  const [openRemittancePopup, setOpenRemittancePopup] = useState(false);
  const [selectedRemittanceId, setSelectedRemittanceId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [detailsPopupId, setDetailsPopupId] = useState(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [clearUserTrigger, setClearUserTrigger] = useState(0);

  const [employeeAccess, setEmployeeAccess] = useState({
    isAdmin: false,
    canView: false,
    canAction: false,
  });
  const [showUpload, setShowUpload] = useState(false);
  const [showTransferCODModal, setShowTransferCODModal] = useState(false);
  const [transferCODUserId, setTransferCODUserId] = useState(null);
  const [bankExportLoading, setBankExportLoading] = useState(false);
  const [showBankResponseUpload, setShowBankResponseUpload] = useState(false);
  const [bankResponseUploading, setBankResponseUploading] = useState(false);
  const [selectedBankFile, setSelectedBankFile] = useState(null);
  const bankFileInputRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideDesktop = bulkActionDesktopRef.current && !bulkActionDesktopRef.current.contains(event.target);
      const isOutsideMobile = bulkActionMobileRef.current && !bulkActionMobileRef.current.contains(event.target);

      // Only close if it's outside BOTH (because they share the same state)
      if (isOutsideDesktop && isOutsideMobile) {
        setBulkActionOpen(false);
      }

      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleClearFilters = () => {
    const cleared = {
      selectedUserId: null,
      remittanceId: "",
      status: "",
    };
    setAppliedFilters(cleared);
    setLocalFilters(cleared);
    setDateRange(null);
    setClearTrigger(prev => prev + 1);
    setClearUserTrigger(prev => prev + 1);
    setPage(1);
    setIsFilterPanelOpen(false);
    setStatusDropdownOpen(false);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const fetchAccessAndData = async () => {
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
          const canView = !!employee?.accessRights?.finance?.["Seller COD Remittance"]?.view;
          const canAction = !!employee?.accessRights?.finance?.["Seller COD Remittance"]?.action;
          setEmployeeAccess({ canView, canAction });
          if (!canView) return;
        }

        let url = `${REACT_APP_BACKEND_URL}/cod/getAdminCodRemitanceData?page=${page}&limit=${limit}`;
        if (appliedFilters.selectedUserId) url += `&selectedUserId=${appliedFilters.selectedUserId}`;
        if (appliedFilters.remittanceId) url += `&remittanceIdFilter=${encodeURIComponent(appliedFilters.remittanceId)}`;
        if (appliedFilters.status) url += `&statusFilter=${appliedFilters.status}`;
        if (dateRange && dateRange[0]?.startDate && dateRange[0]?.endDate) {
          url += `&startDate=${encodeURIComponent(dateRange[0].startDate.toISOString())}`;
          url += `&endDate=${encodeURIComponent(dateRange[0].endDate.toISOString())}`;
        }

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setRemitedSummary(response.data.summary);
          setremitedData(response.data.results || []);
          setTotalPages(response.data.totalPages || 1);
        }
      } catch (error) {
        console.error("Error fetching remittance data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccessAndData();
  }, [page, limit, refresh, appliedFilters, dateRange, isSidebarAdmin]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRemittanceIds(remitedData.map((r) => r.remittanceId));
    } else {
      setSelectedRemittanceIds([]);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedRemittanceIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleExport = () => {
    if (selectedRemittanceIds.length === 0) return;
    const exportData = remitedData.filter(item => selectedRemittanceIds.includes(item.remittanceId));
    const formattedData = exportData.map((row) => ({
      Date: dayjs(row.date).format("DD MMM YYYY"),
      "User Name": row.user?.fullname || "N/A",
      "Remittance ID": row.remittanceId,
      "UTR": row.utr || "N/A",
      "Total COD Amount": (Number(row.codAvailable) || 0) + (Number(row.adjustedAmount) || 0),
      "Amount Credited to Wallet": row.amountCreditedToWallet || 0,
      "Early COD Charges": row.earlyCodCharges || 0,
      "Adjusted Amount": row.adjustedAmount || 0,
      "Remittance Amount": row.remittanceInitiated || 0,
      Status: row.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Remittances");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `remittances_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleTransferCOD = async () => {
    if (selectedRemittanceIds.length === 0) return;
    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/cod/validateCODTransfer`,
        { remittanceIds: selectedRemittanceIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransferCODUserId(response.data.userId);
      setShowTransferCODModal(true);
    } catch (error) {
      Notification(error?.response?.data?.message || "Error transferring COD", "error");
    }
  };

  // Export Bank Template — supports single & multi-user bulk
  const handleExportBankTemplate = async () => {
    if (selectedRemittanceIds.length === 0) return;
    setBankExportLoading(true);
    try {
      const token = Cookies.get("session");
      const params = new URLSearchParams();
      selectedRemittanceIds.forEach(id => params.append("selectedRemittanceIds", id));
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/cod/exportBankTemplate?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { rows, heldCount, topUpCount, payableCount, skippedPaid, userErrors } = response.data;

      // Show informational warnings
      if (skippedPaid > 0) {
        Notification(`${skippedPaid} remittance(s) already Paid — skipped from template`, "warning");
      }
      if (heldCount > 0) {
        Notification(`${heldCount} remittance(s) HELD (hold amount) — excluded from template`, "warning");
      }
      if (topUpCount > 0) {
        Notification(`${topUpCount} remittance(s) used for wallet top-up — excluded from template`, "info");
      }
      if (userErrors && userErrors.length > 0) {
        userErrors.forEach(err => Notification(err, "error"));
      }
      if (!rows || rows.length === 0) {
        Notification("No payable remittances to export", "info");
        return;
      }

      // Build XLSX in bank's exact column format
      const HEADERS = [
        "Debit Account Number",
        "Payment mode",
        "Amount",
        "Beneficiary Name",
        "Beneficiary Account",
        "Beneficiary Bank IFSC",
        "Remarks",
        "Beneficiary LEI",
      ];
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });

      // Set column widths — auto-fit based on header + data content
      const colWidths = HEADERS.map(header => {
        const headerLen = header.length;
        const maxDataLen = rows.reduce((max, row) => {
          const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : "";
          return Math.max(max, val.length);
        }, 0);
        return { wch: Math.max(headerLen, maxDataLen) + 3 }; // +3 for padding
      });
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bulk Payment Template");
      const buf = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([buf], { type: "application/octet-stream" }),
        `bank_payment_template_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      Notification(`Bank template exported: ${payableCount} remittance(s)`, "success");
    } catch (error) {
      Notification(error?.response?.data?.message || "Failed to export bank template", "error");
    } finally {
      setBankExportLoading(false);
    }
  };

  const handleOpenBankResponseUpload = async () => {
    if (selectedRemittanceIds.length === 0) {
      Notification("Please select at least one remittance in the table first", "warning");
      return;
    }

    try {
      const token = Cookies.get("session");
      const res = await axios.post(
        `${REACT_APP_BACKEND_URL}/cod/validateExportedStatus`,
        { selectedRemittanceIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setShowBankResponseUpload(true);
      } else {
        Notification(res.data?.message || "Some selected remittance IDs are not exported yet. Please export them first.", "error");
      }
    } catch (error) {
      Notification(error?.response?.data?.message || "Failed to validate exported status of selected remittances", "error");
    }
  };

  // Parse bank response file and send to backend
  const handleBankResponseSubmit = () => {
    if (!selectedBankFile) return;
    setBankResponseUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Map bank column headers to our internal field names
        // Bank columns: Reference Number | UTR Number | Beneficiary Name | Beneficiary Account | Amount | Status | Reason of failure/return
        const mappedRows = jsonRows.map(r => ({
          remarks: String(r["Remarks"] || "").trim(),
          referenceNumber: String(r["Reference Number"] || "").trim(),
          utrNumber: String(r["UTR Number"] || r["UTR"] || "").trim(),
          beneficiaryName: String(r["Beneficiary Name"] || "").trim(),
          beneficiaryAccount: String(r["Beneficiary Account"] || "").trim(),
          amount: Number(r["Amount"] || 0),
          status: String(r["Status"] || "").trim(),
          reason: String(r["Reason of failure/return"] || "").trim(),
        }));

        const token = Cookies.get("session");
        const response = await axios.post(
          `${REACT_APP_BACKEND_URL}/cod/uploadBankResponse`,
          { rows: mappedRows, selectedRemittanceIds },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { successCount, skippedCount, errorCount } = response.data;
        Notification(
          `Bank response processed: ${successCount} paid, ${skippedCount} skipped, ${errorCount} errors`,
          successCount > 0 ? "success" : "info"
        );
        setShowBankResponseUpload(false);
        setSelectedBankFile(null);
        setRefresh(prev => !prev);
      } catch (error) {
        Notification(error?.response?.data?.message || "Failed to process bank response", "error");
      } finally {
        setBankResponseUploading(false);
        if (bankFileInputRef.current) bankFileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(selectedBankFile);
  };

  const openRemittanceDetails = (id) => {
    setSelectedRemittanceId(id);
    setOpenRemittancePopup(true);
  };

  const summaryItems = [
    { title: "COD To Be Remitted", value: remitedSummary?.CODToBeRemitted, icon: <Wallet size={18} /> },
    { title: "Last COD Remitted", value: remitedSummary?.LastCODRemitted, icon: <Send size={18} /> },
    { title: "Total COD Remitted", value: remitedSummary?.TotalCODRemitted, icon: <Banknote size={18} /> },
    { title: "Total Deduction", value: remitedSummary?.TotalDeductionfromCOD, icon: <Minus size={18} /> },
    { title: "Remittance Initiated", value: remitedSummary?.RemittanceInitiated, icon: <Clock size={18} /> },
  ];

  const isAnyFilterApplied = appliedFilters.selectedUserId || appliedFilters.remittanceId || appliedFilters.status || dateRange;

  return (
    <div className="space-y-2">
      {/* Summary Grid */}
      <div className="text-[12px] font-bold">
        <div className="md:hidden border text-[10px] border-brand-primary bg-white rounded-lg px-3 py-2 space-y-2">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-gray-500 w-1/2">{item.title}</span>
              <span className="mx-1 text-gray-500">:</span>
              <span className="text-gray-700 w-1/2 text-right">₹{(Number(item.value) || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="hidden md:grid md:grid-cols-5 gap-2 my-2">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-2 bg-white rounded-lg border border-brand-primary hover:shadow-sm transition-shadow">
              <div className="bg-brand-primary text-white p-2 rounded-full shrink-0">{item.icon}</div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-bold text-gray-700 truncate">₹{(Number(item.value) || 0).toFixed(2)}</span>
                <span className="text-[12px] text-gray-500 truncate">{item.title}</span>
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
          <Filter className="w-4 h-4 text-brand-primary" />
          More Filters
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {isAnyFilterApplied && (
            <button onClick={handleClearFilters} className="text-[12px] text-red-500 hover:underline font-bold px-2 whitespace-nowrap">
              Clear All Filters
            </button>
          )}
          {/* <button onClick={() => setShowUpload(true)} disabled={!employeeAccess.canAction && !employeeAccess.isAdmin} className={`h-9 px-3 rounded-lg text-[12px] font-bold transition-all focus:scale-95 flex items-center justify-center gap-1 ${employeeAccess.canAction || employeeAccess.isAdmin ? "bg-brand-primary text-white hover:bg-opacity-90 shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            <Upload className="w-4 h-4" />
            Upload
          </button> */}

          <div className="relative" ref={bulkActionDesktopRef}>
            <button
              disabled={selectedRemittanceIds.length === 0}
              onClick={() => setBulkActionOpen(!bulkActionOpen)}
              className={`h-9 px-4 rounded-lg text-[12px] font-bold flex items-center gap-1 border transition-all ${selectedRemittanceIds.length > 0 ? "border-brand-primary text-brand-primary hover:bg-green-50 shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"}`}
            >
              Actions
              <ChevronDown className={`w-4 h-4 transition-transform ${bulkActionOpen ? "rotate-180" : ""}`} />
            </button>
            {bulkActionOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl w-52 text-[12px] z-[100] animate-popup-in overflow-hidden border">
                <div className="px-4 py-2 hover:bg-green-50 cursor-pointer font-bold text-gray-700 flex items-center gap-2 border-b border-gray-50 transition-colors" onClick={() => { handleExport(); setBulkActionOpen(false); }}>
                  <Download className="w-4 h-4 text-brand-primary" /> Export Data
                </div>
                <div
                  className={`px-4 py-2 hover:bg-green-50 cursor-pointer font-bold text-gray-700 flex items-center gap-2 border-b border-gray-50 transition-colors ${bankExportLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                  onClick={() => { if (!bankExportLoading) { handleExportBankTemplate(); setBulkActionOpen(false); } }}
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                  {bankExportLoading ? "Generating..." : "Export Bank Template"}
                </div>
                <div className="px-4 py-2 hover:bg-green-50 cursor-pointer font-bold text-gray-700 flex items-center gap-2 border-b border-gray-50 transition-colors" onClick={() => { handleOpenBankResponseUpload(); setBulkActionOpen(false); }}>
                  <Upload className="w-4 h-4 text-orange-500" /> Upload Bank Response
                </div>
                <div className="px-4 py-2 hover:bg-green-50 cursor-pointer font-bold text-gray-700 flex items-center gap-2 transition-colors" onClick={() => { handleTransferCOD(); setBulkActionOpen(false); }}>
                  <Send className="w-4 h-4 text-brand-primary" /> Transfer COD
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Bar */}
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
            <Filter className="w-3 h-3 text-brand-primary" />
            More Filters
          </button>

          {/* <button
            onClick={() => setShowUpload(true)}
            disabled={!employeeAccess.canAction && !employeeAccess.isAdmin}
            className={`p-2.5 rounded-lg active:scale-95 transition-transform ${employeeAccess.canAction || employeeAccess.isAdmin ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            <FiUpload className="w-3 h-3" />
          </button> */}

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
              checked={remitedData.length > 0 && selectedRemittanceIds.length === remitedData.length}
              onChange={handleSelectAll}
              className="w-3 h-3 accent-brand-primary cursor-pointer shadow-sm"
            />
            <span className="text-[10px] font-bold text-gray-700 tracking-tight">Select All</span>
          </div>

          <div className="relative" ref={bulkActionMobileRef}>
            <button
              onClick={() => setBulkActionOpen(!bulkActionOpen)}
              className={`py-[8px] px-3 rounded-lg border transition-all ${selectedRemittanceIds.length > 0 ? "border-brand-primary text-brand-primary shadow-sm" : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"}`}
              disabled={selectedRemittanceIds.length === 0}
            >
              <FaBars className="w-3 h-3" />
            </button>

            {bulkActionOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-popup-in">
                <button
                  onClick={() => { handleExport(); setBulkActionOpen(false); }}
                  className="w-full px-4 py-2 text-[12px] font-bold text-gray-700 hover:bg-green-50 hover:text-brand-primary flex items-center gap-2.5 transition-colors border-b border-gray-50"
                >
                  <Download className="w-3 h-3 text-brand-primary" /> Export Data
                </button>
                <button
                  onClick={() => { if (!bankExportLoading) { handleExportBankTemplate(); setBulkActionOpen(false); } }}
                  className="w-full px-4 py-2 text-[12px] font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors border-b border-gray-50"
                >
                  <FileSpreadsheet className="w-3 h-3 text-blue-500" /> {bankExportLoading ? "Generating..." : "Bank Template"}
                </button>
                <button
                  onClick={() => {
                    handleOpenBankResponseUpload();
                    setBulkActionOpen(false);
                  }}
                  className="w-full px-4 py-2 text-[12px] font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2.5 transition-colors border-b border-gray-50"
                >
                  <Upload className="w-3 h-3 text-orange-500" /> Bank Response
                </button>
                <button
                  onClick={() => { handleTransferCOD(); setBulkActionOpen(false); }}
                  className="w-full px-4 py-2 text-[12px] font-bold text-gray-700 hover:bg-green-50 hover:text-brand-primary flex items-center gap-2.5 transition-colors"
                >
                  <Send className="w-3 h-3 text-brand-primary" /> Transfer COD
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
            <thead className="bg-brand-primary text-white font-bold sticky top-0 z-10 text-center tracking-wider">
              <tr>
                <th className="py-2 px-3">
                  <div className="flex justify-center items-center">
                    <input type="checkbox" checked={remitedData.length > 0 && selectedRemittanceIds.length === remitedData.length} onChange={handleSelectAll} className="accent-brand-primary cursor-pointer w-3 h-3" />
                  </div>
                </th>
                <th className="py-2 px-3 text-left">Date</th>
                <th className="py-2 px-3 text-left">User</th>
                <th className="py-2 px-3">Remittance ID</th>
                <th className="py-2 px-3">UTR</th>
                <th className="py-2 px-3">Total COD Amount</th>
                <th className="py-2 px-3">Amount Credited to Wallet	</th>
                <th className="py-2 px-3">Adjusted Amount</th>
                <th className="py-2 px-3">Early COD Charges</th>
                <th className="py-2 px-3">Remittance Amount</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {loading ? (
                <tr><td colSpan={11} className="py-10"><ThreeDotLoader /></td></tr>
              ) : remitedData.length === 0 ? (
                <tr><td colSpan={11} className="py-10 text-center"><NoDataFound alt="No Data" className="w-60 h-60 mx-auto" /></td></tr>
              ) : (
                remitedData.map((row, index) => (
                  <tr key={index} className="border-t border-gray-100 hover:bg-green-50/20 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex justify-center items-center">
                        <input type="checkbox" checked={selectedRemittanceIds.includes(row.remittanceId)} onChange={() => handleCheckboxChange(row.remittanceId)} className="accent-brand-primary cursor-pointer w-3 h-3" />
                      </div>
                    </td>
                    <td className="py-2 px-3 text-left text-gray-700">
                      {dayjs(row.date).format("DD MMM YYYY, dddd")}
                    </td>
                    <td className="py-2 px-3 text-left min-w-[150px]">
                      <p className="text-gray-700 truncate max-w-[180px]">{row.user?.name}</p>
                      <p className="text-gray-500 truncate max-w-[180px]">{row.user?.email}</p>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-2 group">
                        <button onClick={() => openRemittanceDetails(row.remittanceId)} className="text-brand-primary font-bold hover:underline transition-all">
                          {row.remittanceId}
                        </button>
                        <button onClick={() => handleCopy(row.remittanceId, row.remittanceId)} className="p-1 hover:bg-green-100 rounded text-gray-400 hover:text-brand-primary transition-all opacity-0 group-hover:opacity-100">
                          {copiedId === row.remittanceId ? <FiCheck className="text-green-500 w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-brand-primary font-[600]">
                      <div className="flex items-center justify-center gap-1 group">
                        <span>{row.utr || "N/A"}</span>
                        {row.utr && (
                          <button onClick={() => handleCopy(row.utr, row.remittanceId + '_utr')} className="p-1 hover:bg-green-100 rounded text-gray-400 hover:text-brand-primary transition-all opacity-0 group-hover:opacity-100">
                            {copiedId === row.remittanceId + '_utr' ? <FiCheck className="text-green-500 w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-700">₹{((Number(row.codAvailable) || 0) + (Number(row.adjustedAmount) || 0)).toFixed(2)}</td>
                    <td className="py-2 px-3 text-red-500">₹{(Number(row.amountCreditedToWallet) || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-gray-700">₹{(Number(row.adjustedAmount) || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-red-700">₹{(Number(row.earlyCodCharges) || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-brand-primary font-[600]">₹{(Number(row.remittanceInitiated) || 0).toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] shadow-sm ${row.status === "Paid" ? "bg-brand-secondary/10 text-brand-primary" : "bg-orange-100 text-orange-600"}`}>{row.status}</span>
                    </td>
                  </tr>
                ))
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
          <NoDataFound className="w-40 mx-auto mt-20 opacity-50" />
        ) : (
          remitedData.map((row, index) => (
            <div key={index} className={`bg-white border border-gray-200 rounded-lg shadow-sm p-2 text-[10px] animate-popup-in relative ${detailsPopupId === row.remittanceId ? 'z-50' : 'z-10'}`}>
              {/* Header Bar - Consistent with Admin UI */}
              <div className="flex gap-2 justify-between rounded-lg bg-green-50 py-1.5 px-2 items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRemittanceIds.includes(row.remittanceId)}
                    onChange={() => handleCheckboxChange(row.remittanceId)}
                    className="w-3.5 h-3.5 accent-brand-primary"
                  />
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center p-0.5 border shadow-xs overflow-hidden shrink-0">
                    <Wallet className="w-3.5 h-3.5 text-brand-primary" />
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-w-0 ml-1">
                  <span className="text-gray-700 font-[600] truncate text-[10px] tracking-tight">
                    COD Remittance
                  </span>
                  <span className="text-gray-500 text-[10px]">
                    Remitted On : {dayjs(row.date).format("DD MMM YYYY")}
                  </span>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className={`px-2 py-0.5 rounded text-[10px] shadow-xs ${row.status === "Paid" ? "bg-brand-secondary/10 text-brand-primary" : "bg-red-100 text-red-600"}`}>
                    {row.status}
                  </span>
                  <p
                    className="text-[9px] text-brand-primary font-bold border-b border-dashed border-brand-primary cursor-pointer mt-1"
                    onClick={() => setDetailsPopupId(detailsPopupId === row.remittanceId ? null : row.remittanceId)}
                  >
                    Details
                  </p>
                </div>
              </div>

              {/* Details Grid - Reverted to original 3 columns */}
              <div className="grid grid-cols-3 gap-2 mb-1 p-0.5 items-center">
                <div>
                  <p className="text-gray-500 font-[600] text-[10px] tracking-tighter">Remittance ID</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openRemittanceDetails(row.remittanceId)}
                      className="text-brand-primary font-[600] text-[10px] hover:underline truncate max-w-[60px]"
                    >
                      {row.remittanceId}
                    </button>
                    <button onClick={() => handleCopy(row.remittanceId, row.remittanceId + '_m')}>
                      {copiedId === row.remittanceId + '_m' ? (
                        <FiCheck className="w-2 h-2 text-brand-primary" />
                      ) : (
                        <FiCopy className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-gray-500 font-[600] text-[10px] tracking-tighter">Remit Amount</p>
                  <p className="font-bold text-[10px] text-gray-700">
                    ₹{(Number(row.remittanceInitiated) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-gray-500 font-[600] text-[10px] tracking-tighter">UTR Number</p>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-brand-primary font-[600] truncate text-[10px] max-w-[70px]">
                      {row.utr || "N/A"}
                    </span>
                    {row.utr && (
                      <button onClick={() => handleCopy(row.utr, row.remittanceId + '_m_utr')}>
                        {copiedId === row.remittanceId + '_m_utr' ? (
                          <FiCheck className="w-2 h-2 text-brand-primary" />
                        ) : (
                          <FiCopy className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* User Info - Updated styling to match Admin UI */}
              <div className="mt-2 flex items-center justify-between px-0.5 border-t border-gray-100 pt-2">
                <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                  <div className="w-7 h-7 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center font-bold text-brand-primary text-[10px] shrink-0 shadow-sm uppercase">
                    {row.user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-700 text-[10px] truncate w-full" title={row.user?.name}>
                      {row.user?.name || "N/A"}
                    </p>
                    <p className="text-gray-500 text-[10px] truncate w-full" title={row.user?.email}>
                      {row.user?.email || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                </div>
              </div>

              {/* Reverted Breakdown Popup UI */}
              <AnimatePresence>
                {detailsPopupId === row.remittanceId && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDetailsPopupId(null)}></div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`absolute right-3 ${index < remitedData.length / 2 ? "top-12" : "bottom-12"} w-56 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-50`}
                    >
                      <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-100">
                        <span className="font-bold text-gray-700 text-[10px] uppercase tracking-wider">Breakdown</span>
                        <button onClick={() => setDetailsPopupId(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2 text-[10px]">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium whitespace-nowrap">Total COD Amount</span>
                          <span className="text-gray-700 font-bold">₹{((Number(row.codAvailable) || 0) + (Number(row.adjustedAmount) || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">Wallet Transfer</span>
                          <span className="text-red-500 font-bold">-₹{(Number(row.amountCreditedToWallet) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">Early COD Fee</span>
                          <span className="text-red-500 font-bold">-₹{(Number(row.earlyCodCharges) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-[10px]">Adjusted Amt</span>
                          <span className="text-gray-700 font-bold">₹{(Number(row.adjustedAmount) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-green-50/50 p-2 rounded-lg border border-green-100 mt-1">
                          <span className="text-brand-primary font-bold">Net Payout</span>
                          <span className="text-brand-primary font-[600] text-[10px]">₹{(Number(row.remittanceInitiated) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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

      <PaginationFooter page={page} setPage={setPage} totalPages={totalPages} limit={limit} setLimit={setLimit} />

      {openRemittancePopup && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[140] backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto relative animate-popup-in">
            <button onClick={() => setOpenRemittancePopup(false)} className="absolute right-4 top-4 text-gray-400 hover:text-red-500 transition-all z-[150] p-1.5 hover:bg-gray-100 rounded-full bg-white/80 backdrop-blur-sm border shadow-sm"><X className="w-5 h-5" /></button>
            <div className="p-1 pb-10 min-h-[300px]"><RemittanceDetails remittanceId={selectedRemittanceId} /></div>
          </div>
        </div>
      )}

      {showTransferCODModal && (
        <TranseferCODModal
          id={transferCODUserId}
          onClose={() => setShowTransferCODModal(false)}
          selectedRemittanceIds={selectedRemittanceIds}
        />
      )}

      {showUpload && <CodUploadPoopup onClose={() => setShowUpload(false)} setRefresh={setRefresh} />}

      {/* Bank Response Upload Modal */}
      <AnimatePresence>
        {showBankResponseUpload && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] p-5 relative"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowBankResponseUpload(false);
                  setSelectedBankFile(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-50 rounded-xl border border-green-100">
                  <FileSpreadsheet className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-[13px] sm:text-[14px] font-bold text-brand-secondary">Upload Bank Response</h2>
                  <p className="text-[10px] sm:text-[11px] text-gray-500">Upload the Excel file received from the bank</p>
                </div>
              </div>

              {/* Upload Box */}
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-5 text-center mb-4 transition-all">
                {selectedBankFile ? (
                  <div className="flex flex-col items-center">
                    <div className="p-2 bg-green-100 rounded-full mb-2">
                      <CheckCircle className="w-8 h-8 text-brand-primary" />
                    </div>
                    <p className="text-[12px] text-brand-secondary font-bold mb-1 break-all px-4">
                      {selectedBankFile.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mb-3">
                      {(selectedBankFile.size / 1024).toFixed(1)} KB
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedBankFile(null)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] sm:text-[11px] font-bold text-gray-500 hover:bg-gray-100 transition"
                      >
                        Remove
                      </button>
                      <button
                        onClick={handleBankResponseSubmit}
                        disabled={bankResponseUploading}
                        className="px-4 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] sm:text-[11px] font-bold hover:bg-green-600 transition flex items-center gap-1.5 shadow-sm"
                      >
                        {bankResponseUploading ? (
                          <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Processing...</>
                        ) : (
                          <>Confirm & Submit</>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-[12px] text-gray-600 font-bold mb-1">Select Bank Response Excel</p>
                    <p className="text-[10px] text-gray-400 mb-3">Expected: Beneficiary Account, UTR Number, Status, Amount</p>
                    <input
                      ref={bankFileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      id="bankResponseFile"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setSelectedBankFile(file);
                      }}
                    />
                    <label
                      htmlFor="bankResponseFile"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-all bg-brand-primary text-white hover:bg-green-600 shadow-sm"
                    >
                      <Upload className="w-4 h-4" /> Choose File
                    </label>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[10px] sm:text-[11px] text-blue-700">
                <p className="font-bold mb-1">ℹ️ How it works:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Only rows with <strong>Status = "Successful"</strong> will be processed.</li>
                  <li>Reconciliation matches by <strong>Beneficiary Account + Amount</strong>.</li>
                  <li>Matched items will be automatically marked as <strong>Paid</strong> in the wallet.</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Filter Panel */}
      <AnimatePresence>
        {isFilterPanelOpen && (
          <div className="fixed inset-0 z-[110] flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-all" onClick={() => setIsFilterPanelOpen(false)}></div>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "0%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-[340px] bg-white h-full shadow-2xl flex flex-col border-l border-gray-200">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
                <h2 className="text-[16px] font-bold text-gray-700 tracking-tight">Filters</h2>
                <button onClick={() => setIsFilterPanelOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-all group">
                  <X className="w-5 h-5 text-gray-400 group-hover:text-gray-700" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                {/* User Filter */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-[600] text-gray-700 tracking-wide">Search User</label>
                  <UserFilter onUserSelect={(id) => setLocalFilters(prev => ({ ...prev, selectedUserId: id }))} clearTrigger={clearUserTrigger} />
                </div>

                {/* Remittance ID */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-[600] text-gray-700 tracking-wide">Remittance ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter Remittance ID"
                      className="w-full h-9 pl-3 pr-3 text-[12px] font-[600] border border-gray-300 rounded-lg focus:outline-none focus:border-brand-primary transition-all text-gray-700 placeholder:text-gray-400"
                      value={localFilters.remittanceId}
                      onChange={e => setLocalFilters(prev => ({ ...prev, remittanceId: e.target.value }))}
                    />
                    {/* <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /> */}
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="space-y-1.5" ref={statusRef}>
                  <label className="text-[12px] font-[600] text-gray-700 tracking-wide">Status</label>
                  <div className="relative">
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className={`w-full h-9 px-3 text-[12px] font-[600] border rounded-lg focus:outline-none flex items-center justify-between transition-all bg-white text-left ${statusDropdownOpen ? "border-brand-primary" : "border-gray-200"}`}
                    >
                      <span className={localFilters.status ? "text-gray-700" : "text-gray-400"}>{localFilters.status || "Select Status"}</span>
                      <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {statusDropdownOpen && (
                      <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-[120] py-1 border border-gray-200 animate-popup-in">
                        {["Paid", "Pending"].map(s => (
                          <div key={s} onClick={() => { setLocalFilters(prev => ({ ...prev, status: s })); setStatusDropdownOpen(false); }} className={`px-4 py-2 text-[12px] font-[600] cursor-pointer transition-colors ${localFilters.status === s ? "bg-brand-secondary/10 text-brand-primary" : "text-gray-500 hover:bg-gray-50"}`}>{s}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex gap-3 mt-auto">
                <button onClick={handleClearFilters} className="flex-1 py-2 text-gray-500 rounded-lg text-[12px] font-bold hover:bg-white hover:text-red-500 transition-all border border-gray-200">Reset Filter</button>
                <button onClick={() => { setAppliedFilters(localFilters); setIsFilterPanelOpen(false); setPage(1); }} className="flex-1 py-2 bg-brand-primary text-white rounded-lg text-[12px] font-bold hover:opacity-90 transition-all shadow-md">Apply Filter</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CODRemittanceOrder;
