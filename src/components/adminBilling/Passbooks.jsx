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
import Bluedart from "../../assets/bluedart.png";
import Delehivery from "../../assets/delehivery.png";
import EcomExpress from "../../assets/ecom-expresss.avif";
import Shadowfax from "../../assets/shadowfax.png";
import Xpressbees from "../../assets/xpressbees.png";
import Shiprocket from "../../assets/shiprocket.webp";
import NimbusPost from "../../assets/nimbuspost.webp";
import ShreeMaruti from "../../assets/shreemaruti.png";
import DTDC from "../../assets/dtdc.png";
import Amazon from "../../assets/amazon.jpg";
import ThreeDotLoader from "../../Loader"
import Smartship from "../../assets/bluedart.png";
import { motion, AnimatePresence } from "framer-motion";
import PassbookHistoryForm from "./PassbookHistoryForm";
import { FaBook } from "react-icons/fa";
import { FaUndo } from "react-icons/fa";
import Cookies from "js-cookie";
import { Notification } from "../../Notification"




const Passbooks = () => {
  const [transactions, setTransactions] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dateRange, setDateRange] = useState("");
  const [category, setCategory] = useState("");
  const [awbNumber, setAwbNumber] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [orderId, setOrderId] = useState("");
  const [customDateLabel, setCustomDateLabel] = useState('');
  const dateDropdownRef = useRef(null);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false)
  const [customRange, setCustomRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef();
  const categoryRef = useRef()
  const navigate = useNavigate()
  const searchTypeRef = useRef(null);
  const [searchType, setSearchType] = useState("awbNumber");
  const [searchInput, setSearchInput] = useState("");
  const [showForm, setShowForm] = useState(false)
  const [description, setDescription] = useState("");
  const descriptionRefDesktop = useRef(null);
  const descriptionRefMobile = useRef(null);

  const [showDescriptionDropdown, setShowDescriptionDropdown] = useState(false);

  // Sync searchInput into actual filter fields
  useEffect(() => {
    if (searchType === "orderId") {
      setOrderId(searchInput);
      setAwbNumber("");
    } else {
      setAwbNumber(searchInput);
      setOrderId("");
    }
  }, [searchInput, searchType]);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const carrierLogos = {
    Bluedart,
    Delhivery: Delehivery,
    EcomExpress,
    Shadowfax,
    Xpressbees,
    NimbusPost,
    Shiprocket,
    "Shree Maruti": ShreeMaruti,
    ShreeMaruti,
    DTDC,
    Dtdc: DTDC,
    Amazon,
    "Amazon Shipping": Amazon,
    Smartship
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }

      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setShowDateDropdown(false);
      }

      if (searchTypeRef.current && !searchTypeRef.current.contains(event.target)) {
        setShowSearchTypeDropdown(false);
      }

      // FIXED DESCRIPTION DROPDOWN LOGIC
      if (
        showDescriptionDropdown &&
        !(
          descriptionRefDesktop.current?.contains(event.target) ||
          descriptionRefMobile.current?.contains(event.target)
        )
      ) {
        setShowDescriptionDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDescriptionDropdown]);



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
            orderId,
            awbNumber
          },
        }
      );
      // console.log("transaction", response.data.results)
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

  const handleHistory = () => {
    setShowForm(true);
  }
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

  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  // Example reverse handler
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




  useEffect(() => {
    fetchTransactions();
  }, [selectedUserId, dateRange, page, limit, category, description, orderId, awbNumber]);

  const pageOptions = [20, 50, 75, 100, "all"];

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map((tran) => tran.id));
    }
  };

  const handleCheckboxChange = (tranId) => {
    setSelectedTransactions((prev) =>
      prev.includes(tranId)
        ? prev.filter((id) => id !== tranId)
        : [...prev, tranId]
    );
  };

  const handleExport = async () => {
    if (selectedTransactions.length === 0) {
      Notification("Please select at least one order to export.", "info");
      return;
    }
    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/adminBilling/exportPassbook`,
        { transactionsId: selectedTransactions }, // array of selected transaction IDs
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // important to handle file download
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "passbook_export.csv"); // Set desired file name, CSV extension
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Notification("Export successful!", "success");
    } catch (error) {
      console.error("Export error:", error);
      Notification("Failed to export passbook data. Please try again later.", "error");
    }
  };





  const handleClearFilters = () => {
    setUserQuery("");
    setSelectedUserId("");
    setOrderId("");
    setAwbNumber("");
    setSearchInput("")
    setCategory("");
    setDescription("");
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);

  }

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
            className="w-full sm:w-[200px] outline-none px-3 placeholder:text-gray-400 rounded-lg border-2 border-gray-300 text-gray-700 placeholder:text-[12px] h-9 text-[12px] font-[600]"
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

        <div className="flex items-center h-9 border-2 rounded-lg">
          {/* Dropdown */}
          <div className="relative h-full" ref={searchTypeRef}>
            <button
              type="button"
              onClick={() => setShowSearchTypeDropdown((prev) => !prev)}
              className="flex items-center justify-between px-3 w-24 h-full bg-gray-100 sm:text-[12px] text-[12px] border-r font-[600] border-gray-300 text-gray-400"
            >
              <span>{searchType === "orderId" ? "Order ID" : "AWB"}</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            {showSearchTypeDropdown && (
              <ul className="absolute z-10 bg-white shadow-md border font-[600] rounded-lg mt-1 w-24 text-[12px] text-gray-500">
                {["awbNumber", "orderId"].map((type) => (
                  <li
                    key={type}
                    className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${searchType === type ? "bg-green-100 font-[600]" : ""
                      }`}
                    onClick={() => {
                      setSearchType(type);
                      setShowSearchTypeDropdown(false);
                      setSearchInput("");
                    }}
                  >
                    {type === "orderId" ? "Order ID" : "AWB"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Input Field */}
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={`Search ${searchType === "orderId" ? "Order ID" : "AWB Number"}`}
            className="px-3 h-full placeholder:text-gray-400 text-gray-700 sm:w-[150px] border-gray-300 text-[12px] flex-1 outline-none border-l-0 font-[600]"
          />
        </div>

        <div className="flex gap-2 flex-col sm:flex-row justify-between w-full">
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Date Range Dropdown */}
            <div className="relative w-full" ref={dateDropdownRef}>
              <button
                onClick={() => setShowDateDropdown((prev) => !prev)}
                className="w-full h-9 p-2 border-2 border-gray-300 sm:w-[140px] rounded-lg text-left sm:text-[12px] text-[12px] bg-white flex items-center justify-between font-[600] text-gray-400"
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
            {/* Category Filter */}
            <div className="relative w-full" ref={categoryRef}>
              <button
                onClick={() => setShowCategoryDropdown((prev) => !prev)}
                className="w-full h-9 px-3 border-2 border-gray-300 sm:w-[100px] rounded-lg text-left sm:text-[12px] text-[12px] bg-white flex justify-between items-center font-[600] text-gray-400"
                type="button"
              >
                <span>{category || "Category"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showCategoryDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showCategoryDropdown && (
                <ul className="absolute z-30 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto text-[12px]">
                  {[
                    "credit", "debit"
                  ].map((s) => (
                    <li
                      key={s || "empty"}
                      className={`px-3 py-2 cursor-pointer text-gray-500 hover:bg-green-100 ${category === s ? "bg-green-100 font-[600]" : ""}`}
                      onClick={() => {
                        setCategory(s);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      {s || "Category"}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Description Filter */}
            <div className="relative w-full hidden sm:block" ref={descriptionRefDesktop}>
              <button
                onClick={() => setShowDescriptionDropdown((prev) => !prev)}
                className="sm:w-[200px] w-full h-9 px-3 border-2 text-gray-400 border-gray-300 rounded-lg text-left sm:text-[12px] text-[12px] bg-white font-[600] flex justify-between items-center"
                type="button"
              >
                <span>{description || "Description"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showDescriptionDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showDescriptionDropdown && (
                <ul className="absolute sm:w-[200px] w-[200px] z-30 mt-1 bg-white border rounded-lg text-gray-500 overflow-y-auto text-[12px]">
                  {[
                    "Freight Charges Applied", "Freight Charges Received", "Auto-accepted Weight Dispute charge", "Weight Dispute Charges Applied", "COD Charges Received", "RTO Freight Charges Applied"
                  ].map((s) => (
                    <li
                      key={s || "empty"}
                      className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${description === s ? "bg-gray-100" : ""}`}
                      onClick={() => {
                        setDescription(s);
                        setShowDescriptionDropdown(false);
                      }}
                    >
                      {s || "Description"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {/* Description Filter */}
            <div className="relative w-full sm:hidden" ref={descriptionRefMobile}>
              <button
                onClick={() => setShowDescriptionDropdown((prev) => !prev)}
                className="sm:w-[200px] w-full h-9 px-3 border-2 text-gray-400 border-gray-300 rounded-lg text-left sm:text-[12px] text-[12px] bg-white flex justify-between items-center"
                type="button"
              >
                <span>{description || "Description"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showDescriptionDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showDescriptionDropdown && (
                <ul className="absolute sm:w-[200px] w-[200px] z-30 mt-1 bg-white border rounded-lg text-gray-500 font-[600] overflow-y-auto text-[12px]">
                  {[
                    "Freight Charges Applied", "Freight Charges Received", "Auto-accepted Weight Dispute charge", "Weight Dispute Charges Applied", "COD Charges Received", "RTO Freight Charges Applied"
                  ].map((s) => (
                    <li
                      key={s || "empty"}
                      className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${description === s ? "bg-gray-100" : ""}`}
                      onClick={() => {
                        setDescription(s);
                        setShowDescriptionDropdown(false);
                      }}
                    >
                      {s || "Description"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              className="px-3 h-9 sm:w-none text-[10px] border-gray-100 sm:text-[12px] border-2 rounded-lg font-[600] text-white bg-[#0CBB7D] hover:bg-green-500 transition whitespace-nowrap"
              onClick={handleClearFilters}
              type="button"
            >
              Clear
            </button>
            <button className={`rounded-lg sm:text-[12px] border-2 border-gray-100 text-[10px] px-3 h-9 font-[600] justify-center items-center ${selectedTransactions.length === 0
              ? "border-white bg-gray-300 text-[10px] sm:text-[12px] cursor-not-allowed text-gray-500"
              : "text-white border-[#0CBB7D] bg-[#0CBB7D] text-[10px] sm:text-[12px]"
              }`} onClick={handleExport}>
              Export
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
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-[12px] text-left">
              {/* Table Head */}
              <thead>
                <tr className="bg-[#0CBB7D] text-white font-[600] border border-[#0CBB7D] text-[12px]">
                  <th className="py-2 px-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedTransactions.length === selectedTransactions.length &&
                        selectedTransactions.length > 0
                      }
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-[#0CBB7D] w-4"
                    />
                  </th>
                  <th className="py-2 px-3">User Details</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Order ID</th>
                  <th className="py-2 px-3">AWB Number</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Available Balance</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {transactions.map((row, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-300 hover:bg-gray-50 text-gray-500"
                  >
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(row.id)}
                        onChange={() => handleCheckboxChange(row.id)}
                        className="cursor-pointer accent-[#0CBB7D] w-4"
                      />
                    </td>
                    {/* User Details */}
                    <td className="py-2 px-3">
                      <p className="text-[#0CBB7D] font-medium">{row.user.userId}</p>
                      <p>{row.user.name}</p>
                      <p
                        className="text-gray-500 truncate max-w-[150px]"
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

                    {/* Order ID */}
                    <td className="py-2 px-3">
                      <Link
                        to={`/dashboard/order/neworder/updateOrder/${Number(
                          row.orderId
                        )}`}
                        className="text-[#0CBB7D] font-[600]"
                      >
                        {row.orderId}
                      </Link>
                    </td>

                    {/* AWB Number */}
                    <td className="py-2 px-3">
                      <p
                        className="text-[#0CBB7D] font-[600] cursor-pointer"
                        onClick={() => handleTrackingByAwb(row.awb_number)}
                      >
                        {row.awb_number}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="py-2 px-3">{row.category}</td>

                    {/* Amount */}
                    <td className="py-2 px-3 font-[600]">
                      <span
                        className={
                          row.category === "debit"
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        ₹{Number(row.amount).toFixed(2)}
                      </span>
                    </td>

                    {/* Balance After Transaction */}
                    <td className="py-2 px-3">₹{Number(row.balanceAfterTransaction).toFixed(2)}</td>

                    {/* Description */}
                    <td className="py-2 px-3">
                      <p className="font-semibold">Description:</p>
                      <p>{row.description}</p>
                    </td>
                    {/* Action - Reverse Icon */}
                    <td className="py-2 px-3">
                      {row.category === "debit" && (
                        <button
                          className="bg-[#0CBB7D] text-white p-2 rounded-full hover:bg-green-500 cursor-pointer relative group"
                          onClick={() => handleReverse(row)}
                        >
                          <FaUndo size={14} />
                          {/* Tooltip */}
                          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs bg-gray-700 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                            Reverse Amount
                          </span>
                        </button>
                      )}
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
            <div className="p-1 bg-green-200 rounded-md flex gap-3 items-center">
              <input
                type="checkbox"
                checked={
                  selectedTransactions.length === transactions.length && transactions.length > 0
                }
                onChange={handleSelectAll}
                className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
              />
              <span className="text-[10px] font-[600]">Select All</span>
            </div>
            {transactions.map((row, index) => (
              <div
                key={index}
                className="bg-white rounded-md shadow p-3 border border-gray-200 text-[11px]"
              >
                {/* 🚚 Shipment Info Top Row */}
                <div className="flex gap-2 justify-between rounded-lg bg-green-100 py-2 px-3 items-center mb-2">
                  {/* Courier Logo */}
                  <input
                    type="checkbox"
                    checked={selectedTransactions.includes(row.id)}
                    onChange={() => handleCheckboxChange(row.id)}
                    className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                  />
                  <img
                    src={carrierLogos[row.provider] || "/default-courier-logo.png"}
                    alt="Courier Logo"
                    className="w-7 h-7 rounded-full border-2 border-gray-300 object-contain"
                  />

                  {/* Courier Name */}
                  <p className="text-gray-700 font-medium text-[11px] flex-1 ml-2">
                    {row.courierServiceName}
                  </p>

                  {/* AWB Number */}
                  <p
                    className="text-green-600 font-semibold cursor-pointer text-[10px]"
                    onClick={() => handleTrackingByAwb(row.awb_number)}
                  >
                    {row.awb_number || "N/A"}
                  </p>
                </div>

                {/* 📅 Shipment Meta Info */}
                <table className="w-full text-[10px] text-gray-600 mb-2">
                  <tbody>
                    <tr>
                      <td className="w-1/3 font-[600] text-gray-500">Date</td>
                      <td className="w-1 text-center">:</td>
                      <td className="w-2/3 text-right">
                        {new Date(row.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-[600] text-gray-500">Order ID</td>
                      <td className="text-center">:</td>
                      <td className="text-right text-gray-700 font-[600]">
                        <Link
                          to={`/dashboard/order/neworder/updateOrder/${Number(row.orderId)}`}
                          className="text-gray-700"
                        >
                          {row.orderId}
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="font-[600] text-gray-500">Amount</td>
                      <td className="text-center">:</td>
                      <td className="text-right font-[600]">₹{row.amount}</td>
                    </tr>
                    <tr>
                      <td className="font-[600] text-gray-500">Balance After</td>
                      <td className="text-center">:</td>
                      <td className="text-right">
                        ₹{Number(row.balanceAfterTransaction).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-[600] text-gray-500">Description</td>
                      <td className="text-center">:</td>
                      <td className="text-right">{row.description}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 👤 User Info + Category */}
                <div className="mt-3 p-2 bg-green-50 rounded-md flex justify-between items-center text-[10px]">
                  {/* Left: User Info */}
                  <div className="text-gray-700 space-y-0.5">
                    <p className="font-[600]">{row.user.name}</p>
                    <p>{row.user.phoneNumber}</p>
                    <p className="text-[#0CBB7D]">{row.user.email}</p>
                    {/* <p className="text-gray-500">
                      User ID:{" "}
                      <span className="text-[#0CBB7D]">{row.user.userId}</span>
                    </p> */}
                  </div>

                  {/* Right: Category */}
                  <div
                    className={`font-[600] px-2 py-1 rounded-md text-[10px] whitespace-nowrap mt-1 ${row.category === "debit"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                      }`}
                  >
                    {row.category.toUpperCase()}
                  </div>
                  {/* Reverse Icon Button */}
                  {row.category === "debit" && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleReverse(row)}
                        className="relative group bg-[#0CBB7D] rounded-full text-white hover:bg-green-500 p-2"
                      >
                        <FaUndo size={10} />
                        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                          Reverse Amount
                        </span>
                      </button>
                    </div>
                  )}
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
        <div className="text-[12px] text-gray-700">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
        </div>
        <div className="flex space-x-2 items-center">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-[12px] border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-[12px]">{page}</span>
          <button
            onClick={() => setPage((prev) => (prev * limit < total ? prev + 1 : prev))}
            disabled={page * limit >= total}
            className="px-3 py-1 text-[12px] border rounded disabled:opacity-50"
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
              className="bg-white rounded-lg shadow-lg w-[90%] max-w-lg p-4 relative"
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

              <PassbookHistoryForm onClose={() => setShowForm(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default Passbooks;
