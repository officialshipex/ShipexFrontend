import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaClipboardList } from "react-icons/fa";
import { FiBarChart2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
    FaBox,
    FaTruckLoading,
    FaShippingFast,
    FaMapMarkedAlt,
    FaCheckCircle,
    FaUndo,
    FaExclamationTriangle,
    FaEnvelopeOpenText,
    FaClipboardCheck,
    FaTruckMoving,
    FaMoneyBillWave,
    FaWallet,
    FaClock,
    FaMoneyCheckAlt
} from "react-icons/fa";
import Cookies from "js-cookie";
import OverviewWeightDisputeSection from "./OverviewWeightDisputSection";



const Dashboard = ({ selectedUserId, selectedDateRange }) => {
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate()
    const [isAdmin, setIsAdmin] = useState();
    const [adminTab, setAdminTab] = useState();

    const handleShipmentClick = () => {
        if (!isAdmin || (isAdmin && !adminTab)) {
            navigate("/dashboard/b2c/order");
        } else {
            navigate("/adminDashboard/b2c/order");
        }
    };

    const handleNdrClick = () => {
        if (!isAdmin || (isAdmin && !adminTab)) {
            navigate("/dashboard/ndr");
        } else {
            navigate("/adminDashboard/ndr");
        }
    };

    const handleCodClick = () => {
        if (!isAdmin || (isAdmin && !adminTab)) {
            navigate("/dashboard/cod");
        } else {
            navigate("/finance/COD/CODRemittance");
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
            console.log("datatauser", userResponse.data)
            setIsAdmin(userResponse.data.isAdmin)
            setAdminTab(userResponse.data.adminTab)
        }
        catch (error) {
            console.log("error", error)
        }
    }
    useEffect(() => {
        fetchUserData();
    }, [])

    const Card = ({ title, value, subtitle, bgColor = "bg-white" }) => (
        <div className={`flex items-center gap-2 p-4 rounded-lg shadow-sm border hover:border-[#0CBB7D] transition-all duration-700 ${bgColor} w-full`}>
            <div className="bg-[#0CBB7D] p-2 rounded-full">
                <FaClipboardList className="text-white text-[14px]" />
            </div>
            <div className="flex flex-col justify-center">
                <h2 className="text-[14px] text-gray-500">{title}</h2>
                <h1 className="text-[14px] font-[600] text-gray-700">{value}</h1>
                {subtitle && <p className="text-[12px] text-gray-500">{subtitle}</p>}
            </div>
            <div className="ml-auto">
                <FiBarChart2 className="text-gray-500 text-[14px]" />
            </div>
        </div>
    );

    const StatBox = ({ label, value, icon: Icon, onClick }) => (
        <div className="flex items-center border border-gray-200 cursor-pointer bg-white rounded-lg p-3 shadow-sm hover:border-[#0CBB7D] transition-all duration-700 w-full" onClick={onClick}>
            {Icon && (
                <div className="bg-[#0CBB7D] p-2 rounded-full mr-3">
                    <Icon className="text-white text-[14px]" />
                </div>
            )}
            <div className="flex flex-col">
                <div className="text-[14px] text-gray-700 font-[600]">{value}</div>
                <div className="text-[14px] text-gray-500">{label}</div>
            </div>
        </div>
    );



    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = Cookies.get("session");
                if (!token) return;
                const today = new Date();
                // ✅ Build query parameters dynamically
                const params = {};
                const startDate =
                    selectedDateRange?.[0]?.startDate ||
                    new Date(today.setHours(0, 0, 0, 0)); // 00:00:00 of today

                const endDate =
                    selectedDateRange?.[0]?.endDate ||
                    new Date(today.setHours(23, 59, 59, 999)); // 23:59:59 of today
                if (selectedUserId) params.userId = selectedUserId;
                // console.log("selected date range", selectedDateRange)

                params.startDate = new Date(startDate);
                params.endDate = new Date(endDate);


                // console.log("params", params)
                const res = await axios.get(`${REACT_APP_BACKEND_URL}/dashboard/getDashboardOverview`, {
                    params,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setData(res.data.data);
                console.log("Dashboard data:", res.data.data);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedUserId, selectedDateRange]);


    if (loading) return <div className="text-center mt-8">Loading dashboard...</div>;

    return (
        <div className="space-y-2 mt-2">
            {/* Top Summary Cards */}
            <div className="grid grid-cols-2 text-[14px] md:grid-cols-2 xl:grid-cols-4 gap-2">
                <Card
                    title="Orders"
                    value={data?.todaysOrders || 0}
                // subtitle={`Yesterday ${data?.yesterdaysOrders || 0}`}
                />
                <Card
                    title="Revenue"
                    value={`₹${data?.todaysRevenue || 0}`}
                // subtitle={`Yesterday ₹${data?.yesterdaysRevenue || 0}`}
                // bgColor="bg-green-100"
                />
                <Card
                    title="Average Shipping Cost"
                    value={`₹${data?.avgShippingCost || 0}`}
                // subtitle="Last 30 days"
                />
                <Card
                    title="COD Available"
                    value={`₹${Number(data?.codAvailable || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`}
                />

            </div>

            {/* Shipment Details */}
            <div className="p-4 rounded-lg shadow-sm border border-gray-200 bg-white">
                <div className="flex justify-between items-center">
                    <h2 className="text-[14px] text-gray-700 font-[600] mb-2">Shipments Details</h2>
                    {/* <p className="text-[10px] sm:text-[12px] text-gray-500">Last 30 days</p> */}
                </div>
                <div className="grid grid-cols-2 text-[14px] sm:grid-cols-3 md:grid-cols-6 gap-2">
                    <StatBox label="Total Shipments" value={data?.shipmentStats?.total || 0} icon={FaBox} onClick={handleShipmentClick} />
                    <StatBox label="Ready To Ship" value={data?.shipmentStats?.readyToShip || 0} icon={FaTruckLoading} onClick={handleShipmentClick} />
                    <StatBox label="In-Transit" value={data?.shipmentStats?.inTransit || 0} icon={FaShippingFast} onClick={handleShipmentClick} />
                    <StatBox label="Out for Delivery" value={data?.shipmentStats?.outForDelivery || 0} icon={FaMapMarkedAlt} onClick={handleShipmentClick} />
                    <StatBox label="Delivered" value={data?.shipmentStats?.delivered || 0} icon={FaCheckCircle} onClick={handleShipmentClick} />
                    <StatBox label="RTO Delivered" value={data?.shipmentStats?.rto || 0} icon={FaUndo} />
                </div>

            </div>

            {/* NDR Details */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-[14px] text-gray-700 font-[600] mb-2">NDR Details</h2>
                    {/* <p className="text-[10px] sm:text-[12px] text-gray-500">Last 30 days</p> */}
                </div>
                <div className="grid grid-cols-2 text-[14px] sm:grid-cols-2 md:grid-cols-4 gap-2">
                    <StatBox label="Total NDR" value={data?.ndrStats?.totalNdr || 0} icon={FaExclamationTriangle} onClick={handleNdrClick} />
                    <StatBox label="Action Required" value={data?.ndrStats?.actionRequired || 0} icon={FaEnvelopeOpenText} onClick={handleNdrClick} />
                    <StatBox label="Action Requested" value={data?.ndrStats?.actionRequested || 0} icon={FaClipboardCheck} onClick={handleNdrClick} />
                    <StatBox label="NDR Delivered" value={data?.ndrStats?.ndrDelivered || 0} icon={FaTruckMoving} onClick={handleNdrClick} />
                </div>

            </div>

            <div>
                <OverviewWeightDisputeSection selectedUserId={selectedUserId} />
            </div>

            {/* COD Status */}
            <div className="bg-white p-4 text-[14px] rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-[14px] text-gray-700 font-[600] mb-2">COD Status</h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    <StatBox label="Total COD (Last 30 Days)" value={`₹${(data?.codTotal || 0).toFixed(2)}`} icon={FaMoneyBillWave} onClick={handleCodClick} />
                    <StatBox label="COD Available" value={`₹${(data?.codAvailable || 0).toFixed(2)}`} icon={FaWallet} onClick={handleCodClick} />
                    <StatBox label="COD Pending" value={`₹${(data?.codPending || 0).toFixed(2)}`} icon={FaClock} onClick={handleCodClick} />
                    <StatBox label="Last COD Remitted" value={`₹${(data?.lastCODRemitted || 0).toFixed(2)}`} icon={FaMoneyCheckAlt} onClick={handleCodClick} />
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
