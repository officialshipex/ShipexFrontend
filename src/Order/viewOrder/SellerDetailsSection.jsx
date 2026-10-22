import React from "react";
import { UserCircle } from "lucide-react";

// Admin / employee view only: whose order this is (the backend sends `seller` only to staff).
const SellerDetailsSection = ({ seller }) => {
    if (!seller) return null;
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <p className="p-2 bg-brand-secondary/16 hidden sm:block rounded-full"><UserCircle className="w-4 h-4 text-brand-primary" /></p>
                <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                    User Details
                </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 font-[600] gap-2 text-[10px] sm:text-[12px]">
                <div>
                    <span className="font-[600] text-gray-700">User ID:</span>
                    <p className="text-brand-primary">{seller.userId ?? "N/A"}</p>
                </div>
                <div>
                    <span className="font-[600] text-gray-700">Name:</span>
                    <p className="text-gray-500 break-words">{seller.name || "N/A"}</p>
                </div>
                <div>
                    <span className="font-[600] text-gray-700">Email:</span>
                    <p className="text-gray-500 break-all">{seller.email || "N/A"}</p>
                </div>
                <div>
                    <span className="font-[600] text-gray-700">Phone:</span>
                    <p className="text-gray-500">{seller.phoneNumber || "N/A"}</p>
                </div>
            </div>
        </div>
    );
};

export default SellerDetailsSection;
