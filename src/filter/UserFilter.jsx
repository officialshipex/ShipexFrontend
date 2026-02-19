import React from 'react'
import axios from "axios";
import { useEffect, useState } from "react";
import Cookies from "js-cookie"


const UserFilter = ({ onUserSelect, clearTrigger }) => {
    const [searchUser, setSearchUser] = useState("");
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminTab, setAdminTab] = useState(false);
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const [kycCompleted, setKycCompleted] = useState(false);
    const [getuser, setGetuser] = useState({});
    const [dashdata, setDashData] = useState({});


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
    useEffect(() => {
        // Reset all child filter states
        setSearchUser("");
        setSelectedUserId(null);
        setUserSuggestions([]);

        // Send null back to parent to remove filter
        onUserSelect(null);
    }, [clearTrigger]);

    return (
        <div className="z-50">
            <div className="w-full relative ml-auto">
                <input
                    type="text"
                    placeholder="Search by Name, Email, or Contact"
                    className="w-full h-9 py-2 px-3 text-[12px] font-[600] border border-gray-300 rounded-lg placeholder:text-gray-400 placeholder:font-[600] focus:outline-none focus:border-[#0CBB7D] transition-colors"
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
                    <div className="absolute left-0 right-0 top-full bg-white shadow-lg rounded-lg mt-1 z-40 max-h-60 overflow-y-auto">
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
                                    onUserSelect(user._id);
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
                                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                                    <p className="text-[11px] text-gray-400 truncate">{user.phoneNumber}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserFilter