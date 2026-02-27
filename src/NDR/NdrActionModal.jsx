import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, MapPin, Phone, Calendar, MessageSquare, Navigation } from "lucide-react";
import { Notification } from "../Notification";

// ─── Unified 3-option dropdown for all couriers ───────────────────────────────
const ACTIONS = [
  { label: "Reattempt", value: "RE-ATTEMPT" },
  { label: "Change Address", value: "CHANGE_ADDRESS" },
  { label: "Return to Origin (RTO)", value: "RTO" },
];

const InputField = ({ label, icon: Icon, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 flex items-center gap-1.5">
      {Icon && <Icon className="w-3 h-3 text-[#0CBB7D]" />}
      {label}
    </label>
    <input
      {...props}
      className="w-full border border-gray-300 px-3 py-2 text-[12px] font-[500] text-gray-700 rounded-lg focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 transition-all placeholder:text-gray-400"
    />
  </div>
);

const NdrActionModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [action, setAction] = useState("");
  const [remarks, setRemarks] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    customerName: "",
  });
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen]);

  if (!isOpen) return null;

  const provider = order?.provider || "";
  const partner = order?.partner || "";
  const platform = order?.platform || "";

  const isZipyPost = partner === "ZipyPost";
  const isAmazon = provider === "Amazon Shipping";
  const isEcomExpress = provider === "EcomExpress";
  const isSmartship = provider === "Smartship";
  const isDtdc = provider === "Dtdc";
  const isDelhivery = provider === "Delhivery";
  const isEkart = provider === "Ekart";
  const isShreeMaruti = provider === "Shree Maruti";

  const isChangeAddress = action === "CHANGE_ADDRESS";
  const isReattempt = action === "RE-ATTEMPT";
  const isRTO = action === "RTO";

  const handleSubmit = async () => {
    if (!action) return Notification("Please select an action.", "info");
    if (!remarks.trim()) return Notification("Please enter remarks.", "info");

    // ─── Validate Change Address fields ──────────────────────
    if (isChangeAddress && !isAmazon) {
      if (!address.line1.trim()) return Notification("Please enter address line 1.", "info");
      if (!address.customerName.trim()) return Notification("Please enter customer name.", "info");
    }

    // ─── Validate provider-specific required fields ───────────
    if (isEcomExpress && isReattempt) {
      if (!scheduledDate) return Notification("Please select delivery date.", "info");
      if (!deliverySlot) return Notification("Please select delivery slot.", "info");
    }
    if (isSmartship && isReattempt) {
      if (!scheduledDate) return Notification("Please select next attempt date.", "info");
    }
    if (isAmazon && action === "RE-ATTEMPT") {
      // just remarks needed
    }

    // ─── Build payload ────────────────────────────────────────
    let payload = { awb_number: order.awb_number };

    if (isZipyPost) {
      // ZipyPost: Change Address → send as Re-Attempt with address fields
      const zipAction =
        isChangeAddress ? "Change Address"
          : isRTO ? "RTO"
            : "Re-Attempt";

      payload.action = zipAction;
      payload.remarks = remarks;
      if (mobile) payload.phone = mobile;
      if (isChangeAddress) {
        payload.customer_name = address.customerName;
        payload.consignee_address = address.line1;
        payload.consignee_address2 = address.line2;
      }
    } else if (isAmazon) {
      // Amazon: no Change Address support, treat Change Address as RE-ATTEMPT
      const amazonAction = isRTO ? "RTO" : "RE-ATTEMPT";
      payload.action = amazonAction;
      payload.comments = remarks;
      if (amazonAction === "RE-ATTEMPT" && !scheduledDate) {
        // no scheduled date needed, just comments
      }
    } else if (isEcomExpress) {
      // EcomExpress: Change Address = RE-ATTEMPT with address
      payload.action = isChangeAddress ? "RE-ATTEMPT" : action;
      payload.comments = remarks;
      if (isReattempt || isChangeAddress) {
        payload.scheduled_delivery_date = scheduledDate;
        payload.scheduled_delivery_slot = deliverySlot;
        if (mobile) payload.mobile = mobile;
        if (isChangeAddress) {
          payload.consignee_address = {
            CA1: address.line1,
            CA2: address.city + (address.state ? `, ${address.state}` : ""),
            CA3: address.line2 || "",
            CA4: address.customerName,
          };
        }
      }
    } else if (isSmartship) {
      // Smartship: Change Address = RE-ATTEMPT, address goes via consignee fields
      payload.action = isChangeAddress ? "RE-ATTEMPT" : action;
      payload.comments = remarks;
      if (scheduledDate) payload.next_attempt_date = scheduledDate;
      if (mobile) payload.phone = mobile;
      if (isChangeAddress) {
        payload.new_address = address.line1;
        payload.new_phone = mobile;
        payload.customer_name = address.customerName;
      }
    } else if (isDtdc) {
      payload.action = isChangeAddress ? "RE-ATTEMPT" : action;
      payload.remarks = remarks;
      payload.customer_code = order.orderId || "";
      payload.rtoAction = isChangeAddress ? "RE-ATTEMPT" : action;
    } else if (isDelhivery) {
      payload.action = isChangeAddress ? "RE-ATTEMPT" : action;
      payload.comments = remarks;
      if (isChangeAddress) {
        payload.new_address = address.line1;
        payload.new_pincode = address.pincode;
        payload.customer_name = address.customerName;
      }
    } else if (isShreeMaruti) {
      payload.action = isChangeAddress ? "RE-ATTEMPT" : action;
      payload.comments = remarks;
      if (mobile) payload.phone = mobile;
      if (isChangeAddress) {
        payload.consignee_address = address.line1;
      }
    } else if (isEkart) {
      payload.action = isChangeAddress ? "RE-ATTEMPT" : action;
      payload.comments = remarks;
      if (isChangeAddress) {
        payload.new_address = address.line1;
        payload.new_address2 = address.line2;
        payload.customer_name = address.customerName;
        payload.new_phone = mobile;
        payload.new_pincode = address.pincode;
      }
    } else {
      // Shiprocket / NimbusPost / others
      payload.action = isChangeAddress ? "RE-ATTEMPT" : action;
      payload.comments = remarks;
    }

    setLoading(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Error submitting NDR:", err);
      Notification("Failed to submit action. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedLabel = ACTIONS.find((a) => a.value === action)?.label || "Select Action";

  // EcomExpress + Change Address also needs date/slot
  const needsScheduledDate =
    (isEcomExpress && (isReattempt || isChangeAddress)) ||
    (isSmartship && (isReattempt || isChangeAddress));

  const needsChangeAddressFields = isChangeAddress && !isAmazon;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[1000] px-3">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg flex flex-col max-h-[90vh] border border-gray-100 animate-popup-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div>
            <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">Take NDR Action</h2>
            <p className="text-[10px] text-gray-500 font-[500]">
              AWB: <span className="text-[#0CBB7D] font-[600]">{order.awb_number}</span>
              {provider && <span className="ml-2 text-gray-400">• {provider}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all focus:outline-none p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">

          {/* Action Dropdown */}
          <div className="flex flex-col gap-1" ref={dropdownRef}>
            <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700">Action</label>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-full border border-gray-300 px-3 py-2 text-[12px] font-[600] text-gray-700 rounded-lg text-left flex justify-between items-center hover:border-[#0CBB7D] transition-all focus:outline-none focus:border-[#0CBB7D]"
            >
              <span className={action ? "text-gray-800" : "text-gray-400"}>{selectedLabel}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <ul className="absolute z-30 mt-1 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden animate-popup-in text-[12px] w-[calc(100%-2rem)] max-w-[calc(28rem-2rem)]">
                {ACTIONS.map(({ label, value }) => (
                  <li
                    key={value}
                    onClick={() => { setAction(value); setDropdownOpen(false); setRemarks(""); setScheduledDate(""); setAddress({ line1: "", line2: "", city: "", state: "", pincode: "", customerName: "" }); }}
                    className={`px-3 py-2 cursor-pointer font-[600] transition-colors flex items-center gap-2 ${action === value ? "bg-green-50 text-[#0CBB7D]" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {value === "RE-ATTEMPT" && <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />}
                    {value === "CHANGE_ADDRESS" && <span className="w-2 h-2 rounded-full bg-[#0CBB7D] shrink-0" />}
                    {value === "RTO" && <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />}
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* General Remarks */}
          {action && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-[#0CBB7D]" />
                Remarks <span className="text-red-400">*</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Enter remarks..."
                className="w-full border border-gray-300 px-3 py-2 text-[12px] font-[500] text-gray-700 rounded-lg focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 transition-all placeholder:text-gray-400 resize-none"
              />
            </div>
          )}

          {/* Change Address Fields - shown for all couriers except Amazon */}
          {needsChangeAddressFields && (
            <div className="border border-[#0CBB7D]/20 rounded-lg p-3 bg-green-50/30 flex flex-col gap-2.5">
              <p className="text-[11px] font-[700] text-[#0CBB7D] flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> New Delivery Address
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <InputField
                    label="Customer Name *"
                    value={address.customerName}
                    onChange={(e) => setAddress({ ...address, customerName: e.target.value })}
                    placeholder="Full name"
                    icon={Navigation}
                  />
                </div>
                <div className="col-span-2">
                  <InputField
                    label="Address Line 1 *"
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    placeholder="House/Flat, Street"
                    icon={MapPin}
                  />
                </div>
                <div className="col-span-2">
                  <InputField
                    label="Address Line 2"
                    value={address.line2}
                    onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    placeholder="Area, Landmark (optional)"
                  />
                </div>
                <InputField
                  label="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="City"
                />
                <InputField
                  label="State"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  placeholder="State"
                />
                {(isEkart || isDelhivery || isZipyPost) && (
                  <div className="col-span-2">
                    <InputField
                      label="Pincode"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile number field */}
          {action && (isChangeAddress || isSmartship || isShreeMaruti || (isEcomExpress && isReattempt)) && (
            <InputField
              label={isChangeAddress ? "New Contact Number" : "Contact Number"}
              icon={Phone}
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
          )}

          {/* Scheduled Date */}
          {action && needsScheduledDate && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#0CBB7D]" />
                {isSmartship ? "Next Attempt Date *" : "Scheduled Delivery Date *"}
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 transition-all"
              />
            </div>
          )}

          {/* Delivery Slot (EcomExpress only) */}
          {isEcomExpress && (isReattempt || isChangeAddress) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700">Delivery Slot *</label>
              <select
                value={deliverySlot}
                onChange={(e) => setDeliverySlot(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg text-[12px] text-gray-700 font-[600] focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 transition-all"
              >
                <option value="">Select Slot</option>
                <option value="1">Morning</option>
                <option value="2">Afternoon</option>
                <option value="3">Evening</option>
              </select>
            </div>
          )}

          {/* Amazon notice for Change Address */}
          {isAmazon && isChangeAddress && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-700 font-[500]">
              ⚠️ Amazon Shipping does not support address changes. This will be submitted as a Re-Attempt request.
            </div>
          )}

          {/* Ekart notice */}
          {isEkart && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 font-[500]">
              ℹ️ Ekart NDR actions are processed internally and tracked via order history.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/30 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-[600] text-[12px] rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !action}
            className={`px-3 py-2 text-white font-[600] text-[12px] rounded-lg transition-all ${loading || !action
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-[#0CBB7D] hover:bg-[#099c68] active:scale-95 shadow-sm shadow-[#0CBB7D]/20"
              }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-3 h-3 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting...
              </span>
            ) : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NdrActionModal;
