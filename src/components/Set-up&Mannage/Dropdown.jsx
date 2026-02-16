// components/CustomDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

const CustomDropdown = ({ name, value, options, placeholder, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <div className="relative w-full text-sm" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 h-9 border rounded-lg flex justify-between items-center sm:text-[12px] text-[10px] bg-white font-[600] text-gray-500 focus:outline-none"
      >
        <span>{selectedLabel || placeholder}</span>
        <FaChevronDown className="ml-2 text-gray-500 text-xs" />
      </button>

      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-md max-h-48 overflow-auto">
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => handleOptionSelect(opt.value)}
              className={`px-3 py-2 text-[10px] sm:text-[12px] text-gray-500 font-[600] hover:bg-green-50 cursor-pointer ${
                opt.value === value ? "bg-green-50 font-[600] text-gray-500" : ""
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
