import React, { useState } from "react";

const CustomReport = ({isOpen,onClose}) => {
  const [reportType, setReportType] = useState("");
  const [dateRange, setDateRange] = useState("");

  const handleGenerate = () => {
    console.log({ reportType, dateRange });
    // Add logic to handle report generation
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white w-full sm:w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl sm:text-lg font-semibold text-[#2d054b]">Custom Report</h2>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[#2d054b] mb-2">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-[#2d054b] focus:outline-none focus:ring-1 focus:ring-[#E8CAFE]"
          >
            <option value="">Select Report Type</option>
            <option value="order_report">Order Report</option>
            <option value="ndr_report">NDR Report</option>
            <option value="delayed_pickup_orders_report">Delayed Pickup Orders Report</option>
            <option value="shipments_report">Shipments Report</option>
            <option value="cod_remittance_report">COD Remittance Report</option>
            <option value="rto_shipments_statistics">RTO Shipments Statistics</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#2d054b] mb-2">Date Range</label>
          <input
            type="text"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            placeholder="DD/MM/YYYY - DD/MM/YYYY"
            className="w-full border rounded-md px-3 py-2 text-[#2d054b] focus:outline-none focus:ring-1 focus:ring-[#E8CAFE]"
          />
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#2d054b] bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 text-white bg-[#E8CAFE] rounded-md hover:bg-[#D7A9FF] focus:outline-none"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomReport;
