import React, { useState, useEffect } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { Notification } from "../Notification"

const AddReceiverAddress = ({ setReceiverAddress, setRefresh, initialData }) => {
  const [formData, setFormData] = useState({
    contactName: initialData?.contactName || "",
    email: initialData?.email || "",
    phoneNumber: initialData?.phoneNumber || "",
    address: initialData?.address || "",
    pinCode: initialData?.pinCode || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
  });

  useEffect(() => {
    if (initialData) {
      const data = initialData.data || initialData;
      setFormData({
        contactName: data.contactName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        address: data.address || "",
        pinCode: data.pinCode || "",
        city: data.city || "",
        state: data.state || "",
      });
    }
  }, [initialData]);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone number: digits only, at most 10. Extra digits are cut instead of the keystroke being refused —
    // refusing it locked the field for an order saved with two numbers ("9727977677, 9574663777"): even
    // deleting one character still left more than 10 digits, so nothing could be changed.
    const cleanedValue = name === "phoneNumber" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setFormData((prevData) => ({
      ...prevData,
      [name]: cleanedValue,
    }));

    setReceiverAddress((prevData) => ({
      ...prevData,
      [name]: cleanedValue,
    }));
  };

  const handlePincodeChange = async (e) => {
    const enteredPincode = e.target.value.replace(/\s/g, ""); // remove spaces

    // Allow only digits
    if (!/^\d*$/.test(enteredPincode)) {
      Notification("Pincode must contain only digits.", "info");
      return;
    }

    // Set the cleaned pincode
    setFormData((prevData) => ({
      ...prevData,
      pinCode: enteredPincode,
    }));

    // Validate length
    if (enteredPincode.length > 6) {
      Notification("Pincode must be exactly 6 digits.", "info");
      return;
    }

    if (enteredPincode.length === 6) {
      try {
        const token = Cookies.get("session");
        if (!token) {
          Notification("No authentication token found.", "error");
          return;
        }

        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/order/pincode/${enteredPincode}`,
          {
            headers: { authorization: `Bearer ${token}` },
          }
        );

        if (response.data) {
          setFormData((prevData) => ({
            ...prevData,
            city: response.data.city,
            state: response.data.state,
          }));
        } else {
          setFormData((prevData) => ({
            ...prevData,
            city: "",
            state: "",
          }));
          Notification("Pincode not found!", "error");
        }
      } catch (error) {
        console.error("Error fetching city and state:", error);
        Notification("Pincode not found!", "error");
        setFormData((prevData) => ({
          ...prevData,
          city: "",
          state: "",
        }));
      }
    }
  };

  const isFormComplete = () => {
    return Object.values(formData).every((value) => value.trim() !== "");
  };

  useEffect(() => {
    setReceiverAddress(formData);
  }, [formData, setReceiverAddress]);

  return (
    <div>
      <form className="grid gap-2">
        <div className="grid md:grid-cols-2 gap-2 text-[12px] text-gray-700">
          <div>
            <label className="block font-[600] text-[12px]">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Enter Contact Name"
              className="w-full border font-[600] rounded-lg px-3 py-2 text-[12px]  outline-none focus:ring-1 focus:ring-brand-primary"
              required
            />
          </div>
          <div>
            <label className="block font-[600] text-[12px]">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="receiver.contact@shipex.in"
              className="w-full border font-[600] rounded-lg px-3 py-2 text-[12px]  outline-none focus:ring-1 focus:ring-brand-primary"
              required
            />
          </div>
          <div>
            <label className="block font-[600] text-[12px]">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter Phone Number"
              inputMode="numeric"
              className={`w-full border font-[600] rounded-lg px-3 py-2 text-[12px]  outline-none focus:ring-1 focus:ring-brand-primary ${formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber) ? "border-red-400" : ""}`}
              required
            />
            {formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber) && (
              <p className="text-[10px] text-red-500 mt-0.5">Enter one 10-digit mobile number.</p>
            )}
          </div>
          <div>
            <label className="block font-[600] text-[12px]">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter Address"
              className="w-full border font-[600] rounded-lg px-3 py-2 text-[12px]  outline-none focus:ring-1 focus:ring-brand-primary"
              required
            />
          </div>
          <div>
            <label className="block font-[600] text-[12px]">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pinCode"
              value={formData.pinCode}
              onChange={handlePincodeChange}
              placeholder="Enter Pincode"
              className="w-full border font-[600] rounded-lg px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-brand-primary"
              required
            />
          </div>
          <div>
            <label className="block font-[600] text-[12px]">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              readOnly
              className="w-full px-3 py-2 bg-gray-50 border text-[12px] font-[600] rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-[600] text-[12px]">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              readOnly
              className="w-full px-3 py-2 bg-gray-50 border text-[12px] font-[600] rounded-lg focus:outline-none"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddReceiverAddress;
