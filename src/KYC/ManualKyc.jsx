import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { User, Building2, UploadCloud, FileText, X, CheckCircle2 } from "lucide-react";
import VerifyPhoneEmail from "./VerifyPhoneEmail";
import { Notification } from "../Notification";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Same rules the backend applies (kyc/manualKyc.controller.js); checking here only saves the seller a round trip.
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const PAN_HOLDER_TYPES = "PCHFATBLJG";
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const AADHAAR_RE = /^[2-9][0-9]{11}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_RE = /^[A-Za-z0-9]{9,18}$/;
const PINCODE_RE = /^\d{6}$/;
const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];
const MAX_MB = 5;
const today = () => new Date().toISOString().slice(0, 10);
const validDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && v <= today();

const authHeaders = () => ({ Authorization: `Bearer ${Cookies.get("session")}` });

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] font-[500] text-gray-800 bg-white focus:outline-none focus:border-brand-primary";

function Field({ label, children, hint, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-[12px] font-[600] text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="w-full bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h2 className="sm:text-[14px] text-[12px] text-brand-primary font-[600] mb-3">{title}</h2>
      {children}
    </div>
  );
}

function FileInput({ label, file, onChange }) {
  const pick = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return Notification("Please upload a JPG, PNG or PDF file.", "error");
    if (f.size > MAX_MB * 1024 * 1024) return Notification(`File must be smaller than ${MAX_MB} MB.`, "error");
    onChange(f);
  };
  return (
    <Field label={label}>
      {file ? (
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
          <FileText size={16} className="text-brand-primary shrink-0" />
          <span className="text-[12px] font-[500] text-gray-700 truncate flex-1">{file.name}</span>
          <button type="button" onClick={() => onChange(null)} aria-label="Remove file" className="text-gray-400 hover:text-red-500">
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-brand-primary rounded-lg px-3 py-3 cursor-pointer text-[12px] font-[600] text-gray-500">
          <UploadCloud size={16} /> Upload JPG, PNG or PDF (max {MAX_MB} MB)
          <input type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={pick} />
        </label>
      )}
    </Field>
  );
}

async function lookupPincode(pin) {
  try {
    const res = await axios.get(`${REACT_APP_BACKEND_URL}/order/pincode/${pin}`, { headers: authHeaders() });
    return res.data && res.data.city ? { city: res.data.city, state: res.data.state } : null;
  } catch (_) {
    return null;
  }
}

const emptyForm = () => ({
  type: "individual",
  billing: { address: "", pincode: "", city: "", state: "" },
  gstin: "",
  gstCert: null,
  pan: { number: "", name: "", date: "", card: null },
  aadhaar: { number: "", name: "", guardianName: "", dob: "", address: "", pincode: "", city: "", state: "", front: null, back: null },
  bank: { holderName: "", accountNumber: "", confirmAccountNumber: "", ifsc: "", bankName: "", branch: "", accountType: "current", proofType: "cheque", proof: null },
});

// The seller's typed answers from a rejected request; documents have to be uploaded again.
function formFromPrefill(pf) {
  const f = emptyForm();
  if (!pf) return f;
  f.type = pf.businessType === "company" ? "company" : "individual";
  f.billing = { ...f.billing, ...(pf.billing || {}) };
  f.gstin = pf.gstNumber || "";
  f.pan = { ...f.pan, number: pf.pan?.number || "", name: pf.pan?.name || "", date: pf.pan?.date || "" };
  f.aadhaar = { ...f.aadhaar, ...(pf.aadhaar || {}), number: pf.aadhaar?.number || "" };
  f.bank = {
    ...f.bank,
    ...(pf.bank || {}),
    confirmAccountNumber: pf.bank?.accountNumber || "",
    accountType: pf.bank?.accountType || "current",
    proofType: pf.bank?.proofType || "cheque",
  };
  return f;
}

function firstError(f, verified) {
  if (!verified.phone || !verified.email) return "Please verify your email and mobile number first.";
  const b = f.billing;
  if (b.address.trim().length < 5 || !PINCODE_RE.test(b.pincode) || !b.city.trim() || !b.state.trim()) return "Enter a complete billing address.";
  if (f.type === "company") {
    if (!GSTIN_RE.test(f.gstin)) return "Enter a valid GSTIN.";
    if (!f.gstCert) return "Upload your GST registration certificate.";
  }
  const p = f.pan;
  if (!PAN_RE.test(p.number) || !PAN_HOLDER_TYPES.includes(p.number[3])) return "Enter a valid PAN number.";
  if (p.name.trim().length < 2) return "Enter the name as on the PAN card.";
  if (!validDate(p.date)) return f.type === "company" ? "Enter a valid date of incorporation." : "Enter a valid date of birth on the PAN card.";
  if (!p.card) return "Upload your PAN card.";
  const a = f.aadhaar;
  if (!AADHAAR_RE.test(a.number)) return "Enter a valid 12-digit Aadhaar number.";
  if (a.name.trim().length < 2 || a.guardianName.trim().length < 2) return "Enter the name and guardian name as on Aadhaar.";
  if (!validDate(a.dob)) return "Enter a valid date of birth as on Aadhaar.";
  if (a.address.trim().length < 5 || !PINCODE_RE.test(a.pincode) || !a.city.trim() || !a.state.trim()) return "Enter the complete address as on Aadhaar.";
  if (!a.front || !a.back) return "Upload both sides of your Aadhaar card.";
  const k = f.bank;
  if (k.holderName.trim().length < 2 || !k.bankName.trim() || !k.branch.trim()) return "Enter the complete bank details.";
  if (!ACCOUNT_RE.test(k.accountNumber)) return "Enter a valid bank account number (9 to 18 characters).";
  if (k.accountNumber !== k.confirmAccountNumber) return "Bank account numbers do not match.";
  if (!IFSC_RE.test(k.ifsc)) return "Enter a valid IFSC code.";
  if (!k.proof) return "Upload the bank proof (cancelled cheque or statement).";
  return "";
}

function buildFormData(f) {
  const fd = new FormData();
  fd.append("selectedType", f.type);
  fd.append("billingInfo", JSON.stringify(f.billing));
  if (f.type === "company") {
    fd.append("gstNumber", f.gstin);
    fd.append("gstCertificate", f.gstCert);
  }
  fd.append("pan", JSON.stringify({ pan: f.pan.number, name: f.pan.name.trim(), date: f.pan.date }));
  fd.append("panCard", f.pan.card);
  const { front, back, ...aadhaar } = f.aadhaar;
  fd.append("aadhaar", JSON.stringify({ ...aadhaar, aadhaarNumber: aadhaar.number }));
  fd.append("aadhaarFront", front);
  fd.append("aadhaarBack", back);
  const { holderName, accountNumber, ifsc, bankName, branch, accountType, proofType } = f.bank;
  fd.append("bankDetails", JSON.stringify({ holderName, accountNumber, ifsc, bankName, branch, accountType, proofType }));
  fd.append("bankProof", f.bank.proof);
  return fd;
}

// Manual KYC: the seller types the details and uploads the documents; an admin approves them later.
// onSubmitted() is called once the request is saved, so the parent can show "under review".
export default function ManualKyc({ prefill, onSubmitted }) {
  const [form, setForm] = useState(() => formFromPrefill(prefill));
  const [verified, setVerified] = useState({ phone: false, email: false });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const patch = (section, values) => setForm((f) => ({ ...f, [section]: { ...f[section], ...values } }));

  // City and state follow the pincode (the seller can still correct them).
  const billingPin = form.billing.pincode;
  useEffect(() => {
    if (!PINCODE_RE.test(billingPin)) return undefined;
    let cancelled = false;
    lookupPincode(billingPin).then((r) => {
      if (!cancelled && r) setForm((f) => ({ ...f, billing: { ...f.billing, city: r.city, state: r.state } }));
    });
    return () => { cancelled = true; };
  }, [billingPin]);

  const aadhaarPin = form.aadhaar.pincode;
  useEffect(() => {
    if (!PINCODE_RE.test(aadhaarPin)) return undefined;
    let cancelled = false;
    lookupPincode(aadhaarPin).then((r) => {
      if (!cancelled && r) setForm((f) => ({ ...f, aadhaar: { ...f.aadhaar, city: r.city, state: r.state } }));
    });
    return () => { cancelled = true; };
  }, [aadhaarPin]);

  const submit = async () => {
    if (submitting) return;
    const problem = firstError(form, verified);
    if (problem) return Notification(problem, "warning");
    if (!confirmed) return Notification("Please confirm that the details and documents are correct.", "warning");
    setSubmitting(true);
    try {
      const res = await axios.post(`${REACT_APP_BACKEND_URL}/merchant/verfication/manual-kyc`, buildFormData(form), {
        headers: authHeaders(),
      });
      if (res.data && res.data.success) {
        Notification("KYC submitted for verification.", "success");
        onSubmitted();
      } else {
        Notification((res.data && res.data.message) || "Could not submit your KYC. Please try again.", "error");
      }
    } catch (error) {
      const status = error.response && error.response.status;
      const message = error.response && error.response.data && error.response.data.message;
      // Already submitted (a double click, or another tab): show where it stands instead of an error.
      if (status === 409 && /under review/i.test(message || "")) return onSubmitted();
      Notification(message || "Could not submit your KYC. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const isCompany = form.type === "company";

  return (
    <div className="w-full flex flex-col gap-4 p-2">
      <VerifyPhoneEmail onVerificationChange={({ phone, email }) => setVerified({ phone, email })} />

      <div>
        <h2 className="sm:text-[14px] text-[12px] font-[600] mb-3 text-gray-700">Please Confirm Your Business Type</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {[
            { label: "Individual", value: "individual", icon: <User size={18} /> },
            { label: "Company", value: "company", icon: <Building2 size={18} /> },
          ].map((o) => (
            <label
              key={o.value}
              className={`flex items-center gap-3 border-2 rounded-lg px-4 py-2 w-full sm:w-60 cursor-pointer transition duration-150 ${
                form.type === o.value ? "border-brand-primary bg-brand-secondary/8" : "border-gray-300 hover:border-brand-primary"
              }`}
            >
              <input type="radio" name="manualAccountType" checked={form.type === o.value} onChange={() => setForm((f) => ({ ...f, type: o.value }))} className="accent-brand-primary" />
              <span className="flex items-center gap-2 text-gray-700 font-[600] sm:text-[14px] text-[12px]">
                <span className="text-brand-primary">{o.icon}</span>
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Card title="Billing Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Address" className="sm:col-span-2">
            <input className={inputCls} value={form.billing.address} onChange={(e) => patch("billing", { address: e.target.value })} placeholder="Building, street, area" />
          </Field>
          <Field label="Pincode">
            <input className={inputCls} inputMode="numeric" maxLength={6} value={form.billing.pincode} onChange={(e) => patch("billing", { pincode: e.target.value.replace(/\D/g, "") })} />
          </Field>
          <Field label="City">
            <input className={inputCls} value={form.billing.city} onChange={(e) => patch("billing", { city: e.target.value })} />
          </Field>
          <Field label="State">
            <input className={inputCls} value={form.billing.state} onChange={(e) => patch("billing", { state: e.target.value })} />
          </Field>
        </div>
      </Card>

      {isCompany && (
        <Card title="GST Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="GSTIN">
              <input className={`${inputCls} uppercase`} maxLength={15} value={form.gstin} onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))} placeholder="15-character GSTIN" />
            </Field>
            <FileInput label="GST Registration Certificate" file={form.gstCert} onChange={(file) => setForm((f) => ({ ...f, gstCert: file }))} />
          </div>
        </Card>
      )}

      <Card title="PAN Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="PAN Number">
            <input className={`${inputCls} uppercase`} maxLength={10} value={form.pan.number} onChange={(e) => patch("pan", { number: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder="ABCDE1234F" />
          </Field>
          <Field label="Name as on PAN">
            <input className={inputCls} value={form.pan.name} onChange={(e) => patch("pan", { name: e.target.value })} />
          </Field>
          <Field label={isCompany ? "Date of Incorporation" : "Date of Birth"}>
            <input type="date" max={today()} className={inputCls} value={form.pan.date} onChange={(e) => patch("pan", { date: e.target.value })} />
          </Field>
          <FileInput label="PAN Card" file={form.pan.card} onChange={(file) => patch("pan", { card: file })} />
        </div>
      </Card>

      <Card title="Aadhaar Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Aadhaar Number">
            <input className={inputCls} inputMode="numeric" maxLength={12} value={form.aadhaar.number} onChange={(e) => patch("aadhaar", { number: e.target.value.replace(/\D/g, "") })} placeholder="12-digit number" />
          </Field>
          <Field label="Name as on Aadhaar">
            <input className={inputCls} value={form.aadhaar.name} onChange={(e) => patch("aadhaar", { name: e.target.value })} />
          </Field>
          <Field label="Guardian Name (S/O, D/O, W/O)">
            <input className={inputCls} value={form.aadhaar.guardianName} onChange={(e) => patch("aadhaar", { guardianName: e.target.value })} />
          </Field>
          <Field label="Date of Birth">
            <input type="date" max={today()} className={inputCls} value={form.aadhaar.dob} onChange={(e) => patch("aadhaar", { dob: e.target.value })} />
          </Field>
          <Field label="Address as on Aadhaar" className="sm:col-span-2">
            <input className={inputCls} value={form.aadhaar.address} onChange={(e) => patch("aadhaar", { address: e.target.value })} />
          </Field>
          <Field label="Pincode">
            <input className={inputCls} inputMode="numeric" maxLength={6} value={form.aadhaar.pincode} onChange={(e) => patch("aadhaar", { pincode: e.target.value.replace(/\D/g, "") })} />
          </Field>
          <Field label="City">
            <input className={inputCls} value={form.aadhaar.city} onChange={(e) => patch("aadhaar", { city: e.target.value })} />
          </Field>
          <Field label="State">
            <input className={inputCls} value={form.aadhaar.state} onChange={(e) => patch("aadhaar", { state: e.target.value })} />
          </Field>
          <div className="hidden sm:block" />
          <FileInput label="Aadhaar Front" file={form.aadhaar.front} onChange={(file) => patch("aadhaar", { front: file })} />
          <FileInput label="Aadhaar Back" file={form.aadhaar.back} onChange={(file) => patch("aadhaar", { back: file })} />
        </div>
      </Card>

      <Card title="Bank Account Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Account Holder Name">
            <input className={inputCls} value={form.bank.holderName} onChange={(e) => patch("bank", { holderName: e.target.value })} />
          </Field>
          <Field label="Account Type">
            <select className={inputCls} value={form.bank.accountType} onChange={(e) => patch("bank", { accountType: e.target.value })}>
              <option value="current">Current</option>
              <option value="savings">Savings</option>
            </select>
          </Field>
          <Field label="Account Number">
            <input className={inputCls} maxLength={18} value={form.bank.accountNumber} onChange={(e) => patch("bank", { accountNumber: e.target.value.replace(/[^A-Za-z0-9]/g, "") })} />
          </Field>
          <Field label="Confirm Account Number">
            <input className={inputCls} maxLength={18} value={form.bank.confirmAccountNumber} onChange={(e) => patch("bank", { confirmAccountNumber: e.target.value.replace(/[^A-Za-z0-9]/g, "") })} />
          </Field>
          <Field label="IFSC Code">
            <input className={`${inputCls} uppercase`} maxLength={11} value={form.bank.ifsc} onChange={(e) => patch("bank", { ifsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder="HDFC0001234" />
          </Field>
          <Field label="Bank Name">
            <input className={inputCls} value={form.bank.bankName} onChange={(e) => patch("bank", { bankName: e.target.value })} />
          </Field>
          <Field label="Branch">
            <input className={inputCls} value={form.bank.branch} onChange={(e) => patch("bank", { branch: e.target.value })} />
          </Field>
          <Field label="Proof Document">
            <select className={inputCls} value={form.bank.proofType} onChange={(e) => patch("bank", { proofType: e.target.value })}>
              <option value="cheque">Cancelled cheque</option>
              <option value="statement">Bank statement</option>
            </select>
          </Field>
          <FileInput label={form.bank.proofType === "cheque" ? "Cancelled Cheque" : "Bank Statement"} file={form.bank.proof} onChange={(file) => patch("bank", { proof: file })} />
        </div>
      </Card>

      <label className="flex items-start gap-2 text-[12px] font-[500] text-gray-600 cursor-pointer">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 accent-brand-primary" />
        I confirm that the details and documents above are correct and belong to me / my business.
      </label>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-brand-primary text-white text-[13px] font-[600] px-6 py-2.5 rounded-lg disabled:opacity-60"
        >
          <CheckCircle2 size={16} /> {submitting ? "Submitting…" : "Submit for Verification"}
        </button>
      </div>
    </div>
  );
}
