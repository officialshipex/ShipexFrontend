import React, { useState } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";


const UploadImageModal = ({ onClose, awbNumber,setRefresh1,setRefresh }) => {
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
            Notification(response.data.message,"success");
            setRefresh(true);
            setRefresh1(true);
            onClose(); // Close modal after submission
        } catch (error) {
            Notification(error.response?.data?.message || "An error occurred","error");
            console.error("Error uploading data:", error);
        }
        finally{
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="bg-white p-5 rounded-lg shadow-lg w-[600px]">
                <h2 className="text-[12px] sm:text-[14px] text-gray-500 font-[600] mb-3">Raise Discrepancy</h2>

                {/* Display AWB Number */}
                <p className="mb-2 text-gray-500 text-[12px] sm:text-[14px]">AWB Number: <strong>{awbNumber}</strong></p>

                <textarea
                    className="w-full border rounded placeholder:text-[12px] text-[12px] sm:text-[14px] text-gray-500 p-2 focus:outline-none focus:ring focus:ring-[#0CBB7D]"
                    placeholder="Enter text..."
                    rows="4"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                ></textarea>

                <div className="mt-3">
                    <label className="block mb-2 font-[600] text-[12px] sm:text-[14px] text-gray-500">Upload Image:</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                    {image && <img src={image} alt="Preview" className="mt-2 h-20 w-full object-cover rounded-lg" />}
                </div>

                <div className="flex justify-end mt-4 gap-2">
                    <button
                        onClick={onClose}
                        className="px-3 py-2 font-[600] bg-gray-500 text-white text-[10px] sm:text-[12px] rounded-lg"
                    >
                        Close
                    </button>
                    <button
                        className={`px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#0CBB7D]"
                            }`}
                        onClick={handleSubmit}
                        disabled={loading} // Disable button when loading
                    >
                        {loading ? "Processing..." : "Submit"} {/* Show loading text */}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadImageModal;
