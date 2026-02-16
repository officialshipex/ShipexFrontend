import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { ChevronDown, Filter, FileText, Download, Play } from "lucide-react";
import { Notification } from "../Notification";
import { FaBars } from "react-icons/fa";
import ThreeDotLoader from "../Loader";
import DateFilter from "../filter/DateFilter";
import OrderFilterPanel from "../Common/OrderFilterPanel";
import PaginationFooter from "../Common/PaginationFooter";
import {
  handleInvoice,
  handleLabel,
  handleBulkDownloadLabel,
  handleBulkDownloadInvoice,
  ExportExcel,
  handleManifest,
  handleBulkDownloadManifests
} from "../Common/orderActions";
import OrdersTable from "../Common/OrdersTable";
import MobileOrderCard from "../Common/MobileOrderCard";
import NdrActionModal from "../NDR/NdrActionModal";
import NdrStatusModal from "../NDR/NdrStatusModal";
import BulkNdrActionModal from "../NDR/BulkNdrActionModal";
import NotFound from "../assets/nodatafound.png";

const ActionRequired = ({ userId: initialUserId }) => {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refresh, setRefresh] = useState(false);
  const dropdownRefs = useRef([]);
  const toggleButtonRefs = useRef([]);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const desktopActionRef = useRef(null);
  const mobileActionRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [orderId, setOrderId] = useState("");
  const [awbNumber, setAwbNumber] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [dateRange, setDateRange] = useState([{ startDate: null, endDate: null, key: "selection" }]);
  const [pickupAddresses, setPickupAddresses] = useState([]);
  const [selectedPickupAddress, setSelectedPickupAddress] = useState("");
  const [courierOptions, setCourierOptions] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [tableHeight, setTableHeight] = useState("calc(100vh - 260px)");
  const tableRef = useRef(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedNdrHistory, setSelectedNdrHistory] = useState([]);
  const [isBulkNdrModalOpen, setIsBulkNdrModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [selectedUserId, setSelectedUserId] = useState(initialUserId || new URLSearchParams(location.search).get("userId"));

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const updateHeight = () => {
      if (tableRef.current) {
        const top = tableRef.current.getBoundingClientRect().top;
        const remainingHeight = window.innerHeight - top - 60;
        setTableHeight(`${remainingHeight}px`);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("session");
      const params = {
        page,
        limit,
        status: "Action Required",
        ndrStatus: "Action Required",
        searchQuery: searchQuery || undefined,
        orderId: orderId || undefined,
        awbNumber: awbNumber || undefined,
        courierServiceName: selectedCourier || undefined,
        paymentType: paymentType || undefined,
        startDate: dateRange[0].startDate?.toISOString(),
        endDate: dateRange[0].endDate?.toISOString(),
        pickupContactName: selectedPickupAddress || undefined,
        userId: selectedUserId || undefined,
      };

      const response = await axios.get(`${REACT_APP_BACKEND_URL}/admin/filterNdrOrdersForEmployee`, {
        params,
        headers: { authorization: `Bearer ${token}` },
      });

      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
      if (response.data.courierServices) setCourierOptions(response.data.courierServices);
      if (response.data.pickupLocations) setPickupAddresses(response.data.pickupLocations);

    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, limit, refresh, dateRange, selectedUserId]);

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) setSelectedOrders([]);
    else setSelectedOrders(orders.map(o => o._id));
  };

  const handleCheckboxChange = (orderId) => {
    setSelectedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setOrderId("");
    setAwbNumber("");
    setPaymentType("");
    setSelectedPickupAddress("");
    setSelectedCourier("");
    setSelectedUserId(null);
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
    setPage(1);
    setRefresh(prev => !prev);
  };

  const handleTakeAction = (order) => {
    setSelectedOrder(order);
    setIsActionModalOpen(true);
  };

  const handleViewHistory = (order) => {
    setSelectedNdrHistory(order.ndrHistory || []);
    setIsHistoryModalOpen(true);
  };

  const handleNdrAction = async (payload) => {
    try {
      const token = Cookies.get("session");
      const response = await axios.post(`${REACT_APP_BACKEND_URL}/ndr/ndr-process`, payload, {
        headers: { authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        Notification("NDR action processed successfully!", "success");
        setRefresh(prev => !prev);
      } else {
        Notification(response.data.data || "Failed to process NDR action", "error");
      }
    } catch (error) {
      console.error("Error processing NDR action:", error);
      Notification("Failed to process NDR action", "error");
    }
  };

  return (
    <div className="w-full">
      <div className="flex w-full sm:mb-2 md:flex-row flex-col sm:mt-2 justify-between items-center gap-1">
        <div className="flex flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:w-[200px]">
            <DateFilter onDateChange={setDateRange} clearTrigger={refresh} />
          </div>
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border rounded-lg sm:text-[12px] text-[10px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap min-w-[120px]"
          >
            <Filter className="w-4 h-4 text-[#0CBB7D]" />
            More Filters
          </button>
        </div>

        <div className="flex items-center gap-2 w-auto justify-end">
          <div className="hidden md:block relative" ref={desktopActionRef}>
            <button
              disabled={selectedOrders.length === 0}
              className={`py-2 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-2 transition-all border ${selectedOrders.length === 0
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-[#0CBB7D] text-[#0CBB7D] bg-white hover:bg-green-50 shadow-sm"
                }`}
              onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
            >
              Actions <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${desktopDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {desktopDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 text-[10px] bg-white border border-gray-200 shadow-sm z-[60] font-[600] overflow-hidden animate-popup-in">
                <ul className="py-1">
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { ExportExcel({ selectedOrders, orders }); setDesktopDropdownOpen(false); }}>
                    <Download className="w-3 h-3" /> Export Excel
                  </li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { handleBulkDownloadInvoice({ selectedOrders }); setDesktopDropdownOpen(false); }}>
                    <FileText className="w-3 h-3" /> Download Invoices
                  </li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { handleBulkDownloadManifests(selectedOrders); setDesktopDropdownOpen(false); }}>
                    <FileText className="w-3 h-3" /> Download Manifests
                  </li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { handleBulkDownloadLabel({ selectedOrders }); setDesktopDropdownOpen(false); }}>
                    <FileText className="w-3 h-3" /> Download Labels
                  </li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { setIsBulkNdrModalOpen(true); setDesktopDropdownOpen(false); }}>
                    <Play className="w-3 h-3" /> Bulk NDR Action
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={tableRef} className="hidden md:block">
        <div style={{ height: tableHeight }} className="overflow-auto relative bg-white">
          <OrdersTable
            orders={orders}
            loading={loading}
            selectedOrders={selectedOrders}
            handleSelectAll={handleSelectAll}
            handleCheckboxChange={handleCheckboxChange}
            navigate={navigate}
            copiedOrderId={copiedOrderId}
            setCopiedOrderId={setCopiedOrderId}
            dropdownOpen={dropdownOpen}
            toggleDropdown={(index) => setDropdownOpen(dropdownOpen === index ? null : index)}
            dropdownRefs={dropdownRefs}
            toggleButtonRefs={toggleButtonRefs}
            handleInvoice={handleInvoice}
            handleLabel={handleLabel}
            handleManifest={handleManifest}
            refresh={refresh}
            setRefresh={setRefresh}
            showShippingDetails={true}
            showNdrDetails={true}
            showNdrAction={true}
            onViewNdrHistory={handleViewHistory}
            onTakeAction={handleTakeAction}
            showUserDetails={true}
          />
        </div>
        <PaginationFooter page={page} totalPages={totalPages} setPage={setPage} limit={limit} setLimit={setLimit} />
      </div>

      <div className="md:hidden w-full">
        <div className="flex items-center justify-between gap-2 mb-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border flex-1">
            <input type="checkbox" checked={selectedOrders.length === orders.length && orders.length > 0} onChange={handleSelectAll} className="cursor-pointer accent-[#0CBB7D] w-3 h-3" />
            <span className="text-[10px] font-[600]">Select All</span>
          </div>
          <div className="relative" ref={mobileActionRef}>
            <button
              disabled={selectedOrders.length === 0}
              className={`h-7 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 transition-all border ${selectedOrders.length === 0
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-[#0CBB7D] text-[#0CBB7D] bg-white shadow-sm"
                }`}
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
            >
              <FaBars className={selectedOrders.length === 0 ? "text-gray-400" : "text-[#0CBB7D]"} />
            </button>
            {mobileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-sm z-[60] text-[10px] font-[600] overflow-hidden animate-popup-in">
                <ul className="py-1">
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { ExportExcel({ selectedOrders, orders }); setMobileDropdownOpen(false); }}>Export Excel</li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { handleBulkDownloadInvoice({ selectedOrders }); setMobileDropdownOpen(false); }}>Download Invoices</li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { handleBulkDownloadManifests(selectedOrders); setMobileDropdownOpen(false); }}>Download Manifests</li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { handleBulkDownloadLabel({ selectedOrders }); setMobileDropdownOpen(false); }}>Download Labels</li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { setIsBulkNdrModalOpen(true); setMobileDropdownOpen(false); }}>Bulk NDR Action</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div style={{ height: tableHeight }} className="overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-6"><ThreeDotLoader /></div>
          ) : orders.length > 0 ? (
            orders.map((order, index) => (
              <MobileOrderCard
                key={order._id}
                order={order}
                index={index}
                selectedOrders={selectedOrders}
                handleCheckboxChange={handleCheckboxChange}
                toggleDropdown={(idx) => setDropdownOpen(dropdownOpen === idx ? null : idx)}
                dropdownOpen={dropdownOpen}
                dropdownRefs={dropdownRefs}
                toggleButtonRefs={toggleButtonRefs}
                handleInvoice={handleInvoice}
                handleLabel={handleLabel}
                handleManifest={handleManifest}
                refresh={refresh}
                setRefresh={setRefresh}
                navigate={navigate}
                showShippingDetails={true}
                showNdrDetails={true}
                showNdrAction={true}
                onViewNdrHistory={handleViewHistory}
                onTakeAction={handleTakeAction}
                showUserDetails={true}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <img src={NotFound} alt="No Data Found" className="w-60 h-60 object-contain mb-2" />
            </div>
          )}
        </div>
        <PaginationFooter page={page} totalPages={totalPages} setPage={setPage} limit={limit} setLimit={setLimit} />
      </div>

      <OrderFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        searchQuery={searchQuery}
        orderId={orderId}
        awbNumber={awbNumber}
        paymentType={paymentType}
        pickupAddresses={pickupAddresses}
        selectedPickupAddress={selectedPickupAddress}
        selectedCourier={selectedCourier}
        selectedUserId={selectedUserId}
        onClearFilters={handleClearFilters}
        onApplyFilters={(filters) => {
          setSearchQuery(filters.searchQuery);
          setOrderId(filters.orderId);
          setAwbNumber(filters.awbNumber);
          setPaymentType(filters.paymentType);
          setSelectedPickupAddress(filters.selectedPickupAddress);
          setSelectedCourier(filters.selectedCourier);
          setSelectedUserId(filters.selectedUserId);
          setPage(1);
          setRefresh(prev => !prev);
          setIsFilterPanelOpen(false);
        }}
        courierOptions={courierOptions}
        showAwb={true}
        showCourier={true}
        showUserSearch={true}
      />

      {isActionModalOpen && selectedOrder && (
        <NdrActionModal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          order={selectedOrder}
          onSubmit={handleNdrAction}
        />
      )}

      {isHistoryModalOpen && (
        <NdrStatusModal
          isOpen={isHistoryModalOpen}
          setIsOpen={setIsHistoryModalOpen}
          ndrHistory={selectedNdrHistory}
        />
      )}

      {isBulkNdrModalOpen && (
        <BulkNdrActionModal
          isOpen={isBulkNdrModalOpen}
          onClose={() => setIsBulkNdrModalOpen(false)}
          selectedOrders={selectedOrders}
          onRefresh={() => setRefresh(prev => !prev)}
        />
      )}
    </div>
  );
};

export default ActionRequired;
