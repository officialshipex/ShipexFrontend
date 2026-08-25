import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const POLL_INTERVAL_MS = 15000;

const NotificationListContext = createContext(null);
export const useNotificationList = () => useContext(NotificationListContext);

// Module-level bridge so files outside this provider's subtree (e.g.
// order-submission handlers, the bulk-upload popup) can trigger an
// immediate refresh without prop drilling.
let bridge = null;

export const refreshNotifications = () => {
    if (bridge) bridge.refresh();
};

const authHeaders = () => ({ headers: { authorization: `Bearer ${Cookies.get("session")}` } });

export const NotificationListProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const intervalRef = useRef(null);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const fetchOnce = useCallback(async () => {
        try {
            const response = await axios.get(`${REACT_APP_BACKEND_URL}/app-notifications`, authHeaders());
            setNotifications(response.data?.notifications || []);
        } catch (error) {
            if (error?.response?.status === 401) stopPolling();
        }
    }, [stopPolling]);

    const startPolling = useCallback(() => {
        stopPolling();
        intervalRef.current = setInterval(fetchOnce, POLL_INTERVAL_MS);
    }, [fetchOnce, stopPolling]);

    useEffect(() => {
        fetchOnce();
        startPolling();
        return stopPolling;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        bridge = { refresh: fetchOnce };
        return () => { bridge = null; };
    }, [fetchOnce]);

    // Pause polling while the tab is hidden, resume + refresh immediately when visible.
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                fetchOnce();
                startPolling();
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [fetchOnce, startPolling, stopPolling]);

    const dismiss = useCallback(async (id) => {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        try {
            await axios.post(`${REACT_APP_BACKEND_URL}/app-notifications/${id}/dismiss`, {}, authHeaders());
        } catch (error) {
            // even if the dismiss call fails, keep it removed locally rather than
            // confusingly reappearing it — the next poll will resync either way
        }
    }, []);

    return (
        <NotificationListContext.Provider value={{ notifications, dismiss, refresh: fetchOnce }}>
            {children}
        </NotificationListContext.Provider>
    );
};
