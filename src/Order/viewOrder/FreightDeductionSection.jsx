import React from "react";
import { IndianRupee } from "lucide-react";

const FreightDeductionSection = ({ order }) => {
    // Condition for display: 
    // 1. status is not "new"
    // 2. priceBreakup object is present
    if (order.status === "new" || !order.priceBreakup) {
        return null;
    }

    const { priceBreakup } = order;

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <p className="p-2 bg-green-100 hidden sm:block rounded-full">
                    <IndianRupee className="w-4 h-4 text-[#0CBB7D]" />
                </p>
                <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                    Freight Deduction
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left sm:text-[12px] text-[10px]">
                    <thead>
                        <tr className="text-gray-700 font-[600] border-b">
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3 whitespace-nowrap">Applicable Weight</th>
                            {order.paymentDetails?.method === "COD" && <th className="py-2 px-3">COD</th>}
                            <th className="py-2 px-3">Freight</th>
                            <th className="py-2 px-3">GST</th>
                            <th className="py-2 px-3">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="font-[600] text-gray-500">
                            <td className="py-2 px-3">{order.orderType || "B2C"}</td>
                            <td className="py-2 px-3">
                                {order.packageDetails?.applicableWeight || order.B2BPackageDetails?.applicableWeight || 0} Kg
                            </td>
                            {order.paymentDetails?.method === "COD" && (
                                <td className="py-2 px-3">₹{priceBreakup.cod || 0}</td>
                            )}
                            <td className="py-2 px-3">₹{priceBreakup.freight || 0}</td>
                            <td className="py-2 px-3">₹{priceBreakup.gst || 0}</td>
                            <td className="py-2 px-3 text-[#0CBB7D]">₹{priceBreakup.total || 0}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FreightDeductionSection;
