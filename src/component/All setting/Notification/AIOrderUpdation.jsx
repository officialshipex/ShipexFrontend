import React, { useState, useEffect, useCallback } from "react";
import { FiPhoneCall, FiRefreshCcw, FiMic, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import { MdOutlineVerified, MdOutlinePhoneMissed } from "react-icons/md";
import { BiSolidPhoneCall } from "react-icons/bi";
import { useOutletContext } from "react-router-dom";
import Cookies from "js-cookie";
import dayjs from "dayjs";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

// ─── Status badge colors ───────────────────────────────────
const statusConfig = {
  pending:    { color: "bg-yellow-100 text-yellow-700", label: "Pending",    icon: <FiClock className="w-3 h-3" /> },
  answered:   { color: "bg-green-100 text-green-700",  label: "Answered",   icon: <FiCheckCircle className="w-3 h-3" /> },
  unanswered: { color: "bg-orange-100 text-orange-700",label: "Unanswered", icon: <MdOutlinePhoneMissed className="w-3 h-3" /> },
  failed:     { color: "bg-red-100 text-red-700",      label: "Failed",     icon: <FiXCircle className="w-3 h-3" /> },
};

const serviceLabels = {
  order_verification: "Order Verification",
  ndr_followup:       "NDR Follow-up",
};

// ─── Toggle Switch ──────────────────────────────────────────
const Toggle = ({ enabled, onChange, disabled = false, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={enabled}
    disabled={disabled}
    onClick={() => !disabled && onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#0CBB7D] focus:ring-offset-1
      ${enabled ? "bg-[#0CBB7D]" : "bg-gray-300"}
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-300
        ${enabled ? "translate-x-6" : "translate-x-1"}`}
    />
  </button>
);

// ─── Feature Info Card ──────────────────────────────────────
const FeatureCard = ({ icon, title, description, enabled, onToggle, adminEnabled, stats, activeLabel }) => (
  <div className={`relative bg-white border rounded-lg px-3 py-2 transition-all duration-300
    ${enabled && adminEnabled ? "border-[#0CBB7D]" : "border-gray-200"}`}>
    {/* Header */}
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
          ${enabled && adminEnabled ? "bg-green-100 text-[#0CBB7D]" : "bg-gray-100 text-gray-400"}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-[13px] font-[700] text-gray-800">{title}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <Toggle
          id={`toggle-${title.replace(/\s+/g, "-").toLowerCase()}`}
          enabled={enabled && adminEnabled}
          onChange={onToggle}
          disabled={!adminEnabled}
        />
        {!adminEnabled && (
          <span className="text-[10px] text-red-500 font-[600]">Disabled by Admin</span>
        )}
        {enabled && adminEnabled && (
          <span className="text-[10px] text-[#0CBB7D] font-[600]">{activeLabel}</span>
        )}
      </div>
    </div>

    {/* Stats row */}
    {stats && (
      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <p className={`text-[14px] font-[700] ${s.color || "text-gray-800"}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    )}

    {/* How it works — expandable */}
    <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-[11px] text-gray-600 leading-relaxed">{
        title.includes("Verify")
          ? "After you book a shipment, click \"Verify Order\" in the order list. An automated system calls the customer to confirm their address and delivery details. Credit is deducted only when the call is answered."
          : "When an order reaches \"Action Required\" NDR status, an automated call is initiated. The system captures the customer's preferred action (re-attempt, address change, RTO). Credit is deducted only when the call is answered."
      }</p>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────
const AIOrderUpdation = () => {
  const { targetUserId, isAdmin } = useOutletContext();
  const token = Cookies.get("session");

  const [settings, setSettings] = useState({
    isAiOrderVerifyEnable:       false,
    isAdminAiOrderVerifyEnable:  true,
    isAiNdrFollowupEnable:       false,
    isAdminAiNdrFollowupEnable:  true,
  });
  const [logs, setLogs] = useState([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [togglingField, setTogglingField] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterService, setFilterService] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [creditBalance, setCreditBalance] = useState(0);

  // Summary stats from logs
  const [stats, setStats] = useState({ verify: { total: 0, answered: 0, failed: 0 }, ndr: { total: 0, answered: 0, failed: 0 } });

  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ page, limit: 20 });
    if (targetUserId) p.append("userId", targetUserId);
    if (filterService) p.append("serviceType", filterService);
    if (filterStatus)  p.append("callStatus", filterStatus);
    return p.toString();
  }, [targetUserId, page, filterService, filterStatus]);

  // ── Fetch settings ──────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    if (isAdmin && !targetUserId) return;
    try {
      setLoadingSettings(true);
      const params = targetUserId ? `?userId=${targetUserId}` : "";
      const res = await fetch(`${BACKEND_URL}/ai-calling/settings${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSettings({
          isAiOrderVerifyEnable:       data.isAiOrderVerifyEnable,
          isAdminAiOrderVerifyEnable:  data.isAdminAiOrderVerifyEnable,
          isAiNdrFollowupEnable:       data.isAiNdrFollowupEnable,
          isAdminAiNdrFollowupEnable:  data.isAdminAiNdrFollowupEnable,
        });
      }
    } catch (e) {
      console.error("Failed to fetch AI settings:", e);
    } finally {
      setLoadingSettings(false);
    }
  }, [targetUserId, token, isAdmin]);

  // ── Fetch credit balance ─────────────────────────────────
  const fetchCreditBalance = useCallback(async () => {
    if (isAdmin && !targetUserId) return;
    try {
      const params = targetUserId ? `?userId=${targetUserId}` : "";
      const res = await fetch(`${BACKEND_URL}/notification/getCreditBalance${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCreditBalance(data.creditBalance || 0);
    } catch (e) { /* silent */ }
  }, [targetUserId, token, isAdmin]);

  // ── Fetch call logs ──────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    if (isAdmin && !targetUserId) return;
    try {
      setLoadingLogs(true);
      const res = await fetch(`${BACKEND_URL}/ai-calling/logs?${buildParams()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);

        // Compute summary stats
        const allLogs = data.logs || [];
        setStats({
          verify: {
            total:    allLogs.filter(l => l.serviceType === "order_verification").length,
            answered: allLogs.filter(l => l.serviceType === "order_verification" && l.callStatus === "answered").length,
            failed:   allLogs.filter(l => l.serviceType === "order_verification" && l.callStatus === "failed").length,
          },
          ndr: {
            total:    allLogs.filter(l => l.serviceType === "ndr_followup").length,
            answered: allLogs.filter(l => l.serviceType === "ndr_followup" && l.callStatus === "answered").length,
            failed:   allLogs.filter(l => l.serviceType === "ndr_followup" && l.callStatus === "failed").length,
          },
        });
      }
    } catch (e) {
      console.error("Failed to fetch AI call logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  }, [buildParams, token, isAdmin, targetUserId]);

  useEffect(() => { fetchSettings(); fetchCreditBalance(); }, [fetchSettings, fetchCreditBalance]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Update a toggle ──────────────────────────────────────
  const handleToggle = async (field, value) => {
    setTogglingField(field);
    try {
      const body = { field, value };
      if (targetUserId) body.userId = targetUserId;

      const res = await fetch(`${BACKEND_URL}/ai-calling/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, [field]: value }));
      }
    } catch (e) {
      console.error("Toggle update failed:", e);
    } finally {
      setTogglingField(null);
    }
  };

  // ── Admin: no user selected ──────────────────────────────
  if (isAdmin && !targetUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-400 font-semibold text-[12px]">Search user to see the details</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
            <BiSolidPhoneCall className="text-[#0CBB7D] w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[13px] font-[700] text-gray-800">Smart Calling</h2>
            <p className="text-[11px] text-gray-500">Automated voice calls powered by Shipex India • 1 Credit = 1 Call</p>
          </div>
        </div>
        {/* <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Available Credits</p>
            <p className="text-[14px] font-[700] text-[#0CBB7D]">{creditBalance}</p>
          </div>
          <button
            onClick={() => { fetchSettings(); fetchCreditBalance(); fetchLogs(); }}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
            title="Refresh"
          >
            <FiRefreshCcw className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div> */}
      </div>

      {/* ── Two Service Cards ───────────────────────────── */}
      {loadingSettings ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-2 animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Order Verification Card */}
          <FeatureCard
            icon={<MdOutlineVerified className="w-5 h-5" />}
            title="Order Verification"
            description="AI calls customer after shipment is booked to verify address & details."
            enabled={settings.isAiOrderVerifyEnable}
            adminEnabled={settings.isAdminAiOrderVerifyEnable}
            activeLabel="Verification Active"
            onToggle={(val) => handleToggle("isAiOrderVerifyEnable", val)}
            stats={[
              { label: "Total Calls", value: stats.verify.total, color: "text-gray-800" },
              { label: "Answered",    value: stats.verify.answered, color: "text-green-600" },
              { label: "Failed",      value: stats.verify.failed,   color: "text-red-500"   },
            ]}
          />

          {/* NDR Follow-up Card */}
          <FeatureCard
            icon={<FiPhoneCall className="w-5 h-5" />}
            title="NDR Follow-up"
            description="Automated calls when order hits NDR 'Action Required' status."
            enabled={settings.isAiNdrFollowupEnable}
            adminEnabled={settings.isAdminAiNdrFollowupEnable}
            activeLabel="Follow-up Active"
            onToggle={(val) => handleToggle("isAiNdrFollowupEnable", val)}
            stats={[
              { label: "Total Calls", value: stats.ndr.total,    color: "text-gray-800" },
              { label: "Answered",    value: stats.ndr.answered,  color: "text-green-600" },
              { label: "Failed",      value: stats.ndr.failed,    color: "text-red-500"   },
            ]}
          />
        </div>
      )}

      {/* ── Info Banner ──────────────────────────────────── */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <FiAlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700 leading-relaxed">
          <strong>Credit Policy:</strong> Credits are deducted <strong>only when the customer answers the call</strong>.
          Unanswered or failed calls are free. 1 Credit = 1 successful answered call.
          Buy credits from the Notification section above.
        </p>
      </div>

      {/* ── Call Logs Table ───────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <FiMic className="w-4 h-4 text-[#0CBB7D]" />
            <h3 className="text-[12px] font-[700] text-gray-800">Call Logs</h3>
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-[600]">{total} total</span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={filterService}
              onChange={e => { setFilterService(e.target.value); setPage(1); }}
              className="text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0CBB7D] bg-white"
            >
              <option value="">All Services</option>
              <option value="order_verification">Order Verification</option>
              <option value="ndr_followup">NDR Follow-up</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0CBB7D] bg-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="answered">Answered</option>
              <option value="unanswered">Unanswered</option>
              <option value="failed">Failed</option>
            </select>

            <button
              onClick={() => fetchLogs()}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
              title="Refresh logs"
            >
              <FiRefreshCcw className={`w-3.5 h-3.5 text-gray-500 ${loadingLogs ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#0CBB7D] text-white text-[11px] font-[600]">
                <th className="py-2 px-3 text-left whitespace-nowrap">Date & Time</th>
                <th className="py-2 px-3 text-left whitespace-nowrap">Order / AWB</th>
                <th className="py-2 px-3 text-left whitespace-nowrap">Service</th>
                <th className="py-2 px-3 text-left whitespace-nowrap">Called Number</th>
                <th className="py-2 px-3 text-left whitespace-nowrap">Call Status</th>
                <th className="py-2 px-3 text-left whitespace-nowrap">Customer Response</th>
                <th className="py-2 px-3 text-left whitespace-nowrap">Credit Deducted</th>
                <th className="py-2 px-3 text-left whitespace-nowrap">Recording</th>
              </tr>
            </thead>
            <tbody>
              {loadingLogs ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="py-2 px-3">
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <FiPhoneCall className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-[12px] text-gray-500 font-[600]">No call logs found</p>
                      <p className="text-[11px] text-gray-400">
                        Enable calling above and click "Verify Order" from the order list to get started.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const sc = statusConfig[log.callStatus] || statusConfig.pending;
                  return (
                    <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50 text-[11px]">
                      {/* Date */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <p className="text-gray-700 font-[600]">{dayjs(log.createdAt).format("DD MMM YYYY")}</p>
                        <p className="text-gray-500 text-[10px]">{dayjs(log.createdAt).format("hh:mm A")}</p>
                      </td>

                      {/* Order / AWB */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <p className="text-[#0CBB7D] font-[600]">#{log.orderDisplayId || "—"}</p>
                        <p className="text-gray-500 text-[10px]">{log.awb_number || "—"}</p>
                      </td>

                      {/* Service */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-[600] ${
                          log.serviceType === "order_verification"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {serviceLabels[log.serviceType] || log.serviceType}
                        </span>
                      </td>

                      {/* Called Number */}
                      <td className="py-2 px-3 whitespace-nowrap text-gray-700">
                        {log.calledNumber || "—"}
                      </td>

                      {/* Call Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-[600] ${sc.color}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>

                      {/* Customer Response */}
                      <td className="py-2 px-3 max-w-[180px]">
                        <p className="text-gray-600 truncate" title={log.customerResponse}>
                          {log.customerResponse || "—"}
                        </p>
                      </td>

                      {/* Credit Deducted */}
                      <td className="py-2 px-3 text-center">
                        {log.creditDeducted ? (
                          <span className="inline-flex items-center gap-1 text-red-500 font-[600]">
                            <FiCheckCircle className="w-3 h-3" /> 1 Credit
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Recording */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {log.recordingUrl ? (
                          <a
                            href={log.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-[#0CBB7D] font-[600] hover:underline"
                          >
                            <FiMic className="w-3 h-3" /> Play
                          </a>
                        ) : (
                          <span className="text-gray-400 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-[11px] text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-[11px] font-[600] rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-[11px] font-[600] rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIOrderUpdation;
