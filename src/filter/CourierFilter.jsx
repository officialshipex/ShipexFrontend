import React from "react";
import { ChevronDown, Check } from "lucide-react";

const CourierFilter = ({
  selectedCourier = [],
  setSelectedCourier,
  courierOptions = [],
  showDropdown,
  setShowDropdown,
  dropdownRef,
  buttonRef,
  heightClass = "h-9",
  width
}) => {
  const handleToggle = (courier) => {
    if (selectedCourier.includes(courier)) {
      setSelectedCourier(selectedCourier.filter((c) => c !== courier));
    } else {
      setSelectedCourier([...selectedCourier, courier]);
    }
  };

  const displayText = () => {
    if (selectedCourier.length === 0) return "Select Courier";
    if (selectedCourier.length === 1) return selectedCourier[0];
    if (selectedCourier.length > 2) return `${selectedCourier.length} Couriers`;
    return selectedCourier.join(", ");
  };

  return (
    <div className={`relative w-full ${width}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowDropdown((prev) => !prev)}
        className={`w-full bg-white py-2 px-3 text-[12px] font-[600]
          border rounded-lg flex items-center justify-between text-gray-400 ${showDropdown || selectedCourier.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D]" : "border-gray-300"}`}
      >
        <span className="truncate mr-2">{displayText()}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform flex-shrink-0 ${showDropdown ? "rotate-180" : ""
            }`}
        />
      </button>

      {showDropdown && (
        <div className="absolute w-full bg-white border border-gray-100 rounded-lg shadow-xl z-[110]
                        max-h-60 overflow-y-auto mt-1 py-1 animate-popup-in">
          {courierOptions.length > 0 ? (
            courierOptions.map((courier, idx) => {
              const isSelected = selectedCourier.includes(courier);
              return (
                <div
                  key={idx}
                  className={`px-3 py-2.5 text-[12px] font-[600] flex items-center gap-2
                             cursor-pointer transition-colors ${isSelected ? "text-[#0CBB7D] bg-green-50" : "text-gray-500 hover:bg-gray-50"}`}
                  onClick={() => handleToggle(courier)}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-[#0CBB7D] border-[#0CBB7D]" : "border-gray-300 bg-white"}`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="truncate">{courier}</span>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center text-gray-400 text-[11px]">No Couriers Found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourierFilter;
