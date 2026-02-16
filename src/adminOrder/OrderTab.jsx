import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Orders from "./NewOrder";
import BookedOrders from "./BookedOrders";
import ReadyToShipOrders from "./ReadyToShipOrders";
import InTransitOrders from "./InTransitOrders";
import DeliveredOrders from "./DeliveredOrders";
import CancelledOrder from "./CancelledOrders";
import AllOrder from "./AllOrders";
import axios from "axios";
import PickupManifestOrders from "./PickupManifestOrders";
import { ChevronDown } from "lucide-react";
import EmployeeAuthModal from "../employeeAuth/EmployeeAuthModal";
import RTO from "./RTO"
import OutForDelivery from "./OutForDeliveryOrders";
import RTOIntransit from "./RTOIntransit";
import RTODelivered from "./RTODelivered";
import RTOLost from "./RTOLost";
import RTODamaged from "./RTODamaged";
import Lost from "./Lost";
import Damaged from "./Damaged";
import Cookies from "js-cookie";

const OrderTab = ({ isSidebarAdmin }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMoreTabs, setShowMoreTabs] = useState(false);
    const desktopDropdownRef = useRef(null);
    const mobileDropdownRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    const [refresh, setRefresh] = useState(false);
    const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
    const [employeeAccess, setEmployeeAccess] = useState({ isAdmin: false, canView: false });

    const tabStorageKey = "activeOrderTab";

    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem(tabStorageKey) || "New";
    });

    const params = new URLSearchParams(location.search);
    const userId = params.get("userId");

    useEffect(() => {
        localStorage.setItem(tabStorageKey, activeTab);
    }, [activeTab]);

    const tabs = [
        "New",
        "Booked",
        "Pickup & Manifest",
        "Ready to Ship",
        "In Transit",
        "Out for Delivery",
        "Delivered",
    ];

    const moreTabs = ["Cancelled", "Lost", "Damaged", "RTO Initiated", "RTO In Transit", "RTO Delivered", "RTO Lost", "RTO Damaged", "All"];
    const allTabs = [...tabs, ...moreTabs];

    useEffect(() => {
        function handleClickOutside(event) {
            if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target)) {
                setShowMoreTabs(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                if (isSidebarAdmin) {
                    setEmployeeAccess({ isAdmin: true, canView: true });
                    setShowEmployeeAuthModal(false);
                } else {
                    const token = Cookies.get("session");
                    if (!token) {
                        setShowEmployeeAuthModal(true);
                        return;
                    }
                    const employeeResponse = await axios.get(
                        `${REACT_APP_BACKEND_URL}/staffRole/verify`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const employeeInfo = employeeResponse.data.employee;
                    const canView = !!employeeInfo?.accessRights?.orders?.['All Orders']?.view;
                    setEmployeeAccess({ canView });

                    if (!canView) {
                        setShowEmployeeAuthModal(true);
                    }
                }
            } catch (error) {
                console.error("Error verifying access:", error);
                setShowEmployeeAuthModal(true);
            }
        };
        checkAccess();
    }, [isSidebarAdmin]);

    const renderTabContent = () => {
        switch (activeTab) {
            case "New": return <Orders userId={userId} />;
            case "Booked": return <BookedOrders userId={userId} />;
            case "Ready to Ship": return <ReadyToShipOrders userId={userId} />;
            case "Pickup & Manifest": return <PickupManifestOrders userId={userId} />;
            case "In Transit": return <InTransitOrders userId={userId} />;
            case "Out for Delivery": return <OutForDelivery userId={userId} />;
            case "Delivered": return <DeliveredOrders userId={userId} />;
            case "Cancelled": return <CancelledOrder userId={userId} />;
            case "RTO Initiated": return <RTO userId={userId} />;
            case "RTO In Transit": return <RTOIntransit userId={userId} />;
            case "RTO Delivered": return <RTODelivered userId={userId} />;
            case "RTO Lost": return <RTOLost userId={userId} />;
            case "RTO Damaged": return <RTODamaged userId={userId} />;
            case "Lost": return <Lost userId={userId} />;
            case "Damaged": return <Damaged userId={userId} />;
            case "All": return <AllOrder userId={userId} />;
            default: return <div className="p-4 text-center text-gray-500">Select a tab to view orders.</div>;
        }
    };

    return (
        <div className="md:px-2 px-1">
            <div className="mb-2">
                <h1 className="text-[12px] md:text-[14px] font-[600] text-gray-700">B2C</h1>
            </div>

            <div className="flex flex-col gap-2 mb-2">
                {/* Tabs for larger screens */}
                <div className="hidden md:flex flex-wrap gap-2 relative">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`px-3 py-2 text-[12px] rounded-lg font-[600] transition-all duration-200 shadow-sm border ${activeTab === tab
                                ? "bg-[#0CBB7D] text-white border-[#0CBB7D]"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-green-50"
                                }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}

                    <div className="relative" ref={desktopDropdownRef}>
                        <button
                            onClick={() => setShowMoreTabs((prev) => !prev)}
                            className={`px-3 py-2 text-[12px] rounded-lg font-[600] transition-all duration-200 shadow-sm border flex items-center gap-1 ${moreTabs.includes(activeTab)
                                ? "bg-[#0CBB7D] text-white border-[#0CBB7D]"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-green-50"
                                }`}
                        >
                            {moreTabs.includes(activeTab) ? activeTab : "More"}
                            <ChevronDown className={`w-4 h-4 transition-transform ${showMoreTabs ? "rotate-180" : ""}`} />
                        </button>

                        {showMoreTabs && (
                            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[40] w-48 overflow-hidden animate-popup-in">
                                {moreTabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => {
                                            setActiveTab(tab);
                                            setShowMoreTabs(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-[12px] font-[600] transition-colors ${activeTab === tab
                                            ? "bg-green-50 text-[#0CBB7D]"
                                            : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Dropdown for mobile */}
                <div className="relative md:hidden">
                    <button
                        className="w-full px-3 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-[12px] font-[600] text-gray-700 flex justify-between items-center"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        {activeTab} <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                    </button>
                    {showDropdown && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] overflow-hidden animate-popup-in max-h-80 overflow-y-auto">
                            {allTabs.map((tab) => (
                                <button
                                    key={tab}
                                    className={`w-full text-left px-4 py-2 text-[12px] font-[600] transition-colors ${activeTab === tab ? "bg-green-50 text-[#0CBB7D]" : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setShowDropdown(false);
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {!isSidebarAdmin && showEmployeeAuthModal && (
                <EmployeeAuthModal
                    employeeModalShow={showEmployeeAuthModal}
                    employeeModalClose={() => {
                        setShowEmployeeAuthModal(false);
                        navigate(-1);
                    }}
                />
            )}

            {(isSidebarAdmin || employeeAccess.canView) && (
                <div className="w-full">
                    {renderTabContent()}
                </div>
            )}
        </div>
    );
};

export default OrderTab;