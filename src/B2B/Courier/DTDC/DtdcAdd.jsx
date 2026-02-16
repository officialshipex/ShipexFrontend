import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StatusDropdown from "../StatusDropdown";

const Dtdc = ({ canAction }) => {
  const navigate = useNavigate();
  const [courierName, setCourierName] = useState("");
  const [codDays, setCodDays] = useState("");
  const [status, setStatus] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSave = async () => {
    try {
      const newCourier = {
        courierName,
        courierProvider: "DTDC",
        CODDays: codDays,
        status,
        credentials: { apiKey, username, password, token },
      };
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/DTDC/getToken`,
        newCourier
      );
      console.log(response.data);

      alert("Courier added successfully");
      // navigate("/dashboard/setup/courier");
    } catch (error) {
      console.error("Error validating DTDC credentials:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="w-full">
      {/* Courier Info (Responsive) */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="w-full md:w-72">
          <label className="font-[600] text-[10px] md:text-[12px] text-gray-500">Courier Name</label>
          <input
            type="text"
            className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
          />
        </div>

        <div className="w-full md:w-32">
          <label className="font-[600] text-[10px] md:text-[12px] text-gray-500">COD Days</label>
          <input
            type="number"
            className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
            value={codDays}
            onChange={(e) => setCodDays(e.target.value)}
          />
        </div>

        <div className="w-full md:w-auto">
          <StatusDropdown Status={status} setStatus={setStatus} />
        </div>
      </div>

      {/* Credentials Section */}
      <h2 className="text-[10px] md:text-[14px] font-[600] text-gray-700 mt-4 mb-2">
        Credentials
      </h2>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 md:gap-8">
        <div className="w-full md:w-72">
          <label className="font-[600] text-[10px] md:text-[12px] text-gray-500">
            API Key <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
            placeholder="Enter API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="w-full md:w-72">
          <label className="font-[600] text-[10px] md:text-[12px] text-gray-500">
            Username <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="w-full md:w-72">
          <label className="font-[600] text-[10px] md:text-[12px] text-gray-500">
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

        <div className="w-full md:w-72">
          <label className="font-[600] text-[10px] md:text-[12px] text-gray-500">
            Token <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            className="w-full px-3 text-[10px] md:text-[12px] text-gray-500 h-9 border border-gray-300 rounded-lg focus:outline-none"
            placeholder="Enter Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        className={`bg-[#0CBB7D] text-white py-2 px-4 text-[10px] sm:text-[12px] rounded mt-4 ${!canAction ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleSave}
        disabled={!canAction}
      >
        Save Courier
      </button>
    </div>
  );
};

export default Dtdc;
