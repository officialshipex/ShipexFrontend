import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { ChevronDown, Filter } from "lucide-react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { FaBars } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ThreeDotLoader from "../../../Loader";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";
import PaginationFooter from "../../../Common/PaginationFooter";
import DateFilter from "../../../filter/DateFilter";
import DiscrepancyFilterPanel from "../../../Common/DiscrepancyFilterPanel";
import { getCarrierLogo } from "../../../Common/getCarrierLogo";
import NotFound from "../../../assets/nodatafound.png";

const AllDiscrepancy = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchBy, setSearchBy] = useState("awbNumber");
  const [inputValue, setInputValue] = useState("");
  const [clearTrigger, setClearTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selectedCourier, setSelectedCourier] = useState([]);
  const [courierOptions, setCourierOptions] = useState([]);
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(null);
  const desktopActionRef = useRef(null);
  const mobileActionRef = useRef(null);
  const { id } = useParams();

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopActionRef.current && !desktopActionRef.current.contains(event.target)) {
        setDesktopDropdownOpen(false);
      }
      if (mobileActionRef.current && !mobileActionRef.current.contains(event.target)) {
        setMobileDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchDiscrepancy();
  }, [dateRange, page, limit, inputValue, searchBy, selectedCourier, status]);

  const fetchDiscrepancy = async () => {
    try {
      const token = Cookies.get("session");
      setLoading(true);
      const params = {
        id,
        page,
        limit,
        courierServiceName: selectedCourier.length > 0 ? selectedCourier.join(",") : undefined,
        status // empty = all
      };

      if (dateRange?.[0]) {
        params.fromDate = dateRange[0].startDate.toISOString();
        params.toDate = dateRange[0].endDate.toISOString();
      }

      if (inputValue?.trim()) {
        params[searchBy] = inputValue.trim();
      }

      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/dispreancy/allDispreancyById`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: params
        }
      );
      const results = response.data.results || [];
      setOrders(results);
      setTotalPages(response.data.page || 0);
      const uniqueCouriers = [...new Set(results.map(o => o.courierServiceName).filter(Boolean))];
      setCourierOptions(uniqueCouriers);
      setLoading(false);
    } catch (error) {
      Notification("Error fetching transactions", "error");
      setLoading(false);
    }
  };

  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  const handleClearFilters = () => {
    setInputValue("");
    setSearchBy("awbNumber");
    setDateRange(null);
    setSelectedCourier([]);
    setStatus("");
    setClearTrigger(prev => prev + 1);
    setIsFilterPanelOpen(false);
    setPage(1);
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length && orders.length > 0) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((order) => order._id));
    }
  };

  const handleCheckboxChange = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleExportExcel = () => {
    if (selectedOrders.length === 0) {
      Notification("No orders selected for export.", "info");
      return;
    }

    const exportData = orders
      .filter(order => selectedOrders.includes(order._id))
      .map(order => ({
        "Order ID": order.orderId,
        "Order Status": order.status,
        "Order Date": new Date(order.createdAt).toLocaleString(),
        "Sender Name": order.pickupAddress?.contactName,
        "Receiver Name": order.receiverAddress?.contactName,
        "Courier": order.courierServiceName,
        "AWB Number": order.awbNumber,
        "Applied Weight": `${order.enteredWeight?.applicableWeight} Kg`,
        "Charged Weight": `${order.chargedWeight?.applicableWeight} Kg`,
        "Excess Charges": order.excessWeightCharges?.excessCharges,
        "Pending Amount": order.excessWeightCharges?.pendingAmount
      }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "all_discrepancies.xlsx");
  };

  const handleCopyAwb = (awb, id) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(id);
    setTimeout(() => setCopiedAwb(null), 1500);
  };

  const isAnyFilterApplied = inputValue || selectedCourier.length > 0 || dateRange || status;

  // Status badge colour helper
  const getStatusStyle = (s) => {
    if (!s) return "bg-gray-100 text-gray-600";
    const lower = s.toLowerCase();
    if (lower.includes("accept")) return "bg-green-100 text-green-700";
    if (lower.includes("decline")) return "bg-red-100 text-red-600";
    if (lower.includes("dispute") || lower.includes("raised")) return "bg-yellow-100 text-yellow-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div>
      {/* Desktop Table */}
      <div className="w-full">

        {/* ── Desktop Filter Bar ── */}
        <div className="hidden md:flex gap-2 mb-2 items-center">
          <DateFilter
            onDateChange={(range) => {
              setDateRange(range);
              setPage(1);
            }}
            clearTrigger={clearTrigger}
            noInitialFilter={true}
          />

          {/* Status filter pill */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-lg text-[12px] font-[600] border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 transition-all shadow-sm focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="Accepted">Accepted</option>
            <option value="Discrepancy Raised">Discrepancy Raised</option>
            <option value="Discrepancy Declined">Discrepancy Declined</option>
          </select>

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
                className={`h-9 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 border transition-all ${selectedOrders.length > 0
                  ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50"
                  : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
              >
                Actions
                <ChevronDown className={`w-4 h-4 transition-transform ${desktopDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {desktopDropdownOpen && (
                <div className="absolute right-0 mt-1 animate-popup-in bg-white border-2 border-gray-100 rounded-lg shadow-xl w-36 text-[12px] z-[100] overflow-hidden">
                  <div
                    className="px-3 py-2 hover:bg-green-100 cursor-pointer font-[600] text-gray-500"
                    onClick={() => { handleExportExcel(); setDesktopDropdownOpen(false); }}
                  >
                    Export
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile Filter Bar ── */}
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

          {/* Mobile status filter */}
          <div className="flex gap-2 mt-2">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="flex-1 h-[32px] px-2 rounded-lg text-[11px] font-[600] border border-gray-300 bg-white text-gray-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="Accepted">Accepted</option>
              <option value="Discrepancy Raised">Discrepancy Raised</option>
              <option value="Discrepancy Declined">Discrepancy Declined</option>
            </select>
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

        {/* ── Desktop Table ── */}
        <div className="hidden md:block relative">
          <div className="relative overflow-x-auto bg-white overflow-y-auto h-[calc(100vh-295px)]">
            <table className="w-full text-left border-collapse">
              {/* Table Head */}
              <thead className="sticky top-0 z-20 bg-[#0CBB7D]">
                <tr className="text-white text-[12px] font-[600]">
                  <th className="py-2 px-3">
                    <div className="flex justify-center items-center">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                        onChange={handleSelectAll}
                        className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                      />
                    </div>
                  </th>
                  <th className="py-2 px-3">Product Details</th>
                  <th className="py-2 px-3">Upload On</th>
                  <th className="py-2 px-3">Shipping Details</th>
                  <th className="py-2 px-3">Applied Weight</th>
                  <th className="py-2 px-3">Charged Weight</th>
                  <th className="py-2 px-3">Excess Weight & Charges</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <ThreeDotLoader />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="flex flex-col items-center justify-center">
                        <img
                          src={NotFound}
                          alt="No Data Found"
                          className="w-60 h-60 object-contain mb-2"
                        />
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr key={index} className="text-[12px] border-b text-gray-500">
                      {/* Checkbox */}
                      <td className="py-2 px-3 relative align-middle">
                        <div className="flex justify-center items-center">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => handleCheckboxChange(order._id)}
                            className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                          />
                        </div>
                      </td>

                      {/* Product Details with hover tooltip */}
                      <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "200px", width: "180px" }}>
                        {(() => {
                          const products = order.productDetails || [];
                          const names = products.map(p => p.name).join(", ") || "-";
                          const skus = products.map(p => p.sku).join(", ") || "-";
                          const totalQty = products.reduce((sum, p) => sum + (p.quantity || 0), 0);

                          const truncateText = (text, limit = 18) =>
                            text.length > limit ? text.slice(0, limit) + "..." : text;

                          return (
                            <div className="relative space-y-1">
                              {/* NAME — hover source */}
                              <div className="relative group inline-block max-w-full">
                                <p className="inline-block max-w-full cursor-pointer border-b border-dashed border-gray-400 group-hover:border-gray-600">
                                  {truncateText(names)}
                                </p>

                                {/* TOOLTIP */}
                                <div className="absolute z-[200] hidden group-hover:block
                                                                    bg-white text-gray-700 text-[10px]
                                                                    p-2 rounded shadow-2xl w-[280px] border
                                                                    top-1/2 left-full ml-2
                                                                    transform -translate-y-1/2
                                                                    whitespace-normal select-text pointer-events-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="text-left border-b">
                                        <th className="pb-1 pr-2 font-semibold">Name</th>
                                        <th className="pb-1 pr-2 font-semibold">SKU</th>
                                        <th className="pb-1 font-semibold">Qty</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {products.map((p, idx) => (
                                        <tr key={idx} className="border-b last:border-0">
                                          <td className="py-1 pr-2 break-words">{p.name}</td>
                                          <td className="py-1 pr-2 break-words">{p.sku}</td>
                                          <td className="py-1">{p.quantity}</td>
                                        </tr>
                                      ))}
                                      <tr className="font-semibold border-t">
                                        <td colSpan={2} className="pt-1">Total</td>
                                        <td className="pt-1">{totalQty}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>

                                {/* INVISIBLE HOVER BRIDGE */}
                                <div className="absolute left-full top-0 w-3 h-full"></div>
                              </div>

                              <p>SKU: {truncateText(skus, 14)}</p>
                              <p>QTY: {totalQty}</p>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Upload On */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <p>{dayjs(order.createdAt).format("hh:mm A")}</p>
                        <p>{dayjs(order.createdAt).format("DD MMM YYYY")}</p>
                      </td>

                      {/* Shipping Details */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <p className="text-gray-700">{order.courierServiceName}</p>
                        <div className="flex items-center gap-1 group">
                          <span
                            onClick={() => handleTrackingByAwb(order.awbNumber)}
                            className="text-[#0CBB7D] font-[600] cursor-pointer hover:underline"
                          >
                            {order.awbNumber}
                          </span>
                          <button
                            onClick={() => handleCopyAwb(order.awbNumber, `desk-${index}`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-green-50 rounded"
                          >
                            {copiedAwb === `desk-${index}` ? (
                              <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                            ) : (
                              <FiCopy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Applied Weight */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <p className="font-[600]">Applied weight: {order.enteredWeight?.applicableWeight} Kg</p>
                        <p>Dead Weight: {order.enteredWeight?.deadWeight} Kg</p>
                        <div className="text-gray-500">
                          <p>Volumetric weight:</p>
                          <p>
                            {(
                              ((order.enteredWeight?.volumetricWeight?.length || 0) *
                                (order.enteredWeight?.volumetricWeight?.breadth || 0) *
                                (order.enteredWeight?.volumetricWeight?.height || 0)) /
                              5000
                            ).toFixed(2)}{" "}
                            Kg (
                            {order.enteredWeight?.volumetricWeight?.length || 0}cm x{" "}
                            {order.enteredWeight?.volumetricWeight?.breadth || 0}cm x{" "}
                            {order.enteredWeight?.volumetricWeight?.height || 0}cm)
                          </p>
                        </div>
                      </td>

                      {/* Charged Weight */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <p className="font-[600]">
                          Charged weight: {order.chargedWeight?.applicableWeight} Kg
                        </p>
                        <p>Dead Weight: {order.chargedWeight?.deadWeight} Kg</p>
                        {order.chargedDimension?.length && order.chargedDimension?.breadth && order.chargedDimension?.height && (
                          <p className="text-gray-500">
                            Volumetric weight:{" "}
                            {(
                              (order.chargedDimension?.length *
                                order.chargedDimension?.breadth *
                                order.chargedDimension?.height) /
                              5000
                            ).toFixed(2)}{" "}
                            Kg (
                            {order.chargedDimension?.length}cm x{" "}
                            {order.chargedDimension?.breadth}cm x{" "}
                            {order.chargedDimension?.height}cm)
                          </p>
                        )}
                      </td>

                      {/* Excess Weight & Charges */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <p className="font-[600]"><span>Excess Weight:</span> {order.excessWeightCharges?.excessWeight} Kg</p>
                        <p>
                          <span>Excess Charges:</span>{" "}
                          ₹{Number(order.excessWeightCharges?.excessCharges || 0).toFixed(2)}
                        </p>
                        <p>
                          <span>Pending Amount:</span>
                          ₹{Number(order.excessWeightCharges?.pendingAmount || 0).toFixed(2)}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-[10px] ${getStatusStyle(order.status)}`}>
                          {order?.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile View ── */}
        <div className="block md:hidden">
          <div className="p-2 justify-between bg-white rounded-lg flex gap-2 items-center border border-gray-100 mb-2 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-100 flex-1">
              <input
                type="checkbox"
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onChange={handleSelectAll}
                className="accent-[#0CBB7D] w-3 h-3"
              />
              <span className="text-[10px] font-[600] text-gray-700 tracking-wider">Select All</span>
            </div>

            <div className="relative" ref={mobileActionRef}>
              <button
                disabled={selectedOrders.length === 0}
                onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                className={`h-[30px] px-3 rounded-lg flex items-center justify-center border transition-all ${selectedOrders.length > 0
                  ? "border-[#0CBB7D] text-[#0CBB7D] bg-white shadow-sm"
                  : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
              >
                <FaBars className="w-3 h-3" />
              </button>
              {mobileDropdownOpen && (
                <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-40 text-[11px] z-[100] overflow-hidden">
                  <div
                    className="px-3 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                    onClick={() => { handleExportExcel(); setMobileDropdownOpen(false); }}
                  >
                    Export
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 h-[calc(100vh-250px)] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <ThreeDotLoader />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <img src={NotFound} alt="Not Found" className="w-60 h-60" />
              </div>
            ) : (
              orders.map((order, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden text-[10px]">

                  {/* 1️⃣ HEADER ROW */}
                  <div className="flex justify-between items-center px-3 py-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleCheckboxChange(order._id)}
                        className="accent-[#0CBB7D] w-3 h-3"
                      />

                      <div className="flex items-center gap-1">
                        <span className="font-[600] text-gray-700 text-[10px]">
                          Order Id : <span className="font-[600] text-[#0CBB7D]">{order.orderId || order._id?.slice(-6)}</span>
                        </span>

                        <button
                          onClick={() => handleCopyAwb(order.orderId || order._id?.slice(-6), `order-${index}`)}
                        >
                          {copiedAwb === `order-${index}` ? (
                            <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                          ) : (
                            <FiCopy className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusStyle(order.status)}`}>
                        {order?.status}
                      </span>
                    </div>
                  </div>

                  {/* 2️⃣ WEIGHT DETAILS */}
                  <div className="px-3 py-1 text-[10px] flex justify-between items-center text-gray-700">
                    <div>
                      <span className="font-[600] text-red-600">
                        Charged Weight: {order.chargedWeight?.applicableWeight} Kg
                      </span>
                    </div>
                    <div className="font-[600]">
                      Applied Weight: {order.enteredWeight?.applicableWeight} Kg
                    </div>
                  </div>

                  {/* 3️⃣ DATE */}
                  <div className="px-3 py-1 flex justify-between items-center border-b text-[10px]">
                    <span className="text-gray-700">
                      Upload On : {new Date(order.createdAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>

                  {/* 4️⃣ SHIPMENT DETAILS */}
                  <div className="px-3 py-1 flex justify-between items-center bg-green-50">
                    {/* Left Side */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 shadow-sm border">
                        <img
                          src={getCarrierLogo(order.courierServiceName || "")}
                          alt="carrier"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex flex-col text-[10px]">
                        <span className="font-[600] text-gray-700">
                          {order.courierServiceName}
                        </span>

                        <div className="flex items-center gap-1">
                          <span
                            onClick={() => handleTrackingByAwb(order.awbNumber)}
                            className="text-[#0CBB7D] font-[600] cursor-pointer"
                          >
                            {order.awbNumber}
                          </span>

                          <button onClick={() => handleCopyAwb(order.awbNumber, `awb-${index}`)}>
                            {copiedAwb === `awb-${index}` ? (
                              <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                            ) : (
                              <FiCopy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Side Amount */}
                    <div className="text-[#0CBB7D] font-[600] text-[10px]">
                      ₹{Number(order?.excessWeightCharges?.pendingAmount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Filter Panel */}
        <DiscrepancyFilterPanel
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
          searchInput={inputValue}
          searchType={searchBy}
          selectedCourier={selectedCourier}
          courierOptions={courierOptions}
          onClearFilters={handleClearFilters}
          onApplyFilters={(filters) => {
            setInputValue(filters.searchInput);
            setSearchBy(filters.searchType);
            setSelectedCourier(filters.selectedCourier);
            setPage(1);
            setIsFilterPanelOpen(false);
          }}
        />

        {/* Pagination Controls */}
        <PaginationFooter
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          limit={limit}
          setLimit={setLimit}
        />
      </div>
    </div>
  );
};

export default AllDiscrepancy;
