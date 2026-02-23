import React, { useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { FiMoreHorizontal } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const OrderRowActions = ({
    index,
    order,
    dropdownOpen,
    toggleDropdown,
    dropdownRefs,
    toggleButtonRefs,
    dropdownDirection, // kept for prop compatibility, but we calc locally primarily
    handleInvoice,
    handleLabel,
    handleManifest,
    cancelOrder,
    handleCancelOrder,
    refresh,
    setRefresh,
    handleClone,
    handleScheduledPickup,
    setDropdownOpen = () => { },
    renderOnly = "both" // "both", "action", "dropdown"
}) => {
    const navigate = useNavigate();
    const [position, setPosition] = useState(null);
    const isNewOrder = order.status === "new";

    // Unified cancel handler
    const onCancel = (e) => {
        e.stopPropagation();
        if (cancelOrder) {
            cancelOrder({ orderId: order._id, refresh, setRefresh });
        } else if (handleCancelOrder) {
            handleCancelOrder(order, setRefresh);
        }
        setDropdownOpen(null);
    };

    const getStatusAction = (order) => ({
        new: {
            label: "Ship Now",
            className: "sm:bg-[#0CBB7D] bg-white text-[#0CBB7D] sm:text-white sm:border-0 border border-[#0CBB7D]",
            onClick: () =>
                navigate(order.orderType === "B2B"
                    ? `/dashboard/order/b2b/courierSelection/${order._id}`
                    : `/dashboard/order/courierSelection/${order._id}`
                ),
        },
        Booked: {
            label: "Schedule Pickup",
            className: "sm:bg-[#0CBB7D] bg-white text-[#0CBB7D] sm:text-white sm:border-0 border border-[#0CBB7D]",
            onClick: () =>
                handleScheduledPickup(order),
        },
        "Ready To Ship": {
            label: "Download Manifest",
            className: "sm:bg-[#0CBB7D] bg-white text-[#0CBB7D] sm:text-white sm:border-0 border border-[#0CBB7D]",
            onClick: () =>
                handleManifest(order._id),
        },
        Cancelled: {
            label: "Clone Order",
            className: "sm:bg-[#0CBB7D] bg-white text-[#0CBB7D] sm:text-white sm:border-0 border border-[#0CBB7D]",
            onClick: () =>
                handleClone ? handleClone(order._id, setRefresh) : null
        },
    });

    const action = getStatusAction(order)[order.status];

    // Status-based visibility logic
    const showCancel = ["Ready To Ship", "Booked", "Not Picked"].includes(order.status);
    const cancelLabel = isNewOrder ? "Delete Order" : "Cancel Order";
    const restrictedForManifest = ["new", "Booked", "Not Picked", "Cancelled"];
    const showDownloadManifest = !restrictedForManifest.includes(order.status);
    const restrictedForLabel = ["new", "Booked", "Ready To Ship", "Not Picked", "Cancelled"];
    const showDownloadLabel = !restrictedForLabel.includes(order.status);

    // Calculate position whenever we open
    useLayoutEffect(() => {
        if (dropdownOpen === index && toggleButtonRefs.current[index]) {
            const rect = toggleButtonRefs.current[index].getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUp = spaceBelow < 250; // Threshold for flipping

            setPosition({
                top: openUp ? 'auto' : rect.bottom + 5,
                bottom: openUp ? window.innerHeight - rect.top + 5 : 'auto',
                left: rect.right - 160, // Align right edge of dropdown (w-40 = 160px) to right edge of button
                transformOrigin: openUp ? 'bottom right' : 'top right'
            });
        }
    }, [dropdownOpen, index, toggleButtonRefs]);

    const isOpen = dropdownOpen === index;

    return (
        <div className="flex justify-center items-center gap-2">
            {(renderOnly === "both" || renderOnly === "action") && action && (
                <button
                    className={`h-[30px] px-2 py-1 sm:px-2 sm:py-2 rounded-lg text-[10px] font-[600]
      hover:opacity-90 transition-all duration-200
      ${renderOnly === 'action' ? 'w-full mt-2' : ''}
      ${action.className}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                    }}
                >
                    {action.label}
                </button>
            )}

            {(renderOnly === "both" || renderOnly === "dropdown") && (
                <div className="relative inline-block" ref={el => { if (dropdownRefs.current) dropdownRefs.current[index] = el }}>
                    <button
                        ref={el => { if (toggleButtonRefs.current) toggleButtonRefs.current[index] = el }}
                        className={`text-gray-700 rounded-lg text-[10px] p-2 bg-gray-100 transition-colors ${isOpen ? 'bg-green-100 text-[#0CBB7D]' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(index);
                        }}
                    >
                        <FiMoreHorizontal size={16} className={isOpen ? "text-[#0CBB7D]" : "text-gray-700"}/>
                    </button>

                    {isOpen && position && createPortal(
                        <>
                            {/* Mobile Backdrop */}
                            <div className="fixed inset-0 z-[60] md:hidden" onClick={() => setDropdownOpen(null)}></div>

                            <div
                                className="fixed z-[9999] bg-white border rounded-lg shadow-sm w-40 animate-popup-in overflow-hidden"
                                style={{
                                    top: position.top,
                                    bottom: position.bottom,
                                    left: position.left,
                                    transformOrigin: position.transformOrigin
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ul className="text-[10px] font-[600]">
                                    {/* Label logic */}
                                    {showDownloadLabel && (
                                        order.provider === "Amazon Shipping" ? (
                                            <li className="hover:bg-green-50 transition-colors">
                                                <a
                                                    href={order.label}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block px-3 py-2 text-gray-700"
                                                    onClick={() => setDropdownOpen(null)}
                                                >
                                                    Download Label
                                                </a>
                                            </li>
                                        ) : (
                                            <li
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (handleLabel) handleLabel(order._id);
                                                    setDropdownOpen(null);
                                                }}
                                                className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer transition-colors"
                                            >
                                                Download Label
                                            </li>
                                        )
                                    )}

                                    {/* Invoice logic */}
                                    <li
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (handleInvoice) handleInvoice(order._id);
                                            setDropdownOpen(null);
                                        }}
                                        className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer transition-colors"
                                    >
                                        Download Invoice
                                    </li>

                                    {/* Manifest logic */}
                                    {showDownloadManifest && (
                                        <li
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (handleManifest) handleManifest(order._id);
                                                setDropdownOpen(null);
                                            }}
                                            className="px-3 py-2 text-gray-700 hover:bg-green-50 cursor-pointer transition-colors"
                                        >
                                            Download Manifest
                                        </li>
                                    )}

                                    {/* Cancel logic */}
                                    {(isNewOrder || showCancel) && (
                                        <li
                                            className="px-3 py-2 text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                                            onClick={onCancel}
                                        >
                                            {cancelLabel}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </>,
                        document.body
                    )}
                </div>
            )}
        </div>
    );
};

export default OrderRowActions;
