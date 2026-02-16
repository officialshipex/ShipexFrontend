import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";

const CostEstimationHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isB2B = location.pathname.includes("/b2b");
  const selected = isB2B ? "B2B" : "B2C";

  const handleSelect = (value) => {
    setOpen(false);

    if (value === "B2B") {
      navigate("/dashboard/tools/Cost_Estimation/b2b");
    } else {
      navigate("/dashboard/tools/Cost_Estimation/b2c");
    }
  };

  return (
    <div className="mb-2 text-gray-700">
      <h1 className="text-[14px] font-[600] text-gray-700">
        Shipping Rates Calculator
      </h1>

      <div className="flex items-center gap-3 mt-2">
        <label className="text-[12px] font-[600] text-gray-700">
          Package Type:
        </label>

        <div className="relative w-[90px]">
          {/* Selected */}
          <div
            onClick={() => setOpen(!open)}
            className="flex items-center justify-between px-3 py-2 border rounded-lg bg-gray-50 text-[12px] cursor-pointer focus:ring-1 focus:ring-[#0CBB7D]"
          >
            <span className="font-[600] text-gray-700">{selected}</span>
            <FiChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden text-[12px]">
              {["B2C","B2B"].map((item) => (
                <div
                  key={item}
                  onClick={() => handleSelect(item)}
                  className={`px-3 py-2 cursor-pointer font-[600] hover:bg-green-50${
                    selected === item ? "font-[600] bg-green-100" : ""
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostEstimationHeader;
