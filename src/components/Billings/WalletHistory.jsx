import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
// import { toast } from "react-toastify";
import { FaWallet, FaRupeeSign, FaFilter } from "react-icons/fa";
import { FiMoreHorizontal } from "react-icons/fi";
import { ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import ThreeDotLoader from "../../Loader";
import { Notification } from "../../Notification"
import DateFilter from "../../filter/DateFilter";
import NotFound from "../../assets/nodatafound.png";
import PaginationFooter from "../../Common/PaginationFooter";

const WalletHistory = ({
  setFiltersApplied,
  clearFiltersTrigger,
  setClearFiltersTrigger,
}) => {
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20); // default 20
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({});
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [status, setStatus] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusRef = useRef();
  const [showMobileFilters, setShowMobileFilters] = useState(false);


  const fetchTransactions = async (page = 1, filterData = filters, rowLimit = limit) => {
    try {
      setLoading(true);
      let fromDate, toDate;
      if (selectedDateRange?.[0]) {
        fromDate = selectedDateRange[0].startDate.toISOString();
        toDate = selectedDateRange[0].endDate.toISOString();
      }
      const token = Cookies.get("session");
      const params = {
        id,
        transactionId,
        paymentId,
        status,
        fromDate, toDate
      }
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/recharge/transactionHistory?page=${page}&limit=${rowLimit}`,
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // console.log("rre", response)
      setTransactions(response.data.data);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      Notification("Failed to fetch transactions.", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage, filters, limit);
  }, [currentPage, limit, status, paymentId, transactionId, selectedDateRange]);


  useEffect(() => {
    if (clearFiltersTrigger) {
      setFilters({});
      setCurrentPage(1);
      fetchTransactions(1, {}, limit);
      setFiltersApplied(false);
      setClearFiltersTrigger(false);
    }
  }, [clearFiltersTrigger]);


  const handleClearFilters = () => {
    setTransactionId("");
    setPaymentId("");
    setStatus("");
    setSelectedDateRange(null);
    setCurrentPage(1);
  };


  return (
    <div className="w-full">
      {/* Desktop Filter Section */}
      <div className="hidden sm:flex gap-2 sm:flex-row flex-col mb-2 w-full">
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="px-3 py-2 w-full rounded-lg text-gray-700 font-[600] text-[12px] border focus:ring-1 outline-none focus:ring-[#0CBB7D]"
          />
          {/* Payment ID Filter */}
          <input
            type="text"
            placeholder="Search Payment ID"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            className="px-3 py-2 w-full rounded-lg text-gray-700 font-[600] text-[12px] border focus:ring-1 outline-none focus:ring-[#0CBB7D]"
          />
        </div>

        <div className="flex gap-2 justify-between w-full">
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Date Range Dropdown */}
            <DateFilter
              onDateChange={(range) => {
                setSelectedDateRange(range);
                setCurrentPage(1);
              }}
            />

            {/* Status Filter */}
            <div className="relative w-full" ref={statusRef}>
              <button
                onClick={() => setShowStatusDropdown((prev) => !prev)}
                className={`w-full sm:w-28 py-2 px-3 text-gray-400 font-[600] border rounded-lg text-left text-[12px] bg-white flex justify-between items-center ${showStatusDropdown ? "border-[#0CBB7D]" : ""}`}
                type="button"
              >
                <span>{status || "Status"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showStatusDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showStatusDropdown && (
                <ul className="absolute z-30 text-gray-500 font-[600] sm:w-28 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto text-[12px]">
                  {[
                    "success", "failed"
                  ].map((s) => (
                    <li
                      key={s || "empty"}
                      className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${status === s ? "bg-green-100 font-[600]" : ""}`}
                      onClick={() => {
                        setStatus(s);
                        setShowStatusDropdown(false);
                      }}
                    >
                      {s || "Status"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            className="py-2 px-3 sm:w-none text-[12px] border rounded-lg font-[600] text-white bg-[#0CBB7D] hover:opacity-90 transition whitespace-nowrap"
            onClick={handleClearFilters}
            type="button"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Mobile Filter Section */}
      <div className="flex w-full flex-col sm:hidden mb-2">
        {/* Top Row: Search + Filter Button */}
        <div className="flex items-center justify-between gap-2 relative">
          <input
            type="text"
            placeholder="Search Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="flex-1 px-3 py-2 h-9 rounded-lg text-gray-700 font-[600] text-[12px] border focus:ring-1 outline-none focus:ring-[#0CBB7D]"
          />

          {/* Filter Button */}
          <button
            className="px-3 flex items-center justify-center text-white bg-[#0CBB7D] h-[34px] rounded-lg transition text-[12px] font-[600]"
            onClick={() => setShowMobileFilters((prev) => !prev)}
          >
            <FaFilter className="text-white" size={14} />
          </button>
        </div>

        {/* Expandable Filters */}
        <div
          className={`transition-all duration-300 ease-in-out ${showMobileFilters ? "max-h-[1000px] overflow-visible" : "max-h-0 overflow-hidden"}`}
        >
          <div className="flex flex-col gap-2 overflow-visible mt-2">
            {/* Payment ID */}
            <input
              type="text"
              placeholder="Search Payment ID"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              className="px-3 py-2 h-9 w-full rounded-lg text-gray-700 font-[600] text-[12px] border focus:ring-1 outline-none focus:ring-[#0CBB7D]"
            />

            {/* Date Filter */}
            <DateFilter
              onDateChange={(range) => {
                setSelectedDateRange(range);
                setCurrentPage(1);
              }}
            />

            {/* Status Filter */}
            <div className="relative" ref={statusRef}>
              <button
                onClick={() => setShowStatusDropdown((prev) => !prev)}
                className={`w-full py-2 px-3 text-gray-400 font-[600] border rounded-lg text-left text-[12px] bg-white flex justify-between items-center ${showStatusDropdown ? "border-[#0CBB7D]" : ""}`}
                type="button"
              >
                <span>{status || "Status"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showStatusDropdown && (
                <ul className="absolute z-40 text-gray-500 font-[600] w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto text-[12px]">
                  {[
                    "success", "failed"
                  ].map((s) => (
                    <li
                      key={s || "empty"}
                      className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${status === s ? "bg-green-100 font-[600]" : ""}`}
                      onClick={() => {
                        setStatus(s);
                        setShowStatusDropdown(false);
                      }}
                    >
                      {s || "Status"}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Clear Button */}
            <button
              className="px-3 bg-[#0CBB7D] py-2 text-[12px] font-[600] rounded-lg text-white border hover:opacity-90 transition"
              onClick={() => {
                handleClearFilters();
                setShowMobileFilters(false);
              }}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Desktop View (Table Format) */}
      <div className="hidden md:block text-[12px] text-left">
        <div className="relative overflow-x-auto bg-white overflow-y-auto h-[calc(100vh-320px)]">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-[#0CBB7D]">
              <tr className="relative bg-[#0CBB7D] text-white text-[12px] font-[600]">
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Transaction Id</th>
                <th className="text-left px-3 py-2">Amount</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((row, index) => (
                  <tr key={index} className="border-b text-[12px]">
                    <td className="text-left px-3 py-2 align-middle" style={{ maxWidth: '300px', width: '200px' }}>
                      <p>{new Date(row.date).toLocaleDateString()}</p>
                      <p>{new Date(row.date).toLocaleTimeString()}</p>
                    </td>
                    <td className="text-left px-3 py-2" style={{ maxWidth: '300px', width: '200px' }}>{row.paymentDetails.transactionId}</td>
                    <td className="text-left px-3 py-2" style={{ maxWidth: '300px', width: '200px' }}>₹{Number(row.paymentDetails.amount).toFixed(2)}</td>
                    <td
                      className={`text-left text-[12px] px-3 py-2 ${row.status.toLowerCase() === "failed"
                        ? "text-red-500"
                        : "text-[#0CBB7D]"}`} style={{ maxWidth: '300px', width: '200px' }}
                    >
                      {row.status}
                    </td>
                    <td className="text-left px-3 py-2" style={{ maxWidth: '300px', width: '200px' }}>
                      <p>
                        <span className="">paymentId :</span>{" "}
                        <span>{row.paymentDetails.paymentId}</span>
                      </p>
                      <p>
                        <span className="">OrderId :</span>{" "}
                        <span>{row.paymentDetails.orderId}</span>
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src={NotFound}
                        alt="No Data Found"
                        className="w-60 h-60 object-contain mb-2"
                      />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View (Card Format) */}
      <div className="md:hidden w-full">
        <div className="space-y-2 h-[calc(100vh-290px)] overflow-y-auto">
          {loading ? (
            <ThreeDotLoader />
          ) : transactions.length > 0 ? (
            transactions.map((row, index) => (
              <div
                key={index}
                className="bg-white rounded-lg text-gray-500 shadow px-4 py-3 border border-gray-200 text-[12px]"
              >
                {/* Top: Date and Status */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">
                    {new Date(row.date).toLocaleString()}
                  </span>
                  <span
                    className={`text-[12px] px-2 py-[2px] rounded-lg ${row.status.toLowerCase() === "failed"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                      }`}
                  >
                    {row.status}
                  </span>
                </div>

                {/* Middle: Description */}
                <div className="mb-3">
                  {[
                    { label: "Payment ID", value: row.paymentDetails.paymentId },
                    { label: "Order ID", value: row.paymentDetails.orderId },
                    { label: "Payment Gateway", value: "RZ" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[120px_10px_1fr] gap-2 text-gray-700 text-[12px] mb-1"
                    >
                      <span className="">{item.label}</span>
                      <span className="text-center">:</span>
                      <span className="text-gray-700 text-right break-words">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom: Txn ID and Amount */}
                <div className="mt-2 -mx-4 -my-4 px-4 py-2 bg-green-100 flex justify-between items-center">
                  <div>
                    <span className="text-gray-700">Transaction ID:</span><br />
                    <span className="text-gray-500">#{row.paymentDetails.transactionId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-700">Amount:</span><br />
                    <span className="text-gray-700">
                      ₹{Number(row.paymentDetails.amount).toFixed(2)}
                    </span>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <img
                src={NotFound}
                alt="No Data Found"
                className="w-60 h-60 object-contain mb-2"
              />
            </div>
          )}
        </div>
      </div>



      {/* Pagination Controls + Limit Selector */}
      <PaginationFooter
        page={currentPage}
        setPage={setCurrentPage}
        totalPages={totalPages}
        limit={limit}
        setLimit={setLimit}
      />


    </div>
  );
};

export default WalletHistory;
