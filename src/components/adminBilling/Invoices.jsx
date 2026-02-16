import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import UserFilter from "../../filter/UserFilter"; // update path if needed
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import ThreeDotLoader from "../../Loader"
import { HiOutlineDownload } from "react-icons/hi";
import NotFound from "../../assets/nodatafound.png"
import PaginationFooter from "../../Common/PaginationFooter"


const MONTHS = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clearFilterFlag, setClearFilterFlag] = useState(0);

  // Filters
  const [userId, setUserId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpenDesktop, setYearOpenDesktop] = useState(false);
  const [yearOpenMobile, setYearOpenMobile] = useState(false);

  const [actionOpen, setActionOpen] = useState(false);
  const actionRef = useRef(null);
  const hasFilter = selectedInvoices.length > 0
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);


  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const token = Cookies.get("session");

  // dropdown refs for outside click
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const yearRef1 = useRef(null);

  // years from 2023 to current year
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2023; y <= currentYear; y++) years.push(y.toString());

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (monthRef.current && !monthRef.current.contains(e.target)) {
        setMonthOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(e.target)) {
        setYearOpenDesktop(false);
      }
      if (yearRef1.current && !yearRef1.current.contains(e.target)) {
        setYearOpenMobile(false);
      }

      if (actionRef.current && !actionRef.current.contains(e.target)) {
        setActionOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);


  // when child sends a selected user id update our userId filter
  useEffect(() => {
    if (selectedUserId) setUserId(selectedUserId);
    else setUserId("");
  }, [selectedUserId]);

  // fetch when filters change (debounce could be added if needed)
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [userId, invoiceNumber, month, year, page, limit]);


  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
      };
      if (userId) params.userId = userId;
      if (invoiceNumber) params.invoiceNumber = invoiceNumber;
      if (month) params.month = month;
      if (year) params.year = year;

      const { data } = await axios.get(
        `${REACT_APP_BACKEND_URL}/invoice/adminGetInvoices`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );
      console.log("Fetched invoices:", data);

      setInvoices(data.invoices || []);
      setTotalPages(data.page || 1);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map((inv) => inv._id));
    }
  };


  const handleCheckboxChange = (invoiceId) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const clearFilters = () => {
    setUserId("");
    setSelectedUserId(null);
    setInvoiceNumber("");
    setMonth("");
    setYear("");
    setPage(1);
    fetchData();
    setClearFilterFlag(prev => prev + 1);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-[#0CBB7D] text-white";
      case "pending":
        return "bg-red-500 text-white";
      case "partially_paid":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };


  // helper to format user details cell
  const renderUserDetails = (inv) => {
    // attempt to use inv.userDetails if available, otherwise fallback to inv.* fields
    const user = inv.userDetails || {
      fullname: inv.userFullname || inv.userName || inv.name,
      email: inv.userEmail || inv.email,
      phoneNumber: inv.userPhone || inv.phoneNumber,
      userId: inv.userId || inv.customerId || inv.user,
    };

    return (
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <div className="text-[12px] text-[#0CBB7D] truncate">{user.userId || ""}</div>
          <div className="text-[12px] font-medium text-gray-700 truncate">
            {user.fullname || "-"}
          </div>
          <div className="text-[12px] text-gray-500 truncate">
            {user.email || "-"}
          </div>
          <div className="text-[12px] text-gray-500 truncate">
            {user.phoneNumber || "-"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full mx-auto space-y-2">

      {/* Filters */}
      <div className="flex gap-2 flex-col w-full sm:flex-row sm:justify-between sm:items-center">

        <div className="flex sm:flex-row flex-col gap-2">
          {/* USER FILTER */}
          <UserFilter
            onUserSelect={(id) => setSelectedUserId(id)}
            clearTrigger={clearFilterFlag}
          />

          <div className="flex gap-2">
            {/* INVOICE NUMBER */}
            <input
              type="text"
              placeholder="Invoice Number"
              className="border px-3 h-9 text-[12px] focus:outline-none font-[600] rounded-lg sm:w-60"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />

            {/* MONTH DROPDOWN */}
            <div className="relative sm:w-48 w-full" ref={monthRef}>
              <button
                type="button"
                className="w-full h-9 border font-[600] text-gray-400 bg-white rounded-lg flex items-center justify-between px-3 text-[12px]"
                onClick={(e) => {
                  e.stopPropagation();
                  setMonthOpen((prev) => !prev);
                }}
              >
                <span>{month ? MONTHS.find(m => m.value === month)?.label : "Select Month"}</span>
                {monthOpen ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {monthOpen && (
                <div
                  className="absolute z-10 left-0 right-0 top-full bg-white border rounded-lg mt-1 max-h-40 overflow-y-auto shadow"
                  onClick={(e) => e.stopPropagation()}
                >
                  {MONTHS.map((m) => (
                    <div
                      key={m.value}
                      className="px-3 py-2 hover:bg-green-100 text-[12px] text-gray-500 font-[600] cursor-pointer"
                      onClick={() => {
                        setMonth(m.value);

                        // ⭐ Auto-select YEAR immediately
                        if (!year) {
                          setYear(new Date().getFullYear());
                        }

                        setMonthOpen(false);
                      }}
                    >
                      {m.label}
                    </div>
                  ))}

                </div>
              )}
            </div>
          </div>

          {/* YEAR DROPDOWN */}
          <div className="relative w-40 hidden sm:block" ref={yearRef}>
            <button
              type="button"
              className="w-full h-9 border bg-white font-[600] text-gray-400 rounded-lg flex items-center justify-between px-3 text-[12px]"
              onClick={(e) => {
                e.stopPropagation();
                setYearOpenDesktop((prev) => !prev);
              }}
            >
              <span>{year || "Select Year"}</span>
              {yearOpenDesktop ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {yearOpenDesktop && (
              <div
                className="absolute left-0 right-0 top-full bg-white border rounded-md mt-1 max-h-40 overflow-y-auto shadow"
                onClick={(e) => e.stopPropagation()}
              >
                {years.map((y) => (
                  <div
                    key={y}
                    className="px-3 py-2 hover:bg-green-100 text-[12px] text-gray-500 font-[600] cursor-pointer"
                    onClick={() => {
                      setYear(y);
                      setYearOpenDesktop(false);
                    }}
                  >
                    {y}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row gap-2">
          {/* YEAR DROPDOWN */}
          <div className="relative w-full sm:hidden" ref={yearRef1}>
            <button
              type="button"
              className="w-full h-9 border bg-white font-[600] text-gray-400 rounded-lg flex items-center justify-between px-3 text-[12px]"
              onClick={(e) => {
                e.stopPropagation();
                setYearOpenMobile((prev) => !prev);
              }}
            >
              <span>{year || "Select Year"}</span>
              {yearOpenMobile ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {yearOpenMobile && (
              <div
                className="absolute left-0 right-0 top-full bg-white border rounded-md mt-1 max-h-40 overflow-y-auto shadow"
                onClick={(e) => e.stopPropagation()}
              >
                {years.map((y) => (
                  <div
                    key={y}
                    className="px-3 py-2 hover:bg-green-100 text-[12px] text-gray-500 font-[600] cursor-pointer"
                    onClick={() => {
                      setYear(y);
                      setYearOpenMobile(false);
                    }}
                  >
                    {y}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* CLEAR BUTTON */}
          <button
            onClick={clearFilters}
            className="h-9 px-3 rounded-lg border text-[12px] font-[600] bg-[#0CBB7D] hover:bg-green-500 text-white"
          >
            Clear
          </button>

          {/* ACTION BUTTON */}
          <div className="relative" ref={actionRef}>
            <button
              disabled={!hasFilter}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-9 px-3 rounded-lg text-[12px] font-[600] ${hasFilter ? "bg-[#0CBB7D] text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              Action
            </button>

            {actionOpen && hasFilter && (
              <div className="absolute right-0 mt-1 bg-white border rounded-md shadow-lg w-32 text-[12px]">
                <div
                  className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                  onClick={() => {
                    setActionOpen(false);

                    if (!selectedInvoices.length) return;

                    const url = `${REACT_APP_BACKEND_URL}/invoice/bulk-download?invoiceNumbers=${selectedInvoices.join(",")}`;

                    window.open(url, "_blank");
                  }}
                >
                  Download Invoice
                </div>
              </div>
            )}
          </div>
        </div>

      </div>




      {/* Loader */}
      {/* {loading && <p className="text-center py-10">Loading...</p>} */}

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0CBB7D] text-white text-[12px] border border-[#0CBB7D] font-[600]">
              <th className="py-2 px-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    invoices.length > 0 &&
                    selectedInvoices.length === invoices.length
                  }
                  onChange={handleSelectAll}
                  className="cursor-pointer accent-[#0CBB7D] w-4"
                />

              </th>
              <th className="px-3 py-2">User Details</th>
              <th className="px-3 py-2">Invoice No</th>
              <th className="px-3 py-2">Shipments</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Created On</th>
              <th className="px-3 py-2">Invoice Period</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-6 text-center">
                  <ThreeDotLoader />
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src={NotFound}
                      alt="No Data Found"
                      className="w-60 h-60 object-contain mb-2"
                    />
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.invoiceNumber || inv._id} className="border hover:bg-gray-50 text-[12px]">
                  <td className="py-2 px-3 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(inv._id)}
                      onChange={() => handleCheckboxChange(inv._id)}
                      className="cursor-pointer accent-[#0CBB7D] w-4"
                    />

                  </td>
                  <td className="px-3 py-2">{renderUserDetails(inv)}</td>
                  <td className="px-3 py-2">{inv.invoiceNumber}</td>
                  <td className="px-3 py-2">{inv.totalShipments}</td>
                  <td className="px-3 py-2">₹{inv.amount}</td>
                  <td className="px-3 py-2">{inv.invoiceDate}</td>
                  <td className="px-3 py-2">
                    {new Date(inv.periodEnd).toLocaleString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-lg text-[12px] font-medium border ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {inv.invoiceUrl && (
                      <a
                        href={inv.invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center bg-[#0CBB7D] text-white w-7 h-7 rounded-full hover:opacity-90 transition"
                        title="Download Invoice"
                      >
                        <HiOutlineDownload className="w-4 h-4" />
                      </a>
                    )}
                  </td>


                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden grid gap-3">
        <div className="p-1 bg-green-100 rounded-md flex gap-3 items-center">
          <input
            type="checkbox"
            checked={
              invoices.length > 0 &&
              selectedInvoices.length === invoices.length
            }
            onChange={handleSelectAll}
            className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
          />

          <span className="text-[10px] font-[600]">Select All</span>
        </div>

        {/* LOADER */}
        {loading && (
          <div className="flex justify-center py-10">
            <ThreeDotLoader />
          </div>
        )}

        {/* NO DATA */}
        {!loading && invoices.length === 0 && (
          <div className="text-center text-gray-500 py-6"><img
            src={NotFound}
            alt="No Data Found"
            className="w-60 h-60 object-contain mb-2"
          /></div>
        )}

        {/* INVOICE CARDS */}
        {!loading &&
          invoices.map((inv) => {
            const user = inv.userDetails || {
              fullname: inv.userFullname || inv.userName || inv.name,
              email: inv.userEmail || inv.email,
              phoneNumber: inv.userPhone || inv.phoneNumber,
              userId: inv.userId || inv.customerId || inv.user,
            };

            return (
              <div
                key={inv.invoiceNumber || inv._id}
                className="bg-white shadow-sm rounded-lg px-3 py-3 mb-2 text-[12px] border"
              >
                <input
                  type="checkbox"
                  checked={selectedInvoices.includes(inv._id)}
                  onChange={() => handleCheckboxChange(inv._id)}
                  className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                />

                {/* ================= HEADER (LEFT INFO + RIGHT DOWNLOAD ICON) ================= */}
                <div className="flex justify-between items-start mb-3">
                  {/* LEFT INFO */}
                  <div className="space-y-0.5">
                    <div className="font-semibold text-gray-700">#{inv.invoiceNumber}</div>
                    <div className="text-gray-500">Shipments : {inv.totalShipments}</div>
                    <div className="text-gray-500">
                      Invoice Period:{" "}
                      {new Date(inv.periodEnd || inv.createdAt).toLocaleString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </div>

                  </div>

                  {/* RIGHT SIDE — DOWNLOAD ICON & PERIOD END */}
                  <div className="text-right space-y-2">
                    {/* Download Icon */}
                    {inv.invoiceUrl && (
                      <a
                        href={inv.invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block"
                        title="Download Invoice"
                      >
                        <HiOutlineDownload className="w-6 h-6 text-[#0CBB7D]" />
                      </a>
                    )}

                    {/* Period End */}
                    <div className="text-gray-500">
                      Created On: {inv.periodEnd || "-"}
                    </div>
                  </div>
                </div>

                {/* ================= GREEN USER DETAILS BOX ================= */}
                <div className="bg-green-50 flex justify-between items-center rounded-lg p-3">
                  {/* USER DETAILS */}
                  <div className="mt-2 space-y-0.5">
                    <div className="text-[#0CBB7D] truncate text-[12px]">{user.userId || ""}</div>
                    <div className="font-semibold text-gray-700 truncate">{user.fullname || "-"}</div>
                    <div className="text-gray-600 truncate text-[12px]">{user.email || "-"}</div>
                    <div className="text-gray-600 truncate text-[12px]">{user.phoneNumber || "-"}</div>
                  </div>

                  {/* TOP ROW: AMOUNT + STATUS */}
                  <div className="flex flex-col items-center mb-2">
                    {/* AMOUNT */}
                    <div className="font-[600] text-[12px] text-gray-700">
                      ₹{inv.amount}
                    </div>

                    {/* STATUS BADGE */}
                    <span
                      className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-medium border ${getStatusColor(
                        inv.status
                      )}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        limit={limit}
        setLimit={setLimit}
      />


    </div>
  );
};

export default Invoices;
