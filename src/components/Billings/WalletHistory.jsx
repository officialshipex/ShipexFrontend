import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import { ChevronDown, Filter } from "lucide-react";
import Cookies from "js-cookie";
import ThreeDotLoader from "../../Loader";
import { Notification } from "../../Notification";
import DateFilter from "../../filter/DateFilter";
import NotFound from "../../assets/nodatafound.png";
import PaginationFooter from "../../Common/PaginationFooter";
import WalletHistoryFilterPanel from "../../Common/WalletHistoryFilterPanel";
import { FiCopy, FiCheck } from "react-icons/fi";
import { FaBars } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const WalletHistory = ({
  setFiltersApplied,
  clearFiltersTrigger,
  setClearFiltersTrigger,
}) => {
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [transactions, setTransactions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const actionRef = useRef(null);
  const { id } = useParams();

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
      setLoading(true);
      let fromDate, toDate;
      if (selectedDateRange?.[0]) {
        fromDate = dayjs(selectedDateRange[0].startDate).startOf("day").toISOString();
        toDate = dayjs(selectedDateRange[0].endDate).endOf("day").toISOString();
      }
      const token = Cookies.get("session");
      const params = {
        id,
        transactionId: transactionId.trim(),
        paymentId: paymentId.trim(),
        status,
        fromDate,
        toDate
      };
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/recharge/transactionHistory`,
        {
          params: { ...params, page: currentPage, limit },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTransactions(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      Notification("Failed to fetch transactions.", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    if (status || paymentId || transactionId || selectedDateRange) {
      if (setFiltersApplied) setFiltersApplied(true);
    } else {
      if (setFiltersApplied) setFiltersApplied(false);
    }
  }, [currentPage, limit, status, paymentId, transactionId, selectedDateRange]);

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
    setTransactionId("");
    setPaymentId("");
    setStatus("");
    setSelectedDateRange(null);
    setClearTrigger(prev => prev + 1);
    setCurrentPage(1);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectAll = () => {
    if (transactions.length > 0 && selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map((t) => t._id));
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedTransactions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    if (selectedTransactions.length === 0) {
      Notification("Please select transactions to export.", "info");
      return;
    }

    const dataToExport = transactions
      .filter((t) => selectedTransactions.includes(t._id))
      .map((t) => ({
        Date: dayjs(t.date).format("DD MMM YYYY hh:mm A"),
        "Transaction ID": t.paymentDetails?.transactionId,
        Amount: t.paymentDetails?.amount,
        Status: t.status,
        "Payment ID": t.paymentDetails?.paymentId,
        "Order ID": t.paymentDetails?.orderId,
      }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "WalletHistory");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `WalletHistory_${dayjs().format("YYYY-MM-DD")}.xlsx`);

    Notification("Export successful!", "success");
    setActionOpen(false);
  };

  const isAnyFilterApplied = status || paymentId || transactionId;

  return (
    <div className="space-y-2">
      {/* Desktop Filter Section */}
      <div className="hidden md:flex gap-2 relative sm:items-center">
        <DateFilter
          onDateChange={(range) => {
            setSelectedDateRange(range);
            setCurrentPage(1);
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
              disabled={selectedTransactions.length === 0}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-9 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 border transition-all ${selectedTransactions.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50 shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
            >
              Actions
              <ChevronDown className={`w-4 h-4 transition-transform ${actionOpen ? "rotate-180" : ""}`} />
            </button>

            {actionOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-44 text-[12px] z-[100] animate-popup-in overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                  onClick={handleExport}
                >
                  Export to Excel
                </div>
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
                setSelectedDateRange(range);
                setCurrentPage(1);
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
          <table className="w-full text-[12px] text-left border-collapse relative table-fixed">
            <thead className="sticky top-0 z-40 bg-[#0CBB7D] text-white font-[600]">
              <tr>
                <th className="py-2 px-3 w-[5%]">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={transactions.length > 0 && selectedTransactions.length === transactions.length}
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                    />
                  </div>
                </th>
                <th className="px-3 py-2 w-[15%]">Date</th>
                <th className="px-3 py-2 w-[20%]">Transaction ID</th>
                <th className="px-3 py-2 w-[15%]">Amount</th>
                <th className="px-3 py-2 w-[15%]">Status</th>
                <th className="px-3 py-2 w-[30%]">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img src={NotFound} alt="No Data" className="mx-auto w-60 h-60" />
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50 text-[12px] transition-colors border-b border-gray-200 text-gray-600">
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(row._id)}
                        onChange={() => handleCheckboxChange(row._id)}
                        className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-gray-700">{dayjs(row.date).format("DD MMM YYYY")}</p>
                      <p className="text-gray-500">{dayjs(row.date).format("hh:mm A")}</p>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 group">
                        <span className="text-[#0CBB7D]">{row.paymentDetails?.transactionId}</span>
                        <button onClick={() => handleCopy(row.paymentDetails?.transactionId, row._id + '_txn')}>
                          {copiedId === row._id + '_txn' ? (
                            <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                          ) : (
                            <FiCopy className="w-3 h-3 text-gray-400 transition-opacity opacity-0 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-gray-700">₹{Number(row.paymentDetails?.amount).toFixed(2)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${row.status === "success" ? "bg-green-50 text-[#0CBB7D]" : "bg-red-50 text-red-500"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-0.5">
                        <div className="flex gap-2">
                          <p className="text-[12px] text-gray-500 font-[600] tracking-tighter">Payment ID :</p>
                          <div className="flex items-center gap-2 group">
                            <span className="text-[12px] text-gray-700">{row.paymentDetails?.paymentId || "N/A"}</span>
                            {row.paymentDetails?.paymentId && (
                              <button onClick={() => handleCopy(row.paymentDetails.paymentId, row._id + '_pay')}>
                                {copiedId === row._id + '_pay' ? <FiCheck className="w-3 h-3 text-[#0CBB7D]" /> : <FiCopy className="w-3 h-3 text-gray-400 transition-opacity opacity-0 group-hover:opacity-100" />}
                              </button>
                            )}
                          </div>
                        </div>
                        {row.paymentDetails?.orderId && (
                          <div className="flex gap-2">
                            <p className="text-[12px] text-gray-500 font-[600] tracking-tighter">Order ID :</p>
                            <span className="text-[12px] text-gray-700">{row.paymentDetails.orderId}</span>
                          </div>
                        )}
                      </div>
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
        <div className="p-2 gap-2 bg-white rounded-lg flex justify-between items-center border border-gray-100 mb-2 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 flex-1">
            <input
              type="checkbox"
              checked={transactions.length > 0 && selectedTransactions.length === transactions.length}
              onChange={handleSelectAll}
              className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
            />
            <span className="text-[10px] font-[600] text-gray-700">Select All</span>
          </div>

          <div className="relative" ref={actionRef}>
            <button
              disabled={selectedTransactions.length === 0}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-[30px] px-3 rounded-lg flex items-center justify-center border transition-all ${selectedTransactions.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] bg-white shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
            >
              <FaBars className="w-3 h-3" />
            </button>
            {actionOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-40 text-[12px] z-[100] animate-popup-in overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                  onClick={handleExport}
                >
                  Export Excel
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-[calc(100vh-250px)] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <ThreeDotLoader />
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((row) => (
              <div key={row._id} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100 text-[10px] animate-popup-in">
                <div className="flex justify-between mb-2 items-start">
                  <div className="flex items-start gap-2">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(row._id)}
                        onChange={() => handleCheckboxChange(row._id)}
                        className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[#0CBB7D] font-[600] text-[10px]">{row.paymentDetails?.transactionId}</span>
                        <button onClick={() => handleCopy(row.paymentDetails?.transactionId, row._id + '_txn_mobile')}>
                          {copiedId === row._id + '_txn_mobile' ? <FiCheck className="w-3 h-3 text-[#0CBB7D]" /> : <FiCopy className="w-3 h-3 text-gray-300" />}
                        </button>
                      </div>
                      <p className="text-gray-500 text-[10px]">
                        {dayjs(row.date).format("DD MMM YYYY, hh:mm A")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-[600] text-gray-700 text-[10px]">₹{Number(row.paymentDetails?.amount).toFixed(2)}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] inline-block mt-1 ${row.status === "success" ? "bg-green-50 text-[#0CBB7D]" : "bg-red-50 text-red-500"}`}>
                      {row.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-green-50/50 p-2 rounded-lg border border-gray-100">
                  <div className="space-y-0.5">
                    <p className="text-gray-700 text-[10px] tracking-wider">Payment ID</p>
                    <div className="flex items-center gap-1">
                      <p className="text-[#0CBB7D] font-[600] truncate max-w-[120px] text-[10px]">{row.paymentDetails?.paymentId || "N/A"}</p>
                      {row.paymentDetails?.paymentId && (
                        <button onClick={() => handleCopy(row.paymentDetails.paymentId, row._id + '_pay_mobile')}>
                          {copiedId === row._id + '_pay_mobile' ? <FiCheck className="w-3 h-3 text-[#0CBB7D]" /> : <FiCopy className="w-3 h-3 text-gray-300" />}
                        </button>
                      )}
                    </div>
                  </div>
                  {row.paymentDetails?.orderId && (
                    <div className="text-right space-y-0.5">
                      <p className="text-gray-700 text-[10px] tracking-wider">Order ID</p>
                      <p className="text-[#0CBB7D] font-[600] truncate text-[10px]">{row.paymentDetails.orderId}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
              <img src={NotFound} alt="No Data Found" className="w-[180px] opacity-60" />
              <p className="text-gray-400 font-[600] mt-2">No records found</p>
            </div>
          )}
        </div>
      </div>

      <PaginationFooter
        page={currentPage}
        setPage={setCurrentPage}
        totalPages={totalPages}
        limit={limit}
        setLimit={setLimit}
      />

      <WalletHistoryFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        selectedUserId={null}
        transactionId={transactionId}
        paymentId={paymentId}
        status={status}
        onClearFilters={handleClearFilters}
        showUserFilter={false}
        onApplyFilters={(filters) => {
          setTransactionId(filters.transactionId);
          setPaymentId(filters.paymentId);
          setStatus(filters.status);
          setCurrentPage(1);
          setIsFilterPanelOpen(false);
        }}
      />
    </div>
  );
};

export default WalletHistory;
