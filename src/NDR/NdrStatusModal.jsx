import { useEffect, useRef, useCallback, useState } from "react";
import { X } from "lucide-react";
import { FaHistory, FaCalendarAlt, FaUser, FaInfoCircle, FaLink } from "react-icons/fa";
import { getCarrierLogo } from "../Common/getCarrierLogo";
import { ChevronDown } from "lucide-react";
// Timeline marker with vertical connecting line
const TimelineMarker = ({ isLast }) => (
  <div className="relative flex justify-center items-start z-10 w-full h-full">
    {/* Dot */}
    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center relative z-10 mt-2 shadow-sm border border-gray-100">
      <span className="block w-2.5 h-2.5 rounded-full bg-[#0CBB7D] ring-2 ring-[#0CBB7D]/20 transition-transform group-hover:scale-110" />
    </div>

    {/* Line - Connector bar */}
    {!isLast && (
      <div
        className="absolute w-[2px] bg-gray-200 left-1/2 transform -translate-x-1/2 z-0"
        style={{ top: "2.5rem", bottom: "-1.5rem" }}
      />
    )}
  </div>
);

const NdrStatusModal = ({ isOpen, setIsOpen, ndrHistory }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const modalRef = useRef();

  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scrolling
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    modalRef.current && modalRef.current.focus();

    return () => {
      document.body.style.overflow = originalStyle;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  const onBackdropClick = useCallback(
    (e) => {
      if (e.target === modalRef.current) setIsOpen(false);
    },
    [setIsOpen]
  );

  if (!isOpen) return null;

  const formatDate = (date, source) => {
    if (!date) return "N/A";

    let d = new Date(date);
    console.log("source", source)
    // If source is "Shipex" add 5 hours 30 minutes
    if (source === "ShipexIndia") {
      // d = new Date(d.getTime() + 5.5 * 3600 * 1000);
    } else {
      // Else subtract 5 hours 30 minutes (your original)
      d = new Date(d.getTime() - 5.5 * 3600 * 1000);
    }

    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const amPm = hours < 12 ? "AM" : "PM";
    hours = hours % 12 || 12; // convert to 12 hour clock
    const hourStr = String(hours).padStart(2, "0");

    return `${day}-${month}-${year}, ${hourStr}:${minutes} ${amPm}`;
  };


  const groupsToShow =
    activeTab === "all"
      ? ndrHistory
      : [ndrHistory[["ndr1", "ndr2", "ndr3"].indexOf(activeTab)]];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1000]"
      tabIndex={-1}
      ref={modalRef}
      onClick={onBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-lg animate-popup-in shadow-sm sm:w-[950px] max-w-[95vw] overflow-hidden flex flex-col outline-none border border-gray-100" role="document">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0CBB7D]/10 rounded-lg">
              <FaHistory className="text-[#0CBB7D] w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[12px] sm:text-[14px] text-gray-700 font-[600] tracking-tight">NDR Status History</h2>
              <p className="text-[10px] text-gray-700">Detailed tracking and action history for undelivered reports</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-700 transition-all duration-200 focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Tabs - Desktop */}
          <div className="hidden sm:flex items-center gap-2" role="tablist">
            {["ndr1", "ndr2", "ndr3", "all"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-lg text-[12px] font-[600] transition-all duration-200 border shadow-sm ${activeTab === tab
                  ? "bg-[#0CBB7D] text-white border-[#0CBB7D]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-green-50"
                  }`}
                role="tab"
                aria-selected={activeTab === tab}
              >
                {tab === "ndr1"
                  ? "NDR Attempt 1"
                  : tab === "ndr2"
                    ? "NDR Attempt 2"
                    : tab === "ndr3"
                      ? "NDR Attempt 3"
                      : "Full History"}
              </button>
            ))}
          </div>

          {/* Tabs - Mobile Dropdown */}
          <div className="sm:hidden relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-3 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-[12px] font-[600] text-gray-700 flex justify-between items-center"
            >
              {activeTab === "ndr1" ? "NDR Attempt 1" : activeTab === "ndr2" ? "NDR Attempt 2" : activeTab === "ndr3" ? "NDR Attempt 3" : "Full History"}
              <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[110] overflow-hidden animate-popup-in">
                {["ndr1", "ndr2", "ndr3", "all"].map((tab) => (
                  <button
                    key={tab}
                    className={`w-full text-left px-4 py-2.5 text-[12px] font-[600] transition-colors ${activeTab === tab ? "bg-green-50 text-[#0CBB7D]" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    onClick={() => {
                      setActiveTab(tab);
                      setShowDropdown(false);
                    }}
                  >
                    {tab === "ndr1" ? "NDR Attempt 1" : tab === "ndr2" ? "NDR Attempt 2" : tab === "ndr3" ? "NDR Attempt 3" : "Full History"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar" style={{ maxHeight: '60vh' }}>
            <div className="mt-2 mb-4 pr-1">
              {/* Sticky Header: visible only on desktop */}
              <div className="hidden sm:grid grid-cols-[50px_1fr] items-center sticky top-0 z-20 bg-white pb-2 mb-1">
                <div></div>
                <div className="grid grid-cols-5 gap-4 px-4 py-2 text-[11px] font-bold text-gray-500 tracking-tight border-b border-gray-50">
                  <div className="flex items-center gap-2"><FaCalendarAlt className="text-[10px] text-[#0CBB7D]" /> Date & Time</div>
                  <div className="flex items-center gap-2"><FaInfoCircle className="text-[10px] text-[#0CBB7D]" /> Action</div>
                  <div className="flex items-center gap-2"><FaUser className="text-[10px] text-[#0CBB7D]" /> Action By</div>
                  <div className="flex items-center gap-2"><FaHistory className="text-[10px] text-[#0CBB7D]" /> Remarks</div>
                  <div className="flex items-center justify-center gap-2"><FaLink className="text-[10px] text-[#0CBB7D]" /> Source</div>
                </div>
              </div>

              {/* Timeline groups */}
              {groupsToShow?.map((group, idx) => {
                if (!group) return null;
                const actions = group.actions || [];

                return (
                  <div key={idx} className="mb-4">
                    {actions.length > 0 ? (
                      actions.map((item, actionIdx) => (
                        <div key={actionIdx} className="relative group">
                          <div className="relative grid grid-cols-[40px_1fr] sm:grid-cols-[50px_1fr] items-start">
                            <TimelineMarker isLast={actionIdx === actions.length - 1} />

                            {/* Content container */}
                            <div className="bg-white rounded-xl shadow-sm py-3 px-4 border border-gray-100 w-full hover:border-[#0CBB7D]/30 transition-all group">
                              {/* Desktop grid */}
                              <div className="hidden sm:grid grid-cols-5 gap-4 text-[12px] font-[500] text-gray-700">
                                <div className="flex items-center whitespace-nowrap text-gray-700">{formatDate(item.date, item.source)}</div>
                                <div className="flex items-center">
                                  <span className="px-2 py-0.5 bg-gray-50 rounded text-[12px] border border-gray-100">
                                    {item.action}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  {item.source === "Smartship" ? "Bluedart" : item.source || "—"}
                                </div>
                                <div className="flex items-center text-gray-500 text-[12px]">{item.remark || "—"}</div>
                                <div className="flex items-center justify-center">
                                  <div className="bg-gray-50 p-1 rounded-lg border border-gray-100 group-hover:scale-110 transition-transform">
                                    <img
                                      src={getCarrierLogo(item.source)}
                                      alt={item.source}
                                      className="w-8 h-7 object-contain"
                                      title={item.source}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Mobile stacked layout */}
                              <div className="sm:hidden space-y-2 text-xs">
                                <div>
                                  <strong>Date:</strong> {formatDate(item.date, item.source)}
                                </div>
                                <div>
                                  <strong>Action:</strong> {item.action}
                                </div>
                                <div>
                                  <strong>Action By:</strong>{" "}
                                  {item.source === "Smartship" ? "Bluedart" : item.source || "—"}
                                </div>
                                <div>
                                  <strong>Remarks:</strong> {item.remark || "—"}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <strong>Source:</strong>
                                  <img
                                    src={getCarrierLogo(item.source)}
                                    alt={item.source}
                                    className="w-9 h-8 object-contain"
                                    title={item.source}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 text-xs mt-4">No data available</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Close Button */}
        <div className="flex justify-end px-3 py-2 border-t border-gray-100 bg-gray-50/30">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-gray-200 text-[12px] text-gray-700 font-[600] rounded-lg hover:bg-gray-300 active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div >
  );
};

export default NdrStatusModal;
