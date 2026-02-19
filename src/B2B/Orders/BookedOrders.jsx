import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import { ChevronDown, Filter } from "lucide-react";
import NotFound from "../../assets/nodatafound.png";
import { Notification } from "../../Notification"
import { FaBars } from "react-icons/fa";
import ThreeDotLoader from "../../Loader";
import DateFilter from "../../filter/DateFilter";
import OrderFilterPanel from "../../Common/OrderFilterPanel";
import PaginationFooter from "../../Common/PaginationFooter";
import {
    ExportExcel,
    handleInvoice,
    handleBulkDownloadInvoice,
    cancelOrder,
    handleLabel,
    handleBulkDownloadLabel,
    BulkCancel
} from "../../Common/orderActions";
import OrdersTable from "../../Common/OrdersTable";
import MobileOrderCard from "../../Common/MobileOrderCard";
import SchedulePickupModal from "./SchedulePickupModal";

const BookedOrders = (filterOrder) => {
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [orders, setOrders] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
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
    const [totalCount, setTotalCount] = useState(0);

    const [orderId, setOrderId] = useState("");
    const [awbNumber, setAwbNumber] = useState("");
    const [paymentType, setPaymentType] = useState("");
    const [dateRange, setDateRange] = useState([{ startDate: null, endDate: null, key: "selection" }]);
    const [pickupAddresses, setPickupAddresses] = useState([]);
    const [selectedPickupAddress, setSelectedPickupAddress] = useState("");
    const [selectedCourier, setSelectedCourier] = useState("");
    const [courierOptions, setCourierOptions] = useState([]);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [copiedOrderId, setCopiedOrderId] = useState(null);

    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedOrderForPickup, setSelectedOrderForPickup] = useState(null);

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
            if (desktopActionRef.current && !desktopActionRef.current.contains(event.target)) {
                setDesktopDropdownOpen(false);
            }
            if (mobileActionRef.current && !mobileActionRef.current.contains(event.target)) {
                setMobileDropdownOpen(false);
            }

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

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = Cookies.get("session");
            const params = {
                id,
                page,
                limit,
                status: ["Booked"],
                searchQuery,
                orderId: orderId || undefined,
                awbNumber: awbNumber || undefined,
                courierServiceName: selectedCourier.length > 0 ? selectedCourier.join(",") : undefined,
                paymentType,
                startDate: dateRange[0].startDate?.toISOString(),
                endDate: dateRange[0].endDate?.toISOString(),
                pickupContactName: selectedPickupAddress.length > 0 ? selectedPickupAddress.join(",") : undefined,
            };

            const response = await axios.get(`${REACT_APP_BACKEND_URL}/b2b/getb2buserorder`, {
                params,
                headers: { authorization: `Bearer ${token}` },
            });

            setOrders(response.data.orders || []);
            setTotalPages(response.data.totalPages);
            setTotalCount(response.data.totalCount || 0);
            if (response.data.courierServices) setCourierOptions(response.data.courierServices);
            if (response.data.pickupLocations) setPickupAddresses(response.data.pickupLocations);
        } catch (error) {
            console.error("Error fetching B2B booked orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, limit, refresh, dateRange, id]);

    const toggleDropdown = (index) => {
        const buttonRef = toggleButtonRefs.current[index];
        if (buttonRef) {
            const rect = buttonRef.getBoundingClientRect();
            const direction = window.innerHeight - rect.bottom < 300 ? "up" : "down";
            setDropdownDirection(prev => ({ ...prev, [index]: direction }));
        }
        setDropdownOpen(dropdownOpen === index ? null : index);
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
        setAwbNumber("");
        setPaymentType("");
        setSelectedPickupAddress("");
        setSelectedCourier("");
        setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
        setPage(1);
        setRefresh(prev => !prev);
    };

    const generatePickup = async (orderIds = []) => {
        // This is kept for any generic pickup generation without date selection if needed,
        // but normally we use the modal now.
        try {
            const token = Cookies.get("session");
            const response = await axios.post(
                `${REACT_APP_BACKEND_URL}/b2b/generatePickup`,
                { orderIds },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.data.success) {
                Notification("Pickup generated successfully!", "success");
                setRefresh(!refresh);
            } else {
                Notification(response.data.message || "Pickup generation failed", "error");
            }
        } catch (error) {
            Notification(error?.response?.data?.message || "Failed to generate pickup", "error");
        }
    };

    const handleScheduledPickup = (order) => {
        setSelectedOrderForPickup(order);
        setShowScheduleModal(true);
    };

    const handleBulkGeneratePickup = () => {
        if (selectedOrders.length === 0) {
            Notification("No orders selected for pickup.", "info");
            return;
        }
        // Simplified bulk: just calls the legacy generatePickup or we could add a bulk modal
        generatePickup(selectedOrders);
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
                            <div className="absolute right-0 mt-1 w-48 text-[10px] font-[600] bg-white border border-gray-200 shadow-xl z-[60] overflow-hidden animate-popup-in">
                                <ul className="">
                                    <li className="px-3 py-3 text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                                        onClick={() => { handleBulkGeneratePickup(); setDesktopDropdownOpen(false); }}>
                                        Generate Pickup Request
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
                        handleScheduledPickup={handleScheduledPickup}
                        cancelOrder={cancelOrder}
                        refresh={refresh}
                        setRefresh={setRefresh}
                        showShippingDetails={true}
                    />
                </div>
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
                            <span className="hidden sm:inline">Actions▼</span>
                        </button>
                        {mobileDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-40 text-[10px] font-[600] bg-white border rounded-lg shadow-sm z-[60] overflow-hidden animate-popup-in">
                                <ul className="py-1">
                                    <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { handleBulkGeneratePickup(); setMobileDropdownOpen(false); }}>Generate Pickup Request</li>
                                    <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { ExportExcel({ selectedOrders, orders }); setMobileDropdownOpen(false); }}>Export Excel</li>
                                    <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { handleBulkDownloadInvoice({ selectedOrders }); setMobileDropdownOpen(false); }}>Download Invoices</li>
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
                                handleScheduledPickup={handleScheduledPickup}
                                cancelOrder={cancelOrder}
                                refresh={refresh}
                                setRefresh={setRefresh}
                                navigate={navigate}
                                showShippingDetails={true}
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
                totalCount={totalCount}
            />

            <OrderFilterPanel
                isOpen={isFilterPanelOpen}
                onClose={() => setIsFilterPanelOpen(false)}
                userId={id}
                onApplyFilters={(filters) => {
                    setSearchQuery(filters.searchQuery);
                    setOrderId(filters.orderId);
                    setAwbNumber(filters.awbNumber);
                    setPaymentType(filters.paymentType);
                    setSelectedPickupAddress(filters.pickupAddress);
                    setSelectedCourier(filters.courier);
                    setDateRange(filters.dateRange);
                    setPage(1);
                    setRefresh(prev => !prev);
                }}
                courierOptions={courierOptions}
                pickupAddresses={pickupAddresses}
                initialFilters={{
                    searchQuery,
                    orderId,
                    awbNumber,
                    paymentType,
                    pickupAddress: selectedPickupAddress,
                    courier: selectedCourier,
                    dateRange
                }}
            />

            {showScheduleModal && selectedOrderForPickup && (
                <SchedulePickupModal
                    orderId={selectedOrderForPickup._id}
                    awb={selectedOrderForPickup.awb_number}
                    pickupAddress={`${selectedOrderForPickup?.pickupAddress?.address}, ${selectedOrderForPickup?.pickupAddress?.city}, ${selectedOrderForPickup?.pickupAddress?.state} - ${selectedOrderForPickup?.pickupAddress?.pinCode}`}
                    onClose={(refreshNeeded) => {
                        setShowScheduleModal(false);
                        if (refreshNeeded) {
                            setRefresh(prev => !prev);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default BookedOrders;
