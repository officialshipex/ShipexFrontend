import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { FiSearch } from "react-icons/fi";

const MasterSearchFilter = ({ isMobile = false }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    const placeholderTexts = [
        "Order ID",
        "AWB Number",
        "Pickup Name",
        "Pickup Email",
        "Pickup Mobile",
        "Receiver Name",
        "Receiver Email",
        "Receiver Mobile",
        "Courier Service Name",
    ];

    // Rotate placeholders every 2 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch suggestions from backend
    const fetchSuggestions = async (query) => {
        if (!query || query.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            setLoading(true);
            const token = Cookies.get("session");
            const response = await axios.get(
                `${REACT_APP_BACKEND_URL}/order/masterSearch`,
                {
                    params: { query: query.trim() },
                    headers: { authorization: `Bearer ${token}` },
                }
            );

            if (response.data.orders && response.data.orders.length > 0) {
                setSuggestions(response.data.orders);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error("Error fetching search suggestions:", error);
            setSuggestions([]);
            setShowSuggestions(false);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSuggestions(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSuggestionClick = (orderId) => {
        navigate(`/dashboard/order/neworder/updateOrder/${orderId}`);
        setSearchQuery("");
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && suggestions.length > 0) {
            handleSuggestionClick(suggestions[0]._id);
        }
    };

    if (isMobile) {
        return (
            <div className="relative w-full" ref={dropdownRef}>
                <div className="relative flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-[#0CBB7D] transition-colors group">
                    <div className="pl-3 text-gray-400 group-focus-within:text-[#0CBB7D] transition-colors">
                        <FiSearch className="text-[14px]" />
                    </div>
                    <div className="relative flex-1 h-[35px] overflow-hidden">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="absolute inset-0 w-full h-full px-3 text-[12px] font-[600] border-none focus:outline-none bg-transparent"
                            style={{ caretColor: '#0CBB7D' }}
                        />
                        {!searchQuery && (
                            <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                                <div className="flex items-center">
                                    <span className="text-[12px] text-gray-400 mr-1">Search by</span>
                                    <div className="relative h-[20px] overflow-hidden w-[130px]">
                                        {placeholderTexts.map((text, index) => (
                                            <div
                                                key={index}
                                                className="absolute text-[12px] top-0.5 text-gray-400 transition-all duration-500 ease-in-out whitespace-nowrap"
                                                style={{
                                                    transform: `translateY(${(index - placeholderIndex) * 100}%)`,
                                                    opacity: index === placeholderIndex ? 1 : 0,
                                                }}
                                            >
                                                {text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[200] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[300px] overflow-y-auto animate-popup-in">
                        {loading ? (
                            <div className="px-3 py-2 text-[10px] text-gray-500">Searching...</div>
                        ) : (
                            suggestions.map((order) => (
                                <div
                                    key={order._id}
                                    onClick={() => handleSuggestionClick(order._id)}
                                    className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                >
                                    <div className="flex justify-between items-start">

                                        {/* Left Section */}
                                        <div className="text-[10px] space-y-0.5 text-gray-700">
                                            <div className="font-[500]">
                                                {order.orderId}
                                            </div>

                                            {order.awb_number && (
                                                <div className="text-[#0CBB7D] font-[600]">
                                                    {order.awb_number}
                                                </div>
                                            )}

                                            {order.courierServiceName && (
                                                <div>
                                                    {order.courierServiceName}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Section */}
                                        <div className="text-[10px] text-right space-y-0.5 text-gray-700">
                                            <div className="font-[500] bg-green-100 text-[#0CBB7D] px-1 rounded">
                                                {order.status}
                                            </div>

                                            {order.paymentDetails?.method && (
                                                <div>
                                                    {order.paymentDetails.method}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>

                            ))
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Desktop version
    return (
        <div className="relative w-[350px]" ref={dropdownRef}>
            <div className="relative flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-[#0CBB7D] transition-colors h-[32px] group">
                <div className="pl-3 text-gray-400 group-focus-within:text-[#0CBB7D] transition-colors">
                    <FiSearch className="text-[14px]" />
                </div>
                <div className="relative flex-1 h-full overflow-hidden">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="absolute inset-0 w-full text-gray-700 h-full px-3 text-[11px] font-[600] border-none focus:outline-none bg-transparent"
                        style={{ caretColor: '#0CBB7D' }}
                    />
                    {!searchQuery && (
                        <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                            <div className="flex items-center">
                                <span className="text-[12px] text-gray-400 mr-1">Search by</span>
                                <div className="relative h-[18px] overflow-hidden w-[120px]">
                                    {placeholderTexts.map((text, index) => (
                                        <div
                                            key={index}
                                            className="absolute text-[12px] text-gray-400 transition-all duration-500 ease-in-out whitespace-nowrap"
                                            style={{
                                                transform: `translateY(${(index - placeholderIndex) * 100}%)`,
                                                opacity: index === placeholderIndex ? 1 : 0,
                                            }}
                                        >
                                            {text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[200] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[300px] overflow-y-auto animate-popup-in">
                    {loading ? (
                        <div className="px-3 py-2 text-[10px] text-gray-500">Searching...</div>
                    ) : (
                        suggestions.map((order) => (
                            <div
                                key={order._id}
                                onClick={() => handleSuggestionClick(order._id)}
                                className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b last:border-b-0 transition-colors"
                            >
                                <div className="flex justify-between items-start">

                                    {/* Left Section */}
                                    <div className="text-[10px] space-y-0.5 text-gray-700">

                                        <div className="font-[500]">
                                            {order.orderId}
                                        </div>

                                        {order.awb_number && (
                                            <div className="text-[#0CBB7D] font-[600]">
                                                {order.awb_number}
                                            </div>
                                        )}

                                        {order.courierServiceName && (
                                            <div>
                                                {order.courierServiceName}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Section */}
                                    <div className="text-[10px] text-right space-y-0.5 text-gray-700">

                                        <div className="px-2 py-0.5 bg-green-100 text-[#0CBB7D] rounded uppercase inline-block">
                                            {order.status}
                                        </div>

                                        {order.paymentDetails?.method && (
                                            <div>
                                                {order.paymentDetails.method}
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>

                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default MasterSearchFilter;
