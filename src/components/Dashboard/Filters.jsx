import React, { useState, useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import { addDays, format } from "date-fns";
import { FiChevronDown } from "react-icons/fi";
import dayjs from "dayjs";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const CustomDropdown = ({ label, options, selected, setSelected }) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative min-w-[165px]" ref={dropdownRef}>
            <div
                className="cursor-pointer border border-gray-300 bg-white text-gray-500 px-3 py-2 text-[12px] rounded-lg flex justify-between items-center"
                onClick={() => setOpen(!open)}
            >
                <span>{selected || label}</span>
                <FiChevronDown className="ml-2 text-gray-500" />
            </div>
            {open && (
                <div className="absolute top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow w-full">
                    {options.map((option, index) => (
                        <div
                            key={index}
                            onClick={() => {
                                setSelected(option);
                                setOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-green-100 cursor-pointer text-[12px] text-gray-500"
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const FilterBar = ({ filters, setFilters }) => {
    const defaultDate = {
        startDate: addDays(new Date(), -30),
        endDate: new Date(),
    };

    const dateRef = useRef(null);
    const calendarRef = useRef(null);

    const [showDropdown, setShowDropdown] = useState(false);
    const [showCustom, setShowCustom] = useState(false);
    const [dateRange, setDateRange] = useState([
        {
            ...defaultDate,
            key: "selection",
        },
    ]);
    const [tempDateRange, setTempDateRange] = useState([
        {
            ...defaultDate,
            key: "selection",
        },
    ]);

    const handleDateApply = () => {
        const selected = tempDateRange[0];
        setDateRange(tempDateRange);
        setFilters((prev) => ({
            ...prev,
            dateRange: {
                startDate: format(selected.startDate, "yyyy-MM-dd"),
                endDate: format(selected.endDate, "yyyy-MM-dd"),
            },
        }));
        setShowCustom(false);
        setShowDropdown(false);
    };

    const clearFilters = () => {
        setFilters({
            dateRange: {
                startDate: format(defaultDate.startDate, "yyyy-MM-dd"),
                endDate: format(defaultDate.endDate, "yyyy-MM-dd"),
            },
            zone: "",
            courier: "",
            paymentMode: "",
        });
        setDateRange([{ ...defaultDate, key: "selection" }]);
        setTempDateRange([{ ...defaultDate, key: "selection" }]);
    };

    const dateOptions = [
        { label: "Today", range: [new Date(), new Date()] },
        { label: "Yesterday", range: [addDays(new Date(), -1), addDays(new Date(), -1)] },
        { label: "Last 7 Days", range: [addDays(new Date(), -6), new Date()] },
        { label: "Last 30 Days", range: [addDays(new Date(), -29), new Date()] },
        { label: "Custom", isCustom: true },
    ];

    const handleDateOptionClick = (option) => {
        if (option.isCustom) {
            setShowCustom(true);
            return;
        }

        const [start, end] = option.range;
        const updatedRange = {
            startDate: start,
            endDate: end,
            key: "selection",
        };

        setDateRange([updatedRange]);
        setTempDateRange([updatedRange]);

        setFilters((prev) => ({
            ...prev,
            dateRange: {
                startDate: format(start, "yyyy-MM-dd"),
                endDate: format(end, "yyyy-MM-dd"),
            },
        }));

        setShowDropdown(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedOutsideDate =
                dateRef.current && !dateRef.current.contains(event.target);
            const clickedOutsideCalendar =
                !calendarRef.current || !calendarRef.current.contains(event.target);

            if (clickedOutsideDate && clickedOutsideCalendar) {
                setShowDropdown(false);
                setShowCustom(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <div className="w-full rounded-lg flex flex-col sm:flex-row gap-2 items-center relative z-30">
            <div className="flex gap-2 w-full sm:w-auto">
                {/* Date Filter */}
                {/* <div className="relative w-full sm:w-[200px] sm:max-w-[225px] z-[20]" ref={dateRef}>
                    <button
                        className="w-full bg-white h-9 px-3 text-[10px] sm:text-[12px] font-semibold border border-gray-300 rounded-lg text-left flex items-center justify-between text-gray-500"
                        onClick={() => {
                            setShowDropdown((prev) => !prev);
                            setShowCustom(false);
                        }}
                    >
                        <span>
                            {dateRange[0].startDate && dateRange[0].endDate
                                ? `${dayjs(dateRange[0].startDate).format("DD/MM/YYYY")} - ${dayjs(
                                    dateRange[0].endDate
                                ).format("DD/MM/YYYY")}`
                                : "Select Date"}
                        </span>
                        <FiChevronDown
                            className={`w-4 h-4 ml-2 transform transition-transform ${showDropdown ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    {showDropdown && (
                        <div className="absolute w-full mt-1 bg-white border rounded-lg shadow p-2 z-[50] transition-all duration-300 ease-in-out">
                            <ul>
                                {dateOptions.map((option, idx) => (
                                    <li
                                        key={idx}
                                        className="cursor-pointer hover:bg-green-50 px-3 py-2 text-[12px] font-[500] text-gray-500"
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

                    
                    {showCustom && (
                        <div
                            className="absolute w-full bg-white border rounded shadow p-2 z-[60] transition-all duration-600 ease-in-out"
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
                                className="w-[240px] h-[260px] text-[12px] font-[600] text-gray-500 scale-[0.90] origin-top"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    className="bg-[#0CBB7D] text-white px-3 py-1 text-xs rounded"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDateApply();
                                    }}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div> */}

                {/* Other Filters */}
                <CustomDropdown
                    label="Zone"
                    options={["zoneA", "zoneB", "zoneC", "zoneD", "zoneE"]}
                    selected={filters.zone}
                    setSelected={(value) => setFilters((prev) => ({ ...prev, zone: value }))}
                />
            </div>
            <div className="flex gap-2 w-full justify-between">
                <div className="flex gap-2">
                    <CustomDropdown
                        label="Courier"
                        options={["Delhivery", "DTDC", "Ecom Express", "Amazon"]}
                        selected={filters.courier}
                        setSelected={(value) => setFilters((prev) => ({ ...prev, courier: value }))}
                    />
                    <CustomDropdown
                        label="Payment Mode"
                        options={["Prepaid", "COD"]}
                        selected={filters.paymentMode}
                        setSelected={(value) => setFilters((prev) => ({ ...prev, paymentMode: value }))}
                    />
                </div>

                {/* Clear Filters Button */}
                <button
                    onClick={clearFilters}
                    className="ml-auto px-3 py-2 text-[12px] border bg-[#0CBB7D] text-white rounded-lg hover:bg-green-500 transition-all"
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default FilterBar;
