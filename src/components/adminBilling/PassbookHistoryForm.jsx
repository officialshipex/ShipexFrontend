import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {Notification} from "../../Notification"

const PassbookHistoryForm = ({ onClose }) => {
    const [searchUser, setSearchUser] = useState("");
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [formData, setFormData] = useState({
        status: "success",
        orderId: "",
        awbNumber: "",
        amount: "",
        description: "",
        transactionType: "debit", // default selected
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

    const handleTransactionTypeSelect = (type) => {
        setFormData((prev) => ({ ...prev, transactionType: type }));
        setStatusDropdownOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${REACT_APP_BACKEND_URL}/adminBilling/add-passbook`, {
                ...formData,
                userId: selectedUserId,
            });
            Notification("History added successfully","success");
            navigate("/finance/billing/passbook");
            if (onClose) onClose();
        } catch (err) {
            console.log(err)
            Notification(err.response?.data?.error || "Server Error","error");
        }
    };

    const handleCancel = () => {
        if (onClose) onClose();
    };

    useEffect(() => {
        if (searchUser.trim().length < 2) {
            setUserSuggestions([]);
            setSelectedUserId(null);
            return;
        }

        const timer = setTimeout(() => {
            if (
                userSuggestions.length === 1 &&
                userSuggestions[0].fullname + " (" + userSuggestions[0].email + ")" ===
                searchUser
            ) {
                setSelectedUserId(userSuggestions[0].userId);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [searchUser, userSuggestions]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (searchUser.trim().length < 2) return setUserSuggestions([]);
            try {
                const res = await axios.get(
                    `${REACT_APP_BACKEND_URL}/admin/searchUser?query=${searchUser}`
                );
                setUserSuggestions(res.data.users);
                console.log("res",res.data.users)
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
        <div className="max-w-lg mx-auto mt-10 bg-white rounded-lg shadow-sm border border-[#0CBB7D] p-6">
            <h2 className="text-[18px] font-[600] text-gray-700 mb-6">Update Passbook</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                                    className={`flex cursor-pointer group transition-colors duration-300 ${index !== userSuggestions.length - 1
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
                                        <p className="text-[12px] text-gray-400 group-hover:text-[#0CBB7D] font-medium truncate text-center">
                                            {user.userId}
                                        </p>
                                    </div>
                                    <div className="w-3/4 flex flex-col justify-center py-[7px] pr-2 leading-tight">
                                        <p className="text-[13px] text-gray-500 group-hover:text-[#0CBB7D] font-medium truncate">
                                            {user.fullname}
                                        </p>
                                        <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                                        <p className="text-[11px] text-gray-400 truncate">
                                            {user.phoneNumber}
                                        </p>
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
                        name="orderId"
                        placeholder="Order ID"
                        value={formData.orderId}
                        onChange={handleChange}
                        className="w-full h-9 py-2 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] placeholder:text-gray-400 focus:outline-none"
                        // required
                    />
                    <input
                        type="text"
                        name="awbNumber"
                        placeholder="AWB Number"
                        value={formData.awbNumber}
                        onChange={handleChange}
                        className="w-full h-9 py-2 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] placeholder:text-gray-400 focus:outline-none"
                        // required
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
                        // required
                    />

                    {/* Custom Dropdown for Debit/Credit */}
                    <div className="relative w-full" ref={statusRef}>
                        <div
                            tabIndex={0}
                            className="w-full h-9 px-3 text-[12px] text-gray-400 font-[600] border-2 rounded-lg border-gray-300 cursor-pointer flex items-center justify-between bg-white"
                            onClick={() => setStatusDropdownOpen((prev) => !prev)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setStatusDropdownOpen((prev) => !prev);
                                }
                            }}
                            aria-haspopup="listbox"
                            aria-expanded={statusDropdownOpen}
                        >
                            <span>
                                {formData.transactionType.charAt(0).toUpperCase() +
                                    formData.transactionType.slice(1)}
                            </span>
                            <svg
                                className={`w-4 h-4 transition-transform duration-300 ${statusDropdownOpen ? "rotate-180" : ""
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                        {statusDropdownOpen && (
                            <ul
                                tabIndex={-1}
                                role="listbox"
                                aria-label="Transaction Type"
                                className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-sm max-h-28 overflow-auto"
                            >
                                {["debit", "credit"].map((type) => (
                                    <li
                                        key={type}
                                        role="option"
                                        aria-selected={formData.transactionType === type}
                                        className={`py-2 px-3 text-[12px] cursor-pointer hover:bg-green-100 ${formData.transactionType === type ? "font-bold bg-green-100" : ""
                                            }`}
                                        onClick={() => handleTransactionTypeSelect(type)}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>



                {/* Description Textarea */}
                <div className="flex flex-col">
                    {/* <label htmlFor="description" className="font-[400] mb-1 text-gray-500">
                        Description
                    </label> */}
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter description..."
                        className="resize-none w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0CBB7D] font-[600] text-[12px]"
                    ></textarea>
                </div>

                {/* Buttons */}
                <div className="flex space-x-2">
                    <button
                        type="submit"
                        className="flex bg-[#0CBB7D] font-[600] text-[10px] sm:text-[12px] text-white py-2 px-3 rounded-lg hover:bg-[#0aa76f]"
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
    );
};

export default PassbookHistoryForm;
