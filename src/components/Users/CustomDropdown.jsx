import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

const CustomDropdown = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative sm:w-[150px] text-[12px] font-[600]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border-2 rounded-lg px-3 h-9 flex items-center justify-between text-gray-400 hover:bg-gray-100"
      >
        {value || label}
        <ChevronDown size={16} />
      </button>
      {isOpen && (
        <div className="absolute animate-popup-in z-50 mt-1 w-full bg-white border rounded-lg shadow-md">
          {options.map((option) => (
            <div
              key={option}
              className="px-3 py-2 hover:bg-gray-100 text-gray-500 cursor-pointer"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default CustomDropdown