import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { 
  Plus, 
  Search, 
  X,
  Check,
  ChevronDown
} from "lucide-react";
import { AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import { Notification } from "../../../Notification";
import ThreeDotLoader from "../../../Loader";
import UserFilter from "../../../filter/UserFilter";
import dayjs from "dayjs";

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [message, setMessage] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [targetAudience, setTargetAudience] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [disableType, setDisableType] = useState("manual");
  const [automatedDuration, setAutomatedDuration] = useState("1h");
  const [customDate, setCustomDate] = useState("");

  const [userFilterClearTrigger, setUserFilterClearTrigger] = useState(false);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const token = Cookies.get("session");

  const fetchAnnouncements = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const { data } = await axios.get(`${REACT_APP_BACKEND_URL}/announcement/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error("Failed to fetch announcements", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [REACT_APP_BACKEND_URL, token]);

  useEffect(() => {
    if (token) {
      fetchAnnouncements();
      // Refresh every 5 minutes to catch updates
      const interval = setInterval(() => fetchAnnouncements(false), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token, fetchAnnouncements]);

  const resetForm = () => {
    setMessage("");
    setEnabled(true);
    setTargetAudience("all");
    setSelectedUsers([]);
    setDisableType("manual");
    setAutomatedDuration("1h");
    setCustomDate("");
    setEditingId(null);
    setShowModal(false);
  };

  const handleCreateOrUpdate = async () => {
    if (!message) {
      Notification("Announcement message is required", "error");
      return;
    }

    if (targetAudience === "selected" && selectedUsers.length === 0) {
      Notification("Please select at least one user", "error");
      return;
    }

    const payload = {
      message,
      enabled,
      targetAudience,
      selectedUsers: selectedUsers.map(u => u._id),
      disableType,
      automatedDuration: disableType === "automated" ? automatedDuration : null,
      automatedDisableUntil: (disableType === "automated" && automatedDuration === "custom") ? customDate : null
    };

    try {
      let res;
      if (editingId) {
        res = await axios.put(`${REACT_APP_BACKEND_URL}/announcement/update/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.post(`${REACT_APP_BACKEND_URL}/announcement/create`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (res.data.success) {
        Notification(editingId ? "Announcement updated" : "Announcement created", "success");
        await fetchAnnouncements();
        resetForm();
      }
    } catch (error) {
      Notification(error.response?.data?.message || "Operation failed", "error");
    }
  };

  const handleEdit = (ann) => {
    setEditingId(ann._id);
    setMessage(ann.message);
    setEnabled(ann.enabled);
    setTargetAudience(ann.targetAudience);
    setSelectedUsers(ann.selectedUsers || []);
    setDisableType(ann.disableType);
    setAutomatedDuration(ann.automatedDuration || "1h");
    setCustomDate(ann.automatedDisableUntil ? dayjs(ann.automatedDisableUntil).format("YYYY-MM-DDTHH:mm") : "");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        const { data } = await axios.delete(`${REACT_APP_BACKEND_URL}/announcement/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          Notification("Announcement deleted", "success");
          fetchAnnouncements();
        }
      } catch (error) {
        Notification("Delete failed", "error");
      }
    }
  };

  const toggleEnable = async (ann) => {
    try {
      const { data } = await axios.put(`${REACT_APP_BACKEND_URL}/announcement/update/${ann._id}`, 
        { ...ann, enabled: !ann.enabled }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        Notification(`Announcement ${!ann.enabled ? 'enabled' : 'disabled'}`, "success");
        fetchAnnouncements();
      }
    } catch (error) {
      Notification("Update failed", "error");
    }
  };

  const handleUserSelect = (userId, userObj) => {
    if (selectedUsers.some(u => u._id === userId)) {
      Notification("User already selected", "info");
      return;
    }
    setSelectedUsers([...selectedUsers, { _id: userId, fullname: userObj?.fullname || "User", email: userObj?.email }]);
    setUserFilterClearTrigger(prev => !prev);
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  return (
    <div className="sm:p-2 bg-gray-50 min-h-[calc(100vh-76px)] flex flex-col">
      <div className="w-full mx-auto flex flex-col flex-1">
        {/* Header */}
        <div className="flex flex-row justify-between items-center mb-2 gap-2">
          <div>
            <h1 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
              Important Announcement
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#0CBB7D] text-white px-3 py-2 rounded-lg text-[12px] font-[600] flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus size={16} /> Create Announcement
          </button>
        </div>

        {/* Table Container (Desktop) */}
        <div className="bg-white overflow-hidden flex-1 flex flex-col hidden sm:block">
          <div className="overflow-auto flex-1 h-[calc(100vh-160px)]">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-[#0CBB7D] text-white font-[600] sticky top-0 z-10">
                <tr className="text-[12px]">
                  <th className="px-3 py-2 font-[600]">Created At</th>
                  <th className="px-3 py-2 font-[600] w-1/3">Announcement Message</th>
                  <th className="px-3 py-2 font-[600]">Time Period</th>
                  <th className="px-3 py-2 font-[600]">User Scope</th>
                  <th className="px-3 py-2 font-[600]">Status</th>
                  <th className="px-3 py-2 font-[600] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-center">
                      <ThreeDotLoader />
                    </td>
                  </tr>
                ) : announcements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-center font-bold text-gray-400">
                      No Announcements Found
                    </td>
                  </tr>
                ) : (
                  announcements.map((ann) => (
                    <tr key={ann._id} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2">
                        <p className="font-[600] text-gray-700">{dayjs(ann.createdAt).format("DD MMM YYYY")}</p>
                        <p className="text-[10px] text-gray-400">{dayjs(ann.createdAt).format("hh:mm A")}</p>
                      </td>
                      <td className="px-3 py-2 relative group">
                        <p className="font-medium text-gray-700 leading-snug line-clamp-1 max-w-[300px]" title={ann.message}>
                          {ann.message}
                        </p>
                        {/* Custom Tooltip on Hover */}
                        <div className="absolute z-[200] hidden group-hover:block bg-white text-gray-700 text-[10px] p-2 rounded shadow-2xl w-[300px] border left-10 top-full mt-1 break-words">
                          {ann.message}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold w-fit ${ann.disableType === "manual" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
                            {ann.disableType === "manual" ? "Manual" : "Automated"}
                          </span>
                          {ann.disableType === "automated" && (
                            <p className="text-[10px] text-gray-400 font-medium">
                              Until: {dayjs(ann.automatedDisableUntil).format("DD MMM, hh:mm A")}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-[600] text-gray-600 text-[12px]">
                          {ann.targetAudience === "all" ? "All Users" : `Selected (${ann.selectedUsers?.length || 0})`}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={ann.enabled}
                            onChange={() => toggleEnable(ann)}
                          />
                          <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-[#0CBB7D] transition-all"></div>
                          <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                        </label>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(ann)}
                            className="p-1 text-white hover:text-gray-100 hover:bg-green-600 rounded-full bg-[#0CBB7D] transition shadow-sm"
                            title="Edit"
                          >
                            <AiOutlineEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(ann._id)}
                            className="p-1 text-red-600 bg-red-100 rounded-full hover:text-red-700 hover:bg-red-200 transition shadow-sm"
                            title="Delete"
                          >
                            <AiOutlineDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card List (Mobile) - Condensed */}
        <div className="sm:hidden flex-1 overflow-y-auto h-[calc(100vh-160px)] space-y-2 pb-2">
          {loading ? (
            <div className="py-20 text-center"><ThreeDotLoader /></div>
          ) : announcements.length === 0 ? (
            <div className="py-20 text-center font-bold text-gray-400">No Announcements Found</div>
          ) : (
            announcements.map((ann) => (
              <div key={ann._id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                {/* Header: Date + Toggle + Actions */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-700">{dayjs(ann.createdAt).format("DD MMM YYYY")}</span>
                    <span className="text-[9px] text-gray-400">{dayjs(ann.createdAt).format("hh:mm A")}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={ann.enabled}
                        onChange={() => toggleEnable(ann)}
                      />
                      <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:bg-[#0CBB7D] transition-all"></div>
                      <div className="absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                    </label>
                    <div className="flex items-center gap-1.5 border-l pl-2">
                       <button onClick={() => handleEdit(ann)} className="p-1.5 text-[#0CBB7D] hover:bg-green-50 rounded-full transition-all">
                         <AiOutlineEdit size={16} />
                       </button>
                       <button onClick={() => handleDelete(ann._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-all">
                         <AiOutlineDelete size={16} />
                       </button>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-2">
                  <p className="text-[11px] font-medium text-gray-700 leading-snug">
                    {ann.message}
                  </p>
                </div>

                {/* Compact Footer Details */}
                <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold ${ann.disableType === "manual" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                      {ann.disableType === "manual" ? "Manual" : "Automated"}
                    </span>
                    {ann.disableType === "automated" && (
                      <span className="text-[9px] text-gray-400 font-medium">Until {dayjs(ann.automatedDisableUntil).format("DD MMM")}</span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    {ann.targetAudience === "all" ? "Public" : `${ann.selectedUsers?.length || 0} Users`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Side Drawer / Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={resetForm}></div>
            
            <div className="relative w-full max-w-[450px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-[14px] font-bold text-gray-700 tracking-tight flex items-center gap-2">
                  {editingId ? "Edit Announcement" : "Create Announcement"}
                </h2>
                <button 
                  onClick={resetForm}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Message */}
                <div className="space-y-1">
                  <label className="text-[12px] font-[600] text-gray-700">Announcement Text Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter announcement message..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-[12px] font-[600] text-gray-700 focus:outline-none focus:border-[#0CBB7D] transition-all h-28 resize-none shadow-sm"
                  />
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <h4 className="text-[12px] font-bold text-gray-700">Active Status</h4>
                    <p className="text-[10px] text-gray-400">Toggle display on dashboard</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={enabled}
                      onChange={() => setEnabled(!enabled)}
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#0CBB7D] transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                  </label>
                </div>

                {/* Audience Selection */}
                <div className="space-y-3">
                  <label className="text-[12px] font-[600] text-gray-700">Selection for Users</label>
                  <div className="flex items-center gap-8 p-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="audience"
                          checked={targetAudience === "all"}
                          onChange={() => setTargetAudience("all")}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${targetAudience === "all" ? "border-[#0CBB7D]" : "border-gray-300 group-hover:border-gray-400"}`}>
                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0CBB7D] transition-transform ${targetAudience === "all" ? "scale-100" : "scale-0"}`}></div>
                        </div>
                      </div>
                      <span className={`text-[12px] font-[600] transition-colors ${targetAudience === "all" ? "text-gray-900" : "text-gray-500"}`}>All Users</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="audience"
                          checked={targetAudience === "selected"}
                          onChange={() => setTargetAudience("selected")}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${targetAudience === "selected" ? "border-[#0CBB7D]" : "border-gray-300 group-hover:border-gray-400"}`}>
                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0CBB7D] transition-transform ${targetAudience === "selected" ? "scale-100" : "scale-0"}`}></div>
                        </div>
                      </div>
                      <span className={`text-[12px] font-[600] transition-colors ${targetAudience === "selected" ? "text-gray-900" : "text-gray-500"}`}>Selected Users</span>
                    </label>
                  </div>

                  {targetAudience === "selected" && (
                    <div className="animate-popup-in space-y-3 p-3 border border-gray-100 rounded-lg bg-gray-50">
                      <div className="relative">
                        <UserFilter 
                          onUserSelect={handleUserSelect} 
                          clearTrigger={userFilterClearTrigger}
                        />
                      </div>
                      
                      {/* Selected Users List */}
                      <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                        {selectedUsers.length > 0 ? (
                          selectedUsers.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg text-[11px] hover:border-[#0CBB7D] transition-colors">
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-gray-700 truncate">{user.fullname}</span>
                                <span className="text-gray-400 truncate">{user.email}</span>
                              </div>
                              <button 
                                onClick={() => removeSelectedUser(user._id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <AiOutlineDelete size={14} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-[11px] text-gray-400 italic">No users selected</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Disable Type */}
                <div className="space-y-3">
                  <label className="text-[12px] font-[600] text-gray-700">Disable Mode</label>
                  <div className="flex items-center gap-8 p-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="disableType"
                          checked={disableType === "manual"}
                          onChange={() => setDisableType("manual")}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${disableType === "manual" ? "border-[#0CBB7D]" : "border-gray-300 group-hover:border-gray-400"}`}>
                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0CBB7D] transition-transform ${disableType === "manual" ? "scale-100" : "scale-0"}`}></div>
                        </div>
                      </div>
                      <span className={`text-[12px] font-[600] transition-colors ${disableType === "manual" ? "text-gray-900" : "text-gray-500"}`}>Manual Disable</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name="disableType"
                          checked={disableType === "automated"}
                          onChange={() => setDisableType("automated")}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${disableType === "automated" ? "border-[#0CBB7D]" : "border-gray-300 group-hover:border-gray-400"}`}>
                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0CBB7D] transition-transform ${disableType === "automated" ? "scale-100" : "scale-0"}`}></div>
                        </div>
                      </div>
                      <span className={`text-[12px] font-[600] transition-colors ${disableType === "automated" ? "text-gray-900" : "text-gray-500"}`}>Automated Disable</span>
                    </label>
                  </div>

                  {disableType === "automated" && (
                    <div className="animate-popup-in grid grid-cols-1 gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Duration</label>
                        <div className="relative">
                          <select
                            value={automatedDuration}
                            onChange={(e) => setAutomatedDuration(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg p-2 text-[12px] font-[600] text-gray-700 focus:outline-none focus:border-[#0CBB7D] appearance-none shadow-sm"
                          >
                            <option value="1h">1 Hour</option>
                            <option value="1d">1 Day</option>
                            <option value="5d">5 Days</option>
                            <option value="custom">Custom Date</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      
                      {automatedDuration === "custom" && (
                        <div className="animate-popup-in">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Date & Time</label>
                          <input
                            type="datetime-local"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg p-2 text-[12px] font-[600] text-gray-700 focus:outline-none focus:border-[#0CBB7D] shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-white flex gap-3 shadow-top">
                <button
                  onClick={resetForm}
                  className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-lg text-[12px] font-[600] hover:bg-gray-50 hover:text-red-500 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrUpdate}
                  className="flex-1 py-2 bg-[#0CBB7D] text-white rounded-lg text-[12px] font-[600] hover:bg-opacity-90 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Check size={16} /> {editingId ? "Update" : "Save"} Announcement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcement;
