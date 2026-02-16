import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, getSession } from "../../utils/session";
import ShipexLogo from "../../assets/Shipex.jpg";
import illustrationimage from "../../assets/Login.png";
import { Notification } from "../../Notification";

export default function Signup({ setIsAuthenticated }) {
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loadingRegister, setLoadingRegister] = useState(false);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmedPassword: "",
  });

  const [referralCode, setReferralCode] = useState(null);

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
        console.error("Error during initialization:", err);
        // Notification("It is getting some error fetching data", "error");
      }
    };
    initialize();
  }, [setIsAuthenticated]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTermsChange = (e) => {
    setIsTermsAccepted(e.target.checked);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setReferralCode(code);
    }
  }, []);

  const registerUser = async () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.phoneNumber ||
      !formData.companyName ||
      !formData.confirmedPassword
    ) {
      Notification("All fields are required.", "error");
      setSuccess(false);
      return;
    }

    try {
      setLoadingRegister(true);
      const response = await fetch(
        `${REACT_APP_BACKEND_URL}/external/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullname: formData.fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            company: formData.companyName,
            monthlyOrders: "0",
            password: formData.password,
            confirmedPassword: formData.confirmedPassword,
            checked: true,
            referralCode,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        createSession(data.data);
        setIsAuthenticated(true);
        Notification(data.message, "info");
      } else {
        setSuccess(false);
        Notification(data.message, "error");
      }
    } catch (err) {
      Notification(
        err?.response?.data?.message ||
          "An error occurred. Please try again later.",
        "error"
      );
      setSuccess(false);
    } finally {
      setLoadingRegister(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.fullName ||
      !formData.companyName ||
      !formData.phoneNumber ||
      !formData.email ||
      !formData.password ||
      !formData.confirmedPassword
    ) {
      Notification("Please fill in all fields.", "error");
      return;
    }
    if (formData.password !== formData.confirmedPassword) {
      Notification("Passwords do not match.", "error");
      return;
    }
    registerUser();
    setIsTermsAccepted(false);
  };

  return (
    <div className="flex-col md:flex-row bg-green-50 flex-grow">
      <div className="w-full flex flex-row px-2 py-6 md:p-6 justify-center items-center">
        <div className="w-full max-w-sm md:max-w-md lg:max-w-xl p-4 md:p-6 rounded-lg shadow-sm bg-white">
          <div className="flex justify-between items-center mb-2">
            <img src={ShipexLogo} alt="Logo" className="h-10 md:h-12" />
            <Link to="/login" className="text-[12px] font-[600] text-[#0CBB7D]">
              &lt; <strong>Back</strong>
            </Link>
          </div>
          <h1 className="text-[18px] md:text-[24px] font-[600] mb-2 md:mb-3 text-left text-[#0CBB7D]">
            Sign Up Today!
          </h1>
          <p className="text-gray-500 mb-2 text-[12px] font-[600]">
            Enter your details to create your account
          </p>
          <form className="space-y-2" onSubmit={handleSubmit}>
            <div>
              <label className="text-gray-700 text-[12px] font-[600]">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter Full Name"
                required
                className="w-full py-2 px-3 border text-gray-700 rounded-lg font-[600] text-[12px] outline-none"
              />
            </div>
            <div>
              <label className="text-gray-700 text-[12px] font-[600]">
                Company
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter Company Name"
                required
                className="w-full py-2 px-3 border rounded-lg text-[12px] font-[600] text-gray-700 outline-none"
              />
            </div>
            {referralCode && (
              <div>
                <label className="text-gray-700 text-[12px] font-[600]">
                  Referral Code
                </label>
                <input
                  type="text"
                  value={referralCode}
                  readOnly
                  className="w-full py-2 px-3 border rounded-lg font-[600] text-gray-700 text-[12px] outline-none bg-gray-100 cursor-not-allowed"
                />
              </div>
            )}
            <div>
              <label className="text-gray-700 text-[12px] font-[600]">
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
                required
                className="w-full py-2 px-3 border rounded-lg text-[12px] font-[600] text-gray-700 outline-none"
              />
            </div>
            <div>
              <label className="text-gray-700 text-[12px] font-[600]">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Email"
                required
                className="w-full py-2 px-3 border rounded-lg text-[12px] font-[600] text-gray-700 outline-none"
              />
            </div>
            <div className="relative">
              <label className="text-gray-700 text-[12px] font-[600]">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter Password"
                required
                className="w-full py-2 px-3 pr-10 border rounded-lg text-[12px] font-[600] text-gray-700 outline-none"
              />
              <span
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-[34px] cursor-pointer text-[#0CBB7D]"
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            <div className="relative">
              <label className="text-gray-700 text-[12px] font-[600]">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmedPassword"
                value={formData.confirmedPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                required
                className="w-full py-2 px-3 pr-10 border rounded-lg text-[12px] font-[600] text-gray-700 outline-none"
              />
              {/* <span
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-[34px] cursor-pointer text-[#0CBB7D]"
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span> */}
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={isTermsAccepted}
                onChange={handleTermsChange}
                className="accent-[#0CBB7D] mt-2.5 cursor-pointer"
              />
              <label className="text-[10px] text-gray-700 font-[600] my-2">
                By clicking this check box, you accept Shipex&apos;s{" "}
                <a href="#" className="text-[#0CBB7D] underline">
                  Terms & Conditions
                </a>{" "}
                &{" "}
                <a href="#" className="text-[#0CBB7D] underline">
                  Privacy Policy
                </a>
              </label>
            </div>
            <button
              type="submit"
              disabled={!isTermsAccepted || loadingRegister}
              className={`w-full py-2 px-3 text-[12px] font-[600] rounded-lg hover:bg-opacity-90 transition ${
                isTermsAccepted && !loadingRegister
                  ? "bg-[#0CBB7D] text-white"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
            >
              {loadingRegister ? "Registering..." : "Sign Up"}
            </button>
          </form>
        </div>
        <div className="hidden md:flex justify-center items-center mt-12 space-x-10 ml-40">
          <img
            src={illustrationimage}
            alt="Delivery Icon"
            className="w-96 h-96 object-contain"
          />
        </div>
      </div>

      <div className="w-full bg-white">
        <footer className="w-full bg-green-50 font-[600] px-3 py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center text-gray-500 text-[10px] text-center sm:text-left sm:space-y-0">
          <p className="w-full sm:w-auto font-[600]">
            © 2025 Shipex. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0 w-full sm:w-auto md:block">
            <a href="#" className="text-gray-500 hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              Refund & Cancellation Policy
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              Terms & Conditions
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}