import axios from "axios";
import { useState } from "react";
import Cookies from "js-cookie";
import { X } from "lucide-react";
import { Notification } from "../../../../Notification";

const DeclinePopup = ({ isOpen, onClose, awbNumber, setRefresh }) => {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // ✅ New bulk decline function
  const handleBulkDecline = async () => {
    if (!Array.isArray(awbNumber) || awbNumber.length === 0) {
      Notification("No AWB numbers selected.", "info");
      return;
    }

    setLoading(true);
    try {
      const token = Cookies.get("session");
      const payload = { awbNumbers: awbNumber, text }; // backend expects array
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/dispreancy/bulkDeclineDiscrepancy`,
        payload,
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );

      Notification(response.data.message || "Bulk decline successful", "success");
      setRefresh((prev) => !prev);
      onClose();
    } catch (err) {
      Notification(err.response?.data?.message || "Bulk decline failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Existing single decline function (keep both)
  const handleConfirm = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("session");
      const payload = { awbNumber, text };

      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/dispreancy/declineDiscrepancy/`,
        payload,
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );

      Notification(response.data.message, "success");
      setRefresh((prev) => !prev);
      onClose();
    } catch (err) {
      Notification(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const isBulk = Array.isArray(awbNumber);

  return (
    <div className="fixed animate-popup-in inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] text-center relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {isBulk ? (
          <div className="text-left text-gray-500 text-[12px] sm:text-[14px]">
            <p className="mb-2 font-semibold">
              Declining {awbNumber.length} AWB Numbers:
            </p>
            <div className="max-h-[120px] overflow-y-auto border rounded p-2 text-xs text-gray-600 bg-gray-50 mb-3">
              {awbNumber.map((awb, i) => (
                <div key={i}>{awb}</div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mb-2 text-left text-gray-500 text-[12px] sm:text-[14px]">
            AWB Number: <strong>{awbNumber}</strong>
          </p>
        )}

        <h2 className="text-[12px] sm:text-[14px] text-left text-gray-500 font-[600] mb-4">
          Decline Reason
        </h2>

        <textarea
          className="w-full border text-[12px] sm:text-[14px] text-gray-500 rounded p-2 focus:outline-none focus:ring focus:ring-[#0CBB7D]"
          placeholder="Enter text..."
          rows="4"
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>

        <div className="flex justify-end mt-2 gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-[10px] sm:text-[12px] font-[600] bg-gray-500 text-white rounded-lg"
          >
            Close
          </button>
          <button
            className={`px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#0CBB7D]"
            }`}
            onClick={isBulk ? handleBulkDecline : handleConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : isBulk ? "Submit" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclinePopup;
