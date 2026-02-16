import React, { useState, useEffect } from "react";
// import Modal from "./Modal";
import axios from "axios";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { FaUpload } from "react-icons/fa";
import { Notification } from "../../Notification"

const UploadRatecard = ({ isOpen, onClose, setRefresh }) => {

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const [selectedFile, setSelectedFile] = useState(null);
    if (!isOpen) return null;
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
            const response = await axios.post(
                `${REACT_APP_BACKEND_URL}/saveRate/uploadRatecard`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Upload success:", response);
            Notification(response.data.message, "success")
            setRefresh(true)
            onClose();
        } catch (err) {
            Notification(err.response?.data?.error, "error")
            console.log(err.response || "Upload failed");
        }
    };


    //   };
    const handleDownload = async () => {
        try {
            const token = Cookies.get("session");
            const response = await axios.get(
                `${REACT_APP_BACKEND_URL}/saveRate/download-excel`,
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
            a.download = "Rate_Card_Sample_Formate.xlsx"; // Set the file name
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1000]">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
                <h2 className="text-[12px] sm:text-[14px] text-gray-700 font-[600] mb-2">Upload Rate Card</h2>

                <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                    Download Sample file{" "}
                    <button
                        onClick={handleDownload}
                        className="text-[#0CBB7D] cursor-pointer"
                    >
                        click here{" "}
                    </button>
                    {/* <span className="text-purple-500 cursor-pointer">click here</span> */}
                </p>

                <label className="cursor-pointer flex text-[10px] sm:text-[12px] font-[600] items-center gap-2 text-[#0CBB7D] bg-white px-3 py-2 mt-4 rounded-lg border-2 border-[#0CBB7D] transition">
                    <div className="flex justify-between items-center w-full">
                        <span>Upload File</span>
                        <FaUpload className="text-[#0CBB7D]" />
                    </div>
                    <input type="file" className="hidden" onChange={handleFileChange} />
                </label>

                {selectedFile && (
                    <p className="text-[10px] sm:text-[12px] text-gray-500">Selected: {selectedFile.name}</p>
                )}
                <button onClick={handleSubmit} className="px-3 py-2 me-3 mt-3 bg-[#0CBB7D] text-white rounded-lg text-[10px] font-[600] sm:text-[12px]">
                    Submit
                </button>

                {/* Move Close Button inside modal */}
                <button
                    className="absolute top-2 right-4 text-gray-500 hover:text-gray-800"
                    onClick={onClose}
                >
                    ✖
                </button>
            </div>

            {/* <div className="mt-4"></div> */}
        </div>
    );
};

export default UploadRatecard;
