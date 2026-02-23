import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import dayjs from "dayjs";
import { ChevronDown, Filter } from "lucide-react";
import { FiCopy, FiCheck, FiMoreHorizontal } from "react-icons/fi";
import { FaBars } from "react-icons/fa";
import ThreeDotLoader from "../../../../Loader";
import Cookies from "js-cookie";
import { Notification } from "../../../../Notification";
import PaginationFooter from "../../../../Common/PaginationFooter";
import SharedWeightDiscrepancyTable from "../SharedWeightDiscrepancyTable";
import SharedWeightDiscrepancyCard from "../SharedWeightDiscrepancyCard";
import UserFilter from "../../../../filter/UserFilter";
import DateFilter from "../../../../filter/DateFilter";
import DiscrepancyFilterPanel from "../../../../Common/DiscrepancyFilterPanel";


const CompleteWeightDiscrepancy = () => {
  const [orders, setOrders] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [localSelectedUserId, setLocalSelectedUserId] = useState(null);
  const [clearTrigger, setClearTrigger] = useState(false);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState(null);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchBy, setSearchBy] = useState("awbNumber");
  const [inputValue, setInputValue] = useState("");
  const [selectedDispute, setSelectedDispute] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedCourier, setSelectedCourier] = useState([]);
  const [courierOptions, setCourierOptions] = useState([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(null);

  const desktopActionRef = useRef(null);
  const mobileActionRef = useRef(null);

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
  }, [selectedUserId, dateRange, page, limit, inputValue, searchBy, selectedCourier]);

  const fetchDiscrepancy = async () => {
    try {
      const token = Cookies.get("session");
      setLoading(true);
      const params = {
        userSearch: selectedUserId || "",
        page,
        limit,
        courierService: selectedCourier?.length > 0 ? selectedCourier.join(",") : "",
        status: "Accepted"
      };

      if (dateRange?.[0]) {
        params.fromDate = dateRange[0].startDate.toISOString();
        params.toDate = dateRange[0].endDate.toISOString();
      }

      if (inputValue?.trim()) {
        params[searchBy] = inputValue.trim();
      }

      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/dispreancy/getAllDiscrepancy`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: params
        }
      );
      const totalCount = response.data.total || 0;
      const results = response.data.results || [];
      setOrders(results);
      setTotal(totalCount);
      setTotalPages(Math.ceil(totalCount / limit));

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

  const handleCopyAwb = (awb, id) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(id);
    setTimeout(() => setCopiedAwb(null), 1500);
  };

  const handleClearFilters = () => {
    setInputValue("");
    setSearchBy("awbNumber");
    setDateRange(null);
    setSelectedCourier([]);
    setSelectedUserId(null);
    setLocalSelectedUserId(null);
    setClearTrigger(prev => prev + 1);
    setIsFilterPanelOpen(false);
    setPage(1);
  };

  const isAnyFilterApplied = inputValue || selectedCourier.length > 0 || dateRange || selectedUserId;

  const handleSelectAll = () => {
    if (selectedDispute.length === orders.length && orders.length > 0) {
      setSelectedDispute([]);
    } else {
      setSelectedDispute(orders.map((order) => order._id));
    }
  };

  const handleCheckboxChange = (orderId) => {
    setSelectedDispute((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleExport = async () => {
    if (selectedDispute.length === 0) {
      Notification("Please select at least one order to export.", "info");
      return;
    }

    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/dispreancy/exportWeightDiscrepancy`,
        { disputeId: selectedDispute },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "weight_discrepancy_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Notification("Export successful!", "success");
    } catch (error) {
      Notification("Failed to export data.", "error");
    }
  };

  return (
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
              disabled={selectedDispute.length === 0}
              onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
              className={`h-9 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 border transition-all ${selectedDispute.length > 0
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
                  onClick={() => { handleExport(); setDesktopDropdownOpen(false); }}
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

      <div className="hidden md:block relative">
        <SharedWeightDiscrepancyTable
          orders={orders}
          loading={loading}
          isAdmin={true}
          selectedOrders={selectedDispute}
          handleSelectAll={handleSelectAll}
          handleCheckboxChange={handleCheckboxChange}
          handleTrackingByAwb={handleTrackingByAwb}
          handleCopyAwb={handleCopyAwb}
          copiedAwb={copiedAwb}
          actionsColumnTitle={null}
          renderActions={null}
        />
      </div>

      {/* Mobile View: Display Orders as Cards */}
      <div className="block md:hidden">
        <div className="p-2 justify-between bg-white rounded-lg flex gap-2 items-center border border-gray-100 mb-2 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-100 flex-1">
            <input
              type="checkbox"
              checked={selectedDispute.length === orders.length && orders.length > 0}
              onChange={handleSelectAll}
              className="accent-[#0CBB7D] w-3 h-3"
            />
            <span className="text-[10px] font-[600] text-gray-700 tracking-wider">Select All</span>
          </div>

          <div className="relative" ref={mobileActionRef}>
            <button
              disabled={selectedDispute.length === 0}
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              className={`h-[30px] px-3 rounded-lg flex items-center justify-center border transition-all ${selectedDispute.length > 0
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
                  onClick={() => { handleExport(); setMobileDropdownOpen(false); }}
                >
                  Export
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4 h-[calc(100vh-255px)] overflow-y-auto pr-1">
          <SharedWeightDiscrepancyCard
            orders={orders}
            loading={loading}
            isAdmin={true}
            selectedOrders={selectedDispute}
            handleCheckboxChange={handleCheckboxChange}
            handleTrackingByAwb={handleTrackingByAwb}
            handleCopyAwb={handleCopyAwb}
            copiedAwb={copiedAwb}
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
        onClearFilters={handleClearFilters}
        onApplyFilters={(filters) => {
          setInputValue(filters.searchInput);
          setSearchBy(filters.searchType);
          setSelectedCourier(filters.selectedCourier);
          setSelectedUserId(localSelectedUserId);
          setPage(1);
          setIsFilterPanelOpen(false);
        }}
      >
        <div className="space-y-1">
          <label className="text-[12px] font-[600] text-gray-700">Search User</label>
          <UserFilter
            onUserSelect={setLocalSelectedUserId}
            clearTrigger={clearTrigger}
          />
        </div>
      </DiscrepancyFilterPanel>

      {/* Pagination Controls */}
      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        limit={limit}
        setLimit={setLimit}
      />
    </div >
  );
};

export default CompleteWeightDiscrepancy;
