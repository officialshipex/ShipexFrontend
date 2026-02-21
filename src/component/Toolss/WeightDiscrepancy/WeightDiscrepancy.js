import React, { useState, useEffect } from "react";
import AllDiscrepancy from "./AllDiscrepancy";
import AutoAcceptedDiscrepancy from "./AutoAcceptedDiscrepancy";
import DisputeRaisedDiscrepancy from "./DisputeRaisedDiscrepancy";
import NewDiscrepancy from "./NewDiscrepancy";
import OrderEscalatedDiscrepancy from "./OrderEscalatedDiscrepancy";
import axios from "axios";
import { useLocation, useParams } from "react-router-dom";
import {
  PackageCheck,
  ClipboardCheck,
  Gavel,
  AlertTriangle,
} from "lucide-react";
import { ChevronDown } from "lucide-react";
import Cookies from "js-cookie";

const WeightDiscrepancy = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [allData, setAllData] = useState([]);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const location = useLocation();
  const [statusCounts, setStatusCounts] = useState({});
  const { id } = useParams();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params = { id }
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/dispreancy/allDispreancyCountById`,
          {
            params,
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );
        const { statusCounts, discrepancies } = response.data.data;
        // Convert statusCounts to a lookup object
        const countObj = {};
        statusCounts.forEach((item) => {
          countObj[item.status.toLowerCase()] = item.count;
        });
        setStatusCounts(countObj); // e.g., { pending: 10, accepted: 5, ... }
        console.log("statusCounts", statusCounts);
        setAllData(discrepancies); // optional if you still render the full table
        setRefresh(false);

        // console.log(orders)
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    fetchOrders();
  }, [refresh]);

  const tabs = [
    "New",
    "Auto Accepted",
    "Dispute Raised",
    "Order Escalated",
    "All",
  ];

  const isNdrRoute = location.pathname === "/dashboard/ndr";
  const isDiscrepancyRoute =
    location.pathname === "/dashboard/tools/Weight_Dependency";
  const tabStorageKey = isNdrRoute
    ? "activeNdrTab"
    : isDiscrepancyRoute
      ? "activeUserDiscrepancyTab"
      : "activeOrderTab";

  const defaultTab = isNdrRoute
    ? "Action Required"
    : isDiscrepancyRoute
      ? "New"
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

  const counts = {
    new: statusCounts?.new || 0,
    accepted: statusCounts?.accepted || 0,
    dispute: statusCounts?.["discrepancy raised"] || 0,
    escalated: statusCounts?.escalated || 0,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "New":
        return <NewDiscrepancy refresh={refresh} setRefresh={setRefresh} />;
      case "Auto Accepted":
        return <AutoAcceptedDiscrepancy />;
      case "Dispute Raised":
        return (
          <DisputeRaisedDiscrepancy refresh={refresh} setRefresh={setRefresh} />
        );
      case "Order Escalated":
        return <OrderEscalatedDiscrepancy />;
      case "All":
        return <AllDiscrepancy />;
      default:
        return <div>Select a tab to view orders.</div>;
    }
  };

  return (
    <div className="sm:px-2 flex flex-col">
      {/* Title */}
      {!id && (
        <div>
          <h1 className="text-[12px] mb-2 sm:text-[14px] font-[600] text-gray-700">
            Weight Discrepancy
          </h1>
        </div>
      )}

      {/* Cards Section */}
      <div className="w-full">
        {/* Mobile View: One Combined Card */}
        <div className="md:hidden bg-white border border-[#0CBB7D] rounded-lg px-3 py-2 text-[10px] text-gray-700 space-y-2">
          {[
            { label: "New Discrepancies", count: counts.new },
            { label: "Accepted", count: counts.accepted },
            { label: "Disputes", count: counts.dispute },
            { label: "Escalated", count: counts.escalated },
          ].map((item, idx) => (
            <div
              key={idx}
              className="grid"
              style={{ gridTemplateColumns: "180px 10px 1fr" }}
            >
              <span className="text-gray-700 font-[600]">{item.label}</span>
              <span className="text-center text-gray-700">:</span>
              <span className="font-[600] text-gray-700 text-right">
                {item.count}
              </span>
            </div>
          ))}
        </div>

        {/* Desktop View: 4 Colored Cards */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              label: "New Discrepancies",
              count: counts.new,
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
              <div className="p-2 bg-[#0CBB7D] rounded-full font-[600] flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <p className="text-[12px] font-[600] text-gray-500">{item.label}</p>
                <p className="text-[12px] font-[600] text-gray-700">
                  {item.count}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs for larger screens */}
      <div className="hidden md:flex flex-wrap gap-2 my-2">
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

      {/* Dropdown for mobile screens */}
      <div className="relative w-full md:hidden mb-2 mt-2">
        <button
          className="w-full font-[600] px-3 py-2 border border-gray-200 shadow-sm text-gray-700 rounded-lg text-[12px] flex justify-between items-center"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {activeTab} <ChevronDown className="w-4 h-4 ml-2" />
        </button>
        {showDropdown && (
          <div className="absolute top-full animate-popup-in left-0 w-full mt-1 bg-white border rounded-lg z-10">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`w-full text-left px-3 py-2 text-[12px] font-[600] ${activeTab === tab ? "bg-green-100" : "hover:bg-green-50"
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

      {/* Tab Content */}
      <div className="overflow-x-auto w-full">{renderTabContent()}</div>
    </div>
  );
};

export default WeightDiscrepancy;
