import React, { useState, useEffect } from "react";
import axios from "axios";
import StatusDropdown from "./StatusDropdown";
import { Notification } from "../../Notification";

const courierConfigs = {
  NimbusPost: {
    endpoint: "/Nimbuspost/getAuthToken",
    fields: [
      { name: "email", label: "Email", placeholder: "API Email", type: "email" },
      { name: "password", label: "Password", placeholder: "API Password", type: "password" },
    ],
  },
  Shiprocket: {
    endpoint: "/shiprocket/getToken",
    fields: [
      { name: "username", label: "User/Email", placeholder: "Username", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
    ],
  },
  Dtdc: {
    endpoint: "/DTDC/getToken",
    provider: "DTDC",
    fields: [
      { name: "apiKey", label: "API Key", placeholder: "Key", type: "text" },
      { name: "username", label: "User", placeholder: "User", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
      { name: "token", label: "Token", placeholder: "Token", type: "text" },
    ],
  },
  Delhivery: {
    endpoint: "/Delhivery/getToken",
    fields: [
      { name: "apiKey", label: "API Key", placeholder: "Enter API Key", type: "text" },
    ],
  },
  "Shree Maruti": {
    endpoint: "/ShreeMaruti/getAuthToken",
    fields: [
      { name: "username", label: "User", placeholder: "Username", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
    ],
  },
  Xpressbees: {
    endpoint: "/Xpressbees/getAuthToken",
    fields: [
      { name: "email", label: "Email", placeholder: "API Email", type: "email" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
    ],
  },
  SmartShip: {
    endpoint: "/SmartShip/authorize",
    provider: "Smartship",
    fields: [
      { name: "username", label: "User/Email", placeholder: "Username", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
    ],
  },
  EcomExpress: {
    endpoint: "/EcomExpress/getAuthToken",
    fields: [
      { name: "username", label: "User", placeholder: "API User", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
    ],
  },
  "Amazon Shipping": {
    endpoint: "/Amazon/getToken",
    fields: [
      { name: "apiKey", label: "API Key", placeholder: "Enter API Key", type: "text" },
    ],
  },
  Ekart: {
    endpoint: "/Ekart/authorize",
    fields: [
      { name: "username", label: "User/Email", placeholder: "Username", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
    ],
  },
  Vamaship: {
    endpoint: "/Vamaship/authorize",
    fields: [
      { name: "username", label: "User/Email", placeholder: "Username", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
    ],
  },
  ZipyPost: {
    endpoint: "/ZipyPost/authorize",
    provider: "ZipyPost",
    fields: [
      { name: "username", label: "User/Email", placeholder: "Username", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
    ],
  },
  BoxdLogistics: {
    endpoint: "/BoxdLogistics/addCourier",
    fields: [
      { name: "email", label: "Email", placeholder: "API Email", type: "email" },
      { name: "password", label: "Password", placeholder: "API Password", type: "password" },
    ],
  },
  Proship: {
    endpoint: "/Proship/getAuthToken",
    fields: [
      { name: "username", label: "User", placeholder: "Username", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
    ],
  },
};

const CourierAdd = ({ provider, onCourierSaved, canAction }) => {
  const [courierName, setCourierName] = useState("");
  const [codDays, setCodDays] = useState("");
  const [status, setStatus] = useState("");
  const [credentials, setCredentials] = useState({});
  const [loading, setLoading] = useState(false);

  const config = courierConfigs[provider] || {};
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Reset fields when provider changes
  useEffect(() => {
    setCourierName("");
    setCodDays("");
    setStatus("");
    setCredentials({});
  }, [provider]);

  const handleCredentialChange = (name, value) => {
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    // Basic validation
    if (!courierName || !codDays || !status) {
      Notification("Please fill all required fields", "info");
      return;
    }

    // Dynamic credentials validation
    const missingField = config.fields?.find(field => !credentials[field.name]);
    if (missingField) {
      Notification(`Please enter ${missingField.label}`, "info");
      return;
    }

    try {
      setLoading(true);
      const newCourier = {
        courierName,
        courierProvider: config.provider || provider,
        CODDays: codDays,
        status: status,
        credentials: { ...credentials },
      };

      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}${config.endpoint}`,
        newCourier
      );

      Notification(
        response.data.message || `${provider} courier added successfully`,
        "success"
      );

      // Clear fields
      setCourierName("");
      setCodDays("");
      setStatus("");
      setCredentials({});
      
      onCourierSaved?.();
    } catch (error) {
      console.error(`${provider} Save Error:`, error);
      Notification(
        error?.response?.data?.message || "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!config.endpoint) return null;

  return (
    <div className="w-full animate-fadeIn">
      <div className="grid font-[600] grid-cols-2 xl:flex xl:flex-row items-start xl:items-end gap-2 w-full">
        {/* Name Field */}
        <div className="w-full xl:w-48 flex flex-col gap-1">
          <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 tracking-tight">
            Name
          </label>
          <input
            type="text"
            placeholder={`${provider} Name`}
            className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 transition-all placeholder:text-gray-300"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
          />
        </div>

        {/* Days Field */}
        <div className="w-full xl:w-16 flex flex-col gap-1">
          <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 tracking-tight">
            Days
          </label>
          <input
            type="number"
            placeholder="0"
            className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 transition-all placeholder:text-gray-300"
            value={codDays}
            onChange={(e) => setCodDays(e.target.value)}
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-full xl:w-28">
          <StatusDropdown Status={status} setStatus={setStatus} />
        </div>

        {/* Dynamic Credentials Fields */}
        {config.fields?.map((field) => (
          <div key={field.name} className="w-full xl:w-40 flex flex-col gap-1">
            <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 tracking-tight">
              {field.label}
            </label>
            <input
              type={field.type || "text"}
              placeholder={field.placeholder}
              className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 transition-all placeholder:text-gray-300"
              value={credentials[field.name] || ""}
              onChange={(e) => handleCredentialChange(field.name, e.target.value)}
            />
          </div>
        ))}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!canAction || loading}
          className={`h-9 px-4 rounded-lg text-[11px] font-[700] transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[100px] col-span-2 xl:col-span-1 ${
            canAction && !loading
              ? "bg-[#0CBB7D] text-white hover:bg-[#0aa66e] active:scale-[0.98] shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
          }`}
        >
          {loading && (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          )}
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default CourierAdd;
