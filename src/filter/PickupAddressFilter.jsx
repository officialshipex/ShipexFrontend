import React from "react";
import { ChevronDown } from "lucide-react";

const PickupAddressFilter = ({
  pickupAddresses = [],
  selectedPickupAddress,
  setSelectedPickupAddress,
  showDropdown,
  setShowDropdown,
  dropdownRef,
  buttonRef,
  heightClass = "h-9",
}) => {
  return (
    <div className="relative w-full md:w-1/5" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown((prev) => !prev)}
        className={`w-full bg-white ${heightClass} px-3 text-xs font-semibold
          border-2 rounded-lg flex items-center justify-between text-gray-400`}
      >
        {selectedPickupAddress || "Pickup Address"}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            showDropdown ? "rotate-180" : ""
          }`}
        />
      </button>

      {showDropdown && (
        <div className="absolute w-full bg-white border rounded shadow z-20
                        max-h-40 overflow-y-auto mt-1">
          {pickupAddresses.map((location, index) => (
            <div
              key={index}
              className="px-3 py-2 text-[12px] font-[600] text-gray-500
                         cursor-pointer hover:bg-green-50"
              onClick={() => {
                setSelectedPickupAddress(location.contactName);
                setShowDropdown(false);
              }}
            >
              {location.contactName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PickupAddressFilter;
