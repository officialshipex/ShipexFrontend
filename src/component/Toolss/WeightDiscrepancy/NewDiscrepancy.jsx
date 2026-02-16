import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link, useParams } from "react-router-dom";
// import { toast } from "react-toastify";
import AcceptAllModal from "./AcceptAllModal";
import UploadImageModal from "./UploadImageModal";
import DeclinedReasonPopup from "./DeclinedReasonPopup";
import dayjs from "dayjs";
import { ChevronDown } from "lucide-react";
import { FiMoreHorizontal, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { FaFilter, FaBars } from "react-icons/fa";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import ThreeDotLoader from "../../../Loader"
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";
import PaginationFooter from "../../../Common/PaginationFooter";
import DateFilter from "../../../filter/DateFilter";
import OrderAwbFilter from "../../../filter/OrderAwbFilter";
import DiscrepancyFilter from "../../../filter/DiscrepancyFilter";
import { getCarrierLogo } from "../../../Common/getCarrierLogo";
import NotFound from "../../../assets/nodatafound.png";



const NewDiscrepancy = ({ refresh, setRefresh }) => {
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [orders, setOrders] = useState([]);
    const [refresh1, setRefresh1] = useState(false);
    const [loadingOrderId, setLoadingOrderId] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]); // Track selected orders
    const [searchBy, setSearchBy] = useState("awbNumber");
    const [inputValue, setInputValue] = useState("");
    const [clearTrigger, setClearTrigger] = useState(false);
    const [price, setPrice] = useState(0);
    const [loading, setLoading] = useState(false); // New loading state
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [declienedPopup, setDeclienedPopup] = useState(false);
    const [reason, setReason] = useState(null)
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [provider, setProvider] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [disputeAwbNumber, setDisputeAwbNumber] = useState()
    const [declineAwbNumber, setDeclineAwbNumber] = useState()
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
        fetchDiscrepancy();
    }, [dateRange, page, limit, inputValue, searchBy, provider, refresh1, refresh]);

    const fetchDiscrepancy = async () => {
        try {
            const token = Cookies.get("session");
            setLoading(true)
            const params = {
                id,
                page,
                limit,
                provider,
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
            setOrders(response.data.results || []);
            setTotalPages(response.data.page || 0);
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
    const handleTrackingByAwb = (awb) => {
        navigate(`/dashboard/order/tracking/${awb}`);
    };
    const handleClearFilters = () => {
        setInputValue("");
        setSearchBy("awbNumber");
        setDateRange(null);
        setProvider("")
        setPage(1)
    }



    return (
        <div>
            {/* Desktop Table */}
            <div className="w-full">
                {/* Reusable Filter Section */}
                <DiscrepancyFilter
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    searchBy={searchBy}
                    setSearchBy={setSearchBy}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    provider={provider}
                    setProvider={setProvider}
                    showUserFilter={false}
                    clearTrigger={clearTrigger}
                    setClearTrigger={setClearTrigger}
                    setPage={setPage}
                    handleExport={handleExportExcel}
                    selectedDispute={selectedOrders}
                    customActions={[
                        {
                            label: "Accept",
                            onClick: () => setIsModalOpen(true),
                        }
                    ]}
                />

                <div className="hidden md:block relative">
                    <div className="relative overflow-x-auto bg-white overflow-y-auto h-[calc(100vh-300px)]">
                        <table className="w-full text-left border-collapse">
                            {/* Table Head */}
                            <thead className="sticky top-0 z-20 bg-[#0CBB7D]">
                                <tr className="text-white text-[12px] font-[600]">
                                    <th className="py-2 px-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.length === orders.length && orders.length > 0}
                                            onChange={handleSelectAll}
                                            className="cursor-pointer accent-[#0CBB7D] w-4"
                                        />
                                    </th>
                                    <th className="py-2 px-3">Product Details</th>
                                    <th className="py-2 px-3">Date</th>
                                    <th className="py-2 px-3">Shipping Details</th>
                                    <th className="py-2 px-3">Applied Weight</th>
                                    <th className="py-2 px-3">Charged Weight</th>
                                    <th className="py-2 px-3">Excess Weight & Charges</th>
                                    <th className="py-2 px-3">Status</th>
                                    <th className="py-2 px-3">Actions</th>
                                </tr>
                            </thead>

                            {/* Table Body */}
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4">
                                            <ThreeDotLoader />
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4">
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

                                    orders.map((order, index) => {
                                        const discrepancyDate = new Date(order.createdAt);
                                        const today = new Date();
                                        const daysPassed = Math.floor((today - discrepancyDate) / (1000 * 60 * 60 * 24));
                                        const remainingDays = Math.max(7 - daysPassed, 0);

                                        return (
                                            <tr key={index} className="text-[12px] border-b text-gray-500">
                                                {/* Box for Remaining Days */}
                                                <td className="py-2 px-3 relative align-middle">
                                                    <div className="absolute -top-2 left-2 bg-red-500 z-[40] text-white text-[10px] px-2 py-1 w-auto rounded-lg whitespace-nowrap">
                                                        {remainingDays > 0 ? `${remainingDays} days left` : "Auto Accepting Soon"}
                                                    </div>

                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOrders.includes(order._id)}
                                                        onChange={() => handleCheckboxChange(order._id)}
                                                        className="cursor-pointer accent-[#0CBB7D] w-4"
                                                    />
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "300px", width: "250px" }}>
                                                    <p>
                                                        <span>Product Name:</span>{" "}
                                                        <span className="inline-block truncate align-bottom" title={order.productDetails.map(item => item.name).join(", ")}>
                                                            {order.productDetails.map(item => item.name).join(", ")}
                                                        </span>
                                                    </p>
                                                    <p className="break-words whitespace-normal">
                                                        <span>SKU:</span>{" "}
                                                        {order.productDetails.map((item) => item.sku).join(", ")}
                                                    </p>
                                                    <p>
                                                        <span>QTY:</span>{" "}
                                                        {order.productDetails.map(item => item.quantity).join(", ")}
                                                    </p>
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <p>{new Date(order.createdAt).toLocaleTimeString()}</p>
                                                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <p>AWB: <span onClick={() => handleTrackingByAwb(order.awbNumber)} className="text-[#0CBB7D] font-[600] cursor-pointer">{order.awbNumber}</span></p>
                                                    <p className="text-gray-500">{order.courierServiceName}</p>
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <p className="font-[600]">Applied weight: {order.enteredWeight
                                                        .applicableWeight} Kg</p>
                                                    <p>
                                                        Dead Weight: {order.enteredWeight.deadWeight} Kg
                                                    </p>
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
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <p className="font-[600]">
                                                        Charged weight: {order.chargedWeight.applicableWeight} Kg
                                                    </p>
                                                    <p>
                                                        Dead Weight: {order.chargedWeight.deadWeight} Kg
                                                    </p>
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

                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <p className="font-[600]"><span>Excess Weight:</span>
                                                        {order.excessWeightCharges.excessWeight} Kg
                                                    </p>
                                                    <p>
                                                        <span>Excess Charges:</span>{" "}
                                                        ₹{Number(order.excessWeightCharges.excessCharges || 0).toFixed(2)}
                                                    </p>

                                                    <p>
                                                        <span>Pending Amount:</span>
                                                        ₹{Number(order.excessWeightCharges.pendingAmount || 0).toFixed(2)}
                                                    </p>
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <span className="px-2 py-1 rounded text-[10px] bg-green-100 text-green-700">
                                                        {order?.status}
                                                    </span>
                                                </td>

                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <div className="relative" ref={(el) => { if (el) dropdownRefs.current[index] = el }}></div>
                                                    <button
                                                        ref={(el) => {
                                                            if (el) toggleButtonRefs.current[index] = el;
                                                        }}
                                                        // ✅ Imp
                                                        className="px-2 py-2 flex items-center justify-center bg-[#0CBB7D] text-white rounded-full"
                                                        onClick={() => toggleDropdown(index)}
                                                    >
                                                        <FiMoreHorizontal className="text-[12px]" />
                                                    </button>

                                                    {dropdownOpen === index && (
                                                        <div className="absolute right-6 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
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
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


                <div className="block md:hidden">
                    <div className="px-2 py-1 bg-green-200 rounded-lg flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            checked={selectedOrders.length === orders.length && orders.length > 0}
                            onChange={handleSelectAll}
                            className="accent-[#0CBB7D] w-3 h-3"
                        />
                        <span className="text-[10px] font-[600] text-gray-500">Select All</span>
                    </div>
                    <div className="space-y-2 h-[calc(100vh-290px)] overflow-y-auto">

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <ThreeDotLoader />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <img src={NotFound} alt="Not Found" className="w-60 h-60" />
                                {/* <p className="text-[14px]">No weight discrepancies found.</p> */}
                            </div>
                        ) : (
                            orders.map((order, index) => {
                                const discrepancyDate = new Date(order.createdAt);
                                const today = new Date();
                                const daysPassed = Math.floor((today - discrepancyDate) / (1000 * 60 * 60 * 24));
                                const remainingDays = Math.max(7 - daysPassed, 0);

                                return (
                                    <div key={index} className="bg-white rounded-lg border border-gray-300 overflow-hidden text-[12px] relative">
                                        {/* Top Header: Order ID + Checkbox + Remaining Days */}
                                        <div className="flex justify-between items-start px-3 py-2 text-gray-700">
                                            {/* Left: Checkbox + Order ID */}
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOrders.includes(order._id)}
                                                    onChange={() => handleCheckboxChange(order._id)}
                                                    className="accent-[#0CBB7D] w-3 h-3"
                                                />
                                                <span>Order ID : #{order.orderId || order._id?.slice(-6)}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="relative" ref={(el) => dropdownRefs.current[index] = el}>
                                                    <button
                                                        className="text-gray-700"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleDropdown(index);
                                                        }}
                                                    >
                                                        <FiMoreHorizontal size={18} />
                                                    </button>
                                                    {dropdownOpen === index && (
                                                        <div className="absolute right-0 top-6 w-[130px] bg-white border border-gray-200 rounded-lg shadow-sm z-50">
                                                            <ul className="">
                                                                <li
                                                                    className="px-3 py-2 text-gray-700 hover:bg-green-100 cursor-pointer text-[10px]"
                                                                    onClick={() => {
                                                                        handleDiscrepancy(order.awbNumber);
                                                                        setDropdownOpen(null);
                                                                    }}
                                                                >
                                                                    Accept Discrepancy
                                                                </li>
                                                                <li
                                                                    className="px-3 py-2 text-gray-700 hover:bg-green-100 cursor-pointer text-[10px] border-t"
                                                                    onClick={() => {
                                                                        handleOpenPopup(order.awbNumber);
                                                                        setDropdownOpen(null);
                                                                    }}
                                                                >
                                                                    Raise Discrepancy
                                                                </li>
                                                                {order.adminStatus === "Discrepancy Declined" && (
                                                                    <li
                                                                        className="px-3 py-2 text-gray-700 hover:bg-green-100 cursor-pointer text-[10px] border-t"
                                                                        onClick={() => {
                                                                            handleDeclinedPopup(order.awbNumber, order.discrepancyDeclinedReason);
                                                                            setDropdownOpen(null);
                                                                        }}
                                                                    >
                                                                        Declined Reason
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Weight Discrepancy Row */}
                                        <div className="flex justify-between items-center px-3 py-2 bg-red-50 text-[10px]">
                                            <div className="text-red-600">
                                                Charged Weight: {order.chargedWeight?.applicableWeight} Kg
                                            </div>
                                            <div className="text-gray-500">
                                                Applied Weight: {order.enteredWeight?.applicableWeight} Kg
                                            </div>
                                        </div>

                                        {/* Discrepancy Raised Date + Auto Accept */}
                                        <div className="flex items-center justify-between px-3 py-2 bg-white">
                                            <div className="text-gray-500">
                                                Discrepancy Raised On:{" "}
                                                {new Date(order.createdAt).toLocaleDateString("en-GB")}
                                            </div>
                                            <div className={`text-white text-[10px] px-2 py-1 rounded-lg ${remainingDays > 0 ? "bg-red-500" : "bg-orange-500"}`}>
                                                {remainingDays > 0 ? `${remainingDays} Days Left` : "Auto Accept Soon"}
                                            </div>
                                        </div>

                                        {/* Footer: Courier Info */}
                                        <div className="flex justify-between items-center px-3 py-2 bg-green-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 shadow-sm border border-gray-100">
                                                    <img
                                                        src={getCarrierLogo(order.courierServiceName || "")}
                                                        alt="courier"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <span className="text-gray-500 text-[10px]">
                                                    {order.courierServiceName}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-gray-500 text-[10px]">
                                                    AWB : <span onClick={() => handleTrackingByAwb(order.awbNumber)} className="text-[#0CBB7D] cursor-pointer">{order.awbNumber}</span>
                                                </span>
                                                <span className="text-[#0CBB7D] text-[10px]">
                                                    ₹{Number(order?.excessWeightCharges?.pendingAmount || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
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