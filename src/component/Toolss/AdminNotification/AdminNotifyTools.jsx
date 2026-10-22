import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Send, Users, X, Mail, MessageSquare, Search, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

// Admin-only notification tools, same features as QuickPost's notification page:
//   SendAlertModal  — one custom alert to one user / one email / everyone (Email, WhatsApp or SMS)
//   BulkNotifyModal — Email and/or WhatsApp to many sellers, picked by filter or by hand (free for the seller)
//   CustomAlertLogs — every alert sent with Send Alert / Bulk Notify
// Backend: /notification/sendCustomAlert, /notification/bulkNotify/*, /notification/customAlertLogs,
// /notification/uploadImage — all admin / employee only.

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => ({ Authorization: `Bearer ${Cookies.get("session")}` });

const inputCls =
  "w-full h-9 px-3 rounded-lg border border-gray-300 text-[12px] focus:outline-none focus:border-brand-primary bg-white";
const labelCls = "block text-[11px] font-[700] text-gray-600 mb-1 uppercase tracking-wide";

const ResultBox = ({ result }) =>
  result ? (
    <div
      className={`flex items-center gap-2 text-[12px] font-[600] p-2.5 rounded-lg ${
        result.ok ? "bg-brand-secondary/10 text-brand-primary" : "bg-red-50 text-red-600"
      }`}
    >
      {result.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {result.text}
    </div>
  ) : null;

const ModalShell = ({ title, icon, onClose, wide, children, footer }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div
      className={`relative z-10 w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col animate-popup-in`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 shrink-0">
        <h3 className="text-[14px] font-[700] text-gray-700 flex items-center gap-2">
          {icon} {title}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto">{children}</div>
      <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50 shrink-0">{footer}</div>
    </div>
  </div>
);

// ─── Image for WhatsApp (uploaded, then sent as a public URL) ─────────────────
export const ImageUploadField = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png"].includes(file.type)) return setError("Only JPG or PNG images are allowed");
    if (file.size > 5 * 1024 * 1024) return setError("Image must be 5 MB or smaller");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await axios.post(`${REACT_APP_BACKEND_URL}/notification/uploadImage`, form, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });
      onChange(res.data.imageUrl);
    } catch (e) {
      setError(e?.response?.data?.error || "Image upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className={labelCls}>
        Image <span className="normal-case font-[500] text-gray-400">(optional · JPG or PNG, max 5 MB)</span>
      </label>
      {value ? (
        <div className="flex items-center gap-3 p-2 rounded-lg border border-gray-200">
          <img src={value} alt="Selected" className="w-12 h-12 rounded object-cover border" />
          <span className="text-[12px] text-gray-500 flex-1 truncate">Image attached</span>
          <button type="button" onClick={() => onChange("")} className="text-[12px] font-[700] text-red-600 hover:underline">
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-9 rounded-lg border border-dashed border-gray-300 text-[12px] font-[600] text-gray-500 hover:border-brand-primary hover:text-brand-primary disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Choose image to upload"}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  );
};

// ─── Send Alert ───────────────────────────────────────────────────────────────
export const SendAlertModal = ({ open, onClose, targetUserId }) => {
  const [recipientType, setRecipientType] = useState("all");
  const [channel, setChannel] = useState("Email");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setRecipientType(targetUserId ? "specific" : "all");
      setChannel("Email");
      setTitle("");
      setMessage("");
      setEmail("");
      setImageUrl("");
      setResult(null);
    }
  }, [open, targetUserId]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return setResult({ ok: false, text: "Title and message are required" });
    if (recipientType === "specific" && !targetUserId && !email.trim()) {
      return setResult({ ok: false, text: "Enter the recipient's email address" });
    }
    setLoading(true);
    setResult(null);
    try {
      const body = { channel, title, message, recipientType };
      if (channel === "WhatsApp" && imageUrl.trim()) body.imageUrl = imageUrl.trim();
      if (recipientType === "specific") {
        if (targetUserId) body.targetUserId = targetUserId;
        else body.targetEmail = email.trim();
      }
      const res = await axios.post(`${REACT_APP_BACKEND_URL}/notification/sendCustomAlert`, body, { headers: authHeaders() });
      setResult({ ok: true, text: res.data?.message || "Alert sent!" });
      setTimeout(() => onClose(), 2000);
    } catch (e) {
      setResult({ ok: false, text: e?.response?.data?.error || "Failed to send alert" });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <ModalShell
      title="Send Custom Alert"
      icon={<Send className="w-4 h-4 text-brand-primary" />}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-[12px] font-[600] text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-brand-primary text-white text-[12px] font-[600] hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? "Sending…" : "Dispatch Alert"}
          </button>
        </>
      }
    >
      <div>
        <label className={labelCls}>Recipient</label>
        <div className="flex gap-4 flex-wrap">
          {[
            ["all", "Broadcast (All Users)"],
            ["specific", targetUserId ? "Selected User" : "Specific Email"],
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-1.5 text-[12px] font-[600] text-gray-600 cursor-pointer">
              <input type="radio" checked={recipientType === v} onChange={() => setRecipientType(v)} className="accent-brand-primary" />
              {l}
            </label>
          ))}
        </div>
      </div>
      {recipientType === "specific" && !targetUserId && (
        <div>
          <label className={labelCls}>Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="recipient@example.com" className={inputCls} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Channel</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inputCls}>
            <option value="Email">Email (Free)</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="SMS">SMS</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Title / Subject</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Alert title…" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Write your alert message here…"
          className="w-full p-2.5 rounded-lg border border-gray-300 text-[12px] focus:outline-none focus:border-brand-primary resize-none"
        />
      </div>
      {channel === "WhatsApp" && <ImageUploadField value={imageUrl} onChange={setImageUrl} />}
      <ResultBox result={result} />
    </ModalShell>
  );
};

// ─── Bulk Notify ──────────────────────────────────────────────────────────────
export const BulkNotifyModal = ({ open, onClose }) => {
  const [target, setTarget] = useState("all");
  const [kycStatus, setKycStatus] = useState("");
  const [balanceType, setBalanceType] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState(null);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  const [channels, setChannels] = useState({ email: true, whatsapp: false });
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [whatsappTitle, setWhatsappTitle] = useState("");
  const [whatsappBody, setWhatsappBody] = useState("");
  const [whatsappImageUrl, setWhatsappImageUrl] = useState("");

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setTarget("all");
    setKycStatus("");
    setBalanceType("");
    setUserQuery("");
    setUserSuggestions([]);
    setSelectedUsers([]);
    setPreviewCount(null);
    setChannels({ email: true, whatsapp: false });
    setEmailSubject("");
    setEmailBody("");
    setWhatsappTitle("");
    setWhatsappBody("");
    setWhatsappImageUrl("");
    setResult(null);
  }, [open]);

  // user search for "Select Users"
  useEffect(() => {
    if (target !== "selected" || userQuery.trim().length < 2) {
      setUserSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${REACT_APP_BACKEND_URL}/admin/searchUser?query=${encodeURIComponent(userQuery)}`, {
          headers: authHeaders(),
        });
        setUserSuggestions(res.data.users || []);
      } catch {
        setUserSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery, target]);

  // live count of matching users whenever the targeting changes
  useEffect(() => {
    if (!open) return;
    if (target === "selected" && selectedUsers.length === 0) {
      setPreviewCount(0);
      return;
    }
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const body = { target };
        if (target === "filtered") {
          body.kycStatus = kycStatus || undefined;
          body.balanceType = balanceType || undefined;
        }
        if (target === "selected") body.userIds = selectedUsers.map((u) => u._id);
        const res = await axios.post(`${REACT_APP_BACKEND_URL}/notification/bulkNotify/preview`, body, { headers: authHeaders() });
        setPreviewCount(res.data?.count ?? 0);
        setWhatsappEnabled(!!res.data?.whatsappEnabled);
      } catch {
        setPreviewCount(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [open, target, kycStatus, balanceType, selectedUsers]);

  const addUser = (u) => {
    if (selectedUsers.some((s) => s._id === u._id)) return;
    setSelectedUsers((prev) => [...prev, { _id: u._id, fullname: u.fullname || "User", email: u.email || "" }]);
    setUserQuery("");
    setUserSuggestions([]);
  };
  const removeUser = (id) => setSelectedUsers((prev) => prev.filter((u) => u._id !== id));

  const canSend =
    (channels.email || channels.whatsapp) &&
    (!channels.email || (emailSubject.trim() && emailBody.trim())) &&
    (!channels.whatsapp || whatsappBody.trim()) &&
    (previewCount ?? 0) > 0;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setResult(null);
    try {
      const body = { target, channels: [channels.email && "email", channels.whatsapp && "whatsapp"].filter(Boolean) };
      if (target === "filtered") {
        body.kycStatus = kycStatus || undefined;
        body.balanceType = balanceType || undefined;
      }
      if (target === "selected") body.userIds = selectedUsers.map((u) => u._id);
      if (channels.email) {
        body.emailSubject = emailSubject;
        body.emailBody = emailBody;
      }
      if (channels.whatsapp) {
        body.whatsappBody = whatsappBody;
        if (whatsappTitle.trim()) body.whatsappTitle = whatsappTitle.trim();
        if (whatsappImageUrl.trim()) body.imageUrl = whatsappImageUrl.trim();
      }
      const res = await axios.post(`${REACT_APP_BACKEND_URL}/notification/bulkNotify/send`, body, { headers: authHeaders() });
      setResult({ ok: true, text: res.data?.message || "Bulk notification started!" });
      setTimeout(() => onClose(), 2500);
    } catch (e) {
      setResult({ ok: false, text: e?.response?.data?.error || "Failed to send bulk notification" });
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;
  return (
    <ModalShell
      title="Bulk Notify Sellers"
      icon={<Users className="w-4 h-4 text-brand-primary" />}
      onClose={onClose}
      wide
      footer={
        <>
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-[12px] font-[600] text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend || sending}
            className="px-3 py-2 rounded-lg bg-brand-primary text-white text-[12px] font-[600] hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? "Sending…" : `Send to ${previewCount ?? 0} User(s)`}
          </button>
        </>
      }
    >
      <div>
        <label className={labelCls}>Recipients</label>
        <div className="flex gap-4 flex-wrap">
          {[
            ["all", "All Users"],
            ["filtered", "Filter"],
            ["selected", "Select Users"],
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-1.5 text-[12px] font-[600] text-gray-600 cursor-pointer">
              <input type="radio" checked={target === v} onChange={() => setTarget(v)} className="accent-brand-primary" />
              {l}
            </label>
          ))}
        </div>
      </div>

      {target === "filtered" && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border">
          <div>
            <label className={labelCls}>KYC Status</label>
            <select value={kycStatus} onChange={(e) => setKycStatus(e.target.value)} className={inputCls}>
              <option value="">Any</option>
              <option value="pending">KYC Pending</option>
              <option value="verified">KYC Verified</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Wallet Balance</label>
            <select value={balanceType} onChange={(e) => setBalanceType(e.target.value)} className={inputCls}>
              <option value="">Any</option>
              <option value="negative">Negative Balance</option>
              <option value="zero">Zero Balance</option>
              <option value="positive">Positive Balance</option>
            </select>
          </div>
        </div>
      )}

      {target === "selected" && (
        <div className="p-3 bg-gray-50 rounded-lg border space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className={`${inputCls} pl-8`}
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {userSuggestions.length > 0 && (
              <div className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-xl z-50 w-full max-h-48 overflow-y-auto py-1">
                {userSuggestions.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => addUser(u)}
                    className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-brand-secondary/8 flex flex-col"
                  >
                    <span className="font-[600]">{u.fullname}</span>
                    <span className="text-gray-400">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {selectedUsers.length === 0 ? (
              <p className="text-center text-[12px] text-gray-400 italic py-2">No users selected</p>
            ) : (
              selectedUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-2 bg-white border rounded-lg text-[12px]">
                  <div className="min-w-0">
                    <div className="font-[700] text-gray-700 truncate">{u.fullname}</div>
                    <div className="text-gray-400 truncate">{u.email}</div>
                  </div>
                  <button onClick={() => removeUser(u._id)} className="ml-2 text-gray-400 hover:text-red-500 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[12px] font-[600] text-gray-700 bg-brand-secondary/8 border border-brand-secondary/20 rounded-lg px-3 py-2">
        <Users className="w-3.5 h-3.5 text-brand-primary shrink-0" />
        {previewLoading ? "Counting matching users…" : previewCount === null ? "—" : `${previewCount} user(s) will be notified`}
      </div>

      <div>
        <label className={labelCls}>Channels</label>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 text-[12px] font-[600] text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={channels.email}
              onChange={(e) => setChannels((c) => ({ ...c, email: e.target.checked }))}
              className="accent-brand-primary"
            />
            <Mail className="w-3.5 h-3.5" /> Email
          </label>
          <label
            className={`flex items-center gap-1.5 text-[12px] font-[600] ${whatsappEnabled ? "text-gray-600 cursor-pointer" : "text-gray-300 cursor-not-allowed"}`}
            title={whatsappEnabled ? undefined : "WhatsApp broadcast template not approved yet"}
          >
            <input
              type="checkbox"
              checked={channels.whatsapp}
              disabled={!whatsappEnabled}
              onChange={(e) => setChannels((c) => ({ ...c, whatsapp: e.target.checked }))}
              className="accent-brand-primary"
            />
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp {!whatsappEnabled && "(pending template approval)"}
          </label>
        </div>
      </div>

      {channels.email && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Email Subject</label>
            <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject…" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email Body</label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={4}
              placeholder="Write the email…"
              className="w-full p-2.5 rounded-lg border border-gray-300 text-[12px] focus:outline-none focus:border-brand-primary resize-none"
            />
          </div>
        </div>
      )}

      {channels.whatsapp && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>WhatsApp Title</label>
            <input
              value={whatsappTitle}
              onChange={(e) => setWhatsappTitle(e.target.value)}
              placeholder="e.g. Recharge Offer (defaults to the email subject)"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>WhatsApp Message</label>
            <textarea
              value={whatsappBody}
              onChange={(e) => setWhatsappBody(e.target.value)}
              rows={3}
              placeholder="Write the WhatsApp message…"
              className="w-full p-2.5 rounded-lg border border-gray-300 text-[12px] focus:outline-none focus:border-brand-primary resize-none"
            />
          </div>
          <ImageUploadField value={whatsappImageUrl} onChange={setWhatsappImageUrl} />
        </div>
      )}

      <ResultBox result={result} />
    </ModalShell>
  );
};

// ─── Alert Logs ───────────────────────────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export const CustomAlertLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expanded, setExpanded] = useState(null);
  const LIMIT = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (channelFilter) params.channel = channelFilter;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.fromDate = new Date(fromDate).toISOString();
      if (toDate) params.toDate = new Date(`${toDate}T23:59:59`).toISOString();
      const res = await axios.get(`${REACT_APP_BACKEND_URL}/notification/customAlertLogs`, { headers: authHeaders(), params });
      setLogs(res.data?.logs || []);
      setTotalPages(res.data?.totalPages || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, channelFilter, statusFilter, fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const anyFilter = !!(channelFilter || statusFilter || fromDate || toDate);
  const clearFilters = () => {
    setChannelFilter("");
    setStatusFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };
  const recipientLabel = (log) => {
    if (log.recipientType === "all") return "All Users (Broadcast)";
    if (log.recipientType === "filtered") return "Filtered Users";
    if (log.recipientType === "selected") return "Selected Users";
    return log.targetUserName || log.targetEmail || "Specific User";
  };
  const statusCls = (s) =>
    s === "success" ? "bg-brand-secondary/10 text-brand-primary border-brand-secondary/30" : "bg-red-50 text-red-500 border-red-200";
  const selectCls = "h-9 px-2 text-[12px] rounded-lg border border-gray-300 focus:outline-none focus:border-brand-primary bg-white";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-[12px] font-[600] text-orange-600">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Admin-only log of every alert sent with Send Alert and Bulk Notify.
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select value={channelFilter} onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All Channels</option>
          <option value="Email">Email</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="SMS">SMS</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className={`${selectCls} px-3`} />
        <span className="text-[12px] text-gray-400">to</span>
        <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className={`${selectCls} px-3`} />
        <button
          onClick={fetchLogs}
          title="Refresh"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:text-brand-primary hover:border-brand-primary"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
        {anyFilter && (
          <button onClick={clearFilters} className="text-[12px] font-[700] text-red-500 hover:underline px-1">
            Clear
          </button>
        )}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-[12px] min-w-[800px]">
            <thead className="bg-brand-primary text-white">
              <tr>
                <th className="px-3 py-2 w-32">Sent At</th>
                <th className="px-3 py-2 w-24">Channel</th>
                <th className="px-3 py-2 w-44">Recipient</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2 w-20 text-center">Sent To</th>
                <th className="px-3 py-2 w-24 text-center">Status</th>
                <th className="px-3 py-2 w-32">Sent By</th>
                <th className="px-3 py-2 w-16 text-center">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading alert logs…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No custom alerts sent yet</td></tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log._id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="font-[600] text-gray-700">{fmtDate(log.createdAt)}</div>
                        <div className="text-[10px] text-gray-400">{fmtTime(log.createdAt)}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-600 font-[600]">{log.channel}</td>
                      <td className="px-3 py-2">
                        <div className="font-[600] text-gray-700 truncate max-w-[160px]" title={recipientLabel(log)}>{recipientLabel(log)}</div>
                      </td>
                      <td className="px-3 py-2 max-w-[200px]">
                        <div className="font-[700] text-gray-700 truncate" title={log.title}>{log.title}</div>
                      </td>
                      <td className="px-3 py-2 text-center font-[700] text-gray-700">{log.sentCount}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-[700] border ${statusCls(log.status)}`}>{log.status}</span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-gray-500 truncate max-w-[120px]" title={log.sentBy}>{log.sentBy || "—"}</td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => setExpanded(expanded === log._id ? null : log._id)} className="text-brand-primary font-[700]">
                          {expanded === log._id ? "▲" : "▼"}
                        </button>
                      </td>
                    </tr>
                    {expanded === log._id && (
                      <tr>
                        <td colSpan={8} className="px-4 py-3 bg-gray-50">
                          <div className="text-[11px] font-[700] text-gray-500 mb-1 uppercase">Message Body</div>
                          <div className="bg-white rounded-lg border p-2.5 text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">{log.message}</div>
                          {log.errorMessage && (
                            <div className="mt-2 text-red-500 font-[600] flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> {log.errorMessage}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="text-center py-8 text-[12px] text-gray-400">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-[12px] text-gray-400">No custom alerts sent yet</div>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="p-3 space-y-1.5 text-[11px]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[12px] font-[700] text-gray-700 truncate">{log.title}</div>
                    <div className="text-[10px] text-gray-400">
                      {fmtDate(log.createdAt)} · {log.channel} · by {log.sentBy || "—"}
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-[700] border ${statusCls(log.status)}`}>{log.status}</span>
                </div>
                <div className="text-gray-500">
                  <span className="font-[600]">{recipientLabel(log)}</span> · {log.sentCount} sent
                </div>
                <button onClick={() => setExpanded(expanded === log._id ? null : log._id)} className="font-[700] text-brand-primary">
                  {expanded === log._id ? "Hide message ▲" : "View message ▼"}
                </button>
                {expanded === log._id && (
                  <div className="bg-gray-50 rounded-lg border p-2.5 text-gray-700 whitespace-pre-wrap">{log.message}</div>
                )}
                {log.errorMessage && <div className="text-red-400 font-[600]">{log.errorMessage}</div>}
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-2.5 border-t text-[12px]">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 font-[700] border rounded-lg disabled:opacity-40">
              ← Prev
            </button>
            <span className="text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 font-[700] border rounded-lg disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
