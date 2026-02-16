import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { FaFilter, FaBars } from "react-icons/fa";
import UserFilter from "./UserFilter";
import DateFilter from "./DateFilter";
import OrderAwbFilter from "./OrderAwbFilter";

const ProviderFilter = ({ provider, setProvider }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full sm:w-[120px]" ref={containerRef}>
            <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="sm:w-[120px] w-full h-9 px-3 border text-gray-400 rounded-lg text-left text-[12px] bg-white font-[600] flex justify-between items-center"
                type="button"
            >
                <span>{provider || "Provider"}</span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                />
            </button>
            {showDropdown && (
                <ul className="absolute sm:w-[120px] z-[60] w-full mt-1 bg-white border rounded-lg text-gray-500 font-[600] overflow-y-auto text-[12px] max-h-60 shadow-lg">
                    {["Delhivery", "DTDC", "EcomExpress", "Amazon"].map((s) => (
                        <li
                            key={s}
                            className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${provider === s ? "bg-gray-100 font-medium" : ""}`}
                            onClick={() => {
                                setProvider(s);
                                setShowDropdown(false);
                            }}
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const StatusFilter = ({ status, setStatus }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="sm:w-[120px] w-full h-9 px-3 border text-gray-400 rounded-lg text-left text-[12px] bg-white font-[600] flex justify-between items-center"
                type="button"
            >
                <span>{status || "Status"}</span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                />
            </button>
            {showDropdown && (
                <ul className="absolute sm:w-[120px] z-[60] w-full mt-1 bg-white border rounded-lg text-gray-500 font-[600] overflow-y-auto text-[12px] max-h-60 shadow-lg">
                    {["pending", "Accepted", "Discrepancy Raised"].map((s) => (
                        <li
                            key={s}
                            className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${status === s ? "bg-gray-100 font-medium" : ""}`}
                            onClick={() => {
                                setStatus(s);
                                setShowDropdown(false);
                            }}
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const DiscrepancyFilter = ({
    selectedUserId,
    setSelectedUserId,
    dateRange,
    setDateRange,
    searchBy,
    setSearchBy,
    inputValue,
    setInputValue,
    provider,
    setProvider,
    status,
    setStatus,
    showStatus = false,
    showUserFilter = true,
    clearTrigger,
    setClearTrigger,
    setPage,
    handleExport,
    selectedDispute,
    customActions = [] // Array of { label, onClick }
}) => {
    const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
    const actionDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target)) {
                setActionDropdownOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const [showAwbDropdownDesktop, setShowAwbDropdownDesktop] = useState(false);
    const [showAwbDropdownMobile, setShowAwbDropdownMobile] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const awbFilterRefDesktop = useRef(null);
    const awbFilterButtonRefDesktop = useRef(null);
    const awbFilterRefMobile = useRef(null);
    const awbFilterButtonRefMobile = useRef(null);

    const handleClearFilters = () => {
        setClearTrigger(!clearTrigger);
        if (showUserFilter && setSelectedUserId) setSelectedUserId(null);
        setInputValue("");
        setSearchBy("awbNumber");
        setDateRange(null);
        setProvider("");
        if (showStatus) setStatus("");
        setPage(1);
    };

    return (
        <div className="w-full">
            {/* Desktop Filter Section */}
            <div className="hidden sm:flex flex-col gap-2 mb-2 relative">
                <div className="flex gap-2 items-center">
                    {showUserFilter && (
                        <UserFilter
                            onUserSelect={(id) => {
                                setSelectedUserId(id);
                                setPage(1);
                            }}
                            clearTrigger={clearTrigger}
                        />
                    )}

                    <OrderAwbFilter
                        searchBy={searchBy}
                        setSearchBy={setSearchBy}
                        inputValue={inputValue}
                        setInputValue={setInputValue}
                        showDropdown={showAwbDropdownDesktop}
                        setShowDropdown={setShowAwbDropdownDesktop}
                        dropdownRef={awbFilterRefDesktop}
                        buttonRef={awbFilterButtonRefDesktop}
                        options={[
                            { label: "AWB", value: "awbNumber" },
                            { label: "Order ID", value: "orderId" },
                        ]}
                        getPlaceholder={() =>
                            searchBy === "orderId"
                                ? "Search by Order ID"
                                : "Search by AWB Number"
                        }
                        width="w-full md:w-[300px]"
                    />
                    <ProviderFilter provider={provider} setProvider={setProvider} />
                    {showStatus && <StatusFilter status={status} setStatus={setStatus} />}
                    <DateFilter
                        onDateChange={(range) => {
                            setDateRange(range);
                            setPage(1);
                        }}
                        clearTrigger={clearTrigger}
                    />

                    <div className="flex gap-2 ml-auto">
                        <div ref={actionDropdownRef} className="relative">
                            <button
                                className={`px-3 h-9 border rounded-lg font-[600] flex items-center gap-1 transition-all ${selectedDispute.length === 0
                                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                    : "text-[#0CBB7D] border-[#0CBB7D]"
                                    } text-[12px]`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    selectedDispute.length > 0 && setActionDropdownOpen(!actionDropdownOpen)
                                }}
                                disabled={selectedDispute.length === 0}
                            >
                                <span>Actions</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${actionDropdownOpen ? "rotate-180" : ""}`} />
                            </button>
                            {actionDropdownOpen && (
                                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-[100]">
                                    <ul className="font-[600] py-1">
                                        <li
                                            className="px-3 py-2 text-gray-700 hover:bg-green-100 cursor-pointer text-[12px]"
                                            onClick={(e) => {
                                                handleExport();
                                                setActionDropdownOpen(false);
                                            }}
                                        >
                                            Export
                                        </li>
                                        {customActions.map((action, idx) => (
                                            <li
                                                key={idx}
                                                className="px-3 py-2 text-gray-700 hover:bg-green-100 cursor-pointer text-[12px]"
                                                onClick={(e) => {
                                                    action.onClick();
                                                    setActionDropdownOpen(false);
                                                }}
                                            >
                                                {action.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleClearFilters}
                            className="py-2 px-4 border rounded-lg bg-[#0CBB7D] text-[12px] font-[600] text-white hover:opacity-90 transition"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Filter Section */}
            <div className="flex w-full flex-col sm:hidden mb-2">
                <div className="flex items-center justify-between gap-2 relative">
                    <OrderAwbFilter
                        searchBy={searchBy}
                        setSearchBy={setSearchBy}
                        inputValue={inputValue}
                        setInputValue={setInputValue}
                        showDropdown={showAwbDropdownMobile}
                        setShowDropdown={setShowAwbDropdownMobile}
                        dropdownRef={awbFilterRefMobile}
                        buttonRef={awbFilterButtonRefMobile}
                        options={[
                            { label: "AWB", value: "awbNumber" },
                            { label: "Order ID", value: "orderId" },
                        ]}
                        getPlaceholder={() =>
                            searchBy === "orderId"
                                ? "Search by Order ID"
                                : "Search by AWB Number"
                        }
                        heightClass="h-9"
                    />

                    <button
                        className="px-3 flex items-center justify-center text-white bg-[#0CBB7D] h-9 rounded-lg transition text-[12px] font-[600]"
                        onClick={() => setShowMobileFilters((prev) => !prev)}
                    >
                        <FaFilter className="text-white" size={14} />
                    </button>

                    <div ref={actionDropdownRef} className="relative">
                        <button
                            className={`px-3 h-9 border rounded-lg font-[600] flex items-center gap-1 ${selectedDispute.length === 0
                                ? "border-gray-300 text-[12px] cursor-not-allowed text-gray-400"
                                : "text-[#0CBB7D] border-[#0CBB7D] text-[12px]"
                                }`}
                            onClick={() =>
                                selectedDispute.length > 0 &&
                                setActionDropdownOpen(!actionDropdownOpen)
                            }
                            disabled={selectedDispute.length === 0}
                        >
                            <FaBars className={selectedDispute.length === 0 ? "text-gray-400" : "text-[#0CBB7D]"} />
                        </button>
                        {actionDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                                <ul className="py-2 font-[600]">
                                    <li
                                        className="px-3 py-2 text-gray-700 hover:bg-green-100 cursor-pointer text-[12px]"
                                        onClick={(e) => {
                                            handleExport();
                                            setActionDropdownOpen(false);
                                        }}
                                    >
                                        Export
                                    </li>
                                    {customActions.map((action, idx) => (
                                        <li
                                            key={idx}
                                            className="px-3 py-2 text-gray-700 hover:bg-green-100 cursor-pointer text-[12px]"
                                            onClick={(e) => {
                                                action.onClick();
                                                setActionDropdownOpen(false);
                                            }}
                                        >
                                            {action.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`transition-all duration-300 ease-in-out ${showMobileFilters ? "max-h-[1000px] mt-2" : "max-h-0 overflow-hidden"}`}>
                    <div className="flex flex-col gap-2">
                        {showUserFilter && (
                            <UserFilter
                                onUserSelect={(id) => {
                                    setSelectedUserId(id);
                                    setPage(1);
                                }}
                                clearTrigger={clearTrigger}
                            />
                        )}
                        <DateFilter
                            onDateChange={(range) => {
                                setDateRange(range);
                                setPage(1);
                            }}
                            clearTrigger={clearTrigger}
                        />
                        <div className="flex gap-2">
                            <ProviderFilter provider={provider} setProvider={setProvider} />
                            {showStatus && <StatusFilter status={status} setStatus={setStatus} />}
                        </div>
                        <button
                            className="w-full bg-[#0CBB7D] py-2 text-[12px] font-[600] rounded-lg text-white border hover:opacity-90 transition"
                            onClick={handleClearFilters}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscrepancyFilter;
