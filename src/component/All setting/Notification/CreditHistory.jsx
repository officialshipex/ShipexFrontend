import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import NotFound from "../../../assets/nodatafound.png";
import PaginationFooter from "../../../Common/PaginationFooter";
import Loader from "../../../Loader";

import { Filter } from "lucide-react";
import PassbookFilterPanel from "../../../Common/PassbookFilterPanel";
import DateFilter from "../../../filter/DateFilter";
import { useOutletContext } from "react-router-dom";

const CreditHistory = () => {
    const { targetUserId, isAdmin } = useOutletContext();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(0);

    // Filter states
    const [dateRange, setDateRange] = useState(null);
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [awbNumber, setAwbNumber] = useState("");
    const [orderId, setOrderId] = useState("");
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [clearTrigger, setClearTrigger] = useState(false);

    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const token = Cookies.get("session");

    const fetchTransactions = async () => {
        if (isAdmin && !targetUserId) return;
        try {
            setLoading(true);
            const params = {
                page,
                limit,
                category,
                description,
                orderId,
                awbNumber,
            };

            if (targetUserId) {
                params.userId = targetUserId;
            }

            if (dateRange?.[0]) {
                params.fromDate = dayjs(dateRange[0].startDate).toISOString();
                params.toDate = dayjs(dateRange[0].endDate).toISOString();
            }

            const res = await axios.get(
                `${REACT_APP_BACKEND_URL}/notification/getUserPassbookTransactions`,
                { headers: { Authorization: `Bearer ${token}` }, params }
            );
            setTransactions(res.data.results || []);
            setTotalPages(Math.ceil((res.data.total || 0) / limit));
        } catch (error) {
            console.error("Error fetching credit history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, limit, dateRange, category, description, orderId, awbNumber, targetUserId]);

    const handleClearFilters = () => {
        setDateRange(null);
        setCategory("");
        setDescription("");
        setAwbNumber("");
        setOrderId("");
        setClearTrigger((prev) => !prev);
        setPage(1);
    };

    const isAnyFilterApplied = (dateRange && dateRange[0]?.endDate) || category || description || awbNumber || orderId;

    const notificationDescriptionOptions = [
        "WhatsApp", "Email", "SMS", "Credit Applied"
    ];

    if (isAdmin && !targetUserId) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-400 font-semibold text-[12px]">Search user to see the details</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-2">
            {/* Desktop Filter Section */}
            <div className="hidden md:flex gap-2 relative items-center">
                <div className="w-[200px]">
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
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap min-w-[120px] h-9"
                >
                    <Filter className="w-4 h-4 text-[#0CBB7D]" />
                    More Filters
                </button>

                <div className="flex items-center gap-2 ml-auto">
                    {isAnyFilterApplied && (
                        <button
                            onClick={handleClearFilters}
                            className="text-[12px] text-red-500 hover:underline font-[600] px-2 whitespace-nowrap"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Filter Section */}
            <div className="flex w-full flex-col md:hidden">
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

            <div className="bg-white overflow-hidden mb-2">
                <div className="h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
                    <table className="min-w-full border-collapse text-[12px] text-left relative">
                        <thead className="sticky top-0 z-40 bg-[#0CBB7D] text-white font-[600]">
                            <tr>
                                <th className="py-2 px-3 text-left">Date</th>
                                <th className="py-2 px-3 text-left">Transaction ID / Order ID</th>
                                <th className="py-2 px-3 text-left">Category</th>
                                <th className="py-2 px-3 text-left">Amount</th>
                                <th className="py-2 px-3 text-left">Available Credits</th>
                                <th className="py-2 px-3 text-left">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic-none">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10">
                                        <Loader />
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 bg-white">
                                        <div className="flex flex-col items-center justify-center">
                                            <img src={NotFound} alt="No Data Found" className="w-[200px] mb-4 opacity-70" />
                                            {/* <p className="text-gray-400 font-medium">No notification transactions found</p> */}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-gray-700">
                                        <td className="py-2 px-3">
                                            <p className="text-gray-700">{dayjs(t.date || t.createdAt).format("DD MMM YYYY")}</p>
                                            <p className="text-gray-500">{dayjs(t.date || t.createdAt).format("hh:mm A")}</p>
                                        </td>
                                        <td className="py-2 px-3 text-gray-700">
                                            {t.channelOrderId || t._id}
                                        </td>
                                        <td className="py-2 px-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                                                t.category === "credit" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                            }`}>
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className={`py-2 px-3 text-left ${
                                            t.category === "credit" ? "text-green-600" : "text-red-600"
                                        }`}>
                                            {t.category === "credit" ? "+" : "-"} ₹{Number(t.amount).toFixed(2)}
                                        </td>
                                        <td className="py-2 px-3 text-left text-gray-700">
                                            ₹{Number(t.balanceAfterTransaction).toFixed(2)}
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="max-w-[300px] truncate leading-relaxed" title={t.description}>
                                                {t.description}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PaginationFooter
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                limit={limit}
                setLimit={setLimit}
            />

            <PassbookFilterPanel
                isOpen={isFilterPanelOpen}
                onClose={() => setIsFilterPanelOpen(false)}
                selectedUserId={targetUserId}
                awbNumber={awbNumber}
                orderId={orderId}
                category={category}
                description={description}
                onClearFilters={handleClearFilters}
                showUserFilter={false}
                showAwbFilter={false}
                descriptionOptions={notificationDescriptionOptions}
                onApplyFilters={(filters) => {
                    setAwbNumber(filters.awbNumber);
                    setOrderId(filters.orderId);
                    setCategory(filters.category);
                    setDescription(filters.description);
                    setPage(1);
                    setIsFilterPanelOpen(false);
                }}
            />
        </div>
    );
};

export default CreditHistory;
