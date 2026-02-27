import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link, useParams } from "react-router-dom";
// import { toast } from "react-toastify";
import AcceptAllModal from "./AcceptAllModal";
import UploadImageModal from "./UploadImageModal";
import SharedWeightDiscrepancyTable from "./SharedWeightDiscrepancyTable";
import SharedWeightDiscrepancyCard from "./SharedWeightDiscrepancyCard";
import dayjs from "dayjs";
import { ChevronDown, Filter } from "lucide-react";
import { FiMoreHorizontal, FiArrowRight, FiArrowLeft, FiCopy, FiCheck } from "react-icons/fi";
import { FaFilter, FaBars } from "react-icons/fa";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import ThreeDotLoader from "../../../Loader"
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";
import PaginationFooter from "../../../Common/PaginationFooter";
import DateFilter from "../../../filter/DateFilter";
import DiscrepancyFilterPanel from "../../../Common/DiscrepancyFilterPanel";
import { getCarrierLogo } from "../../../Common/getCarrierLogo";
import NotFound from "../../../assets/nodatafound.png";



const NewDiscrepancy = ({ refresh, setRefresh }) => {
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [copiedAwb, setCopiedAwb] = useState(null);
    const [productPopupId, setProductPopupId] = useState(null);
    const [orders, setOrders] = useState([]);
    const [refresh1, setRefresh1] = useState(false);
    const [loadingOrderId, setLoadingOrderId] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]); // Track selected orders
    const [searchBy, setSearchBy] = useState("awbNumber");
    const [inputValue, setInputValue] = useState("");
    const [clearTrigger, setClearTrigger] = useState(0);
    const [price, setPrice] = useState(0);
    const [loading, setLoading] = useState(false); // New loading state
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [declienedPopup, setDeclienedPopup] = useState(false);
    const [reason, setReason] = useState(null)
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [selectedCourier, setSelectedCourier] = useState([]);
    const [courierOptions, setCourierOptions] = useState([]);
    const [dateRange, setDateRange] = useState(null);
    const [disputeAwbNumber, setDisputeAwbNumber] = useState()
    const [declineAwbNumber, setDeclineAwbNumber] = useState()
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
    const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
    const desktopActionRef = useRef(null);
    const mobileActionRef = useRef(null);
    const { id } = useParams();
    const dropdownRefs = useRef([]);
    const toggleButtonRefs = useRef([]);




    const handleExportExcel = () => {
        if (selectedOrders.length === 0) {
            Notification("No orders selected for export.", "info");
            return;
        }

        // Filter only selected orders
        const exportData = orders
            .filter(order => selectedOrders.includes(order._id))
            .map(order => ({
                "Order ID": order.orderId,
                "Order Status": order.status,
                "Order Date": new Date(order.createdAt).toLocaleString(),
                "Sender Name": order.pickupAddress?.contactName,
                "Sender Email": order.pickupAddress?.email,
                "Sender Phone": order.pickupAddress?.phoneNumber,
                "Sender Address": order.pickupAddress?.address,
                "Sender City": order.pickupAddress?.city,
                "Sender State": order.pickupAddress?.state,
                "Sender Pin": order.pickupAddress?.pinCode,
                "Receiver Name": order.receiverAddress?.contactName,
                "Receiver Email": order.receiverAddress?.email,
                "Receiver Phone": order.receiverAddress?.phoneNumber,
                "Receiver Address": order.receiverAddress?.address,
                "Receiver City": order.receiverAddress?.city,
                "Receiver State": order.receiverAddress?.state,
                "Receiver Pin": order.receiverAddress?.pinCode,
                "Payment Method": order.paymentDetails?.method,
                "Payment Amount": order.paymentDetails?.amount,
                "Courier": order.courierServiceName,
                "AWB Number": order.awb_number,
                // Add more fields as needed
                "Products": order.productDetails?.map(
                    p => `Name: ${p.name}, SKU: ${p.sku}, Qty: ${p.quantity}, Price: ${p.unitPrice}`
                ).join(" | ")
            }));

        // Create worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Orders");

        // Generate buffer and save
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        saveAs(blob, "orders.xlsx");
    };

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    const navigate = useNavigate();
    const handleOpenPopup = (awb) => {
        setDisputeAwbNumber(awb);  // Store AWB number
        setIsOpen(true);
    };

    const handleDeclinedPopup = (awb, reason) => {
        setDeclineAwbNumber(awb);  // Store AWB number
        setReason(reason)
        setDeclienedPopup(true);
    }
    const toggleDropdown = (index) => {
        // Delay the toggle so it doesn't conflict with the mousedown event
        setTimeout(() => {
            setDropdownOpen((prev) => (prev === index ? null : index));
        }, 0);
    };





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
    }, [dateRange, page, limit, inputValue, searchBy, selectedCourier, refresh1, refresh]);

    const fetchDiscrepancy = async () => {
        try {
            const token = Cookies.get("session");
            setLoading(true)
            const params = {
                id,
                page,
                limit,
                courierServiceName: selectedCourier.length > 0 ? selectedCourier.join(",") : undefined,
                status: "new"
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
            if (response.data.courierServices) {
                setCourierOptions(response.data.courierServices);
            }
            setLoading(false)
        } catch (error) {
            Notification("Error fetching transactions", "error");
        }
    };



    const handleSelectAll = () => {
        if (selectedOrders.length === orders.length) {
            setSelectedOrders([]); // Unselect all
            setPrice(0); // Reset price
        } else {
            const allOrderIds = orders.map(order => order._id);
            const totalPrice = orders
                .map(order => parseFloat(order.excessWeightCharges.pendingAmount)) // Convert to number
                .reduce((a, b) => a + b, 0); // Sum up all amounts

            setSelectedOrders(allOrderIds);
            setPrice(parseFloat(totalPrice.toFixed(2))); // Ensure correct rounding
        }
    };


    // Handle individual row selection
    const handleCheckboxChange = (orderId) => {
        setSelectedOrders((prevSelectedOrders) => {
            let updatedSelectedOrders = [...prevSelectedOrders];
            let updatedPrice = price;

            const selectedOrder = orders.find(order => order._id === orderId);
            if (!selectedOrder) {
                console.error(`Order with ID ${orderId} not found`);
                return prevSelectedOrders;
            }

            const pendingAmount = parseFloat(selectedOrder.excessWeightCharges.pendingAmount);

            if (prevSelectedOrders.includes(orderId)) {
                // Deselecting: Remove order and subtract its price
                updatedSelectedOrders = prevSelectedOrders.filter(id => id !== orderId);
                updatedPrice -= pendingAmount;
            } else {
                // Selecting: Add order and add its price
                updatedSelectedOrders.push(orderId);
                updatedPrice += pendingAmount;
            }
            console.log("Selected Orders:", updatedSelectedOrders);
            console.log("Updated Price:", updatedPrice);
            setPrice(parseFloat(updatedPrice.toFixed(2))); // Ensure it's correctly rounded
            return updatedSelectedOrders;
        });
    };




    const handleDiscrepancy = async (awb_number) => {
        setLoading(true);
        try {
            const token = Cookies.get("session");
            const payload = {
                awb_number: awb_number
            }
            const response = await axios.post(
                `${REACT_APP_BACKEND_URL}/dispreancy/acceptDiscrepancy`, payload,
                {
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log(response.data)
            Notification(response.data.message, "success")
            setRefresh1(true)
            setRefresh(true)



            // console.log(orders)
        } catch (error) {
            Notification(error.response.data.message, "error")
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }
    const handleCopyAwb = (awb, id) => {
        navigator.clipboard.writeText(awb);
        setCopiedAwb(id);
        setTimeout(() => setCopiedAwb(null), 1500);
    };

    const handleTrackingByAwb = (awb) => {
        navigate(`/dashboard/order/tracking/${awb}`);
    };
    const handleClearFilters = () => {
        setInputValue("");
        setSearchBy("awbNumber");
        setDateRange(null);
        setSelectedCourier([]);
        setClearTrigger(prev => prev + 1);
        setIsFilterPanelOpen(false);
        setPage(1);
    };

    const isAnyFilterApplied = inputValue || selectedCourier.length > 0 || dateRange;



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
                                    <div
                                        className="px-3 py-2 hover:bg-green-100 cursor-pointer font-[600] text-gray-500"
                                        onClick={() => { setIsModalOpen(true); setDesktopDropdownOpen(false); }}
                                    >
                                        Accept
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
                        <>
                            <div className="relative" ref={(el) => { if (el) dropdownRefs.current[index] = el }}></div>
                            <button
                                ref={(el) => {
                                    if (el) toggleButtonRefs.current[index] = el;
                                }}
                                className={`text-gray-700 rounded-lg text-[10px] p-2 bg-gray-100 transition-colors ${dropdownOpen === index ? 'bg-green-100' : ''}`}
                                onClick={() => toggleDropdown(index)}
                            >
                                <FiMoreHorizontal size={16} className={dropdownOpen === index ? "text-[#0CBB7D]" : "text-gray-700"} />
                            </button>

                            {dropdownOpen === index && (
                                <div className="absolute right-6 animate-popup-in mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <ul className="text-[10px] font-[600]">
                                        <li className={`px-3 py-2 text-gray-500 hover:bg-green-100 cursor-pointer ${loading ? "cursor-not-allowed" : ""}`}>
                                            <button onClick={(e) => { handleDiscrepancy(order.awbNumber); e.stopPropagation(); setDropdownOpen(null) }} disabled={loading}>
                                                {loading ? "Processing..." : "Accept Discrepancy"}
                                            </button>
                                        </li>
                                        <li className="px-3 py-2 text-gray-500 hover:bg-green-100 cursor-pointer">
                                            <button onClick={(e) => { handleOpenPopup(order.awbNumber); e.stopPropagation(); setDropdownOpen(null) }}>
                                                Raise Discrepancy
                                            </button>
                                        </li>
                                        {order.adminStatus === "Discrepancy Declined" && (
                                            <li className="px-3 py-2 text-gray-500 hover:bg-green-100 cursor-pointer">
                                                <button onClick={(e) => { handleDeclinedPopup(order.awbNumber, order.discrepancyDeclinedReason); e.stopPropagation(); setDropdownOpen(null) }}>
                                                    Declined Reason
                                                </button>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                />


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
                                    <div
                                        className="px-3 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                                        onClick={() => { setIsModalOpen(true); setMobileDropdownOpen(false); }}
                                    >
                                        Accept
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
                                <>
                                    <button onClick={() => toggleDropdown(index)}>
                                        <FiMoreHorizontal size={18} className="text-gray-600" />
                                    </button>

                                    {dropdownOpen === index && (
                                        <div className="absolute animate-popup-in right-0 top-6 w-[130px] bg-white border rounded-lg shadow-lg z-50">
                                            <ul className="text-[10px] font-[600] text-gray-600">
                                                <li
                                                    className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                                                    onClick={() => {
                                                        handleDiscrepancy(order.awbNumber);
                                                        setDropdownOpen(null);
                                                    }}
                                                >
                                                    Accept Discrepancy
                                                </li>
                                                <li
                                                    className="px-3 py-2 hover:bg-green-50 cursor-pointer border-t"
                                                    onClick={() => {
                                                        handleOpenPopup(order.awbNumber);
                                                        setDropdownOpen(null);
                                                    }}
                                                >
                                                    Raise Discrepancy
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}
                        />
                    </div>
                </div>




                <AcceptAllModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={() => {
                        console.log("Accepting all orders:", selectedOrders);
                        setIsModalOpen(false);

                    }}
                    price={price}
                    selectedOrders={selectedOrders}
                    setRefresh1={setRefresh1}
                    setRefresh={setRefresh}
                />
                {isOpen && <UploadImageModal setRefresh1={setRefresh1}
                    setRefresh={setRefresh} awbNumber={disputeAwbNumber} onClose={() => setIsOpen(false)} />}

                {declienedPopup && <DeclinedReasonPopup isOpen={declienedPopup} onClose={() => setDeclienedPopup(false)} awbNumber={declineAwbNumber} declinedReason={reason} />}

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
        </div >
    );
};

export default NewDiscrepancy;