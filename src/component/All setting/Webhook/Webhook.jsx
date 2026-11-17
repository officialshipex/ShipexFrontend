import React, { useState } from "react";
import ManageWebhooks from "./ManageWebhooks";
import WebhookLogs from "./WebhookLogs";
import B2BApiWebhooks from "./B2BApiWebhooks";

// Webhook settings, kept fully separate for the two APIs:
//   B2C  the B2C webhooks and their logs
//   B2B  the B2B API key, the B2B webhooks (shipment details, tracking) and their logs
// ?tab=b2b opens the B2B side directly (link from Company Profile -> API Details -> B2B).
const Webhook = () => {
  const [mode, setMode] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("tab") === "b2b" ? "B2B" : "B2C";
    } catch {
      return "B2C";
    }
  });
  const [b2cTab, setB2cTab] = useState("manage");

  const b2cTabs = [
    { label: "Manage Webhooks", value: "manage" },
    { label: "Webhook Logs", value: "logs" },
  ];

  return (
    <div className="w-full">
      {/* Header: title + B2C / B2B switch */}
      <div className="flex flex-row items-center mb-1.5 justify-between gap-2">
        <h1 className="text-[13px] sm:text-[14px] text-gray-700 font-[600]">
          {mode === "B2B" ? "B2B API & Webhooks" : "Webhook Settings"}
        </h1>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {["B2C", "B2B"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-[12px] font-[600] transition-colors ${
                mode === m ? "bg-brand-primary text-white" : "bg-white text-gray-700 hover:bg-brand-secondary/10"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "B2B" ? (
        <B2BApiWebhooks />
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            {b2cTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setB2cTab(tab.value)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] border transition-all duration-200 ${
                  b2cTab === tab.value ? "bg-brand-primary text-white" : "text-gray-700 hover:bg-brand-secondary/10 bg-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="w-full">
            {b2cTab === "manage" && <ManageWebhooks />}
            {b2cTab === "logs" && <WebhookLogs />}
          </div>
        </>
      )}
    </div>
  );
};

export default Webhook;
