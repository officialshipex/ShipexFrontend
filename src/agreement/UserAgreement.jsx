import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../Notification";

const UserAgreement = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  // The agreement shown inside the page (html null = still loading). It used to open in a new tab after the request
  // came back: browsers block a tab opened that late (always on phones), so the seller saw nothing at all.
  const [viewer, setViewer] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchAgreements = async () => {
    try {
      const token = Cookies.get("session");
      const res = await axios.get(
        `${REACT_APP_BACKEND_URL}/agreement/user/list`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setAgreements(res.data.agreements);
      }
    } catch (error) {
      console.error("Fetch agreements error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const handleMarkAsRead = async (agreement) => {
    const token = Cookies.get("session");
    setViewer({ ag: agreement, html: null });
    let html;
    try {
      const res = await axios.get(
        `${REACT_APP_BACKEND_URL}/agreement/user/preview/${agreement._id}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "text" }
      );
      html = String(res.data);
    } catch (error) {
      console.error("Failed to load agreement preview:", error);
      setViewer(null);
      Notification("Failed to load agreement", "error");
      return;
    }
    // marked read BEFORE it is shown: the server accepts only an agreement marked read, so the Accept button
    // under the agreement can never be refused for being too quick
    try {
      const res = await axios.get(
        `${REACT_APP_BACKEND_URL}/agreement/user/read/${agreement._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setAgreements((prev) =>
          prev.map((ag) =>
            ag._id === agreement._id ? { ...ag, isRead: true, readAt: new Date() } : ag
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
    setViewer((v) => (v && v.ag._id === agreement._id ? { ag: agreement, html } : v));
  };

  const acceptFromViewer = async () => {
    if (!viewer) return;
    setAccepting(true);
    await handleAccept(viewer.ag._id);
    setAccepting(false);
    setViewer(null);
  };

  const handleAccept = async (agreementId) => {
    try {
      const token = Cookies.get("session");
      const res = await axios.get(
        `${REACT_APP_BACKEND_URL}/agreement/user/accept/${agreementId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setAgreements((prev) =>
          prev.map((ag) =>
            ag._id === agreementId
              ? { ...ag, isAccepted: true, acceptedAt: new Date() }
              : ag
          )
        );
        Notification("Agreement accepted", "success");
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to accept agreement";
      Notification(msg, "error");
    }
  };

  const handleDownload = async (agreement) => {
    if (!agreement.isAccepted) {
      Notification("Please read and accept the agreement before downloading", "error");
      return;
    }
    try {
      const token = Cookies.get("session");
      const res = await axios.get(
        `${REACT_APP_BACKEND_URL}/agreement/user/download/${agreement._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Quickpost360_Agreement_${agreement.versionName.replace(/\s+/g, "_")}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download agreement error:", error);
      Notification("Failed to download agreement", "error");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="md:p-2">
      <h1 className="text-[12px] md:text-[14px] font-[600] text-gray-700 mb-2">Agreements</h1>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-auto">
        <table className="min-w-full bg-white">
          <thead className="sticky top-0 z-20">
            <tr className="text-[12px]">
              <th className="bg-brand-primary text-white font-bold px-3 py-2 border-b border-gray-300 text-left">S.No</th>
              <th className="bg-brand-primary text-white font-bold px-3 py-2 border-b border-gray-300 text-left">Version Name</th>
              <th className="bg-brand-primary text-white font-bold px-3 py-2 border-b border-gray-300 text-left">Created At</th>
              <th className="bg-brand-primary text-white font-bold px-3 py-2 border-b border-gray-300 text-center">Read</th>
              <th className="bg-brand-primary text-white font-bold px-3 py-2 border-b border-gray-300 text-center">Accept</th>
              <th className="bg-brand-primary text-white font-bold px-3 py-2 border-b border-gray-300 text-center">Download</th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-20 font-bold">Loading...</td>
              </tr>
            ) : agreements.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center font-bold py-20">No agreements available</td>
              </tr>
            ) : (
              agreements.map((ag, index) => (
                <tr key={ag._id} className="hover:bg-gray-50/80 transition-all duration-200">
                  <td className="border-b border-gray-300 px-3 py-2 text-left">{index + 1}</td>
                  <td className="border-b border-gray-300 px-3 py-2 text-left font-bold">{ag.versionName}</td>
                  <td className="border-b border-gray-300 px-3 py-2 text-left text-gray-500">{formatDate(ag.createdAt)}</td>
                  <td className="border-b border-gray-300 px-3 py-2 text-center">
                    {ag.isRead ? (
                      <button
                        onClick={() => handleMarkAsRead(ag)}
                        title="Read the agreement again"
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-secondary/10 text-brand-primary hover:bg-brand-secondary/20"
                      >
                        Read · View again
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAsRead(ag)}
                        className="bg-brand-primary text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-opacity-90 transition-all shadow-sm"
                      >
                        Click to Read
                      </button>
                    )}
                  </td>
                  <td className="border-b border-gray-300 px-3 py-2 text-center">
                    {ag.isAccepted ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-secondary/10 text-brand-primary">
                        Accepted
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAccept(ag._id)}
                        disabled={!ag.isRead}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                          ag.isRead
                            ? "bg-brand-primary text-white hover:bg-opacity-90"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Accept
                      </button>
                    )}
                  </td>
                  <td className="border-b border-gray-300 px-3 py-2 text-center">
                    {ag.isAccepted ? (
                      <button
                        onClick={() => handleDownload(ag)}
                        className="text-brand-primary text-[10px] font-bold hover:underline"
                      >
                        Download
                      </button>
                    ) : (
                      <span className="text-gray-400 text-[10px] font-bold cursor-not-allowed">
                        Download
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2 pb-2">
        {loading ? (
          <div className="text-center py-20 font-bold text-gray-500">Loading...</div>
        ) : agreements.length === 0 ? (
          <div className="text-center py-10 rounded-lg border">
            <p className="text-gray-500 font-bold">No agreements available</p>
          </div>
        ) : (
          agreements.map((ag, index) => (
            <div key={ag._id} className="bg-white border rounded-lg shadow-sm overflow-visible animate-popup-in">
              <div className="bg-brand-primary px-3 py-1.5 flex justify-between items-center rounded-t-lg">
                <span className="text-white font-bold text-[10px]">#{index + 1} - {ag.versionName}</span>
                {ag.isAccepted ? (
                  <button
                    onClick={() => handleDownload(ag)}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-brand-primary"
                  >
                    Download
                  </button>
                ) : (
                  <span className="text-white/60 text-[10px] font-bold">Locked</span>
                )}
              </div>
              <div className="px-3 py-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">Created At</span>
                  <span className="text-[10px] text-gray-500">{formatDate(ag.createdAt)}</span>
                </div>
                <div className="flex gap-2">
                  {ag.isRead ? (
                    <button
                      onClick={() => handleMarkAsRead(ag)}
                      className="flex-1 text-center px-2 py-1 rounded-full text-[10px] font-bold bg-brand-secondary/10 text-brand-primary"
                    >
                      Read · View again
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkAsRead(ag)}
                      className="flex-1 bg-brand-primary text-white py-1 rounded-lg text-[10px] font-bold hover:bg-opacity-90 transition-all shadow-sm"
                    >
                      Click to Read
                    </button>
                  )}
                  {ag.isAccepted ? (
                    <span className="flex-1 text-center px-2 py-1 rounded-full text-[10px] font-bold bg-brand-secondary/10 text-brand-primary">
                      Accepted
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAccept(ag._id)}
                      disabled={!ag.isRead}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                        ag.isRead
                          ? "bg-brand-primary text-white hover:bg-opacity-90"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Accept
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Agreement viewer: the contract inside the page (no new tab), with Accept right under it */}
      {viewer && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewer(null)} />
          <div role="dialog" aria-modal="true" aria-label={`Agreement ${viewer.ag.versionName}`}
            className="relative w-full max-w-4xl h-[92vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-popup-in">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
              <div className="min-w-0">
                <h2 className="text-[13px] font-bold text-gray-800 truncate">Merchant Agreement · {viewer.ag.versionName}</h2>
                <p className="text-[11px] text-gray-500">{viewer.ag.isAccepted ? "Accepted" : "Please read the agreement, then accept it below."}</p>
              </div>
              <button onClick={() => setViewer(null)} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 text-[16px] font-bold">×</button>
            </div>
            <div className="flex-1 min-h-0 bg-gray-50">
              {viewer.html === null ? (
                <div className="h-full flex items-center justify-center text-[12px] font-bold text-gray-500">Loading agreement…</div>
              ) : (
                <iframe title="Agreement" srcDoc={viewer.html} sandbox="" className="w-full h-full bg-white border-0" />
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t">
              <button onClick={() => setViewer(null)} className="px-3 py-1.5 rounded-lg border text-[11px] font-bold text-gray-600 hover:bg-gray-50">Close</button>
              {!viewer.ag.isAccepted && (
                <button onClick={acceptFromViewer} disabled={viewer.html === null || accepting}
                  className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-[11px] font-bold hover:bg-opacity-90 disabled:opacity-50">
                  {accepting ? "Accepting…" : "I accept this agreement"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAgreement;
