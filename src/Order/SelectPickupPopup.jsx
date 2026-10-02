import axios from "axios"
import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
import UpdatePickupAddress from "./UpdatePickupAddress";
import { Navigate, useNavigate } from "react-router-dom";
import { Notification } from "../Notification"
import { MapPin, ListOrdered, X } from "lucide-react";



const SelectPickupPopup = ({ onClose, setSelectedData, title, setRefresh, refresh, onPickupSelected, userId }) => {
    const [Pickup, setPickUp] = useState(null); // Selected Pickup Address
    const [refresh1, setRefresh1] = useState(false);
    const [isModalOpen1, setIsModalOpen1] = useState(false); // Pickup Address Modal
    const [pickupAddress, setPickUpAddress] = useState([]); // Pickup Address List
    const [showBulkShipModal, setShowBulkShipModal] = useState(false); // Local modal state
    const [courierServices, setCourierServices] = useState([]); // Enabled courier services available for priority ranking
    const savedPriorityKeys = useRef(""); // the priority as it was loaded, to save only when it was changed
    const [rankedCouriers, setRankedCouriers] = useState([]); // Ordered [{name, provider, mode}] — click order = rank
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

    // Courier priority is optional and secondary to the pickup-address flow —
    // fetched independently so a failure here never blocks shipping.
    useEffect(() => {
        const fetchCourierServices = async () => {
            if (!effectiveUserId || effectiveUserId === "null" || effectiveUserId === "undefined") return;
            try {
                const token = Cookies.get("session");
                const response = await axios.get(
                    `${REACT_APP_BACKEND_URL}/courier/getCourierServices?userId=${effectiveUserId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const rateCard = response.data?.data?.rateCard || [];
                const active = rateCard.filter((c) => c.status === "Active");
                setCourierServices(active);
                // Start from the priority already saved (only a custom one is a list); nothing saved = empty,
                // the user ranks from scratch. Only entries that are still active services are shown.
                const saved = response.data?.data?.priorityType === "Custom" ? (response.data?.data?.courierPriority || []) : [];
                const startList = saved
                    .filter((p) => active.some((c) => courierKey(c) === courierKey(p)))
                    .map((p) => ({ name: p.name, provider: p.provider, mode: p.mode }));
                savedPriorityKeys.current = startList.map(courierKey).join("##");
                setRankedCouriers(startList);
            } catch (error) {
                console.error("Error fetching courier services:", error);
                setCourierServices([]);
            }
        };
        fetchCourierServices();
    }, [effectiveUserId, REACT_APP_BACKEND_URL]);

    // Composite key — courierServiceName alone isn't unique (same courier can
    // appear with different modes, e.g. Surface vs Air), so dedupe/exclude on
    // name+provider+mode together.
    const courierKey = (c) =>
        `${c.courierServiceName ?? c.name}|||${c.courierProviderName ?? c.provider}|||${c.mode}`;

    const handleCourierPick = (option) => {
        if (!option) return;
        setRankedCouriers((prev) => [...prev, option.raw]);
    };

    const removeRankedCourier = (index) => {
        setRankedCouriers((prev) => prev.filter((_, i) => i !== index));
    };


    const availableCourierOptions = courierServices
        .filter((c) => !rankedCouriers.some((r) => courierKey(r) === courierKey(c)))
        .map((c) => ({
            value: courierKey(c),
            label: `${c.courierServiceName} (${c.mode})`,
            raw: { name: c.courierServiceName, provider: c.courierProviderName, mode: c.mode },
        }));

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
                // searchable by name, address, city, state, pincode and phone
                searchText: Object.values(address.pickupAddress || {}).join(" ").toLowerCase(),
            }))
            : [{ value: "no_address", label: "No pickup addresses available" }];

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = Cookies.get("session");
        if (!token) {
            Notification("No authentication token found.", "error");
            return;
        }

        // Priority is optional and independent of the pickup-address update —
        // a failure here must never block shipping. Only touch it at all if
        // the user actually picked something this time.
        if (rankedCouriers.length > 0 && rankedCouriers.map(courierKey).join("##") !== savedPriorityKeys.current) {
            try {
                await axios.post(
                    `${REACT_APP_BACKEND_URL}/courier/saveCourierPriority?userId=${effectiveUserId}`,
                    { type: "Custom", couriers: rankedCouriers },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Notification("Courier priority updated for future shipments.", "success");
            } catch (error) {
                console.error("Error saving courier priority:", error);
                Notification("Could not save courier priority. Continuing with pickup update.", "error");
            }
        }

        try {
            // The pickup address is optional here (the popup also carries the courier priority): with none
            // picked the orders keep the pickup address they already have.
            const hasPickup = Boolean(formData.address && formData.contactName);
            let success = true;
            if (hasPickup && setSelectedData && setSelectedData.length > 0) {
                const response = await axios.post(
                    `${REACT_APP_BACKEND_URL}/bulk/updatePickup?userId=${effectiveUserId}`,
                    { formData, setSelectedData },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                success = response.status === 200 || response.status === 201;
            }

            if (success) {
                if (hasPickup) Notification("Pickup address selected successfully!", "success");

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
            borderColor: state.isFocused ? "var(--brand-primary, #0CBB7D)" : "#e2e8f0",
            boxShadow: state.isFocused ? "0 0 0 1px var(--brand-primary, #0CBB7D)" : "none",
            "&:hover": {
                borderColor: "var(--brand-primary, #0CBB7D)",
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
                ? "var(--brand-primary, #0CBB7D)"
                : state.isFocused
                    ? "#F0FDF4"
                    : "white",
            color: state.isSelected ? "white" : "#4b5563",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
            "&:active": {
                backgroundColor: "var(--brand-primary, #0CBB7D)",
                color: "white",
            },
        }),
        menuPortal: (provided) => ({ ...provided, zIndex: 2000 }),
        menu: (provided) => ({
            ...provided,
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        }),
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 z-[1000] animate-popup-in bg-opacity-50">
            <div className="bg-white p-4 rounded-lg shadow-lg w-[700px] max-w-[95vw] max-h-[90vh] flex flex-col relative">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-brand-primary" />
                    <h2 className="font-[600] text-[12px] sm:text-[14px] text-gray-700">
                        Select Pickup Address
                    </h2>
                </div>
                {/* header and the Cancel / Save buttons stay fixed; everything between scrolls */}
                <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                <Select
                    options={pickupOptions}
                    onChange={handlePickupChange}
                    styles={customStyles}
                    menuPortalTarget={document.body}
                    placeholder="Search or Select Pickup Address"
                    filterOption={(option, input) =>
                        !input || option.label.toLowerCase().includes(input.toLowerCase()) || (option.data.searchText || "").includes(input.toLowerCase())
                    }
                    className="w-full min-h-[30px] rounded-lg font-[600] text-gray-500 text-[10px] sm:text-[12px]"
                />
                <button
                    onClick={() => setShowBulkShipModal(true)}
                    className="text-brand-primary mt-2 text-[10px] sm:text-[12px] w-full sm:w-auto text-left sm:text-right hover:underline transition-all"
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
                {/* Courier Priority — optional, mirrors Setup & Manage > Courier > Courier Priority */}
                {courierServices.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                            <ListOrdered className="w-4 h-4 text-brand-primary" />
                            <h2 className="font-[600] text-[12px] sm:text-[14px] text-gray-700">
                                Courier Priority (Optional)
                            </h2>
                        </div>
                        <p className="text-[10px] sm:text-[12px] text-gray-500 mb-2">
                            Rank your preferred couriers — this updates your account's standing priority
                            for all future shipments too. Leave blank to keep your current settings.
                        </p>
                        <Select
                            options={availableCourierOptions}
                            value={null}
                            onChange={handleCourierPick}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            placeholder="Search or select a courier to add as next priority"
                            className="w-full min-h-[30px] rounded-lg font-[600] text-gray-500 text-[10px] sm:text-[12px]"
                        />
                        {rankedCouriers.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {rankedCouriers.map((c, i) => (
                                    <div
                                        key={courierKey(c)}
                                        className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-lg px-2 py-1.5"
                                    >
                                        <span className="text-[10px] sm:text-[12px] font-[600] text-gray-700">
                                            <span className="inline-block bg-brand-primary text-white text-[10px] font-[600] rounded px-1.5 py-0.5 mr-2">
                                                {i + 1}
                                            </span>
                                            {c.name} <span className="text-gray-400 font-normal">({c.mode})</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeRankedCourier(i)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setRankedCouriers([])}
                                    className="text-brand-primary text-[10px] sm:text-[12px] hover:underline"
                                >
                                    Clear priority selections
                                </button>
                            </div>
                        )}
                    </div>
                )}

                </div>

                <div className="col-span-2 text-right flex gap-2 mt-3 pt-3 border-t border-gray-100 justify-end shrink-0">
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
                        className="bg-brand-primary text-[10px] sm:text-[12px] font-[600] text-white px-5 py-2 rounded-lg hover:bg-opacity-90 transition-all"
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
