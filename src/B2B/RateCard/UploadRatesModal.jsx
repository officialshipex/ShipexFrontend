import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiDownload, FiUpload, FiX } from "react-icons/fi";
import { downloadRateTemplate, uploadRateFile } from "./rateCardApi";

// B2B rate card upload (Excel) — zone prices only. Overhead charges are not changed by it: an existing
// card keeps its overheads, a new card starts with the standard ones (set them on this screen with Edit).
export default function UploadRatesModal({ isOpen, onClose, planId, planName, couriers = [], onDone }) {
  const [scope, setScope] = useState(planId ? "plan" : "all");
  // every courier (one sheet per zone matrix) or one courier (its own zone matrix)
  const [courierScope, setCourierScope] = useState("all");
  const [courierId, setCourierId] = useState(couriers[0]?._id || "");
  const courierName = couriers.find((c) => c._id === courierId)?.courierName || "";
  const [file, setFile] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [outcome, setOutcome] = useState(null); // { ok, message, errors, results }
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const blobError = async (err, fallback) => {
    const data = err?.response?.data;
    if (data instanceof Blob) {
      try { return JSON.parse(await data.text())?.message || fallback; } catch { return fallback; }
    }
    return data?.message || fallback;
  };

  const download = async () => {
    setDownloading(true);
    try {
      const oneCourier = courierScope === "one" && courierId;
      const res = await downloadRateTemplate(scope === "plan" ? planId : undefined, oneCourier ? courierId : undefined);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `b2b-ratecard-${scope === "plan" && planName ? planName : "all-plans"}${oneCourier && courierName ? `-${courierName}` : ""}.xlsx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setOutcome({ ok: false, message: await blobError(err, "Could not download the sample file"), errors: [], results: [] });
    } finally {
      setDownloading(false);
    }
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setOutcome(null);
    try {
      const res = await uploadRateFile(file);
      const d = res.data || {};
      setOutcome({ ok: !!d.success, message: d.message || "", errors: d.errors || [], results: d.results || [] });
      if (d.success || (d.created || 0) + (d.updated || 0) > 0) onDone?.();
    } catch (err) {
      setOutcome({ ok: false, message: err?.response?.data?.message || "Upload failed", errors: err?.response?.data?.errors || [], results: [] });
    } finally {
      setUploading(false);
    }
  };

  const close = () => {
    if (uploading) return;
    setFile(null);
    setOutcome(null);
    onClose();
  };

  const tone = (s) => (s === "success" ? "text-green-600" : s === "failed" ? "text-red-600" : "text-gray-500");

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-[14px] font-[600] text-brand-primary">Upload B2B Rates</h3>
          <button onClick={close} aria-label="Close" className="text-gray-400 hover:text-gray-600"><FiX /></button>
        </div>

        <div className="px-4 pb-4 overflow-y-auto space-y-3">
          <p className="text-[12px] text-gray-500">
            Only the zone prices (per kg, from zone to zone) are uploaded.{" "}
            <span className="font-[600] text-gray-700">Overhead charges are not changed</span> — set them on this screen with Edit.
            A new rate card created by the upload starts with the standard overhead charges.
          </p>

          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-[12px] font-[600] text-gray-700">1. Download the sample file</p>
            <div className="flex flex-wrap gap-4">
              {planId && (
                <label className="flex items-center gap-1.5 text-[12px] font-[600] text-gray-600 cursor-pointer">
                  <input type="radio" checked={scope === "plan"} onChange={() => setScope("plan")} className="accent-brand-primary" />
                  {planName || "Selected plan"}
                </label>
              )}
              <label className="flex items-center gap-1.5 text-[12px] font-[600] text-gray-600 cursor-pointer">
                <input type="radio" checked={scope === "all"} onChange={() => setScope("all")} className="accent-brand-primary" />
                All plans
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-1.5 text-[12px] font-[600] text-gray-600 cursor-pointer">
                <input type="radio" checked={courierScope === "all"} onChange={() => setCourierScope("all")} className="accent-brand-primary" />
                All couriers
              </label>
              <label className={`flex items-center gap-1.5 text-[12px] font-[600] cursor-pointer ${couriers.length ? "text-gray-600" : "text-gray-300 cursor-not-allowed"}`}>
                <input type="radio" disabled={!couriers.length} checked={courierScope === "one"} onChange={() => setCourierScope("one")} className="accent-brand-primary" />
                Courier-wise
              </label>
              {courierScope === "one" && (
                <select
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
                  className="border px-2 py-1.5 rounded-lg text-[12px] font-[600] text-gray-600 focus:outline-brand-primary"
                  aria-label="Courier"
                >
                  {couriers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courierName === c.courierProvider ? c.courierName : `${c.courierName} (${c.courierProvider})`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {courierScope === "one"
                ? `The file has ${courierName || "this courier"}'s services with the zones of its own zone matrix.`
                : "Each courier uses its own zone matrix, so the file has one sheet per zone matrix."}{" "}
              Current prices are already filled in — change only what you need. Blank or 0 = lane not offered.
            </p>
            <button
              onClick={download}
              disabled={downloading}
              className="border border-brand-primary text-brand-primary px-3 py-2 text-[12px] font-[600] rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <FiDownload /> {downloading ? "Downloading…" : "Download sample"}
            </button>
          </div>

          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-[12px] font-[600] text-gray-700">2. Upload the filled file (.xlsx)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] || null); setOutcome(null); }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="border px-3 py-2 text-[12px] font-[600] rounded-lg text-gray-600"
              >
                Choose file
              </button>
              <span className="text-[12px] text-gray-500 truncate max-w-[220px]">{file ? file.name : "No file chosen"}</span>
            </div>
            <button
              onClick={upload}
              disabled={!file || uploading}
              className="bg-brand-primary text-white px-3 py-2 text-[12px] font-[600] rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <FiUpload /> {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>

          {outcome && (
            <div className={`rounded-lg border p-3 ${outcome.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              <p className={`text-[12px] font-[600] ${outcome.ok ? "text-green-700" : "text-red-600"}`}>{outcome.message}</p>
              {outcome.errors.length > 0 && (
                <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto text-[11px] text-red-700 list-disc pl-4">
                  {outcome.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
              {outcome.errors.length === 0 && outcome.results.length > 0 && (
                <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto text-[11px]">
                  {outcome.results.map((r, i) => <li key={i} className={tone(r.status)}>{r.message}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
