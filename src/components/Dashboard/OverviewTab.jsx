import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "./Card";
import StatsBreakdown from "./StatsBreakdown";
import { FiPackage, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";
import OverviewMiddleSection from "./OverviewMiddleSection";
import OverviewGraphSection from "./OverviewGraphSection";
import OverviewCardSection from "./OverviewCardSection";
import Loader from "../../Loader";
import RevenueBreakdown from "./RevenueBreakdown";
import Cookies from "js-cookie";

const OverviewTab = ({ refresh, selectedUserId, selectedDateRange }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        const fetchInsights = async () => {
            setLoading(true);
            const token = Cookies.get("session");

            // Get current date (YYYY-MM-DD)
            const today = new Date()

            try {
                const response = await axios.get(
                    `${REACT_APP_BACKEND_URL}/dashboard/getBusinessInsights`,
                    {
                        params: {
                            ...(selectedUserId && { userId: selectedUserId }),
                            date: today,  // 👈 sending current date
                        },
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                console.log("business insights", response.data.data);

                if (response.data.success) {
                    setInsights(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch business insights", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, [refresh, selectedUserId, selectedDateRange]);


    const renderSkeletonCard = () => (
        <div className="bg-gray-100 rounded-lg p-4 animate-pulse h-[130px]" />
    );

    const GrowthIndicator = ({ value }) => {
        const numeric = parseFloat(value);
        const isPositive = numeric >= 0;
        const Icon = isPositive ? FiTrendingUp : FiTrendingDown;
        const color = isPositive ? "text-green-500" : "text-red-500";

        return (
            <p className={`text-[10px] sm:text-[12px] ${color} flex items-center gap-1`}>
                <Icon className="inline" />
                {Math.abs(numeric)}%
                <br />
                <span className="text-gray-500">vs previous</span>
            </p>
        );
    };



    return (
        <>
            {loading && (
                <div className="flex justify-center items-center py-4">
                    <Loader />
                </div>
            )}

            {/* Top Insight Cards */}
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {loading || !insights ? (
                    Array(3).fill(0).map((_, index) => (
                        <div key={index}>{renderSkeletonCard()}</div>
                    ))
                ) : (
                    <>
                        {/* Business Insight Card */}
                        <Card title="Business Insights" subtitle="Last 30 days">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#0CBB7D] p-2 rounded-lg text-white text-[14px]">
                                        <FiPackage />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-[600] text-gray-700">
                                            {insights.avgDailyOrders}
                                        </p>
                                        <p className="text-[12px] text-gray-500">
                                            Average Daily Orders
                                        </p>
                                    </div>
                                </div>
                                <GrowthIndicator value={insights.growthOrders} />
                            </div>

                            <div className="flex justify-between items-center mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#0CBB7D] p-2 rounded-lg text-white text-[14px]">
                                        <RiMoneyRupeeCircleLine />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-[600] text-gray-700">
                                            ₹{insights.avgOrderValue}
                                        </p>
                                        <p className="text-[12px] text-gray-500">
                                            Average Order Value
                                        </p>
                                    </div>
                                </div>
                                <GrowthIndicator value={insights.growthValue} />
                            </div>
                        </Card>

                        {/* Today's Orders */}
                        <Card title="Today's Orders">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#0CBB7D] p-2 rounded-lg text-white text-[14px]">
                                        <FiPackage />
                                    </div>
                                    <p className="text-[14px] font-[600] text-gray-700">
                                        {insights.todayOrderCount}
                                    </p>
                                </div>
                                <GrowthIndicator value={insights.todayGrowthOrders} />
                            </div>
                            <StatsBreakdown stats={insights.statsBreakdown} />
                        </Card>

                        {/* Today's Revenue */}
                        <Card title="Today's Order Value">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#0CBB7D] p-2 rounded-lg text-white text-[14px]">
                                        <RiMoneyRupeeCircleLine />
                                    </div>
                                    <p className="text-[14px] font-[600] text-gray-700">
                                        ₹{Number(insights.todayOrderValue || 0).toFixed(2)}
                                    </p>

                                </div>
                                <GrowthIndicator value={insights.todayGrowthValue} />
                            </div>
                            <RevenueBreakdown valueBreakdown={insights.valueBreakdown} />
                        </Card>
                    </>
                )}
            </div>

            {/* Bottom Sections */}
            {!loading && insights && (
                <>
                    <OverviewMiddleSection selectedUserId={selectedUserId} selectedDateRange={selectedDateRange} />
                    <OverviewGraphSection selectedUserId={selectedUserId} selectedDateRange={selectedDateRange} />
                    <OverviewCardSection selectedUserId={selectedUserId} selectedDateRange={selectedDateRange} />
                </>
            )}
        </>
    );
};

export default OverviewTab;
