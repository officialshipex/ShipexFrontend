import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Orders from "./NewOrders";
import BookedOrders from "./BookedOrders";
import ReadyToShipOrders from "./ReadyToShipOrders";
import InTransitOrders from "./InTransitOrders";
import DeliveredOrders from "./DeliveredOrders";
import CancelledOrder from "./CancelledOrders";
import AllOrder from "./AllOrders";
import axios from "axios";
import { ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import RTO from "./RTO"
import OutForDelivery from "./OutForDeliveryOrders";
import RTOIntransit from "./RTOIntransit";
import RTODelivered from "./RTODelivered";
import RTOLost from "./RTOLost";
import RTODamaged from "./RTODamaged";
import Lost from "./Lost";
import Damaged from "./DamagedOrders";
import PickupManifestOrders from "./PickupManifestOrders";
import BulkUploadPopup from "../../Order/BulkUploadPopup";

const OrdersPage = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [upload, setUpload] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const desktopDropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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

  const isNdrRoute =
    location.pathname === "/dashboard/ndr" ||
    (location.pathname.startsWith("/dashboard/Setup&Manage/User/Profile/") && location.pathname.includes("/ndr"));

  const tabStorageKey = isNdrRoute ? "activeNdrTab" : "activeOrderTab";

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(tabStorageKey) || "New";
  });

  useEffect(() => {
    localStorage.setItem(tabStorageKey, activeTab);
  }, [activeTab, tabStorageKey]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target)) {
        setShowMoreTabs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNewOrderClick = async () => {
    try {
      const token = Cookies.get("session");
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/users/getUsers`,
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (response.data.isSeller) {
        navigate("/dashboard/order/neworder");
      } else {
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "New": return <Orders />;
      case "Booked": return <BookedOrders />;
      case "Pickup & Manifest": return <PickupManifestOrders />;
      case "Ready to Ship": return <ReadyToShipOrders />;
      case "In Transit": return <InTransitOrders />;
      case "Out for Delivery": return <OutForDelivery />;
      case "Delivered": return <DeliveredOrders />;
      case "Cancelled": return <CancelledOrder />;
      case "RTO Initiated": return <RTO />;
      case "RTO In Transit": return <RTOIntransit />;
      case "RTO Delivered": return <RTODelivered />;
      case "RTO Lost": return <RTOLost />;
      case "RTO Damaged": return <RTODamaged />;
      case "Lost": return <Lost />;
      case "Damaged": return <Damaged />;
      case "All": return <AllOrder />;
      default: return <div className="p-4 text-center text-gray-500">Select a tab to view orders.</div>;
    }
  };

  return (
    <div className="md:px-2">
      {!id && (
        <div className="mb-2 flex justify-between items-center">
          <h1 className="text-[12px] md:text-[14px] font-[600] text-gray-700">B2B</h1>
          <button
            onClick={handleNewOrderClick}
            className="md:hidden px-3 py-1.5 bg-[#0CBB7D] text-white rounded-lg text-[10px] font-[600] transition-all duration-200 shadow-sm"
          >
            + New Order
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-2">
        {/* Desktop Tabs */}
        <div className="hidden md:flex flex-row justify-between items-center gap-2">
          <div className="flex flex-wrap gap-2 relative">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-3 py-2 text-[12px] rounded-lg font-[600] transition-all duration-200 shadow-sm border ${activeTab === tab
                  ? "bg-[#0CBB7D] text-white border-[#0CBB7D]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-green-200"
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
                  : "bg-white text-gray-700 border-gray-200 hover:bg-green-200"
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
                        : "text-gray-700 hover:bg-green-200"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleNewOrderClick}
            className="px-4 py-2 bg-[#0CBB7D] text-white rounded-lg text-[12px] font-[600] transition-all duration-200 shadow-sm"
          >
            + New Order
          </button>
        </div>

        {/* Mobile Tab Dropdown */}
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

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[110] p-2">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <p className="text-lg font-medium mb-4 text-center">
              Your KYC is incomplete, please complete your KYC to create a new order.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 bg-[#0CBB7D] text-white rounded-lg text-sm"
                onClick={() => {
                  navigate("/kyc");
                  setShowModal(false);
                }}
              >
                OK
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {upload && (
        <BulkUploadPopup
          onClose={() => setUpload(false)}
          setRefresh={setRefresh}
        />
      )}

      <div className="w-full">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default OrdersPage;