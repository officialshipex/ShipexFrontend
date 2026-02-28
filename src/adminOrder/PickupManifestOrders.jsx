import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { ChevronDown, Filter, Download, Package, Truck, Calendar } from "lucide-react";
import Cookies from "js-cookie";
import { Notification } from "../Notification";
import { FiMoreHorizontal } from "react-icons/fi";
import { FaBars } from "react-icons/fa";
import ThreeDotLoader from "../Loader";
import DateFilter from "../filter/DateFilter";
import OrderFilterPanel from "../Common/OrderFilterPanel";
import PaginationFooter from "../Common/PaginationFooter";
import NotFound from "../assets/nodatafound.png";
import { handleManifest } from "../Common/orderActions";

const PickupManifestOrders = ({ orderType = "B2C", userId: initialUserId }) => {
    const [manifests, setManifests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [refresh, setRefresh] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState([
        {
            startDate: dayjs().subtract(6, "day").startOf("day").toDate(),
            endDate: dayjs().endOf("day").toDate(),
            key: "selection",
        },
    ]);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

    // Filters
    const [orderId, setOrderId] = useState("");
    const [awbNumber, setAwbNumber] = useState("");
    const [paymentType, setPaymentType] = useState("");
    const [selectedManifests, setSelectedManifests] = useState([]);
    const [selectedPickupAddress, setSelectedPickupAddress] = useState([]);
    const [selectedCourier, setSelectedCourier] = useState([]);
    const [pickupAddresses, setPickupAddresses] = useState([]);
    const [courierOptions, setCourierOptions] = useState([]);

    const location = useLocation();
    const [selectedUserId, setSelectedUserId] = useState(initialUserId || new URLSearchParams(location.search).get("userId"));

    const [desktopActionDropdown, setDesktopActionDropdown] = useState(false);
    const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
    const [individualDropdown, setIndividualDropdown] = useState(null);
    const [hoveredAddressId, setHoveredAddressId] = useState(null);
    const [clickedAddressId, setClickedAddressId] = useState(null);
    const actionRef = useRef(null);
    const mobileActionRef = useRef(null);
    const individualRefs = useRef([]);

    const [tableHeight, setTableHeight] = useState("calc(100vh - 260px)");
    const tableRef = useRef(null);
    const mobileTableRef = useRef(null);
    const navigate = useNavigate();
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        const updateHeight = () => {
            const activeRef = window.innerWidth >= 768 ? tableRef : mobileTableRef;
            if (activeRef?.current) {
                const top = activeRef.current.getBoundingClientRect().top;
                const remainingHeight = window.innerHeight - top - 50;
                setTableHeight(`${remainingHeight}px`);
            }
        };
        updateHeight();
        window.addEventListener("resize", updateHeight);
        return () => window.removeEventListener("resize", updateHeight);
    }, []);

    const fetchManifests = async () => {
        setLoading(true);
        try {
            const token = Cookies.get("session");
            const params = {
                page,
                limit,
                searchQuery: searchQuery || orderId || awbNumber || undefined,
                startDate: dateRange[0].startDate ? dayjs(dateRange[0].startDate).startOf('day').toISOString() : undefined,
                endDate: dateRange[0].endDate ? dayjs(dateRange[0].endDate).endOf('day').toISOString() : undefined,
                pickupContactName: selectedPickupAddress.length > 0 ? (Array.isArray(selectedPickupAddress) ? selectedPickupAddress.join(",") : selectedPickupAddress) : undefined,
                courierServiceName: selectedCourier.length > 0 ? (Array.isArray(selectedCourier) ? selectedCourier.join(",") : selectedCourier) : undefined,
                orderType: orderType,
                userId: selectedUserId || undefined,
            };

            const response = await axios.get(`${REACT_APP_BACKEND_URL}/admin/filterPickupManifests`, {
                params,
                headers: { authorization: `Bearer ${token}` },
            });

            setManifests(response.data.manifests || []);
            setTotalPages(response.data.totalPages || 1);
            if (response.data.pickupLocations) setPickupAddresses(response.data.pickupLocations);
            if (response.data.courierServices) setCourierOptions(response.data.courierServices);
        } catch (error) {
            console.error("Error fetching manifests:", error);
            Notification("Failed to fetch manifests", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManifests();
    }, [page, limit, refresh, dateRange, selectedUserId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (desktopActionDropdown && actionRef.current && !actionRef.current.contains(event.target)) {
                setDesktopActionDropdown(false);
            }
            if (mobileDropdownOpen && mobileActionRef.current && !mobileActionRef.current.contains(event.target)) {
                setMobileDropdownOpen(false);
            }
            if (individualDropdown !== null && individualRefs.current[individualDropdown] && !individualRefs.current[individualDropdown].contains(event.target)) {
                setIndividualDropdown(null);
            }
            if (clickedAddressId !== null) {
                setClickedAddressId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [individualDropdown, desktopActionDropdown, mobileDropdownOpen]);

    const handleClearFilters = () => {
        setSearchQuery("");
        setOrderId("");
        setAwbNumber("");
        setPaymentType("");
        setSelectedPickupAddress([]);
        setSelectedCourier([]);
        setSelectedUserId(null);
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

    const handleDownloadManifest = (manifest) => {
        const orderIdsArr = manifest.orderIds?.map(o => o._id || o) || [];
        if (orderIdsArr.length > 0) {
            handleManifest(orderIdsArr.join(","));
        } else {
            Notification("No orders in this manifest", "error");
        }
    };

    const handleBulkManifest = () => {
        const allOrderIds = manifests.filter(m => selectedManifests.includes(m._id)).flatMap(m => m.orderIds?.map(o => o._id || o) || []);
        if (allOrderIds.length > 0) {
            handleManifest(allOrderIds.join(","));
        }
        setDesktopActionDropdown(false);
    };

    const handleBulkLabels = async () => {
        const allOrderIds = manifests.filter(m => selectedManifests.includes(m._id)).flatMap(m => m.orderIds?.map(o => o._id || o) || []);
        if (allOrderIds.length > 0) {
            const { handleBulkDownloadLabel } = await import("../Common/orderActions");
            handleBulkDownloadLabel({ selectedOrders: allOrderIds });
        }
        setDesktopActionDropdown(false);
    };

    const handleBulkInvoices = async () => {
        const allOrderIds = manifests.filter(m => selectedManifests.includes(m._id)).flatMap(m => m.orderIds?.map(o => o._id || o) || []);
        if (allOrderIds.length > 0) {
            const { handleBulkDownloadInvoice } = await import("../Common/orderActions");
            handleBulkDownloadInvoice({ selectedOrders: allOrderIds });
        }
        setDesktopActionDropdown(false);
    };

    return (
        <div className="w-full">
            {/* Filter Bar */}
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
                        {(searchQuery || orderId || awbNumber || paymentType || selectedPickupAddress.length > 0 || selectedCourier.length > 0 || selectedUserId) && (
                            <button onClick={handleClearFilters} className="text-[12px] text-red-500 hover:underline font-[600] whitespace-nowrap">
                                Clear All Filters
                            </button>
                        )}
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2 relative" ref={actionRef}>
                    <button
                        disabled={selectedManifests.length === 0}
                        onClick={() => setDesktopActionDropdown(!desktopActionDropdown)}
                        className={`h-9 px-4 rounded-lg text-[12px] font-[600] flex items-center gap-2 transition-all border ${selectedManifests.length === 0
                            ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                            : "border-[#0CBB7D] text-[#0CBB7D] bg-white hover:bg-green-50 shadow-sm"
                            }`}
                    >
                        Actions <ChevronDown className={`w-4 h-4 transition-transform ${desktopActionDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {desktopActionDropdown && (
                        <div className="absolute right-0 top-11 w-48 bg-white border border-gray-100 shadow-xl rounded z-[100] animate-popup-in font-[600] overflow-hidden">
                            <div className="px-3 py-2 text-[10px] text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2" onClick={handleBulkManifest}>
                                Download Manifests
                            </div>
                            <div className="px-3 py-2 text-[10px] text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2" onClick={handleBulkLabels}>
                                Download Labels
                            </div>
                            <div className="px-3 py-2 text-[10px] text-gray-700 hover:bg-green-50 cursor-pointer flex items-center gap-2" onClick={handleBulkInvoices}>
                                Download Invoices
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div ref={tableRef} className="hidden md:block">
                <div style={{ height: tableHeight }} className="overflow-auto relative bg-white">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-[#0CBB7D] text-white">
                            <tr className="">
                                <th className="px-3 py-2 text-[12px] font-[600] text-center w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedManifests.length === manifests.length && manifests.length > 0}
                                        onChange={() => {
                                            if (selectedManifests.length === manifests.length) setSelectedManifests([]);
                                            else setSelectedManifests(manifests.map(m => m._id));
                                        }}
                                        className="accent-[#0CBB7D] w-3 h-3 cursor-pointer"
                                    />
                                </th>
                                <th className="px-3 py-2 text-[12px] font-[600]">User Details</th>
                                <th className="px-3 py-2 text-[12px] font-[600]">Pickup ID</th>
                                <th className="px-3 py-2 text-[12px] font-[600]">Pickup Address</th>
                                <th className="px-3 py-2 text-[12px] font-[600]">Pickup Date</th>
                                <th className="px-3 py-2 text-[12px] font-[600]">Shipment Count</th>
                                <th className="px-3 py-2 text-[12px] font-[600]">Status</th>
                                <th className="px-3 py-2 text-[12px] font-[600] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[12px]">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-10 text-center"><ThreeDotLoader /></td>
                                </tr>
                            ) : manifests.length > 0 ? (
                                manifests.map((m) => (
                                    <tr key={m._id} className="hover:bg-gray-50 border-b transition-colors text-gray-700">
                                        <td className="px-3 py-2 text-center w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedManifests.includes(m._id)}
                                                onChange={() => {
                                                    if (selectedManifests.includes(m._id)) {
                                                        setSelectedManifests(selectedManifests.filter(id => id !== m._id));
                                                    } else {
                                                        setSelectedManifests([...selectedManifests, m._id]);
                                                    }
                                                }}
                                                className="accent-[#0CBB7D] w-3 h-3 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="text-[#0CBB7D]">{m.userId?.userId || "N/A"}</div>
                                            <div className="">{m.userId?.fullname}</div>
                                            <div className="text-gray-500">{m.userId?.email}</div>
                                            <div className="text-gray-500">{m.userId?.phoneNumber}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div
                                                onClick={() => navigate(`/adminDashboard/order/pickup-manifest/${m.pickupId}`)}
                                                className="text-[#0CBB7D] cursor-pointer hover:underline"
                                            >
                                                {m.pickupId}
                                            </div>
                                            <div className="text-gray-500">
                                                {dayjs(m.createdAt).format('DD MMM YY | hh:mm A')}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 relative">
                                            <div
                                                className="text-gray-700 cursor-help truncate max-w-[120px]"
                                                onMouseEnter={() => setHoveredAddressId(m._id)}
                                                onMouseLeave={() => setHoveredAddressId(null)}
                                            >
                                                {m.pickupAddress?.contactName || "N/A"}
                                            </div>
                                            {hoveredAddressId === m._id && (
                                                <div className="absolute z-[100] left-0 mt-1 p-2 bg-white border border-gray-200 shadow-xl rounded-lg text-[10px] min-w-[200px] animate-popup-in pointer-events-none">
                                                    <div className="font-[600] mb-1">{m.pickupAddress?.contactName}</div>
                                                    <div className="text-gray-700">{m.pickupAddress?.address}</div>
                                                    <div className="text-gray-500">{m.pickupAddress?.city}, {m.pickupAddress?.state} - {m.pickupAddress?.pincode}</div>
                                                    {m.pickupAddress?.phone && <div className="text-gray-500 mt-1">{m.pickupAddress?.phone}</div>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {dayjs(m.pickupDate).format('DD MMM YYYY')}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                            {m.orderIds?.length || 0} Items
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="px-2 py-0.5 bg-green-100 text-[#0CBB7D] text-[10px] rounded uppercase">
                                                {m.status?.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 relative">
                                            <div className="flex justify-center">
                                                <div className="relative" ref={el => individualRefs.current[m._id] = el}>
                                                    <button
                                                        onClick={() => handleDownloadManifest(m)}
                                                        className="bg-[#0CBB7D] text-white px-3 py-2 rounded-lg text-[10px] font-[600] hover:bg-opacity-90 shadow-sm flex items-center"
                                                    >
                                                        Download Manifest
                                                    </button>

                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="py-10 text-center">
                                        <img src={NotFound} alt="No Data" className="w-60 h-60 mx-auto" />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationFooter page={page} totalPages={totalPages} setPage={setPage} limit={limit} setLimit={setLimit} />
            </div>

            {/* Mobile View */}
            <div className="md:hidden w-full">
                <div className="flex items-center justify-between gap-2 mb-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100 mt-2">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border flex-1">
                        <input
                            type="checkbox"
                            checked={selectedManifests.length === manifests.length && manifests.length > 0}
                            onChange={() => {
                                if (selectedManifests.length === manifests.length) setSelectedManifests([]);
                                else setSelectedManifests(manifests.map(m => m._id));
                            }}
                            className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                        />
                        <span className="text-[10px] font-[600]">Select All</span>
                    </div>

                    <div className="relative" ref={mobileActionRef}>
                        <button
                            disabled={selectedManifests.length === 0}
                            className={`h-7 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 transition-all border ${selectedManifests.length === 0
                                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                                : "border-[#0CBB7D] text-[#0CBB7D] bg-white shadow-sm"
                                }`}
                            onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                        >
                            <FaBars className={selectedManifests.length === 0 ? "text-gray-400" : "text-[#0CBB7D]"} />
                            <span className="hidden sm:inline">Actions</span>
                            <ChevronDown className="w-3 h-3 hidden sm:inline" />
                        </button>
                        {mobileDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded shadow-xl z-[100] text-[10px] font-[600] overflow-hidden animate-popup-in">
                                <ul className="">
                                    <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={handleBulkManifest}>Download Manifests</li>
                                    {/* <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={handleBulkLabels}>Download Labels</li>
                                    <li className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer" onClick={handleBulkInvoices}>Download Invoices</li> */}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div ref={mobileTableRef} style={{ height: tableHeight }} className="overflow-auto space-y-3 pb-4">
                    {loading ? (
                        <div className="flex justify-center py-10"><ThreeDotLoader /></div>
                    ) : manifests.length > 0 ? (
                        manifests.map((m, index) => (
                            <div key={m._id} className="text-gray-700 border bg-green-50 p-2 rounded-lg shadow-md space-y-1">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedManifests.includes(m._id)}
                                            onChange={() => {
                                                if (selectedManifests.includes(m._id)) {
                                                    setSelectedManifests(selectedManifests.filter(id => id !== m._id));
                                                } else {
                                                    setSelectedManifests([...selectedManifests, m._id]);
                                                }
                                            }}
                                            className="accent-[#0CBB7D] w-3 h-3 cursor-pointer"
                                        />
                                        <div className="flex items-center gap-1 text-[10px]">
                                            <span className="text-gray-500 font-medium">Pickup ID:</span>
                                            <h3 className="text-[10px] text-[#0CBB7D] cursor-pointer hover:underline" onClick={() => navigate(`/adminDashboard/order/pickup-manifest/${m.pickupId}`)}>
                                                {m.pickupId}
                                            </h3>
                                        </div>
                                        <span className="px-2 py-0.5 bg-green-200 text-[#0CBB7D] text-[10px] rounded">
                                            {m.status?.replace(/_/g, " ")}
                                        </span>
                                    </div>

                                </div>
                                <div className="relative">
                                    <div
                                        className="text-[10px] text-gray-700 border-b border-dashed font-[600] cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setClickedAddressId(clickedAddressId === m._id ? null : m._id);
                                        }}
                                    >
                                        Pickup Address : {m.pickupAddress?.contactName}
                                    </div>
                                    {clickedAddressId === m._id && (
                                        <div className="absolute z-[100] right-0 mt-1 p-2 bg-white border border-gray-200 shadow-xl rounded-lg text-[10px] min-w-[200px] animate-popup-in">
                                            <div className="font-[600] text-gray-700 mb-1">{m.pickupAddress?.contactName}</div>
                                            <div className="text-gray-700">{m.pickupAddress?.address}</div>
                                            <div className="text-gray-500">{m.pickupAddress?.city}, {m.pickupAddress?.state} - {m.pickupAddress?.pincode}</div>
                                            {m.pickupAddress?.phone && <div className="text-gray-500 mt-1">{m.pickupAddress?.phone}</div>}
                                        </div>
                                    )}
                                </div>
                                {/* User Details Section (Admin Only Theme) */}
                                <div className="flex flex-col gap-0.5 border-b border-dashed border-green-200 pb-1.5 mb-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-[#0CBB7D]">{m.userId?.userId || "N/A"}</span>
                                        <span className="text-[10px] text-gray-700">{m.userId?.fullname}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] text-gray-500">
                                        <span className="truncate max-w-[150px]">{m.userId?.email}</span>
                                        <span>{m.userId?.phoneNumber}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between text-[10px] text-gray-500 px-1">
                                    <span>Created: {dayjs(m.createdAt).format('DD MMM, hh:mm A')}</span>
                                    <span className="text-[#0CBB7D] font-medium">{m.orderIds?.length || 0} Shipments</span>
                                </div>

                                <div className="flex items-center p-2 bg-green-200 rounded-lg justify-between gap-4 mt-1">
                                    <div>
                                        <p className="text-[10px] text-gray-500 tracking-wider">Pickup Date</p>
                                        <div className="flex items-center gap-1.5 mt-0.5 text-gray-700 text-[10px]">
                                            {/* <Calendar className="w-3.5 h-3.5 text-[#0CBB7D]" /> */}
                                            {dayjs(m.pickupDate).format('DD MMM YYYY')}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownloadManifest(m)}
                                        className="bg-white text-[#0CBB7D] border border-[#0CBB7D] px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-green-50 shadow-sm flex items-center gap-1.5"
                                    >
                                        Download Manifest
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <img src={NotFound} alt="No Data" className="w-60 h-60 mx-auto" />
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
                searchLabel="Pickup ID"
                searchPlaceholder="Search by Pickup ID"
            />
        </div>
    );
};

export default PickupManifestOrders;
