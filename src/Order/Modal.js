import React from "react";
import { FiX } from "react-icons/fi";

const Modal = ({ isOpen, onClose, children, title, ReciveAddress }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 animate-popup-in bg-opacity-50 flex justify-center items-center z-50">
      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl relative">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-[14px] text-gray-700 font-[600]">
            {title || "Modal Title"}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-[14px]"
          >
            <FiX />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
