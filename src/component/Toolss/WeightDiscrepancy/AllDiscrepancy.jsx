import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { ChevronDown, Filter } from "lucide-react";
import { FiCopy, FiCheck, FiMoreHorizontal } from "react-icons/fi";
import { FaBars } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ThreeDotLoader from "../../../Loader";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";
import PaginationFooter from "../../../Common/PaginationFooter";
import SharedWeightDiscrepancyTable from "./SharedWeightDiscrepancyTable";
import SharedWeightDiscrepancyCard from "./SharedWeightDiscrepancyCard";
import DateFilter from "../../../filter/DateFilter";
import DiscrepancyFilterPanel from "../../../Common/DiscrepancyFilterPanel";
import { getCarrierLogo } from "../../../Common/getCarrierLogo";
import UploadImageModal from "./UploadImageModal";
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
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [disputeAwbNumber, setDisputeAwbNumber] = useState(null);
  const desktopActionRef = useRef(null);
  const mobileActionRef = useRef(null);
  const dropdownRefs = useRef([]);
  const toggleButtonRefs = useRef([]);
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

  const toggleDropdown = (index) => {
    setTimeout(() => {
      setDropdownOpen((prev) => (prev === index ? null : index));
    }, 0);
  };

  const handleDiscrepancy = async (awb_number) => {
    setLoading(true);
    try {
      const token = Cookies.get("session");
      const payload = { awb_number };
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/dispreancy/acceptDiscrepancy`,
        payload,
        { headers: { authorization: `Bearer ${token}` } }
      );
      Notification(response.data.message, "success");
      fetchDiscrepancy();
    } catch (error) {
      Notification(error.response?.data?.message || "Error", "error");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPopup = (awb) => {
    setDisputeAwbNumber(awb);
    setIsOpen(true);
  };

  const isAnyFilterApplied = inputValue || selectedCourier.length > 0 || dateRange || status;



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

        <SharedWeightDiscrepancyTable
          orders={orders}
          loading={loading}
          isAdmin={false}
          selectedOrders={selectedOrders}
          handleSelectAll={handleSelectAll}
          handleCheckboxChange={handleCheckboxChange}
          handleTrackingByAwb={handleTrackingByAwb}
          handleCopyAwb={handleCopyAwb}
          copiedAwb={copiedAwb}
          actionsColumnTitle="Actions"
          renderActions={(order, index) => (
            order.status?.toLowerCase() === "new" ? (
              <>
                <div className="relative" ref={(el) => { if (el) dropdownRefs.current[index] = el }}></div>
                <button
                  ref={(el) => { if (el) toggleButtonRefs.current[index] = el; }}
                  className={`text-gray-700 rounded-lg text-[10px] p-2 bg-gray-100 transition-colors ${dropdownOpen === index ? 'bg-green-100' : ''}`}
                  onClick={() => toggleDropdown(index)}
                >
                  <FiMoreHorizontal size={16} className={dropdownOpen === index ? "text-[#0CBB7D]" : "text-gray-700"} />
                </button>

                {dropdownOpen === index && (
                  <div className="absolute right-6 animate-popup-in mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <ul className="text-[10px] font-[600]">
                      <li className="px-3 py-2 text-gray-500 hover:bg-green-100 cursor-pointer">
                        <button onClick={(e) => { handleDiscrepancy(order.awbNumber); e.stopPropagation(); setDropdownOpen(null); }} disabled={loading}>
                          {loading ? "Processing..." : "Accept Discrepancy"}
                        </button>
                      </li>
                      <li className="px-3 py-2 text-gray-500 hover:bg-green-100 cursor-pointer">
                        <button onClick={(e) => { handleOpenPopup(order.awbNumber); e.stopPropagation(); setDropdownOpen(null); }}>
                          Raise Discrepancy
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <span className="text-gray-400 font-bold">-</span>
            )
          )}
        />

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
            <SharedWeightDiscrepancyCard
              orders={orders}
              loading={loading}
              isAdmin={false}
              selectedOrders={selectedOrders}
              handleCheckboxChange={handleCheckboxChange}
              handleTrackingByAwb={handleTrackingByAwb}
              handleCopyAwb={handleCopyAwb}
              copiedAwb={copiedAwb}
              renderActions={(order, index) => (
                order.status?.toLowerCase() === "new" && (
                  <>
                    <button onClick={() => toggleDropdown(index)}>
                      <FiMoreHorizontal size={18} className="text-gray-600" />
                    </button>

                    {dropdownOpen === index && (
                      <div className="absolute animate-popup-in right-0 top-6 w-[130px] bg-white border rounded-lg shadow-lg z-50 flex flex-col items-start px-0 text-left">
                        <ul className="text-[10px] font-[600] text-gray-600 w-full text-left">
                          <li
                            className="px-3 py-2 hover:bg-green-50 cursor-pointer w-full text-left"
                            onClick={() => { handleDiscrepancy(order.awbNumber); setDropdownOpen(null); }}
                          >
                            Accept Discrepancy
                          </li>
                          <li
                            className="px-3 py-2 hover:bg-green-50 cursor-pointer border-t w-full text-left"
                            onClick={() => { handleOpenPopup(order.awbNumber); setDropdownOpen(null); }}
                          >
                            Raise Discrepancy
                          </li>
                        </ul>
                      </div>
                    )}
                  </>
                )
              )}
            />
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
          status={status}
          showStatus={true}
          onClearFilters={handleClearFilters}
          onApplyFilters={(filters) => {
            setInputValue(filters.searchInput);
            setSearchBy(filters.searchType);
            setSelectedCourier(filters.selectedCourier);
            setStatus(filters.status);
            setPage(1);
            setIsFilterPanelOpen(false);
          }}
        />

        <PaginationFooter
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          limit={limit}
          setLimit={setLimit}
        />

        {/* Upload Image Modal */}
        {isOpen && (
          <UploadImageModal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            disputeAwbNumber={disputeAwbNumber}
          />
        )}
      </div>
    </div>
  );
};

export default AllDiscrepancy;
