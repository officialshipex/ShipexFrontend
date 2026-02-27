import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const StatusDropdown = ({ Status, setStatus, label = "Status" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = ["Enable", "Disable"];

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
    <div className="relative w-full flex flex-col gap-1" ref={dropdownRef}>
      {label && (
        <label className="block text-[10px] sm:text-[12px] font-[600] text-gray-700 tracking-tight">
          {label}
        </label>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-white cursor-pointer px-2 h-9 border rounded-lg flex justify-between items-center transition-all ${isOpen ? "border-[#0CBB7D] ring-1 ring-[#0CBB7D]/20" : "border-gray-200"}`}
      >
        <span className={`truncate text-[10px] sm:text-[12px] ${Status ? "text-gray-700 font-[600]" : "text-gray-300"}`}>
          {Status || "Select"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#0CBB7D]" : ""}`}
        />
      </div>

      {isOpen && (
        <ul className="absolute z-[70] top-full left-0 w-full bg-white border border-gray-100 mt-1 rounded-lg shadow-lg max-h-56 overflow-y-auto animate-popup-in py-1">
          {options.map((option) => (
            <li
              key={option}
              onClick={() => {
                setStatus(option);
                setIsOpen(false);
              }}
              className={`px-3 py-2 text-[10px] sm:text-[12px] font-[600] transition-colors cursor-pointer ${Status === option ? "bg-green-50 text-[#0CBB7D]" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StatusDropdown;
