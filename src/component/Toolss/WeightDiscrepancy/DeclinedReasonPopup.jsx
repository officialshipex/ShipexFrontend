import { X } from "lucide-react"; // Importing close icon

const DeclinedReasonPopup = ({ isOpen, onClose, awbNumber, declinedReason }) => {
    if (!isOpen) return null; // Prevents rendering when modal is closed

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 animate-popup-in z-20">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] text-center relative">
                {/* Close Button */}
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    <X size={24} />
                </button>

                {/* AWB Number */}
                <p className="mb-2 text-gray-700 text-left text-[12px] sm:text-[14px]">
                    AWB Number: <strong>{awbNumber || "N/A"}</strong>
                </p>

                {/* Declined Reason Header */}
                <h2 className="text-[12px] sm:text-[14px] text-gray-500 text-left font-[600] mb-2">Declined Reason :</h2>

                {/* Declined Reason Content */}
                <p className="text-gray-700 text-[12px] sm:text-[14px] text-left">
                    {declinedReason || "No reason provided"}
                </p>
            </div>
        </div>
    );
};

export default DeclinedReasonPopup;
