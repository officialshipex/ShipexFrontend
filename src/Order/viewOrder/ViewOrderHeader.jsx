import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { FiCopy, FiCheck, FiEdit } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import OrderRowActions from "../../Common/OrderRowActions";
import {
    handleInvoice,
    handleLabel,
    handleManifest,
    handleCancelOrderAtBooked,
    handleClone
} from "../../Common/orderActions";

const ViewOrderHeader = ({ order }) => {
    const navigate = useNavigate();
    const [copiedOrderId, setCopiedOrderId] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const dropdownRefs = useRef([]);
    const toggleButtonRefs = useRef([]);

    const handleUpdateOrder = () => {
        const orderUserId = order.userId?._id || order.userId;
        const url = `/dashboard/order/neworder?updateId=${order._id}${orderUserId ? `&userId=${orderUserId}` : ''}`;
        navigate(url);
        setDropdownOpen(null);
    };

    const toggleDropdown = (index) => {
        setDropdownOpen(dropdownOpen === index ? null : index);
    };

    const handleCopyOrderId = () => {
        navigator.clipboard.writeText(order.orderId);
        setCopiedOrderId(true);
        setTimeout(() => setCopiedOrderId(false), 1500);
    };

    return (
        <div className="bg-white p-2 rounded-lg shadow-sm mb-2 sticky top-[60px] z-40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {/* Header Top: Back Button + Order ID/Copy + Actions (Mobile) */}
                <div className="flex items-center justify-between w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1.5 rounded-full hover:bg-green-100 transition"
                            title="Go Back"
                        >
                            <ArrowLeft className="w-4 h-4 text-gray-500" />
                        </button>

                        <div className="flex items-center gap-2 group">
                            <h1 className="sm:text-[14px] text-[10px] font-[600] text-gray-700">
                                Order ID <span className="text-[#0CBB7D]">{order.orderId}</span>
                            </h1>

                            {/* Copy Icon */}
                            <div
                                onClick={handleCopyOrderId}
                                className="cursor-pointer transition-opacity"
                            >
                                <div className="relative flex items-center justify-center text-gray-500 hover:text-[#0CBB7D]">
                                    {copiedOrderId ? (
                                        <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                                    ) : (
                                        <FiCopy className="w-3 h-3" />
                                    )}

                                    {/* Tooltip */}
                                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 scale-95 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-gray-500 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap z-[100]">
                                        {copiedOrderId ? "Copied!" : "Click to copy"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status (Desktop only) */}
                        <span
                            className={`hidden sm:inline-block px-2 font-[600] py-1 rounded text-[10px] ${order.status === "Cancelled"
                                ? "bg-red-100 text-red-600"
                                : "bg-green-100 text-[#0CBB7D]"
                                }`}
                        >
                            {order.status}
                        </span>
                    </div>

                    {/* Actions for Mobile */}
                    <div className="sm:hidden">
                        <OrderRowActions
                            index={0}
                            order={order}
                            dropdownOpen={dropdownOpen}
                            toggleDropdown={toggleDropdown}
                            dropdownRefs={dropdownRefs}
                            toggleButtonRefs={toggleButtonRefs}
                            handleInvoice={handleInvoice}
                            handleLabel={handleLabel}
                            handleManifest={handleManifest}
                            handleCancelOrder={handleCancelOrderAtBooked}
                            handleClone={handleClone}
                            handleUpdateOrder={order.status === "new" ? handleUpdateOrder : undefined}
                            setDropdownOpen={setDropdownOpen}
                        />
                    </div>
                </div>

                {/* Status and Actions (Desktop) */}
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    {/* Status (Mobile only) */}
                    <span
                        className={`sm:hidden px-2 font-[600] py-1 rounded text-[10px] ${order.status === "Cancelled"
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-[#0CBB7D]"
                            }`}
                    >
                        {order.status}
                    </span>

                    {/* Actions for Desktop */}
                    <div className="hidden sm:block">
                        <OrderRowActions
                            index={0}
                            order={order}
                            dropdownOpen={dropdownOpen}
                            toggleDropdown={toggleDropdown}
                            dropdownRefs={dropdownRefs}
                            toggleButtonRefs={toggleButtonRefs}
                            handleInvoice={handleInvoice}
                            handleLabel={handleLabel}
                            handleManifest={handleManifest}
                            handleCancelOrder={handleCancelOrderAtBooked}
                            handleClone={handleClone}
                            handleUpdateOrder={order.status === "new" ? handleUpdateOrder : undefined}
                            setDropdownOpen={setDropdownOpen}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewOrderHeader;
