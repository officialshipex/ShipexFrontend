import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Notification } from "../../Notification";
import Cookies from "js-cookie";
import { FiX, FiArrowLeft, FiChevronDown } from "react-icons/fi";

/* Custom styled dropdown — replaces default <select> */
const CustomSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-[12px] font-[600] text-gray-700 bg-white hover:border-[#0CBB7D] focus:outline-none focus:ring-2 focus:ring-[#0CBB7D] transition-colors"
      >
        <span>{value}</span>
        <FiChevronDown
          size={12}
          className={`text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[12px] font-[600] transition-colors ${
                value === opt
                  ? "text-[#0CBB7D] bg-[#0CBB7D]/10"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const EarlyCODModal = ({ isOpen, onClose, userId, isAdmin }) => {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [plans, setPlans] = useState("");
  const [existingPlanData, setExistingPlanData] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customPlan, setCustomPlan] = useState({
    planName: "D+1",
    codCharge: "",
    remittanceDay: "Monday",
  });
  const [customLoading, setCustomLoading] = useState(false);
  const { id } = useParams();

  const params = { id: userId || id };

  const check = async () => {
    try {
      const token = Cookies.get("session");
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/cod/CheckCodplan`,
        { params, headers: { Authorization: `Bearer ${token}` } }
      );
      setPlans(String(response.data.codplaneName));
      setExistingPlanData(response.data);
    } catch (error) {
      console.error("Error fetching COD plan:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      check();
      setShowCustomForm(false);
      setCustomPlan({ planName: "D+1", codCharge: "", remittanceDay: "Monday" });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleActivate = async (planName, codAmount) => {
    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/cod/codPlanUpdate`,
        { planName, codAmount },
        { params, headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200 || response.status === 201) {
        Notification(`Successfully activated ${planName} plan!`, "success");
        setPlans(planName);
      }
    } catch (error) {
      console.error("Error activating plan:", error);
      Notification("Failed to activate plan. Please try again.", "error");
    }
  };

  const handleCustomSubmit = async () => {
    if (!customPlan.codCharge && customPlan.codCharge !== 0) {
      Notification("Please enter COD charge percentage", "error");
      return;
    }
    setCustomLoading(true);
    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/cod/saveCustomCodPlan`,
        {
          planName: customPlan.planName,
          codCharge: Number(customPlan.codCharge),
          remittanceDay: customPlan.remittanceDay,
        },
        { params, headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        Notification("Custom COD plan saved successfully!", "success");
        setPlans(customPlan.planName);
        setShowCustomForm(false);
        onClose();
      }
    } catch (error) {
      console.error("Error saving custom plan:", error);
      Notification("Failed to save custom plan. Please try again.", "error");
    } finally {
      setCustomLoading(false);
    }
  };

  const codCycles = ["D+1", "D+2", "D+3", "D+4", "D+5", "D+6"];
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const codPlans = [
    { name: "D+2", amount: 0.99, label: "D + 2 Days", bg: "bg-gradient-to-b from-[#E9FBF4] to-[#BFF1DF] border-2 border-[#0CBB7D] text-[#064E3B]" },
    { name: "D+3", amount: 0.69, label: "D + 3 Days", bg: "bg-white border border-gray-300 text-gray-500" },
    { name: "D+4", amount: 0.49, label: "D + 4 Days", bg: "bg-white border border-gray-300 text-gray-500" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed animate-popup-in inset-0 flex items-center bg-gray-700 justify-center bg-opacity-50 px-2 z-50">
      {/* Popup width is narrow when custom form is open */}
      <div
        className={`bg-white rounded-lg p-4 w-full relative max-h-[85dvh] flex flex-col transition-all ${
          showCustomForm
            ? "max-w-[95%] sm:max-w-[360px]"
            : "max-w-[95%] md:max-w-[70%] lg:max-w-[55%] xl:max-w-[65%]"
        }`}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 z-10"
          onClick={onClose}
        >
          <FiX size={14} />
        </button>

        {showCustomForm ? (
          /* ── Custom Plan Form ── */
          <div className="flex flex-col">
            {/* Header row */}
            <div className="flex items-center gap-2 mb-5 pr-6">
              <button
                onClick={() => setShowCustomForm(false)}
                className="text-gray-500 hover:text-[#0CBB7D] flex items-center gap-1 text-[12px] font-[600] transition-colors"
              >
                <FiArrowLeft size={13} />
              </button>
              <h2 className="text-[14px] font-[600] text-gray-700">Custom COD Plan</h2>
            </div>

            {/* Form fields — single column */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-[600] text-gray-500 mb-1.5 uppercase tracking-wide">
                  COD Cycle
                </label>
                <CustomSelect
                  value={customPlan.planName}
                  onChange={(val) => setCustomPlan((p) => ({ ...p, planName: val }))}
                  options={codCycles}
                />
              </div>

              <div>
                <label className="block text-[11px] font-[600] text-gray-500 mb-1.5 uppercase tracking-wide">
                  COD Charge (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPlan.codCharge}
                  onChange={(e) =>
                    setCustomPlan((p) => ({ ...p, codCharge: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] font-[600] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0CBB7D] focus:border-transparent"
                  placeholder="e.g. 1.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-[600] text-gray-500 mb-1.5 uppercase tracking-wide">
                  Remittance Day
                </label>
                <CustomSelect
                  value={customPlan.remittanceDay}
                  onChange={(val) => setCustomPlan((p) => ({ ...p, remittanceDay: val }))}
                  options={daysOfWeek}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCustomForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-[12px] font-[600] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomSubmit}
                disabled={customLoading}
                className="px-4 py-2 bg-[#0CBB7D] text-white rounded-lg text-[12px] font-[600] hover:bg-green-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {customLoading ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        ) : (
          /* ── Standard Plan Cards ── */
          <>
            {/* Header with Custom button top-right */}
            <div className="flex items-start justify-between mb-2 pr-6">
              <div>
                <h2 className="text-[14px] font-[600] text-gray-700">Get Early COD</h2>
                <p className="text-gray-500 text-[11px] sm:text-[12px] mt-0.5">
                  Why Wait? Scale your business with <b>Daily COD remittance</b>
                </p>
              </div>
              {!!isAdmin && (
                <button
                  onClick={() => {
                    if (existingPlanData?.isCustom) {
                      setCustomPlan({
                        planName: existingPlanData.codplaneName || "D+1",
                        codCharge: existingPlanData.planCharges ?? "",
                        remittanceDay: existingPlanData.remittanceDay || "Monday",
                      });
                    }
                    setShowCustomForm(true);
                  }}
                  className="ml-3 flex-shrink-0 px-3 py-1.5 border border-[#0CBB7D] text-[#0CBB7D] rounded-lg text-[11px] font-[600] hover:bg-[#0CBB7D] hover:text-white transition-colors"
                >
                  Custom
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-grow pr-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                {codPlans.map((plan) => (
                  <div key={plan.name} className={`p-4 rounded-lg flex flex-col ${plan.bg}`}>
                    {plan.name === "D+2" && (
                      <div className="bg-yellow-400 text-[10px] font-[600] px-2 py-1 rounded-lg w-fit mb-2">
                        RECOMMENDED
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
                      className={`w-full py-2 text-[12px] font-[600] mt-3 rounded-lg border transition-all ${
                        plans === plan.name
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
          </>
        )}
      </div>
    </div>
  );
};

export default EarlyCODModal;
