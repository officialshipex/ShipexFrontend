import React, { useState, useEffect, useRef } from "react";
import { deleteSession, getUserInfoFromToken } from "../../utils/session";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import logo from "../../assets/LOGO.svg";
import Sidebar from "../../components/Sidebar";
import ShipexLogo from "../../assets/Shipex.jpg"; // adjust path as needed
import grouplogo from "../../assets/Group.png"; // adjust path as needed
import BulkUploadPopup from "../../Order/BulkUploadPopup"
import SelectOrderTypePopup from "../../Order/SelectOrderTypePopup"
import { FaPlus, FaWallet, FaSyncAlt, FaCaretDown, FaEllipsisV } from "react-icons/fa";
import { FiUser, FiCreditCard, FiShield, FiLogOut } from "react-icons/fi";


import {
  FiPlusSquare,
  FiUploadCloud,
  FiEdit,
  FiZap,
  FiSearch
} from "react-icons/fi";
import { MdOutlineCalculate } from "react-icons/md";
import { FaTicketAlt } from "react-icons/fa";
import AddCase from "../Support/AddCase";
import { Notification } from "../../Notification"
import MasterSearchFilter from "../../Common/MasterSearchFilter";



const Navbar = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState();
  const [balance, setBalance] = useState();
  const [holdAmount, setHoldAmount] = useState();
  const [isAdminTab, setIsAdminTab] = useState(false);
  const [awbNumber, setAwbNumber] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [showActions, setShowActions] = useState(false);
  const quickDropdownRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [upload, setUpload] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeAccess, setEmployeeAccess] = useState({
    canCreate: false,
    canFeedbackView: false,
    canManageTickets: false,
  });
  const [showQuickPopup, setShowQuickPopup] = useState(false);

  const [rotation, setRotation] = useState(0);
  const [isBalanceDropdownOpen, setIsBalanceDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const [showSelectOrderType, setShowSelectOrderType] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState("");

  // const dropdownRef = useRef(null);


  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (quickDropdownRef.current && !quickDropdownRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // autofocus input when opened
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
    }
  }, [isMobileSearchOpen]);

  useEffect(() => {
    const handler = (event) => {
      const target = event.target;

      // get path (works for Shadow DOM / Safari too)
      const path = event.composedPath ? event.composedPath() : (event.path || []);

      // helper: check if an element is inside ref OR path
      const isInside = (ref) => {
        if (!ref?.current) return false;
        if (ref.current.contains && ref.current.contains(target)) return true;
        if (path && path.length) return path.includes(ref.current);
        return false;
      };

      // 1) ignore clicks on profile icon or its children
      if (target.closest && target.closest(".profile-icon")) return;

      // 2) ignore the mobile search toggle button (so clicking it won't immediately close the panel)
      if (target.closest && target.closest(".mobile-search-toggle")) return;

      // 3) Quick actions dropdown
      if (!isInside(dropdownRef)) {
        setIsDropdownOpen(false);
      }

      // 4) Mobile menu
      if (!isInside(mobileMenuRef)) {
        setIsMobileMenuOpen(false);
      }

      // 5) Mobile search panel
      if (!isInside(mobileSearchRef)) {
        setIsMobileSearchOpen(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
        setIsMobileSearchOpen(false);
      }
    };

    // Add listeners only once (you can also gate by "any popup open" if you prefer)
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleTrack = () => {
    if (awbNumber.trim() !== "") {
      navigate(`/dashboard/order/tracking/${awbNumber.trim()}`);
    }
  };

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const userInfo = getUserInfoFromToken();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("session");
        if (!token) return;

        if (userInfo?.type === "user") {
          const response = await axios.get(
            `${REACT_APP_BACKEND_URL}/user/getUserDetails`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.user) {
            // console.log("response data", response.data)
            setImagePreview(response.data.user.profileImage)
            setUserData(response.data.user);
            setBalance(response.data.user.Wallet?.balance || 0);
            setHoldAmount(response.data.user.Wallet?.holdAmount || 0);
            setIsAdminTab(response.data.user.adminTab);
            setRefresh(false)
          }
        } else if (userInfo?.type === "employee") {
          const response = await axios.get(
            `${REACT_APP_BACKEND_URL}/staffRole/verify`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.employee) {
            setUserData(response.data.employee);
            setBalance(response.data.employee.Wallet?.balance || 0);
            setIsAdminTab(response.data.employee.adminTab);
            setRefresh(false)
          }
        }
      } catch (err) {
        // Don't redirect here, let App.js handle session expiration
      }
    };

    fetchData();
  }, [refresh]);

  const handleClickOutside = (event) => {
    // 👇 ignore clicks on profile icon FIRST
    if (event.target.closest(".profile-icon")) return;

    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target)
    ) {
      setIsDropdownOpen(false);
    }

    if (
      mobileMenuRef.current &&
      !mobileMenuRef.current.contains(event.target)
    ) {
      setIsMobileMenuOpen(false);
    }
  };



  useEffect(() => {
    const handleScroll = () => {
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
    };


    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const handleLogout = () => {
    deleteSession();

    // navigate("/login");
    window.location.href = "/login";
  };

  const handleRechargeWallet = () => {
    navigate("/dashboard/rechargeWallet");
  };

  const handleToggleAdmin = async (value) => {
    try {
      const token = Cookies.get("session");
      if (!token) return;

      await axios.post(
        `${REACT_APP_BACKEND_URL}/user/getUserDetails`,
        {
          adminTab: value,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      localStorage.removeItem("activeNdrTab"); // or whatever your token key is
      localStorage.removeItem("activeOrderTab");
      localStorage.removeItem("activeOperationFirstMileTab");
      localStorage.removeItem("activeOperationMidMileTab");
      localStorage.removeItem("activeOperationLastMileTab");
      localStorage.removeItem("activeUserDiscrepancyTab");
      localStorage.removeItem("activeDiscrepancyTab");
      localStorage.removeItem("activeSidebarItem");
      setIsAdminTab(value);

      // Redirect with full page reload
      if (value) {
        window.location.href = "/adminDashboard";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Failed to toggle admin tab:", err);
    }
  };

  const handleNewOrderClick = async () => {
    try {

      const token = Cookies.get("session");

      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/users/getUsers`,
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (response.data.isSeller) {
        navigate("/dashboard/order/neworder");
      } else {
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const handleBulkUpload = () => {
    setShowSelectOrderType(true);
  };

  const handleSelectOrderType = (type) => {
    setSelectedOrderType(type);
    setUpload(true);
    setShowSelectOrderType(false);
  };

  const handleCalculateRate = () => {
    navigate("/dashboard/tools/Cost_Estimation")
  }
  let isSidebarAdmin = false;
  const handleCreateTicket = () => {

    setIsModalOpen(true);

  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsBalanceDropdownOpen(false);
      }
    }
    if (isBalanceDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBalanceDropdownOpen]);


  return (
    <div className="pb-[60px]">
      {/* Navbar */}
      <div className="w-full bg-white shadow fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-end gap-2 px-3 py-1.5 min-h-[55px] sm:min-h-[60px]">
          {/* Left Side: Sidebar Toggle (Hidden in Mobile) */}
          <div className="flex items-center justify-center">
            <button className="text-[12px] hidden lg:block lg:ml-0 text-[#0CBB7D]">
              <img
                src={grouplogo}
                alt="description"
                className="h-7 w-7 rounded-full"
              />
            </button>
          </div>


          {/* Logo - Centered in Mobile, Default in Laptop */}
          <div className="sm:flex hidden sm:flex-1 justify-start lg:justify-start sm:ml-4 ml-2">
            <img src={ShipexLogo} alt="Logo" className="h-9" />
          </div>

          <div className="sm:hidden">
            <button
              onClick={() => setShowQuickPopup(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0CBB7D] text-white hover:bg-green-50 transition"
            >
              <FiZap className="text-[14px]" />
            </button>
          </div>

          {showQuickPopup && (
            <div
              className="fixed inset-0 flex items-start justify-center z-50"
              onClick={() => setShowQuickPopup(false)}
            >
              <div
                className="
        bg-white w-[100%] mt-[55px] p-4 rounded-lg shadow-lg relative
        animate-popup-in
      "
                onClick={(e) => e.stopPropagation()}
              >
                {/* Action Grid */}
                <div className="grid grid-cols-3 gap-3 text-center animate-popup-in text-gray-700">

                  {/* Add Order */}
                  <div
                    onClick={() => {
                      handleNewOrderClick();
                      setShowQuickPopup(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center bg-gray-50 border border-[#0CBB7D] rounded-lg py-3 cursor-pointer hover:bg-gray-100 transition"
                  >
                    <div className="bg-[#E1F7F2] p-2 rounded-full text-[#0CBB7D] text-[12px]">
                      <FiPlusSquare />
                    </div>
                    <p className="text-[12px] font-[600] mt-1">Add Order</p>
                  </div>

                  {/* Bulk Import */}
                  <div
                    onClick={() => {
                      handleBulkUpload();
                      setShowQuickPopup(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center bg-gray-50 border border-[#0CBB7D] rounded-lg py-3 cursor-pointer hover:bg-gray-100 transition"
                  >
                    <div className="bg-[#E1F7F2] p-2 rounded-full text-[#0CBB7D] text-[12px]">
                      <FiUploadCloud />
                    </div>
                    <p className="text-[12px] font-[600] mt-1">Bulk Import</p>
                  </div>

                  {/* Calculate Rate */}
                  <div
                    onClick={() => {
                      handleCalculateRate();
                      setShowQuickPopup(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center bg-gray-50 border border-[#0CBB7D] rounded-lg py-3 cursor-pointer hover:bg-gray-100 transition"
                  >
                    <div className="bg-[#E1F7F2] p-2 rounded-full text-[#0CBB7D] text-[12px]">
                      <MdOutlineCalculate />
                    </div>
                    <p className="text-[12px] font-[600] mt-1">Calculate Rate</p>
                  </div>

                </div>
              </div>
            </div>
          )}




          <div className="md:hidden flex justify-end items-center relative">
            {/* Mobile Search Overlay */}
            {isMobileSearchOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-40 z-50"
                onClick={() => setIsMobileSearchOpen(false)}>

                {/* Slide Down Search Bar */}
                <div
                  ref={mobileSearchRef}
                  className="bg-white w-full px-3 py-2 animate-slide-down-smooth"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center w-full">
                    <div className="w-[80%]">
                      <MasterSearchFilter isMobile={true} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Toggle Button - Icon with Border */}
            <button
              onClick={() => setIsMobileSearchOpen((p) => !p)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0CBB7D] text-white hover:bg-green-50 transition"
              aria-label="Open Master Search"
            >
              <FiSearch className="text-[14px]" />
            </button>
          </div>




          {/* Right Side: Three-dot menu in Mobile, Full menu in Desktop */}
          <div className="lg:hidden flex gap-4">
            <div className="relative">
              <div
                className={`flex items-center justify-center space-x-2 h-8 px-3 rounded-lg shadow-sm w-fit border ${balance < 0 ? "border-red-500 bg-red-50" : "border-[#0CBB7D] bg-white"
                  }`}
              >
                <FaWallet
                  className={`${balance < 0 ? "text-red-500" : "text-[#0CBB7D]"
                    } text-[10px]`}
                  title="Wallet Info"
                />

                <span
                  className={`text-[10px] font-[600] leading-none flex items-center space-x-1 select-none cursor-pointer ${balance < 0 ? "text-red-500" : "text-[#0CBB7D]"
                    }`}
                  onClick={() => setIsBalanceDropdownOpen((prev) => !prev)}
                >
                  <span>₹ {balance?.toFixed(2)}</span>
                  <FaCaretDown
                    className={`text-[10px] transition-transform ${isBalanceDropdownOpen ? "rotate-180" : "rotate-0"
                      } ${balance < 0 ? "text-red-500" : "text-[#0CBB7D]"}`}
                  />
                </span>

                <div
                  className={`w-4 h-4 rounded-full flex justify-center items-center ${balance < 0 ? "bg-red-500" : "bg-[#0CBB7D]"
                    }`}
                >
                  <FaPlus
                    className="text-[10px] font-[600] w-2 h-2 text-white cursor-pointer hover:text-gray-100 transition-transform duration-500"
                    title="Recharge wallet"
                    onClick={handleRechargeWallet}
                  />
                </div>

                <FaSyncAlt
                  className={`text-[10px] cursor-pointer hover:text-gray-500 transition-transform duration-500 ${balance < 0 ? "text-red-500" : "text-[#0CBB7D]"
                    }`}
                  title="Refresh balance"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent dropdown toggle
                    setRotation((prev) => prev + 360);
                    setRefresh(true);
                    Notification("Wallet Refresh Successfully", "success");
                  }}
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </div>

              {isBalanceDropdownOpen && (
                <div
                  className="absolute right-0 mt-1 text-gray-700 w-32 font-[600] bg-white rounded-lg shadow-lg p-3 z-50"
                  style={{ minWidth: "9rem" }}
                >
                  <div className="flex text-[10px] gap-1">
                    <p className="mb-1">Balance :</p>
                    <p className={`${balance < 0 ? "text-red-500" : ""}`}>
                      ₹{balance?.toFixed(2) || "0.00"}
                    </p>
                  </div>

                  <div className="flex text-[10px] gap-1">
                    <p className="text-red-700 font-[600] mb-1">Hold Amount :</p>
                    <p>₹{holdAmount?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              className="profile-icon"
              onClick={() => {
                setIsMobileMenuOpen((p) => !p);
                setShowActions(false);       // CLOSE Quick Actions
                setIsDropdownOpen(false);    // CLOSE Profile Dropdown
              }}
            >
              <FaEllipsisV className="text-[14px] text-[#0CBB7D]" />
            </button>

          </div>




          <div className="hidden lg:flex items-center space-x-4">
            {/* Master Search Filter */}
            <MasterSearchFilter isMobile={false} />


            {/* Divider */}
            <hr className="w-0 h-6 border-l border-gray-500" />

            <div className="relative inline-block text-left" ref={quickDropdownRef}>
              {/* Toggle Button */}
              <button
                onClick={() => setShowActions(!showActions)}
                className={`flex text-gray-500 items-center gap-1 px-3 h-8 rounded-lg border border-[#0CBB7D] hover:opacity-90 text-[12px] font-[600] ${showActions ? "bg-white" : "bg-transparent"
                  }`}
              >
                <FiZap className="text-[#0CBB7D]" />
                Quick Actions
              </button>

              {/* Dropdown Actions */}
              {showActions && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-3 z-50 w-[500px]">
                  <div className="bg-white animate-popup-in border border-gray-200 rounded-lg shadow-sm px-3 py-2 w-full">
                    {/* Arrow */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-l border-t border-gray-200"></div>

                    {/* Action Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        onClick={() => {
                          handleNewOrderClick();
                          setShowActions(false);
                        }}
                        className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-4 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <div className="bg-[#e1f7f2] p-2 rounded-full text-[#0CBB7D] text-[12px]">
                          <FiPlusSquare />
                        </div>
                        <span className="text-[12px] font-[600] text-gray-700 mt-2 text-center">Add an Order</span>
                      </div>

                      <div
                        onClick={() => {
                          handleBulkUpload();
                          setShowActions(false);
                        }}
                        className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-4 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <div className="bg-[#e1f7f2] p-2 rounded-full text-[#0CBB7D] text-[12px]">
                          <FiUploadCloud />
                        </div>
                        <span className="text-[12px] font-[600] text-gray-700 mt-2 text-center">Bulk Import</span>
                      </div>

                      <div
                        onClick={() => { setShowActions(false); handleCalculateRate(); }}
                        className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-4 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <div className="bg-[#e1f7f2] p-2 rounded-full text-[#0CBB7D] text-[12px]">
                          <MdOutlineCalculate />
                        </div>
                        <span className="text-[12px] font-[600] text-gray-700 mt-2 text-center">Calculate Rate</span>
                      </div>

                      {/* <div
                      onClick={() => { setShowActions(false); handleCreateTicket(); }}
                      className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-4 cursor-pointer hover:bg-gray-100 transition"
                    >
                      <div className="bg-[#e1f7f2] p-2 rounded-full text-[#0CBB7D] text-xl">
                        <FaTicketAlt />
                      </div>
                      <span className="text-[12px] font-[600] text-gray-700 mt-2 text-center">Create a Ticket</span>
                    </div> */}
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Divider */}
            <hr className="w-0 h-6 border-l border-gray-500" />

            {/* Wallet Info */}
            <div className="flex items-center space-x-2">
              <div
                className={`flex items-center justify-center space-x-2 px-3 h-[32px] rounded-lg shadow-sm w-fit 
      ${balance < 0 ? "bg-red-500" : "bg-[#0CBB7D]"}`}
              >
                <div className="relative group flex items-center">
                  <FaWallet
                    onClick={handleRechargeWallet}
                    className={`text-[12px] cursor-pointer 
          ${balance < 0 ? "text-white" : "text-white"}`}
                  />

                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 ml-12 transform -translate-x-1/2 mt-4 w-max bg-white text-gray-700 text-[12px] font-[600] rounded-lg shadow-sm px-3 py-2 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div
                      className={`${balance < 0 ? "text-red-500 font-[600]" : "text-gray-700"}`}
                    >
                      Balance: ₹ {balance?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-red-700">
                      Hold Amount: ₹{holdAmount?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>

                <span
                  className={`mt-[1px] text-[12px] font-[600] leading-none 
        ${balance < 0 ? "text-white" : "text-white"}`}
                >
                  ₹ {balance?.toFixed(2)}
                </span>

                {/* Plus (Recharge) Icon */}
                <div
                  className={`w-4 h-4 rounded-full flex justify-center items-center 
        ${balance < 0 ? "bg-white" : "bg-white"}`}
                >
                  <FaPlus
                    className={`text-[12px] font-[600] w-3 h-3 cursor-pointer transition-transform duration-500 
          ${balance < 0 ? "text-red-500 hover:text-red-400" : "text-[#0CBB7D] hover:text-green-500"}`}
                    title="Recharge wallet"
                    onClick={handleRechargeWallet}
                  />
                </div>
              </div>

              {/* Separate refresh button */}
              <button
                type="button"
                className={`w-[32px] h-[32px] flex items-center justify-center hover:opacity-90 rounded-lg shadow-sm transition
      ${balance < 0 ? "bg-red-500" : "bg-[#0CBB7D]"}`}
                title="Refresh balance"
                onClick={() => {
                  setRotation((prev) => prev + 360);
                  setRefresh(true);
                  Notification("Wallet Refresh Successfully", "success");
                }}
              >
                <FaSyncAlt
                  className={`text-[12px] transition-transform duration-500 
        ${balance < 0 ? "text-white" : "text-white"}`}
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </button>
            </div>



            {/* User Initial */}
            <div
              className="profile-icon w-8 h-8 bg-[#0CBB7D] text-white flex items-center justify-center rounded-full font-[600] cursor-pointer overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen((p) => !p);
                setShowActions(false);       // CLOSE Quick Actions
                setIsMobileMenuOpen(false);  // CLOSE Mobile Menu
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>
                  {userData?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>


          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="fixed top-[50px] animate-popup-in right-2 z-50 bg-white shadow-lg rounded p-4 w-44">
          <ul className="space-y-4 text-[12px] font-[600]">

            {/* Profile */}
            <li>
              <Link
                to="/dashboard/settings/company-profile"
                className="text-gray-700 flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FiUser className="text-[#0CBB7D]" />
                Profile
              </Link>
            </li>

            {/* Recharge Wallet */}
            <li>
              <button
                onClick={() => {
                  handleRechargeWallet();
                  setIsMobileMenuOpen(false);
                }}
                className="text-gray-700 flex items-center gap-2"
              >
                <FiCreditCard className="text-[#0CBB7D]" />
                Recharge Wallet
              </button>
            </li>

            {/* Admin Toggle If Admin */}
            {userData?.isAdmin && (
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-700">
                  <FiShield className="text-[#0CBB7D]" />
                  <span>{isAdminTab ? "Admin" : "User"}</span>
                </div>
                <label className="relative inline-flex items-center w-11 h-6 cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isAdminTab}
                    onChange={(e) => handleToggleAdmin(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-focus:outline-none peer-checked:bg-[#0CBB7D] transition-colors duration-300"></div>
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform peer-checked:translate-x-5"></div>
                </label>
              </li>
            )}


            {/* Logout */}
            <li>
              <button
                className="text-red-600 hover:text-red-800 flex items-center gap-2"
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
              >
                <FiLogOut className="text-red-600" />
                Logout
              </button>
            </li>

          </ul>
        </div>
      )}


      {/* Profile Dropdown - Fixed Position, Hidden on Scroll */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="fixed top-[60px] text-[12px] font-[600] right-2 z-50 bg-white shadow-sm animate-popup-in rounded p-2 w-40"
        >
          <ul>

            {/* Profile */}
            <li className="hover:bg-green-100 p-2">
              <Link
                to="/dashboard/settings/company-profile"
                className="text-gray-700 flex items-center gap-2"
                onClick={() => setIsDropdownOpen(false)}
              >
                <FiUser className="text-[#0CBB7D]" />
                Profile
              </Link>
            </li>

            {/* Admin/User Toggle */}
            {userData?.isAdmin && (
              <li className="hover:bg-green-100 p-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-700">
                  <FiShield className="text-[#0CBB7D]" />
                  <span>{isAdminTab ? "Admin" : "User"}</span>
                </div>

                <label className="relative inline-flex items-center w-11 h-6 cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isAdminTab}
                    onChange={(e) => handleToggleAdmin(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-[#0CBB7D] transition-all duration-300"></div>
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transform transition-all duration-300 peer-checked:translate-x-5"></div>
                </label>
              </li>
            )}

            {/* Logout */}
            <li className="hover:bg-red-100 p-2">
              <button
                className="text-red-600 hover:text-red-800 flex items-center gap-2"
                onClick={() => {
                  handleLogout();
                  setIsDropdownOpen(false);
                }}
              >
                <FiLogOut className="text-red-600" />
                Logout
              </button>
            </li>

          </ul>
        </div>
      )}


      {/* Sidebar (Opens Only in Mobile) */}
      {isSidebarOpen && <Sidebar onClose={() => setIsSidebarOpen(false)} />}
      <SelectOrderTypePopup
        isOpen={showSelectOrderType}
        onClose={() => setShowSelectOrderType(false)}
        onSelect={handleSelectOrderType}
      />
      {upload && (
        <BulkUploadPopup
          onClose={() => setUpload(false)}
          setRefresh={setRefresh}
          selectedOrderType={selectedOrderType}
          onBack={() => {
            setUpload(false);
            setShowSelectOrderType(true);
          }}

        />
      )}
      <AddCase isOpen={isModalOpen} onClose={closeModal} refresh={setRefresh} />
    </div>
  );
};

export default Navbar;