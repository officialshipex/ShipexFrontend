import React, { useState, useEffect } from "react";
import Modal from "../../Order/Modal";
import axios from "axios";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { FaUpload } from "react-icons/fa";
import {Notification} from "../../Notification"

const CourierCodPoopup = ({ onClose, setRefresh }) => {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file); // Updates state, but state change is asynchronous
      console.log("Selected file:", file.name);
    }
  };

  const handleSubmit = async () => {
    if (loading || !selectedFile) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/cod/upload_courier`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Upload success:", response);
      Notification(response.data.message,"success");
      setRefresh(true);
      onClose();
    } catch (err) {
      Notification(err.response?.data?.error || "Upload failed","error");
    } finally {
      setLoading(false);
    }
  };

  //   };
  const handleDownload = async () => {
    try {
      const token = Cookies.get("session");
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/cod/download-excel-courier`,
        {
          responseType: "blob",
          headers: {
            authorization: `Bearer ${token}`,
          },

          // Important: tells Axios to handle binary data
        }
      );

      // Convert response data to a Blob
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = " Courier_COD_Remittance_Sample_Format.xlsx"; // Set the file name
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
        <h2 className="text-lg font-bold mb-2">Upload Courier COD Remittance</h2>
        <p className="text-xs font-semibold">
          Download Sample file{" "}
          <button
            onClick={handleDownload}
            className="text-purple-500 cursor-pointer"
          >
            click here{" "}
          </button>
          {/* <span className="text-purple-500 cursor-pointer">click here</span> */}
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
        <button 
          onClick={handleSubmit} 
          disabled={loading || !selectedFile} 
          className={`px-4 py-2 me-3 mt-3 text-white rounded-lg text-sm transition-all ${
            loading || !selectedFile ? "bg-gray-400 cursor-not-allowed" : "bg-[#0CBB7D] hover:bg-[#0aa66e]"
          }`}
        >
          {loading ? "Processing..." : "Submit"}
        </button>

        {/* Move Close Button inside modal */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✖
        </button>
      </div>

      {/* <div className="mt-4"></div> */}
    </div>
  );
};

export default CourierCodPoopup;
