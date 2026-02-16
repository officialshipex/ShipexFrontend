import React from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

// Generate 20 days of sample data
const generateLast20DaysData = () => {
    const data = [];
    const today = new Date();
    for (let i = 19; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        data.push({
            date: date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
            }),
            orders: Math.floor(Math.random() * 50 + 10),
        });
    }
    return data;
};

const OrdersLast10DaysChart = () => {
    const data = generateLast20DaysData();

    return (
        <div className="bg-white rounded-lg shadow-md w-full mt-4">
            <h2 className="sm:text-[18px] text-[14px] font-[600] text-gray-700 px-4 pt-4">
                Orders in Last 20 Days
            </h2>

            <div className="w-full px-4 pb-4">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="orders"
                            stroke="#0CBB7D"
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

};

export default OrdersLast10DaysChart;
