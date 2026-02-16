import React from "react";

export default function BankDetailsEditModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-md rounded-lg p-6 relative shadow-lg">
        {/* Close Button */}
        <button
          className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-xl"
          onClick={onClose}
        >
          ×
        </button>

        {/* Modal Title */}
        <h2 className="text-lg font-semibold text-gray-700">Edit GST Details</h2>

        {/* Modal Content (empty for now) */}
        <div className="mt-4">
          <p className="text-gray-500 text-sm">Form goes here...</p>
        </div>
      </div>
    </div>
  );
}
