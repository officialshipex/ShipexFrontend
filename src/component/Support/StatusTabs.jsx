import React, { useEffect, useState } from "react";
import { STATUS_BADGE, STATUS_LABEL, TICKET_TABS, statusTab } from "./ticketStatus";

// The list fills the screen down to `bottomGap` and scrolls inside, as on the Orders and NDR pages. Attach the
// returned ref to the element just above the scrolling area's position; `bottomGap` leaves room for a footer.
export const useFillHeight = (bottomGap = 50) => {
  const [node, setNode] = useState(null);
  const [height, setHeight] = useState("calc(100vh - 260px)");
  useEffect(() => {
    if (!node) return undefined;
    const update = () => setHeight(`${Math.max(240, window.innerHeight - node.getBoundingClientRect().top - bottomGap)}px`);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [node, bottomGap]);
  return [setNode, height];
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-[600] ${STATUS_BADGE[status] || "bg-gray-100 text-gray-700"}`}>
    {STATUS_LABEL[status] || status || "N/A"}
  </span>
);

// New / Open / Awaiting Response / Closed / All, each with how many tickets it holds
export const StatusTabs = ({ tickets, selected, onSelect }) => (
  <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] bg-white border border-gray-200 rounded-lg p-1 w-fit max-w-full">
    {TICKET_TABS.map(({ label, value }) => {
      const count = value ? tickets.filter((t) => statusTab(t.status) === value).length : tickets.length;
      const active = selected === value;
      return (
        <button
          key={label}
          type="button"
          data-tab={label}
          onClick={() => onSelect(value)}
          className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md text-[12px] font-[600] transition-colors ${
            active ? "bg-brand-primary text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {label}
          <span className={`min-w-[18px] px-1 rounded-full text-center text-[10px] ${active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>
            {count}
          </span>
        </button>
      );
    })}
  </div>
);
