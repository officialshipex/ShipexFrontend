import React from "react";
import { FiFileText, FiArrowLeft } from "react-icons/fi";

const OtherDetails = ({ amount, otherDetails, setOtherDetails }) => {
    const isEwaybillRequired = amount >= 50000;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setOtherDetails((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="border border-[#0CBB7D] flex flex-col mt-4 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
            <h2 className="text-[14px] font-[600] text-gray-700 mb-2 text-center md:text-left flex items-center gap-2">
                <span className="bg-[#0CBB7D] text-white rounded-lg p-2">
                    <FiFileText className="text-[14px]" />
                </span>
                Other Details
            </h2>
            <div className="flex sm:flex-row flex-col gap-2 font-[600] text-[12px] text-gray-700 sm:w-3/6 w-full">
                {/* Reseller Name */}
                <div className="w-full ">
                    <label className="block">Reseller Name</label>
                    <input
                        type="text"
                        name="resellerName"
                        value={otherDetails.resellerName || ""}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                        placeholder="Enter Reseller Name"
                    />
                </div>

                {/* GSTIN */}
                <div className="w-full">
                    <label className="block">GSTIN</label>
                    <input
                        type="text"
                        name="gstin"
                        value={otherDetails.gstin || ""}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                        placeholder="Enter GSTIN"
                    />
                </div>

                {/* GST E-Waybill Number */}
                <div className="w-full">
                    <label className="block">
                        GST E-Waybill Number{" "}
                        {isEwaybillRequired && (
                            <span className="text-red-500 text-[12px]">(Required)</span>
                        )}
                    </label>
                    <input
                        type="text"
                        name="ewaybill"
                        value={otherDetails.ewaybill || ""}
                        onChange={handleChange}
                        className={`w-full border rounded-lg px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-[#0CBB7D] ${isEwaybillRequired ? "border-red-500" : ""
                            }`}
                        placeholder="Enter GST E-Waybill number"
                        required={isEwaybillRequired}
                    />
                </div>
            </div>

        </div>
    );
};

export default OtherDetails;
