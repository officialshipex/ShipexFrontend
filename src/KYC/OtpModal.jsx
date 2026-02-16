import React, { useEffect } from "react";

const OtpModal = ({
    show,
    onClose,
    otp,
    refs,
    handleChange,
    handleKeyDown,
    timer,
    onResend,
    onVerify,
    errorShake,
    label,
    type,
    verified,
    loading,
}) => {
    // Auto-focus first input when modal opens
    useEffect(() => {
        if (show && refs.current[0]) {
            refs.current[0].focus();
        }
    }, [show, refs]);

    if (!show || verified) return null;

    return (
        <>
            {/* Background Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-40 z-40"
                onClick={onClose}
            ></div>

            {/* OTP Modal */}
            <div
                className="fixed z-50 top-1/2 left-1/2 min-w-[325px] -translate-x-1/2 -translate-y-1/2 
          bg-white rounded-md shadow-2xl py-7 px-6 flex flex-col items-center justify-center 
          space-y-3 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    className="absolute top-2 right-3 text-gray-400 hover:text-gray-800 text-xl"
                    onClick={onClose}
                    type="button"
                >
                    ×
                </button>

                {/* Label */}
                <div className="text-[#0CBB7D] text-base font-bold mb-2">{label}</div>

                {/* OTP Inputs */}
                <div className="flex gap-2 mb-1">
                    {otp.map((digit, i) => (
                        <input
                            key={i}
                            type="tel"
                            maxLength="1"
                            inputMode="numeric"
                            value={digit}
                            ref={(el) => (refs.current[i] = el)}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/, "");
                                handleChange(i, val);

                                // Move to next input automatically
                                if (val && i < otp.length - 1) {
                                    refs.current[i + 1]?.focus();
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Backspace") {
                                    if (!e.target.value && i > 0) {
                                        refs.current[i - 1]?.focus(); // ✅ Move focus back instantly
                                    }
                                } else if (e.key === "ArrowLeft" && i > 0) {
                                    refs.current[i - 1]?.focus();
                                } else if (
                                    e.key === "ArrowRight" &&
                                    i < otp.length - 1
                                ) {
                                    refs.current[i + 1]?.focus();
                                }

                                handleKeyDown(i, e, type);
                            }}
                            className={`w-10 h-10 text-center text-[16px] rounded border border-gray-300 outline-none
        focus:ring-2 focus:ring-[#0CBB7D] transition-all ${errorShake ? "animate-shake border-red-500" : ""
                                }`}
                        />
                    ))}
                </div>

                {/* Verify Button */}
                <button
                    type="button"
                    className={`w-full my-1 py-2 ${loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#0CBB7D] hover:bg-[#09946A]"
                        } transition-colors text-white font-semibold text-[12px] rounded`}
                    onClick={onVerify}
                    disabled={otp.some((digit) => digit === "") || loading}
                >
                    {loading ? "Verifying..." : "Verify OTP"}
                </button>

                {/* Timer / Resend */}
                <div className="flex flex-col items-center w-full">
                    {timer > 0 ? (
                        <span className="text-xs text-gray-500">
                            Resend OTP in {timer}s
                        </span>
                    ) : (
                        <button
                            type="button"
                            className="text-[#0CBB7D] underline text-xs mt-1"
                            onClick={onResend}
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Resend OTP"}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default OtpModal;
