import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  FiRefreshCw,
  FiX,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import DateFilter from "../../../filter/DateFilter";
import ThreeDotLoader from "../../../Loader";
import PaginationFooter from "../../../Common/PaginationFooter";

const WebhookLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filter States
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [refresh, setRefresh] = useState(0);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Height State for Table
  const [tableHeight, setTableHeight] = useState("calc(100vh - 260px)");
  const tableRef = useRef(null);

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (tableRef.current) {
        const top = tableRef.current.getBoundingClientRect().top;
        const remainingHeight = window.innerHeight - top - 40;
        setTableHeight(`${remainingHeight}px`);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [showErrorsOnly, dateRange, refresh, page, limit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (showErrorsOnly) params.status = "Failure";
      
      if (dateRange && dateRange[0]) {
        if (dateRange[0].startDate) params.startDate = dateRange[0].startDate;
        if (dateRange[0].endDate) params.endDate = dateRange[0].endDate;
      }

      const res = await axios.get(`${BACKEND_URL}/webhook/manage/logs`, {
        headers: { Authorization: `Bearer ${Cookies.get("session")}` },
        params,
      });
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching logs", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-2">
      {/* Filter Bar: Scaled and Responsive */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:mb-2 sm:mt-2">
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter 
            onDateChange={(range) => {
              setDateRange(range);
              setPage(1);
            }} 
            clearTrigger={refresh} 
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-[12px] font-[600] text-gray-700">Errors Only</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={showErrorsOnly} 
                className="sr-only peer" 
                onChange={() => {
                  setShowErrorsOnly(!showErrorsOnly);
                  setPage(1);
                }}
              />
              <div className="w-7 h-3.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <button 
            onClick={() => setRefresh(prev => prev + 1)}
            className="p-1.5 sm:p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600 transition-all shadow-sm"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={14} />
          </button>
        </div>
      </div>

      {/* Desktop Table View - ALWAYS render structure */}
      <div ref={tableRef} style={{ height: tableHeight }} className="hidden md:block overflow-auto relative bg-white">
        <table className="min-w-full table-auto">
          <thead className="sticky top-0 z-10">
            <tr className="bg-brand-primary text-white text-[12px] font-[600]">
              <th className="py-2 px-3 text-left">Timestamp</th>
              <th className="py-2 px-3 text-left">Webhook ID</th>
              <th className="py-2 px-3 text-left">URL</th>
              <th className="py-2 px-3 text-left">Topic</th>
              <th className="py-2 px-3 text-center">Status Code</th>
              <th className="py-2 px-3 text-center">Result</th>
              <th className="py-2 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center bg-white"><ThreeDotLoader /></td>
              </tr>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log._id} className="border-b border-gray-300 hover:bg-gray-50 text-[12px] text-gray-600">
                  <td className="py-2 px-3 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px]">{log.webhookId}</td>
                  <td className="py-2 px-3 max-w-xs truncate text-brand-primary" title={log.url}>{log.url}</td>
                  <td className="py-2 px-3">
                    <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded border border-blue-200">
                      {log.eventTopic}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`font-semibold ${log.httpStatus < 300 ? "text-green-600" : "text-red-600"}`}>
                      {log.httpStatus || "-"}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      log.status === "Success" ? "bg-green-100 text-brand-primary border-green-200" : "bg-red-100 text-red-600 border-red-200"
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button 
                      onClick={() => {
                        setSelectedLog(log);
                        setIsLogDetailOpen(true);
                      }}
                      className="text-brand-primary hover:underline font-[600]"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-12 text-center text-gray-500 text-[12px] bg-white">No logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Ultra-Compact Cards View */}
      <div className="block md:hidden">
        {loading ? (
          <div className="py-12 text-center bg-white border border-gray-100 rounded-lg"><ThreeDotLoader /></div>
        ) : logs.length > 0 ? (
          <>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log._id} className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm hover:shadow transition-all duration-200">
                  {/* Top Row: Timestamp & Status */}
                  <div className="flex justify-between items-center mb-1 border-b border-gray-100 pb-1">
                    <span className="text-[10px] text-gray-500 font-medium">
                      {new Date(log.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold ${log.httpStatus < 300 ? "text-green-600" : "text-red-600"}`}>
                        HTTP {log.httpStatus || "N/A"}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                        log.status === "Success" ? "bg-green-50 text-brand-primary border-green-100" : "bg-red-50 text-red-600 border-red-100"
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>

                  {/* Second Row: URL */}
                  <div className="mb-1 text-[11px] font-medium text-gray-800 break-all">
                    {log.url}
                  </div>

                  {/* Third Row: Topic & Details Button */}
                  <div className="flex justify-between items-center">
                    <span className="bg-blue-50 text-blue-600 text-[9px] px-1.5 py-0.2 rounded border border-blue-100 font-semibold">
                      {log.eventTopic}
                    </span>
                    <button 
                      onClick={() => {
                        setSelectedLog(log);
                        setIsLogDetailOpen(true);
                      }}
                      className="text-brand-primary hover:underline text-[10px] font-semibold"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination footer */}
            <div className="mt-2.5">
              <PaginationFooter page={page} totalPages={totalPages} setPage={setPage} limit={limit} setLimit={setLimit} />
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-gray-500 text-[12px] bg-white border border-gray-100 rounded-lg">No logs found</div>
        )}
      </div>

      {/* Log Detail Modal */}
      {isLogDetailOpen && selectedLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-[14px] font-[600] text-gray-700">Webhook Event Log</h2>
              <button onClick={() => setIsLogDetailOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-5 overflow-auto max-h-[80vh] space-y-4">
              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div className="bg-gray-50 p-2 rounded border">
                  <p className="text-gray-400 text-[10px] uppercase font-bold">Timestamp</p>
                  <p className="text-gray-700 font-semibold">{new Date(selectedLog.timestamp).toLocaleString("en-IN")}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded border">
                  <p className="text-gray-400 text-[10px] uppercase font-bold">Topic</p>
                  <span className="text-blue-600 font-semibold">{selectedLog.eventTopic}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded border col-span-2">
                  <p className="text-gray-400 text-[10px] uppercase font-bold">Destination URL</p>
                  <p className="text-brand-primary font-mono break-all">{selectedLog.url}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded border">
                  <p className="text-gray-400 text-[10px] uppercase font-bold">HTTP Status</p>
                  <p className={`font-bold ${selectedLog.httpStatus < 300 ? "text-green-600" : "text-red-600"}`}>
                    {selectedLog.httpStatus} ({selectedLog.status})
                  </p>
                </div>
                <div className="bg-gray-50 p-2 rounded border">
                  <p className="text-gray-400 text-[10px] uppercase font-bold">Response Time</p>
                  <p className="text-gray-700 font-semibold">{selectedLog.responseTime} ms</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[12px] font-[600] text-gray-700">Payload Sent</h3>
                    <button onClick={() => copyToClipboard(JSON.stringify(selectedLog.payload, null, 2), "payload")} className="text-gray-400 hover:text-brand-primary">
                      {copiedId === "payload" ? <FiCheck size={14} /> : <FiCopy size={14} />}
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-[10px] overflow-x-auto max-h-48 font-mono">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[12px] font-[600] text-gray-700">Server Response</h3>
                    <button onClick={() => copyToClipboard(JSON.stringify(selectedLog.response, null, 2), "response")} className="text-gray-400 hover:text-brand-primary">
                      {copiedId === "response" ? <FiCheck size={14} /> : <FiCopy size={14} />}
                    </button>
                  </div>
                  <pre className="bg-gray-50 text-gray-700 p-3 rounded-lg text-[10px] overflow-x-auto max-h-32 font-mono border">
                    {JSON.stringify(selectedLog.response, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setIsLogDetailOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-[12px] font-[600] hover:bg-gray-300 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookLogs;
