import React, { useState, useEffect } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import { Notification } from "../../Notification"
import Cookies from "js-cookie";
import { useParams } from "react-router-dom"

export default function BankDetailsEditModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    refId: "",
    branchName: "",
    city: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    nameAtBank: "",
  });
  const { id } = useParams();

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const token = Cookies.get("session"); // extract token from cookie

  // Fetch bank details
  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get(
          `${REACT_APP_BACKEND_URL}/getKyc/getBankAccount`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { id }
          }
        );

        setBankDetails({
          refId: data.refId || "",
          bankName: data.bank || "",
          branchName: data.branch || "",
          city: data.city || "",
          nameAtBank: data.nameAtBank || "",
          accountNumber: data.accountNumber || "",
          ifsc: data.ifsc || "",
        });
      } catch (error) {
        Notification("Failed to fetch bank details", "error");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  // Verify bank details
  const verifyBank = async () => {
    if (!bankDetails.accountNumber || !bankDetails.ifsc) {
      Notification("Please enter account number and IFSC", "info");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/merchant/verfication/bank-account`,
        {
          accountNo: bankDetails.accountNumber,
          ifsc: bankDetails.ifsc,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { id }
        }
      );

      if (response.data.success) {
        const verifiedData = response.data.data;
        setBankDetails((prev) => ({
          ...prev,
          bankName: verifiedData.bank,
          branchName: verifiedData.branch,
          city: verifiedData.city,
          nameAtBank: verifiedData.nameAtBank,
        }));

        Notification("Bank account verified successfully!", "success");

        onClose();
      } else {
        Notification(response.data.message || "Verification failed", "error");
      }
    } catch (error) {
      Notification(error.response?.data?.message || "Error verifying bank account", "error");
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed animate-popup-in inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-xl rounded-lg p-6 relative shadow-lg">
        {/* Close Button */}
        <button
          className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-xl"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-[14px] mb-4 font-[600] text-gray-700">
          Edit Bank Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Account Number */}
          <div className="flex flex-col">
            <label className="text-[12px] font-[500] text-gray-700">
              Account Number
            </label>
            <input
              type="text"
              placeholder="Account no"
              className="border px-3 py-2 text-[12px] font-[600] text-gray-700 rounded-lg flex-1"
              value={bankDetails.accountNumber}
              onChange={(e) =>
                setBankDetails({ ...bankDetails, accountNumber: e.target.value })
              }
            />
          </div>

          {/* IFSC */}
          <div className="flex flex-col">
            <label className="text-[12px] font-[500] text-gray-700">IFSC</label>
            <input
              type="text"
              placeholder="IFSC"
              className="border px-3 py-2 text-[12px] font-[600] text-gray-700 rounded-lg flex-1"
              value={bankDetails.ifsc}
              onChange={(e) =>
                setBankDetails({ ...bankDetails, ifsc: e.target.value })
              }
            />
          </div>

          {/* Verify Button - Full width on mobile */}
          <div className="sm:col-span-2 flex justify-end">
            <button
              onClick={verifyBank}
              disabled={
                !bankDetails.accountNumber || !bankDetails.ifsc || isVerifying
              }
              className={`px-4 py-2 w-full sm:w-auto rounded-lg text-[12px] font-[500] text-white ${!bankDetails.accountNumber || !bankDetails.ifsc
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#0CBB7D] hover:bg-green-700"
                }`}
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </button>
          </div>

          {/* Beneficiary Name */}
          <div className="flex flex-col">
            <label className="text-[12px] font-[500] text-gray-700">
              Beneficiary Name
            </label>
            <input
              type="text"
              value={bankDetails.nameAtBank}
              className="border px-3 py-2 text-[12px] font-[600] text-gray-700 rounded-lg flex-1 bg-gray-50"
              disabled
            />
          </div>

          {/* Bank Name */}
          <div className="flex flex-col">
            <label className="text-[12px] font-[500] text-gray-700">
              Bank Name
            </label>
            <input
              type="text"
              value={bankDetails.bankName}
              className="border px-3 py-2 text-[12px] font-[600] text-gray-700 rounded-lg flex-1 bg-gray-50"
              disabled
            />
          </div>

          {/* Branch Name */}
          <div className="flex flex-col">
            <label className="text-[12px] font-[500] text-gray-700">
              Branch Name
            </label>
            <input
              type="text"
              value={bankDetails.branchName}
              className="border px-3 py-2 text-[12px] font-[600] text-gray-700 rounded-lg flex-1 bg-gray-50"
              disabled
            />
          </div>

          {/* City */}
          <div className="flex flex-col">
            <label className="text-[12px] font-[500] text-gray-700">City</label>
            <input
              type="text"
              value={bankDetails.city}
              className="border px-3 py-2 text-[12px] font-[600] text-gray-700 rounded-lg flex-1 bg-gray-50"
              disabled
            />
          </div>
        </div>


        {/* Loading Overlay */}
        {(isLoading || isVerifying) && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center">
            <span className="text-white">Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}
