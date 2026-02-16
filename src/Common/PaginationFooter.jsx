import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const PaginationFooter = ({
  page,
  setPage,
  totalPages,
  limit,
  setLimit,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const limitOptions = [
    { label: "20", value: 20 },
    { label: "50", value: 50 },
    { label: "75", value: 75 },
    { label: "100", value: 100 },
    { label: "All", value: "all" },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLimitChange = (value) => {
    setLimit(value);
    setPage(1);
    setIsDropdownOpen(false);
  };

  const getDisplayValue = () => {
    const option = limitOptions.find((opt) => opt.value === limit);
    return option ? option.label : "20";
  };

  return (
    <div className="flex justify-between items-center mt-2 gap-2 flex-wrap text-[10px] font-[600]">
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <label className="text-gray-500 text-[10px] font-[600]">
          Rows per page:
        </label>

        {/* Custom Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-[60px] px-3 py-2 border rounded-lg text-[10px] font-[600] text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#0CBB7D] focus:border-transparent transition-all cursor-pointer flex items-center justify-between"
          >
            <span>{getDisplayValue()}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {/* Dropdown Menu - Opens Upward */}
          {isDropdownOpen && (
            <div className="absolute z-50 w-[60px] bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {limitOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleLimitChange(option.value)}
                  className={`px-3 py-2 text-[10px] hover:bg-green-50 font-[600] cursor-pointer transition-colors ${limit === option.value
                      ? "bg-green-100"
                      : ""
                    }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="p-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-[#0CBB7D] hover:text-white hover:border-[#0CBB7D] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 transition-all duration-200"
          title="Previous page"
        >
          <FiArrowLeft className="w-3 h-3" />
        </button>

        <span className="text-gray-700 text-[10px] font-[600] px-2">
          Page <span className="text-[#0CBB7D]">{page}</span> of <span className="text-gray-900">{totalPages}</span>
        </span>

        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className="p-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-[#0CBB7D] hover:text-white hover:border-[#0CBB7D] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 transition-all duration-200"
          title="Next page"
        >
          <FiArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default PaginationFooter;
