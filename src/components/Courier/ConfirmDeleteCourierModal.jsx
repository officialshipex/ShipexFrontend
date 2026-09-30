import React from "react";
import { FaTrashAlt, FaTimes } from "react-icons/fa";
import { getCarrierLogo } from "../../Common/getCarrierLogo";

const ConfirmDeleteCourierModal = ({
  isOpen,
  onClose,
  courier,
  onConfirm,
  deleting = false,
}) => {
  if (!isOpen || !courier) return null;

  const courierName = courier.courierName || "";
  const providerName = courier.courierProvider || courier.courierName || "";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-red-50/80 border-b border-red-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
              <FaTrashAlt size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 leading-snug">
                Delete Courier Account
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">Permanent removal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FaTimes size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-3 text-xs">
          <p className="text-gray-600 leading-relaxed text-[12px]">
            Are you sure you want to delete courier account{" "}
            <strong className="text-gray-900 font-bold">"{courierName}"</strong>?
          </p>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-8 h-8 rounded-lg bg-white p-1 border border-gray-200 flex items-center justify-center shrink-0">
              <img
                src={getCarrierLogo(providerName)}
                alt={providerName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
            <div className="truncate">
              <p className="font-bold text-gray-800 text-[12px] truncate">{courierName}</p>
              <p className="text-[10px] text-gray-500">Provider: {providerName}</p>
            </div>
          </div>

          <div className="p-3 bg-red-50/60 border border-red-100 rounded-xl text-red-700 text-[11px] leading-relaxed">
            This courier has no linked services and can be safely deleted. However, this action cannot be undone and API credentials will need to be re-entered if added again.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <FaTrashAlt size={11} />
            <span>{deleting ? "Deleting..." : "Yes, Delete Courier"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteCourierModal;
