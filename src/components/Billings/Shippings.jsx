import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link, useParams } from "react-router-dom";
// import { toast } from "react-toastify";
import { PDFDocument } from "pdf-lib";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { HiDotsHorizontal } from "react-icons/hi";
import { FaFilter, FaBars } from "react-icons/fa";
import { FaTruck, FaPlane } from "react-icons/fa";
import { FiMoreHorizontal, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { ChevronDown } from "lucide-react";
import ThreeDotLoader from "../../Loader";
import Cookies from "js-cookie";
import { Notification } from "../../Notification"
import PaginationFooter from "../../Common/PaginationFooter";
import OrderAwbFilter from "../../filter/OrderAwbFilter";
import { ExportExcel } from "../../Common/orderActions";
import CourierFilter from "../../filter/CourierFilter";
import NotFound from "../../assets/nodatafound.png";

const Shippings = (filterOrder) => {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]); // Track selected orders
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false); // New dropdown state
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [refresh, setRefresh] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Loading state
  const dropdownRefs = useRef([]);
  const { id } = useParams();
  const toggleButtonRefs = useRef([]);
  const [showCourierDropdown, setShowCourierDropdown] = useState(false);
  const courierFilterRef = useRef(null);
  const courierFilterButtonRef = useRef(null);
  const actionDropdownRef = useRef(null);
  const [page, setPage] = useState(1); // Track current page
  const [limit, setLimit] = useState(20); // You can make this dynamic if needed
  const [totalPages, setTotalPages] = useState(1);

  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  const desktopActionRef = useRef(null);
  const mobileActionRef = useRef(null);

  const [courierOptions, setCourierOptions] = useState([]); // All unique couriers
  const [selectedCourier, setSelectedCourier] = useState(""); // Selected courier
  const [paymentType, setPaymentType] = useState("");
  const [dateRange, setDateRange] = useState([
    { startDate: null, endDate: null, key: "selection" },
  ]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [pickupAddresses, setPickupAddresses] = useState([]); // Store pickup addresses
  const [selectedPickupAddress, setSelectedPickupAddress] = useState(""); // Track selected pickup address
  const [showPickupDropdown, setShowPickupDropdown] = useState(false); // Toggle dropdown visibility
  const [showPaymentTypeDropdown, setShowPaymentTypeDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const paymentRef = useRef(null);
  const dateRef = useRef(null);
  const pickupRef = useRef(null);
  const calendarRef = useRef(null);
  const paymentButtonRef = useRef(null);
  const pickupButtonRef = useRef(null);
  const dateButtonRef = useRef(null);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showStatusDropdownMobile, setShowStatusDropdownMobile] =
    useState(false);
  const statusDropdownRef = useRef(null);
  const statusDropdownButtonRef = useRef(null);
  const statusDropdownRefMobile = useRef(null);
  const statusDropdownButtonRefMobile = useRef(null);
  const [searchBy, setSearchBy] = useState("awbNumber");
  const [inputValue, setInputValue] = useState("");
  const [showAwbDropdown, setShowAwbDropdown] = useState(false);

  const awbFilterRef = useRef(null);
  const awbFilterButtonRef = useRef(null);


  const statusOptions = [
    "new",
    "Ready To Ship",
    "In-transit",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
    "Lost",
    "Damaged",
    "RTO",
    "RTO In-transit",
    "RTO Delivered",
    "RTO Lost",
    "RTO Damaged",
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Payment dropdown outside click
      if (
        paymentRef.current &&
        !paymentRef.current.contains(event.target) &&
        paymentButtonRef.current &&
        !paymentButtonRef.current.contains(event.target)
      ) {
        setShowPaymentTypeDropdown(false);
      }

      // Pickup dropdown outside click
      if (
        pickupRef.current &&
        !pickupRef.current.contains(event.target) &&
        pickupButtonRef.current &&
        !pickupButtonRef.current.contains(event.target)
      ) {
        setShowPickupDropdown(false);
      }

      //this is for status
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target) &&
        statusDropdownButtonRef.current &&
        !statusDropdownButtonRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
      if (
        statusDropdownRefMobile.current &&
        !statusDropdownRefMobile.current.contains(event.target) &&
        statusDropdownButtonRefMobile.current &&
        !statusDropdownButtonRefMobile.current.contains(event.target)
      ) {
        setShowStatusDropdownMobile(false);
      }
      // Date dropdown and calendar outside click logic
      const insideDateButton = dateButtonRef.current?.contains(event.target);
      const insideDateDropdown = dateRef.current?.contains(event.target);
      const insideCalendar = calendarRef.current?.contains(event.target);

      if (showCustom) {
        if (!insideDateDropdown && !insideCalendar && !insideDateButton) {
          setShowDropdown(false);
          setShowCustom(false);
        }
      } else if (showDropdown) {
        if (!insideDateDropdown && !insideDateButton) {
          setShowDropdown(false);
        }
      }
      // Action dropdown (desktop)
      if (
        desktopActionRef.current &&
        !desktopActionRef.current.contains(event.target)
      ) {
        setDesktopDropdownOpen(false);
      }

      // Action dropdown (mobile)
      if (
        mobileActionRef.current &&
        !mobileActionRef.current.contains(event.target)
      ) {
        setMobileDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [
    showDropdown,
    showCustom,
    showPaymentTypeDropdown,
    showPickupDropdown,
    desktopDropdownOpen,
    mobileDropdownOpen,
  ]);

  const toggleDropdown = (index) => {
    setTimeout(() => {
      setDropdownOpen((prev) => (prev === index ? null : index));
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideAnyDropdown = dropdownRefs.current.some(
        (ref) => ref && ref.contains(event.target)
      );
      const clickedAnyToggleButton = toggleButtonRefs.current.some(
        (ref) => ref && ref.contains(event.target)
      );

      if (!clickedInsideAnyDropdown && !clickedAnyToggleButton) {
        setDropdownOpen(null);
      }
    };

    // ✅ Use 'click' instead of 'mousedown'
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target)
      ) {
        setActionDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("session");

      const params = {
        id,
        page,
        limit,
        status: selectedStatus !== "All" ? selectedStatus : undefined,
        searchQuery,
        paymentType,
        startDate: dateRange[0].startDate?.toISOString(),
        endDate: dateRange[0].endDate?.toISOString(),
        pickupContactName: selectedPickupAddress || undefined,
      };
      if (inputValue?.trim()) {
        params[searchBy] = inputValue.trim();
      }

      if (selectedCourier) {
        params.courierServiceName = selectedCourier;
      }

      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/order/shippingOrders`,
        {
          params,
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("shipping data", response.data);

      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
      if (response.data.pickupLocations) {
        setPickupAddresses(response.data.pickupLocations);
      }

      // Extract unique courierServiceName from all orders
      setCourierOptions(response.data.courierServices || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [
    page,
    limit,
    inputValue,
    searchBy,
    searchQuery,
    paymentType,
    dateRange,
    selectedPickupAddress,
    selectedCourier,
    selectedStatus,
  ]);

  // Handle "Select All" checkbox
  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]); // Unselect all
    } else {
      setSelectedOrders(orders.map((order) => order._id)); // Select all
    }
    // console.log(selectedOrders)
  };

  // Handle individual row selection
  const handleCheckboxChange = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };
  const filteredOrders = orders.filter(
    (order) =>
      // order.status === "Delivered" &&
      order.orderId
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      order.awb_number
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const handleExportExcel = () => {
    ExportExcel({ selectedOrders, orders })
  };

  // tracking
  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  const handleClearFilters = () => {
    setInputValue("");
    setSearchBy("awbNumber");
    setShowAwbDropdown(false);
    setSelectedCourier("");
    setShowCourierDropdown(false);
    setSelectedStatus("");
    setShowStatusDropdown(false);
    setShowStatusDropdownMobile(false);
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
  };


  return (
    <div>
      {/* Desktop Table */}
      <div>
        <div className="flex flex-row justify-between items-center gap-3 rounded-lg overflow-visible">
          <div className="hidden md:flex items-center gap-2 w-full sm:mb-2">
            {/* OrderID/AWB filter */}
            <OrderAwbFilter
              searchBy={searchBy}
              setSearchBy={setSearchBy}
              inputValue={inputValue}
              setInputValue={setInputValue}
              showDropdown={showAwbDropdown}
              setShowDropdown={setShowAwbDropdown}
              dropdownRef={awbFilterRef}
              buttonRef={awbFilterButtonRef}
              options={[
                { label: "AWB", value: "awbNumber" },
                { label: "Order ID", value: "orderId" },
              ]}
              getPlaceholder={() =>
                searchBy === "orderId"
                  ? "Search by Order ID"
                  : "Search by AWB Number"
              }
              width="w-full md:w-[300px]"
            />


            {/* CourierDropdown */}
            <CourierFilter
              selectedCourier={selectedCourier}
              setSelectedCourier={setSelectedCourier}
              courierOptions={courierOptions}
              showDropdown={showCourierDropdown}
              setShowDropdown={setShowCourierDropdown}
              dropdownRef={courierFilterRef}
              buttonRef={courierFilterButtonRef}
              width="w-full md:w-[250px]"
            />


            {/* Status filter */}
            <div
              className="relative w-full md:w-[200px]"
              ref={statusDropdownRef}
            >
              <button
                className={`w-full bg-white py-2 px-3 text-[12px] font-[600] border rounded-lg focus:outline-none text-left flex items-center justify-between text-gray-400 ${showStatusDropdown || selectedStatus ? "border-[#0CBB7D]" : ""}`}
                onClick={() => setShowStatusDropdown((prev) => !prev)}
                ref={statusDropdownButtonRef}
              >
                {selectedStatus || "Status"}
                <ChevronDown
                  className={`w-4 h-4 ml-2 transform transition-transform ${showStatusDropdown ? "rotate-180" : ""
                    }`}
                />
              </button>
              {showStatusDropdown && (
                <div className="absolute w-full mt-1 z-40 bg-white border rounded-lg shadow p-1 max-h-60 overflow-y-auto transition-all duration-300 ease-in-out">
                  {statusOptions.map((status) => (
                    <div
                      key={status}
                      className="cursor-pointer hover:bg-green-100 px-3 py-2 text-[12px] font-[600] text-gray-500"
                      onClick={() => {
                        setSelectedStatus(status);
                        setShowStatusDropdown(false);
                        setPage(1);
                      }}
                    >
                      {status}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --- Actions at the end of the row --- */}
            <div className="flex items-center gap-2 ml-auto" ref={desktopActionRef}>
              <button
                className="py-2 px-3 text-[12px] border rounded-lg font-[600] text-white bg-[#0CBB7D] hover:bg-green-500 transition whitespace-nowrap"
                onClick={handleClearFilters}
                type="button"
              >
                Clear
              </button>
              <div className="relative">
                <button
                  className={`py-2 px-3 text-[12px] border rounded-lg font-[600] flex items-center gap-1 justify-center whitespace-nowrap ${selectedOrders.length === 0
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "text-[#0CBB7D] border-[#0CBB7D]"
                    }`}
                  onClick={() =>
                    selectedOrders.length > 0 &&
                    setDesktopDropdownOpen(!desktopDropdownOpen)
                  }
                  disabled={selectedOrders.length === 0}
                >
                  <span>Actions</span> <span><ChevronDown
                    className={`w-4 h-4 transition-transform ${desktopDropdownOpen ? "rotate-180" : ""
                      }`}
                  /></span>
                </button>
                <div
                  className={`absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] overflow-hidden transition-all duration-300 ease-in-out ${desktopDropdownOpen
                    ? "max-h-96 opacity-100 scale-100"
                    : "max-h-0 opacity-0 scale-95 pointer-events-none"
                    }`}
                >
                  <ul className="py-2 font-[600]">
                    <li
                      className="px-3 py-2 text-gray-700 hover:bg-green-100 cursor-pointer text-[10px]"
                      onClick={handleExportExcel}
                    >
                      Export
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {/* New Dropdown */}
          <div className="flex gap-2 w-full flex-col md:hidden">
            {/* 1. Top input: Order ID search */}
            <div className="flex items-center justify-between gap-2 relative">
              {/* Combined AWB / Order ID filter (Mobile) */}
              <OrderAwbFilter
                searchBy={searchBy}
                setSearchBy={setSearchBy}
                inputValue={inputValue}
                setInputValue={setInputValue}
                showDropdown={showAwbDropdown}
                setShowDropdown={setShowAwbDropdown}
                dropdownRef={awbFilterRef}
                buttonRef={awbFilterButtonRef}
                options={[
                  { label: "AWB", value: "awbNumber" },
                  { label: "Order ID", value: "orderId" },
                ]}
                getPlaceholder={() =>
                  searchBy === "orderId"
                    ? "Search by Order ID"
                    : "Search by AWB Number"
                }
                heightClass="h-9"
              />

              {/* FaFilter Button */}
              <button
                className="px-3 flex-1 flex items-center justify-center text-white bg-[#0CBB7D] h-[34px] rounded-lg transition text-[12px] font-[600]"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                <FaFilter className="text-white size={14}" />
              </button>
              <div ref={actionDropdownRef}>
                <button
                  className={`px-3 h-[34px] border rounded-lg font-[600] flex items-center gap-1 ${selectedOrders.length === 0
                    ? "border-gray-300 text-[12px] cursor-not-allowed text-gray-400"
                    : "text-[#0CBB7D] border-[#0CBB7D] text-[12px]"
                    }`}
                  onClick={() =>
                    selectedOrders.length > 0 &&
                    setActionDropdownOpen(!actionDropdownOpen)
                  }
                  disabled={selectedOrders.length === 0}
                >
                  <FaBars
                    className={`sm:hidden 
                    ${selectedOrders.length === 0
                        ? "text-gray-400"
                        : "text-[#0CBB7D]"
                      }`}
                  />
                  <span className="hidden sm:inline">Actions▼</span>
                </button>
                {actionDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                    <ul className="py-2 font-[600]">
                      <li
                        className="px-3 py-2 text-gray-700 hover:bg-green-100 cursor-pointer text-[10px]"
                        onClick={handleExportExcel}
                      >
                        Export
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            {/* 2. Expandable filters */}
            <div
              className={`transition-all duration-300 ease-in-out ${showFilters
                ? "max-h-[1000px] overflow-visible"
                : "max-h-0 overflow-hidden"
                }`}
            >
              <div className="flex flex-col gap-2 overflow-visible">
                {/* Courier Dropdown */}
                <CourierFilter
                  selectedCourier={selectedCourier}
                  setSelectedCourier={setSelectedCourier}
                  courierOptions={courierOptions}
                  showDropdown={showCourierDropdown}
                  setShowDropdown={setShowCourierDropdown}
                  dropdownRef={courierFilterRef}
                  buttonRef={courierFilterButtonRef}
                  heightClass="h-9"
                />


                {/* Status Dropdown */}
                <div
                  className="relative w-full z-[10]"
                  ref={statusDropdownRefMobile}
                >
                  <button
                    className={`w-full bg-white py-2 px-3 text-[12px] font-[600] border rounded-lg focus:outline-none text-left flex items-center justify-between text-gray-400 ${showStatusDropdown || selectedStatus ? "border-[#0CBB7D]" : ""}`}
                    onClick={() => setShowStatusDropdownMobile((prev) => !prev)}
                    ref={statusDropdownButtonRefMobile}
                  >
                    {selectedStatus || "Status"}
                    <ChevronDown
                      className={`w-4 h-4 ml-2 transform transition-transform ${showStatusDropdownMobile ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  {showStatusDropdownMobile && (
                    <div className="absolute w-full bg-white border rounded shadow p-1 z-10 max-h-60 overflow-y-auto transition-all duration-300 ease-in-out">
                      {statusOptions.map((status) => (
                        <div
                          key={status}
                          className="cursor-pointer hover:bg-green-50 px-3 py-2 text-[12px] font-[600] text-gray-500"
                          onClick={() => {
                            setSelectedStatus(status);
                            setShowStatusDropdownMobile(false);
                            setPage(1);
                          }}
                        >
                          {status}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="px-3 mb-2 bg-[#0CBB7D] py-2 text-[12px] font-[600] rounded-lg text-white border hover:opacity-90 transition"
                  onClick={handleClearFilters}
                  type="button"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:block relative">
        <div className="
      h-[calc(100vh-320px)]
      overflow-y-auto
      bg-white
    ">
          <table className="w-full border-collapse">
            {/* Table Head */}
            <thead className="sticky top-0 z-20 bg-[#0CBB7D]">
              <tr className="text-white bg-[#0CBB7D] text-[12px] font-[600]">
                <th className="py-2 px-3 text-left bg-[#0CBB7D] shadow-[0_1px_0_0_#0CBB7D]">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrders.length === orders.length && orders.length > 0
                    }
                    onChange={handleSelectAll}
                    className="cursor-pointer accent-[#0CBB7D] w-4"
                  />
                </th>
                <th className="py-2 px-3 text-left">Order</th>
                <th className="py-2 px-3 text-left">AWB</th>
                <th className="py-2 px-3 text-left">Courier</th>
                <th className="py-2 px-3 text-left">Status</th>
                <th className="py-2 px-3 text-left">Assigned Weight</th>
                <th className="py-2 px-3 text-left">Applied Charges</th>
                <th className="py-2 px-3 text-left">Excess Charges</th>
                <th className="py-2 px-3 text-left">Total Freight Charges</th>
                <th className="py-2 px-3 text-left">
                  Entered Weight & Dimension
                </th>
                <th className="py-2 px-3 text-left">
                  Charged Weight & Dimension
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-4">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 border-gray-300 border-b text-gray-500 transition-all text-[12px] font-[400] relative"
                  >
                    <td className="py-2 px-3 whitespace-nowrap align-middle">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleCheckboxChange(order._id)}
                        className="cursor-pointer accent-[#0CBB7D] w-4"
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <Link
                        to={`/dashboard/order/neworder/updateOrder/${order._id}`}
                        className="text-[#0CBB7D] font-medium block"
                      >
                        {order.orderId}
                      </Link>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <p>
                        <span
                          className="text-[#0CBB7D] cursor-pointer"
                          onClick={() => handleTrackingByAwb(order.awb_number)}
                        >
                          {order.awb_number ? `${order.awb_number}` : "_ _"}
                        </span>
                      </p>
                    </td>
                    <td>
                      <p className="py-2 px-3 whitespace-nowrap">
                        {order.courierServiceName
                          ? `${order.courierServiceName}`
                          : "_ _"}
                      </p>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-lg text-[10px] bg-green-100 text-green-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      {order?.orderType === "B2B" ? (
                        <p className="">
                          {order.B2BPackageDetails.applicableWeight} Kg
                        </p>
                      ) : (
                        <p className="">
                          {order.packageDetails.applicableWeight} Kg
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      <p className="">
                        {order.totalFreightCharges
                          ? `₹ ${order.totalFreightCharges}`
                          : "_ _"}
                      </p>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      <p>_ _</p>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      <p className="">
                        {order.totalFreightCharges
                          ? `₹ ${order.totalFreightCharges}`
                          : "_ _"}
                      </p>
                    </td>

                    {order?.orderType === "B2C" ? (
                      <td className="py-2 px-3 whitespace-nowrap text-center">
                        <p className="">
                          {Number(order.packageDetails.deadWeight)?.toFixed(3)} Kg
                        </p>
                        <p>
                          {order.packageDetails.volumetricWeight.length} x{" "}
                          {order.packageDetails.volumetricWeight.width} x{" "}
                          {order.packageDetails.volumetricWeight.height} cm
                        </p>
                      </td>
                    ) : (
                      <td className="py-2 px-3 whitespace-nowrap text-center">
                        _ _
                      </td>
                    )}
                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      _ _
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-4">
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src={NotFound}
                        alt="No Data Found"
                        className="w-60 h-60 object-contain mb-2"
                      />
                      {/* <p className="text-gray-500 text-sm">No orders found.</p> */}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View: Display Orders as Cards */}
      <div className="md:hidden w-full">
        {/* Select All */}
        <div className="px-2 py-1 bg-green-200 rounded-lg flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={selectedOrders.length === orders.length && orders.length > 0}
            onChange={handleSelectAll}
            className="accent-[#0CBB7D] w-3 h-3"
          />
          <span className="text-[10px] font-[600] text-gray-500">Select All</span>
        </div>

        {/* Orders List */}
        <div className="space-y-2 h-[calc(100vh-240px)] overflow-y-auto">
          {loading ? (
            <ThreeDotLoader />
          ) : orders.length > 0 ? (
            orders.map((order, index) => (


              <div
                key={index}
                className="bg-white shadow rounded-lg border border-gray-200 text-[10px] text-gray-500 overflow-hidden"
              >
                {/* Top: Order ID and Status */}
                <div className="flex justify-between items-center px-4 pt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleCheckboxChange(order._id)}
                      className="accent-[#0CBB7D] w-3 h-3"
                    />
                    <Link
                      to={`/dashboard/order/neworder/updateOrder/${order._id}`}
                      className="text-[#0CBB7D]"
                    >
                      {order.orderId}
                    </Link>
                  </div>
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-[2px] rounded-lg">
                    {order.status}
                  </span>
                </div>

                {/* Body: Details */}
                <div className="px-4 py-3 space-y-1">
                  {[
                    { label: "AWB", value: order.awb_number || "_ _", isLink: true },
                    { label: "Courier", value: order.courierServiceName || "_ _" },
                    {
                      label: "Assigned Weight",
                      value: order.orderType === "B2B"
                        ? `${Number(order.B2BPackageDetails?.applicableWeight)?.toFixed(3) || "_ _"} Kg`
                        : `${Number(order.packageDetails?.applicableWeight)?.toFixed(3) || "_ _"} Kg`,
                    },
                    ...(order.orderType === "B2C"
                      ? [
                        {
                          label: "Entered W&D",
                          value: `${Number(order.packageDetails?.deadWeight)?.toFixed(3) || "_ _"} Kg, ${order.packageDetails?.volumetricWeight?.length || "_ _"
                            } x ${order.packageDetails?.volumetricWeight?.width || "_ _"} x ${order.packageDetails?.volumetricWeight?.height || "_ _"
                            } cm`,
                        },
                      ]
                      : []),
                    {
                      label: "Applied Charges",
                      value: order.totalFreightCharges
                        ? `₹ ${order.totalFreightCharges}`
                        : "_ _",
                    },
                    { label: "Excess Charges", value: "_ _" },
                    {
                      label: "Total Freight",
                      value: order.totalFreightCharges
                        ? `₹ ${order.totalFreightCharges}`
                        : "_ _",
                    },
                    { label: "Charged W&D", value: "_ _" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[130px_10px_1fr] gap-1 text-gray-500"
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="text-center">:</span>
                      {item.isLink ? (
                        <span
                          className="text-[#0CBB7D] cursor-pointer text-right"
                          onClick={() => handleTrackingByAwb(order.awb_number)}
                        >
                          {item.value}
                        </span>
                      ) : (
                        <span className="text-right text-gray-700 break-words">
                          {item.value}
                        </span>
                      )}
                    </div>
                  ))}
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

      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        limit={limit}
        setLimit={setLimit}
      />

    </div>
  );
};

export default Shippings;
