import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import Loader from "../../../Loader";
import ReferralDetailsModal from "./ReferralDetailsModal";

const AdminReferral = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalCommission: 0,
    totalShipping: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedReferral, setSelectedReferral] = useState(null);

  // refer-by search
  const [searchReferBy, setSearchReferBy] = useState("");
  const [referSuggestions, setReferSuggestions] = useState([]);
  const [selectedReferById, setSelectedReferById] = useState(null);


  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchReferralStats();
  }, [selectedMonth, selectedYear, selectedReferById]);

  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("session");
      if (!token) return;

      const res = await axios.get(
        `${REACT_APP_BACKEND_URL}/referral/getAllReferralStats`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            month: selectedMonth,
            year: selectedYear,
            referById: selectedReferById,
            // subUserId: selectedSubuserId,
          },
        }
      );
      setData(res.data?.referrals || []);
      setFilteredData(res.data?.referrals || []);
      setSummary(res.data?.summary || {});
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin referral data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = data.filter((item) => {
      const matchRefer =
        !searchReferBy ||
        item.userName?.toLowerCase().includes(searchReferBy.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchReferBy.toLowerCase()) ||
        item.mobile?.toLowerCase().includes(searchReferBy.toLowerCase());

      

      return matchRefer;
    });
    setFilteredData(filtered);
  }, [searchReferBy, data]);

  // Fetch suggestions (refer-by and subuser)
  useEffect(() => {
    const fetchUsers = async () => {
      if (searchReferBy.trim().length < 2) return setReferSuggestions([]);
      try {
        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/admin/searchUser?query=${searchReferBy}`
        );
        setReferSuggestions(res.data.users);
      } catch (err) {
        console.error("User search failed", err);
      }
    };
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchReferBy]);

//   useEffect(() => {
//     const fetchUsers = async () => {
//       if (searchSubuser.trim().length < 2) return setSubSuggestions([]);
//       try {
//         const res = await axios.get(
//           `${REACT_APP_BACKEND_URL}/admin/searchUser?query=${searchSubuser}`
//         );
//         setSubSuggestions(res.data.users);
//       } catch (err) {
//         console.error("Subuser search failed", err);
//       }
//     };
//     const debounce = setTimeout(fetchUsers, 300);
//     return () => clearTimeout(debounce);
//   }, [searchSubuser]);

  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const handleYearChange = (e) => setSelectedYear(e.target.value);
  const handleClearFilters = () => {
    setSearchReferBy("");
    setSelectedReferById(null);
    // setSearchSubuser("");
    // setSelectedSubuserId(null);
    setSelectedMonth("");
    setSelectedYear("");
  };

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2024; y <= currentYear; y++) years.push(y);

  return (
    <div className="px-2 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
        <h1 className="text-[16px] sm:text-[18px] font-semibold text-gray-700">
          Referral Performance Dashboard
        </h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { title: "Total Referrers", value: summary.totalUsers || 0 },
          { title: "Total Referral Orders", value: summary.totalOrders || 0 },
          {
            title: "Total Shipping",
            value: `₹${Number(summary.totalShipping || 0).toFixed(2)}`,
          },
          {
            title: "Total Commission",
            value: `₹${Number(summary.totalCommission || 0).toFixed(2)}`,
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white border-2 border-[#0CBB7D] rounded-lg p-3 flex flex-col items-center shadow-sm hover:shadow-md transition-all"
          >
            <span className="text-[13px] text-gray-500 font-medium">
              {item.title}
            </span>
            <span className="text-[15px] font-semibold text-gray-800">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full">
          {/* Refer By Search */}
          <div className="relative w-full sm:w-[280px]">
            <input
              type="text"
              placeholder="Search Refer By (Name, Email, Mobile)"
              value={searchReferBy}
              onChange={(e) => setSearchReferBy(e.target.value)}
              className="w-full h-9 py-2 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] placeholder:text-gray-400 focus:outline-none"
            />
            {referSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 bg-white shadow-lg rounded-md mt-1 z-40 max-h-56 overflow-y-auto">
                {referSuggestions.map((user, index) => (
                  <div
                    key={user._id}
                    className={`flex cursor-pointer group transition-colors duration-300 ${
                      index !== referSuggestions.length
                        ? "border-b border-gray-200 hover:bg-gray-100"
                        : ""
                    }`}
                    onClick={() => {
                      setSearchReferBy(`${user.fullname} (${user.email})`);
                      setSelectedReferById(user._id);
                      setReferSuggestions([]);
                    }}
                  >
                    <div className="w-1/4 flex items-center justify-center p-2">
                      <p className="text-[12px] text-gray-400 group-hover:text-[#0CBB7D] font-medium truncate text-center">
                        {user.userId}
                      </p>
                    </div>
                    <div className="w-3/4 flex flex-col justify-center py-[7px] pr-2 leading-tight">
                      <p className="text-[13px] text-gray-500 group-hover:text-[#0CBB7D] font-medium truncate">
                        {user.fullname}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {user.email}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {user.phoneNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Month/Year Filters */}
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              onChange={handleMonthChange}
              value={selectedMonth}
              className="border w-full sm:w-[135px] px-3 py-1.5 h-9 rounded-lg focus:outline-none font-[600] text-gray-400 text-[12px]"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {dayjs().month(i).format("MMMM")}
                </option>
              ))}
            </select>

            <select
              onChange={handleYearChange}
              value={selectedYear}
              className="border w-full sm:w-[135px] px-3 py-1.5 h-9 rounded-lg text-[12px] text-gray-400 font-[600] focus:outline-none"
            >
              <option value="">All Years</option>
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 h-[35px] text-[12px] font-[600] rounded-lg border border-[#0CBB7D] text-[#0CBB7D] hover:bg-[#0CBB7D] hover:text-white transition-all w-full sm:w-auto"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table / Mobile Cards */}
      {loading ? (
        <Loader />
      ) : filteredData.length === 0 ? (
        <p className="text-center text-gray-500 py-4">No referral data found.</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block bg-white border rounded-md shadow-sm overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#0CBB7D] text-white">
                  <th className="px-3 py-2 text-left">Refer By (User ID)</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Mobile</th>
                  <th className="px-3 py-2 text-left">Referral Orders</th>
                  <th className="px-3 py-2 text-left">Total Shipping</th>
                  <th className="px-3 py-2 text-left">Commission</th>
                  <th className="px-3 py-2 text-left">Month</th>
                  <th className="px-3 py-2 text-left">View Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 text-gray-700">
                    <td className="px-3 py-2">
                      <p className="font-semibold">{row.userId || "-"}</p>
                      <p className="text-[12px] text-gray-500">
                        {row.userName}
                      </p>
                    </td>
                    <td className="px-3 py-2">{row.email || "-"}</td>
                    <td className="px-3 py-2">{row.mobile || "-"}</td>
                    <td className="px-3 py-2">{row.totalOrderCount || 0}</td>
                    <td className="px-3 py-2">
                      ₹{Number(row.totalShipping || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      ₹{Number(row.totalCommission || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      {dayjs().month(row.month - 1).format("MMMM")} {row.year}
                    </td>
                    <td
                      className="px-3 py-2 text-[#0CBB7D] font-semibold cursor-pointer hover:underline"
                      onClick={() => setSelectedReferral(row)}
                    >
                      View Details
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {filteredData.map((row, i) => (
              <div
                key={i}
                className="bg-white border rounded-lg shadow-sm p-3 text-gray-700"
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-[14px] text-[#0CBB7D]">
                    {row.userId || "-"}
                  </p>
                  <p className="text-[12px] text-gray-500">
                    {dayjs().month(row.month - 1).format("MMM")} {row.year}
                  </p>
                </div>
                <p className="text-[13px] font-medium">{row.userName}</p>
                <p className="text-[12px] text-gray-500">{row.email}</p>
                <p className="text-[12px] text-gray-500 mb-2">{row.mobile}</p>

                <div className="grid grid-cols-2 gap-1 text-[12px]">
                  <p>
                    <strong>Orders:</strong> {row.totalOrderCount || 0}
                  </p>
                  <p>
                    <strong>Shipping:</strong> ₹
                    {Number(row.totalShipping || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Commission:</strong> ₹
                    {Number(row.totalCommission || 0).toFixed(2)}
                  </p>
                </div>

                <button
                  className="mt-2 w-full text-[12px] font-semibold text-[#0CBB7D] border border-[#0CBB7D] rounded-lg py-1 hover:bg-[#0CBB7D] hover:text-white transition-all"
                  onClick={() => setSelectedReferral(row)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {selectedReferral && (
        <ReferralDetailsModal
          referral={selectedReferral}
          onClose={() => setSelectedReferral(null)}
        />
      )}
    </div>
  );
};

export default AdminReferral;
