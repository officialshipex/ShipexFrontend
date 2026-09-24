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
  FiCheck,
  FiZap,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import ThreeDotLoader from "../../../Loader";

const ManageWebhooks = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [showSecretId, setShowSecretId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [testingId, setTestingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    url: "",
    secret: "",
    topics: ["track_update"],
    alertEmail: "",
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const topicsList = ["track_update"];

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
    fetchWebhooks();
  }, []);

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

  return (
    <div className="space-y-2">
      {/* Subheader part: Responsive Sizes */}
      <div className="flex justify-between items-center sm:mb-2 sm:mt-2">
        <h2 className="text-[11px] sm:text-[14px] font-[600] text-gray-700">All Configured Webhooks</h2>
        <div className="flex gap-1.5 sm:gap-2">
          <button 
            onClick={() => fetchWebhooks()}
            className="p-1.5 sm:p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600 transition-all shadow-sm"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={14} />
          </button>
          <button
            onClick={() => {
              setEditingWebhook(null);
              setFormData({ url: "", secret: "", topics: ["track_update"], alertEmail: "" });
              setIsModalOpen(true);
            }}
            className="bg-brand-primary text-white text-[10px] sm:text-[12px] font-[600] rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-2 hover:bg-opacity-90 transition flex items-center gap-1 sm:gap-2 shadow-sm"
          >
            <FiPlus size={12} /> Add Webhook
          </button>
        </div>
      </div>

      {/* Desktop Table View - ALWAYS render header structure */}
      <div ref={tableRef} style={{ height: tableHeight }} className="hidden md:block overflow-auto relative bg-white">
        <table className="min-w-full table-auto">
          <thead className="sticky top-0 z-10">
            <tr className="bg-brand-primary text-white text-[12px] font-[600]">
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
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center bg-white"><ThreeDotLoader /></td>
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
                  <td className="py-2 px-3 max-w-xs truncate text-brand-primary" title={wh.url}>{wh.url}</td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {wh.topics.map((t) => (
                        <span key={t} className="bg-brand-secondary/10 text-brand-primary text-[10px] px-2 py-0.5 rounded border border-brand-secondary/26">
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
                      <button onClick={() => copyToClipboard(wh.secret, wh._id + "_secret")} className="text-gray-400 hover:text-brand-primary">
                        {copiedId === wh._id + "_secret" ? <FiCheck size={14} className="text-brand-primary" /> : <FiCopy size={14} />}
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
                        <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-primary"></div>
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
                        className="text-gray-400 hover:text-brand-primary"
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
                <td colSpan="7" className="py-12 text-center text-gray-500 text-[12px] bg-white">No webhooks found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Ultra-Compact Card View */}
      <div className="block md:hidden">
        {loading ? (
          <div className="py-12 text-center bg-white border border-gray-100 rounded-lg"><ThreeDotLoader /></div>
        ) : webhooks.length > 0 ? (
          <div className="space-y-2.5">
            {webhooks.map((wh) => (
              <div key={wh._id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow transition-all relative">
                {/* Compact Row 1: ID & Status */}
                <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-gray-500 font-semibold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                      {wh.webhookId}
                    </span>
                    <span className="text-[9px] text-gray-400">
                      {new Date(wh.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
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
                      <div className="w-7 h-3.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                    <span className={`text-[9px] font-[600] ${wh.isActive ? "text-brand-primary" : "text-gray-400"}`}>
                      {wh.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Compact Row 2: URL */}
                <div className="mb-1.5">
                  <p className="text-[11px] font-medium text-gray-800 break-all select-all hover:text-brand-primary transition-colors">{wh.url}</p>
                </div>

                {/* Compact Row 3: Topics & Email & Secret */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-[10px] text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Topic:</span>
                    <span className="bg-brand-secondary/10 text-brand-primary font-[600] px-1.5 py-0.2 rounded border border-brand-secondary/16">
                      {wh.topics[0] || "track_update"}
                    </span>
                  </div>
                  {wh.alertEmail && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Alert:</span>
                      <span className="font-medium text-gray-700">{wh.alertEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Secret:</span>
                    <span className="font-mono text-[9px] text-gray-500">
                      {showSecretId === wh._id ? wh.secret : "••••••••"}
                    </span>
                    <button 
                      onClick={() => setShowSecretId(showSecretId === wh._id ? null : wh._id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showSecretId === wh._id ? <FiEyeOff size={10} /> : <FiEye size={10} />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(wh.secret, wh._id + "_secret")} 
                      className="text-gray-400 hover:text-brand-primary"
                    >
                      {copiedId === wh._id + "_secret" ? <FiCheck size={10} className="text-brand-primary" /> : <FiCopy size={10} />}
                    </button>
                  </div>
                </div>

                {/* Compact Row 4: Action Buttons */}
                <div className="flex justify-end gap-1.5 pt-1.5 border-t border-gray-100">
                  <button
                    onClick={() => handleTest(wh._id)}
                    disabled={testingId === wh._id}
                    className={`flex items-center gap-1 px-2.5 py-1 border border-blue-100 text-blue-600 rounded-md text-[10px] font-[600] hover:bg-blue-50 transition shadow-sm ${
                      testingId === wh._id ? 'animate-pulse text-blue-400' : ''
                    }`}
                  >
                    {testingId === wh._id ? <FiRefreshCw size={10} className="animate-spin" /> : <FiZap size={10} />}
                    Test
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
                    className="flex items-center gap-1 px-2.5 py-1 border border-brand-secondary/16 text-brand-primary rounded-md text-[10px] font-[600] hover:bg-brand-secondary/8 transition shadow-sm"
                  >
                    <FiEdit2 size={10} />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(wh._id)} 
                    className="flex items-center gap-1 px-2.5 py-1 border border-red-100 text-red-600 rounded-md text-[10px] font-[600] hover:bg-red-50 transition shadow-sm"
                  >
                    <FiTrash2 size={10} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 text-[12px] bg-white border border-gray-100 rounded-lg">No webhooks found</div>
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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-[12px]"
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-[12px] pr-8"
                      placeholder="Enter secret"
                      value={formData.secret}
                      onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, secret: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)})}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary"
                    >
                      <FiRefreshCw size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-[600] text-gray-700">Alert Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-[12px]"
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
                          ? "bg-brand-primary text-white border-brand-primary"
                          : "bg-white text-gray-600 border-gray-200 hover:border-brand-primary"
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
                  className="px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-opacity-90 text-[12px] font-[600] transition-all"
                >
                  {editingWebhook ? "Update Webhook" : "Create Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageWebhooks;
