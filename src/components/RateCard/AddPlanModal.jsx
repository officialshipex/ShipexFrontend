import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { AiOutlineClose } from "react-icons/ai";
// import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { Notification } from "../../Notification"


const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AddPlanModal = ({ isOpen, onClose, onSuccess, rateType, setPlanNameAdd }) => {
    const [planName, setPlanName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current && inputRef.current.focus();
            }, 0);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        const token = Cookies.get("session");
        e.preventDefault();
        if (!planName.trim()) return;
        setIsSubmitting(true);
        try {
            if (rateType === "b2b") {
                await axios.post(`${REACT_APP_BACKEND_URL}/b2b/saveRate/createPlanName`, { planName: planName.trim() }, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${REACT_APP_BACKEND_URL}/saveRate/createPlanName`, { planName: planName.trim() }, { headers: { Authorization: `Bearer ${token}` } });
            }
            setPlanName("");
            setIsSubmitting(false);
            Notification("Plan created successfully!", "success");
            setPlanNameAdd(true);
            if (onSuccess) onSuccess(); // Optionally tell parent to refresh or show toast
            onClose(); // Close the modal after success
        } catch (error) {
            Notification("Failed to create plan!", "error");
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-md p-5 w-80 relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    aria-label="Close"
                    onClick={() => { setPlanName(""); onClose(); }}
                >
                    <AiOutlineClose size={18} />
                </button>
                <h3 className="text-[12px] sm:text-[14px] text-gray-700 font-[600] mb-3">Add Plan</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="Plan Name"
                        className="w-full border border-gray-300 text-[11px] sm:text-[12px] font-medium placeholder:text-gray-400 text-gray-700 focus:border-[#0CBB7D] focus:outline-none px-3 py-2 rounded-lg transition-all"
                        required
                        disabled={isSubmitting}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => { setPlanName(""); onClose(); }}
                            className="bg-gray-300 text-[10px] sm:text-[12px] font-[600] text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 transition-all duration-300"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`bg-[#0CBB7D] text-white px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] ${!planName.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-green-500"} transition-all duration-300`}
                            disabled={isSubmitting || !planName.trim()}
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPlanModal;
