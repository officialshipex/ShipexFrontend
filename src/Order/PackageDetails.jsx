import React, { useState, useEffect } from "react";
import { FiBox, FiChevronDown, FiTrash2 } from "react-icons/fi";

const PackageDetails = ({
  deadWeight,
  setDeadWeight,
  dimensions,
  setDimensions,
  volumetricWeight,
  applicableWeight,
  totalPrice,
  orderType,
  setOrderType,
  rovType,
  setRovType,
  B2BPackageDetails,
  setB2BPackageDetails,
  finalApplicableWeight,
  finalVolumetricWeight,
  finalDeadWeight,
  setFinalDeadWeight,
  setFinalVolumetricWeight,
  setFinalApplicableWeight,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [showRovDropdown, setShowRovDropdown] = useState(false);


  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    setDimensions((prev) => ({
      ...prev,
      [name]: value.replace(/[^0-9.]/g, ""),
    }));
  };

  React.useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".package-dropdown")) {
        setShowDropdown(false);
        setShowRovDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);


  // --------------------------
  // B2B LOGIC STARTS HERE
  // --------------------------

  const addB2BPackage = () => {
    setB2BPackageDetails([
      ...B2BPackageDetails,
      {
        id: B2BPackageDetails.length + 1,
        noOfBox: "",
        weightPerBox: "",
        length: "",
        width: "",
        height: "",
      },
    ]);
  };

  useEffect(() => {
    // When switching to B2B, ensure at least one package exists
    if (orderType === "B2B" && B2BPackageDetails.length === 0) {
      setB2BPackageDetails([
        {
          id: 1,
          noOfBox: "",
          weightPerBox: "",
          length: "",
          width: "",
          height: "",
        },
      ]);
    }
  }, [orderType]);


  const updateB2BField = (id, field, value) => {
    setB2BPackageDetails(
      B2BPackageDetails.map((pkg) =>
        pkg.id === id ? { ...pkg, [field]: value.replace(/[^0-9.]/g, "") } : pkg
      )
    );
  };

  const removeB2BPackage = (id) => {
    setB2BPackageDetails(B2BPackageDetails.filter((pkg) => pkg.id !== id));
  };

  // Calculate B2B totals
  const totalDeadWeightB2B = B2BPackageDetails.reduce((sum, pkg) => {
    const dead = (parseFloat(pkg.weightPerBox) || 0) * (parseFloat(pkg.noOfBox) || 0);
    return sum + dead;
  }, 0);

  const totalVolumetricWeightB2B = B2BPackageDetails.reduce((sum, pkg) => {
    const vol =
      ((pkg.length * pkg.width * pkg.height) / 5000 || 0) *
      (parseFloat(pkg.noOfBox) || 0);
    return sum + vol;
  }, 0);

  const applicableWeightB2B = Math.max(
    totalDeadWeightB2B,
    totalVolumetricWeightB2B,
    0.5
  );

  useEffect(() => {
    if (orderType === "B2B") {
      setFinalDeadWeight(totalDeadWeightB2B);
      setFinalVolumetricWeight(totalVolumetricWeightB2B);
      setFinalApplicableWeight(applicableWeightB2B);
    }
  }, [B2BPackageDetails, orderType]);


  // --------------------------
  // END OF B2B LOGIC
  // --------------------------

  return (
    <div className="border mt-2 border-[#0CBB7D] rounded-lg p-4 bg-white">

      {/* HEADER */}
      <h2 className="text-[14px] font-[600] flex items-center gap-2 text-gray-700 mb-2">
        <span className="bg-[#0CBB7D] text-white rounded-lg p-2">
          <FiBox className="text-[14px]" />
        </span>
        Package Details
      </h2>

      {/* PACKAGE TYPE + ROV TYPE */}
      <div className="mb-2 relative flex sm:flex-row flex-col sm:items-center gap-2 package-dropdown">

        {/* PACKAGE TYPE */}
        <div className="flex items-center gap-2">
          <label className="font-[600] text-[12px]">Package Type:</label>

          <div
            className="border px-3 py-2 rounded-lg text-[12px] font-[600] w-[120px] bg-white cursor-pointer flex items-center justify-between text-gray-700"
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowRovDropdown(false);
            }}
          >
            {orderType}
            <FiChevronDown
              className={`transition-transform ${showDropdown ? "rotate-180" : ""
                }`}
            />
          </div>

          {showDropdown && (
            <div className="absolute left-[89px] mt-[110px] w-[121px] bg-white border rounded-lg shadow-sm z-10">
              {["B2C","B2B"].map((item) => (
                <div
                  key={item}
                  className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-green-100 ${orderType === item ? "bg-green-100 font-[600]" : ""
                    }`}
                  onClick={() => {
                    setOrderType(item);
                    setShowDropdown(false);
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROV TYPE – CUSTOM DROPDOWN (ONLY FOR B2B) */}
        {orderType === "B2B" && (
          <div className="flex items-center gap-2 relative">
            <label className="font-[600] text-[12px]">ROV Type:</label>

            <div
              className="border px-3 py-2 rounded-lg text-[12px] font-[600] w-[160px] bg-white cursor-pointer flex items-center justify-between text-gray-700"
              onClick={() => {
                setShowRovDropdown(!showRovDropdown);
                setShowDropdown(false);
              }}
            >
              {rovType}
              <FiChevronDown
                className={`transition-transform ${showRovDropdown ? "rotate-180" : ""
                  }`}
              />
            </div>

            {showRovDropdown && (
              <div className="absolute left-[70px] top-[38px] w-[160px] bg-white border rounded-lg shadow-sm z-10">
                {["ROV Owner", "ROV Carrier"].map((item) => (
                  <div
                    key={item}
                    className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-green-100 ${rovType === item ? "bg-green-100 font-[600]" : ""
                      }`}
                    onClick={() => {
                      setRovType(item);
                      setShowRovDropdown(false);
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>


      {/* ---------------------- */}
      {/*  B2C SECTION (UNCHANGED) */}
      {/* ---------------------- */}

      {orderType === "B2C" && (
        <>
          <div className="flex sm:flex-row flex-col items-start gap-2 bg-white rounded-lg w-full">
            <div className="w-[160px] font-[600] text-[12px] text-gray-700 flex flex-col">
              <label className="mb-1">Dead Weight:</label>
              <div className="flex items-center border rounded-lg w-full">
                <input
                  type="text"
                  value={deadWeight}
                  onChange={(e) =>
                    setDeadWeight(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className="w-full h-8 px-2 text-[12px] border-none outline-none rounded-l-lg"
                  placeholder="0.00"
                />
                <span className="w-12 h-8 flex justify-center items-center text-[12px] text-white rounded-r-lg bg-[#0CBB7D]">
                  kg
                </span>
              </div>
            </div>

            <div className="flex flex-row gap-2 w-full">
              {["length", "width", "height"].map((dim) => (
                <div key={dim} className="w-full md:w-[160px] flex flex-col">
                  <label className="font-[600] text-[12px] text-gray-700 mb-1">{dim}:</label>
                  <div className="flex items-center border rounded-lg w-full">
                    <input
                      type="text"
                      name={dim}
                      value={dimensions?.[dim] || ""}
                      onChange={handleDimensionChange}
                      placeholder={dim}
                      className="w-full h-8 px-2 text-[12px] font-[600] border-none outline-none rounded-l-lg"
                    />
                    <span className="w-12 h-8 flex font-[600] justify-center items-center text-[12px] text-white rounded-r-lg bg-[#0CBB7D]">
                      cm
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Note Section */}
          <p className="text-[12px] text-gray-500 mt-2">
            <span className="text-red-500"> Note: </span>Note: The minimum
            chargeable weight is <strong>0.50 Kg</strong>. Dimensions should be in{" "}
            <strong>centimeters only</strong> and values should be greater than{" "}
            <strong>0.50 cm</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <div className="bg-green-100 rounded-lg p-3 w-full sm:w-2/4">
              <div className="flex sm:flex-col flex-row justify-between">
                <h3 className="text-[12px] font-[600] text-gray-700">
                  Applicable Weight
                </h3>
                <p className="text-[12px] font-[600] text-gray-700">
                  {applicableWeight} Kg
                </p>
              </div>
              <p className="text-[12px] text-gray-500 mt-2">
                Applicable weight is the heavier among Dead Weight vs Volumetric
                Weight.
              </p>
              <p className="text-[12px] text-gray-500 mt-2">
                Final chargeable weight will be based on the weight slab of the
                courier selected.
              </p>
            </div>

            <div className="bg-green-100 rounded-lg p-3 w-full sm:w-1/2 flex justify-between">
              <h3 className="text-[12px] font-[600]">Volumetric Weight</h3>
              <p className="text-[12px] font-[600]">{volumetricWeight} Kg</p>
            </div>
          </div>

          <hr className="my-4" />

          <div className="bg-green-100 px-3 py-2 rounded-lg mb-4 flex justify-between">
            <p className="text-[12px] font-[600]">Total Order Value</p>
            <p className="text-[12px] font-[600]">₹{totalPrice}</p>
          </div>
        </>
      )}

      {/* ---------------------- */}
      {/*  B2B SECTION */}
      {/* ---------------------- */}
      {orderType === "B2B" && (
        <>
          {B2BPackageDetails.map((pkg, index) => (
            <div
              key={pkg.id}
              className="border border-dashed border-[#0CBB7D] rounded-lg p-4 my-4 relative bg-white"
            >
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#0CBB7D] text-white w-8 h-8 flex justify-center items-center rounded-full text-[12px] font-[600] shadow">
                {index + 1}
              </div>

              {/* DELETE BUTTON */}


              <div className="absolute -top-4 right-4 group">
                <button
                  onClick={() => removeB2BPackage(pkg.id)}
                  className="w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-opacity-90 transition text-red-500 rounded-full shadow-sm"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>

                <div className="absolute left-1/2 z-50 -translate-x-1/2 top-full mt-1 px-2 py-1 text-[#F1572C] text-[12px] opacity-0 group-hover:opacity-100">
                  Delete
                </div>
              </div>


              {/* B2B INPUTS */}
              <div className="grid grid-cols-2 text-[12px] text-gray-700 md:grid-cols-5 font-[600] gap-2 mt-4">
                <div>
                  <label>No. of Box</label>
                  <input
                    type="text"
                    value={pkg.noOfBox}
                    onChange={(e) => updateB2BField(pkg.id, "noOfBox", e.target.value)}
                    className="border rounded-lg focus:outline-[#0CBB7D] px-3 py-2 text-[12px] w-full"
                    placeholder="Box Count"
                  />
                </div>

                <div>
                  <label>Weight Per Box (kg)</label>
                  <input
                    type="text"
                    value={pkg.weightPerBox}
                    onChange={(e) =>
                      updateB2BField(pkg.id, "weightPerBox", e.target.value)
                    }
                    className="border rounded-lg px-3 focus:outline-[#0CBB7D] py-2 text-[12px] w-full"
                    placeholder="Weight"
                  />
                </div>

                {["length", "width", "height"].map((dim) => (
                  <div key={dim}>
                    <label className="text-[12px] font-[600] text-gray-700 capitalize">{dim}</label><span className="text-gray-700 font-[600] text-[12px]"> (cm)</span>
                    <input
                      type="text"
                      value={pkg[dim]}
                      onChange={(e) => updateB2BField(pkg.id, dim, e.target.value)}
                      className="border rounded-lg focus:outline-[#0CBB7D] px-3 py-2 font-[600] text-[12px] w-full"
                      placeholder={dim}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add B2B package button */}
          <button
            onClick={addB2BPackage}
            className="flex items-center justify-center w-8 h-8 bg-[#0CBB7D] text-white rounded-full mx-auto text-[12px]"
          >
            +
          </button>

          {/* B2B RESULT SUMMARY */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <div className="bg-green-100 p-4 rounded-lg w-full sm:w-2/4">
              <h3 className="text-[12px] font-[600]">Applicable Weight</h3>
              <p className="text-[12px] font-[600]">{applicableWeightB2B.toFixed(2)} Kg</p>
            </div>

            <div className="bg-green-100 p-4 rounded-lg w-full sm:w-1/2 flex justify-between">
              <h3 className="text-[12px] font-[600]">Volumetric Weight</h3>
              <p className="text-[12px] font-[600]">{totalVolumetricWeightB2B.toFixed(2)} Kg</p>
            </div>
          </div>

          <hr className="my-4" />

          <div className="bg-green-100 px-4 py-2 rounded-lg mb-4 flex justify-between">
            <p className="text-[12px] font-[600]">Total Order Value</p>
            <p className="text-[12px] font-[600]">₹{totalPrice}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default PackageDetails;
