import React from "react";

const DetailsModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;
  console.log(data.text, data.imageUrl);

  return (
    <div className="fixed inset-0 flex animate-popup-in items-center z-[50] justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/3 max-h-[80vh] overflow-y-auto">
        <h2 className="text-[14px] font-[600] text-gray-700 mb-4 text-center">Discrepancy Details</h2>
        <img
          src={data.imageUrl}
          alt="Discrepancy"
          className="w-full h-auto mb-3 rounded-lg"
        />
        <p className="text-gray-700 text-[12px]">{data.text}</p>
        <div className="flex justify-center">
          <button
            className="mt-4 bg-[#0CBB7D] text-[12px] font-[600] hover:bg-opacity-90 transition-all text-white px-3 py-2 rounded-lg w-full sm:w-auto"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
