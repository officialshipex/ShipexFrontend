import React, { useState, useEffect } from "react";
import axios from "axios";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
// import { toast } from "react-toastify";
import { ChevronDown } from "lucide-react";
import DateFilter from "../../filter/DateFilter";
import DetailedTicketView from "./DetailedTicketView";
import { BsThreeDotsVertical } from "react-icons/bs";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";
import { formatTicketDate, isTicketClosed, replyCountText, shortAwbList, statusTab } from "./ticketStatus";
import { StatusBadge, StatusTabs, useFillHeight } from "./StatusTabs";
import PaginationFooter from "../../Common/PaginationFooter";


// The shared date filter defaults to the last 30 days. Here it starts empty, so older tickets still waiting on
// an answer are not hidden.
const NO_DATE_RANGE = [{ startDate: null, endDate: null, key: "selection" }];

const ManageTickets = ({ isSidebarAdmin }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [tableRef, tableHeight] = useFillHeight();
  const [ticketData, setTicketData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchNameEmail, setSearchNameEmail] = useState("");
  const [dateRange, setDateRange] = useState(null); // null: no date filter, every ticket shows
  const [dateFilterKey, setDateFilterKey] = useState(0); // a new key resets the date filter's own display
  const [searchTicketId, setSearchTicketId] = useState("");
  const [searchAWBNumber, setSearchAWBNumber] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("New");
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [employeeAccess, setEmployeeAccess] = useState({
    canView: false,
    canUpdate: false,
  });

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const categoryOptions = [
    { label: "Select Category", value: "" },
    { label: "Shipment Dispute", value: "Shipment Dispute" },
    { label: "Finance", value: "Finance" },
    { label: "Pickup & Delivery", value: "Pickup & Delivery" },
    { label: "Shipment NDR & RTO", value: "Shipment NDR & RTO" },
    { label: "KYC & Bank Verification", value: "KYC & Bank Verification" },
    { label: "Technical Support", value: "Technical Support" },
    { label: "Billing & Taxation", value: "Billing & Taxation" },
    { label: "Claims", value: "Claims" },
    { label: "Others", value: "Others" },
  ];

  const platformOptions = [
    { label: "Select Platform", value: "" },
    { label: "User", value: "user" },
    { label: "Admin", value: "admin" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isSidebarAdmin) {
          setEmployeeAccess({ canView: true, canUpdate: true });
          setShowEmployeeAuthModal(false);
        } else {
          const token = Cookies.get("session");
          const roleRes = await axios.get(
            `${REACT_APP_BACKEND_URL}/staffRole/verify`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const manageRights = roleRes.data.employee?.accessRights?.support?.["Manage ticket"];
          const canView = !!manageRights?.view;
          const canUpdate = !!(manageRights?.update || manageRights?.action);
          setEmployeeAccess({ canView, canUpdate });
          setShowEmployeeAuthModal(!canView);
          if (!canView) return;
        }

        // Fetch tickets
        const token = Cookies.get("session");
        const headers = { authorization: `Bearer ${token}` };
        const response = await axios.get(`${REACT_APP_BACKEND_URL}/support`, {
          headers,
        });
        setTicketData(response.data || []);
        setFilteredData(response.data || []);
      } catch (error) {
        console.error("Error fetching tickets or role:", error);
        if (!isSidebarAdmin) setShowEmployeeAuthModal(true);
      }
    };
    fetchData();
  }, [isSidebarAdmin, REACT_APP_BACKEND_URL]);

  useEffect(() => {
    // Filter data based on various criteria
    let filtered = ticketData.filter((ticket) =>
      (ticket.fullname + ticket.email)
        .toLowerCase()
        .includes(searchNameEmail.toLowerCase())
    );



    const from = dateRange?.[0]?.startDate;
    const to = dateRange?.[0]?.endDate;
    if (from && to) {
      filtered = filtered.filter((ticket) => {
        const created = new Date(ticket.createdAt);
        return created >= from && created <= to;
      });
    }

    if (searchTicketId) {
      filtered = filtered.filter((ticket) =>
        ticket.ticketNumber.toLowerCase().includes(searchTicketId.toLowerCase())
      );
    }

    if (searchAWBNumber) {
      filtered = filtered.filter((ticket) =>
        ticket.awbNumbers?.some((awb) => awb.toLowerCase().includes(searchAWBNumber.trim().toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (ticket) => ticket.category === selectedCategory
      );
    }

    if (selectedPlatform) {
      filtered = filtered.filter((ticket) =>
        selectedPlatform === "admin" ? ticket.isAdmin : !ticket.isAdmin
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((ticket) =>
        statusTab(ticket.status) === selectedStatus
      );
    }

    setFilteredData(filtered);
  }, [
    ticketData,
    searchNameEmail,
    dateRange,
    searchTicketId,
    searchAWBNumber,
    selectedCategory,
    selectedPlatform,
    selectedStatus,
  ]);

  // A narrower list may have fewer pages than the one being looked at
  useEffect(() => {
    setCurrentPage(1);
  }, [searchNameEmail, dateRange, searchTicketId, searchAWBNumber, selectedCategory, selectedPlatform, selectedStatus]);

  const updateTicketInList = (updated) => {
    setTicketData((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    setSelectedTicket((current) => (current && current._id === updated._id ? updated : current));
  };

  const removeTicketFromList = (ticketId) => {
    setTicketData((prev) => prev.filter((t) => t._id !== ticketId));
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      const response = await axios.put(
        `${REACT_APP_BACKEND_URL}/support/${ticketId}/close`,
        {},
        { headers: { authorization: `Bearer ${Cookies.get("session")}` } }
      );
      updateTicketInList(response.data.ticket);
      Notification("Ticket closed.", "success");
    } catch (error) {
      Notification(error.response?.data?.message || "Failed to close the ticket.", "error");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Delete this ticket? It will disappear for the seller too.")) return;
    try {
      await axios.put(
        `${REACT_APP_BACKEND_URL}/support/${ticketId}/status`,
        { status: "deleted" },
        { headers: { authorization: `Bearer ${Cookies.get("session")}` } }
      );
      removeTicketFromList(ticketId);
      Notification("Ticket deleted.", "success");
    } catch (error) {
      Notification(error.response?.data?.message || "Failed to delete the ticket.", "error");
    }
  };

  const filterByStatus = (status) => {
    setSelectedStatus(status);
  };

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isDropdownButton = event.target.closest(".dropdown-button");
      const isDropdownMenu = event.target.closest(".dropdown-menu");
      if (!isDropdownButton && !isDropdownMenu) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailedView(true);
    setOpenDropdown(null);
  };

  if (!isSidebarAdmin && showEmployeeAuthModal) {
    return (
      <EmployeeAuthModal
        employeeModalShow={true}
        employeeModalClose={() => setShowEmployeeAuthModal(false)}
      />
    );
  }

  // In ManageTickets.jsx
  if (showDetailedView && selectedTicket) {
    return (
      <DetailedTicketView
        ticket={selectedTicket}
        onClose={() => setShowDetailedView(false)}
        onTicketUpdated={updateTicketInList}
        onTicketDeleted={removeTicketFromList}
        isSupportSide
        canUpdate={employeeAccess.canUpdate}
      />
    );
  }
  return (
    <div className="min-w-0 max-w-full">
      {/* Status tabs */}
      <div className="mb-2">
        <StatusTabs tickets={ticketData} selected={selectedStatus} onSelect={filterByStatus} />
      </div>

      {/* Filters and Search Inputs */}
      <div className="w-full mx-auto mb-2">
        {/* Desktop View */}
        <div className="hidden md:flex items-center w-full">
          {/* Remove flex-1 to prevent field stretching */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search By Name, Email"
              className="border px-3 py-2 rounded-lg text-[12px] font-[600] h-9 placeholder:text-[12px] focus:outline-none"
              value={searchNameEmail}
              onChange={(e) => setSearchNameEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="Search By Ticket ID"
              className="border px-3 py-2 rounded-lg text-[12px] font-[600] h-9 placeholder:text-[12px] focus:outline-none"
              value={searchTicketId}
              onChange={(e) => setSearchTicketId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Search By AWB number"
              className="border px-3 py-1.5 rounded-lg text-[12px] font-[600] h-9 placeholder:text-[12px] focus:outline-none"
              value={searchAWBNumber}
              onChange={(e) => setSearchAWBNumber(e.target.value)}
            />

            <div className="w-[190px] shrink-0">
              <DateFilter key={dateFilterKey} noInitialFilter initialDateRange={NO_DATE_RANGE} className="w-full" onDateChange={setDateRange} />
            </div>
            {/* Platform Dropdown */}
            <div className="relative dropdown-container w-36 h-9 shrink-0">
              <button
                className="w-full border px-3 py-2 rounded-lg text-[12px] font-[600] flex justify-between items-center bg-white text-gray-400 h-full"
                onClick={() =>
                  setPlatformDropdownOpen((prev) => ({
                    ...prev,
                    platform: !prev.platform,
                    category: false,
                  }))
                }
              >
                {platformOptions.find((o) => o.value === selectedPlatform)?.label ||
                  "Select Platform"}
                <ChevronDown className="w-4 h-4" />
              </button>
              {platformDropdownOpen.platform && (
                <ul className="absolute z-50 mt-1 w-full bg-white rounded-lg border shadow-md max-h-60 overflow-auto text-[12px]">
                  {platformOptions.map((option) => (
                    <li
                      key={option.value}
                      className={`cursor-pointer px-4 py-2 hover:bg-brand-secondary/8 ${selectedPlatform === option.value
                        ? "font-semibold bg-brand-secondary/8"
                        : ""}`}
                      onClick={() => {
                        setSelectedPlatform(option.value);
                        setPlatformDropdownOpen((prev) => ({
                          ...prev,
                          platform: false,
                        }));
                      }}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="relative dropdown-container w-36 h-9 shrink-0">
              <button
                className="w-full border px-3 py-2 rounded-lg text-[12px] font-[600] flex justify-between items-center bg-white text-gray-400 h-full"
                onClick={() =>
                  setCategoryDropdownOpen((prev) => ({
                    ...prev,
                    category: !prev.category,
                    platform: false,
                  }))
                }
              >
                {categoryOptions.find((o) => o.value === selectedCategory)?.label ||
                  "Select Category"}
                <ChevronDown className="w-4 h-4" />
              </button>
              {categoryDropdownOpen.category && (
                <ul className="absolute z-50 mt-1 w-full bg-white rounded-lg border shadow-md max-h-60 overflow-auto text-[12px]">
                  {categoryOptions.map((option) => (
                    <li
                      key={option.value}
                      className={`cursor-pointer px-3 py-2 hover:bg-brand-secondary/8 ${selectedCategory === option.value
                        ? "font-semibold bg-brand-secondary/8"
                        : ""}`}
                      onClick={() => {
                        setSelectedCategory(option.value);
                        setCategoryDropdownOpen((prev) => ({
                          ...prev,
                          category: false,
                        }));
                      }}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* Clear Button right-aligned, height same as fields */}
          <button
            className="ml-auto bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-[12px] font-semibold transition h-9"
            onClick={() => {
              setSearchNameEmail("");
              setDateRange(null);
              setDateFilterKey((k) => k + 1);
              setSearchTicketId("");
              setSearchAWBNumber("");
              setSelectedCategory("");
              setSelectedPlatform("");
            }}
          >
            Clear
          </button>
        </div>

        {/* Mobile View */}
        <div className="md:hidden grid grid-cols-2 gap-2 w-full mx-auto min-w-0 [&>*]:min-w-0">
          {/* Row 1: Search by username spans full width */}
          <input
            type="text"
            placeholder="Search By Name, Email"
            className="col-span-2 border px-3 py-2 rounded-lg text-[12px] font-[600] h-9 focus:outline-none placeholder:text-[12px]"
            value={searchNameEmail}
            onChange={(e) => setSearchNameEmail(e.target.value)}
          />
          {/* Row 2: Ticket ID & AWB side-by-side */}
          <input
            type="text"
            placeholder="Search By Ticket ID"
            className="w-full min-w-0 border px-3 py-2 rounded-lg text-[12px] font-[600] h-9 focus:outline-none placeholder:text-[12px]"
            value={searchTicketId}
            onChange={(e) => setSearchTicketId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search By AWB number"
            className="w-full min-w-0 border px-3 py-2 rounded-lg text-[12px] font-[600] h-9 focus:outline-none placeholder:text-[12px]"
            value={searchAWBNumber}
            onChange={(e) => setSearchAWBNumber(e.target.value)}
          />
          {/* Row 3: Date & Platform side-by-side */}
          <DateFilter key={dateFilterKey} noInitialFilter initialDateRange={NO_DATE_RANGE} className="w-full" onDateChange={setDateRange} />
          <div className="relative dropdown-container h-9">
            <button
              className="w-full h-full border px-3 py-2 rounded-lg text-[12px] font-[600] flex justify-between items-center bg-white text-gray-400"
              onClick={() =>
                setPlatformDropdownOpen((prev) => ({
                  ...prev,
                  platform: !prev.platform,
                  category: false,
                }))
              }
            >
              {platformOptions.find((o) => o.value === selectedPlatform)?.label ||
                "Select Platform"}
              <ChevronDown className="w-4 h-4" />
            </button>
            {platformDropdownOpen.platform && (
              <ul className="absolute z-50 mt-1 w-full bg-white rounded-lg border shadow-md max-h-60 overflow-auto text-[12px]">
                {platformOptions.map((option) => (
                  <li
                    key={option.value}
                    className={`cursor-pointer px-3 py-2 hover:bg-brand-secondary/8 ${selectedPlatform === option.value
                      ? "font-semibold bg-brand-secondary/8"
                      : ""}`}
                    onClick={() => {
                      setSelectedPlatform(option.value);
                      setPlatformDropdownOpen((prev) => ({
                        ...prev,
                        platform: false,
                      }));
                    }}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Row 4: Category wide, Clear compact */}
          <div className="col-span-2 flex gap-2">
            <div className="flex-grow relative dropdown-container h-9">
              <button
                className="w-full h-full border px-3 py-2 rounded-lg text-[12px] font-[600] flex justify-between items-center bg-white text-gray-400"
                onClick={() =>
                  setCategoryDropdownOpen((prev) => ({
                    ...prev,
                    category: !prev.category,
                    platform: false,
                  }))
                }
              >
                {categoryOptions.find((o) => o.value === selectedCategory)?.label ||
                  "Select Category"}
                <ChevronDown className="w-4 h-4" />
              </button>
              {categoryDropdownOpen.category && (
                <ul className="absolute z-50 mt-1 w-full bg-white rounded-lg border shadow-md max-h-60 overflow-auto text-[12px]">
                  {categoryOptions.map((option) => (
                    <li
                      key={option.value}
                      className={`cursor-pointer px-3 py-2 hover:bg-brand-secondary/8 ${selectedCategory === option.value
                        ? "font-semibold bg-brand-secondary/8"
                        : ""}`}
                      onClick={() => {
                        setSelectedCategory(option.value);
                        setCategoryDropdownOpen((prev) => ({
                          ...prev,
                          category: false,
                        }));
                      }}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              className="flex-shrink-0 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-[12px] font-semibold transition h-9"
              onClick={() => {
                setSearchNameEmail("");
                setDateRange(null);
              setDateFilterKey((k) => k + 1);
                setSearchTicketId("");
                setSearchAWBNumber("");
                setSelectedCategory("");
                setSelectedPlatform("");
              }}
            >
              Clear
            </button>
          </div>

        </div>
      </div>




      {/* Ticket Table */}
      <div className="w-full" ref={tableRef}>
        {/* Desktop View */}
        <div style={{ height: tableHeight }} className="hidden md:block overflow-auto bg-white rounded-lg border border-gray-200">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-brand-primary text-[12px] text-white font-[600]">
                <th className="py-2.5 px-4">Ticket</th>
                <th className="py-2.5 px-4">Raised by</th>
                <th className="py-2.5 px-4">AWB</th>
                <th className="py-2.5 px-4">Issue</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Last update</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.length > 0 ? (
                displayedData.map((ticket) => (
                  <tr key={ticket._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <p className="text-[12px] font-[600] text-brand-primary">#{ticket.ticketNumber}</p>
                      <p className="text-[11px] text-gray-400">{formatTicketDate(ticket.createdAt)}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="text-[12px] font-[600] text-gray-700">{ticket.fullname}</p>
                      <p className="text-[11px] text-gray-400">{ticket.email}</p>
                    </td>
                    <td className="py-2.5 px-4 text-[12px] text-gray-600" title={(ticket.awbNumbers || []).join(", ")}>
                      {shortAwbList(ticket.awbNumbers)}
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="text-[12px] font-[600] text-gray-700">{ticket.subcategory}</p>
                      <p className="text-[11px] text-gray-400">{ticket.category}</p>
                    </td>
                    <td className="py-2.5 px-4"><StatusBadge status={ticket.status} /></td>
                    <td className="py-2.5 px-4">
                      <p className="text-[12px] text-gray-600">{formatTicketDate(ticket.lastRepliedAt || ticket.createdAt)}</p>
                      <p className="text-[11px] text-gray-400">{replyCountText(ticket)}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1.5 relative">
                        <button
                          className="px-3 py-1 rounded-lg border border-brand-primary text-brand-primary text-[12px] font-[600] hover:bg-brand-primary hover:text-white transition-colors"
                          onClick={() => handleViewDetails(ticket)}
                        >
                          View
                        </button>
                        {employeeAccess.canUpdate && (
                          <button
                            aria-label="More actions"
                            className="dropdown-button text-gray-500 hover:bg-gray-100 w-7 h-7 rounded-lg flex items-center justify-center"
                            onClick={() => setOpenDropdown(openDropdown === ticket._id ? null : ticket._id)}
                          >
                            <BsThreeDotsVertical size={14} />
                          </button>
                        )}
                        {openDropdown === ticket._id && (
                          <div className="dropdown-menu absolute right-0 top-full mt-1 w-32 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
                            {!isTicketClosed(ticket.status) && (
                              <button
                                className="block w-full text-gray-700 py-2 px-3 text-[12px] text-left hover:bg-gray-50"
                                onClick={() => {
                                  handleCloseTicket(ticket._id);
                                  setOpenDropdown(null);
                                }}
                              >
                                Mark Closed
                              </button>
                            )}
                            <button
                              className="block w-full text-red-600 py-2 px-3 text-[12px] text-left hover:bg-red-50"
                              onClick={() => {
                                handleDeleteTicket(ticket._id);
                                setOpenDropdown(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-[12px] text-gray-500">
                    No tickets here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Card Structure) */}
        <div style={{ height: tableHeight }} className="md:hidden overflow-y-auto flex flex-col gap-2">
          {displayedData.length > 0 ? (
            displayedData.map((ticket) => (
              <div key={ticket._id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-[600] text-brand-primary">#{ticket.ticketNumber}</span>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="text-[12px] font-[600] text-gray-700 mt-1.5">{ticket.subcategory}</p>
                <p className="text-[11px] text-gray-400">{ticket.category}</p>
                <p className="text-[11px] text-gray-500 mt-1.5">{ticket.fullname} · {ticket.email}</p>
                <p className="text-[11px] text-gray-500">AWB: {shortAwbList(ticket.awbNumbers)}</p>
                <p className="text-[11px] text-gray-500">Updated {formatTicketDate(ticket.lastRepliedAt || ticket.createdAt)} · {replyCountText(ticket)}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    className="flex-1 py-1.5 rounded-lg border border-brand-primary text-brand-primary text-[12px] font-[600]"
                    onClick={() => handleViewDetails(ticket)}
                  >
                    View
                  </button>
                  {employeeAccess.canUpdate && !isTicketClosed(ticket.status) && (
                    <button
                      className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-[12px] font-[600]"
                      onClick={() => handleCloseTicket(ticket._id)}
                    >
                      Mark Closed
                    </button>
                  )}
                  {employeeAccess.canUpdate && (
                    <button
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-[12px] font-[600]"
                      onClick={() => handleDeleteTicket(ticket._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg py-10 text-center text-[12px] text-gray-500">
              No tickets here.
            </div>
          )}
        </div>
      </div>

      <PaginationFooter page={currentPage} totalPages={totalPages} setPage={setCurrentPage} limit={itemsPerPage} setLimit={setItemsPerPage} />
    </div>
  );
};

export default ManageTickets;
