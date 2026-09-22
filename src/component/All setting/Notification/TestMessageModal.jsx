import React, { useState } from "react";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";

const TestMessageModal = ({ onClose, channel, channelLabel, targetUserId, initialCount = 0, onSent }) => {
    const [recipient, setRecipient] = useState("");
    const [loading, setLoading] = useState(false);
    const [usedCount, setUsedCount] = useState(initialCount);
    const [resultMsg, setResultMsg] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const MAX_TESTS = 5;
    const isExhausted = usedCount >= MAX_TESTS;

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const token = Cookies.get("session");

    const inputLabel = channel === "email" ? "Email Address" : "Phone Number (10 digits)";
    const inputType  = channel === "email" ? "email" : "tel";
    const placeholder = channel === "email" ? "customer@example.com" : "10-digit mobile number";

    const handleSend = async () => {
        if (!recipient.trim()) return;
        setLoading(true);
        setResultMsg("");
        setIsSuccess(false);
        try {
            const body = { channel, recipient: recipient.trim() };
            if (targetUserId) body.userId = targetUserId;

            const response = await fetch(`${REACT_APP_BACKEND_URL}/notification/sendTestMessage`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                const newUsed = MAX_TESTS - (data.remaining ?? 0);
                setUsedCount(newUsed);
                setIsSuccess(true);
                setResultMsg(data.message || "Test message sent successfully!");
                if (onSent) onSent(newUsed);
                Notification(data.message || "Test message sent!", "success");
            } else {
                setResultMsg(data.error || "Failed to send test message");
                Notification(data.error || "Failed to send test message", "error");
            }
        } catch (err) {
            setResultMsg("Something went wrong. Please try again.");
            Notification("Something went wrong. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg p-4 w-[90%] sm:w-[420px] shadow-sm relative">

                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                        Send Test {channelLabel} Message
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-[18px] sm:text-[20px] font-[600] leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Usage dots */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 mb-3">
                    <span className="text-[10px] sm:text-[12px] font-[600] text-gray-600">Tests used</span>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            {Array.from({ length: MAX_TESTS }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`inline-block w-2.5 h-2.5 rounded-full border transition-colors ${
                                        i < usedCount
                                            ? "bg-brand-primary border-brand-primary"
                                            : "bg-white border-gray-300"
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] sm:text-[12px] font-[700] text-gray-700">
                            {usedCount} / {MAX_TESTS}
                        </span>
                    </div>
                </div>

                {isExhausted ? (
                    <p className="text-[10px] sm:text-[12px] text-red-500 font-[600] mb-3">
                        You've used all {MAX_TESTS} test messages for this account. Contact support if you need more.
                    </p>
                ) : (
                    <>
                        <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700">
                            {inputLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type={inputType}
                            placeholder={placeholder}
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !loading && !isSuccess) handleSend();
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] mt-1 mb-2 outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                        <p className="text-[10px] sm:text-[12px] text-gray-500 font-[500]">
                            ✓ Test messages are free — no credits deducted. Max {MAX_TESTS} per account.
                        </p>
                    </>
                )}

                {resultMsg && (
                    <p className={`text-[10px] sm:text-[12px] font-[600] mt-2 ${isSuccess ? "text-brand-primary" : "text-red-500"}`}>
                        {resultMsg}
                    </p>
                )}

                {/* Footer */}
                <div className="flex justify-end mt-4 gap-2">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-[10px] sm:text-[12px] font-[600] border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                    >
                        {isSuccess ? "Close" : "Cancel"}
                    </button>
                    {!isExhausted && !isSuccess && (
                        <button
                            onClick={handleSend}
                            disabled={!recipient.trim() || loading}
                            className={`rounded-lg px-5 py-2 text-[10px] sm:text-[12px] font-[600] transition-all ${
                                !recipient.trim() || loading
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-brand-primary text-white hover:bg-green-500"
                            }`}
                        >
                            {loading ? "Sending..." : "Send Test"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestMessageModal;
