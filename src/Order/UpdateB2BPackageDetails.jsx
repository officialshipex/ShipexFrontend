import React, { useState, useEffect } from "react";
import { FiBox, FiTrash2 } from "react-icons/fi";
import { Notification } from "../Notification";

const UpdateB2BPackageDetails = ({ isOpen, onClose, onSave, initialPackages = [] }) => {
    const [packages, setPackages] = useState([]);

    useEffect(() => {
        if (isOpen && initialPackages.length > 0) {
            setPackages(initialPackages.map((pkg, index) => ({
                ...pkg,
                id: pkg.id || index + 1
            })));
        } else if (isOpen && initialPackages.length === 0) {
            // Default empty package
            setPackages([{
                id: 1,
                noOfBox: "",
                weightPerBox: "",
                length: "",
                width: "",
                height: "",
            }]);
        }
    }, [isOpen, initialPackages]);

    if (!isOpen) return null;

    const addPackage = () => {
        setPackages([
            ...packages,
            {
                id: packages.length + 1,
                noOfBox: "",
                weightPerBox: "",
                length: "",
                width: "",
                height: "",
            },
        ]);
    };

    const updateField = (id, field, value) => {
        setPackages(
            packages.map((pkg) =>
                pkg.id === id ? { ...pkg, [field]: value.replace(/[^0-9.]/g, "") } : pkg
            )
        );
    };

    const removePackage = (id) => {
        if (packages.length > 1) {
            setPackages(packages.filter((pkg) => pkg.id !== id));
        } else {
            Notification("At least one package is required", "info");
        }
    };

    const handleSave = () => {
        // Validate that at least one package has data
        const hasValidPackage = packages.some(
            (pkg) =>
                pkg.noOfBox &&
                pkg.weightPerBox &&
                pkg.length &&
                pkg.width &&
                pkg.height
        );

        if (!hasValidPackage) {
            Notification("Please fill in all package details before saving.", "info");
            return;
        }

        onSave(packages);
        onClose();
    };

    // Calculate totals
    const totalDeadWeight = packages.reduce((sum, pkg) => {
        const dead = (parseFloat(pkg.weightPerBox) || 0) * (parseFloat(pkg.noOfBox) || 0);
        return sum + dead;
    }, 0);

    const totalVolumetricWeight = packages.reduce((sum, pkg) => {
        const vol =
            ((pkg.length * pkg.width * pkg.height) / 5000 || 0) *
            (parseFloat(pkg.noOfBox) || 0);
        return sum + vol;
    }, 0);

    const applicableWeight = Math.max(totalDeadWeight, totalVolumetricWeight, 0.5);

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 animate-popup-in">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4 shadow-lg">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b py-3 px-4 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                        <FiBox className="w-4 h-4 text-[#0CBB7D]" />
                        <h2 className="text-[14px] font-[600] text-gray-700">
                            Update B2B Package Details
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-[12px] font-[600] hover:opacity-90"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-2 bg-[#0CBB7D] text-white rounded-lg text-[12px] font-[600] hover:opacity-90"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 py-4">
                    {packages.map((pkg, index) => (
                        <div
                            key={pkg.id}
                            className="border border-dashed border-[#0CBB7D] rounded-lg p-4 mb-4 relative bg-white"
                        >
                            {/* Badge */}
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#0CBB7D] text-white w-8 h-8 flex justify-center items-center rounded-full text-[12px] font-[600] shadow">
                                {index + 1}
                            </div>

                            {/* Delete Button */}
                            {packages.length > 1 && (
                                <div className="absolute -top-4 right-4 group">
                                    <button
                                        onClick={() => removePackage(pkg.id)}
                                        className="w-8 h-8 flex items-center justify-center bg-red-100 hover:opacity-90 transition text-red-500 rounded-full shadow-sm"
                                    >
                                        <FiTrash2 className="h-4 w-4" />
                                    </button>
                                    <div className="absolute left-1/2 z-50 -translate-x-1/2 top-full mt-1 px-2 py-1 text-red-500 text-[10px] opacity-0 group-hover:opacity-100">
                                        Delete
                                    </div>
                                </div>
                            )}

                            {/* Package Inputs */}
                            <div className="grid grid-cols-2 text-[12px] text-gray-700 md:grid-cols-5 font-[600] gap-2 mt-4">
                                <div>
                                    <label>No. of Box <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={pkg.noOfBox}
                                        onChange={(e) => updateField(pkg.id, "noOfBox", e.target.value)}
                                        className="border rounded-lg focus:outline-[#0CBB7D] px-3 py-2 text-[12px] w-full"
                                        placeholder="Box Count"
                                    />
                                </div>

                                <div>
                                    <label>Weight Per Box (kg) <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={pkg.weightPerBox}
                                        onChange={(e) =>
                                            updateField(pkg.id, "weightPerBox", e.target.value)
                                        }
                                        className="border rounded-lg px-3 focus:outline-[#0CBB7D] py-2 text-[12px] w-full"
                                        placeholder="Weight"
                                    />
                                </div>

                                {["length", "width", "height"].map((dim) => (
                                    <div key={dim}>
                                        <label className="text-[12px] font-[600] text-gray-700 capitalize">
                                            {dim} <span className="text-red-500">*</span>
                                        </label>
                                        <span className="text-gray-700 font-[600] text-[12px]"> (cm)</span>
                                        <input
                                            type="text"
                                            value={pkg[dim]}
                                            onChange={(e) => updateField(pkg.id, dim, e.target.value)}
                                            className="border rounded-lg focus:outline-[#0CBB7D] px-3 py-2 font-[600] text-[12px] w-full"
                                            placeholder={dim}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Add Package Button */}
                    <button
                        onClick={addPackage}
                        className="flex items-center justify-center w-8 h-8 bg-[#0CBB7D] text-white rounded-full mx-auto text-[12px] hover:opacity-90"
                    >
                        +
                    </button>

                    {/* Summary */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <div className="bg-green-100 p-4 rounded-lg w-full sm:w-2/4">
                            <h3 className="text-[12px] font-[600]">Applicable Weight</h3>
                            <p className="text-[12px] font-[600]">{applicableWeight.toFixed(2)} Kg</p>
                        </div>

                        <div className="bg-green-100 p-4 rounded-lg w-full sm:w-1/2 flex justify-between">
                            <h3 className="text-[12px] font-[600]">Volumetric Weight</h3>
                            <p className="text-[12px] font-[600]">{totalVolumetricWeight.toFixed(2)} Kg</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateB2BPackageDetails;
