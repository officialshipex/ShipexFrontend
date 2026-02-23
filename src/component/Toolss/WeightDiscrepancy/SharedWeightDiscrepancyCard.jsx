import React from "react";
import dayjs from "dayjs";
import { FiCopy, FiCheck } from "react-icons/fi";
import { getCarrierLogo } from "../../../Common/getCarrierLogo";
import ThreeDotLoader from "../../../Loader";
import NotFound from "../../../assets/nodatafound.png";

const SharedWeightDiscrepancyCard = ({
    orders,
    loading,
    isAdmin = false,
    selectedOrders = [],
    handleCheckboxChange,
    handleTrackingByAwb,
    handleCopyAwb,
    copiedAwb,
    renderActions,
    renderBottomActions,
}) => {
    return (
        <div className="space-y-2 h-[calc(100vh-255px)] overflow-y-auto">
            {loading ? (
                <div className="flex justify-center py-10">
                    <ThreeDotLoader />
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <img src={NotFound} alt="No data found" className="w-60 h-60" />
                </div>
            ) : (
                orders.map((order, index) => {
                    const discrepancyDate = new Date(order.createdAt);
                    const today = new Date();
                    const daysPassed = Math.floor((today - discrepancyDate) / (1000 * 60 * 60 * 24));
                    const remainingDays = Math.max(7 - daysPassed, 0);

                    return (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden text-[10px]">
                            {/* HEADER ROW */}
                            <div className="flex justify-between items-center px-3 py-1">
                                {/* Left: Checkbox + Order ID + Status */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.includes(order._id)}
                                        onChange={() => handleCheckboxChange(order._id)}
                                        className="accent-[#0CBB7D] w-3 h-3"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="font-[600] text-gray-700 text-[10px]">
                                            Order Id : <span className="font-[600] text-[#0CBB7D]">{order.channelOrderId || order.orderId || order._id?.slice(-6)}</span>
                                        </span>
                                        <button onClick={() => handleCopyAwb(order.channelOrderId || order.orderId || order._id?.slice(-6), `order-${index}`)}>
                                            {copiedAwb === `order-${index}` ? (
                                                <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                                            ) : (
                                                <FiCopy className="w-3 h-3 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-[#0CBB7D]">
                                        {order.adminStatus || order.status}
                                    </span>
                                </div>

                                {/* Right: Actions */}
                                {renderActions && (
                                    <div className="relative">
                                        {renderActions(order, index)}
                                    </div>
                                )}
                            </div>

                            {/* User Info (Admin Only) */}
                            {isAdmin && (
                                <div className="my-1 px-3 flex items-center justify-between px-0.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 rounded-full bg-white border border-[#0CBB7D]/20 flex items-center justify-center font-bold text-[#0CBB7D] text-[10px] shrink-0 shadow-sm">
                                            {order.user?.name?.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-700 text-[10px] truncate">{order.user?.name}</p>
                                            <p className="text-gray-400 text-[10px] leading-none truncate">{order.user?.email}</p>
                                        </div>
                                    </div>
                                    <p className="text-[#0CBB7D] font-bold text-[10px] tracking-widest shrink-0">
                                        {order.user?.userId}
                                    </p>
                                </div>
                            )}

                            {/* WEIGHT DETAILS */}
                            <div className="px-3 py-1 text-[10px] flex justify-between items-center text-gray-700">
                                <div>
                                    <span className="font-[600] text-red-600">
                                        Charged Weight: {order.chargedWeight?.applicableWeight} Kg
                                    </span>
                                </div>
                                <div className="font-[600]">
                                    Applied Weight: {order.enteredWeight?.applicableWeight} Kg
                                </div>
                            </div>

                            {/* DATE + WARNING BADGE */}
                            <div className="px-3 py-1 flex justify-between items-center border-b text-[10px]">
                                <span className="text-gray-700">
                                    Upload On : {dayjs(order.createdAt).format("DD MMM YYYY")}
                                </span>
                                {["new", "pending"].includes((order.status || "").toLowerCase()) && (
                                    <span className={`px-2 py-0.5 rounded-full text-white text-[10px] ${remainingDays > 0 ? "bg-red-500" : "bg-orange-500"}`}>
                                        {remainingDays > 0 ? `${remainingDays} Days Left` : "Auto Accept Soon"}
                                    </span>
                                )}
                            </div>

                            {/* SHIPMENT DETAILS */}
                            <div className="px-3 py-1 flex justify-between items-center bg-green-50">
                                {/* Left Side */}
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 shadow-sm border">
                                        <img
                                            src={getCarrierLogo(order.courierServiceName || "")}
                                            alt="carrier"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex flex-col text-[10px]">
                                        <span className="font-[600] text-gray-700">{order.courierServiceName}</span>
                                        <div className="flex items-center gap-1">
                                            <span onClick={() => handleTrackingByAwb(order.awbNumber)} className="text-[#0CBB7D] font-[600] cursor-pointer">
                                                {order.awbNumber}
                                            </span>
                                            <button onClick={() => handleCopyAwb(order.awbNumber, `awb-${index}`)}>
                                                {copiedAwb === `awb-${index}` ? (
                                                    <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                                                ) : (
                                                    <FiCopy className="w-3 h-3 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side Amount */}
                                <div className="text-[#0CBB7D] font-[600] text-[10px]">
                                    ₹{Number(order?.excessWeightCharges?.pendingAmount || 0).toFixed(2)}
                                </div>
                            </div>

                            {/* BOTTOM ROW ACTIONS (if provided) */}
                            {renderBottomActions && renderBottomActions(order, index)}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default SharedWeightDiscrepancyCard;
