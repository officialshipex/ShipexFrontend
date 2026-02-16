import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { ChevronDown } from "lucide-react";
import { FaFilter, FaBars } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ThreeDotLoader from "../../../Loader";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";
import PaginationFooter from "../../../Common/PaginationFooter";
import DateFilter from "../../../filter/DateFilter";
import OrderAwbFilter from "../../../filter/OrderAwbFilter";
import DiscrepancyFilter from "../../../filter/DiscrepancyFilter";
import { getCarrierLogo } from "../../../Common/getCarrierLogo";
import NotFound from "../../../assets/nodatafound.png";
import DetailsModal from "./AdminDiscrepancy/DetailsModal";

const OrderEscalatedDiscrepancy = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [searchBy, setSearchBy] = useState("awbNumber");
    const [inputValue, setInputValue] = useState("");
    const [clearTrigger, setClearTrigger] = useState(false);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [provider, setProvider] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const { id } = useParams();
    const [isModalOpen1, setIsModalOpen1] = useState(false);
    const [selectedData, setSelectedData] = useState({});

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const navigate = useNavigate();

    const handleOpenModal = (text, imageUrl) => {
        setSelectedData({ text, imageUrl });
        setIsModalOpen1(true);
    };



    const fetchDiscrepancy = async () => {
        try {
            const token = Cookies.get("session");
            setLoading(true);
            const params = {
                id,
                page,
                limit,
                provider,
                status: "Escalated"
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
            setLoading(false);
        } catch (error) {
            Notification("Error fetching transactions", "error");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscrepancy();
    }, [dateRange, page, limit, inputValue, searchBy, provider]);

    const handleTrackingByAwb = (awb) => {
        navigate(`/dashboard/order/tracking/${awb}`);
    };

    const handleClearFilters = () => {
        setInputValue("");
        setSearchBy("awbNumber");
        setDateRange(null);
        setProvider("");
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
        saveAs(blob, "order_escalated_discrepancies.xlsx");
    };

    return (
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
            />

            {/* Desktop Table Section */}
            <div className="hidden md:block relative">
                <div className="relative overflow-x-auto bg-white overflow-y-auto h-[calc(100vh-300px)] border-gray-300">
                    <table className="w-full text-left border-collapse">
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
                                <th className="py-2 px-3">Details</th>
                            </tr>
                        </thead>
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
                                            <img src={NotFound} alt="No Data Found" className="w-60 h-60 object-contain mb-2" />
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order, index) => (
                                    <tr key={index} className="text-[12px] border-b text-gray-500">
                                        <td className="py-2 px-3 relative align-middle">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order._id)}
                                                onChange={() => handleCheckboxChange(order._id)}
                                                className="cursor-pointer accent-[#0CBB7D] w-4"
                                            />
                                        </td>
                                        <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "300px", width: "250px" }}>
                                            <p><span>Product Name:</span> <span className="inline-block truncate align-bottom" title={order.productDetails.map(item => item.name).join(", ")}>{order.productDetails.map(item => item.name).join(", ")}</span></p>
                                            <p className="break-words whitespace-normal"><span>SKU:</span> {order.productDetails.map(item => item.sku).join(", ")}</p>
                                            <p><span>QTY:</span> {order.productDetails.map(item => item.quantity).join(", ")}</p>
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
                                            <p className="font-[600]">Charged weight: {order.chargedWeight?.applicableWeight} Kg</p>
                                            <p>Dead Weight: {order.chargedWeight?.deadWeight} Kg</p>
                                        </td>
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            <p className="font-[600]"><span>Excess Weight:</span> {order.excessWeightCharges?.excessWeight} Kg</p>
                                            <p><span>Excess Charges:</span> ₹{Number(order.excessWeightCharges?.excessCharges || 0).toFixed(2)}</p>
                                            <p><span>Pending Amount:</span> ₹{Number(order.excessWeightCharges?.pendingAmount || 0).toFixed(2)}</p>
                                        </td>
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            <span className="px-2 py-1 rounded-lg text-[10px] bg-green-100 text-green-700">
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            <span
                                                className="text-[#0CBB7D] hover:underline cursor-pointer"
                                                onClick={() => handleOpenModal(order.text, order.imageUrl)}
                                            >
                                                View Details
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View: Display Orders as Cards */}
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
                        </div>
                    ) : (
                        orders.map((order, index) => (
                            <div key={index} className="bg-white rounded-lg border border-gray-300 overflow-hidden text-[12px] relative">
                                <div className="flex justify-between items-start px-3 py-2 text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.includes(order._id)}
                                            onChange={() => handleCheckboxChange(order._id)}
                                            className="accent-[#0CBB7D] w-3 h-3"
                                        />
                                        <span>Order ID : #{order.orderId || order._id?.slice(-6)}</span>
                                    </div>
                                    <span
                                        className="text-[#0CBB7D] cursor-pointer hover:underline"
                                        onClick={() => handleOpenModal(order.text, order.imageUrl)}
                                    >
                                        View Details
                                    </span>
                                </div>
                                <div className="flex justify-between items-center px-3 py-2 bg-red-50 text-[12px]">
                                    <div className="text-red-600">Charged Weight: {order.chargedWeight?.applicableWeight} Kg</div>
                                    <div className="text-gray-500">Applied Weight: {order.enteredWeight?.applicableWeight} Kg</div>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 bg-white">
                                    <div className="text-gray-500">Raised On: {new Date(order.createdAt).toLocaleDateString("en-GB")}</div>
                                    <div className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-lg">{order.status}</div>
                                </div>
                                <div className="flex justify-between items-center px-3 py-2 bg-green-100">
                                    <div className="flex items-center gap-2">
                                        <img src={getCarrierLogo(order.courierServiceName)} alt="courier" className="w-6 h-6 border-2 border-gray-300 rounded-full object-contain" />
                                        <span className="text-gray-500">{order.courierServiceName}</span>
                                    </div>
                                    <span className="text-gray-500">AWB : <span className="text-[#0CBB7D]">{order.awbNumber}</span></span>
                                    <span className="text-gray-500">₹{Number(order.excessWeightCharges?.pendingAmount || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isModalOpen1 && <DetailsModal isOpen={isModalOpen1} onClose={() => setIsModalOpen1(false)} data={selectedData} />}

            {/* Pagination Controls */}
            <PaginationFooter
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                limit={limit}
                setLimit={setLimit}
            />
        </div>
    );
};

export default OrderEscalatedDiscrepancy;
