// import { toast } from "react-toastify";
import axios from "axios";
import React, { useState } from "react";
import Cookies from "js-cookie";
import {Notification} from "../../../Notification"

const AcceptAllModal = ({ isOpen, onClose, onConfirm, price, selectedOrders,setRefresh1,setRefresh }) => {
    const [loading, setLoading] = useState(false); // New loading state
    if (!isOpen) return null; // Don't render when not open


    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    const handleDiscrepancy = async () => {
        setLoading(true); // Freeze button when request starts
        console.log("Selected Orders:", selectedOrders);
        try {
            const token = Cookies.get("session");

            if (!token) {
                Notification("Authentication token not found!","error");
                return;
            }

            const response = await axios.post(
                `${REACT_APP_BACKEND_URL}/dispreancy/acceptAllDiscrepancies`,
                { orderIds: selectedOrders }, // Send array of orderIds as payload
                {
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                }
            );

            Notification(response.data.message,"success");
            setRefresh1(true)
            setRefresh(true)
            onConfirm(); // Call confirm function after successful API response
        } catch (error) {
            Notification(error.response?.data?.message || "An error occurred","error");
            console.error("Error accepting discrepancies:", error);
        } finally {
            setLoading(false); // Unfreeze button after API call is done
        }
    };

    return (
        <div className="fixed animate-popup-in inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[600px]">
                <h2 className="text-[12px] sm:text-[14px] text-gray-700 font-[600]">Confirm All Weight Discrepancies</h2>
                <p className="mt-2 text-gray-500 text-[10px] sm:text-[12px]">
                    By selecting 'Accept All,' an amount of {price}, encompassing all weight discrepancies, will be debited from your wallet. Do you wish to proceed?
                </p>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        className="px-3 py-2 bg-gray-300 font-[600] text-[10px] sm:text-[12px] text-gray-700 rounded-lg"
                        onClick={onClose}
                        disabled={loading} // Disable button when loading
                    >
                        Cancel
                    </button>
                    <button
                        className={`px-3 py-2 rounded-lg font-[600] text-[10px] sm:text-[12px] text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#0CBB7D]"
                            }`}
                        onClick={handleDiscrepancy}
                        disabled={loading} // Disable button when loading
                    >
                        {loading ? "Processing..." : "Confirm"} {/* Show loading text */}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AcceptAllModal;
