import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { FiX } from "react-icons/fi";

export default function B2BPackageModal({
    initialPackages,
    onClose,
    onSave,
}) {
    const [packages, setPackages] = useState([...initialPackages]);

    const updateField = (id, key, value) => {
        setPackages((prev) =>
            prev.map((p) =>
                p.id === id ? { ...p, [key]: value } : p
            )
        );
    };

    const addPackage = () => {
        setPackages((prev) => [
            ...prev,
            {
                id: getNextId(prev), // 🔥 1,2,3... continuous
                noOfBox: "",
                weightPerBox: "",
                length: "",
                width: "",
                height: "",
            },
        ]);
    };

    const getNextId = (packages) => {
        if (!packages.length) return 1;
        return Math.max(...packages.map((p) => Number(p.id) || 0)) + 1;
    };

    const removePackage = (id) => {
        setPackages((prev) => prev.filter((p) => p.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center">
            <div className="bg-white w-[95%] md:w-[800px] rounded-lg p-4 max-h-[90vh] overflow-y-auto">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-[600] text-gray-700 text-[14px]">
                        Edit B2B Packages
                    </h2>
                    <button onClick={onClose} className="text-[12px] hover:text-gray-900">
                        <FiX />
                    </button>
                </div>

                {/* PACKAGES */}
                {packages.map((pkg, index) => (
                    <div
                        key={pkg.id}
                        className="border border-dashed border-[#0CBB7D] rounded-lg p-4 my-4 relative bg-white"
                    >
                        {/* INDEX BADGE */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#0CBB7D] text-white w-8 h-8 flex justify-center items-center rounded-full text-[12px] font-[600] shadow">
                            {index + 1}
                        </div>

                        {/* DELETE */}
                        <div className="absolute -top-4 right-4 group">
                            <button
                                onClick={() => removePackage(pkg.id)}
                                className="w-8 h-8 flex items-center justify-center bg-red-100 hover:opacity-90 transition text-red-500 rounded-full shadow-sm"
                            >
                                <FiTrash2 className="h-4 w-4" />
                            </button>

                            <div className="absolute left-1/2 z-50 -translate-x-1/2 top-full mt-1 px-2 py-1 text-[#F1572C] text-[12px] opacity-0 group-hover:opacity-100">
                                Delete
                            </div>
                        </div>
                        

                        {/* INPUT GRID */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                            {/* No of Box */}
                            <div>
                                <label className="text-[12px] font-[600] text-gray-700">
                                    No. of Boxes
                                </label>
                                <input
                                    type="number"
                                    value={pkg.noOfBox}
                                    onChange={(e) =>
                                        updateField(pkg.id, "noOfBox", e.target.value)
                                    }
                                    className="border px-3 py-2 text-[12px] font-[600] rounded-lg w-full focus:outline-[#0CBB7D]"
                                    placeholder="Boxes"
                                />
                            </div>

                            {/* Weight per Box */}
                            <div>
                                <label className="text-[12px] font-[600] text-gray-700">
                                    Weight / Box (kg)
                                </label>
                                <input
                                    type="number"
                                    value={pkg.weightPerBox}
                                    onChange={(e) =>
                                        updateField(pkg.id, "weightPerBox", e.target.value)
                                    }
                                    className="border px-3 py-2 text-[12px] font-[600] rounded-lg w-full focus:outline-[#0CBB7D]"
                                    placeholder="Kg"
                                />
                            </div>

                            {/* Length */}
                            <div>
                                <label className="text-[12px] font-[600] text-gray-700">
                                    Length (cm)
                                </label>
                                <input
                                    type="number"
                                    value={pkg.length}
                                    onChange={(e) =>
                                        updateField(pkg.id, "length", e.target.value)
                                    }
                                    className="border px-3 py-2 text-[12px] font-[600] rounded-lg w-full focus:outline-[#0CBB7D]"
                                />
                            </div>

                            {/* Width */}
                            <div>
                                <label className="text-[12px] font-[600] text-gray-700">
                                    Width (cm)
                                </label>
                                <input
                                    type="number"
                                    value={pkg.width}
                                    onChange={(e) =>
                                        updateField(pkg.id, "width", e.target.value)
                                    }
                                    className="border px-3 py-2 text-[12px] font-[600] rounded-lg w-full focus:outline-[#0CBB7D]"
                                />
                            </div>

                            {/* Height */}
                            <div>
                                <label className="text-[12px] font-[600] text-gray-700">
                                    Height (cm)
                                </label>
                                <input
                                    type="number"
                                    value={pkg.height}
                                    onChange={(e) =>
                                        updateField(pkg.id, "height", e.target.value)
                                    }
                                    className="border px-3 py-2 text-[12px] font-[600] rounded-lg w-full focus:outline-[#0CBB7D]"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {/* ADD BUTTON – PERFECTLY CENTERED */}
                <div className="flex justify-center my-4">
                    <button
                        onClick={addPackage}
                        className="w-8 h-8 rounded-full bg-[#0CBB7D] flex justify-center items-center text-white text-[12px] font-[600]"
                    >
                        <span>+</span>
                    </button>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={onClose}
                        className="px-3 py-2 border font-[600] hover:bg-gray-100 rounded-lg text-[12px]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(packages)}
                        className="px-3 py-2 bg-[#0CBB7D] font-[600] hover:opacity-90 transition text-white rounded-lg text-[12px]"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
