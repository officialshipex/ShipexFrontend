import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";

const KamDetailsEditModal = ({ isOpen, onClose, userId }) => {
    const [formData, setFormData] = useState({
        kamName: "",
        kamEmail: "",
        kamPhone: "",
    });

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // --------------------------
    // Fetch KAM Details
    // --------------------------
    useEffect(() => {
        if (!isOpen) return;

        const fetchDetails = async () => {
            try {
                setLoading(true);

                const res = await axios.get(
                    `${REACT_APP_BACKEND_URL}/user/getKamDetails/${userId}`,
                    {
                        headers: { Authorization: `Bearer ${Cookies.get("session")}` },
                    }
                );

                setFormData({
                    kamName: res.data.kamName || "",
                    kamEmail: res.data.kamEmail || "",
                    kamPhone: res.data.kamPhone || "",
                });

                

            } catch (err) {
                Notification(
                    "Failed to load KAM details",
                    "error",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [isOpen, userId]);

    // Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --------------------------
    // Save / Update KAM Details
    // --------------------------
    const handleSave = async () => {
        try {
            setSaving(true);

            await axios.put(
                `${REACT_APP_BACKEND_URL}/user/updateKamDetails/${userId}`,
                {
                    kamName: formData.kamName,
                    kamEmail: formData.kamEmail,
                    kamPhone: formData.kamPhone,
                },
                {
                    headers: { Authorization: `Bearer ${Cookies.get("session")}` },
                }
            );

            Notification(
                "KAM details updated successfully",
                "success",
            );

            onClose();

        } catch (err) {
            Notification(
                "Failed to update KAM details",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixedk animate-popup-in inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-sm rounded-lg shadow-lg p-4">
                <h2 className="text-[14px] mb-4 font-[600] text-gray-700">
                    Update KAM Details
                </h2>

                {loading ? (
                    <p className="text-[12px] text-gray-500">Loading...</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-2">
                            {/* Name */}
                            <div className="flex flex-col">
                                <label className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="kamName"
                                    value={formData.kamName}
                                    onChange={handleChange}
                                    className="border px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] text-gray-700 focus:outline-none"
                                />
                            </div>

                            {/* Email */}
                            <div className="flex flex-col">
                                <label className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="kamEmail"
                                    value={formData.kamEmail}
                                    onChange={handleChange}
                                    className="border px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] text-gray-700 focus:outline-none"
                                />
                            </div>

                            {/* Phone */}
                            <div className="flex flex-col">
                                <label className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    name="kamPhone"
                                    value={formData.kamPhone}
                                    onChange={handleChange}
                                    className="border px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-[600] text-gray-700 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                className="px-3 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-700 text-[10px] sm:text-[12px] font-[600]"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                className="px-3 py-2 rounded-lg bg-[#0CBB7D] hover:bg-green-500 text-white text-[10px] sm:text-[12px] font-[600]"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default KamDetailsEditModal;
