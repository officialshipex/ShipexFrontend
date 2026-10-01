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
    endpoint: "/Shiprocket/getAuthToken",
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
      { name: "tenantId", label: "Tenant ID", placeholder: "Optional — overrides default", type: "text", optional: true },
      { name: "carrierId", label: "Carrier ID", placeholder: "Optional — overrides default", type: "text", optional: true },
      { name: "carrierName", label: "Carrier Name", placeholder: "Optional — overrides default", type: "text", optional: true },
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
      { name: "clientId", label: "Client ID", placeholder: "Client ID", type: "text" },
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
  Shadowfax: {
    endpoint: "/Shadowfax/getAuthToken",
    fields: [
      { name: "apiKey", label: "API Token", placeholder: "Enter Shadowfax Production Token", type: "text" },
    ],
  },
  // Admins only ever see "ShipMaxx"; the backend talks to Losung360 internally.
  ShipMaxx: {
    endpoint: "/Losung360/getAuthToken",
    fields: [
      { name: "username", label: "User/Email", placeholder: "Username/Email", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
      { name: "channelId", label: "Channel ID", placeholder: "Channel ID given for this account", type: "text" },
    ],
  },
  Jiffy: {
    endpoint: "/Jiffy/addCourier",
    fields: [
      { name: "email", label: "Email", placeholder: "API Email", type: "email" },
      { name: "password", label: "Password", placeholder: "API Password", type: "password" },
    ],
  },
};

// B2B (Setup > B2B Courier) has its own backend routes and credential store
// (B2BallCourier). Only couriers with a real B2B integration are listed; the
// B2C configs above must never be used from the B2B screen, or the courier is
// saved as a B2C account and B2B keeps running without its own credentials.
const b2bCourierConfigs = {
  Shiprocket: {
    endpoint: "/b2b/shiprocket/getToken",
    provider: "Shiprocket",
    fields: [
      { name: "clientId", label: "Client ID", placeholder: "Shiprocket Cargo Client ID", type: "text" },
      { name: "refreshToken", label: "Refresh Token", placeholder: "Refresh Token", type: "password" },
      { name: "authToken", label: "Auth Token", placeholder: "Auth Token", type: "password" },
    ],
  },
  Delhivery: {
    endpoint: "/b2b/delhivery/getToken",
    provider: "Delhivery",
    fields: [
      { name: "username", label: "User", placeholder: "B2B Username", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
    ],
  },
  BigShip: {
    endpoint: "/b2b/bigship/getToken",
    provider: "BigShip",
    fields: [
      { name: "username", label: "User/Email", placeholder: "API Username", type: "text" },
      { name: "password", label: "Password", placeholder: "Password", type: "password" },
      { name: "accessKey", label: "Access Key", placeholder: "API Access Key", type: "text" },
    ],
  },
};

const CourierAdd = ({ provider, onCourierSaved, canAction, existingCouriers, isB2B = false }) => {
  const [courierName, setCourierName] = useState("");
  const [codDays, setCodDays] = useState("");
  const [status, setStatus] = useState("");
  const [liabilityCharge, setLiabilityCharge] = useState("");
  const [liabilityPercent, setLiabilityPercent] = useState("");
  const [credentials, setCredentials] = useState({});
  const [loading, setLoading] = useState(false);

  const config = (isB2B ? b2bCourierConfigs[provider] : courierConfigs[provider]) || {};
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Reset fields when provider changes
  useEffect(() => {
    setCourierName("");
    setCodDays("");
    setStatus("");
    setLiabilityCharge("");
    setLiabilityPercent("");
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

    // Dynamic credentials validation (skip fields explicitly marked optional)
    const missingField = config.fields?.find(field => !field.optional && !credentials[field.name]);
    if (missingField) {
      Notification(`Please enter ${missingField.label}`, "info");
      return;
    }

    // Check for existing courier with same email, username, API key, or name
    if (existingCouriers && existingCouriers.length > 0) {
      // 1. Global check for Name
      const nameDuplicate = existingCouriers.find(c => c.courierName.toLowerCase() === courierName.toLowerCase());
      if (nameDuplicate) {
        Notification(`Courier with name "${courierName}" already exists. Please use a unique name.`, "error");
        return;
      }

      // 2. Provider-specific check for Credentials
      const credDuplicate = existingCouriers.find(c => {
        const currentProvider = config.provider || provider;
        if (c.courierProvider !== currentProvider) return false;

        const inputEmail = credentials.email || credentials.username;
        if (inputEmail && c.email === inputEmail) return true;

        const inputApiKey = credentials.apiKey;
        if (inputApiKey && c.apiKey === inputApiKey) return true;

        return false;
      });

      if (credDuplicate) {
        const identifier = credentials.apiKey ? 'API Key' : 'Email/Username';
        Notification(`${provider} with this ${identifier} already exists.`, "error");
        return;
      }
    }

    try {
      setLoading(true);
      const newCourier = {
        courierName,
        courierProvider: config.provider || provider,
        CODDays: codDays,
        status: status,
        ...(isB2B
          ? {}
          : {
              liabilityCharge: liabilityCharge ? parseFloat(liabilityCharge) : 0,
              liabilityPercent: liabilityPercent ? parseFloat(liabilityPercent) : 0,
            }),
        credentials: Object.fromEntries(
          Object.entries(credentials).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
        ),
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
      setLiabilityCharge("");
      setLiabilityPercent("");
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

  if (!config.endpoint) {
    return isB2B && provider ? (
      <p className="text-[11px] font-[600] text-gray-500 py-2">
        {provider} does not have a B2B integration yet.
      </p>
    ) : null;
  }

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
            className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-gray-300"
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
            className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-gray-300"
            value={codDays}
            onChange={(e) => setCodDays(e.target.value)}
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-full xl:w-28">
          <StatusDropdown Status={status} setStatus={setStatus} />
        </div>

        {/* Liability fields: B2C only (the B2B courier record has none) */}
        {!isB2B && (<>
        {/* Liability Amount Field */}
        <div className="w-full xl:w-32 flex flex-col gap-1">
          <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 tracking-tight">
            Liability ₹
          </label>
          <input
            type="number"
            placeholder="e.g. 2000"
            className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-gray-300"
            value={liabilityCharge}
            onChange={(e) => setLiabilityCharge(e.target.value)}
          />
        </div>

        {/* Liability Percent Field */}
        <div className="w-full xl:w-24 flex flex-col gap-1">
          <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 tracking-tight">
            Liability %
          </label>
          <input
            type="number"
            placeholder="e.g. 70"
            className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-gray-300"
            value={liabilityPercent}
            onChange={(e) => setLiabilityPercent(e.target.value)}
          />
        </div>
        </>)}

        {/* Dynamic Credentials Fields */}
        {config.fields?.map((field) => (
          <div key={field.name} className="w-full xl:w-40 flex flex-col gap-1">
            <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 tracking-tight">
              {field.label}
            </label>
            <input
              type={field.type || "text"}
              placeholder={field.placeholder}
              className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-gray-300"
              value={credentials[field.name] || ""}
              onChange={(e) => handleCredentialChange(field.name, e.target.value)}
            />
          </div>
        ))}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!canAction || loading}
          className={`h-9 px-4 rounded-lg text-[11px] font-[700] transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[100px] col-span-2 xl:col-span-1 ${canAction && !loading
              ? "bg-brand-primary text-white hover:bg-[#0aa66e] active:scale-[0.98] shadow-sm"
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
