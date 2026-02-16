import React, { useState } from "react";
import HistoryAdd from "../../assets/historyAdd.png";
import RechargeForm from "./RechargeForm";   // ⬅ Extracted from your current code
import WalletUpdateForm from "./WalletUpdateForm"; // ⬅ The new component

const WalletHistoryForm = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("recharge");

  return (
    <div className="flex flex-col md:flex-row max-w-4xl mx-auto mt-10 bg-white rounded-lg shadow-sm border border-[#0CBB7D]">
      {/* Left Side Image */}
      <div className="md:w-1/2 flex items-center justify-center p-6">
        <img
          src={HistoryAdd}
          alt="Wallet"
          className="w-2/3 h-auto object-contain"
        />
      </div>

      {/* Right Side */}
      <div className="md:w-1/2 w-full p-4">
        {/* Tabs */}
        <div className="flex mb-4 border-b">
          <button
            onClick={() => setActiveTab("recharge")}
            className={`px-4 py-2 font-semibold text-sm 
              ${activeTab === "recharge" ? "text-[#0CBB7D] border-b-2 border-[#0CBB7D]" : "text-gray-500"}
            `}
          >
            Recharge
          </button>
          <button
            onClick={() => setActiveTab("updation")}
            className={`px-4 py-2 font-semibold text-sm 
              ${activeTab === "updation" ? "text-[#0CBB7D] border-b-2 border-[#0CBB7D]" : "text-gray-500"}
            `}
          >
            Updation
          </button>
        </div>

        {/* Conditional Rendering */}
        {activeTab === "recharge" ? (
          <RechargeForm onClose={onClose} />
        ) : (
          <WalletUpdateForm onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default WalletHistoryForm;
