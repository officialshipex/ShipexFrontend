import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Filter, X } from "lucide-react";
import Cookies from "js-cookie";
import ThreeDotLoader from "../../Loader";
import WalletHistoryForm from "./WalletHistoryForm";
import { motion, AnimatePresence } from "framer-motion";
import { Notification } from "../../Notification";
import DateFilter from "../../filter/DateFilter";
import WalletHistoryFilterPanel from "../../Common/WalletHistoryFilterPanel";
import PaginationFooter from "../../Common/PaginationFooter";
import NotFound from "../../assets/nodatafound.png";
import { FiCopy, FiCheck } from "react-icons/fi";
import { FaBars } from "react-icons/fa";

const WalletHistorys = () => {
    const [transactions, setTransactions] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [dateRange, setDateRange] = useState(null);
    const [status, setStatus] = useState("");
    const [paymentId, setPaymentId] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [clearTrigger, setClearTrigger] = useState(0);
    const [copiedId, setCopiedId] = useState(null);
    const [actionOpen, setActionOpen] = useState(false);
    const actionRef = useRef(null);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
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
                `${REACT_APP_BACKEND_URL}/adminBilling/allTransactionHistory`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        userSearch: selectedUserId || "",
                        fromDate,
                        toDate,
                        status,
                        page,
                        limit,
                        paymentId: paymentId.trim(),
                        transactionId: transactionId.trim()
                    },
                }
            );
            setTransactions(response.data.results || []);
            setTotal(response.data.total || 0);
            setLoading(false);
        } catch (error) {
            Notification("Error fetching transactions", "error");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [selectedUserId, dateRange, status, page, limit, paymentId, transactionId]);

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
        setTransactionId("");
        setPaymentId("");
        setDateRange(null);
        setStatus("");
        setSelectedUserId(null);
        setClearTrigger(prev => prev + 1);
        setPage(1);
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSelectAll = () => {
        if (selectedTransactions.length === transactions.length && transactions.length > 0) {
            setSelectedTransactions([]);
        } else {
            setSelectedTransactions(transactions.map((t) => t._id));
        }
    };

    const handleCheckboxChange = (id) => {
        setSelectedTransactions((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleExport = () => {
        Notification(`Exporting ${selectedTransactions.length} selected transactions`, "success");
        setActionOpen(false);
    };

    const isAnyFilterApplied = selectedUserId || status || paymentId || transactionId;

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
                            disabled={selectedTransactions.length === 0}
                            onClick={() => setActionOpen(!actionOpen)}
                            className={`h-9 px-3 rounded-lg text-[12px] font-[600] flex items-center gap-1 border transition-all ${selectedTransactions.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] hover:bg-green-50" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                                }`}
                        >
                            Actions
                            <ChevronDown className={`w-4 h-4 transition-transform ${actionOpen ? "rotate-180" : ""}`} />
                        </button>

                        {actionOpen && (
                            <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-44 text-[12px] z-[100] animate-popup-in overflow-hidden">
                                <div
                                    className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600 border-b border-gray-50"
                                    onClick={handleExport}
                                >
                                    Export to Excel
                                </div>
                                <div
                                    className="px-4 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                                    onClick={() => {
                                        setShowForm(true);
                                        setActionOpen(false);
                                    }}
                                >
                                    Wallet Updation
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
                    <div className="flex justify-end pr-1 mt-1">
                        <button
                            onClick={handleClearFilters}
                            className="text-[11px] font-[600] text-red-500 hover:text-red-600 transition-colors tracking-tight"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block relative">
                <div className="h-[calc(100vh-235px)] overflow-y-auto bg-white overflow-hidden">
                    <table className="w-full text-[12px] text-left border-collapse relative">
                        <thead className="sticky top-0 z-40 bg-[#0CBB7D] text-white font-[600]">
                            <tr>
                                <th className="py-2 px-3 w-10 shadow-[0_1px_0_0_#0CBB7D]">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={transactions.length > 0 && selectedTransactions.length === transactions.length}
                                            onChange={handleSelectAll}
                                            className="cursor-pointer accent-[#0CBB7D] w-4"
                                        />
                                    </div>
                                </th>
                                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">User Details</th>
                                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Date</th>
                                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Transaction ID</th>
                                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Amount</th>
                                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Status</th>
                                <th className="px-3 py-2 shadow-[0_1px_0_0_#0CBB7D]">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-10 text-center">
                                        <ThreeDotLoader />
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-10 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <img src={NotFound} alt="No Data" className="w-60 h-60 mb-2" />
                                            {/* <p className="text-gray-400 font-medium">No transactions found</p> */}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((row) => (
                                    <tr key={row._id} className="hover:bg-gray-50 text-[12px] transition-colors border-b border-gray-200">
                                        <td className="py-2 px-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedTransactions.includes(row._id)}
                                                onChange={() => handleCheckboxChange(row._id)}
                                                className="cursor-pointer accent-[#0CBB7D] w-4"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex flex-col text-gray-700">
                                                <span className="text-[#0CBB7D] font-medium leading-tight">{row.user.userId}</span>
                                                <span className="text-gray-700 text-[12px] leading-tight font-medium">{row.user.name}</span>
                                                <span className="text-gray-700 truncate max-w-[150px]">{row.user.email}</span>
                                                <span className="text-gray-700">{row.user.phoneNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                            <p className="whitespace-nowrap">{dayjs(row.date).format("DD MMM YYYY")}</p>
                                            <p className="text-gray-500">{dayjs(row.date).format("hh:mm A")}</p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-1 group">
                                                <span className="text-[#0CBB7D] font-medium">{row.transactionId}</span>
                                                <button onClick={() => handleCopy(row.transactionId, row._id + '_txn')}>
                                                    {copiedId === row._id + '_txn' ? (
                                                        <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                                                    ) : (
                                                        <FiCopy className="w-3 h-3 text-gray-400 transition-opacity opacity-0 group-hover:opacity-100" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                            ₹{Number(row.amount).toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${row.status === "success" ? "bg-green-100 text-[#0CBB7D]" : "bg-red-100 text-red-600"}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                            <div className="">
                                                <div className="flex gap-2">
                                                    <p className="text-[12px] text-gray-500 font-[600] tracking-tighter">Payment ID :</p>
                                                    <div className="flex items-center gap-2 group">
                                                        <span className="text-[12px]">{row.paymentId || "N/A"}</span>
                                                        {row.paymentId && (
                                                            <button onClick={() => handleCopy(row.paymentId, row._id + '_pay')}>
                                                                {copiedId === row._id + '_pay' ? <FiCheck className="w-3 h-3 text-[#0CBB7D]" /> : <FiCopy className="w-3 h-3 text-gray-300 transition-opacity opacity-0 group-hover:opacity-100" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {row.orderId && (
                                                    <div className="flex gap-2">
                                                        <p className="text-[12px] text-gray-500 font-[600] tracking-tighter">Order ID :</p>
                                                        <span className="text-[12px] text-gray-700">{row.orderId}</span>
                                                    </div>
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

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col">
                <div className="p-2 gap-2 bg-white rounded-lg flex justify-between items-center border border-gray-100 mb-2 shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-100 flex-1">
                        <input
                            type="checkbox"
                            checked={transactions.length > 0 && selectedTransactions.length === transactions.length}
                            onChange={handleSelectAll}
                            className="cursor-pointer accent-[#0CBB7D] w-4"
                        />
                        <span className="text-[10px] font-[600] text-gray-700 tracking-wider">Select All</span>
                    </div>

                    <div className="relative" ref={actionRef}>
                        <button
                            disabled={selectedTransactions.length === 0}
                            onClick={() => setActionOpen(!actionOpen)}
                            className={`h-[30px] px-3 rounded-lg flex items-center justify-center border transition-all ${selectedTransactions.length > 0 ? "border-[#0CBB7D] text-[#0CBB7D] bg-white shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                                }`}
                        >
                            <FaBars className="w-3 h-3" />
                        </button>
                        {actionOpen && (
                            <div className="absolute right-0 mt-1 bg-white border-2 border-gray-100 rounded-lg shadow-xl w-40 text-[10px] z-[100] animate-popup-in overflow-hidden">
                                <div
                                    className="px-3 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600 border-b border-gray-50"
                                    onClick={handleExport}
                                >
                                    Export Excel
                                </div>
                                <div
                                    className="px-3 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-600"
                                    onClick={() => {
                                        setShowForm(true);
                                        setActionOpen(false);
                                    }}
                                >
                                    Wallet Updation
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
                    ) : transactions.length > 0 ? (
                        transactions.map((row) => (
                            <div key={row._id} className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 text-[10px] animate-popup-in">
                                <div className="flex justify-between mb-2 items-start relative">
                                    <div className="absolute top-2.5">
                                        <input
                                            type="checkbox"
                                            checked={selectedTransactions.includes(row._id)}
                                            onChange={() => handleCheckboxChange(row._id)}
                                            className="cursor-pointer accent-[#0CBB7D] w-4"
                                        />
                                    </div>
                                    <div className="pl-6 space-y-1">
                                        <div className="flex items-center gap-1 font-[600] text-gray-700">
                                            <span className="text-[#0CBB7D] truncate max-w-[120px] font-bold">{row.transactionId}</span>
                                            <button onClick={() => handleCopy(row.transactionId, row._id + '_txn_mobile')}>
                                                {copiedId === row._id + '_txn_mobile' ? <FiCheck className="w-3 h-3 text-[#0CBB7D]" /> : <FiCopy className="w-3 h-3 text-gray-400" />}
                                            </button>
                                        </div>
                                        <p className="text-gray-500 text-[10px] leading-none uppercase tracking-tighter">
                                            {dayjs(row.date).format("DD MMM YYYY, hh:mm A")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[#0CBB7D] text-[10px]">₹{Number(row.amount).toFixed(2)}</p>
                                        <span className={`px-2 py-0.5 rounded text-[10px] inline-block ${row.status === "success" ? "bg-green-100 text-[#0CBB7D]" : "bg-red-100 text-red-600"}`}>
                                            {row.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-2 px-1">
                                    <div className="space-y-0.5">
                                        <p className="text-gray-500 text-[10px] tracking-tight">Payment ID</p>
                                        <div className="flex items-center gap-1">
                                            <p className="text-gray-700 font-bold truncate max-w-[100px] text-[10px]">{row.paymentId || "N/A"}</p>
                                            {row.paymentId && (
                                                <button onClick={() => handleCopy(row.paymentId, row._id + '_pay_mobile')}>
                                                    {copiedId === row._id + '_pay_mobile' ? <FiCheck className="w-2.5 h-2.5 text-[#0CBB7D]" /> : <FiCopy className="w-2.5 h-2.5 text-gray-400" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {row.orderId && (
                                        <div className="text-right space-y-0.5">
                                            <p className="text-gray-500 text-[10px] tracking-tight">Order ID</p>
                                            <p className="text-gray-700 font-bold truncate text-[10px]">{row.orderId}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-[#0CBB7D] text-[10px] shrink-0 border border-gray-300">
                                            {row.user.name?.charAt(0)}
                                        </div>
                                        <div className="min-w-0 leading-tight">
                                            <p className="font-bold text-gray-700 text-[10px] truncate">{row.user.name}</p>
                                            <p className="text-gray-500 text-[10px] truncate">{row.user.email}</p>
                                            {/* <p className="text-gray-400 text-[9px] truncate">{row.user.userId}</p> */}
                                        </div>
                                    </div>
                                    <p className="text-[#0CBB7D] font-medium text-[10px] tracking-widest shrink-0">
                                        {row.user.userId}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <img src={NotFound} alt="No Data" className="w-40 h-40 mx-auto opacity-50 mb-2" />
                            <p className="text-gray-400 font-medium">No records found</p>
                        </div>
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

            <WalletHistoryFilterPanel
                isOpen={isFilterPanelOpen}
                onClose={() => setIsFilterPanelOpen(false)}
                selectedUserId={selectedUserId}
                transactionId={transactionId}
                paymentId={paymentId}
                status={status}
                onClearFilters={handleClearFilters}
                onApplyFilters={(filters) => {
                    setSelectedUserId(filters.selectedUserId);
                    setTransactionId(filters.transactionId);
                    setPaymentId(filters.paymentId);
                    setStatus(filters.status);
                    setPage(1);
                    setIsFilterPanelOpen(false);
                }}
            />

            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-0 relative overflow-hidden"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <div className="flex items-center justify-between p-4 border-b">
                                <h2 className="text-[16px] font-bold text-gray-700 tracking-tight">Wallet Updation</h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-[80vh]">
                                <WalletHistoryForm onClose={() => setShowForm(false)} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WalletHistorys;
