import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    FiList,
    FiClock,
    FiPackage,
    FiTruck,
    FiMapPin,
    FiCheckCircle,
    FiXCircle,
    FiAlertCircle,
    FiZapOff,
} from "react-icons/fi";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const ICONS = {
    "Total Orders": <FiList />,
    New: <FiClock />,
    "Ready To Ship": <FiPackage />,
    "In-transit": <FiTruck />,
    "Out for Delivery": <FiMapPin />,
    Delivered: <FiCheckCircle />,
    Cancelled: <FiXCircle />,
    Undelivered: <FiZapOff />,
    Lost: <FiAlertCircle />,
    Damaged: <FiZapOff />,
};

const OrderSummary = ({ filters, selectedUserId, refresh, selectedDateRange }) => {
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate()
    const [isAdmin, setIsAdmin] = useState();
    const [adminTab, setAdminTab] = useState();
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const handleShipmentClick = () => {
        if (!isAdmin || (isAdmin && !adminTab)) {
            navigate("/dashboard/b2c/order");
        } else {
            navigate("/adminDashboard/b2c/order");
        }
    };

    const fetchUserData = async () => {
        try {
            const token = Cookies.get("session");
            if (!token) return;

            const userResponse = await axios.get(
                `${REACT_APP_BACKEND_URL}/order/getUser`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // console.log("datatauser", userResponse.data)
            setIsAdmin(userResponse.data.isAdmin)
            setAdminTab(userResponse.data.adminTab)
        }
        catch (error) {
            console.log("error", error)
        }
    }
    useEffect(() => {
        fetchUserData();
    }, [])

    const fetchSummary = async () => {
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
                `${process.env.REACT_APP_BACKEND_URL}/dashboard/getOrderSummary`,
                {
                    headers: { Authorization: `Bearer ${token}` },
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
                const data = response.data.data;
                const mappedData = [
                    {
                        label: "Total Orders",
                        value: data.totalOrders || 0,
                        icon: ICONS["Total Orders"],
                    },
                    {
                        label: "New",
                        value: data.new?.count || 0,
                        percent: data.new?.percent || "0.00%",
                        icon: ICONS["New"],
                    },
                    {
                        label: "Ready To Ship",
                        value: data.readyToShip?.count || 0,
                        percent: data.readyToShip?.percent || "0.00%",
                        icon: ICONS["Ready To Ship"],
                    },
                    {
                        label: "In-transit",
                        value: data.inTransit?.count || 0,
                        percent: data.inTransit?.percent || "0.00%",
                        icon: ICONS["In-transit"],
                    },
                    {
                        label: "Out for Delivery",
                        value: data.outForDelivery?.count || 0,
                        percent: data.outForDelivery?.percent || "0.00%",
                        icon: ICONS["Out for Delivery"],
                    },
                    {
                        label: "Delivered",
                        value: data.delivered?.count || 0,
                        percent: data.delivered?.percent || "0.00%",
                        icon: ICONS["Delivered"],
                    },
                    {
                        label: "Cancelled",
                        value: data.cancelled?.count || 0,
                        percent: data.cancelled?.percent || "0.00%",
                        icon: ICONS["Cancelled"],
                    },
                    {
                        label: "Undelivered",
                        value: data.undelivered?.count || 0,
                        percent: data.undelivered?.percent || "0.00%",
                        icon: ICONS["Undelivered"],
                    },
                    {
                        label: "Lost",
                        value: data.lost?.count || 0,
                        percent: data.lost?.percent || "0.00%",
                        icon: ICONS["Lost"],
                    },
                    {
                        label: "Damaged",
                        value: data.damaged?.count || 0,
                        percent: data.damaged?.percent || "0.00%",
                        icon: ICONS["Damaged"],
                    },
                ];
                setSummaryData(mappedData);
            }
        } catch (err) {
            console.error("Fetch Order Summary Failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initialize = async () => {
            await fetchSummary();  // then fetch summary on initial load
        };
        initialize();
    }, []); // 🔹 run once when component mounts


    useEffect(() => {
        // 🔹 only refetch when filters, user, or date changes
        if (
            selectedDateRange?.[0]?.startDate &&
            selectedDateRange?.[0]?.endDate
        ) {
            fetchSummary();
        }
    }, [filters, refresh, selectedUserId, selectedDateRange]);


    return (
        <div className="w-full p-4 sm:mt-4 mt-2 border border-gray-300 rounded-lg bg-white overflow-hidden">
            <h2 className="sm:text-[18px] text-[14px] font-[600] mb-4 text-gray-700">
                Order Summary
            </h2>

            {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {summaryData.map((item, index) => (
                        <div
                            key={index}
                            onClick={handleShipmentClick}
                            className="flex flex-col justify-between rounded-lg p-4 shadow-sm border border-gray-200 hover:border-[#0CBB7D] cursor-pointer transition-all duration-700"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[16px] bg-[#0CBB7D] text-white">
                                    {item.icon}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 text-[12px]">
                                        <span className="font-semibold text-[18px] text-gray-700">
                                            {item.value}
                                        </span>
                                        {item.percent && (
                                            <span className="text-gray-400 text-[10px]">
                                                ({item.percent})
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[12px] text-gray-500">{item.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );


};

export default OrderSummary;
