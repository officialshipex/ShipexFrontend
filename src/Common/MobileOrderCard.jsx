import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import OrderRowActions from "./OrderRowActions";
import { getCarrierLogo } from "../Common/getCarrierLogo";
import { FiCopy, FiCheck } from "react-icons/fi";

import { handleTrackingByAwb } from "../Common/orderActions";
const MobileOrderCard = ({
    order,
    index,
    selectedOrders,
    handleCheckboxChange,
    toggleDropdown,
    dropdownOpen,
    dropdownRefs,
    toggleButtonRefs,
    dropdownDirection,
    handleInvoice,
    handleLabel,
    handleManifest,
    cancelOrder,
    handleCancelOrder,
    refresh,
    setRefresh,
    handleClone,
    navigate,
    showShippingDetails = false,
    showNdrDetails = false,
    showNdrAction = false,
    showActionColumn = true,
    showUserDetails = false,
    onViewNdrHistory,
    onTakeAction,
    handleScheduledPickup,
    handleUpdateOrder,
}) => {
    const [openPopup, setOpenPopup] = useState(null);
    const [popupPosition, setPopupPosition] = useState("right");
    const popupRef = useRef(null);
    const [copiedOrderId, setCopiedOrderId] = useState()

    const products = order?.productDetails || [];


    // 🔥 Decide popup position dynamically
    const calculatePosition = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const viewportCenter = window.innerWidth / 2;

        // If element is on left half of screen → open TOP-RIGHT
        if (rect.left < viewportCenter) {
            return "top-right";
        }

        // If element is on right half of screen → open TOP-LEFT
        return "top-left";
    };


    const getPopupClass = () => {
        switch (popupPosition) {
            case "top-right":
                return "bottom-full left-0 mb-2";
            case "top-left":
                return "bottom-full right-0 mb-2";
            default:
                return "bottom-full left-0 mb-2";
        }
    };


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                setOpenPopup(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div className="text-gray-700 animate-popup-in border bg-white p-2 rounded-lg shadow-md space-y-1">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleCheckboxChange(order._id)}
                        className="accent-[#0CBB7D] w-3 h-3"
                    />
                    <div className="flex items-center gap-1 text-[10px]">
                        <span>Order ID:</span>

                        <Link
                            to={`/dashboard/order/neworder/updateOrder/${order._id}`}
                            className="text-[#0CBB7D]"
                        >
                            {order.orderId}
                        </Link>

                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(order.orderId);
                                setCopiedOrderId(order._id);
                                setTimeout(() => setCopiedOrderId(null), 1500);
                            }}
                            className="flex items-center justify-center
      text-[#0CBB7D] cursor-pointer"
                        >
                            {copiedOrderId === order._id ? (
                                <FiCheck className="w-3 h-3 text-green-600" />
                            ) : (
                                <FiCopy className="w-3 h-3" />
                            )}
                        </span>
                    </div>

                    <p className="text-[10px] px-2 rounded bg-green-200 text-[#0CBB7D]">{order.status}</p>
                </div>

                {showActionColumn && (
                    <OrderRowActions
                        index={index}
                        order={order}
                        dropdownOpen={dropdownOpen}
                        toggleDropdown={toggleDropdown}
                        dropdownRefs={dropdownRefs}
                        toggleButtonRefs={toggleButtonRefs}
                        dropdownDirection={dropdownDirection}
                        handleInvoice={handleInvoice}
                        handleLabel={handleLabel}
                        handleManifest={handleManifest}
                        cancelOrder={cancelOrder}
                        handleCancelOrder={handleCancelOrder}
                        refresh={refresh}
                        setRefresh={setRefresh}
                        handleClone={handleClone}
                        setDropdownOpen={() => { }}
                        handleScheduledPickup={handleScheduledPickup}
                        handleUpdateOrder={order.status === "new" ? handleUpdateOrder : undefined}
                        renderOnly="dropdown"
                    />
                )}
            </div>

            {/* USER DETAILS (ADMIN ONLY) */}
            {showUserDetails && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-[#0CBB7D] text-[10px] shrink-0 border border-gray-300">
                            {order.userId?.fullname?.charAt(0)}
                        </div>
                        <div className="min-w-0 leading-tight">
                            <p className="font-bold text-gray-700 text-[10px] truncate">{order.userId?.fullname}</p>
                            <p className="text-gray-500 text-[10px] truncate">{order.userId?.email}</p>
                            {/* <p className="text-gray-400 text-[9px] truncate">{row.user.userId}</p> */}
                        </div>
                    </div>
                    <p className="text-[#0CBB7D] font-medium text-[10px] tracking-widest shrink-0">
                        {order.userId.userId}
                    </p>
                </div>
            )}

            {/* DATE + CHANNEL */}
            <div className="flex justify-between text-[10px]">
                <p className="text-gray-500">
                    Order Created On : {" "}
                    {dayjs(order.createdAt).format("DD MMM YYYY")} |{" "}
                    {dayjs(order.createdAt).format("hh:mm A")}
                </p>
                <div className="flex justify-center items-center gap-2">
                    <p>{order.channelId}</p>
                    <span className="uppercase text-[#0CBB7D] bg-green-200 px-2 rounded">
                        {order.channel || "CUSTOM"}
                    </span>
                </div>
            </div>


            {showShippingDetails && (
                <div className="flex items-center p-2 bg-green-100 rounded-lg justify-between gap-2">
                    {/* Courier Logo & Details */}

                    <div className="flex items-center gap-2">
                        <img
                            src={getCarrierLogo(order.courierServiceName)}
                            alt={order.courierServiceName}
                            className="w-8 h-8 rounded-full border-2 border-gray-400"
                        />
                        <div>
                            <p className="text-[10px] text-gray-700">
                                {order.courierServiceName}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-700">
                                <span
                                    className="text-[#0CBB7D] cursor-pointer"
                                    onClick={() =>
                                        handleTrackingByAwb(order.awb_number, navigate)
                                    }
                                >
                                    {order.awb_number}
                                </span>

                                <span
                                    onClick={(e) => {
                                        e.stopPropagation(); // 👈 prevent tracking click
                                        navigator.clipboard.writeText(order.awb_number);
                                        setCopiedOrderId(order._id + "_awb");
                                        setTimeout(() => setCopiedOrderId(null), 1500);
                                    }}
                                    className="flex items-center justify-center
      text-[#0CBB7D] cursor-pointer"
                                >
                                    {copiedOrderId === order._id + "_awb" ? (
                                        <FiCheck className="w-3 h-3 text-green-600" />
                                    ) : (
                                        <FiCopy className="w-3 h-3" />
                                    )}
                                </span>
                            </div>

                        </div>
                    </div>

                    <div className="text-[10px] flex justify-center items-center text-gray-500">
                        <div className="flex items-start gap-1">
                            <span>Delivered On :</span>

                            {order.tracking[order.tracking.length - 1].StatusDateTime ? (
                                <div className="flex flex-col leading-tight">
                                    <span>
                                        {dayjs(order.tracking[order.tracking.length - 1].StatusDateTime).format("DD MMM YYYY")}
                                    </span>
                                    <span>
                                        {dayjs(order.tracking[order.tracking.length - 1].StatusDateTime).format("hh:mm A")}
                                    </span>
                                </div>
                            ) : (
                                <span>-</span>
                            )}
                        </div>
                    </div>
                </div>
            )
            }


            <div className="text-[10px] flex justify-between items-center text-gray-500" >
                {order.orderType === "B2B" ? (
                    <>
                        <p>Boxes: {order.B2BPackageDetails?.packages?.reduce((acc, pkg) => acc + (pkg.noOfBox || 0), 0) || 0} | {order.B2BPackageDetails?.packages?.reduce((acc, pkg) => acc + (pkg.weightPerBox || 0) * (pkg.noOfBox || 0), 0) || 0} KG</p>
                        <p>Weight: {order.B2BPackageDetails?.applicableWeight || 0} KG</p>
                    </>
                ) : (
                    <>
                        <p>Weight: {order.packageDetails?.applicableWeight} KG</p>
                        <p>Vol. Weight: {((order.packageDetails?.volumetricWeight?.length * order.packageDetails?.volumetricWeight?.width * order.packageDetails?.volumetricWeight?.height) / 5000).toFixed(2)} KG</p>
                    </>
                )}
            </div >

            {/* ROUTE */}
            <div className="flex justify-between text-[10px]" >
                {/* PICKUP */}
                <div className="relative" ref={openPopup === "pickup" ? popupRef : null}>
                    <p
                        onClick={(e) => {
                            e.stopPropagation();
                            setPopupPosition(calculatePosition(e));
                            setOpenPopup(openPopup === "pickup" ? null : "pickup");
                        }}
                        className="truncate max-w-[90px] cursor-pointer border-b border-dashed"
                    >
                        {order?.pickupAddress?.contactName || "Pickup"}
                    </p>

                    {openPopup === "pickup" && (
                        <div
                            className={`absolute z-[300] bg-white border shadow-xl rounded-lg p-2 w-[260px] ${getPopupClass()} animate-popup-in transition-all duration-200 ease-out`}
                        >
                            <p className="font-semibold text-[10px]">
                                {order?.pickupAddress?.contactName}
                            </p>
                            <p className="text-[10px]">{order?.pickupAddress?.address}</p>
                            <p className="text-[10px]">
                                {order?.pickupAddress?.city},{" "}
                                {order?.pickupAddress?.state} -{" "}
                                {order?.pickupAddress?.pinCode}
                            </p>
                        </div>
                    )}
                </div>

                <span className="text-gray-400">→</span>

                {/* RECEIVER */}
                <div className="relative" ref={openPopup === "receiver" ? popupRef : null}>
                    <p
                        onClick={(e) => {
                            e.stopPropagation();
                            setPopupPosition(calculatePosition(e));
                            setOpenPopup(openPopup === "receiver" ? null : "receiver");
                        }}
                        className="truncate max-w-[90px] cursor-pointer border-b border-dashed"
                    >
                        {order?.receiverAddress?.contactName || "Receiver"}
                    </p>

                    {openPopup === "receiver" && (
                        <div
                            className={`absolute z-[300] bg-white border shadow-xl rounded-lg p-2 w-[260px] ${getPopupClass()} animate-popup-in transition-all duration-200 ease-out`}
                        >
                            <p className="font-semibold text-[10px]">
                                {order?.receiverAddress?.contactName}
                            </p>
                            <p className="text-[10px]">{order?.receiverAddress?.address}</p>
                            <p className="text-[10px]">
                                {order?.receiverAddress?.city},{" "}
                                {order?.receiverAddress?.state} -{" "}
                                {order?.receiverAddress?.pinCode}
                            </p>
                        </div>
                    )}
                </div>
            </div >

            {/* FOOTER WITH SEPARATORS */}
            <div className="flex items-center justify-between bg-green-100 px-2 py-1 rounded-lg text-[10px]" >
                {/* PRODUCTS */}
                <div className="relative" ref={openPopup === "products" ? popupRef : null}>
                    <p
                        onClick={(e) => {
                            e.stopPropagation();
                            setPopupPosition(calculatePosition(e));
                            setOpenPopup(openPopup === "products" ? null : "products");
                        }}
                        className="truncate max-w-[120px] cursor-pointer border-b border-dashed"
                    >
                        {products[0]?.name || "Products"}
                    </p>

                    {openPopup === "products" && (
                        <div
                            className={`absolute z-[300] bg-white border shadow-xl rounded-lg p-2 w-[300px] ${getPopupClass()} animate-popup-in transition-all duration-200 ease-out`}
                        >
                            <table className="w-full text-[10px]">
                                <thead>
                                    <tr className="border-b">
                                        <th>Name</th>
                                        <th>SKU</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((p, i) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td>{p.name}</td>
                                            <td>{p.sku}</td>
                                            <td>{p.quantity}</td>
                                            <td>₹{p.unitPrice}</td>
                                            <td>₹{p.quantity * p.unitPrice}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <span className="text-gray-500">|</span>

                <p>{order?.paymentDetails?.method || "N/N"}</p>

                <span className="text-gray-500">|</span>

                <p>
                    ₹ {order?.paymentDetails?.amount || "N/N"}
                </p>

            </div >

            {
                showActionColumn && (
                    <OrderRowActions
                        index={index}
                        order={order}
                        dropdownOpen={dropdownOpen}
                        toggleDropdown={toggleDropdown}
                        dropdownRefs={dropdownRefs}
                        toggleButtonRefs={toggleButtonRefs}
                        dropdownDirection={dropdownDirection}
                        handleInvoice={handleInvoice}
                        handleLabel={handleLabel}
                        handleManifest={handleManifest}
                        cancelOrder={cancelOrder}
                        handleCancelOrder={handleCancelOrder}
                        refresh={refresh}
                        setRefresh={setRefresh}
                        handleClone={handleClone}
                        setDropdownOpen={() => { }}
                        handleScheduledPickup={handleScheduledPickup}
                        handleUpdateOrder={order.status === "new" ? handleUpdateOrder : undefined}
                        renderOnly="action"
                    />
                )
            }

            {/* NDR DETAILS (MOBILE) */}
            {showNdrDetails && (
                <div className="py-2 border-t border-dashed border-gray-200 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                        <div className="flex items-center gap-2">
                            {/* <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-bold">NDR: {order.ndrStatus || "Undelivered"}</span> */}
                            <span className="text-gray-500">{order.ndrReason?.date ? dayjs(order.ndrReason.date).format("DD MMM, hh:mm A") : ""}</span>
                        </div>
                        <button
                            onClick={() => onViewNdrHistory && onViewNdrHistory(order)}
                            className="bg-[#0CBB7D] text-white px-2 py-0.5 rounded hover:bg-opacity-90 transition-all font-[600]"
                        >
                            History ({order.ndrHistory?.length || 0})
                        </button>
                    </div>
                    {order.ndrReason?.reason && (
                        <p className="text-[10px] text-gray-600 bg-white p-2 rounded border border-gray-100 italic">
                            Reason: {order.ndrReason?.reason}
                        </p>
                    )}
                    {showNdrAction && (
                        <button
                            onClick={() => onTakeAction && onTakeAction(order)}
                            className="w-full text-[#0CBB7D] bg-white border border-[#0CBB7D] py-2 rounded-lg text-[10px] font-[600] hover:bg-opacity-90 transition-all shadow-sm"
                        >
                            Take Action
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MobileOrderCard;
