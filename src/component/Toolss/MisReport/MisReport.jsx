import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";
import PaginationFooter from "../../../Common/PaginationFooter";
import UserFilter from "../../../filter/UserFilter";
import DateFilter from "../../../filter/DateFilter";
import ThreeDotLoader from "../../../Loader";
import dayjs from "dayjs";
import NoDataFound from "../../../Common/NoDataFound";

const PASSBOOK_DESCRIPTIONS = [
  "Freight Charges Applied",
  "Freight Charges Received",
  "Auto-accepted Weight Dispute charge",
  "Weight Dispute Charges Applied",
  "COD Charges Received",
  "RTO Freight Charges Applied",
  "Cancellation Refund",
  "Recharge From Gateway(Razorpay)",
  "Referral Commission Received"
];

const MisReportPage = ({ isSidebarAdmin }) => {
  const [reportType, setReportType] = useState("All");
  const [dateFilterType, setDateFilterType] = useState("Pickup Date");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [email, setEmail] = useState("");
  const [targetUserId, setTargetUserId] = useState(null);
  
  const [selectedDescriptions, setSelectedDescriptions] = useState([]);
  const [descDropdownOpen, setDescDropdownOpen] = useState(false);
  const descDropdownRef = useRef(null);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [clearTrigger, setClearTrigger] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (descDropdownRef.current && !descDropdownRef.current.contains(event.target)) {
        setDescDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [hoveredUser, setHoveredUser] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const [tableHeight, setTableHeight] = useState("calc(100vh - 260px)");
  const tableRef = useRef(null);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const updateHeight = () => {
      if (tableRef.current) {
        const top = tableRef.current.getBoundingClientRect().top;
        const remainingHeight = window.innerHeight - top - 60;
        setTableHeight(`${remainingHeight}px`);
      }
    };
    // Run after component mounts to get accurate coordinates
    const timer = setTimeout(updateHeight, 100);
    window.addEventListener("resize", updateHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("session");
      const res = await axios.get(`${REACT_APP_BACKEND_URL}/mis-report/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit,
          userSearch: targetUserId || ""
        }
      });
      setReports(res.data.results || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      Notification("Error loading reports", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, limit, targetUserId]);

  const handleGenerate = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (!fromDate || !toDate) {
      Notification("Please select a date range using the Date Filter", "error");
      return;
    }

    try {
      setSubmitting(true);
      const token = Cookies.get("session");
      const res = await axios.post(`${REACT_APP_BACKEND_URL}/mis-report/generate`, {
        reportType,
        dateFilterType: reportType === "Passbook" ? "Transaction Date" : dateFilterType,
        fromDate,
        toDate,
        email,
        userSearch: targetUserId,
        selectedDescriptions: reportType === "Passbook" ? selectedDescriptions : []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        Notification("Report generation started in background!", "success");
        setEmail("");
        fetchReports();
      }
    } catch (err) {
      Notification(err.response?.data?.message || "Generation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserSelect = (userId) => {
    setTargetUserId(userId);
    setPage(1);
  };

  const handleDateChange = (range) => {
    if (range && range[0]) {
      setFromDate(dayjs(range[0].startDate).toISOString());
      setToDate(dayjs(range[0].endDate).toISOString());
    } else {
      setFromDate("");
      setToDate("");
    }
  };

  const handleClearFilters = () => {
    setReportType("All");
    setDateFilterType("Pickup Date");
    setFromDate("");
    setToDate("");
    setEmail("");
    setTargetUserId(null);
    setSelectedDescriptions([]);
    setClearTrigger(prev => !prev);
    setPage(1);
  };

  return (
    <div className="sm:px-2 flex flex-col space-y-2">
      {/* Title */}
      <div>
        <h1 className="text-[12px] mb-2 sm:text-[14px] font-[600] text-gray-700">
          MIS Report Generator
        </h1>
        <p className="text-[10px] text-gray-500 font-[500] leading-none">
          Choose report type, date range, and generate.
        </p>
      </div>

      {/* Top Generator Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 text-[12px] font-[600] text-gray-600">
        <div className="space-y-2">
          <div className={isSidebarAdmin ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end" : "grid grid-cols-2 lg:grid-cols-4 gap-3 items-end"}>
            <div className="col-span-1">
              <label className="block text-gray-600 mb-1">Report Type</label>
              <select
                className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-primary transition-colors"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Delivered">Delivered</option>
                <option value="RTO">RTO</option>
                <option value="Canceled">Canceled</option>
                <option value="Pending Order">Pending Order</option>
                <option value="Passbook">Passbook</option>
              </select>
            </div>

            {reportType === "Passbook" ? (
              <div className="col-span-1 relative" ref={descDropdownRef}>
                <label className="block text-gray-600 mb-1">Descriptions</label>
                <button
                  type="button"
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-primary transition-colors flex items-center justify-between bg-white text-[12px] font-normal"
                  onClick={() => setDescDropdownOpen(!descDropdownOpen)}
                >
                  <span className="truncate">
                    {selectedDescriptions.length === 0
                      ? "Select Descriptions"
                      : selectedDescriptions.length === PASSBOOK_DESCRIPTIONS.length
                      ? "All Descriptions"
                      : `${selectedDescriptions.length} Selected`}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${descDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {descDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 max-h-60 overflow-y-auto font-normal text-[12px]">
                    <div className="flex items-center p-1.5 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-100 pb-2 mb-1">
                      <input
                        type="checkbox"
                        id="select-all-desc"
                        className="mr-2 accent-brand-primary h-4 w-4 cursor-pointer"
                        checked={selectedDescriptions.length === PASSBOOK_DESCRIPTIONS.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDescriptions([...PASSBOOK_DESCRIPTIONS]);
                          } else {
                            setSelectedDescriptions([]);
                          }
                        }}
                      />
                      <label htmlFor="select-all-desc" className="cursor-pointer font-semibold text-gray-700 w-full">
                        Select All
                      </label>
                    </div>
                    {PASSBOOK_DESCRIPTIONS.map((desc) => (
                      <div key={desc} className="flex items-center p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          id={`desc-${desc}`}
                          className="mr-2 accent-brand-primary h-4 w-4 cursor-pointer"
                          checked={selectedDescriptions.includes(desc)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDescriptions((prev) => [...prev, desc]);
                            } else {
                              setSelectedDescriptions((prev) => prev.filter((d) => d !== desc));
                            }
                          }}
                        />
                        <label htmlFor={`desc-${desc}`} className="cursor-pointer text-gray-600 w-full truncate" title={desc}>
                          {desc}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="col-span-1">
                <label className="block text-gray-600 mb-1">Date Filter Type</label>
                <select
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-primary transition-colors"
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value)}
                >
                  <option value="Pickup Date">Pickup Date</option>
                  <option value="AWB Assigned Date">AWB Assigned Date</option>
                </select>
              </div>
            )}

            <div className="col-span-1 w-full">
              <label className="block text-gray-600 mb-1">Select Date Range</label>
              <DateFilter
                className="w-full"
                onDateChange={handleDateChange}
                clearTrigger={clearTrigger}
                noInitialFilter={true}
              />
            </div>

            {isSidebarAdmin && (
              <div className="col-span-1 w-full">
                <label className="block text-gray-600 mb-1">Search User</label>
                <UserFilter onUserSelect={handleUserSelect} clearTrigger={clearTrigger} />
              </div>
            )}

            <div className="col-span-1">
              <label className="block text-gray-600 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="Enter email to receive report"
                className="w-full h-9 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-primary transition-colors font-normal text-[12px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 h-9 bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 rounded-lg transition-all"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={submitting}
              className="px-5 h-9 bg-[#A2620A] text-white hover:opacity-90 rounded-lg transition-all flex items-center justify-center"
            >
              {submitting ? "Starting..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Shared Wrapper for Height Calculation (Always Visible) */}
      <div ref={tableRef} className="w-full">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div style={{ height: tableHeight }} className="overflow-auto relative bg-white">
            <table className="min-w-full text-left border-collapse table-auto">
              <thead className="sticky top-0 z-20">
                <tr className="bg-brand-primary text-white text-[12px] font-[600]">
                  <th className="py-2 px-3 text-left">Sr No</th>
                  {isSidebarAdmin && <th className="py-2 px-3 text-left">User ID</th>}
                  <th className="py-2 px-3 text-left">Report Type</th>
                  <th className="py-2 px-3 text-left">Date Filter Type</th>
                  <th className="py-2 px-3 text-left">From Date</th>
                  <th className="py-2 px-3 text-left">To Date</th>
                  <th className="py-2 px-3 text-left">Created At</th>
                  <th className="py-2 px-3 text-left">Email</th>
                  <th className="py-2 px-3 text-left">Status</th>
                  <th className="py-2 px-3 text-left">Download</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 font-[500]">
                {loading ? (
                  <tr>
                    <td colSpan={isSidebarAdmin ? 10 : 9} className="text-center py-8">
                      <ThreeDotLoader />
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={isSidebarAdmin ? 10 : 9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <NoDataFound alt="No Data Found" className="w-60 h-60 object-contain mb-2" />
                        <span className="text-gray-400 font-[600]">No reports generated yet.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((row, idx) => (
                    <tr key={row._id} className="border-b border-gray-300 hover:bg-gray-50 transition-colors text-[12px]">
                      <td className="py-2 px-3">{(page - 1) * limit + idx + 1}</td>
                      {isSidebarAdmin && (
                        <td className="py-2 px-3">
                          <span
                            className="text-brand-primary font-bold cursor-pointer hover:underline"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltipPos({ x: rect.left, y: rect.top - 70 });
                              setHoveredUser(row.user);
                            }}
                            onMouseLeave={() => setHoveredUser(null)}
                          >
                            {row.user?.userId || "N/A"}
                          </span>
                        </td>
                      )}
                      <td className="py-2 px-3">{row.reportType}</td>
                      <td className="py-2 px-3">{row.dateFilterType}</td>
                      <td className="py-2 px-3">{dayjs(row.fromDate).format("DD/MM/YYYY")}</td>
                      <td className="py-2 px-3">{dayjs(row.toDate).format("DD/MM/YYYY")}</td>
                      <td className="py-2 px-3">{dayjs(row.createdAt).format("DD/MM/YYYY hh:mm A")}</td>
                      <td className="py-2 px-3">{row.email || "N/A"}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === "completed"
                            ? "bg-green-100 text-brand-primary"
                            : row.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 animate-pulse"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {row.status === "completed" && row.downloadUrl ? (
                          <a
                            href={row.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-primary hover:underline font-bold"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-gray-400 cursor-not-allowed">Download</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Hover Tooltip Popup for User */}
          {hoveredUser && (
            <div
              style={{
                position: "fixed",
                top: tooltipPos.y,
                left: tooltipPos.x,
                transform: "translateY(-50%)",
                zIndex: 9999
              }}
              className="bg-white border border-gray-200 rounded-lg shadow-xl p-3 text-[11px] text-gray-700 min-w-[200px]"
            >
              <p className="font-bold text-brand-secondary border-b pb-1 mb-1">User Details</p>
              <p><span className="font-bold">Name:</span> {hoveredUser.fullname || "N/A"}</p>
              <p><span className="font-bold">Email:</span> {hoveredUser.email || "N/A"}</p>
              <p><span className="font-bold">Mobile:</span> {hoveredUser.phoneNumber || "N/A"}</p>
            </div>
          )}

          {/* Shared Pagination Footer Desktop */}
          {!loading && reports.length > 0 && (
            <PaginationFooter
              page={page}
              setPage={setPage}
              totalPages={Math.ceil(total / limit)}
              limit={limit}
              setLimit={setLimit}
            />
          )}
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden">
          <div style={{ height: tableHeight }} className="overflow-y-auto space-y-3 pb-2 pr-1">
            {loading ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 flex justify-center items-center">
                <ThreeDotLoader />
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center text-center">
                <NoDataFound alt="No Data Found" className="w-48 h-48 object-contain mb-2" />
                <span className="text-gray-400 font-[600]">No reports generated yet.</span>
              </div>
            ) : (
              reports.map((row, idx) => (
                <div
                  key={row._id}
                  className="bg-white border border-gray-200 rounded-xl shadow-xs p-2.5 text-[11px] space-y-1.5 hover:border-gray-300 transition-colors animate-popup-in"
                >
                  {/* Header: Sr No, Report Type, and Status */}
                  <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                    <div className="flex items-center space-x-1.5 font-bold text-brand-secondary">
                      <span>#{ (page - 1) * limit + idx + 1 }</span>
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                        {row.reportType}
                      </span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      row.status === "completed"
                        ? "bg-green-100 text-brand-primary"
                        : row.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 animate-pulse"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {row.status}
                    </span>
                  </div>

                  {/* Body: Grid of info */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-gray-600 text-[10px]">
                    <div>
                      <span className="text-gray-400 font-semibold block text-[8px] uppercase leading-none">Filter Type</span>
                      <span className="font-medium text-gray-700">{row.dateFilterType}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block text-[8px] uppercase leading-none">Created At</span>
                      <span className="font-medium text-gray-700">{dayjs(row.createdAt).format("DD/MM/YYYY hh:mm A")}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 font-semibold block text-[8px] uppercase leading-none">Date Range</span>
                      <span className="font-medium text-gray-700">
                        {dayjs(row.fromDate).format("DD/MM/YYYY")} - {dayjs(row.toDate).format("DD/MM/YYYY")}
                      </span>
                    </div>
                    {row.email && (
                      <div className="col-span-2">
                        <span className="text-gray-400 font-semibold block text-[8px] uppercase leading-none">Email</span>
                        <span className="font-medium text-gray-700 break-all">{row.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Admin User info */}
                  {isSidebarAdmin && row.user && (
                    <div className="bg-gray-50 rounded p-1.5 border border-gray-100 text-[9.5px] text-gray-600 space-y-0.5">
                      <p className="font-bold text-gray-700 leading-tight">
                        User: {row.user.fullname || "N/A"} ({row.user.userId || "N/A"})
                      </p>
                      <p className="leading-tight">
                        <span className="font-semibold text-gray-400">Mobile:</span> {row.user.phoneNumber || "N/A"} | <span className="font-semibold text-gray-400">Email:</span> {row.user.email || "N/A"}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-1">
                    {row.status === "completed" && row.downloadUrl ? (
                      <a
                        href={row.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full text-center py-1 bg-brand-primary text-white rounded font-bold hover:opacity-95 text-[10.5px] transition-opacity"
                      >
                        Download Excel
                      </a>
                    ) : (
                      <button
                        disabled
                        className="block w-full py-1 bg-gray-100 text-gray-400 rounded font-bold text-[10.5px] cursor-not-allowed"
                      >
                        Generation {row.status === "failed" ? "Failed" : "In Progress..."}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Shared Pagination Footer Mobile */}
          {!loading && reports.length > 0 && (
            <PaginationFooter
              page={page}
              setPage={setPage}
              totalPages={Math.ceil(total / limit)}
              limit={limit}
              setLimit={setLimit}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MisReportPage;
