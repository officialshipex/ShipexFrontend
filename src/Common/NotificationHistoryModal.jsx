import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import { X, Package, UploadCloud, ChevronDown } from "lucide-react";
import DateFilter from "../filter/DateFilter";
import JobDetailModal from "./JobDetailModal";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => ({ headers: { authorization: `Bearer ${Cookies.get("session")}` } });

const TYPE_OPTIONS = [
    { value: "", label: "All" },
    { value: "BulkShipJob", label: "Bulk Ship" },
    { value: "BulkOrderFiles", label: "Bulk Upload" },
];

const summaryFor = (notification) => {
    const ref = notification.refId;
    if (!ref) return "";
    if (notification.refModel === "BulkShipJob") {
        if (ref.status === "running") {
            const done = (ref.successCount || 0) + (ref.failureCount || 0);
            return `Processing… ${done}/${ref.totalOrders}`;
        }
        return `${ref.successCount || 0} succeeded, ${ref.failureCount || 0} failed`;
    }
    return `${ref.successfullyUploaded || 0}/${ref.noOfOrders || 0} rows uploaded${ref.errorOrders ? `, ${ref.errorOrders} failed` : ""}`;
};

// "Show All" — recovers dismissed notifications too (that's the whole point:
// a notification the user accidentally closed via the "x" without reading it
// is still findable here), grouped by date then by Bulk Ship / Bulk Upload.
const NotificationHistoryModal = ({ open, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [openNotificationId, setOpenNotificationId] = useState(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const params = { limit: 200 };
            if (typeFilter) params.refModel = typeFilter;
            if (dateRange?.[0]?.startDate) params.fromDate = dateRange[0].startDate.toISOString();
            if (dateRange?.[0]?.endDate) params.toDate = dateRange[0].endDate.toISOString();
            const response = await axios.get(`${REACT_APP_BACKEND_URL}/app-notifications/history`, {
                ...authHeaders(),
                params,
            });
            setNotifications(response.data?.notifications || []);
        } catch (error) {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [typeFilter, dateRange]);

    useEffect(() => {
        if (open) fetchHistory();
    }, [open, fetchHistory]);

    if (!open) return null;

    // Group by day, then by refModel within each day.
    const groups = [];
    const dayIndex = new Map();
    notifications.forEach((n) => {
        const dayKey = dayjs(n.createdAt).format("YYYY-MM-DD");
        if (!dayIndex.has(dayKey)) {
            const group = { dayKey, label: dayjs(n.createdAt).format("MMMM D, YYYY"), types: new Map() };
            dayIndex.set(dayKey, group);
            groups.push(group);
        }
        const group = dayIndex.get(dayKey);
        if (!group.types.has(n.refModel)) group.types.set(n.refModel, []);
        group.types.get(n.refModel).push(n);
    });

    const typeLabel = (refModel) => (refModel === "BulkShipJob" ? "Bulk Ship" : "Bulk Upload");
    const typeIcon = (refModel) =>
        refModel === "BulkShipJob" ? (
            <Package className="w-3.5 h-3.5 text-[#0CBB7D]" />
        ) : (
            <UploadCloud className="w-3.5 h-3.5 text-[#0CBB7D]" />
        );

    return (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[700px] max-w-[94vw] max-h-[88vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-[14px] font-bold text-gray-800">All Notifications</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="relative sm:w-[180px]">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full appearance-none bg-white py-2 pl-3 pr-8 text-[12px] font-[600] border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] text-gray-600"
                        >
                            {TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <DateFilter onDateChange={setDateRange} className="sm:w-[220px]" />
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400 text-[12px]">Loading…</div>
                    ) : groups.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-[12px]">No notifications found for this filter.</div>
                    ) : (
                        groups.map((group) => (
                            <div key={group.dayKey} className="px-5 py-3 border-b border-gray-100">
                                <div className="text-[12px] font-bold text-gray-700 mb-2">{group.label}</div>
                                {[...group.types.entries()].map(([refModel, items]) => (
                                    <div key={refModel} className="mb-3 last:mb-0">
                                        <div className="flex items-center gap-1.5 text-[11px] font-[600] text-gray-500 mb-1.5">
                                            {typeIcon(refModel)}
                                            {typeLabel(refModel)}
                                        </div>
                                        <div className="space-y-1">
                                            {items.map((n) => (
                                                <button
                                                    key={n._id}
                                                    type="button"
                                                    onClick={() => setOpenNotificationId(n._id)}
                                                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-green-50 text-left transition-colors"
                                                >
                                                    <span className="text-[12px] text-gray-700 font-[600] truncate">{n.title}</span>
                                                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                                                        {dayjs(n.createdAt).format("h:mm A")} · {summaryFor(n)}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {openNotificationId && (
                <JobDetailModal notificationId={openNotificationId} onClose={() => setOpenNotificationId(null)} />
            )}
        </div>
    );
};

export default NotificationHistoryModal;
