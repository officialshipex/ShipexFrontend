import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import axios from "axios";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { Notification } from "../Notification"
const AddPickupAddress = ({
  isOpen,
  onClose,
  onSave,
  setPickupAddress,
  setRefresh,
  userId,
}) => {
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [formData, setFormData] = useState({
    contactName: "",
    email: "",
    phoneNumber: "",
    address: "",
    pinCode: "",
    city: "",
    state: "",
  });

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Update city and state in formData when they change
  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      city,
      state,
    }));
  }, [city, state]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validation logic
    if (name === "phoneNumber") {
      const phoneRegex = /^[6-9]\d{0,9}$/; // allow only numbers starting with 6-9 up to 10 digits
      if (!phoneRegex.test(value) && value !== "") return; // block invalid entry
    }

    if (name === "pinCode") {
      const pinRegex = /^\d{0,6}$/; // allow only digits up to 6
      if (!pinRegex.test(value) && value !== "") return;
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handlePincodeChange = (e) => {
    handleChange(e); // reuse existing change handler

    const enteredPincode = e.target.value;

    if (enteredPincode.length === 6) {
      // proceed with fetching city/state
      (async () => {
        try {
          const token = Cookies.get("session");
          const response = await axios.get(
            `${REACT_APP_BACKEND_URL}/order/pincode/${enteredPincode}`,
            {
              headers: { authorization: `Bearer ${token}` },
            }
          );

          if (response.data) {
            setCity(response.data.city);
            setState(response.data.state);
          } else {
            setCity("");
            setState("");
            Notification("Pincode not found!", "error");
          }
        } catch (error) {
          console.error("Error fetching city and state:", error);
          setCity("");
          setState("");
        }
      })();
    } else {
      setCity("");
      setState("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setPickupAddress(formData);

    const token = Cookies.get("session");
    if (!token) {
      Notification("Authentication error. Please log in again.", "error");
      return;
    }

    try {
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/order/pickupAddress`,
        { ...formData, userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Notification("Pickup address saved successfully!", "success");

        setRefresh(true);

        // Delay closing the modal so the toast can be seen
        setTimeout(() => {
          onClose();
        }, 100); // 2 seconds delay

        // Reset form fields after submission
        setFormData({
          contactName: "",
          email: "",
          phoneNumber: "",
          address: "",
          pinCode: "",
          city: "",
          state: "",
        });
      } else {
        console.error("Unexpected response:", response);
      }
    } catch (error) {
      console.error(
        "Error saving pickup address:",
        error.response?.data || error.message
      );
      Notification("Error saving pickup address. Please try again.", "error");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Pickup Address">
      <form
        className="grid md:grid-cols-2 gap-2 text-[12px] text-gray-700"
        onSubmit={handleSubmit}
      >
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
            value={formData.email}
            onChange={handleChange}
            placeholder="Seller.contact@shipex.com"
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
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Enter Phone Number"
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
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter Address"
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
            value={formData.pinCode}
            onChange={handlePincodeChange}
            placeholder="Enter Pincode"
            className="w-full m-1 px-3 py-2 text-[12px] font-[600] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
            inputMode="numeric"
            pattern="[0-9]*"
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
            value={formData.state}
            readOnly
            className="w-full m-1 px-3 py-2 bg-gray-50 text-[12px] font-[600] border rounded-lg focus:outline-none"
          />
        </div>
        <div className="col-span-2 text-right">
          <button
            type="submit"
            className="bg-[#0CBB7D] font-[600] text-[12px] text-white px-3 py-2 hover:opacity-90 transition rounded-lg"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPickupAddress;
