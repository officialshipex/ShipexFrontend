import React, { useState } from "react";

const PresetReportPage = ({isOpen,onClose}) => {
  const [sendEmail, setSendEmail] = useState(false);
  const [showPage, setShowPage] = useState(true); // State to control page visibility

  if (!isOpen) return null;

  return (
    <div className="bg-gray-100 flex bg-opacity-50 justify-center inset-0 items-center px-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2
            className="text-lg font-semibold"
            style={{ color: "#2D054B" }}
          >
            Preset Report
          </h2>
          <button
            onClick={onClose} // Close page on click
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            style={{ fontSize: "1.5rem", lineHeight: "1" }} // Slightly larger cross
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          {/* Report Type */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "#2D054B" }}
            >
              Report Type
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:ring-1 focus:ring-[#E8CAFE]"
            >
              <option value="">Select Report Type</option>
              <option value="order-report">Order Report</option>
              <option value="ndr-report">NDR Report</option>
              <option value="shipments-records">Shipments Records</option>
              <option value="cod-remittance-reports">
                COD Remittance Reports
              </option>
              <option value="rto-shipments-statistics">
                RTO Shipments Statistics
              </option>
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "#2D054B" }}
            >
              Frequency
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:ring-1 focus:ring-[#E8CAFE]"
            >
              <option value="">Select Frequency Type</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Data Range */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "#2D054B" }}
            >
              Data Range
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 text-gray-700 focus:ring-1 focus:ring-[#E8CAFE]"
            >
              <option value="">Select Data Range</option>
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Email Checkbox */}
          <div
            className="flex items-center p-4 rounded-md shadow-md"
            style={{ backgroundColor: "#E8CAFE" }}
          >
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={() => setSendEmail(!sendEmail)}
              className="h-4 w-4 text-purple-600 border-gray-300 rounded"
            />
            <label
              htmlFor="sendEmail"
              className="ml-2 text-sm"
              style={{ color: "#2D054B" }}
            >
              Send the generated report to the registered email
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end sm:space-x-3 mt-6 space-y-3 sm:space-y-0">
          <button onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md"
            style={{
              backgroundColor: "#E8CAFE",
              color: "white",
            }}
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresetReportPage;
