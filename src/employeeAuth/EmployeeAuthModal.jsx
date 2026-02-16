import React from 'react';

function EmployeeAuthModal({ employeeModalShow, employeeModalClose }) {
  if (!employeeModalShow) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Background overlay with blur */}
      <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"></div>

      {/* Modal box */}
      <div className="relative bg-white rounded-md shadow-xl p-6 w-[95%] max-w-xl md:p-12 md:max-w-xl mx-auto text-center z-10">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
          You are not allowed to access this page.
        </h2>
        <button
          onClick={employeeModalClose}
          className="mt-4 bg-[#0CBB7D] hover:bg-green-700 text-white px-8 py-3 rounded-md transition"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default EmployeeAuthModal;