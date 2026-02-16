import axios from "axios";
import { useState } from "react";
// import { toast } from "react-toastify";
import {Notification} from "../../../../Notification"
import Cookies from "js-cookie";
const AcceptDiscrepancy = ({ isOpen, onClose, awbNumber, setRefresh }) => {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [isUploading, setIsUploading] = useState(false);
  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsUploading(true); // Freeze button
    try {

      const token = Cookies.get("session");
      const payload = {
        awbNumber: awbNumber
      }
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/dispreancy/adminAcceptDiscrepancy/`,
        payload,
        {
          headers: {

            authorization: `Bearer ${token}`,
          },
        }
      );


      Notification(response.data.message,"success");

      setRefresh((prev) => !prev); // Toggle state for parent refresh ✅
      onClose(); // Close the modal AFTER state change ✅
    } catch (err) {
      Notification(err.response?.data?.error || "Something went Wrong","error");
    } finally {
      setIsUploading(false); // Unfreeze button after completion
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
        <h2 className="text-lg font-semibold mb-4">
          Are you sure to accept Dispute?
        </h2>
        <div className="flex justify-center space-x-4">
          <button
            className="px-4 py-2 bg-[#0CBB7D] text-white rounded-md transition"
            onClick={handleConfirm} // Call local function
          >
            Yes
          </button>
          <button
            className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition"
            onClick={onClose}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptDiscrepancy;
