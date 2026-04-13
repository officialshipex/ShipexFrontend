import { FiPhoneCall } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";

const AIOrderUpdation = () => {
    const { targetUserId, isAdmin } = useOutletContext();

    if (isAdmin && !targetUserId) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-400 font-semibold text-[12px]">Search user to see the details</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300">
                <FiPhoneCall size={40} className="text-[#0CBB7D]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">AI Smart Calling</h2>
            <p className="text-gray-500 text-center max-w-md px-6">
                Reduce RTO by automatically calling customers to confirm delivery addresses and update order details. This feature will use advanced AI to handle direct voice interactions seamlessly.
            </p>
            <div className="mt-8 flex gap-2">
                <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0CBB7D]"></span>
                </span>
                <span className="text-[12px] font-semibold text-[#0CBB7D] uppercase tracking-wider">Coming Soon</span>
            </div>
        </div>
    );
};

export default AIOrderUpdation;
