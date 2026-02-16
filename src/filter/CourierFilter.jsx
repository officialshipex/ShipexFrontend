import React from "react";
import { ChevronDown } from "lucide-react";

const CourierFilter = ({
  selectedCourier,
  setSelectedCourier,
  courierOptions = [],
  showDropdown,
  setShowDropdown,
  dropdownRef,
  buttonRef,
  heightClass = "h-9",
  width
}) => {
  return (
    <div className={`relative w-full ${width}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown((prev) => !prev)}
        className={`w-full bg-white py-2 px-3 text-[12px] font-[600]
          border rounded-lg flex items-center justify-between text-gray-400 ${showDropdown ? "border border-[#0CBB7D]" : ""}`}
      >
        {selectedCourier || "Select Courier"}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            showDropdown ? "rotate-180" : ""
          }`}
        />
      </button>

      {showDropdown && (
        <div className="absolute w-full bg-white border rounded-lg shadow z-40
                        max-h-40 overflow-y-auto mt-1">
          {courierOptions.map((courier, idx) => (
            <div
              key={idx}
              className="px-3 py-2 text-[12px] font-[600] text-gray-500
                         cursor-pointer hover:bg-green-100"
              onClick={() => {
                setSelectedCourier(courier);
                setShowDropdown(false);
              }}
            >
              {courier}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourierFilter;
