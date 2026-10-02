import React from "react";

/**
 * Row of standalone blue quick-action buttons shown to the left of the
 * existing "Actions" button. Only renders once at least one row is selected.
 */
const QuickActionButtons = ({ selectedCount, actions, className = "" }) => {
  if (!selectedCount || !actions?.length) return null;

  return (
    <div className={`items-center gap-2 overflow-x-auto ${className || "flex"}`}>
      {actions.map((action, idx) => (
        <button
          key={idx}
          type="button"
          onClick={action.onClick}
          className="py-2 px-3 rounded-lg text-[12px] font-[600] whitespace-nowrap flex items-center gap-1 transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default QuickActionButtons;
