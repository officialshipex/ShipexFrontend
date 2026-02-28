import React, { useState } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";
import { FiAlertCircle, FiUploadCloud, FiFileText } from "react-icons/fi";
import { FaTimes, FaUpload, FaArrowLeft } from "react-icons/fa";


const UploadImageModal = ({ onClose, awbNumber, setRefresh1, setRefresh }) => {
    const [image, setImage] = useState(null);
    const [file, setFile] = useState(null);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFile(file); // Store the file to send it later
            setImage(URL.createObjectURL(file)); // Preview image
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("awbNumber", awbNumber); // Add AWB number
            formData.append("text", text); // Add text
            formData.append("image", file); // Add file

            const token = Cookies.get("session");
            const response = await axios.post(
                `${REACT_APP_BACKEND_URL}/dispreancy/raiseDiscrepancies`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("Success:", response.data);
            Notification(response.data.message, "success");
            setRefresh(true);
            setRefresh1(true);
            onClose(); // Close modal after submission
        } catch (error) {
            Notification(error.response?.data?.message || "An error occurred", "error");
            console.error("Error uploading data:", error);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[1000] animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-lg shadow-sm w-[500px] relative animate-popup-in border border-gray-100">

                {/* Header */}
                <div className="mb-4">
                    <h2 className="text-[14px] sm:text-[16px] font-bold text-gray-700 flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-lg text-[#0CBB7D]">
                            <FiUploadCloud size={18} />
                        </div>
                        Raise Discrepancy
                    </h2>
                    <p className="text-[10px] sm:text-[12px] text-gray-500 mt-1">Submit evidence for weight discrepancy</p>
                </div>

                {/* AWB Section */}
                <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                    <FiAlertCircle className="text-orange-500" size={16} />
                    <span className="text-[11px] sm:text-[13px] font-semibold text-orange-700">
                        AWB: <span className="font-bold">{awbNumber}</span>
                    </span>
                </div>

                <div className="space-y-4">
                    {/* Remarks Textarea */}
                    <div>
                        <label className="block mb-1.5 font-bold text-[10px] sm:text-[12px] text-gray-600 uppercase tracking-tight">Remarks</label>
                        <textarea
                            className="w-full border border-gray-200 rounded-xl placeholder:text-[11px] text-[11px] sm:text-[13px] text-gray-700 p-3 focus:outline-none focus:ring-2 focus:ring-[#0CBB7D]/20 focus:border-[#0CBB7D] transition-all min-h-[100px]"
                            placeholder="Describe the discrepancy details here..."
                            rows="4"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Upload Zone */}
                    <div className="space-y-2">
                        <label className="block mb-1.5 font-bold text-[10px] sm:text-[12px] text-gray-600 uppercase tracking-tight">Evidence Image</label>
                        <label className="group cursor-pointer block relative">
                            <div className={`
                                border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-300
                                ${file ? 'border-[#0CBB7D] bg-green-50/30' : 'border-gray-200 hover:border-[#0CBB7D] hover:bg-gray-50'}
                            `}>
                                <div className={`p-3 rounded-full mb-2 transition-colors ${file ? 'bg-[#0CBB7D] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-[#0CBB7D]'}`}>
                                    <FaUpload size={14} />
                                </div>
                                <span className="text-[10px] sm:text-[12px] font-bold text-gray-700 tracking-tight">
                                    {file ? 'Change Image' : 'Click to Upload Image'}
                                </span>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>

                        {/* Image Preview Card */}
                        {image && (
                            <div className="relative mt-2 group">
                                <img src={image} alt="Preview" className="h-40 w-full object-cover rounded-xl border border-gray-200 shadow-sm" />
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setImage(null);
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                                >
                                    <FaTimes size={12} />
                                </button>
                                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] text-white flex items-center gap-1">
                                    <FiFileText size={10} />
                                    {file?.name}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center mt-8 gap-3">
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg gap-2 text-[10px] sm:text-[12px] font-bold text-gray-600 hover:text-[#0CBB7D] hover:border-[#0CBB7D] hover:bg-green-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        className={`flex py-2 px-6 bg-[#0CBB7D] text-white rounded-lg text-[10px] sm:text-[12px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100 ${loading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Processing...
                            </>
                        ) : (
                            "Submit Request"
                        )}
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

export default UploadImageModal;
