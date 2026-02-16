import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import { toast } from "react-toastify";
import StatusDropdown from "../StatusDropdown";
import {Notification} from "../../../Notification"

const ShreeMaruti = ({ onCourierSaved, canAction }) => {
  const navigate = useNavigate();
  const [courierName, setCourierName] = useState("");
  const [codDays, setCodDays] = useState("");
  const [Status, setStatus] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSave = async () => {
    try {
      const newCourier = {
        courierName,
        courierProvider: "ShreeMaruti",
        CODDays: codDays,
        status: Status,
        credentials: { username, password },
      };

      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/ShreeMaruti/getAuthToken`,
        newCourier
      );

      Notification(response.data.message,"success");
      setCourierName("");
      setCodDays("");
      setUsername("");
      setPassword("");
      setStatus("");

      onCourierSaved();
    } catch (error) {
      console.error("Error validating ShreeMaruti credentials:", error);
      Notification(error?.response?.data?.message || "Something went wrong","error");
    }
  };

  return (
    <div className="w-full">
      {/* General Info */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="w-full md:w-72">
          <label className="font-[600] block text-[10px] md:text-[12px] text-gray-500">
            Courier Name
          </label>
          <input
            type="text"
            className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border focus:outline-none border-gray-300 rounded-lg"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
          />
        </div>

        <div className='flex sm:gap-8 gap-2'>
          <div className="w-full md:w-32">
            <label className="font-[600] block text-[10px] md:text-[12px] text-gray-500">
              COD Days
            </label>
            <input
              type="number"
              className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
              value={codDays}
              onChange={(e) => setCodDays(e.target.value)}
            />
          </div>

          <div className="w-full md:w-auto">
            <StatusDropdown Status={Status} setStatus={setStatus} />
          </div>
        </div>
      </div>

      {/* Credentials */}
      <h2 className="text-[10px] md:text-[14px] font-[600] text-gray-700 mt-4 mb-2">
        Credentials
      </h2>
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="w-full md:w-72">
          <label className="font-[600] block text-[10px] md:text-[12px] text-gray-500">
            Username <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border focus:outline-none border-gray-300 rounded-lg"
            placeholder="Enter Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="w-full md:w-72">
          <label className="font-[600] block text-[10px] md:text-[12px] text-gray-500">
            Password <span className="text-red-600">*</span>
          </label>
          <input
            type="password"
            className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border focus:outline-none border-gray-300 rounded-lg"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        className={`bg-[#0CBB7D] text-white py-2 px-4 text-[10px] sm:text-[12px] rounded mt-4 ${!canAction ? "opacity-50 cursor-not-allowed" : ""
          }`}
        onClick={handleSave}
        disabled={!canAction}
      >
        Save Courier
      </button>
    </div>
  );
};

export default ShreeMaruti;
