import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionRequired from "./ActionRequired";
import ActionRequested from "./ActionRequested";
import Delivered from "./Delivered";
import RTO from "./RTO";
import ManualRto from "./ManualRto";
import Cookies from "js-cookie";
import axios from "axios";
import EmployeeAuthModal from "../employeeAuth/EmployeeAuthModal";
import { ChevronDown } from "lucide-react";
import Undelivered from "./Undelivered";

const NdrTab = ({ isSidebarAdmin }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [employeeAccess, setEmployeeAccess] = useState({ isAdmin: false, canView: false });

  const location = useLocation();
  const navigate = useNavigate();
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const tabs = ["Undelivered", "Action Required", "Action Requested", "Delivered", "RTO Initiated", "Manual RTO"];
  const tabStorageKey = "activeNdrTab";

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(tabStorageKey) || "Undelivered";
  });

  const params = new URLSearchParams(location.search);
  const userId = params.get("userId");

  useEffect(() => {
    localStorage.setItem(tabStorageKey, activeTab);
  }, [activeTab]);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (isSidebarAdmin) {
          setEmployeeAccess({ isAdmin: true, canView: true, canAction: true });
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
          const canView = !!employeeInfo?.accessRights?.ndr?.['All NDR']?.view;
          setEmployeeAccess({ canView });

          if (!canView) {
            setShowEmployeeAuthModal(true);
          }
        }
      } catch (error) {
        console.error("Error verifying employee access:", error);
        setShowEmployeeAuthModal(true);
      }
    };
    checkAccess();
  }, [isSidebarAdmin]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "Undelivered":
        return <Undelivered userId={userId} />;
      case "Action Required":
        return <ActionRequired userId={userId} />;
      case "Action Requested":
        return <ActionRequested userId={userId} />;
      case "Delivered":
        return <Delivered userId={userId} />;
      case "RTO Initiated":
        return <RTO userId={userId} />;
      case "Manual RTO":
        return <ManualRto userId={userId} />;
      default:
        return <div className="p-4 text-center text-gray-500">Select a tab to view orders.</div>;
    }
  };

  return (
    <div className="md:px-2">
      <div className="mb-2">
        <h1 className="text-[12px] md:text-[14px] font-[600] text-gray-700">NDR</h1>
      </div>

      <div className="flex flex-col gap-2 mb-2">
        {/* Tabs for larger screens */}
        <div className="hidden md:flex flex-wrap gap-2">
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
            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] overflow-hidden animate-popup-in">
              {tabs.map((tab) => (
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

export default NdrTab;
