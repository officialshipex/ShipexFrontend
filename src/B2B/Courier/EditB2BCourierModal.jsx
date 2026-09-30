import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FaLock, FaTimes, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import { Notification } from "../../Notification";
import { getCarrierLogo } from "../../Common/getCarrierLogo";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Keys that are internal database metadata or locked identifiers
const EXCLUDED_KEYS = new Set([
  "_id",
  "__v",
  "date",
  "createdAt",
  "updatedAt",
  "courierId",
  "isActive",
  "courierName",
  "courierProvider",
]);

// Field metadata for friendly labels, types, and input controls
const FIELD_META = {
  status: {
    label: "Status",
    type: "select",
    options: ["Enable", "Disable"],
    colSpan: "sm:col-span-1",
  },
  CODDays: {
    label: "COD Contract (Days)",
    type: "number",
    min: 0,
    placeholder: "e.g. 5",
    colSpan: "sm:col-span-1",
  },
  username: {
    label: "Username / User",
    type: "text",
    placeholder: "B2B API Username",
    colSpan: "sm:col-span-1",
  },
  email: {
    label: "Email",
    type: "text",
    placeholder: "B2B Account Email",
    colSpan: "sm:col-span-1",
  },
  password: {
    label: "Password",
    type: "password",
    placeholder: "Leave blank to keep unchanged",
    colSpan: "sm:col-span-1",
  },
  apiKey: {
    label: "API Key",
    type: "text",
    placeholder: "B2B API Key",
    isMono: true,
    colSpan: "sm:col-span-2",
  },
  clientId: {
    label: "Client ID",
    type: "text",
    placeholder: "B2B Client ID",
    colSpan: "sm:col-span-1",
  },
  refreshToken: {
    label: "Refresh Token",
    type: "text",
    placeholder: "OAuth Refresh Token",
    isMono: true,
    colSpan: "sm:col-span-2",
  },
  authToken: {
    label: "Auth Token",
    type: "text",
    placeholder: "Session or Bearer Token",
    isMono: true,
    colSpan: "sm:col-span-2",
  },
};

const formatKeyLabel = (key) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const EditB2BCourierModal = ({ isOpen, onClose, courier, onCourierUpdated }) => {
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Extract only keys that are actually present on this courier document in the database
  const editableKeys = useMemo(() => {
    if (!courier) return [];
    return Object.keys(courier).filter((key) => !EXCLUDED_KEYS.has(key));
  }, [courier]);

  useEffect(() => {
    if (courier) {
      const initial = {};
      editableKeys.forEach((key) => {
        if (key === "password") {
          initial[key] = "";
        } else {
          initial[key] =
            courier[key] !== undefined && courier[key] !== null
              ? String(courier[key])
              : "";
        }
      });
      setFormData(initial);
      setShowPassword(false);
    }
  }, [courier, editableKeys]);

  if (!isOpen || !courier) return null;

  const courierName = courier.courierName || "";
  const providerName = courier.courierProvider || courier.courierName || "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build payload containing ONLY keys that exist in the database for this courier
      const payload = {};
      editableKeys.forEach((key) => {
        if (key === "password") {
          if (formData.password && formData.password.trim() !== "") {
            payload.password = formData.password.trim();
          }
        } else if (key === "CODDays") {
          payload[key] = formData[key] !== "" ? Number(formData[key]) : 0;
        } else {
          payload[key] = formData[key];
        }
      });

      const res = await axios.put(
        `${REACT_APP_BACKEND_URL}/b2b/couriers/updateCourier/${courier._id}`,
        payload
      );

      Notification("B2B Courier updated successfully!", "success");
      onCourierUpdated?.(res.data?.courier || { ...courier, ...payload });
      onClose();
    } catch (error) {
      console.error("Error updating B2B courier:", error);
      Notification(
        error.response?.data?.message || "Failed to update B2B courier credentials",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-gray-200 flex items-center justify-center shadow-xs">
              <img
                src={getCarrierLogo(providerName)}
                alt={providerName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Edit B2B Courier
                </span>
                <span className="text-[10px] text-gray-500 font-medium">B2B Integration</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 leading-snug">
                {courierName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <FaTimes size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
            {/* Non-Editable Info Banner */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
              <FaLock className="text-amber-600 mt-0.5 w-3.5 h-3.5 shrink-0" />
              <div className="text-[11px] leading-relaxed">
                <strong>Provider and Courier Name cannot be modified</strong> to preserve linked B2B service routes and rate cards.
              </div>
            </div>

            {/* Readonly Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Courier Name (Locked)
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-semibold cursor-not-allowed">
                  <FaLock className="text-gray-400 text-[10px]" />
                  <span className="truncate">{courierName}</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Courier Provider (Locked)
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-semibold cursor-not-allowed">
                  <FaLock className="text-gray-400 text-[10px]" />
                  <span className="truncate">{providerName}</span>
                </div>
              </div>
            </div>

            {/* Editable Configuration Fields - ONLY keys present in database */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Configured Settings ({editableKeys.length})
                </h4>
                <span className="text-[10px] text-gray-400">
                  Only database-configured keys shown
                </span>
              </div>

              {editableKeys.length === 0 ? (
                <div className="p-4 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No additional editable parameters configured for this courier.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editableKeys.map((key) => {
                    const meta = FIELD_META[key] || {
                      label: formatKeyLabel(key),
                      type: typeof courier[key] === "number" ? "number" : "text",
                      colSpan: "sm:col-span-1",
                    };

                    if (meta.type === "select") {
                      return (
                        <div key={key} className={meta.colSpan || "sm:col-span-1"}>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            {meta.label}
                          </label>
                          <select
                            name={key}
                            value={formData[key] ?? "Enable"}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-primary bg-white"
                          >
                            {(meta.options || ["Enable", "Disable"]).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if (meta.type === "password") {
                      return (
                        <div key={key} className={meta.colSpan || "sm:col-span-1"}>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                            {meta.label}
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name={key}
                              value={formData[key] ?? ""}
                              onChange={handleChange}
                              placeholder={meta.placeholder || "Leave blank to keep unchanged"}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-brand-primary pr-9"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className={meta.colSpan || "sm:col-span-1"}>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          {meta.label}
                        </label>
                        <input
                          type={meta.type || "text"}
                          min={meta.min}
                          name={key}
                          value={formData[key] ?? ""}
                          onChange={handleChange}
                          placeholder={meta.placeholder || `Enter ${meta.label}`}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-brand-primary ${
                            meta.isMono ? "font-mono" : ""
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-primary hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <FaSave size={12} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditB2BCourierModal;
