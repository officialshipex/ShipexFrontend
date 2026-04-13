import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { FiChevronDown, FiRefreshCcw } from "react-icons/fi";
import BuyCreditModal from "./BuyCreditModal";
import Cookies from "js-cookie";


const Notification = ({ targetUserId = null, basePath = "/dashboard/settings/notification" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creditBalance, setCreditBalance] = useState(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    const tabs = [
        { label: "WhatsApp", path: `${basePath}/whatsapp` },
        { label: "Message", path: `${basePath}/message` },
        { label: "Email (Free)", path: `${basePath}/email` },
        { label: "AI Smart Calling", path: `${basePath}/ai-order-updation` },
        { label: "Credit History", path: `${basePath}/credit-history` },
    ];
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const token = Cookies.get("session");
    const selectedTab = tabs.find((tab) => tab.path === location.pathname);

    const toggleDropdown = () => {
        setIsOpen((prev) => !prev);
    };

    const handleSelect = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    const fetchCreditBalance = async () => {
        if (basePath.startsWith("/adminDashboard") && !targetUserId) {
            setCreditBalance(0);
            return;
        }
        try {
            setLoadingBalance(true);
            const params = new URLSearchParams();
            if (targetUserId) params.append("userId", targetUserId);

            const response = await fetch(`${REACT_APP_BACKEND_URL}/notification/getCreditBalance?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setCreditBalance(data.creditBalance || 0);
        } catch (error) {
            console.error("Error fetching balance:", error);
        } finally {
            setLoadingBalance(false);
        }
    };

    useEffect(() => {
        fetchCreditBalance();
    }, [targetUserId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="w-full">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[12px] sm:text-[14px] mb-1 text-gray-700 font-[600]">
                        Manage {targetUserId ? "User" : "Your"} Notification
                    </h1>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2 sm:mt-0">
                    <div className="flex flex-col items-start">
                        <div className="flex gap-4">
                            <span className="text-[10px] sm:text-[12px] font-[600] text-gray-700">
                                {loadingBalance ? `Credit Balance: ${creditBalance ?? 0}` : `Credit Balance: ${creditBalance ?? 0}`}
                            </span>
                            <FiRefreshCcw
                                onClick={fetchCreditBalance}
                                className={`w-4 h-4 text-gray-600 cursor-pointer ${loadingBalance ? "animate-spin" : ""
                                    }`}
                            />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-[12px]">(₹1 = 1 Credit, 1 Notification = ₹1)</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#0CBB7D] text-white text-[10px] sm:text-[12px] font-[600] rounded-lg px-3 py-2 hover:bg-opacity-90 transition"
                    >
                        Buy Credit
                    </button>
                </div>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden sm:flex gap-2">
                {tabs.map((tab) => (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={`px-3 py-2 rounded-lg text-[12px] font-[600] border transition-all duration-200 ${location.pathname === tab.path
                            ? "bg-[#0CBB7D] text-white"
                            : "text-gray-700 hover:bg-green-200 bg-white"
                            }`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Mobile Dropdown */}
            <div className="sm:hidden mb-2 mt-2 relative" ref={dropdownRef}>
                <button
                    onClick={toggleDropdown}
                    className="w-full text-left text-[12px] border bg-white rounded-lg px-3 py-2 font-[600] text-gray-700 focus:outline-none flex items-center justify-between"
                >
                    <span>{selectedTab?.label || "Select Option"}</span>
                    <FiChevronDown
                        className={`w-4 h-4 text-gray-700 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                            }`}
                    />
                </button>

                <div
                    className={`absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-sm overflow-hidden transition-all duration-300 ease-in-out transform ${isOpen
                        ? "max-h-[500px] opacity-100 scale-100"
                        : "max-h-0 opacity-0 scale-95"
                        }`}
                >
                    {tabs.map((tab) => (
                        <div
                            key={tab.path}
                            onClick={() => handleSelect(tab.path)}
                            className={`px-3 py-2 text-[12px] cursor-pointer font-[600] transition-all ${location.pathname === tab.path
                                ? "bg-green-100 text-[#0CBB7D]"
                                : "text-gray-700 hover:bg-green-50"
                                }`}
                        >
                            {tab.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Render Tab Content */}
            <div className="mt-2">
                <Outlet context={{ targetUserId, isAdmin: basePath.startsWith("/adminDashboard") }} />
            </div>

            {isModalOpen && (
                <BuyCreditModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchCreditBalance}
                    targetUserId={targetUserId}
                />
            )}

        </div>
    );
};

export default Notification;
