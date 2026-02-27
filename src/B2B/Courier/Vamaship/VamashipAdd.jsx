import React, { useState } from 'react';
import axios from 'axios';
import StatusDropdown from "../StatusDropdown";
import { Notification } from "../../../Notification";

const Vamaship = ({ onCourierSaved, canAction }) => {
  const [courierName, setCourierName] = useState("");
  const [codDays, setCodDays] = useState("");
  const [Status, setStatus] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSave = async () => {
    if (!courierName || !codDays || !Status || !username || !password) {
      Notification("Please fill all required fields", "info");
      return;
    }

    try {
      setLoading(true);
      const newCourier = {
        courierName,
        courierProvider: "Vamaship",
        CODDays: codDays,
        status: Status,
        credentials: { username, password },
      };

      const response = await axios.post(`${REACT_APP_BACKEND_URL}/b2b/Vamaship/authorize`, newCourier);
      Notification("B2B Vamaship courier added successfully", "success");

      setCourierName("");
      setCodDays("");
      setUsername("");
      setPassword("");
      setStatus("");

      onCourierSaved?.();
    } catch (error) {
      console.error("B2B Vamaship Save Error:", error);
      Notification(error?.response?.data?.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-fadeIn">
      <div className="grid font-[600] grid-cols-2 xl:flex xl:flex-row items-start xl:items-end gap-2 w-full">
        <div className="w-full xl:w-48 flex flex-col gap-1">
          <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 tracking-tight">Name</label>
          <input
            type="text"
            placeholder="Vamaship B2B"
            className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 transition-all placeholder:text-gray-300"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
          />
        </div>

        <div className="w-full xl:w-20 flex flex-col gap-1">
          <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 tracking-tight">Days</label>
          <input
            type="number"
            placeholder="0"
            className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 transition-all placeholder:text-gray-300"
            value={codDays}
            onChange={(e) => setCodDays(e.target.value)}
          />
        </div>

        <div className="w-full xl:w-32">
          <StatusDropdown Status={Status} setStatus={setStatus} />
        </div>

        <div className="w-full xl:w-48 flex flex-col gap-1">
          <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 tracking-tight">User/Email</label>
          <input
            type="text"
            placeholder="B2B Username"
            className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 transition-all placeholder:text-gray-300"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="w-full xl:w-40 flex flex-col gap-1">
          <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 tracking-tight">Password</label>
          <input
            type="password"
            placeholder="Password"
            className="w-full px-2 h-9 text-[10px] sm:text-[12px] text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 transition-all placeholder:text-gray-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!canAction || loading}
          className={`h-9 px-4 xl:px-6 rounded-lg text-[11px] font-[700] transition-all flex items-center justify-center gap-2 whitespace-nowrap min-w-[100px] col-span-2 xl:col-span-1 ${canAction && !loading
            ? "bg-[#0CBB7D] text-white hover:bg-[#0aa66e] active:scale-[0.98] shadow-sm"
            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            }`}
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : null}
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default Vamaship;
