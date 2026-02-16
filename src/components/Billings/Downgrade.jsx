import React, { useState } from "react";

const Downgrade = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Mock shipping data (for testing purposes)
  const shippingData = [{}];

  // Calculate the data for the current page
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = shippingData.slice(indexOfFirstRow, indexOfLastRow);

  // Calculate total pages
  const totalPages = Math.ceil(shippingData.length / rowsPerPage);

  return (
    <div className="p-1 bg-gray-100 min-h-screen">
      {/* Table Header (Hidden on mobile) */}
      <div className="grid grid-cols-4 gap-20 mb-4 py-3 bg-gray-200 text-gray-700 font-semibold text-left rounded-lg shadow-lg justify-center hidden md:grid text-sm">
        <div className="text-center">Current Plan</div>
        <div className="text-center">Requested Plan</div>
        <div className="text-center">Requested Date</div>
        <div className="text-center">Effective Form</div>
      </div>

      {/* Table Row: Only one row displaying "No data found" */}
      <div className="grid grid-cols-6 gap-4 py-3 px-4 bg-white shadow-lg ">
        <div className="col-span-6 text-center text-black-500 text-sm font-semibold">
          No records found.
        </div>
      </div>

      {/* Pagination Section */}
      <div className="flex justify-end items-center mt-6 space-x-4 mr-4">
        <button
          className="text-sm text-gray-700 rounded-lg disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </button>
        <span className="text-gray-700 text-sm">{currentPage}</span>
        <button
          className="text-sm text-gray-700 rounded-lg disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Downgrade;
