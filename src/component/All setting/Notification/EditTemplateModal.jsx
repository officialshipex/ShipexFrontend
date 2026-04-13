import React, { useState, useEffect } from "react";
import { X, Info } from "lucide-react";

/**
 * EditTemplateModal
 * Styled as a right-side panel to match the application's filter UI pattern.
 */
const EditTemplateModal = ({
  isOpen,
  onClose,
  onUpdate,
  status,
  currentSubject,
  currentTemplate,
  type = "Email", // "Email", "WhatsApp", or "SMS"
}) => {
  const [subject, setSubject] = useState("");
  const [template, setTemplate] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSubject(currentSubject || "");
      setTemplate(currentTemplate || "");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen, currentSubject, currentTemplate]);

  if (!isOpen) return null;

  const variables = [
    { key: "{order_id}", label: "Order ID" },
    { key: "{customer_name}", label: "Customer Name" },
    { key: "{carrier_name}", label: "Carrier Name" },
    { key: "{tracking_number}", label: "AWB Number" },
    { key: "{tracking_link}", label: "Tracking Link" },
    { key: "{company_name}", label: "Your Company" },
  ];

  const handleUpdate = () => {
    onUpdate({ subject, template });
    onClose();
  };

  const insertVariable = (variable) => {
    // Basic insertion at the end for simplicity, could be improved with ref and cursor position
    setTemplate((prev) => prev + " " + variable);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Side Panel */}
      <div className="relative w-full max-w-[450px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-[16px] font-bold text-gray-800">
              Edit {status?.label} Template
            </h2>
            <p className="text-[11px] text-gray-500">
              Customize how your {type} notifications look
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-all"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Subject Field (Only for Email) */}
          {type === "Email" && (
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-700 flex items-center justify-between">
                <span>Subject Line</span>
                <span className="text-[10px] font-normal text-gray-400">
                  {subject.length}/100
                </span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={100}
                placeholder="Enter email subject"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0CBB7D]/20 focus:border-[#0CBB7D] transition-all"
              />
            </div>
          )}

          {/* Template Body */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-700 flex items-center justify-between">
              <span>Message Content</span>
              {type === "SMS" && (
                <span className="text-[10px] font-normal text-gray-400">
                  Approx {Math.ceil(template.length / 160)} SMS units
                </span>
              )}
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={12}
              placeholder="Type your message here..."
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0CBB7D]/20 focus:border-[#0CBB7D] transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Variables Helper */}
          <div className="space-y-3 p-4 bg-green-50/50 rounded-2xl border border-green-100">
            <div className="flex items-center gap-2 text-[#0CBB7D]">
              <Info className="w-4 h-4" />
              <span className="text-[12px] font-bold">Dynamic Variables</span>
            </div>
            <p className="text-[11px] text-green-700/80 leading-snug">
              Click a variable below to insert it into your message. These will
              be replaced with actual order data.
            </p>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="px-2.5 py-1.5 bg-white border border-green-200 text-[#0CBB7D] text-[11px] font-bold rounded-lg hover:bg-[#0CBB7D] hover:text-white hover:border-[#0CBB7D] transition-all shadow-sm"
                  title={`Insert ${v.label}`}
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-[13px] font-bold hover:bg-white transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 py-2.5 bg-[#0CBB7D] text-white rounded-xl text-[13px] font-bold hover:bg-[#0aa36d] transition-all shadow-lg shadow-[#0CBB7D]/20 active:scale-[0.98]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTemplateModal;
