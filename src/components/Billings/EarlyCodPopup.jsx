import React, { useEffect, useState } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import { Notification } from "../../Notification"
import Cookies from "js-cookie";
import { FiX } from "react-icons/fi";
const EarlyCODModal = ({ isOpen, onClose, userId }) => {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [plans, setPlans] = useState("");
  const { id } = useParams();
  // console.log("id in early cod popup", id);

  const params = {
    id: userId || id,
  }
  // Fetch the user's current COD plan
  const check = async () => {
    try {
      const token = Cookies.get("session");
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/cod/CheckCodplan`,
        { params, headers: { Authorization: `Bearer ${token}` } }
      );
      setPlans(String(response.data.codplaneName));
    } catch (error) {
      console.error("Error fetching COD plan:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      check();
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Function to activate a new COD plan
  const handleActivate = async (planName, codAmount) => {
    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/cod/codPlanUpdate`,
        { planName, codAmount },
        { params, headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        Notification(`Successfully activated ${planName} plan!`, "success");
        setPlans(planName); // Update the plan immediately after activation
      }
    } catch (error) {
      console.error("Error activating plan:", error);
      Notification("Failed to activate plan. Please try again.", "error");
    }
  };

  // List of available plans
  const codPlans = [
    { name: "D+1", amount: 1.5, label: "D + 1 Days", bg: "bg-gradient-to-b from-[#E9FBF4] to-[#BFF1DF] border-2 border-[#0CBB7D] text-[#064E3B]" },
    { name: "D+2", amount: 0.99, label: "D + 2 Days", bg: "bg-white border border-gray-300 text-gray-500" },
    { name: "D+3", amount: 0.7, label: "D + 3 Days", bg: "bg-white border border-gray-300 text-gray-500" },
    { name: "D+4", amount: 0.5, label: "D + 4 Days", bg: "bg-white border border-gray-300 text-gray-500" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed animate-popup-in inset-0 flex items-center bg-gray-700 justify-center bg-opacity-50 px-2 z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-[95%] md:max-w-[70%] lg:max-w-[55%] xl:max-w-[65%] relative max-h-[85dvh] flex flex-col">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 text-[14px] z-10"
          onClick={onClose}
        >
          <FiX />
        </button>

        {/* Header Section */}
        <div className="text-center mb-2">
          <h2 className="text-[14px] font-[600] text-gray-700">Get Early COD</h2>
          <p className="text-gray-500 text-[12px] sm:text-[14px]">
            Why Wait? Scale your business with <b>Daily COD remittance</b>
          </p>
        </div>

        {/* Pricing Cards - Content will scroll here */}
        <div className="overflow-y-auto flex-grow pr-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {codPlans.map((plan) => (
              <div key={plan.name} className={`p-4 rounded-lg flex flex-col ${plan.bg}`}>
                {plan.name === "D+1" && (
                  <div className="bg-yellow-400 text-[10px] font-[600] px-2 py-1 rounded-lg w-fit mb-2">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-[12px] font-[600]">{plan.label}</h3>
                <p className="text-[12px] font-[600]">{plan.amount}%</p>
                <p className="text-[12px] font-[600]">Of COD Amount</p>
                <ul className="text-[11px] font-[600] mt-2 flex-grow space-y-1">
                  <li>✅ Guaranteed Remit in {plan.name.split("+")[1]} days</li>
                  <li>✅ Steady Cash Flow</li>
                </ul>
                <button
                  className={`w-full py-2 text-[12px] font-[600] mt-3 rounded-lg border transition-all ${plans === plan.name
                    ? "bg-gray-200 cursor-not-allowed text-gray-600 border-gray-300"
                    : "bg-[#0CBB7D] text-white hover:opacity-90 border-[#0CBB7D]"
                    }`}
                  onClick={() => handleActivate(plan.name, plan.amount)}
                  disabled={plans === plan.name}
                >
                  {plans === plan.name ? "Activated" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarlyCODModal;
