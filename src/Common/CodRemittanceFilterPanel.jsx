import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import UserFilter from "../filter/UserFilter";

const CodRemittanceFilterPanel = ({
    isOpen,
    onClose,
    selectedUserId: initialSelectedUserId,
    remittanceId: initialRemittanceId,
    utr: initialUtr,
    status: initialStatus,
    onClearFilters,
    onApplyFilters,
    showUserFilter = true,
}) => {
    const [localFilters, setLocalFilters] = useState({
        selectedUserId: null,
        remittanceId: "",
        utr: "",
        status: ""
    });

    const statusRef = useRef(null);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [clearUserTrigger, setClearUserTrigger] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters({
                selectedUserId: initialSelectedUserId || null,
                remittanceId: initialRemittanceId || "",
                utr: initialUtr || "",
                status: initialStatus || ""
            });
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isOpen, initialSelectedUserId, initialRemittanceId, initialUtr, initialStatus]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusRef.current && !statusRef.current.contains(event.target)) setShowStatusDropdown(false);
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
            remittanceId: "",
            utr: "",
            status: ""
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

                    {/* Remittance ID */}
                    <div className="space-y-1">
                        <label className="text-[12px] font-[600] text-gray-400">Remittance ID</label>
                        <input
                            type="text"
                            placeholder="Enter Remittance ID"
                            className={`${fieldStyle} bg-white border border-gray-300 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0CBB7D]`}
                            value={localFilters.remittanceId}
                            onChange={(e) => setLocalFilters({ ...localFilters, remittanceId: e.target.value })}
                        />
                    </div>

                    {/* UTR */}
                    <div className="space-y-1">
                        <label className="text-[12px] font-[600] text-gray-400">UTR</label>
                        <input
                            type="text"
                            placeholder="Enter UTR"
                            className={`${fieldStyle} bg-white border border-gray-300 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0CBB7D]`}
                            value={localFilters.utr}
                            onChange={(e) => setLocalFilters({ ...localFilters, utr: e.target.value })}
                        />
                    </div>

                    {/* Status Dropdown */}
                    <div className="space-y-1" ref={statusRef}>
                        <label className="text-[12px] font-[600] text-gray-400 tracking-wider">Status</label>
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
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1 animate-popup-in">
                                    {["Paid", "Pending"].map((s) => (
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

export default CodRemittanceFilterPanel;
