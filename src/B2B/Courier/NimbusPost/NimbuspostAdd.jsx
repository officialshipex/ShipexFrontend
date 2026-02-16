import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StatusDropdown from "../StatusDropdown";

const NimbusPostAdd = ({ canAction }) => {
  const navigate = useNavigate();
  const [courierName, setCourierName] = useState("");
  const [codDays, setCodDays] = useState("");
  const [Status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSave = async () => {
    try {
      const newCourier = {
        courierName,
        courierProvider: "NimbusPost",
        CODDays: codDays,
        status: Status,
        credentials: { email, password },
      };

      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/Nimbuspost/getAuthToken`,
        newCourier
      );

      alert("Courier added successfully");
      // navigate("/dashboard/setup/courier");
    } catch (error) {
      console.error("Error validating NimbusPost credentials:", error);
      alert("Something went wrong. Please try again.");
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
            className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
          />
        </div>

        <div className="flex sm:gap-8 gap-2">
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
            Email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="w-full md:w-72">
          <label className="font-[600] block text-[10px] md:text-[12px] text-gray-500">
            Password <span className="text-red-600">*</span>
          </label>
          <input
            type="password"
            className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        className={`bg-[#0CBB7D] text-white py-2 px-4 text-[10px] sm:text-[12px] rounded-lg font-[600] mt-4 ${!canAction ? "opacity-50 cursor-not-allowed" : ""
          }`}
        onClick={handleSave}
        disabled={!canAction}
      >
        Save Courier
      </button>
    </div>
  );
};

export default NimbusPostAdd;
