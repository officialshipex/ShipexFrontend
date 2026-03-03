import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Filter, Info, X } from "lucide-react";
import dayjs from "dayjs";
import Cookies from "js-cookie";
import ThreeDotLoader from "../../Loader";
import { Notification } from "../../Notification";
import { FiCopy, FiCheck, FiEye, FiExternalLink } from "react-icons/fi";
import { FaBars } from "react-icons/fa";
import PaginationFooter from "../../Common/PaginationFooter";
import ShippingFilterPanel from "../../Common/ShippingFilterPanel";
import NotFound from "../../assets/nodatafound.png";
import DateFilter from "../../filter/DateFilter";
import { ExportExcel } from "../../Common/orderActions";
import { getCarrierLogo } from "../../Common/getCarrierLogo";
import { motion, AnimatePresence } from "framer-motion";

const Shippings = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [status, setStatus] = useState("");
  const [awb_number, setAwbNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [provider, setProvider] = useState("");
  const [selectedCourier, setSelectedCourier] = useState([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [courierOptions, setCourierOptions] = useState([]);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const actionRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [weightPopupId, setWeightPopupId] = useState(null);
  const [pricePopupPos, setPricePopupPos] = useState(null);
  const pricePopupTimerRef = useRef(null);
  const [mobilePricePopupId, setMobilePricePopupId] = useState(null);

  const navigate = useNavigate();
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchTransactions = async () => {
    try {
      const token = Cookies.get("session");
      let fromDate = "";
      let toDate = "";

      if (dateRange && dateRange[0]) {
        fromDate = dayjs(dateRange[0].startDate).startOf("day").toISOString();
        toDate = dayjs(dateRange[0].endDate).endOf("day").toISOString();
      }

      setLoading(true);
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/adminBilling/allShipping`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            userSearch: selectedUserId || "",
            fromDate,
            toDate,
            status,
            page,
            limit,
            orderId,
            awb_number,
            provider,
            courierServiceName: selectedCourier.length > 0 ? selectedCourier.join(",") : undefined
          },
        }
      );
      setTransactions(response.data.results || []);
      setTotal(response.data.total || 0);
      if (response.data.courierServices) {
        setCourierOptions(response.data.courierServices);
      }
      setLoading(false);
    } catch (error) {
      Notification("Error fetching transactions", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedUserId, dateRange, status, orderId, awb_number, provider, selectedCourier, page, limit]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionRef.current && !actionRef.current.contains(event.target)) {
        setActionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearFilters = () => {
    setSelectedUserId(null);
    setDateRange(null);
    setStatus("");
    setAwbNumber("");
    setOrderId("");
    setProvider("");
    setSelectedCourier([]);
    setClearTrigger(prev => prev + 1);
    setPage(1);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === transactions.length && transactions.length > 0) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(transactions.map((order) => order._id));
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportExcel = () => {
    ExportExcel({ selectedOrders, orders: transactions });
    setActionOpen(false);
  };

  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  const isAnyFilterApplied = selectedUserId || status || awb_number || orderId || provider || selectedCourier.length > 0;

  return (
    <div className="space-y-2">
      {/* Desktop Filter Section */}
      <div className="hidden md:flex gap-2 relative sm:items-center">
        <DateFilter
          onDateChange={(range) => {
            setDateRange(range);
            setPage(1);
          }}
          clearTrigger={clearTrigger}
          noInitialFilter={true}
        />

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
              disabled={selectedOrders.length === 0}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-9 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 border transition-all ${selectedOrders.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
            >
              Actions
              <ChevronDown className={`w-4 h-4 transition-transform ${actionOpen ? "rotate-180" : ""}`} />
            </button>

            {actionOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-40 text-[12px] z-[100] animate-popup-in overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                  onClick={handleExportExcel}
                >
                  Export
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
            <DateFilter
              onDateChange={(range) => {
                setDateRange(range);
                setPage(1);
              }}
              clearTrigger={clearTrigger}
              noInitialFilter={true}
            />
          </div>
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[10px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap h-[32px] min-w-[100px]"
          >
            <Filter className="w-3 h-3 text-[#0CBB7D]" />
            More Filters
          </button>
        </div>

        {isAnyFilterApplied && (
          <div className="flex justify-end mt-1 px-1">
            <button
              onClick={handleClearFilters}
              className="text-[11px] font-[600] text-red-500 hover:text-red-600 px-1"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table - REVERTED TO OLD DESIGN */}
      <div className="hidden md:block">
        <div className="h-[calc(100vh-235px)] text-[12px] overflow-y-auto bg-white">
          <table className="w-full border-collapse">
            <thead className="bg-[#0CBB7D] text-white font-[600] sticky top-0 z-10">
              <tr className="bg-[#0CBB7D] text-white font-[600] text-left">
                <th className="py-2 px-3 w-10">
                  <div className="flex justify-center items-center">
                    <input
                      type="checkbox"
                      checked={transactions.length > 0 && selectedOrders.length === transactions.length}
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-[#0CBB7D]"
                    />
                  </div>
                </th>
                <th className="py-2 px-3 text-left">User Details</th>
                <th className="py-2 px-3 text-left">Order Details</th>
                <th className="py-2 px-3 text-left">AWB Number</th>
                <th className="py-2 px-3 text-left">Courier</th>
                <th className="py-2 px-3 text-left">Shipment Status</th>
                <th className="py-2 px-3 text-left">AWB Assigned Wt.</th>
                <th className="py-2 px-3 text-left">
                  <div className="flex items-center gap-1">
                    <span>Total Freight</span>
                    <div className="relative group">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white opacity-75 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" /></svg>
                      <div className="absolute left-1/2 -translate-x-1/2 top-5 z-[200] hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">Total Freight Charges</div>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-3 text-left">
                  <div className="flex items-center gap-1">
                    <span>Ent. Wt &amp; Dim</span>
                    <div className="relative group">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white opacity-75 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" /></svg>
                      <div className="absolute left-1/2 -translate-x-1/2 top-5 z-[200] hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">Entered Weight &amp; Dimension</div>
                    </div>
                  </div>
                </th>
                <th className="py-2 px-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img src={NotFound} alt="No Data Found" className="w-60 h-60 mb-2" />
                      {/* <p className="text-gray-400 font-medium">No shippings found</p> */}
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((row, index) => (
                  <tr key={index} className="border-b border-gray-300 font-[400] text-[12px] hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="flex justify-center items-center">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(row._id)}
                          onChange={() => handleCheckboxChange(row._id)}
                          className="cursor-pointer accent-[#0CBB7D]"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <p className="text-[#0CBB7D] font-medium">{row.user?.userId}</p>
                      <p className="text-gray-700">{row.user?.name}</p>
                      <p className="text-gray-500 max-w-[150px] truncate sm:max-w-[170px]">{row.user?.email}</p>
                      <p className="text-gray-500">{row.user?.phoneNumber}</p>
                    </td>
                    <td className="py-2 px-3 font-medium">
                      <div className="flex items-center gap-1 group">
                        <Link to={`/dashboard/order/neworder/updateOrder/${row._id}`} className="text-[#0CBB7D] font-medium">
                          {row.orderId}
                        </Link>
                        <button onClick={() => handleCopy(row.orderId, row._id + '_id')}>
                          {copiedId === row._id + '_id' ? <FiCheck className="text-green-500" /> : <FiCopy className="text-gray-400 opacity-0 group-hover:opacity-100" />}
                        </button>
                      </div>
                      <p>{dayjs(row.shipmentCreatedAt || row.createdAt).format("DD MMM YYYY")}</p>
                      <p>{dayjs(row.shipmentCreatedAt || row.createdAt).format("hh:mm A")}</p>
                    </td>
                    <td className="py-2 px-3 font-medium">
                      <div className="flex items-center gap-1 group">
                        <p className="text-[#0CBB7D] cursor-pointer" onClick={() => handleTrackingByAwb(row.awb_number)}>
                          {row.awb_number || "AWB Pending"}
                        </p>
                        {row.awb_number && (
                          <button onClick={() => handleCopy(row.awb_number, row._id + '_awb')}>
                            {copiedId === row._id + '_awb' ? <FiCheck className="text-green-500" /> : <FiCopy className="text-gray-400 opacity-0 group-hover:opacity-100" />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="relative group inline-block max-w-[140px]">
                        <p className="truncate max-w-[140px] cursor-default font-medium text-gray-700">
                          {row.courierServiceName || "N/A"}
                        </p>
                        {row.courierServiceName && row.courierServiceName.length > 20 && (
                          <div className="absolute z-[200] hidden group-hover:block bg-white text-gray-700 text-[10px] p-2 rounded shadow-2xl border whitespace-nowrap top-full left-0 mt-1">
                            {row.courierServiceName}
                          </div>
                        )}
                      </div>
                      {/* <p className="text-gray-500">{row.provider || "N/A"}</p> */}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[#0CBB7D] bg-green-100 rounded px-2 py-0.5 text-[10px]">{row.status}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-700">
                      {row.orderType === "B2C" ? Number(row?.packageDetails?.deadWeight || 0).toFixed(3) : Number(row?.B2BPackageDetails?.applicableWeight || 0).toFixed(3)} Kg
                    </td>
                    <td className="py-2 px-3 font-medium">
                      <div className="flex items-center gap-1">
                        <span className="text-[#0CBB7D]">₹{row.totalFreightCharges || 0}</span>
                        {row.totalFreightCharges && (
                          <div
                            className="relative cursor-help"
                            onMouseEnter={(e) => {
                              if (pricePopupTimerRef.current) clearTimeout(pricePopupTimerRef.current);
                              const rect = e.currentTarget.getBoundingClientRect();
                              // Improved: if in upper 40% of screen, open bottom. Else open top.
                              const dir = rect.top < window.innerHeight * 0.4 ? "bottom" : "top";
                              setPricePopupPos({
                                x: rect.left + rect.width / 2,
                                y: dir === "top" ? rect.top - 10 : rect.bottom + 10,
                                dir,
                                order: row
                              });
                            }}
                            onMouseLeave={() => {
                              pricePopupTimerRef.current = setTimeout(() => {
                                setPricePopupPos(null);
                              }, 150);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#0CBB7D]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" /></svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {row.orderType === "B2C" ? (
                        <>
                          <p className="font-medium text-gray-700">{row.packageDetails?.applicableWeight} Kg</p>
                          <p className="text-gray-500">
                            {row.packageDetails?.volumetricWeight?.length}x{row.packageDetails?.volumetricWeight?.width}x{row.packageDetails?.volumetricWeight?.height} cm
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-gray-700">{row.B2BPackageDetails?.applicableWeight} Kg</p>
                          <p className="text-gray-500 italic">B2B Shipment</p>
                        </>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[#0CBB7D]">
                      <button
                        onClick={() => navigate("/finance/billing/passbook", { state: { awbNumber: row.awb_number } })}
                        className="bg-[#0CBB7D] text-white px-3 py-1 rounded-md hover:bg-opacity-90 transition-all font-[600] text-[12px]"
                      >
                        History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col space-y-2">
        {/* Select All Bar (Same as Passbooks.jsx) */}
        <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-100 flex-1">
            <input
              type="checkbox"
              checked={transactions.length > 0 && selectedOrders.length === transactions.length}
              onChange={handleSelectAll}
              className="cursor-pointer accent-[#0CBB7D] w-4"
            />
            <span className="text-[10px] font-[600] text-gray-700 tracking-wider">Select All</span>
          </div>

          <div className="relative" ref={actionRef}>
            <button
              disabled={selectedOrders.length === 0}
              onClick={() => setActionOpen(!actionOpen)}
              className={`h-[30px] px-3 rounded-lg flex items-center justify-center border transition-all ${selectedOrders.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] bg-white shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
            >
              <FaBars className="w-3 h-3" />
            </button>
            {actionOpen && (
              <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-36 text-[11px] z-[100] animate-popup-in overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                  onClick={handleExportExcel}
                >
                  Export
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
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center">
              <img src={NotFound} alt="No Data Found" className="w-60 h-60" />
              {/* <p className="text-gray-400 font-medium">No records found</p> */}
            </div>
          ) : (
            transactions.map((row) => (
              <div key={row._id} className="bg-white rounded-lg shadow-sm px-3 py-2 border border-gray-200 animate-popup-in relative">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(row._id)}
                      onChange={() => handleCheckboxChange(row._id)}
                      className="cursor-pointer accent-[#0CBB7D]"
                    />
                    <div className="flex flex-col">
                      <span className="text-gray-700 font-[600] text-[10px]">Order ID : <span className="text-[#0CBB7D] font-[600]">{row.orderId}</span></span>
                      <span className="text-gray-500 text-[10px]">{dayjs(row.shipmentCreatedAt || row.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-[#0CBB7D]">
                      {row.status}
                    </span>
                    <button
                      onClick={() => navigate("/finance/billing/passbook", { state: { awbNumber: row.awb_number } })}
                      className="text-[#0CBB7D] hover:text-[#099e68] transition-all"
                      title="View in Passbook"
                    >
                      <FiExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                  <div>
                    <p className="text-gray-700 mb-0.5">AWB Number</p>
                    <div className="flex items-center gap-1 group">
                      <p className="text-[#0CBB7D] font-bold active:underline" onClick={() => handleTrackingByAwb(row.awb_number)}>
                        {row.awb_number || "N/A"}
                      </p>
                      {row.awb_number && (
                        <button onClick={() => handleCopy(row.awb_number, row._id + '_awb_mob')}>
                          {copiedId === row._id + '_awb_mob' ? <FiCheck className="text-green-500" /> : <FiCopy className="text-gray-300" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-700 mb-0.5 text-right">Freight Charges</p>
                    <div className="flex items-center justify-end gap-1">
                      <p className="text-[#0CBB7D] font-bold">₹{row.totalFreightCharges || 0}</p>
                      {row.totalFreightCharges && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobilePricePopupId(mobilePricePopupId === row._id ? null : row._id);
                          }}
                          className="text-[#0CBB7D] cursor-pointer flex-shrink-0 p-1.5 -m-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-700 mb-0.5">Courier Service Name</p>
                    <p className="text-gray-700 font-bold">{row.courierServiceName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-700 text-right">Weight</p>
                    <p
                      className="text-gray-700 font-bold text-right border-b border-dashed border-gray-400 inline-block float-right cursor-pointer"
                      onClick={() => setWeightPopupId(weightPopupId === row._id ? null : row._id)}
                    >
                      {row.orderType === "B2C" ? row.packageDetails?.applicableWeight : row.B2BPackageDetails?.applicableWeight} Kg
                    </p>
                  </div>
                </div>

                {/* Weight Popup for Mobile */}
                <AnimatePresence>
                  {weightPopupId === row._id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-black/40" onClick={() => setWeightPopupId(null)}></div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-lg shadow-xl p-4 w-full max-w-xs relative z-10"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-gray-700 uppercase text-[12px]">Weight Details</h3>
                          <X className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => setWeightPopupId(null)} />
                        </div>
                        <div className="space-y-2 text-[12px]">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Dead Weight</span>
                            <span className="font-bold">{row.orderType === "B2C" ? row.packageDetails?.deadWeight : row.B2BPackageDetails?.deadWeight || row.B2BPackageDetails?.applicableWeight} Kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Applicable Weight</span>
                            <span className="font-bold text-[#0CBB7D]">{row.orderType === "B2C" ? row.packageDetails?.applicableWeight : row.B2BPackageDetails?.applicableWeight} Kg</span>
                          </div>
                          {row.orderType === "B2C" && (
                            <>
                              <div className="border-t pt-2 mt-2">
                                <span className="text-gray-500 block mb-1">Dimensions (L x W x H)</span>
                                <span className="font-bold">{row.packageDetails?.volumetricWeight?.length}x{row.packageDetails?.volumetricWeight?.width}x{row.packageDetails?.volumetricWeight?.height} cm</span>
                              </div>

                            </>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Price Breakup Popup for Mobile */}
                <AnimatePresence>
                  {mobilePricePopupId === row._id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-black/40" onClick={() => setMobilePricePopupId(null)}></div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-lg shadow-xl p-4 w-full max-w-xs relative z-10"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-gray-700 uppercase text-[12px]">Price Breakup</h3>
                          <X className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => setMobilePricePopupId(null)} />
                        </div>
                        <div className="space-y-2 text-[12px]">
                          {row.orderType === "B2C" ? (
                            <>
                              <div className="flex justify-between"><span className="text-gray-500">Freight</span><span className="font-bold">₹ {row.priceBreakup?.freight ?? 0}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">COD</span><span className="font-bold">₹ {row.priceBreakup?.cod ?? 0}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">GST</span><span className="font-bold">₹ {row.priceBreakup?.gst ?? 0}</span></div>
                              <div className="flex justify-between border-t pt-2 mt-1"><span className="font-bold text-gray-800">Total</span><span className="font-bold text-[#0CBB7D]">₹ {row.priceBreakup?.total ?? row.totalFreightCharges ?? 0}</span></div>
                            </>
                          ) : (
                            <>
                              {row.rateBreakup && Object.keys(row.rateBreakup).length > 0
                                ? Object.entries(row.rateBreakup).map(([key, val]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-gray-500 capitalize">{key}</span>
                                    <span className="font-bold">{typeof val === "number" ? `₹ ${val}` : val}</span>
                                  </div>
                                ))
                                : <p className="text-gray-400 italic text-center py-2">No breakup available</p>
                              }
                              <div className="flex justify-between border-t pt-2 mt-1"><span className="font-bold text-gray-800">Total</span><span className="font-bold text-[#0CBB7D]">₹ {row.totalFreightCharges ?? 0}</span></div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* User Info */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-[#0CBB7D] font-bold text-[12px]">
                    {row.user?.name?.charAt(0)}
                  </div>
                  <div className="flex justify-between items-center w-full min-w-0">
                    <div>
                      <p className="font-bold text-gray-700 text-[10px] truncate">{row.user?.name}</p>
                      <p className="text-gray-500 text-[10px] truncate">{row.user?.email}</p>
                    </div>
                    <p className="text-[#0CBB7D] font-[600] text-[10px] truncate">{row.user?.userId}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={Math.ceil(total / limit)}
        limit={limit}
        setLimit={setLimit}
      />

      <ShippingFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        selectedUserId={selectedUserId}
        searchInput={awb_number || orderId}
        searchType={awb_number ? "awbNumber" : "orderId"}
        status={status}
        selectedCourier={selectedCourier}
        courierOptions={courierOptions}
        onClearFilters={handleClearFilters}
        onApplyFilters={(filters) => {
          setSelectedUserId(filters.selectedUserId);
          if (filters.searchType === "awbNumber") {
            setAwbNumber(filters.searchInput);
            setOrderId("");
          } else {
            setOrderId(filters.searchInput);
            setAwbNumber("");
          }
          setStatus(filters.status);
          setSelectedCourier(filters.selectedCourier);
          setPage(1);
          setIsFilterPanelOpen(false);
        }}
      />
      {/* Fixed Price Breakup Popup - renders at root level, never clipped */}
      {pricePopupPos && (
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            left: pricePopupPos.x,
            ...(pricePopupPos.dir === "top"
              ? { bottom: window.innerHeight - pricePopupPos.y }
              : { top: pricePopupPos.y }),
            transform: "translateX(-50%)",
            pointerEvents: "auto",
          }}
          className="bg-white border shadow-2xl rounded-lg p-3 w-60 text-[10px] text-gray-700 whitespace-normal max-h-[300px] overflow-y-auto custom-scrollbar"
          onMouseEnter={() => {
            if (pricePopupTimerRef.current) clearTimeout(pricePopupTimerRef.current);
          }}
          onMouseLeave={() => {
            pricePopupTimerRef.current = setTimeout(() => {
              setPricePopupPos(null);
            }, 150);
          }}
        >
          <div className="sticky top-0 bg-white pb-1 mb-2 border-b z-10 flex justify-between items-center">
            <p className="font-[700] text-gray-800">Price Breakup</p>
          </div>
          {pricePopupPos.order.orderType === "B2C" ? (
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Freight</span><span className="font-[600]">₹ {pricePopupPos.order.priceBreakup?.freight ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">COD</span><span className="font-[600]">₹ {pricePopupPos.order.priceBreakup?.cod ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">GST</span><span className="font-[600]">₹ {pricePopupPos.order.priceBreakup?.gst ?? 0}</span></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span className="font-[700] text-gray-800">Total</span><span className="font-[700] text-[#0CBB7D]">₹ {pricePopupPos.order.priceBreakup?.total ?? pricePopupPos.order.totalFreightCharges ?? 0}</span></div>
            </div>
          ) : (
            <div className="space-y-1">
              {pricePopupPos.order.rateBreakup && Object.keys(pricePopupPos.order.rateBreakup).length > 0
                ? Object.entries(pricePopupPos.order.rateBreakup).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500 capitalize">{key}</span>
                    <span className="font-[600]">{typeof val === "number" ? `₹ ${val}` : val}</span>
                  </div>
                ))
                : <p className="text-gray-400 italic">No breakup available</p>
              }
              <div className="flex justify-between border-t pt-1 mt-1"><span className="font-[700] text-gray-800">Total</span><span className="font-[700] text-[#0CBB7D]">₹ {pricePopupPos.order.totalFreightCharges ?? 0}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Shippings;
