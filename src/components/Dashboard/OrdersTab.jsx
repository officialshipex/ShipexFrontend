import React, { useState } from "react";
import Filters from "./Filters";
import OrderSummary from "./OrderSummary";
import OrdersGraphSection from "./OrdersGraphSection";
import OrdersLast10DaysChart from "./OrdersLast10DaysChart";

const OrdersTab = ({refresh,selectedUserId,selectedDateRange}) => {
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
    <div className="w-full overflow-x-hidden">
      {/* Filter controls */}
      <Filters filters={filters} setFilters={setFilters} />

      {/* Order summary cards */}
      <OrderSummary filters={filters} selectedUserId={selectedUserId} refresh={refresh} selectedDateRange={selectedDateRange} />

      {/* Orders over last 10/20 days (line chart) */}
      {/* <OrdersLast10DaysChart /> */}

      {/* Pie charts: Courier, Zone, Payment */}
      <OrdersGraphSection filters={filters} selectedUserId={selectedUserId} refresh={refresh} selectedDateRange={selectedDateRange}/>
    </div>
  );
};

export default OrdersTab;
