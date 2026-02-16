import React, { useEffect, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import axios from "axios"
import Cookies from "js-cookie";
// import toast from "react-hot-toast";
import { Notification } from "../../Notification"
// const rateCardOptions = ["bronze", "silver", "gold", "platinum"];
const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const UpdateRateCardPopup = ({ id, userName, selectedRateCardValue, onClose, onSubmit, isOpen, rateCardType }) => {
    const [selectedRateCard, setSelectedRateCard] = useState(selectedRateCardValue);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [plans, setPlans] = useState([])
    const [rateCardOptions, setRateCardOptions] = useState([])
    const [b2bRateCards, setB2bRateCards] = useState([]);

    // console.log("userame",userName,id)
    const handleSelect = (value) => {
        setSelectedRateCard(value);
        setDropdownOpen(false);
    };


    // console.log("selectedRateCard", selectedRateCard, id, userName)
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                if (rateCardType === "B2C") {
                    const response = await axios.get(`${REACT_APP_BACKEND_URL}/saveRate/getRateCard`, {
                        headers: { Authorization: `Bearer ${Cookies.get("session")}` }
                    });
                    // console.log("response plan b2c", response.data)
                    setPlans(response.data.rateCards || []);
                    // setB2bRateCards(response.data.B2BRateCard || []);
                } else {
                    const response = await axios.get(`${REACT_APP_BACKEND_URL}/b2b/saveRate/getRateCard`, {
                        headers: { Authorization: `Bearer ${Cookies.get("session")}` }
                    });
                    console.log("response plan b2b", response.data)
                    // setPlans(response.data.rateCards || []);
                    setB2bRateCards(response.data.B2BRateCard || []);
                }
            } catch (error) {
                console.error("Error fetching plans:", error);
            }
        };

        if (onClose) {
            fetchPlans();
        }
    }, [onClose]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                if (rateCardType === "B2C") {
                    const response = await axios.get(
                        `${REACT_APP_BACKEND_URL}/saveRate/getPlanNames`, {
                        headers: { Authorization: `Bearer ${Cookies.get("session")}` }
                    }
                    );
                    // console.log("response plan name b2c", response.data.planNames);
                    setRateCardOptions(response.data.planNames || []);
                } else {
                    const response = await axios.get(
                        `${REACT_APP_BACKEND_URL}/b2b/saveRate/getPlanNames`, {
                        headers: { Authorization: `Bearer ${Cookies.get("session")}` }
                    }
                    );
                    // console.log("response plan name b2b", response.data.planNames);
                    setRateCardOptions(response.data.planNames || []);
                }
            } catch (error) {
                console.error("Failed to fetch plans", error);
            }
        };
        fetchPlans();
    }, [])

    const handleAssign = async () => {

        const filteredRateCards = plans.filter((card) => card.plan === selectedRateCard);

        const filteredB2BRateCards = b2bRateCards.filter(
            (card) => card.planName === selectedRateCard
        );

        if (filteredRateCards.length === 0 && filteredB2BRateCards.length === 0) {
            Notification("No rate cards found for the selected plan.", "info");
            return;
        }

        const data = {
            userId: id,
            userName: userName,
            planName: selectedRateCard,
            rateCards: filteredRateCards,
            B2BRateCard: filteredB2BRateCards,
        };

        try {
            let response;
            if (rateCardType === "B2C") {
                const data = {
                    userId: id,
                    userName: userName,
                    planName: selectedRateCard,
                    rateCards: filteredRateCards,
                };
                response = await axios.put(`${REACT_APP_BACKEND_URL}/users/assignPlan`, data);
            } else {
                const data = {
                    userId: id,
                    userName: userName,
                    planName: selectedRateCard,
                    B2BRateCard: filteredB2BRateCards,
                };
                response = await axios.put(`${REACT_APP_BACKEND_URL}/users/assign/plan`, data);
            }
            if (response.status >= 200 && response.status < 300) {
                Notification("Assigned Successfully", "success");
                onClose();
            } else {
                Notification(`Unexpected response: ${response.status}`, "error");
            }
            onClose();
        } catch (error) {
            console.error("Error assigning plan:", error);
            Notification(`An error occurred: ${error.response?.data?.error || error.message}`, "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-[300px] shadow-lg">
                <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 mb-2">Update Rate Card</h3>
                <p className="text-[10px] text-gray-500 font-[600] sm:text-[12px] mb-4">User Name : {userName}</p>

                {/* 🔽 Custom Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full border-2 border-gray-300 text-gray-500 font-[600] px-3 py-2 rounded-lg text-[12px] flex justify-between items-center focus:outline-none"
                    >
                        <span>{selectedRateCard}</span>
                        <FiChevronDown className="text-gray-500" />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute z-10 bg-white border-2 border-gray-300 rounded-lg w-full mt-[2px] shadow-sm max-h-40 overflow-y-auto">
                            {rateCardOptions.map((option) => (
                                <div
                                    key={option}
                                    onClick={() => handleSelect(option)}
                                    className={`px-3 py-2 cursor-pointer text-gray-500 text-[12px] hover:bg-green-100 ${selectedRateCard === option ? "bg-green-100 font-[600]" : ""
                                        }`}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        className="px-3 py-2 text-[10px] sm:text-[12px] text-gray-500 hover:bg-gray-200 transition-all duration-500 rounded-lg font-[600] bg-gray-100"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="bg-[#0CBB7D] hover:bg-green-500 font-[600] text-white px-3 py-2 text-[10px] transition-all duration-500 sm:text-[12px] rounded-lg"
                        onClick={handleAssign}
                    >
                        Assign
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateRateCardPopup;
