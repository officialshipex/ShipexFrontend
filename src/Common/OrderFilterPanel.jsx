import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import UserFilter from "../filter/UserFilter";

const OrderFilterPanel = ({
    isOpen,
    onClose,
    userId,
    searchQuery: initialSearchQuery,
    orderId: initialOrderId,
    paymentType: initialPaymentType,
    pickupAddresses = [],
    selectedPickupAddress: initialSelectedPickupAddress,
    selectedCourier: initialSelectedCourier,
    awbNumber: initialAwbNumber,
    courierOptions = [],
    onClearFilters,
    onApplyFilters,
    showAwb = false,
    showCourier = true,
    showUserSearch = false,
    searchLabel = "Customer Search",
    searchPlaceholder = "Name, Email or Phone",
    selectedUserId: initialSelectedUserId,
}) => {
    // Local state for filters
    const [localFilters, setLocalFilters] = useState({
        searchQuery: "",
        orderId: "",
        awbNumber: "",
        paymentType: "",
        selectedPickupAddress: [],
        selectedCourier: [],
        selectedUserId: null
    });

    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef(null);

    const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
    const [showPickupDropdown, setShowPickupDropdown] = useState(false);
    const [showCourierDropdown, setShowCourierDropdown] = useState(false);
    const [userClearTrigger, setUserClearTrigger] = useState(false);

    const paymentRef = useRef(null);
    const pickupRef = useRef(null);
    const courierRef = useRef(null);
    const searchRef = useRef(null);

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    // Sync local state when panel opens
    useEffect(() => {
        if (isOpen) {
            setLocalFilters({
                searchQuery: initialSearchQuery || "",
                orderId: initialOrderId || "",
                awbNumber: showAwb ? (initialAwbNumber || "") : "",
                paymentType: initialPaymentType || "",
                selectedPickupAddress: Array.isArray(initialSelectedPickupAddress) ? initialSelectedPickupAddress : (initialSelectedPickupAddress ? [initialSelectedPickupAddress] : []),
                selectedCourier: Array.isArray(initialSelectedCourier) ? initialSelectedCourier : (initialSelectedCourier ? [initialSelectedCourier] : []),
                selectedUserId: initialSelectedUserId || null
            });
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isOpen, initialSearchQuery, initialOrderId, initialPaymentType, initialSelectedPickupAddress, initialSelectedCourier, showAwb, initialSelectedUserId]);

    // Outside click logic for local dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (paymentRef.current && !paymentRef.current.contains(event.target)) setShowPaymentDropdown(false);
            if (pickupRef.current && !pickupRef.current.contains(event.target)) setShowPickupDropdown(false);
            if (courierRef.current && !courierRef.current.contains(event.target)) setShowCourierDropdown(false);
            if (searchRef.current && !searchRef.current.contains(event.target)) setShowSuggestions(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Suggestions logic
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!localFilters.searchQuery || localFilters.searchQuery.length < 2) {
                setSuggestions([]);
                return;
            }
            setLoadingSuggestions(true);
            try {
                const token = Cookies.get("session");
                const res = await axios.get(
                    `${REACT_APP_BACKEND_URL}/order/searchReceiver?query=${localFilters.searchQuery}${userId ? `&userId=${userId}` : ''}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSuggestions(res.data.receivers || []);
                setShowSuggestions(true);
            } catch (err) {
                console.error("Suggestion fetch failed", err);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        const debounce = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounce);
    }, [localFilters.searchQuery, REACT_APP_BACKEND_URL, userId]);

    if (!isOpen) return null;

    const handleApply = () => {
        onApplyFilters(localFilters);
    };

    const handleClear = () => {
        const cleared = {
            searchQuery: "",
            orderId: "",
            awbNumber: "",
            paymentType: "",
            selectedPickupAddress: [],
            selectedCourier: [],
            selectedUserId: null
        };
        setLocalFilters(cleared);
        setUserClearTrigger(!userClearTrigger);
        onClearFilters();
        onClose();
    };

    // Shared input/button style class to match DateFilter
    const fieldStyle = "w-full h-[38px] px-3 text-[12px] font-[600] border rounded-lg focus:outline-none text-left flex items-center justify-between transition-all";

    const handleTogglePickup = (contactName) => {
        const current = localFilters.selectedPickupAddress;
        if (current.includes(contactName)) {
            setLocalFilters({ ...localFilters, selectedPickupAddress: current.filter(n => n !== contactName) });
        } else {
            setLocalFilters({ ...localFilters, selectedPickupAddress: [...current, contactName] });
        }
    };

    const handleToggleCourier = (courier) => {
        const current = localFilters.selectedCourier;
        if (current.includes(courier)) {
            setLocalFilters({ ...localFilters, selectedCourier: current.filter(c => c !== courier) });
        } else {
            setLocalFilters({ ...localFilters, selectedCourier: [...current, courier] });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative w-full max-w-[340px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <h2 className="text-[16px] font-bold text-gray-800 tracking-tight">Filters</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-all">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {showUserSearch && (
                        <div className="space-y-1 relative">
                            <label className="text-[12px] font-[600] text-gray-700">Search User</label>
                            <UserFilter
                                onUserSelect={(id) => setLocalFilters({ ...localFilters, selectedUserId: id })}
                                clearTrigger={userClearTrigger}
                            />
                        </div>
                    )}

                    {/* Search */}
                    <div className="space-y-1 relative" ref={searchRef}>
                        <label className="text-[12px] font-[600] text-gray-700">{searchLabel}</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                className={`${fieldStyle} bg-white border text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0CBB7D]`}
                                value={localFilters.searchQuery}
                                onChange={(e) => {
                                    setLocalFilters({ ...localFilters, searchQuery: e.target.value });
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => localFilters.searchQuery.length >= 2 && setShowSuggestions(true)}
                            />
                            {loadingSuggestions && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 text-[#0CBB7D] animate-spin" />
                                </div>
                            )}
                        </div>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-[110] py-1 animate-popup-in max-h-60 overflow-y-auto">
                                {suggestions.map((receiver, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setLocalFilters({ ...localFilters, searchQuery: receiver.contactName });
                                            setShowSuggestions(false);
                                        }}
                                        className="px-3 py-2 border-b border-gray-50 last:border-0 hover:bg-green-50 cursor-pointer transition-colors"
                                    >
                                        <div className="text-[12px] font-[600] text-gray-700">{receiver.contactName}</div>
                                        <div className="text-[10px] text-gray-400">
                                            {receiver.phoneNumber}{receiver.email ? ` | ${receiver.email}` : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Order ID */}
                    <div className="space-y-1">
                        <label className="text-[12px] font-[600] text-gray-700 tracking-wider">Order ID</label>
                        <input
                            type="text"
                            placeholder="Enter Order ID"
                            className={`${fieldStyle} bg-white border text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0CBB7D]`}
                            value={localFilters.orderId}
                            onChange={(e) => setLocalFilters({ ...localFilters, orderId: e.target.value })}
                        />
                    </div>

                    {/* AWB Number - Conditional */}
                    {showAwb && (
                        <div className="space-y-1">
                            <label className="text-[12px] font-[600] text-gray-400 tracking-wider">AWB Number</label>
                            <input
                                type="text"
                                placeholder="Enter AWB Number"
                                className={`${fieldStyle} bg-white border text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0CBB7D]`}
                                value={localFilters.awbNumber}
                                onChange={(e) => setLocalFilters({ ...localFilters, awbNumber: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Payment Type */}
                    <div className="space-y-1" ref={paymentRef}>
                        <label className="text-[12px] font-[600] text-gray-700 tracking-wider">Payment Type</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                                className={`${fieldStyle} ${showPaymentDropdown ? "border-[#0CBB7D]" : "border-gray-200"} bg-white`}
                            >
                                <span className={localFilters.paymentType ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                    {localFilters.paymentType || "Select Payment Type"}
                                </span>
                                <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showPaymentDropdown ? "rotate-180" : ""} `} />
                            </button>
                            {showPaymentDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-10 py-1 animate-popup-in">
                                    {["Prepaid", "COD"].map((type) => (
                                        <div
                                            key={type}
                                            onClick={() => { setLocalFilters({ ...localFilters, paymentType: type }); setShowPaymentDropdown(false); }}
                                            className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                        >
                                            {type}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pickup Address */}
                    <div className="space-y-1" ref={pickupRef}>
                        <label className="text-[12px] font-[600] text-gray-700 tracking-wider">Pickup Address</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowPickupDropdown(!showPickupDropdown)}
                                className={`${fieldStyle} ${showPickupDropdown ? "border-[#0CBB7D]" : "border-gray-200"} bg-white`}
                            >
                                <span className={localFilters.selectedPickupAddress.length > 0 ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                    {localFilters.selectedPickupAddress.length > 0
                                        ? `${localFilters.selectedPickupAddress.length} Selected`
                                        : "Select Pickup Address"}
                                </span>
                                <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showPickupDropdown ? "rotate-180" : ""} `} />
                            </button>
                            {showPickupDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-10 py-1 animate-popup-in max-h-60 overflow-y-auto">
                                    {pickupAddresses.map((addr, idx) => {
                                        const contactName = addr.contactName || addr.address;
                                        const isSelected = localFilters.selectedPickupAddress.includes(contactName);
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => handleTogglePickup(contactName)}
                                                className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors flex items-center gap-2"
                                            >
                                                <input type="checkbox" checked={isSelected} readOnly className="accent-[#0CBB7D] w-3 h-3" />
                                                <span className="truncate">{contactName}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Courier - Conditional */}
                    {showCourier && (
                        <div className="space-y-1" ref={courierRef}>
                            <label className="text-[12px] font-[600] text-gray-400 tracking-wider">Courier Partner</label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowCourierDropdown(!showCourierDropdown)}
                                    className={`${fieldStyle} ${showCourierDropdown ? "border-[#0CBB7D]" : "border-gray-200"} bg-white`}
                                >
                                    <span className={localFilters.selectedCourier.length > 0 ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                        {localFilters.selectedCourier.length > 0
                                            ? `${localFilters.selectedCourier.length} Selected`
                                            : "Select Courier Partner"}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showCourierDropdown ? "rotate-180" : ""} `} />
                                </button>
                                {showCourierDropdown && (
                                    <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-10 py-1 animate-popup-in max-h-60 overflow-y-auto">
                                        {courierOptions.map((courier, idx) => {
                                            const isSelected = localFilters.selectedCourier.includes(courier);
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleToggleCourier(courier)}
                                                    className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors flex items-center gap-2"
                                                >
                                                    <input type="checkbox" checked={isSelected} readOnly className="accent-[#0CBB7D] w-3 h-3" />
                                                    <span className="truncate">{courier}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons in one line */}
                <div className="p-4 border-t bg-white flex gap-3">
                    <button
                        onClick={handleClear}
                        className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-lg text-[12px] font-[600] hover:bg-gray-50 hover:text-red-500 transition-all active:scale-[0.98]"
                    >
                        Reset All
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-2 bg-[#0CBB7D] text-white rounded-lg text-[12px] font-[600] hover:bg-opacity-90 transition-all shadow-sm active:scale-[0.98]"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderFilterPanel;
