// Settings -> Webhook -> "B2B API & Webhooks"
//   B2B API key: one permanent key per seller; it stays the same until it is regenerated or revoked here.
//   B2B webhooks (separate from the B2C webhooks on the other tabs):
//     Shipment Details — sent as soon as the AWB of a B2B order is assigned
//     Tracking         — sent on every tracking update of a B2B order
// Backend: /b2b-api (Shipex-backend API/B2B/b2bPanel.controller.js). Colours use the company's brand classes.
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import {
  FiKey, FiCopy, FiEye, FiEyeOff, FiRefreshCw, FiTrash2, FiPlay, FiCheck, FiX, FiPackage, FiMapPin, FiShield, FiCheckCircle, FiXCircle, FiBookOpen, FiDownload,
} from "react-icons/fi";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${Cookies.get("session")}` } });
const errText = (err, fallback) => err?.response?.data?.message || fallback;
const saveFile = (url, name) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
};
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const INPUT =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:border-brand-primary bg-white";
const LABEL = "block text-[10px] sm:text-[12px] font-[600] text-gray-600 mb-1";
const BTN_PRIMARY =
  "px-3 py-2 rounded-lg bg-brand-primary text-white text-[10px] sm:text-[12px] font-[600] flex items-center gap-1.5 hover:opacity-90 disabled:opacity-60";
const BTN_SECONDARY =
  "px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-[10px] sm:text-[12px] font-[600] flex items-center gap-1.5 hover:bg-brand-secondary/10 disabled:opacity-60";

const EVENTS = [
  {
    key: "shipment_details",
    title: "Shipment Details",
    description: "Sent as soon as the AWB of a B2B order is assigned (AWB, child AWBs, LRN, tracking link).",
    Icon: FiPackage,
  },
  {
    key: "tracking",
    title: "Tracking",
    description: "Sent on every tracking update of a B2B order (latest scan and full history).",
    Icon: FiMapPin,
  },
];

const SecretText = ({ value, preview }) => {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="text-[12px] text-gray-500 font-mono">{preview || "—"}</span>;
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-2 min-w-0">
      <code className="text-[11px] sm:text-[12px] text-gray-700 font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1 truncate">
        {shown ? value : preview || `${value.slice(0, 8)}${"•".repeat(12)}`}
      </code>
      <button type="button" onClick={() => setShown((v) => !v)} title={shown ? "Hide" : "Show"} className="text-gray-400 hover:text-brand-primary shrink-0">
        {shown ? <FiEyeOff /> : <FiEye />}
      </button>
      <button type="button" onClick={copy} title="Copy" className="text-gray-400 hover:text-brand-primary shrink-0">
        {copied ? <FiCheck className="text-brand-primary" /> : <FiCopy />}
      </button>
    </div>
  );
};

const WebhookCard = ({ meta, hook, onSaved }) => {
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [authType, setAuthType] = useState("none");
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [headerName, setHeaderName] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setUrl(hook?.url || "");
    setIsActive(hook ? hook.isActive : true);
    setAuthType(hook?.auth?.type || "none");
    setUsername(hook?.auth?.username || "");
    setHeaderName(hook?.auth?.headerName || "");
    setToken("");
    setPassword("");
    setHeaderValue("");
    setError("");
  }, [hook]);

  const keepsSecret = Boolean(hook?.auth?.hasSecret && hook.auth.type === authType);
  const secretPlaceholder = keepsSecret ? "Saved — leave blank to keep" : "";

  const save = async () => {
    if (!url.trim()) return setError("Enter the URL that should receive this webhook.");
    if (!/^https:\/\//i.test(url.trim())) return setError("The URL must start with https://");
    setBusy("save");
    setError("");
    try {
      await axios.put(
        `${BACKEND_URL}/b2b-api/webhooks/${meta.key}`,
        { url: url.trim(), isActive, auth: { type: authType, token, username, password, headerName, headerValue } },
        auth()
      );
      toast.success(`${meta.title} webhook saved`);
      onSaved();
    } catch (err) {
      setError(errText(err, "Could not save the webhook."));
    } finally {
      setBusy("");
    }
  };

  const test = async () => {
    setBusy("test");
    try {
      const res = await axios.post(`${BACKEND_URL}/b2b-api/webhooks/${meta.key}/test`, {}, auth());
      const d = res.data?.data;
      if (d?.delivered) toast.success(`Test delivered — HTTP ${d.httpStatus} in ${d.responseTime} ms`);
      else toast.error(`Test not delivered${d?.httpStatus ? ` — HTTP ${d.httpStatus}` : ""}${d?.error ? ` — ${d.error}` : ""}`);
      onSaved();
    } catch (err) {
      toast.error(errText(err, "Could not send the test."));
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    if (!window.confirm(`Remove the ${meta.title} webhook? Nothing will be sent to this URL any more.`)) return;
    setBusy("remove");
    try {
      await axios.delete(`${BACKEND_URL}/b2b-api/webhooks/${meta.key}`, auth());
      toast.success(`${meta.title} webhook removed`);
      onSaved();
    } catch (err) {
      toast.error(errText(err, "Could not remove the webhook."));
    } finally {
      setBusy("");
    }
  };

  const { Icon } = meta;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center shrink-0">
            <Icon />
          </div>
          <div>
            <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">{meta.title}</h3>
            <p className="text-[10px] sm:text-[12px] text-gray-500">{meta.description}</p>
          </div>
        </div>
        {hook && (
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-[600] ${hook.isActive ? "bg-brand-primary/10 text-brand-primary" : "bg-gray-100 text-gray-400"}`}>
            {hook.isActive ? "Active" : "Inactive"}
          </span>
        )}
      </div>

      <div>
        <label className={LABEL}>Callback URL <span className="text-red-500">*</span></label>
        <input className={INPUT} placeholder="https://your-domain.com/webhooks/b2b" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Authentication</label>
          <select className={INPUT} value={authType} onChange={(e) => setAuthType(e.target.value)}>
            <option value="none">None</option>
            <option value="bearer">Bearer token</option>
            <option value="basic">Basic (username + password)</option>
            <option value="header">Custom header</option>
          </select>
        </div>
        {authType === "bearer" && (
          <div>
            <label className={LABEL}>Token</label>
            <input className={INPUT} type="password" autoComplete="new-password" placeholder={secretPlaceholder || "Token your endpoint expects"} value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
        )}
        {authType === "header" && (
          <div>
            <label className={LABEL}>Header name</label>
            <input className={INPUT} placeholder="X-Api-Key" value={headerName} onChange={(e) => setHeaderName(e.target.value)} />
          </div>
        )}
        {authType === "basic" && (
          <div>
            <label className={LABEL}>Username</label>
            <input className={INPUT} autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
        )}
      </div>
      {authType === "basic" && (
        <div>
          <label className={LABEL}>Password</label>
          <input className={INPUT} type="password" autoComplete="new-password" placeholder={secretPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      )}
      {authType === "header" && (
        <div>
          <label className={LABEL}>Header value</label>
          <input className={INPUT} type="password" autoComplete="new-password" placeholder={secretPlaceholder} value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-[12px] font-[600] text-gray-600">Send this webhook</span>
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? "bg-brand-primary" : "bg-gray-300"}`}
          aria-label="Active"
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {hook && (
        <div className="bg-gray-50 rounded-lg p-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[12px] text-gray-500 shrink-0">Signing secret</span>
            <SecretText value={hook.signingSecret} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[12px] text-gray-500">Last delivery</span>
            <span className={`text-[10px] sm:text-[12px] flex items-center gap-1 ${hook.lastDeliveryStatus === "Success" ? "text-brand-primary" : hook.lastDeliveryStatus === "Failure" ? "text-red-500" : "text-gray-500"}`}>
              {hook.lastDeliveryStatus === "Success" && <FiCheckCircle />}
              {hook.lastDeliveryStatus === "Failure" && <FiXCircle />}
              {hook.lastDeliveryAt ? `${fmtDate(hook.lastDeliveryAt)}${hook.lastHttpStatus ? ` · HTTP ${hook.lastHttpStatus}` : ""}` : "Not sent yet"}
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-[10px] sm:text-[12px] text-red-500">{error}</p>}

      <div className="flex flex-wrap gap-2 mt-auto">
        <button type="button" onClick={save} disabled={busy === "save"} className={BTN_PRIMARY}>
          {busy === "save" && <FiRefreshCw className="animate-spin" />} {hook ? "Save changes" : "Save webhook"}
        </button>
        {hook && (
          <>
            <button type="button" onClick={test} disabled={busy === "test"} className={BTN_SECONDARY}>
              {busy === "test" ? <FiRefreshCw className="animate-spin" /> : <FiPlay />} Send test
            </button>
            <button type="button" onClick={remove} disabled={busy === "remove"} className={`${BTN_SECONDARY} hover:text-red-500`}>
              <FiTrash2 /> Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const B2BApiWebhooks = () => {
  const [view, setView] = useState("setup");
  const [keyInfo, setKeyInfo] = useState(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const [keyBusy, setKeyBusy] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [hooks, setHooks] = useState({ shipment_details: null, tracking: null });
  const [hooksLoading, setHooksLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logEvent, setLogEvent] = useState("");
  const [logDetail, setLogDetail] = useState(null);

  // The exact address for this account, from the backend (the company's own API domain when it has one)
  const apiBase = keyInfo?.apiBaseUrl || "";
  const [docsBusy, setDocsBusy] = useState(false);
  const [postmanBusy, setPostmanBusy] = useState(false);

  // Branded documentation (this company's name, logo, colours and addresses), opened in a new tab. The tab is
  // opened before the request so the browser does not block it as a pop-up.
  const openDocs = async () => {
    const tab = window.open("", "_blank");
    setDocsBusy(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/b2b-api/docs`, auth());
      const { html, fileName } = res.data?.data || {};
      const url = URL.createObjectURL(new Blob([html || ""], { type: "text/html" }));
      if (tab) tab.location.href = url;
      else saveFile(url, fileName || "B2B-API-Documentation.html");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (tab) tab.close();
      toast.error(errText(err, "Could not open the API documentation."));
    } finally {
      setDocsBusy(false);
    }
  };

  const downloadPostman = async () => {
    setPostmanBusy(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/b2b-api/postman`, auth());
      const { collection, fileName } = res.data?.data || {};
      const url = URL.createObjectURL(new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" }));
      saveFile(url, fileName || "B2B-API.postman_collection.json");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      toast.error(errText(err, "Could not download the Postman collection."));
    } finally {
      setPostmanBusy(false);
    }
  };

  const loadKey = useCallback(async () => {
    setKeyLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/b2b-api/key`, auth());
      setKeyInfo(res.data?.data || null);
    } catch (err) {
      toast.error(errText(err, "Could not load the API key."));
    } finally {
      setKeyLoading(false);
    }
  }, []);

  const loadHooks = useCallback(async () => {
    setHooksLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/b2b-api/webhooks`, auth());
      setHooks({ shipment_details: res.data?.data?.shipment_details || null, tracking: res.data?.data?.tracking || null });
    } catch (err) {
      toast.error(errText(err, "Could not load the webhooks."));
    } finally {
      setHooksLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/b2b-api/webhooks/logs`, {
        ...auth(),
        params: { limit: 50, ...(logEvent ? { event: logEvent } : {}) },
      });
      setLogs(res.data?.data?.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [logEvent]);

  useEffect(() => {
    loadKey();
    loadHooks();
  }, [loadKey, loadHooks]);
  useEffect(() => {
    if (view === "logs") loadLogs();
  }, [view, loadLogs]);

  const generate = async () => {
    setConfirmRegenerate(false);
    setKeyBusy(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/b2b-api/key`, {}, auth());
      setKeyInfo(res.data?.data || null);
      toast.success(res.data?.message || "API key generated");
    } catch (err) {
      toast.error(errText(err, "Could not generate the API key."));
    } finally {
      setKeyBusy(false);
    }
  };

  const revoke = async () => {
    if (!window.confirm("Revoke the API key? Every call made with it will be refused until you generate a new key.")) return;
    setKeyBusy(true);
    try {
      await axios.delete(`${BACKEND_URL}/b2b-api/key`, auth());
      toast.success("API key revoked");
      loadKey();
    } catch (err) {
      toast.error(errText(err, "Could not revoke the API key."));
    } finally {
      setKeyBusy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-3">
        {[
          ["setup", "API Key & Webhooks"],
          ["logs", "B2B Webhook Logs"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setView(value)}
            className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[12px] font-[600] border transition-all ${view === value ? "bg-brand-secondary text-white" : "text-gray-700 bg-white hover:bg-brand-secondary/10"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "setup" ? (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center shrink-0">
                  <FiKey />
                </div>
                <div>
                  <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">B2B API Key</h3>
                  <p className="text-[10px] sm:text-[12px] text-gray-500">
                    One permanent key — send it on every B2B API call. It stays the same until you regenerate it here.
                  </p>
                </div>
              </div>
              {keyInfo?.canManage && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => (keyInfo.exists ? setConfirmRegenerate(true) : generate())} disabled={keyBusy || keyLoading} className={BTN_PRIMARY}>
                    <FiRefreshCw className={keyBusy ? "animate-spin" : ""} /> {keyInfo.exists ? "Regenerate key" : "Generate key"}
                  </button>
                  {keyInfo.exists && (
                    <button onClick={revoke} disabled={keyBusy} className={`${BTN_SECONDARY} hover:text-red-500`}>
                      <FiTrash2 /> Revoke
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3">
              {keyLoading ? (
                <p className="text-[12px] text-gray-500">Loading…</p>
              ) : keyInfo?.exists ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-2 items-center">
                  <SecretText value={keyInfo.apiKey} preview={keyInfo.keyPreview} />
                  <span className="text-[10px] sm:text-[12px] text-gray-500">Generated: {fmtDate(keyInfo.generatedAt)}</span>
                  <span className="text-[10px] sm:text-[12px] text-gray-500">Last used: {fmtDate(keyInfo.lastUsedAt)}</span>
                </div>
              ) : (
                <p className="text-[10px] sm:text-[12px] text-gray-500">
                  {keyInfo?.canManage === false ? "No key yet. Only the account owner can generate it." : "No key yet. Generate one to start using the B2B API."}
                </p>
              )}
              {keyInfo?.exists && keyInfo.canManage === false && (
                <p className="text-[10px] sm:text-[12px] text-gray-400 mt-1">Only the account owner can see the full key.</p>
              )}
            </div>

            <div className="mt-3 bg-gray-50 rounded-lg p-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 text-[10px] sm:text-[12px] text-gray-600">
                  <span className="font-[600]">Base URL: </span>
                  {apiBase ? <SecretText value={apiBase} preview={apiBase} /> : <span>—</span>}
                </div>
                <p className="text-[10px] sm:text-[12px] text-gray-600">
                  <span className="font-[600]">Header: </span>
                  <code className="font-mono">Authorization: Bearer &lt;your API key&gt;</code>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button type="button" onClick={openDocs} disabled={docsBusy} className={BTN_SECONDARY}>
                  {docsBusy ? <FiRefreshCw className="animate-spin" /> : <FiBookOpen />} API documentation
                </button>
                <button type="button" onClick={downloadPostman} disabled={postmanBusy} className={BTN_SECONDARY}>
                  {postmanBusy ? <FiRefreshCw className="animate-spin" /> : <FiDownload />} Postman collection
                </button>
              </div>
            </div>
          </div>

          {hooksLoading ? (
            <p className="text-[12px] text-gray-500">Loading webhooks…</p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {EVENTS.map((meta) => (
                <WebhookCard key={meta.key} meta={meta} hook={hooks[meta.key]} onSaved={loadHooks} />
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 bg-brand-primary/10 rounded-lg p-2">
            <FiShield className="text-brand-primary mt-0.5 shrink-0" />
            <p className="text-[10px] sm:text-[12px] text-gray-700">
              Every webhook is signed: <code className="font-mono">X-Webhook-Signature</code> is <code className="font-mono">sha256=</code>
              HMAC-SHA256 of <code className="font-mono">"&lt;X-Webhook-Timestamp&gt;.&lt;raw body&gt;"</code> with that webhook's signing secret. Use
              <code className="font-mono"> X-Webhook-Id</code> to ignore a repeated delivery. Failed deliveries are retried after 1, 5 and 15 minutes.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-end gap-2 mb-2">
            <select className={`${INPUT} w-[170px]`} value={logEvent} onChange={(e) => setLogEvent(e.target.value)}>
              <option value="">All events</option>
              <option value="shipment_details">Shipment Details</option>
              <option value="tracking">Tracking</option>
            </select>
            <button onClick={loadLogs} className={BTN_SECONDARY} title="Refresh">
              <FiRefreshCw className={logsLoading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-brand-secondary text-white">
                <tr>
                  {["Event", "URL", "Attempt", "Status Code", "Response Time", "Result", "Sent At", ""].map((h) => (
                    <th key={h} className="px-3 py-2 text-[10px] sm:text-[12px] font-[600] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  <tr><td colSpan={8} className="px-3 py-10 text-center text-[12px] text-gray-500">Loading…</td></tr>
                ) : logs.length ? (
                  logs.map((log) => (
                    <tr key={log._id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-[10px] sm:text-[12px] text-gray-700">{log.eventTopic === "tracking" ? "Tracking" : "Shipment Details"}</td>
                      <td className="px-3 py-2 text-[10px] sm:text-[12px] text-gray-700 max-w-[220px] truncate" title={log.url}>{log.url}</td>
                      <td className="px-3 py-2 text-[10px] sm:text-[12px] text-gray-500">{log.attempt ?? 1}</td>
                      <td className="px-3 py-2 text-[10px] sm:text-[12px] text-gray-500">{log.httpStatus ?? "—"}</td>
                      <td className="px-3 py-2 text-[10px] sm:text-[12px] text-gray-500">{log.responseTime != null ? `${log.responseTime} ms` : "—"}</td>
                      <td className={`px-3 py-2 text-[10px] sm:text-[12px] ${log.status === "Success" ? "text-brand-primary" : "text-red-500"}`}>
                        {log.status === "Success" ? "Success" : "Failed"}
                      </td>
                      <td className="px-3 py-2 text-[10px] sm:text-[12px] text-gray-500 whitespace-nowrap">{fmtDate(log.timestamp)}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => setLogDetail(log)} className="text-gray-400 hover:text-brand-primary" title="View details">
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={8} className="px-3 py-10 text-center text-[12px] text-gray-500">No webhook deliveries yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmRegenerate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmRegenerate(false)}>
          <div className="bg-white rounded-lg p-4 w-full max-w-[420px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[14px] font-[600] text-gray-700 mb-2">Regenerate API key?</h3>
            <p className="text-[12px] text-gray-600 mb-4">
              The current key stops working immediately. Update the new key in every system that calls the B2B API.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmRegenerate(false)} className={BTN_SECONDARY}>Cancel</button>
              <button onClick={generate} className={BTN_PRIMARY}>Regenerate</button>
            </div>
          </div>
        </div>
      )}

      {logDetail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setLogDetail(null)}>
          <div className="bg-white rounded-lg w-full max-w-[640px] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-[14px] font-[600] text-gray-700">Delivery Details</h3>
              <button onClick={() => setLogDetail(null)} className="text-gray-500 hover:text-gray-700"><FiX /></button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Event ID", logDetail.eventId || "—"],
                  ["Attempt", String(logDetail.attempt ?? 1)],
                  ["Status Code", String(logDetail.httpStatus ?? "—")],
                  ["Response Time", logDetail.responseTime != null ? `${logDetail.responseTime} ms` : "—"],
                  ["Result", logDetail.status],
                  ["Sent At", fmtDate(logDetail.timestamp)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded p-2">
                    <p className="text-[10px] text-gray-400">{label}</p>
                    <p className="text-[12px] font-[600] text-gray-700 break-all">{value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[12px] font-[600] text-gray-600 mb-1">Payload</p>
                <pre className="bg-gray-900 text-gray-200 rounded p-3 text-[11px] whitespace-pre-wrap break-all">{JSON.stringify(logDetail.payload ?? null, null, 2)}</pre>
              </div>
              <div>
                <p className="text-[12px] font-[600] text-gray-600 mb-1">Response</p>
                <pre className="bg-gray-900 text-gray-200 rounded p-3 text-[11px] whitespace-pre-wrap break-all">{JSON.stringify(logDetail.response ?? null, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default B2BApiWebhooks;
