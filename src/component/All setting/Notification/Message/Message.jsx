import React, { useState, useEffect } from "react";
import { Switch } from "@headlessui/react";
import axios from "axios";
import Cookies from "js-cookie";
import { useOutletContext } from "react-router-dom";
import { Notification } from "../../../../Notification";
import EditTemplateModal from "../EditTemplateModal";

const SmsNotification = () => {
  const { targetUserId, isAdmin } = useOutletContext();
  const [mainEnabled, setMainEnabled] = useState(true);
  const [statusToggles, setStatusToggles] = useState({});
  const [statusTemplates, setStatusTemplates] = useState({});
  const [updatedTimes, setUpdatedTimes] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminBlocked, setAdminBlocked] = useState(false);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const token = Cookies.get("session");

  // Modern Order Statuses matching the system
  const statuses = [
    { key: "Booked", label: "Booked", defaultTemplate: "Your order {order_id} has been successfully booked. Track: {tracking_link}" },
    { key: "PickupPending", label: "Ready To Ship", defaultTemplate: "Your order {order_id} is ready to ship. Track: {tracking_link}" },
    { key: "In-transit", label: "In Transit", defaultTemplate: "Your order {order_id} is on the way. Track your package: {tracking_link}" },
    { key: "OutForDelivery", label: "Out for Delivery", defaultTemplate: "Your order {order_id} is out for delivery today. Be available to receive it." },
    { key: "Delivered", label: "Delivered", defaultTemplate: "Success! Your order {order_id} has been delivered. Enjoy!" },
    { key: "Undelivered", label: "Undelivered", defaultTemplate: "Delivery attempt for {order_id} was unsuccessful. We will retry soon." },
    { key: "RTO", label: "RTO Initiated", defaultTemplate: "Order {order_id} is being returned to sender. Track: {tracking_link}" },
    { key: "Cancelled", label: "Cancelled", defaultTemplate: "Your order {order_id} has been cancelled. Team Shipex." },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const fetchStatus = async () => {
      if (isAdmin && !targetUserId) return;
      try {
        setLoading(true);
        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/notification/getNotification`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: targetUserId ? { userId: targetUserId } : {}
          }
        );
        const data = res.data || {};
        setMainEnabled(data.isUserSMSEnable ?? true);
        setAdminBlocked(data.isAdminSMSEnable === false);

        const toggles = {};
        const updates = {};
        const templates = {};

        statuses.forEach((s) => {
          toggles[s.key] = data[`isSMS${s.key}Enable`] || false;
          updates[s.key] = data[`sms${s.key}UpdatedAt`];
          // Fallback to default if custom is empty
          templates[s.key] = data[`sms${s.key}Template`] || s.defaultTemplate;
        });

        setStatusToggles(toggles);
        setUpdatedTimes(updates);
        setStatusTemplates(templates);
      } catch (error) {
        console.error("Error fetching SMS settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [token, targetUserId]);

  const handleToggle = async (key) => {
    if (!mainEnabled) return;
    const newValue = !statusToggles[key];
    setStatusToggles((prev) => ({ ...prev, [key]: newValue }));

    try {
      setLoading(true);
      const res = await axios.put(
        `${REACT_APP_BACKEND_URL}/notification/updateNotification`,
        { field: `isSMS${key}Enable`, value: newValue, userId: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUpdatedTimes((prev) => ({
        ...prev,
        [key]: res.data?.updatedAt || new Date().toISOString(),
      }));
      Notification("SMS Settings Updated", "success");
    } catch (error) {
      console.error("Error updating SMS toggle:", error);
      Notification("Error updating SMS notification", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMainToggle = async (value) => {
    setMainEnabled(value);
    try {
      setLoading(true);
      await axios.put(
        `${REACT_APP_BACKEND_URL}/notification/updateNotification`,
        { field: "isUserSMSEnable", value, userId: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Notification("SMS Switch Updated", "success");
    } catch (error) {
      Notification("Error updating SMS switch", "error");
      console.error("Error updating main toggle:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (status) => {
    setEditingStatus(status);
    setIsModalOpen(true);
  };

  const handleUpdateTemplate = async ({ template }) => {
    if (!editingStatus) return;

    try {
      setLoading(true);
      await axios.put(
        `${REACT_APP_BACKEND_URL}/notification/updateNotification`,
        {
          field: `sms${editingStatus.key}`,
          template,
          userId: targetUserId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStatusTemplates(prev => ({ ...prev, [editingStatus.key]: template }));
      setUpdatedTimes(prev => ({ ...prev, [editingStatus.key]: new Date().toISOString() }));
      Notification("SMS Template Saved", "success");
    } catch (error) {
      console.error("Error updating template:", error);
      Notification("Error saving SMS template", "error");
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin && !targetUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-400 font-semibold text-[12px]">Search user to see the details</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={adminBlocked ? 'opacity-50 pointer-events-none grayscale-[30%]' : ''}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end mb-2 gap-2">
        <div className="flex items-center bg-white p-2 w-full justify-between rounded-lg border border-gray-100 shadow-sm">
          <div className="flex-1">
            {adminBlocked && (
              <div className="flex items-center gap-2 text-red-600 text-[11px] font-bold animate-pulse">
                <span className="bg-red-100 w-4 h-4 rounded-full flex items-center justify-center text-[10px]">!</span>
                SMS Notification is blocked from Admin. Please contact Account Manager.
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-gray-600">SMS Notifications</span>
            <Switch
              checked={mainEnabled}
              onChange={handleMainToggle}
              className={`${mainEnabled ? "bg-[#0CBB7D]" : "bg-gray-300"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
            >
              <span
                className={`${mainEnabled ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        </div>
      </div>

      <div className="hidden sm:block bg-white overflow-hidden">
        <div className="h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
          <table className="min-w-full text-[12px] border-collapse">
            <thead className="bg-[#0CBB7D] text-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="text-left px-3 py-2 font-bold tracking-wider">Status</th>
                <th className="text-left px-3 py-2 font-bold tracking-wider">Enable/Disable</th>
                <th className="text-left px-3 py-2 font-bold tracking-wider">Template</th>
                <th className="text-left px-3 py-2 font-bold tracking-wider">Updated On</th>
                <th className="text-center px-3 py-2 font-bold tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statuses.map((status) => (
                <tr
                  key={status.key}
                  className="hover:bg-gray-50/50 transition-colors text-gray-700"
                >
                  <td className="px-3 py-2">{status.label}</td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={!!statusToggles[status.key]}
                      onChange={() => handleToggle(status.key)}
                      disabled={!mainEnabled || loading}
                      className={`${statusToggles[status.key]
                          ? "bg-[#0CBB7D]"
                          : "bg-gray-300"
                        } ${!mainEnabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        } relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none`}
                    >
                      <span
                        className={`${statusToggles[status.key]
                            ? "translate-x-5"
                            : "translate-x-1"
                          } inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </td>
                  <td className="px-3 py-2 max-w-[350px]">
                    <p className="text-gray-600 text-[12px] line-clamp-2 leading-relaxed">
                      "{statusTemplates[status.key]}"
                    </p>
                  </td>
                  <td className="px-3 py-2 text-gray-500 font-medium">
                    {formatDate(updatedTimes[status.key])}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button 
                      onClick={() => openEditModal(status)}
                      className="text-[10px] text-[#0CBB7D] font-bold hover:bg-green-50 px-3 py-2 border border-green-100 rounded-lg transition-all"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="block sm:hidden h-[calc(100vh-250px)] overflow-y-auto pr-1">
        <div className="space-y-2">
        {statuses.map((status) => (
          <div
            key={status.key}
            className="bg-white border border-gray-200 rounded-lg shadow-sm py-2 px-3"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-700 text-[12px]">
                {status.label}
              </span>
              <Switch
                checked={!!statusToggles[status.key]}
                onChange={() => handleToggle(status.key)}
                disabled={!mainEnabled || loading}
                className={`${statusToggles[status.key] ? "bg-[#0CBB7D]" : "bg-gray-300"
                  } relative inline-flex h-5 w-10 items-center rounded-full transition-colors`}
              >
                <span
                  className={`${statusToggles[status.key]
                      ? "translate-x-5"
                      : "translate-x-1"
                    } inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
             <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2 text-[10px] text-gray-500 leading-relaxed">
                "{statusTemplates[status.key]}"
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-medium">
                {formatDate(updatedTimes[status.key])}
              </span>
              <button 
                onClick={() => openEditModal(status)}
                className="text-[#0CBB7D] font-bold text-[12px] px-4 py-1.5 border border-green-100 rounded-lg shadow-sm"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>

      <EditTemplateModal
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         onUpdate={handleUpdateTemplate}
         status={editingStatus}
         type="SMS"
         currentTemplate={editingStatus ? statusTemplates[editingStatus.key] : ""}
      />
      </div>
    </div>
  );
};

export default SmsNotification;
