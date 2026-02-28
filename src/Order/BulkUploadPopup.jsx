import React, { useState } from "react";
// import Modal from "./Modal";
import axios from "axios";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { FaUpload, FaArrowLeft, FaTimes } from "react-icons/fa";
import { FiUploadCloud, FiDownload, FiFileText } from "react-icons/fi";
import { Notification } from "../Notification"

const BulkUploadPopup = ({ onClose, setRefresh, selectedOrderType, onBack, }) => {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [selectedFile, setSelectedFile] = useState(null);
  console.log("Order Type in BulkUploadPopup:", selectedOrderType);
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file); // Updates state, but state change is asynchronous
      console.log("Selected file:", file.name);
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const token = Cookies.get("session");

      const url =
        selectedOrderType === "B2C"
          ? `${REACT_APP_BACKEND_URL}/bulkOrderUpload/upload`
          : `${REACT_APP_BACKEND_URL}/b2b/bulkOrderUpload/upload`;

      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          authorization: `Bearer ${token}`,
        },
        validateStatus: (status) => status < 500, // allow 207
      });

      const {
        message,
        successCount = 0,
        failedCount = 0,
        errors = [],
      } = response.data || {};

      /* ===============================
         FULL SUCCESS
      =============================== */
      if (response.status === 200) {
        Notification(
          `${message} | ✅ Success: ${successCount}`,
          "success"
        );
      }

      /* ===============================
         PARTIAL SUCCESS
      =============================== */
      if (response.status === 207) {
        Notification(
          `${message} | ✅ Success: ${successCount}, ❌ Failed: ${failedCount}`,
          "warning"
        );

        console.warn("Partial upload errors:", errors);

        errors.forEach((err) => {
          Notification(
            `Row ${err.row}: ${err.message}`,
            "error"
          );
        });
      }

      setRefresh(true);
      onClose();
    } catch (err) {
      /* ===============================
         REAL FAILURES
      =============================== */
      console.error("Upload failed:", err);

      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Upload failed";

      Notification(errorMessage, "error");
    }
  };




  const handleDownload = async () => {
    try {
      const token = Cookies.get("session");
      let response;
      if (selectedOrderType === "B2C") {
        response = await axios.get(
          `${REACT_APP_BACKEND_URL}/bulkOrderUpload/download-excel`,
          {
            responseType: "blob",
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await axios.get(
          `${REACT_APP_BACKEND_URL}/b2b/bulkOrderUpload/download-excel`,
          {
            responseType: "blob",
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );

      }
      // Convert response data to a Blob
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = "Bulk_Order_Sample_Formate.xlsx"; // Set the file name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Free up memory by revoking the object URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[1000] animate-in fade-in duration-300">
      <div className="bg-white p-4 rounded-lg shadow-sm w-[500px] relative animate-popup-in border border-gray-100">

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-[12px] sm:text-[14px] font-bold text-gray-700 flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg text-[#0CBB7D]">
              <FiUploadCloud size={18} />
            </div>
            Bulk {selectedOrderType} Upload
          </h2>
          <p className="text-[10px] sm:text-[12px] text-gray-500 mt-1">Import your orders using an excel file</p>
        </div>

        {/* Sample Download Section */}
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[12px] font-semibold text-gray-600">Need the template?</span>
            <button
              onClick={handleDownload}
              className="text-[#0CBB7D] hover:underline flex items-center gap-1.5 text-[10px] sm:text-[12px] font-bold transition-all"
            >
              <FiDownload /> Download Sample
            </button>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="space-y-2">
          <label className="group cursor-pointer block relative">
            <div className={`
              border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-300
              ${selectedFile ? 'border-[#0CBB7D] bg-green-50/30' : 'border-gray-200 hover:border-[#0CBB7D] hover:bg-gray-50'}
            `}>
              <div className={`p-4 rounded-full mb-3 transition-colors ${selectedFile ? 'bg-[#0CBB7D] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-[#0CBB7D]'}`}>
                <FaUpload size={16} />
              </div>
              <span className="text-[10px] sm:text-[12px] font-bold text-gray-700 tracking-tight">
                {selectedFile ? 'Change File' : 'Choose Excel File'}
              </span>
              {/* <p className="text-[10px] text-gray-400 mt-1">XLSX or XLS supported</p> */}
            </div>
            <input type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls" />
          </label>

          {/* Selected File Card */}
          {selectedFile && (
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2">
              <div className="bg-green-100 p-2 rounded-lg text-[#0CBB7D]">
                <FiFileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-700 truncate">{selectedFile.name}</p>
                <p className="text-[9px] text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FaTimes size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-8 gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg gap-2 text-[10px] sm:text-[12px] font-bold text-gray-600 hover:text-[#0CBB7D] hover:border-[#0CBB7D] hover:bg-green-50 transition-all"
          >
            <FaArrowLeft size={12} />
            Back
          </button>

          <button
            onClick={handleSubmit}
            className="flex py-2 px-3 bg-[#0CBB7D] text-white rounded-lg text-[10px] sm:text-[12px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Confirm & Upload
          </button>
        </div>

        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-all"
          onClick={onClose}
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
};

export default BulkUploadPopup;
