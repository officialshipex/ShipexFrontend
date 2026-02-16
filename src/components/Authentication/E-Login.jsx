import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { createSession, getSession } from "../../utils/session";

const Elogin = ({ setEmployeeAuthenticated }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState({});
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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

        const response = await getSession("employee");
        if (response?.success) {
          setEmployeeAuthenticated(true);
          // Only navigate if not already on adminDashboard
          if (location.pathname !== "/adminDashboard") {
            navigate("/adminDashboard", { replace: true });
          }
        }
      } catch (err) {
        // Do nothing, just let user login
      }
    };
    initialize();
    // Only run on mount
    // eslint-disable-next-line
  }, [setEmployeeAuthenticated, navigate, location.pathname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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

    try {
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/staffRole/e-login`,
        { email, password }
      );
      

      if (response?.data?.success) {
        // console.log("Login response:", response);
        setMessage(response.data.message);
        createSession(response.data.data);
        setEmployeeAuthenticated(true);
        navigate("/adminDashboard", { replace: true }); // Use replace to prevent back navigation
      } else {
        setMessage(response?.data?.message || "Invalid login attempt");
      }
    } catch (err) {
      setMessage(
        err?.response?.data?.message ||
          "An error occurred. Please try again later."
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden font-[Archivo, Helvetica, Arial, sans-serif]">
      {/* Main Content */}
      <div className="flex flex-col md:flex-row bg-white flex-grow">
        {/* Left Section */}
        <div className="w-full p-4 md:p-6 flex justify-center items-center">
          <div className="w-full max-w-sm md:max-w-md p-2 rounded-lg">
            <div className="flex justify-left mb-4 md:mb-6">
              <img src="/LOGO.svg" alt="Logo" className="h-10 md:h-12" />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-left text-[#0CBB7D]">
              Welcome Team
            </h1>
            <p className="text-gray-600 mb-4 text-xs md:text-sm">
              Enter your credentials to access your account
            </p>

            {message && (
              <p className="text-left text-sm text-red-500 mb-4">{message}</p>
            )}

            <form className="space-y-4 pb-4" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label className="block text-gray-700 text-xs md:text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    style={{ fontSize: "0.8rem" }}
                    placeholder="Enter Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="border rounded-lg p-2.5 w-full text-xs md:text-sm transition-shadow outline-none 
                focus:ring-1 focus:ring-[#2D054B] "
                  />
                </div>
                {error.email && (
                  <p className="text-xs text-red-500">{error.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-gray-700 text-xs md:text-sm flex justify-between items-center font-medium">
                  <span>Password</span>
                  {/* <Link
                    to="/ForgotPassword"
                    className="text-xs text-[#2D054B] hover:underline hover:text-[#e8cafe]"
                  >
                    Forgot Password?
                  </Link> */}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    style={{ fontSize: "0.8rem" }}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="border rounded-lg p-2.5 w-full pr-10 text-xs md:text-sm transition-shadow outline-none 
                focus:ring-1 focus:ring-[#2D054B] "
                  />
                  <span
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-2 cursor-pointer text-[#2D054B]"
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </span>
                </div>
                {error.password && (
                  <p className="text-xs text-red-500">{error.password}</p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              {/* <div className="flex items-center space-x-2">
                <input type="checkbox" className="h-4 w-4 text-[#2D054B]" />
                <p className="text-xs md:text-sm text-gray-700">Remember me</p>
              </div> */}

              {/* Login Button */}
              <button
                type="submit"
                className="bg-[#0CBB7D] text-white py-[8px]  px-3 rounded-lg w-full mt-6 hover:bg-green-700 transition"
              >
                Log In
              </button>

              {/* Signup Link */}
              {/* <p className="text-xs md:text-sm text-gray-700 text-left mt-2">
                New to ShipexIndia?{" "}
                <Link
                  to="/register"
                  className="text-[#2D054B] underline hover:text-[#e8cafe]"
                >
                  Create new account
                </Link>
              </p> */}
            </form>
          </div>
        </div>

        {/* Right Section - Image (only on larger screens) */}
        <div className="hidden md:flex md:w-1/2 justify-center items-center mr-20 ">
          <img
            src="/loginlogo.png"
            alt="Login"
            className="w-full max-w-md h-auto object-contain rounded-lg "
          />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-white border-gray-300">
        <footer className="w-full bg-white px-6 py-8 flex flex-col md:flex-row md:justify-between md:items-center text-[#2D054B] text-xs md:text-sm mt-6 md:mt-0 text-justify">
          <p className="mt-0 md:mb-0 text-left w-full md:w-auto">
            © 2025 Shipex. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 text-left w-full md:w-auto">
            <a href="#" className="text-[#2D054B] hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="#" className="text-[#2D054B] hover:text-gray-900">
              Refund & Cancellation Policy
            </a>
            <a href="#" className="text-[#2D054B] hover:text-gray-900">
              Terms & Conditions
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Elogin;
