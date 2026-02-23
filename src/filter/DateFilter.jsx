import React, { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import dayjs from "dayjs";
import { DateRange } from "react-date-range";

const DateFilter = ({ onDateChange, clearTrigger, noInitialFilter }) => {
    const dateRef = useRef(null);
    const [showCustom, setShowCustom] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dateButtonRef = useRef(null);
    const calendarRef = useRef(null);
    const [popupPosition, setPopupPosition] = useState("left-0");

    const initialDateRange = [
        {
            startDate: dayjs().subtract(6, "day").startOf("day").toDate(),
            endDate: dayjs().endOf("day").toDate(),
            key: "selection",
        },
    ];


    const [dateRange, setDateRange] = useState(initialDateRange);

    const [tempDateRange, setTempDateRange] = useState(initialDateRange);

    useEffect(() => {
        setDateRange(initialDateRange);
        setTempDateRange(initialDateRange);
    }, [clearTrigger]);

    // ✅ Dynamic Positioning for Custom Calendar
    React.useLayoutEffect(() => {
        if (showCustom && dateRef.current) {
            const rect = dateRef.current.getBoundingClientRect();
            const dropdownWidth = 350; // Approximate approx width of the calendar
            const spaceRight = window.innerWidth - rect.left;

            if (spaceRight < dropdownWidth) {
                setPopupPosition("right-0");
            } else {
                setPopupPosition("left-0");
            }
        }
    }, [showCustom]);

    const dateOptions = [
        {
            label: "Today",
            range: () => ({
                startDate: dayjs().startOf("day").toDate(),
                endDate: dayjs().endOf("day").toDate(),
            }),
        },
        {
            label: "Yesterday",
            range: () => ({
                startDate: dayjs().subtract(1, "day").startOf("day").toDate(),
                endDate: dayjs().subtract(1, "day").endOf("day").toDate(),
            }),
        },
        {
            label: "Last 7 Days",
            range: () => ({
                startDate: dayjs().subtract(6, "day").startOf("day").toDate(),
                endDate: dayjs().endOf("day").toDate(),
            }),
        },
        {
            label: "This Month",
            range: () => ({
                startDate: dayjs().startOf("month").toDate(),
                endDate: dayjs().endOf("day").toDate(),
            }),
        },
        {
            label: "Last Month",
            range: () => ({
                startDate: dayjs().subtract(1, "month").startOf("month").toDate(),
                endDate: dayjs().subtract(1, "month").endOf("month").toDate(),
            }),
        },
        {
            label: "This Year",
            range: () => ({
                startDate: dayjs().startOf("year").toDate(),
                endDate: dayjs().endOf("day").toDate(),
            }),
        },
        { label: "Custom", custom: true },
    ];

    useEffect(() => {
        if (!noInitialFilter) {
            onDateChange && onDateChange(initialDateRange);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // ✅ Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateRef.current && !dateRef.current.contains(event.target)) {
                setShowDropdown(false);
                setShowCustom(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDateOptionClick = (option) => {
        if (option.custom) {
            setTempDateRange([...dateRange]);
            setShowDropdown(false);
            requestAnimationFrame(() => setShowCustom(true));
        } else {
            const range = option.range();
            const newRange = [
                {
                    startDate: new Date(range.startDate),
                    endDate: new Date(range.endDate),
                    key: "selection",
                },
            ];
            setDateRange(newRange);
            setShowDropdown(false);
            setShowCustom(false);
            onDateChange && onDateChange(newRange); // ✅ pass to parent
        }
    };

    return (
        <div className="">
            <div className="relative sm:w-[200px] w-full" ref={dateRef}>
                {/* Button */}
                <button
                    className={`w-full bg-white py-2 px-3 sm:text-[12px] text-[10px] font-[600] border rounded-lg focus:outline-none text-left flex items-center justify-between text-gray-400 ${showDropdown ? "border-[#0CBB7D]" : "border-gray-300"}`}
                    onClick={() => {
                        if (showCustom) {
                            setShowDropdown(false);
                            setShowCustom(false);
                        } else {
                            setShowDropdown((prev) => !prev);
                            setShowCustom(false);
                        }
                    }}
                    ref={dateButtonRef}
                >
                    <span>
                        {dateRange?.[0]?.startDate && dateRange?.[0]?.endDate
                            ? `${dayjs(dateRange[0].startDate).format("DD/MM/YYYY")} - ${dayjs(
                                dateRange[0].endDate
                            ).format("DD/MM/YYYY")}`
                            : "Select Date"}

                    </span>
                    <Calendar
                        className={`w-4 h-4 ml-2 transition-colors ${showDropdown || showCustom ? "text-[#0CBB7D]" : "text-gray-400"}`}
                    />
                </button>

                {/* Dropdown */}
                {showDropdown && (
                    <div className="absolute w-full bg-white border rounded-lg shadow mt-1 z-[50] animate-popup-in">
                        <ul>
                            {dateOptions.map((option, idx) => (
                                <li
                                    key={idx}
                                    className="cursor-pointer hover:bg-green-100 px-3 py-2 sm:text-[12px] text-[10px] font-[600] text-gray-500"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDateOptionClick(option);
                                    }}
                                >
                                    {option.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Custom Calendar */}
                {showCustom && (
                    <div
                        className={`absolute top-[110%] bg-white border rounded shadow-sm p-3 z-[100] ${popupPosition}`}
                        ref={calendarRef}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DateRange
                            editableDateInputs={true}
                            onChange={(item) => setTempDateRange([item.selection])}
                            ranges={tempDateRange}
                            moveRangeOnFirstSelection={false}
                            showMonthAndYearPickers={false}
                            rangeColors={["#0CBB7D"]}
                            months={1}
                            direction="horizontal"
                            showDateDisplay={false}
                            className="custom-date-range text-[12px] font-[600] text-gray-500"
                        />

                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                className="bg-[#0CBB7D] text-white px-3 py-1 text-xs rounded"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDateRange(tempDateRange);
                                    setShowCustom(false);
                                    setShowDropdown(false);
                                    onDateChange && onDateChange(tempDateRange); // ✅ send to parent
                                }}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DateFilter;
