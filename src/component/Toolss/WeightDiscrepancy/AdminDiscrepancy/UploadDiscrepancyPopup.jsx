import React, { useState } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import { FaUpload } from "react-icons/fa";
import Cookies from "js-cookie";
import { Notification } from "../../../../Notification";
const UploadDiscrepancyPopup = ({ onClose, setRefresh }) => {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false); // Track upload state
  const [isDownloading, setIsDownloading] = useState(false); // Track download state

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log("Selected file:", file.name);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      Notification("Please select a file first!", "info");
      return;
    }

    setIsUploading(true); // Freeze button
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const token = Cookies.get("session");

      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/dispreancy/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Upload success:", response);
      Notification(response.data.message, "success");

      setRefresh((prev) => !prev); // Toggle state for parent refresh ✅
      onClose(); // Close the modal AFTER state change ✅
    } catch (err) {
      Notification(err.response?.data?.error || "Upload failed", "error");
    } finally {
      setIsUploading(false); // Unfreeze button after completion
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true); // Start loading
    try {
      const token = Cookies.get("session");

      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/dispreancy/download-excel`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
          responseType: "arraybuffer", // ✅ Fixes file corruption
        }
      );

      // Create a Blob from the response data
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create a temporary download link
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Weight_Discrepancy_Sample_Format.xlsx"; // ✅ Corrected filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link); // Cleanup

      Notification("File downloaded successfully!", "success");
    } catch (error) {
      console.error("Download error:", error);
      Notification("Failed to download file!", "error");
    } finally {
      setIsDownloading(false); // Stop loading
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1000]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
        <h2 className="text-lg font-bold mb-2">Upload Weight Discrepancy</h2>

        <p className="text-xs text-gray-600">
          Download Sample File{" "}
          <span
            className={`text-[#0CBB7D] cursor-pointer ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={!isDownloading ? handleDownload : null}
          >
            {isDownloading ? "Downloading..." : "click here"}
          </span>
        </p>

        <label className="cursor-pointer flex text-sm items-center gap-2 text-[#0CBB7D] bg-white px-4 py-2 mt-5 rounded-lg border-2 border-[#0CBB7D] transition">
          <div className="flex justify-between items-center w-full">
            <span>Upload File</span>
            <FaUpload className="text-[#0CBB7D]" />
          </div>
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>

        {selectedFile && (
          <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>
        )}

        {/* Submit Button - Disabled when uploading */}
        <button
          onClick={handleSubmit}
          disabled={isUploading}
          className={`px-4 py-2 mt-3 rounded-lg text-sm transition-all ${isUploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#0CBB7D] text-white hover:bg-green-500"
            }`}
        >
          {isUploading ? "Uploading..." : "Submit"}
        </button>

        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
          disabled={isUploading} // Disable closing while uploading
        >
          ✖
        </button>
      </div>
    </div>
  );
};

export default UploadDiscrepancyPopup;
