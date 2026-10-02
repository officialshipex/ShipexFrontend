import React from "react";

/**
 * Small "N selected" indicator shown next to the checkbox controls.
 * Only renders once at least one row is selected.
 */
const SelectedCountBadge = ({ count, className = "" }) => {
  if (!count) return null;

  return (
    <span className={`text-[10px] sm:text-[12px] font-[600] text-gray-600 whitespace-nowrap ${className}`}>
      {count} selected
    </span>
  );
};

export default SelectedCountBadge;
