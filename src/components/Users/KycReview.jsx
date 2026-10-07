import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { X, FileText, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import ThreeDotLoader from "../../Loader";
import { Notification } from "../../Notification";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];
const PAGE_SIZE = 20;

const headers = () => ({ Authorization: `Bearer ${Cookies.get("session")}` });
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const errorMessage = (err, fallback) => err?.response?.data?.message || fallback;
const isImage = (url) => /\.(png|jpe?g)(\?|$)/i.test(url || "");

function Field({ label, value, wide }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-[700] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-[13px] font-[500] text-gray-800 break-words">{value || "—"}</p>
    </div>
  );
}

function Doc({ label, url }) {
  if (!url) return null;
  return (
    <div className="border border-gray-200 rounded-lg p-2.5">
      <p className="text-[11px] font-[600] text-gray-500 mb-1.5">{label}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {isImage(url) ? (
          <img src={url} alt={label} className="w-full h-36 object-contain rounded bg-gray-50" />
        ) : (
          <div className="w-full h-36 rounded bg-gray-50 flex flex-col items-center justify-center gap-1.5 text-gray-500">
            <FileText size={26} className="text-red-600" />
            <span className="text-[12px] font-[600]">Open PDF</span>
          </div>
        )}
      </a>
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-[600] text-brand-primary hover:underline">
        Open full size <ExternalLink size={11} />
      </a>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-[13px] font-[700] text-gray-800 mb-3">{title}</h3>
      {children}
    </section>
  );
}

// Admin screen for MANUAL KYC requests: check the uploaded documents against the typed details, then approve or reject.
export default function KycReview() {
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${REACT_APP_BACKEND_URL}/kyc-review`, {
        headers: headers(),
        params: { status, search: appliedSearch, page, limit: PAGE_SIZE },
      });
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
      setCounts(res.data.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setRows([]);
      Notification(errorMessage(err, "Could not load KYC requests"), "error");
    } finally {
      setLoading(false);
    }
  }, [status, appliedSearch, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!openId) { setDetail(null); return undefined; }
    let cancelled = false;
    setDetailLoading(true);
    setRejecting(false);
    setReason("");
    axios
      .get(`${REACT_APP_BACKEND_URL}/kyc-review/${openId}`, { headers: headers() })
      .then((res) => { if (!cancelled) setDetail(res.data.data); })
      .catch((err) => { if (!cancelled) { Notification(errorMessage(err, "Could not open this request"), "error"); setOpenId(null); } })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [openId]);

  const closeDetail = () => { if (!acting) setOpenId(null); };

  const decide = async (action) => {
    if (!detail || acting) return;
    if (action === "reject" && reason.trim().length < 3) {
      return Notification("Enter the reason for rejecting, so the seller knows what to fix.", "warning");
    }
    setActing(true);
    try {
      const res = await axios.post(
        `${REACT_APP_BACKEND_URL}/kyc-review/${detail._id}/${action}`,
        action === "reject" ? { reason: reason.trim() } : {},
        { headers: headers() }
      );
      Notification(res.data?.message || (action === "approve" ? "KYC approved." : "KYC rejected."), "success");
      setOpenId(null);
      load();
    } catch (err) {
      Notification(errorMessage(err, "Could not save your decision. Please try again."), "error");
      // A 409 means someone else decided first: refresh so the list shows the current state.
      if (err?.response?.status === 409) { setOpenId(null); load(); }
    } finally {
      setActing(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="w-full p-2 sm:p-4">
      <h1 className="text-[18px] font-[700] text-gray-800">KYC Review</h1>
      <p className="text-[12px] font-[500] text-gray-500 mt-1 mb-4">
        Manual KYC requests uploaded by sellers. Open one to check the documents against the details, then approve or reject it.
      </p>

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-4 pt-2 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setStatus(t.id); setPage(1); }}
                className={`px-3.5 py-2.5 text-[13px] font-[700] whitespace-nowrap border-b-2 ${status === t.id ? "border-brand-primary text-brand-primary" : "border-transparent text-gray-500 hover:text-gray-800"}`}
              >
                {t.label} <span className="ml-1 text-[11px] font-[600] text-gray-400">{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <form
            className="md:w-72 mb-2 md:mb-0"
            onSubmit={(e) => { e.preventDefault(); setPage(1); setAppliedSearch(search.trim()); }}
          >
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (!e.target.value.trim() && appliedSearch) { setPage(1); setAppliedSearch(""); } }}
              placeholder="Search name, email, phone or user ID"
              className="w-full border border-gray-300 rounded-full px-4 py-1.5 text-[12px] font-[500] focus:outline-none focus:border-brand-primary"
            />
          </form>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><ThreeDotLoader /></div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-[13px] font-[500] text-gray-400">
            {appliedSearch ? "No requests match your search." : `No ${status} KYC requests.`}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => (
              <li key={r._id}>
                <button type="button" onClick={() => setOpenId(r._id)} className="w-full text-left px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-[700] text-gray-800 truncate">
                      {r.user?.fullname || "Unknown seller"} <span className="text-[11px] font-[600] text-gray-400">{r.user?.userId ? `#${r.user.userId}` : ""}</span>
                    </p>
                    <p className="text-[12px] font-[500] text-gray-500 truncate">{r.user?.email} · {r.user?.phoneNumber}</p>
                  </div>
                  <span className="text-[10px] font-[700] uppercase text-gray-600 bg-gray-100 px-2 py-0.5 rounded self-start sm:self-auto">{r.businessType}</span>
                  <div className="text-[12px] font-[500] text-gray-500 sm:text-right sm:w-40">
                    <p>Submitted {fmtDate(r.submittedAt)}</p>
                    {r.status !== "pending" && <p className="text-[11px]">{r.status === "approved" ? "Approved" : "Rejected"} {fmtDate(r.reviewedAt)}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {total > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-[12px] font-[500] text-gray-500">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40">Prev</button>
              <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {openId && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={closeDetail} />
          <div className="relative w-full max-w-3xl bg-white h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[15px] font-[700] text-gray-800 truncate">{detail?.user?.fullname || "KYC request"}</h2>
                {detail && <p className="text-[12px] font-[500] text-gray-500 truncate">{detail.user?.email} · {detail.user?.phoneNumber}</p>}
              </div>
              <button type="button" onClick={closeDetail} aria-label="Close" className="p-1.5 rounded hover:bg-gray-100 shrink-0"><X size={16} /></button>
            </div>

            {detailLoading || !detail ? (
              <div className="py-24 flex justify-center"><ThreeDotLoader /></div>
            ) : (
              <div className="p-4 sm:p-6 space-y-4">
                {detail.status === "rejected" && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-[500] text-red-700">
                    <p className="font-[700]">Rejected {fmtDate(detail.reviewedAt)}{detail.reviewedBy ? ` by ${detail.reviewedBy}` : ""}</p>
                    <p className="mt-0.5 break-words">Reason: {detail.rejectionReason}</p>
                  </div>
                )}
                {detail.status === "approved" && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[12px] font-[700] text-green-700">
                    Approved {fmtDate(detail.reviewedAt)}{detail.reviewedBy ? ` by ${detail.reviewedBy}` : ""}
                  </div>
                )}

                <Section title="Business">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Type" value={detail.businessType === "company" ? "Company" : "Individual"} />
                    <Field label="Submitted" value={fmtDate(detail.submittedAt)} />
                    <Field label="Email" value={detail.email} />
                    <Field label="Phone" value={detail.phoneNumber} />
                    {detail.gst?.number && <Field label="GSTIN" value={detail.gst.number} />}
                    <Field label="Billing address" value={[detail.billing?.address, detail.billing?.city, detail.billing?.state, detail.billing?.pincode].filter(Boolean).join(", ")} wide />
                  </div>
                  {detail.documents.gstCertificate && <div className="mt-3 max-w-xs"><Doc label="GST certificate" url={detail.documents.gstCertificate} /></div>}
                </Section>

                <Section title="PAN">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="PAN number" value={detail.pan.number} />
                    <Field label="Name on PAN" value={detail.pan.name} />
                    <Field label={detail.businessType === "company" ? "Date of incorporation" : "Date of birth"} value={fmtDate(detail.pan.date)} />
                  </div>
                  <div className="mt-3 max-w-xs"><Doc label="PAN card" url={detail.documents.panCard} /></div>
                </Section>

                <Section title="Aadhaar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Aadhaar number" value={detail.aadhaar.number} />
                    <Field label="Name" value={detail.aadhaar.name} />
                    <Field label="Guardian name" value={detail.aadhaar.guardianName} />
                    <Field label="Date of birth" value={fmtDate(detail.aadhaar.dob)} />
                    <Field label="Address" value={[detail.aadhaar.address, detail.aadhaar.city, detail.aadhaar.state, detail.aadhaar.pincode].filter(Boolean).join(", ")} wide />
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Doc label="Aadhaar front" url={detail.documents.aadhaarFront} />
                    <Doc label="Aadhaar back" url={detail.documents.aadhaarBack} />
                  </div>
                </Section>

                <Section title="Bank account">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Account holder" value={detail.bank.holderName} />
                    <Field label="Account number" value={detail.bank.accountNumber} />
                    <Field label="IFSC" value={detail.bank.ifsc} />
                    <Field label="Bank / branch" value={[detail.bank.bankName, detail.bank.branch].filter(Boolean).join(" · ")} />
                    <Field label="Account type" value={detail.bank.accountType} />
                    <Field label="Proof" value={detail.bank.proofType === "cheque" ? "Cancelled cheque" : "Bank statement"} />
                  </div>
                  <div className="mt-3 max-w-xs"><Doc label="Bank proof" url={detail.documents.bankProof} /></div>
                </Section>

                <p className="text-[11px] font-[500] text-gray-400">Document links open for {detail.documentLinksExpireInMinutes} minutes. Reopen this request for fresh links.</p>

                {detail.status === "pending" && (
                  <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3.5 bg-white border-t border-gray-100">
                    {rejecting ? (
                      <div className="space-y-2.5">
                        <label className="block text-[12px] font-[600] text-gray-700">Reason for rejecting (the seller will see this)</label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          maxLength={500}
                          rows={3}
                          autoFocus
                          placeholder="e.g. PAN card photo is blurry, please upload a clear copy"
                          className="w-full border border-gray-300 rounded-lg p-3 text-[13px] font-[500] focus:outline-none focus:border-red-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button type="button" disabled={acting} onClick={() => { setRejecting(false); setReason(""); }} className="px-4 py-2 rounded-lg border border-gray-300 text-[13px] font-[600] text-gray-600 disabled:opacity-50">Cancel</button>
                          <button type="button" disabled={acting || reason.trim().length < 3} onClick={() => decide("reject")} className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[13px] font-[600] disabled:opacity-50 inline-flex items-center gap-1.5">
                            <XCircle size={15} /> {acting ? "Rejecting…" : "Confirm reject"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button type="button" disabled={acting} onClick={() => setRejecting(true)} className="px-5 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-[13px] font-[600] disabled:opacity-50">Reject</button>
                        <button type="button" disabled={acting} onClick={() => decide("approve")} className="px-5 py-2 rounded-lg bg-brand-primary text-white text-[13px] font-[600] disabled:opacity-50 inline-flex items-center gap-1.5">
                          <CheckCircle2 size={15} /> {acting ? "Approving…" : "Approve KYC"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
