import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
// import { toast } from "react-toastify";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { HiDotsHorizontal } from "react-icons/hi";
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
import Smartship from "../../assets/bluedart.png";
import { FaTruck, FaPlane } from "react-icons/fa";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import { ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import { DateRange, defaultStaticRanges } from "react-date-range";
import { format } from "date-fns";
import dayjs from "dayjs";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { FaFilter, FaBars } from "react-icons/fa";
import { FiMoreHorizontal, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import ThreeDotLoader from "../../Loader"
import Cookies from "js-cookie";
import { Notification } from "../../Notification";
import NotFound from "../../assets/nodatafound.png"
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



const IntransitOrders = (filterOrder, { isSidebarAdmin }) => {
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
  const toggleButtonRefs = useRef([]);
  const actionDropdownRef = useRef(null);
  const [page, setPage] = useState(1); // Track current page
  const [limit, setLimit] = useState(20); // You can make this dynamic if needed
  const [totalPages, setTotalPages] = useState(1);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [employeeAccess, setEmployeeAccess] = useState({
    isAdmin: false,
    canAction: false,
  });
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState("");
  const [courier, setCourier] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [couriers, setCouriers] = useState([]);
  const [pickupStatus, setPickupStatus] = useState("Generate Pickup"); // Initial button text
  const [isDisabled, setIsDisabled] = useState(false); // Button disable state
  const [searchUser, setSearchUser] = useState("");
  const [searchBy, setSearchBy] = useState("awbNumber");
  const [inputValue, setInputValue] = useState("");
  const [dropdownDirection, setDropdownDirection] = useState({});

  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const desktopActionRef = useRef(null);
  const mobileActionRef = useRef(null);

  const [courierOptions, setCourierOptions] = useState([]); // All unique couriers
  const [selectedCourier, setSelectedCourier] = useState(""); // Selected courier
  const [showCourierDropdownMobile, setShowCourierDropdownMobile] =
    useState(false);
  const courierDropdownButtonRef = useRef(null);
  const courierDropdownRefMobile = useRef(null);
  const courierDropdownButtonRefMobile = useRef(null);
  const [orderId, setOrderId] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [pickupAddresses, setPickupAddresses] = useState([]); // Store pickup addresses
  const [selectedPickupAddress, setSelectedPickupAddress] = useState(""); // Track selected pickup address
  const [showPickupDropdown, setShowPickupDropdown] = useState(false); // Toggle dropdown visibility
  const [showPaymentTypeDropdown, setShowPaymentTypeDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const awbDropdownRef = useRef(null);
  const awbDropdownButtonRef = useRef(null);
  const [showSearchByDropdownMobile, setShowSearchByDropdownMobile] =
    useState(false);
  const awbDropdownRefMobile = useRef(null);
  const awbDropdownButtonRefMobile = useRef(null);

  const paymentRef = useRef(null);
  const dateRef = useRef(null);
  const pickupRef = useRef(null);
  const calendarRef = useRef(null);
  const paymentButtonRef = useRef(null);
  const pickupButtonRef = useRef(null);
  const dateButtonRef = useRef(null);

  const [tempDateRange, setTempDateRange] = useState([
    { startDate: null, endDate: null, key: "selection" },
  ]);
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: "selection",
    },
  ]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCourierDropdown, setShowCourierDropdown] = useState(false);

  const [showSearchByDropdown, setShowSearchByDropdown] = useState(false);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const userId = params.get("userId");
  // console.log(userId)
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const typeDropdownRef = useRef(null);
  const courierDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);

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

      //this is for the awb number dropdwon

      if (
        awbDropdownRef.current &&
        !awbDropdownRef.current.contains(event.target) &&
        awbDropdownButtonRef.current &&
        !awbDropdownButtonRef.current.contains(event.target)
      ) {
        setShowSearchByDropdown(false);
      }

      // Mobile AWB dropdown outside click
      if (
        awbDropdownRefMobile.current &&
        !awbDropdownRefMobile.current.contains(event.target) &&
        awbDropdownButtonRefMobile.current &&
        !awbDropdownButtonRefMobile.current.contains(event.target)
      ) {
        setShowSearchByDropdownMobile(false);
      }

      if (
        courierDropdownRef.current &&
        !courierDropdownRef.current.contains(event.target) &&
        courierDropdownButtonRef.current &&
        !courierDropdownButtonRef.current.contains(event.target)
      ) {
        setShowCourierDropdown(false);
      }
      if (
        courierDropdownRefMobile.current &&
        !courierDropdownRefMobile.current.contains(event.target) &&
        courierDropdownButtonRefMobile.current &&
        !courierDropdownButtonRefMobile.current.contains(event.target)
      ) {
        setShowCourierDropdownMobile(false);
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
    showSearchByDropdown,
    showSearchByDropdownMobile,
    showCourierDropdown,
    showCourierDropdownMobile,
  ]);

  const dateOptions = [
    {
      label: "Today",
      range: () => ({
        startDate: new Date().setHours(0, 0, 0, 0), // Start of today
        endDate: new Date().setHours(23, 59, 59, 999), // End of today
      }),
    },
    {
      label: "Yesterday",
      range: () => ({
        startDate: dayjs().subtract(1, "day").startOf("day").toDate(), // Start of yesterday
        endDate: dayjs().subtract(1, "day").endOf("day").toDate(), // End of yesterday
      }),
    },
    {
      label: "Last 7 Days",
      range: () => ({
        startDate: dayjs().subtract(6, "day").startOf("day").toDate(), // 7 days ago
        endDate: dayjs().endOf("day").toDate(), // End of today
      }),
    },
    {
      label: "Last 30 Days",
      range: () => ({
        startDate: dayjs().subtract(29, "day").startOf("day").toDate(), // 30 days ago
        endDate: dayjs().endOf("day").toDate(), // End of today
      }),
    },
    {
      label: "Last Week",
      range: () => ({
        startDate: dayjs().subtract(1, "week").startOf("week").toDate(), // Start of last week
        endDate: dayjs().subtract(1, "week").endOf("week").toDate(), // End of last week
      }),
    },
    {
      label: "Last Month",
      range: () => ({
        startDate: dayjs().subtract(1, "month").startOf("month").toDate(), // Start of last month
        endDate: dayjs().subtract(1, "month").endOf("month").toDate(), // End of last month
      }),
    },
    {
      label: "This Year",
      range: () => ({
        startDate: dayjs().startOf("year").toDate(), // Start of this year
        endDate: dayjs().endOf("day").toDate(), // End of today
      }),
    },
    {
      label: "Custom",
      custom: true, // Custom calendar
    },
  ];

  const toggleDropdown = (index) => {
    // This logic is for setting dropdown direction based on viewport room
    const buttonRef = toggleButtonRefs.current[index];
    if (buttonRef) {
      const rect = buttonRef.getBoundingClientRect();
      const dropdownHeight = 160; // adjust to your dropdown's pixel height if needed
      const spaceBelow = window.innerHeight - rect.bottom;
      const direction = spaceBelow < dropdownHeight ? "up" : "down";
      setDropdownDirection((prev) => ({ ...prev, [index]: direction }));
    }
    setDropdownOpen(dropdownOpen === index ? null : index);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setActionDropdownOpen(false); // Close dropdown if clicked outside
    }
  };

  const options = [
    { label: "AWB", value: "awbNumber" },
    { label: "Order ID", value: "orderId" },
    // { label: "Tracking ID", value: "trackingId" },
  ];

  // Attach event listener to detect outside clicks
  useEffect(() => {
    if (actionDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionDropdownOpen]);

  const handleLabel = async (id) => {
    try {
      const response = await fetch(
        `${REACT_APP_BACKEND_URL}/printlabel/generate-pdf/${id}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Label-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Error downloading invoice:", error);
    }
  };

  const handleManifest = async (id) => {
    try {
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/manifest/generate-pdf?orderIds=${id}`,
        {
          responseType: "blob",
        }
      );

      if (!response.data) {
        throw new Error("Empty response received");
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "manifest.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the PDF:", error);
    }
  };

  const handleInvoice = async (id) => {
    try {
      const response = await fetch(
        `${REACT_APP_BACKEND_URL}/printinvoice/download-invoice/${id}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Error downloading invoice:", error);
    }
  };

  useEffect(() => {
    console.log("suer", searchUser)
    const fetchUsers = async () => {
      if (searchUser.trim().length < 2) return setUserSuggestions([]);
      try {
        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/admin/searchUser?query=${searchUser}`
        );
        console.log("dataaaa", res.data.users);
        setUserSuggestions(res.data.users);
      } catch (err) {
        console.error("User search failed", err);
      }
    };

    const debounce = setTimeout(fetchUsers, 300); // debounce to limit API calls
    return () => clearTimeout(debounce);
  }, [searchUser]);


  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("session");

      const [pickupCity, pickupState] =
        selectedPickupAddress?.split(", ") || [];

      const params = {
        page,
        limit,
        status: "In-transit",
        userId: selectedUserId, // not selectedUserId, not "selectedUserId"
        searchQuery: searchQuery || undefined,
        orderId,
        paymentType,
        startDate: dateRange[0].startDate?.toISOString(),
        endDate: dateRange[0].endDate?.toISOString(),
        pickupContactName: selectedPickupAddress || undefined,
      };
      // Add search by orderId, awbNumber, or trackingId
      if (inputValue.trim()) {
        if (searchBy === "orderId") params.orderId = inputValue.trim();
        if (searchBy === "awbNumber") params.awbNumber = inputValue.trim();
        if (searchBy === "trackingId") params.trackingId = inputValue.trim();
      }
      if (selectedCourier) {
        params.courier = selectedCourier;
      }


      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/admin/filterEmployeeOrders`,
        {
          params,
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
      if (response.data.pickupLocations) {
        setPickupAddresses(response.data.pickupLocations);
      }
      setCourierOptions(response.data.couriers || [])
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
    selectedUserId,
    searchQuery,
    inputValue,
    paymentType,
    dateRange,
    selectedPickupAddress,
    searchBy,
    selectedCourier
  ]);


  useEffect(() => {
    if (searchUser.trim().length < 2) {
      setUserSuggestions([]);
      setSelectedUserId(null);
      return;
    }
    const timer = setTimeout(() => {
      // If userSuggestions has only one user and searchQuery matches, auto-select
      if (
        userSuggestions.length === 1 &&
        userSuggestions[0].fullname + " (" + userSuggestions[0].email + ")" ===
        searchUser
      ) {
        setSelectedUserId(userSuggestions[0]._id);
      }
      // Otherwise, do nothing (user must click suggestion)
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [searchUser]);



  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((order) => order._id));
    }
  };

  // Handle individual row selection
  const handleCheckboxChange = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkDownloadManifest = async () => {
    try {
      if (!selectedOrders.length) {
        Notification("No orders selected.", "info");
        return;
      }

      console.log("Selected Orders:", selectedOrders);

      const orderIds = selectedOrders.join(",");
      const response = await fetch(
        `${REACT_APP_BACKEND_URL}/manifest/generate-pdf?orderIds=${orderIds}`
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Failed to fetch manifest:", errorMessage);
        Notification("Failed to fetch manifest.", "error");
        return;
      }

      const blob = await response.blob();
      saveAs(blob, "bulk-manifest.pdf");

      Notification("Manifest downloaded successfully!", "success");
    } catch (error) {
      console.error("Error downloading Manifest:", error);
      Notification("Failed to download Manifest.", "error");
    }
  };

  const handleBulkDownloadLabel = async () => {
    try {
      const mergedPdf = await PDFDocument.create();
      const pageWidth = 595; // A4 width
      const pageHeight = 842; // A4 height
      const labelWidth = pageWidth / 2; // For 2x2 grid
      const labelHeight = pageHeight / 2; // For 2x2 grid

      let labelCount = 0;
      let currentPage = null;

      for (let orderId of selectedOrders) {
        const response = await fetch(
          `${REACT_APP_BACKEND_URL}/printlabel/generate-pdf/${orderId}`
        );
        const blob = await response.blob();
        const existingPdfBytes = await blob.arrayBuffer();
        const existingPdf = await PDFDocument.load(existingPdfBytes);
        const copiedPages = await mergedPdf.copyPages(
          existingPdf,
          existingPdf.getPageIndices()
        );

        for (const page of copiedPages) {
          if (selectedOrders.length === 1) {
            // If only 1 label, make it full-page
            let singlePage = mergedPdf.addPage([pageWidth, pageHeight]);
            const embeddedPage = await mergedPdf.embedPage(page);
            singlePage.drawPage(embeddedPage, {
              x: 0,
              y: 0,
              width: pageWidth,
              height: pageHeight,
            });
          } else if (selectedOrders.length === 2) {
            // If 2 labels, each label gets a full page
            let newPage = mergedPdf.addPage([pageWidth, pageHeight]);
            const embeddedPage = await mergedPdf.embedPage(page);
            newPage.drawPage(embeddedPage, {
              x: 0,
              y: 0,
              width: pageWidth,
              height: pageHeight,
            });
          } else {
            // 4 or more labels → Arrange in 2x2 grid
            if (labelCount % 4 === 0) {
              currentPage = mergedPdf.addPage([pageWidth, pageHeight]);
            }

            const x = (labelCount % 2) * labelWidth;
            const y =
              pageHeight - ((Math.floor(labelCount / 2) % 2) + 1) * labelHeight;

            const embeddedPage = await mergedPdf.embedPage(page);
            currentPage.drawPage(embeddedPage, {
              x,
              y,
              width: labelWidth,
              height: labelHeight,
            });

            labelCount++;
          }
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const mergedBlob = new Blob([mergedPdfBytes], {
        type: "application/pdf",
      });
      saveAs(mergedBlob, "bulk-Label.pdf");

      Notification("Label downloaded successfully!", "success");
    } catch (error) {
      console.error("Error downloading Label:", error);
      Notification("Failed to download Label.", "error");
    }
  };

  // tracking
  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

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

  const handleBulkDownloadInvoices = async () => {
    if (selectedOrders.length === 0) {
      Notification("No orders selected for download.", "info");
      return;
    }

    try {
      const mergedPdf = await PDFDocument.create();
      console.log("selectedOrders", selectedOrders);

      for (let orderId of selectedOrders) {
        const response = await fetch(
          `${REACT_APP_BACKEND_URL}/printinvoice/download-invoice/${orderId}`
        );
        const blob = await response.blob();
        const existingPdfBytes = await blob.arrayBuffer();

        const existingPdf = await PDFDocument.load(existingPdfBytes);
        const copiedPages = await mergedPdf.copyPages(
          existingPdf,
          existingPdf.getPageIndices()
        );

        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const mergedBlob = new Blob([mergedPdfBytes], {
        type: "application/pdf",
      });
      saveAs(mergedBlob, "bulk-invoices.pdf");

      Notification("Invoices downloaded successfully!", "success");
    } catch (error) {
      console.error("Error downloading invoices:", error);
      Notification("Failed to download invoices.", "error");
    }
  };

  const getPlaceholder = () => {
    switch (searchBy) {
      case "orderId":
        return "Search by Order ID";
      case "trackingId":
        return "Search by Tracking ID";
      default:
        return "Search by AWB Number";
    }
  };



  const handleOptionClick = (option) => {
    if (option.custom) {
      setShowCustom(true);
    } else {
      const range = option.range();
      setDateRange([
        {
          startDate: new Date(range.startDate),
          endDate: new Date(range.endDate),
          key: 'selection',
        },
      ]);
      setShowCustom(false);
      setShowDropdown(false);
    }
  };

  const handleExportExcel = () => {
    if (selectedOrders.length === 0) {
      Notification("No orders selected for export.", "info");
      return;
    }

    // Filter only selected orders
    const exportData = orders
      .filter((order) => selectedOrders.includes(order._id))
      .map((order) => ({
        "Order ID": order.orderId,
        "Order Status": order.status,
        "Order Date": new Date(order.createdAt).toLocaleString(),
        "Sender Name": order.pickupAddress?.contactName,
        "Sender Email": order.pickupAddress?.email,
        "Sender Phone": order.pickupAddress?.phoneNumber,
        "Sender Address": order.pickupAddress?.address,
        "Sender City": order.pickupAddress?.city,
        "Sender State": order.pickupAddress?.state,
        "Sender Pin": order.pickupAddress?.pinCode,
        "Receiver Name": order.receiverAddress?.contactName,
        "Receiver Email": order.receiverAddress?.email,
        "Receiver Phone": order.receiverAddress?.phoneNumber,
        "Receiver Address": order.receiverAddress?.address,
        "Receiver City": order.receiverAddress?.city,
        "Receiver State": order.receiverAddress?.state,
        "Receiver Pin": order.receiverAddress?.pinCode,
        "Payment Method": order.paymentDetails?.method,
        "Payment Amount": order.paymentDetails?.amount,
        "Courier Service Name": order.courierServiceName,
        "AWB Number": order.awb_number,
        // Add more fields as needed
        Products: order.productDetails
          ?.map(
            (p) =>
              `Name: ${p.name}, SKU: ${p.sku}, Qty: ${p.quantity}, Price: ${p.unitPrice}`
          )
          .join(" | "),
      }));

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");

    // Generate buffer and save
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "orders.xlsx");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setInputValue("");
    setPaymentType("");
    setSelectedPickupAddress("");
    setSelectedCourier("");
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
    setSearchBy("awbNumber");
    setPage(1);
    setSearchUser("")
    setSelectedUserId("")
  };

  return (
    <div>
      {/* Desktop Table */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 sm:my-2">
          <div className="hidden md:flex md:flex-row items-center gap-2 w-full">
            <div className="w-full md:w-auto flex-1 min-w-[250px] relative">
              <input
                type="text"
                placeholder="Search by Name, Email, or Contact"
                className="w-full md:w-[250px] h-9 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] placeholder:text-gray-400 focus:outline-none"
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchUser(value);
                  if (value.trim() === "") {
                    setSelectedUserId(null);
                    setPage(1);
                  }
                }}
                value={searchUser}
              />
              {userSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full bg-white shadow-lg rounded-md mt-1 z-20 max-h-60 overflow-y-auto">
                  {userSuggestions.map((user, index) => (
                    <div
                      key={user._id}
                      className={`flex cursor-pointer group transition-colors duration-300 ${index !== userSuggestions.length
                          ? "border-b border-gray-200 hover:bg-gray-100"
                          : ""
                        }`}
                      onClick={() => {
                        setSelectedUserId(user._id);
                        setSearchUser(`${user.fullname} (${user.email})`);
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
            {/* <input
              type="text"
              placeholder="Search by Customer details"
              className="w-full md:w-1/5 h-9 px-3 placeholder:text-[12px] placeholder:text-gray-500 text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] focus:outline-none"
              onChange={(e) => setSearchQuery(e.target.value)}
              value={searchQuery}
            /> */}

            {/* awbnumber filter */}
            <div className="flex w-full md:w-1/4 max-w-md" ref={awbDropdownRef}>
              {/* Custom Dropdown */}
              <div className="relative w-3/5">
                <button
                  ref={awbDropdownButtonRef}
                  onClick={() => setShowSearchByDropdown((prev) => !prev)}
                  className="w-full h-9 px-3 text-[12px] font-[600] border-2 border-r-0 rounded-l-lg bg-white text-left focus:outline-none flex items-center justify-between text-gray-400"
                >
                  <span className="truncate">
                    {options.find((opt) => opt.value === searchBy)?.label ||
                      "Select"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 ml-2 transform transition-transform ${showSearchByDropdown ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {showSearchByDropdown && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow text-[12px] font-[600]">
                    {options.map((opt) => (
                      <li
                        key={opt.value}
                        onClick={() => {
                          setSearchBy(opt.value);
                          setShowSearchByDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-green-50 cursor-pointer text-gray-500"
                      >
                        {opt.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Input Box */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full h-9 px-3 text-[12px] font-[600] border-2 border-l-0 rounded-r-lg placeholder:font-[600] focus:outline-none placeholder:text-gray-400"
              />
            </div>

            {/* Payment Type Dropdown */}
            <div className="relative w-full md:w-1/6" ref={paymentRef}>
              <button
                className="w-full bg-white h-9 px-3 text-xs font-semibold border-2 rounded-lg focus:outline-none text-left flex items-center justify-between text-gray-400"
                onClick={() => {
                  setShowPaymentTypeDropdown((prev) => !prev);
                  setShowPickupDropdown(false);
                  setShowDropdown(false);
                }}
                ref={paymentButtonRef}
              >
                {paymentType || "Payment"}
                <ChevronDown
                  className={`w-4 h-4 ml-2 transform transition-transform ${showPaymentTypeDropdown ? "rotate-180" : ""
                    }`}
                />
              </button>

              {showPaymentTypeDropdown && (
                <div className="absolute w-full bg-white border rounded shadow p-1 z-10 max-h-60 overflow-y-auto transition-all duration-300 ease-in-out">
                  {["Prepaid", "COD"].map((type) => (
                    <div
                      key={type}
                      className="cursor-pointer hover:bg-green-50 px-3 py-2 text-[12px] font-[600] text-gray-500"
                      onClick={() => {
                        setPaymentType(type);
                        setShowPaymentTypeDropdown(false);
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* CourierDropdown */}
            <div className="relative w-full md:w-1/5" ref={courierDropdownRef}>
              <button
                className="w-full bg-white h-9 px-3 text-xs font-semibold border-2 rounded-lg focus:outline-none text-left flex items-center justify-between text-gray-400"
                onClick={() => {
                  setShowCourierDropdown((prev) => !prev);
                  setShowPickupDropdown(false);
                  setShowPaymentTypeDropdown(false);
                  setShowDropdown(false);
                }}
                ref={courierDropdownButtonRef}
              >
                {selectedCourier || "Select Courier"}
                <ChevronDown
                  className={`w-4 h-4 ml-2 transform transition-transform ${showCourierDropdown ? "rotate-180" : ""
                    }`}
                />
              </button>
              {showCourierDropdown && (
                <div className="absolute w-full bg-white border rounded shadow p-1 z-10 max-h-40 overflow-y-auto transition-all duration-300 ease-in-out">
                  {courierOptions.map((courier, idx) => (
                    <div
                      key={idx}
                      className="cursor-pointer hover:bg-green-50 px-3 py-2 text-[12px] font-[600] text-gray-500"
                      onClick={() => {
                        setSelectedCourier(courier);
                        setShowCourierDropdown(false);
                      }}
                    >
                      <p className="text-[12px] font-[600] text-gray-500">
                        {courier}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pickup Address Dropdown */}
            <div className="relative w-full md:w-1/5" ref={pickupRef}>
              <button
                className="w-full bg-white h-9 px-3 text-xs font-semibold border-2 rounded-lg focus:outline-none text-left flex items-center justify-between text-gray-400"
                onClick={() => {
                  setShowPickupDropdown((prev) => !prev);
                  setShowPaymentTypeDropdown(false);
                  setShowDropdown(false);
                }}
                ref={pickupButtonRef}
              >
                {selectedPickupAddress || "Pickup Address"}
                <ChevronDown
                  className={`w-4 h-4 ml-2 transform transition-transform ${showPickupDropdown ? "rotate-180" : ""
                    }`}
                />
              </button>

              {showPickupDropdown && (
                <div className="absolute w-full bg-white border rounded shadow p-1 z-10 max-h-40 overflow-y-auto transition-all duration-300 ease-in-out">
                  {pickupAddresses.map((location, index) => (
                    <div
                      key={index}
                      className="cursor-pointer hover:bg-green-50 px-3 py-2 text-[12px] font-[600] text-gray-500"
                      onClick={() => {
                        setSelectedPickupAddress(location.contactName);
                        setShowPickupDropdown(false);
                      }}
                    >
                      <p className="text-[12px] font-[600] text-gray-500">
                        {location.contactName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="relative w-full md:w-1/4" ref={dateRef}>
              <button
                className="w-full bg-white h-9 px-3 text-xs font-semibold border-2 rounded-lg focus:outline-none text-left flex items-center justify-between text-gray-400"
                onClick={() => {
                  if (showCustom) {
                    // If calendar open, close both calendar & dropdown
                    setShowDropdown(false);
                    setShowCustom(false);
                  } else {
                    // Toggle dropdown normally and close others
                    setShowDropdown((prev) => !prev);
                    setShowPickupDropdown(false);
                    setShowPaymentTypeDropdown(false);
                    setShowCustom(false);
                  }
                }}
                ref={dateButtonRef}
              >
                <span>
                  {dateRange[0].startDate && dateRange[0].endDate
                    ? `${dayjs(dateRange[0].startDate).format(
                      "DD/MM/YYYY"
                    )} - ${dayjs(dateRange[0].endDate).format("DD/MM/YYYY")}`
                    : "Select Date"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 ml-2 transform transition-transform ${showDropdown ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Dropdown Options */}
              {showDropdown && (
                <div className="absolute w-full bg-white border rounded shadow p-2 z-[50] transition-all duration-300 ease-in-out">
                  <ul>
                    {dateOptions.map((option, idx) => (
                      <li
                        key={idx}
                        className="cursor-pointer hover:bg-green-50 px-3 py-2 text-[12px] font-[600] text-gray-500"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDateOptionClick(option);
                        }}
                      >
                        {option.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Custom Calendar */}
              {showCustom && (
                <div
                  className="absolute w-full bg-white border rounded shadow p-2 z-[60] transition-all duration-600 ease-in-out"
                  ref={calendarRef}
                  onClick={(e) => e.stopPropagation()} // prevent calendar clicks from closing
                >
                  <DateRange
                    editableDateInputs={true}
                    onChange={(item) => setTempDateRange([item.selection])}
                    ranges={tempDateRange}
                    moveRangeOnFirstSelection={false}
                    showMonthAndYearPickers={false}
                    rangeColors={["#0CBB7D"]}
                    months={1}
                    direction="horizontal"
                    showDateDisplay={false}
                    className="custom-date-range w-[240px] h-[260px] text-[12px] font-[600] text-gray-500 scale-[0.90] origin-top"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      className="bg-[#0CBB7D] text-white px-3 py-1 text-xs rounded"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent button clicks from closing unexpectedly
                        setDateRange(tempDateRange);
                        setShowCustom(false);
                        setShowDropdown(false);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Action Button for Desktop */}
            <div
              className="relative hidden md:flex items-center gap-2"
              ref={desktopActionRef}
            >
              <button
                className="h-9 px-3 text-[12px] border-2 rounded-lg font-[600] text-[#0CBB7D] border-[#0CBB7D] bg-white hover:bg-gray-100 transition whitespace-nowrap"
                onClick={handleClearFilters}
                type="button"
              >
                Clear Filters
              </button>

              {/* ✅ Wrap the Actions button + dropdown in a relative container */}
              <div className="relative">
                <button
                  className={`h-9 px-3 text-[12px] border-2 rounded-lg font-[600] flex items-center gap-1 justify-center whitespace-nowrap ${selectedOrders.length === 0
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "text-[#0CBB7D] border-[#0CBB7D]"
                    }`}
                  onClick={() =>
                    selectedOrders.length > 0 &&
                    setDesktopDropdownOpen(!desktopDropdownOpen)
                  }
                  disabled={selectedOrders.length === 0}
                >
                  <span>Actions</span> <span>▼</span>
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
                    <li
                      className="px-3 py-2 text-gray-700 cursor-pointer text-[10px] hover:bg-green-100"
                      onClick={handleBulkDownloadInvoices}
                    >
                      Download Invoices
                    </li>
                    <li
                      className="px-3 py-2 text-gray-700 hover:bg-green-100 text-[10px] cursor-pointer"
                      onClick={handleBulkDownloadManifest}
                    >
                      Download Manifests
                    </li>
                    <li
                      className="px-3 py-2 text-gray-700 hover:bg-green-100 text-[10px] cursor-pointer"
                      onClick={handleBulkDownloadLabel}
                    >
                      Download Label
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {/* New Dropdown */}
          <div className="flex gap-2 flex-col md:flex-row md:hidden w-full">
            <div className="flex items-center justify-between gap-2 relative">
              <div className="w-[210px] flex-1 relative">
                <input
                  type="text"
                  placeholder="Search by Name, Email, or Contact"
                  className="sm:w-[210px] w-full h-8 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] placeholder:text-gray-400 focus:outline-none"
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchUser(value);
                    if (value.trim() === "") {
                      setSelectedUserId(null);
                      setPage(1);
                    }
                  }}
                  value={searchUser}
                />
                {userSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full bg-white shadow-lg rounded-md mt-1 z-20 max-h-60 overflow-y-auto">
                    {userSuggestions.map((user, index) => (
                      <div
                        key={user._id}
                        className={`flex cursor-pointer group transition-colors duration-200 ${index !== userSuggestions.length - 1
                            ? "border-b border-gray-200"
                            : ""
                          }`}
                        onClick={() => {
                          setSelectedUserId(user._id);
                          setSearchUser(`${user.fullname} (${user.email})`);
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


              {/* FaFilter Button */}
              <button
                className="px-3 flex items-center justify-center text-white bg-[#0CBB7D] h-8 rounded-lg transition text-[12px] font-[600]"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                <FaFilter className="text-white" />
              </button>
              <div ref={actionDropdownRef}>
                <button
                  className={`px-3 h-8 border-2 rounded-lg font-[600] flex items-center gap-1 ${selectedOrders.length === 0
                    ? "border-gray-200 text-[10px] sm:text-[12px] cursor-not-allowed text-gray-400"
                    : "text-[#0CBB7D] border-[#0CBB7D] text-[10px] sm:text-[12px]"
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
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <ul className="py-2 font-[600]">
                      <li
                        className="px-3 py-2 text-gray-700 hover:bg-green-100 cursor-pointer text-[10px]"
                        onClick={handleExportExcel}
                      >
                        Export
                      </li>
                      <li
                        className="px-3 py-2 text-gray-700 cursor-pointer text-[10px] hover:bg-green-100"
                        onClick={handleBulkDownloadInvoices}
                      >
                        Download Invoices
                      </li>
                      <li
                        className="px-3 py-2 text-gray-700 hover:bg-green-100 text-[10px] cursor-pointer"
                        onClick={handleBulkDownloadManifest}
                      >
                        Download Manifests
                      </li>
                      <li
                        className="px-3 py-2 text-gray-700 hover:bg-green-100 text-[10px] cursor-pointer"
                        onClick={handleBulkDownloadLabel}
                      >
                        Download Label
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* filter Section */}
            <div
              className={`transition-all duration-300 ease-in-out md:hidden ${showFilters
                ? "max-h-[1000px] overflow-visible"
                : "max-h-0 overflow-hidden"
                }`}
            >
              <div className="flex flex-col gap-2 overflow-visible">
                <input
                  type="text"
                  placeholder="Search by Customer Details"
                  className="w-full h-8 px-2 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] focus:outline-none placeholder:text-gray-400"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
                {/* awbnumber dropdown */}
                <div className="flex w-full md:w-1/3 max-w-md">
                  <div className="relative w-3/5" ref={awbDropdownRefMobile}>
                    <button
                      ref={awbDropdownButtonRefMobile}
                      onClick={() =>
                        setShowSearchByDropdownMobile((prev) => !prev)
                      }
                      className="w-full h-8 px-3 text-[12px] font-[600] border-2 border-r-0 rounded-l-lg bg-white text-left focus:outline-none flex items-center justify-between text-gray-400"
                    >
                      <span className="truncate">
                        {options.find((opt) => opt.value === searchBy)?.label ||
                          "Select"}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 ml-2 transform transition-transform ${showSearchByDropdownMobile ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                    {showSearchByDropdownMobile && (
                      <ul className="absolute z-[70] w-full mt-1 bg-white border border-gray-300 rounded shadow text-[12px] font-[600] text-gray-500">
                        {options.map((opt) => (
                          <li
                            key={opt.value}
                            onClick={() => {
                              setSearchBy(opt.value);
                              setShowSearchByDropdownMobile(false);
                            }}
                            className="px-3 py-1 hover:bg-green-50 cursor-pointer"
                          >
                            {opt.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full h-8 px-3 text-[12px] font-[600] border-2 border-l-0 rounded-r-lg placeholder:font-[600] focus:outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* Payment Type Dropdown */}
                <div className="relative w-full z-20" ref={paymentRef}>
                  <button
                    className="w-full bg-white h-8 px-3 text-xs font-semibold border-2 rounded-lg focus:outline-none text-left flex items-center justify-between text-gray-400"
                    onClick={() => {
                      setShowPaymentTypeDropdown((prev) => !prev);
                      setShowPickupDropdown(false);
                      setShowDropdown(false);
                    }}
                  >
                    {paymentType || "Payment Type"}
                    <ChevronDown
                      className={`w-4 h-4 ml-2 transform transition-transform ${showPaymentTypeDropdown ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {showPaymentTypeDropdown && (
                    <div className="absolute w-full bg-white border rounded shadow p-1 z-50 max-h-32 overflow-y-auto transition-all duration-300 ease-in-out">
                      {["Prepaid", "COD"].map((type) => (
                        <div
                          key={type}
                          className="cursor-pointer hover:bg-green-50 px-3 py-2 text-[12px] font-[600] text-gray-500"
                          onClick={() => {
                            setPaymentType(type);
                            setShowPaymentTypeDropdown(false);
                          }}
                        >
                          {type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Courier Dropdown */}
                <div
                  className="relative w-full"
                  ref={courierDropdownRefMobile}
                >
                  <button
                    className="w-full bg-white h-8 px-3 text-xs font-semibold border-2 z-30 rounded-lg focus:outline-none text-left flex items-center justify-between text-gray-400"
                    onClick={() =>
                      setShowCourierDropdownMobile((prev) => !prev)
                    }
                    ref={courierDropdownButtonRefMobile}
                  >
                    {selectedCourier || "Select Courier"}
                    <ChevronDown
                      className={`w-4 h-4 ml-2 transform transition-transform ${showCourierDropdownMobile ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  {showCourierDropdownMobile && (
                    <div className="absolute w-full bg-white border rounded shadow p-1 z-30 max-h-32 overflow-y-auto transition-all duration-300 ease-in-out">
                      {courierOptions.map((courier, idx) => (
                        <div
                          key={idx}
                          className="cursor-pointer hover:bg-green-50 px-3 py-2 text-[12px] font-[600] text-gray-500"
                          onClick={() => {
                            setSelectedCourier(courier);
                            setShowCourierDropdownMobile(false);
                          }}
                        >
                          <p className="text-[12px] font-[600] text-gray-500">{courier}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pickup Address Dropdown */}
                <div className="relative w-full" ref={pickupRef}>
                  <button
                    className="w-full bg-white h-8 px-3 text-xs font-semibold border-2 rounded-lg z-20 focus:outline-none text-left flex items-center justify-between text-gray-400"
                    onClick={() => {
                      setShowPickupDropdown((prev) => !prev);
                      setShowPaymentTypeDropdown(false);
                      setShowDropdown(false);
                    }}
                  >
                    {selectedPickupAddress
                      ? pickupAddresses.find(
                        (addr) => addr._id === selectedPickupAddress
                      )?.contactName || "Select Pickup Address"
                      : "Select Pickup Address"}
                    <ChevronDown
                      className={`w-4 h-4 ml-2 transform transition-transform ${showPickupDropdown ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {showPickupDropdown && (
                    <div className="absolute w-full bg-white border rounded shadow p-1 z-20 max-h-32 overflow-y-auto transition-all duration-300 ease-in-out">
                      {pickupAddresses.map((location, index) => (
                        <div
                          key={index}
                          className="cursor-pointer hover:bg-green-50 px-3 py-2 text-[12px] font-[600] text-gray-500"
                          onClick={() => {
                            setSelectedPickupAddress(location.contactName);
                            setShowPickupDropdown(false);
                          }}
                        >
                          <p className="text-[12px] font-[600] text-gray-500">
                            {location.contactName}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Range Filter */}
                <div className="relative w-full z-10" ref={dateRef}>
                  <button
                    className="w-full bg-white h-8 px-3 text-xs font-semibold border-2 rounded-lg focus:outline-none text-left flex items-center justify-between text-gray-400"
                    onClick={() => {
                      setShowDropdown((prev) => !prev);
                      setShowPickupDropdown(false);
                      setShowPaymentTypeDropdown(false);
                      setShowCustom(false);
                    }}
                  >
                    <span>
                      {dateRange[0].startDate && dateRange[0].endDate
                        ? `${dayjs(dateRange[0].startDate).format(
                          "DD/MM/YYYY"
                        )} - ${dayjs(dateRange[0].endDate).format(
                          "DD/MM/YYYY"
                        )}`
                        : "Select Date"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 ml-2 transform transition-transform ${showDropdown ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {showDropdown && (
                    <div className="absolute w-full bg-white border rounded shadow p-2 z-10 max-h-36 overflow-y-auto transition-all duration-300 ease-in-out">
                      <ul>
                        {dateOptions.map((option, idx) => (
                          <li
                            key={idx}
                            className="cursor-pointer hover:bg-green-50 px-3 py-2 text-[12px] font-[600] text-gray-500"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDateOptionClick(option);
                            }}
                          >
                            {option.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Custom Calendar */}
                  {showCustom && (
                    <div
                      className="absolute w-full bg-white border rounded shadow p-2 z-[60] transition-all duration-600 ease-in-out"
                      ref={calendarRef}
                      onClick={(e) => e.stopPropagation()} // prevent calendar clicks from closing
                    >
                      <DateRange
                        editableDateInputs={true}
                        onChange={(item) => setTempDateRange([item.selection])}
                        ranges={tempDateRange}
                        moveRangeOnFirstSelection={false}
                        showMonthAndYearPickers={false}
                        rangeColors={["#0CBB7D"]}
                        months={1}
                        direction="horizontal"
                        showDateDisplay={false}
                        className="custom-date-range w-[240px] h-[260px] text-[12px] font-[600] text-gray-500 scale-[0.90] origin-top"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          className="bg-[#0CBB7D] text-white px-3 py-1 text-xs rounded"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent button clicks from closing unexpectedly
                            setDateRange(tempDateRange);
                            setShowCustom(false);
                            setShowDropdown(false);
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="w-full bg-white mt-1 h-8 text-xs font-semibold border-2 rounded-lg text-[#0CBB7D] border-[#0CBB7D] hover:bg-gray-100 transition"
                  onClick={handleClearFilters}
                  type="button"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:block overflow-x-auto overflow-y-hidden">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
          {/* Table Head */}
          <thead>
            <tr className="text-white bg-[#0CBB7D] border border-[#0CBB7D] font-[600] text-[12px]">
              <th className="py-2 px-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedOrders.length === selectedOrders.length &&
                    selectedOrders.length > 0
                  }
                  onChange={handleSelectAll}
                  className="cursor-pointer accent-[#0CBB7D] w-4"
                />
              </th>
              <th className="py-2 px-3 text-left">
                User Details
              </th>
              <th className="py-2 px-3 text-left">Order Details</th>
              <th className="py-2 px-3 text-left">Product Details</th>
              <th className="py-2 px-3 text-left">Package Details</th>
              <th className="py-2 px-3 text-left">Payment</th>
              <th className="py-2 px-3 text-left">Customer Details</th>
              <th className="py-2 px-3 text-left">Pickup Address</th>
              <th className="py-2 px-3 text-left">Shipping Details</th>


              <th className="py-2 px-3 text-left">
                Status
              </th>
              <th className="py-2 px-3 text-left">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="text-center py-6 text-gray-500">
                  <ThreeDotLoader />
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order, index) => (
                <tr
                  key={index}
                  className="border border-gray-300 font-[400] text-gray-500 hover:bg-gray-50 transition-all text-[12px]"
                >
                  <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "100px", width: "50px" }}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleCheckboxChange(order._id)}
                      className="cursor-pointer accent-[#0CBB7D] w-4"
                    />
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "180px", width: "130px" }}>
                    <p className="text-[#0CBB7D]">{order.userId?.userId}</p>
                    <p>{order.userId?.fullname}</p>
                    <p className="text-gray-500 max-w-[160px] truncate sm:max-w-[200px]" title={order.userId?.email}>
                      {order.userId?.email}
                    </p>
                    <p className="text-gray-500">{order.userId?.phoneNumber}</p>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "150px", width: "100px" }}>
                    <Link
                      to={`/dashboard/order/neworder/updateOrder/${order._id}`}
                      className="text-[#0CBB7D] font-medium block"
                    >
                      {order.orderId}
                    </Link>
                    {order?.channel === "api" && (
                      <p className="font-medium">{order.channelId}</p>
                    )}
                    <p className="text-gray-500 text-[10px]">
                      {new Date(order.createdAt).toLocaleDateString()}
                      <br />
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                    <p className="inline-block uppercase text-white text-[8px] font-[600] bg-[#0CBB7D] py-1 px-2 rounded-lg">
                      {order?.channel || "CUSTOM"}
                    </p>
                  </td>
                  <td
                    className="py-2 px-3 whitespace-normal"
                    style={{ maxWidth: "150px", width: "100px" }}
                  >
                    <p className="flex">
                      <span className="font-medium">Name:&nbsp;</span>
                      <span className="truncate inline-block max-w-[180px]" title={order.productDetails?.map((p) => p.name).join(", ")}>
                        {order.productDetails?.map((p) => p.name).join(", ") || "-"}
                      </span>
                    </p>
                    <p className="flex">
                      <span className="font-medium">SKU:&nbsp;</span>
                      <span className="truncate inline-block max-w-[180px]" title={order.productDetails?.map((p) => p.sku).join(", ")}>
                        {order.productDetails?.map((p) => p.sku).join(", ") || "-"}
                      </span>
                    </p>
                    <p>
                      QTY:{" "}
                      {order.productDetails.reduce((total, p) => total + (p.quantity || 0), 0)}
                    </p>
                    <p>
                      Price: {order.productDetails?.map((p) => p.unitPrice).join(", ") || "-"}
                    </p>
                  </td>

                  <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "120px", width: "50px" }}>
                    <p>Weight: {order.packageDetails.applicableWeight}</p>
                    <p>
                      L*W*H: {order.packageDetails?.volumetricWeight?.length}*
                      {order.packageDetails?.volumetricWeight?.width}*
                      {order.packageDetails?.volumetricWeight?.height}
                    </p>
                    <p>
                      Vol. Weight:{" "}
                      {(
                        (order.packageDetails?.volumetricWeight?.length *
                          order.packageDetails?.volumetricWeight?.width *
                          order.packageDetails?.volumetricWeight?.height) /
                        5000
                      ).toFixed(2)}
                    </p>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "100px", width: "50px" }}>
                    <p className="font-[600]">{order.paymentDetails.amount}</p>
                    <p className="inline-block text-white text-[8px] font-[600] bg-[#0CBB7D] py-1 px-2 rounded-lg">
                      {order.paymentDetails.method}
                    </p>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "200px", width: "150px" }}>
                    <p className="text-gray-500 max-w-[160px] truncate sm:max-w-[200px]" >{order.receiverAddress.contactName}</p>
                    <p className="text-gray-500 max-w-[160px] truncate sm:max-w-[200px]" >
                      {order.receiverAddress.email}
                    </p>
                    <div className="flex gap-2">
                      <p className="text-gray-500">
                        {order.receiverAddress.phoneNumber}
                      </p>
                      <p className="cursor-pointer text-[#0CBB7D] relative group">
                        <i className="fas fa-info-circle"></i>

                        {/* Tooltip (Address Popup) */}
                        <div
                          className="absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 
                     transition-opacity duration-200 bg-white border border-gray-200 text-[11px] 
                     text-gray-700 p-3 rounded-md shadow-xl max-w-xs w-auto max-h-56 overflow-y-auto top-1/2 left-[20px] ml-2 transform -translate-y-1/2"
                          style={{
                            pointerEvents: "none", // prevent stealing focus
                          }}
                        >
                          {/* Arrow */}
                          <div
                            className="absolute -left-2 top-3 w-3 h-3 rotate-45 bg-white border-t border-l border-gray-200 shadow-sm"
                            style={{ pointerEvents: "none" }}
                          ></div>

                          {/* Address Information */}
                          <p className="font-semibold">Address:</p>
                          <p className="break-words text-[10px]">
                            {order.receiverAddress.address}
                          </p>
                          <p className="text-[10px]">
                            {order.receiverAddress.state},{" "}
                            {order.receiverAddress.city} ,
                            {order.receiverAddress.pinCode}
                          </p>
                        </div>
                      </p>
                    </div>
                  </td>
                  <td
                    className="py-2 px-3 whitespace-nowrap"
                    style={{ maxWidth: "250px", width: "200px" }}
                  >
                    <div className="flex gap-2">
                      <p className="text-gray-500 border-b border-dashed border-gray-400 break-words whitespace-normal">
                        {order.pickupAddress.contactName}
                      </p>

                      <p className="cursor-pointer text-[#0CBB7D] relative group">
                        <i className="fas fa-info-circle"></i>

                        {/* Tooltip (Address Popup) */}
                        <div
                          className="absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 
                  transition-opacity duration-200 bg-white border border-gray-200 text-[11px] 
                  text-gray-700 p-3 rounded-md shadow-xl overflow-auto w-[300px] top-1/2 left-[20px] ml-2 transform -translate-y-1/2"
                          style={{
                            pointerEvents: "none", // prevent stealing focus
                          }}
                        >
                          {/* Arrow */}
                          <div
                            className="absolute -left-2 top-3 w-3 h-3 rotate-45 bg-white border-t border-l border-gray-200 shadow-sm"
                            style={{ pointerEvents: "none" }}
                          ></div>

                          {/* Address Information */}
                          <p className="font-semibold text-[10px]">Address:</p>
                          <p className="break-words text-[10px]">
                            {order.pickupAddress.address}
                          </p>
                          <p className="text-[10px]">
                            {order.pickupAddress.state},{" "}
                            {order.pickupAddress.city},{" "}
                            {order.pickupAddress.pinCode}
                          </p>
                        </div>
                      </p>
                    </div>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "150px", width: "100px" }}>
                    <p>{order.courierServiceName}</p>
                    <p className="text-[10px]">
                      Booked on:{" "}
                      {new Date(order.shipmentCreatedAt).toLocaleDateString()}
                    </p>

                    <p>
                      AWB#{" "}
                      <span
                        className="text-[#0CBB7D] cursor-pointer"
                        onClick={() => handleTrackingByAwb(order.awb_number)}
                      >
                        {order.awb_number}
                      </span>
                    </p>
                  </td>



                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="px-2 py-1 rounded text-[10px] bg-green-100 text-green-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "100px", width: "80px" }}>
                    <div className="relative" ref={(el) => { if (el) dropdownRefs.current[index] = el }}>
                      <button
                        ref={(el) => { if (el) toggleButtonRefs.current[index] = el }}
                        className="px-2 py-2 flex items-center justify-center bg-[#0CBB7D] text-white rounded-full"
                        onClick={() => {
                          // if (
                          //   isSidebarAdmin ||
                          //   employeeAccess.isAdmin ||
                          //   employeeAccess.canAction
                          // ) {
                          toggleDropdown(index);
                          // } else {
                          //   setShowEmployeeAuthModal(true);
                          // }
                        }}
                      >
                        <FiMoreHorizontal className="text-[12px]" />
                      </button>

                      {dropdownOpen === index && (
                        <div className={`absolute right-0 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-50
  ${dropdownDirection[index] === 'up' ? 'bottom-full mb-2' : 'mt-2'}`}>
                          <ul className="py-2">
                            <li className="px-3 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
                              <button onClick={(e) => { handleInvoice(order._id); e.stopPropagation(); setDropdownOpen(null) }}>
                                Download Invoice
                              </button>
                            </li>
                            <li className="px-3 py-2 text-gray-500 hover:bg-gray-100 cursor-pointer">
                              <button onClick={(e) => {
                                handleManifest(order._id);
                                e.stopPropagation(); // Prevent dropdown from closing
                                setDropdownOpen(null); // Close dropdown after action
                              }}>
                                Download Manifest
                              </button>
                            </li>
                            <li className="px-3 py-2 text-gray-500 hover:bg-gray-100 cursor-pointer">
                              {order.provider === "Amazon Shipping" ? (
                                <a
                                  href={order.label}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <button onClick={(e) => {
                                    e.stopPropagation();
                                    setDropdownOpen(null); // Close dropdown after action
                                  }}>Download Label</button>
                                </a>
                              ) : (
                                <button onClick={(e) => {
                                  handleLabel(order._id);
                                  e.stopPropagation(); // Prevent dropdown from closing
                                  setDropdownOpen(null); // Close dropdown after action
                                }}>
                                  Download Label
                                </button>
                              )}
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="text-center py-6 text-gray-500">
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
      {!isSidebarAdmin && showEmployeeAuthModal && (
        <EmployeeAuthModal
          employeeModalShow={showEmployeeAuthModal}
          employeeModalClose={() => setShowEmployeeAuthModal(false)}
        />
      )}

      {/* Mobile View: Display Orders as Cards */}
      <div className="md:hidden w-full space-y-4">
        <div className="p-1 bg-slate-200 rounded-md flex gap-3 items-center">
          <input
            type="checkbox"
            checked={
              selectedOrders.length === orders.length && orders.length > 0
            }
            onChange={handleSelectAll}
            className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
          />
          <span className="text-[10px] font-[600]">Select All</span>
        </div>
        <div>
          {loading ? (
            <ThreeDotLoader />
          ) : orders.length > 0 ? (
            orders.map((order, index) => (
              // <div
              //   key={index}
              //   className="bg-white border border-gray-300 rounded-lg shadow-md p-2 w-full max-w-[400px] mx-auto"
              // >
              <div
                key={index}
                className="text-black mt-3 bg-green-50 p-3 rounded-lg border-1 border-[#2d054b] shadow-md"
              >
                <div className="flex justify-between items-center">
                  {/* Left Section: Checkbox & Order ID */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleCheckboxChange(order._id)}
                      className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                    />
                    <span className="flex">
                      <p className="font-medium mt-1 text-[10px]">Order ID: </p>

                      <Link
                        to={`/dashboard/order/neworder/updateOrder/${order._id}`}
                        className="text-[#0CBB7D] font-medium mt-1 text-[10px] cursor-pointer"
                      >
                        {order.orderId}
                      </Link>
                      <p className="ml-2 font-medium px-2 py-1 text-[10px] bg-green-200 text-green-700 rounded">
                        {order.status}
                      </p>
                    </span>
                  </div>
                  <div
                    className="relative"
                    ref={(el) => (dropdownRefs.current[index] = el)}
                  >
                    <button
                      className="px-3 py-2 text-gray-700 rounded-lg text-[10px]"
                      onClick={() => toggleDropdown(index)}
                    >
                      <FiMoreHorizontal size={20} className="text-black" />
                    </button>
                    {dropdownOpen === index && (
                      <>
                        <div
                          className="fixed inset-0 z-40 md:hidden"
                          onClick={() => setDropdownOpen(null)}
                        >
                          {" "}
                        </div>
                        <div className="absolute right-0 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <ul className="text-[10px] font-[600]">
                            <li className="px-3 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
                              <button onClick={() => handleManifest(order._id)}>
                                Download Manifest
                              </button>
                            </li>
                            <li className="px-3 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
                              <button onClick={() => handleInvoice(order._id)}>
                                Download Invoice
                              </button>
                            </li>
                            <li className="px-3 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
                              {order.provider === "Amazon Shipping" ? (
                                <a
                                  href={order.label}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <button>Download Label</button>
                                </a>
                              ) : (
                                <button onClick={() => handleLabel(order._id)}>
                                  Download Label
                                </button>
                              )}
                            </li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between bg-green-200 p-3 rounded-lg shadow-md gap-3">
                  {/* Courier Logo & Details */}
                  <div className="flex items-center gap-3">
                    <img
                      src={carrierLogos[order.provider] || Shadowfax}
                      alt={order.courierServiceName}
                      className="w-8 h-8 rounded-full border-2 border-gray-400"
                    />
                    <div>
                      <p className="text-[10px] font-semibold text-gray-800">
                        {order.courierServiceName}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        AWB:{" "}
                        <span
                          onClick={() => handleTrackingByAwb(order.awb_number)}
                          className="text-[#0CBB7D] text-[10px] cursor-pointer font-medium"
                        >
                          {order.awb_number}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="text-right">
                    <p className="text-[10px] text-[#2d054b] truncate max-w-[100px]">
                      {order?.paymentDetails?.method || "N/N"}
                    </p>
                    <p className="text-[10px] truncate max-w-[100px]">
                      ₹{order?.paymentDetails?.amount || "N/N"}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] mt-2 mb-1 text-gray-500">
                  <span>Booked on: </span>
                  <span>
                    {new Date(order.shipmentCreatedAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  {order.channel === "api" && (
                    <span className="text-[10px] text-gray-700 font-medium">
                      {order?.channelId}
                    </span>
                  )}
                  <span className="text-[10px] uppercase font-medium text-gray-700 bg-green-200 px-2 py-1 rounded">
                    {order?.channel || "CUSTOM"}
                  </span>
                </div>
                <div>
                  <p className="text-gray-600 text-[10px] mt-1">
                    Applicable Weight:{" "}
                    <strong>
                      {order.packageDetails.applicableWeight || 0} KG
                    </strong>
                  </p>
                </div>
                <div className="flex justify-between items-center mt-1 text-[10px]">
                  <div>
                    <p className="text-gray-700 text-[10px]">
                      {order?.pickupAddress?.pinCode || "N/N"}
                    </p>
                    <p className="text-gray-600 text-[10px]">
                      {order?.pickupAddress?.city || "N/N"},
                      {order?.pickupAddress?.state || "N/N"}
                    </p>
                    {/* <p className="text-gray-700 font-medium text-[10px] text-center truncate max-w-[100px]">
                              {order?.pickupAddress?.contactName || "N/N"}
                            </p> */}
                  </div>
                  <span className="text-gray-500 text-[12px] mb-2 ">→</span>
                  <div className="text-right">
                    <p className="text-gray-700 text-[10px]">
                      {order?.receiverAddress?.pinCode || "N/N"}
                    </p>
                    <p className="text-gray-600 text-[10px]">
                      {order?.receiverAddress?.city || "N/N"},
                      {order?.receiverAddress?.state || "N/N"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center h-20">
              <div className="flex flex-col items-center justify-center">
                <img
                  src={NotFound}
                  alt="No Data Found"
                  className="w-60 h-60 object-contain mb-2"
                />

              </div>
            </div>
          )}
        </div>
      </div>
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
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="py-2 px-3 bg-gray-300 rounded disabled:opacity-50"
          >
            <FiArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntransitOrders;
