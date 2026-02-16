import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// import ReadyToShipOrders from "./ReadyToShipOrders";
import IntransitOrders from "./IntransitOrders";
// import NotPickedOrders from "./NotPickedOrders";
import axios from "axios";
import Cookies from "js-cookie";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import { ChevronDown } from "lucide-react";

const MidMile = ({ isSidebarAdmin }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [orders, setOrders] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [orderIds, setOrderIds] = useState("");
  const [awbNumbers, setAwbNumbers] = useState("");
  const [productName, setProductName] = useState("");
  const [channel, setChannel] = useState("");
  const [type, setType] = useState("");
  const [courier, setCourier] = useState("");
  const [attempts, setAttempts] = useState("");
  const location = useLocation();
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [employeeAccess, setEmployeeAccess] = useState({ isAdmin: false, canView: false });
  const navigate = useNavigate();
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const tabs = ["In-transit"];
  const isOperationFirstMileRoute = location.pathname === "/adminDashboard/operations/midmile";
  const tabStorageKey = isOperationFirstMileRoute ? "activeOperationMidMileTab" : "activeOrderTab";
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(tabStorageKey) || "In-transit";
  });

  const params = new URLSearchParams(location.search);
  const userId = params.get("userId");

  useEffect(() => {
    localStorage.setItem(tabStorageKey, activeTab);
  }, [activeTab]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (isSidebarAdmin) {
          setEmployeeAccess({ isAdmin: true, canView: true, canAction: true });
          setShowEmployeeAuthModal(false);
          return;
        } else {
          const token = Cookies.get("session");
          const employeeResponse = await axios.get(
            `${REACT_APP_BACKEND_URL}/staffRole/verify`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const employeeInfo = employeeResponse.data.employee;
          const canView = !!employeeInfo?.accessRights?.ndr?.['All NDR']?.view;
          setEmployeeAccess({ canView });

          if (!canView) {
            setShowEmployeeAuthModal(true);
            return;
          }
        }
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/order/orders`,
          { headers: { authorization: `Bearer ${token}` } }
        );
        setOrders(response.data.orders);
        setRefresh(false);
        setFilteredOrders(response.data.orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    fetchOrders();
  }, [refresh, isSidebarAdmin]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "In-transit":
        return <IntransitOrders orders={filteredOrders} userId={userId} />;
      
      default:
        return <div>Select a tab to view orders.</div>;
    }
  };

  return (
    <div className={`md:px-2 px-1 ${showModal ? "overflow-hidden" : ""}`}>
      <div className="mb-1">
        <h1 className="text-[12px] md:text-[18px] font-[600] text-gray-700">Mid Mile</h1>
      </div>
      <div className="flex justify-between items-center md:grid md:grid-cols-2 w-full">
        <div className="hidden md:flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-3 py-2 text-[12px] rounded-lg font-[600] transition-all duration-200 ${
                activeTab === tab ? "bg-[#0CBB7D] text-white" : "bg-white text-gray-700 hover:bg-green-200"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      {!isSidebarAdmin && showEmployeeAuthModal && (
        <EmployeeAuthModal
          employeeModalShow={showEmployeeAuthModal}
          employeeModalClose={() => {
            setShowEmployeeAuthModal(false);
            window.history.back();
          }}
        />
      )}
      {(isSidebarAdmin || employeeAccess.isAdmin || employeeAccess.canView) && (
        <>
          <div className="relative md:hidden mb-2">
            <button
              className="w-full px-3 py-2 bg-[#0CBB7D] text-white rounded-lg text-[10px] font-[600] flex justify-between items-center"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {activeTab} <ChevronDown className="w-3 h-3 ml-2" />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded-lg shadow-lg z-10">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`w-full text-left px-3 py-2 text-[10px] font-[600] text-gray-700 hover:bg-gray-200 ${
                      activeTab === tab ? "bg-green-100" : "bg-green-50"
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
          <div className="overflow-x-auto">{renderTabContent()}</div>
        </>
      )}
    </div>
  );
};

export default MidMile;
