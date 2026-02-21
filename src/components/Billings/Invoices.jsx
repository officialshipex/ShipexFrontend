import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { ChevronDown, Filter } from "lucide-react";
import ThreeDotLoader from "../../Loader";
import { HiOutlineDownload } from "react-icons/hi";
import { FaBars } from "react-icons/fa";
import NotFound from "../../assets/nodatafound.png";
import PaginationFooter from "../../Common/PaginationFooter";
import InvoicesFilterPanel from "../../Common/InvoicesFilterPanel";
import dayjs from "dayjs";
import { FiCopy, FiCheck } from "react-icons/fi";
import { Notification } from "../../Notification";

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

const Invoices = ({
  setFiltersApplied,
  clearFiltersTrigger,
  setClearFiltersTrigger,
}) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clearFilterFlag, setClearFilterFlag] = useState(0);

  // Filters
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
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
    if (clearFiltersTrigger) {
      handleClearFilters();
      if (setFiltersApplied) setFiltersApplied(false);
      if (setClearFiltersTrigger) setClearFiltersTrigger(false);
    }
  }, [clearFiltersTrigger]);

  useEffect(() => {
    fetchData();
    if (invoiceNumber || month || year) {
      if (setFiltersApplied) setFiltersApplied(true);
    } else {
      if (setFiltersApplied) setFiltersApplied(false);
    }
  }, [invoiceNumber, month, year, page, limit]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
      };
      if (invoiceNumber) params.invoiceNumber = invoiceNumber;
      if (month) params.month = month;
      if (year) params.year = year;

      const { data } = await axios.get(
        `${REACT_APP_BACKEND_URL}/invoice/userGetInvoices`,
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
    Notification("Copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearFilters = () => {
    setInvoiceNumber("");
    setMonth("");
    setYear("");
    setPage(1);
    setClearFilterFlag((prev) => prev + 1);
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

  const isAnyFilterApplied = invoiceNumber || month || year;

  return (
    <div className="space-y-2">
      {/* Desktop Filter Section */}
      <div className="hidden md:flex gap-2 relative sm:items-center">
        <div className="w-[200px]">
          <input
            type="text"
            placeholder="Search Invoice Number"
            value={invoiceNumber}
            onChange={(e) => {
              setInvoiceNumber(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 px-3 text-[12px] font-[600] border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] text-gray-700 placeholder:text-gray-400 shadow-sm"
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
              onClick={handleClearFilters}
              className="text-[12px] text-red-500 hover:underline font-[600] px-2 whitespace-nowrap"
            >
              Clear All Filters
            </button>
          )}

          <div className="relative">
            <button
              disabled={selectedInvoices.length === 0}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-9 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 border transition-all ${selectedInvoices.length > 0
                ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50 shadow-sm"
                : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
            >
              Actions
              <ChevronDown
                className={`w-4 h-4 transition-transform ${actionOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {actionOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-40 text-[12px] z-[100] animate-popup-in overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                  onClick={() => {
                    setActionOpen(false);
                    if (!selectedInvoices.length) return;
                    const url = `${REACT_APP_BACKEND_URL}/invoice/bulk-download?invoiceNumbers=${selectedInvoices.join(
                      ","
                    )}`;
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
            <input
              type="text"
              placeholder="Search Invoice Number"
              value={invoiceNumber}
              onChange={(e) => {
                setInvoiceNumber(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 text-[12px] font-[600] border border-gray-300 rounded-lg focus:outline-none focus:border-[#0CBB7D] text-gray-700 placeholder:text-gray-400 shadow-sm"
            />
          </div>
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-[600] text-gray-500 hover:bg-gray-50 shadow-sm h-9"
          >
            <Filter className="w-4 h-4 text-[#0CBB7D]" />
            More Filters
          </button>
        </div>
      </div>

      {isAnyFilterApplied && (
        <div className="flex justify-end mt-1 px-1">
          <button
            onClick={handleClearFilters}
            className="text-[11px] font-[600] text-red-500 hover:text-red-600 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block relative">
        <div className="h-[calc(100vh-300px)] overflow-y-auto bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-[12px] relative">
            <thead className="sticky top-0 z-40 bg-[#0CBB7D] text-white font-[600]">
              <tr>
                <th className="py-2 px-3 w-10">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={
                        invoices.length > 0 &&
                        selectedInvoices.length === invoices.length
                      }
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                    />
                  </div>
                </th>
                <th className="px-3 py-2">Invoice No</th>
                <th className="px-3 py-2">Shipments</th>
                <th className="px-3 py-2">Amount Details</th>
                <th className="px-3 py-2">Created On</th>
                <th className="px-3 py-2">Invoice Period</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src={NotFound}
                        alt="No Data"
                        className="mx-auto w-60 h-60"
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="hover:bg-gray-50 text-[12px] transition-colors border-b border-gray-200 text-gray-700"
                  >
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(inv._id)}
                        onChange={() => handleCheckboxChange(inv._id)}
                        className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 group">
                        <span className="font-[600] text-[#0CBB7D]">
                          {inv.invoiceNumber}
                        </span>
                        <button
                          onClick={() => handleCopy(inv.invoiceNumber, inv._id)}
                        >
                          {copiedId === inv._id ? (
                            <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                          ) : (
                            <FiCopy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {inv.totalShipments}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      ₹{Number(inv.amount).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-gray-700 whitespace-nowrap">
                        {dayjs(inv.invoiceDate || inv.createdAt).format(
                          "DD MMM YYYY"
                        )}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-gray-700 whitespace-nowrap">
                        {dayjs(inv.periodEnd).format("MMMM YYYY")}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(
                          inv.status
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center">
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
                      </div>
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
        <div className="p-2 gap-2 bg-white rounded-lg flex justify-between items-center border border-gray-100 mb-2 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 flex-1">
            <input
              type="checkbox"
              checked={
                invoices.length > 0 && selectedInvoices.length === invoices.length
              }
              onChange={handleSelectAll}
              className="cursor-pointer accent-[#0CBB7D] w-3 h-3 ml-1"
            />
            <span className="text-[10px] font-[600] text-gray-700">
              Select All
            </span>
          </div>

          <div className="relative" ref={actionRef}>
            <button
              disabled={selectedInvoices.length === 0}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-[30px] px-3 rounded-lg flex items-center justify-center border transition-all ${selectedInvoices.length > 0
                ? "border-[#0CBB7D] text-[#0CBB7D] bg-white shadow-sm"
                : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
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
                    if (!selectedInvoices.length) return;
                    const url = `${REACT_APP_BACKEND_URL}/invoice/bulk-download?invoiceNumbers=${selectedInvoices.join(
                      ","
                    )}`;
                    window.open(url, "_blank");
                  }}
                >
                  Bulk Download
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-[calc(100vh-250px)] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <ThreeDotLoader />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
              <img
                src={NotFound}
                alt="No Data Found"
                className="w-[180px] opacity-60"
              />
              {/* <p className="text-gray-400 font-[600] mt-2">No records found</p> */}
            </div>
          ) : (
            invoices.map((inv) => (
              <div
                key={inv._id}
                className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 text-[10px] animate-popup-in"
              >
                <div className="flex justify-between mb-3 items-start">
                  <div className="flex items-start gap-2">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(inv._id)}
                        onChange={() => handleCheckboxChange(inv._id)}
                        className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[#0CBB7D] font-[600] text-[10px]">
                          {inv.invoiceNumber}
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(inv.invoiceNumber, inv._id + "_mob")
                          }
                        >
                          {copiedId === inv._id + "_mob" ? (
                            <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                          ) : (
                            <FiCopy className="w-3 h-3 text-gray-300" />
                          )}
                        </button>
                      </div>
                      <p className="text-gray-500 text-[10px]">
                        Created At:{" "}
                        {dayjs(inv.invoiceDate || inv.createdAt).format(
                          "DD MMM YYYY"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-[600] text-gray-700 text-[10px]">
                      ₹{Number(inv.amount).toFixed(2)}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] inline-block ${getStatusColor(
                        inv.status
                      )}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 bg-green-50/50 p-2 rounded-lg border border-gray-100">
                  <div className="space-y-0.5">
                    <p className="text-gray-700 text-[10px] tracking-wider">
                      Shipments
                    </p>
                    <p className="text-gray-700 font-[600] text-[10px]">
                      {inv.totalShipments}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-gray-700 text-[10px] tracking-wider">
                      Period
                    </p>
                    <p className="text-gray-700 font-[600] text-[10px]">
                      {dayjs(inv.periodEnd).format("MMMM YYYY")}
                    </p>
                  </div>
                </div>

                {inv.invoiceUrl && (
                  <div className="flex justify-end">
                    <a
                      href={inv.invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-green-50 text-[#0CBB7D] border border-green-100 rounded-lg flex items-center gap-2 font-[600] text-[10px] hover:bg-green-100 transition-colors"
                    >
                      <HiOutlineDownload className="w-4 h-4" />
                      Download Invoice
                    </a>
                  </div>
                )}
              </div>
            ))
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
        selectedUserId={null}
        invoiceNumber={invoiceNumber}
        month={month}
        year={year}
        MONTHS={MONTHS}
        years={years}
        onClearFilters={handleClearFilters}
        showUserFilter={false}
        onApplyFilters={(filters) => {
          setMonth(filters.month || "");
          setYear(filters.year || "");
          setPage(1);
          setIsFilterPanelOpen(false);
        }}
      />
    </div >
  );
};

export default Invoices;
