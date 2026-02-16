// WalletHistoryForm.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import HistoryAdd from "../../assets/historyAdd.png"
import {Notification} from "../../Notification"

const RechargeForm = ({ onClose }) => {
    const [searchUser, setSearchUser] = useState("");
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [formData, setFormData] = useState({
        // userId: selectedUserId,
        status: "success",
        paymentId: "",
        orderId: "",
        amount: ""
    });
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const statusRef = useRef(null);

    const navigate = useNavigate();
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;



    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${REACT_APP_BACKEND_URL}/adminBilling/add-history`, {
                ...formData,
                userId: selectedUserId,
            });
            Notification("History added successfully","success");
            navigate("/finance/billing/walletHistory");
            if (onClose) onClose();
        } catch (err) {
            Notification(err.response?.data?.message || "Server Error","error");
        }
    };


    const handleCancel = () => {
        if (onClose) onClose();
    };

    useEffect(() => {
        if (
            searchUser.trim().length >= 2 &&
            userSuggestions.length === 1 &&
            `${userSuggestions.fullname} (${userSuggestions.email})` === searchUser &&
            selectedUserId !== userSuggestions.userId
        ) {
            setSelectedUserId(userSuggestions.userId);
        }
    }, [searchUser, userSuggestions, selectedUserId]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (searchUser.trim().length < 2) return setUserSuggestions([]);
            try {
                const res = await axios.get(
                    `${REACT_APP_BACKEND_URL}/admin/searchUser?query=${searchUser}`
                );
                setUserSuggestions(res.data.users);
            } catch (err) {
                console.error("User search failed", err);
            }
        };

        const debounce = setTimeout(fetchUsers, 300);
        return () => clearTimeout(debounce);
    }, [searchUser]);

    // Close custom dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (statusRef.current && !statusRef.current.contains(e.target)) {
                setStatusDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col md:flex-row max-w-full mx-auto bg-white rounded-lg">
            {/* Left Side Image */}
            {/* <div className="md:w-1/2 flex items-center justify-center p-6">
        <img
          src={HistoryAdd}
          alt="Wallet"
          className="w-2/3 h-auto object-contain"
        />
      </div> */}

            {/* Right Side Form */}
            <div className="md:w-full w-full">
                {/* <h2 className="text-[14px] sm:text-[18px] font-[600] text-gray-700 mb-4">User Recharge</h2> */}
                <form onSubmit={handleSubmit} className="space-y-2">
                    {/* User Search Input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by Name, Email, or Contact"
                            className="w-full h-9 py-2 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] placeholder:text-gray-400 focus:outline-none"
                            value={searchUser}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearchUser(val);
                                if (!val.trim()) setSelectedUserId(null);
                            }}
                        />
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
                                            setSelectedUserId(user.userId);
                                            setSearchUser(`${user.fullname} (${user.email})`);
                                            setUserSuggestions([]);
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
                    {/* Other Inputs */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="paymentId"
                            placeholder="Payment ID"
                            value={formData.paymentId}
                            onChange={handleChange}
                            className="w-full h-9 py-2 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] placeholder:text-gray-400 focus:outline-none"
                            required
                        />
                        <input
                            type="text"
                            name="orderId"
                            placeholder="Order ID"
                            value={formData.orderId}
                            onChange={handleChange}
                            className="w-full h-9 py-2 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] placeholder:text-gray-400 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="flex gap-2">

                        <input
                            type="number"
                            name="amount"
                            placeholder="Amount"
                            value={formData.amount}
                            onChange={handleChange}
                            className="w-full h-9 py-2 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] placeholder:text-gray-400 focus:outline-none"
                            required
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-2">
                        <button
                            type="submit"
                            className={`flex font-[600] text-[10px] sm:text-[12px] text-white py-2 px-3 rounded-lg ${selectedUserId ? "bg-[#0CBB7D] hover:bg-[#0aa76f]" : "bg-gray-400 cursor-not-allowed"}`}
                            disabled={!selectedUserId}
                        >
                            Submit
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex bg-gray-200 font-[600] text-gray-700 text-[10px] sm:text-[12px] py-2 px-3 rounded-lg hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RechargeForm;
