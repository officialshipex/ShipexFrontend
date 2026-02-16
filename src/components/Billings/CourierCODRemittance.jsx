import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUpload } from "react-icons/fa";
import CourierCodPoopup from "./CourierCodPoopup";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import {
  FiCheckCircle,
  FiCreditCard,
  FiClock,
  FiArrowRight,
  FiArrowLeft,
} from "react-icons/fi";
import dayjs from "dayjs";
import { DateRange } from "react-date-range";
import { ChevronDown } from "lucide-react";
import ThreeDotLoader from "../../Loader"
import Cookies from "js-cookie";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const CourierCODRemittance = ({ isSidebarAdmin }) => {
  const [page, setPage] = useState(1); // Track current page
  const [limit, setLimit] = useState(20); // You can make this dynamic if needed

  const [totalPages, setTotalPages] = useState(1);
  const [totalremitted, setTotalRemitted] = useState(0);
  const [pendingremitted, setPendingRemitted] = useState(0);
  const [paidremitted, setPaidRemitted] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const [remited, setremited] = useState({});
  const [remitedData, setremitedData] = useState([]);
  const [upload, setUpload] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [orderIdAwbNumberFilter, setOrderIdAwbNumberFilter] = useState("");
  const [employeeAccess, setEmployeeAccess] = useState({
    isAdmin: false,
    canView: false,
    canAction: false,
  });
  const [loading, setLoading] = useState(true);
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [courierFilter, setCourierFilter] = useState(""); // NEW: Courier filter
  const [courierOptions, setCourierOptions] = useState([]); // NEW: Courier options
  const navigate = useNavigate();
  const [tempDateRange, setTempDateRange] = useState([
    { startDate: null, endDate: null, key: "selection" },
  ]);
  const dateRef = useRef(null);
  const calendarRef = useRef(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [dateRange, setDateRange] = useState([
    { startDate: null, endDate: null, key: "selection" },
  ]);
  const [courierDropdownOpen, setCourierDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const courierRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideDate =
        dateRef.current && !dateRef.current.contains(event.target);
      const clickedOutsideCalendar =
        !calendarRef.current || !calendarRef.current.contains(event.target);

      if (clickedOutsideDate && clickedOutsideCalendar) {
        setShowDropdown(false);
        setShowCustom(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateOptionClick = (option) => {
    if (option.custom) {
      setTempDateRange([...dateRange]);
      setShowDropdown(false);

      requestAnimationFrame(() => {
        setShowCustom(true);
      });
    } else {
      const range = option.range();
      setDateRange([
        {
          startDate: new Date(range.startDate),
          endDate: new Date(range.endDate),
          key: "selection",
        },
      ]);
      setShowDropdown(false);
      setShowCustom(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (courierRef.current && !courierRef.current.contains(e.target)) {
        setCourierDropdownOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Option 1: Extract unique couriers from remitted data
    if (remitedData.length > 0) {
      const couriers = Array.from(
        new Set(remitedData.map((row) => row.courierServiceName).filter(Boolean))
      );
      setCourierOptions(couriers);
    }

  }, [remitedData]);


  useEffect(() => {
    const fetchAccessAndData = async () => {
      setLoading(true);
      try {
        if (isSidebarAdmin) {
          setEmployeeAccess({ isAdmin: true, canView: true, canAction: true });
          setShowEmployeeAuthModal(false);
        } else {
          const token = Cookies.get("session");
          if (!token) {
            setShowEmployeeAuthModal(true);
            return;
          }
          const empRes = await axios.get(
            `${REACT_APP_BACKEND_URL}/staffRole/verify`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const employee = empRes.data.employee;
          // const isAdmin = !!employee?.isAdmin;
          const canView =
            !!employee?.accessRights?.finance?.["Courier COD Remittance"]?.view;
          const canAction =
            !!employee?.accessRights?.finance?.["Courier COD Remittance"]
              ?.action;
          setEmployeeAccess({ canView, canAction });
          if (!canView) {
            setShowEmployeeAuthModal(true);
            return;
          }
          setShowEmployeeAuthModal(false);
        }

        // Fetch remittance data only if access is allowed
        const token = Cookies.get("session");
        if (!token) {
          setShowEmployeeAuthModal(true);
          return;
        }
        let url = `${REACT_APP_BACKEND_URL}/cod/courierCodRemittance?page=${page}`;
        if (limit) url += `&limit=${limit}`;
        if (searchFilter) url += `&searchFilter=${searchFilter}`;
        if (orderIdAwbNumberFilter)
          url += `&orderIdAwbNumberFilter=${orderIdAwbNumberFilter}`;
        if (courierFilter) url += `&courierProvider=${encodeURIComponent(courierFilter)}`;
        if (statusFilter) url += `&statusFilter=${statusFilter}`;
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response.data);
        if (response.data.success) {
          setremitedData(response.data.data.orders);
          setTotalRemitted(response.data.data.totalCODAmount);
          setPendingRemitted(response.data.data.pendingCODAmount);
          setPaidRemitted(response.data.data.paidCODAmount);
          setTotalPages(response.data.totalPages);
        }
      } catch (error) {
        setShowEmployeeAuthModal(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAccessAndData();
  }, [
    isSidebarAdmin,
    refresh,
    page,
    limit,
    searchFilter,
    orderIdAwbNumberFilter,
    statusFilter,
    courierFilter,
  ]);
  const RemittanceDetails = (id) => {
    navigate(`/dashboard/billing/RemittanceDetails/${id}`);
  };
  // Function to format date with day name

  const CourierhandleCodRemittanceUpload = async () => {
    setUpload(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date"; // Handle empty or undefined input

    // Try parsing the date
    let date = new Date(dateString);

    // If it's still invalid, try parsing it manually
    if (isNaN(date.getTime())) {
      // If the date format is "DD-MM-YYYY" or other formats, try manual conversion
      const parts = dateString.split(/[-/]/);
      if (parts.length === 3) {
        // Assume the format is "DD-MM-YYYY"
        const [day, month, year] = parts.map(Number);
        date = new Date(year, month - 1, day); // Months are 0-based in JS
      }
    }

    // Check again if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const cardData = [
    {
      label: "Total COD Amount",
      value: `₹${(totalremitted || 0).toFixed(2)}`,
      icon: <FiCreditCard className="text-white" size={20} />,
    },
    {
      label: "Paid COD Amount",
      value: `₹${(paidremitted || 0).toFixed(2)}`,
      icon: <FiCheckCircle className="text-white" size={20} />,
    },
    {
      label: "Pending COD Amount",
      value: `₹${(pendingremitted || 0).toFixed(2)}`,
      icon: <FiClock className="text-white" size={20} />,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* {!isSidebarAdmin && showEmployeeAuthModal && (
        <EmployeeAuthModal
          employeeModalShow={showEmployeeAuthModal}
          employeeModalClose={() => {
            setShowEmployeeAuthModal(false);
            window.history.back();
          }}
        />
      )} */}
      {(isSidebarAdmin || employeeAccess.canView) && (
        <>
          {/* ✅ Mobile View: One box, 3 rows */}
          <div className="block sm:hidden my-2">
            <div className="bg-white rounded-lg border-2 border-[#0CBB7D] p-4 shadow-md space-y-2">
              {cardData.map((card, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-500 font-[600]">{card.label}</span>
                  <span className="text-[12px] font-[600] text-gray-700">{card.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ✅ Desktop View: Grid with icon cards */}
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 my-2">
            {cardData.map((card, index) => (
              <div
                key={index}
                className="flex items-center justify-start text-start gap-4 p-2 bg-white rounded-lg border-2 border-[#0CBB7D] hover:shadow-sm transition-shadow duration-300"
              >
                <div className="bg-[#0CBB7D] text-white p-2 rounded-full">{card.icon}</div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-[600] text-gray-700">
                    {card.value}
                  </span>
                  <span className="text-[14px] text-gray-500">
                    {card.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* filter */}
          <div className="space-y-2">
            {/* ✅ Desktop View */}
            <div className="hidden md:flex justify-between">
              <div>
                <div className="flex gap-2 flex-wrap">
                  {/* Search by User Name */}
                  <input
                    type="text"
                    placeholder="Search by Name, Phone, or Email"
                    className="w-full md:w-[250px] border-gray-300 h-9 px-3 text-[12px] font-[600] border-2 rounded-lg focus:outline-none placeholder:text-[12px]"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />

                  {/* Search by Remittance ID */}
                  <input
                    type="text"
                    placeholder="Search by Order ID or AWB"
                    className="w-full md:w-[250px] h-9 px-3 border-gray-300 text-[12px] font-[600] border-2 rounded-lg focus:outline-none placeholder:text-[12px]"
                    value={orderIdAwbNumberFilter}
                    onChange={(e) => setOrderIdAwbNumberFilter(e.target.value)}
                  />

                  {/* Courier Filter */}
                  <div className="relative w-full sm:w-[150px]" ref={courierRef}>
                    <button
                      onClick={() => setCourierDropdownOpen((prev) => !prev)}
                      className="w-full text-gray-400 outline-none h-9 px-3 py-2 border-2 border-gray-300 rounded-lg text-left text-[12px] bg-white flex justify-between items-center font-[600]"
                    >
                      {courierFilter || "Couriers"}
                      <ChevronDown className={`w-4 h-4 transform transition ${courierDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {courierDropdownOpen && (
                      <ul className="absolute mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-lg z-50 text-[12px] font-[600] text-gray-600">
                        {courierOptions.map((courier) => (
                          <li
                            key={courier}
                            className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                            onClick={() => {
                              setCourierFilter(courier);
                              setCourierDropdownOpen(false);
                            }}
                          >
                            {courier}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="relative w-full sm:w-[150px]" ref={statusRef}>
                    <button
                      onClick={() => setStatusDropdownOpen((prev) => !prev)}
                      className="w-full text-gray-400 outline-none h-9 px-3 py-2 border-2 border-gray-300 rounded-lg text-left text-[12px] bg-white flex justify-between items-center font-[600]"
                    >
                      {statusFilter || "Status"}
                      <ChevronDown className={`w-4 h-4 transform transition ${statusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {statusDropdownOpen && (
                      <ul className="absolute mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-lg z-50 text-[12px] font-[600] text-gray-600">
                        <li
                          className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                          onClick={() => {
                            setStatusFilter("Paid");
                            setStatusDropdownOpen(false);
                          }}
                        >
                          Paid
                        </li>
                        <li
                          className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                          onClick={() => {
                            setStatusFilter("Pending");
                            setStatusDropdownOpen(false);
                          }}
                        >
                          Pending
                        </li>
                      </ul>
                    )}
                  </div>

                </div>
              </div>

              <div className="flex gap-2">
                {/* Clear Button */}
                <button
                  className="h-9 px-3 items-center text-[12px] border-2 rounded-lg font-[600] text-white border-gray-100 bg-[#0CBB7D] hover:bg-green-500 transition whitespace-nowrap"
                  onClick={() => {
                    setSearchFilter("");
                    setOrderIdAwbNumberFilter("");
                    setStatusFilter("");
                    setCourierFilter("");

                  }}
                >
                  Clear
                </button>

                {/* Upload Button */}
                <div
                  onClick={() => {
                    if (
                      isSidebarAdmin ||
                      employeeAccess.isAdmin ||
                      employeeAccess.canAction
                    ) {
                      CourierhandleCodRemittanceUpload();
                    } else {
                      setShowEmployeeAuthModal(true);
                    }
                  }}
                >
                  <label
                    className={`cursor-pointer flex items-center gap-2 text-[12px] font-[600] px-3 h-9 rounded-lg border-2 transition
              ${isSidebarAdmin ||
                        employeeAccess.isAdmin ||
                        employeeAccess.canAction
                        ? "bg-[#0CBB7D] text-white border-gray-100 hover:bg-green-500"
                        : "text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed"
                      }`}
                  >
                    <FaUpload className="text-white" />
                    <span>Upload</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ✅ Mobile View */}
            <div className="flex flex-col md:hidden gap-2">
              {/* Row 1 */}
              <div className="flex justify-between gap-2">
                <input
                  type="text"
                  placeholder="Search by Name, Phone, or Email"
                  className="w-full h-9 px-3 text-gray-700 placeholder:text-gray-400 text-[12px] font-[600] border-gray-300 border-2 rounded-lg focus:outline-none placeholder:text-[12px]"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (
                      isSidebarAdmin ||
                      employeeAccess.isAdmin ||
                      employeeAccess.canAction
                    ) {
                      CourierhandleCodRemittanceUpload();
                    } else {
                      setShowEmployeeAuthModal(true);
                    }
                  }}
                  className={`flex items-center justify-center border-2 border-gray-100 px-3 h-9 rounded-lg transition
          ${isSidebarAdmin || employeeAccess.isAdmin || employeeAccess.canAction
                      ? "bg-[#0CBB7D] text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  <FaUpload size={14} />
                </button>
              </div>

              {/* Row 2 */}
              <div className="flex justify-between gap-2">
                <input
                  type="text"
                  placeholder="Search by Order ID or AWB"
                  className="w-full h-9 px-3 text-[12px] text-gray-700 placeholder:text-gray-400 font-[600] border-2 border-gray-300 rounded-lg focus:outline-none placeholder:text-[12px]"
                  value={orderIdAwbNumberFilter}
                  onChange={(e) => setOrderIdAwbNumberFilter(e.target.value)}
                />
                <div className="relative w-full sm:w-[150px]" ref={statusRef}>
                  <button
                    onClick={() => setStatusDropdownOpen((prev) => !prev)}
                    className="w-full text-gray-400 outline-none h-9 px-3 py-2 border-2 border-gray-300 rounded-lg text-left text-[12px] bg-white flex justify-between items-center font-[600]"
                  >
                    {statusFilter || "Status"}
                    <ChevronDown className={`w-4 h-4 transform transition ${statusDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {statusDropdownOpen && (
                    <ul className="absolute mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-lg z-50 text-[12px] font-[600] text-gray-600">
                      <li
                        className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                        onClick={() => {
                          setStatusFilter("Paid");
                          setStatusDropdownOpen(false);
                        }}
                      >
                        Paid
                      </li>
                      <li
                        className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                        onClick={() => {
                          setStatusFilter("Pending");
                          setStatusDropdownOpen(false);
                        }}
                      >
                        Pending
                      </li>
                    </ul>
                  )}
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex justify-between gap-2">
                <div className="relative w-full sm:w-[150px]" ref={courierRef}>
                  <button
                    onClick={() => setCourierDropdownOpen((prev) => !prev)}
                    className="w-full text-gray-400 outline-none h-9 px-3 py-2 border-2 border-gray-300 rounded-lg text-left text-[12px] bg-white flex justify-between items-center font-[600]"
                  >
                    {courierFilter || "Couriers"}
                    <ChevronDown className={`w-4 h-4 transform transition ${courierDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {courierDropdownOpen && (
                    <ul className="absolute mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-lg z-50 text-[12px] font-[600] text-gray-600">
                      {courierOptions.map((courier) => (
                        <li
                          key={courier}
                          className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                          onClick={() => {
                            setCourierFilter(courier);
                            setCourierDropdownOpen(false);
                          }}
                        >
                          {courier}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  className="h-9 px-3 text-[10px] sm:text-[12px] border-2 rounded-lg font-[600] text-white border-gray-100 bg-[#0CBB7D] hover:bg-green-500 transition"
                  onClick={() => {
                    setSearchFilter("");
                    setOrderIdAwbNumberFilter("");
                    setStatusFilter("");
                    setCourierFilter("");
                    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>


          {/* Table Header */}
          <div className="hidden md:block mt-2 relative">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg">
              {/* Table Head */}
              <thead>
                <tr className="text-white bg-[#0CBB7D] border border-[#0CBB7D] text-[12px] font-600">
                  <th className="py-2 px-3 text-left">User Details</th>
                  <th className="py-2 px-3 text-left">Order ID</th>
                  <th className="py-2 px-3 text-left">Shipping Details</th>
                  <th className="py-2 px-3 text-left">COD Amount</th>
                  <th className="py-2 px-3 text-left">COD Status</th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <ThreeDotLoader />
                    </td>
                  </tr>
                ) : remitedData.length > 0 ? (
                  remitedData.map((row, index) => (
                    <tr
                      key={index}
                      className="border-t hover:bg-gray-50 border-gray-300 text-gray-500 transition-all text-[12px] font-[400] relative"
                    >
                      <td className="py-2 px-3 whitespace-normal">
                        <p className="font-[600]">{row.userName}</p>
                        <p className="text-gray-600">{row.PhoneNumber}</p>
                        <p className="text-[#0CBB7D]">
                          {row.Email}
                        </p>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="  hover:underline cursor-pointer">
                          {/* {row.orderID} */}
                          <Link
                            to={`/dashboard/order/neworder/updateOrder/${row.orderID}`}
                            className="text-[#0CBB7D] font-medium block"
                          >
                            {row.orderID}
                          </Link>
                        </div>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <p className="text-[#0CBB7D] hover:underline cursor-pointer">
                          {row.AwbNumber}
                        </p>
                        <p className="font-semibold">
                          {row.courierServiceName}
                        </p>
                        <p className="text-gray-600">
                          Delivered On:{formatDate(row.date)}
                        </p>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <div>{`₹${(Number(row.CODAmount) || 0).toFixed(
                          2
                        )}`}</div>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div
                          className={` font-semibold ${row.status === "Paid"
                            ? "text-green-600"
                            : "text-orange-400"
                            }`}
                        >
                          {row.status}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <p className="text-gray-500">No orders found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-2 mt-2">
            {remitedData.map((row, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg p-3">
                <table className="w-full text-[10px] text-gray-500">
                  <tbody>
                    {[
                      { label: "Date", value: formatDate(row.date) },
                      { label: "Order ID", value: row.orderID },
                      {
                        label: "AWB Number",
                        value: `${row.AwbNumber}`,
                        className: "text-green-600 font-semibold", // 👈 Added custom class
                      },
                      {
                        label: "COD Amount",
                        value: `₹${(Number(row.CODAmount) || 0).toFixed(2)}`,
                      },
                    ].map((item, i) => (
                      <tr key={i}>
                        <td className="font-[600] text-gray-700 px-2 py-1 text-left w-1/3">{item.label}</td>
                        <td className="text-center w-4 text-gray-700">:</td>
                        <td className={`px-2 py-1 text-right w-2/3 ${item.className || ""}`}>{item.value}</td>
                      </tr>
                    ))}

                  </tbody>
                </table>

                {/* User Details section at bottom */}
                <div className="mt-2 p-2 text-[12px] bg-green-50 rounded-lg flex justify-between items-center">
                  {/* <p className="text-sm font-semibold text-gray-700 text-center mb-1">User Details</p> */}
                  <div className="text-[10px] text-gray-700 space-y-1">
                    <p className="font-[600]">{row.userName}</p>
                    <p className="text-gray-500">{row.PhoneNumber}</p>
                    <p className="text-[#0CBB7D] hover:underline">{row.Email}</p>
                  </div>
                  <div
                    className={
                      row.status === "Paid"
                        ? "text-green-600 font-semibold"
                        : "text-orange-400 font-semibold"
                    }
                  >
                    {row.status}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 gap-4 flex-wrap text-[10px] font-[600]">
            <div className="flex items-center gap-2">
              <label
                htmlFor="limit"
                className="text-gray-700 text-[10px] font-[600]"
              >
                Show:
              </label>
              <select
                id="limit"
                value={limit}
                onChange={(e) => {
                  const selected = e.target.value;
                  if (selected === "All") {
                    setLimit(null); // null means no limit
                    setPage(1);
                  } else {
                    setLimit(parseInt(selected));
                    setPage(1); // reset to first page when changing limit
                  }
                }}
                className="px-3 py-2 border rounded-md text-[10px] font-[600]"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value={100}>100</option>
                <option value="All">All</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="py-2 px-3 bg-gray-300 rounded disabled:opacity-50"
              >
                <FiArrowLeft />
              </button>
              <span className="text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
                className="py-2 px-3 bg-gray-300 rounded disabled:opacity-50"
              >
                <FiArrowRight />
              </button>
            </div>
          </div>
          {upload && (
            <CourierCodPoopup
              onClose={() => setUpload(false)}
              setRefresh={setRefresh}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CourierCODRemittance;
