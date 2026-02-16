import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

const StatusDropdown = ({ Status, setStatus }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = ["Enable", "Disable"];

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative sm:w-32 w-full" ref={dropdownRef}>
      <label className="font-[600] block text-[10px] md:text-[12px] text-gray-500">Status</label>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full p-2 border-2 rounded-lg flex font-[400] text-gray-500 justify-between items-center text-[12px] focus:outline-none bg-white"
      >
        {Status || "Select"}
        <FaChevronDown className="ml-2 text-[12px] text-gray-500" />
      </button>

      {open && (
        <ul className="absolute z-10 mt-1 bg-white border text-gray-500 border-gray-200 rounded-lg shadow-md w-full text-[12px]">
          {options.map((option) => (
            <li
              key={option}
              onClick={() => {
                setStatus(option);
                setOpen(false);
              }}
              className={`px-3 py-2 cursor-pointer hover:bg-green-50 ${
                Status === option ? "bg-[#e9d5ff] font-semibold text-[#7c3aed]" : ""
              }`}
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
