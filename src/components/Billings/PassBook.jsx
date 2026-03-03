import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { FaCalendarAlt, FaRupeeSign, FaFilter, FaBars } from "react-icons/fa";
import dayjs from "dayjs";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { ChevronDown, Filter, X } from "lucide-react";
import ThreeDotLoader from "../../Loader";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";
import PaginationFooter from "../../Common/PaginationFooter";
import DateFilter from "../../filter/DateFilter";
import { getCarrierLogo } from "../../Common/getCarrierLogo";
import NotFound from "../../assets/nodatafound.png";
import { FiCopy, FiCheck, FiBookOpen } from "react-icons/fi";
import PassbookFilterPanel from "../../Common/PassbookFilterPanel";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";

const Passbooks = ({
  setFiltersApplied,
  clearFiltersTrigger,
  setClearFiltersTrigger,
}) => {
  const [transactions, setTransactions] = useState([]);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const [awbNumber, setAwbNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [clearTrigger, setClearTrigger] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);

  const desktopActionRef = useRef();
  const mobileActionRef = useRef();
  const [pricePopupPos, setPricePopupPos] = useState(null); // { x, y, dir, order }
  const pricePopupTimerRef = useRef(null);
  const [mobilePricePopupId, setMobilePricePopupId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  // Ref to skip fetch while nav-state is being applied (prevents showing all-data flash)
  const skipNextFetchRef = useRef(false);

  const handleClearFilters = () => {
    setDateRange(null);
    setCategory("");
    setDescription("");
    setAwbNumber("");
    setOrderId("");
    setClearTrigger((prev) => !prev);
    setPage(1);
  };

  useEffect(() => {
    if (location.state?.awbNumber) {
      skipNextFetchRef.current = true;
      setAwbNumber(location.state.awbNumber.trim());
      setDateRange(null);
      setCategory("");
      setDescription("");
      setOrderId("");
      setPage(1);
    }
  }, [location.state]);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (clearFiltersTrigger) {
      handleClearFilters();
      if (setFiltersApplied) setFiltersApplied(false);
      if (setClearFiltersTrigger) setClearFiltersTrigger(false);
    }
  }, [clearFiltersTrigger]);

  const fetchTransactions = async () => {
    try {
      const token = Cookies.get("session");
      if (!token) return;

      setLoading(true);
      const params = {
        id,
        category,
        description,
        page,
        limit,
        awbNumber,
        orderId,
      };

      if (dateRange?.[0]) {
        params.fromDate = dayjs(dateRange[0].startDate).toISOString();
        params.toDate = dayjs(dateRange[0].endDate).toISOString();
      }

      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/order/passbook`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: params,
        }
      );
      console.log("trans", response.data.results)
      setTransactions(response.data.results || []);
      // The seller API returns `page` as total pages in some components, 
      // but let's check what it actually returns for passbook.
      // Original code: setTotalPages(response.data.page || 0);
      // Wait, if it returns `page` as total pages, I'll use it.
      // Actually, admin uses response.data.total.
      // Seller original: response.data.page
      setTotalPages(response.data.page || 0); // In seller code, 'page' seems to be totalPages
      setLoading(false);
    } catch (error) {
      Notification("Error fetching transactions", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    fetchTransactions();
  }, [dateRange, page, limit, category, description, awbNumber, orderId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopActionRef.current && !desktopActionRef.current.contains(event.target)) setDesktopDropdownOpen(false);
      if (mobileActionRef.current && !mobileActionRef.current.contains(event.target)) setMobileDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

    const dataToExport = transactions
      .filter((t) => selectedTransactions.includes(t.id || t._id))
      .map((t) => ({
        Date: dayjs(t.date).format("DD MMM YYYY hh:mm A"),
        "Order ID": t.orderId,
        "AWB Number": t.awb_number,
        Category: t.category,
        Amount: t.amount,
        "Available Balance": t.balanceAfterTransaction,
        Description: t.description,
      }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Passbook");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Passbook_${dayjs().format("YYYY-MM-DD")}.xlsx`);

    Notification("Export successful!", "success");
    setDesktopDropdownOpen(false);
    setMobileDropdownOpen(false);
  };

  const isAnyFilterApplied = (dateRange && dateRange[0]?.endDate) || category || description || awbNumber || orderId;

  return (
    <div className="space-y-2 w-full">
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
                    className="px-4 py-2 text-gray-700 hover:bg-green-50 cursor-pointer transition"
                    onClick={() => {
                      handleExport();
                      setDesktopDropdownOpen(false);
                    }}
                  >
                    Export Excel
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
          <div className="flex justify-end pr-1 mt-1">
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
        <div className="h-[calc(100vh-300px)] overflow-y-auto bg-white shadow-sm">
          <table className="min-w-full border-collapse text-[12px] text-left relative">
            <thead className="sticky top-0 z-40 bg-[#0CBB7D] text-white font-[600]">
              <tr>
                <th className="py-2 px-3 text-left">
                  <div className="flex justify-center items-center">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                    />
                  </div>
                </th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Order ID</th>
                <th className="py-2 px-3">AWB Number</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Available Balance</th>
                <th className="py-2 px-3 w-[25%]">Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                    <img src={NotFound} alt="No Data Found" className="mx-auto w-[250px]" />
                  </td>
                </tr>
              ) : (
                transactions.map((row, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex justify-center items-center">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(row.id || row._id)}
                          onChange={() => handleCheckboxChange(row.id || row._id)}
                          className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <p className="text-gray-700">{dayjs(row.date).format("DD MMM YYYY")}</p>
                      <p className="text-gray-500">{dayjs(row.date).format("hh:mm A")}</p>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 group">
                        <Link to={`/dashboard/order/neworder/updateOrder/${row.orderId}`} className="text-[#0CBB7D] hover:underline block font-medium">
                          {row.orderId}
                        </Link>
                        <button onClick={() => handleCopy(row.orderId, row.id || row._id + '_orderId')}>
                          {copiedId === (row.id || row._id + '_orderId') ? (
                            <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                          ) : (
                            <FiCopy className="w-3 h-3 text-gray-400 transition-opacity opacity-0 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 group">
                        <p className="text-[#0CBB7D] cursor-pointer hover:underline font-medium" onClick={() => handleTrackingByAwb(row.awb_number)}>
                          {row.awb_number}
                        </p>
                        <button onClick={() => handleCopy(row.awb_number, row.id || row._id + '_awb')}>
                          {copiedId === (row.id || row._id + '_awb') ? (
                            <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                          ) : (
                            <FiCopy className="w-3 h-3 text-gray-400 transition-opacity opacity-0 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${row.category === "debit" ? "bg-red-50 text-red-500" : "bg-green-50 text-[#0CBB7D]"}`}>
                        {row.category}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 justify-start">
                        <span className={`${row.category === "debit" ? "text-red-500" : "text-[#0CBB7D]"} font-medium`}>
                          {row.category === "debit" ? "-" : "+"} ₹{Number(row.amount).toFixed(2)}
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
                                order: row // Note: using 'row' as order data
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
                    <td className="py-2 px-3 text-gray-700">₹{Number(row.balanceAfterTransaction).toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <p className="line-clamp-2 text-[12px] leading-relaxed text-gray-700" title={row.description}>{row.description}</p>
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 flex-1">
            <input
              type="checkbox"
              checked={selectedTransactions.length === transactions.length && transactions.length > 0}
              onChange={handleSelectAll}
              className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
            />
            <span className="text-[10px] font-[600] text-gray-700">Select All</span>
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
                <ul className="font-[600] text-[12px]">
                  <li
                    className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer"
                    onClick={() => {
                      handleExport();
                      setMobileDropdownOpen(false);
                    }}
                  >
                    Export Excel
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="h-[calc(100vh-250px)] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-10"><ThreeDotLoader /></div>
          ) : transactions.length > 0 ? (
            transactions.map((row) => (
              <div key={row.id || row._id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-3 text-[11px] animate-popup-in">
                {/* Header Bar */}
                <div className="flex gap-2 justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(row.id || row._id)}
                      onChange={() => handleCheckboxChange(row.id || row._id)}
                      className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                    />
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center p-1.5 border border-gray-100 shadow-sm overflow-hidden shrink-0">
                      <img
                        src={getCarrierLogo(row?.courierServiceName || "")}
                        alt=""
                        onError={(e) => { e.target.src = '/default-courier-logo.png' }}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-w-0 ml-1">
                    <span className="text-gray-700 font-[600] truncate text-[10px]">
                      {row?.courierServiceName || "Transaction"}
                    </span>
                    <span className="text-gray-500 text-[10px]">
                      {dayjs(row.date).format("DD MMM YYYY, hh:mm A")}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${row.category === "debit" ? "bg-red-100 text-red-600" : "bg-green-50 text-[#0CBB7D]"}`}>
                      {row.category}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-y-2">
                  <div>
                    <p className="text-gray-700 text-[10px] mb-0.5">Order ID</p>
                    <div className="flex items-center gap-1">
                      <Link to={`/dashboard/order/neworder/updateOrder/${row.orderId}`} className="text-[#0CBB7D] font-[600] hover:text-[#0CBB7D] text-[10px]">
                        {row.orderId}
                      </Link>
                      <button onClick={() => handleCopy(row.orderId, (row.id || row._id) + '_orderId_mobile')}>
                        {copiedId === (row.id || row._id) + '_orderId_mobile' ? (
                          <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                        ) : (
                          <FiCopy className="w-3 h-3 text-gray-300" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-[10px]">
                    <p className="text-gray-700 text-[10px] mb-0.5">AWB Number</p>
                    <div className="flex items-center justify-end gap-1">
                      <p className="text-[#0CBB7D] font-[600] truncate hover:underline" onClick={() => handleTrackingByAwb(row.awb_number)}>
                        {row.awb_number || "N/A"}
                      </p>
                      {row.awb_number && (
                        <button onClick={() => handleCopy(row.awb_number, (row.id || row._id) + '_awb_mobile')}>
                          {copiedId === (row.id || row._id) + '_awb_mobile' ? (
                            <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                          ) : (
                            <FiCopy className="w-3 h-3 text-gray-300" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="border-t my-1 border-gray-50 col-span-2 flex justify-between items-center">
                    <div>
                      <p className="text-gray-700 text-[10px] mb-0.5">Transaction Amount</p>
                      <div className="flex items-center gap-1">
                        <p className={`text-[10px] font-bold ${row.category === "debit" ? "text-red-500" : "text-[#0CBB7D]"}`}>
                          {row.category === "debit" ? "-" : "+"} ₹{Number(row.amount).toFixed(2)}
                        </p>
                        {row.category === "debit" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentId = row.id || row._id;
                              setMobilePricePopupId(prev => prev === currentId ? null : currentId);
                            }}
                            className="text-[#0CBB7D] p-2 -m-2 flex items-center justify-center cursor-pointer"
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
                      <p className="text-gray-700 text-[10px] mb-0.5">Closing Balance</p>
                      <p className="text-gray-700 text-[10px]">₹{Number(row.balanceAfterTransaction).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Description Bar */}
                {row.description && (
                  <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-gray-700 font-[600] text-[10px] tracking-wider">Description</p>
                    <p className="text-gray-500 leading-relaxed text-[10px]">
                      {row.description}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
              <img src={NotFound} alt="No Data Found" className="w-[180px] opacity-60" />
              <p className="text-gray-400 font-[600] mt-2">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      <PassbookFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        selectedUserId={null} // Not used for sellers
        awbNumber={awbNumber}
        orderId={orderId}
        category={category}
        description={description}
        onClearFilters={handleClearFilters}
        showUserFilter={false}
        onApplyFilters={(filters) => {
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
        totalPages={totalPages} // For seller API, response.data.page is totalPages
        limit={limit}
        setLimit={setLimit}
      />

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
              <div className="flex justify-between border-t pt-1 mt-1"><span className="font-[700] text-gray-800">Total</span><span className="font-[700] text-[#0CBB7D]">₹ {pricePopupPos.order.amount ?? 0}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Passbooks;
