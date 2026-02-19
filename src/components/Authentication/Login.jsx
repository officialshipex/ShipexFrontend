import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { createSession, getSession } from "../../utils/session";
import ShipexLogo from '../../assets/Shipex.jpg'; // adjust path as needed
import illustrationimage from '../../assets/Login.png'; // adjust path as needed
import { Notification } from "../../Notification"

const LoginPage = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState({});
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  // console.log(",ddddddd",REACT_APP_BACKEND_URL)

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const param = new URLSearchParams(window.location.search);
        const token = param.get("token");

        if (token) createSession(token);

        const response = await getSession();
        if (response?.success) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Error during session initialization", err);
      }
    };
    initialize();
  }, [setIsAuthenticated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError({ email: "Please enter your email before requesting password reset" });
      return;
    }
    setError({}); // clear any errors
    try {
      // You may need to generate or get a token here if required by your API
      // For example, your backend might generate token given just the email.
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/auth/resetPassword`,
        {
          email: formData.email,

        }
      );
      if (response?.data?.success) {
        Notification("Reset password email sent. Please check your inbox.", "success");
      } else {
        Notification(response.data.message || "Failed to send reset email.", "error");
      }
    } catch (error) {
      console.log("error", error);
      Notification(
        error?.response?.data?.message ||
        "Error occurred while sending password reset email.", "error"
      );
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    setError({});
    setMessage(null);

    const newErrors = {};
    if (!email) newErrors.email = "Email is required";
    if (!validateEmail(email)) newErrors.email = "Invalid email address";
    if (!password) newErrors.password = "Password is required";
    if (password.length < 8)
      newErrors.password = "At least 8 characters required";

    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/external/login`,
        { email, password }
      );

      if (response?.data?.success) {
        // console.log("response datata", response.data);
        localStorage.setItem("kyc", response.data.kyc)
        Notification(response.data.message || "Login successful", "success");
        createSession(response.data.data);
        // delay redirect for 2 seconds to let toast show
        setTimeout(() => {
          setIsAuthenticated(true);
        }, 2000);
        localStorage.removeItem("activeNdrTab"); // or whatever your token key is
        localStorage.removeItem("activeOrderTab");
        localStorage.removeItem("activeOperationFirstMileTab");
        localStorage.removeItem("activeOperationMidMileTab");
        localStorage.removeItem("activeOperationLastMileTab");
        localStorage.removeItem("activeUserDiscrepancyTab");
        localStorage.removeItem("activeDiscrepancyTab");
        localStorage.removeItem("activeSidebarItem");
        console.log("ress", response.data)
        // navigate("/dashboard");
      } else {
        // setMessage(response?.data?.message || "Invalid login attempt");
        Notification(response?.data?.message || "Invalid login attempt", "error");
        setIsLoading(false);
      }
    } catch (err) {
      // setMessage(
      //   err?.response?.data?.message ||
      //   "An error occurred. Please try again later."
      // );
      Notification(
        err?.response?.data?.message || "An error occurred. Please try again later.",
        "error"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden page-slide-in">
      {/* Main Content */}
      <div className="flex flex-col md:flex-row bg-green-50 flex-grow">
        {/* Left Section */}
        <div className="w-full px-4 py-6 md:p-6 flex justify-center items-center">
          <div className="w-full max-w-sm md:max-w-md p-4 md:p-6 rounded-lg shadow-sm bg-white">
            {/* Logo */}
            <div className="flex justify-start mb-4 md:mb-4">
              <img src={ShipexLogo} alt="Logo" className="h-10 md:h-12" />
            </div>

            {/* Heading */}
            <h1 className="text-[18px] md:text-[24px] font-[600] mb-2 md:mb-3 text-left text-[#0CBB7D]">
              Welcome Back!
            </h1>
            <p className="text-gray-500 mb-4 text-[12px] md:text-[12px] font-[600]">
              Enter your credentials to access your account
            </p>

            {/* Error Message */}
            {message && (
              <p className="text-left text-[12px] text-red-500 mb-4">{message}</p>
            )}

            {/* Form */}
            <form className="space-y-2" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label className="block text-gray-700 text-[12px] font-[600]">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border rounded-lg px-3 py-2 w-full text-[12px] font-[600] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                />
                {error.email && (
                  <p className="text-[12px] text-red-500 mt-1">{error.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="w-full text-[12px] font-[600] flex justify-end">
                  <span
                    onClick={handleForgotPassword}
                    className="text-[12px] text-[#0CBB7D] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </span>
                </label>

                <label className="block text-gray-700 text-[12px] font-[600]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="border rounded-lg px-3 py-2 w-full pr-10 text-[12px] font-[600] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                  />
                  <span
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#0CBB7D]"
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </span>
                </div>

                {error.password && (
                  <p className="text-[12px] text-red-500 mt-1">{error.password}</p>
                )}
              </div>



              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="h-3 w-3 accent-[#0CBB7D] cursor-pointer" />
                <p className="text-[10px] font-[600] text-gray-700">Remember me</p>
              </div>

              {/* Login Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`py-2 px-3 text-[12px] font-[600] rounded-lg w-full mt-4 transition ${isLoading
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-[#0CBB7D] text-white hover:bg-opacity-90"
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    
                  </span>
                ) : (
                  "Log In"
                )}
              </button>

              {/* Signup Link */}
              <p className="text-[10px] font-[600] text-gray-500 text-left mt-3">
                New to ShipexIndia?{" "}
                <Link
                  to="/register"
                  className="text-[#0CBB7D] underline hover:font-[600] hover:text-[#0CBB7D]"
                >
                  Create new account
                </Link>
              </p>
            </form>

          </div>
        </div>


        {/* Right Section - Image (only on larger screens) */}
        {/* Right Section - Exact Styled Circular Steps */}
        {/* Exact Circular Steps Design */}
        <div className="sm:flex justify-center items-center mt-44 hidden md:block">
          <div className="relative w-[350px] h-[350px] flex items-center justify-center md:mr-60 mr-0 md:scale-100 scale-[0.65]">

            {/* Outer Dashed Circle */}
            <div className="absolute w-full h-full rounded-full border-2 border-dashed border-black" />

            {/* Inner Light Circle with Center Text */}
            <div className="w-[180px] h-[180px] rounded-full border border-bg-[#0CBB7D] bg-white flex items-center justify-center text-center px-4">
              <p className="text-[14px] font-[600] text-gray-700 leading-snug">
                Start shipping<br />in 3 easy steps
              </p>
            </div>

            {/* Step 1 - Top */}
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-[12px] text-gray-700 -mt-7 font-[600]">Sign Up</p>
              <div className="bg-[#0CBB7D] text-white w-10 h-10 rounded-full flex items-center justify-center font-[600] text-[12px] shadow-md mt-3">1</div>
            </div>

            {/* Step 2 - Right (FIXED ALIGNMENT) */}
            <div className="absolute top-1/2 right-[-40px] transform -translate-y-1/2 text-center">
              <div className="flex flex-row items-center -ml-[70px]">
                <div className="bg-[#0CBB7D] text-white w-10 h-10 rounded-full flex items-center justify-center font-[600] text-[12px] shadow-sm ml-2">
                  2
                </div>
                <p className="text-[12px] text-gray-700 mt-4 ml-3 font-[600] leading-snug text-center -mr-32">
                  Complete Your<br />Kyc
                </p>
              </div>
            </div>

            {/* Step 3 - Bottom */}
            <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 text-center w-28">
              <div className="bg-[#0CBB7D] text-white w-10 h-10 rounded-full flex items-center justify-center font-[600] text-[12px] shadow-sm mx-auto">3</div>
              <p className="text-[12px] text-gray-700 mt-1 font-[600] leading-snug">
                Recharge Your<br />Account
              </p>
            </div>

            {/* Step 4 - Left (FIXED ALIGNMENT) */}
            <div className="absolute top-1/2 -left-11 transform -translate-y-1/2 text-center">
              <div className="flex flex-row items-center -ml-[70px]">
                <p className="text-[12px] text-gray-700 mt-0 font-[600] leading-snug text-center mr-3">
                  Start Shipping
                </p>
                <div className="bg-[#0CBB7D] text-white w-10 h-10 rounded-full flex items-center justify-center font-[600] text-[12px] shadow-sm mx-auto">
                  4
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-white">
        <footer className="w-full bg-green-50 px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center text-gray-500 text-[10px] text-center sm:text-left space-y-2 sm:space-y-0 ">
          <p className="w-full sm:w-auto font-[600]">
            © 2025 Shipex. All rights reserved.
          </p>

          <div className="sm:flex flex-col font-[600] sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0 w-full sm:w-auto hidden md:block">
            <a href="https://www.shipexindia.com/privacy-policy" target="blank" className="text-gray-500 hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="https://www.shipexindia.com/refund-cancellation" target="blank" className="text-gray-500 hover:text-gray-900">
              Refund & Cancellation Policy
            </a>
            <a href="https://www.shipexindia.com/terms-conditions" target="blank" className="text-gray-500 hover:text-gray-900">
              Terms & Conditions
            </a>
          </div>
        </footer>
      </div>

    </div>
  );
};

export default LoginPage;
