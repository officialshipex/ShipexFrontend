import React from "react";

const Card = ({ title, subtitle, children }) => (
    <div className="bg-white rounded-lg border-gray-200 border shadow-sm p-4 space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="font-[600] text-[14px] text-gray-700">{title}</h2>
            {subtitle && <span className="text-[12px] text-gray-500">{subtitle}</span>}
        </div>
        {children}
    </div>
);

export default Card;
