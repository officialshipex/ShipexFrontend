import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import UserFilter from "../filter/UserFilter";

const UserFilterPanel = ({
    isOpen,
    onClose,
    selectedUserId: initialSelectedUserId,
    userId: initialUserId,
    kycStatus: initialKycStatus,
    rateCard: initialRateCard,
    wallet: initialWallet,
    onClearFilters,
    onApplyFilters,
    showUserFilter =false,
}) => {
    const [localFilters, setLocalFilters] = useState({
        selectedUserId: null,
        userId: "",
        kycStatus: "",
        rateCard: "",
        wallet: ""
    });

    const kycRef = useRef(null);
    const rateCardRef = useRef(null);
    const walletRef = useRef(null);

    const [showKycDropdown, setShowKycDropdown] = useState(false);
    const [showRateCardDropdown, setShowRateCardDropdown] = useState(false);
    const [showWalletDropdown, setShowWalletDropdown] = useState(false);
    const [clearUserTrigger, setClearUserTrigger] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters({
                selectedUserId: initialSelectedUserId || null,
                userId: initialUserId || "",
                kycStatus: initialKycStatus || "",
                rateCard: initialRateCard || "",
                wallet: initialWallet || ""
            });
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isOpen, initialSelectedUserId, initialUserId, initialKycStatus, initialRateCard, initialWallet]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (kycRef.current && !kycRef.current.contains(event.target)) setShowKycDropdown(false);
            if (rateCardRef.current && !rateCardRef.current.contains(event.target)) setShowRateCardDropdown(false);
            if (walletRef.current && !walletRef.current.contains(event.target)) setShowWalletDropdown(false);
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
            userId: "",
            kycStatus: "",
            rateCard: "",
            wallet: ""
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
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <h2 className="text-[14px] font-bold text-gray-700 tracking-tight">User Filters</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-all">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {showUserFilter && (
                        <div className="space-y-1">
                            <label className="text-[12px] font-[600] text-gray-700">Search User</label>
                            <UserFilter
                                onUserSelect={(id) => setLocalFilters({ ...localFilters, selectedUserId: id })}
                                clearTrigger={clearUserTrigger}
                                containerClassName="w-full"
                            />
                        </div>
                    )}

                    {/* User ID */}
                    <div className="space-y-1">
                        <label className="text-[12px] font-[600] text-gray-700">User ID</label>
                        <input
                            type="text"
                            placeholder="Enter User ID"
                            className={`${fieldStyle} bg-white border border-gray-300 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0CBB7D]`}
                            value={localFilters.userId}
                            onChange={(e) => setLocalFilters({ ...localFilters, userId: e.target.value })}
                        />
                    </div>

                    {/* KYC Status */}
                    <div className="space-y-1" ref={kycRef}>
                        <label className="text-[12px] font-[600] text-gray-700 tracking-wider">KYC Status</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowKycDropdown(!showKycDropdown)}
                                className={`${fieldStyle} ${showKycDropdown ? "border-[#0CBB7D]" : "border-gray-300"} bg-white`}
                            >
                                <span className={localFilters.kycStatus ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                    {localFilters.kycStatus ? localFilters.kycStatus.charAt(0).toUpperCase() + localFilters.kycStatus.slice(1) : "Select KYC Status"}
                                </span>
                                <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showKycDropdown ? "rotate-180" : ""} `} />
                            </button>
                            {showKycDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-10 py-1 animate-popup-in">
                                    {["verified", "pending"].map((status) => (
                                        <div
                                            key={status}
                                            onClick={() => { setLocalFilters({ ...localFilters, kycStatus: status }); setShowKycDropdown(false); }}
                                            className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                        >
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rate Card */}
                    <div className="space-y-1" ref={rateCardRef}>
                        <label className="text-[12px] font-[600] text-gray-700 tracking-wider">Rate Card</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowRateCardDropdown(!showRateCardDropdown)}
                                className={`${fieldStyle} ${showRateCardDropdown ? "border-[#0CBB7D]" : "border-gray-300"} bg-white`}
                            >
                                <span className={localFilters.rateCard ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                    {localFilters.rateCard ? localFilters.rateCard.charAt(0).toUpperCase() + localFilters.rateCard.slice(1) : "Select Rate Card"}
                                </span>
                                <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showRateCardDropdown ? "rotate-180" : ""} `} />
                            </button>
                            {showRateCardDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-10 py-1 animate-popup-in">
                                    {["bronze", "silver", "gold", "platinum"].map((card) => (
                                        <div
                                            key={card}
                                            onClick={() => { setLocalFilters({ ...localFilters, rateCard: card }); setShowRateCardDropdown(false); }}
                                            className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                        >
                                            {card.charAt(0).toUpperCase() + card.slice(1)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Wallet */}
                    <div className="space-y-1" ref={walletRef}>
                        <label className="text-[12px] font-[600] text-gray-700 tracking-wider">Wallet Balance</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                                className={`${fieldStyle} ${showWalletDropdown ? "border-[#0CBB7D]" : "border-gray-300"} bg-white`}
                            >
                                <span className={localFilters.wallet ? "text-gray-700 font-[600]" : "text-gray-400"}>
                                    {localFilters.wallet ? localFilters.wallet.charAt(0).toUpperCase() + localFilters.wallet.slice(1) : "Select Wallet Status"}
                                </span>
                                <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showWalletDropdown ? "rotate-180" : ""} `} />
                            </button>
                            {showWalletDropdown && (
                                <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-10 py-1 animate-popup-in">
                                    {["positive", "negative"].map((type) => (
                                        <div
                                            key={type}
                                            onClick={() => { setLocalFilters({ ...localFilters, wallet: type }); setShowWalletDropdown(false); }}
                                            className="px-3 py-2 text-[12px] font-[600] text-gray-500 hover:bg-green-50 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
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

export default UserFilterPanel;
