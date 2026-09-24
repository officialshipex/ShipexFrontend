import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { X, Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const POLL_INTERVAL_MS = 2500;

const authHeaders = () => ({ headers: { authorization: `Bearer ${Cookies.get("session")}` } });

const statusIcon = (status) => {
    switch (status) {
        case "processing":
            return <Loader2 className="w-4 h-4 text-brand-primary animate-spin flex-shrink-0" />;
        case "success":
            return <CheckCircle2 className="w-4 h-4 text-brand-primary flex-shrink-0" />;
        case "failed":
            return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
        default:
            return <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />;
    }
};

// Big centered detail view for a single Bulk Ship job or Bulk Upload file,
// reached from a notification click (or from NotificationHistoryModal's
// "Show All" list).
const JobDetailModal = ({ notificationId, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef(null);

    const fetchDetail = useCallback(async () => {
        if (!notificationId) return;
        try {
            const response = await axios.get(
                `${REACT_APP_BACKEND_URL}/app-notifications/${notificationId}/detail`,
                authHeaders()
            );
            if (response.data?.success) setData(response.data);
        } catch (error) {
            // keep whatever we last had; next poll tick (if any) will retry
        } finally {
            setLoading(false);
        }
    }, [notificationId]);

    useEffect(() => {
        if (!notificationId) return;
        setData(null);
        setLoading(true);
        fetchDetail();
    }, [notificationId, fetchDetail]);

    // Live-poll while a bulk-ship job is still running so the modal updates
    // in front of the user instead of showing a stale snapshot.
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (data?.refModel === "BulkShipJob" && data?.job?.status === "running") {
            intervalRef.current = setInterval(fetchDetail, POLL_INTERVAL_MS);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [data, fetchDetail]);

    if (!notificationId) return null;

    const isBulkShip = data?.refModel === "BulkShipJob";
    const job = data?.job;
    const file = data?.file;

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[92vw] max-h-[85vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-[14px] font-bold text-brand-secondary truncate pr-3">
                        {data?.title || "Bulk Job Details"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {loading && !data ? (
                    <div className="flex-1 p-10 text-center text-gray-400 text-[12px]">Loading details…</div>
                ) : !data ? (
                    <div className="flex-1 p-10 text-center text-gray-400 text-[12px]">Could not load this notification.</div>
                ) : isBulkShip ? (
                    <BulkShipDetail job={job} />
                ) : (
                    <BulkUploadDetail file={file} />
                )}
            </div>
        </div>
    );
};

const SummaryBar = ({ items }) => (
    <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50 text-[12px] font-[600]">
        {items.map((it, idx) => (
            <span key={idx} className={`px-2.5 py-1 rounded-lg ${it.className || "bg-white text-gray-600 border border-gray-200"}`}>
                {it.label}
            </span>
        ))}
    </div>
);

const BulkShipDetail = ({ job }) => {
    if (!job) return null;
    const isRunning = job.status === "running";
    const doneCount = (job.successCount || 0) + (job.failureCount || 0);

    return (
        <>
            <SummaryBar
                items={[
                    isRunning
                        ? { label: `Processing… ${doneCount}/${job.totalOrders}`, className: "bg-brand-secondary/10 text-brand-primary border border-brand-secondary/26" }
                        : { label: "Completed", className: "bg-brand-secondary/10 text-brand-primary border border-brand-secondary/26" },
                    { label: `${job.successCount || 0} succeeded`, className: "bg-green-50 text-green-700 border border-green-200" },
                    { label: `${job.failureCount || 0} failed`, className: job.failureCount ? "bg-red-50 text-red-600 border border-red-200" : "bg-white text-gray-500 border border-gray-200" },
                ]}
            />
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {job.results && job.results.length > 0 ? (
                    job.results.map((r, idx) => (
                        <div key={idx} className="flex items-start gap-3 px-5 py-3">
                            {statusIcon(r.status)}
                            <div className="flex-1 min-w-0 text-[12px]">
                                <div className="text-gray-700 font-[600]">Order {r.displayOrderId ?? "—"}</div>
                                {r.status === "success" && r.courierServiceName && (
                                    <div className="text-[11px] text-brand-primary mt-0.5">Shipped via {r.courierServiceName}</div>
                                )}
                                {r.status === "failed" && r.failureReason && (
                                    <div className="text-[11px] text-red-500 mt-0.5 whitespace-pre-wrap break-words">{r.failureReason}</div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-10 text-center text-gray-400 text-[12px]">No orders in this batch.</div>
                )}
            </div>
        </>
    );
};

const formatDateTime = (value) => {
    if (!value) return null;
    return new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};

const BulkUploadDetail = ({ file }) => {
    if (!file) return null;
    const rowResults = file.rowResults || [];
    const uploadedAt = formatDateTime(file.createdAt);

    return (
        <>
            <SummaryBar
                items={[
                    { label: file.status, className: "bg-brand-secondary/10 text-brand-primary border border-brand-secondary/26" },
                    { label: `${file.noOfOrders || 0} total`, className: "bg-white text-gray-600 border border-gray-200" },
                    { label: `${file.successfullyUploaded || 0} succeeded`, className: "bg-green-50 text-green-700 border border-green-200" },
                    { label: `${file.errorOrders || 0} failed`, className: file.errorOrders ? "bg-red-50 text-red-600 border border-red-200" : "bg-white text-gray-500 border border-gray-200" },
                    ...(uploadedAt ? [{ label: `Uploaded ${uploadedAt}`, className: "bg-white text-gray-500 border border-gray-200" }] : []),
                ]}
            />
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {rowResults.length > 0 ? (
                    rowResults.map((r, idx) => {
                        const isSuccess = r.status === "success";
                        return (
                            <div key={idx} className="flex items-start gap-3 px-5 py-3">
                                {isSuccess ? (
                                    <CheckCircle2 className="w-4 h-4 text-brand-primary flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0 text-[12px]">
                                    <div className="text-gray-700 font-[600]">
                                        Row {r.row}
                                        {isSuccess && r.orderId != null && (
                                            <span className="text-brand-primary"> — Order #{r.orderId}</span>
                                        )}
                                    </div>
                                    {isSuccess ? (
                                        <div className="text-[11px] text-gray-400 mt-0.5">Uploaded successfully</div>
                                    ) : (
                                        <div className="text-[11px] text-red-500 mt-0.5 whitespace-pre-wrap break-words">{r.message}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-10 text-center text-brand-primary text-[12px] flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8" />
                        All rows uploaded successfully.
                    </div>
                )}
            </div>
        </>
    );
};

export default JobDetailModal;
