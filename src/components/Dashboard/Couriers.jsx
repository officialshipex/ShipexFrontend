import React, { useEffect, useState } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import Amazon from "../../assets/amazon.jpg";
import DTDC from "../../assets/dtdc.png";
import Delhivery from "../../assets/delehivery.png";
import Smartship from "../../assets/bluedart.png"
import Loader from "../../Loader"; // ✅ Make sure this is implemented
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Bluedart from "../../assets/bluedart.png"
import ShreeMaruti from "../../assets/shreemaruti.png"
import { Notification } from "../../Notification"
const courierLogos = {
  Dtdc: DTDC,
  DTDC,
  Delhivery,
  "Amazon Shipping": Amazon,
  Amazon,
  Smartship,
  ShreeMaruti,
  "Shree Maruti": ShreeMaruti,
  Bluedart
};

const headers = [
  "Shipment Count",
  "COD",
  "Prepaid",
  "Delivered",
  "NDR Delivered",
  "NDR Raised",
  "RTO Initiated",
  "Lost/Damaged",
  "Zone A",
  "Zone B",
  "Zone C",
  "Zone D",
  "Zone E",
];

const CourierComparisonSwapped = ({ selectedUserId, refresh, selectedDateRange }) => {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ Loader state
  const navigate = useNavigate();
  const fetchCourierData = async () => {
    try {
      setLoading(true); // Start loader
      const token = Cookies.get("session");
      const params = {};

      if (selectedUserId) params.userId = selectedUserId;
      // console.log("selected date range", selectedDateRange)
      if (selectedDateRange && selectedDateRange.length > 0) {
        params.startDate = new Date(selectedDateRange[0].startDate);
        params.endDate = new Date(selectedDateRange[0].endDate);
      }
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/dashboard/getCourierComparison`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      if (response.data.success) {
        setCouriers(response.data.data || []);
      } else {
        Notification("Failed to load courier data", "error");
      }
    } catch (error) {
      console.error("Error fetching courier data:", error);
      Notification("Error fetching courier comparison", "error");
    } finally {
      setLoading(false); // Stop loader
    }
  };

  useEffect(() => {
    fetchCourierData();
  }, [selectedUserId, refresh,selectedDateRange]);

  const handleShip = () => {
    navigate("/dashboard/order")
  }
  // ✅ Empty UI
  const renderEmptyState = () => (
    <div className="flex flex-col text-gray-500 items-center justify-center py-24 px-4 text-center">
      <div className="mb-6">
        <svg
          className="w-14 h-14 text-red-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
          />
        </svg>
      </div>
      <h2 className="text-[14px] sm:text-[18px] font-[600]">No Courier Data</h2>
      <p className="text-[12px] sm:text-[14px] mt-2 max-w-md">
        There are currently no courier insights to show. Once you start shipping orders, the courier details will appear here.
      </p>
      <button
        onClick={handleShip}
        className="mt-6 px-3 py-2 bg-[#0CBB7D] text-white text-[12px] font-[600] rounded-lg hover:bg-green-500 transition"
      >
        Ship Now
      </button>
    </div>
  );


  return (
    <div className="w-full overflow-x-hidden box-border">
      {/* ✅ Show Loader */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader />
        </div>
      ) : couriers.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border-gray-200 text-[12px]">
              <thead>
                <tr className="bg-[#0CBB7D] border border-[#0CBB7D] text-white font-[600]">
                  <th className="px-3 py-2 text-left border-gray-200">Courier</th>
                  {headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="px-3 py-2 text-center border-gray-200 whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {couriers.map((courier, idx) => (
                  <tr key={idx} className="bg-white text-gray-500 border border-gray-200">
                    <td className="px-3 py-2 border-gray-200 flex items-center gap-2">
                      <img
                        src={courierLogos[courier.courier] || "https://via.placeholder.com/40"}
                        alt={courier.courier}
                        className="w-14 h-14 rounded-full border border-gray-300 object-contain"
                      />
                      <div className="flex flex-col">
                        <span className="font-[600]">{courier.courier}</span>
                        <span className="text-gray-500 font-[500] text-[10px]">
                          {courier.courierServiceName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">{courier.shipmentCount}</td>
                    <td className="px-3 py-2 text-center">{courier.codOrders}</td>
                    <td className="px-3 py-2 text-center">{courier.prepaidOrders}</td>
                    <td className="px-3 py-2 text-center">{courier.delivered}</td>
                    <td className="px-3 py-2 text-center">{courier.ndrDelivered}</td>
                    <td className="px-3 py-2 text-center">{courier.ndrRaised}</td>
                    <td className="px-3 py-2 text-center">{courier.rto}</td>
                    <td className="px-3 py-2 text-center">{courier["Lost/Damaged"]}</td>
                    <td className="px-3 py-2 text-center">{courier["Zone A"]}</td>
                    <td className="px-3 py-2 text-center">{courier["Zone B"]}</td>
                    <td className="px-3 py-2 text-center">{courier["Zone C"]}</td>
                    <td className="px-3 py-2 text-center">{courier["Zone D"]}</td>
                    <td className="px-3 py-2 text-center">{courier["Zone E"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards - Fixed for Mobile View */}
          <div className="md:hidden w-full max-w-screen-sm mx-auto space-y-2">
            {couriers.map((courier, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 w-full box-border"
              >
                {/* Header: Logo + Name */}
                <div className="flex items-center bg-green-100 rounded-lg p-2 gap-2 mb-2">
                  <img
                    src={courierLogos[courier.courier] || "https://via.placeholder.com/40"}
                    alt={courier.courier}
                    className="w-10 h-10 rounded-full object-contain border border-gray-300"
                  />
                  <div>
                    <div className="text-[12px] font-[600] text-gray-700">{courier.courier}</div>
                    <div className="text-[10px] text-gray-500">{courier.courierServiceName}</div>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-2 text-[12px] mb-2">
                  {[
                    { label: "Shipments", value: courier.shipmentCount, color: "text-gray-700" },
                    { label: "Delivered", value: courier.delivered, color: "text-[#0CBB7D]" },
                    { label: "COD", value: courier.codOrders, color: "text-gray-700" },
                    { label: "Prepaid", value: courier.prepaidOrders, color: "text-gray-700" },
                    { label: "RTO", value: courier.rto, color: "text-red-500" },
                    { label: "NDR Raised", value: courier.ndrRaised, color: "text-yellow-500" },
                    { label: "NDR Delivered", value: courier.ndrDelivered, color: "text-[#0CBB7D]" },
                    { label: "Lost/Damaged", value: courier["Lost/Damaged"], color: "text-gray-700" },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-gray-50 border border-[#0CBB7D] rounded-lg px-2 py-1">
                      <div className="text-gray-500">{item.label}</div>
                      <div className={`font-[600] ${item.color}`}>{item.value || 0}</div>
                    </div>
                  ))}
                </div>

                {/* Zones: Grid Layout */}
                <div>
                  <div className="text-[12px] font-[600] mb-2 text-gray-700">Zone-wise Performance</div>
                  <div className="grid grid-cols-5 gap-3">
                    {["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"].map((zone) => (
                      <div
                        key={zone}
                        className="flex flex-col border border-[#0CBB7D] items-center justify-center px-2 py-1 rounded-lg bg-[#F5F7FA] text-center text-[10px] font-[500] text-gray-700 shadow-sm"
                      >
                        <div className="text-gray-500 text-[10px]">{zone}</div>
                        <div className="text-[10px] font-[600] text-[#0CBB7D]">
                          {courier[zone] !== undefined ? courier[zone] : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


              </div>
            ))}
          </div>



        </>
      )}
    </div>
  );
};

export default CourierComparisonSwapped;
