import React, { useState } from "react";
import Filters from "./Filters";
import RTOSummary from "./RTOSummary"
import RTOGraphSection from "./RTOGraphSection";

const RTOTab = ({refresh,selectedUserId,selectedDateRange}) => {
    const [filters, setFilters] = useState({
        dateRange: {
            startDate: null,
            endDate: null,
        },
        zone: "",
        courier: "",
        paymentMode: "",
    });

    return (
        <div>
            <Filters filters={filters} setFilters={setFilters} />
            <RTOSummary filters={filters} selectedUserId={selectedUserId} refresh={refresh} selectedDateRange={selectedDateRange} />
            <RTOGraphSection filters={filters} selectedUserId={selectedUserId} refresh={refresh} selectedDateRange={selectedDateRange} />
        </div>
    );
};

export default RTOTab;
