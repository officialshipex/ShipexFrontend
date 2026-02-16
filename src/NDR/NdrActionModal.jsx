import React, { useState, useRef, useEffect } from "react";
// import toast from "react-hot-toast";
import { Notification } from "../Notification"

const instructionOptionsAmazon = [
  { label: "Re-attempt", value: "RE-ATTEMPT" },
  { label: "Reschedule", value: "RESCHEDULE" },
  { label: "Return to Origin", value: "RTO" },
];
const instructionOptionsOthers = [
  { label: "Re-attempt", value: "RE-ATTEMPT" },
  { label: "Return to Origin", value: "RTO" },
];
const instructionOptionsZipyPost = [
  { label: "Re-Attempt", value: "Re-Attempt" },
  { label: "RTO", value: "RTO" },
  { label: "Change Contact", value: "Change Contact" },
  { label: "Change Address", value: "Change Address" },
];


const NdrActionModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [action, setAction] = useState("");
  const [remarks, setRemarks] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState({
    CA1: "",
    CA2: "",
    CA3: "",
    CA4: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      window.addEventListener("click", handleClickOutside);
    } else {
      window.removeEventListener("click", handleClickOutside);
    }
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownOpen]);

  if (!isOpen) return null;

  const isDelhivery = order?.provider === "Delhivery";
  const isEcomExpress = order?.provider === "EcomExpress";
  const isDtdc = order?.provider === "DTDC";
  const isAmazon = order?.provider === "Amazon";
  const isSmartship = order?.provider === "Smartship";
  const isZipyPost = order?.partner === "ZipyPost";
  const isReattempt = action === "RE-ATTEMPT";
  const isReschedule = action === "RESCHEDULE";

  const handleSubmit = async () => {
    if (!action) {
      Notification("Please select an instruction.", "info");
      return;
    }

    const payload = {
      awb_number: order.awb_number,
      action,
    };

    if (isZipyPost) {
      payload.action = action;
      payload.remarks = remarks;

      if (action === "Change Contact") payload.phone = mobile;
      if (action === "Change Address")
        Object.assign(payload, {
          customer_name: address.customer_name,
          consignee_address: address.address1,
          consignee_address2: address.address2,
        });
    }

    if (isAmazon) {
      if (action === "RE-ATTEMPT") {
        if (!remarks.trim())
          return Notification("Please enter your remarks.", "info");
        payload.comments = remarks;
      } else if (action === "RESCHEDULE") {
        if (!scheduledDate)
          return Notification("Please select a scheduled delivery date.", "info");
        payload.rescheduleDate = scheduledDate;
      }
    } else {
      if (!remarks.trim()) {
        Notification("Please enter your remarks.", "info");
        return;
      }

      payload.comments = remarks;

      if (isEcomExpress && isReattempt) {
        if (!scheduledDate)
          return Notification("Please select a scheduled delivery date.", "info");
        if (!deliverySlot)
          return Notification("Please select a delivery slot.", "info");

        Object.assign(payload, {
          scheduled_delivery_date: scheduledDate,
          scheduled_delivery_slot: deliverySlot,
          mobile,
          consignee_address: address,
        });
      }

      if (isDtdc) {
        Object.assign(payload, {
          customer_code: order.orderId || "",
          rtoAction: action,
          remarks,
        });
      }

      if (isSmartship && isReattempt) {
        if (!scheduledDate)
          return Notification("Please select next attempt date.", "info");
        if (!mobile.trim())
          return Notification("Please enter phone number.", "info");

        Object.assign(payload, {
          request_order_id: order.orderId, // assuming orderId is Smartship's ID
          comments: remarks,
          next_attempt_date: scheduledDate,
          phone: mobile,
        });
      }
    }

    setLoading(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error("Error submitting NDR:", error);
      Notification("Failed to submit action. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Custom dropdown options source
  const instructionOptions = isAmazon
    ? instructionOptionsAmazon
    : isZipyPost
      ? instructionOptionsZipyPost
      : instructionOptionsOthers;

  return (
    <div className="fixed inset-0 animate-popup-in bg-black bg-opacity-30 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-[90%] max-w-md p-4 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-[12px] sm:text-[14px] font-[600] mb-2">
          Take Action for AWB: {order.awb_number}
        </h2>

        {/* Custom Dropdown for Instruction */}
        <div className="mb-2 relative" ref={dropdownRef}>
          <label className="block text-[12px] font-[600] text-gray-700">Instruction</label>
          <button
            type="button"
            className="w-full border px-3 py-2 text-[10px] font-[600] text-gray-700 rounded-lg text-left flex justify-between items-center cursor-pointer"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            {action
              ? instructionOptions.find((opt) => opt.value === action)?.label
              : "Select Instruction"}
            <svg
              className={`w-4 h-4 ml-2 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          {dropdownOpen && (
            <ul className="absolute z-10 left-0 right-0 bg-white border rounded-lg shadow max-h-40 overflow-auto mt-1 text-[12px]">
              {instructionOptions.map(({ label, value }) => (
                <li
                  key={value}
                  onClick={() => {
                    setAction(value);
                    setDropdownOpen(false);
                    setRemarks("");
                    setScheduledDate("");
                  }}
                  className={`cursor-pointer px-3 py-2 font-[600] text-gray-500 text-[10px] hover:bg-green-50 ${action === value ? "bg-green-100" : ""
                    }`}
                >
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>wha

        {/* Amazon-specific fields */}
        {isAmazon && action === "RE-ATTEMPT" && (
          <div className="mb-2">
            <label className="block text-[12px] font-[600] text-gray-700">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="w-full border px-3 py-2 font-[600] text-[12px] text-gray-500 rounded-lg"
              placeholder="Enter remarks"
            />
          </div>
        )}

        {isAmazon && action === "RESCHEDULE" && (
          <div className="mb-2">
            <label className="block text-[12px] text-gray-700 font-[600]">Scheduled Delivery Date</label>
            <CustomDateSelect
              value={scheduledDate}
              onChange={setScheduledDate}
            />
          </div>
        )}

        {/* ZipyPost-specific fields */}
        {isZipyPost && (
          <>
            {action === "Change Contact" && (
              <div className="mb-2">
                <label className="block text-[12px] font-[600] text-gray-[700]">Contact Number</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full border px-3 py-2 text-[12px] font-[600] text-gray-500 rounded-lg"
                  placeholder="Enter 10-digit number"
                />
              </div>
            )}

            {action === "Change Address" && (
              <>
                <div className="mb-2">
                  <label className="block text-[12px] font-[600] text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    value={address.customer_name || ""}
                    onChange={(e) => setAddress({ ...address, customer_name: e.target.value })}
                    className="w-full border px-3 py-2 text-[12px] text-gray-500 font-[600] rounded-lg"
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-[12px] font-[600] text-gray-700">Address Line 1</label>
                  <input
                    type="text"
                    value={address.address1 || ""}
                    onChange={(e) => setAddress({ ...address, address1: e.target.value })}
                    className="w-full border px-3 py-2 text-[12px] font-[600] text-gray-500 rounded-lg"
                    placeholder="Enter address line 1"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-[12px] font-[600] text-gray-700">Address Line 2</label>
                  <input
                    type="text"
                    value={address.address2 || ""}
                    onChange={(e) => setAddress({ ...address, address2: e.target.value })}
                    className="w-full border px-3 py-2 text-[12px] font-[600] text-gray-500 rounded-lg"
                    placeholder="Enter address line 2"
                  />
                </div>
              </>
            )}
          </>
        )}


        {/* Ecom Express Only Fields */}
        {isEcomExpress && isReattempt && (
          <>
            <div className="mb-2">
              <label className="block text-[12px] font-[600] text-gray-700">Scheduled Delivery Date</label>
              <CustomDateSelect
                value={scheduledDate}
                onChange={setScheduledDate}
              />
            </div>

            <div className="mb-2">
              <label className="block text-[12px] font-[600] text-gray-700">Delivery Slot</label>
              <select
                value={deliverySlot}
                onChange={(e) => setDeliverySlot(e.target.value)}
                className="w-full text-[12px] border px-3 py-2 rounded-lg text-gray-500 font-[600]"
              >
                <option value="">Select Slot</option>
                <option value="1">Morning</option>
                <option value="2">Afternoon</option>
                <option value="3">Evening</option>
              </select>
            </div>

            <div className="mb-2">
              <label className="block text-[12px] font-[600] text-gray-700">Mobile (optional)</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full border text-[12px] px-3 py-2 font-[600] text-gray-500 rounded-lg"
              />
            </div>

            <div className="mb-2">
              <label className="block text-[12px] font-[600] text-gray-700">
                Consignee Address (optional)
              </label>
              <div className="grid grid-cols-2 text-[12px] font-[600] text-gray-500 gap-2">
                {["CA1", "CA2", "CA3", "CA4"].map((field) => (
                  <input
                    key={field}
                    type="text"
                    placeholder={field}
                    value={address[field]}
                    onChange={(e) =>
                      setAddress({ ...address, [field]: e.target.value })
                    }
                    className="border px-3 py-2 rounded-lg"
                  />
                ))}
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-[12px] font-[600] text-gray-700">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full border text-[12px] outline-none px-3 py-2 rounded-lg font-[600] text-gray-500"
                placeholder="Enter remarks"
              />
            </div>
          </>
        )}

        {/* Smartship-specific Fields */}
        {isSmartship && isReattempt && (
          <>
            <div className="mb-2">
              <label className="block text-[12px] font-[600] text-gray-700">Next Attempt Date</label>
              <CustomDateSelect value={scheduledDate} onChange={setScheduledDate} />
            </div>

            <div className="mb-2">
              <label className="block text-[12px] font-[600] text-gray-700">Phone</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full border text-[12px] px-3 py-2 rounded-lg font-[600] text-gray-500"
                placeholder="Enter phone number"
              />
            </div>
          </>
        )}

        {/* Comments for non-Amazon providers, conditional for DTDC */}
        {!isAmazon && (!isDtdc || (isDtdc && isReattempt)) && (
          <div className="mb-2">
            <label className="block text-[12px] font-[600] text-gray-700">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="w-full border text-[12px] outline-none px-3 py-2 rounded-lg font-[600] text-gray-500"
              placeholder="Enter remarks"
            />
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-[600] text-[12px]" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-3 py-2 bg-[#0CBB7D] text-white text-[12px] font-[600] rounded-lg"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Date Selector component for consistent custom styling
const CustomDateSelect = ({ value, onChange }) => {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border px-3 py-2 rounded-lg text-[12px] text-gray-500"
    />
  );
};

export default NdrActionModal;
