import React from "react";
import dayjs from "dayjs";
import { FileText } from "lucide-react";


const OrderDetailsSection = ({ order }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <p className="p-2 bg-green-100 hidden sm:block rounded-full"><FileText className="w-4 h-4 text-[#0CBB7D]" /></p>
                <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                    Order Details
                </h2>
            </div>


            <div className="grid grid-cols-2 sm:grid-cols-4 font-[600] gap-2 text-[10px] sm:text-[12px]">
                <div>
                    <span className="font-[600] text-gray-700">Creation Date:</span>
                    <p className="text-gray-500">
                        {dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")}
                    </p>
                </div>

                <div className="flex flex-col items-start">
                    <span className="font-[600] text-gray-700">Channel:</span>

                    <div className="flex items-center gap-1">
                        {/* Channel badge */}
                        <span className="inline-flex items-center px-2 rounded bg-green-100 text-[#0CBB7D] text-[10px] uppercase">
                            {order.channel || "CUSTOM"}
                        </span>

                        {/* Channel ID (no background) */}
                        {order.channelId && (
                            <span className="text-[10px] font-[600] text-gray-500">
                                ({order.channelId})
                            </span>
                        )}
                    </div>
                </div>


                <div>
                    <span className="font-[600] text-gray-700">Payment Amount:</span>
                    <p className="text-gray-500">₹{order.paymentDetails?.amount || 0}</p>
                </div>

                <div>
                    <span className="font-[600] text-gray-700">Payment Method:</span>
                    <p className="text-gray-500">{order.paymentDetails?.method || "N/A"}</p>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsSection;
