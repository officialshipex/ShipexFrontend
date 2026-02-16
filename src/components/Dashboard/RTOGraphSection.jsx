import React, { useEffect, useState } from 'react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from 'recharts';
import axios from 'axios';
import { FiPieChart } from "react-icons/fi";
import Cookies from "js-cookie";

const outerRadius = 70;

const COLORS = {
    'Delhivery': '#8884d8',
    'Ecom Express': '#8dd1e3',
    'ShreeMaruti': "#82ca9D",
    'Amazon Shipping': '#82ca9d',
    'Dtdc': '#0CBB7D',
    'Bluedart': '#ffc658',
    'COD': '#ffc658',
    'Prepaid': '#0CBB7D',
    'zoneA': '#0088FE',
    'zoneB': '#00C49F',
    'zoneC': '#FFBB28',
    'zoneD': '#0CBB7D',
    'zoneE': '#D0ED57',
};

const RTOGraphSection = ({ selectedUserId, filters = {}, refresh, selectedDateRange }) => {
    const [graphData, setGraphData] = useState({
        couriersSplit: [],
        paymentMode: [],
        zone: [],
    });

    const fetchRTOGraphData = async () => {
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
                `${process.env.REACT_APP_BACKEND_URL}/dashboard/getRTOGraphsData`,
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
                const { couriersSplit, paymentMode, zone } = response.data.data;
                setGraphData({ couriersSplit, paymentMode, zone });
            }
        } catch (error) {
            console.error("Error fetching RTO graph data:", error.message);
        }
    };

    useEffect(() => {
        fetchRTOGraphData();
    }, [selectedUserId, filters, refresh, selectedDateRange]);

    // 🧩 Normalize and merge courier names
    const mapCourierName = (name) => {
        const normalized = name?.trim()?.toLowerCase().replace(/\s+/g, '');
        if (normalized === 'smartship') return 'Bluedart';
        if (normalized === 'dtdc') return 'Dtdc';
        if (normalized === 'amazon' || normalized === 'amazonshipping') return 'Amazon Shipping';
        return name;
    };

    // 🧩 Merge duplicate courier names and sum their values
    const processChartData = (data = []) => {
        const normalizedData = data.map(item => ({
            ...item,
            name: mapCourierName(item.name),
        }));

        return normalizedData.reduce((acc, curr) => {
            const existing = acc.find(i => i.name === curr.name);
            if (existing) {
                existing.value += curr.value;
            } else {
                acc.push({ ...curr });
            }
            return acc;
        }, []);
    };

    const graphs = [
        { title: 'Couriers Split', data: processChartData(graphData.couriersSplit) },
        { title: 'Payment Mode', data: processChartData(graphData.paymentMode) },
        { title: 'Zone Distribution', data: processChartData(graphData.zone || []) },
    ];

    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
            {graphs.map((chart, index) => (
                <div
                    key={index}
                    className="bg-white text-gray-700 p-4 rounded-lg shadow-sm border border-gray-300 flex flex-col justify-between"
                >
                    <div className='flex justify-between items-center mb-2'>
                        <p className="text-[14px] font-semibold">{chart.title}</p>
                    </div>

                    {chart.data.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-[200px] text-center text-gray-400">
                            <FiPieChart className="text-4xl mb-2" />
                            <p className="text-sm">No data available to display</p>
                        </div>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart key={chart.title + JSON.stringify(chart.data)}>
                                    <Pie
                                        data={chart.data}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        innerRadius={60}
                                        paddingAngle={2}
                                        stroke="#fff"
                                    >
                                        {chart.data.map((entry, i) => (
                                            <Cell
                                                key={`cell-${i}`}
                                                fill={COLORS[entry.name] || '#ccc'}
                                            />
                                        ))}
                                    </Pie>

                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            color: 'black',
                                            borderRadius: '6px',
                                            border: '1px solid #ccc',
                                            padding: '5px 9px',
                                            fontSize: '13px',
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: '10px' }}
                                        formatter={(value) => (
                                            <span style={{ color: '#2d054b' }}>{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default RTOGraphSection;
