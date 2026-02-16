import React, { useState, useEffect } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import Modal from "../Modal";
import {Notification} from "../../Notification"
import Cookies from "js-cookie";

const { REACT_APP_BACKEND_URL } = process.env;

const UpdateReceiverAdd = ({ isOpen, onClose, onSave, ReceiverAddress }) => {
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
    if (ReceiverAddress) {
      setFormData({
        contactName: ReceiverAddress.contactName || "",
        email: ReceiverAddress.email || "",
        phoneNumber: ReceiverAddress.phoneNumber || "",
        address: ReceiverAddress.address || "",
        pinCode: ReceiverAddress.pinCode || "",
        city: ReceiverAddress.city || "",
        state: ReceiverAddress.state || "",
      });
    }
  }, [ReceiverAddress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
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
        console.error("Error fetching city and state:", error);
        setFormData((prev) => ({ ...prev, city: "", state: "" }));
        Notification("Pincode not found!","error");
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
    onClose(); // Close the modal after saving
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<span className="text-[14px] font-[600] text-gray-700">Update Receiver Address</span>}>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2 text-[12px] font-[600] text-gray-700">
        <div>
          <label className="block font-[600] text-[12px]">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="contactName"
            placeholder="Enter Contact Name"
            value={formData.contactName}
            onChange={handleChange}
            className="w-full m-1 px-3 py-2 text-[12px] font-[600] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
          />
        </div>
        <div>
          <label className="block font-[600] text-[12px]">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            placeholder="buyer.contact@shipex.in"
            value={formData.email}
            onChange={handleChange}
            className="w-full m-1 px-3 py-2 text-[12px] font-[600] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
          />
        </div>
        <div>
          <label className="block font-[600] text-[12px]">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="phoneNumber"
            placeholder="Enter Phone Number"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full m-1 px-3 py-2 text-[12px] font-[600] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
          />
        </div>
        <div>
          <label className="block font-[600] text-[12px]">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            placeholder="Enter Address"
            value={formData.address}
            onChange={handleChange}
            className="w-full m-1 px-3 py-2 text-[12px] font-[600] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
          />
        </div>
        <div>
          <label className="block font-[600] text-[12px]">
            Pincode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="pinCode"
            placeholder="Enter Pincode"
            value={formData.pinCode}
            onChange={handlePincodeChange}
            className="w-full m-1 px-3 py-2 text-[12px] font-[600] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
          />
        </div>
        <div>
          <label className="block font-[600] text-[12px]">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            placeholder="Enter City"
            value={formData.city}
            onChange={handleChange}
            readOnly
            className="w-full m-1 px-3 py-2 bg-gray-50 text-[12px] font-[600] border rounded-lg focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-[600] text-[12px]">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="state"
            placeholder="Enter State"
            value={formData.state}
            onChange={handleChange}
            readOnly
            className="w-full m-1 px-3 py-2 text-[12px] bg-gray-50 font-[600] border rounded-lg focus:outline-none"
          />
        </div>
        <div className="col-span-2 text-right">
          <button
            type="submit"
            className="bg-[#0CBB7D] text-white px-3 py-2 hover:opacity-90 transition rounded-lg text-[12px] font-[600]"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateReceiverAdd;
