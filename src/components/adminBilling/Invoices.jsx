import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { ChevronDown, Filter } from "lucide-react";
import ThreeDotLoader from "../../Loader"
import { HiOutlineDownload } from "react-icons/hi";
import NotFound from "../../assets/nodatafound.png"
import PaginationFooter from "../../Common/PaginationFooter"
import InvoicesFilterPanel from "../../Common/InvoicesFilterPanel";
import UserFilter from "../../filter/UserFilter";
import dayjs from "dayjs";
import { FiCopy, FiCheck } from "react-icons/fi";
import { FaBars } from "react-icons/fa";

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
  const [copiedId, setCopiedId] = useState(null);

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const actionRef = useRef(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const token = Cookies.get("session");

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2023; y <= currentYear; y++) years.push(y.toString());

  useEffect(() => {
    const handler = (event) => {
      if (actionRef.current && !actionRef.current.contains(event.target)) {
        setActionOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    fetchData();
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
      setInvoices(data.invoices || []);
      setTotalPages(data.page || 1);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === invoices.length && invoices.length > 0) {
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

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearFilters = () => {
    setUserId("");
    setSelectedUserId(null);
    setInvoiceNumber("");
    setMonth("");
    setYear("");
    setPage(1);
    setClearFilterFlag(prev => prev + 1);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-[#0CBB7D] border-[#0CBB7D]/20";
      case "pending":
        return "bg-red-100 text-red-600 border-red-200";
      case "partially_paid":
        return "bg-yellow-100 text-yellow-600 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const renderUserDetails = (inv) => {
    const user = inv.userDetails || {
      fullname: inv.userFullname || inv.userName || inv.name,
      email: inv.userEmail || inv.email,
      phoneNumber: inv.userPhone || inv.phoneNumber,
      userId: inv.userId || inv.customerId || inv.user,
    };

    return (
      <div className="flex flex-col">
        <span className="text-[#0CBB7D] font-medium leading-tight">{user.userId || ""}</span>
        <span className="text-[12px] font-medium text-gray-700 leading-tight">
          {user.fullname || "-"}
        </span>
        <span className="text-[12px] text-gray-500 truncate max-w-[150px]">
          {user.email || "-"}
        </span>
        <span className="text-[12px] text-gray-500">
          {user.phoneNumber || "-"}
        </span>
      </div>
    );
  };

  const isAnyFilterApplied = selectedUserId || invoiceNumber || month || year;

  return (
    <div className="space-y-2">
      {/* Desktop Filter Section */}
      <div className="hidden md:flex gap-2 relative sm:items-center">
        <div className="flex-1 max-w-[300px]">
          <UserFilter
            onUserSelect={(id) => {
              setUserId(id);
              setSelectedUserId(id);
              setPage(1);
            }}
            clearTrigger={clearFilterFlag}
          />
        </div>
        <button
          onClick={() => setIsFilterPanelOpen(true)}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap h-9"
        >
          <Filter className="w-4 h-4 text-[#0CBB7D]" />
          More Filters
        </button>

        <div className="flex items-center gap-2 ml-auto" ref={actionRef}>
          {isAnyFilterApplied && (
            <button
              onClick={clearFilters}
              className="text-[12px] text-red-500 hover:underline font-[600] px-2 whitespace-nowrap"
            >
              Clear All Filters
            </button>
          )}

          <div className="relative">
            <button
              disabled={selectedInvoices.length === 0}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-9 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 border transition-all ${selectedInvoices.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
            >
              Actions
              <ChevronDown className={`w-4 h-4 transition-transform ${actionOpen ? "rotate-180" : ""}`} />
            </button>

            {actionOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-40 text-[12px] z-[100] animate-popup-in overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                  onClick={() => {
                    setActionOpen(false);
                    const url = `${REACT_APP_BACKEND_URL}/invoice/bulk-download?invoiceNumbers=${selectedInvoices.join(",")}`;
                    window.open(url, "_blank");
                  }}
                >
                  Bulk Download
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Section */}
      <div className="flex w-full flex-col md:hidden mb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <UserFilter
              onUserSelect={(id) => {
                setUserId(id);
                setSelectedUserId(id);
                setPage(1);
              }}
              clearTrigger={clearFilterFlag}
            />
          </div>
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[10px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm h-[32px] min-w-[100px]"
          >
            <Filter className="w-4 h-4 text-[#0CBB7D]" />
            More Filters
          </button>
        </div>

        {isAnyFilterApplied && (
          <div className="flex justify-end mt-1">
            <button
              onClick={clearFilters}
              className="text-[11px] font-[600] text-red-500 hover:text-red-600 px-1"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block relative">
        <div className="h-[calc(100vh-235px)] overflow-y-auto bg-white overflow-hidden">
          <table className="w-full text-left border-collapse text-[12px] relative">
            <thead className="sticky top-0 z-40 bg-[#0CBB7D] text-white font-[600]">
              <tr>
                <th className="py-2 px-3 w-10 shadow-[0_1px_0_0_#0CBB7D]">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={invoices.length > 0 && selectedInvoices.length === invoices.length}
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-[#0CBB7D] w-4"
                    />
                  </div>
                </th>
                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">User Details</th>
                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Invoice No</th>
                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Shipments</th>
                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Amount Details</th>
                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Created On</th>
                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Invoice Period</th>
                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Status</th>
                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img src={NotFound} alt="No Data" className="w-60 h-60 mb-2" />
                      {/* <p className="text-gray-400 font-medium">No invoices found</p> */}
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50 text-[12px] transition-colors border-b">
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(inv._id)}
                        onChange={() => handleCheckboxChange(inv._id)}
                        className="cursor-pointer accent-[#0CBB7D] w-4"
                      />
                    </td>
                    <td className="px-3 py-2">{renderUserDetails(inv)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 group">
                        <span className="font-medium text-[#0CBB7D]">{inv.invoiceNumber}</span>
                        <button onClick={() => handleCopy(inv.invoiceNumber, inv._id + '_inv')}>
                          {copiedId === inv._id + '_inv' ? (
                            <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                          ) : (
                            <FiCopy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">


                      <span className="text-gray-700 text-[12px] tracking-tighter">
                        {inv.totalShipments}
                      </span>

                    </td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-gray-700">₹{inv.amount}</span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-gray-700 whitespace-nowrap">{dayjs(inv.invoiceDate || inv.createdAt).format("DD MMM YYYY")}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-gray-700 whitespace-nowrap">{dayjs(inv.periodEnd).format("MMMM YYYY")}</p>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {inv.invoiceUrl && (
                        <a
                          href={inv.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center bg-[#0CBB7D] text-white w-8 h-8 rounded-lg hover:shadow-md hover:bg-opacity-90 transition-all shadow-sm"
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
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col">
        <div className="p-2 justify-between bg-white rounded-lg flex gap-2 items-center border border-gray-100 mb-2 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-100 flex-1">
            <input
              type="checkbox"
              checked={invoices.length > 0 && selectedInvoices.length === invoices.length}
              onChange={handleSelectAll}
              className="cursor-pointer accent-[#0CBB7D] w-4"
            />
            <span className="text-[10px] font-[600] text-gray-700 tracking-wider">Select All</span>
          </div>

          <div className="relative" ref={actionRef}>
            <button
              disabled={selectedInvoices.length === 0}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-[30px] px-3 rounded-lg flex items-center justify-center border transition-all ${selectedInvoices.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] bg-white shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
            >
              <FaBars className="w-3 h-3" />
            </button>
            {actionOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-40 text-[11px] z-[100] animate-popup-in overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                  onClick={() => {
                    setActionOpen(false);
                    const url = `${REACT_APP_BACKEND_URL}/invoice/bulk-download?invoiceNumbers=${selectedInvoices.join(",")}`;
                    window.open(url, "_blank");
                  }}
                >
                  Bulk Download
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-[calc(100vh-280px)] overflow-y-auto space-y-2">

          {loading ? (
            <div className="flex justify-center py-10">
              <ThreeDotLoader />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10">
              <img src={NotFound} alt="No Data" className="w-60 h-60 mx-auto" />
            </div>
          ) : (
            invoices.map((inv) => {
              const user = inv.userDetails || {
                fullname: inv.userFullname || inv.userName || inv.name,
                email: inv.userEmail || inv.email,
                phoneNumber: inv.userPhone || inv.phoneNumber,
                userId: inv.userId || inv.customerId || inv.user,
              };
              return (
                <div key={inv._id} className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 animate-popup-in">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(inv._id)}
                        onChange={() => handleCheckboxChange(inv._id)}
                        className="cursor-pointer accent-[#0CBB7D] w-4"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-[#0CBB7D] text-[10px]">{inv.invoiceNumber}</span>
                          <button onClick={() => handleCopy(inv.invoiceNumber, inv._id + '_inv_mob')}>
                            {copiedId === inv._id + '_inv_mob' ? <FiCheck className="w-2.5 h-2.5 text-green-500" /> : <FiCopy className="w-3 h-3 text-gray-400" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400 tracking-tighter">
                          Created At: {dayjs(inv.invoiceDate || inv.createdAt).format("DD MMM YYYY")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#0CBB7D] text-[11px]">₹{inv.amount}</div>
                      <span className={`px-2 py-0.5 rounded text-[10px] inline-block mt-0.5 ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2 px-1">
                    <div className="space-y-0.5">
                      <p className="text-gray-500 text-[10px] tracking-tight">Shipments</p>
                      <p className="text-gray-700 font-bold text-[10px]">{inv.totalShipments}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-gray-500 text-[10px] tracking-tight">Period</p>
                      <p className="text-gray-700 font-bold text-[10px]">{dayjs(inv.periodEnd).format("MMMM YYYY")}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-[#0CBB7D] text-[12px] shrink-0 border border-gray-300">
                        {user.fullname?.charAt(0)}
                      </div>
                      <div className="min-w-0 leading-tight flex justify-between items-center w-full">
                        <div>
                          <p className="font-bold text-gray-700 text-[10px] truncate">{user.fullname}</p>
                          <p className="text-gray-500 text-[10px] truncate">{user.email}</p>
                        </div>
                        <p className="text-[#0CBB7D] font-medium text-[10px] truncate">{user.userId}</p>
                      </div>
                    </div>

                    {inv.invoiceUrl && (
                      <a
                        href={inv.invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-[#0CBB7D] ml-2 text-white rounded-lg flex items-center justify-center shadow active:scale-95 transition-transform"
                      >
                        <HiOutlineDownload className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        limit={limit}
        setLimit={setLimit}
      />

      <InvoicesFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        selectedUserId={selectedUserId}
        invoiceNumber={invoiceNumber}
        month={month}
        year={year}
        MONTHS={MONTHS}
        years={years}
        onClearFilters={clearFilters}
        onApplyFilters={(filters) => {
          setSelectedUserId(filters.selectedUserId || null);
          setInvoiceNumber(filters.invoiceNumber || "");
          setMonth(filters.month || "");
          setYear(filters.year || "");
          setPage(1);
          setIsFilterPanelOpen(false);
        }}
      />
    </div>
  );
};

export default Invoices;
