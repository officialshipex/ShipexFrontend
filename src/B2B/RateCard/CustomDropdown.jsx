import { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

export default function CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select",
  disabled = false,
  maxHeight = 200, // 👈 configurable height
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className={`relative sm:w-44 w-full text-[12px] font-[600] ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full border px-3 py-2 rounded-md flex justify-between items-center text-gray-500 bg-white"
      >
        <span className="truncate">
          {selected?.label || placeholder}
        </span>
        <FiChevronDown
          className={`transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow overflow-y-auto"
          style={{ maxHeight }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-gray-400 text-center">
              No options
            </div>
          ) : (
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${
                  opt.value === value
                    ? "bg-green-50 text-[#0CBB7D]"
                    : "text-gray-600"
                }`}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
