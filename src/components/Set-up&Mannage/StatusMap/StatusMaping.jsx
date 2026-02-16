import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ChevronDown } from "lucide-react"; // 👈 arrow icon
import UploadStatus from "./UploadStatus";
import Loader from "../../../Loader"

const StatusMaping = () => {
    const [couriers, setCouriers] = useState([]);
    const [selectedCourier, setSelectedCourier] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState([]);
    const dropdownRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [isUploadStatusModalOpen, setIsUploadStatusModalOpen] = useState(false);

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        const fetchCourier = async () => {
            try {
                const response = await axios.get(
                    `${REACT_APP_BACKEND_URL}/statusMap/partnerName`
                );
                console.log("res stat", response)
                // After fetching couriers
                if (response.data?.data) {
                    setCouriers(response.data.data);
                    const delhivery = response.data.data.find(
                        (c) => c.partnerName === "DELHIVERY"
                    );
                    if (delhivery) {
                        setSelectedCourier(delhivery.partnerName);
                    }
                }

            } catch (error) {
                console.error("Error fetching couriers:", error);
            }
        };
        fetchCourier();
    }, [REACT_APP_BACKEND_URL]);

    const handleExport = async () => {
        if (!selectedCourier) return;
        try {
            // setLoading(true);
            const response = await axios.get(
                `${REACT_APP_BACKEND_URL}/statusMap/export?courierProvider=${encodeURIComponent(selectedCourier)}`,
                {
                    responseType: "blob", // important: treat the response as a file (Blob)
                    headers: {
                        Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    }
                }
            );
            // Create blob and trigger download
            const blob = new Blob([response.data], { type: response.headers["content-type"] });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);

            // Optional: Get filename from 'Content-Disposition' header
            const disposition = response.headers['content-disposition'];
            let filename = 'status-map.xlsx';
            if (disposition && disposition.indexOf('filename=') !== -1) {
                filename = disposition.split('filename=')[1].replace(/['"]/g, '');
            }
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // setLoading(false);
        } catch (err) {
            // setLoading(false);
            // Optionally notify user about the error
        }
    };



    useEffect(() => {
        const fetchStatus = async () => {
            if (!selectedCourier) return;
            try {
                setLoading(true); // Start loading
                const response = await axios.get(
                    `${REACT_APP_BACKEND_URL}/statusMap/status?courierProvider=${encodeURIComponent(selectedCourier)}`
                );
                setStatus(response.data.data[0]?.data || []);
                setLoading(false); // End loading
            } catch (error) {
                setLoading(false); // End loading on error as well
                console.log("Error fetching status", error.response);
            }
        };
        fetchStatus();
    }, [REACT_APP_BACKEND_URL, selectedCourier]);


    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="px-1 sm:px-2 w-full max-w-full">
            <div className="mb-1">
                <h1 className="text-[12px] md:text-[18px] text-gray-700 font-[600]">
                    Status Map
                </h1>
            </div>

            {/* Controls */}
            <div className="flex flex-row w-full justify-between gap-2 sm:gap-0 mb-2">
                {/* Dropdown */}
                <div ref={dropdownRef} className="relative inline-block w-full sm:w-48">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full border rounded-lg px-3 py-2 h-9 text-[10px] sm:text-[12px] bg-white text-gray-700 flex justify-between items-center shadow-sm"
                    >
                        {selectedCourier || "Select Courier"}
                        <ChevronDown
                            className={`ml-2 h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
                                }`}
                        />
                    </button>

                    {isOpen && (
                        <ul className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-sm max-h-48 overflow-y-auto">
                            {couriers.map((courier) => (
                                <li
                                    key={courier._id}
                                    onClick={() => {
                                        setSelectedCourier(courier.partnerName);
                                        setIsOpen(false);
                                    }}
                                    className="px-3 py-2 text-[10px] sm:text-[12px] hover:bg-green-100 cursor-pointer"
                                >
                                    {courier.partnerName}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                    <button
                        className="bg-[#0CBB7D] border-2 border-gray-100 text-[10px] sm:w-auto w-full h-9 sm:text-[12px] text-white px-3 py-2 font-[600] rounded-lg"
                        onClick={handleExport}
                        disabled={!selectedCourier || loading}
                    >
                        Export
                    </button>
                    <button
                        className="bg-[#0CBB7D] border-2 border-gray-100 text-[10px] sm:w-auto w-full h-9 sm:text-[12px] text-white px-3 py-2 font-[600] rounded-lg"
                        onClick={() => setIsUploadStatusModalOpen(true)}
                    >
                        Upload
                    </button>
                </div>
            </div>

            <UploadStatus
                isOpen={isUploadStatusModalOpen}
                onClose={() => {
                    setIsUploadStatusModalOpen(false);
                    console.log("UploadStatus onClose called");
                }}
            />

            {/* Loader */}
            {loading && (
                <div className="text-center py-6 text-gray-700 font-medium">
                    <Loader />
                </div>
            )}

            {/* Desktop Table */}
            {!loading && status.length > 0 && (
                <div className="hidden sm:block overflow-x-auto border rounded shadow-sm bg-white w-full">
                    <table className="table-fixed w-full text-[12px] sm:text-[12px] border-collapse">
                        <thead>
                            <tr className="bg-[#0CBB7D] border border-[#0CBB7D] text-white font-[600]">
                                {Object.keys(status[0]).map((key) => (
                                    <th key={key} className="py-2 px-3 text-left">{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {status.map((item, idx) => (
                                <tr key={idx} className="border border-gray-200">
                                    {Object.keys(status[0]).map((key) => (
                                        <td key={key} className="py-2 px-3 break-words text-gray-700 font-[400]">
                                            {item[key] !== undefined ? String(item[key]) : ""}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            )}

            {/* Mobile List/Card */}
            {!loading && status.length > 0 && (
                <div className="block sm:hidden space-y-2">
                    {status.map((item, idx) => (
                        <div
                            key={idx}
                            className="border border-gray-200 rounded-lg px-3 py-2 bg-white shadow-sm"
                        >
                            {Object.entries(item).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-[10px]">
                                    <span className="font-semibold text-gray-500">{key}</span>
                                    <span className="text-gray-700 text-right break-words max-w-[60%]">
                                        {value !== undefined ? String(value) : ""}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* No data */}
            {!loading && status.length === 0 && (
                <div className="text-gray-500 text-xs text-center py-6">No status data</div>
            )}
        </div>
    );

};

export default StatusMaping;
