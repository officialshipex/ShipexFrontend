import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import axios from "axios";
// import { toast } from "react-toastify";
import { Notification } from "../Notification"
import Cookies from "js-cookie";
const AddPickupAddress = ({ onClose, setRefresh, setPickupAddress, userId }) => {
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
    console.log("AddPickupAddress", setPickupAddress)
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL


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
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handlePincodeChange = async (e) => {
        const enteredPincode = e.target.value;
        setPincode(enteredPincode);

        // Update formData with the entered pincode
        setFormData((prevData) => ({
            ...prevData,
            pinCode: enteredPincode, // ✅ Ensure pinCode is stored
        }));

        if (enteredPincode.length === 6) {
            try {
                const token = Cookies.get("session");
                const response = await axios.get(
                    `${REACT_APP_BACKEND_URL}/order/pincode/${enteredPincode}`,
                    {
                        headers: { authorization: `Bearer ${token}` },
                    }
                );
                console.log(response)

                if (response.data) {
                    console.log(response.data);
                    setCity(response.data.city);
                    setState(response.data.state);

                    // Update formData with city and state as well
                    setFormData((prevData) => ({
                        ...prevData,
                        city: response.data.city,
                        state: response.data.state,
                    }));
                } else {
                    setCity("");
                    setState("");
                    Notification("Pincode not found!", "error")

                }
            } catch (error) {
                console.error("Error fetching city and state:", error);
                setCity("");
                setState("");
            }
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
                `${REACT_APP_BACKEND_URL}/order/pickupAddress?userId=${userId}`,
                formData,
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
            console.error("Error saving pickup address:", error.response?.data || error.message);
            Notification("Error saving pickup address. Please try again.", "error");
        }
    };


    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 animate-popup-in bg-opacity-50">
            <div className="bg-white p-4 rounded-lg shadow-lg w-[700px] relative">
                <h2 className="sm:text-[14px] text-[12px] font-[600] text-gray-700">Add PickUp Address</h2>
                <form className="grid grid-cols-2 mt-2 gap-2 text-[12px] font-[600] text-gray-700">
                    <div className="flex flex-col gap-1">
                        <label className="block">
                            Contact Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="contactName"
                            value={formData.contactName}
                            onChange={handleChange}
                            placeholder="Enter Contact Name"
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="block">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="buyer.contact@shipex.in"
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="block">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="Enter Phone Number"
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="block">
                            Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter Address"
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="block">
                            Pincode <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="pinCode"
                            value={pincode}
                            onChange={handlePincodeChange}
                            placeholder="Enter Pincode"
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="block">
                            City <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            readOnly
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="block">
                            State <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            readOnly
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                        />
                    </div>
                    <div className="col-span-2 text-right flex gap-2 justify-end">
                        <button
                            type="button"
                            className="bg-gray-200 text-gray-500 px-3 py-2 rounded-lg text-[12px]"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="bg-[#0CBB7D] text-white px-3 py-2 rounded-lg hover:opacity-90 transition text-[12px]"
                        >
                            Save
                        </button>

                    </div>
                </form>

                {/* Close Button */}
                <button
                    className="absolute top-2 right-4 text-gray-500 hover:text-gray-900"
                    onClick={onClose}
                >
                    ✖
                </button>

                <div className="mt-4"></div>
            </div>
        </div>
    );
};

export default AddPickupAddress;