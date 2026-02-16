import React, { useState, useEffect } from "react";
import { FiCopy } from "react-icons/fi";
import axios from "axios";
import dayjs from "dayjs";
import Cookies from "js-cookie";
import Loader from "../../../Loader";
import { Notification } from "../../../Notification";

const Referral = () => {
  const [stats, setStats] = useState({
    referredFriends: 0,
    referralOrders: 0,
    totalShipping: 0,
    totalCommission: 0,
    withdrawn: 0,
    remaining: 0,
  });

  const [referralUrl, setReferralUrl] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commissionPercentage, setCommissionPercentage] = useState(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - i);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("session");
        if (!token) return;

        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/user/getUserDetails`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReferralCode(response.data.user.referralCode);
      } catch (err) {
        console.error("Error fetching user details", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (referralCode) {
      setReferralUrl(`${window.location.origin}/register?code=${referralCode}`);
      fetchReferralData();
    }
  }, [referralCode]);

  const fetchReferralData = async (month = "", year = "") => {
    try {
      setLoading(true);
      const token = Cookies.get("session");
      if (!token) return;

      const { data } = await axios.get(
        `${REACT_APP_BACKEND_URL}/referral/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { month, year },
        }
      );
console.log("Referral data:", data);
      setStats(data.stats);
      setMonthlyData(data.monthlyData);
      setCommissionPercentage(data.referralCommissionPercentage);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load referral data", err);
      setLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    fetchReferralData(month, selectedYear);
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    fetchReferralData(selectedMonth, year);
  };

  const handleClearFilters = () => {
    setSelectedMonth("");
    setSelectedYear("");
    fetchReferralData();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    Notification("Referral link copied to clipboard", "success");
  };

  const statsArray = [
    { title: "Referred Friends", value: stats.referredFriends },
    { title: "Referral Orders", value: stats.referralOrders },
    { title: "Total Shipping", value: `₹${stats.totalShipping}` },
    { title: "Total Commission", value: `₹${stats.totalCommission}` },
    { title: "Withdrawn", value: `₹${stats.withdrawn}` },
    { title: "Remaining", value: `₹${stats.remaining}` },
  ];

  return (
    <div className="">
      {/* Heading */}
      <h1 className="text-[14px] font-[600] text-gray-700 mb-1">
        Referral Dashboard
      </h1>

      {/* Description */}
      <p className="text-gray-500 text-[10px] sm:text-[12px] mb-1">
        Get commission percentage referral revenue at the end of every month and
        withdraw this commission to your wallet.
      </p>

      {commissionPercentage !== null && (
        <p className="text-gray-500 text-[10px] sm:text-[12px] font-[600] mb-3">
          You get <span className="text-[#0CBB7D]">{commissionPercentage}%</span>{" "}
          commission on your referral revenue.
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-2">
        {/* Mobile Stats */}
        <div className="sm:block md:hidden bg-white border-2 border-[#0CBB7D] rounded-lg p-2 shadow-sm">
          {statsArray.map((item, i) => (
            <div key={i} className="flex justify-between py-0.5">
              <span className="text-gray-500 text-[12px] font-[600]">
                {item.title}
              </span>
              <span className="font-[600] text-gray-700 text-[14px]">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Desktop Cards */}
        {statsArray.map((item, i) => (
          <div
            key={i}
            className="hidden md:flex bg-white border-2 border-[#0CBB7D] rounded-lg p-3 flex-col items-center shadow-sm"
          >
            <span className="text-[12px] text-gray-500 font-[600]">
              {item.title}
            </span>
            <span className="text-[14px] font-[600] text-gray-700">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="bg-white border rounded-md p-2 mb-2 shadow-sm">
        <label className="text-gray-500 text-[10px] sm:text-[12px] font-[600] mb-2 block">
          Your Referral Link
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={referralUrl}
            readOnly
            className="w-full border px-3 py-2 rounded-lg text-[12px] h-9 sm:text-[14px] text-gray-700 focus:outline-none border-gray-300 bg-gray-50"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 bg-gray-100 border border-gray-300 h-9 rounded-lg hover:bg-gray-200 transition-all"
          >
            <FiCopy size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-row gap-2 w-full sm:w-auto sm:justify-between mb-2">
        <div className="flex flex-row gap-2 w-full sm:w-auto">
          <select
            onChange={handleMonthChange}
            value={selectedMonth}
            className="border px-2 py-1.5 h-9 rounded-lg focus:outline-none font-[600] text-gray-500 text-[12px] w-full sm:w-[150px]"
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
            className="border px-2 py-1.5 h-9 rounded-lg focus:outline-none font-[600] text-gray-500 text-[12px] w-full sm:w-[150px]"
          >
            <option value="">All Years</option>
            {years.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Button */}
        <button
          onClick={handleClearFilters}
          className="px-3 py-1.5 h-[35px] text-[12px] font-[600] rounded-lg border border-[#0CBB7D] text-[#0CBB7D] hover:bg-[#0CBB7D] hover:text-white transition-all sm:w-auto"
        >
          Clear
        </button>
      </div>

      {/* Loader or Data */}
      {loading ? (
        <Loader />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block bg-white border shadow-sm overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#0CBB7D] text-white font-[600]">
                  <th className="px-3 py-2 text-left">Month</th>
                  <th className="px-3 py-2 text-left">Referral Orders</th>
                  <th className="px-3 py-2 text-left">Shipping Charges</th>
                  <th className="px-3 py-2 text-left">Commission</th>
                  <th className="px-3 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.length > 0 ? (
                  monthlyData.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b text-gray-700 hover:bg-gray-50"
                    >
                      <td className="px-3 py-2">{row.month}</td>
                      <td className="px-3 py-2">{row.referralOrders}</td>
                      <td className="px-3 py-2">₹{row.shippingCharges}</td>
                      <td className="px-3 py-2">₹{row.commission}</td>
                      <td className="px-3 py-2">
                        {dayjs(row.fromDate).format("DD MMM YYYY")} -{" "}
                        {dayjs(row.toDate).format("DD MMM YYYY")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-gray-500 py-3"
                    >
                      No referral data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-4 sm:hidden">
            {monthlyData.length > 0 ? (
              monthlyData.map((month, i) => (
                <div
                  key={i}
                  className="bg-white border rounded-md p-4 shadow-sm flex flex-col"
                >
                  <div className="mb-2">
                    <span className="font-semibold text-gray-700">
                      {month.month}
                    </span>
                    <div className="text-gray-500 text-sm">
                      {`${dayjs(month.fromDate).format("DD MMM")} - ${dayjs(
                        month.toDate
                      ).format("DD MMM YYYY")}`}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">
                        Referral Orders
                      </span>
                      <span className="font-semibold">
                        {month.referralOrders}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">
                        Shipping Charges
                      </span>
                      <span className="font-semibold">
                        ₹{month.shippingCharges}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Commission</span>
                      <span className="font-semibold">
                        ₹{month.commission}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-3">
                No referral data found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Referral;
