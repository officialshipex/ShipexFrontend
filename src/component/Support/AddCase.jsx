import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";

function CustomDropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <label className="block text-[12px] font-[600] text-gray-700 mb-1">
        {label}
        <span className="text-red-500">*</span>
      </label>
      <button
        type="button"
        className={`w-full flex justify-between items-center border rounded px-2 py-2 text-[12px] bg-white transition-all duration-200
          ${open ? "ring-2 ring-[#0CBB7D] bg-green-50" : ""}
          ${disabled ? "bg-gray-100 cursor-not-allowed" : "hover:bg-green-50"}
          focus:outline-none focus:ring-2 focus:ring-[#0CBB7D]
        `}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        tabIndex={0}
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`absolute left-0 right-0 z-10 bg-white border rounded shadow-lg mt-1 transition-all duration-200 origin-top
          ${
            open
              ? "scale-y-100 opacity-100"
              : "scale-y-95 opacity-0 pointer-events-none"
          }
        `}
        style={{ maxHeight: 180, overflowY: "auto" }}
      >
        {options.map((opt) => (
          <div
            key={opt}
            className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-green-50 transition-colors
              ${
                opt === value ? "bg-green-100 font-semibold text-[#0CBB7D]" : ""
              }
            `}
            onClick={() => {
              onChange(opt);
              setOpen(false);
            }}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AddCase({ isOpen, onClose, refresh }) {
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [awbType, setAwbType] = useState("");
  const [awbInputType, setAwbInputType] = useState("");
  const [awbNumbers, setAwbNumbers] = useState([]);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [userDetails, setUserDetails] = useState(null);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const categories = [
    "Shipment Dispute",
    "Finance",
    "Pickup & Delivery",
    "Shipment NDR & RTO",
    "KYC & Bank Verification",
    "Technical Support",
    "Billing & Taxation",
    "Claims",
    "Others",
  ];
  const subcategories = {
    "Shipment Dispute": [
      "Issue Over Weight Discrepancy",
      "Issues with Delivered Shipment",
      "Status Mismatch Issues",
      "Delivered Not Received",
      "Wrong/Damaged/Partial/Empty Package Delivered",
    ],
    Finance: [
      "Delay in COD Remittance",
      "Request to Hold COD Remittance",
      "Transfer Wallet Amount into My Bank Account",
      "Issue in Recharging Wallet",
      "Request to Revise shipping charges",
      "Wallet Showing Negative Balance",
    ],
    "Pickup & Delivery": [
      "Delay in Forward Delivery",
      "Delay in RTO Delivery",
      "Delay in Pickup",
      "Shipment Showing as Lost/Damaged in Tracking",
      "Shipment picked up but status is incorrect",
    ],
    "Shipment NDR & RTO": [
      "Issue Over Undelivered Shipment",
      "Request to Mark Shipment as RTO",
    ],
    "KYC & Bank Verification": [
      "Issues with KYC Verification",
      "Request to Unfreeze KYC",
      "Request to Unfreeze Bank Details",
    ],
    "Technical Support": [
      "Issues with Channel & API Integration",
      "Request to Managing Orders",
      "Order/Shipment Cancellation",
    ],
    "Billing & Taxation": [
      "Account Ledger Statement Needed",
      "TDS Form Required for Tax Return",
      "Issue with Invoice",
      "Need Help with GST",
    ],
    Claims: [
      "Issues with Lost/Damaged/Wrong delivery etc claim amount",
      "Credit Note Details Required",
    ],
    Others: [
      "Issues with WhatsApp Communication",
      "Issues with Tracking page",
      "Issues with COD Remmitance terms",
      "My Issue is Not Listed",
      "Enable/Disable Click to Call Service",
    ],
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/user/getUserDetails`,
          { headers: { authorization: `Bearer ${token}` } }
        );
        if (response.data.success) setUserDetails(response.data.user);
      } catch (error) {}
    };
    if (isOpen) fetchUserDetails();
  }, [isOpen, REACT_APP_BACKEND_URL]);

  const resetForm = () => {
    setCategory("");
    setSubcategory("");
    setAwbType("");
    setAwbInputType("");
    setAwbNumbers([]);
    setMessage("");
    setAttachments([]);
    onClose();
  };

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !subcategory || !message) {
      Notification("Please fill all required fields.","info");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("subcategory", subcategory);
      if (awbType) formData.append("awbType", awbType);
      if (awbNumbers.length > 0)
        formData.append("awbNumbers", awbNumbers.join(","));
      formData.append("message", message);
      formData.append("status", "active");
      if (userDetails) {
        formData.append("fullname", userDetails.fullname);
        formData.append("phoneNumber", userDetails.phoneNumber);
        formData.append("email", userDetails.email);
        formData.append("isAdmin", userDetails.isAdmin);
        formData.append("company", userDetails.company);
      }
      attachments.forEach((file) => formData.append("attachments", file));
      const token = Cookies.get("session");
      await axios.post(`${REACT_APP_BACKEND_URL}/support`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Notification("Your case has been created successfully!","success");
      resetForm();
      if (refresh) refresh(true);
    } catch (error) {
      Notification("Error creating case. Please try again.","error");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 backdrop-blur-sm px-2 z-[1000] animate-fadeIn"
      style={{ animation: "fadeInModal 0.3s cubic-bezier(.4,0,.2,1)" }}
    >
      <form
        className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-6xl flex flex-col gap-4 animate-modalPop md:h-[650px] overflow-y-auto relative"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        style={{ animation: "modalPop 0.4s cubic-bezier(.4,0,.2,1)" }}
      >
        {/* Cross Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-[#0CBB7D] bg-gray-100 hover:bg-green-50 rounded-full p-1 transition z-10"
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="pointer-events-none"
          >
            <line
              x1="5"
              y1="5"
              x2="15"
              y2="15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="15"
              y1="5"
              x2="5"
              y2="15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-700 text-[14px]">
          Create Ticket
        </h2>
        {/* Category & Subcategory in one row (mobile: stacked) */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="w-full md:w-1/2">
            <CustomDropdown
              label="Category"
              options={categories}
              value={category}
              onChange={(val) => {
                setCategory(val);
                setSubcategory("");
              }}
              placeholder="Select category"
              disabled={false}
            />
          </div>
          <div className="w-full md:w-1/2">
            <CustomDropdown
              label="Subcategory"
              options={category ? subcategories[category] || [] : []}
              value={subcategory}
              onChange={setSubcategory}
              placeholder="Select subcategory"
              disabled={!category}
            />
          </div>
        </div>
        {/* AWB Type */}
        <div>
          <label className="block text-[12px] font-[600] text-gray-700 mb-1">
            AWB Number Type
          </label>
          <div className="flex gap-4">
  <label className="flex items-center cursor-pointer text-[12px]">
    <input
      type="radio"
      name="awbType"
      value="single"
      checked={awbType === "single"}
      onChange={() => { setAwbType("single"); setAwbInputType(""); setAwbNumbers([]); }}
      className="accent-[#0CBB7D] mr-1 focus:ring-0 focus:outline-none"
      style={{ boxShadow: "none" }}
    /> <span className="ml-1 text-gray-700">Single</span>
  </label>
  <label className="flex items-center cursor-pointer text-[12px]">
    <input
      type="radio"
      name="awbType"
      value="multiple"
      checked={awbType === "multiple"}
      onChange={() => { setAwbType("multiple"); setAwbInputType(""); setAwbNumbers([]); }}
      className="accent-[#0CBB7D] mr-1 focus:ring-0 focus:outline-none"
      style={{ boxShadow: "none" }}
    /> <span className="ml-1 text-gray-700">Multiple</span>
  </label>
</div>

        </div>
        {/* AWB Input */}
        {awbType === "single" && (
          <div>
            <label className="block text-[12px] font-[600] text-gray-700 mb-1">
              AWB Number
            </label>
            <input
              type="text"
              className="w-full border rounded px-2 py-2 text-[12px] focus:ring-2 focus:ring-[#0CBB7D] transition bg-white focus:outline-none"
              value={awbNumbers[0] || ""}
              onChange={(e) => setAwbNumbers([e.target.value])}
              placeholder="Enter AWB number"
              style={{ boxShadow: "none" }}
            />
          </div>
        )}
        {awbType === "multiple" && (
          <div>
            <label className="block text-[12px] font-[600] text-gray-700 mb-1">
              AWB Input Method
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer text-[12px]">
                <input
                  type="radio"
                  name="awbInputType"
                  value="manual"
                  checked={awbInputType === "manual"}
                  onChange={() => {
                    setAwbInputType("manual");
                    setAwbNumbers([]);
                  }}
                  className="accent-[#0CBB7D] mr-1 focus:ring-0 focus:outline-none"
                  style={{ boxShadow: "none" }}
                />{" "}
                <span className="ml-1">Enter Manually</span>
              </label>
              <label className="flex items-center cursor-pointer text-[12px]">
                <input
                  type="radio"
                  name="awbInputType"
                  value="upload"
                  checked={awbInputType === "upload"}
                  onChange={() => {
                    setAwbInputType("upload");
                    setAwbNumbers([]);
                  }}
                  className="accent-[#0CBB7D] mr-1 focus:ring-0 focus:outline-none"
                  style={{ boxShadow: "none" }}
                />{" "}
                <span className="ml-1">Upload File</span>
              </label>
            </div>
            {awbInputType === "manual" && (
              <textarea
                className="w-full border rounded px-2 py-1 mt-2 text-[12px] focus:ring-2 focus:ring-[#0CBB7D] transition bg-white focus:outline-none"
                rows={2}
                value={awbNumbers.join(", ")}
                onChange={(e) =>
                  setAwbNumbers(e.target.value.split(",").map((a) => a.trim()))
                }
                placeholder="Enter AWB numbers separated by commas"
                style={{ boxShadow: "none" }}
              />
            )}
            {awbInputType === "upload" && (
              <label className="flex flex-col items-start mt-2 w-full">
                <span className="mb-1 text-[12px] text-gray-500">
                  Upload .xlsx, .xls, .csv, .txt
                </span>
                <div className="relative w-full">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt"
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const text = await file.text();
                      const awbs = text
                        .split(/[\s,]+/)
                        .map((a) => a.trim())
                        .filter(Boolean);
                      setAwbNumbers(awbs);
                    }}
                  />
                  <div className="flex items-center gap-2 border border-dashed border-[#0CBB7D] rounded px-3 py-2 bg-green-50 text-[#0CBB7D] text-[12px] cursor-pointer hover:bg-green-100 transition">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    <span>Choose file</span>
                  </div>
                </div>
              </label>
            )}
          </div>
        )}
        {/* Message */}
        <div>
          <label className="block text-[12px] font-[600] text-gray-700 mb-1">
            Tell us about your issue<span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border rounded px-2 py-1 text-[12px] focus:ring-2 focus:ring-[#0CBB7D] transition bg-white focus:outline-none"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="Describe your issue"
            style={{ boxShadow: "none" }}
          />
        </div>
        {/* Attachments */}
        <div>
          <label className="block text-[12px] font-[600] text-gray-700 mb-1">
            Upload file/image (optional)
          </label>
          <label className="flex flex-col items-start w-full">
            <span className="mb-1 text-[12px] text-gray-500">
              Supported: images, pdf, doc, xls, csv, txt
            </span>
            <div className="relative w-full">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                onChange={handleFileChange}
              />
              <div className="flex items-center gap-2 border border-dashed border-[#0CBB7D] rounded px-3 py-2 bg-green-50 text-[#0CBB7D] text-[12px] cursor-pointer hover:bg-green-100 transition">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                <span>Choose files</span>
              </div>
            </div>
            {attachments.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {attachments.map((file, idx) => (
                  <span
                    key={idx}
                    className="bg-green-100 text-[#0CBB7D] px-2 py-0.5 rounded text-[11px]"
                  >
                    {file.name}
                  </span>
                ))}
              </div>
            )}
          </label>
        </div>
        {/* Fixed Buttons */}

        {/* Fixed Footer Buttons Inside Modal */}
        <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 px-4 py-2 flex justify-between md:justify-end gap-2">
          <button
            type="button"
            onClick={resetForm}
            className="border border-gray-300 text-gray-500 px-3 py-2 rounded-lg bg-gray-200 font-semibold text-[12px] hover:bg-green-50 transition w-1/2 md:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#0CBB7D] text-white px-4 py-2 rounded-lg font-semibold text-[12px] hover:bg-green-600 transition w-1/2 md:w-auto"
          >
            Submit
          </button>
        </div>

        {/* Spacer for fixed buttons on mobile */}
        <div className="h-16 md:hidden" />
        {/* Animations */}
        <style>{`
          @keyframes fadeInModal {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fadeIn { animation: fadeInModal 0.3s; }
          @keyframes modalPop {
            0% { transform: scale(0.95) translateY(30px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
          .animate-modalPop { animation: modalPop 0.3s; }
        `}</style>
      </form>
    </div>
  );
}
