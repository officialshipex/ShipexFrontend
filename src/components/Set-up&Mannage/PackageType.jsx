import { useState } from "react";

const PackageTypes = () => {
  const [isChecked, setIsChecked] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">
            Package Types
          </h1>
          <p className="text-gray-500 text-sm mb-4 sm:mb-0">
            Home &gt; Setup And Manage &gt; Package Types
          </p>
        </div>
  
        <button
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 mt-4 sm:mt-0 w-full sm:w-auto"
          onClick={() => setIsModalOpen(true)}
        >
          + New Package
        </button>
      </div>
 
  
    

        <div className="flex flex-wrap items-center justify-between mb-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-1/2 mb-4 sm:mb-0 text-xs">
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
              className="border border-gray-300 rounded px-4 py-3 w-full pl-10 focus:outline-none focus:ring"
            />
          </div>
          <div className="flex items-center bg-blue-50 p-6 rounded-lg shadow-lg border border-blue-300 w-full sm:w-auto flex-col sm:flex-row">
  {/* + Icon - First on Mobile */}
  <div className="flex items-center justify-center mr-3 p-2 rounded-full bg-blue-500 order-1 sm:order-none mb-4 sm:mb-0">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 4v16m8-8H4"
      />
    </svg>
  </div>

  {/* Text */}
  <div className="order-2 sm:order-none mb-4 sm:mb-0 text-center sm:text-left">
    <h3 className="text-black-600 text-sm font-semibold mb-2">
      Smart Package Selection
    </h3>
    <p className="text-black-800 text-xs w-full sm:w-80">
      Suitable packages are picked on Vol. weight basis against order dead weight
    </p>
  </div>

  {/* On/Off Switch */}
  <label className="inline-flex items-center cursor-pointer order-3 sm:order-none">
    <input
      type="checkbox"
      className="sr-only"
      checked={isChecked}
      onChange={() => setIsChecked(!isChecked)}
    />
    <div
      className={`w-10 h-5 ${isChecked ? "bg-blue-500" : "bg-gray-200"} rounded-full relative transition duration-200`}
    >
      <div
        className={`absolute top-0 h-5 w-5 ${isChecked ? "left-5" : "left-0"} bg-white rounded-full shadow transform transition-all duration-200 ease-in-out`}
      ></div>
    </div>
  </label>
</div>
</div>

        <div className="overflow-auto">
          {/* Table Section */}
          <div className="bg-gray-100 text-black-600 text-left text-sm shadow-lg rounded-sm mt-6 ">
  <table className="min-w-full hidden lg:table rounded-lg shadow ">
    <thead>
      <tr>
        <th className="py- px-4 font-bold">Package Name</th>
        <th className="py-4 px-4 font-bold">Package Type</th>
        <th className="py-4 px-4 font-bold">Length</th>
        <th className="py-4 px-4 font-bold">Breadth</th>
        <th className="py-4 px-4 font-bold">Height</th>
        <th className="py-4 px-4 font-bold">Volumetric Weight</th>
        <th className="py-4 px-4 font-bold">Status</th>
      </tr>
    </thead>
    <tbody>
    </tbody>
  </table>

  <table className="min-w-full hidden lg:table bg-white-200 shadow mt- rounded-lg ">
  <thead>
    <tr>
      <th className="px-4 py-4 bg-white text-gray-500 shadow rounded-md ">No Package Found.</th>
    </tr>
  </thead>
  <tbody>
  </tbody>
</table>

</div>


     {/* No Packages Found Section (Single Card View for Mobile) */}
<div className="block sm:hidden mt-8">
  <div className="bg-white text-center py-10 px-6 rounded-lg shadow-xl">
    <h4 className="font-semibold text-sm mb-4">Package Details</h4>
    <div className="mt-4">
      <div className="flex flex-col justify-between mb-6">
        <span className="font-medium text-sm mb-2">Package Name</span>
        <span className="text-gray-500 text-xs">No packages found.</span>
      </div>
      <div className="flex justify-between mb-4">
        <span className="font-medium text-sm">Package Type</span>
        <span className="text-gray-500 text-xs">N/A</span>
      </div>
      <div className="flex justify-between mb-4">
        <span className="font-medium text-sm">Length</span>
        <span className="text-gray-500 text-xs">N/A</span>
      </div>
      <div className="flex justify-between mb-4">
        <span className="font-medium text-sm">Breadth</span>
        <span className="text-gray-500 text-xs">N/A</span>
      </div>
      <div className="flex justify-between mb-4">
        <span className="font-medium text-sm">Height</span>
        <span className="text-gray-500 text-xs">N/A</span>
      </div>
      <div className="flex justify-between mb-4">
        <span className="font-medium text-sm">Volumetric Weight</span>
        <span className="text-gray-500 text-xs">N/A</span>
      </div>
      <div className="flex justify-between mb-4">
        <span className="font-medium text-sm">Status</span>
        <span className="text-gray-500 text-xs">N/A</span>
      </div>
    </div>
  </div>
</div>

        </div>

     {/* Pagination Section */}
<div className="flex justify-center sm:justify-end items-center mt-4 text-gray-500 text-sm">
  <div className="flex items-center">
    <button
      className="px-3 py-1 border border-gray-300 rounded-l-lg disabled:opacity-50"
      disabled
    >
      &lt;&lt;
    </button>
    <button className="px-3 py-1 border border-gray-300 disabled:opacity-50">
      &lt;
    </button>
    <span className="px-3">
      Page <strong>1</strong> of <strong>10</strong>
    </span>
    <button className="px-3 py-1 border border-gray-300 disabled:opacity-50">
      &gt;
    </button>
    <button className="px-3 py-1 border border-gray-300 rounded-r-lg disabled:opacity-50">
      &gt;&gt;
    </button>
  </div>

  <select className="ml-2 px-2 py-1 border border-gray-300 rounded-lg text-sm">
    <option>10</option>
    <option>20</option>
    <option>50</option>
    <option>100</option>
  </select>
</div>

      </div>

      {/* Modal for Adding Package */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 sm:p-6 rounded-md shadow-lg w-full max-w-xs sm:max-w-3xl mx-4 sm:mx-0 overflow-y-auto max-h-screen">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-bold">Add New Package</h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Package Name
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring focus:border-purple-500"
                  required
                />
                <span className="text-xs text-red-500">required</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Package Type
                </label>
                <select
                  className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring focus:border-purple-500"
                  required
                >
                  <option>Box</option>
                  <option>Envelope</option>
                  <option>Tube</option>
                </select>
                <span className="text-xs text-red-500">required</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Length (cm)
                </label>
                <input
                  type="number"
                  className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring focus:border-purple-500"
                  required
                />
                <span className="text-xs text-red-500">required</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Breadth (cm)
                </label>
                <input
                  type="number"
                  className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring focus:border-purple-500"
                  required
                />
                <span className="text-xs text-red-500">required</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Height (cm)
                </label>
                <input
                  type="number"
                  className="border border-gray-300 rounded-lg w-full px-3 py-2 focus:ring focus:border-purple-500"
                  required
                />
                <span className="text-xs text-red-500">required</span>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex justify-end mt-6">
              <button
                type="button"
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                onClick={() => setIsModalOpen(false)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageTypes;
