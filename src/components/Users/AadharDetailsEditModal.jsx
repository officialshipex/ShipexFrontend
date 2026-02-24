import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useParams } from "react-router-dom";
import { Notification } from "../../Notification";

export default function AadharDetailsEditModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aadharDetails, setAadharDetails] = useState({
    aadhaarNumber: "",
    name: "",
    address: "",
    city: "",
    state: "",
  });

  const { id } = useParams();
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const token = Cookies.get("session");

  // ✅ Fetch Aadhaar details when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get(
          `${REACT_APP_BACKEND_URL}/getKyc/getAadhaar`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { id },
          }
        );
        // console.log("aadhaar", data)
        if (data) {
          setAadharDetails({
            aadhaarNumber: data.data.aadhaarNumber || "",
            name: data.data.name || "",
            address: data.data.address || "",
            city: data.data.city || "",
            state: data.data.state || "",
          });
        }
      } catch (error) {
        Notification("Failed to fetch Aadhaar details", "error");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  // ✅ Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAadharDetails({ ...aadharDetails, [name]: value });
  };

  // ✅ Handle Submit (Update Aadhaar API)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !aadharDetails.aadhaarNumber ||
      !aadharDetails.name ||
      !aadharDetails.address ||
      !aadharDetails.city ||
      !aadharDetails.state
    ) {
      Notification("Please fill in all fields", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/merchant/verfication/updateAadhaar`,
        aadharDetails,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { id },
        }
      );

      if (response.data.success) {
        Notification("Aadhaar details updated successfully!", "success");
        onClose();
      } else {
        Notification(response.data.message || "Update failed", "error");
      }
    } catch (error) {
      console.log("error aadhaar",error)
      Notification(error.response?.data?.message || "Error updating Aadhaar details", "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Prevent rendering when modal is closed
  if (!isOpen) return null;

  return (
    <div className="fixed animate-popup-in inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-md rounded-lg p-6 relative shadow-lg">
        {/* Close Button */}
        <button
          className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-xl"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-[14px] font-[600] text-gray-700 mb-4">
        Update Aadhaar Details
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Aadhaar Number */}
          <div className="flex flex-col">
            <label className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
              Aadhaar Number
            </label>
            <input
              type="text"
              name="aadhaarNumber"
              placeholder="Enter Aadhaar Number"
              value={aadharDetails.aadhaarNumber}
              onChange={handleChange}
              className="border px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] text-gray-700 focus:outline-none"
            />
          </div>

          {/* Name */}
          <div className="flex flex-col">
            <label className="text-[10px] sm:text-[12px] font-[600] text-gray-500">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter Name"
              value={aadharDetails.name}
              onChange={handleChange}
              className="border px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] text-gray-700 focus:outline-none"
            />
          </div>

          {/* Address */}
          <div className="flex flex-col">
            <label className="text-[10px] sm:text-[12px] font-[600] text-gray-500">Address</label>
            <textarea
              name="address"
              placeholder="Enter Address"
              value={aadharDetails.address}
              onChange={handleChange}
              rows="2"
              className="border px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] text-gray-700 focus:outline-none"
            />
          </div>

          {/* City */}
          <div className="flex flex-col">
            <label className="text-[10px] sm:text-[12px] font-[600] text-gray-500">City</label>
            <input
              type="text"
              name="city"
              placeholder="Enter City"
              value={aadharDetails.city}
              onChange={handleChange}
              className="border px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] text-gray-700 focus:outline-none"
            />
          </div>

          {/* State */}
          <div className="flex flex-col">
            <label className="text-[10px] sm:text-[12px] font-[600] text-gray-500">State</label>
            <input
              type="text"
              name="state"
              placeholder="Enter State"
              value={aadharDetails.state}
              onChange={handleChange}
              className="border px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] text-gray-700 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 rounded-lg text-white text-[10px] sm:text-[12px] font-[600] ${isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#0CBB7D] hover:bg-green-500"
              }`}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center">
            <span className="text-white">Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}
