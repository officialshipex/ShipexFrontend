import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { ScanLine, FileText, Check, Clock, XCircle } from "lucide-react";
import Kyc from "./Kyc";
import ManualKyc from "./ManualKyc";
import ThreeDotLoader from "../Loader";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const METHODS = [
  {
    id: "EKYC",
    title: "E-KYC",
    description: "Get KYC verified within a minute",
    icon: <ScanLine size={20} />,
    requirements: ["Aadhaar & PAN number", "GSTIN (if registered)", "Bank account details"],
  },
  {
    id: "MANUAL",
    title: "Manual KYC",
    description: "KYC verification might take 2-3 business days",
    icon: <FileText size={20} />,
    requirements: ["Aadhaar & PAN card", "GST certificate (if registered)", "Cancelled cheque"],
  },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

// The seller's KYC page. Which routes it offers comes from the company's setting (QuickPost > Companies > KYC
// methods): only e-KYC (the page exactly as it always was), only manual KYC, or a choice between the two.
// If the status cannot be read, it falls back to the existing e-KYC page rather than a blank screen.
export default function KycEntry() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState({ ekyc: true, manual: false });
  const [manual, setManual] = useState(null);
  const [method, setMethod] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${REACT_APP_BACKEND_URL}/getKyc/getKycStatus`, { headers: { Authorization: `Bearer ${Cookies.get("session")}` } })
      .then((res) => {
        if (cancelled) return;
        const m = { ekyc: res.data?.methods?.ekyc !== false, manual: res.data?.methods?.manual === true };
        if (!m.ekyc && !m.manual) m.ekyc = true;
        setMethods(m);
        const request = m.manual && !res.data?.isVerified ? res.data?.manual || null : null;
        setManual(request);
        if (request?.status !== "pending" && m.ekyc !== m.manual) setMethod(m.manual ? "MANUAL" : "EKYC");
      })
      .catch(() => { if (!cancelled) setMethod("EKYC"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-24">
        <ThreeDotLoader />
      </div>
    );
  }

  if (manual?.status === "pending") {
    return (
      <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-md p-6 sm:p-10 text-center mt-6">
        <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <Clock size={28} className="text-orange-600" />
        </div>
        <h2 className="text-[16px] font-[700] text-gray-800 mb-1.5">KYC Under Review</h2>
        <p className="text-[13px] font-[500] text-gray-500 leading-relaxed mb-5">
          We have received your details and documents{manual.submittedAt ? ` on ${fmtDate(manual.submittedAt)}` : ""}. Our team will verify them within
          2–3 business days and notify you by email.
        </p>
        <button type="button" onClick={() => navigate("/dashboard")} className="bg-brand-primary text-white text-[13px] font-[600] px-6 py-2.5 rounded-lg">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const both = methods.ekyc && methods.manual;
  const rejected = manual?.status === "rejected" ? (
    <div className="w-full mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
      <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
      <div className="min-w-0 text-[12px] font-[500] text-red-700">
        <p className="font-[700] text-[13px]">Your last manual KYC request was rejected</p>
        {manual.rejectionReason && <p className="mt-0.5 break-words">Reason: {manual.rejectionReason}</p>}
        <p className="mt-1 opacity-80">Please correct the details and submit again. Your documents need to be uploaded again.</p>
      </div>
    </div>
  ) : null;

  if (!method) {
    return (
      <div className="w-full max-w-4xl mx-auto p-2">
        {rejected}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-[15px] font-[700] text-gray-800">Complete Your KYC</h2>
            <p className="text-[12px] font-[500] text-gray-500 mt-1">Choose your preferred method to verify your identity and unlock full access</p>
          </div>
          <div role="radiogroup" aria-label="KYC method" className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {METHODS.map((m) => {
              const on = selected === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSelected(m.id)}
                  className={`text-left rounded-lg border p-4 transition-colors ${on ? "border-brand-primary ring-1 ring-brand-primary bg-brand-secondary/8" : "border-gray-300 hover:border-brand-primary"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${on ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-600"}`}>{m.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-[700] text-gray-800">
                        {m.title}
                        {m.id === "EKYC" && both && <span className="ml-2 text-[10px] font-[700] uppercase text-brand-primary bg-brand-secondary/10 px-1.5 py-0.5 rounded">Recommended</span>}
                      </p>
                      <p className="text-[12px] font-[500] text-gray-500 mt-0.5">{m.description}</p>
                    </div>
                  </div>
                  <ul className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                    {m.requirements.map((r) => (
                      <li key={r} className="flex items-center gap-2 text-[12px] font-[500] text-gray-600">
                        <Check size={14} className="text-brand-primary shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          <div className="px-4 sm:px-6 py-3.5 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              disabled={!selected}
              onClick={() => setMethod(selected)}
              className="bg-brand-primary text-white text-[13px] font-[600] px-6 py-2.5 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  const switchLink = both ? (
    <div className="w-full px-2 pt-2 text-[12px] font-[500] text-gray-500">
      {method === "EKYC" ? "Using e-KYC. " : "Using manual KYC. "}
      <button type="button" onClick={() => setMethod(null)} className="text-brand-primary font-[600] underline">
        Choose a different method
      </button>
    </div>
  ) : null;

  if (method === "MANUAL") {
    return (
      <>
        {switchLink}
        {rejected && <div className="px-2 pt-2">{rejected}</div>}
        <ManualKyc prefill={manual?.status === "rejected" ? manual.prefill : null} onSubmitted={() => setManual({ status: "pending", submittedAt: new Date().toISOString() })} />
      </>
    );
  }

  return (
    <>
      {switchLink}
      <Kyc />
    </>
  );
}
