import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import UserFilter from "../filter/UserFilter";
import CourierFilter from "../filter/CourierFilter";

const ShippingFilterPanel = ({
    isOpen,
    onClose,
    selectedUserId: initialSelectedUserId,
    searchInput: initialSearchInput,
    searchType: initialSearchType,
    selectedCourier: initialSelectedCourier,
    status: initialStatus,
    paymentType: initialPaymentType,
    courierOptions,
    onClearFilters,
    onApplyFilters,
    showUserFilter = true,
    showPaymentType = false,
}) => {
    const [localFilters, setLocalFilters] = useState({
        selectedUserId: null,
        searchInput: "",
        searchType: "awbNumber",
        selectedCourier: [],
        status: "",
        paymentType: ""
    });

    const statusRef = useRef(null);
    const courierRef = useRef(null);
    const searchTypeRef = useRef(null);
    const paymentRef = useRef(null);

    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showCourierDropdown, setShowCourierDropdown] = useState(false);
    const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);
    const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
    const [clearUserTrigger, setClearUserTrigger] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters({
                selectedUserId: initialSelectedUserId || null,
                searchInput: initialSearchInput || "",
                searchType: initialSearchType || "awbNumber",
                selectedCourier: initialSelectedCourier || [],
                status: initialStatus || "",
                paymentType: initialPaymentType || ""
            });
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isOpen, initialSelectedUserId, initialSearchInput, initialSearchType, initialSelectedCourier, initialStatus, initialPaymentType]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusRef.current && !statusRef.current.contains(event.target)) setShowStatusDropdown(false);
            if (courierRef.current && !courierRef.current.contains(event.target)) setShowCourierDropdown(false);
            if (searchTypeRef.current && !searchTypeRef.current.contains(event.target)) setShowSearchTypeDropdown(false);
            if (paymentRef.current && !paymentRef.current.contains(event.target)) setShowPaymentDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const handleApply = () => {
        onApplyFilters(localFilters);
    };

    const handleClear = () => {
        const cleared = {
            selectedUserId: null,
            searchInput: "",
            searchType: "awbNumber",
            selectedCourier: [],
            status: "",
            paymentType: "",
            status: "",
            paymentType: ""
        };
        setLocalFilters(cleared);
        setClearUserTrigger(prev => !prev);
        onClearFilters();
    };

    const statusOptions = [
        "new", "Ready To Ship", "In-transit", "Out for Delivery", "Delivered",
        "Cancelled", "Lost", "Damaged", "RTO", "RTO In-transit", "RTO Delivered",
        "RTO Lost", "RTO Damaged", "Undelivered"
    ];

    const fieldStyle = "w-full h-[36px] px-3 text-[12px] font-[600] border rounded-lg focus:outline-none text-left flex items-center justify-between transition-all";

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative w-full max-w-[340px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-[14px] font-bold text-gray-700 tracking-tight">Filters</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-all">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* User Search */}
                    {showUserFilter && (
                        <div className="space-y-1">
                            <label className="text-[12px] font-[600] text-gray-400">Search User</label>
                            <UserFilter
                                onUserSelect={(id) => setLocalFilters({ ...localFilters, selectedUserId: id })}
                                clearTrigger={clearUserTrigger}
                                containerClassName="w-full"
                            />
                        </div>
                    )}

                    {/* Search Type (AWB / Order ID) */}
                    <div className="space-y-1" ref={searchTypeRef}>
                        <label className="text-[12px] font-[600] text-gray-400">Search Type</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowSearchTypeDropdown(!showSearchTypeDropdown)}
                                className={`${fieldStyle} border-gray-300 bg-white`}
                            >
                                <span className="text-gray-400">{localFilters.searchType === "awbNumber" ? "AWB Number" : "Order ID"}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showSearchTypeDropdown ? "rotate-180" : ""}`} />
                            </button>
                            {showSearchTypeDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1 animate-popup-in">
                                    {[
                                        { label: "AWB Number", value: "awbNumber" },
                                        { label: "Order ID", value: "orderId" }
                                    ].map((opt) => (
                                        <div
                                            key={opt.value}
                                            onClick={() => { setLocalFilters({ ...localFilters, searchType: opt.value }); setShowSearchTypeDropdown(false); }}
                                            className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                        >
                                            {opt.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="space-y-1">
                        <label className="text-[12px] font-[600] text-gray-400">Search {localFilters.searchType === "awbNumber" ? "AWB" : "Order ID"}</label>
                        <input
                            type="text"
                            placeholder={`Enter ${localFilters.searchType === "awbNumber" ? "AWB" : "Order ID"}`}
                            className={`${fieldStyle} bg-white border border-gray-300 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0CBB7D]`}
                            value={localFilters.searchInput}
                            onChange={(e) => setLocalFilters({ ...localFilters, searchInput: e.target.value })}
                        />
                    </div>

                    {/* Courier Filter */}
                    <div className="space-y-1">
                        <label className="text-[12px] font-[600] text-gray-400">Courier</label>
                        <CourierFilter
                            selectedCourier={localFilters.selectedCourier}
                            setSelectedCourier={(c) => setLocalFilters({ ...localFilters, selectedCourier: c })}
                            courierOptions={courierOptions}
                            showDropdown={showCourierDropdown}
                            setShowDropdown={setShowCourierDropdown}
                            dropdownRef={courierRef}
                            heightClass="h-9"
                            width="w-full"
                        />
                    </div>

                    {/* Status Dropdown */}
                    <div className="space-y-1" ref={statusRef}>
                        <label className="text-[12px] font-[600] text-gray-400">Status</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                className={`${fieldStyle} ${showStatusDropdown ? "border-[#0CBB7D]" : "border-gray-300"} bg-white`}
                            >
                                <span className={localFilters.status ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                    {localFilters.status || "Select Status"}
                                </span>
                                <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showStatusDropdown ? "rotate-180" : ""} `} />
                            </button>
                            {showStatusDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1 animate-popup-in max-h-40 overflow-y-auto">
                                    {statusOptions.map((s) => (
                                        <div
                                            key={s}
                                            onClick={() => { setLocalFilters({ ...localFilters, status: s }); setShowStatusDropdown(false); }}
                                            className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                        >
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Type */}
                    {showPaymentType && (
                        <div className="space-y-1" ref={paymentRef}>
                            <label className="text-[12px] font-[600] text-gray-400">Payment Type</label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                                    className={`${fieldStyle} border-gray-300 bg-white`}
                                >
                                    <span className={localFilters.paymentType ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                        {localFilters.paymentType || "Select Payment"}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showPaymentDropdown ? "rotate-180" : ""}`} />
                                </button>
                                {showPaymentDropdown && (
                                    <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1 animate-popup-in">
                                        {["COD", "Prepaid", "All"].map((opt) => (
                                            <div
                                                key={opt}
                                                onClick={() => { setLocalFilters({ ...localFilters, paymentType: opt }); setShowPaymentDropdown(false); }}
                                                className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                            >
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    
                </div>

                {/* Footer Buttons */}
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

export default ShippingFilterPanel;
