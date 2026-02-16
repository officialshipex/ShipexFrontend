import { useEffect, useRef, useCallback, useState } from "react";
import { X } from "lucide-react";
import DTDC from "../assets/dtdc.png";
import Smartship from "../assets/bluedart.png";
import Delhivery from "../assets/delehivery.png";
import Amazon from "../assets/amazon.jpg";
import ShipexIndia from "../assets/Shipex.jpg";
import Bluedart from "../assets/bluedart.png";
import ShreeMaruti from "../assets/shreemaruti.png";

const sourceImages = {
  DTDC,
  Dtdc: DTDC,
  Smartship,
  Delhivery,
  Amazon,
  "Amazon Shipping": Amazon,
  ShipexIndia,
  Bluedart,
  "Shree Maruti": ShreeMaruti,
};

// Timeline marker with vertical connecting line
const TimelineMarker = ({ isLast }) => (
  <div className="relative flex justify-center items-start z-10">
    {/* Dot */}
    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center relative z-10 mt-2">
      <span className="block w-3 h-3 rounded-full bg-[#0CBB7D] border-2 border-white" />
    </div>

    {/* Line */}
    {!isLast && (
      <div
        className="absolute w-0.5 bg-gray-300 left-1/2 transform -translate-x-1/2 z-0"
        style={{ top: "1.25rem", bottom: 0 }}
      />
    )}
  </div>
);

const NdrStatusModal = ({ isOpen, setIsOpen, ndrHistory }) => {
  const [activeTab, setActiveTab] = useState("all");
  const modalRef = useRef();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    modalRef.current && modalRef.current.focus();
    return () => {
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
      <div className="bg-white rounded-lg animate-popup-in shadow-lg sm:w-[900px] max-w-full p-5 outline-none" role="document">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-[14px] text-gray-700 font-[600]">NDR Status</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-600 hover:text-gray-900 transition focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3" role="tablist">
          {["ndr1", "ndr2", "ndr3", "all"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-[500] transition ${activeTab === tab ? "bg-[#0CBB7D] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              role="tab"
              aria-selected={activeTab === tab}
            >
              {tab === "ndr1"
                ? "NDR 1"
                : tab === "ndr2"
                  ? "NDR 2"
                  : tab === "ndr3"
                    ? "NDR 3"
                    : "All NDR"}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="flex-1 min-h-0 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div className="mt-4 mb-4">
            {/* Header: visible only on desktop */}
            <div className="hidden sm:grid grid-cols-[50px_1fr] items-center mb-2">
              <div></div>
              <div className="grid grid-cols-5 gap-3 px-3 bg-gray-50 py-2 rounded sm:text-[12px] text-[10px] font-semibold text-gray-700">
                <div className="flex items-center">Date</div>
                <div className="flex items-center">Action</div>
                <div className="flex items-center">Action By</div>
                <div className="flex items-center">Remarks</div>
                <div className="flex items-center justify-center">Source</div>
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
                      <div key={actionIdx} className="relative mb-2">
                        <div className="relative flex sm:grid sm:grid-cols-[50px_1fr] items-start">
                          {/* FIXED: now checks actionIdx */}
                          <TimelineMarker isLast={actionIdx === actions.length - 1} />

                          {/* Content container */}
                          <div className="bg-white rounded shadow-sm py-2 px-3 border border-gray-100 w-full">
                            {/* Desktop grid */}
                            <div className="hidden sm:grid grid-cols-5 gap-3 sm:text-[12px] text-[10px]">
                              <div className="flex items-center">{formatDate(item.date, item.source)}</div>
                              <div className="flex items-center">{item.action}</div>
                              <div className="flex items-center">
                                {item.source === "Smartship" ? "Bluedart" : item.source || "—"}
                              </div>
                              <div className="flex items-center">{item.remark || "—"}</div>
                              <div className="flex items-center justify-center">
                                {sourceImages[item.source] ? (
                                  <img
                                    src={sourceImages[item.source]}
                                    alt={item.source}
                                    className="w-9 h-8 inline"
                                    title={item.source}
                                  />
                                ) : (
                                  "—"
                                )}
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
                                {sourceImages[item.source] ? (
                                  <img
                                    src={sourceImages[item.source]}
                                    alt={item.source}
                                    className="w-9 h-8"
                                    title={item.source}
                                  />
                                ) : (
                                  <span>—</span>
                                )}
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

        {/* Close Button */}
        <div className="text-right mt-4">
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 bg-gray-500 text-[12px] text-white rounded-md hover:bg-gray-600 transition focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div >
  );
};

export default NdrStatusModal;
