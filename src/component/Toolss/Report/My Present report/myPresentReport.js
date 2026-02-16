import React, { useState } from "react";

const MyPresetReports = ({isOpen,onClose}) => {

  if (!isOpen) return null; // If modal is closed, return nothing (doesn't render anything)

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-[#2d054b]">My Preset Reports</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose} // Close the modal
          >
            ✕
          </button>
        </div>
        <div className="space-y-4 p-4">
          {/* Table Header in a Card */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 text-sm md:text-base">
              <div className="font-bold text-[#2D054B]">Report Name</div>
              <div className="font-bold text-[#2D054B]">Scheduled On</div>
              <div className="font-bold text-[#2D054B]">Schedule</div>
              <div className="font-bold text-[#2D054B]">Send Mail</div>
              <div className="font-bold text-[#2D054B]">Generate Report</div>
              <div></div> {/* Empty space for alignment */}
              <div></div> {/* Empty space for alignment */}
            </div>
          </div>

          {/* Display Reports */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 text-sm md:text-base">
              <div>No Scheduled Reports found.</div>
              <div></div> {/* Empty space for alignment */}
              <div></div> {/* Empty space for alignment */}
              <div></div> {/* Empty space for alignment */}
              <div></div> {/* Empty space for alignment */}
              <div></div> {/* Empty space for alignment */}
              <div></div> {/* Empty space for alignment */}
            </div>
          </div>

          {/* Another Report Example */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 text-sm md:text-base">
              <div>Report 1</div>
              <div>2025-01-01</div>
              <div>Every Month</div>
              <div>Yes</div>
              <div>
                <button className="text-[#E8CAFE]">Generate</button>
              </div>
              <div></div> {/* Empty space for alignment */}
              <div></div> {/* Empty space for alignment */}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-sm text-[#2d054b]">
              Showing 0 to 0 of 0 Reports
            </span>
            <div className="flex items-center space-x-2">
              <button
                className="px-2 py-1 text-sm text-[#2d054b] border border-gray-300 rounded hover:bg-gray-100"
                disabled
              >
                &lt;
              </button>
              <span className="text-sm text-[#2d054b]">1</span>
              <button
                className="px-2 py-1 text-sm text-[#2d054b] border border-gray-300 rounded hover:bg-gray-100"
                disabled
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPresetReports;
