import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
// import { toast } from "react-toastify";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import {Notification} from "../../Notification"

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [showOtp, setShowOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSendOtp = async () => {
    if (otpTimer > 0 || emailVerified) return;

    if (!email) {
      Notification("Please enter your email first.","info");
      return;
    }

    try {
      const response = await fetch(
        `${REACT_APP_BACKEND_URL}/auth/send-email-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send OTP");

      Notification("OTP sent to email. Check your spam folder too.","success");
      setShowOtp(true);
      setOtpTimer(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (error) {
      Notification(error.message || "Failed to send OTP. Please try again.","error");
    }
  };

  const verifyEmailOtp = async (otpValue) => {
    try {
      const response = await fetch(
        `${REACT_APP_BACKEND_URL}/auth/verify-email-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpValue }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "OTP verification failed");

      Notification("OTP verified!","success");
      setEmailVerified(true);
      setShowOtp(false);
    } catch (error) {
      setOtpError(true);
      setTimeout(() => setOtpError(false), 300);
      Notification(error.message,"error");
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (updatedOtp.every((digit) => digit !== "")) {
      verifyEmailOtp(updatedOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setShowOtp(false);
    }
  }, [otpTimer]);

  const handleUpdatePassword = async () => {
    if (!email || !newPassword) {
      Notification("Please enter both email and new password.","info");
      return;
    }

    if (!emailVerified) {
      Notification("Please verify the OTP first.","info");
      return;
    }

    try {
      const response = await fetch(
        `${REACT_APP_BACKEND_URL}/external/forgetPassword`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, newPassword }),
        }
      );

      const data = await response.json();
      console.log(data)
      if (!response.ok)
        throw new Error(data.message || "Failed to update password");
      // navigate("/login");

      Notification("Password updated successfully!","success");
    } catch (error) {
      Notification(error.message,"error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-6 sm:p-8 shadow-lg rounded-lg w-full max-w-md">
        <h2 className="text-xl sm:text-2xl font-semibold text-center">
          Reset Password
        </h2>
        <p className="text-gray-600 text-sm text-center mt-2">
          Enter your email and new password to reset.
        </p>

        {/* Email Input + OTP Section */}
        <div className="mt-4">
          <label className="block text-gray-700 text-sm mb-1">
            Email Address
          </label>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <input
              type="email"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm placeholder:text-xs disabled:bg-gray-100"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={emailVerified}
            />
            {emailVerified ? (
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle size={16} />
                Verified
              </div>
            ) : (
              <button
                className="px-3 py-2 text-xs bg-[#0CBB7D] text-white rounded-md transition disabled:opacity-60 w-full sm:w-auto whitespace-nowrap"
                onClick={handleSendOtp}
                disabled={otpTimer > 0}
              >
                {otpTimer > 0 ? "OTP Sent" : "Send OTP"}
              </button>

            )}
          </div>

          {showOtp && !emailVerified && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 gap-2">
              <div className="flex gap-1">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    ref={(el) => (otpRefs.current[index] = el)}
                    className={`w-8 h-9 text-center border rounded text-sm ${otpError ? "border-red-500 animate-shake" : ""
                      }`}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-600 ml-2 sm:w-28 text-right">
                Resend OTP in {otpTimer}s
              </div>
            </div>
          )}
        </div>

        {/* Password Input */}
        <div className="mt-4 relative">
          <label className="block text-gray-700 text-sm mb-1">
            New Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm placeholder:text-xs pr-10"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 mt-1 top-1/2 -translate-y-4/4 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        <button
          onClick={handleUpdatePassword}
          className="w-full mt-4 bg-[#0CBB7D] text-white py-2 rounded-md transition"
        >
          Update Password
        </button>

        <div className="text-center mt-4">
          <Link to="/login" className="text-[#0CBB7D] hover:underline text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
