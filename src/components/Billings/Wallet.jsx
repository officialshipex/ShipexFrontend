import axios from "axios";
import React, { useEffect, useState } from "react";
// import { toast } from "react-toastify";
import { FaRupeeSign, FaArrowDown, FaArrowUp, FaExchangeAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {Notification} from "../../Notification"

const Wallets = ({
  showFilters,
  setFiltersApplied,
  clearFiltersTrigger,
  setClearFiltersTrigger,
  setShowFilters,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({});
  const [allTransactions, setAllTransactions] = useState([]); // ← add this
const navigate=useNavigate()
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const filterableHeaders = [
    "Date",
    "Channel Order ID",
    "AWB Number",
    "Category",
    "Amount",
  ];
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    let filtered = transactions;

    if (filters["Channel Order ID"]) {
      filtered = filtered.filter((t) =>
        t.channelOrderId
          ?.toLowerCase()
          .includes(filters["Channel Order ID"].toLowerCase())
      );
    }

    if (filters["AWB Number"]) {
      const awbQuery = filters["AWB Number"].toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.awb_number &&
          /^[a-z0-9]+$/i.test(t.awb_number) && // Only alphanumeric AWBs
          t.awb_number.toLowerCase().includes(awbQuery)
      );
    }

    if (filters["Category"]) {
      filtered = filtered.filter((t) =>
        t.category?.toLowerCase().includes(filters["Category"].toLowerCase())
      );
    }

    if (filters["Amount"]) {
      filtered = filtered.filter((t) => t.amount == filters["Amount"]);
    }

    if (filters["Date"]) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date).toISOString().split("T")[0]; // format to yyyy-mm-dd
        return transactionDate === filters["Date"];
      });
    }

    setCurrentPage(1);
    setTransactions(filtered);
    setFiltersApplied(true);
    setShowFilters(false);
  };

  // Fetch Wallet Transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/order/passbook`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // calculateRTOCharges
        // Reverse the transactions order (latest first)

        const reversed = (response.data.transactions || []).reverse();
        setTransactions(reversed);
        setAllTransactions(reversed);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        Notification("Failed to fetch transactions. Please try again.","error");
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    if (clearFiltersTrigger) {
      setFilters({});
      setTransactions(allTransactions); // reset to original data
      setCurrentPage(1); // reset page
      setClearFiltersTrigger(false); // reset the trigger
      setFiltersApplied(false); // indicate filters are no longer active
      setShowFilters(false); // optionally collapse the filters section
    }
  }, [clearFiltersTrigger]);

  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  useEffect(() => {
    const fetchRTO = async () => {
      try {
        const token = Cookies.get("session");
        const response = await axios.post(
          `${REACT_APP_BACKEND_URL}/order/calculateRTOCharges`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(response.data);
      } catch (error) {
        console.error("Failed to fetch RTO charges:", error);
      }
    };
    fetchRTO();
  }, []);

  // Pagination Logic
  const totalPages = Math.ceil(transactions.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = transactions.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <div className="">
      {/* Filters section */}
      <div
  className={`overflow-hidden transition-all duration-500 ease-in-out mb-4 ${
    showFilters ? "max-h-[600px]" : "max-h-0"
  }`}
>
  <div className="bg-white p-4 rounded-lg shadow-md grid grid-cols-2 md:grid-cols-5 gap-4">
    {filterableHeaders.map((header, index) => {
      if (header === "Date") {
        return (
          <input
            key={index}
            type="date"
            value={filters[header] || ""}
            onChange={(e) => handleFilterChange(header, e.target.value)}
            className="w-full px-1 py-1 text-[12px] border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
          />
        );
      } else if (header === "Category") {
        return (
          <select
            key={index}
            value={filters[header] || ""}
            onChange={(e) => handleFilterChange(header, e.target.value)}
            className="w-full px-1 py-1.5 text-[12px] border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
          >
            <option value="">Category</option>
            <option value="Credit">Credit</option>
            <option value="Debit">Debit</option>
          </select>
        );
      } else {
        return (
          <input
            key={index}
            type="text"
            placeholder={header}
            value={filters[header] || ""}
            onChange={(e) => handleFilterChange(header, e.target.value)}
            className="w-full px-1 py-1.5 text-[12px] border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0CBB7D]"
          />
        );
      }
    })}
    <div className="md:col-span-full flex justify-end ">
      <button
        onClick={applyFilters}
        className="bg-[#0CBB7D] text-white px-3 py-1.5 rounded-md text-[12px]"
      >
        Apply
      </button>
    </div>
  </div>
</div>
    

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-6 mb-4 py-2 bg-[#0CBB7D] text-white font-semibold text-left rounded-[5px] shadow-md text-[12px] text-center">
          <div>Date</div>
          <div>Channel Order ID</div>
          <div>AWB Number</div>
          <div>Category</div>
          <div>Amount</div>
          <div>Available Balance</div>
          <div>Description</div>
        </div>

        {/* Table Rows */}
        <div className="space-y-3 text-[12px] text-center">
          {currentRows.length > 0 ? (
            currentRows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-7 gap-6 py-1 bg-white border-b border-gray-200 shadow-sm rounded-sm text-center"
              >
                <div className="flex items-center justify-center">
                  {new Date(row.date).toLocaleString()}
                </div>
                <div className="flex items-center justify-center">
                  {row.channelOrderId}
                </div>
                <div className="flex items-center cursor-pointer justify-center text-[#0CBB7D]" onClick={() => handleTrackingByAwb(row.awb_number)}>
                  {row.awb_number}
                </div>
                <div className="flex items-center justify-center">
                  {row.category}
                </div>
                <div
                  className={`flex items-center justify-center ${row.category.toLowerCase() === "debit"
                    ? "text-red-500"
                    : "text-green-500"
                    }`}
                >
                  {row.category.toLowerCase() === "debit"
                    ? `-₹${row.amount}`
                    : `+₹${row.amount}`}
                </div>
                <div className="flex items-center justify-center">
                  ₹{Number(row.balanceAfterTransaction).toFixed(2)}
                </div>
                <div className="flex items-center justify-center whitespace-pre-line">
                  {row.description.length > 25
                    ? row.description.match(/.{1,25}/g).join("\n")
                    : row.description}
                </div>
              </div>
            ))
          ) : (
            <div>No data available !</div>
          )}
        </div>


      </div>

      {/* Mobile Card View */}

      <div className="md:hidden space-y-4 ">
        {currentRows.map((row, index) => (
          <div
            key={index}
            className="bg-green-100 p-4 rounded-md shadow-lg  max-w-xl mx-auto"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1 text-[12px] text-gray-700 w-full">
                <div className="flex items-center gap-2">
                  {/* <FaCalendarAlt className="text-blue-600" /> */}
                  <span className="font-semibold text-xs text-gray-900">
                    Date:
                  </span>
                  <span className="text-xs">
                    {new Date(row.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* <FaHashtag className="text-purple-600" /> */}
                  <span className="font-semibold text-[12px] text-gray-900">
                    Order ID:
                  </span>
                  <span className="text-xs">{row.channelOrderId}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* <FaBarcode className="text-green-600" /> */}
                  <span className="font-semibold text-[12px] text-gray-900">
                    AWB:
                  </span>
                  <span className="text-xs">{row.awb_number}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* <FaWallet className="text-yellow-600" /> */}
                  <span className="font-semibold text-[12px] text-gray-900">
                    Balance:
                  </span>
                  <span className="text-[12px]">
                    ₹{Number(row.balanceAfterTransaction).toFixed(2)}
                  </span>
                </div>
              </div>

              <div
                className={`text-[12px] font-bold min-w-fit pt-1 flex items-center ${row.category.toLowerCase() === "debit"
                  ? "text-red-500"
                  : "text-green-500"
                  }`}
              >
                {row.category.toLowerCase() === "debit" ? (
                  <>

                    -<FaRupeeSign />
                    {row.amount}
                  </>
                ) : (
                  <>
                    +<FaRupeeSign />
                    {row.amount}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-[12px] text-gray-900">
                Description:
              </span>
              <span className="whitespace-pre-line text-[12px] text-gray-600 ">
                {row.description.length > 25
                  ? row.description.match(/.{1,25}/g).join("\n")
                  : row.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center md:justify-end items-center mt-6 space-x-4">
        <button
          className="text-[12px] text-gray-700 rounded-md px-2 py-1.5 bg-gray-300 hover:bg-gray-400 disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </button>
        <span className="text-gray-700 text-[12px]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="text-[12px] text-gray-700 rounded-lg px-4 py-1.5 bg-gray-300 hover:bg-gray-400 disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Wallets;
