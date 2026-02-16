import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from "js-cookie";

const OverviewCardSection = ({ selectedUserId, selectedDateRange }) => {
    const [dashdata, setDashData] = useState({
        ordersByZone: [],
        revenueStats: {},
        weightSplit: [],
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = Cookies.get("session");
                // ✅ Build query parameters dynamically
                const params = {};

                if (selectedUserId) params.userId = selectedUserId;
                // console.log("selected date range", selectedDateRange)
                if (selectedDateRange && selectedDateRange.length > 0) {
                    params.startDate = new Date(selectedDateRange[0].startDate);
                    params.endDate = new Date(selectedDateRange[0].endDate);
                }
                const res = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/dashboard/getOverviewCardData`,
                    {
                        params,
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                console.log("responsedata", res.data)
                if (res.data.success) {
                    setDashData(res.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            }
        };
        fetchData();
    }, [selectedDateRange]);

    const getZonePercentage = (label) => {
        const zone = dashdata?.ordersByZone?.find((z) => z.zone === label);
        return zone?.percentage || 0;
    };

    const shipmentsData = [
        { label: 'Zone A', value: getZonePercentage('zoneA') },
        { label: 'Zone B', value: getZonePercentage('zoneB') },
        { label: 'Zone C', value: getZonePercentage('zoneC') },
        { label: 'Zone D', value: getZonePercentage('zoneD') },
        { label: 'Zone E', value: getZonePercentage('zoneE') },
    ];

    const revenueData = [
        { label: 'Last 90 Days', value: `₹${dashdata.orderValueStats?.last90Days || 0}` },
        { label: 'This Week', value: `₹${dashdata.orderValueStats?.thisWeek || 0}` },
        { label: 'This Month', value: `₹${dashdata.orderValueStats?.thisMonth || 0}` },
        { label: 'This Quarter', value: `₹${dashdata.orderValueStats?.thisQuarter || 0}` },
    ];

    const weightSplitData = dashdata.weightSplit || [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 my-2">
            {/* Shipments - Zone Distribution */}
            <div className="bg-white p-4 text-gray-700 shadow-sm border rounded-lg">
                <p className="text-[14px] font-[600] mb-4">Shipments - Zone Distribution</p>
                <ul>
                    {shipmentsData.map((zone, index) => (
                        <li
                            key={index}
                            className="flex justify-between p-2 text-gray-500 border-b text-[12px] sm:text-[14px]"
                        >
                            <span>{zone.label}</span>
                            <span className="font-[600] text-gray-700 text-[14px]">
                                {zone.value}%
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Revenue */}
            <div className="bg-white p-4 text-gray-700 shadow-sm border rounded-lg">
                <p className="text-[14px] font-[600] mb-4">Order Value</p>
                <ul>
                    {revenueData.map((rev, index) => (
                        <li
                            key={index}
                            className="flex justify-between p-2 text-gray-500 border-b text-[14px]"
                        >
                            <span>{rev.label}</span>
                            <span className="font-[600] text-gray-700 text-[14px]">{rev.value}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Shipment Split by Weight */}
            <div className="bg-white p-4 text-gray-700 shadow-sm border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-[14px] font-[600]">Shipment Split by Weight</p>
                    {/* <span className="text-[10px] sm:text-[12px] text-gray-500">Last 30 days</span> */}
                </div>

                <ul className="space-y-2">
                    {weightSplitData.map((item, idx) => {
                        const colors = ["bg-[#0CBB7D]", "bg-blue-500", "bg-yellow-500", "bg-red-400", "bg-indigo-500", "bg-pink-500"];
                        const color = colors[idx % colors.length];

                        return (
                            <li
                                key={idx}
                                className="flex justify-between items-center text-[14px] text-gray-700"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center">
                                        <span className={`w-2.5 h-2.5 ${color} rounded-lg`} />
                                    </span>
                                    {item.range}
                                </div>
                                <span className="px-2 py-1 text-[12px] rounded-lg bg-gray-100 text-gray-500 font-[600]">
                                    {item.count}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default OverviewCardSection;
