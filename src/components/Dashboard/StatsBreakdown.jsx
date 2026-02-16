import React from "react";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const formatGrowth = (value) => {
    const isPositive = value >= 0;
    const Icon = isPositive ? FiTrendingUp : FiTrendingDown;
    const color = isPositive ? "text-green-500" : "text-red-500";
    return (
        <span className={`flex items-center gap-1 ${color}`}>
            <Icon className="inline text-sm" />
            {Math.abs(value)}%
        </span>
    );
};

const StatsBreakdown = ({ stats = {} }) => (
    <div className="mt-4 text-xs text-gray-600 space-y-2">
        <div className="flex justify-between">
            <span>This week (vs last week)</span>
            <span className="flex gap-1 items-center">
                {stats.weekCount || 0}
                {formatGrowth(stats.weekGrowth || 0)}
            </span>
        </div>
        <div className="flex justify-between">
            <span>This month (vs last month)</span>
            <span className="flex gap-1 items-center">
                {stats.monthCount || 0}
                {formatGrowth(stats.monthGrowth || 0)}
            </span>
        </div>
        <div className="flex justify-between">
            <span>This quarter (vs last quarter)</span>
            <span className="flex gap-1 items-center">
                {stats.quarterCount || 0}
                {formatGrowth(stats.quarterGrowth || 0)}
            </span>
        </div>
    </div>
);

export default StatsBreakdown;
