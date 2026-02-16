import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

const SelectOrderTypePopup = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 animate-popup-in bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] text-left">

        <div className="flex justify-between items-start">
          <h2 className="text-[14px] sm:text-[16px] font-[600] mb-4 text-gray-700">
            Select Order Type
          </h2>

          <button
            className="text-gray-600 hover:text-gray-800 transition"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} className="text-[16px]" />
          </button>
        </div>

        <div className="flex gap-4 justify-center mt-4">
          <button
            className="px-3 py-2 text-[10px] sm:text-[12px] bg-[#0CBB7D] text-white rounded-lg font-[600]"
            onClick={() => onSelect("B2C")}
          >
            B2C Order
          </button>

          <button
            className="px-3 py-2 bg-[#0CBB7D] text-white text-[10px] sm:text-[12px] rounded-lg font-[600]"
            onClick={() => onSelect("B2B")}
          >
            B2B Order
          </button>
        </div>

      </div>
    </div>
  );
};

export default SelectOrderTypePopup;
