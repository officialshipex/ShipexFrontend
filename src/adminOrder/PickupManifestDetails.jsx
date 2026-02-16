import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Notification } from "../Notification";
import ThreeDotLoader from "../Loader";
import OrdersTable from "../Common/OrdersTable";
import PaginationFooter from "../Common/PaginationFooter";
import MobileOrderCard from "../Common/MobileOrderCard";
import OrderFilterPanel from "../Common/OrderFilterPanel";
import DateFilter from "../filter/DateFilter";
import { ArrowLeft, Filter, Download } from "lucide-react";
import { FiCopy, FiCheck, FiMoreHorizontal } from "react-icons/fi";
import dayjs from "dayjs";
import {
    handleInvoice,
    handleLabel,
    handleManifest,
    handleCancelOrderAtBooked,
    handleClone,
    handleBulkDownloadManifests,
    handleBulkDownloadLabel,
    handleBulkDownloadInvoice,
    ExportExcel,
    BulkCancel
} from "../Common/orderActions";
import NotFound from "../assets/nodatafound.png";

const PickupManifestDetails = () => {
    const { pickupId } = useParams();
    const navigate = useNavigate();
    const [manifest, setManifest] = useState(null);
    const [allOrders, setAllOrders] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [refresh, setRefresh] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [copiedPickupId, setCopiedPickupId] = useState(false);

    // Dropdown states for OrdersTable
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const dropdownRefs = useRef([]);
    const toggleButtonRefs = useRef([]);
    const [copiedOrderId, setCopiedOrderId] = useState(null);
    const [dropdownDirection, setDropdownDirection] = useState({});
    const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
    const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
    const desktopActionRef = useRef(null);
    const mobileActionRef = useRef(null);

    // Filter states
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [orderId, setOrderId] = useState("");
    const [awbNumber, setAwbNumber] = useState("");
    const [paymentType, setPaymentType] = useState("");
    const [pickupAddresses, setPickupAddresses] = useState([]);
    const [selectedPickupAddress, setSelectedPickupAddress] = useState([]);
    const [courierOptions, setCourierOptions] = useState([]);
    const [selectedCourier, setSelectedCourier] = useState([]);
    const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
    const headerActionRef = useRef(null);
    const [dateRange, setDateRange] = useState([{ startDate: null, endDate: null, key: "selection" }]);

    const [tableHeight, setTableHeight] = useState("calc(100vh - 260px)");
    const tableRef = useRef(null);

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    const processOrdersData = (fetchedOrders) => {
        setAllOrders(fetchedOrders);
        const uniquePickup = [...new Map(fetchedOrders
            .filter(o => o.pickupAddress)
            .map(o => [o.pickupAddress.contactName || o.pickupAddress.name || o.pickupAddress, o.pickupAddress])
        ).values()];
        const formattedPickup = uniquePickup.map(p => typeof p === 'string' ? { address: p } : p);
        setPickupAddresses(formattedPickup);

        const uniqueCouriers = [...new Set(fetchedOrders.map(o => o.courierServiceName).filter(Boolean))];
        setCourierOptions(uniqueCouriers);
    };

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

    // Handle Click Outside for Dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (desktopActionRef.current && !desktopActionRef.current.contains(event.target)) {
                setDesktopDropdownOpen(false);
            }
            if (mobileActionRef.current && !mobileActionRef.current.contains(event.target)) {
                setMobileDropdownOpen(false);
            }
            if (headerActionRef.current && !headerActionRef.current.contains(event.target)) {
                setHeaderDropdownOpen(false);
            }
            const clickedAnyToggleButton = toggleButtonRefs.current.some(ref => ref && ref.contains(event.target));
            const clickedInsideAnyDropdown = dropdownRefs.current.some(ref => ref && ref.contains(event.target));
            if (!clickedInsideAnyDropdown && !clickedAnyToggleButton) {
                setDropdownOpen(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Fetch Manifest Details
    useEffect(() => {
        const fetchManifestDetails = async () => {
            setLoading(true);
            try {
                const token = Cookies.get("session");
                // Try Admin B2C first
                const response = await axios.get(`${REACT_APP_BACKEND_URL}/admin/pickupManifest/${pickupId}`, {
                    headers: { authorization: `Bearer ${token}` },
                });

                if (response.data && response.data.manifest) {
                    setManifest(response.data.manifest);
                    processOrdersData(response.data.manifest.orders || response.data.orders || []);
                } else {
                    throw new Error("No manifest found");
                }
            } catch (error) {
                // Fallback to B2B
                try {
                    const token = Cookies.get("session");
                    // Note: Admin B2B details can be fetched from the same user endpoint if admin is authorized,
                    // or we might need a specific /b2b/admin/... endpoint if desired.
                    // For now, /b2b/pickupManifest/:id should work if the admin is authorized.
                    const response = await axios.get(`${REACT_APP_BACKEND_URL}/b2b/pickupManifest/${pickupId}`, {
                        headers: { authorization: `Bearer ${token}` },
                    });
                    if (response.data && response.data.manifest) {
                        setManifest(response.data.manifest);
                        processOrdersData(response.data.manifest.orders || response.data.orders || []);
                    } else {
                        // try non-admin b2c
                        try {
                            const res = await axios.get(`${REACT_APP_BACKEND_URL}/order/pickupManifest/${pickupId}`, {
                                headers: { authorization: `Bearer ${token}` },
                            });
                            if (res.data && res.data.manifest) {
                                setManifest(res.data.manifest);
                                processOrdersData(res.data.manifest.orders || res.data.orders || []);
                            }
                        } catch (e) {
                            Notification("Failed to fetch manifest details", "error");
                        }
                    }
                } catch (b2bError) {
                    Notification("Failed to fetch manifest details", "error");
                }
            } finally {
                setLoading(false);
            }
        };

        if (pickupId) {
            fetchManifestDetails();
        }
    }, [pickupId, refresh, REACT_APP_BACKEND_URL]);

    // Client-side Filtering & Pagination
    useEffect(() => {
        let filtered = [...allOrders];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                o.orderId?.toString().toLowerCase().includes(query) ||
                (o.awb_number?.toString().toLowerCase().includes(query)) ||
                (o.receiverAddress?.contactName?.toLowerCase().includes(query)) ||
                (o.receiverAddress?.phoneNumber?.toString().includes(query))
            );
        }
        if (orderId) {
            filtered = filtered.filter(o => o.orderId?.toString().includes(orderId));
        }
        if (awbNumber) {
            filtered = filtered.filter(o =>
                (o.awb_number?.toString().toLowerCase().includes(awbNumber.toLowerCase())) ||
                (o.trackingId?.toString().toLowerCase().includes(awbNumber.toLowerCase()))
            );
        }
        if (paymentType) {
            filtered = filtered.filter(o => o.paymentDetails?.method === paymentType);
        }
        if (selectedPickupAddress.length > 0) {
            filtered = filtered.filter(o => selectedPickupAddress.includes(o.pickupAddress?.contactName || o.pickupAddress?.name));
        }
        if (selectedCourier.length > 0) {
            filtered = filtered.filter(o => selectedCourier.includes(o.courierServiceName));
        }
        if (dateRange[0].startDate && dateRange[0].endDate) {
            const start = dayjs(dateRange[0].startDate).startOf('day');
            const end = dayjs(dateRange[0].endDate).endOf('day');
            filtered = filtered.filter(o => {
                const date = dayjs(o.createdAt);
                return (date.isAfter(start) || date.isSame(start)) && (date.isBefore(end) || date.isSame(end));
            });
        }

        setTotalPages(Math.ceil(filtered.length / limit) || 1);

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const sliced = filtered.slice(startIndex, endIndex);
        setOrders(sliced);

    }, [allOrders, page, limit, searchQuery, orderId, awbNumber, paymentType, selectedPickupAddress, selectedCourier, dateRange]);


    const handleCopyPickupId = () => {
        if (manifest?.pickupId || pickupId) {
            navigator.clipboard.writeText(manifest?.pickupId || pickupId);
            setCopiedPickupId(true);
            setTimeout(() => setCopiedPickupId(false), 1500);
        }
    };

    const toggleDropdown = (index) => {
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
        setSelectedPickupAddress([]);
        setSelectedCourier([]);
        setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
        setPage(1);
        setRefresh(prev => !prev);
    };


    return (
        <div className="w-full p-2">
            {/* Header */}
            <div className="bg-white p-2 rounded-lg shadow-sm mb-2 sticky top-16 z-40">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-green-100 transition"
                            title="Go Back"
                        >
                            <ArrowLeft className="w-4 h-4 text-gray-500" />
                        </button>
                        <div className="flex items-center gap-2 group">
                            <h1 className="sm:text-[14px] text-[12px] font-[600] text-gray-700">
                                Pickup ID# <span className="text-[#0CBB7D]">{manifest?.pickupId || pickupId}</span>
                            </h1>
                            <div
                                onClick={handleCopyPickupId}
                                className="md:opacity-0 md:group-hover:opacity-100 cursor-pointer transition-opacity"
                            >
                                <div className="relative flex items-center justify-center text-gray-500 hover:text-[#0CBB7D]">
                                    {copiedPickupId ? (
                                        <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                                    ) : (
                                        <FiCopy className="w-3 h-3" />
                                    )}
                                </div>
                            </div>
                        </div>
                        <span className="px-2 font-[600] py-1 rounded text-[10px] bg-green-100 text-[#0CBB7D] uppercase">
                            {manifest?.status?.replace(/_/g, " ") || "Scheduled"}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleManifest(allOrders.map(o => o._id).join(","))}
                            className="flex items-center gap-1 px-3 py-2 bg-[#0CBB7D] text-white text-[10px] font-[600] rounded-lg shadow-sm hover:bg-opacity-90"
                        >
                            Download Manifest
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex w-full sm:mb-2 md:flex-row flex-col sm:mt-2 justify-between items-center gap-1">
                <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                    <div className="flex-1 md:w-[200px]">
                        <DateFilter onDateChange={setDateRange} clearTrigger={refresh} noInitialFilter={true} />
                    </div>
                    <button
                        onClick={() => setIsFilterPanelOpen(true)}
                        className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border rounded-lg text-[12px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap min-w-[120px]"
                    >
                        <Filter className="w-4 h-4 text-[#0CBB7D]" />
                        More Filters
                    </button>
                    <div className="hidden md:block">
                        {(searchQuery || orderId || awbNumber || paymentType || selectedPickupAddress.length > 0 || selectedCourier.length > 0) && (
                            <button onClick={handleClearFilters} className="text-[12px] text-red-500 hover:underline font-[600] whitespace-nowrap">
                                Clear All Filters
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden md:block relative" ref={desktopActionRef}>
                        <button
                            disabled={selectedOrders.length === 0}
                            className={`py-2 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-2 border ${selectedOrders.length === 0
                                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                                : "border-[#0CBB7D] text-[#0CBB7D] bg-white hover:bg-green-50 shadow-sm"
                                }`}
                            onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
                        >
                            Actions
                        </button>
                        {desktopDropdownOpen && (
                            <div className="absolute right-0 mt-1 w-48 text-[10px] bg-white border border-gray-200 shadow-xl z-[60] font-[600] overflow-hidden animate-popup-in">
                                <ul className="">
                                    <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { ExportExcel({ selectedOrders, orders }); setDesktopDropdownOpen(false); }}>Export Excel</li>
                                    <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { handleBulkDownloadInvoice({ selectedOrders }); setDesktopDropdownOpen(false); }}>Download Invoices</li>
                                    <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { handleBulkDownloadManifests(selectedOrders); setDesktopDropdownOpen(false); }}>Download Manifests</li>
                                    <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={() => { handleBulkDownloadLabel({ selectedOrders }); setDesktopDropdownOpen(false); }}>Download Labels</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div ref={tableRef} className="hidden md:block">
                <div className="overflow-auto relative bg-white" style={{ height: tableHeight }}>
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
                        handleLabel={handleLabel}
                        handleManifest={handleManifest}
                        handleCancelOrder={handleCancelOrderAtBooked}
                        handleClone={handleClone}
                        refresh={refresh}
                        setRefresh={setRefresh}
                        showShippingDetails={true}
                        showActionColumn={true}
                        showUserDetails={true}
                    />
                </div>
                <PaginationFooter page={page} totalPages={totalPages} setPage={setPage} limit={limit} setLimit={setLimit} />
            </div>

            {/* Mobile View */}
            <div className="md:hidden w-full">
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
                                handleLabel={handleLabel}
                                handleManifest={handleManifest}
                                handleCancelOrder={handleCancelOrderAtBooked}
                                handleClone={handleClone}
                                refresh={refresh}
                                setRefresh={setRefresh}
                                navigate={navigate}
                                showShippingDetails={true}
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
                onClearFilters={handleClearFilters}
                onApplyFilters={(filters) => {
                    setSearchQuery(filters.searchQuery);
                    setOrderId(filters.orderId);
                    setAwbNumber(filters.awbNumber);
                    setPaymentType(filters.paymentType);
                    setSelectedPickupAddress(filters.selectedPickupAddress);
                    setSelectedCourier(filters.selectedCourier);
                    setPage(1);
                    setIsFilterPanelOpen(false);
                }}
                courierOptions={courierOptions}
                showAwb={true}
                showCourier={true}
                searchLabel="Pickup ID"
                searchPlaceholder="Search by Pickup ID"
            />
        </div>
    );
};

export default PickupManifestDetails;
