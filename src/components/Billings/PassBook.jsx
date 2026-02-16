import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { FaCalendarAlt, FaWallet, FaRupeeSign, FaFilter } from "react-icons/fa";
import { useNavigate, Link, useParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { FiMoreHorizontal, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import ThreeDotLoader from "../../Loader";
import Cookies from "js-cookie";
import { Notification } from "../../Notification"
import PaginationFooter from "../../Common/PaginationFooter";
import DateFilter from "../../filter/DateFilter";
import OrderAwbFilter from "../../filter/OrderAwbFilter";
import { getCarrierLogo } from "../../Common/getCarrierLogo";
import NotFound from "../../assets/nodatafound.png";

const Passbooks = () => {
  const [transactions, setTransactions] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const categoryRef = useRef()
  const navigate = useNavigate()
  const searchTypeRef = useRef(null);
  const descriptionRef = useRef();
  const [showDescriptionDropdown, setShowDescriptionDropdown] = useState(false)
  const [description, setDescription] = useState("")
  const { id } = useParams()
  const [searchBy, setSearchBy] = useState("awbNumber");
  const [inputValue, setInputValue] = useState("");
  const [showAwbDropdown, setShowAwbDropdown] = useState(false);
  const awbFilterRef = useRef(null);
  const awbFilterButtonRef = useRef(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target) && searchTypeRef.current && !searchTypeRef.current.contains(event.target) && descriptionRef.current && !descriptionRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
        setShowDescriptionDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = Cookies.get("session");
      setLoading(true)
      const params = {
        id,
        category,
        description,
        page,
        limit,
      };

      if (dateRange?.[0]) {
        params.fromDate = dateRange[0].startDate.toISOString();
        params.toDate = dateRange[0].endDate.toISOString();
      }

      if (inputValue?.trim()) {
        params[searchBy] = inputValue.trim();
      }

      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/order/passbook`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: params
        }
      );
      // console.log("trans", response.data)
      setTransactions(response.data.results || []);
      setTotalPages(response.data.page || 0);
      setLoading(false)
    } catch (error) {
      Notification("Error fetching transactions", "error");
    }
  };


  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  useEffect(() => {
    fetchTransactions();
  }, [dateRange, inputValue, searchBy, page, limit, category, description]);




  return (
    <div className="space-y-2 w-full">
      {/* Desktop Filter Section */}
      <div className="hidden sm:flex gap-2 w-full relative justify-between">
        <div className="flex sm:flex-row w-full flex-col gap-2">
          <OrderAwbFilter
            searchBy={searchBy}
            setSearchBy={setSearchBy}
            inputValue={inputValue}
            setInputValue={setInputValue}
            showDropdown={showAwbDropdown}
            setShowDropdown={setShowAwbDropdown}
            dropdownRef={awbFilterRef}
            buttonRef={awbFilterButtonRef}
            options={[
              { label: "AWB", value: "awbNumber" },
              { label: "Order ID", value: "orderId" },
            ]}
            getPlaceholder={() =>
              searchBy === "orderId"
                ? "Search by Order ID"
                : "Search by AWB Number"
            }
            width="w-full md:w-[350px]"
          />
          <div className="flex w-full flex-col sm:flex-row sm:justify-between gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Date Range Dropdown */}
              <DateFilter
                onDateChange={(range) => {
                  setDateRange(range);
                  setPage(1);
                }}
              />
              {/* Category Filter */}
              <div className="relative" ref={categoryRef}>
                <button
                  onClick={() => setShowCategoryDropdown((prev) => !prev)}
                  className={`sm:w-[100px] w-full py-2 px-3 border text-gray-400 rounded-lg text-left text-[12px] bg-white font-[600] flex justify-between items-center ${showCategoryDropdown ? "border-[#0CBB7D]" : ""}`}
                  type="button"
                >
                  <span>{category || "Category"}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${showCategoryDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showCategoryDropdown && (
                  <ul className="absolute sm:w-[100px] z-30 w-full mt-1 bg-white border rounded-lg text-gray-500 font-[600] overflow-y-auto text-[12px]">
                    {[
                      "credit", "debit"
                    ].map((s) => (
                      <li
                        key={s || "empty"}
                        className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${category === s ? "bg-gray-100 font-medium" : ""}`}
                        onClick={() => {
                          setCategory(s);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {s || "Category"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex w-full gap-2 justify-between">
              {/* Description Filter */}
              <div className="relative w-full" ref={descriptionRef}>
                <button
                  onClick={() => setShowDescriptionDropdown((prev) => !prev)}
                  className={`sm:w-[200px] w-full py-2 px-3 border text-gray-400 rounded-lg text-left text-[12px] bg-white font-[600] flex justify-between items-center ${showDescriptionDropdown ? "border-[#0CBB7D]" : ""}`}
                  type="button"
                >
                  <span>{description || "Description"}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${showDescriptionDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showDescriptionDropdown && (
                  <ul className="absolute sm:w-[200px] z-30 w-full mt-1 bg-white border rounded-lg text-gray-500 font-[600] overflow-y-auto text-[12px]">
                    {[
                      "Freight Charges Applied", "Freight Charges Received", "Auto-accepted Weight Dispute charge", "Weight Dispute Charges Applied", "COD Charges Received", "RTO Freight Charges Applied"
                    ].map((s) => (
                      <li
                        key={s || "empty"}
                        className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${description === s ? "bg-gray-100 font-medium" : ""}`}
                        onClick={() => {
                          setDescription(s);
                          setShowDescriptionDropdown(false);
                        }}
                      >
                        {s || "Description"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Clear Button */}
              <div>
                <button
                  onClick={() => {
                    setSearchBy("awbNumber");
                    setInputValue("");
                    setDateRange(null);
                    setCategory("");
                    setDescription("");
                    setPage(1);
                  }}
                  className="py-2 px-3 border rounded-lg bg-[#0CBB7D] text-[12px] font-[600] text-white hover:opacity-90 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Section */}
      <div className="flex w-full flex-col sm:hidden">
        {/* Top Row: Search + Filter Button */}
        <div className="flex items-center justify-between gap-2 relative">
          <OrderAwbFilter
            searchBy={searchBy}
            setSearchBy={setSearchBy}
            inputValue={inputValue}
            setInputValue={setInputValue}
            showDropdown={showAwbDropdown}
            setShowDropdown={setShowAwbDropdown}
            dropdownRef={awbFilterRef}
            buttonRef={awbFilterButtonRef}
            options={[
              { label: "AWB", value: "awbNumber" },
              { label: "Order ID", value: "orderId" },
            ]}
            getPlaceholder={() =>
              searchBy === "orderId"
                ? "Search by Order ID"
                : "Search by AWB Number"
            }
            heightClass="h-9"
          />

          {/* Filter Button */}
          <button
            className="px-3 flex items-center justify-center text-white bg-[#0CBB7D] h-[34px] rounded-lg transition text-[12px] font-[600]"
            onClick={() => setShowMobileFilters((prev) => !prev)}
          >
            <FaFilter className="text-white" size={14} />
          </button>
        </div>

        {/* Expandable Filters */}
        <div
          className={`transition-all duration-300 ease-in-out ${showMobileFilters ? "max-h-[1000px] overflow-visible" : "max-h-0 overflow-hidden"}`}
        >
          <div className="flex flex-col gap-2 mt-2 overflow-visible">
            {/* Date Filter */}
            <DateFilter
              onDateChange={(range) => {
                setDateRange(range);
                setPage(1);
              }}
            />

            {/* Category Filter */}
            <div className="relative" ref={categoryRef}>
              <button
                onClick={() => setShowCategoryDropdown((prev) => !prev)}
                className={`w-full py-2 px-3 border text-gray-400 rounded-lg text-left text-[12px] bg-white font-[600] flex justify-between items-center ${showCategoryDropdown ? "border-[#0CBB7D]" : ""}`}
                type="button"
              >
                <span>{category || "Category"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showCategoryDropdown && (
                <ul className="absolute z-40 w-full mt-1 bg-white border rounded-lg text-gray-500 font-[600] overflow-y-auto text-[12px] max-h-60">
                  {[
                    "credit", "debit"
                  ].map((s) => (
                    <li
                      key={s || "empty"}
                      className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${category === s ? "bg-gray-100 font-medium" : ""}`}
                      onClick={() => {
                        setCategory(s);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      {s || "Category"}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Description Filter */}
            <div className="relative" ref={descriptionRef}>
              <button
                onClick={() => setShowDescriptionDropdown((prev) => !prev)}
                className={`w-full py-2 px-3 border text-gray-400 rounded-lg text-left text-[12px] bg-white font-[600] flex justify-between items-center ${showDescriptionDropdown ? "border-[#0CBB7D]" : ""}`}
                type="button"
              >
                <span>{description || "Description"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showDescriptionDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showDescriptionDropdown && (
                <ul className="absolute z-40 w-full mt-1 bg-white border rounded-lg text-gray-500 font-[600] overflow-y-auto text-[12px] max-h-60">
                  {[
                    "Freight Charges Applied", "Freight Charges Received", "Auto-accepted Weight Dispute charge", "Weight Dispute Charges Applied", "COD Charges Received", "RTO Freight Charges Applied"
                  ].map((s) => (
                    <li
                      key={s || "empty"}
                      className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${description === s ? "bg-gray-100 font-medium" : ""}`}
                      onClick={() => {
                        setDescription(s);
                        setShowDescriptionDropdown(false);
                      }}
                    >
                      {s || "Description"}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Clear Button */}
            <button
              className="px-3 bg-[#0CBB7D] py-2 text-[12px] font-[600] rounded-lg text-white border hover:opacity-90 transition"
              onClick={() => {
                setSearchBy("awbNumber");
                setInputValue("");
                setDateRange(null);
                setCategory("");
                setDescription("");
                setPage(1);
                setShowMobileFilters(false);
              }}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="relative overflow-x-auto bg-white overflow-y-auto h-[calc(100vh-320px)]">
          <table className="min-w-full text-[12px] text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-[#0CBB7D]">
              <tr className="text-white font-[600]">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">AWB</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2 text-center">Available Balance</th>
                <th className="px-3 py-2">Description</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
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
                transactions.map((row, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-3 py-2 allign-middle" style={{ width: "220px", maxWidth: "250px" }}>
                      <p>{new Date(row.date).toLocaleTimeString()}</p>
                      <p>{new Date(row.date).toLocaleDateString()}</p>
                    </td>
                    <td className="px-3 py-2" style={{ width: "220px", maxWidth: "250px" }}>
                      <Link
                        to={`/dashboard/order/neworder/updateOrder/${Number(row.orderId)}`}
                        className="text-[#0CBB7D]"
                      >
                        {row.orderId}
                      </Link>
                    </td>
                    <td className="px-3 py-2" style={{ width: "270px", maxWidth: "250px" }}>
                      <p
                        className="text-[#0CBB7D] cursor-pointer"
                        onClick={() => handleTrackingByAwb(row.awb_number)}
                      >
                        {row.awb_number}
                      </p>
                    </td>
                    <td className="px-3 py-2 capitalize" style={{ width: "220px", maxWidth: "250px" }}>{row.category}</td>
                    <td
                      className={`px-3 py-2 ${row.category === "debit" ? "text-red-600" : "text-green-600"
                        }`}
                    >
                      ₹{Number(row.amount).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center" style={{ width: "220px", maxWidth: "250px" }}>
                      ₹{Number(row.balanceAfterTransaction).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <p className="">Description:</p>
                      <p>{row?.description}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden w-full">
        {/* Data List */}
        <div className="space-y-2 h-[calc(100vh-290px)] overflow-y-auto">
          {loading ? (
            <ThreeDotLoader />
          ) : transactions.length > 0 ? (
            transactions.map((row, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow border border-gray-200"
              >
                {/* Top content */}
                <div className="p-3 text-[12px] space-y-1">
                  {/* Date */}
                  <div className="grid grid-cols-[150px_10px_1fr] items-start text-gray-500">
                    <span className="font-[400]">Date</span>
                    <span className="text-center">:</span>
                    <span className="font-[400]">{new Date(row.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}</span>
                  </div>

                  {/* Category */}
                  <div className="grid grid-cols-[150px_10px_1fr] items-start text-gray-500">
                    <span className="">Amount</span>
                    <span className="text-center">:</span>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                      <span className="break-words">{row.type}</span>
                      <span
                        className={`${row.category === "debit" ? "text-red-500" : "text-green-600"
                          }`}
                      >
                        {row.category === "debit" ? "-" : "+"} ₹{Number(row.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>


                  {/* Available Balance */}
                  <div className="grid grid-cols-[150px_10px_1fr] items-start text-gray-500">
                    <span className="">Available Balance</span>
                    <span className="text-center">:</span>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                      {/* <span className="break-words">{row.type}</span> */}
                      <span className="">
                        ₹{Number(row.balanceAfterTransaction).toFixed(2)}
                      </span>
                    </div>
                  </div>


                  {/* Description */}
                  {row.description && (
                    <div className="grid grid-cols-[150px_10px_1fr] items-start text-gray-500">
                      <span className="">Description</span>
                      <span className="text-center">:</span>
                      <span>{row.description}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between bg-green-100 text-[10px] text-gray-500 px-3 py-2 rounded-b-md">
                  <div className="flex items-center gap-2">
                    <img
                      src={getCarrierLogo(row.courierServiceName || "")}
                      alt={row.courierServiceName}
                      className="w-5 h-5 rounded-full object-contain"
                    />

                    <span className="">
                      {row.courierServiceName || ""}
                    </span>
                  </div>
                  <div>
                    AWB: <span className="text-[#0CBB7D]" onClick={() => { handleTrackingByAwb(row.awb_number) }}>{row.awb_number || "N/A"}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <img
                src={NotFound}
                alt="No Data Found"
                className="w-60 h-60 object-contain mb-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        limit={limit}
        setLimit={setLimit}
      />
    </div >
  );
};

export default Passbooks;
