import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUpload } from "react-icons/fa";
import CodUploadPoopup from "./CodUploadPoopup";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { DateRange } from "react-date-range";
import { ChevronDown } from "lucide-react";
import dayjs from "dayjs";
// import toast from "react-hot-toast";
import TranseferCODModal from "./TransferCODModal";
import Cookies from "js-cookie";
import { Notification } from "../../Notification"
import RemittanceDetails from "./SellerRemittanceDatas";

import {
  FiCheckCircle,
  FiCreditCard,
  FiClock,
  FiArrowRight,
  FiArrowLeft,
  FiArrowRightCircle,
  FiTrendingUp,
  FiDollarSign,
  FiMinusCircle,
} from "react-icons/fi";
import ThreeDotLoader from "../../Loader"
const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CODRemittanceOrder = ({ isSidebarAdmin }) => {
  const [page, setPage] = useState(1); // Track current page
  const [limit, setLimit] = useState(20); // You can make this dynamic if needed
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalremitted, setTotalRemitted] = useState(0);
  const [remited, setRemited] = useState(0);
  const [paidremitted, setPaidRemitted] = useState(0);
  const [upload, setUpload] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refresh, setRefresh] = useState(false);
  const rowsPerPage = 10;
  // const [remited, setremited] = useState({});
  const [remitedData, setremitedData] = useState([]);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [userNameFilter, setUserNameFilter] = useState("");
  const [remittanceIdFilter, setRemittanceIdFilter] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRemittanceIds, setSelectedRemittanceIds] = useState([]);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userQuery, setUserQuery] = useState("");
  const [employeeAccess, setEmployeeAccess] = useState({
    isAdmin: false,
    canView: false,
    canAction: false,
  });
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const dateRef = useRef(null);
  const calendarRef = useRef(null);
  const statusRef = useRef(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [dateRange, setDateRange] = useState([
    { startDate: null, endDate: null, key: "selection" },
  ]);
  const [showTransferCODModal, setShowTransferCODModal] = useState(false);  // modal visibility
  const [transferCODUserId, setTransferCODUserId] = useState(null);                 // remittanceId to pass
  const [openRemittancePopup, setOpenRemittancePopup] = useState(false);
  const [selectedRemittanceId, setSelectedRemittanceId] = useState(null);


  const openRemittanceDetails = (id) => {
    setSelectedRemittanceId(id);
    setOpenRemittancePopup(true);
  };

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

  const dateOptions = [
    {
      label: "Today",
      range: () => ({
        startDate: dayjs().startOf("day").toDate(),
        endDate: dayjs().endOf("day").toDate(),
      }),
    },
    {
      label: "Yesterday",
      range: () => ({
        startDate: dayjs().subtract(1, "day").startOf("day").toDate(),
        endDate: dayjs().subtract(1, "day").endOf("day").toDate(),
      }),
    },
    {
      label: "Last 7 Days",
      range: () => ({
        startDate: dayjs().subtract(6, "day").startOf("day").toDate(),
        endDate: dayjs().endOf("day").toDate(),
      }),
    },
    {
      label: "Last 30 Days",
      range: () => ({
        startDate: dayjs().subtract(29, "day").startOf("day").toDate(),
        endDate: dayjs().endOf("day").toDate(),
      }),
    },
    {
      label: "Last Week",
      range: () => ({
        startDate: dayjs().subtract(1, "week").startOf("week").toDate(),
        endDate: dayjs().subtract(1, "week").endOf("week").toDate(),
      }),
    },
    {
      label: "Last Month",
      range: () => ({
        startDate: dayjs().subtract(1, "month").startOf("month").toDate(),
        endDate: dayjs().subtract(1, "month").endOf("month").toDate(),
      }),
    },
    {
      label: "This Year",
      range: () => ({
        startDate: dayjs().startOf("year").toDate(),
        endDate: dayjs().endOf("day").toDate(),
      }),
    },
    {
      label: "Custom",
      custom: true,
    },
  ];


  // const handleDateApply = () => {
  //   // const selected = tempDateRange[0];
  //   // setDateRange(tempDateRange);
  //   setFilters((prev) => ({
  //     ...prev,
  //     dateRange: {
  //       startDate: format(selected.startDate, "yyyy-MM-dd"),
  //       endDate: format(selected.endDate, "yyyy-MM-dd"),
  //     },
  //   }));
  //   setShowCustom(false);
  //   setShowDropdown(false);
  // };
  const [tempDateRange, setTempDateRange] = useState([
    { startDate: null, endDate: null, key: "selection" },
  ]);
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
            !!employee?.accessRights?.finance?.["Seller COD Remittance"]?.view;
          const canAction =
            !!employee?.accessRights?.finance?.["Seller COD Remittance"]
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
        let url = `${REACT_APP_BACKEND_URL}/cod/getAdminCodRemitanceData?page=${page}`;
        if (limit) url += `&limit=${limit}`;
        if (selectedUserId) url += `&selectedUserId=${selectedUserId}`;
        if (remittanceIdFilter)
          url += `&remittanceIdFilter=${remittanceIdFilter}`;
        if (statusFilter) url += `&statusFilter=${statusFilter}`;
        // ✅ Append startDate and endDate if available
        const startDate = dateRange[0]?.startDate;
        const endDate = dateRange[0]?.endDate;
        if (startDate && endDate) {
          url += `&startDate=${encodeURIComponent(startDate.toISOString())}`;
          url += `&endDate=${encodeURIComponent(endDate.toISOString())}`;
        }
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // console.log("Remittance Data:", response.data);
        if (response.status === 200) {
          // setTotalRemitted(response.data.data.totalCODAmount);
          // setPendingRemitted(response.data.data.pendingCODAmount);
          setRemited(response.data.summary);
          setremitedData(response.data.results);
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
    page,
    limit,
    refresh,
    selectedUserId,
    remittanceIdFilter,
    statusFilter,
    dateRange
  ]);

  const handleCodRemittanceUpload = () => {
    setUpload(true);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Function to format date with day name
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Pagination logic

  // const lastCODRemitted =
  //   currentRows.length > 0 ? currentRows[0].codAvailable : 0;
  const handleCheckboxChange = (id) => {
    setSelectedRemittanceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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

  // The main function to export selected remittances to Excel
  const handleExport = () => {
    if (selectedRemittanceIds.length === 0) {
      alert("Please select at least one row to export.");
      return;
    }

    const exportData = remitedData.filter(
      (item) => selectedRemittanceIds.includes(item.remittanceId) // <-- Match this key with your data
    );

    const formattedData = exportData.map((row) => ({
      Date: formatDate(row.date),
      "User name": row.user.name,
      "Remittance ID": row.remittanceId,
      "UTR": row.utr || "N/A",
      "COD Available": row?.codAvailable || 0,
      "Amount Credited to Wallet": row.amountCreditedToWallet,
      "Early COD Charges": row.earlyCodCharges,
      "Adjusted Amount": row.adjustedAmount,
      "Remittance Amount": row.remittanceInitiated,
      Status: row.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    worksheet["!cols"] = [
      { wch: 25 }, // Date
      { wch: 20 }, // Remittance ID
      { wch: 20 }, // COD Available
      { wch: 15 }, // Amount Credited to Wallet
      { wch: 18 }, // Early COD Charges
      { wch: 25 }, // Adjusted Amount
      { wch: 20 }, //Remittance Amount
      { wch: 15 }, // Status
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Remittance");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(fileData, "RemittanceExport.xlsx");

    // Optionally reset selection after download
    setSelectedRemittanceIds([]);
  };

  const handleTransferCOD = async () => {
    if (selectedRemittanceIds.length === 0) {
      alert("Please select at least one row to transfer COD.");
      return;
    }
    // console.log("Selected IDs for COD transfer:", selectedRemittanceIds);
    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/cod/validateCODTransfer`,
        { remittanceIds: selectedRemittanceIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // console.log("res", response.data)
      setTransferCODUserId(response.data.userId); // use backend-provided or first ID
      setShowTransferCODModal(true); // open modal
    } catch (error) {
      console.error("Error transferring COD:", error.response.data.message);
      Notification(error?.response?.data?.message || "An error occurred while transferring COD.", "error")
      // alert("An error occurred while transferring COD.");
    }
  };




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
      {(isSidebarAdmin || employeeAccess.isAdmin || employeeAccess.canView) && (
        <>
          {/* Header Cards */}
          {/* Header */}

          {/* Desktop View: grid */}
          <div className="hidden lg:grid grid-cols-5 gap-4 mb-2">
            {[
              {
                label: "COD To Be Remitted",
                value: `₹${(Number(remited?.CODToBeRemitted) || 0).toFixed(2)}`,
                icon: <FiCreditCard className="text-white" size={18} />,
              },
              {
                label: "Last COD Remitted",
                value: `₹${(Number(remited?.LastCODRemitted) || 0).toFixed(2)}`,
                icon: <FiArrowRightCircle className="text-white" size={18} />,
              },
              {
                label: "Total COD Remitted",
                value: `₹${(Number(remited?.TotalCODRemitted) || 0).toFixed(2)}`,
                icon: <FiTrendingUp className="text-white" size={18} />,
              },
              {
                label: "Total Deduction from COD",
                value: `₹${(Number(remited?.TotalDeductionfromCOD) || 0).toFixed(2)}`,
                icon: <FiMinusCircle className="text-white" size={18} />,
              },
              {
                label: "Remittance Initiated",
                value: `₹${(Number(remited?.RemittanceInitiated) || 0).toFixed(2)}`,
                icon: <FiDollarSign className="text-white" size={18} />,
              },
            ].map((card, index) => (
              <div
                key={index}
                className="border-2 border-[#0CBB7D] rounded-lg px-3 py-2 bg-white flex items-center gap-3"
              >
                <div className="flex-shrink-0 bg-[#0CBB7D] p-2 rounded-full">{card.icon}</div>
                <div className="flex flex-col">
                  <div className="font-[600] text-[10px] text-gray-700">
                    {card.value}
                  </div>
                  <div className="text-[10px] text-gray-500">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile View: single box */}
          <div className="block lg:hidden border-2 border-[#0CBB7D] rounded-lg px-4 py-2 bg-white text-[12px] font-[600] text-gray-500 mb-2 space-y-1">
            {[
              { label: "COD To Be Remitted", value: remited?.CODToBeRemitted },
              { label: "Last COD Remitted", value: remited?.LastCODRemitted },
              { label: "Total COD Remitted", value: remited?.TotalCODRemitted },
              { label: "Total Deduction from COD", value: remited?.TotalDeductionfromCOD },
              { label: "Remittance Initiated", value: remited?.RemittanceInitiated },
            ].map((item, idx) => (
              <div
                key={idx}
                className="grid"
                style={{ gridTemplateColumns: "180px 10px 1fr" }}
              >
                <span className="truncate">{item.label}</span>
                <span className="text-center">:</span>
                <span className="text-right">₹{(Number(item.value) || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            {/* desktop */}

            <div className="flex justify-between sm:flex-row flex-col w-full">
              <div className="flex gap-2 w-full sm:flex-row flex-col">
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

                <div className="flex gap-2">
                  {/* Search by Remittance ID */}
                  <input
                    type="text"
                    placeholder="Search by Remittance ID"
                    className="w-full md:w-[250px] h-9 px-3 text-[12px] font-[600] border-2 border-gray-300 placeholder:text-gray-400 text-gray-700 rounded-lg focus:outline-none placeholder:text-[12px]"
                    value={remittanceIdFilter}
                    onChange={(e) => setRemittanceIdFilter(e.target.value)}
                  />
                  {/* Date Filter */}
                  <div className="relative sm:w-[200px] w-full z-[20]" ref={dateRef}>
                    <button
                      className="w-full bg-white h-9 px-3 text-[12px] font-[600] border-gray-300 border-2 rounded-lg focus:outline-none text-left flex items-center justify-between text-gray-400"
                      onClick={() => {
                        setShowDropdown((prev) => !prev);
                        // setShowPickupDropdown(false);
                        // setShowPaymentTypeDropdown(false);
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
                        className="absolute -ml-28 w-full bg-white border rounded shadow p-2 z-[60] transition-all duration-600 ease-in-out"
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
                          className="custom-date-range w-[290px] h-[290px] text-xs"
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
                </div>

                <div className="flex gap-2 justify-between w-full">
                  {/* Status Dropdown */}
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
                  <div className="w-full gap-2 sm:w-auto mb-2 sm:mb-0 flex flex-row items-center sm:items-start justify-end">
                    <button
                      className="h-9 px-3 sm:text-[12px] text-[10px] border-2 border-gray-100 rounded-lg font-[600] text-white bg-[#0CBB7D] hover:bg-green-500 transition whitespace-nowrap"
                      onClick={() => {
                        setRemittanceIdFilter("");
                        setUserQuery("");
                        setStatusFilter("");
                        setSelectedUserId("");
                        setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
                      }}
                    >
                      Clear
                    </button>
                    <button
                      disabled={selectedRemittanceIds.length === 0}
                      className={`flex items-center justify-center ${selectedRemittanceIds.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#0CBB7D]"
                        } text-white px-3 h-9 border-2 border-gray-100 rounded-lg text-[10px] sm:text-[12px] font-[600] transition-all duration-200 w-full md:w-auto`}
                      onClick={handleExport}
                    >
                      Export
                    </button>
                    <button
                      disabled={selectedRemittanceIds.length === 0}
                      className={`flex items-center justify-center ${selectedRemittanceIds.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#0CBB7D]"
                        } text-white px-3 h-9 border-2 border-gray-100 rounded-lg text-[10px] sm:text-[12px] font-[600] transition-all duration-200 w-full md:w-auto`}
                      onClick={handleTransferCOD}
                    >
                      Transfer COD
                    </button>

                    <div
                      onClick={() => {
                        if (
                          isSidebarAdmin ||
                          employeeAccess.isAdmin ||
                          employeeAccess.canAction
                        ) {
                          handleCodRemittanceUpload();
                        } else {
                          setShowEmployeeAuthModal(true);
                        }
                      }}
                      className="flex flex-col items-center sm:items-start"
                    >
                      {/* <label
                        className={`cursor-pointer flex h-9 items-center gap-2 text-[10px] sm:text-[12px] font-[600] px-3 py-2 rounded-lg border-2 border-gray-100 transition
      ${isSidebarAdmin || employeeAccess.isAdmin || employeeAccess.canAction
                            ? "text-white bg-[#0CBB7D] border-[#0CBB7D] hover:bg-green-500"
                            : "text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed"
                          }`}
                      >
                        <FaUpload className="text-white text-[10px] sm:text-[12px] font-[600]" />
                        <span>Upload</span>
                      </label> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block relative mt-2">
            <table
              className="min-w-full 
         bg-white rounded-lg shadow-md table-auto"
            >
              {/* Table Head */}
              <thead>
                <tr className="text-white border border-[#0CBB7D] bg-[#0CBB7D] text-[12px] font-[600]">
                  <th className="py-2 px-3 text-left">
                    <div className="flex">
                      <input
                        type="checkbox"
                        checked={
                          selectedRemittanceIds.length === remitedData.length &&
                          remitedData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRemittanceIds(
                              remitedData.map((row) => row.remittanceId)
                            );
                          } else {
                            setSelectedRemittanceIds([]);
                          }
                        }}
                        className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                      />
                      <div className="ml-4">Date</div>
                    </div>
                  </th>
                  <th className="py-2 px-3 text-left">User</th>
                  <th className="py-2 px-3 text-center">Remittance ID</th>
                  <th className="py-2 px-3 text-center">UTR</th>
                  <th className="py-2 px-3 text-center">Total COD Amount</th>
                  <th className="py-2 px-3 text-center">
                    Amount Credited to Wallet
                  </th>
                  <th className="py-2 px-3 text-center">Adjusted Amount</th>
                  <th className="py-2 px-3 text-center">Early COD Charges</th>
                  <th className="py-2 px-3 text-center">Remittance Amount</th>
                  <th className="py-2 px-3 text-center">COD Status</th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-6">
                      <ThreeDotLoader />
                    </td>
                  </tr>
                ) : remitedData.length > 0 ? (
                  remitedData.map((row, index) => (
                    <tr
                      key={index}
                      className="border-t hover:bg-gray-50 border-gray-300 text-gray-500 transition-all text-[12px] font-[400] relative text-center"
                    >
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex">
                          <input
                            type="checkbox"
                            checked={selectedRemittanceIds.includes(
                              row.remittanceId
                            )}
                            onChange={() =>
                              handleCheckboxChange(row.remittanceId)
                            }
                            className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                          />
                          <div className="ml-4">{formatDate(row.date)}</div>
                        </div>
                      </td>
                      <td className="py-2 px-3 font-semibold whitespace-nowrap text-left">
                        {row.user.name}
                      </td>
                      <td className="py-2 px-3 whitespace-normal">
                        <div
                          onClick={() => openRemittanceDetails(row.remittanceId)}
                          className="text-[#0CBB7D] font-semibold hover:underline cursor-pointer"
                        >
                          {row.remittanceId}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[#0CBB7D] font-semibold whitespace-nowrap">
                        {row.utr}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {`₹${(Number(row?.codAvailable) || 0).toFixed(
                          2
                        )}`}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {`₹${(Number(row?.amountCreditedToWallet) || 0).toFixed(
                          2
                        )}`}
                      </td>
                      {/* <td className="py-2 px-3 whitespace-nowrap">
                    {`₹${(Number(row?.earlyCodCharges) || 0).toFixed(2)}`}
                  </td> */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {`₹${(Number(row.adjustedAmount) || 0).toFixed(2)}`}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {`₹${(Number(row.earlyCodCharges) || 0).toFixed(2)}`}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {`₹${(Number(row.remittanceInitiated) || 0).toFixed(2)}`}
                      </td>
                      <td
                        className={`py-2 px-3 whitespace-nowrap ${row.status === "Paid"
                          ? "text-green-600"
                          : row.status === "Pending"
                            ? "text-orange-500"
                            : ""
                          }`}
                      >
                        {row.status}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile View */}
          <div className="md:hidden space-y-2">
            <div className="block w-full sm:hidden">
              <div className="px-2 w-full py-1 bg-green-200 rounded-lg flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    selectedRemittanceIds.length === remitedData.length &&
                    remitedData.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRemittanceIds(
                        remitedData.map((row) => String(row.remittanceId))
                      );
                    } else {
                      setSelectedRemittanceIds([]);
                    }
                  }}
                  className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                />
                <span className="text-[10px] font-[600] text-gray-500">Select All</span>
              </div>
            </div>
            {remitedData.map((row, index) => (
              <div
                key={index}
                className="bg-green-100 shadow-md text-gray-500 rounded-lg p-3 mt-2"
              >
                <div className="mt-2">
                  <div className="flex justify-between items-start">
                    <div className="flex text-[10px] font-[400]">
                      <input
                        type="checkbox"
                        checked={selectedRemittanceIds.includes(
                          String(row.remittanceId)
                        )}
                        onChange={() => handleCheckboxChange(row.remittanceId)}
                        className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                      />
                      <p className="ml-2">Date:</p>
                      <p className="text-gray-500 ml-2">
                        {formatDate(row.date)}
                      </p>
                    </div>
                    <div className="flex">
                      <span
                        className={`text-[10px] font-[400] px-2 py-1 rounded-lg ${row.status === "Paid"
                          ? "bg-green-100 text-green-600"
                          : "bg-orange-100 text-orange-500"
                          }`}
                      >
                        {row.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex">
                    <p className="text-[10px] font-[400] ml-5">Remittance ID:</p>
                    <p
                      className="ml-2 text-[10px] font-[400] text-[#0CBB7D] hover:underline"
                      onClick={() => openRemittanceDetails(row.remittanceId)}
                    >
                      {row.remittanceId}
                    </p>
                  </div>

                  <div className="flex items-center mt-1 text-[10px] font-[400]">
                    <p className="font-semibold ml-5">User Name:</p>
                    <p className="ml-2 text-gray-700 font-[600] hover:underline truncate">
                      {row.user.name}
                    </p>
                  </div>

                  <div className="mt-2 bg-white rounded-lg p-3 text-[10px] font-[400]">
                    {/* Amount Details */}
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700 text-[10px] font-[400] text-left">Total COD:</p>
                      <p className="text-right text-[#0CBB7D]">{`₹${(
                        row.codAvailable
                      ).toFixed(2)}`}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">-</span>
                      <p className="text-[10px] font-[400] text-gray-500 text-left flex-1 pl-2">
                        Amount Credited to Wallet:
                      </p>
                      <p className="text-right text-red-600">{`₹${(
                        row.amountCreditedToWallet || 0
                      ).toFixed(2)}`}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">-</span>
                      <p className="text-[10px] font-[400] text-gray-500 text-left flex-1 pl-2">
                        Early COD Charges:
                      </p>
                      <p className="text-right text-red-600">{`₹${(
                        row.earlyCodCharges || 0
                      ).toFixed(2)}`}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 ">-</span>
                      <p className="text-[10px] font-[400] text-gray-500 text-left flex-1 pl-2">
                        Adjusted Amount:
                      </p>
                      <p className="text-red-600 text-right">{`₹${(
                        row.adjustedAmount || 0
                      ).toFixed(2)}`}</p>
                    </div>

                    {/* Divider */}
                    <div className="border-t my-1"></div>

                    {/* Final COD Available */}
                    <div className="flex justify-between items-center">
                      <p className="text-left text-[12px] font-[400]">Remittance Amount:</p>
                      <p className="text-right text-[#0CBB7D]">{`₹${(
                        row.remittanceInitiated || 0
                      ).toFixed(2)}`}</p>
                    </div>
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
                    setLimit("all"); // null means no limit
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
            <CodUploadPoopup
              onClose={() => setUpload(false)}
              setRefresh={setRefresh}
            />
          )}


        </>
      )}

      {showTransferCODModal &&
        <TranseferCODModal id={transferCODUserId} selectedRemittanceIds={selectedRemittanceIds} onClose={() => setShowTransferCODModal(false)} />
      }

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
            <RemittanceDetails remittanceId={selectedRemittanceId} />

          </div>
        </div>
      )}

    </div>
  );
};

export default CODRemittanceOrder;
