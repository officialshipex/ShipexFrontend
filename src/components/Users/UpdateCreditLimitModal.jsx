import React, { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";

const UpdateCreditLimitEditModal = ({
  isOpen,
  onClose,
  userId,
  currentValue,
  refreshUserData,   // 🔥 Tell parent to refresh UI
}) => {
  const [newValue, setNewValue] = useState(currentValue || "");

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSave = async () => {
    try {
      const token = Cookies.get("session");

      await axios.put(
        `${REACT_APP_BACKEND_URL}/user/updateCreditLimit`,
        {
          userId,
          creditLimit: newValue,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Notification("Credit limit updated successfully!", "success");

      refreshUserData();  // 🔥 Refresh data in parent
      onClose();          // 🔥 Close the modal
    } catch (error) {
      console.error("Error updating credit limit:", error);
      Notification("Failed to update credit limit", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed animate-popup-in inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-4 rounded-lg w-full max-w-md shadow-2xl">
        <h2 className="text-[12px] sm:text-[14px] font-[600] mb-4 text-gray-700">
          Update Credit Limit
        </h2>

        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] sm:text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0CBB7D]"
          placeholder="Enter credit limit amount"
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-[10px] font-[600] sm:text-[12px]"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-2 rounded-lg bg-[#0CBB7D] text-white hover:bg-green-500 text-[10px] font-[600] sm:text-[12px]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateCreditLimitEditModal;
