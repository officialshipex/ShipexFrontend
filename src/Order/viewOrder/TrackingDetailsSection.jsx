import React from "react";
import { Activity } from "lucide-react";

const TrackingDetailsSection = ({ tracking }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm sticky top-34 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <p className="p-2 bg-green-100 hidden sm:block rounded-full">
                    <Activity className="w-4 h-4 text-[#0CBB7D]" />
                </p>

                <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                    Tracking Details
                </h2>
            </div>

            <div className="overflow-y-auto flex-1 pr-2">
                <div className="space-y-4">
                    {tracking && tracking.length > 0 ? (
                        [...new Map(
                            tracking
                                .filter(item => item.Instructions && item.StatusDateTime)
                                .reverse()
                                .map(item => [item.StatusDateTime, item])
                        ).values()].map((item, index, filteredArray) => (
                            <div key={index} className="relative flex gap-3">

                                {/* DATE & TIME (LEFT) */}
                                <div className="w-[90px]">
                                    {(() => {
                                        const date = new Date(item.StatusDateTime);

                                        const day = String(date.getUTCDate()).padStart(2, "0");
                                        const month = date.toLocaleString("en-US", {
                                            month: "short",
                                            timeZone: "UTC",
                                        });
                                        const year = date.getUTCFullYear();

                                        let hours = date.getUTCHours();
                                        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
                                        const amPm = hours >= 12 ? "PM" : "AM";
                                        hours = hours % 12 || 12;

                                        return (
                                            <>
                                                <p className="text-[10px] sm:text-[12px] font-[600] text-gray-700">
                                                    {day} {month} {year}
                                                </p>
                                                <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                                                    {hours}:{minutes} {amPm}
                                                </p>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* TIMELINE (MIDDLE) */}
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-500 z-10" />
                                    {index !== filteredArray.length - 1 && (
                                        <div className="w-0.5 flex-1 bg-green-500 mt-1" />
                                    )}
                                </div>

                                {/* ACTIVITY & LOCATION (RIGHT) */}
                                <div className="flex-1 text-[10px] sm:text-[12px] pb-2">
                                    <p className="font-[600] text-gray-500">
                                        <span className="text-gray-700">
                                            Activity:
                                        </span>{" "}
                                        {item.Instructions}
                                    </p>

                                    {item.StatusLocation && (
                                        <p className="text-gray-500 mt-1">
                                            <span className="font-[600] text-gray-700">
                                                Location:
                                            </span>{" "}
                                            {item.StatusLocation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 text-[12px] py-8">
                            No tracking information available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingDetailsSection;
