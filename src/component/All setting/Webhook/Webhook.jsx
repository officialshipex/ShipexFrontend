import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiCheck,
  FiSend,
  FiZap,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import DateFilter from "../../../filter/DateFilter";
import ThreeDotLoader from "../../../Loader";
import PaginationFooter from "../../../Common/PaginationFooter";

const Webhook = () => {
  const [activeTab, setActiveTab] = useState("manage");
  const [webhooks, setWebhooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [showSecretId, setShowSecretId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [testingId, setTestingId] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    url: "",
    secret: "",
    topics: ["track_update"],
    alertEmail: "",
  });

  // Filter States
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [refresh, setRefresh] = useState(0);

  // Height State
  const [tableHeight, setTableHeight] = useState("calc(100vh - 260px)");
  const tableRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const topicsList = ["track_update"];

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (tableRef.current) {
        const top = tableRef.current.getBoundingClientRect().top;
        const remainingHeight = window.innerHeight - top - 50;
        setTableHeight(`${remainingHeight}px`);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [activeTab]);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab, showErrorsOnly, dateRange, refresh, page, limit]);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/webhook/manage`, {
        headers: { Authorization: `Bearer ${Cookies.get("session")}` },
      });
      if (res.data.success) {
        setWebhooks(res.data.webhooks);
      }
    } catch (error) {
      console.error("Error fetching webhooks", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      const url = editingWebhook 
        ? `${BACKEND_URL}/webhook/manage/${editingWebhook._id}`
        : `${BACKEND_URL}/webhook/manage`;
      const method = editingWebhook ? "put" : "post";

      const res = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${Cookies.get("session")}` },
      });

      if (res.data.success) {
        toast.success(editingWebhook ? "Webhook updated" : "Webhook created");
        setIsModalOpen(false);
        setEditingWebhook(null);
        setFormData({ url: "", secret: "", topics: ["track_update"], alertEmail: "" });
        fetchWebhooks();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this webhook?")) return;
    try {
      const res = await axios.delete(`${BACKEND_URL}/webhook/manage/${id}`, {
        headers: { Authorization: `Bearer ${Cookies.get("session")}` },
      });
      if (res.data.success) {
        toast.success("Webhook deleted");
        fetchWebhooks();
      }
    } catch (error) {
      toast.error("Error deleting webhook");
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTest = async (whId) => {
    setTestingId(whId);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/webhook/manage/${whId}/test`,
        {},
        { headers: { Authorization: `Bearer ${Cookies.get("session")}` } }
      );
      if (res.data.delivered) {
        toast.success(`✅ Test delivered! HTTP ${res.data.httpStatus} in ${res.data.responseTime}ms`);
      } else {
        toast.error(`❌ Test failed — HTTP ${res.data.httpStatus || "N/A"}. Check logs for details.`);
      }
      // Refresh logs tab count
      if (activeTab === "logs") setRefresh((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Test request failed");
    } finally {
      setTestingId(null);
    }
  };

  const toggleTopic = (topic) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const tabs = [
    { label: "Manage Webhooks", value: "manage" },
    { label: "Webhook Logs", value: "logs" },
  ];

  return (
    <div className="w-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-[12px] sm:text-[14px] mb-1 text-gray-700 font-[600]">
            Webhook Settings
          </h1>
        </div>
      </div>

      {/* Tabs UI to match existing UI */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-[12px] font-[600] border transition-all duration-200 ${
              activeTab === tab.value
                ? "bg-[#0CBB7D] text-white"
                : "text-gray-700 hover:bg-green-200 bg-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="w-full">
        {activeTab === "manage" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center sm:mb-2 sm:mt-2">
               <h2 className="text-[14px] font-[600] text-gray-700">All Configured Webhooks</h2>
               <div className="flex gap-2">
                 <button 
                  onClick={() => fetchWebhooks()}
                  className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600 transition-all shadow-sm"
                >
                  <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} />
                </button>
                <button
                  onClick={() => {
                    setEditingWebhook(null);
                    setFormData({ url: "", secret: "", topics: ["track_update"], alertEmail: "" });
                    setIsModalOpen(true);
                  }}
                  className="bg-[#0CBB7D] text-white text-[12px] font-[600] rounded-lg px-4 py-2 hover:bg-opacity-90 transition flex items-center gap-2 shadow-sm"
                >
                  <FiPlus /> Add Webhook
                </button>
               </div>
            </div>

            <div ref={tableRef} style={{ height: tableHeight }} className="overflow-auto relative bg-white border rounded-lg">
              <table className="min-w-full table-auto">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#0CBB7D] text-white text-[12px] font-[600]">
                    <th className="py-2 px-3 text-left">Webhook ID</th>
                    <th className="py-2 px-3 text-left">Updated On</th>
                    <th className="py-2 px-3 text-left">URL</th>
                    <th className="py-2 px-3 text-left">Topics</th>
                    <th className="py-2 px-3 text-left">Alert Email</th>
                    <th className="py-2 px-3 text-left">Secret</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading && webhooks.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center"><ThreeDotLoader /></td>
                    </tr>
                  ) : webhooks.length > 0 ? (
                    webhooks.map((wh) => (
                      <tr key={wh._id} className="border-b border-gray-300 hover:bg-gray-50 text-[12px]">
                        <td className="py-2 px-3 font-mono text-gray-600">{wh.webhookId}</td>
                        <td className="py-2 px-3 text-gray-500">
                          {new Date(wh.updatedAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2 px-3 max-w-xs truncate text-[#0CBB7D]" title={wh.url}>{wh.url}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {wh.topics.map((t) => (
                              <span key={t} className="bg-green-100 text-[#0CBB7D] text-[10px] px-2 py-0.5 rounded border border-green-200">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-gray-600">{wh.alertEmail || "-"}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-500">
                              {showSecretId === wh._id ? wh.secret : "••••••••"}
                            </span>
                            <button 
                              onClick={() => setShowSecretId(showSecretId === wh._id ? null : wh._id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {showSecretId === wh._id ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                            </button>
                            <button onClick={() => copyToClipboard(wh.secret, wh._id + "_secret")} className="text-gray-400 hover:text-[#0CBB7D]">
                              {copiedId === wh._id + "_secret" ? <FiCheck size={14} className="text-[#0CBB7D]" /> : <FiCopy size={14} />}
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={wh.isActive} 
                                className="sr-only peer" 
                                onChange={async () => {
                                  try {
                                    await axios.put(`${BACKEND_URL}/webhook/manage/${wh._id}`, 
                                      { isActive: !wh.isActive },
                                      { headers: { Authorization: `Bearer ${Cookies.get("session")}` } }
                                    );
                                    fetchWebhooks();
                                  } catch (e) { toast.error("Update failed"); }
                                }}
                              />
                              <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0CBB7D]"></div>
                            </label>
                            <button
                              onClick={() => handleTest(wh._id)}
                              disabled={testingId === wh._id}
                              title="Send test event to this webhook"
                              className={`text-gray-400 hover:text-blue-500 transition-all ${testingId === wh._id ? 'animate-pulse text-blue-400' : ''}`}
                            >
                              {testingId === wh._id ? <FiRefreshCw size={14} className="animate-spin" /> : <FiZap size={14} />}
                            </button>
                            <button 
                              onClick={() => {
                                setEditingWebhook(wh);
                                setFormData({
                                  url: wh.url,
                                  secret: wh.secret,
                                  topics: wh.topics,
                                  alertEmail: wh.alertEmail || "",
                                });
                                setIsModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-[#0CBB7D]"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(wh._id)} className="text-gray-400 hover:text-red-500">
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-gray-500 text-[12px]">
                        No webhooks found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4">
            {/* Filter Bar using existing DateFilter */}
            <div className="flex flex-wrap items-center justify-between gap-4 sm:mb-2 sm:mt-2">
              <div className="flex items-center gap-4">
                <DateFilter 
                  onDateChange={(range) => {
                    setDateRange(range);
                    setPage(1);
                  }} 
                  clearTrigger={refresh} 
                />
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-[600] text-gray-700">Errors Only</span>
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
                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setRefresh(prev => prev + 1)}
                  className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600 transition-all shadow-sm"
                >
                  <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} />
                </button>
              </div>
            </div>

            <div ref={tableRef} style={{ height: tableHeight }} className="overflow-auto relative bg-white border rounded-lg">
              <table className="min-w-full table-auto">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#0CBB7D] text-white text-[12px] font-[600]">
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
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center"><ThreeDotLoader /></td>
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
                        <td className="py-2 px-3 max-w-xs truncate text-[#0CBB7D]" title={log.url}>{log.url}</td>
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
                            log.status === "Success" ? "bg-green-100 text-[#0CBB7D] border-green-200" : "bg-red-100 text-red-600 border-red-200"
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
                            className="text-[#0CBB7D] hover:underline font-[600]"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-gray-500 text-[12px]">
                        No logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationFooter page={page} totalPages={totalPages} setPage={setPage} limit={limit} setLimit={setLimit} />
          </div>
        )}
      </div>

      {/* Add/Edit Webhook Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-[14px] font-[600] text-gray-700">{editingWebhook ? "Update Webhook" : "Add New Webhook"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[12px] font-[600] text-gray-700 flex items-center gap-1">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] outline-none transition-all text-[12px]"
                  placeholder="https://your-api.com/webhook"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-[600] text-gray-700 flex items-center gap-1">
                    Secret <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] outline-none transition-all text-[12px] pr-8"
                      placeholder="Enter secret"
                      value={formData.secret}
                      onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, secret: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)})}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0CBB7D]"
                    >
                      <FiRefreshCw size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-[600] text-gray-700">Alert Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] outline-none transition-all text-[12px]"
                    placeholder="tech@example.com"
                    value={formData.alertEmail}
                    onChange={(e) => setFormData({ ...formData, alertEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-[600] text-gray-700 flex items-center gap-1">
                  Topics <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {topicsList.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1 rounded-full text-[10px] font-[600] border transition-all ${
                        formData.topics.includes(topic)
                          ? "bg-[#0CBB7D] text-white border-[#0CBB7D]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#0CBB7D]"
                      }`}
                    >
                      {topic.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-[12px] font-[600] text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0CBB7D] text-white hover:bg-opacity-90 text-[12px] font-[600] transition-all"
                >
                  {editingWebhook ? "Update Webhook" : "Create Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <p className="text-[#0CBB7D] font-mono break-all">{selectedLog.url}</p>
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
                    <button onClick={() => copyToClipboard(JSON.stringify(selectedLog.payload, null, 2), "payload")} className="text-gray-400 hover:text-[#0CBB7D]">
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
                    <button onClick={() => copyToClipboard(JSON.stringify(selectedLog.response, null, 2), "response")} className="text-gray-400 hover:text-[#0CBB7D]">
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

export default Webhook;
