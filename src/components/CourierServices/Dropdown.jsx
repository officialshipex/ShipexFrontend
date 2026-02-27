// components/CustomDropdown.js
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function CustomDropdown({ label, options = [], value, onChange, name, placeholder = "Select" }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef();

    const handleSelect = (option) => {
        onChange({ target: { name, value: option } });
        setIsOpen(false);
    };

    useEffect(() => {
        const closeDropdown = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("click", closeDropdown);
        return () => document.removeEventListener("click", closeDropdown);
    }, []);

    return (
        <div ref={dropdownRef} className="relative w-full text-[10px] sm:text-[12px] flex flex-col gap-1.5">
            {label && <label className="block text-[10px] sm:text-[12px] font-[600] text-gray-700">{label}</label>}
            <div
                className={`border bg-white cursor-pointer px-3 sm:h-[35px] h-[33px] font-[600] rounded-lg flex justify-between items-center transition-all ${isOpen ? "border-[#0CBB7D] ring-1 ring-[#0CBB7D]/20" : "border-gray-300 hover:border-gray-300"}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`truncate ${value ? "text-gray-700 font-[600]" : "text-gray-400"}`}>
                    {value || placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#0CBB7D]" : ""}`}
                />
            </div>

            {isOpen && (
                <ul className="absolute z-[70] top-full left-0 w-full bg-white border border-gray-100 mt-1 rounded-lg shadow-sm max-h-56 overflow-y-auto animate-popup-in py-1">
                    {options.length > 0 ? (
                        options.map((option) => (
                            <li
                                key={option}
                                onClick={() => handleSelect(option)}
                                className={`px-3 py-2 text-[12px] font-[600] transition-colors cursor-pointer ${value === option ? "bg-green-50 text-[#0CBB7D]" : "text-gray-600 hover:bg-gray-50"}`}
                            >
                                {option}
                            </li>
                        ))
                    ) : (
                        <li className="px-3 py-2 text-[12px] text-gray-400 italic text-center">No options</li>
                    )}
                </ul>
            )}
        </div>
    );
}
