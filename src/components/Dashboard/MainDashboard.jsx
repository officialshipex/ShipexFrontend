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

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("Overview");
    const [outerRadius, setOuterRadius] = useState(60);
    const [getuser, setGetuser] = useState({});
    const [kycCompleted, setKycCompleted] = useState(false);
    const [dashdata, setDashData] = useState({});
    const [refresh, setRefresh] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const hasFetched = useRef(false);
    const [searchUser, setSearchUser] = useState("");
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminTab, setAdminTab] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const tabs = ["Overview", "Orders", "RTO Initiated", "Couriers"];
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const [awbNumber, setAwbNumber] = useState("");
    const navigate = useNavigate();

    const handleDateFilterChange = (range) => {

        setSelectedDateRange(range);
        // 🔹 You can now call your API here with range[0].startDate and range[0].endDate
    };
    const fetchUserData = async () => {
        try {
            const token = Cookies.get("session");
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
        const handleResize = () => {
            setOuterRadius(window.innerWidth >= 768 ? 80 : 60);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (searchUser.trim().length < 2) {
            setUserSuggestions([]);
            setSelectedUserId(null);
            return;
        }
        const timer = setTimeout(() => {
            // If userSuggestions has only one user and searchQuery matches, auto-select
            if (
                userSuggestions.length === 1 &&
                userSuggestions[0].fullname + " (" + userSuggestions[0].email + ")" ===
                searchUser
            ) {
                setSelectedUserId(userSuggestions[0]._id);
            }
            // Otherwise, do nothing (user must click suggestion)
        }, 2000);

        return () => clearTimeout(timer);
        // eslint-disable-next-line
    }, [searchUser]);

    useEffect(() => {
        // console.log("suer", searchUser);
        const fetchUsers = async () => {
            if (searchUser.trim().length < 2) return setUserSuggestions([]);
            try {
                const res = await axios.get(
                    `${REACT_APP_BACKEND_URL}/admin/searchUser?query=${searchUser}`
                );
                // console.log("dataaaa", res.data.users);
                setUserSuggestions(res.data.users);
            } catch (err) {
                console.error("User search failed", err);
            }
        };

        const debounce = setTimeout(fetchUsers, 300); // debounce to limit API calls
        return () => clearTimeout(debounce);
    }, [searchUser]);

   


    const handleRefresh = () => {
        Notification("Refresh successfully", "success")
        setIsRotating(true);
        setRefresh((prev) => !prev); // Toggle refresh value to notify children
        fetchUserData();
        setTimeout(() => setIsRotating(false), 1000); // stop rotating after 1s

    };

    return (
        <div className="sm:px-2">
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
                                className={`px-3 py-2 text-[12px] font-[600] rounded-lg transition-all duration-200 ${activeTab === tab
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
                            <div className="hidden md:block w-full relative">
                                <input
                                    type="text"
                                    placeholder="Search by Name, Email, or Contact"
                                    className="w-full h-9 py-2 px-3 md:w-[250px] placeholder:text-[12px] text-[12px] font-[600] border rounded-lg placeholder:font-[600] focus:ring-1 focus:ring-[#0CBB7D] focus:outline-none"
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSearchUser(value);
                                        if (value.trim() === "") {
                                            setSelectedUserId(null);
                                        }
                                    }}
                                    value={searchUser}
                                />
                                {/* Suggestions block same as above if needed */}
                                {userSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full bg-white shadow-lg rounded-md mt-1 z-40 max-h-60 overflow-y-auto">
                                        {userSuggestions.map((user, index) => (
                                            <div
                                                key={user._id}
                                                className={`flex cursor-pointer group transition-colors duration-300 ${index !== userSuggestions.length
                                                    ? "border-b border-gray-200 hover:bg-gray-100"
                                                    : ""
                                                    }`}
                                                onClick={() => {
                                                    setSelectedUserId(user._id);
                                                    setSearchUser(`${user.fullname} (${user.email})`);
                                                    setUserSuggestions([]);
                                                }}
                                            >
                                                <div className="w-1/4 flex items-center justify-center p-2">
                                                    <p className="text-[12px] text-gray-500 group-hover:text-[#0CBB7D] truncate text-center">
                                                        {user.userId}
                                                    </p>
                                                </div>
                                                <div className="w-3/4 flex flex-col justify-center py-1 pr-2 leading-tight">
                                                    <p className="text-[12px] text-gray-500 group-hover:text-[#0CBB7D] truncate">
                                                        {user.fullname}
                                                    </p>
                                                    <p className="text-[12px] text-gray-500 truncate">{user.email}</p>
                                                    <p className="text-[12px] text-gray-500 truncate">{user.phoneNumber}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                    <div className="w-full md:hidden relative">
                        <input
                            type="text"
                            placeholder="Search by Name, Email, or Contact"
                            className="w-full py-2 px-3 placeholder:text-[12px] focus:ring-1 focus:ring-[#0CBB7D] text-[12px] font-[600] border-1 border rounded-lg placeholder:font-[600] focus:outline-none"
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearchUser(value);
                                if (value.trim() === "") {
                                    setSelectedUserId(null);
                                }
                            }}
                            value={searchUser}
                        />
                        {/* Suggestions */}
                        {userSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full bg-white shadow-sm rounded-md mt-1 z-40 max-h-60 overflow-y-auto">
                                {userSuggestions.map((user, index) => (
                                    <div
                                        key={user._id}
                                        className={`flex cursor-pointer group transition-colors duration-300 ${index !== userSuggestions.length
                                            ? "border-b border-gray-200 hover:bg-gray-100"
                                            : ""
                                            }`}
                                        onClick={() => {
                                            setSelectedUserId(user._id);
                                            setSearchUser(`${user.fullname} (${user.email})`);
                                            setUserSuggestions([]);
                                        }}
                                    >
                                        <div className="w-1/4 flex items-center justify-center p-2">
                                            <p className="text-[12px] text-gray-400 group-hover:text-[#0CBB7D] font-[600] truncate text-center">
                                                {user.userId}
                                            </p>
                                        </div>
                                        <div className="w-3/4 flex flex-col justify-center py-2 pr-2 leading-tight font-[600] gap-1">
                                            <p className="text-[12px] text-gray-500 group-hover:text-[#0CBB7D] truncate">
                                                {user.fullname}
                                            </p>
                                            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{user.phoneNumber}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
