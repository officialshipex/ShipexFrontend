// Single source of truth for employee permissions.
//
// Permissions are stored per employee as
//     accessRights = { [section]: { [itemKey]: { view, update, action }, enabled } }
// (view = open the page, update = edit data on it, action = run its actions).
//
// Two panels exist and an employee belongs to exactly one:
//   admin panel  (created by an admin)    -> ADMIN_PERMISSIONS / ADMIN_ROUTES
//   user panel   (created by a merchant)  -> USER_PERMISSIONS  / USER_ROUTES
//
// The sidebar, the "Add / Edit employee" form and the route guard all read from here, so a new
// sidebar item only has to be added in one place.

export const PERMISSION_FLAGS = [
  { key: "view", label: "View" },
  { key: "update", label: "Update" },
  { key: "action", label: "Action" },
];

// ─── Permission catalog (what the admin / merchant ticks when creating an employee) ──────────────
// `fallback` lets an employee saved before an item existed keep the access they already had.
export const ADMIN_PERMISSIONS = [
  { section: "orders", title: "Orders", items: [{ key: "All Orders", label: "Orders (B2C & B2B)" }] },
  { section: "ndr", title: "NDR", items: [{ key: "All NDR", label: "All NDR" }] },
  {
    section: "operation",
    title: "Operations",
    items: [
      { key: "First Mile", label: "First Mile" },
      { key: "Mid Mile", label: "Mid Mile" },
      { key: "Last Mile", label: "Last Mile" },
    ],
  },
  {
    section: "reports",
    title: "MIS Report",
    items: [{ key: "MIS Report", label: "MIS Report", fallbackSections: ["finance", "tools"] }],
  },
  {
    section: "finance",
    title: "Finance",
    items: [
      { key: "COD Remittance Order", label: "COD Remittance Order" },
      { key: "Seller COD Remittance", label: "Seller COD Remittance" },
      { key: "Courier COD Remittance", label: "Courier COD Remittance" },
      { key: "Billing", label: "Billing" },
    ],
  },
  {
    section: "tools",
    title: "Tools",
    items: [
      { key: "Admin Weight Discrepancy", label: "Weight Discrepancy" },
      { key: "Notification", label: "Notification" },
      { key: "Important Announcement", label: "Important Announcement" },
    ],
  },
  {
    section: "setupAndManage",
    title: "Setup & Manage",
    items: [
      { key: "Users", label: "Users" },
      { key: "Status Map", label: "Status Map" },
      { key: "EDD Mapping", label: "EDD Mapping" },
      { key: "EPD Mapping", label: "EPD Mapping" },
      { key: "Pincode Information", label: "Pincode Information" },
      { key: "Agreement", label: "Agreement" },
      { key: "Pickup Address", label: "Pickup Address" },
    ],
  },
  {
    section: "courier",
    title: "Courier & Rate Card",
    items: [
      { key: "courier", label: "Couriers" },
      { key: "courier service", label: "Courier Services" },
      { key: "Rate Cards", label: "Rate Cards (B2C & B2B)" },
      { key: "Zone Matrix", label: "Zone Matrix (B2B)", fallback: [["courier", "Rate Cards"]] },
      { key: "Costing Rate Card", label: "Costing Rate Card", fallback: [["courier", "Rate Cards"]] },
    ],
  },
  {
    section: "support",
    title: "Support",
    items: [
      { key: "Create Ticket", label: "Create Ticket" },
      { key: "Feedbacks", label: "Feedbacks" },
      { key: "Manage ticket", label: "Manage Tickets" },
    ],
  },
  { section: "referral", title: "Referral", items: [{ key: "Referral", label: "Referral" }] },
];

export const USER_PERMISSIONS = [
  {
    section: "orders",
    title: "Orders",
    items: [
      { key: "Add Order", label: "Add Order" },
      { key: "B2C Orders", label: "B2C Orders" },
      { key: "B2B Orders", label: "B2B Orders" },
    ],
  },
  { section: "ndr", title: "NDR", items: [{ key: "NDR", label: "NDR" }] },
  { section: "reports", title: "MIS Report", items: [{ key: "MIS Report", label: "MIS Report" }] },
  { section: "finance", title: "Billing", items: [{ key: "Billing", label: "Billing" }] },
  {
    section: "tools",
    title: "Tools",
    items: [
      { key: "Rate Calculator", label: "Rate Calculator" },
      { key: "Weight Discrepancy", label: "Weight Discrepancy" },
      { key: "Notification", label: "Notification" },
    ],
  },
  {
    section: "setupAndManage",
    title: "Setup & Manage",
    items: [
      { key: "Channels", label: "Channels" },
      { key: "Courier", label: "Courier" },
      { key: "Pickup Address", label: "Pickup Address" },
      { key: "Agreement", label: "Agreement" },
    ],
  },
  { section: "settings", title: "Settings", items: [{ key: "Settings", label: "Settings" }] },
  {
    section: "support",
    title: "Support",
    items: [
      { key: "Create Ticket", label: "Create Ticket" },
      { key: "Feedbacks", label: "Feedbacks" },
    ],
  },
];

export const getPermissionCatalog = (panel) => (panel === "user" ? USER_PERMISSIONS : ADMIN_PERMISSIONS);

// ─── Reading permissions ─────────────────────────────────────────────────────────────────────────
const isObj = (v) => v && typeof v === "object";

const findItem = (panel, section, key) =>
  getPermissionCatalog(panel)
    .find((s) => s.section === section)
    ?.items.find((i) => i.key === key);

const sectionHasFlag = (accessRights, section, flag) =>
  Object.values(accessRights?.[section] || {}).some((v) => isObj(v) && v[flag] === true);

// Resolve one [section, key] to { view, update, action }, honouring legacy fallbacks.
export function getAccess(accessRights, panel, [section, key]) {
  const stored = accessRights?.[section]?.[key];
  if (isObj(stored)) {
    return { view: stored.view === true, update: stored.update === true, action: stored.action === true };
  }
  const item = findItem(panel, section, key);
  if (item?.fallback) {
    for (const ref of item.fallback) {
      const inherited = getAccess(accessRights, panel, ref);
      if (inherited.view) return inherited;
    }
  }
  if (item?.fallbackSections) {
    const has = (flag) => item.fallbackSections.some((s) => sectionHasFlag(accessRights, s, flag));
    return { view: has("view"), update: has("update"), action: has("action") };
  }
  return { view: false, update: false, action: false };
}

// `perms` is a list of [section, key]; the employee needs the flag on ANY of them.
export function can(accessRights, panel, perms, flag = "view") {
  if (!perms || perms.length === 0) return true;
  return perms.some((p) => getAccess(accessRights, panel, p)[flag]);
}

// ─── Route -> permission map (used by the route guard) ───────────────────────────────────────────
// Longest matching prefix wins. A route not listed here is not restricted by employee rights.
// `perms: null` on a listed prefix means "never open to employees of this panel".
const ADMIN_ROUTES = [
  ["/adminDashboard/b2c/order", [["orders", "All Orders"]]],
  ["/adminDashboard/b2b/order", [["orders", "All Orders"]]],
  ["/adminDashboard/order", [["orders", "All Orders"]]],
  ["/adminDashboard/ndr", [["ndr", "All NDR"]]],
  ["/adminDashboard/operations/firstmile", [["operation", "First Mile"]]],
  ["/adminDashboard/operations/midmile", [["operation", "Mid Mile"]]],
  ["/adminDashboard/operations/lastmile", [["operation", "Last Mile"]]],
  ["/adminDashboard/mis-report", [["reports", "MIS Report"]]],
  [
    "/finance/COD",
    [
      ["finance", "COD Remittance Order"],
      ["finance", "Seller COD Remittance"],
      ["finance", "Courier COD Remittance"],
    ],
  ],
  ["/dashboard/AdminCodRemittances", [["finance", "COD Remittance Order"]]],
  ["/finance/billing", [["finance", "Billing"]]],
  ["/adminDashboard/tools/Weight_Dependency", [["tools", "Admin Weight Discrepancy"]]],
  ["/adminDashboard/tools/notification", [["tools", "Notification"]]],
  ["/adminDashboard/tools/announcement", [["tools", "Important Announcement"]]],
  ["/dashboard/user", [["setupAndManage", "Users"]]],
  ["/dashboard/Setup&Manage/User", [["setupAndManage", "Users"]]],
  ["/adminDashboard/Setup&Manage/statusMap", [["setupAndManage", "Status Map"]]],
  ["/adminDashboard/Setup&Manage/EDD-map", [["setupAndManage", "EDD Mapping"]]],
  ["/adminDashboard/Setup&Manage/EPD-map", [["setupAndManage", "EPD Mapping"]]],
  ["/adminDashboard/Setup&Manage/pincode-information", [["setupAndManage", "Pincode Information"]]],
  ["/adminDashboard/Setup&Manage/Pickup_address", [["setupAndManage", "Pickup Address"]]],
  ["/adminDashboard/agreement", [["setupAndManage", "Agreement"]]],
  // Employee management stays with the account owner. (/allocateRoles is open to employees:
  // for them it renders "Your Sellers", the sellers allocated to them.)
  ["/dashboard/Setup&Manage/Role_List", null],
  ["/adminDashboard/setup/courier", [["courier", "courier"]]],
  ["/adminDashboard/setup/courierservices", [["courier", "courier service"]]],
  ["/adminDashboard/b2c/ratecard", [["courier", "Rate Cards"]]],
  ["/adminDashboard/b2b/ratecard", [["courier", "Rate Cards"]]],
  ["/dashboard/ratecard", [["courier", "Rate Cards"]]],
  ["/adminDashboard/b2b/zonematrix", [["courier", "Zone Matrix"]]],
  ["/adminDashboard/costingRateCard", [["courier", "Costing Rate Card"]]],
  ["/adminDashboard/referral", [["referral", "Referral"]]],
  [
    "/adminDashboard/support",
    [
      ["support", "Create Ticket"],
      ["support", "Feedbacks"],
      ["support", "Manage ticket"],
    ],
  ],
];

const USER_ROUTES = [
  ["/dashboard/order/neworder", [["orders", "Add Order"]]],
  ["/dashboard/order/courierSelection", [["orders", "Add Order"]]],
  ["/dashboard/order/b2b/courierSelection", [["orders", "Add Order"]]],
  ["/dashboard/order/bulkSelection", [["orders", "Add Order"]]],
  ["/dashboard/b2c/order", [["orders", "B2C Orders"]]],
  ["/dashboard/b2b/order", [["orders", "B2B Orders"]]],
  [
    "/dashboard/order/pickup-manifest",
    [
      ["orders", "B2C Orders"],
      ["orders", "B2B Orders"],
    ],
  ],
  [
    "/dashboard/order/tracking",
    [
      ["orders", "B2C Orders"],
      ["orders", "B2B Orders"],
    ],
  ],
  ["/dashboard/ndr", [["ndr", "NDR"]]],
  ["/dashboard/mis-report", [["reports", "MIS Report"]]],
  ["/dashboard/billing", [["finance", "Billing"]]],
  ["/dashboard/tools/Cost_Estimation", [["tools", "Rate Calculator"]]],
  ["/dashboard/tools/Weight_Dependency", [["tools", "Weight Discrepancy"]]],
  ["/dashboard/settings/notification", [["tools", "Notification"]]],
  ["/dashboard/Setup&Manage/Channel", [["setupAndManage", "Channels"]]],
  ["/channel/addchannel", [["setupAndManage", "Channels"]]],
  ["/dashboard/Setup&Manage/Courier", [["setupAndManage", "Courier"]]],
  ["/dashboard/Setup&Manage/Pickup_address", [["setupAndManage", "Pickup Address"]]],
  ["/dashboard/agreement", [["setupAndManage", "Agreement"]]],
  ["/dashboard/settings", [["settings", "Settings"]]],
  [
    "/dashboard/support",
    [
      ["support", "Create Ticket"],
      ["support", "Feedbacks"],
    ],
  ],
  // A merchant's employees never reach the admin panel or manage employees themselves
  ["/adminDashboard", null],
  ["/finance", null],
  ["/dashboard/user", null],
  ["/dashboard/Setup&Manage/Role_List", null],
  ["/dashboard/Setup&Manage/allocateRoles", null],
];

const norm = (p) => String(p || "").toLowerCase().replace(/\/+$/, "");

// Is `pathname` a prefix match for `prefix` on a path-segment boundary?
const matchesPrefix = (pathname, prefix) => {
  const p = norm(pathname);
  const q = norm(prefix);
  return p === q || p.startsWith(q + "/");
};

// → { restricted: false } | { restricted: true, perms: [[section,key]...] | null }
export function resolveRoutePermission(panel, pathname) {
  const table = panel === "user" ? USER_ROUTES : ADMIN_ROUTES;
  let best = null;
  for (const entry of table) {
    if (matchesPrefix(pathname, entry[0]) && (!best || entry[0].length > best[0].length)) best = entry;
  }
  return best ? { restricted: true, perms: best[1] } : { restricted: false };
}

// May this employee open `pathname`?
export function canAccessRoute(accessRights, panel, pathname) {
  const rule = resolveRoutePermission(panel, pathname);
  if (!rule.restricted) return true;
  if (rule.perms === null) return false;
  return can(accessRights, panel, rule.perms, "view");
}

// Which panel an employee works in. Admin-side employees carry isAdmin && adminTab.
export const employeePanel = (employee) =>
  employee && employee.isAdmin === true && employee.adminTab === true && employee.parentType !== "user"
    ? "admin"
    : "user";

// ─── Building / reading the form state ───────────────────────────────────────────────────────────
// Empty rights for a catalog: every item present with all flags off.
export function emptyAccessRights(panel) {
  const rights = {};
  getPermissionCatalog(panel).forEach(({ section, items }) => {
    rights[section] = { enabled: false };
    items.forEach(({ key }) => {
      rights[section][key] = { view: false, update: false, action: false };
    });
  });
  return rights;
}

// Merge a stored employee's rights into the catalog shape (resolving legacy fallbacks so an old
// employee shows the access they really have).
export function toFormRights(accessRights, panel) {
  const rights = emptyAccessRights(panel);
  getPermissionCatalog(panel).forEach(({ section, items }) => {
    items.forEach(({ key }) => {
      rights[section][key] = getAccess(accessRights, panel, [section, key]);
    });
    rights[section].enabled = items.some(({ key }) => rights[section][key].view);
  });
  return rights;
}
