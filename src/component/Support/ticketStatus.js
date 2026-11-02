// Ticket statuses, same as QuickPost's Support page (pages/admin/AdminSupport.tsx). The backend's flow is
// new → open → awaiting_response → closed; active and resolved are old values still on some tickets.
export const STATUS_LABEL = {
  new: "New",
  open: "Open",
  awaiting_response: "Awaiting Response",
  closed: "Closed",
  active: "Active",
  resolved: "Resolved",
  deleted: "Deleted",
};

export const STATUS_BADGE = {
  new: "bg-slate-100 text-slate-700",
  open: "bg-blue-100 text-blue-700",
  awaiting_response: "bg-amber-100 text-amber-700",
  closed: "bg-gray-200 text-gray-600",
  active: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  deleted: "bg-red-100 text-red-700",
};

// Which status tab a ticket belongs in
export const statusTab = (status) => {
  switch (status) {
    case "new":
      return "New";
    case "open":
    case "active":
      return "Open";
    case "awaiting_response":
      return "Awaiting Response";
    case "closed":
    case "resolved":
      return "Closed";
    default:
      return "All";
  }
};

export const isTicketClosed = (status) => status === "closed" || status === "resolved";

export const TICKET_TABS = [
  { label: "New", value: "New" },
  { label: "Open", value: "Open" },
  { label: "Awaiting Response", value: "Awaiting Response" },
  { label: "Closed", value: "Closed" },
  { label: "All", value: "" },
];

export const formatTicketDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return `${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}, ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
};

// "77259694772, 77259694665 +1"
export const shortAwbList = (awbNumbers) => {
  const list = awbNumbers || [];
  if (list.length === 0) return "—";
  return list.slice(0, 2).join(", ") + (list.length > 2 ? ` +${list.length - 2}` : "");
};

export const replyCountText = (ticket) => {
  const count = (ticket.messages || []).length;
  return count === 0 ? "No replies" : count === 1 ? "1 reply" : `${count} replies`;
};
