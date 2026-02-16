import React, { useEffect, useState } from "react";
import { FiDownload, FiTruck, FiUpload } from "react-icons/fi";
import { Notification } from "../../../Notification";

import Dtdc from "../../../assets/dtdc.png";
import Delhivery from "../../../assets/delehivery.png";
import ShreeMaruti from "../../../assets/shreemaruti.png";
import AmazonShipping from "../../../assets/amazon.jpg";
import Loader from "../../../Loader"

const PincodeInformation = () => {
    const [loading, setLoading] = useState(false);
    const [pincodeData, setPincodeData] = useState([]);
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    // Map courier name to logo
    const getCourierLogo = (courier) => {
        switch (courier?.toLowerCase()) {
            case "dtdc":
                return Dtdc;
            case "delhivery":
                return Delhivery;
            case "shree maruti":
                return ShreeMaruti;
            case "amazon shipping":
                return AmazonShipping;
            default:
                return "/default-courier.png";
        }
    };

    // Fetch courier pincode summary
    const fetchPincodeData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${REACT_APP_BACKEND_URL}/serviceablePincode/summary`);
            const data = await response.json();
            setLoading(false);

            if (response.ok) {
                setPincodeData(data.data || []);
            } else {
                Notification(data.message || "Failed to fetch pincode data", "error");
            }
        } catch (error) {
            setLoading(false);
            console.error("Fetch Error:", error);
            Notification("Error fetching pincode data", "error");
        }
    };

    useEffect(() => {
        fetchPincodeData();
    }, []);

    // Upload Serviceable Pincodes
    const handleUpload = async (courier) => {
        try {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = ".csv,.xlsx";
            fileInput.click();

            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append("file", file);

                setLoading(true);

                const response = await fetch(
                    `${REACT_APP_BACKEND_URL}/serviceablePincode/${courier}/upload-pincode`,
                    { method: "POST", body: formData }
                );

                setLoading(false);
                if (!response.ok) throw new Error("Failed to upload pincodes");

                const data = await response.json();
                Notification(data.message || "Pincodes uploaded successfully!", "success");
                fetchPincodeData();
            };
        } catch (error) {
            setLoading(false);
            console.error("Upload Error:", error);
            Notification("Error uploading serviceable pincodes", "error");
        }
    };

    // Download Serviceable Pincodes
    const handleDownload = async (courier) => {
        try {
            setLoading(true);
            const response = await fetch(
                `${REACT_APP_BACKEND_URL}/serviceablePincode/${courier}/download-pincode`
            );
            setLoading(false);

            if (!response.ok) throw new Error("Failed to download pincodes");

            const blob = await response.blob();
            const csvBlob = new Blob([blob], { type: "text/csv;charset=utf-8;" });

            const url = window.URL.createObjectURL(csvBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `serviceable_pincodes_${courier}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            setLoading(false);
            console.error("Download Error:", error);
            Notification("Error downloading serviceable pincodes", "error");
        }
    };

    const formatNumber = (num) => {
        return num?.toLocaleString() || 0;
    };


    return (
        <div className="relative w-full px-2">
            {/* Header */}
            <div className="mb-1">
                <h2 className="text-[14px] sm:text-[16px] font-[600] text-gray-700">
                    Serviceable Pincode Summary
                </h2>
            </div>

            {/* Table Section */}
            <div className="relative">
                {/* Loader overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-10">
                        <Loader />
                    </div>
                )}

                {/* === Desktop Table === */}
                <div className="hidden sm:block overflow-x-auto">
                    <div className="rounded-lg overflow-hidden">
                        <table className="min-w-full">
                            <thead className="bg-[#0CBB7D] text-white text-[12px]">
                                <tr className="border border-[#0CBB7D]">
                                    <th className="px-3 py-2 text-left">Courier</th>
                                    <th className="px-3 py-2 text-left">Total</th>
                                    <th className="px-3 py-2 text-left">Active</th>
                                    <th className="px-3 py-2 text-left">Inactive</th>
                                    <th className="px-3 py-2 text-left">Pickup</th>
                                    <th className="px-3 py-2 text-left">Delivery</th>
                                    <th className="px-3 py-2 text-left">COD</th>
                                    <th className="px-3 py-2 text-center">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {pincodeData.length > 0 ? (
                                    pincodeData.map((courier, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-green-50 border border-gray-300 transition text-[12px]"
                                        >
                                            <td className="px-3 py-2 flex items-center gap-3 font-[500] text-gray-600">
                                                <img
                                                    src={getCourierLogo(courier.courier)}
                                                    alt={courier.courier}
                                                    className="w-9 h-9 rounded-lg object-contain border border-gray-200 bg-white"
                                                />
                                                <span className="text-gray-800">{courier.courier || "-"}</span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-600 font-[500]">
                                                {formatNumber(courier.totalPincodes)}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600 font-[500]">
                                                {formatNumber(courier.totalPincodes - courier.nonServiceable)}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600 font-[500]">
                                                {formatNumber(courier.nonServiceable)}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600 font-[500]">
                                                {formatNumber(courier.pickupServiceable)}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600 font-[500]">
                                                {formatNumber(courier.deliveryServiceable)}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600 font-[500]">
                                                {formatNumber(courier.codServiceable)}
                                            </td>

                                            <td className="px-3 py-2 flex justify-center items-center gap-3">
                                                <button
                                                    className="flex items-center justify-center gap-1 bg-green-50 border border-[#0CBB7D] text-[#0CBB7D] px-3 py-1.5 rounded-lg text-[11px] font-[600] hover:bg-green-100 transition"
                                                    onClick={() => handleUpload(courier.courier)}
                                                >
                                                    <FiUpload className="w-4 h-4" /> Upload
                                                </button>
                                                <button
                                                    className="flex items-center justify-center gap-1 bg-[#0CBB7D] text-white px-3 py-1.5 rounded-lg text-[11px] font-[600] shadow hover:bg-green-600 transition"
                                                    onClick={() => handleDownload(courier.courier)}
                                                >
                                                    <FiDownload className="w-4 h-4" /> Download
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center text-gray-500 py-4 font-medium">
                                            No Pincode Data Found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* === Mobile View === */}
                <div className="sm:hidden grid gap-4 mt-1">
                    {pincodeData.map((courier, idx) => (
                        <div
                            key={idx}
                            className="bg-green-50 border border-[#0CBB7D] p-4 rounded-lg shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <img
                                        src={getCourierLogo(courier.courier)}
                                        alt={courier.courier}
                                        className="w-8 h-8 rounded-md object-contain border border-gray-200 bg-white"
                                    />
                                    <p className="font-[600] text-gray-700 text-[12px]">
                                        {courier.courier || "-"}
                                    </p>
                                </div>
                                <span className="text-[12px] font-[600] text-gray-500">
                                    Total: <span className="text-gray-700">{formatNumber(courier.totalPincodes)}</span>
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 font-[600] text-[12px]">
                                <span className="text-gray-500">
                                    Active: <span className="text-gray-700">{formatNumber(courier.totalPincodes - courier.nonServiceable)}</span>
                                </span>
                                <span className="text-gray-500">
                                    Inactive: <span className="text-gray-700">{formatNumber(courier.nonServiceable)}</span>
                                </span>
                                <span className="text-gray-500">
                                    Pickup: <span className="text-gray-700">{formatNumber(courier.pickupServiceable)}</span>
                                </span>
                                <span className="text-gray-500">
                                    Delivery: <span className="text-gray-700">{formatNumber(courier.deliveryServiceable)}</span>
                                </span>
                                <span className="text-gray-500">
                                    COD: <span className="text-gray-700">{formatNumber(courier.codServiceable)}</span>
                                </span>
                            </div>

                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => handleUpload(courier.courier)}
                                    className="flex items-center font-[600] gap-1 bg-green-50 border border-[#0CBB7D] text-[#0CBB7D] px-3 py-1 rounded-lg text-[10px] hover:bg-green-100 transition"
                                >
                                    <FiUpload /> Upload
                                </button>
                                <button
                                    onClick={() => handleDownload(courier.courier)}
                                    className="flex items-center font-[600] gap-1 bg-[#0CBB7D] text-white px-3 py-1 rounded-lg text-[10px] shadow hover:bg-green-600 transition"
                                >
                                    <FiDownload /> Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

    );
};

export default PincodeInformation;
