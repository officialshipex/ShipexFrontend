import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";
import { FiCopy, FiCheck, FiChevronDown, FiChevronUp } from "react-icons/fi";
import SelectPickupPopup from "../SelectPickupPopup";
import { MapPin } from "lucide-react";

const PickupDetailsSection = ({ order, onUpdate, userId }) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [copiedField, setCopiedField] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleCopy = (text, field) => {
        if (text) {
            navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 1500);
        }
    };

    const handlePickupUpdate = async (updatedData) => {
        if (onUpdate) {
            await onUpdate(updatedData);
        }
        setIsEditOpen(false);
    };

    const CopyableField = ({ label, value, fieldKey }) => (
        <div className="group">
            <span className="font-[600] text-gray-700">{label}:</span>
            <div className="flex items-center gap-2">
                <p className="text-gray-500 font-[600] break-words">{value || "-"}</p>
                {value && (
                    <div
                        onClick={() => handleCopy(value, fieldKey)}
                        className="md:opacity-0 md:group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                        <div className="relative flex items-center justify-center w-5 h-5 text-gray-500 hover:text-[#0CBB7D]">
                            {copiedField === fieldKey ? (
                                <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                            ) : (
                                <FiCopy className="w-3 h-3" />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            <div className="bg-white p-4 rounded-lg shadow-sm">
                {/* Header */}
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <div className="flex items-center gap-2">
                        <p className="p-2 bg-green-100 hidden sm:block rounded-full">
                            <MapPin className="w-4 h-4 text-[#0CBB7D]" />
                        </p>

                        <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                            Pickup Details
                        </h2>
                    </div>

                    {/* {order.status === "new" && (
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="p-2 bg-gray-500 rounded-full hover:opacity-90 transition"
                            title="Edit Pickup Address"
                        >
                            <FaEdit className="text-white text-[12px]" />
                        </button>
                    )} */}
                </div>

                {/* ================= DESKTOP VIEW (UNCHANGED) ================= */}
                <div className="hidden sm:grid grid-cols-1 sm:grid-cols-4 gap-2 text-[12px]">
                    <CopyableField label="Name" value={order.pickupAddress?.contactName} fieldKey="pickup-name" />
                    <CopyableField label="Email" value={order.pickupAddress?.email} fieldKey="pickup-email" />
                    <CopyableField label="Mobile No" value={order.pickupAddress?.phoneNumber} fieldKey="pickup-phone" />
                    <CopyableField label="Pincode" value={order.pickupAddress?.pinCode} fieldKey="pickup-pincode" />
                    <CopyableField label="State" value={order.pickupAddress?.state} fieldKey="pickup-state" />
                    <CopyableField label="City" value={order.pickupAddress?.city} fieldKey="pickup-city" />

                    <div className="sm:col-span-2 group">
                        <span className="font-[600] text-gray-700">Address:</span>

                        <div className="flex items-start gap-2">
                            <p className="text-gray-500 font-[600] break-words flex-1">
                                {order.pickupAddress?.address || "-"}
                            </p>

                            {order.pickupAddress?.address && (
                                <div
                                    onClick={() =>
                                        handleCopy(order.pickupAddress.address, "pickup-address")
                                    }
                                    className="md:opacity-0 md:group-hover:opacity-100 cursor-pointer transition-opacity mt-0.5"
                                >
                                    <div className="relative flex items-center justify-center text-gray-500 w-4 h-4 hover:text-[#0CBB7D]">
                                        {copiedField === "pickup-address" ? (
                                            <FiCheck className="w-3 h-3 text-green-600" />
                                        ) : (
                                            <FiCopy className="w-3 h-3" />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* ================= MOBILE VIEW (INLINE EXPAND) ================= */}
                <div className="sm:hidden">
                    <div
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="flex items-center justify-between cursor-pointer"
                    >
                        <span className="font-[600] text-[10px] text-gray-700">Pickup:</span>

                        <div className="flex items-center gap-2">
                            <span className="text-[#0CBB7D] font-[600] text-[10px]">
                                {order.pickupAddress?.contactName || "-"}
                            </span>
                            {mobileOpen ? <FiChevronUp /> : <FiChevronDown />}
                        </div>
                    </div>

                    {mobileOpen && (
                        <div className="mt-2 pl-1 border-l-2 border-green-200 animate-popup-in">
                            <p className="text-[12px] text-gray-500 leading-relaxed">
                                {order.pickupAddress?.address}, {order.pickupAddress?.city},{" "}
                                {order.pickupAddress?.state} - {order.pickupAddress?.pinCode}
                            </p>

                            <button
                                onClick={() =>
                                    handleCopy(
                                        `${order.pickupAddress?.address}, ${order.pickupAddress?.city}, ${order.pickupAddress?.state} - ${order.pickupAddress?.pinCode}`,
                                        "mobile-pickup-address"
                                    )
                                }
                                className="mt-2 flex items-center gap-2 text-[#0CBB7D] text-[12px] font-[600]"
                            >
                                {copiedField === "mobile-pickup-address" ? (
                                    <>
                                        <FiCheck /> Copied
                                    </>
                                ) : (
                                    <>
                                        <FiCopy /> Copy Address
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isEditOpen && (
                <SelectPickupPopup
                    onClose={() => setIsEditOpen(false)}
                    onPickupSelected={handlePickupUpdate}
                    title="Update Pickup"
                    userId={userId}
                />
            )}
        </>
    );
};

export default PickupDetailsSection;
