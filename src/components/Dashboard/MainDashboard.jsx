import React, { useState, useEffect, useRef } from "react";
import { FiRefreshCcw } from "react-icons/fi";
import OverviewTab from "./OverviewTab";
import OrdersTab from "./OrdersTab";
import RTOTab from "./RTOTab";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Couriers from "./Couriers"
import Cookies from "js-cookie";
import { Notification } from "../../Notification"
import { FiAlertCircle } from "react-icons/fi";
import DateFilter from "../../filter/DateFilter";
import UserFilter from "../../filter/UserFilter";
import { FiBell, FiX } from "react-icons/fi";

const AnnouncementItem = ({ ann, idx, setAnnouncements, announcements }) => {
    const textRef = useRef(null);
    const containerRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (textRef.current && containerRef.current) {
                const isOver = textRef.current.offsetWidth > containerRef.current.offsetWidth;
                setIsOverflowing(isOver);
            }
        };

        checkOverflow();
        const timer = setTimeout(checkOverflow, 100);
        window.addEventListener("resize", checkOverflow);
        return () => {
            window.removeEventListener("resize", checkOverflow);
            clearTimeout(timer);
        };
    }, [ann.message]);
 
    return (
        <div className="flex items-center justify-between border-2 border-[#0CBB7D] bg-green-50 rounded-lg px-3 py-2 mb-2 shadow-sm w-full max-w-full gap-3 overflow-hidden">
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <FiBell className="text-[#0CBB7D] text-[16px] sm:text-[18px] flex-shrink-0" />
                <div ref={containerRef} className="flex-1 overflow-hidden whitespace-nowrap">
                    <div 
                        className={`inline-block ${isOverflowing ? 'marquee-content' : ''}`}
                    >
                        <span className="text-[10px] sm:text-[12px] text-gray-800 font-[600] marquee-item">
                            <span ref={textRef}>{ann.message}</span>
                        </span>
                        {isOverflowing && (
                            <span className="text-[10px] sm:text-[12px] text-gray-800 font-[600] marquee-item">
                                {ann.message}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <button 
                onClick={() => setAnnouncements(announcements.filter((_, i) => i !== idx))}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
                <FiX size={16} />
            </button>
        </div>
    );
};

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("Overview");
    const [outerRadius, setOuterRadius] = useState(60);
    const [getuser, setGetuser] = useState({});
    const [kycCompleted, setKycCompleted] = useState(false);
    const [dashdata, setDashData] = useState({});
    const [refresh, setRefresh] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const hasFetched = useRef(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminTab, setAdminTab] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const tabs = ["Overview", "Orders", "RTO Initiated", "Couriers"];
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const [awbNumber, setAwbNumber] = useState("");
    const token = Cookies.get("session");
    const navigate = useNavigate();

    const handleDateFilterChange = (range) => {

        setSelectedDateRange(range);
        // 🔹 You can now call your API here with range[0].startDate and range[0].endDate
    };
    const fetchUserData = async () => {
        try {
            if (!token) return;

            const userResponse = await axios.get(
                `${REACT_APP_BACKEND_URL}/order/getUser`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // console.log("datatauser", userResponse.data)
            setIsAdmin(userResponse.data.isAdmin)
            setAdminTab(userResponse.data.adminTab)
            setGetuser(userResponse.data);
            setKycCompleted(userResponse.data.kycDone);

            const dashboard = await axios.get(
                `${REACT_APP_BACKEND_URL}/dashboard/dashboard`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDashData(dashboard.data.data);
        } catch (userError) {
            console.log("User not found, checking employee endpoint...");
            const token = Cookies.get("session");
            const employeeResponse = await axios.get(
                `${REACT_APP_BACKEND_URL}/staffRole/verify`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (employeeResponse.data.success && employeeResponse.data.employee) {
                setGetuser(employeeResponse.data.employee);
            }
        }
    };

    useEffect(() => {
        const kyc = localStorage.getItem("kyc");
        setKycCompleted(kyc === "true");
    }, []);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await axios.get(`${REACT_APP_BACKEND_URL}/announcement/active`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setAnnouncements(response.data.announcements);
                }
            } catch (error) {
                console.error("Failed to fetch announcements:", error);
            }
        };

        if (token) {
            fetchAnnouncements();
            // Refresh every 5 minutes to stay in sync with admin changes
            const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [token, REACT_APP_BACKEND_URL]);

    useEffect(() => {
        const handleResize = () => {
            setOuterRadius(window.innerWidth >= 768 ? 80 : 60);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);





    const handleRefresh = () => {
        Notification("Refresh successfully", "success")
        setIsRotating(true);
        setRefresh((prev) => !prev); // Toggle refresh value to notify children
        fetchUserData();
        setTimeout(() => setIsRotating(false), 1000); // stop rotating after 1s

    };

    return (
        <div className="sm:px-2">
            {announcements.length > 0 && announcements.map((ann, idx) => (
                <AnnouncementItem 
                    key={idx} 
                    ann={ann} 
                    idx={idx} 
                    announcements={announcements} 
                    setAnnouncements={setAnnouncements} 
                />
            ))}
            {!kycCompleted && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-2 border-yellow-400 bg-yellow-50 rounded-lg px-3 py-2 mb-2 shadow-sm w-full max-w-full gap-3">
                    <div className="flex items-center gap-3">
                        <FiAlertCircle className="text-red-500 text-[16px] sm:text-[18px]" />
                        <p className="text-[10px] sm:text-[12px] text-red-500 font-[600]">
                            Complete your KYC to start shipping
                        </p>
                    </div>

                    <Link
                        to="/Kyc"
                        className="inline-block bg-yellow-400 text-white font-[600] text-[10px] sm:text-[12px] px-3 py-2 rounded-lg shadow hover:bg-yellow-500 transition"
                    >
                        Click Here
                    </Link>
                </div>
            )}



            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                {/* 🔹 Mobile + Desktop Left: Tabs + Refresh */}
                <div className="w-full flex justify-between flex-wrap gap-2">
                    <div className="flex gap-2 flex-wrap">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-2 text-[12px] border font-[600] rounded-lg transition-all duration-200 ${activeTab === tab
                                    ? "bg-[#0CBB7D] text-white"
                                    : "text-gray-500 bg-white hover:bg-green-200"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <DateFilter className="w-full" onDateChange={handleDateFilterChange} />
                        {/* 🔹 Desktop Only: Search in center */}
                        {isAdmin && adminTab && (
                            <div className="hidden md:block w-full min-w-[250px]">
                                <UserFilter onUserSelect={setSelectedUserId} clearTrigger={refresh} />
                            </div>
                        )}
                        <button
                            onClick={handleRefresh}
                            className="text-white bg-[#0CBB7D] hover:opacity-90 border px-3 py-2 rounded-lg transition-all duration-300 ease-in-out"
                            title="Refresh"
                        >
                            <FiRefreshCcw className={`text-[14px] ${isRotating ? "animate-spin" : ""}`} />
                        </button>
                    </div>


                </div>

                {/* 🔹 Mobile Only: Search below Tabs + Refresh */}
                {isAdmin && adminTab && (
                    <div className="w-full md:hidden">
                        <UserFilter onUserSelect={setSelectedUserId} clearTrigger={refresh} />
                    </div>
                )}


            </div>




            {/* Tab Content */}
            {activeTab === "Overview" && <OverviewTab refresh={refresh} selectedUserId={selectedUserId} selectedDateRange={selectedDateRange} />}
            {activeTab === "Orders" && <OrdersTab refresh={refresh} selectedUserId={selectedUserId} selectedDateRange={selectedDateRange} />}
            {activeTab === "RTO Initiated" && <RTOTab refresh={refresh} selectedUserId={selectedUserId} selectedDateRange={selectedDateRange} />}
            {activeTab === "Couriers" && <Couriers refresh={refresh} selectedUserId={selectedUserId} selectedDateRange={selectedDateRange} />}
        </div>
    );
};

export default Dashboard;
