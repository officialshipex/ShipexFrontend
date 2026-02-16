import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { IoChevronDown } from "react-icons/io5";
import { Notification } from "../../Notification"

const WalletUpdateForm = ({ onClose }) => {
    const [searchUser, setSearchUser] = useState("");
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [formData, setFormData] = useState({
        amount: "",
        description: "",
        awbNumber: "",
        orderId: "",
        category: "",
    });

    // For dropdowns
    const [descOpen, setDescOpen] = useState(false);
    const [catOpen, setCatOpen] = useState(false);
    const [awbOpen, setAwbOpen] = useState(false);
    const [awbSuggestions, setAwbSuggestions] = useState([]);

    const descRef = useRef(null);
    const catRef = useRef(null);
    const awbRef = useRef(null);

    const navigate = useNavigate();
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    // Handle input change
    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        // For awbNumber, fetch suggestions if length > 2
        if (e.target.name === "awbNumber" && e.target.value.trim().length > 2) {
            setAwbOpen(true);
        } else if (e.target.name === "awbNumber") {
            setAwbOpen(false);
        }
    };

    // Fetch users for user search
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

    // Auto select only 1 user
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


    // Fetch AWB suggestions based on input
    useEffect(() => {
        const fetchAwb = async () => {
            if (formData.awbNumber.trim().length < 3) return setAwbSuggestions([]);
            try {
                const res = await axios.get(
                    `${REACT_APP_BACKEND_URL}/adminBilling/searchAwb?query=${formData.awbNumber}`
                );
                if (res.data && res.data.awbs && Array.isArray(res.data.awbs)) {
                    setAwbSuggestions(res.data.awbs);
                } else {
                    setAwbSuggestions([]);
                }
                console.log(res)
            } catch (err) {
                console.log("error", err)
                setAwbSuggestions([]);
            }
        };
        if (awbOpen) {
            fetchAwb();
        }
    }, [formData.awbNumber, awbOpen]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (descRef.current && !descRef.current.contains(e.target)) setDescOpen(false);
            if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
            if (awbRef.current && !awbRef.current.contains(e.target)) setAwbOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(
                `${REACT_APP_BACKEND_URL}/adminBilling/walletUpdation`,
                {
                    ...formData,
                    userId: selectedUserId,
                }
            );
            Notification("Wallet transaction updated successfully.", "success");
            navigate("/finance/billing/walletHistory");
            if (onClose) onClose();
        } catch (err) {
            console.log("Error updating wallet:", err);
            Notification(err.response?.data?.message || "Server Error", "error");
        }
    };

    // Static options
    const descriptionOptions = [
        "Freight Charges",
        "COD Charges",
        "RTO Freight Charges",
        "Shipment Lost Liability",
        "Shipment Damaged Liability",
        "Weight Dispute Charges",
        "Cashback",
        "Credit Note",
        "Wallet to bank"
    ];
    const categoryOptions = ["credit", "debit"];

    if(formData.description === "Wallet to bank"){
        formData.category = "debit";
    }

    const requiresShipment =
        formData.description !== "Cashback" &&
        formData.description !== "Credit Note" &&
        formData.description !== "Wallet to bank";

    const isFormValid =
        selectedUserId &&
        formData.description &&
        formData.category &&
        formData.amount &&
        (!requiresShipment || (formData.awbNumber && formData.orderId));


    // Render
    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* User Search */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by Name, Email, or Contact"
                    className="w-full h-9 py-2 px-3 text-gray-700 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:text-gray-400 focus:outline-none"
                    value={searchUser}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSearchUser(val);
                        if (!val.trim()) setSelectedUserId(null);
                    }}
                />
                {userSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full bg-white shadow-lg rounded-lg mt-1 z-40 max-h-60 overflow-y-auto">
                        {userSuggestions.map((user) => (
                            <div
                                key={user._id}
                                className="flex cursor-pointer group border-b border-gray-200 hover:bg-gray-100"
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

            {/* Description & Category */}
            <div className="flex gap-2">
                {/* Description Dropdown */}
                <div className="relative w-full" ref={descRef}>
                    <div
                        className="flex items-center justify-between w-full h-9 px-3 border-2 rounded-lg cursor-pointer bg-white"
                        onClick={() => setDescOpen((prev) => !prev)}
                    >
                        <input
                            type="text"
                            name="description"
                            placeholder="Select description"
                            value={formData.description}
                            readOnly
                            className="flex-1 text-[12px] font-[600] text-gray-700 focus:outline-none cursor-pointer"
                        />
                        <IoChevronDown
                            className={`ml-2 text-gray-500 transition-transform ${descOpen ? "rotate-180" : "rotate-0"}`}
                        />
                    </div>
                    {descOpen && (
                        <div className="absolute left-0 right-0 bg-white shadow-lg rounded-lg mt-1 z-40 max-h-48 overflow-y-auto">
                            {descriptionOptions.map((desc, index) => (
                                <div
                                    key={index}
                                    className="px-3 py-2 text-[12px] text-gray-700 cursor-pointer hover:bg-green-100"
                                    onClick={() => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: desc,
                                            ...(desc === "Cashback" || desc === "Credit Note"
                                                ? { awbNumber: "", orderId: "" }
                                                : {}),
                                        }));
                                        setDescOpen(false);
                                    }}

                                >
                                    {desc}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AWB & Order ID, Amount */}
            <div className="flex gap-2">
                {/* AWB Dropdown */}
                {formData.description !== "Cashback" && formData.description !== "Credit Note" && formData.description !== "Wallet to bank" && (
                    <div className="relative w-1/2" ref={awbRef}>
                        <input
                            type="text"
                            name="awbNumber"
                            placeholder="AWB Number"
                            value={formData.awbNumber}
                            onChange={handleChange}
                            onFocus={() => formData.awbNumber.length > 2 && setAwbOpen(true)}
                            autoComplete="off"
                            className="w-full h-9 py-2 px-3 placeholder:text-[12px] text-[12px] font-[600]
      border-2 rounded-lg placeholder:text-gray-400 focus:outline-none"
                        />
                        {awbOpen && awbSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 bg-white shadow-lg rounded-lg mt-1 z-40 max-h-48 overflow-y-auto">
                                {awbSuggestions.map((awb) => (
                                    <div
                                        key={awb.awbNumber}
                                        className="px-3 py-2 text-[12px] text-gray-700 cursor-pointer hover:bg-green-100"
                                        onClick={() => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                awbNumber: awb.awbNumber,
                                                orderId: awb.orderId,
                                            }));
                                            setAwbOpen(false);
                                        }}
                                    >
                                        {awb.awbNumber} <span className="text-gray-400">({awb.orderId})</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Order ID */}
                {formData.description !== "Cashback" && formData.description !== "Credit Note" && formData.description !== "Wallet to bank" && (
                    <input
                        type="text"
                        name="orderId"
                        placeholder="Order ID"
                        value={formData.orderId}
                        onChange={handleChange}
                        className="w-1/2 h-9 py-2 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:text-gray-400 focus:outline-none"
                        readOnly // always readOnly, auto-set by AWB selection
                    />
                )}
            </div>
            <div className="flex gap-2">
                {/* Amount */}
                <input
                    type="number"
                    name="amount"
                    placeholder="Amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full h-9 py-2 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:text-gray-400 focus:outline-none"
                />
                <div className="relative w-full" ref={catRef}>
                    <div
                        className="flex items-center justify-between w-full h-9 px-3 border-2 rounded-lg cursor-pointer bg-white"
                        onClick={() => setCatOpen((prev) => !prev)}
                    >
                        <span
                            className={`flex-1 text-[12px] font-[600] ${formData.category ? "text-gray-700" : "text-gray-400"
                                }`}
                        >
                            {formData.category || "Category"}
                        </span>

                        <IoChevronDown
                            className={`ml-2 text-gray-500 transition-transform ${catOpen ? "rotate-180" : "rotate-0"}`}
                        />
                    </div>
                    {catOpen && (
                        <div className="absolute left-0 right-0 bg-white shadow-lg rounded-lg mt-1 z-40 max-h-48 overflow-y-auto">
                            {categoryOptions.map((opt, idx) => (
                                <div
                                    key={idx}
                                    className="px-3 py-2 text-[12px] capitalize text-gray-700 cursor-pointer hover:bg-green-100"
                                    onClick={() => {
                                        setFormData((prev) => ({ ...prev, category: opt }));
                                        setCatOpen(false);
                                    }}
                                >
                                    {opt}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-2">
                <button
                    type="submit"
                    disabled={!isFormValid}
                    className={`flex font-[600] text-[10px] sm:text-[12px] text-white py-2 px-3 rounded-lg transition-colors ${isFormValid ? "bg-[#0CBB7D] hover:bg-[#0aa76f]" : "bg-gray-400 cursor-not-allowed"
                        }`}
                >
                    Submit
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex bg-gray-200 font-[600] text-gray-700 text-[10px] sm:text-[12px] py-2 px-3 rounded-lg hover:bg-gray-300"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default WalletUpdateForm;
