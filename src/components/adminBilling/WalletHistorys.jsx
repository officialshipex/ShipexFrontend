import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { FaCalendarAlt, FaWallet, FaRupeeSign } from "react-icons/fa";
// import { toast } from "react-toastify";
import dayjs from "dayjs";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import ThreeDotLoader from "../../Loader"
import WalletHistoryForm from "./WalletHistoryForm";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import {Notification} from "../../Notification"



const WalletHistorys = () => {
  const [transactions, setTransactions] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dateRange, setDateRange] = useState("");
  const [status, setStatus] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [customDateLabel, setCustomDateLabel] = useState('');
  const [transactionId, setTransactionId] = useState("");
  const dateDropdownRef = useRef()
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [customRange, setCustomRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef();
  const statusRef = useRef();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate()


  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target) && statusRef.current && !statusRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
        setShowDateDropdown(false)
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getDateRange = () => {
    const today = dayjs();
    switch (dateRange) {
      case "today":
        return {
          fromDate: today.startOf("day").toISOString(),
          toDate: today.endOf("day").toISOString(),
        };
      case "yesterday":
        return {
          fromDate: today.subtract(1, "day").startOf("day").toISOString(),
          toDate: today.subtract(1, "day").endOf("day").toISOString(),
        };
      case "last5days":
        return {
          fromDate: today.subtract(5, "day").startOf("day").toISOString(),
          toDate: today.endOf("day").toISOString(),
        };
      case "thisMonth":
        return {
          fromDate: today.startOf("month").toISOString(),
          toDate: today.endOf("month").toISOString(),
        };
      case "lastMonth":
        const lastMonth = today.subtract(1, "month");
        return {
          fromDate: lastMonth.startOf("month").toISOString(),
          toDate: lastMonth.endOf("month").toISOString(),
        };
      case "custom":
        return {
          fromDate: customRange[0].startDate.toISOString(),
          toDate: customRange[0].endDate.toISOString(),
        };
      default:
        return {};
    }
  };


  const fetchTransactions = async () => {
    try {
      const token = Cookies.get("session");
      const { fromDate, toDate } = getDateRange();
      setLoading(true)
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/adminBilling/allTransactionHistory`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            userSearch: selectedUserId || "",
            fromDate,
            toDate,
            status,
            page,
            limit,
            paymentId: paymentId.trim(),
            transactionId: transactionId.trim()
          },
        }
      );
      console.log("trans", response.data.results)
      setTransactions(response.data.results || []);
      setTotal(response.data.total || 0);
      setLoading(false)
    } catch (error) {
      Notification("Error fetching transactions","error");
    }
  };

  const handleUserSearch = async (query) => {
    setUserQuery(query);
    if (query.length < 2) {
      setUserSuggestions([]);
      setSelectedUserId(null);
      return;
    }
    try {
      const res = await axios.get(`${REACT_APP_BACKEND_URL}/admin/searchUser`, {
        params: { query },
      });
      setUserSuggestions(res.data.users || []);
    } catch {
      setUserSuggestions([]);
    }
  };

  const fetchTransactionsManually = async (userId) => {
    try {
      const token = Cookies.get("session");
      const { fromDate, toDate } = getDateRange();
      setLoading(true);
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/adminBilling/allTransactionHistory`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            userSearch: userId || "",
            fromDate,
            toDate,
            status,
            page: 1, // when manually triggered, reset to first page
            limit,
            paymentId: paymentId.trim(),
          },
        }
      );
      setTransactions(response.data.results || []);
      setTotal(response.data.total || 0);
      setLoading(false)
    } catch (error) {
      Notification("Error fetching transactions","error");
    }
  };
  const handleApplyCustomDate = () => {
    setShowCalendar(false);
    const start = dayjs(customRange[0].startDate).format("MMM D");
    const end = dayjs(customRange[0].endDate).format("MMM D");

    setCustomDateLabel(`${start} - ${end}`);
    setDateRange("custom"); // Ensure it's always "custom"
    fetchTransactions();
  };

  const handleDateRangeChange = (e) => {
    const value = e.target.value;

    // If the selected value is "custom"
    if (value === "custom") {
      // Toggle the calendar visibility
      setShowCalendar(!showCalendar);
    } else {
      setShowCalendar(false); // Hide calendar for other selections
    }

    setDateRange(value);
  };

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleHistory = () => {
    setShowForm(true);
  }

  useEffect(() => {
    fetchTransactions();
  }, [selectedUserId, dateRange, status, page, limit, paymentId, transactionId]);

  const pageOptions = [20, 50, 75, 100, "all"];
  const handleClearFilters = () => {
    setTransactionId("");
    setPaymentId("");
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
    setStatus("")
    setUserQuery("");
  }

  return (
    <div className="space-y-2">
      {/* Filter Section */}
      <div className="flex gap-2 sm:flex-row flex-col relative">
        <div className="flex gap-2">
          {/* User Search */}
          <div className="relative w-full">
            <input
              type="text"
              value={userQuery}
              onChange={(e) => handleUserSearch(e.target.value)}
              placeholder="Search user by ID, name, or email"
              className="w-[240px] sm:w-auto px-3 focus:outline-none rounded-lg border-2 placeholder:text-[12px] placeholder:text-gray-400 text-gray-700 h-9 text-[12px] border-gray-300 font-[600]"
            />
            {userSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full bg-white shadow-lg rounded-md mt-1 z-20 max-h-60 overflow-y-auto">
                {userSuggestions.map((user, index) => (
                  <div
                    key={user._id}
                    className={`flex cursor-pointer group transition-colors duration-200 ${index !== userSuggestions.length
                      ? "border-b border-gray-200  hover:bg-gray-100"
                      : ""
                      }`}
                    onClick={() => {
                      setSelectedUserId(user._id);
                      setUserQuery(`${user.fullname} (${user.email})`);
                      setUserSuggestions([]);
                      setPage(1);
                    }}
                  >
                    {/* Left column: User ID */}
                    <div className="w-1/4 flex items-center justify-center p-2 transition-colors duration-300">
                      <p className="text-[12px] text-gray-400 group-hover:text-[#0CBB7D] font-medium truncate text-center transition-colors duration-200">
                        {user.userId}
                      </p>
                    </div>

                    {/* Right column: Name, Email, Phone */}
                    <div className="w-3/4 flex flex-col justify-center py-[7px] pr-2 leading-tight">
                      <p className="text-[13px] text-gray-500 group-hover:text-[#0CBB7D] font-medium truncate transition-colors duration-200">
                        {user.fullname}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {user.email}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {user.phoneNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Status Filter */}
          <div className="relative w-full" ref={statusRef}>
            <button
              onClick={() => setShowStatusDropdown((prev) => !prev)}
              className="w-full h-9 px-3 border-2 border-gray-300 rounded-lg text-left sm:text-[12px] text-[12px] bg-white flex justify-between items-center font-[600] text-gray-400"
              type="button"
            >
              <span>{status || "Status"}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${showStatusDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showStatusDropdown && (
              <ul className="absolute z-30 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto text-[12px]">
                {[
                  "success", "failed"
                ].map((s) => (
                  <li
                    key={s || "empty"}
                    className={`px-3 py-2 text-gray-500 cursor-pointer hover:bg-green-100 ${status === s ? "bg-green-100 font-[600]" : ""}`}
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

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="px-3 w-full sm:w-auto border-2 border-gray-300 focus:outline-none placeholder:text-gray-400 text-gray-700 rounded-lg placeholder:text-[12px] h-9 text-[12px] font-[600]"
          />
          {/* Payment ID Filter */}
          <input
            type="text"
            placeholder="Search Payment ID"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            className="px-3 w-full sm:w-auto border-2 placeholder:text-gray-400 text-gray-700 border-gray-300 focus:outline-none rounded-lg placeholder:text-[12px] h-9 text-[12px] font-[600]"
          />
        </div>

        <div className="flex gap-2 justify-between w-full">


          {/* Date Range Dropdown */}
          <div className="relative w-full sm:w-auto" ref={dateDropdownRef}>
            <button
              onClick={() => setShowDateDropdown((prev) => !prev)}
              className="w-full sm:w-[140px] h-9 px-3 border-2 border-gray-300 rounded-lg text-left text-gray-400 sm:text-[12px] text-[12px] bg-white flex items-center justify-between font-[600]"
              type="button"
            >
              {customDateLabel || "Dates"}
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showDateDropdown ? "rotate-180" : ""}`} />
            </button>

            {showDateDropdown && (
              <ul className="absolute z-30 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto text-[12px]">
                {[
                  // { value: "", label: "Dates" },
                  { value: "today", label: "Today" },
                  { value: "yesterday", label: "Yesterday" },
                  { value: "last5days", label: "Last 5 Days" },
                  { value: "thisMonth", label: "This Month" },
                  { value: "lastMonth", label: "Last Month" },
                  { value: "custom", label: customDateLabel ? `Custom: ${customDateLabel}` : "Custom" }
                ].map((item) => (
                  <li
                    key={item.value || "default"}
                    className={`px-3 py-2 cursor-pointer text-gray-500 hover:bg-green-100 ${dateRange === item.value ? "bg-green-100 font-[600]" : ""}`}
                    onClick={() => {
                      setDateRange(item.value);
                      setShowDateDropdown(false);
                      if (item.value === "custom") {
                        setShowCalendar(true);
                      } else {
                        setShowCalendar(false);
                      }
                    }}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            )}

            {/* Calendar Dropdown */}
            {showCalendar && (
              <div
                ref={calendarRef}
                className="absolute z-30 mt-2 bg-white shadow-lg rounded p-2 w-[350px]"
              >
                <DateRange
                  editableDateInputs={true}
                  onChange={(item) => setCustomRange([item.selection])}
                  moveRangeOnFirstSelection={false}
                  ranges={customRange}
                  maxDate={new Date()}
                  showDateDisplay={false}
                />
                <button
                  onClick={handleApplyCustomDate}
                  className="w-full mt-2 bg-[#0CBB7D] text-white text-sm py-1 px-3 rounded hover:bg-green-600"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              className="h-9 px-3 sm:w-none text-[10px] sm:text-[12px] border-2 border-gray-100 rounded-lg font-[600] text-white bg-[#0CBB7D] hover:bg-green-500 transition whitespace-nowrap"
              onClick={handleClearFilters}
              type="button"
            >
              Clear
            </button>

            <button className="rounded-lg sm:text-[12px] hover:bg-green-500 border-2 border-gray-100 text-[10px] px-3 h-9 bg-[#0CBB7D] text-white font-[600]" onClick={handleHistory}>
              Wallet Updation
            </button>
          </div>

        </div>
      </div>

      <div className="hidden md:block">
        {loading ? (
          <ThreeDotLoader />
        ) : transactions.length === 0 ? (
          <div className="text-center text-gray-500">No data found</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-left text-[12px]">
              <thead>
                <tr className="bg-[#0CBB7D] border border-[#0CBB7D] text-white text-[12px] font-[600]">
                  <th className="px-3 py-2">User Details</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Transaction ID</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {transactions.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 border border-gray-300">
                    <td className="px-3 py-2 text-gray-700" style={{ maxWidth: "350px", width: "300px" }}>
                      <p className="text-[#0CBB7D] font-[600]">{row.user.userId}</p>
                      <p>{row.user.name}</p>
                      <p className="text-gray-500">{row.user.email}</p>
                      <p className="text-gray-500">{row.user.phoneNumber}</p>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      <p>{new Date(row.date).toLocaleTimeString()}</p>
                      <p>{new Date(row.date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-3 py-2 text-[#0CBB7D]">{row.transactionId}</td>
                    <td className="px-3 py-2 text-gray-700">₹{Number(row.amount).toFixed(2)}</td>
                    <td className={`px-3 py-2 font-[600] ${row.status === "success" ? "text-[#0CBB7D]" : "text-red-500"}`}>
                      {row.status}
                    </td>
                    <td className="px-3 py-2" style={{ maxWidth: "300px", width: "250px" }}>
                      <p>
                        <span className="font-[600]">paymentId:</span> {row.paymentId}
                      </p>
                      <p>
                        <span className="font-[600]">OrderId:</span> {row.orderId}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Mobile Transaction Cards */}
      <div className="md:hidden">
        {loading ? (
          <ThreeDotLoader />
        ) : transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((row, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow duration-300 text-[12px]"
              >
                <div className="flex justify-between items-center w-full mb-2">
                  <div>
                    {/* Date Row */}
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-1 text-[#0CBB7D]" />
                      <span>{new Date(row.date).toLocaleDateString()}</span>
                    </div>


                    {/* Payment ID Row */}
                    <div className="flex items-center">
                      {/* <FaRupeeSign className="mr-2 text-gray-400" /> */}
                      <span className="truncate">Payment ID: {row.paymentId || "N/A"}</span>
                    </div>

                    {/* Transaction ID Row */}
                    {row.transactionId && (

                      <span className="truncate">
                        <span className="font-medium">Txn ID:</span> {row.transactionId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center w-[80px]">
                    <span className="font-semibold text-gray-800">
                      ₹{Number(row.amount).toFixed(2)}
                    </span>
                  </div>
                </div>



                {/* Divider - User Details & Status */}
                <div className="p-2 mt-1 flex justify-between items-center bg-green-50 rounded-lg text-[10px]">
                  {/* Left: User Info */}
                  <div className="text-gray-700 space-y-1">
                    <p className="font-semibold">{row.user.name}</p>
                    <p>{row.user.phoneNumber}</p>
                    <p className="text-[#0CBB7D] truncate">{row.user.email}</p>
                  </div>

                  {/* Right: Status */}
                  <div
                    className={`text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap ${row.status === "success"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-500"
                      }`}
                  >
                    {row.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">No data found</div>
        )}
      </div>





      {/* Limit Selector & Pagination */}
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-[12px] text-gray-600">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
        </div>
        <div className="flex space-x-2 items-center">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-1 border text-[12px] rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-[12px]">{page}</span>
          <button
            onClick={() => setPage((prev) => (prev * limit < total ? prev + 1 : prev))}
            disabled={page * limit >= total}
            className="px-3 py-1 border text-[12px] rounded disabled:opacity-50"
          >
            Next
          </button>
          <select
            value={limit}
            onChange={(e) => {
              const val = e.target.value;
              setLimit(val === "all" ? total : parseInt(val));
              setPage(1);
            }}
            className="ml-2 p-1 border rounded text-[12px]"
          >
            {pageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center">
            <motion.div
              className="bg-white rounded-lg shadow-lg w-[90%] max-w-4xl p-4 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
            >
              {/* Close button top-right */}
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-2 right-3 text-2xl font-bold text-gray-600 hover:text-red-500"
              >
                ×
              </button>

              <WalletHistoryForm onClose={() => setShowForm(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div >
  );
};

export default WalletHistorys;
