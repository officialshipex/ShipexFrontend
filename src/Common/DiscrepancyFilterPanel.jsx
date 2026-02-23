import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";

const DiscrepancyFilterPanel = ({
    isOpen,
    onClose,
    searchInput: initialSearchInput,
    searchType: initialSearchType,
    selectedCourier: initialSelectedCourier,
    courierOptions = [],
    status: initialStatus,
    showStatus = false,
    onClearFilters,
    onApplyFilters,
    children,
}) => {
    const [localFilters, setLocalFilters] = useState({
        searchInput: "",
        searchType: "awbNumber",
        selectedCourier: [],
        status: "",
    });

    const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);
    const [showCourierDropdown, setShowCourierDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const searchTypeRef = useRef(null);
    const courierRef = useRef(null);
    const statusRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters({
                searchInput: initialSearchInput || "",
                searchType: initialSearchType || "awbNumber",
                selectedCourier: Array.isArray(initialSelectedCourier)
                    ? initialSelectedCourier
                    : initialSelectedCourier
                        ? [initialSelectedCourier]
                        : [],
                status: initialStatus || "",
            });
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isOpen, initialSearchInput, initialSearchType, initialSelectedCourier, initialStatus]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchTypeRef.current && !searchTypeRef.current.contains(event.target))
                setShowSearchTypeDropdown(false);
            if (courierRef.current && !courierRef.current.contains(event.target))
                setShowCourierDropdown(false);
            if (statusRef.current && !statusRef.current.contains(event.target))
                setShowStatusDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const handleApply = () => {
        onApplyFilters(localFilters);
    };

    const handleClear = () => {
        const cleared = { searchInput: "", searchType: "awbNumber", selectedCourier: [], status: "" };
        setLocalFilters(cleared);
        onClearFilters();
    };

    const handleToggleCourier = (courier) => {
        const current = localFilters.selectedCourier;
        if (current.includes(courier)) {
            setLocalFilters({ ...localFilters, selectedCourier: current.filter((c) => c !== courier) });
        } else {
            setLocalFilters({ ...localFilters, selectedCourier: [...current, courier] });
        }
    };

    const fieldStyle =
        "w-full h-[36px] px-3 text-[12px] font-[600] border rounded-lg focus:outline-none text-left flex items-center justify-between transition-all";

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-[340px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <h2 className="text-[14px] font-bold text-gray-700 tracking-tight">
                        Filters
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Children Filter (e.g., UserFilter) */}
                    {children && (
                        <div className="space-y-1">
                            {children}
                        </div>
                    )}
                    {/* Search Type */}
                    <div className="space-y-1" ref={searchTypeRef}>
                        <label className="text-[12px] font-[600] text-gray-700">
                            Search Type
                        </label>
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setShowSearchTypeDropdown(!showSearchTypeDropdown)
                                }
                                className={`${fieldStyle} border ${showSearchTypeDropdown
                                    ? "border-[#0CBB7D]"
                                    : "border-gray-300"
                                    } bg-white`}
                            >
                                <span className="text-gray-400">
                                    {localFilters.searchType === "awbNumber"
                                        ? "AWB Number"
                                        : "Order ID"}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${showSearchTypeDropdown ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            {showSearchTypeDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1 animate-popup-in">
                                    {[
                                        { label: "AWB Number", value: "awbNumber" },
                                        { label: "Order ID", value: "orderId" },
                                    ].map((opt) => (
                                        <div
                                            key={opt.value}
                                            onClick={() => {
                                                setLocalFilters({
                                                    ...localFilters,
                                                    searchType: opt.value,
                                                });
                                                setShowSearchTypeDropdown(false);
                                            }}
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
                        <label className="text-[12px] font-[600] text-gray-700">
                            Search{" "}
                            {localFilters.searchType === "awbNumber"
                                ? "AWB Number"
                                : "Order ID"}
                        </label>
                        <input
                            type="text"
                            placeholder={`Enter ${localFilters.searchType === "awbNumber"
                                ? "AWB Number"
                                : "Order ID"
                                }`}
                            className={`${fieldStyle} bg-white border border-gray-300 text-gray-700 placeholder:text-gray-400 focus:border-[#0CBB7D]`}
                            value={localFilters.searchInput}
                            onChange={(e) =>
                                setLocalFilters({
                                    ...localFilters,
                                    searchInput: e.target.value,
                                })
                            }
                        />
                    </div>

                    {/* Courier Service Name Filter */}
                    <div className="space-y-1" ref={courierRef}>
                        <label className="text-[12px] font-[600] text-gray-700">
                            Courier Service
                        </label>
                        <div className="relative">
                            <button
                                onClick={() => setShowCourierDropdown(!showCourierDropdown)}
                                className={`${fieldStyle} border ${showCourierDropdown
                                    ? "border-[#0CBB7D]"
                                    : "border-gray-300"
                                    } bg-white`}
                            >
                                <span
                                    className={
                                        localFilters.selectedCourier.length > 0
                                            ? "text-gray-700 font-[600]"
                                            : "text-gray-400"
                                    }
                                >
                                    {localFilters.selectedCourier.length > 0
                                        ? `${localFilters.selectedCourier.length} Selected`
                                        : "Select Courier Service"}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${showCourierDropdown ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            {showCourierDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1 animate-popup-in max-h-56 overflow-y-auto">
                                    {courierOptions.length > 0 ? (
                                        courierOptions.map((courier) => {
                                            const isSelected = localFilters.selectedCourier.includes(courier);
                                            return (
                                                <div
                                                    key={courier}
                                                    onClick={() => handleToggleCourier(courier)}
                                                    className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors flex items-center gap-2"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        readOnly
                                                        className="accent-[#0CBB7D] w-3 h-3"
                                                    />
                                                    <span>{courier}</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="px-3 py-3 text-[12px] text-gray-400 text-center">
                                            No courier services available
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Filter */}
                    {showStatus && (
                        <div className="space-y-1" ref={statusRef}>
                            <label className="text-[12px] font-[600] text-gray-700">
                                Status
                            </label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    className={`${fieldStyle} border ${showStatusDropdown
                                        ? "border-[#0CBB7D]"
                                        : "border-gray-300"
                                        } bg-white`}
                                >
                                    <span className={localFilters.status ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                        {localFilters.status || "All Status"}
                                    </span>
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform ${showStatusDropdown ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>
                                {showStatusDropdown && (
                                    <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1 animate-popup-in">
                                        {[
                                            { label: "All Status", value: "" },
                                            { label: "New", value: "new" },
                                            { label: "Accepted", value: "Accepted" },
                                            { label: "Discrepancy Raised", value: "Discrepancy Raised" },
                                            { label: "Discrepancy Declined", value: "Discrepancy Declined" },
                                        ].map((opt) => (
                                            <div
                                                key={opt.value}
                                                onClick={() => {
                                                    setLocalFilters({
                                                        ...localFilters,
                                                        status: opt.value,
                                                    });
                                                    setShowStatusDropdown(false);
                                                }}
                                                className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                            >
                                                {opt.label}
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

export default DiscrepancyFilterPanel;
