import React from "react";
import { Notification } from "../Notification";
import { FiX } from "react-icons/fi";

const UpdatePackageDetails = ({ isOpen, onClose, onSave, packageDetails, setPackageDetails }) => {
    if (!isOpen) return null;

    const handleSave = () => {
        if (
            !packageDetails.length ||
            !packageDetails.width ||
            !packageDetails.height ||
            !packageDetails.weight
        ) {
            Notification("Please fill all package details before saving.", "info");
            return;
        }

        onSave(packageDetails);
        onClose();
    };

    const handleChange = (field, value) => {
        // Only allow numbers and decimal points
        const sanitizedValue = value.replace(/[^0-9.]/g, "");
        setPackageDetails({ ...packageDetails, [field]: sanitizedValue });
    };

    // Calculate volumetric weight
    const volumetricWeight = packageDetails.length && packageDetails.width && packageDetails.height
        ? ((packageDetails.length * packageDetails.width * packageDetails.height) / 5000).toFixed(2)
        : "0.00";

    const applicableWeight = Math.max(parseFloat(packageDetails.weight) || 0, parseFloat(volumetricWeight) || 0).toFixed(2);

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 animate-popup-in">
            <div className="bg-white p-4 rounded-lg w-[500px] shadow-lg relative">
                <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 mb-4">Update Package Details</h2>

                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={onClose}
                >
                    <FiX size={20} />
                </button>

                <div className="grid grid-cols-2 font-[600] text-gray-500 gap-2 mb-4">
                    {/* Length */}
                    <div>
                        <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 mb-1 block">
                            Length (cm) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="0"
                            value={packageDetails.length}
                            onChange={(e) => handleChange("length", e.target.value)}
                            className="w-full px-3 py-2 text-[10px] sm:text-[12px] rounded-lg border border-gray-300 outline-none focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] transition-all"
                        />
                    </div>

                    {/* Width */}
                    <div>
                        <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 mb-1 block">
                            Width (cm) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="0"
                            value={packageDetails.width}
                            onChange={(e) => handleChange("width", e.target.value)}
                            className="w-full px-3 py-2 text-[10px] sm:text-[12px] rounded-lg border border-gray-300 outline-none focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] transition-all"
                        />
                    </div>

                    {/* Height */}
                    <div>
                        <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 mb-1 block">
                            Height (cm) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="0"
                            value={packageDetails.height}
                            onChange={(e) => handleChange("height", e.target.value)}
                            className="w-full px-3 py-2 text-[10px] sm:text-[12px] rounded-lg border border-gray-300 outline-none focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] transition-all"
                        />
                    </div>

                    {/* Weight */}
                    <div>
                        <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 mb-1 block">
                            Weight (kg) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="0"
                            value={packageDetails.weight}
                            onChange={(e) => handleChange("weight", e.target.value)}
                            className="w-full px-3 py-2 text-[10px] sm:text-[12px] rounded-lg border border-gray-300 outline-none focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] transition-all"
                        />
                    </div>
                </div>

                {/* Summary Section */}
                <div className="bg-green-50 font-[600] rounded-lg p-2 mb-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] sm:text-[12px] text-gray-600">Volumetric Weight:</span>
                        <span className="text-[10px] sm:text-[12px] font-[600] text-gray-500">{volumetricWeight} Kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] sm:text-[12px] text-gray-600">Applicable Weight:</span>
                        <span className="text-[10px] sm:text-[12px] font-[700] text-gray-700">{applicableWeight} Kg</span>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-3 py-2 text-[10px] sm:text-[12px] font-[600] text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-3 py-2 text-[10px] sm:text-[12px] font-[600] text-white bg-[#0CBB7D] rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdatePackageDetails;
