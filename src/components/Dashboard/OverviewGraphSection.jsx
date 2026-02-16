import React, { useEffect, useState, selectedDateRange } from 'react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from 'recharts';
import axios from 'axios';
import Cookies from "js-cookie";
import { FiPieChart } from "react-icons/fi";

const outerRadius = 100;

const COLORS = {
    'Delhivery': '#8884d8',
    'Ecom Express': '#8dd1e1',
    'Amazon Shipping': '#82ca9d',
    'Bluedart': '#ffc658',
    'Dtdc': '#0CBB7D',
    'COD': '#FF8042',
    'Prepaid': '#0CBB7D',
    'On-Time': '#0CBB7D',
    'Late': '#FF8042',
};

const OverviewGraphSection = ({ selectedUserId,selectedDateRange }) => {
    const [graphData, setGraphData] = useState({
        couriersSplit: [],
        paymentMode: [],
        deliveryPerformance: [],
    });

    const fetchOverviewData = async () => {
        try {
            const token = Cookies.get("session");
            const params = {};

            if (selectedUserId) params.userId = selectedUserId;
            console.log("selected date range", selectedDateRange)
            if (selectedDateRange && selectedDateRange.length > 0) {
                params.startDate = new Date(selectedDateRange[0].startDate);
                params.endDate = new Date(selectedDateRange[0].endDate);
            }
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/dashboard/getOverviewGraphsData`,
                {
                    params,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.data.success) {
                const {
                    couriersSplit,
                    paymentMode,
                    deliveryPerformance,
                } = response.data.data;

                setGraphData({
                    couriersSplit,
                    paymentMode,
                    deliveryPerformance:
                        deliveryPerformance.length > 0
                            ? deliveryPerformance
                            : [
                                { name: "On-Time", value: 80 },
                                { name: "Late", value: 20 },
                            ],
                });
            }
        } catch (error) {
            console.error("Error fetching overview graph data:", error.message);
        }
    };

    useEffect(() => {
        fetchOverviewData();
    }, [selectedUserId,selectedDateRange]);

    // Robust normalizer: trim, lowercase, remove non-alphanumeric
    const normalizeKey = (name = "") => {
        return name.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    };

    // Canonical mapping for noisy backend names
    const canonicalMap = {
        smartship: "Bluedart",
        bluedart: "Bluedart",
        dtdc: "Dtdc",
        dt_dc: "Dtdc",
        amazon: "Amazon Shipping",
        amazonshipping: "Amazon Shipping",
        "amazonshippingindia": "Amazon Shipping",
        "ecomexpress": "Ecom Express",
        delhivery: "Delhivery",
        shiprocket: "Shiprocket",
        nimbuspost: "NimbusPost",
        xpressbees: "Xpressbees",
        shree: "Shree Maruti", // example
        // add more mappings as you discover variants
    };

    const mapCourierName = (rawName) => {
        const key = normalizeKey(rawName);
        if (canonicalMap[key]) return canonicalMap[key];
        // fallback: try to preserve readable form: title-case the trimmed rawName
        const fallback = rawName ? String(rawName).trim() : "Unknown";
        return fallback;
    };

    // Process and merge duplicates by canonical name. Ensures numeric values.
    const processChartData = (data) => {
        if (!Array.isArray(data)) return [];

        // Debug: inspect raw backend data (uncomment while debugging)
        // console.log("raw chart data:", data);

        const merged = new Map(); // canonicalName -> { name, value }

        for (const item of data) {
            const rawName = item?.name ?? "";
            const canonical = mapCourierName(rawName);

            // coerce value to number; if missing or invalid treat as 0
            const val = Number(item?.value ?? item?.count ?? 0);
            const numericValue = Number.isFinite(val) ? val : 0;

            if (merged.has(canonical)) {
                merged.get(canonical).value += numericValue;
            } else {
                merged.set(canonical, { name: canonical, value: numericValue });
            }
        }

        // convert to array and filter out zero-values (optional)
        const mergedArray = Array.from(merged.values()).filter((d) => d.value > 0);

        // optional: sort descending so largest slices appear first
        mergedArray.sort((a, b) => b.value - a.value);

        return mergedArray;
    };

    const graphs = [
        { title: 'Couriers Split', data: processChartData(graphData.couriersSplit) },
        { title: 'Payment Mode', data: processChartData(graphData.paymentMode) },
        { title: 'Delivery Performance', data: processChartData(graphData.deliveryPerformance) },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 z-10">
            {graphs.map((chart, index) => (
                <div
                    key={index}
                    className="bg-white text-gray-700 border border-gray-200 p-3 md:p-5 rounded-lg shadow-sm flex flex-col justify-between"
                >
                    <div className='flex justify-between items-center'>
                        <p className="text-[14px] font-[600]">
                            {chart.title}
                        </p>
                        {/* <p className="text-[10px] sm:text-[12px] text-gray-500">Last 30 days</p> */}
                    </div>

                    {chart.data.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-[200px] md:h-[270px] text-center text-gray-500">
                            <FiPieChart className="text-4xl mb-2" />
                            <p className="text-[12px]">No data available to display</p>
                        </div>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chart.data}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={outerRadius}
                                        innerRadius={outerRadius - 40}
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

export default OverviewGraphSection;
