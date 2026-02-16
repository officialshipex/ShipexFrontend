// components/CustomDropdown.js
import React, { useState, useRef, useEffect } from "react";

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
        <div ref={dropdownRef} className="relative w-full text-[10px] sm:text-[12px]">
            {label && <label className="block text-[10px] sm:text-[12px] text-gray-500">{label}</label>}
            <div
                className="border px-3 h-8 sm:w-[150px] w-full rounded-lg bg-white cursor-pointer focus:ring-2 focus:ring-[#0CBB7D] flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{value || <span className="text-gray-500">{placeholder}</span>}</span>
                <span className={`transition-transform duration-200 text-gray-500 ${isOpen ? "rotate-180" : ""}`}>▼</span>
            </div>

            {isOpen && (
                <ul className="absolute z-10 bg-white border mt-1 rounded-lg text-[10px] sm:text-[12px] font-[600] text-gray-500 max-h-48 overflow-y-auto w-full shadow-md">
                    {options.map((option) => (
                        <li
                            key={option}
                            onClick={() => handleSelect(option)}
                            className={`px-3 py-2 hover:bg-green-50 hover:text-gray-500 cursor-pointer ${value === option ? "bg-gray-100" : ""}`}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
