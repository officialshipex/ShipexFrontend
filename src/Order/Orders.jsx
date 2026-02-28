import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { ChevronDown, Filter } from "lucide-react";
import NotFound from "../assets/nodatafound.png";
import { Notification } from "../Notification"
import SelectPickupPopup from "./SelectPickupPopup";
import { FaFilter, FaBars } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import UpdatePackageDetails from "./UpdatePackageDetails";
import { FiMoreHorizontal, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import ThreeDotLoader from "../Loader";
import Cookies from "js-cookie";
import { FiCopy, FiCheck } from "react-icons/fi";
import DateFilter from "../filter/DateFilter";
import OrderFilterPanel from "../Common/OrderFilterPanel";
import PaginationFooter from "../Common/PaginationFooter";
import OrderRowActions from "../Common/OrderRowActions";
import {
  ExportExcel,
  handleInvoice,
  handleBulkDownloadInvoice,
  handleBulkDownloadLabel,
  SavePackageDetails,
  BulkCancel,
  handleManifest,
  handleBulkDownloadManifests,
  cancelOrder,
  handleClone
} from "../Common/orderActions";
import OrdersTable from "../Common/OrdersTable";
import MobileOrderCard from "../Common/MobileOrderCard";

const Orders = (filterOrder) => {
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
  const [showBulkShipModal, setShowBulkShipModal] = useState(false);
  const [selectedData, setSelectedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageDetails, setPackageDetails] = useState({
    length: "",
    width: "",
    height: "",
    weight: "",
  });

  const [orderId, setOrderId] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [dateRange, setDateRange] = useState([
    {
      startDate: dayjs().subtract(6, "day").startOf("day").toDate(),
      endDate: dayjs().endOf("day").toDate(),
      key: "selection",
    },
  ]);
  const [pickupAddresses, setPickupAddresses] = useState([]);
  const [selectedPickupAddress, setSelectedPickupAddress] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("");
  const [courierOptions, setCourierOptions] = useState([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showCourierDropdown, setShowCourierDropdown] = useState(false);

  const courierRef = useRef(null);
  const courierButtonRef = useRef(null);
  const paymentRef = useRef(null);
  const paymentButtonRef = useRef(null);
  const pickupRef = useRef(null);
  const pickupButtonRef = useRef(null);

  const [tableHeight, setTableHeight] = useState("calc(100vh - 260px)");
  const tableRef = useRef(null);

  const navigate = useNavigate();
  const { id } = useParams();
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [dropdownDirection, setDropdownDirection] = useState({});

  useEffect(() => {
    const updateHeight = () => {
      if (tableRef.current) {
        const top = tableRef.current.getBoundingClientRect().top;
        const remainingHeight = window.innerHeight - top - 50;
        setTableHeight(`${remainingHeight}px`);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Desktop Bulk Actions
      if (desktopActionRef.current && !desktopActionRef.current.contains(event.target)) {
        setDesktopDropdownOpen(false);
      }
      // Mobile Bulk Actions
      if (mobileActionRef.current && !mobileActionRef.current.contains(event.target)) {
        setMobileDropdownOpen(false);
      }

      // Row dots dropdowns
      const clickedAnyToggleButton = toggleButtonRefs.current.some(
        (ref) => ref && ref.contains(event.target)
      );
      const clickedInsideAnyDropdown = dropdownRefs.current.some(
        (ref) => ref && ref.contains(event.target)
      );

      if (!clickedInsideAnyDropdown && !clickedAnyToggleButton) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (dropdownOpen !== null) setDropdownOpen(null);
      if (desktopDropdownOpen) setDesktopDropdownOpen(false);
      if (mobileDropdownOpen) setMobileDropdownOpen(false);
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [dropdownOpen, desktopDropdownOpen, mobileDropdownOpen]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("session");
      const params = {
        id,
        page,
        limit,
        status: "new",
        searchQuery,
        orderId,
        paymentType,
        startDate: dateRange[0].startDate?.toISOString(),
        endDate: dateRange[0].endDate?.toISOString(),
        pickupContactName: selectedPickupAddress || undefined,
      };
      if (selectedCourier) {
        params.courierServiceName = selectedCourier;
      }
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/order/orders`, {
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
  }, [page, limit, refresh, dateRange]);

  useEffect(() => {
    if (filterOrder?.orders) setOrders(filterOrder.orders);
  }, [filterOrder?.orders]);

  const toggleDropdown = (index) => {
    const buttonRef = toggleButtonRefs.current[index];
    if (buttonRef) {
      const rect = buttonRef.getBoundingClientRect();
      const direction = window.innerHeight - rect.bottom < 300 ? "up" : "down";
      setDropdownDirection(prev => ({ ...prev, [index]: direction }));
    }
    setDropdownOpen(dropdownOpen === index ? null : index);
  };

  const handleUpdateOrder = (order) => {
    const orderUserId = order.userId?._id || order.userId;
    const url = `/dashboard/order/neworder?updateId=${order._id}${orderUserId ? `&userId=${orderUserId}` : ''}`;
    navigate(url);
  };

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
    setPaymentType("");
    setSelectedPickupAddress("");
    setSelectedCourier("");
    setDateRange([
      {
        startDate: dayjs().subtract(6, "day").startOf("day").toDate(),
        endDate: dayjs().endOf("day").toDate(),
        key: "selection",
      },
    ]);
    setPage(1);
    setRefresh(prev => !prev);
  };

  const handleBulkShip = async () => {
    if (!selectedOrders || selectedOrders.length < 2) {
      Notification("Please select at least 2 orders to create a bulk shipment.", "info");
      return;
    }
    try {
      const token = Cookies.get("session");
      const checkResponse = await axios.get(`${REACT_APP_BACKEND_URL}/order/checkBulkPickup`, {
        params: { orderIds: selectedOrders },
        headers: { Authorization: `Bearer ${token}` },
      });
      const { showPopup, orders: popupOrders } = checkResponse.data;
      if (!showPopup) {
        Notification("Processing bulk shipment. Please wait...", "success");
        const shipResponse = await axios.post(`${REACT_APP_BACKEND_URL}/bulk/create-bulk-order`, { selectedOrders }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (shipResponse.data.success) {
          Notification(shipResponse.data.message || "Bulk shipment successful.", "success");
        } else {
          Notification(shipResponse.data.message || "Failed to create bulk shipment.", "error");
        }
        fetchOrders();
        return;
      }
      setTitle("Bulk Ship");
      setShowBulkShipModal(true);
      setSelectedData(popupOrders);
    } catch (error) {
      Notification("Something went wrong while processing bulk shipment.", "error");
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Filter Bar */}
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
          <div className="hidden md:block">
            {(searchQuery || orderId || paymentType || selectedPickupAddress || selectedCourier) && (
              <button onClick={handleClearFilters} className="text-[12px] text-red-500 hover:underline font-[600] whitespace-nowrap">
                Clear All Filters
              </button>
            )}
          </div>
        </div>
        <div className="md:hidden flex justify-end w-full -mt-2 mb-2 px-1">
          {(searchQuery || orderId || paymentType || selectedPickupAddress || selectedCourier) && (
            <button onClick={handleClearFilters} className="text-[10px] text-red-500 font-[600]">
              Clear All Filters
            </button>
          )}
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
              <div className="absolute right-0 mt-1 w-48 text-[10px] font-[600] bg-white border border-gray-200 shadow-xl z-[60] overflow-hidden animate-popup-in">
                <ul className="">
                  <li className="px-3 py-3 text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { handleBulkShip(); setDesktopDropdownOpen(false); }}>
                    Bulk Ship
                  </li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { setShowPackageModal(true); setDesktopDropdownOpen(false); }}>
                    Update Package Details
                  </li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      const fullOrders = orders.filter(o => selectedOrders.includes(o._id));
                      setSelectedData(fullOrders);
                      setTitle("Update Address");
                      setShowBulkShipModal(true);
                      setDesktopDropdownOpen(false);
                    }}>
                    Update Pickup Address
                  </li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { ExportExcel({ selectedOrders, orders }); setDesktopDropdownOpen(false); }}>
                    Export Excel
                  </li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { handleBulkDownloadInvoice({ selectedOrders }); setDesktopDropdownOpen(false); }}>
                    Download Invoices
                  </li>
                  <li className="px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { BulkCancel({ selectedOrders, setRefresh }); setDesktopDropdownOpen(false); }}>
                    Bulk Delete
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
            toggleDropdown={toggleDropdown}
            dropdownRefs={dropdownRefs}
            toggleButtonRefs={toggleButtonRefs}
            dropdownDirection={dropdownDirection}
            handleInvoice={handleInvoice}
            cancelOrder={cancelOrder}
            refresh={refresh}
            setRefresh={setRefresh}
            handleClone={handleClone}
            showShippingDetails={false}
            handleUpdateOrder={handleUpdateOrder}
          />
        </div>
      </div>

      {/* Mobile View */}
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
              <span className="hidden sm:inline">Actions▼</span>
            </button>
            {mobileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 text-[10px] font-[600] bg-white border rounded-lg shadow-sm z-[60] overflow-hidden animate-popup-in">
                <ul className="py-1">
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { handleBulkShip(); setMobileDropdownOpen(false); }}>Bulk Ship</li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { setShowPackageModal(true); setMobileDropdownOpen(false); }}>Update Package Details</li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer"
                    onClick={() => {
                      const fullOrders = orders.filter(o => selectedOrders.includes(o._id));
                      setSelectedData(fullOrders);
                      setTitle("Update Address");
                      setShowBulkShipModal(true);
                      setMobileDropdownOpen(false);
                    }}>
                    Update Pickup Address
                  </li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { ExportExcel({ selectedOrders, orders }); setMobileDropdownOpen(false); }}>Export Excel</li>
                  <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { handleBulkDownloadInvoice({ selectedOrders }); setMobileDropdownOpen(false); }}>Download Invoices</li>
                  {/* <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer text-[10px] font-medium" onClick={() => { handleBulkDownloadLabel({ selectedOrders }); setMobileDropdownOpen(false); }}>Download Labels</li> */}
                  <li className="px-3 py-2 text-red-600 hover:bg-red-100 cursor-pointer" onClick={() => { BulkCancel({ selectedOrders, setRefresh }); setMobileDropdownOpen(false); }}>Bulk Delete</li>
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
                toggleDropdown={toggleDropdown}
                dropdownOpen={dropdownOpen}
                dropdownRefs={dropdownRefs}
                toggleButtonRefs={toggleButtonRefs}
                dropdownDirection={dropdownDirection}
                handleInvoice={handleInvoice}
                cancelOrder={cancelOrder}
                refresh={refresh}
                setRefresh={setRefresh}
                handleClone={handleClone}
                navigate={navigate}
                showShippingDetails={false}
                handleUpdateOrder={handleUpdateOrder}
              />
            ))

          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <img src={NotFound} alt="No Data Found" className="w-60 h-60 object-contain mb-2" />
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

      <OrderFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        userId={id}
        searchQuery={searchQuery}
        orderId={orderId}
        paymentType={paymentType}
        pickupAddresses={pickupAddresses}
        selectedPickupAddress={selectedPickupAddress}
        selectedCourier={selectedCourier}
        onClearFilters={handleClearFilters}
        onApplyFilters={(filters) => {
          setSearchQuery(filters.searchQuery);
          setOrderId(filters.orderId);
          setPaymentType(filters.paymentType);
          setSelectedPickupAddress(filters.selectedPickupAddress);
          setSelectedCourier(filters.selectedCourier);
          setPage(1);
          setRefresh(prev => !prev);
          setIsFilterPanelOpen(false);
        }}
        courierOptions={courierOptions}
        showCourier={false}
      />

      <UpdatePackageDetails
        isOpen={showPackageModal} onClose={() => setShowPackageModal(false)}
        onSave={details => SavePackageDetails({ details, selectedOrders, setRefresh, refresh })}
        packageDetails={packageDetails} setPackageDetails={setPackageDetails}
      />

      {showBulkShipModal && (
        <SelectPickupPopup
          onClose={() => setShowBulkShipModal(false)}
          setSelectedData={selectedData}
          title={title}
          setRefresh={setRefresh}
          refresh={refresh}
          userId={id}
          onPickupSelected={async (formData) => {
            try {
              setShowBulkShipModal(false);
              Notification("Processing bulk shipment. Please wait...", "info");
              const token = Cookies.get("session");
              const shipResponse = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/bulk/create-bulk-order`, { selectedOrders, wh: formData }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (shipResponse.data.success) Notification(shipResponse.data.message || `${shipResponse.data.successCount} orders shipped.`, "success");
              else Notification(shipResponse.data.message || "Failed to create bulk shipment.", "error");
              fetchOrders();
            } catch (error) {
              Notification("Something went wrong while processing bulk shipment.", "error");
            } finally {
              setShowBulkShipModal(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default Orders;
