import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../Notification";

const instructionOptions = [
    { label: "Re-attempt", value: "RE-ATTEMPT" },
    { label: "Change Address", value: "CHANGE_ADDRESS" },
    { label: "Return to Origin (RTO)", value: "RTO" },
];

const BulkNdrActionModal = ({ isOpen, onClose, selectedOrders = [], onRefresh }) => {
    const [action, setAction] = useState("");
    const [remarks, setRemarks] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [deliverySlot, setDeliverySlot] = useState("");
    const [mobile, setMobile] = useState("");
    const [address, setAddress] = useState({
        address1: "",
        address2: "",
        customer_name: "",
        city: "",
        state: "",
        pincode: "",
    });
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);
    const REACT_APP_BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").trim();

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

        if (!remarks.trim()) {
            return Notification("Please enter remarks.", "info");
        }

        // Removed mandatory check for scheduledDate as per user request


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
        if (!selectedOrders || selectedOrders.length === 0) {
            return Notification("No shipments selected for bulk action.", "error");
        }
        const isValid = validateFields();
        if (isValid !== true) return;

        // Construction
        const payloads = selectedOrders.map((orderId) => {
            const p = { orderId, action, remarks };

            if (action === "CHANGE_ADDRESS") {
                p.customer_name = address.customer_name;
                p.address1 = address.address1;
                p.address2 = address.address2;
                p.city = address.city;
                p.state = address.state;
                p.pincode = address.pincode;
                p.phone = mobile;
            }

            if (action === "RE-ATTEMPT") {
                p.scheduled_delivery_date = scheduledDate;
                p.deliverySlot = deliverySlot;
                p.phone = mobile;
            }

            return p;
        });

        console.log("Frontend sending payloads:", payloads);
        setLoading(true);

        const token = Cookies.get("session");

        axios
            .post(`${REACT_APP_BACKEND_URL}/ndr/bulk`, { payloads }, {
                headers: { authorization: `Bearer ${token}` }
            })
            .then((res) => {
                setLoading(false);
                onClose();
                Notification(
                    res?.data?.message || "Bulk NDR completed",
                    "success"
                );
                if (onRefresh) onRefresh();
            })
            .catch((err) => {
                setLoading(false);
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
                        Selected Shipments: <b>{selectedOrders.length}</b>
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
                                        className="px-3 py-2 hover:bg-brand-secondary/8 cursor-pointer"
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
                    {action && (
                        <div className="space-y-1">
                            <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">Remarks</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                                placeholder="Enter remarks"
                            />
                        </div>
                    )}

                    {/* Re-attempt Date */}
                    {action === "RE-ATTEMPT" && (
                        <div className="space-y-1">
                            <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">Scheduled Delivery Date (Optional)</label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                            />
                        </div>
                    )}

                    {/* Change Address */}
                    {action === "CHANGE_ADDRESS" && (
                        <div className="space-y-3">

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">Customer Name</label>
                                    <input
                                        type="text"
                                        value={address.customer_name}
                                        onChange={(e) =>
                                            setAddress({ ...address, customer_name: e.target.value })
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">Contact Number</label>
                                    <input
                                        type="text"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                                        placeholder="New Phone"
                                    />
                                </div>
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
                                    placeholder="House/Flat, Street"
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
                                    placeholder="Area, Landmark"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">City</label>
                                    <input
                                        type="text"
                                        value={address.city}
                                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                                        placeholder="City"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">State</label>
                                    <input
                                        type="text"
                                        value={address.state}
                                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                                        placeholder="State"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[12px] sm:text-[14px] font-[500] text-gray-700">Pincode</label>
                                    <input
                                        type="text"
                                        value={address.pincode}
                                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-[12px] focus:ring-1 focus:ring-green-500 outline-none"
                                        placeholder="Pincode"
                                    />
                                </div>
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
                        className="px-3 py-2 bg-brand-primary text-white rounded-lg text-[10px] sm:text-[12px] font-[600] hover:bg-green-500 disabled:opacity-50"
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
