import React, { useState } from "react";
import Cookies from "js-cookie";
import {Notification} from "../../../Notification"
const BuyCreditModal = ({ onClose, onSuccess }) => {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const token = Cookies.get("session");
    const handleBuy = async () => {
        if (!amount) return;
        try {
            setLoading(true);
            const response = await fetch(`${REACT_APP_BACKEND_URL}/notification/buyCredits`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();
            if (response.ok) {
                onSuccess(); // refresh credit balance
                onClose();
                Notification("Credits purchased successfully!","success");
            } else {
                Notification(data.error || "Failed to buy credits","error");
            }
        } catch (error) {
            console.error("Error buying credits:", error);
            Notification("Something went wrong. Please try again.","error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center animate-popup-in bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg p-4 w-[90%] sm:w-[400px] shadow-sm relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">Buy Credit</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-[16px] sm:text-[18px] font-[600]"
                    >
                        ×
                    </button>
                </div>

                {/* Amount Input */}
                <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700">
                    Amount <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] mt-1 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                />

                {/* Note */}
                <p className="text-[10px] sm:text-[12px] text-red-500 mt-2 font-[600]">
                    Note: The credits can only be used for Notification services, and can’t be transferred elsewhere.
                </p>

                {/* Buttons */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleBuy}
                        disabled={!amount || loading}
                        className={`rounded-lg px-5 py-2 text-[10px] sm:text-[12px] font-[600] transition-all ${!amount || loading
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-[#0CBB7D] text-white hover:bg-green-500"
                            }`}
                    >
                        {loading ? "Processing..." : "Buy"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BuyCreditModal;
