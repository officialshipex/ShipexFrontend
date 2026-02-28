import React, { useEffect, useRef, useState } from "react";
import { FaClock, FaCheckCircle, FaUserCheck } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import { FiMoreHorizontal } from "react-icons/fi";
import { CheckCircle, Filter, Copy, Check } from "lucide-react";
import ThreeDotLoader from "../../Loader"
import UpdateRateCardPopup from "./UpdateRateCardPopup";
import { MdEdit } from "react-icons/md";
import UserFilterPanel from "../../Common/UserFilterPanel";
import UserFilter from "../../filter/UserFilter";
import PaginationFooter from "../../Common/PaginationFooter";

// Auto-positioning popup trigger — opens above or below based on available space
const SmartPopupTrigger = ({ label, children, isOpen, onToggle }) => {
  const triggerRef = useRef(null);
  const [openAbove, setOpenAbove] = useState(false);

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenAbove(spaceBelow < 260); // popup is ~250px tall
    }
    onToggle();
  };

  return (
    <div className="relative" onClick={(ev) => ev.stopPropagation()}>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className="text-[11px] font-bold text-gray-800 hover:text-[#0CBB7D] transition-colors flex items-center gap-1"
      >
        {label}
        <span className="text-[9px] text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 w-[210px] ${openAbove ? "bottom-full mb-1" : "top-full mt-1"
            }`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const UserList2 = ({ isSidebarAdmin }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKyc, setSelectedKyc] = useState("");
  const [wallet, setWallet] = useState("");
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeAccess, setEmployeeAccess] = useState({ canView: false, canAction: false });
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [verified, setVerified] = useState();
  const [pending, setPending] = useState();
  const [rateCard, setRateCard] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(20)
  const [userId, setUserId] = useState()
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const [searchUser, setSearchUser] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [showPopup, setShowPopup] = useState(false);
  const [selectedRateCardValue, setSelectedRateCardValue] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState()
  const [rateCardType, setRateCardType] = useState("B2C");

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [clearUserTrigger, setClearUserTrigger] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [openPopup, setOpenPopup] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearFilters = () => {
    setSelectedUserId(null);
    setSearchUser("");
    setWallet("");
    setRateCard("");
    setUserId("");
    setSelectedKyc("");
    setClearUserTrigger(prev => !prev);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (isSidebarAdmin) {
        setEmployeeAccess({ canView: true, canAction: true });
        setShowEmployeeAuthModal(false);
      } else {
        const token = Cookies.get("session");
        if (!token) { setShowEmployeeAuthModal(true); return; }
        const empRes = await axios.get(`${REACT_APP_BACKEND_URL}/staffRole/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const employee = empRes.data.employee;
        const canView = !!employee?.accessRights?.setupAndManage?.["Users"]?.view;
        const canAction = !!employee?.accessRights?.setupAndManage?.["Users"]?.action;
        setEmployeeAccess({ canView, canAction });
        if (!canView) { setShowEmployeeAuthModal(true); return; }
      }
      const token = Cookies.get("session");
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/user/getAllUsers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { kycStatus: selectedKyc, rateCard, balanceType: wallet, limit, page, userId, id: selectedUserId },
      });
      // console.log("result", response.data);
      setUser(response.data.userDetails);
      setVerified(response.data.verifiedKycCount);
      setPending(response.data.pendingKycCount);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUser([]);
      setShowEmployeeAuthModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isSidebarAdmin, showPopup, selectedKyc, rateCard, wallet, searchQuery, limit, page, userId, selectedUserId]);

  const isAnyFilterApplied = selectedUserId || userId || selectedKyc || rateCard || wallet;

  const userProfile = (id) => {
    navigate(`/dashboard/Setup&Manage/User/Profile/${id}`);
  };

  useEffect(() => {
    if (searchUser.trim().length < 2) {
      setUserSuggestions([]);
      setSelectedUserId(null);
      return;
    }
    const timer = setTimeout(() => {
      if (userSuggestions.length === 1 && userSuggestions[0].fullname + " (" + userSuggestions[0].email + ")" === searchUser) {
        setSelectedUserId(userSuggestions[0]._id);
      }
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [searchUser]);

  useEffect(() => {
    const fetchUsersSearch = async () => {
      if (searchUser.trim().length < 2) return setUserSuggestions([]);
      try {
        const res = await axios.get(`${REACT_APP_BACKEND_URL}/admin/searchUser?query=${searchUser}`);
        setUserSuggestions(res.data.users);
      } catch (err) {
        console.error("User search failed", err);
      }
    };
    const debounce = setTimeout(fetchUsersSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchUser]);

  return (
    (isSidebarAdmin || employeeAccess.canView) && (
      <div className="overflow-x-hidden sm:p-2 p-1 w-full h-[calc(100vh-76px)] flex flex-col">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 w-full mx-auto shrink-0">
          {[
            { icon: <FaUserCheck className="text-white w-4 h-4 md:w-5 md:h-5" />, label: "Total Users", value: verified + pending || 0 },
            { icon: <FaCheckCircle className="text-white w-4 h-4 md:w-5 md:h-5" />, label: "Verified KYC", value: verified || 0 },
            { icon: <FaClock className="text-white w-4 h-4 md:w-5 md:h-5" />, label: "Pending KYC", value: pending || 0 },
          ].map((item, index) => (
            <div key={index} className="p-2 rounded-lg bg-white border border-[#0CBB7D] flex items-center space-x-2">
              <div className="px-2 py-2 rounded-lg bg-[#0CBB7D] shrink-0">{item.icon}</div>
              <div className="truncate">
                <p className="text-gray-700 text-[10px] uppercase md:text-[12px] font-[600]">{item.label}</p>
                <p className="text-[10px] md:text-[12px] font-[600] text-gray-700">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="w-full mt-2 shrink-0">
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-2 mb-2">
            <div className="w-[250px]">
              <UserFilter onUserSelect={(id) => { setSelectedUserId(id); setPage(1); }} clearTrigger={clearUserTrigger} />
            </div>
            <button onClick={() => setIsFilterPanelOpen(true)} className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap h-9">
              <Filter className="w-4 h-4 text-[#0CBB7D]" />
              More Filters
            </button>
            {isAnyFilterApplied && (
              <button onClick={handleClearFilters} className="text-[12px] text-red-500 hover:underline font-[600] px-2 whitespace-nowrap">
                Clear All Filters
              </button>
            )}
          </div>

          {/* Mobile */}
          <div className="flex w-full md:hidden items-center gap-2 mb-2">
            <div className="flex-1">
              <UserFilter onUserSelect={(id) => { setSelectedUserId(id); setPage(1); }} clearTrigger={clearUserTrigger} />
            </div>
            <button onClick={() => setIsFilterPanelOpen(true)} className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[11px] font-[600] text-gray-500 hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap h-[36px]">
              <Filter className="w-4 h-4 text-[#0CBB7D]" />
              More Filters
            </button>
          </div>
          {isAnyFilterApplied && (
            <div className="flex md:hidden justify-end mb-2">
              <button onClick={handleClearFilters} className="text-[11px] font-[600] text-red-500 hover:text-red-600">
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area (Scrollable) */}
        <div className="flex-1 overflow-auto" onClick={() => openPopup && setOpenPopup(null)}>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <table className="min-w-full bg-white">
              <thead className="sticky top-0 z-20">
                <tr className="text-[12px]">
                  {["User ID", "User Details", "Business Details", "KYC", "Rate Card", "Balance", "Account Manager", "Registration Date", "Last Scheduled Date", "Action"].map((header, idx) => (
                    <th key={idx} className={`bg-[#0CBB7D] text-white font-bold px-3 py-2 border-b border-gray-300 sticky top-0 ${header.includes("Details") || header.includes("Date") || header.includes("User") ? "text-left" : "text-center"}`}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-20"><ThreeDotLoader /></td></tr>
                ) : user.length === 0 ? (
                  <tr><td colSpan={10} className="text-center font-bold py-20">No Users Found</td></tr>
                ) : (
                  user.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/80 transition-all duration-200 group">
                      <td className="border-b border-gray-300 px-3 py-2 font-semibold text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 tracking-tight">{e?.userId || "N/N"}</span>
                          <button onClick={() => handleCopy(e?.userId, `id-${e.id}`)} className="transition-colors opacity-0 group-hover:opacity-100">
                            {copiedId === `id-${e.id}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                          </button>
                        </div>
                      </td>
                      <td className="border-b border-gray-300 px-3 py-2 text-left">
                        <p className="font-bold text-gray-700 leading-tight mb-0.5">{e?.fullname || "N/A"}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] text-gray-500 font-medium">{e?.phoneNumber || "N/N"}</p>
                          <button onClick={() => handleCopy(e?.phoneNumber, `phone-${e.id}`)} className="transition-colors opacity-0 group-hover:opacity-100">
                            {copiedId === `phone-${e.id}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] text-gray-500 truncate max-w-[150px]">{e?.email || "N/N"}</p>
                          <button onClick={() => handleCopy(e?.email, `email-${e.id}`)} className="transition-colors opacity-0 group-hover:opacity-100">
                            {copiedId === `email-${e.id}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                          </button>
                        </div>
                      </td>
                      <td className="border-b border-gray-300 px-3 py-2 text-left">
                        <p className="font-bold text-gray-700">{e?.company || "N/N"}</p>
                        <p className="text-[12px] text-gray-500 truncate">
                          {e?.gstDetails?.gstNumber ? "GSTIN" : "Aadhaar"}: {e?.gstDetails?.gstNumber || e?.aadharDetails?.aadharNumber || "N/N"}
                        </p>
                      </td>
                      <td className="border-b border-gray-300 px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.kycStatus ? "bg-green-100 text-[#0CBB7D]" : "bg-red-100 text-red-600"}`}>
                          {e.kycStatus ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="border-b border-gray-300 px-3 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="px-2 py-0.5 bg-green-50 text-[10px] text-[#0CBB7D] rounded border border-green-100 font-bold">
                            {e.rateCard || "bronze"}
                          </span>
                          <MdEdit className="text-[#0CBB7D] cursor-pointer hover:scale-110 transition-transform" onClick={() => { setSelectedRateCardValue(e.rateCard); setSelectedItemId(e.id); setSelectedItemName(e.fullname); setShowPopup(true); }} />
                        </div>
                      </td>
                      <td className="border-b border-gray-300 px-3 py-2 text-center font-bold">
                        <span className={e.walletAmount < 0 ? "text-red-500" : "text-[#0CBB7D]"}>₹{e.walletAmount?.toFixed(2) || "0.00"}</span>
                      </td>
                      <td className="border-b border-gray-300 px-3 py-2 text-center font-medium">{e.kamName || "Not Assigned"}</td>
                      <td className="border-b border-gray-300 px-3 text-left py-2">
                        <div className="flex flex-col gap-0.5 text-[12px]">
                          <span className="font-medium text-gray-700">{e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}</span>
                          <span className="text-[10px] text-gray-500">Last Login:</span>
                          <span className="text-[12px] text-gray-500">{e?.lastLogin ? new Date(e?.lastLogin).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + " " + new Date(e?.lastLogin).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : "Never"}</span>
                        </div>
                      </td>
                      <td className="border-b border-gray-300 px-3 py-2 text-left">
                        <div className="flex flex-col text-[12px]">
                          <span className="font-bold text-gray-700">Orders: {e?.orderCount || "0"}</span>
                          <span className="text-gray-500">{e?.lastOrderDate ? new Date(e.lastOrderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "No Orders"}</span>
                        </div>
                      </td>
                      <td className="border-b border-gray-300 px-3 py-2 text-center">
                        <button onClick={() => userProfile(e?.id)} className={`px-3 py-1 rounded-full text-[10px] font-bold text-white transition-all active:scale-95 ${e?.isBlocked ? "bg-red-500 hover:bg-red-600" : "bg-[#0CBB7D] hover:bg-opacity-90 shadow-sm"}`}>
                          Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View Cards */}
          <div className="md:hidden space-y-2 pb-2">
            {loading ? (
              <div className="flex justify-center py-20"><ThreeDotLoader /></div>
            ) : user.length === 0 ? (
              <div className="text-center py-10 rounded-lg border">
                <p className="text-gray-500 font-bold">No Users Found</p>
              </div>
            ) : (
              user.map((e) => {
                const userKey = `user-${e.id}`;
                const bizKey = `biz-${e.id}`;
                const isUserOpen = openPopup === userKey;
                const isBizOpen = openPopup === bizKey;

                return (
                  <div key={e.id} className="bg-white border rounded-lg shadow-sm overflow-visible animate-popup-in">
                    {/* Header */}
                    <div className="bg-[#0CBB7D] px-3 py-1.5 flex justify-between items-center rounded-t-lg">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CheckCircle className="w-3 h-3 text-white shrink-0" />
                        <span className="text-white font-bold text-[10px]">User ID: {e.userId}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1 shrink-0 ${e.kycStatus ? "bg-green-700 text-white" : "bg-red-500 text-white"}`}>
                          {e.kycStatus ? "KYC ✓" : "KYC ✗"}
                        </span>
                      </div>
                      <button onClick={() => userProfile(e?.id)} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white shrink-0 ml-2 ${e?.isBlocked ? "text-red-500" : "text-[#0CBB7D]"}`}>
                        Profile
                      </button>
                    </div>

                    {/* Compact body — single row with popups */}
                    <div className="px-3 py-2 flex items-center gap-2 flex-wrap relative">

                      {/* User Name → SmartPopup */}
                      <SmartPopupTrigger
                        label={<span className="truncate max-w-[110px] inline-block">{e.fullname || "N/A"}</span>}
                        isOpen={isUserOpen}
                        onToggle={() => setOpenPopup(isUserOpen ? null : userKey)}
                      >
                        <p className="text-[9px] font-bold text-[#0CBB7D] tracking-widest mb-2 border-b pb-1">User Details</p>
                        <div className="space-y-1.5">
                          <div>
                            <p className="text-[10px] text-gray-400">Name</p>
                            <p className="text-[10px] font-bold text-gray-700">{e.fullname || "N/A"}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-gray-400">Phone</p>
                              <p className="text-[10px] font-medium text-gray-700">{e.phoneNumber || "N/N"}</p>
                            </div>
                            <button onClick={() => handleCopy(e.phoneNumber, `ph-${e.id}`)} className="p-1 text-gray-400">
                              {copiedId === `ph-${e.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1 pr-1">
                              <p className="text-[10px] text-gray-400">Email</p>
                              <p className="text-[10px] text-gray-700 truncate">{e.email || "N/N"}</p>
                            </div>
                            <button onClick={() => handleCopy(e.email, `em-${e.id}`)} className="p-1 text-gray-400 shrink-0">
                              {copiedId === `em-${e.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <div className="border-t border-gray-100 pt-1.5">
                            <p className="text-[10px] text-gray-400">Registered</p>
                            <p className="text-[10px] text-gray-700">{e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">Last Login</p>
                            <p className="text-[10px] text-gray-700">{e?.lastLogin ? new Date(e.lastLogin).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + " " + new Date(e.lastLogin).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "Never"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">Account Manager</p>
                            <p className="text-[10px] font-medium text-gray-700">{e.kamName || "Not Assigned"}</p>
                          </div>
                        </div>
                      </SmartPopupTrigger>

                      <span className="text-gray-300 text-[10px]">|</span>

                      {/* Business Name → SmartPopup */}
                      <SmartPopupTrigger
                        label={<span className="truncate max-w-[90px] inline-block text-[#2D054B]">{e.company || "N/A"}</span>}
                        isOpen={isBizOpen}
                        onToggle={() => setOpenPopup(isBizOpen ? null : bizKey)}
                      >
                        <p className="text-[9px] font-bold text-[#0CBB7D] uppercase tracking-widest mb-2 border-b pb-1">Business Details</p>
                        <div className="space-y-1.5">
                          <div>
                            <p className="text-[10px] text-gray-400">Company</p>
                            <p className="text-[10px] font-bold text-[#2D054B]">{e.company || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">{e?.gstDetails?.gstNumber ? "GSTIN" : "Aadhaar"}</p>
                            <p className="text-[10px] text-gray-700">{e?.gstDetails?.gstNumber || e?.aadharDetails?.aadharNumber || "N/N"}</p>
                          </div>
                          <div className="border-t border-gray-100 pt-1.5">
                            <p className="text-[10px] text-gray-400">Total Orders</p>
                            <p className="text-[10px] font-bold text-gray-700">{e?.orderCount || "0"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">Last Order Date</p>
                            <p className="text-[10px] text-gray-700">{e?.lastOrderDate ? new Date(e.lastOrderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "No Orders"}</p>
                          </div>
                        </div>
                      </SmartPopupTrigger>

                      {/* Inline compact badges — Rate Card + Wallet */}
                      <div className="ml-auto flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${e.rateCard ? "bg-green-50 text-[#0CBB7D] border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          {e.rateCard || "N/A"}
                        </span>
                        <MdEdit
                          className="w-3.5 h-3.5 text-[#0CBB7D] cursor-pointer shrink-0"
                          onClick={() => { setSelectedRateCardValue(e.rateCard); setSelectedItemId(e.id); setSelectedItemName(e.fullname); setShowPopup(true); }}
                        />
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${e.walletAmount < 0 ? "text-red-500 bg-red-50" : "text-[#0CBB7D] bg-green-50"}`}>
                          ₹{e.walletAmount?.toFixed(0) || "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 mt-auto">
          <PaginationFooter page={page} setPage={setPage} totalPages={totalPages} limit={limit} setLimit={setLimit} />
        </div>

        {showPopup && (
          <UpdateRateCardPopup id={selectedItemId} userName={selectedItemName} selectedRateCardValue={selectedRateCardValue} onClose={() => setShowPopup(false)} rateCardType={rateCardType} />
        )}

        <UserFilterPanel
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
          selectedUserId={selectedUserId}
          userId={userId}
          kycStatus={selectedKyc}
          rateCard={rateCard}
          wallet={wallet}
          onClearFilters={handleClearFilters}
          onApplyFilters={(filters) => {
            setSelectedUserId(filters.selectedUserId);
            setUserId(filters.userId);
            setSelectedKyc(filters.kycStatus);
            setRateCard(filters.rateCard);
            setWallet(filters.wallet);
            setPage(1);
            setIsFilterPanelOpen(false);
          }}
        />
      </div>
    )
  );
};

export default UserList2;
