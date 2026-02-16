import React, { useState, useEffect, useRef } from "react";
import { FaClipboardList, FaRupeeSign, FaBox } from "react-icons/fa";
import { PackageCheck, Clock, TrendingUp } from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { ResponsiveChoropleth } from "@nivo/geo";
import axios from "axios";
import { Link } from "react-router-dom";

const DashboardCards = ({ }) => {
  const [outerRadius, setOuterRadius] = useState(60);
  const [getuser, setGetuser] = useState({});
  const [kycCompleted, setKycCompleted] = useState(false);
  const hasFetched = useRef(false);
  const [dashdata, setDashData] = useState({})
  const [courierData, setCourierData] = useState([]);
  const [shipmentStatus, setShipmentStatus] = useState([]);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  useEffect(() => {
    const kyc = localStorage.getItem("kyc")
    setKycCompleted(kyc === "true" ? true : false)
  }, [])
  useEffect(() => {
    if (hasFetched.current) return; // Prevents duplicate execution
    hasFetched.current = true;

    const fetchUserData = async () => {
      try {
        const token = Cookies.get("session");

        if (!token) {
          console.log("Token not found");
          return;
        }

        // First, check the user endpoint
        try {
          const userResponse = await axios.get(
            `${REACT_APP_BACKEND_URL}/order/getUser`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setGetuser(userResponse.data);
          setKycCompleted(userResponse.data.kycDone);

          // Fetch dashboard data
          const dashboard = await axios.get(
            `${REACT_APP_BACKEND_URL}/dashboard/dashboard`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log("Dashboard data:", dashboard.data);
          setDashData(dashboard.data.data);
        } catch (userError) {
          console.log("User not found, checking employee endpoint...");

          // If user not found, check the employee endpoint
          const employeeResponse = await axios.get(
            `${REACT_APP_BACKEND_URL}/staffRole/verify`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (employeeResponse.data.success && employeeResponse.data.employee) {
            console.log("Employee authenticated:", employeeResponse.data.employee);
            setGetuser(employeeResponse.data.employee);
          } else {
            console.error("Neither user nor employee found.");
          }
        }
      } catch (error) {
        console.error("Error fetching user or employee data:", error.response?.data || error.message);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setOuterRadius(window.innerWidth >= 768 ? 80 : 60);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!dashdata.ordersByProvider) return;

    const mappedData = dashdata.ordersByProvider.map((entry) => {
      const name = entry.provider || "EcomExpress"; // Replace null with 'EcomExpress'
      const colorMap = {
        "Delhivery": "#9C27B0",
        "Amazon": "#36A2EB",
        "EcomExpress": "#4CAF50",
        "DTDC": "#FF5733",
      };

      return {
        name,
        value: entry.count,
        color: colorMap[name] || "#ccc", // fallback color
      };
    });
    console.log("Mapped Data:", mappedData);
    setCourierData(mappedData);
  }, [dashdata.ordersByProvider]);




  useEffect(() => {
    if (dashdata) {
      setShipmentStatus([
        { name: "Delivered", value: dashdata.deliveredOrders || 0, color: "#2ECC71" },
        { name: "In-Transit", value: dashdata.inTransitOrders || 0, color: "#3498DB" },
        { name: "Undelivered", value: dashdata.ndrOrders || 0, color: "#E74C3C" },
        { name: "Lost/Damaged", value: dashdata?.lostOrders || 0, color: "#F39C12" }, // Static value for now
      ]);
    }
  }, [dashdata]); // Depend on dashdata so it runs again when it updates


  const [deliveryPerformance, setDeliveryPerformance] = useState([
    { name: "On-Time Deliveries", value: 700, color: "#1E88E5" },
    { name: "Late Deliveries", value: 300, color: "#E91E63" },
  ]);

  const cardData = [
    {
      title: "Orders",
      value: dashdata.totalOrders || 0,
      icon: <FaClipboardList className="text-sm text-[#0CBB7D]" />,
    },
    {
      title: "Revenue",
      value: `₹${dashdata?.totalRevenue ?? 0}`,
      icon: <FaRupeeSign className="text-sm text-[#0CBB7D]" />,
    },
    {
      title: "Avg Shipping",
      value: `₹${dashdata?.averageShipping ?? 0}`,
      icon: <FaBox className="text-sm text-[#0CBB7D]" />,
    },
  ];


  const statsData = [
    {
      title: "Shipments Details",
      data: [
        { label: "Total Shipments", value: dashdata.shippingCount || 0 },
        { label: "Pickup Pending", value: dashdata.readyToShipOrders || 0 },
        { label: "In-Transit", value: dashdata.inTransitOrders || 0 },
        { label: "Delivered", value: dashdata.deliveredOrders || 0 },
        { label: "NDR Pending", value: dashdata?.ndrOrders || 0 },
        { label: "RTO", value: dashdata?.RTOOrders || 0 },
      ],
      footer: "",
    },
    {
      title: "NDR Details",
      data: [
        { label: "Total NDR", value: dashdata?.totalNdr },
        { label: "Action Required", value: dashdata?.ndrOrders },
        { label: "Action Requested", value: dashdata?.actionRequestedOrders },
        { label: "NDR Delivered", value: dashdata?.ndrDeliveredOrders },
      ],
      footer: "",
    },
    {
      title: "COD Status",
      data: [
        { label: "Total COD ", value: "₹0" },
        { label: "COD to be Remited", value: "₹0" },
        { label: "COD Initiated", value: "₹0" },
        { label: "Last COD Remitted", value: "₹0" },
      ],
    },
  ];

  const ordersData = [
    { id: "Madhya Pradesh", value: 18.8, revenue: 1110 },
    { id: "Gujarat", value: 22.4, revenue: 1500 },
    { id: "Delhi", value: 10.2, revenue: 900 },
  ];

  const shipmentsData = [
    { label: "Zone A", value: getZonePercentage("zoneA") },
    { label: "Zone B", value: getZonePercentage("zoneB") },
    { label: "Zone C", value: getZonePercentage("zoneC") },
    { label: "Zone D", value: getZonePercentage("zoneD") },
    { label: "Zone E", value: getZonePercentage("zoneE") },
  ];

  function getZonePercentage(label) {
    const zone = dashdata?.ordersByZone?.find((z) => z.zone === label);
    return zone?.percentage || 0;
  }


  const revenueData = [
    { label: "Last 90 Days", value: `₹${dashdata.revenueStats?.last90Days}` },
    { label: "This Week", value: `₹${dashdata.revenueStats?.thisWeek}` },
    { label: "This Month", value: `₹${dashdata.revenueStats?.thisMonth}` },
    { label: "This Quarter", value: `₹${dashdata.revenueStats?.thisQuarter}` },
  ];

  return (
    <div className="min-h-screen p-2">
      {!kycCompleted && (
        <div className="flex flex-col items-center border border-dashed border-red-500 rounded-lg bg-red-50 px-3 py-2 mb-6 shadow-md w-full max-w-[100%] sm:max-w-full sm:flex-row sm:items-center sm:justify-between">
          {/* Icon */}
          <span className="text-yellow-400 text-2xl sm:mr-3">💡</span>

          {/* Text (Centered in mobile, left-aligned in laptop, no word break) */}
          <p className=" text-[12px] text-gray-900 font-medium text-center sm:text-left mt-2 sm:mt-0 whitespace-nowrap">
            Complete your KYC to Start Shipping
          </p>

          {/* Button (Centered in mobile, right-aligned in laptop) */}
          <Link
            to="/Kyc"
            className="mt-3 sm:mt-0 sm:ml-auto text-red-500 text-sm font-medium hover:underline"
          >
            Click Here ›
          </Link>
        </div>
      )}

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cardData.map((card, index) => (
          <div
            key={index}
            className="text-gray-500 bg-[#0CBB7D] p-6 rounded-lg border-1 border-gary-500 shadow-md flex items-center space-x-0"
          >
            <div className="bg-white p-3 rounded-full shadow">{card.icon}</div>
            <div>
              <p className="text-white text-[14px] font-semibold pl-6">{card.title}</p>
              <p className="text-sm font-bold pl-6 text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stat Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="text-gray-500 p-4 md:p-5 rounded-lg shadow-md"
          >
            <p className="lg:text-[14px] md:text-[14px] font-semibold text-gray-800 mb-2 md:mb-4 text-center">
              {stat.title}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-3 ">
              {stat.data.map((item, i) => (
                <div
                  key={i}
                  className="bg-[#0CBB7D] p-4 md:p-5 border-1 border-gray-800 rounded-lg shadow-md flex flex-col justify-center items-center text-center"
                >
                  <p className="lg:text-[14px] md:text-[14px] font-bold text-white">{item.value}</p>
                  <p className="text-[10px] md:text-[12px] text-white">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            {stat.footer && (
              <p className="text-right md:text-right text-[10px] md:text-[12px] border-gray-800 mt-1 md:mt-3">
                {stat.footer}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* piechart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 mt-6 md:mt-8 z-10">
        {[
          { title: "Couriers Split", data: courierData },
          { title: "Shipment Status", data: shipmentStatus },
          { title: "Delivery Performance", data: deliveryPerformance },
        ].map((chart, index) => (
          <div
            key={index}
            className="bg-white text-gray-800 p-3 md:p-5 rounded-lg shadow-md"
          >
            <p className="lg:text-[14px] md:text-[14px] font-semibold mb-2 md:mb-4 text-center">
              {chart.title}
            </p>
            <div className="h-[00px] md:h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chart.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={outerRadius}
                    innerRadius={outerRadius - 24}
                    paddingAngle={2}
                    stroke="#fff"
                  >
                    {chart.data.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      color: "black",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      padding: "5px 9px",
                      fontSize: "13px",
                    }}
                  />

                  <Legend
                    wrapperStyle={{ fontSize: "10px" }}
                    formatter={(value) => (
                      <span style={{ color: "#2d054b" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-rows-3 gap-4 text-sm">
          {/* Total Orders */}
          <div className="flex items-center p-5 bg-[#0CBB7D] shadow-md rounded-lg text-white">
            <div className="bg-white rounded-full p-2 mr-5">
              <PackageCheck size={20} className="text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-[14px]">Total Orders</p>
              <p className="text-[14px] font-bold">{dashdata.totalOrders || 0}</p>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="flex items-center p-5 bg-[#0CBB7D] shadow-md rounded-lg border text-white">
            <div className="bg-white rounded-full p-2 mr-5">
              <Clock size={20} className="text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-[14px]">Pending Orders</p>
              <p className="text-[14px] font-bold">{dashdata.readyToShipOrders || 0}</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="flex items-center p-5 bg-[#0CBB7D] shadow-md rounded-lg text-white">
            <div className="bg-white rounded-full p-2 mr-5">
              <TrendingUp size={20} className="text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-[14px]">On-Time Delivery Rate</p>
              <p className="text-[14px] font-bold">95%</p>
            </div>
          </div>
        </div>



        {/* Shipments - Zone Distribution */}
        <div className="p-4 text-gray-800 shadow-md rounded-lg">
          <p className="text-[14px] font-semibold mb-4">
            Shipments - Zone Distribution
          </p>
          <ul>
            {shipmentsData.map((zone, index) => (
              <li
                key={index}
                className="flex justify-between p-4 border-b border-gray-300"
              >
                <span className="text-[12px]">{zone.label}</span>
                <span className="font-bold text-[12px] ">{zone.value}%</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Revenue Data */}
        <div className="p-4 text-gray-800 shadow-md rounded-lg">
          <p className="text-[14px] font-semibold mb-4">Revenue</p>
          <ul>
            {revenueData.map((rev, index) => (
              <li
                key={index}
                className="flex justify-between p-4 border-b border-gray-300 "
              >
                <span className="text-[12px]">{rev.label}</span>
                <span className="font-bold text-[12px]">{rev.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
