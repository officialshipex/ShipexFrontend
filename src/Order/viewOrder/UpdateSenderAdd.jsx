import React, { useState, useEffect } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import Modal from "../Modal";
import {Notification} from "../../Notification"
import Cookies from "js-cookie";

const { REACT_APP_BACKEND_URL } = process.env;

const UpdateSenderAdd = ({ isOpen, onClose, onSave, PickupAddress, title }) => {
  const [formData, setFormData] = useState({
    contactName: "",
    email: "",
    phoneNumber: "",
    address: "",
    pinCode: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    if (PickupAddress) {
      setFormData({
        contactName: PickupAddress.contactName || "",
        email: PickupAddress.email || "",
        phoneNumber: PickupAddress.phoneNumber || "",
        address: PickupAddress.address || "",
        pinCode: PickupAddress.pinCode || "",
        city: PickupAddress.city || "",
        state: PickupAddress.state || "",
      });
    }
  }, [PickupAddress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePincodeChange = async (e) => {
    handleChange(e);
    const enteredPincode = e.target.value;

    if (enteredPincode.length === 6) {
      try {
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/order/pincode/${enteredPincode}`,
          {
            headers: { authorization: `Bearer ${token}` },
          }
        );

        if (response.data) {
          setFormData((prev) => ({
            ...prev,
            city: response.data.city,
            state: response.data.state,
          }));
        } else {
          setFormData((prev) => ({ ...prev, city: "", state: "" }));
          Notification("Pincode not found!","error");
        }
      } catch (error) {
        console.error("Error fetching city/state for pincode:", error);
        Notification("Failed to fetch city/state.","error");
        setFormData((prev) => ({ ...prev, city: "", state: "" }));
      }
    } else {
      setFormData((prev) => ({ ...prev, city: "", state: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    onClose(); // close modal after save
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="text-[12px] sm:text-[14px] font-[600] text-gray-700">{title || "Update Sender Address"}</span>}
    >
      <form className="grid grid-cols-2 gap-2 text-[12px] font-[600] text-gray-700" onSubmit={handleSubmit}>
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
            className="w-full px-3 py-2 text-[12px] font-[600] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
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
            placeholder="buyer.contact@shipex.in"
            className="w-full px-3 py-2 text-[12px] font-[600] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
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
            className="w-full px-3 py-2 text-[12px] font-[600] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
          />
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
            className="w-full px-3 py-2 text-[12px] font-[600] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
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
            className="w-full px-3 py-2 text-[12px] font-[600] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
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
            onChange={handleChange}
            placeholder="Enter City"
            readOnly
            className="w-full px-3 py-2 bg-gray-50 text-[12px] font-[600] border rounded-lg focus:outline-none"
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
            onChange={handleChange}
            placeholder="Enter State"
            readOnly
            className="w-full px-3 py-2 bg-gray-50 text-[12px] font-[600] border rounded-lg focus:outline-none"
          />
        </div>
        <div className="col-span-2 text-right">
          <button type="submit" className="bg-[#0CBB7D] text-white px-4 py-2 sm:text-[12px] text-[10px] hover:opacity-90 transition rounded-lg">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateSenderAdd;
