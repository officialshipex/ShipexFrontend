import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { FaCalendarAlt, FaWallet, FaRupeeSign } from "react-icons/fa";
// import { toast } from "react-toastify";
import dayjs from "dayjs";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { useNavigate, Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Wallet, Banknote, Minus, Send } from "lucide-react";
import ThreeDotLoader from "../../Loader"
import Cookies from "js-cookie";
import { Notification } from "../../Notification"
import SellerRemittanceDatas from "../Billings/SellerRemittanceDatas";



const CodRemittances = () => {
  const [transactions, setTransactions] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dateRange, setDateRange] = useState("");
  const [status, setStatus] = useState("");
  const [utr, setUtr] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [remittanceId, setRemittanceId] = useState("");
  const [provider, setProvider] = useState("");
  const [customDateLabel, setCustomDateLabel] = useState('');
  const [summary, setSummary] = useState()
  const dateDropdownRef = useRef(null);
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
  const [loading, setLoading] = useState(true);
  const statusRef = useRef();
  const [openRemittancePopup, setOpenRemittancePopup] = useState(false);
  const [selectedRemittanceId, setSelectedRemittanceId] = useState(null);


  const openRemittanceDetails = (id) => {
    setSelectedRemittanceId(id);
    setOpenRemittancePopup(true);
  };

  const navigate = useNavigate()


  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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
      console.log("trans", response.data)
      setSummary(response.data.summary)
      setTransactions(response.data.results || []);
      setTotal(response.data.total || 0);
      setLoading(false)
    } catch (error) {
      Notification("Error fetching transactions", "error");
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
        `${REACT_APP_BACKEND_URL}/adminBilling/allCodRemittance`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            userSearch: userId || "",
            fromDate,
            toDate,
            status,
            page: 1, // when manually triggered, reset to first page
            limit,
            remittanceId,
            utr,
            provider
          },
        }
      );
      console.log("res", response)
      setSummary(response.data.summary)
      setTransactions(response.data.results || []);
      setTotal(response.data.total || 0);
      setLoading(false)
    } catch (error) {
      Notification("Error fetching transactions", "error");
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





  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusRef.current && !statusRef.current.contains(event.target) && dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
        setShowDateDropdown(false)
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedUserId, dateRange, page, limit, status, remittanceId, utr, provider]);

  const pageOptions = [20, 50, 75, 100, "all"];

  const handleClearFilters = () => {
    setUserQuery("");
    setRemittanceId("");
    setSelectedUserId("");
    setUtr("");
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
    setStatus("")
  }
  const summaryItems = [
    { title: "Total COD Remitted", value: summary?.totalCodRemitted, icon: <Banknote size={20} /> },
    { title: "Total Deduction from COD", value: summary?.totalDeductions, icon: <Minus size={20} /> },
    { title: "Remittance Initiated", value: summary?.totalRemittanceInitiated, icon: <Send size={20} /> },
    { title: "COD To Be Remitted", value: summary?.CODToBeRemitted || 0, icon: <Wallet size={20} /> },
  ];

  return (
    <div className="space-y-2">
      {/* Filter Section */}
      <div className="flex gap-2 sm:flex-row flex-col relative">
        {/* User Search */}
        <div className="relative">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => handleUserSearch(e.target.value)}
            placeholder="Search user by ID, name, or email"
            className="w-full sm:w-auto px-3 placeholder:text-gray-400 text-gray-700 focus:outline-none rounded-lg border-2 border-gray-300 placeholder:text-[12px] h-9 font-[600] text-[12px]" // Uniform height
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

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Remittance Id Search */}
          <input
            type="text"
            placeholder="Search Remittance Id"
            value={remittanceId}
            onChange={(e) => setRemittanceId(e.target.value)}
            className="px-3 border-2 w-full sm:w-auto placeholder:text-gray-400 text-gray-700 border-gray-300 focus:outline-none rounded-lg placeholder:text-[12px] h-9 text-[12px] font-[600]" // Uniform height
          />

          {/* UTR number Search */}
          <input
            type="text"
            placeholder="Search UTR Number"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            className="px-3 border-2 border-gray-300 sm:w-auto w-full placeholder:text-gray-400 text-gray-700 focus:outline-none rounded-lg placeholder:text-[12px] h-9 text-[12px] font-[600]" // Uniform height
          />
        </div>

        <div className="flex gap-2 sm:justify-between w-full">
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Date Range Dropdown */}
            <div className="relative w-full" ref={dateDropdownRef}>
              <button
                onClick={() => setShowDateDropdown((prev) => !prev)}
                className="w-full h-9 px-3 border-2 text-gray-400 border-gray-300 sm:w-40 rounded-lg text-left sm:text-[12px] text-[12px] bg-white flex items-center justify-between font-[600]"
                type="button"
              >
                {customDateLabel || "Dates"}
                <ChevronDown className={`w-4 h-4 transform transition-transform ${showDateDropdown ? "rotate-180" : ""}`} />
              </button>

              {showDateDropdown && (
                <ul className="absolute z-30 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto text-[12px]">
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
                      className={`px-3 py-2 text-gray-500 cursor-pointer hover:bg-green-100 ${dateRange === item.value ? "bg-green-100 font-[600]" : ""}`}
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

            {/* Status Filter */}
            <div className="relative w-full" ref={statusRef}>
              <button
                onClick={() => setShowStatusDropdown((prev) => !prev)}
                className="w-full h-9 px-3 border-2 border-gray-300 sm:w-[100px] rounded-lg text-gray-400 text-left sm:text-[12px] text-[12px] bg-white flex justify-between items-center font-[600]"
                type="button"
              >
                <span>{status || "Status"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showStatusDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showStatusDropdown && (
                <ul className="absolute z-30 w-full mt-1 bg-white border-2 rounded-lg shadow max-h-60 overflow-y-auto text-[12px]">
                  {[
                    "Paid", "Pending"
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
          <button
            className="px-3 h-9 sm:w-none text-[10px] border-gray-100 sm:text-[12px] border-2 rounded-lg font-[600] text-white bg-[#0CBB7D] hover:bg-green-500 transition whitespace-nowrap"
            onClick={handleClearFilters}
            type="button"
          >
            Clear
          </button>
        </div>
      </div>


      <div className="text-[12px] font-[600]">
        {/* ✅ Mobile View: Single Box */}
        <div className="md:hidden border-2 border-[#0CBB7D] bg-white rounded-lg p-4 space-y-2">
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
        <div className="hidden md:grid md:grid-cols-4 gap-5 my-2">
          {summaryItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-start text-start gap-4 p-2 bg-white rounded-lg border-2 border-[#0CBB7D] hover:shadow-sm transition-shadow duration-300"
            >
              <div className="bg-[#0CBB7D] text-white p-2 rounded-full">
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-[600] text-gray-700">
                  {typeof item.value === "number" ? item.value.toFixed(2) : item.value}
                </span>
                <span className="text-[14px] font-[500] text-gray-500">{item.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>





      <div className="hidden md:block">
        {loading ? (
          <ThreeDotLoader />
        ) : transactions.length === 0 ? (
          <div className="text-center text-gray-500">No data found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px] border border-gray-300 overflow-hidden">
              {/* Table Head */}
              <thead className="bg-[#0CBB7D] text-white font-[600]">
                <tr className="text-white bg-[#0CBB7D] border border-[#0CBB7D] text-[12px] font-600">
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

              {/* Table Body */}
              <tbody>
                {transactions.map((row, index) => (
                  <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                    {/* User Details */}
                    <td className="py-2 px-3 text-gray-700">
                      <p className="text-[#0CBB7D] font-medium">{row.user.userId}</p>
                      <p>{row.user.name}</p>
                      <p
                        className="text-gray-500 truncate max-w-[140px]"
                        title={row.user.email}
                      >
                        {row.user.email}
                      </p>
                      <p className="text-gray-500">{row.user.phoneNumber}</p>
                    </td>

                    {/* Date */}
                    <td className="py-2 px-3">
                      <p>{new Date(row.date).toLocaleTimeString()}</p>
                      <p>{new Date(row.date).toLocaleDateString()}</p>
                    </td>

                    <td className="py-2 px-3 text-[#0CBB7D] cursor-pointer" onClick={() => openRemittanceDetails(row.remittanceId)}>{row.remittanceId}</td>
                    <td className="py-2 px-3 text-[#0CBB7D]">{row.utr}</td>
                    <td className="py-2 px-3">{row.codAvailable.toFixed(2)}</td>
                    <td className="py-2 px-3">{row.amountCreditedToWallet.toFixed(2)}</td>
                    <td className="py-2 px-3">{row.earlyCodCharges.toFixed(2)}</td>
                    <td className="py-2 px-3">{row.adjustedAmount.toFixed(2)}</td>
                    <td className="py-2 px-3">{row.remittanceMethod}</td>
                    <td className="py-2 px-3">{row.remittanceInitiated.toFixed(2)}</td>
                    <td
                      className={`py-2 px-3 font-semibold ${row.status === "Paid" ? "text-[#0CBB7D]" : "text-red-600"
                        }`}
                    >
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="md:hidden">
        {loading ? (
          <ThreeDotLoader />
        ) : transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((row, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow border border-gray-200 p-3 text-[11px]"
              >
                {/* Main Transaction Table */}
                <table className="w-full text-[10px] text-gray-500">
                  <tbody>
                    <tr>
                      <td className="font-semibold text-left w-1/3">Date</td>
                      <td className="text-center w-4">:</td>
                      <td className="text-right w-2/3">{new Date(row.date).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">Time</td>
                      <td className="text-center">:</td>
                      <td className="text-right">{new Date(row.date).toLocaleTimeString()}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">Remittance ID</td>
                      <td className="text-center">:</td>
                      <td className="text-right text-[#0CBB7D]" onClick={() => openRemittanceDetails(row.remittanceId)}>{row.remittanceId}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">UTR</td>
                      <td className="text-center">:</td>
                      <td className="text-right text-[#0CBB7D]">{row.utr}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">COD Available</td>
                      <td className="text-center">:</td>
                      <td className="text-right">{row.codAvailable.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">Amount Credited</td>
                      <td className="text-center">:</td>
                      <td className="text-right">{row.amountCreditedToWallet.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">Early COD Charges</td>
                      <td className="text-center">:</td>
                      <td className="text-right">{row.earlyCodCharges.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">Adjusted Amount</td>
                      <td className="text-center">:</td>
                      <td className="text-right">{row.adjustedAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">Remittance Method</td>
                      <td className="text-center">:</td>
                      <td className="text-right">{row.remittanceMethod}</td>
                    </tr>
                  </tbody>
                </table>

                {/* User Details with Status on Right */}
                <div className="p-2 bg-green-50 rounded-md flex justify-between items-center text-[10px]">
                  {/* Left: User Info */}
                  <div className="space-y-1 text-gray-700">
                    <p className="font-semibold">{row.user.name}</p>
                    <p>{row.user.phoneNumber}</p>
                    <p className="text-[#0CBB7D]">{row.user.email}</p>
                    {/* <p className="text-gray-500">
                      User ID: <span className="text-[#0CBB7D]">{row.user.userId}</span>
                    </p> */}
                  </div>

                  {/* Right: Status Badge */}
                  <div
                    className={`font-semibold px-2 py-1 rounded-md text-[10px] whitespace-nowrap ${row.status === "Paid"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                      }`}
                  >
                    {row.status}
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
        <div className="text-[12px] text-gray-500">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
        </div>
        <div className="flex space-x-2 items-center">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-1 border-2 text-gray-700 text-[12px] border-gray-300 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-[12px] text-gray-700">{page}</span>
          <button
            onClick={() => setPage((prev) => (prev * limit < total ? prev + 1 : prev))}
            disabled={page * limit >= total}
            className="px-3 py-1 text-[12px] border-2 text-gray-700 border-gray-300 rounded disabled:opacity-50"
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
            className="ml-2 p-1 border-2 border-gray-300 text-gray-500 rounded text-[12px]"
          >
            {pageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
      {openRemittancePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white w-[90%] max-w-3xl rounded-lg shadow-xl p-2 relative">

            {/* Close Button */}
            <button
              onClick={() => setOpenRemittancePopup(false)}
              className="absolute right-2 top-2 text-gray-500 hover:text-black text-[12px] sm:text-[14px]"
            >
              ✕
            </button>

            {/* Load Remittance Component */}
            <SellerRemittanceDatas remittanceId={selectedRemittanceId} />

          </div>
        </div>
      )}
    </div >
  );
};

export default CodRemittances;
