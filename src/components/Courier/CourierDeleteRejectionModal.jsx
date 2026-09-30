import React from "react";
import { FaBan, FaExclamationTriangle, FaTimes, FaExternalLinkAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getCarrierLogo } from "../../Common/getCarrierLogo";

const CourierDeleteRejectionModal = ({
  isOpen,
  onClose,
  courier,
  services = [],
  isB2B = false,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !courier) return null;

  const courierDisplayName = courier.courierName || courier.courierProvider || "Courier";
  const providerName = courier.courierProvider || courier.courierName || "";

  const handleGoToServices = () => {
    onClose();
    if (isB2B) {
      navigate("/b2b/courierservices");
    } else {
      navigate("/courier-service");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-500/10 via-rose-500/10 to-amber-500/10 border-b border-red-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-sm border border-red-200">
              <FaBan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  Deletion Blocked
                </span>
                {isB2B && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                    B2B
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mt-0.5 leading-snug">
                Cannot Delete Courier
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FaTimes size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Target Courier Card */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white p-1 border border-gray-200 flex items-center justify-center shadow-xs">
                <img
                  src={getCarrierLogo(providerName)}
                  alt={providerName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-800">{courierDisplayName}</p>
                <p className="text-[11px] text-gray-500 font-medium">Provider: {providerName}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                {services.length} Linked {services.length === 1 ? "Service" : "Services"}
              </span>
            </div>
          </div>

          {/* Explanation Alert */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <FaExclamationTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px] sm:text-xs">
              This courier account cannot be deleted because{" "}
              <strong className="font-semibold text-amber-950">
                {services.length} active shipping service{services.length === 1 ? "" : "s"}
              </strong>{" "}
              are still configured and linked to it. Deleting it would disrupt active order fulfillment, rate cards, and shipping rules.
              <br />
              <span className="font-medium text-amber-800 mt-1 inline-block">
                Please reassign or delete the services listed below before deleting this courier.
              </span>
            </div>
          </div>

          {/* Linked Services List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">
                Linked Services ({services.length})
              </h4>
              <span className="text-[11px] text-gray-400">Must be removed first</span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-gray-100 bg-white shadow-xs">
              {services.map((svc, idx) => (
                <div
                  key={svc._id || idx}
                  className="p-3 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-gray-800 text-[12px] truncate">
                        {svc.name || "Unnamed Service"}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                        <span>{svc.courierType || svc.carrierType || "Standard"}</span>
                        <span>•</span>
                        <span>Provider: {svc.provider || providerName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        svc.status === "Enable"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                      }`}
                    >
                      {svc.status === "Enable" ? (
                        <>
                          <FaCheckCircle size={9} /> Active
                        </>
                      ) : (
                        <>
                          <FaTimesCircle size={9} /> Disabled
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 active:scale-95 transition-all"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleGoToServices}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-primary hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Manage Linked Services</span>
            <FaExternalLinkAlt size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourierDeleteRejectionModal;
