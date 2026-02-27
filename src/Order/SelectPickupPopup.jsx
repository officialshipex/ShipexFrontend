import axios from "axios"
import React, { useState, useEffect } from "react";
import Select from "react-select";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
import UpdatePickupAddress from "./UpdatePickupAddress";
import { Navigate, useNavigate } from "react-router-dom";
import { Notification } from "../Notification"
import { MapPin } from "lucide-react";



const SelectPickupPopup = ({ onClose, setSelectedData, title, setRefresh, refresh, onPickupSelected, userId }) => {
    const [Pickup, setPickUp] = useState(null); // Selected Pickup Address
    const [refresh1, setRefresh1] = useState(false);
    const [isModalOpen1, setIsModalOpen1] = useState(false); // Pickup Address Modal
    const [pickupAddress, setPickUpAddress] = useState([]); // Pickup Address List
    const [showBulkShipModal, setShowBulkShipModal] = useState(false); // Local modal state
    const [formData, setFormData] = useState({
        contactName: "",
        email: "",
        phoneNumber: "",
        address: "",
        pinCode: "",
        city: "",
        state: "",
    });
    console.log("userId in select pickup popup", userId)
    const navigate = useNavigate()
    // console.log(setSelectedData)
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const effectiveUserId = (userId && userId !== "null" && userId !== "undefined")
        ? userId
        : (setSelectedData?.[0]?.userId?._id || setSelectedData?.[0]?.userId);

    useEffect(() => {
        const fetchPickupAddresses = async () => {
            if (!effectiveUserId || effectiveUserId === "null" || effectiveUserId === "undefined") return;
            try {
                const token = Cookies.get("session");
                const response = await axios.get(
                    `${REACT_APP_BACKEND_URL}/order/pickupAddress?userId=${effectiveUserId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setPickUpAddress(response.data.data || []);
            } catch (error) {
                console.error("Error fetching pickup addresses:", error);
            }
        };
        fetchPickupAddresses();
    }, [refresh1, effectiveUserId, REACT_APP_BACKEND_URL]);

    // Handle Pickup Address Selection
    const handlePickupChange = (selectedOption) => {
        if (selectedOption?.value !== "no_address") {
            const selectedPickup = pickupAddress.find(
                (address) => address._id === selectedOption.value
            );
            setPickUp(selectedPickup || null);

            if (selectedPickup) {
                setFormData({
                    contactName: selectedPickup.pickupAddress?.contactName || "",
                    email: selectedPickup.pickupAddress?.email || "",
                    phoneNumber: selectedPickup.pickupAddress?.phoneNumber || "",
                    address: selectedPickup.pickupAddress?.address || "",
                    pinCode: selectedPickup.pickupAddress?.pinCode || "",
                    city: selectedPickup.pickupAddress?.city || "",
                    state: selectedPickup.pickupAddress?.state || "",
                });
            }
        } else {
            setPickUp(null);
            setFormData({
                contactName: "",
                email: "",
                phoneNumber: "",
                address: "",
                pinCode: "",
                city: "",
                state: "",
            });
        }
    };

    // Prepare Pickup Address Options
    const pickupOptions =
        pickupAddress.length > 0
            ? pickupAddress.map((address) => ({
                value: address._id,
                label: address.pickupAddress?.contactName || "Unnamed Contact",
            }))
            : [{ value: "no_address", label: "No pickup addresses available" }];

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = Cookies.get("session");
            if (!token) {
                Notification("No authentication token found.", "error");
                return;
            }
            let success = true;
            if (setSelectedData && setSelectedData.length > 0) {
                const response = await axios.post(
                    `${REACT_APP_BACKEND_URL}/bulk/updatePickup?userId=${effectiveUserId}`,
                    { formData, setSelectedData },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                success = response.status === 200 || response.status === 201;
            }

            if (success) {
                Notification("Pickup address selected successfully!", "success");

                if (typeof onPickupSelected === "function") {
                    await onPickupSelected(formData);
                } else {
                    setRefresh && setRefresh(!refresh);
                }
                setShowBulkShipModal(false);
                setFormData({
                    contactName: "",
                    email: "",
                    phoneNumber: "",
                    address: "",
                    pinCode: "",
                    city: "",
                    state: "",
                });

                onClose();
            }
        } catch (error) {
            Notification("Error saving pickup address. Please try again.", "error");
            console.error("Error saving pickup address:", error);
        }
    };

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: state.isFocused ? "#0CBB7D" : "#e2e8f0",
            boxShadow: state.isFocused ? "0 0 0 1px #0CBB7D" : "none",
            "&:hover": {
                borderColor: "#0CBB7D",
            },
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#6b7280",
            minHeight: "35px",
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? "#0CBB7D"
                : state.isFocused
                    ? "#F0FDF4"
                    : "white",
            color: state.isSelected ? "white" : "#4b5563",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
            "&:active": {
                backgroundColor: "#0CBB7D",
                color: "white",
            },
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        }),
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 z-[1000] animate-popup-in bg-opacity-50">
            <div className="bg-white p-4 rounded-lg shadow-lg w-[700px] relative">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-[#0CBB7D]" />
                    <h2 className="font-[600] text-[12px] sm:text-[14px] text-gray-700">
                        Select Pickup Address
                    </h2>
                </div>
                <Select
                    options={pickupOptions}
                    onChange={handlePickupChange}
                    styles={customStyles}
                    placeholder="Search or Select Pickup Address"
                    className="w-full min-h-[30px] rounded-lg font-[600] text-gray-500 text-[10px] sm:text-[12px]"
                />
                <button
                    onClick={() => setShowBulkShipModal(true)}
                    className="text-[#0CBB7D] mt-2 text-[10px] sm:text-[12px] w-full sm:w-auto text-left sm:text-right hover:underline transition-all"
                >
                    + Add new pickup address
                </button>

                {/* Selected Pickup Address Display */}
                {Pickup && (
                    <div className="mt-2 text-gray-500 text-[10px] sm:text-[12px] bg-gray-100 p-2 rounded-lg border border-gray-200">
                        <p>
                            <strong>Contact Name:</strong>{" "}
                            {Pickup.pickupAddress?.contactName}
                        </p>
                        <p>
                            <strong>Address:</strong> {Pickup.pickupAddress?.address},{" "}
                            {Pickup.pickupAddress?.city}, {Pickup.pickupAddress?.pinCode}
                        </p>
                    </div>
                )}
                <div className="col-span-2 text-right flex gap-2 mt-4 justify-end">
                    <button
                        type="button"
                        className="bg-gray-200 text-[10px] sm:text-[12px] font-[600] text-gray-500 px-5 py-2 rounded-lg hover:bg-gray-300 transition-all"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="bg-[#0CBB7D] text-[10px] sm:text-[12px] font-[600] text-white px-5 py-2 rounded-lg hover:bg-opacity-90 transition-all"
                    >
                        Save
                    </button>
                </div>
            </div>
            {showBulkShipModal && (
                <UpdatePickupAddress
                    onClose={() => setShowBulkShipModal(false)}
                    setRefresh={setRefresh}
                    userId={effectiveUserId}
                    setPickupAddress={(newAddress) =>
                        setPickUpAddress((prev) => [...prev, newAddress])
                    }
                />
            )}
        </div>
    );
};

export default SelectPickupPopup;
