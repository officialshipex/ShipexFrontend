import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
// import { toast } from "react-toastify";
import { ChevronDown } from "lucide-react";
import DatePicker from "react-datepicker";
import DetailedTicketView from "./DetailedTicketView";
import "react-datepicker/dist/react-datepicker.css";
import { BsThreeDotsVertical } from "react-icons/bs";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";


const ManageTickets = ({ isSidebarAdmin }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [ticketData, setTicketData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchNameEmail, setSearchNameEmail] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchTicketId, setSearchTicketId] = useState("");
  const [searchAWBNumber, setSearchAWBNumber] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [roleData, setRoleData] = useState([]);
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [employeeAccess, setEmployeeAccess] = useState({
    canView: false,
    canUpdate: false,
  });

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const statusOptions = [
    { label: "All", value: "" },
    { label: "Active", value: "active" },
    { label: "Resolved", value: "resolved" },
    { label: "Deleted", value: "deleted" },
  ];

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
          const support = roleRes.data.employee;
          console.log("Support Access Rights:", support);
          const canView =
            !!support?.accessRights?.support?.["Manage ticket"]?.view;
          const canUpdate =
            !!support?.accessRights?.support?.["Manage ticket"]?.action;
          // console.log(canUpdate);
          setRoleData(support);
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
        console.log("Ticket Data:", response.data);
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



    if (searchDate) {
      filtered = filtered.filter(
        (ticket) =>
          new Date(ticket.createdAt).toLocaleDateString() ===
          new Date(searchDate).toLocaleDateString()
      );
    }

    if (searchTicketId) {
      filtered = filtered.filter((ticket) =>
        ticket.ticketNumber.toLowerCase().includes(searchTicketId.toLowerCase())
      );
    }

    if (searchAWBNumber) {
      filtered = filtered.filter((ticket) =>
        ticket.awbNumbers?.includes(searchAWBNumber)
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
        ticket.status?.toLowerCase().includes(selectedStatus.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }, [
    ticketData,
    searchNameEmail,
    searchDate,
    searchTicketId,
    searchAWBNumber,
    selectedCategory,
    selectedPlatform,
    selectedStatus,
  ]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      console.log("Handling status change:", ticketId, newStatus);

      const token = Cookies.get("session");

      if (!token) {
        alert("Session expired. Please log in again.");
        return;
      }

      const headers = {
        authorization: `Bearer ${token}`,
      };

      const hasUpdateAccess =
        roleData.accessRights?.support?.["Manage ticket"]?.update;
      const isEmployeeActive = roleData.isEmpActive === true;

      if ((hasUpdateAccess && isEmployeeActive) || isSidebarAdmin) {
        console.log("Authorized to update");

        const response = await axios.put(
          `${REACT_APP_BACKEND_URL}/support/${ticketId}/status`,
          { status: newStatus },
          { headers }
        );

        if (response.status === 200) {
          setTicketData((prevData) =>
            prevData.map((ticket) =>
              ticket._id === ticketId
                ? { ...ticket, status: newStatus }
                : ticket
            )
          );

          Notification(
            newStatus === "resolved"
              ? "Ticket marked as resolved!"
              : "Ticket marked as deleted!",
            "success"
          );

        } else {
          console.log("Failed to update status:", response.data.message);
          Notification("Failed to update ticket status. Try again.", "error");
        }
      } else {
        console.log(
          "Unauthorized: either update access or employee status is false."
        );
        Notification("Unauthorized to update ticket status.", "error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      Notification("failed to update ticket status.", "error");
    }
  };

  const filterByStatus = (status) => {
    setSelectedStatus(status);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const dropdownRef = useRef(null); // Reference for dropdown

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
        onStatusChange={handleStatusChange} // <-- Pass this!
        isSidebarAdmin={isSidebarAdmin}
        employeeAccess={employeeAccess}
        roleData={roleData}
      />
    );
  }
  return (
    <div className="md:p-2">
      {/* Status Filter - Responsive */}
      <div className="mb-2">
        {/* Desktop View: Buttons */}
        <div className="hidden text-[12px] font-[600] md:flex space-x-2">
          {statusOptions.map((status) => (
            <button
              key={status.value}
              className={`px-3 py-2 rounded-lg transition-colors duration-200 ${selectedStatus === status.value
                ? "bg-[#0CBB7D] text-white"
                : "bg-white text-gray-700 hover:bg-green-200"
                }`}
              onClick={() => filterByStatus(status.value)}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Mobile View: Custom Dropdown */}
        <div className="md:hidden relative w-full">
          <button
            className="w-full py-2 px-3 text-[12px] rounded-lg bg-[#0CBB7D] text-white font-[600] transition-all duration-200 flex justify-between items-center"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
          >
            {statusOptions.find((o) => o.value === selectedStatus)?.label ||
              "Select Status"}
            <ChevronDown className="w-4 h-4 text-white" />
          </button>

          {statusDropdownOpen && (
            <ul className="absolute z-50 mt-1 w-full bg-white rounded-lg border shadow-md max-h-48 overflow-auto">
              {statusOptions.map((option) => (
                <li
                  key={option.value}
                  className={`cursor-pointer px-3 py-2 text-gray-700 text-[12px] font-[600] hover:bg-green-50 ${selectedStatus === option.value
                    ? "font-[600] bg-green-200"
                    : ""
                    }`}
                  onClick={() => {
                    filterByStatus(option.value);
                    setStatusDropdownOpen(false);
                  }}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>
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

            {/* Date Dropdown */}
            <div className="relative w-36 shrink-0">
              <button
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="w-full border px-3 py-2 rounded-lg text-[12px] font-[600] flex justify-between items-center h-9 transition-all duration-200 text-gray-400 bg-white"
              >
                {searchDate
                  ? new Date(searchDate).toLocaleDateString()
                  : "Select Date"}
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform duration-200 ${dateDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`absolute left-0 mt-1 w-full z-30 transition-all duration-200 transform origin-top ${dateDropdownOpen
                  ? "scale-y-100 opacity-100"
                  : "scale-y-0 opacity-0 pointer-events-none"
                  }`}
              >
                <div className="w-full max-w-xs mx-auto">
                  <DatePicker
                    selected={searchDate ? new Date(searchDate) : null}
                    onChange={(date) => {
                      setSearchDate(date?.toISOString().slice(0, 10));
                      setDateDropdownOpen(false);
                    }}
                    inline
                    className="w-full"
                  />
                </div>
              </div>
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
                      className={`cursor-pointer px-4 py-2 hover:bg-green-50 ${selectedPlatform === option.value
                        ? "font-semibold bg-green-50"
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
                      className={`cursor-pointer px-3 py-2 hover:bg-green-50 ${selectedCategory === option.value
                        ? "font-semibold bg-green-50"
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
            className="ml-auto bg-[#0CBB7D] border border-white hover:bg-green-500 text-white px-3 py-2 rounded-lg text-[12px] font-semibold transition h-9"
            onClick={() => {
              setSearchNameEmail("");
              setSearchDate("");
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
        <div className="md:hidden grid grid-cols-2 gap-2 w-full mx-auto">
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
            className="border px-3 py-2 rounded-lg text-[12px] font-[600] h-9 focus:outline-none placeholder:text-[12px]"
            value={searchTicketId}
            onChange={(e) => setSearchTicketId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search By AWB number"
            className="border px-3 py-2 rounded-lg text-[12px] font-[600] h-9 focus:outline-none placeholder:text-[12px]"
            value={searchAWBNumber}
            onChange={(e) => setSearchAWBNumber(e.target.value)}
          />
          {/* Row 3: Date & Platform side-by-side */}
          <div className="relative w-full">
            <button
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="w-full border px-3 py-2 rounded-lg text-[12px] font-[600] flex justify-between items-center h-9 transition-all duration-200 text-gray-400 bg-white"
            >
              {searchDate
                ? new Date(searchDate).toLocaleDateString()
                : "Select Date"}
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${dateDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`absolute left-0 mt-1 w-full z-30 transition-all duration-200 transform origin-top ${dateDropdownOpen
                ? "scale-y-100 opacity-100"
                : "scale-y-0 opacity-0 pointer-events-none"
                }`}
            >
              <div className="w-full max-w-xs mx-auto">
                <DatePicker
                  selected={searchDate ? new Date(searchDate) : null}
                  onChange={(date) => {
                    setSearchDate(date?.toISOString().slice(0, 10));
                    setDateDropdownOpen(false);
                  }}
                  inline
                  className="w-full"
                />
              </div>
            </div>
          </div>
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
                    className={`cursor-pointer px-3 py-2 hover:bg-green-50 ${selectedPlatform === option.value
                      ? "font-semibold bg-green-50"
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
                      className={`cursor-pointer px-3 py-2 hover:bg-green-50 ${selectedCategory === option.value
                        ? "font-semibold bg-green-50"
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
              className="flex-shrink-0 bg-[#0CBB7D] hover:bg-green-500 border border-white text-white px-3 py-2 rounded-lg text-[12px] font-semibold transition h-9"
              onClick={() => {
                setSearchNameEmail("");
                setSearchDate("");
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
      <div className="w-full">
        {/* Desktop View */}
        <div className="hidden md:block">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-[#0CBB7D] text-[12px] text-white border-[#0CBB7D] border font-[600]">
                <th className="py-2 px-3">Sl No.</th>
                <th className="py-2 px-3">Ticket ID</th>
                <th className="py-2 px-3">AWB No.</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Subcategory</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.length > 0 ? (
                displayedData.map((ticket, index) => {
                  const awbNumbers = ticket.awbNumbers || [];
                  const displayedAWB = awbNumbers.slice(0, 2).join(", ");
                  const hasMore = awbNumbers.length > 2;

                  return (
                    <tr
                      key={ticket._id}
                      className="text-center text-[12px] border border-gray-300"
                    >
                      <td className="py-2 px-3">{startIndex + index + 1}</td>
                      <td className="py-2 px-3">{ticket.ticketNumber}</td>
                      <td className="py-2 px-3 relative group">
                        <span>
                          {displayedAWB}
                          {hasMore && " ..."}
                        </span>
                        {hasMore && (
                          <div className="absolute left-0 bottom-full mb-2 w-max bg-gray-700 text-white text-sm p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {awbNumbers.join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {ticket.fullname}
                      </td>
                      <td className="py-2 px-3">{ticket.category}</td>
                      <td className="py-2 px-3">{ticket.subcategory}</td>
                      <td className="py-2 px-3">
                        {ticket.status || "Pending"}
                      </td>

                      <td className="px-3 py-2 flex justify-center relative" ref={dropdownRef}>
                        <button
                          className={`dropdown-button bg-[#0CBB7D] text-white w-6 h-6 rounded-full flex items-center justify-center ${!isSidebarAdmin && !employeeAccess.canUpdate
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                            }`}
                          disabled={!isSidebarAdmin && !employeeAccess.canUpdate}
                          onClick={() => {
                            if (isSidebarAdmin || employeeAccess.canUpdate) {
                              setOpenDropdown(openDropdown === ticket._id ? null : ticket._id);
                            }
                          }}
                        >
                          <BsThreeDotsVertical size={16} />
                        </button>

                        {openDropdown === ticket._id && (
                          <div className="dropdown-menu absolute right-2 top-full w-28 bg-white border rounded-lg shadow-lg z-50">
                            <button
                              className="block w-full text-gray-600 py-2 px-3 text-[12px] text-left hover:bg-gray-100"
                              onMouseDown={() => handleViewDetails(ticket)}
                            >
                              View Details
                            </button>
                            <button
                              className="block w-full text-green-600 py-2 px-3 text-[12px] text-left hover:bg-green-100"
                              onClick={() => {
                                handleStatusChange(ticket._id, "resolved");
                                setOpenDropdown(null);
                              }}
                            >
                              Resolved
                            </button>
                            <button
                              className="block w-full text-red-600 py-2 px-3 text-[12px] text-left hover:bg-red-100"
                              onClick={() => {
                                handleStatusChange(ticket._id, "deleted");
                                setOpenDropdown(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-4">
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Card Structure) */}
        <div className="md:hidden space-y-4">
          {displayedData.length > 0 ? (
            displayedData.map((ticket, index) => {
              const awbNumbers = ticket.awbNumbers || [];
              const displayedAWB = awbNumbers.slice(0, 2).join(", ");
              const hasMore = awbNumbers.length > 2;

              return (
                <div
                  key={ticket._id}
                  className="border border-gray-300 p-3 rounded-lg shadow-sm bg-white text-[12px]"
                >
                  <div className="flex justify-between items-center border-b pb-2 mb-2">
                    <span className="font-semibold text-gray-700">
                      Sl No: {startIndex + index + 1}
                    </span>
                    <button
                      className={`dropdown-button bg-[#0CBB7D] text-white w-6 h-6 rounded-full flex items-center justify-center ${!isSidebarAdmin && !employeeAccess.canUpdate
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                        }`}
                      disabled={!isSidebarAdmin && !employeeAccess.canUpdate}
                      onClick={() => {
                        if (isSidebarAdmin || employeeAccess.canUpdate) {
                          setOpenDropdown(
                            openDropdown === ticket._id ? null : ticket._id
                          );
                        }
                      }}
                    >
                      <BsThreeDotsVertical size={14} />
                    </button>
                  </div>

                  {/* Ticket details like table rows */}
                  <div className="space-y-1">
                    <p>
                      <strong className="text-gray-600">Ticket ID: </strong>
                      {ticket.ticketNumber}
                    </p>
                    <p className="relative">
                      <strong className="text-gray-600">AWB No.: </strong>
                      {displayedAWB}
                      {hasMore && " ..."}
                    </p>
                    <p>
                      <strong className="text-gray-600">Name: </strong>
                      {ticket.fullname}
                    </p>
                    <p>
                      <strong className="text-gray-600">Category: </strong>
                      {ticket.category}
                    </p>
                    <p>
                      <strong className="text-gray-600">Subcategory: </strong>
                      {ticket.subcategory}
                    </p>
                    <p>
                      <strong className="text-gray-600">Status: </strong>
                      <span
                        className={`${ticket.status === "resolved"
                          ? "text-green-600 font-semibold"
                          : ticket.status === "deleted"
                            ? "text-red-600 font-semibold"
                            : "text-yellow-600 font-semibold"
                          }`}
                      >
                        {ticket.status || "Pending"}
                      </span>
                    </p>
                    <p>
                      <strong className="text-gray-600">Created On: </strong>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions dropdown same as desktop */}
                  {openDropdown === ticket._id && (
                    <div className="mt-2 w-full bg-white border rounded shadow-md p-2">
                      <button
                        className="block w-full text-gray-600 py-2 text-left text-[12px] hover:bg-gray-100"
                        onMouseDown={() => handleViewDetails(ticket)}
                      >
                        View Details
                      </button>
                      <button
                        className="block w-full text-green-600 py-2 text-left text-[12px] hover:bg-green-100"
                        onMouseDown={() => {
                          handleStatusChange(ticket._id, "resolved");
                          setOpenDropdown(null);
                        }}
                      >
                        Resolved
                      </button>
                      <button
                        className="block w-full text-red-600 py-2 text-left text-[12px] hover:bg-red-100"
                        onMouseDown={() => {
                          handleStatusChange(ticket._id, "deleted");
                          setOpenDropdown(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center p-4 border rounded-lg bg-gray-50 text-[12px] shadow-sm">
              No data available in table
            </div>
          )}
        </div>

      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="px-3 py-2 bg-gray-300 text-[10px] rounded-lg disabled:opacity-50"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="text-[12px]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-3 py-2 bg-gray-300 text-[10px] rounded-lg disabled:opacity-50"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ManageTickets;
