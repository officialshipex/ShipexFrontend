import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Notification } from "../Notification";

const instructionOptions = [
    { label: "Re-attempt", value: "RE-ATTEMPT" },
    { label: "Reschedule", value: "RESCHEDULE" },
    { label: "Return to Origin", value: "RTO" },
    { label: "Change Contact", value: "CHANGE_CONTACT" },
    { label: "Change Address", value: "CHANGE_ADDRESS" },
];

const BulkNdrActionModal = ({ isOpen, onClose, orders = [] }) => {
    const [action, setAction] = useState("");
    const [remarks, setRemarks] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [deliverySlot, setDeliverySlot] = useState("");
    const [mobile, setMobile] = useState("");
    const [address, setAddress] = useState({
        address1: "",
        address2: "",
        customer_name: "",
    });
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    // Close dropdown on outside click
    useEffect(() => {
        const clickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) window.addEventListener("click", clickOutside);
        return () => window.removeEventListener("click", clickOutside);
    }, [dropdownOpen]);

    if (!isOpen) return null;

    // VALIDATION
    const validateFields = () => {
        if (!action) return Notification("Please select an action.", "info");

        if (!remarks.trim() && action !== "RESCHEDULE" && action!=="CHANGE_CONTACT") {
            return Notification("Please enter remarks.", "info");
        }

        if (action === "RESCHEDULE" && !scheduledDate)
            return Notification("Please select scheduled date.", "info");

        if (action === "CHANGE_CONTACT" && !mobile.trim())
            return Notification("Please enter new contact number.", "info");

        if (action === "CHANGE_ADDRESS") {
            if (!address.customer_name.trim())
                return Notification("Customer name required.", "info");
            if (!address.address1.trim())
                return Notification("Address Line 1 required.", "info");
        }

        return true;
    };

    // 🔥 SUBMIT HANDLER WITH API CALL
    const handleSubmit = () => {
        const isValid = validateFields();
        if (isValid !== true) return;

        // Close modal immediately
        onClose();

        // Show initial notification
        Notification("Processing NDR actions…", "info");

        // Build payloads
        const payloads = orders.map((orderId) => {
            const p = { orderId, action, remarks };

            if (action === "RESCHEDULE") {
                p.scheduledDate = scheduledDate;
            }

            if (action === "CHANGE_CONTACT") {
                p.phone = mobile;
            }

            if (action === "CHANGE_ADDRESS") {
                p.customer_name = address.customer_name;
                p.address1 = address.address1;
                p.address2 = address.address2;
            }

            if (action === "RE-ATTEMPT") {
                p.scheduled_delivery_date = scheduledDate;
                p.deliverySlot = deliverySlot;
            }

            return p;
        });

        // Fire-and-forget request (NO await)
        axios
            .post(`${REACT_APP_BACKEND_URL}/ndr/bulk`, { payloads })
            .then((res) => {
                Notification(
                    res?.data?.message || "Bulk NDR completed",
                    "success"
                );
            })
            .catch((err) => {
                Notification(
                    err?.response?.data?.message || "Bulk NDR failed",
                    "error"
                );
            });
    };



    // UI
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg w-full max-w-lg shadow-xl max-h-[92vh] overflow-hidden animate-fadeIn">

                {/* Header */}
                <div className="px-6 py-4 border-b">
                    <h2 className="text-[14px] sm:text-[16px] font-[600] text-gray-700">Bulk NDR Action</h2>
                    <p className="text-[10px] sm:text-[12px] text-gray-500 mt-1">
                        Selected Shipments: <b>{orders.length}</b>
                    </p>
                </div>

                {/* Body */}
                <div className="px-6 py-4 overflow-y-auto max-h-[80vh] space-y-2">

                    {/* Instruction Dropdown */}
                    <div className="space-y-1 relative" ref={dropdownRef}>   {/* <-- added relative */}
                        <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">Instruction</label>

                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-lg flex justify-between items-center text-[12px] sm:text[14px] bg-gray-50 hover:bg-gray-100 transition"
                        >
                            {action
                                ? instructionOptions.find((o) => o.value === action)?.label
                                : "Select Instruction"}
                            <span className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}>
                                ▼
                            </span>
                        </button>

                        {dropdownOpen && (
                            <ul
                                className="
                absolute left-0 right-0   /* stays inside modal */
                w-full max-w-full         /* prevents overflow */
                border border-gray-200 rounded-lg 
                shadow-md bg-white mt-1 text-[12px] sm:text-[12px] z-20 
                max-h-48 overflow-y-auto
            "
                            >
                                {instructionOptions.map((opt) => (
                                    <li
                                        key={opt.value}
                                        className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                                        onClick={() => {
                                            setAction(opt.value);
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        {opt.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>


                    {/* Remarks */}
                    {action !== "RESCHEDULE" && action !== "CHANGE_CONTACT" && (
                        <div className="space-y-1">
                            <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">Remarks</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                                placeholder="Enter remarks"
                            />
                        </div>
                    )}

                    {/* Reschedule Date */}
                    {action === "RESCHEDULE" && (
                        <div className="space-y-1">
                            <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">Scheduled Delivery Date</label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                            />
                        </div>
                    )}

                    {/* Change Contact */}
                    {action === "CHANGE_CONTACT" && (
                        <div className="space-y-1">
                            <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">New Contact Number</label>
                            <input
                                type="text"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] text-gray-700 focus:ring-1 focus:ring-green-500 outline-none"
                                placeholder="Enter phone number"
                            />
                        </div>
                    )}

                    {/* Change Address */}
                    {action === "CHANGE_ADDRESS" && (
                        <div className="space-y-4">

                            <div className="space-y-1">
                                <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">Customer Name</label>
                                <input
                                    type="text"
                                    value={address.customer_name}
                                    onChange={(e) =>
                                        setAddress({ ...address, customer_name: e.target.value })
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                                    placeholder="Enter customer name"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">Address Line 1</label>
                                <input
                                    type="text"
                                    value={address.address1}
                                    onChange={(e) =>
                                        setAddress({ ...address, address1: e.target.value })
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                                    placeholder="Enter address line 1"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">Address Line 2</label>
                                <input
                                    type="text"
                                    value={address.address2}
                                    onChange={(e) =>
                                        setAddress({ ...address, address2: e.target.value })
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                                    placeholder="Enter address line 2"
                                />
                            </div>

                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-[10px] sm:text-[12px] font-[600] hover:bg-gray-300"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="px-3 py-2 bg-[#0CBB7D] text-white rounded-lg text-[10px] sm:text-[12px] font-[600] hover:bg-green-500 disabled:opacity-50"
                        disabled={loading}
                        onClick={handleSubmit}
                    >
                        {loading ? "Submitting..." : "Submit"}
                    </button>
                </div>

            </div>
        </div>
    );

};

export default BulkNdrActionModal;
