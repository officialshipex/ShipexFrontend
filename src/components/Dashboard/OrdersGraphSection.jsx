import React, { useEffect, useState } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from "recharts";
import axios from "axios";
import { FiPieChart } from "react-icons/fi";
import Cookies from "js-cookie";

const outerRadius = 70;

const COLORS = {
    Delhivery: "#8884d8",
    "Ecom Express": "#8dd1e3",
    ShreeMaruti: "#82ca9D",
    "Amazon Shipping": "#82ca9d",
    Amazon: "#82ca9d",
    Dtdc: "#0CBB7D",
    DTDC: "#0CBB7D",
    Bluedart: "#ffc658",
    COD: "#ffc658",
    Prepaid: "#0CBB7D",
    zoneA: "#0088FE",
    zoneB: "#00C49F",
    zoneC: "#FFBB28",
    zoneD: "#0CBB7D",
    zoneE: "#D0ED57",
};

const OrdersGraphSection = ({ selectedUserId, filters = {}, refresh, selectedDateRange }) => {
    const [graphData, setGraphData] = useState({
        couriersSplit: [],
        paymentMode: [],
        zone: [],
    });

    const fetchOverviewData = async () => {
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
                `${process.env.REACT_APP_BACKEND_URL}/dashboard/getOrdersGraphsData`,
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
            console.error("Error fetching graph data:", error.message);
        }
    };

    useEffect(() => {
        fetchOverviewData();
    }, [selectedUserId, filters, refresh, selectedDateRange]);

    /** --- Normalization Utilities --- **/

    // Lowercase + remove non-alphanumeric for stable comparison
    const normalizeKey = (name = "") =>
        name.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    // Canonical name mapping
    const canonicalMap = {
        smartship: "Bluedart",
        bluedart: "Bluedart",
        dtdc: "Dtdc",
        dt_dc: "Dtdc",
        amazon: "Amazon Shipping",
        amazonshipping: "Amazon Shipping",
        "amazonshippingindia": "Amazon Shipping",
        ecomexpress: "Ecom Express",
        delhivery: "Delhivery",
        shreemaruti: "ShreeMaruti",
        "shree maruti": "ShreeMaruti",
    };

    const mapCourierName = (rawName) => {
        const key = normalizeKey(rawName);
        if (canonicalMap[key]) return canonicalMap[key];
        return rawName ? String(rawName).trim() : "Unknown";
    };

    // Merge duplicate courier names and sum their numeric values
    const processChartData = (data) => {
        if (!Array.isArray(data)) return [];

        const merged = new Map();

        for (const item of data) {
            const rawName = item?.name ?? "";
            const canonical = mapCourierName(rawName);
            const val = Number(item?.value ?? item?.count ?? 0);
            const numericValue = Number.isFinite(val) ? val : 0;

            if (merged.has(canonical)) {
                merged.get(canonical).value += numericValue;
            } else {
                merged.set(canonical, { name: canonical, value: numericValue });
            }
        }

        // Convert back to array, filter 0s, and sort
        return Array.from(merged.values())
            .filter((d) => d.value > 0)
            .sort((a, b) => b.value - a.value);
    };

    const graphs = [
        { title: "Couriers Split", data: processChartData(graphData.couriersSplit) },
        { title: "Payment Mode", data: processChartData(graphData.paymentMode) },
        { title: "Zone Distribution", data: processChartData(graphData.zone || []) },
    ];

    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
            {graphs.map((chart, index) => (
                <div
                    key={index}
                    className="bg-white text-gray-700 p-4 rounded-lg shadow-sm border border-gray-300 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-center mb-2">
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
                                                fill={COLORS[entry.name] || "#ccc"}
                                            />
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
                    )}
                </div>
            ))}
        </div>
    );
};

export default OrdersGraphSection;
