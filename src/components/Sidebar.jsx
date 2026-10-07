import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faShoppingCart,
  faExclamationTriangle,
  faFileInvoiceDollar,
  faChartBar,
  faTools,
  faUserCog,
  faTruck,
  faCogs,
  faChevronDown,
  faChevronUp,
  faReceipt,
  faUserCircle,
  faPhone,
  faMoneyBillWave,
  faProjectDiagram,
  faUserFriends,
  faCartShopping,
  faTruckRampBox,
  faPlusSquare,
  faBars,
  faTimes,
  faLock
} from "@fortawesome/free-solid-svg-icons";
import { LuBoxes } from "react-icons/lu";

import { Logo } from "./Logo";
import { useBranding } from "../context/BrandingContext";
import grouplogo from "../assets/Group.png"; // falls back to this until the company's own favicon loads (or if it never uploaded one)
import EmployeeAuthModal from "../employeeAuth/EmployeeAuthModal";
import { can, employeePanel } from "../utils/employeeAccess";

const SidebarItem = ({
  icon,
  text,
  extent,
  list = [],
  expanded,
  isOpen,
  toggleDropdown,
  onClick,
  setExpanded,
  activeItem,
  setActiveItem,
  setOpenDropdowns,
  path,
  isMobile,
  locked = false,
  onLocked
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();


  const isActive = (() => {
    // ✅ Dashboard special handling
    if (text === "Dashboard") {
      return (
        pathname === "/" ||
        pathname === "/dashboard" ||
        pathname === "/adminDashboard"
      );
    }

    // ✅ Normal menu item
    if (path && pathname.startsWith(path)) return true;

    // ✅ Parent active when any child route matches
    if (Array.isArray(list)) {
      return list.some((item) => pathname.startsWith(item.path));
    }
    return false;
  })();

  return (
    <div className="transition-all duration-300 ease-in-out">
      <div
        className={`group relative flex items-center px-3 py-2 my-1 text-[14px] font-[600] cursor-pointer select-none
      ${isActive ? "bg-brand-primary text-white" : "text-gray-500 hover:bg-brand-primary"}
      ${locked ? "opacity-60" : ""}
      transition-all h-9 duration-200 ease-in-out`}
        title={locked ? "You don't have access" : undefined}
        onClick={(e) => {
          e.stopPropagation();

          // Visible to the employee but not permitted: tell them instead of navigating
          if (locked) {
            onLocked?.(text);
            return;
          }
          setActiveItem(text);

          if (extent) {
            toggleDropdown();
          } else {
            onClick();
            if (path) navigate(path);
          }
        }}
      >
        <span className="w-10 h-10 flex items-center justify-center">
          <FontAwesomeIcon
            icon={icon}
            className={`text-[14px] transition-all duration-300
          ${isActive ? "text-white" : "text-gray-500 group-hover:text-white"}
        `}
          />
        </span>

        <span
          className={`overflow-hidden transition-all duration-300 ease-in-out
        ${expanded ? "w-52 ml-3 opacity-100" : "w-0 opacity-0"}
        ${!isActive && "group-hover:text-white"}
      `}
        >
          {text}
        </span>

        {locked && expanded && (
          <FontAwesomeIcon
            icon={faLock}
            size="xs"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-white"
          />
        )}

        {extent && expanded && (
          <div className="ml-auto absolute right-4 top-1/2 transform -translate-y-1/2">
            <FontAwesomeIcon
              icon={isOpen ? faChevronUp : faChevronDown}
              size="sm"
              className={`${!isActive && "group-hover:text-white"}`}
            />
          </div>
        )}
      </div>

      {extent && (
        <ul
          className={`pl-[60px] space-y-2 text-[14px] text-gray-500 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out
        ${isOpen ? "max-h-[1000px] opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none"}
        custom-scrollbar`}
        >
          {list.map((item, index) => (
            <li
              key={index}
              className={`cursor-pointer hover:text-white hover:bg-brand-primary transition-colors duration-300 p-1 flex items-center justify-between ${item.locked ? "opacity-60" : ""}`}
              title={item.locked ? "You don't have access" : undefined}
              onClick={() => {
                if (item.locked) {
                  onLocked?.(item.name);
                  return;
                }
                setOpenDropdowns({});   // close dropdown
                if (isMobile) setExpanded(false);
                navigate(item.path);
              }}
            >
              <span>{item.name}</span>
              {item.locked && <FontAwesomeIcon icon={faLock} size="xs" className="mr-2" />}
            </li>
          ))}
        </ul>
      )}
    </div>

  );
};



// ─── Menus ────────────────────────────────────────────────────────────────────────────────────────
// `perms` ties an item to the employee permission catalog (utils/employeeAccess.js): an employee
// still SEES the item, but it is locked (popup on click) unless they hold View on one of them.
// `ownerOnly` items belong to the account owner and are hidden from employees.
const ADMIN_MENU = [
  { icon: faHome, text: "Dashboard", path: "/adminDashboard" },
  { icon: faCartShopping, text: "B2C", path: "/adminDashboard/b2c/order", perms: [["orders", "All Orders"]] },
  { icon: faTruckRampBox, text: "B2B", path: "/adminDashboard/b2b/order", perms: [["orders", "All Orders"]] },
  {
    icon: faProjectDiagram, text: "Operations", extent: true, list: [
      { name: "First Mile", path: "/adminDashboard/operations/firstmile", perms: [["operation", "First Mile"]] },
      { name: "Mid Mile", path: "/adminDashboard/operations/midmile", perms: [["operation", "Mid Mile"]] },
      { name: "Last Mile", path: "/adminDashboard/operations/lastmile", perms: [["operation", "Last Mile"]] },
    ],
  },
  { icon: faExclamationTriangle, text: "NDR", path: "/adminDashboard/ndr", perms: [["ndr", "All NDR"]] },
  { icon: faChartBar, text: "MIS Report", path: "/adminDashboard/mis-report", perms: [["reports", "MIS Report"]] },
  {
    icon: faMoneyBillWave, text: "Finance", extent: true, list: [
      {
        name: "COD", path: "/finance/COD", perms: [
          ["finance", "COD Remittance Order"],
          ["finance", "Seller COD Remittance"],
          ["finance", "Courier COD Remittance"],
        ],
      },
      { name: "Billing", path: "/finance/billing", perms: [["finance", "Billing"]] },
    ],
  },
  {
    icon: faTools, text: "Tools", extent: true, list: [
      { name: "Weight Discrepancy", path: "/adminDashboard/tools/Weight_Dependency", perms: [["tools", "Admin Weight Discrepancy"]] },
      { name: "Notification", path: "/adminDashboard/tools/notification", perms: [["tools", "Notification"]] },
      { name: "Important Announcement", path: "/adminDashboard/tools/announcement", perms: [["tools", "Important Announcement"]] },
    ],
  },
  {
    icon: faUserCog, text: "Setup & Manage", extent: true, list: [
      { name: "Users", path: "/dashboard/user", perms: [["setupAndManage", "Users"]] },
      { name: "KYC Review", path: "/dashboard/kyc-review", perms: [["setupAndManage", "Users"]], needsKycReview: true },
      { name: "Roles", path: "/dashboard/Setup&Manage/Role_List", ownerOnly: true },
      { name: "Allocate Sellers", path: "/dashboard/Setup&Manage/allocateRoles", employeeName: "Your Sellers" },
      { name: "Status Map", path: "/adminDashboard/Setup&Manage/statusMap", perms: [["setupAndManage", "Status Map"]] },
      { name: "EDD Mapping", path: "/adminDashboard/Setup&Manage/EDD-map", perms: [["setupAndManage", "EDD Mapping"]] },
      { name: "EPD Mapping", path: "/adminDashboard/Setup&Manage/EPD-map", perms: [["setupAndManage", "EPD Mapping"]] },
      { name: "Pincode Information", path: "/adminDashboard/Setup&Manage/pincode-information", perms: [["setupAndManage", "Pincode Information"]] },
      { name: "Agreement", path: "/adminDashboard/agreement", perms: [["setupAndManage", "Agreement"]] },
      { name: "Pickup Address", path: "/adminDashboard/Setup&Manage/Pickup_address", perms: [["setupAndManage", "Pickup Address"]] },
    ],
  },
  {
    icon: faTruck, text: "Courier", extent: true, list: [
      { name: "Couriers", path: "/adminDashboard/setup/courier/add", perms: [["courier", "courier"]] },
      { name: "Courier services", path: "/adminDashboard/setup/courierservices/add", perms: [["courier", "courier service"]] },
    ],
  },
  {
    icon: faReceipt, text: "Rate Card", extent: true, list: [
      { name: "B2C", path: "/adminDashboard/b2c/ratecard", perms: [["courier", "Rate Cards"]] },
      { name: "B2B", path: "/adminDashboard/b2b/ratecard", perms: [["courier", "Rate Cards"]] },
      { name: "Zone Matrix (B2B)", path: "/adminDashboard/b2b/zonematrix", perms: [["courier", "Zone Matrix"]] },
      { name: "Costing Rate Card", path: "/adminDashboard/costingRateCard", perms: [["courier", "Costing Rate Card"]] },
    ],
  },
  { icon: faUserFriends, text: "Referral", path: "/adminDashboard/referral", perms: [["referral", "Referral"]] },
];

const USER_MENU = [
  { icon: faHome, text: "Dashboard", path: "/dashboard" },
  { icon: faPlusSquare, text: "Add Order", path: "/dashboard/order/neworder", perms: [["orders", "Add Order"]] },
  { icon: faCartShopping, text: "B2C", path: "/dashboard/b2c/order", perms: [["orders", "B2C Orders"]] },
  { icon: faTruckRampBox, text: "B2B", path: "/dashboard/b2b/order", perms: [["orders", "B2B Orders"]] },
  { icon: faExclamationTriangle, text: "NDR", path: "/dashboard/ndr", perms: [["ndr", "NDR"]] },
  { icon: faChartBar, text: "MIS Report", path: "/dashboard/mis-report", perms: [["reports", "MIS Report"]] },
  { icon: faFileInvoiceDollar, text: "Billing", path: "/dashboard/billing", perms: [["finance", "Billing"]] },
  {
    icon: faTools, text: "Tools", extent: true, list: [
      { name: "Rate Calculator", path: "/dashboard/tools/Cost_Estimation/b2c", perms: [["tools", "Rate Calculator"]] },
      { name: "Weight Discrepancy", path: "/dashboard/tools/Weight_Dependency", perms: [["tools", "Weight Discrepancy"]] },
      { name: "Notification", path: "/dashboard/settings/notification", perms: [["tools", "Notification"]] },
    ],
  },
  {
    icon: faUserCog, text: "Setup & Manage", extent: true, list: [
      { name: "Channels", path: "/dashboard/Setup&Manage/Channel", perms: [["setupAndManage", "Channels"]] },
      { name: "Courier", path: "/dashboard/Setup&Manage/Courier", perms: [["setupAndManage", "Courier"]] },
      { name: "Roles", path: "/dashboard/Setup&Manage/Role_List", ownerOnly: true },
      { name: "Agreement", path: "/dashboard/agreement", perms: [["setupAndManage", "Agreement"]] },
      { name: "Pickup Address", path: "/dashboard/Setup&Manage/Pickup_address", perms: [["setupAndManage", "Pickup Address"]] },
    ],
  },
  { icon: faCogs, text: "Settings", path: "/dashboard/settings", perms: [["settings", "Settings"]] },
];

// Menu for the current session. Owners get every item; employees get the same menu, with the
// items they hold no permission for marked `locked` (they stay visible, a click shows a popup).
const buildMenu = (panel, employee, kycReviewVisible) => {
  const isEmployee = !!employee;
  const rights = employee?.accessRights;
  const lockedFor = (perms) => isEmployee && !!perms && !can(rights, panel, perms, "view");

  return (panel === "admin" ? ADMIN_MENU : USER_MENU)
    .map((item) => {
      if (item.extent) {
        const list = item.list
          .filter((sub) => !(isEmployee && sub.ownerOnly))
          // KYC Review only while the company offers manual KYC (or manual requests still exist)
          .filter((sub) => !sub.needsKycReview || kycReviewVisible)
          .map((sub) => ({
            ...sub,
            name: isEmployee && sub.employeeName ? sub.employeeName : sub.name,
            locked: lockedFor(sub.perms),
          }));
        return list.length > 0 ? { ...item, list } : null;
      }
      if (isEmployee && item.ownerOnly) return null;
      return { ...item, locked: lockedFor(item.perms) };
    })
    .filter(Boolean);
};

const Sidebar = ({ isAdmin = false, adminTab = false, employee = null }) => {
  const { faviconUrl } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const panel = employee ? employeePanel(employee) : isAdmin && adminTab ? "admin" : "user";

  // Step 1: Initialize activeItem from localStorage
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem("activeSidebarItem") || "Dashboard";
  });

  // Step 2: Sync it to localStorage on change
  useEffect(() => {
    localStorage.setItem("activeSidebarItem", activeItem);
  }, [activeItem]);

  // Message for the "no access" popup (null = closed)
  const [lockedNotice, setLockedNotice] = useState(null);
  const showLocked = (name) =>
    setLockedNotice(`You don't have access to "${name}". Please contact your administrator.`);

  // Land owners and employees on the dashboard of their own panel
  useEffect(() => {
    const path = location.pathname;
    if (panel === "admin" && (path === "/" || path === "/dashboard")) {
      navigate("/adminDashboard", { replace: true });
    } else if (panel === "user" && (path === "/" || path === "/adminDashboard")) {
      navigate("/dashboard", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  const [expanded, setExpanded] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setExpanded(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [kycReviewVisible, setKycReviewVisible] = useState(false);
  useEffect(() => {
    if (panel !== "admin") return undefined;
    let cancelled = false;
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/kyc-review/visibility`, { headers: { Authorization: `Bearer ${Cookies.get("session")}` } })
      .then((res) => { if (!cancelled) setKycReviewVisible(res.data?.visible === true); })
      .catch(() => { if (!cancelled) setKycReviewVisible(false); });
    return () => { cancelled = true; };
  }, [panel]);

  const filteredSidebarItems = useMemo(() => buildMenu(panel, employee, kycReviewVisible), [panel, employee, kycReviewVisible]);

  const toggleSidebar = () => {
    setExpanded((prev) => {
      const newExpanded = !prev;
      localStorage.setItem("sidebarExpanded", newExpanded);
      return newExpanded;
    });
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdowns((prev) => {
      const isCurrentlyOpen = !!prev[dropdown];
      // Close all dropdowns first, then open only the clicked one (if it wasn't open)
      return { [dropdown]: !isCurrentlyOpen };
    });
  };


  const handleSidebarClose = () => {
    if (isMobile) setExpanded(false);
    setOpenDropdown(null);
  };

  const handleSubItemClick = () => {
    setOpenDropdown(null);
  };


  return (
    <>
      {isMobile && (
        <button
          className={`fixed left-2 z-50 text-brand-primary p-2 transition-all duration-300 ${localStorage.getItem("admin_token_backup") ? "top-[40px]" : "top-[8px]"}`}
          onClick={toggleSidebar}
        >
          <FontAwesomeIcon icon={expanded ? faTimes : faBars} className="text-lg" />
        </button>
      )}

      <aside
        className={`fixed left-0 border-r transition-all duration-500 ease-in-out 
          ${localStorage.getItem("admin_token_backup")
            ? "top-[32px] mt-[56px] sm:mt-[60px] h-[calc(100vh-88px)] sm:h-[calc(100vh-92px)]"
            : "top-0 mt-[56px] sm:mt-[60px] h-[calc(100vh-56px)] sm:h-[calc(100vh-60px)]"} 
          ${expanded ? "w-60 z-50 bg-white" : "w-16 z-50 bg-white"} ${isMobile && !expanded ? "-translate-x-full" : "translate-x-0 z-49"}`}
        onMouseEnter={() => {
          if (!isMobile) {
            setExpanded(true);

            const activeParent = filteredSidebarItems.find(
              (item) =>
                item.extent &&
                item.list?.some((sub) => location.pathname.startsWith(sub.path))
            );

            if (activeParent) {
              setOpenDropdowns({ [activeParent.text]: true });
            }
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setExpanded(false);
            setOpenDropdowns({});
          }
        }}

      >
        <div className="flex sm:hidden items-center justify-start gap-3 px-5 py-1">

          {/* Small Logo (Visible always in collapsed mode) */}
          <img
            src={faviconUrl || grouplogo}
            alt="description"
            className="h-5 w-5 object-contain"
          />

          {/* Main Logo (Visible only when expanded) */}
          <Logo
            className={`transition-all duration-300 max-h-8 object-contain
      ${expanded ? "w-20 opacity-100" : "w-0 opacity-0"}
    `}
          />
        </div>

        <nav className="h-full overflow-y-auto custom-scrollbar">
          <div className="flex flex-col">
            {filteredSidebarItems.map((item, index) =>
              item.extent ? (
                <SidebarItem
                  key={index}
                  icon={item.icon}
                  text={item.text}
                  extent={item.extent}
                  list={item.list || []}
                  expanded={expanded}
                  isOpen={!!openDropdowns[item.text]}
                  toggleDropdown={() => toggleDropdown(item.text)}
                  setExpanded={setExpanded}
                  onClick={handleSubItemClick}
                  activeItem={activeItem}
                  setActiveItem={setActiveItem}
                  setOpenDropdowns={setOpenDropdowns}
                  path={item.path}
                  isMobile={isMobile}
                  locked={!!item.locked}
                  onLocked={showLocked}
                />
              ) : (
                <SidebarItem
                  key={index}
                  icon={item.icon}
                  text={item.text}
                  extent={false}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  onClick={handleSidebarClose}
                  activeItem={activeItem}
                  setActiveItem={setActiveItem}
                  path={item.path}
                  isMobile={isMobile}
                  locked={!!item.locked}
                  onLocked={showLocked}
                />

              )
            )}
          </div>
        </nav>
      </aside>

      {!isMobile && (
        <div
          className={`main-content ${expanded ? "sidebar-open" : ""} transition-all duration-300 ease-in-out`}
          style={{ marginLeft: expanded ? "240px" : "60px" }}
        ></div>
      )}

      {/* Outside <aside>: its transform would otherwise trap a fixed overlay */}
      <EmployeeAuthModal
        employeeModalShow={!!lockedNotice}
        employeeModalClose={() => setLockedNotice(null)}
        message={lockedNotice || undefined}
      />
    </>
  );
};

export default Sidebar; 