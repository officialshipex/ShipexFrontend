import React, { useState } from "react";

const Customers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5); // Number of rows per page

  const openModal = (data) => {
    setEditData(data);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const sampleData = [
    {
      name: "Prikshit Singh",
      phone: "7988474769",
      email: "buyer.contact@shipex.in",
      address:
        "Flat 302, 3rd floor, Vinayak Heights, Near D Mart, Mumbai, Maharashtra - 400001",
      channel: "CUSTOM",
    },
    {
      name: "Harish Sharma",
      phone: "9810225726",
      email: "buyer.contact@shipex.in",
      address:
        "B-5/104, Near Little Angel School, Paschim Vihar, Delhi, New Delhi, Delhi - 110063",
      channel: "CUSTOM",
    },
    // Add more data here for testing pagination
  ];

  // Logic to get the current page's data
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sampleData.slice(indexOfFirstRow, indexOfLastRow);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle changing rows per page
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to first page when rows per page change
  };

  // Calculate the total number of pages
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(sampleData.length / rowsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <p className="text-sm text-gray-500">
          Home &gt; Setup And Manage &gt; Customers
        </p>
      </div>

      {/* Table Section */}
      <div className="rounded-md p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-1/2 mb-4 sm:mb-0">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              width="20"
              height="20"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm6-2l4 4"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by Customer Name or Address"
              className="border border-gray-300 rounded px-4 py-2 w-full pl-10 focus:outline-none focus:ring"
            />
          </div>

          {/* New Customer Button */}
          <button className="bg-[#2d054b] text-white px-4 py-2 rounded-md">
            + New Customer
          </button>
        </div>

        {/* Table Header */}
        <div className="bg-gray-100 shadow rounded-md p-4 text-sm hidden sm:block mb-6">
          <div className="grid grid-cols-5 items-center font-bold gap-4">
            <div>Name</div>
            <div className="-ml-20">Phone Number</div>
            <div className="-ml-40">Email</div>
            <div className="-ml-56">Address</div>
            <div className="ml-32">Channel</div>
          </div>
        </div>

        {/* Data Rows */}
        {currentRows.map((data, index) => (
          <div key={index} className="bg-white shadow rounded-md p-4 text-sm mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-0 items-center">
              {/* Mobile View */}
              <div className="block sm:hidden">
                <p className="font-bold text-xs">Name</p>
                <p className="font-medium text-xs">{data.name}</p>
              </div>
              <div className="block sm:hidden">
                <p className="font-bold text-xs">Phone</p>
                <p className="font-medium text-xs">{data.phone}</p>
              </div>
              <div className="block sm:hidden">
                <p className="font-bold text-xs">Email</p>
                <p className="font-medium text-xs">{data.email}</p>
              </div>
              <div className="block sm:hidden">
                <p className="font-bold text-xs">Address</p>
                <p className="font-medium truncate text-xs">{data.address}</p>
              </div>
              <div className="block sm:hidden">
                <p className="font-bold text-xs">Channel</p>
                <p className="font-medium text-xs">{data.channel}</p>
              </div>
              <div className="block sm:hidden text-right mt-2">
                <button
                  className="text-[#2d054b] hover:underline"
                  onClick={() => openModal(data)}
                >
                  ✏️
                </button>
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block gap-4">
                <span className="font-medium text-xs">{data.name}</span>
              </div>
              <div className="hidden sm:block -ml-20">
                <span className="font-medium text-xs">{data.phone}</span>
              </div>
              <div className="hidden sm:block -ml-40">
                <span className="font-medium text-xs">{data.email}</span>
              </div>
              <div className="hidden sm:block -ml-52">
                <span className="font-medium truncate text-xs">{data.address}</span>
              </div>

              <div className="hidden sm:block flex items-center ml-32">
                <span className="font-medium bg-orange-200 text-orange-800 px-2 py-1 rounded-md">
                  {data.channel}
                </span>
                <button
                  className="text-[#2d054b] hover:underline ml-4"
                  onClick={() => openModal(data)}
                >
                  ✏️
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Pagination Section */}
        <div className="flex justify-center sm:justify-end items-center mt-4 text-gray-500 text-sm">
          <div className="flex items-center">
            <button
              className="px-3 py-1 border border-gray-300 rounded-l-lg disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => paginate(1)}
            >
              &lt;&lt;
            </button>
            <button
              className="px-3 py-1 border border-gray-300 disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => paginate(currentPage - 1)}
            >
              &lt;
            </button>
            <span className="px-3">
              Page <strong>{currentPage}</strong> of <strong>{pageNumbers.length}</strong>
            </span>
            <button
              className="px-3 py-1 border border-gray-300 disabled:opacity-50"
              disabled={currentPage === pageNumbers.length}
              onClick={() => paginate(currentPage + 1)}
            >
              &gt;
            </button>
            <button
              className="px-3 py-1 border border-gray-300 rounded-r-lg disabled:opacity-50"
              disabled={currentPage === pageNumbers.length}
              onClick={() => paginate(pageNumbers.length)}
            >
              &gt;&gt;
            </button>
          </div>

          <select
            className="ml-2 px-2 py-1 border border-gray-300 rounded-lg text-sm"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 sm:p-10 rounded-md shadow-lg max-w-3xl w-full mx-4 overflow-y-auto max-h-screen">
              <h2 className="text-xl font-bold mb-4">Edit Customer Details</h2>
              <form>
                <div className="grid gap-6 text-sm">
                  {/* Form content goes here */}
                </div>

                {/* Buttons */}
                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mr-2 bg-red-500 text-white px-6 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#2d054b] text-white px-6 py-2 rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
