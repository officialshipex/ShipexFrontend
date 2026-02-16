import React, { useEffect, useState } from "react";
import { FaClock, FaCheckCircle, FaUserCheck } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import CustomDropdown from "./CustomDropdown"
import { FiMoreHorizontal, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { FaFilter, FaBars } from "react-icons/fa";
import { CheckCircle } from "lucide-react";
import ThreeDotLoader from "../../Loader"
import UpdateRateCardPopup from "./UpdateRateCardPopup";
import { MdEdit } from "react-icons/md";

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
  const [selectedItemId, setSelectedItemId] = useState(null); // Optional: track which row
  const [selectedItemName, setSelectedItemName] = useState()
  const [rateCardType, setRateCardType] = useState("B2C");



  const handleClearFilters = () => {
    setSelectedUserId("");
    setSearchUser("")
    setWallet("");
    setRateCard("");
    setUserId("");
    setSelectedKyc("")
  };
  const fetchUsers = async () => {
    try {
      setLoading(true);

      if (isSidebarAdmin) {
        setEmployeeAccess({ canView: true, canAction: true });
        setShowEmployeeAuthModal(false);
      } else {
        const token = Cookies.get("session");
        if (!token) {
          setShowEmployeeAuthModal(true);
          return;
        }
        const empRes = await axios.get(`${REACT_APP_BACKEND_URL}/staffRole/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const employee = empRes.data.employee;
        const canView = !!employee?.accessRights?.setupAndManage?.["Users"]?.view;
        const canAction = !!employee?.accessRights?.setupAndManage?.["Users"]?.action;
        setEmployeeAccess({ canView, canAction });

        if (!canView) {
          setShowEmployeeAuthModal(true);
          return;
        }
      }

      const token = Cookies.get("session");
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/user/getAllUsers`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            kycStatus: selectedKyc,
            rateCard: rateCard,
            balanceType: wallet,
            limit,
            page,
            userId,
            id: selectedUserId
          },
        }
      );
      console.log("result", response.data)
      setUser(response.data.userDetails);
      setVerified(response.data.verifiedKycCount);
      setPending(response.data.pendingKycCount);
      setTotalPages(response.data.totalPages)
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
  }, [isSidebarAdmin, , showPopup, selectedKyc, rateCard, wallet, searchQuery, limit, page, userId, selectedUserId]);

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
      // If userSuggestions has only one user and searchQuery matches, auto-select
      if (
        userSuggestions.length === 1 &&
        userSuggestions[0].fullname + " (" + userSuggestions[0].email + ")" ===
        searchUser
      ) {
        setSelectedUserId(userSuggestions[0]._id);
      }
      // Otherwise, do nothing (user must click suggestion)
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [searchUser]);

  useEffect(() => {
    console.log("suer", searchUser);
    const fetchUsers = async () => {
      if (searchUser.trim().length < 2) return setUserSuggestions([]);
      try {
        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/admin/searchUser?query=${searchUser}`
        );
        console.log("dataaaa", res.data.users);
        setUserSuggestions(res.data.users);
      } catch (err) {
        console.error("User search failed", err);
      }
    };

    const debounce = setTimeout(fetchUsers, 300); // debounce to limit API calls
    return () => clearTimeout(debounce);
  }, [searchUser]);



  // if (!isSidebarAdmin && showEmployeeAuthModal) {
  //   return (
  //     <EmployeeAuthModal
  //       employeeModalShow={showEmployeeAuthModal}
  //       employeeModalClose={() => {
  //         setShowEmployeeAuthModal(false);
  //         window.history.back();
  //       }}
  //     />
  //   );
  // }

  return (
    (isSidebarAdmin || employeeAccess.canView) && (
      <div className="overflow-x-hidden sm:p-2 p-1 w-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full mx-auto">
          {[
            { icon: <FaUserCheck className="text-white w-4 h-4 md:w-5 md:h-5" />, label: "Total Users", value: verified + pending || 0 },
            { icon: <FaCheckCircle className="text-white w-4 h-4 md:w-5 md:h-5" />, label: "Verified KYC", value: verified || 0 },
            { icon: <FaClock className="text-white w-4 h-4 md:w-5 md:h-5" />, label: "Pending KYC", value: pending || 0 },
          ].map((item, index) => (
            <div key={index} className="p-2 rounded-lg bg-white border-2 border-[#0CBB7D] flex items-center space-x-4">
              <div className="px-2 py-2 rounded-lg bg-[#0CBB7D] shrink-0">{item.icon}</div>
              <div className="truncate">
                <p className="text-gray-700 uppercase text-[12px] md:text-[14px] font-[600]">{item.label}</p>
                <p className="text-[10px] md:text-[14px] font-[600] text-gray-700">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="w-full mt-2">
          {/* Top Row */}
          <div className="md:hidden flex items-center mb-2 sm:mb-0 justify-between gap-2">
            <div className="w-full md:w-1/4 relative">
              <input
                type="text"
                placeholder="Search by Name, Email, or Contact"
                className="w-full h-9 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] placeholder:text-gray-400 focus:outline-none"
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchUser(value);
                  if (value.trim() === "") {
                    setSelectedUserId(null);
                  }
                }}
                value={searchUser}
              />
              {/* Suggestions block same as above if needed */}
              {userSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full bg-white shadow-lg rounded-md mt-1 z-20 max-h-60 overflow-y-auto">
                  {userSuggestions.map((user, index) => (
                    <div
                      key={user._id}
                      className={`flex cursor-pointer group transition-colors duration-300 ${index !== userSuggestions.length
                        ? "border-b border-gray-200 hover:bg-gray-100"
                        : ""
                        }`}
                      onClick={() => {
                        setSelectedUserId(user._id);
                        setSearchUser(`${user.fullname} (${user.email})`);
                        setUserSuggestions([]);
                      }}
                    >
                      <div className="w-1/4 flex items-center justify-center p-2">
                        <p className="text-[12px] text-gray-400 group-hover:text-[#0CBB7D] font-medium truncate text-center">
                          {user.userId}
                        </p>
                      </div>
                      <div className="w-3/4 flex flex-col justify-center py-[7px] pr-2 leading-tight">
                        <p className="text-[13px] text-gray-500 group-hover:text-[#0CBB7D] font-medium truncate">
                          {user.fullname}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                        <p className="text-[11px] text-gray-400 truncate">{user.phoneNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Toggle (only on small screens) */}
            <button
              className="flex items-center justify-center px-3 py-2 border text-white rounded-lg bg-[#0CBB7D] border-[#0CBB7D]"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter size={16} />
            </button>
          </div>

          {/* Other Filters */}
          <div
            className={`mt-2 mb-2 sm:mb-0 w-full justify-between items-center ${showFilters ? "flex" : "hidden"
              } md:flex`}
          >
            <div className="sm:flex justify-between w-full">
              <div className="flex flex-col md:flex-row gap-2"> {/* flex-col added here */}
                <div className="hidden md:block w-full md:w-1/4 relative">
                  <input
                    type="text"
                    placeholder="Search by Name, Email, or Contact"
                    className="w-full h-9 px-3 placeholder:text-[12px] text-[12px] font-[600] border-2 rounded-lg placeholder:font-[600] placeholder:text-gray-400 focus:outline-none"
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchUser(value);
                      if (value.trim() === "") {
                        setSelectedUserId(null);
                      }
                    }}
                    value={searchUser}
                  />
                  {/* Suggestions block same as above if needed */}
                  {userSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full bg-white shadow-lg rounded-md mt-1 z-20 max-h-60 overflow-y-auto">
                      {userSuggestions.map((user, index) => (
                        <div
                          key={user._id}
                          className={`flex cursor-pointer group transition-colors duration-300 ${index !== userSuggestions.length
                            ? "border-b border-gray-200 hover:bg-gray-100"
                            : ""
                            }`}
                          onClick={() => {
                            setSelectedUserId(user._id);
                            setSearchUser(`${user.fullname} (${user.email})`);
                            setUserSuggestions([]);
                          }}
                        >
                          <div className="w-1/4 flex items-center justify-center p-2">
                            <p className="text-[12px] text-gray-400 group-hover:text-[#0CBB7D] font-medium truncate text-center">
                              {user.userId}
                            </p>
                          </div>
                          <div className="w-3/4 flex flex-col justify-center py-[7px] pr-2 leading-tight">
                            <p className="text-[13px] text-gray-500 group-hover:text-[#0CBB7D] font-medium truncate">
                              {user.fullname}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                            <p className="text-[11px] text-gray-400 truncate">{user.phoneNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Search by User ID"
                  className="w-full md:w-[180px] h-9 px-3 placeholder:text-[12px] placeholder:text-gray-400 text-[12px] font-[600] border-2 rounded-lg focus:outline-none"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />

                <CustomDropdown
                  label="KYC Status"
                  options={["verified", "pending"]}
                  value={selectedKyc}
                  onChange={setSelectedKyc}
                  className="w-full md:w-auto" // Example: Add responsive width to dropdown
                />
                <CustomDropdown
                  label="Rate Card"
                  options={["bronze", "silver", "gold", "platinum"]}
                  value={rateCard}
                  onChange={setRateCard}
                  className="w-full md:w-auto" // Example: Add responsive width to dropdown
                />
                <CustomDropdown
                  label="Wallet"
                  options={["positive", "negative"]}
                  value={wallet}
                  onChange={setWallet}
                  className="w-full md:w-auto" // Example: Add responsive width to dropdown
                />
              </div>
              <button
                className="sm:px-3 w-full sm:w-auto bg-white h-9 text-[12px] font-[600] border-2 rounded-lg text-[#0CBB7D] border-[#0CBB7D] hover:bg-gray-100 transition mt-2 md:mt-0" // Added margin for mobile
                onClick={handleClearFilters}
                type="button"
              >
                Clear Filters
              </button>
            </div>

          </div>
        </div>



        {/* Table */}
        <div className="">
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full border-collapse border border-gray-300 mt-2">
              <thead className="bg-[#0CBB7D] text-white text-center sticky top-0 z-10">
                <tr className="text-[12px]">
                  <th className="border px-3 py-2">User ID</th>
                  <th className="border px-3 py-2 text-left">User Details</th>
                  <th className="border px-3 py-2 text-left">Business Details</th>
                  <th className="border px-3 py-2">KYC</th>
                  <th className="border px-3 py-2">Rate Card</th>
                  <th className="border px-3 py-2">Balance</th>
                  <th className="border px-3 py-2 min-w-[100px]">Account Manager</th>
                  <th className="border px-3 py-2 text-left min-w-[100px]">Registeration Date</th>
                  <th className="border px-3 py-2 text-left min-w-[100px]">Last Scheduled Date</th>
                  <th className="border px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="text-center text-[12px] font-[400] text-gray-500">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-10">
                      <ThreeDotLoader />
                    </td>
                  </tr>
                ) : (
                  user.map((e) => (
                    <tr key={e.id} className="border hover:bg-gray-50">
                      <td className="border px-3 py-2 text-gray-500 font-[600]">{e?.userId || "N/N"}</td>
                      <td className="border px-3 py-2 text-left">
                        <p className="font-[600] text-gray-500 uppercase">{e?.fullname || "N/A"}</p>
                        <p className="text-gray-500">Phone: {e?.phoneNumber || "N/A"}</p>
                        <p className="text-gray-500 truncate">Email: {e?.email || "N/A"}</p>
                      </td>
                      <td className="border px-3 py-2 text-left">
                        <p className="font-[600] text-gray-500 uppercase">{e?.company || "N/N"}</p>
                        <p className="text-gray-500">
                          {e?.gstDetails?.gstNumber ? "GSTIN" : "Aadhaar"}:{" "}
                          {e?.gstDetails?.gstNumber || e?.aadharDetails?.aadharNumber || "N/N"}
                        </p>
                      </td>
                      <td className="border px-3 py-2">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-[600] ${e.kycStatus ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                          {e.kycStatus ? "Verified" : "Not Verified"}
                        </span>
                      </td>
                      <td className="border px-3 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-[600] ${e.rateCard === "Assigned"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                              }`}
                          >
                            {e.rateCard}
                          </span>

                          <div className="p-1 bg-white rounded-full">
                            <MdEdit
                              className="text-[#0CBB7D] cursor-pointer text-[14px]"
                              title="Update Rate Card"
                              onClick={() => {
                                setSelectedRateCardValue(e.rateCard);
                                setSelectedItemId(e.id);
                                setSelectedItemName(e.fullname);
                                setShowPopup(true);
                              }}
                            />
                          </div>
                        </div>
                      </td>


                      <td
                        className={`border px-3 py-2 font-[600] ${e.walletAmount < 0 ? "text-red-500" : "text-gray-800"
                          }`}
                      >
                        ₹{e.walletAmount?.toFixed(2)}
                      </td>

                      <td className="border px-3 py-2">{e.AccountManager}</td>
                      <td className="px-3 text-left py-2 flex flex-col text-[12px] text-gray-700">
                        <div className="flex gap-2">
                          <div>{new Date(e.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}</div>
                          <div>{new Date(e.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}</div>
                        </div>
                        <p>Last Login :</p>
                        <div className="flex gap-2">
                          <div>{new Date(e?.lastLogin).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}</div>
                          <div>{new Date(e?.lastLogin).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}</div>
                        </div>
                      </td>


                      <td className="border px-3 py-2 text-left text-gray-700">
                        <p>
                          Dates:{" "}
                          {e?.lastOrderDate
                            ? new Date(e.lastOrderDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                            : "N/A"}
                        </p>
                        <p className="truncate">Orders: {e?.orderCount || "0"}</p>
                      </td>

                      <td className="border px-3 py-2">
                        <button
                          onClick={() => userProfile(e?.id)}
                          className={`${e?.isBlocked ? "bg-red-500 hover:bg-red-600" : "bg-[#0CBB7D] hover:bg-green-500"} text-white px-3 font-[600] py-1 rounded transition ${!isSidebarAdmin && !employeeAccess.canAction ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={!isSidebarAdmin && !employeeAccess.canAction}
                        >
                          Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full overflow-x-hidden col-span-2 sm:col-span-1">

          <div className="block md:hidden">

            {loading ? (
              <div>
                <ThreeDotLoader />
              </div>
            ) : (

              user.map((e) => (
                <div
                  key={e.id}
                  className="max-w-full mx-auto rounded-lg overflow-hidden text-[10px] mb-2"
                >

                  <div className="bg-[#0CBB7D] text-white flex justify-between items-center px-3 py-2 text-xs">
                    <div className="flex items-center gap-1 font-semibold truncate">
                      <CheckCircle className="w-3 h-3 text-white" />
                      User Id - {e.userId}
                    </div>
                    <button className={`bg-white ${e?.isBlocked?"text-red-500":"text-[#0CBB7D]"} font-semibold px-2 py-0.5 rounded transition text-[10px]`} onClick={() => userProfile(e?.id)} disabled={!isSidebarAdmin && !employeeAccess.canAction}>
                      Profile
                    </button>
                  </div>


                  <div className="bg-green-100 px-3 py-2 space-y-2 p-2 text-[10px]">
                    <div className="flex flex-row justify-between gap-4">

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#2D054B] text-[11px]">User</p>
                        <p className="font-semibold">{e.fullname || "N/N"}</p>
                        <p className="text-gray-600">{e.phoneNumber || "N/N"}</p>
                        <p className="text-gray-600">{e.email || "N/N"}</p>
                      </div>


                      <div className="flex-1 min-w-0 text-right">
                        <p className="font-bold text-[#2D054B] text-[11px]">Business</p>
                        <p className="font-bold">{e.company || "N/N"}</p>
                        <p className="text-gray-600 truncate">
                          GSTIN: {e?.gstDetails?.gstNumber || "N/N"}
                        </p>
                      </div>
                    </div>


                    <div className="bg-green-200 shadow-md rounded-md p-2 flex justify-between items-center gap-2">

                      <div className="flex flex-col items-start">
                        <p className="text-[#2D054B] font-semibold mb-0.5 text-[11px]">
                          Rate Card
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="bg-[#0CBB7D] text-white font-medium px-2 py-0.5 rounded-sm">
                            {e.rateCard || "bronze"}
                          </span>
                          <MdEdit
                            className="text-white bg-[#0CBB7D] rounded-full p-0.5 w-4 h-4 cursor-pointer"
                            title="Update Rate Card"
                            onClick={() => {
                              setSelectedRateCardValue(e.rateCard);
                              setSelectedItemId(e.id);
                              setSelectedItemName(e.fullname);
                              setShowPopup(true);
                            }}
                          />
                        </div>
                      </div>



                      <div className="flex flex-col items-center">
                        <p className="text-[#2D054B] font-semibold mb-0.5 text-[11px]">KYC</p>
                        <span
                          className={`px-2 py-0.5 font-medium rounded-sm ${e.kycStatus
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                            }`}
                        >
                          {e.kycStatus ? "Verified" : "Not Verified"}
                        </span>
                      </div>


                      <div className="flex flex-col items-end">
                        <p className="text-[#2D054B] font-semibold mb-0.5 text-[11px]">
                          Balance
                        </p>
                        <span className="bg-[#0CBB7D] text-white px-2 py-0.5 font-medium rounded-sm">
                          ₹ {e.walletAmount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>


                    <div className="flex justify-between text-gray-800 mt-1">

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#2D054B] text-[11px]">KAM</p>
                        <p className="text-gray-600 truncate font-semibold">
                          {e.kamName || "N/A"}
                        </p>
                        <p className="text-gray-600 truncate">{e.kamPhone || "N/A"}</p>
                        <p className="text-gray-600 truncate">{e.kamEmail || "N/A"}</p>
                      </div>


                      <div className="flex-1 min-w-0 text-right">
                        <p className="font-bold text-[#2D054B] text-[11px]">
                          Last Scheduled
                        </p>
                        <p className="text-gray-600 truncate">
                          Orders: {e?.orderCount || "0"}
                        </p>
                        <p className="text-gray-600 truncate">
                          Dates:{" "}
                          {e?.lastOrderDate
                            ? new Date(e.lastOrderDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                            : "N/A"}
                        </p>

                      </div>
                    </div>
                  </div>
                </div>
              ))

            )}
          </div>
        </div>


        <div className="flex justify-between items-center mt-2 gap-4 flex-wrap text-[10px] font-[600]">
          <div className="flex items-center gap-2">
            <label
              htmlFor="limit"
              className="text-gray-700 text-[10px] font-[600]"
            >
              Show:
            </label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => {
                const selected = e.target.value;
                if (selected === "All") {
                  setLimit(null); // null means no limit
                  setPage(1);
                } else {
                  setLimit(parseInt(selected));
                  setPage(1); // reset to first page when changing limit
                }
              }}
              className="px-3 py-2 border rounded-md text-[10px] font-[600]"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
              <option value="All">All</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="py-2 px-3 bg-gray-300 rounded disabled:opacity-50"
            >
              <FiArrowLeft />
            </button>
            <span className="text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="py-2 px-3 bg-gray-300 rounded disabled:opacity-50"
            >
              <FiArrowRight />
            </button>
          </div>
        </div>

        {showPopup && (
          <UpdateRateCardPopup
            id={selectedItemId}
            userName={selectedItemName}
            selectedRateCardValue={selectedRateCardValue}
            onClose={() => setShowPopup(false)}
            rateCardType={rateCardType}
          />
        )}




      </div>
    )
  );
};

export default UserList2;
