import React, { useState, useEffect } from "react";
import { Switch } from "@headlessui/react";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../../../Notification"

const Whatsapp = () => {
  const [mainEnabled, setMainEnabled] = useState(true);
  const [statusToggles, setStatusToggles] = useState({});
  const [updatedTimes, setUpdatedTimes] = useState({});
  const [loading, setLoading] = useState(false);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const token = Cookies.get("session");

  // Define statuses
  const statuses = [
    {
      key: "PickupPending",
      label: "Pickup Pending",
      template:
        "Dear Customer, your order has been created and is pending pickup. We'll notify you once it’s picked up. Track: {tracking_link}",
    },
    {
      key: "Intransit",
      label: "In Transit",
      template:
        "Good news! Your order is on the way and currently in transit. Track your package here: {tracking_link}",
    },
    {
      key: "OutForDelivery",
      label: "Out for Delivery",
      template:
        "Your order is out for delivery. Please keep your phone available. Track: {tracking_link}",
    },
    {
      key: "Delivered",
      label: "Delivered",
      template:
        "Your order has been successfully delivered. Thank you for choosing us!",
    },
    {
      key: "Undelivered",
      label: "Undelivered",
      template:
        "Delivery attempt was unsuccessful. We will retry soon. Track your shipment: {tracking_link}",
    },
    {
      key: "RTO",
      label: "RTO Initiated",
      template:
        "Your order is being returned to the sender (RTO initiated). You can track it here: {tracking_link}",
    },
  ];

  // Format updatedAt date
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

  // Fetch from backend
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/notification/getNotification`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data || {};
        setMainEnabled(data.isUserWhatsAppEnable ?? true);

        const toggles = {};
        const updates = {};
        statuses.forEach((s) => {
          toggles[s.key] = data[`isWhatsApp${s.key}Enable`] || false;
          updates[s.key] = data[`whatsapp${s.key}UpdatedAt`];
        });
        setStatusToggles(toggles);
        setUpdatedTimes(updates);
      } catch (error) {
        console.error("Error fetching WhatsApp settings:", error);
      }
    };
    fetchStatus();
  }, []);

  // Update individual toggle
  const handleToggle = async (key) => {
    if (!mainEnabled) return;
    const newValue = !statusToggles[key];
    setStatusToggles((prev) => ({ ...prev, [key]: newValue }));

    try {
      setLoading(true);
      const res = await axios.put(
        `${REACT_APP_BACKEND_URL}/notification/updateNotification`,
        { field: `isWhatsApp${key}Enable`, value: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update updatedAt field dynamically
      setUpdatedTimes((prev) => ({
        ...prev,
        [key]: res.data?.updatedAt || new Date().toISOString(),
      }));
      Notification("Updated Successfully", 'success')
    } catch (error) {
      console.error("Error updating toggle:", error);
      Notification("Error updating whatsapp notification", "error")
    } finally {
      setLoading(false);
    }
  };

  // Update main toggle
  const handleMainToggle = async (value) => {
    setMainEnabled(value);
    try {
      setLoading(true);
      await axios.put(
        `${REACT_APP_BACKEND_URL}/notification/updateNotification`,
        { field: "isUserWhatsAppEnable", value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Notification("WhatsApp notification update successfully", "success")
    } catch (error) {
      Notification("Error updating whatsapp notification","error")
      console.error("Error updating main toggle:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end mb-2 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-600">Turn Enable/disable</span>
          <Switch
            checked={mainEnabled}
            onChange={handleMainToggle}
            className={`${mainEnabled ? "bg-[#0CBB7D]" : "bg-gray-300"
              } relative inline-flex h-6 w-11 items-center rounded-full transition`}
          >
            <span
              className={`${mainEnabled ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
            />
          </Switch>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto bg-white border border-gray-200 shadow-sm">
        <table className="min-w-full text-[12px]">
          <thead className="bg-[#0CBB7D] text-white">
            <tr>
              <th className="text-left px-3 py-2 w-[200px]">Order Status</th>
              <th className="text-left px-3 py-2 w-[150px]">Enable/Disable</th>
              <th className="text-left px-3 py-2 w-[100px]">Template</th>
              <th className="text-left px-3 py-2 w-[100px]">Updated At</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((status) => (
              <tr
                key={status.key}
                className="border-b hover:bg-gray-50 transition text-gray-700"
              >
                <td className="px-3 py-2 whitespace-nowrap">{status.label}</td>
                <td className="px-3 py-2">
                  <Switch
                    checked={!!statusToggles[status.key]}
                    onChange={() => handleToggle(status.key)}
                    disabled={!mainEnabled || loading}
                    className={`${statusToggles[status.key]
                        ? "bg-[#0CBB7D]"
                        : "bg-gray-300"
                      } ${!mainEnabled ? "opacity-50 cursor-not-allowed" : ""
                      } relative inline-flex h-5 w-10 items-center rounded-full transition`}
                  >
                    <span
                      className={`${statusToggles[status.key]
                          ? "translate-x-5"
                          : "translate-x-1"
                        } inline-block h-3.5 w-3.5 transform rounded-full bg-white transition`}
                    />
                  </Switch>
                </td>
                <td className="px-3 py-2 text-gray-500 w-[350px] break-words">
                  {status.template}
                </td>
                <td className="px-3 py-2 text-gray-500">
                  {formatDate(updatedTimes[status.key])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="block sm:hidden space-y-2">
        {statuses.map((status) => (
          <div
            key={status.key}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 flex flex-col gap-2"
          >
            <div className="flex justify-between items-center">
              <span className="font-[600] text-gray-700 text-[12px]">
                {status.label}
              </span>
              <Switch
                checked={!!statusToggles[status.key]}
                onChange={() => handleToggle(status.key)}
                disabled={!mainEnabled || loading}
                className={`${statusToggles[status.key] ? "bg-[#0CBB7D]" : "bg-gray-300"
                  } ${!mainEnabled ? "opacity-50 cursor-not-allowed" : ""
                  } relative inline-flex h-5 w-10 items-center rounded-full transition`}
              >
                <span
                  className={`${statusToggles[status.key]
                      ? "translate-x-5"
                      : "translate-x-1"
                    } inline-block h-3.5 w-3.5 transform rounded-full bg-white transition`}
                />
              </Switch>
            </div>
            <p className="text-[12px] text-gray-500 mt-1">
              {status.template}
            </p>
            <p className="text-[12px] text-gray-500 italic mt-1">
              Updated: {formatDate(updatedTimes[status.key])}
            </p>
          </div>
        ))}
      </div>

      {/* {loading && (
        <p className="text-center text-[12px] text-gray-500 mt-2">
          Updating settings...
        </p>
      )} */}
    </div>
  );
};

export default Whatsapp;
