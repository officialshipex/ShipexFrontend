import React, { useState } from "react";
import HistoryAdd from "../../assets/historyAdd.png";
import RechargeForm from "./RechargeForm";   // ⬅ Extracted from your current code
import WalletUpdateForm from "./WalletUpdateForm"; // ⬅ The new component
import DirectWalletUpdateForm from "./DirectWalletUpdateForm";

const WalletHistoryForm = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("recharge");

  return (
    <div className="flex flex-col md:flex-row max-w-4xl mx-auto mt-10 bg-white rounded-lg shadow-sm border border-brand-primary">
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
              ${activeTab === "recharge" ? "text-brand-primary border-b-2 border-brand-primary" : "text-gray-500"}
            `}
          >
            Recharge
          </button>
          <button
            onClick={() => setActiveTab("updation")}
            className={`px-4 py-2 font-semibold text-sm 
              ${activeTab === "updation" ? "text-brand-primary border-b-2 border-brand-primary" : "text-gray-500"}
            `}
          >
            Updation
          </button>
          <button
            onClick={() => setActiveTab("direct")}
            className={`px-4 py-2 font-semibold text-sm 
              ${activeTab === "direct" ? "text-brand-primary border-b-2 border-brand-primary" : "text-gray-500"}
            `}
          >
            Direct Update
          </button>
        </div>

        {/* Conditional Rendering */}
        {activeTab === "recharge" && <RechargeForm onClose={onClose} />}
        {activeTab === "updation" && <WalletUpdateForm onClose={onClose} />}
        {activeTab === "direct" && <DirectWalletUpdateForm onClose={onClose} />}
      </div>
    </div>
  );
};

export default WalletHistoryForm;
