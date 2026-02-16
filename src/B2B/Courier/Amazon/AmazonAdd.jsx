import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import { toast } from "react-toastify";
import StatusDropdown from "../StatusDropdown";
import {Notification} from "../../../Notification"

const AmazonAdd = ({ onCourierSaved, canAction }) => {
  const navigate = useNavigate();
  const [courierName, setCourierName] = useState("");
  const [codDays, setCodDays] = useState("");
  const [Status, setStatus] = useState("");
  const [apiKey, setApiKey] = useState("");

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSave = async () => {
    try {
      const newCourier = {
        courierName,
        courierProvider: "Amazon",
        CODDays: codDays,
        status: Status,
        credentials: { apiKey },
      };

      const response = await axios.post(`${REACT_APP_BACKEND_URL}/Amazon/getToken`, newCourier);
      onCourierSaved?.();
      Notification(response.data.message,"success");

      setCourierName("");
      setCodDays("");
      setApiKey("");
      setStatus("");
    } catch (error) {
      Notification(error?.response?.data?.message || "Something went wrong.","error");
    }
  };

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:flex gap-8">
        <div>
          <label className="font-[600] block text-[10px] md:text-[12px] text-gray-500">Courier Name</label>
          <input
            type="text"
            className="w-72 px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border focus:outline-none border-gray-300 rounded-lg"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
          />
        </div>
        <div>
          <label className="font-[600] block text-[10px] md:text-[12px] text-gray-500">COD Days</label>
          <input
            type="number"
            className="w-32 px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
            value={codDays}
            onChange={(e) => setCodDays(e.target.value)}
          />
        </div>
        <div>
          <StatusDropdown Status={Status} setStatus={setStatus} />
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-4">
        <div>
          <label className="font-[600] block text-[10px] text-gray-500">Courier Name</label>
          <input
            type="text"
            className="w-full px-3 text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
          />
        </div>
        <div className='flex gap-2 justify-between'>
          <div className='w-full'>
            <label className="font-[600] block text-[10px] text-gray-500">COD Days</label>
            <input
              type="number"
              className="w-full px-3 text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
              value={codDays}
              onChange={(e) => setCodDays(e.target.value)}
            />
          </div>
          <div className='w-full'>
            <StatusDropdown Status={Status} setStatus={setStatus} />
          </div>
        </div>
      </div>

      {/* Credentials Heading */}
      <h2 className="text-[10px] md:text-[14px] font-[600] text-gray-700 mt-4 mb-2">Credentials</h2>

      {/* Credentials Input - Shared */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="w-full md:w-72">
          <label className="font-[600] text-[10px] sm:text-[12px] text-gray-500">API Key <span className="text-red-600">*</span></label>
          <input
            type="email"
            className="w-full px-3 text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
            placeholder="Enter API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        className={`bg-[#0CBB7D] text-white py-2 px-4 text-[12px] rounded mt-4 ${!canAction ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleSave}
        disabled={!canAction}
      >
        Save Courier
      </button>
    </div>
  );
};

export default AmazonAdd;
