import React from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { FiCopy, FiCheck } from "react-icons/fi";
import ThreeDotLoader from "../Loader";
import NotFound from "../assets/nodatafound.png"
import OrderRowActions from "./OrderRowActions";
import { handleTrackingByAwb } from "./orderActions";

const OrdersTable = ({
    orders,
    loading,
    selectedOrders,
    handleSelectAll,
    handleCheckboxChange,
    navigate,
    copiedOrderId,
    setCopiedOrderId,
    dropdownOpen,
    toggleDropdown,
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
    showShippingDetails = false,
    showNdrDetails = false,
    showNdrAction = false,
    showActionColumn = true,
    showUserDetails = false,
    onViewNdrHistory,
    onTakeAction,
    handleScheduledPickup,
}) => {

    const truncateText = (text, limit = 30) => {
        if (!text) return "-";
        return text.length > limit ? text.slice(0, limit) + "..." : text;
    };


    return (
        <table className="min-w-full table-auto">
            <thead className="sticky top-0 z-20">
                <tr className="bg-[#0CBB7D] text-white text-[12px] font-[600]">
                    <th className="py-2 px-3">
                        <div className="flex items-center justify-center">
                            <input
                                type="checkbox"
                                checked={selectedOrders.length === orders.length && orders.length > 0}
                                onChange={handleSelectAll}
                                className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                            />
                        </div>
                    </th>

                    {showUserDetails && (
                        <th className="py-2 px-3 text-left">User Details</th>
                    )}
                    <th className="py-2 px-3 text-left">Order Details</th>
                    <th className="py-2 px-3 text-left">Product Details</th>
                    {!showNdrDetails && (
                        <th className="py-2 px-3 text-left">Package Details</th>
                    )}
                    <th className="py-2 px-3 text-left">Payment</th>
                    <th className="py-2 px-3 text-left">Customer Details</th>
                    <th className="py-2 px-3 text-left">Pickup Address</th>
                    {/* ⭐ CONDITIONAL COLUMN */}
                    {showShippingDetails && (
                        <th className="py-2 px-3 text-left">Shipping Details</th>
                    )}
                    <th className="py-2 px-3 text-left">Status</th>
                    {showNdrDetails && (
                        <th className="py-2 px-3 text-left">NDR Details</th>
                    )}
                    {showNdrAction && (
                        <th className="py-2 px-3 text-center">NDR Action</th>
                    )}
                    {showActionColumn && (
                        <th className="py-2 px-3 text-center">Actions</th>
                    )}
                </tr>
            </thead>

            <tbody>
                {loading ? (
                    <tr>
                        <td colSpan={8 + (showShippingDetails ? 1 : 0) + (showNdrDetails ? 1 : 0) + (showNdrAction ? 1 : 0) + (showActionColumn ? 1 : 0) + (showUserDetails ? 1 : 0)} className="text-center py-6">
                            <ThreeDotLoader />
                        </td>
                    </tr>
                ) : orders.length > 0 ? (
                    orders.map((order, index) => (
                        <tr
                            key={order._id}
                            className="border-b border-gray-300 hover:bg-gray-50 text-[12px]"
                        >
                            {/* CHECKBOX */}
                            <td className="py-2 px-3 text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedOrders.includes(order._id)}
                                    onChange={() => handleCheckboxChange(order._id)}
                                    className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                                />
                            </td>

                            {/* USER DETAILS */}
                            {showUserDetails && (
                                <td className="py-2 text-gray-700 px-3 whitespace-nowrap" style={{ maxWidth: "120px", width: "110px" }}>
                                    <p className="text-[#0CBB7D]">{order.userId?.userId}</p>
                                    <p className="">{order.userId?.fullname}</p>
                                    <p className="text-gray-500 max-w-[160px] truncate sm:max-w-[200px]" title={order.userId?.email}>
                                        {order.userId?.email}
                                    </p>
                                    <p className="text-gray-500">{order.userId?.phoneNumber}</p>
                                </td>
                            )}

                            {/* ORDER DETAILS */}
                            <td
                                className="py-2 px-3 whitespace-nowrap"
                                style={{ maxWidth: "150px", width: "120px" }}
                            >
                                {/* ORDER ID + COPY */}
                                <div className="relative cursor-pointer inline-flex items-center group">
                                    <Link
                                        to={`/dashboard/order/neworder/updateOrder/${order._id}`}
                                        className="text-[#0CBB7D] pr-5"
                                    >
                                        {order.orderId}
                                    </Link>

                                    {/* COPY / CHECK ICON */}
                                    <div className="absolute right-0 hidden group-hover:flex items-center">
                                        <span
                                            onClick={() => {
                                                navigator.clipboard.writeText(order.orderId);
                                                setCopiedOrderId(order._id);
                                                setTimeout(() => setCopiedOrderId(null), 1500);
                                            }}
                                            className="relative flex items-center justify-center
                               text-gray-500 hover:text-[#0CBB7D]"
                                        >
                                            {copiedOrderId === order._id ? (
                                                <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                                            ) : (
                                                <FiCopy className="w-3 h-3" />
                                            )}

                                            {/* CUSTOM TOOLTIP */}
                                            <span
                                                className="absolute -top-6 right-1/2 translate-x-1/2
                                 scale-95 opacity-0 z-[100]
                                 group-hover:opacity-100 group-hover:scale-100
                                 transition-all duration-150
                                 bg-gray-500 text-white text-[10px]
                                 px-2 py-1 rounded whitespace-nowrap"
                                            >
                                                {copiedOrderId === order._id ? "Copied!" : "Click to copy"}
                                            </span>
                                        </span>
                                    </div>
                                </div>


                                {/* DATE & TIME */}
                                <p className="text-gray-500 text-[10px]">
                                    {dayjs(order.createdAt).format("DD MMM YYYY")}
                                    <br />
                                    {dayjs(order.createdAt).format("hh:mm A")}
                                </p>

                                <div className="flex gap-2 items-center justify-start">
                                    {/* CHANNEL BADGE */}
                                    <p className="uppercase text-[10px] leading-none text-[#0CBB7D] bg-green-200 py-0.5 px-2 rounded w-fit">
                                        {order?.channel || "CUSTOM"}
                                    </p>
                                    {/* CHANNEL ID */}
                                    {order?.channel === "api" && (
                                        <p className="text-gray-700">({order.channelId})</p>
                                    )}
                                </div>
                            </td>

                            {/* PRODUCT DETAILS */}
                            <td
                                className="py-2 px-3 whitespace-normal"
                                style={{ maxWidth: "350px", width: "150px" }}
                            >
                                {(() => {
                                    const products = order.productDetails || [];

                                    const names = products.map(p => p.name).join(", ") || "-";
                                    const skus = products.map(p => p.sku).join(", ") || "-";

                                    // const showNameHover = names.length > 30;

                                    const totalQty = products.reduce(
                                        (sum, p) => sum + (p.quantity || 0),
                                        0
                                    );

                                    const totalPrice = products.reduce(
                                        (sum, p) => sum + (p.quantity || 0) * (p.unitPrice || 0),
                                        0
                                    );

                                    return (
                                        <div className="relative space-y-1">
                                            {/* NAME (HOVER SOURCE) */}
                                            <div className="relative group inline-block max-w-full">
                                                <p
                                                    className={`inline-block max-w-full cursor-pointer border-b border-dashed border-gray-400 group-hover:border-gray-600`}
                                                >
                                                    {truncateText(names, 17)}
                                                </p>

                                                {/* {showNameHover && ( */}
                                                <>
                                                    {/* TOOLTIP */}
                                                    <div
                                                        className="absolute z-[200] hidden group-hover:block
                bg-white text-gray-700 text-[10px]
                p-2 rounded shadow-2xl w-[300px] border
                top-1/2 left-full ml-2
                transform -translate-y-1/2
                whitespace-normal select-text pointer-events-auto"
                                                    >
                                                        <table className="w-full border-collapse">
                                                            <thead>
                                                                <tr className="text-left border-b">
                                                                    <th className="pb-1 pr-2 font-semibold">Name</th>
                                                                    <th className="pb-1 pr-2 font-semibold">SKU</th>
                                                                    <th className="pb-1 pr-2 font-semibold">Qty</th>
                                                                    <th className="pb-1 pr-2 font-semibold">Price</th>
                                                                    <th className="pb-1 font-semibold">Total</th>
                                                                </tr>
                                                            </thead>

                                                            <tbody>
                                                                {products.map((p, idx) => (
                                                                    <tr key={idx} className="border-b last:border-0">
                                                                        <td className="py-1 pr-2 break-words">{p.name}</td>
                                                                        <td className="py-1 pr-2 break-words">{p.sku}</td>
                                                                        <td className="py-1 pr-2">{p.quantity}</td>
                                                                        <td className="py-1 pr-2">₹{p.unitPrice}</td>
                                                                        <td className="py-1">
                                                                            ₹{(p.quantity || 0) * (p.unitPrice || 0)}
                                                                        </td>
                                                                    </tr>
                                                                ))}

                                                                {/* TOTAL ROW */}
                                                                <tr className="font-semibold border-t">
                                                                    <td colSpan={2} className="pt-1">Total</td>
                                                                    <td className="pt-1">{totalQty}</td>
                                                                    <td />
                                                                    <td className="pt-1">₹{totalPrice}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* INVISIBLE HOVER BRIDGE */}
                                                    <div className="absolute left-full top-0 w-3 h-full"></div>
                                                </>
                                                {/* )} */}
                                            </div>

                                            {/* SKU (NO HOVER, ONLY TRUNCATE) */}
                                            <p>
                                                SKU : {truncateText(skus, 10)}
                                            </p>

                                            {/* OTHER DETAILS */}
                                            <p>QTY : {totalQty}</p>
                                        </div>
                                    );
                                })()}
                            </td>

                            {/* PACKAGE DETAILS */}
                            {!showNdrDetails && (
                                <td className="py-2 px-3 whitespace-nowrap">
                                    {order.orderType === "B2B" ? (
                                        <>
                                            <p>
                                                {order.B2BPackageDetails?.packages?.reduce((acc, pkg) => acc + (pkg.noOfBox || 0), 0) || 0} Boxes | {order.B2BPackageDetails?.packages?.reduce((acc, pkg) => acc + (pkg.weightPerBox || 0) * (pkg.noOfBox || 0), 0) || 0} KG
                                            </p>
                                            <p>Weight: {order.B2BPackageDetails?.applicableWeight || 0} KG</p>
                                            <p>Vol. Weight: {Number(order.B2BPackageDetails?.volumetricWeight || 0).toFixed(2)} KG</p>
                                        </>
                                    ) : (
                                        <>
                                            <p>Weight: {order.packageDetails?.applicableWeight} KG</p>
                                            <p>L*W*H: {order.packageDetails?.volumetricWeight?.length}*{order.packageDetails?.volumetricWeight?.width}*{order.packageDetails?.volumetricWeight?.height}</p>
                                            <p>Vol. Weight: {((order.packageDetails?.volumetricWeight?.length * order.packageDetails?.volumetricWeight?.width * order.packageDetails?.volumetricWeight?.height) / 5000).toFixed(2)} KG</p>
                                        </>
                                    )}
                                </td>
                            )}

                            {/* PAYMENT */}
                            <td className="py-2 px-3">
                                <p>₹ {order.paymentDetails?.amount}</p>
                                <span className="text-[10px] bg-green-100 text-[#0CBB7D] px-2 py-0.5 rounded">
                                    {order.paymentDetails?.method}
                                </span>
                            </td>

                            <td
                                className="py-2 px-3 whitespace-nowrap"
                                style={{ maxWidth: "180px", width: "150px" }}
                            >
                                {(() => {
                                    const name = order?.receiverAddress?.contactName || "-";
                                    const phone = order?.receiverAddress?.phoneNumber || "-";
                                    const email = order?.receiverAddress?.email || "-";

                                    // const showHover = name.length > 18;

                                    return (
                                        <div className="relative">
                                            {/* NAME (HOVER SOURCE) */}
                                            <div className="relative group inline-block max-w-full">
                                                <p
                                                    className={`inline-block max-w-full cursor-pointer border-b border-dashed border-gray-400 group-hover:border-gray-600`}
                                                >
                                                    {truncateText(name, 16)}
                                                </p>

                                                {/* {showHover && ( */}
                                                <>
                                                    {/* TOOLTIP */}
                                                    <div
                                                        className="absolute z-[200] hidden group-hover:block
                bg-white text-gray-700 text-[10px]
                p-2 rounded shadow-2xl w-64 border
                top-1/2 left-full ml-2
                transform -translate-y-1/2
                whitespace-normal break-words leading-relaxed
                select-text pointer-events-auto"
                                                    >
                                                        <p className="font-[600]">{name}</p>
                                                        <p>{order?.receiverAddress?.address}</p>
                                                        <p>
                                                            {order?.receiverAddress?.city},{" "}
                                                            {order?.receiverAddress?.state} -{" "}
                                                            {order?.receiverAddress?.pinCode}
                                                        </p>

                                                        {email !== "-" && (
                                                            <>
                                                                <p className="font-[600] mt-1">Email :</p>
                                                                <p>{email}</p>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* INVISIBLE HOVER BRIDGE */}
                                                    <div className="absolute left-full top-0 w-3 h-full"></div>
                                                </>
                                                {/* )} */}
                                            </div>

                                            {/* PHONE (NO HOVER) */}
                                            <p className="text-gray-500 mt-1">{phone}</p>
                                        </div>
                                    );
                                })()}
                            </td>


                            <td
                                className="py-2 px-3 whitespace-nowrap"
                                style={{ maxWidth: "150px", width: "130px" }}
                            >
                                <div className="relative inline-block group">
                                    {/* NAME (ELLIPSIS) */}
                                    <p
                                        className="text-gray-700 border-b border-dashed border-gray-400 
                 truncate cursor-pointer"
                                        style={{ maxWidth: "130px" }}
                                        title={order.pickupAddress?.contactName}
                                    >
                                        {order.pickupAddress?.contactName || "-"}
                                    </p>

                                    {/* HOVER DETAILS (STAYS OPEN) */}
                                    <div
                                        className="absolute z-[100] hidden group-hover:block 
                 bg-white text-gray-700 text-[10px] 
                 p-3 rounded-md border shadow-2xl w-64 
                 top-1/2 right-full mr-3 transform -translate-y-1/2 
                 whitespace-normal break-words leading-relaxed"
                                    >
                                        <div className="text-left select-text">
                                            <p className="font-[600] text-gray-700">
                                                {order.pickupAddress?.contactName}
                                            </p>

                                            <p>
                                                {order.pickupAddress?.address}
                                            </p>

                                            <p>
                                                {order.pickupAddress?.city}, {order.pickupAddress?.state} -{" "}
                                                {order.pickupAddress?.pinCode}
                                            </p>

                                            <p className="text-gray-700">
                                                {order.pickupAddress?.phoneNumber}
                                            </p>
                                        </div>
                                        <div className="absolute left-full top-0 w-3 h-full"></div>
                                    </div>

                                </div>
                            </td>
                            {/* ⭐ SHIPPING DETAILS */}
                            {showShippingDetails && (
                                <td
                                    className="py-2 px-3 whitespace-nowrap"
                                    style={{ maxWidth: "150px", width: "130px" }}
                                >
                                    {/* COURIER NAME */}
                                    <p className="text-gray-700">
                                        {order.courierServiceName || "-"}
                                    </p>

                                    {/* BOOKED DATE & TIME (SAME FORMAT AS ORDER DETAILS) */}
                                    <p className="text-gray-500 text-[10px]">
                                        Booked On :{" "}
                                        {order.shipmentCreatedAt
                                            ? `${dayjs(order.shipmentCreatedAt).format("DD MMM YYYY")}`
                                            : "-"}
                                    </p>


                                    {/* AWB + COPY (SAME BEHAVIOR AS ORDER ID) */}
                                    {order.awb_number && (
                                        <div className="relative inline-flex items-center group">
                                            <p
                                                className="text-[12px] text-[#0CBB7D] cursor-pointer pr-5"
                                                onClick={() =>
                                                    handleTrackingByAwb(order.awb_number, navigate)
                                                }
                                            >
                                                {order.awb_number}
                                            </p>

                                            {/* COPY / CHECK ICON */}
                                            <div className="absolute right-0 hidden cursor-pointer group-hover:flex items-center">
                                                <span
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // 👈 prevent tracking click
                                                        navigator.clipboard.writeText(order.awb_number);
                                                        setCopiedOrderId(order._id + "_awb");
                                                        setTimeout(() => setCopiedOrderId(null), 1500);
                                                    }}
                                                    className="relative flex items-center justify-center
                     text-gray-500 hover:text-[#0CBB7D]"
                                                >
                                                    {copiedOrderId === order._id + "_awb" ? (
                                                        <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                                                    ) : (
                                                        <FiCopy className="w-3 h-3" />
                                                    )}

                                                    {/* CUSTOM TOOLTIP */}
                                                    <span
                                                        className="absolute -top-6 right-1/2 translate-x-1/2
                       scale-95 opacity-0 z-[100]
                       group-hover:opacity-100 group-hover:scale-100
                       transition-all duration-150
                       bg-gray-500 text-white text-[10px]
                       px-2 py-1 rounded whitespace-nowrap"
                                                    >
                                                        {copiedOrderId === order._id + "_awb"
                                                            ? "Copied!"
                                                            : "Click to copy"}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </td>

                            )}
                            <td className="py-2 px-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-[#0CBB7D]">{order.status}</span>
                            </td>

                            {/* NDR DETAILS */}
                            {showNdrDetails && (
                                <td className="py-2 px-3 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] text-gray-500">
                                            {order.ndrReason?.date ? dayjs(order.ndrReason.date).format("DD MMM YYYY | hh:mm A") : "N/A"}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="relative inline-block group">
                                                {/* Trigger */}
                                                <span
                                                    className="text-[10px] border-b border-dashed border-[#0CBB7D] 
               text-[#0CBB7D] cursor-pointer"
                                                >
                                                    {order.ndrHistory?.length || 0} Attempted
                                                </span>

                                                {/* Hover Card */}
                                                <div
                                                    className="absolute z-[200] hidden group-hover:block
               bg-white text-gray-700 text-[10px]
               p-3 rounded-md border shadow-2xl w-64
               top-1/2 right-full mr-2
               transform -translate-y-1/2
               whitespace-normal break-words leading-relaxed
               select-text pointer-events-auto"
                                                >
                                                    <p className="font-[600] mb-1">Last NDR Reason</p>
                                                    <p className="">
                                                        {order.ndrReason?.reason || "N/A"}
                                                    </p>
                                                </div>

                                                {/* Invisible hover bridge (IMPORTANT) */}
                                                <div className="absolute left-full top-0 w-3 h-full"></div>
                                            </div>

                                            <button
                                                onClick={() => onViewNdrHistory && onViewNdrHistory(order)}
                                                className="text-[10px] bg-[#0CBB7D] text-white px-2 py-0.5 rounded hover:bg-opacity-90 transition-all font-[600]"
                                            >
                                                History
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            )}

                            {/* NDR ACTION */}
                            {showNdrAction && (
                                <td className="py-2 px-3 text-center">
                                    <button
                                        onClick={() => onTakeAction && onTakeAction(order)}
                                        className="bg-[#0CBB7D] text-white px-3 py-1.5 rounded-lg text-[10px] font-[600] hover:bg-opacity-90 transition-all shadow-sm"
                                    >
                                        Take Action
                                    </button>
                                </td>
                            )}

                            {/* ACTIONS */}
                            {showActionColumn && (
                                <td className="py-2 px-3 text-center">
                                    <div className="flex justify-center items-center gap-2">
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
                                            handleClone={handleClone}
                                            setRefresh={setRefresh}
                                            handleScheduledPickup={handleScheduledPickup}
                                        />
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={8 + (showShippingDetails ? 1 : 0) + (showNdrDetails ? 1 : 0) + (showNdrAction ? 1 : 0) + (showActionColumn ? 1 : 0) + (showUserDetails ? 1 : 0)} className="text-center py-6">
                            <div className="flex flex-col items-center justify-center"><img src={NotFound} alt="No Data Found" className="w-60 h-60 object-contain mb-2" /></div>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default OrdersTable;
