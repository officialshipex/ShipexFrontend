import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { useNavigate, Link, useParams } from "react-router-dom";
// import { toast } from "react-toastify";
import { PDFDocument } from "pdf-lib";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { HiDotsHorizontal } from "react-icons/hi";
import { FaFilter, FaBars } from "react-icons/fa";
import { FaTruck, FaPlane } from "react-icons/fa";
import { FiCopy, FiCheck } from "react-icons/fi";
import { Filter, X, ChevronDown } from "lucide-react";
import ShippingFilterPanel from "../../Common/ShippingFilterPanel";
import DateFilter from "../../filter/DateFilter";
import { motion, AnimatePresence } from "framer-motion";
import ThreeDotLoader from "../../Loader";
import Cookies from "js-cookie";
import PaginationFooter from "../../Common/PaginationFooter";
import { ExportExcel } from "../../Common/orderActions";
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
  const [selectedCourier, setSelectedCourier] = useState([]); // Selected courier (array for multi-select)
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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [weightPopupId, setWeightPopupId] = useState(null);
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


  const [copiedOrderId, setCopiedOrderId] = useState(null);

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

  const isAnyFilterApplied =
    inputValue ||
    selectedCourier.length > 0 ||
    selectedStatus ||
    (dateRange[0].startDate !== null || dateRange[0].endDate !== null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 1500);
  };

  // Auto-close mobile filters panel on selection (except for multi-select courier)
  useEffect(() => {
    if (showFilters && (selectedStatus || dateRange[0].startDate)) {
      setShowFilters(false);
    }
  }, [selectedStatus, dateRange]);

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
        status: selectedStatus || undefined,
        searchQuery,
        paymentType: paymentType && paymentType !== "All" ? paymentType : undefined,
        fromDate: dateRange && dateRange[0]?.startDate ? dayjs(dateRange[0].startDate).startOf("day").toISOString() : undefined,
        toDate: dateRange && dateRange[0]?.endDate ? dayjs(dateRange[0].endDate).endOf("day").toISOString() : undefined,
        pickupContactName: selectedPickupAddress || undefined,
      };
      if (inputValue?.trim()) {
        params[searchBy] = inputValue.trim();
      }

      if (selectedCourier && selectedCourier.length > 0) {
        params.courierServiceName = selectedCourier.join(",");
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
    setSelectedCourier([]);
    setShowCourierDropdown(false);
    setSelectedStatus("");
    setPaymentType("");
    setSelectedPickupAddress("");
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
    setClearTrigger(prev => prev + 1);
    setIsFilterPanelOpen(false);
    setPage(1);
  };

  const handleFiltersToggle = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div>
      {/* Desktop Filter Section */}
      <div className="hidden md:flex gap-2 relative sm:items-center">
        <DateFilter
          onDateChange={(range) => {
            setDateRange(range);
            setPage(1);
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
              disabled={selectedOrders.length === 0}
              onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
              className={`h-9 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 border transition-all ${selectedOrders.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
            >
              Actions
              <ChevronDown className={`w-4 h-4 transition-transform ${desktopDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {desktopDropdownOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-40 text-[12px] z-[100] animate-popup-in overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                  onClick={handleExportExcel}
                >
                  Export
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
          <div className="flex justify-end mt-1 px-1">
            <button
              onClick={handleClearFilters}
              className="text-[11px] font-[600] text-red-500 hover:text-red-600 px-1"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
      <div className="hidden md:block relative">
        <div className="
      h-[calc(100vh-305px)]
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
                    className="cursor-pointer mt-1 accent-[#0CBB7D] w-4"
                  />
                </th>
                <th className="py-2 px-3 text-left">Order ID</th>
                <th className="py-2 px-3 text-left">AWB Number</th>
                <th className="py-2 px-3 text-left">Courier Service Name</th>
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
                        className="cursor-pointer mt-1 accent-[#0CBB7D] w-4"
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="relative flex items-center gap-1 group">
                        <Link
                          to={`/dashboard/order/neworder/updateOrder/${order._id}`}
                          className="text-[#0CBB7D] font-medium block hover:underline"
                        >
                          {order.orderId}
                        </Link>
                        <button
                          onClick={() => handleCopy(order.orderId, order._id + '_id')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-green-50 rounded"
                        >
                          {copiedOrderId === order._id + '_id' ? (
                            <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                          ) : (
                            <FiCopy className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="relative flex items-center gap-1 group max-w-fit">
                        <span
                          className="text-[#0CBB7D] cursor-pointer font-medium hover:underline"
                          onClick={() => handleTrackingByAwb(order.awb_number)}
                        >
                          {order.awb_number || "_ _"}
                        </span>
                        {order.awb_number && (
                          <button
                            onClick={() => handleCopy(order.awb_number, order._id + '_awb')}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-green-50 rounded"
                          >
                            {copiedOrderId === order._id + '_awb' ? (
                              <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                            ) : (
                              <FiCopy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <p className="py-2 px-3 whitespace-nowrap">
                        {order.courierServiceName
                          ? `${order.courierServiceName}`
                          : "_ _"}
                      </p>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="px-2 rounded py-0.5 text-[10px] bg-green-100 text-[#0CBB7D]">
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

      {/* Mobile View */}
      <div className="md:hidden flex flex-col">
        <div className="p-2 justify-between bg-white rounded-lg flex gap-2 items-center border border-gray-100 mb-2 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-100 flex-1">
            <input
              type="checkbox"
              checked={orders.length > 0 && selectedOrders.length === orders.length}
              onChange={handleSelectAll}
              className="cursor-pointer accent-[#0CBB7D] w-4"
            />
            <span className="text-[10px] font-[600] text-gray-700 tracking-wider">Select All</span>
          </div>

          <div className="relative" ref={mobileActionRef}>
            <button
              disabled={selectedOrders.length === 0}
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              className={`h-[30px] px-3 rounded-lg flex items-center justify-center border transition-all ${selectedOrders.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] bg-white shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
            >
              <FaBars className="w-3 h-3" />
            </button>
            {mobileDropdownOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-40 text-[11px] z-[100] animate-popup-in overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                  onClick={handleExportExcel}
                >
                  Export
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-[calc(100vh-275px)] overflow-y-auto space-y-2">

          {loading ? (
            <div className="flex justify-center py-10">
              <ThreeDotLoader />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center">
              <img src={NotFound} alt="No Data Found" className="w-60 h-60" />
            </div>
          ) : (
            orders.map((row) => (
              <div key={row._id} className="bg-white rounded-lg shadow-sm px-3 py-2 border border-gray-200 animate-popup-in relative">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(row._id)}
                      onChange={() => handleCheckboxChange(row._id)}
                      className="cursor-pointer accent-[#0CBB7D]"
                    />
                    <div className="flex flex-col">
                      <span className="text-[#0CBB7D] font-[600] text-[10px]">#{row.orderId}</span>
                      <span className="text-gray-500 text-[10px]">{dayjs(row.shipmentCreatedAt || row.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-[#0CBB7D]">
                      {row.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                  <div>
                    <p className="text-gray-400 mb-0.5">AWB Number</p>
                    <div className="flex items-center gap-1 group">
                      <p className="text-[#0CBB7D] font-bold active:underline" onClick={() => handleTrackingByAwb(row.awb_number)}>
                        {row.awb_number || "N/A"}
                      </p>
                      {row.awb_number && (
                        <button onClick={() => handleCopy(row.awb_number, row._id + '_awb_mob')}>
                          {copiedOrderId === row._id + '_awb_mob' ? <FiCheck className="text-green-500" /> : <FiCopy className="text-gray-300" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5 text-right">Freight Charges</p>
                    <p className="text-[#0CBB7D] font-bold text-right">₹{row.totalFreightCharges || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5">Courier Service Name</p>
                    <p className="text-gray-700 font-bold">{row.courierServiceName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-right">Weight</p>
                    <p
                      className="text-gray-700 font-bold text-right border-b border-dashed border-gray-400 inline-block float-right cursor-pointer"
                      onClick={() => setWeightPopupId(weightPopupId === row._id ? null : row._id)}
                    >
                      {row.orderType === "B2C" ? row.packageDetails?.applicableWeight : row.B2BPackageDetails?.applicableWeight} Kg
                    </p>
                  </div>
                </div>

                {/* Weight Popup for Mobile */}
                <AnimatePresence>
                  {weightPopupId === row._id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-black/40" onClick={() => setWeightPopupId(null)}></div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-lg shadow-xl p-4 w-full max-w-xs relative z-10"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-gray-700 uppercase text-[12px]">Weight Details</h3>
                          <X className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => setWeightPopupId(null)} />
                        </div>
                        <div className="space-y-2 text-[12px]">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Dead Weight</span>
                            <span className="font-bold">{row.orderType === "B2C" ? row.packageDetails?.deadWeight : row.B2BPackageDetails?.deadWeight || row.B2BPackageDetails?.applicableWeight} Kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Applicable Weight</span>
                            <span className="font-bold text-[#0CBB7D]">{row.orderType === "B2C" ? row.packageDetails?.applicableWeight : row.B2BPackageDetails?.applicableWeight} Kg</span>
                          </div>
                          {row.orderType === "B2C" && (
                            <>
                              <div className="border-t pt-2 mt-2">
                                <span className="text-gray-500 block mb-1">Dimensions (L x W x H)</span>
                                <span className="font-bold">{row.packageDetails?.volumetricWeight?.length}x{row.packageDetails?.volumetricWeight?.width}x{row.packageDetails?.volumetricWeight?.height} cm</span>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ))
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

      <ShippingFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        searchInput={inputValue}
        searchType={searchBy}
        selectedCourier={selectedCourier}
        status={selectedStatus}
        paymentType={paymentType}
        pickupAddress={selectedPickupAddress}
        courierOptions={courierOptions}
        pickupAddresses={pickupAddresses}
        onClearFilters={handleClearFilters}
        showUserFilter={false}
        showPaymentType={true}
        showPickupAddress={true}
        onApplyFilters={(filters) => {
          setInputValue(filters.searchInput);
          setSearchBy(filters.searchType);
          setSelectedCourier(filters.selectedCourier);
          setSelectedStatus(filters.status);
          setPaymentType(filters.paymentType);
          setSelectedPickupAddress(filters.pickupAddress);
          setPage(1);
          setIsFilterPanelOpen(false);
        }}
      />

    </div >
  );
};

export default Shippings;
