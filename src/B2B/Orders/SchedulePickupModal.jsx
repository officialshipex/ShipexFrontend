import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";


const SchedulePickupModal = ({ orderId, awb, pickupAddress, onClose }) => {
    const [selectedDate, setSelectedDate] = useState("");
    const [loading, setLoading] = useState(false);
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const { id } = useParams();
    const isTodayPassed10AM = dayjs().hour() >= 10;

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = dayjs().add(i, "day");
        let label = d.format("D MMMM’YY");
        if (i === 0) label = "Today";
        else if (i === 1) label = "Tomorrow";

        dates.push({
            label,
            value: d.format("YYYY-MM-DD"),
            disabled: i === 0 && isTodayPassed10AM,
        });
    }

    useEffect(() => {
        // Set default selected date to the first non-disabled date
        const firstAvailable = dates.find(d => !d.disabled);
        if (firstAvailable) {
            setSelectedDate(firstAvailable.value);
        }
    }, []);

    const handleSchedulePickup = async () => {
        if (!selectedDate) {
            Notification("Please select a pickup date", "error");
            return;
        }

        try {
            setLoading(true);
            const token = Cookies.get("session");

            const response = await axios.post(
                `${REACT_APP_BACKEND_URL}/b2b/schedulePickup`,
                {
                    orderIds: [orderId], // Send as array for compatibility with bulk
                    pickupDate: selectedDate,
                },
                {
                    headers: { authorization: `Bearer ${token}` },
                }
            );

            Notification(response?.data?.message || "Pickup scheduled successfully", "success");
            onClose(true);
        } catch (err) {
            console.error(err);
            Notification(err.response?.data?.message || "Failed to schedule pickup", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
            <div className="bg-white w-full max-w-3xl rounded-lg p-4 relative animate-popup-in">
                {/* Header */}
                <h2 className="text-[12px] sm:text-[14px] font-[600] mb-2 text-gray-700">Schedule Your B2B Pick Up</h2>
                <button
                    onClick={() => onClose(false)}
                    className="absolute right-4 top-4 text-[14px] text-gray-400 hover:text-gray-600 transition"
                >
                    ×
                </button>

                {/* Success Banner */}
                <div className="bg-green-50 text-green-700 rounded-lg px-3 py-2 flex items-center gap-2 mb-2 border border-green-100">
                    <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                        ✓
                    </span>
                    <p className="text-[12px] leading-relaxed">
                        Your package has been booked successfully. The AWB number is{" "}
                        <span className="font-[600] text-[#0CBB7D]">{awb}</span>.
                    </p>
                </div>

                {/* Pickup Address */}
                <div className="bg-gray-50 border rounded-lg px-3 py-2 mb-2">
                    <p className="font-[600] mb-1 text-[10px] sm:text-[12px] text-gray-700">📍 Pick Up Address</p>
                    <p className="text-[10px] sm:text-[12px] text-gray-500">{pickupAddress}</p>
                </div>

                {/* Date Selection */}
                <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-2">
                    <p className="font-[600] mb-2 text-[10px] sm:text-[12px] text-gray-700">
                        📅 Please select a suitable date for your order to be picked up
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {dates.map((d) => (
                            <button
                                key={d.value}
                                disabled={d.disabled}
                                onClick={() => setSelectedDate(d.value)}
                                className={`px-3 py-2 rounded-full text-[10px] border transition font-[600] ${selectedDate === d.value
                                    ? "bg-[#0CBB7D] border-[#0CBB7D] text-white shadow-sm"
                                    : d.disabled
                                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-white border-gray-300 text-gray-600 hover:border-[#0CBB7D] hover:text-[#0CBB7D]"
                                    }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>


                    <p className="text-[10px] text-[#0CBB7D] mt-2 italic">
                        In case you schedule the pickup for Today, you will not be able to
                        reschedule this pick up.
                    </p>
                </div>

                {/* Note */}
                <p className="sm:text-[12px] text-[10px] text-gray-500 mb-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-100">
                    <span className="font-[600] text-yellow-700">Note:</span> Please ensure that your invoice is in the package, and
                    your label is visible on the package to be delivered.
                </p>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t pt-4">
                    <button
                        onClick={() => onClose(false)}
                        className="text-gray-500 rounded-lg bg-gray-100 hover:bg-red-100 px-3 py-2 text-[10px] font-[600] hover:text-red-500 transition"
                    >
                        I'll do it later
                    </button>

                    <button
                        onClick={handleSchedulePickup}
                        disabled={loading || !selectedDate}
                        className="bg-[#0CBB7D] text-white px-3 py-2 rounded-lg font-[600] text-[10px] hover:opacity-90 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Scheduling..." : "Schedule Pick Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SchedulePickupModal;
