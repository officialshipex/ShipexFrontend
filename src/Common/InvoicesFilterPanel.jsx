import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import UserFilter from "../filter/UserFilter";

const InvoicesFilterPanel = ({
    isOpen,
    onClose,
    selectedUserId: initialSelectedUserId,
    invoiceNumber: initialInvoiceNumber,
    month: initialMonth,
    year: initialYear,
    onClearFilters,
    onApplyFilters,
    MONTHS,
    years,
    showUserFilter = true,
}) => {
    const [localFilters, setLocalFilters] = useState({
        selectedUserId: null,
        month: "",
        year: ""
    });

    const monthRef = useRef(null);
    const yearRef = useRef(null);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [clearUserTrigger, setClearUserTrigger] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters({
                selectedUserId: initialSelectedUserId || null,
                month: initialMonth || "",
                year: initialYear || ""
            });
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isOpen, initialSelectedUserId, initialInvoiceNumber, initialMonth, initialYear]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (monthRef.current && !monthRef.current.contains(event.target)) setShowMonthDropdown(false);
            if (yearRef.current && !yearRef.current.contains(event.target)) setShowYearDropdown(false);
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
            month: "",
            year: ""
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

                    {/* Month Dropdown */}
                    <div className="space-y-1" ref={monthRef}>
                        <label className="text-[12px] font-[600] text-gray-400 tracking-wider">Month</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                                className={`${fieldStyle} ${showMonthDropdown ? "border-[#0CBB7D]" : "border-gray-300"} bg-white`}
                            >
                                <span className={localFilters.month ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                    {localFilters.month ? MONTHS.find(m => m.value === localFilters.month)?.label : "Select Month"}
                                </span>
                                <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showMonthDropdown ? "rotate-180" : ""} `} />
                            </button>
                            {showMonthDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1 animate-popup-in max-h-60 overflow-y-auto">
                                    {MONTHS.map((m) => (
                                        <div
                                            key={m.value}
                                            onClick={() => { setLocalFilters({ ...localFilters, month: m.value }); setShowMonthDropdown(false); }}
                                            className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                        >
                                            {m.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Year Dropdown */}
                    <div className="space-y-1" ref={yearRef}>
                        <label className="text-[12px] font-[600] text-gray-400 tracking-wider">Year</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowYearDropdown(!showYearDropdown)}
                                className={`${fieldStyle} ${showYearDropdown ? "border-[#0CBB7D]" : "border-gray-300"} bg-white`}
                            >
                                <span className={localFilters.year ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                    {localFilters.year || "Select Year"}
                                </span>
                                <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showYearDropdown ? "rotate-180" : ""} `} />
                            </button>
                            {showYearDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1 animate-popup-in max-h-40 overflow-y-auto">
                                    {years.map((y) => (
                                        <div
                                            key={y}
                                            onClick={() => { setLocalFilters({ ...localFilters, year: y }); setShowYearDropdown(false); }}
                                            className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                        >
                                            {y}
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

export default InvoicesFilterPanel;
