import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/solid";

const CustomDropdown = ({ options, selected, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedLabel = options.find((opt) => opt.value === selected)?.label || "Select";

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full md:w-72">
      {label && (
        <label className="block text-[10px] md:text-[12px] font-[600] text-gray-500 mb-1">
          {label}
        </label>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 h-9 border text-[10px] md:text-[12px] text-gray-600 font-[600] rounded-lg bg-white shadow-sm focus:outline-none"
      >
        {selectedLabel}
        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <ul className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-md max-h-48 overflow-y-auto">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-3 py-2 text-[10px] font-[600] text-gray-500 md:text-[12px] cursor-pointer hover:bg-green-100 ${
                selected === option.value ? "bg-green-50 text-green-700" : ""
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
