import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useParams } from "react-router-dom";
import { Notification } from "../../Notification";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-brand-primary";

// An admin's correction of a seller's PAN, GST or contact details. The backend validates it, refuses a value that
// belongs to another account, and records who changed what.
export default function SellerDetailsEditModal({ isOpen, onClose, onSaved, title, section, fields, initial, note }) {
  const { id } = useParams();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setForm(Object.fromEntries(fields.map((f) => [f.key, initial?.[f.key] ?? ""])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const save = async () => {
    setSaving(true);
    try {
      const res = await axios.put(
        `${REACT_APP_BACKEND_URL}/kyc-review/seller-details/${id}`,
        { section, ...form },
        { headers: { Authorization: `Bearer ${Cookies.get("session")}` } }
      );
      Notification(res.data?.message || "Details updated.", "success");
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      Notification(error.response?.data?.message || "Could not save these details. Please check your connection and try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed animate-popup-in inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg p-6 relative shadow-lg max-h-[90vh] overflow-y-auto">
        <button type="button" aria-label="Close" className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-xl" onClick={onClose}>
          ×
        </button>
        <h2 className="text-[16px] font-[600] text-gray-700 mb-1">{title}</h2>
        {note && <p className="text-[12px] text-gray-500 mb-3">{note}</p>}
        <div className="flex flex-col gap-3 mt-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-[12px] font-[600] text-gray-600 mb-1">{f.label}</label>
              <input
                className={`${inputCls} ${f.upper ? "uppercase" : ""}`}
                value={form[f.key] ?? ""}
                maxLength={f.maxLength}
                inputMode={f.numeric ? "numeric" : undefined}
                onChange={(e) => {
                  const raw = e.target.value;
                  const value = f.upper ? raw.toUpperCase() : f.numeric ? raw.replace(/\D/g, "") : raw;
                  setForm((p) => ({ ...p, [f.key]: value }));
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-[12px] font-[600] text-gray-600">
            Cancel
          </button>
          <button type="button" disabled={saving} onClick={save} className="px-4 py-2 rounded-lg bg-brand-primary text-white text-[12px] font-[600] disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
