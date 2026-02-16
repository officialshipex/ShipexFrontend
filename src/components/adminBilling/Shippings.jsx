import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { FaCalendarAlt, FaWallet, FaRupeeSign } from "react-icons/fa";
// import { toast } from "react-toastify";
import { ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { useNavigate, Link } from "react-router-dom";
import ThreeDotLoader from "../../Loader"
import Cookies from "js-cookie";
import { Notification } from "../../Notification"



const Shippings = () => {
  const [transactions, setTransactions] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dateRange, setDateRange] = useState("");
  const [status, setStatus] = useState("");
  const [awbNumber, setAwbNumber] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [orderId, setOrderId] = useState("");
  const [provider, setProvider] = useState("");
  const [customDateLabel, setCustomDateLabel] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const dateDropdownRef = useRef(null);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false)
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
  const statusRef = useRef(null);

  const navigate = useNavigate()
  const providerRef = useRef(null);
  const searchTypeRef = useRef(null);


  const [searchType, setSearchType] = useState("awbNumber");
  const [searchInput, setSearchInput] = useState("");

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


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        providerRef.current &&
        statusRef.current &&
        dateDropdownRef.current &&
        searchTypeRef.current &&
        !providerRef.current.contains(event.target) &&
        !statusRef.current.contains(event.target) &&
        !dateDropdownRef.current.contains(event.target) &&
        !searchTypeRef.current.contains(event.target)
      ) {
        setShowProviderDropdown(false);
        setShowStatusDropdown(false);
        setShowDateDropdown(false);
        setShowSearchTypeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);





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
        `${REACT_APP_BACKEND_URL}/adminBilling/allShipping`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            userSearch: selectedUserId || "",
            fromDate,
            toDate,
            status,
            page,
            limit,
            orderId,
            awbNumber,
            provider
          },
        }
      );
      console.log("trans", response.data.results)
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



  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedUserId, dateRange, page, limit, status, orderId, awbNumber, provider]);

  const pageOptions = [20, 50, 75, 100, "all"];
  const handleClearFilters = () => {
    setOrderId("");
    setUserQuery("");
    setAwbNumber("");
    setProvider("");
    setStatus("");
    setSearchInput("");
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
    setPage(1);
    setLimit(20);
  };

  return (
    <div className="sm:space-y-2">
      {/* Filter Section */}
      <div className="flex gap-2 sm:flex-row flex-col">
        {/* User Search */}
        <div className="relative flex gap-2">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => handleUserSearch(e.target.value)}
            placeholder="Search user by ID, name, or email"
            className="w-full px-3 rounded-lg md:w-[250px] text-gray-700 border-gray-300 border-2 placeholder:text-gray-400 text-[12px] placeholder:text-[12px] font-[600] h-9 focus:outline-none" // Uniform height
          />
          {userSuggestions.length > 0 && (
            <div className="absolute left-0 md:w-[250px] right-0 top-full bg-white shadow-lg rounded-lg mt-1 z-20 max-h-60 overflow-y-auto">
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

          {/* Date Range Dropdown */}
          <div className="relative sm:w-[150px] w-[140px]" ref={dateDropdownRef}>
            <button
              onClick={() => setShowDateDropdown((prev) => !prev)}
              className="w-full h-9 font-[600] px-3 border-2 rounded-lg text-left sm:text-[12px] text-[12px] bg-white flex items-center justify-between border-gray-300 text-gray-400"
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
                    className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${dateRange === item.value ? "bg-green-100 font-[600] text-gray-500" : ""}`}
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
        </div>

        <div className="flex gap-2">
          <div className="flex items-center h-9 border-2 rounded-lg">
            {/* Dropdown */}
            <div className="relative h-full" ref={searchTypeRef}>
              <button
                type="button"
                onClick={() => setShowSearchTypeDropdown((prev) => !prev)}
                className="flex items-center justify-between px-3 w-24 h-full bg-gray-100 sm:text-[12px] text-[12px] border-r font-[600] border-gray-300 text-gray-400"
              >
                <span>{searchType === "awbNumber" ? "AWB" : "Order Id"}</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {showSearchTypeDropdown && (
                <ul className="absolute z-10 bg-white border rounded-lg font-[600] mt-1 w-24 text-[12px]">
                  {["awbNumber", "orderId"].map((type) => (
                    <li
                      key={type}
                      className={`px-3 py-2 text-gray-500 cursor-pointer hover:bg-green-100 ${searchType === type ? "bg-green-100 font-[600]" : ""
                        }`}
                      onClick={() => {
                        setSearchType(type);
                        setShowSearchTypeDropdown(false);
                        setSearchInput("");
                      }}
                    >
                      {type === "orderId" ? "Order Id" : "AWB"}
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
              className="px-3 md:w-[150px] w-[140px] h-full text-[12px] placeholder:text-gray-400 text-gray-700 border-gray-300 font-[600] flex-1 outline-none border-l-0"
            />
          </div>
          {/* Provider Filter */}
          <div className="relative w-full" ref={providerRef}>
            <button
              onClick={() => setShowProviderDropdown((prev) => !prev)}
              className="w-full h-9 px-3 sm:w-[150px] text-gray-400 border-gray-300 border-2 rounded-lg text-left text-[12px] bg-white flex justify-between items-center font-[600]"
              type="button"
            >
              <span>{provider || "Provider"}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${showProviderDropdown ? "rotate-180" : ""}`}
              />
            </button>
            {showProviderDropdown && (
              <ul className="absolute z-40 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto text-[12px]">
                {["Delhivery", "DTDC", "EcomExpress", "Amazon"].map((s) => (
                  <li
                    key={s || "empty"}
                    className={`px-3 py-2 text-gray-500 cursor-pointer hover:bg-green-100 ${provider === s ? "bg-green-100 font-[600]" : ""
                      }`}
                    onClick={() => {
                      setProvider(s);
                      setShowProviderDropdown(false);
                    }}
                  >
                    {s || "Provider"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-between w-full">
          {/* Status Filter */}
          <div className="relative w-full" ref={statusRef}>
            <button
              onClick={() => setShowStatusDropdown((prev) => !prev)}
              className="w-full h-9 px-3 sm:w-[150px] border-2 rounded-lg text-left sm:text-[12px] text-[12px] bg-white flex justify-between items-center font-[600] border-gray-300 text-gray-400"
              type="button"
            >
              <span>{status || "Status"}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${showStatusDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showStatusDropdown && (
              <ul className="absolute z-30 w-full sm:w-[150px] mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto text-[12px]">
                {[
                  "new", "Ready To Ship", "In-transit", "Out for Delivery",
                  "Delivered", "Cancelled", "RTO", "RTO In-transit", "RTO Delivered", "Undelivered"
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
          <button
            className="px-3 h-9 text-[10px] sm:text-[12px] font-[600] border-2 border-gray-100 rounded-lg text-white bg-[#0CBB7D] hover:bg-green-500 transition"
            onClick={handleClearFilters}
            type="button"
          >
            Clear
          </button>

        </div>
      </div>



      <div className="hidden md:block">
        {loading ? (
          <ThreeDotLoader />
        ) : transactions.length === 0 ? (
          <div className="text-center text-gray-500">No data found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px] border overflow-hidden">
              <thead>
                <tr className="bg-[#0CBB7D] text-white border border-[#0CBB7D] font-[600] text-left">
                  <th className="py-2 px-3 text-left">User Details</th>
                  <th className="py-2 px-3 text-left">Order Details</th>
                  <th className="py-2 px-3 text-left">AWB Number</th>
                  <th className="py-2 px-3 text-left">Courier</th>
                  <th className="py-2 px-3 text-left">Shipment Status</th>
                  <th className="py-2 px-3 text-left">AWB Assigned Weight</th>
                  <th className="py-2 px-3 text-left">Total Freight Charges</th>
                  <th className="py-2 px-3 text-left">Entered Weight & Dimension</th>
                </tr>
              </thead>
              <tbody className="bg-white text-gray-700">
                {transactions.map((row, index) => (
                  <tr key={index} className="border border-gray-300 font-[400] text-[12px]">
                    <td className="py-2 px-3">
                      <p className="text-[#0CBB7D]">{row.user.userId}</p>
                      <p>{row.user.name}</p>
                      <p
                        className="text-gray-500 truncate max-w-[150px]"
                        title={row.user.email}
                      >
                        {row.user.email}
                      </p>
                      <p className="text-gray-500">{row.user.phoneNumber}</p>
                    </td>

                    <td className="py-2 px-3">
                      <Link
                        to={`/dashboard/order/neworder/updateOrder/${Number(row.orderId)}`}
                        className="text-[#0CBB7D] font-medium block"
                      >
                        {row.orderId}
                      </Link>
                      <p>{new Date(row.createdAt).toLocaleTimeString()}</p>
                      <p>{new Date(row.createdAt).toLocaleDateString()}</p>
                    </td>

                    <td className="py-2 px-3">
                      <p
                        className="text-[#0CBB7D] cursor-pointer"
                        onClick={() => handleTrackingByAwb(row.awb_number)}
                      >
                        {row.awb_number}
                      </p>
                    </td>

                    <td className="py-2 px-3">
                      {row?.courierServiceName}
                    </td>

                    <td className="py-2 px-3">
                      {row?.status}
                    </td>

                    {row?.orderType === "B2C" ? (
                      <td className="py-2 px-3">
                        {Number(row?.packageDetails?.deadWeight)?.toFixed(3)} Kg
                      </td>
                    ) : (
                      <td className="py-2 px-3">
                        {Number(row?.B2BPackageDetails?.applicableWeight)?.toFixed(3)} Kg
                      </td>
                    )}

                    <td className="py-2 px-3">
                      ₹{row?.totalFreightCharges || 0}
                    </td>

                    {row?.orderType === "B2C" ? (
                      <td className="py-2 px-3">
                        <p className="font-[600]">
                          {row?.packageDetails?.applicableWeight} Kg
                        </p>
                        <p>
                          {row?.packageDetails?.volumetricWeight.length} ×{" "}
                          {row.packageDetails?.volumetricWeight.width} ×{" "}
                          {row.packageDetails?.volumetricWeight.height} cm
                        </p>
                      </td>
                    ) : (
                      <td className="py-2 px-3">
                        <p className="font-[600]">
                          {row?.B2BPackageDetails?.applicableWeight} Kg
                        </p>

                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="md:hidden mt-2">
        {loading ? (
          <ThreeDotLoader />
        ) : transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((row, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow border border-gray-200 p-3 text-[11px]"
              >
                <table className="w-full text-[10px] text-gray-500">
                  <tbody>
                    <tr>
                      <td className="font-semibold text-left w-1/3">Date</td>
                      <td className="text-center w-4">:</td>
                      <td className="text-right w-2/3">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">Order ID</td>
                      <td className="text-center">:</td>
                      <td className="text-right">
                        <Link
                          to={`/dashboard/order/neworder/updateOrder/${Number(row.orderId)}`}
                          className="text-[#0CBB7D] font-medium"
                        >
                          {row.orderId}
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">AWB Number</td>
                      <td className="text-center">:</td>
                      <td className="text-right text-green-600 cursor-pointer" onClick={() => handleTrackingByAwb(row.awb_number)}>
                        {row.awb_number || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">Courier</td>
                      <td className="text-center">:</td>
                      <td className="text-right">{row.courierServiceName}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left">Shipment Status</td>
                      <td className="text-center">:</td>
                      <td className="text-right">{row.status}</td>
                    </tr>
                    {
                      row.orderType === "B2C" ? (
                        <tr>
                          <td className="font-semibold text-left">AWB Wt</td>
                          <td className="text-center">:</td>
                          <td className="text-right">{Number(row.packageDetails.deadWeight)?.toFixed(3)} Kg</td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="font-semibold text-left">AWB Wt</td>
                          <td className="text-center">:</td>
                          <td className="text-right">{Number(row.B2BPackageDetails.volumetricWeight)?.toFixed(3)} Kg</td>
                        </tr>
                      )
                    }
                    <tr>
                      <td className="font-semibold text-left">Freight</td>
                      <td className="text-center">:</td>
                      <td className="text-right">₹{row.totalFreightCharges || 0}</td>
                    </tr>
                    {
                      row.orderType === "B2C" ? (
                        <tr>
                          <td className="font-semibold text-left">Entered Wt</td>
                          <td className="text-center">:</td>
                          <td className="text-right">{row.packageDetails.applicableWeight} Kg</td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="font-semibold text-left">Entered Wt</td>
                          <td className="text-center">:</td>
                          <td className="text-right">{row.B2BPackageDetails.applicableWeight} Kg</td>
                        </tr>
                      )
                    }
                    {row.orderType === "B2C" && (
                      <tr>
                        <td className="font-semibold text-left">Dimensions</td>
                        <td className="text-center">:</td>
                        <td className="text-right">
                          {row.packageDetails.volumetricWeight.length}×
                          {row.packageDetails.volumetricWeight.width}×
                          {row.packageDetails.volumetricWeight.height} cm
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* User Details Section */}
                <div className="p-2 bg-green-50 rounded-lg flex justify-between items-center text-[10px]">
                  <div className="space-y-1 text-gray-700">
                    <p className="font-[600]">{row.user.name}</p>
                    <p>{row.user.phoneNumber}</p>
                    <p className="text-[#0CBB7D]">{row.user.email}</p>
                  </div>
                  <div
                    className={`font-[600] px-2 py-1 bg-green-100 text-green-600 rounded-lg text-[10px]"
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
        <div className="text-[12px] text-gray-600">
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
    </div >
  );
};

export default Shippings;
