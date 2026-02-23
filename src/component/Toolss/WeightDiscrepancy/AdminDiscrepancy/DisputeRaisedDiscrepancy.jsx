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
import DiscrepancyFilterPanel from "../../../../Common/DiscrepancyFilterPanel";
import UserFilter from "../../../../filter/UserFilter";
import DateFilter from "../../../../filter/DateFilter";
import DetailsModal from "./DetailsModal";
import AcceptDiscrepancy from "./AcceptDiscrepancy";
import DeclinePopup from "./DeclinePopup";

const DisputeRaisedDiscrepancy = ({ refresh, setRefresh, canAction }) => {
  const [orders, setOrders] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [clearTrigger, setClearTrigger] = useState(false);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState(null);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchBy, setSearchBy] = useState("awbNumber");
  // const [inputValue, setInputValue] = useState("");
  // const [selectedDispute, setSelectedDispute] = useState([]);
  // const [totalPages, setTotalPages] = useState(0);

  const [localSelectedUserId, setLocalSelectedUserId] = useState(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const desktopActionRef = useRef(null);
  const mobileActionRef = useRef(null);
  const [selectedCourier, setSelectedCourier] = useState([]);
  const [courierOptions, setCourierOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedDispute, setSelectedDispute] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  const [isOpen, setIsOpen] = useState(false);
  const [isOpen1, setIsOpen1] = useState(false);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [selectedData, setSelectedData] = useState({});
  const [disputeAwbNumber, setDisputeAwbNumber] = useState();
  const [acceptAwb, setAcceptAwb] = useState("");
  const [copiedAwb, setCopiedAwb] = useState(null);

  const handleCopyAwb = (awb, id) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(id);
    setTimeout(() => setCopiedAwb(null), 1500);
  };

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiscrepancy();
  }, [selectedUserId, dateRange, page, limit, inputValue, searchBy, selectedCourier]);

  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const token = Cookies.get("session");
        const res = await axios.get(`${REACT_APP_BACKEND_URL}/dispreancy/getAllDiscrepancyCourier`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success && Array.isArray(res.data.data)) {
          setCourierOptions(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch courier services", err);
      }
    };
    fetchCouriers();
  }, []);

  const fetchDiscrepancy = async () => {
    try {
      const token = Cookies.get("session");
      setLoading(true);
      const params = {
        userSearch: selectedUserId || "",
        page,
        limit,
        courierService: selectedCourier?.length > 0 ? selectedCourier.join(",") : "",
        status: "Discrepancy Raised"
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
      setOrders(response.data.results || []);
      setTotal(totalCount);
      setTotalPages(Math.ceil(totalCount / limit));
      setLoading(false);
    } catch (error) {
      Notification("Error fetching transactions", "error");
      setLoading(false);
    }
  };

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

  const handleBulkDecline = () => {
    if (selectedDispute.length === 0) {
      Notification("Please select at least one dispute to decline.", "info");
      return;
    }
    const selectedAwbNumbers = orders
      .filter((order) => selectedDispute.includes(order._id))
      .map((o) => o.awbNumber);
    setDisputeAwbNumber(selectedAwbNumbers);
    setIsOpen1(true);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopActionRef.current && !desktopActionRef.current.contains(event.target)) {
        setDesktopDropdownOpen(false);
      }
      if (mobileActionRef.current && !mobileActionRef.current.contains(event.target)) {
        setMobileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  const handleOpenModal = (text, imageUrl) => {
    setSelectedData({ text, imageUrl });
    setIsModalOpen1(true);
  };

  const handleOpenPopup = (awb) => {
    setAcceptAwb(awb);
    setIsOpen(true);
  };

  const handleDeclinePopup = (awb) => {
    setDisputeAwbNumber([awb]);
    setIsOpen1(true);
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
                <div
                  className="px-3 py-2 hover:bg-red-100 cursor-pointer font-[600] text-red-500"
                  onClick={() => { handleBulkDecline(); setDesktopDropdownOpen(false); }}
                >
                  Decline
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
          detailsColumnTitle="Details"
          renderDetails={(order, index) => (
            <div className="flex justify-center w-full">
              <button
                onClick={() => handleOpenModal(order.text, order.imageUrl)}
                className="text-[#0CBB7D] font-[600] text-[12px] underline hover:bg-opacity-90 transition"
              >
                Details
              </button>
            </div>
          )}
          actionsColumnTitle="Actions"
          renderActions={(order, index) => (
            <div className="flex flex-col gap-1 items-center justify-center w-full">
              <button
                onClick={() => handleOpenPopup(order.awbNumber)}
                className="w-16 bg-[#0CBB7D] text-white px-2 py-1 rounded-lg text-[10px] hover:bg-opacity-90 transition disabled:opacity-50"
                disabled={!canAction}
              >
                Accept
              </button>
              <button
                onClick={() => handleDeclinePopup(order.awbNumber)}
                className="w-16 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] hover:bg-opacity-90 transition disabled:opacity-50"
                disabled={!canAction}
              >
                Decline
              </button>
            </div>
          )}
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
                <div
                  className="px-3 py-2 hover:bg-red-50 cursor-pointer font-[600] text-red-500"
                  onClick={() => { handleBulkDecline(); setMobileDropdownOpen(false); }}
                >
                  Decline
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
            renderBottomActions={(order, index) => (
              <div className="px-3 py-2 bg-gray-50 flex justify-between items-center border-t">
                <button
                  onClick={() => handleOpenModal(order.text, order.imageUrl)}
                  className="bg-[#0CBB7D] text-white px-3 py-1 rounded-md text-[10px]"
                >
                  Details
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenPopup(order.awbNumber)}
                    className="bg-[#0CBB7D] text-white px-3 py-1 rounded-md text-[10px] disabled:opacity-50"
                    disabled={!canAction}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclinePopup(order.awbNumber)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md text-[10px] disabled:opacity-50"
                    disabled={!canAction}
                  >
                    Decline
                  </button>
                </div>
              </div>
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

      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        limit={limit}
        setLimit={setLimit}
      />

      {/* Modals and Popups */}
      {isOpen && (
        <AcceptDiscrepancy
          awb={acceptAwb}
          setIsOpen={setIsOpen}
          refresh={() => fetchDiscrepancy()}
        />
      )}
      {isOpen1 && (
        <DeclinePopup
          awbNumber={disputeAwbNumber}
          setIsOpen={setIsOpen1}
          refresh={() => fetchDiscrepancy()}
        />
      )}
      {isModalOpen1 && (
        <DetailsModal
          isOpen={isModalOpen1}
          onClose={() => setIsModalOpen1(false)}
          data={selectedData}
        />
      )}
    </div>
  );
};

export default DisputeRaisedDiscrepancy;
