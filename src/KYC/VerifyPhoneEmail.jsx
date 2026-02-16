import React, { useState, useEffect, useRef } from "react";
import { Notification } from "../Notification"; // Assuming you use a Notification utility
import { CheckCircleIcon, ClockIcon } from "lucide-react";
import OtpModal from "./OtpModal";
import axios from "axios";
import Cookies from "js-cookie";
const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VerifyPhoneEmail = ({ onVerificationChange }) => {
    const [formData, setFormData] = useState({ phoneNumber: "", email: "" });

    const [loadingPhoneOtp, setLoadingPhoneOtp] = useState(false);
    const [loadingEmailOtp, setLoadingEmailOtp] = useState(false);

    const [showPhoneOtp, setShowPhoneOtp] = useState(false);
    const [showEmailOtp, setShowEmailOtp] = useState(false);

    const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
    const [emailOtpTimer, setEmailOtpTimer] = useState(0);

    const [phoneOtp, setPhoneOtp] = useState(new Array(6).fill(""));
    const [emailOtp, setEmailOtp] = useState(new Array(6).fill(""));

    const [phoneOtpIndex, setPhoneOtpIndex] = useState(0);
    const [emailOtpIndex, setEmailOtpIndex] = useState(0);

    const [phoneVerified, setPhoneVerified] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);

    const [phoneOtpError, setPhoneOtpError] = useState(false);
    const [emailOtpError, setEmailOtpError] = useState(false);

    const phoneOtpRefs = useRef([]);
    const emailOtpRefs = useRef([]);

    // ✅ Send OTP to phone
    const sendOtp = async () => {
        if (phoneOtpTimer > 0 || loadingPhoneOtp) return;
        if (!formData.phoneNumber || formData.phoneNumber.length !== 10) {
            Notification("Please enter a valid 10-digit phone number", "info");
            return;
        }
        try {
            setLoadingPhoneOtp(true);
            const response = await fetch(`${REACT_APP_BACKEND_URL}/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber: formData.phoneNumber }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to send OTP");
            setShowPhoneOtp(true);
            setPhoneOtpIndex(0);
            setPhoneOtp(new Array(6).fill(""));
            Notification("OTP sent to your phone number.", "info");
            setPhoneOtpTimer(180);
        } catch (error) {
            Notification(error?.message || "It is getting some error fetching data", "error");
        } finally {
            setLoadingPhoneOtp(false);
        }
    };

    // ✅ Send OTP to email
    const sendEmailOtp = async () => {
        if (emailOtpTimer > 0 || loadingEmailOtp) return;
        if (!formData.email || !formData.email.includes("@")) {
            Notification("Please enter a valid email address", "info");
            return;
        }
        try {
            setLoadingEmailOtp(true);
            const response = await fetch(`${REACT_APP_BACKEND_URL}/auth/send-email-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to send OTP");
            setShowEmailOtp(true);
            setEmailOtpIndex(0);
            setEmailOtp(new Array(6).fill(""));
            Notification(
                "OTP sent to email. Please check your spam folder as well for the OTP",
                "info"
            );
            setEmailOtpTimer(180);
        } catch (error) {
            console.log("error", error);
            Notification(error?.message || "It is getting some error fetching data", "error");
        } finally {
            setLoadingEmailOtp(false);
        }
    };

    // ✅ Close modals when timer expires
    useEffect(() => {
        if (phoneOtpTimer === 0 && showPhoneOtp) setShowPhoneOtp(false);
    }, [phoneOtpTimer, showPhoneOtp]);

    useEffect(() => {
        if (emailOtpTimer === 0 && showEmailOtp) setShowEmailOtp(false);
    }, [emailOtpTimer, showEmailOtp]);

    // ✅ Handle OTP input change
    const handlePhoneOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...phoneOtp];
        newOtp[index] = value;
        setPhoneOtp(newOtp);
        if (value && index < 5) setPhoneOtpIndex(index + 1);
    };

    const handleEmailOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...emailOtp];
        newOtp[index] = value;
        setEmailOtp(newOtp);
        if (value && index < 5) setEmailOtpIndex(index + 1);
    };

    const handleOtpKeyDown = (index, e, type) => {
        if (e.key === "Backspace") {
            if (type === "phone") {
                const refs = phoneOtpRefs.current;
                if (!e.target.value && index > 0) {
                    refs[index - 1]?.focus();
                    setPhoneOtpIndex(index - 1);
                }
            } else if (type === "email") {
                const refs = emailOtpRefs.current;
                if (!e.target.value && index > 0) {
                    refs[index - 1]?.focus();
                    setEmailOtpIndex(index - 1);
                }
            }
        }
    };

    // ✅ Verify OTPs
    const verifyPhoneOtp = async () => {
        const otp = phoneOtp.join("");
        if (otp.length !== 6) {
            setPhoneOtpError(true);
            setTimeout(() => setPhoneOtpError(false), 300);
            Notification("Please enter complete OTP", "error");
            return;
        }
        try {
            const token = Cookies.get("session")
            const response = await fetch(`${REACT_APP_BACKEND_URL}/auth/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    phoneNumber: formData.phoneNumber,
                    otp,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Invalid OTP");
            setPhoneVerified(true);
            setShowPhoneOtp(false);
            Notification("Phone number verified successfully!", "success");
        } catch (error) {
            setPhoneOtpError(true);
            setTimeout(() => setPhoneOtpError(false), 300);
            Notification("It is getting some error fetching data", "error");
        }
    };

    const verifyEmailOtp = async () => {
        const token = Cookies.get("session")
        const otp = emailOtp.join("");
        if (otp.length !== 6) {
            setEmailOtpError(true);
            setTimeout(() => setEmailOtpError(false), 300);
            Notification("Please enter complete OTP", "error");
            return;
        }
        try {
            const response = await fetch(`${REACT_APP_BACKEND_URL}/auth/verify-email-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setEmailVerified(true);
            setShowEmailOtp(false);
            Notification("Email verified successfully!", "success");
        } catch (error) {
            console.log("errror", error);
            setEmailOtpError(true);
            setTimeout(() => setEmailOtpError(false), 300);
            Notification("It is getting some error fetching data", "error");
        }
    };

    // ✅ OTP countdown
    useEffect(() => {
        let phoneInterval, emailInterval;
        if (phoneOtpTimer > 0) {
            phoneInterval = setInterval(() => {
                setPhoneOtpTimer((prev) => prev - 1);
            }, 1000);
        }
        if (emailOtpTimer > 0) {
            emailInterval = setInterval(() => {
                setEmailOtpTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            clearInterval(phoneInterval);
            clearInterval(emailInterval);
        };
    }, [phoneOtpTimer, emailOtpTimer]);

    const shakeOtpFields = (type) => {
        const refs = type === "phone" ? phoneOtpRefs.current : emailOtpRefs.current;
        refs.forEach((ref) => {
            if (ref) {
                ref.classList.add("shake", "border-red-500");
                setTimeout(() => {
                    ref.classList.remove("shake", "border-red-500");
                }, 300);
            }
        });
    };

    // ✅ Handle email input change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(
                    `${REACT_APP_BACKEND_URL}/user/getUserDetails`,
                    {
                        headers: {
                            Authorization: `Bearer ${Cookies.get("session")}`,
                        },
                    }
                );
                console.log("User details fetched:", res.data);
                setFormData({
                    phoneNumber: res.data?.user?.phoneNumber || "",
                    email: res.data?.user?.email || "",
                })
                setEmailVerified(res.data?.user?.isEmailVerified || false);
                setPhoneVerified(res.data?.user?.isPhoneVerified || false);
            } catch (err) {

            }
        }
        fetchUser();
    }, [REACT_APP_BACKEND_URL])
    useEffect(() => {
        if (onVerificationChange) {
            onVerificationChange({ phone: phoneVerified, email: emailVerified });
        }
    }, [phoneVerified, emailVerified]);

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-4 mb-4">
            {/* Phone Section */}
            <div className="flex flex-row sm:flex-row sm:items-end gap-2 w-full sm:w-auto">
                <div className="flex flex-col w-full sm:w-auto">
                    <label className="sm:text-[14px] text-[12px] font-[500] text-gray-500 mb-1">
                        Phone
                    </label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length > 10) value = value.slice(0, 10);
                            setFormData({ ...formData, phoneNumber: value });
                        }}
                        placeholder="Enter Phone Number"
                        disabled={phoneVerified}
                        required
                        className="w-full sm:w-[250px] px-3 py-2 text-gray-600 h-9 text-[12px] font-[600] border border-gray-300 rounded-lg outline-none 
        focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D]"
                    />
                </div>

                {phoneVerified ? (
                    <div className="flex items-center gap-1 text-[#0CBB7D] font-semibold w-[100px] text-[12px] mt-5 sm:mb-2">
                        <CheckCircleIcon className="w-6 h-6" />
                        Verified
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={sendOtp}
                        disabled={phoneOtpTimer > 0 || loadingPhoneOtp || !formData.phoneNumber}
                        className={`text-[10px] font-[600] border-2 border-[#0CBB7D] px-3 w-[100px] h-9 mt-[21px] py-2 rounded-lg transition-all duration-200 ${phoneOtpTimer > 0 || loadingPhoneOtp
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-[#0CBB7D] text-white hover:bg-[#0aa56c]"
                            }`}
                    >
                        {loadingPhoneOtp
                            ? "Sending..."
                            : phoneOtpTimer > 0
                                ? `Resend in ${phoneOtpTimer}s`
                                : "Send OTP"}
                    </button>
                )}
            </div>

            {/* Email Section */}
            <div className="flex flex-row sm:flex-row sm:items-end gap-2 w-full sm:w-auto">
                <div className="flex flex-col w-full sm:w-auto">
                    <label className="sm:text-[14px] text-[12px] font-[500] text-gray-500 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter Email"
                        disabled={emailVerified}
                        required
                        className="w-full sm:w-[250px] h-9 px-3 py-2 text-gray-600 text-[12px] font-[600] border border-gray-300 rounded-lg outline-none 
        focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D]"
                    />
                </div>

                {emailVerified ? (
                    <div className="flex items-center gap-1 w-[100px] text-[#0CBB7D] font-semibold text-[12px] mt-5 sm:mb-2">
                        <CheckCircleIcon className="w-6 h-6" />
                        Verified
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={sendEmailOtp}
                        disabled={emailOtpTimer > 0 || loadingEmailOtp || !formData.email}
                        className={`text-[10px] font-[600] border-2 border-[#0CBB7D] w-[100px] h-9 mt-[21px] px-3 py-2 rounded-lg transition-all duration-200 ${emailOtpTimer > 0 || loadingEmailOtp
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-[#0CBB7D] text-white hover:bg-[#0aa56c]"
                            }`}
                    >
                        {loadingEmailOtp
                            ? "Sending..."
                            : emailOtpTimer > 0
                                ? `Resend in ${emailOtpTimer}s`
                                : "Send OTP"}
                    </button>
                )}
            </div>

            {/* OTP Modals */}
            <OtpModal
                show={showPhoneOtp}
                onClose={() => setShowPhoneOtp(false)}
                otp={phoneOtp}
                refs={phoneOtpRefs}
                handleChange={handlePhoneOtpChange}
                handleKeyDown={handleOtpKeyDown}
                timer={phoneOtpTimer}
                onResend={sendOtp}
                onVerify={verifyPhoneOtp}
                errorShake={phoneOtpError}
                label="Verify Phone OTP"
                type="phone"
                verified={phoneVerified}
                loading={loadingPhoneOtp}
            />
            <OtpModal
                show={showEmailOtp}
                onClose={() => setShowEmailOtp(false)}
                otp={emailOtp}
                refs={emailOtpRefs}
                handleChange={handleEmailOtpChange}
                handleKeyDown={handleOtpKeyDown}
                timer={emailOtpTimer}
                onResend={sendEmailOtp}
                onVerify={verifyEmailOtp}
                errorShake={emailOtpError}
                label="Verify Email OTP"
                type="email"
                verified={emailVerified}
                loading={loadingEmailOtp}
            />
        </div>


    );
};

export default VerifyPhoneEmail;
