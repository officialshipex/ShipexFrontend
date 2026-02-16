import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faShoppingCart,
  faExclamationTriangle,
  faFileInvoiceDollar,
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
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { LuBoxes } from "react-icons/lu";

import ShipexLogo from "../assets/Shipex.jpg";
import grouplogo from "../assets/Group.png";

import axios from "axios";
import Cookies from "js-cookie";

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
  isMobile
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
      ${isActive ? "bg-[#0CBB7D] text-white" : "text-gray-500 hover:bg-[#0CBB7D]"} 
      transition-all h-9 duration-200 ease-in-out`}
        onClick={(e) => {
          e.stopPropagation();
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
        ${isOpen ? "max-h-60 opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none"}
        custom-scrollbar`}
        >
          {list.map((item, index) => (
            <li
              key={index}
              className="cursor-pointer hover:text-white hover:bg-[#0CBB7D] transition-colors duration-300 p-1"
              onClick={() => {
                setOpenDropdowns({});   // close dropdown
                if (isMobile) setExpanded(false);
                navigate(item.path);
              }}
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>

  );
};



const accessMap = {
  "NDR": "ndr",
  "Tools": "tools",
  "Finance": "finance",
  "Setup & Manage": "setupAndManage",
  "Courier": "courier",
  "B2C": "B2C",
  "B2B": "B2B",
  "Support": "support",
  "Billing": "finance",
  "Rate Card": "ratecard",
  // "Operations": "operations",
  // Add more mappings as needed
};

const Sidebar = ({ isAdmin: isAdminProp, adminTab: adminTabProp }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setIsAdminTab] = useState();
  const [searchParams] = useSearchParams();
  const hasFetched = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();


  // Step 1: Initialize activeItem from localStorage
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem("activeSidebarItem") || "Dashboard";
  });

  // Step 2: Sync it to localStorage on change
  useEffect(() => {
    localStorage.setItem("activeSidebarItem", activeItem);
  }, [activeItem]);

  // --- New: Employee Access State ---
  const [employeeAccessRights, setEmployeeAccessRights] = useState(null);
  const [isEmployee, setIsEmployee] = useState(false);


  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (typeof isAdminProp === "boolean") setIsAdmin(isAdminProp);
    else if (searchParams.get("isAdmin") === "true") setIsAdmin(true);
    else setIsAdmin(false);

    if (typeof adminTabProp === "boolean") setIsAdminTab(adminTabProp);
    else if (searchParams.get("adminTab") === "true") setIsAdminTab(true);
    else setIsAdminTab(false);

    // Fetch employee access rights if not admin
    const fetchRoleAccess = async () => {
      try {
        const token = Cookies.get("session");
        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/staffRole/verify`,
          { headers: { authorization: `Bearer ${token}` } }
        );
        if (res.data?.employee) {
          setIsEmployee(true);
          setEmployeeAccessRights(res.data.employee.accessRights || {});
        } else {
          setIsEmployee(false);
          setEmployeeAccessRights(null);
        }
      } catch (err) {
        setIsEmployee(false);
        setEmployeeAccessRights(null);
      }
    };
    fetchRoleAccess();
  }, [isAdminProp, adminTabProp, searchParams, REACT_APP_BACKEND_URL, location.pathname]);


  useEffect(() => {
    if (adminTab === undefined) return;
    // Only redirect if on the root paths
    if (isAdmin && adminTab && (location.pathname === "/" || location.pathname === "/dashboard")) {
      navigate("/adminDashboard", { replace: true });
    } else if ((!isAdmin || !adminTab) && (location.pathname === "/" || location.pathname === "/adminDashboard")) {
      navigate("/dashboard", { replace: true });
    }
  }, [adminTab, isAdmin, location.pathname, navigate]);

  const sidebarItems = [
    { icon: faHome, text: "Dashboard", path: "/" },
    { icon: faPlusSquare, text: "Add Order", path: "/dashboard/order/neworder" },
    { icon: faCartShopping, text: "B2C", path: "/dashboard/b2c/order" },
    { icon: faCartShopping, text: "B2C", path: "/adminDashboard/b2c/order" },
    { icon: faTruckRampBox, text: "B2B", path: "/dashboard/b2b/order" },
    { icon: faTruckRampBox, text: "B2B", path: "/adminDashboard/b2b/order" },
    { icon: faExclamationTriangle, text: "NDR", path: "/dashboard/ndr" },
    {
      icon: faProjectDiagram, text: "Operations", extent: true, list: [
        { name: "First Mile", path: "/adminDashboard/operations/firstmile" },
        { name: "Mid Mile", path: "/adminDashboard/operations/midmile" },
        { name: "Last Mile", path: "/adminDashboard/operations/lastmile" },
        { name: "Delay Delivered", path: "/adminDashboard/operations/delayDelivered" }
      ],
    },
    { icon: faExclamationTriangle, text: "NDR", path: "/adminDashboard/ndr" },
    { icon: faFileInvoiceDollar, text: "Billing", path: "/dashboard/billing" },
    {
      icon: faMoneyBillWave,
      text: "Finance",
      extent: true,
      list: [
        { name: "COD", path: "/finance/COD" },
        { name: "Billing", path: "/finance/billing" }
        // { name: "Seller COD Remittance", path: "/finance/sellerCodRemittance" },
        // { name: "Courier COD Remittance", path: "/finance/courierCodRemittance" },
      ],
    },
    {
      icon: faTools,
      text: "Tools",
      extent: true,
      list: [
        { name: "Rate Calculator", path: "/dashboard/tools/Cost_Estimation/b2c" },
        { name: "Weight Discrepancy", path: "/dashboard/tools/Weight_Dependency" },
        { name: "Weight Discrepancy", path: "/adminDashboard/tools/Weight_Dependency" },
      ],
    },
    {
      icon: faUserCog,
      text: "Setup & Manage",
      extent: true,
      list: [
        { name: "Pickup Address", path: "/dashboard/Setup&Manage/Pickup_address" },
        { name: "Users", path: "/dashboard/user" },
        { name: "Channels", path: "/dashboard/Setup&Manage/Channel" },
        { name: "Courier", path: "/dashboard/Setup&Manage/Courier" },
        { name: "Roles", path: "/dashboard/Setup&Manage/Role_List" },
        { name: "Allocate Sellers", path: "/dashboard/Setup&Manage/allocateRoles" },
        { name: "Status Map", path: "/adminDashboard/Setup&Manage/statusMap" },
        { name: "EDD Mapping", path: "/adminDashboard/Setup&Manage/EDD-map" },
        { name: "Pincode Information", path: "/adminDashboard/Setup&Manage/pincode-information" }
      ],
    },
    {
      icon: faTruck,
      text: "Courier",
      extent: true,
      list: [
        { name: "Couriers", path: "/adminDashboard/setup/courier/add" },
        { name: "Courier services", path: "/adminDashboard/setup/courierservices/add" },
      ],
    },
    {
      icon: faReceipt, text: "Rate Card",
      extent: true,
      list: [
        { name: "B2C", path: "/adminDashboard/b2c/ratecard" },
        { name: "B2B", path: "/adminDashboard/b2b/ratecard" },
        { name: "Zone Matrix (B2B)", path: "/adminDashboard/b2b/zonematrix" }
      ]
      //  path: "/adminDashboard/ratecard"
    },
    { icon: faCogs, text: "Settings", path: "/dashboard/settings" },
    // { icon: faPhone, text: "Support", path: "/dashboard/support" },
    { icon: faUserFriends, text: "Referral", path: "/adminDashboard/referral" },
  ];

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

  const filteredSidebarItems = useMemo(() => {
    // --- Employee logic: show only items/subitems with view access ---
    if (isEmployee && employeeAccessRights) {
      return sidebarItems
        .map((item) => {
          // Show only one Orders (adminDashboard) for employees
          if (
            (item.text === "B2C" && item.path === "/dashboard/b2c/order") ||
            (item.text === "B2C" && item.path === "/adminDashboard/b2c/order")
          ) {
            const section = employeeAccessRights["orders"];
            if (!section) return null;
            const anyView = Object.values(section).some(
              (v) => v && typeof v === "object" && v.view === true
            );
            if (anyView || section.view === true) {
              return {
                ...item,
                text: "B2C",
                path: "/adminDashboard/b2c/order"
              };
            }
            return null;
          }
          // Show only one NDR (adminDashboard) for employees
          if (
            (item.text === "NDR" && item.path === "/dashboard/ndr") ||
            (item.text === "NDR" && item.path === "/adminDashboard/ndr")
          ) {
            const section = employeeAccessRights["ndr"];
            if (!section) return null;
            const anyView = Object.values(section).some(
              (v) => v && typeof v === "object" && v.view === true
            );
            if (anyView || section.view === true) {
              return {
                ...item,
                path: "/adminDashboard/ndr"
              };
            }
            return null;
          }
          // Remove any other Orders/NDR entries
          if (
            (item.text === "B2C" && item.path === "/dashboard/b2c/order") ||
            (item.text === "B2C" && item.path === "/adminDashboard/b2c/order") ||
            (item.text === "B2B" && item.path === "/dashboard/b2b/order") ||
            (item.text === "B2B" && item.path === "/adminDashboard/b2b/order") ||
            (item.text === "NDR" && item.path === "/dashboard/ndr") ||
            (item.text === "NDR" && item.path === "/adminDashboard/ndr")
          ) {
            return null;
          }

          // Remove adminDashboard items for other sections
          if (
            (item.path && item.path.startsWith("/adminDashboard")) ||
            (item.list && item.list.some(sub => sub.path && sub.path.startsWith("/adminDashboard")))
          ) {
            return null;
          }

          if (item.text === "Dashboard") return item;

          // Map sidebar text to accessRights key
          const sectionKey = accessMap[item.text];
          const section = employeeAccessRights[sectionKey];

          // For extent (submenu) items
          if (item.extent && Array.isArray(item.list)) {
            // Filter subitems by view access
            const filteredList = item.list.filter((subItem) => {
              if (!section) return false;
              const subAccess = section[subItem.name];
              return subAccess && subAccess.view === true;
            });
            return filteredList.length > 0 ? { ...item, list: filteredList } : null;
          }

          // For single items (not extent)
          if (!section) return null;
          if (typeof section === "object" && !Array.isArray(section)) {
            const anyView = Object.values(section).some(
              (v) => v && typeof v === "object" && v.view === true
            );
            return anyView ? item : null;
          }
          return section.view === true ? item : null;
        })
        .filter(Boolean) // <-- Filter out nulls before next filter!
        // Remove duplicates for Orders/NDR (keep only first occurrence)
        .filter((item, idx, arr) => {
          if (item.text === "B2C" && item.path === "/adminDashboard/b2c/order") {
            return arr.findIndex(i => i.text === "B2C" && i.path === "/adminDashboard/b2c/order") === idx;
          }
          if (item.text === "B2B" && item.path === "/adminDashboard/b2b/order") {
            return arr.findIndex(i => i.text === "B2B" && i.path === "/adminDashboard/b2b/order") === idx;
          }
          if (item.text === "NDR" && item.path === "/adminDashboard/ndr") {
            return arr.findIndex(i => i.text === "NDR" && i.path === "/adminDashboard/ndr") === idx;
          }
          return true;
        });
    }


    // --- Admin logic (user admin or adminTab) ---
    if (isAdmin) {
      return sidebarItems
        .map((item) => {
          if (item.text === "Dashboard") {
            if (isAdmin && adminTab) {
              return { ...item, path: "/adminDashboard" };
            } else {
              return { ...item, path: "/" };
            }
          }

          if (isAdmin && adminTab) {
            if (
              item.text === "Courier" ||
              item.text === "Rate Card" ||
              item.text === "Finance" ||
              item.path === "/adminDashboard/b2c/order" ||
              item.path === "/adminDashboard/b2b/order" ||
              item.path === "/adminDashboard/ndr" ||
              item.text === "Operations" ||
              item.text === "Referral"
            ) {
              return item;
            }

            if (item.text === "Tools") {
              const filteredList = item.list.filter((subItem) =>
                ["/adminDashboard/tools/Weight_Dependency"].includes(subItem.path)
              );
              return filteredList.length > 0 ? { ...item, list: filteredList } : null;
            }

            if (item.text === "Setup & Manage") {
              const filteredList = item.list.filter((subItem) =>
                ["Users", "Roles", "Status Map", "EDD Mapping", "Pincode Information"].includes(subItem.name) ||
                (subItem.name === "Allocate Sellers" && isAdmin === true && adminTab === true)
              );
              return filteredList.length > 0 ? { ...item, list: filteredList } : null;
            }
            if (item.text === "Operations") {
              const filteredList = item.list.filter((subItem) =>
                ["First Mile", "Mid Mile", "Last Mile"].includes(subItem.name)
                // (subItem.name === "Allocate Sellers" && isAdmin === true && adminTab === true)
              );
              return filteredList.length > 0 ? { ...item, list: filteredList } : null;
            }

            if (["Support"].includes(item.text)) {
              return item;
            }

            return null;
          }

          // User admin (isAdmin true, adminTab false): show only /dashboard/ items, no admin-only subitems
          if (!adminTab) {
            if (
              item.text === "Courier" ||
              item.text === "Rate Card" ||
              item.text === "Finance" ||
              item.path === "/adminDashboard/b2c/order" ||
              item.path === "/adminDashboard/b2b/order" ||
              item.path === "/adminDashboard/ndr" ||
              item.text === "Operations" ||
              item.text === "Referral"
            ) {
              return null;
            }

            if (item.text === "Tools") {
              const filteredList = item.list.filter(
                (subItem) => subItem.path !== "/adminDashboard/tools/Weight_Dependency"
              );
              return filteredList.length > 0 ? { ...item, list: filteredList } : null;
            }

            if (item.text === "Setup & Manage") {
              const filteredList = item.list.filter(
                (subItem) =>
                  subItem.name !== "Users" &&
                  subItem.name !== "Roles" &&
                  subItem.name !== "Allocate Sellers" &&
                  subItem.name !== "Status Map" &&
                  subItem.name !== "EDD Mapping" &&
                  subItem.name !== "Pincode Information"
              );
              return filteredList.length > 0 ? { ...item, list: filteredList } : null;
            }

            return item;
          }

          return null;
        })
        .filter(Boolean);
    }

    // --- User logic (not admin, not employee): show only /dashboard/ items, not /adminDashboard/ and not admin-only subitems ---
    if (!isAdmin && !isEmployee) {
      return sidebarItems
        .filter(
          (item) =>
            !item.path || !item.path.startsWith("/adminDashboard")
        )
        .map((item) => {
          if (item.extent && Array.isArray(item.list)) {
            // Remove admin-only subitems for users
            let filteredList = item.list.filter(
              (subItem) =>
                !subItem.path ||
                !subItem.path.startsWith("/adminDashboard")
            );
            // For Setup & Manage, remove Users, Roles, Allocate Sellers for users
            if (item.text === "Setup & Manage") {
              filteredList = filteredList.filter(
                (subItem) =>
                  !["Users", "Roles", "Allocate Sellers", "Status Map", "EDD Mapping", "Pincode Information"].includes(subItem.name)
              );
            }
            if (item.text === "Operations") {
              filteredList = filteredList.filter(
                (subItem) =>
                  !["First Mile", "Mid Mile", "Last Mile"].includes(subItem.name)
              );
            }
            // For Tools, remove admin-only tools
            if (item.text === "Tools") {
              filteredList = filteredList.filter(
                (subItem) => subItem.path !== "/adminDashboard/tools/Weight_Dependency"
              );
            }
            if (item.text === "Finance") {
              return null;
            }
            if (item.text === "Courier") { return null; }
            if (item.text === "Rate Card") { return null; }
            if (item.text === "Referral") { return null; }
            return filteredList.length > 0 ? { ...item, list: filteredList } : null;
          }
          // Hide Billing for users if you want (optional)
          // if (item.text === "Billing") return null;
          if (item.text === "Rate Card") return null;

          return item;
        })
        .filter(Boolean);
    }

    // Default: show nothing until rights are loaded
    return [];
  }, [isAdmin, adminTab, isEmployee, employeeAccessRights, sidebarItems]);

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
          className="fixed top-[8px] left-2 z-50 text-[#0CBB7D] p-2"
          onClick={toggleSidebar}
        >
          <FontAwesomeIcon icon={expanded ? faTimes : faBars} className="text-lg" />
        </button>
      )}

      <aside
        className={`fixed top-0 left-0 h-full border-r transition-all duration-500 ease-in-out mt-[56px] sm:mt-[60px] 
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
            src={grouplogo}
            alt="description"
            className="h-5 w-5"
          />

          {/* Main Logo (Visible only when expanded) */}
          <img
            src={ShipexLogo}
            alt="Logo"
            className={`transition-all duration-300 
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
    </>
  );
};

export default Sidebar; 