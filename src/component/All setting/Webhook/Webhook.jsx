import React, { useState } from "react";
import ManageWebhooks from "./ManageWebhooks";
import WebhookLogs from "./WebhookLogs";

const Webhook = () => {
  const [activeTab, setActiveTab] = useState("manage");

  const tabs = [
    { label: "Manage Webhooks", value: "manage" },
    { label: "Webhook Logs", value: "logs" },
  ];

  return (
    <div className="w-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center mb-1.5 sm:justify-between">
        <div>
          <h1 className="text-[13px] sm:text-[14px] text-gray-700 font-[600]">
            Webhook Settings
          </h1>
        </div>
      </div>

      {/* Tabs UI to match existing UI */}
      <div className="flex gap-2 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] border transition-all duration-200 ${
              activeTab === tab.value
                ? "bg-brand-primary text-white"
                : "text-gray-700 hover:bg-brand-secondary/10 bg-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="w-full">
        {activeTab === "manage" && <ManageWebhooks />}
        {activeTab === "logs" && <WebhookLogs />}
      </div>
    </div>
  );
};

export default Webhook;
