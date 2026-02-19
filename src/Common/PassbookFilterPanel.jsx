import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import UserFilter from "../filter/UserFilter";

const PassbookFilterPanel = ({
    isOpen,
    onClose,
    selectedUserId: initialSelectedUserId,
    awbNumber: initialAwbNumber,
    orderId: initialOrderId,
    category: initialCategory,
    description: initialDescription,
    onClearFilters,
    onApplyFilters,
    showUserFilter = true,
}) => {
    const [localFilters, setLocalFilters] = useState({
        selectedUserId: null,
        searchUser: "",
        awbNumber: "",
        orderId: "",
        category: "",
        description: ""
    });

    const categoryRef = useRef(null);
    const descriptionRef = useRef(null);

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showDescriptionDropdown, setShowDescriptionDropdown] = useState(false);
    const [clearUserTrigger, setClearUserTrigger] = useState(false);

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        if (isOpen) {
            setLocalFilters({
                selectedUserId: initialSelectedUserId || null,
                searchUser: initialSelectedUserId ? "Selected User" : "",
                awbNumber: initialAwbNumber || "",
                orderId: initialOrderId || "",
                category: initialCategory || "",
                description: initialDescription || ""
            });
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isOpen, initialSelectedUserId, initialAwbNumber, initialOrderId, initialCategory, initialDescription]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target)) setShowCategoryDropdown(false);
            if (descriptionRef.current && !descriptionRef.current.contains(event.target)) setShowDescriptionDropdown(false);
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
            searchUser: "",
            awbNumber: "",
            orderId: "",
            category: "",
            description: ""
        };
        setLocalFilters(cleared);
        setClearUserTrigger(prev => !prev);
        onClearFilters();
    };

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
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
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

                    {/* Order ID */}
                    <div className="space-y-1">
                        <label className="text-[12px] font-[600] text-gray-400">Order ID</label>
                        <input
                            type="text"
                            placeholder="Enter Order ID"
                            className={`${fieldStyle} bg-white border border-gray-300 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0CBB7D]`}
                            value={localFilters.orderId}
                            onChange={(e) => setLocalFilters({ ...localFilters, orderId: e.target.value })}
                        />
                    </div>

                    {/* AWB Number */}
                    <div className="space-y-1">
                        <label className="text-[12px] font-[600] text-gray-400">AWB Number</label>
                        <input
                            type="text"
                            placeholder="Enter AWB Number"
                            className={`${fieldStyle} bg-white border border-gray-300 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0CBB7D]`}
                            value={localFilters.awbNumber}
                            onChange={(e) => setLocalFilters({ ...localFilters, awbNumber: e.target.value })}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-1" ref={categoryRef}>
                        <label className="text-[12px] font-[600] text-gray-400 tracking-wider">Category</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className={`${fieldStyle} ${showCategoryDropdown ? "border-[#0CBB7D]" : "border-gray-300"} bg-white`}
                            >
                                <span className={localFilters.category ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                    {localFilters.category ? localFilters.category.charAt(0).toUpperCase() + localFilters.category.slice(1) : "Select Category"}
                                </span>
                                <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showCategoryDropdown ? "rotate-180" : ""} `} />
                            </button>
                            {showCategoryDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-10 py-1 animate-popup-in">
                                    {["credit", "debit"].map((cat) => (
                                        <div
                                            key={cat}
                                            onClick={() => { setLocalFilters({ ...localFilters, category: cat }); setShowCategoryDropdown(false); }}
                                            className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                        >
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1" ref={descriptionRef}>
                        <label className="text-[12px] font-[600] text-gray-400 tracking-wider">Description</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowDescriptionDropdown(!showDescriptionDropdown)}
                                className={`${fieldStyle} ${showDescriptionDropdown ? "border-[#0CBB7D]" : "border-gray-300"} bg-white`}
                            >
                                <span className={`truncate ${localFilters.description ? "text-gray-700 font-[600]" : "text-gray-400"}`}>
                                    {localFilters.description || "Select Description"}
                                </span>
                                <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showDescriptionDropdown ? "rotate-180" : ""} `} />
                            </button>
                            {showDescriptionDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-10 py-1 animate-popup-in max-h-60 overflow-y-auto">
                                    {[
                                        "Freight Charges Applied", "Freight Charges Received", "Auto-accepted Weight Dispute charge",
                                        "Weight Dispute Charges Applied", "COD Charges Received", "RTO Freight Charges Applied"
                                    ].map((desc) => (
                                        <div
                                            key={desc}
                                            onClick={() => { setLocalFilters({ ...localFilters, description: desc }); setShowDescriptionDropdown(false); }}
                                            className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                        >
                                            {desc}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
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

export default PassbookFilterPanel;
