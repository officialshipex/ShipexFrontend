import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ChevronDown } from "lucide-react";
import RemittanceDetails from "./RemittanceDetails";
import NotFound from "../../assets/nodatafound.png"
import {
  FiCreditCard,
  FiTrendingUp,
  FiDollarSign,
  FiMinusCircle,
  FiArrowRightCircle,
  FiArrowRight,
  FiArrowLeft,
} from "react-icons/fi";
import { FaFilter, FaBars } from "react-icons/fa";
import DateFilter from "../../filter/DateFilter";
import "react-date-range/dist/styles.css"; // main css file
import "react-date-range/dist/theme/default.css"; // theme css file
import dayjs from "dayjs";
import ThreeDotLoader from "../../Loader";
import Cookies from "js-cookie";
import PaginationFooter from "../../Common/PaginationFooter";


const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const Remittance = () => {
  const [dateRange, setDateRange] = useState(null);
  const [category, setCategory] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [remited, setremited] = useState({});
  const [page, setPage] = useState(1); // Track current page
  const [limit, setLimit] = useState(20); // You can make this dynamic if needed
  const [loading, setLoading] = useState(true);
  const [remitedData, setremitedData] = useState([]);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [userNameFilter, setUserNameFilter] = useState("");
  const [remittanceIdFilter, setRemittanceIdFilter] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [utrFilter, setUtrFilter] = useState("");
  const [selectedRemittanceIds, setSelectedRemittanceIds] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || "");
  const statusDropdownRef = useRef();
  const [openRemittancePopup, setOpenRemittancePopup] = useState(false);
  const [selectedRemittanceId, setSelectedRemittanceId] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileActionDropdownOpen, setMobileActionDropdownOpen] = useState(false);
  const mobileActionRef = useRef(null);
  const [showStatusDropdownMobile, setShowStatusDropdownMobile] = useState(false);
  const statusDropdownRefMobile = useRef(null);



  const openRemittanceDetails = (id) => {
    setSelectedRemittanceId(id);
    setOpenRemittancePopup(true);
  };

  const statusOptions = [
    // { value: "", label: "All Status" },
    { value: "Paid", label: "Paid" },
    { value: "Pending", label: "Pending" },
  ];
  const { id } = useParams()
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Desktop status dropdown
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }

      // Mobile status dropdown
      if (
        statusDropdownRefMobile.current &&
        !statusDropdownRefMobile.current.contains(event.target)
      ) {
        setShowStatusDropdownMobile(false);
      }

      if (mobileActionRef.current && !mobileActionRef.current.contains(event.target)) {
        setMobileActionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusSelect = (value) => {
    setStatusFilter(value);
    setSelectedStatus(value);
    setShowStatusDropdown(false);
  };

  const selectedLabel = statusOptions.find((opt) => opt.value === selectedStatus)?.label;

  useEffect(() => {
    const remitancedata = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("session");

        // console.log("-----", fromDate, toDate);
        let url = `${REACT_APP_BACKEND_URL}/cod/codRemittanceData?page=${page}`;
        if (limit) url += `&limit=${limit}`;
        if (remittanceIdFilter)
          url += `&remittanceIdFilter=${remittanceIdFilter}`;
        if (utrFilter) url += `&utrFilter=${utrFilter}`;
        if (statusFilter) url += `&statusFilter=${statusFilter}`;
        if (dateRange?.[0]) {
          url += `&fromDate=${dateRange[0].startDate.toISOString()}`;
          url += `&toDate=${dateRange[0].endDate.toISOString()}`;
        }


        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            id
          }
        });
        // console.log("resososo datata:", response.data);
        if (response.data.success) {
          setremited(response.data.data);
          setremitedData(response.data.data.remittanceData);
          setTotalPages(response.data.totalPages);
        }
      } catch (error) {
        console.log("Error fetching remittance data:", error);
      } finally {
        setLoading(false);
      }
    };
    remitancedata();
  }, [
    refresh,
    remittanceIdFilter,
    utrFilter,
    statusFilter,
    dateRange,
    page,
    limit,
    category,
  ]);

  const formatDate = (dateString) => { const date = new Date(dateString); return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", }); };


  const handleCheckboxChange = (id) => {
    setSelectedRemittanceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  const handleExport = async () => {
    try {
      const token = Cookies.get("session");

      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/cod/exportOrderInRemittance`,
        {
          params: { ids: selectedRemittanceIds },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const exportData = response.data.orders;

      const flattenedData = exportData.map((order) => ({
        "Order ID": order.orderId || "",
        "Courier Service": order.courierServiceName || "",
        "AWB Number": order.awb_number || "",
        "Payment Method": order.paymentMethod || "",
        "Payment Amount": order.paymentAmount || 0,
        "Delivery Date": order.deliveryDate || "",
      }));

      // Convert JSON to worksheet
      const worksheet = XLSX.utils.json_to_sheet(flattenedData);

      // Set column widths (width is approx. number of characters)
      worksheet["!cols"] = [
        { wch: 15 }, // Order ID
        { wch: 25 }, // Courier Service
        { wch: 20 }, // AWB Number
        { wch: 15 }, // Payment Method
        { wch: 18 }, // Payment Amount
        { wch: 25 }, // Delivery Date
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Remittance Orders");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const data = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(
        data,
        `remittance_orders_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  return (
    <div className="">
      {/* Header Cards */}

      {/* Desktop View: grid */}
      <div className="hidden lg:grid grid-cols-5 gap-2 mb-2">
        {[
          {
            label: "COD To Be Remitted",
            value: `₹${(Number(remited?.CODToBeRemitted) || 0).toFixed(2)}`,
            icon: <FiCreditCard className="text-white" size={14} />,
          },
          {
            label: "Last COD Remitted",
            value: `₹${(Number(remited?.LastCODRemitted) || 0).toFixed(2)}`,
            icon: <FiArrowRightCircle className="text-white" size={14} />,
          },
          {
            label: "Total COD Remitted",
            value: `₹${(Number(remited?.TotalCODRemitted) || 0).toFixed(2)}`,
            icon: <FiTrendingUp className="text-white" size={14} />,
          },
          {
            label: "Total Deduction from COD",
            value: `₹${(Number(remited?.TotalDeductionfromCOD) || 0).toFixed(2)}`,
            icon: <FiMinusCircle className="text-white" size={14} />,
          },
          {
            label: "Remittance Initiated",
            value: `₹${(Number(remited?.RemittanceInitiated) || 0).toFixed(2)}`,
            icon: <FiDollarSign className="text-white" size={14} />,
          },
        ].map((card, index) => (
          <div
            key={index}
            className="border border-[#0CBB7D] rounded-lg px-3 py-2 bg-white flex items-center gap-2"
          >
            <div className="flex-shrink-0 bg-[#0CBB7D] p-2 rounded-full">{card.icon}</div>
            <div className="flex flex-col">
              <div className="font-[600] text-[12px] text-gray-700">
                {card.value}
              </div>
              <div className="text-[12px] font-[600] text-gray-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile View: single box */}
      <div className="block lg:hidden border border-[#0CBB7D] rounded-lg px-3 py-2 bg-white text-[12px] font-[600] text-gray-500 mb-2 space-y-1">
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

      {/* filter data */}
      <div>
        <div className="hidden sm:flex items-center gap-2 w-full mb-2">
          {/* Search by Remittance ID */}
          <input
            type="text"
            placeholder="Search by Remittance ID"
            className="w-full md:w-[200px] py-2 px-3 text-[12px] font-[600] border outline-none focus:ring-1 focus:ring-[#0CBB7D] text-gray-700 rounded-lg focus:outline-none"
            value={remittanceIdFilter}
            onChange={(e) => setRemittanceIdFilter(e.target.value)}
          />

          {/* Search by UTR */}
          <input
            type="text"
            placeholder="Search by UTR"
            className="w-full md:w-[200px] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D] py-2 px-3 text-[12px] font-[600] border rounded-lg focus:outline-none"
            value={utrFilter}
            onChange={(e) => setUtrFilter(e.target.value)}
          />

          {/* Status Filter */}
          <div className="relative w-full sm:w-[140px]" ref={statusDropdownRef}>
            <button
              onClick={() => setShowStatusDropdown((prev) => !prev)}
              type="button"
              className={`w-full py-2 px-3 rounded-lg font-[600] text-left text-[12px] bg-white
    flex items-center justify-between text-gray-400
    border
    ${showStatusDropdown || selectedStatus
                  ? "border-[#0CBB7D]"
                  : ""
                }
  `}
            >
              {statusFilter === "" ? "Status" : selectedLabel}
              <ChevronDown
                className={`w-4 h-4 transform transition-transform ${showStatusDropdown ? "rotate-180" : ""
                  }`}
              />
            </button>


            {showStatusDropdown && (
              <ul className="absolute z-30 w-full font-[600] text-gray-500 mt-1 bg-white border rounded-lg overflow-y-auto text-[12px]">
                {statusOptions.map((item) => (
                  <li
                    key={item.value}
                    className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${selectedStatus === item.value ? "bg-gray-100 font-medium" : ""
                      }`}
                    onClick={() => handleStatusSelect(item.value)}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Date Filter */}
          <DateFilter
            onDateChange={(range) => {
              setDateRange(range);
              setPage(1); // reset pagination
            }}
          />

          {/* Buttons */}
          <div className="flex gap-2 ml-auto">
            <button
              className="flex items-center border justify-center md:justify-end bg-[#0CBB7D] text-white px-3 sm:h-9 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] hover:bg-[#0aa96f] transition-all duration-200"
              onClick={() => {
                setRemittanceIdFilter("");
                setUtrFilter("");
                setStatusFilter("");
                setDateRange("");
              }}
            >
              Clear
            </button>

            <button
              disabled={selectedRemittanceIds.length === 0}
              className={`flex items-center border-2 border-gray-100 justify-center ${selectedRemittanceIds.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#0CBB7D]"
                } text-white px-3 py-2 sm:h-9 rounded-lg text-[10px] sm:text-[12px] font-[600] transition-all duration-200 md:w-auto`}
              onClick={handleExport}
            >
              Export
            </button>
          </div>
        </div>

        {/* Mobile Filters */}
        <div className="md:hidden mb-2">
          {/* Top Row: Search + Filter Button + Actions */}
          <div className="flex items-center justify-between gap-2 relative">
            <input
              type="text"
              placeholder="Search by Remittance ID"
              value={remittanceIdFilter}
              onChange={(e) => setRemittanceIdFilter(e.target.value)}
              className="flex-1 py-1.5 px-3 text-[12px] font-[600] border rounded-lg focus:outline-none focus:border-[#0CBB7D] text-gray-700 h-[34px]"
            />

            <button
              className="px-3 flex items-center justify-center text-white bg-[#0CBB7D] h-[34px] rounded-lg transition text-[12px] font-[600]"
              onClick={() => setShowMobileFilters((prev) => !prev)}
            >
              <FaFilter className="text-white size={14}" />
            </button>

            <div ref={mobileActionRef}>
              <button
                className={`px-3 h-[34px] border rounded-lg font-[600] flex items-center gap-1 ${selectedRemittanceIds.length === 0
                  ? "border-gray-300 text-[12px] cursor-not-allowed text-gray-400"
                  : "text-[#0CBB7D] border-[#0CBB7D] text-[12px]"
                  }`}
                onClick={() =>
                  selectedRemittanceIds.length > 0 &&
                  setMobileActionDropdownOpen(!mobileActionDropdownOpen)
                }
                disabled={selectedRemittanceIds.length === 0}
              >
                <FaBars
                  className={`sm:hidden 
                    ${selectedRemittanceIds.length === 0
                      ? "text-gray-400"
                      : "text-[#0CBB7D]"
                    }`}
                />
                <span className="hidden sm:inline">Actions▼</span>
              </button>
              {mobileActionDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                  <ul className="py-2 font-[600]">
                    <li
                      className="px-3 py-2 text-gray-700 hover:bg-green-100 cursor-pointer text-[10px]"
                      onClick={handleExport}
                    >
                      Export
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Filters */}
          <div
            className={`transition-all duration-300 ease-in-out ${showMobileFilters ? "max-h-[1000px] overflow-visible" : "max-h-0 overflow-hidden"
              }`}
          >
            <div className="flex flex-col gap-2 overflow-visible mt-2">
              {/* UTR */}
              <input
                type="text"
                placeholder="Search by UTR"
                value={utrFilter}
                onChange={(e) => setUtrFilter(e.target.value)}
                className="w-full py-2 px-3 text-[12px] font-[600] border rounded-lg focus:outline-none focus:border-[#0CBB7D] text-gray-700 h-9"
              />

              {/* Date Filter */}
              <DateFilter
                onDateChange={(range) => {
                  setDateRange(range);
                  setPage(1);
                }}
              />

              {/* Status Filter */}
              <div className="relative" ref={statusDropdownRefMobile}>
                <button
                  onClick={() => setShowStatusDropdownMobile((prev) => !prev)}
                  className={`w-full py-2 px-3 rounded-lg font-[600] text-[12px] bg-white border
      flex items-center justify-between text-gray-400
      ${showStatusDropdownMobile || selectedStatus ? "border-[#0CBB7D]" : ""}`}
                >
                  {selectedStatus || "Status"}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showStatusDropdownMobile ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {showStatusDropdownMobile && (
                  <div className="absolute z-40 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
                    {statusOptions.map((item) => (
                      <div
                        key={item.value}
                        className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-100 cursor-pointer"
                        onClick={() => {
                          handleStatusSelect(item.value);
                          setShowStatusDropdownMobile(false);
                        }}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>


              {/* Actions */}
              <button
                className="px-3 mb-2 bg-[#0CBB7D] py-2 text-[12px] font-[600] rounded-lg text-white border hover:opacity-90 transition"
                onClick={() => {
                  setRemittanceIdFilter("");
                  setUtrFilter("");
                  setStatusFilter("");
                  setSelectedStatus("");
                  setDateRange(null);
                  setShowMobileFilters(false);
                }}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Select All Checkbox on Mobile */}
        <div className="block sm:hidden mt-2">
          <div className="px-2 py-1 bg-green-200 rounded-lg flex items-center gap-2">
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
              className="cursor-pointer accent-[#0CBB7D] w-3"
            />
            <span className="text-[10px] font-[600] text-gray-500">Select All</span>
          </div>
        </div>
      </div>


      <div className="hidden md:block mt-2">
        <div className="relative overflow-x-auto bg-white overflow-y-auto h-[calc(100vh-380px)]">
          <table
            className="min-w-full border-collapse"
          >
            {/* Table Head */}
            <thead className="sticky top-0 z-20 bg-[#0CBB7D]">
              <tr className="text-white bg-[#0CBB7D] text-[12px] font-[600]">
                <th className="py-2 px-3 text-left bg-[#0CBB7D]">
                  <div className="flex">
                    <input
                      type="checkbox"
                      checked={
                        selectedRemittanceIds.length === remitedData.length &&
                        remitedData.length > 0
                      }
                      onClick={(e) => {
                        if (e.target.checked) {
                          setSelectedRemittanceIds(
                            remitedData.map((row) => row.remittanceId)
                          );
                        } else {
                          setSelectedRemittanceIds([]);
                        }
                      }}
                      className="cursor-pointer accent-[#0CBB7D] w-3"
                    />
                    {/* <div className="ml-2">Date</div> */}
                  </div>
                </th>
                <th className="py-2 px-3 text-left">Date</th>
                <th className="py-2 px-3 text-center" style={{ width: "150px", maxWidth: "200px" }}>Remittance ID</th>
                <th className="py-2 px-3 text-center" style={{ width: "80px", maxWidth: "130px" }}>UTR</th>
                <th className="py-2 px-3 text-center" style={{ width: "150px", maxWidth: "200px" }}>COD Available</th>
                <th className="py-2 px-3 text-center" style={{ width: "200px", maxWidth: "250px" }}>Amount Credited to Wallet</th>
                <th className="py-2 px-3 text-center" style={{ width: "150px", maxWidth: "200px" }}>Adjusted Amount</th>
                <th className="py-2 px-3 text-center" style={{ width: "150px", maxWidth: "200px" }}>Early COD Charges</th>
                <th className="py-2 px-3 text-center" style={{ width: "150px", maxWidth: "200px" }}>Remittance Amount</th>
                <th className="py-2 px-3 text-center" style={{ width: "150px", maxWidth: "200px" }}>Remittance Method</th>
                <th className="py-2 px-3 text-left">Status</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-6">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : remitedData.length > 0 ? (
                remitedData.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 border-gray-300 text-gray-500 transition-all text-[12px] font-[400] relative"
                  >
                    <td className="py-2 px-3 whitespace-nowrap align-middle">
                      <div className="flex">
                        <input
                          type="checkbox"
                          checked={selectedRemittanceIds.includes(
                            row.remittanceId
                          )}
                          onChange={() => handleCheckboxChange(row.remittanceId)}
                          className="cursor-pointer accent-[#0CBB7D] w-3"
                        />
                        {/* <div className="ml-2">{formatDate(row.date)}</div> */}
                      </div>
                    </td>
                    <td className="py-2 px-3 whitespace-normal" style={{ width: "150px", maxWidth: "200px" }}>{formatDate(row.date)}</td>
                    <td className="py-2 px-3 whitespace-normal" style={{ width: "150px", maxWidth: "200px" }}>
                      <div
                        onClick={() => openRemittanceDetails(row.remittanceId)}
                        className="text-[#0CBB7D] font-[600] text-center hover:underline cursor-pointer"
                      >
                        {row.remittanceId}
                      </div>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap text-center" style={{ width: "80px", maxWidth: "130px" }}>
                      {row?.utr || "N/N"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center" style={{ width: "150px", maxWidth: "200px" }}>
                      {`₹${(Number(row?.orderDetails?.codcal) || 0).toFixed(2)}`}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center" style={{ width: "200px", maxWidth: "250px" }}>
                      {`₹${(Number(row?.amountCreditedToWallet) || 0).toFixed(
                        2
                      )}`}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center" style={{ width: "150px", maxWidth: "200px" }}>
                      {`₹${(Number(row.adjustedAmount) || 0).toFixed(2)}`}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center" style={{ width: "150px", maxWidth: "200px" }}>
                      {`₹${(Number(row.earlyCodCharges) || 0).toFixed(2)}`}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center" style={{ width: "150px", maxWidth: "200px" }}>
                      {`₹${(Number(row.codAvailable) || 0).toFixed(2)}`}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center" style={{ width: "150px", maxWidth: "200px" }}>
                      {row.remittanceMethod}
                    </td>
                    <td
                      className={`py-2 px-3 whitespace-nowrap`}
                    >
                      <p className={`text-[10px] px-2 py-1 rounded-lg text-center font-[600] ${row.status === "Paid"
                        ? "text-[#0CBB7D] bg-green-200"
                        : row.status === "Pending"
                          ? "text-orange-500 bg-orange-200"
                          : ""
                        }`}>{row.status}</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-4 text-gray-500">
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

      {/* Mobile View */}
      <div className="md:hidden space-y-2 mt-2 h-[calc(100vh-240px)] overflow-y-auto">
        {loading ? (
          <ThreeDotLoader />
        ) : remitedData.length > 0 ? (

          remitedData.map((row, index) => (
            <div
              key={index}
              className="bg-green-100 text-gray-500 rounded-lg p-3 mt-2"
            >
              <div className="">
                <div className="flex justify-between">
                  <div className="flex text-[10px] font-[400]">
                    <input
                      type="checkbox"
                      checked={selectedRemittanceIds.includes(row.remittanceId)}
                      onChange={() => handleCheckboxChange(row.remittanceId)}
                      className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                    />
                    <p className="ml-2">Date:</p>
                    <p className="text-gray-500 ml-2">{formatDate(row.date)}</p>
                  </div>
                  <div>
                    <p
                      className={`text-[10px] font-[400] ${row.status === "Pending" ? "text-red-500" : "text-[#0CBB7D]"
                        }`}
                    >
                      {row.status}
                    </p>

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
                <div className="flex">
                  <p className="text-[10px] font-[400] ml-5">UTR:</p>
                  <p className="ml-2 text-[10px] font-[400] text-gray-500">
                    {row.utr}
                  </p>
                </div>
                <div className="mt-2 bg-white rounded-lg p-3 text-[10px] font-[400]">
                  {/* Individual amounts */}
                  <div className="flex justify-between items-center">
                    <p className="text-gray-700 text-[10px] font-[400] text-left">
                      Total COD:
                    </p>
                    <p className="text-right text-[#0CBB7D]">{`₹${(
                      row.amountCreditedToWallet +
                      row.earlyCodCharges +
                      row.adjustedAmount +
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
                    <p className="text-right text-red-600">{`₹${(
                      row.adjustedAmount || 0
                    ).toFixed(2)}`}</p>
                  </div>
                  {/* Divider */}
                  <div className="border-t my-1"></div>

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <p className="text-left text-[12px] font-[400]">
                      {" "}
                      COD Available:
                    </p>
                    <p className="text-right text-[#0CBB7D]">{`₹${(
                      row.codAvailable || 0
                    ).toFixed(2)}`}</p>
                  </div>
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
            {/* <p className="text-gray-500 text-sm">No orders found.</p> */}
          </div>
        )}
      </div>

      {/* Pagination */}
      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        limit={limit}
        setLimit={setLimit}
      />


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

export default Remittance;