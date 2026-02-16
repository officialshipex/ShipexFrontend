import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiList,
  FiClock,
  FiPackage,
  FiTruck,
} from "react-icons/fi";
import Cookies from "js-cookie";

const RTOSummary = ({ filters = {}, selectedUserId, refresh, selectedDateRange }) => {
  const [summaryData, setSummaryData] = useState([
    {
      label: "Total RTO",
      value: 0,
      icon: <FiList />,
      color: "bg-[#0CBB7D] text-white",
    },
    {
      label: "RTO Initiated",
      value: 0,
      percent: "0.00%",
      icon: <FiClock />,
      color: "bg-[#0CBB7D] text-white",
    },
    {
      label: "RTO In-transit",
      value: 0,
      percent: "0.00%",
      icon: <FiPackage />,
      color: "bg-[#0CBB7D] text-white",
    },
    {
      label: "RTO Delivered",
      value: 0,
      percent: "0.00%",
      icon: <FiTruck />,
      color: "bg-[#0CBB7D] text-white",
    },
  ]);

  const fetchRTOSummary = async () => {
    try {
      const token = Cookies.get("session");
      const today = new Date();
      const startDate =
        selectedDateRange?.[0]?.startDate ||
        new Date(today.setHours(0, 0, 0, 0)); // 00:00:00 of today

      const endDate =
        selectedDateRange?.[0]?.endDate ||
        new Date(today.setHours(23, 59, 59, 999)); // 23:59:59 of today
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/dashboard/getRTOSummaryData`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId: selectedUserId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            zone: filters.zone,
            courier: filters.courier,
            paymentMode: filters.paymentMode,
          },
        }
      );

      if (response.data.success) {
        const { total, initiated, inTransit, delivered } = response.data.data;

        setSummaryData([
          {
            label: "Total RTO",
            value: total,
            icon: <FiList />,
            color: "bg-[#0CBB7D] text-white",
          },
          {
            label: "RTO Initiated",
            value: initiated.count,
            percent: initiated.percent,
            icon: <FiClock />,
            color: "bg-[#0CBB7D] text-white",
          },
          {
            label: "RTO In-transit",
            value: inTransit.count,
            percent: inTransit.percent,
            icon: <FiPackage />,
            color: "bg-[#0CBB7D] text-white",
          },
          {
            label: "RTO Delivered",
            value: delivered.count,
            percent: delivered.percent,
            icon: <FiTruck />,
            color: "bg-[#0CBB7D] text-white",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch RTO summary:", err.message);
    }
  };

  useEffect(() => {
    fetchRTOSummary();
  }, [filters, selectedUserId, refresh, selectedDateRange]);

  return (
    <div className="w-full p-4 sm:mt-4 mt-2 rounded-lg border border-gray-300 bg-white">
      <h2 className="sm:text-[18px] text-[14px] font-[600] mb-4 text-gray-700">
        RTO Summary
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryData.map((item, index) => (
          <div
            key={index}
            className="flex flex-col justify-between rounded-lg border p-4 shadow-sm hover:border-[#0CBB7D] transition-all duration-700"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-[16px] ${item.color}`}
              >
                {item.icon}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-[12px]">
                  <span className="font-semibold text-[18px] text-gray-700">
                    {item.value}
                  </span>
                  {item.percent && (
                    <span className="text-gray-400 text-[11px]">
                      ({item.percent})
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-gray-500 flex items-center gap-1">
                  {item.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RTOSummary;
