import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";
import UpdatePackageDetails from "../UpdatePackageDetails";
import UpdateB2BPackageDetails from "../UpdateB2BPackageDetails";
import { Package } from "lucide-react";

const PackageDetailsSection = ({ order, onUpdate }) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [packageDetails, setPackageDetails] = useState({
        length: order.packageDetails?.volumetricWeight?.length || "",
        width: order.packageDetails?.volumetricWeight?.width || "",
        height: order.packageDetails?.volumetricWeight?.height || "",
        weight: order.packageDetails?.applicableWeight || "",
    });

    const handlePackageUpdate = async (updatedData) => {
        if (onUpdate) {
            await onUpdate(updatedData);
        }
        setIsEditOpen(false);
    };

    const volumetricWeight = packageDetails.length && packageDetails.width && packageDetails.height
        ? ((packageDetails.length * packageDetails.width * packageDetails.height) / 5000).toFixed(2)
        : "0.00";

    const isB2B = order.orderType === "B2B";

    return (
        <>
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <div className="flex items-center gap-2">
                        <p className="p-2 bg-green-100 hidden sm:block rounded-full">
                            <Package className="w-4 h-4 text-[#0CBB7D]" />
                        </p>

                        <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                            Package Details
                        </h2>
                    </div>

                    {order.status === "new" && (
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="p-2 bg-gray-500 rounded-full hover:opacity-90 transition"
                            title="Edit Package Details"
                        >
                            <FaEdit className="text-white text-[12px]" />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-[600] text-[10px] sm:text-[12px]">
                    <div>
                        <span className="font-[600] text-gray-700">Order Type:</span>
                        <p className="text-gray-500">{order.orderType || "B2C"}</p>
                    </div>

                    <div>
                        <span className="font-[600] text-gray-700">Applicable Weight:</span>
                        <p className="text-gray-500">
                            {isB2B
                                ? (order.B2BPackageDetails?.applicableWeight || 0)
                                : (order.packageDetails?.applicableWeight || 0)
                            } KG
                        </p>
                    </div>

                    {!isB2B && (
                        <>
                            <div>
                                <span className="font-[600] text-gray-700">Dimensions (L×W×H):</span>
                                <p className="text-gray-500">
                                    {order.packageDetails?.volumetricWeight?.length || 0} × {order.packageDetails?.volumetricWeight?.width || 0} × {order.packageDetails?.volumetricWeight?.height || 0} cm
                                </p>
                            </div>

                            <div>
                                <span className="font-[600] text-gray-700">Volumetric Weight:</span>
                                <p className="text-gray-500">
                                    {((order.packageDetails?.volumetricWeight?.length * order.packageDetails?.volumetricWeight?.width * order.packageDetails?.volumetricWeight?.height) / 5000 || 0).toFixed(2)} KG
                                </p>
                            </div>
                        </>
                    )}

                    {isB2B && (
                        <>
                            <div>
                                <span className="font-[600] text-gray-700">ROV Type:</span>
                                <p className="text-gray-500">{order.rovType || "ROV Owner"}</p>
                            </div>

                            <div>
                                <span className="font-[600] text-gray-700">Total Boxes:</span>
                                <p className="text-gray-500">
                                    {order.B2BPackageDetails?.packages?.reduce((sum, pkg) => sum + (parseInt(pkg.noOfBox) || 0), 0) || 0}
                                </p>
                            </div>

                            <div>
                                <span className="font-[600] text-gray-700">Volumetric Weight:</span>
                                <p className="text-gray-500">
                                    {(parseFloat(order.B2BPackageDetails?.volumetricWeight) || 0).toFixed(2)} KG
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {isEditOpen && !isB2B && (
                <UpdatePackageDetails
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSave={handlePackageUpdate}
                    packageDetails={packageDetails}
                    setPackageDetails={setPackageDetails}
                />
            )}

            {isEditOpen && isB2B && (
                <UpdateB2BPackageDetails
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSave={handlePackageUpdate}
                    initialPackages={order.B2BPackageDetails?.packages || []}
                />
            )}
        </>
    );
};

export default PackageDetailsSection;
