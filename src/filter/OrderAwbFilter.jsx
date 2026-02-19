import React from "react";
import { ChevronDown } from "lucide-react";

const OrderAwbFilter = ({
  searchBy,
  setSearchBy,
  inputValue,
  setInputValue,
  showDropdown,
  setShowDropdown,
  dropdownRef,
  buttonRef,
  options,
  getPlaceholder,
  heightClass = "h-9",
  width
}) => {
  return (
    <div className={`flex ${width}`} ref={dropdownRef}>
      {/* Wrapper */}
      <div
        className={`flex w-full ${heightClass}
          border rounded-lg border-gray-300
          bg-white transition-colors
          focus-within:border-[#0CBB7D]`}
      >
        {/* Dropdown */}
        <div className="relative w-[35%]">
          <button
            ref={buttonRef}
            onClick={() => setShowDropdown((prev) => !prev)}
            className="w-full h-full px-3 text-[12px] font-[600]
              flex items-center justify-between
              text-gray-400
              rounded-l-lg
              bg-white hover:bg-gray-50
              border-r border-gray-300"
          >
            <span className="truncate">
              {options.find((o) => o.value === searchBy)?.label || "Select"}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showDropdown && (
            <ul
              className="absolute z-50 left-0 right-0 mt-1
                bg-white border rounded-lg
                text-[12px] font-[600]"
            >
              {options.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => {
                    setSearchBy(opt.value);
                    setShowDropdown(false);
                  }}
                  className="px-3 py-2 cursor-pointer text-gray-700
                    hover:bg-green-100"
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={getPlaceholder()}
          className="flex-1 h-full px-3 text-[12px] font-[600]
            text-gray-700
            rounded-r-lg
            focus:outline-none"
        />
      </div>
    </div>
  );
};

export default OrderAwbFilter;
