import React, { useState, useEffect } from "react";
import AllWeightDiscrepancy from "./AllWeightDiscrepancy";
import PendingWeightDiscrepancy from "./PendingWeightDiscrepancy";
// import DisputeRaisedDiscrepancy from "../DisputeRaisedDiscrepancy";
// import NewDiscrepancy from "../NewDiscrepancy";
import CompleteWeightDiscrepancy from "./CompleteWeightDiscrepancy";
import { FaUpload } from "react-icons/fa";
import UploadDiscrepancyPopup from "./UploadDiscrepancyPopup";
import axios from "axios";
import DisputeRaisedDiscrepancy from "./DisputeRaisedDiscrepancy";
import EmployeeAuthModal from "../../../../employeeAuth/EmployeeAuthModal";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
    PackageCheck,
    ClipboardCheck,
    Gavel,
    AlertTriangle,
} from "lucide-react";
import Cookies from "js-cookie";


const WeightDiscrepancy = ({ isSidebarAdmin }) => {
    // const [activeTab, setActiveTab] = useState("All");
    const [showDropdown, setShowDropdown] = useState(false);
    const [upload, setUpload] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [employeeAccess, setEmployeeAccess] = useState({ canView: false, canAction: false, isAdmin: false });
    const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
    const [statusCounts, setStatusCounts] = useState({});

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const location = useLocation();


    const isNdrRoute = location.pathname === "/adminDashboard/ndr";
    const isDiscrepancyRoute =
        location.pathname === "/adminDashboard/tools/Weight_Dependency";
    const tabStorageKey = isNdrRoute
        ? "activeNdrTab"
        : isDiscrepancyRoute
            ? "activeDiscrepancyTab"
            : "activeOrderTab";

    const defaultTab = isNdrRoute
        ? "Action Required"
        : isDiscrepancyRoute
            ? "All"
            : "New";

    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem(tabStorageKey) || defaultTab;
    });

    // ⚠️ This keeps activeTab updated when route changes
    useEffect(() => {
        const storedTab = localStorage.getItem(tabStorageKey);
        setActiveTab(storedTab || defaultTab);
    }, [tabStorageKey, defaultTab]);

    // Sync changes to localStorage
    useEffect(() => {
        localStorage.setItem(tabStorageKey, activeTab);
    }, [activeTab, tabStorageKey]);
    const [allData, setAllData] = useState([
    ]);

    const tabs = ["All", "Pending", "Complete", "Dispute"];


    // console.log("counts",counts)
    console.log(isSidebarAdmin);
    const handleBulkUpload = () => {
        setUpload(true);

    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // 1. Access check
                if (isSidebarAdmin) {
                    console.log(isSidebarAdmin);
                    setEmployeeAccess({ canView: true, canAction: true, isAdmin: true });
                    setShowEmployeeAuthModal(false);
                } else {
                    const token = Cookies.get("session");
                    if (!token) {
                        setShowEmployeeAuthModal(true);
                        return;
                    }
                    const empRes = await axios.get(
                        `${REACT_APP_BACKEND_URL}/staffRole/verify`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const employee = empRes.data.employee;
                    const canView = !!employee?.accessRights?.tools?.["Admin Weight Discrepancy"]?.view;
                    const canAction = !!employee?.accessRights?.tools?.["Admin Weight Discrepancy"]?.action;
                    setEmployeeAccess({ canView, canAction });
                    if (!canView) {
                        setShowEmployeeAuthModal(true);
                        return;
                    }
                    setShowEmployeeAuthModal(false);
                }

                // 2. Fetch data if access is allowed
                const token = Cookies.get("session");
                const response = await axios.get(
                    `${REACT_APP_BACKEND_URL}/dispreancy/allDispreancy`,
                    {
                        headers: {
                            authorization: `Bearer ${token}`,
                        },
                    }
                );
                const { statusCounts, discrepancies } = response.data.data;

                // Convert statusCounts to a lookup object
                const countObj = {};
                statusCounts.forEach(item => {
                    countObj[item.status.toLowerCase()] = item.count;
                });

                setStatusCounts(countObj);   // e.g., { pending: 10, accepted: 5, ... }
                console.log("statusCounts", statusCounts);
                setAllData(discrepancies);   // optional if you still render the full table
                setRefresh(false);
            } catch (error) {
                if (!isSidebarAdmin) setShowEmployeeAuthModal(true);
                console.error("Error fetching orders:", error);
            }
        };
        fetchOrders();
    }, [refresh, isSidebarAdmin]);

    const counts = {
        pending: statusCounts?.pending || 0,
        accepted: statusCounts?.accepted || 0,
        dispute: statusCounts?.["discrepancy raised"] || 0,
        escalated: statusCounts?.escalated || 0,
    };
    console.log("counts", counts);

    const renderTabContent = () => {
        switch (activeTab) {
            case "All":
                return <AllWeightDiscrepancy refresh={refresh} setRefresh={setRefresh} />;
            case "Complete":
                return <CompleteWeightDiscrepancy />;
            case "Pending":
                return <PendingWeightDiscrepancy />;
            case "Dispute":
                return <DisputeRaisedDiscrepancy refresh={refresh}
                    setRefresh={setRefresh}
                    canAction={employeeAccess.canAction} />;


            default:
                return <div>Select a tab to view orders.</div>;
        }
    };

    return (
        <div className="p-1 md:p-2 flex flex-col">
            {!isSidebarAdmin && showEmployeeAuthModal && (
                <EmployeeAuthModal
                    employeeModalShow={showEmployeeAuthModal}
                    employeeModalClose={() => {
                        setShowEmployeeAuthModal(false);
                        window.history.back();
                    }}
                />
            )}
            {(isSidebarAdmin || employeeAccess.canView || employeeAccess.isAdmin) && (
                <>
                    {/* Title */}
                    <h1 className="text-[14px] font-[600] text-gray-700 mb-1">
                        Weight Discrepancy
                    </h1>

                    {/* Cards Section */}
                    <div className="w-full">

                        {/* Mobile View: One Combined Card */}
                        <div className="md:hidden bg-white border border-[#0CBB7D] rounded-lg p-4 text-[12px] text-gray-700 space-y-2">
                            {[
                                { label: "New Discrepancies", count: counts.pending },
                                { label: "Accepted", count: counts.accepted },
                                { label: "Disputes", count: counts.dispute },
                                { label: "Escalated", count: counts.escalated },
                            ].map((item, idx) => (
                                <div key={idx} className="grid" style={{ gridTemplateColumns: "180px 10px 1fr" }}>
                                    <span className="text-gray-500 font-[600]">{item.label}</span>
                                    <span className="text-center text-gray-500">:</span>
                                    <span className="font-[600] text-gray-700 text-right">{item.count}</span>
                                </div>
                            ))}
                        </div>


                        {/* Desktop View: 4 Colored Cards */}
                        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                            {[
                                {
                                    label: "New Discrepancies",
                                    count: counts.pending,
                                    icon: <PackageCheck className="text-white" size={14} />,
                                    status: "New",
                                },
                                {
                                    label: "Accepted",
                                    count: counts.accepted,
                                    icon: <ClipboardCheck className="text-white" size={14} />,
                                    status: "Accepted",
                                },
                                {
                                    label: "Disputes",
                                    count: counts.dispute,
                                    icon: <Gavel className="text-white" size={14} />,
                                    status: "Dispute",
                                },
                                {
                                    label: "Escalated",
                                    count: counts.escalated,
                                    icon: <AlertTriangle className="text-white" size={14} />,
                                    status: "Escalated",
                                },
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center space-x-2 bg-white border border-[#0CBB7D] p-2 rounded-lg"
                                // onClick={() => setActiveTab(item.status)}
                                >
                                    <div className="p-2 bg-[#0CBB7D] rounded-full flex items-center justify-center">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-[600] text-gray-500">{item.label}</p>
                                        <p className="text-[12px] font-[600] text-gray-700">{item.count}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>


                    {/* Tabs for larger screens */}
                    <div className="flex items-center justify-between">
                        <div className="hidden md:flex flex-wrap gap-2 my-2 ">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    className={`px-3 py-2 rounded-lg border text-[12px] font-[600] transition-all ${activeTab === tab
                                        ? "bg-[#0CBB7D] text-white"
                                        : "bg-white text-gray-700 hover:bg-green-200"
                                        }`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}

                        </div>
                        <div
                            className="flex flex-col items-center space-y-2"
                            onClick={() => {
                                if (isSidebarAdmin || employeeAccess.canAction) {
                                    handleBulkUpload();
                                } else {
                                    setShowEmployeeAuthModal(true);
                                }
                            }}
                        >
                            <label
                                className={`cursor-pointer hidden sm:flex text-[12px] font-[600] items-center gap-2 px-3 py-2 rounded-lg border transition
      ${isSidebarAdmin || employeeAccess.canAction
                                        ? "text-[#0CBB7D] bg-white border-[#0CBB7D] hover:bg-green-100"
                                        : "text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed"
                                    }`}
                            >
                                <FaUpload className="text-[#0CBB7D]" />
                                <span>Upload</span>
                            </label>
                        </div>
                    </div>

                    {/* Dropdown for mobile screens */}
                    <div className="relative w-full md:hidden mb-2 mt-2 flex gap-2">
                        <button
                            className="w-full px-3 font-[600] py-2 bg-[#0CBB7D] text-white rounded-lg text-[12px] flex justify-between items-center"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            {activeTab} <ChevronDown className="w-4 h-4 ml-2" />
                        </button>
                        {showDropdown && (
                            <div className="absolute top-full w-full left-0 mt-1 text-gray-700 bg-white border rounded-lg font-[600] shadow-lg z-10">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        className={`w-full text-left px-3 py-2 text-[12px] hover:bg-green-200 ${activeTab === tab ? "bg-green-100" : "hover:bg-green-50"}`}
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
                        <div className="py-2 px-3 bg-[#0CBB7D] rounded-lg flex items-center justify-center cursor-pointer">
                            <FaUpload className="text-white" />
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="overflow-x-auto w-full">{renderTabContent()}</div>
                    {upload && (
                        <UploadDiscrepancyPopup
                            onClose={() => setUpload(false)}
                            setRefresh={setRefresh}
                        />
                    )}
                </>)}
        </div>
    );
};

export default WeightDiscrepancy;