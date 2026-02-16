import React, { useState } from "react";
import dayjs from "dayjs";
import { FiCopy, FiCheck } from "react-icons/fi";
import { getCarrierLogo } from "../../Common/getCarrierLogo"
import { Truck } from "lucide-react";

const ShippingDetailsSection = ({ order }) => {
    const [copiedAwb, setCopiedAwb] = useState(false);

    const handleCopyAwb = () => {
        if (order.awb_number) {
            navigator.clipboard.writeText(order.awb_number);
            setCopiedAwb(true);
            setTimeout(() => setCopiedAwb(false), 1500);
        }
    };

    const getModeFromCourier = (courierServiceName = "") => {
        return courierServiceName.toLowerCase().includes("air")
            ? "Air"
            : "Surface";
    };


    // Only show if status is not "new" and not "Cancelled"
    if (order.status === "new" || order.status === "Cancelled") {
        return null;
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <p className="p-2 bg-green-100 hidden sm:block rounded-full">
                    <Truck className="w-4 h-4 text-[#0CBB7D]" />
                </p>

                <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                    Shipping Details
                </h2>
            </div>


            <div className="grid grid-cols-2 font-[600] sm:grid-cols-4 gap-2 text-[10px] sm:text-[12px]">
                <div>
                    <span className="font-[600] text-gray-700">Shipment Created:</span>
                    <p className="text-gray-500">
                        {order.shipmentCreatedAt
                            ? dayjs(order.shipmentCreatedAt).format("DD MMM YYYY, hh:mm A")
                            : "-"}
                    </p>
                </div>

                <div>
                    <span className="font-[600] text-gray-700">Pickup Date:</span>
                    <p className="text-gray-500">
                        {order.invoiceDate
                            ? dayjs(order.invoiceDate).format("DD MMM YYYY")
                            : "-"}
                    </p>
                </div>

                <div>
                    <span className="font-[600] text-gray-700">EDD (Estimated Delivery Date):</span>
                    <p className="text-gray-500">
                        {order.estimatedDeliveryDate ? dayjs(order.estimatedDeliveryDate).format("DD MMM YYYY") : "-"}
                    </p>
                </div>

                <div>
                    <span className="font-[600] text-gray-700">Delivered Date:</span>
                    <p className="text-gray-500">
                        {order.tracking
                            ? dayjs(order.tracking[order.tracking.length-1].StatusDateTime).format("DD MMM YYYY, hh:mm A")
                            : "-"}
                    </p>
                </div>

                <div>
                    <span className="font-[600] text-gray-700">Courier:</span>
                    <div className="flex items-center gap-2">
                        {order.courierServiceName && (
                            <img
                                src={getCarrierLogo(order.courierServiceName)}
                                alt={order.courierServiceName}
                                className="w-12 h-6 rounded-full border"
                            />
                        )}
                    </div>
                </div>


                <div>
                    <span className="font-[600] text-gray-700">Courier Service:</span>
                    <p className="text-gray-500">{order.courierServiceName || "-"}</p>
                </div>

                {/* AWB with Copy Functionality */}
                {order.awb_number && (
                    <div className="group">
                        <span className="font-[600] text-gray-700">AWB Number:</span>
                        <div className="flex items-center gap-2">
                            <p className="text-[#0CBB7D]">{order.awb_number}</p>

                            <div
                                onClick={handleCopyAwb}
                                className="md:opacity-0 md:group-hover:opacity-100 cursor-pointer transition-opacity"
                            >
                                <div className="relative flex items-center justify-center text-gray-500 hover:text-[#0CBB7D]">
                                    {copiedAwb ? (
                                        <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                                    ) : (
                                        <FiCopy className="w-3 h-3" />
                                    )}

                                    {/* Tooltip */}
                                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 scale-95 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-gray-500 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                        {copiedAwb ? "Copied!" : "Click to copy"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                <div>
                    <span className="font-[600] text-gray-700">Mode:</span>
                    <p className="text-gray-500">
                        {order.courierServiceName
                            ? getModeFromCourier(order.courierServiceName)
                            : "-"}
                    </p>
                </div>


                {/* Pickup ID with Copy Functionality */}
                {order.pickupId && (
                    <div className="group">
                        <span className="font-[600] text-gray-700">Pickup ID:</span>
                        <div className="flex items-center gap-2">
                            <p className="text-gray-500">{order.pickupId}</p>

                            <div
                                onClick={() => {
                                    navigator.clipboard.writeText(order.pickupId);
                                    setCopiedAwb(true);
                                    setTimeout(() => setCopiedAwb(false), 1500);
                                }}
                                className="md:opacity-0 md:group-hover:opacity-100 cursor-pointer transition-opacity"
                            >
                                <div className="relative flex items-center justify-center w-5 h-5 rounded bg-white shadow-md text-gray-500 hover:text-[#0CBB7D]">
                                    {copiedAwb ? (
                                        <FiCheck className="w-3 h-3 text-green-600" />
                                    ) : (
                                        <FiCopy className="w-3 h-3" />
                                    )}

                                    {/* Tooltip */}
                                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 scale-95 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-gray-500 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                        {copiedAwb ? "Copied!" : "Click to copy"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShippingDetailsSection;
