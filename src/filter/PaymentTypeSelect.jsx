import { ChevronDown } from "lucide-react";

const PaymentTypeSelect = ({
  value,
  onChange,
  isOpen,
  setIsOpen,
  buttonRef,
  containerRef,
  closeOtherDropdowns = () => {},
  className = "",
  heightClass = "h-9",
}) => {
  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        ref={buttonRef}
        className={`w-full bg-white ${heightClass} px-3 text-xs font-semibold border-2 rounded-lg focus:outline-none 
        text-left flex items-center justify-between text-gray-400`}
        onClick={() => {
          setIsOpen((prev) => !prev);
          closeOtherDropdowns();
        }}
        type="button"
      >
        {value || "Payment Type"}
        <ChevronDown
          className={`w-4 h-4 ml-2 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute w-full bg-white border rounded shadow p-1 z-50 max-h-60 overflow-y-auto">
          {["Prepaid", "COD"].map((type) => (
            <div
              key={type}
              className="cursor-pointer hover:bg-green-50 px-3 py-2 text-[12px] font-[600] text-gray-500"
              onClick={() => {
                onChange(type);
                setIsOpen(false);
              }}
            >
              {type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentTypeSelect;
