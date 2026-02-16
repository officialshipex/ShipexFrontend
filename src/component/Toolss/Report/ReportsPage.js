import React, { useState, useEffect, use } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import the CSS for the date picker
import { useNavigate } from "react-router-dom";
import CustomReport from "./Custom report/Customreport"
import MyPresentReport from "./My Present report/myPresentReport"
import PresentReport from "./Present Report/PresentReport"

const ReportsPage = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reportType, setReportType] = useState("");
  const [generationType, setGenerationType] = useState("");
  const [reports, setReports] = useState([]); // Store reports data here
  // const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomReportOpen, setIsCustomReportOpen] = useState(false);
  const [isPresetReportOpen, setIsPresetReportOpen] = useState(false);
  const [isMyPresetReportsOpen, setIsMyPresetReportsOpen] = useState(false);

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };

  const handleGenerationTypeChange = (e) => {
    setGenerationType(e.target.value);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      const start = startDate;
      const end = endDate;

      const formattedStart = `${start.getDate().toString().padStart(2, "0")}-${(
        start.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${start.getFullYear()}`;
      const formattedEnd = `${end.getDate().toString().padStart(2, "0")}-${(
        end.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${end.getFullYear()}`;

      return `${formattedStart} - ${formattedEnd}`;
    }
    return ""; // Return an empty string if no dates are selected
  };

  const fetchReports = () => {
    // Simulate fetching updated data based on filters (this can be an API call)
    const fetchedReports = [
      {
        generatedOn: "2025-01-01",
        title: "Order Report",
        type: "order_report",
        user: "Admin",
        dateRange: formatDateRange(),
        generationType: generationType || "Custom",
      },
      {
        generatedOn: "2025-01-02",
        title: "NDR Report",
        type: "ndr_report",
        user: "User",
        dateRange: formatDateRange(),
        generationType: generationType || "Scheduled",
      },
    ];

    // Filter fetched reports based on selected filters
    const filteredReports = fetchedReports.filter((report) => {
      const matchesDateRange =
        startDate && endDate
          ? new Date(report.generatedOn) >= startDate &&
            new Date(report.generatedOn) <= endDate
          : true; // No date filtering if no date range is set

      return (
        (reportType === "" || report.type === reportType) &&
        (generationType === "" || report.generationType === generationType) &&
        matchesDateRange
      );
    });

    setReports(filteredReports);
  };


  useEffect(() => {
    fetchReports();
  }, [reportType, generationType, startDate, endDate]); // Re-fetch data when filters change

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D054B]">Reports</h1>
          <p className="text-[#2D054B]">
            Home &gt; <span className="text-[#2D054B]">Reports</span>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 mt-4 lg:mt-0 justify-center lg:justify-end">
          <button
            onClick={() => setIsCustomReportOpen(true)}
            className="bg-[#EDCAFE] text-white px-4 py-2 rounded-md hover:bg-[#EDCAFE] transition mb-4 sm:mb-0"
          >
            Custom Report
          </button>
          <button  onClick={() => setIsPresetReportOpen(true)} className="bg-[#EDCAFE] text-white px-4 py-2 rounded-md hover:bg-[#EDCAFE] transition mb-4 sm:mb-0">
            Preset Report
          </button>
          <button onClick={() => setIsMyPresetReportsOpen(true)} className="bg-[#EDCAFE] text-white px-4 py-2 rounded-md hover:bg-[#EDCAFE] transition mb-4 sm:mb-0">
            My Preset Reports
          </button>
        </div>
      </div>

      {/* Filters and Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white shadow-md p-4 rounded-lg mb-6 space-y-4 lg:space-y-0">
        {/* Dropdown Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 w-full">
          <select
            className="border border-gray-300 rounded-md p-2 text-[#2D054B] w-full lg:w-auto"
            value={reportType}
            onChange={handleReportTypeChange}
          >
            <option value="">Select Report Type</option>
            <option value="order_report">Order report</option>
            <option value="ndr_report">Ndr report</option>
            <option value="delayed_pickup_orders_report">
              Delayed pickup orders report
            </option>
            <option value="shipments_report">Shipments report</option>
            <option value="cod_remittance_report">COD remittance report</option>
            <option value="rto_shipments_statistics">
              RTO shipments statistics
            </option>
          </select>
          <select
            className="border border-gray-300 rounded-md p-2 text-[#2D054B] w-full lg:w-auto"
            value={generationType}
            onChange={handleGenerationTypeChange}
          >
            <option value="">Select Report Generation Type</option>
            <option value="custom">Custom</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        {/* Date Range Input */}
        <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4 w-full">
          <DatePicker
            selected={startDate}
            onChange={handleStartDateChange}
            dateFormat="dd-MM-yyyy"
            className="border border-gray-300 rounded-md p-1 text-[#2D054B] w-full lg:w-auto"
            placeholderText="Select Start Date"
          />
          <span className="text-[#2D054B]">to</span>
          <DatePicker
            selected={endDate}
            onChange={handleEndDateChange}
            dateFormat="dd-MM-yyyy"
            className="border border-gray-300 rounded-md p-1 text-[#2D054B] w-full lg:w-auto"
            placeholderText="Select End Date"
          />
        </div>
      </div>

      {/* Report Display */}
      <div className="space-y-4">
        {/* Table Header in a Card */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <div className="font-bold text-[#2D054B]">Report Generated on</div>
            <div className="font-bold text-[#2D054B]">Title</div>
            <div className="font-bold text-[#2D054B]">Report Type</div>
            <div className="font-bold text-[#2D054B]">User</div>
            <div className="font-bold text-[#2D054B]">Report Date Range</div>
            <div className="font-bold text-[#2D054B]">
              Report Generation Type
            </div>
            <div className="font-bold text-[#2D054B]">Action</div>
          </div>
        </div>

        {/* Display Reports */}
        {reports.length === 0 ? (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-center text-[#2D054B]">No Reports found.</p>
          </div>
        ) : (
          reports.map((report, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                <div>{report.generatedOn}</div>
                <div>{report.title}</div>
                <div>{report.type}</div>
                <div>{report.user}</div>
                <div>{report.dateRange}</div>
                <div>{report.generationType}</div>
                <div>
                  <button className="text-[#E8CAFE]">View</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-[#2D054B]">
        <p className="text-sm">Showing 0 to 0 of 0 Reports</p>
        <div className="flex items-center space-x-2">
          <button className="border border-gray-300 text-[#2D054B] px-3 py-1 rounded-md hover:bg-gray-100">
            &lt;
          </button>
          <button className="border border-gray-300 text-[#2D054B] px-3 py-1 rounded-md hover:bg-gray-100">
            1
          </button>
          <button className="border border-gray-300 text-[#2D054B] px-3 py-1 rounded-md hover:bg-gray-100">
            &gt;
          </button>
        </div>
      </div>
      <CustomReport isOpen={isCustomReportOpen} onClose={() => setIsCustomReportOpen(false)} />
      <MyPresentReport isOpen={isMyPresetReportsOpen} onClose={() => setIsMyPresetReportsOpen(false)} />
      <PresentReport isOpen={isPresetReportOpen} onClose={() => setIsPresetReportOpen(false)} />
    </div>
  );
};

export default ReportsPage;
