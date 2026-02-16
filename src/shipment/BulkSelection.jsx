import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import ThreeDotLoader from "../Loader";
import { Notification } from "../Notification";
import Cookies from "js-cookie";
import { FaPlane, FaTruck } from "react-icons/fa";
import Bluedart from "../assets/bluedart.png";
import Delehivery from "../assets/delehivery.png";
import EcomExpress from "../assets/ecom-expresss.avif";
import Shadowfax from "../assets/shadowfax.png";
import Xpressbees from "../assets/xpressbees.png";
import Shiprocket from "../assets/shiprocket.webp";
import NimbusPost from "../assets/nimbuspost.webp";
import ShreeMaruti from "../assets/shreemaruti.png";
import DTDC from "../assets/dtdc.png";
import Smartship from "../assets/bluedart.png";
import Amazon from "../assets/amazon.jpg";

const BulkSelection = () => {
    const [plan, setPlan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingButtons, setLoadingButtons] = useState({});
    const [message, setMessage] = useState("");
    const [selectedCourier, setSelectedCourier] = useState(null);

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedOrders, wh } = location.state || {};

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                setLoading(true);
                const token = Cookies.get("session");
                const pinCode = wh?.pinCode || "No Pin Code";

                const response = await axios.post(
                    `${REACT_APP_BACKEND_URL}/bulk/shipBulkOrder`,
                    { selectedOrders, pinCode },
                    { headers: { authorization: `Bearer ${token}` } }
                );
                setPlan(response.data.services);
            } catch (error) {
                console.error("Error fetching order details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (selectedOrders?.length > 0) {
            fetchOrderDetails();
        }
    }, [selectedOrders, wh]);

    const handleBulkShip = async (courier) => {
        const selected = courier || selectedCourier;
        if (!selected) return;
        console.log("selected", selected, selectedOrders, wh)
        try {
            const token = Cookies.get("session");
            Notification("Your bulk order is being processed...", "info");

            axios
                .post(
                    `${REACT_APP_BACKEND_URL}/bulk/create-bulk-order`,
                    { item: selected, selectedOrders, wh },
                    { headers: { authorization: `Bearer ${token}` } }
                )
                .then((res) => {
                    const message = res.data?.message || "Bulk order processed successfully!";
                    Notification(message, "success");
                })
                .catch((err) => {
                    const message = err.response?.data?.message || "Bulk order processing failed!";
                    Notification(message, "error");
                });

            navigate("/dashboard/order");
        } catch (error) {
            Notification("Failed to start processing. Try again.", "error");
            console.error("Error starting bulk order:", error);
        }
    };




    const getCarrierLogo = (name) => {
        const lower = name.toLowerCase();
        if (lower.includes("xpressbees")) return Xpressbees;
        if (lower.includes("bluedart")) return Bluedart;
        if (lower.includes("delhivery")) return Delehivery;
        if (lower.includes("ecom express")) return EcomExpress;
        if (lower.includes("shadowfax")) return Shadowfax;
        if (lower.includes("shiprocket")) return Shiprocket;
        if (lower.includes("nimbus")) return NimbusPost;
        if (lower.includes("dtdc")) return DTDC;
        if (lower.includes("amazon")) return Amazon;
        if (lower.includes("shree maruti")) return ShreeMaruti
        return "/logos/default.png";
    };

    return (
        <div className="flex flex-col sm:px-2">
            <h2 className="sm:text-[18px] text-[14px] text-left font-[600] text-gray-700 mb-2">
                Bulk Selection
            </h2>
            {/* Desktop Table */}
            <div className="hidden md:block w-full">


                {/* {message && (
                    <div className="mb-4 text-center text-[12px] sm:text-[14px] font-[600] text-red-600">
                        {message}
                    </div>
                )} */}

                <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300">
                        <thead>
                            <tr className="text-white bg-[#0CBB7D] border border-[#0CBB7D] text-[12px] font-600">
                                <th className="px-3 py-2 text-left">Courier</th>
                                <th className="px-3 py-2 text-left">Courier Type</th>
                                <th className="px-3 py-2 text-left">Mode</th>
                                <th className="px-3 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-6">
                                        <ThreeDotLoader />
                                    </td>
                                </tr>
                            ) : plan.length > 0 ? (
                                plan.map((item) => (
                                    <tr
                                        key={item._id}
                                        className="border hover:bg-gray-50 border-gray-300 text-gray-500 transition-all text-[12px] font-[400] relative"
                                    >
                                        {/* Logo + Name Combined */}
                                        <td className="px-3 py-2 flex items-center gap-3">
                                            <img
                                                src={getCarrierLogo(item.name)}
                                                alt={item.name}
                                                className="w-10 h-10 rounded-md"
                                            />
                                            <span className="font-[600]">{item.name}</span>
                                        </td>

                                        {/* Courier Type */}
                                        <td className="border border-gray-300 px-3 py-2">
                                            {item.courierType}
                                        </td>

                                        {/* Mode */}
                                        <td className="border border-gray-300 px-3 py-2 text-center">
                                            {item.courierType === "Domestic (Air)" ? (
                                                <FaPlane className="text-gray-500 text-[16px]" />
                                            ) : (
                                                <FaTruck className="text-gray-500 text-[16px]" />
                                            )}
                                        </td>

                                        {/* Action Button */}
                                        <td className="border border-gray-300 font-[600] px-3 py-2 text-center">
                                            <button
                                                disabled={loadingButtons[item.name]}
                                                className={`px-3 py-2 rounded-lg text-white sm:text-[12px] text-[10px] transition ${loadingButtons[item.name]
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : "bg-[#0CBB7D]"
                                                    }`}
                                                onClick={() => handleBulkShip(item)}

                                            >
                                                {loadingButtons[item.name] === "shipped"
                                                    ? "Shipped"
                                                    : loadingButtons[item.name]
                                                        ? "Processing..."
                                                        : "Ship Now"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-4 text-gray-500">
                                        No courier partners available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden w-full">
                {loading ? (
                    <div className="text-center py-6">
                        <ThreeDotLoader />
                    </div>
                ) : plan.length > 0 ? (
                    plan.map((item) => {
                        const isActive = selectedCourier?.name === item.name;
                        return (
                            <div
                                key={item._id}
                                className={`relative border text-[12px] rounded-lg p-4 mb-2 shadow-lg bg-white cursor-pointer transition
                  ${isActive ? "border-[#0CBB7D] ring-1 ring-[#0CBB7D]" : "border-gray-200"}`}
                                onClick={() => setSelectedCourier(item)}
                            >
                                <div className="flex justify-between items-center gap-4 w-full mb-2">
                                    <div className="flex justify-center gap-4 w-full">
                                        <img
                                            src={getCarrierLogo(item.name)}
                                            alt={item.name}
                                            className="w-10 h-10 rounded-md border"
                                        />
                                        <div className="flex justify-between w-full">
                                            <div className="flex flex-col justify-start">
                                                <h2 className="font-[600]">{item.name}</h2>
                                                <span className="text-gray-500">{item.courierType}</span>
                                            </div>
                                            <div className="text-[12px] flex flex-col justify-center items-end">
                                                <span>
                                                    Mode:{" "}
                                                    {item.courierType === "Domestic (Air)" ? (
                                                        <FaPlane className="text-gray-500 text-[14px]" />
                                                    ) : (
                                                        <FaTruck className="text-gray-500 text-[14px]" />
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-4 text-gray-500">
                        No courier partners available
                    </div>
                )}

                {/* Bottom Fixed Button */}
                <div className="fixed bottom-0 left-0 w-full px-4 pb-3 z-50 md:hidden bg-gradient-to-t from-[#f5f7fb] via-[#ffffffcc] to-transparent">
                    <button
                        onClick={() => handleBulkShip(selectedCourier)}
                        disabled={!selectedCourier || loadingButtons[selectedCourier?.name]}
                        className={`w-full px-3 py-2 rounded-lg font-[600] text-white bg-[#0CBB7D] shadow text-[12px] transition
    ${!selectedCourier ? "opacity-50 cursor-not-allowed" : ""}
    ${selectedCourier && loadingButtons[selectedCourier?.name]
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                    >

                        {selectedCourier
                            ? loadingButtons[selectedCourier.name]
                                ? "Processing..."
                                : `Ship With ${selectedCourier.name}`
                            : "Select a courier to ship"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkSelection;
