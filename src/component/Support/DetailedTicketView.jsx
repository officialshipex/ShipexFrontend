import React, { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { FiDownload } from "react-icons/fi";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";
import { formatTicketDate, isTicketClosed } from "./ticketStatus";
import { StatusBadge } from "./StatusTabs";

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
    <span className="text-[12px] text-gray-500 shrink-0">{label}</span>
    <span className="text-[12px] font-[600] text-gray-700 text-right break-words min-w-0">{value || "N/A"}</span>
  </div>
);

// One message of the conversation. The viewer's own side sits on the right.
const Bubble = ({ name, time, text, mine, fromSupport }) => (
  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-[85%] md:max-w-[75%] rounded-xl px-3 py-2 ${fromSupport ? "bg-green-50 border border-green-100" : "bg-gray-100 border border-gray-200"}`}>
      <div className="flex flex-wrap items-baseline gap-x-2 mb-0.5">
        <span className={`text-[11px] font-[600] ${fromSupport ? "text-green-700" : "text-gray-700"}`}>{name}</span>
        <span className="text-[10px] text-gray-400">{time}</span>
      </div>
      <p className="text-[12px] text-gray-700 whitespace-pre-wrap break-words">{text}</p>
    </div>
  </div>
);

// One ticket: its details, the conversation and the reply box.
//   isSupportSide  the admin side: opening a new ticket marks it Open, replies go out as the support team
//   canUpdate      may reply, close and delete on the admin side; a seller can always reply on their own ticket
const DetailedTicketView = ({ ticket: initialTicket, onClose, onTicketUpdated, onTicketDeleted, isSupportSide = false, canUpdate = false }) => {
  const [ticket, setTicket] = useState(initialTicket);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [busy, setBusy] = useState(false);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const authHeaders = () => ({ authorization: `Bearer ${Cookies.get("session")}` });

  const applyUpdate = (updated) => {
    if (!updated) return;
    setTicket(updated);
    if (onTicketUpdated) onTicketUpdated(updated);
  };

  // Support opening a new ticket: new → open
  useEffect(() => {
    if (!isSupportSide || !["new", "active"].includes(initialTicket?.status)) return;
    axios
      .put(`${REACT_APP_BACKEND_URL}/support/${initialTicket._id}/view`, {}, { headers: authHeaders() })
      .then((res) => applyUpdate(res.data.ticket))
      .catch(() => {}); // only the status label; the ticket is still readable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTicket?._id]);

  if (!ticket) return null;

  const { _id, ticketNumber, fullname, email, phoneNumber, awbNumbers, category, subcategory, status, createdAt, company, message, isAdmin } = ticket;
  const messages = ticket.messages || [];
  const attachments = ticket.attachments || [];
  const closed = isTicketClosed(status);
  const canReply = !closed && (!isSupportSide || canUpdate);

  const handleReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    setReplying(true);
    try {
      const res = await axios.post(
        `${REACT_APP_BACKEND_URL}/support/${_id}/reply`,
        { message: text, senderRole: isSupportSide ? "admin" : "user", senderName: isSupportSide ? "Support Team" : fullname },
        { headers: authHeaders() }
      );
      applyUpdate(res.data.ticket);
      setReplyText("");
    } catch (error) {
      Notification(error.response?.data?.message || "Failed to send your reply.", "error");
    } finally {
      setReplying(false);
    }
  };

  const handleClose = async () => {
    setBusy(true);
    try {
      const res = await axios.put(`${REACT_APP_BACKEND_URL}/support/${_id}/close`, {}, { headers: authHeaders() });
      applyUpdate(res.data.ticket);
      Notification("Ticket closed.", "success");
    } catch (error) {
      Notification(error.response?.data?.message || "Failed to close the ticket.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ticket ${ticketNumber}? It will disappear for the seller too.`)) return;
    setBusy(true);
    try {
      await axios.put(`${REACT_APP_BACKEND_URL}/support/${_id}/status`, { status: "deleted" }, { headers: authHeaders() });
      Notification("Ticket deleted.", "success");
      if (onTicketDeleted) onTicketDeleted(_id);
      onClose();
    } catch (error) {
      Notification(error.response?.data?.message || "Failed to delete the ticket.", "error");
      setBusy(false);
    }
  };

  const downloadAttachment = async (index, filePath) => {
    try {
      const res = await axios.get(`${REACT_APP_BACKEND_URL}/support/${_id}/attachments/${index}`, {
        headers: authHeaders(),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = String(filePath).split(/[\\/]/).pop() || `attachment-${index + 1}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Notification("Could not download this file.", "error");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onClose}
            aria-label="Back"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-[12px] font-[600]"
          >
            <IoArrowBack />
            Back
          </button>
          <h2 className="text-[14px] md:text-[16px] font-[600] text-gray-800">Ticket #{ticketNumber}</h2>
          <StatusBadge status={status} />
        </div>
        {isSupportSide && canUpdate && (
          <div className="flex gap-2">
            {!closed && (
              <button
                className="px-3 py-1.5 rounded-lg bg-brand-primary text-white font-[600] text-[12px] hover:opacity-90 disabled:opacity-50"
                disabled={busy}
                onClick={handleClose}
              >
                Mark Closed
              </button>
            )}
            <button
              className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 font-[600] text-[12px] hover:bg-red-50 disabled:opacity-50"
              disabled={busy}
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Conversation */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-[13px] font-[600] text-gray-800">{subcategory || "Conversation"}</p>
            <p className="text-[11px] text-gray-500">{category}</p>
          </div>

          <div className="p-4 flex flex-col gap-2">
            <Bubble name={fullname || "User"} time={formatTicketDate(createdAt)} text={message || "No message provided."} mine={!isSupportSide} />
            {messages.map((msg, index) => (
              <Bubble
                key={index}
                name={msg.senderName}
                time={formatTicketDate(msg.sentAt)}
                text={msg.message}
                fromSupport={msg.sender === "admin"}
                mine={isSupportSide ? msg.sender === "admin" : msg.sender !== "admin"}
              />
            ))}
          </div>

          {canReply && (
            <div className="p-4 border-t border-gray-100">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <div className="flex justify-end mt-2">
                <button
                  className="px-4 py-1.5 rounded-lg bg-brand-primary text-white font-[600] text-[12px] hover:opacity-90 disabled:opacity-50"
                  disabled={replying || !replyText.trim()}
                  onClick={handleReply}
                >
                  {replying ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </div>
          )}
          {closed && (
            <p className="m-4 mt-0 text-center text-[12px] font-[600] text-gray-500 bg-gray-100 rounded-lg py-2">This ticket is closed.</p>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2">
            <p className="text-[13px] font-[600] text-gray-800 py-2">Details</p>
            <DetailRow label="Created" value={formatTicketDate(createdAt)} />
            <DetailRow label="AWB" value={awbNumbers && awbNumbers.length > 0 ? awbNumbers.join(", ") : null} />
            <DetailRow label="Name" value={fullname} />
            <DetailRow label="Email" value={email} />
            <DetailRow label="Phone" value={phoneNumber} />
            <DetailRow label="Company" value={company} />
            {isSupportSide && <DetailRow label="Platform" value={isAdmin ? "Admin" : "User"} />}
          </div>

          {attachments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-[13px] font-[600] text-gray-800 mb-2">Attachments</p>
              <div className="flex flex-col gap-1.5">
                {attachments.map((filePath, index) => (
                  <button
                    key={filePath}
                    type="button"
                    onClick={() => downloadAttachment(index, filePath)}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-[12px] font-[600] hover:bg-gray-50"
                  >
                    File {index + 1}
                    <FiDownload className="w-3.5 h-3.5 text-brand-primary" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedTicketView;
