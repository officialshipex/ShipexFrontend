import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaInbox,
  FaCheckCircle,
  FaExclamationCircle
} from "react-icons/fa";
import Cookies from "js-cookie";

const OverviewWeightDisputeSection = ({ selectedUserId }) => {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState();
  const [adminTab, setAdminTab] = useState();

  const handleNdrClick = () => {
    if (!isAdmin || (isAdmin && !adminTab)) {
      navigate("/dashboard/tools/Weight_Dependency");
    } else {
      navigate("/adminDashboard/tools/Weight_Dependency");
    }
  };

  const fetchUserData = async () => {
    try {
      const token = Cookies.get("session");
      if (!token) return;

      const userResponse = await axios.get(
        `${REACT_APP_BACKEND_URL}/order/getUser`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsAdmin(userResponse.data.isAdmin);
      setAdminTab(userResponse.data.adminTab);
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const StatBox = ({ label, value, icon: Icon, onClick }) => (
    <div
      className="flex items-center border border-gray-200 cursor-pointer bg-white rounded-lg p-3 shadow-sm hover:border-[#0CBB7D] transition-all duration-700 w-full"
      onClick={onClick}
    >
      {Icon && (
        <div className="bg-[#0CBB7D] p-2 rounded-full mr-3">
          <Icon className="text-white text-[14px] sm:text-[16px]" />
        </div>
      )}
      <div className="flex flex-col">
        <div className="text-[12px] sm:text-[14px] text-gray-700 font-[600]">
          {value}
        </div>
        <div className="text-[12px] sm:text-[14px] text-gray-500">{label}</div>
      </div>
    </div>
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("session");
        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/dashboard/getWeightDisputeData`,
          {
            params: selectedUserId ? { userId: selectedUserId } : {},
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setData(res.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedUserId]);

  if (loading) return <div className="text-center mt-8">Loading dashboard...</div>;

  return (
    <div className="space-y-2 mt-2">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center">
          <h2 className="text-[14px] text-gray-700 font-[600] mb-2">
            Weight Discrepancy Details
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <StatBox
            label="Total Discrepancy"
            value={data?.total || 0}
            icon={FaBalanceScale}
            onClick={handleNdrClick}
          />
          <StatBox
            label="New"
            value={data?.counts.New || 0}
            icon={FaInbox}
            onClick={handleNdrClick}
          />
          <StatBox
            label="Accepted"
            value={data?.counts.Accepted || 0}
            icon={FaCheckCircle}
            onClick={handleNdrClick}
          />
          <StatBox
            label="Discrepancy Raised"
            value={data?.counts["Discrepancy Raised"] || 0}
            icon={FaExclamationCircle}
            onClick={handleNdrClick}
          />
        </div>
      </div>
    </div>
  );
};

export default OverviewWeightDisputeSection;
