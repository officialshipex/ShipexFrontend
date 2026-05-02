import React, { useEffect, useState } from "react";
import { ChevronRight, Edit2, Eye, EyeOff, BadgeCheck } from "lucide-react";
import avatar from "../../assets/avatar.png";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import ThreeDotLoader from "../../Loader";

import BankDetailsEditModal from "./BankDetailsEditModal";
import AadharDetailsEditModal from "./AadharDetailsEditModal";
import PanDetailsEditModal from "./PanDetailsEditModal";
import GstDetailsEditModal from "./GstDetailsEditModal";
import { Notification } from "../../Notification";
import UpdateRateCardPopup from "./UpdateRateCardPopup";
import EarlyCODModal from "../Billings/EarlyCodPopup";
import UpdateCreditLimitEditModal from "./UpdateCreditLimitModal";
import { User, MapPin, ExternalLink, CheckCircleIcon, Clock, CreditCard, IdCard, FileText, Settings, Info, Wallet } from "lucide-react";
import KamDetailsEditModal from "./KamDetailsEditModal";
import { FaEdit, FaTrash } from "react-icons/fa";
import { FiChevronDown, FiArrowLeft, FiSearch, FiEdit, FiAlertCircle } from "react-icons/fi";
import UploadRatecard from "../RateCard/UploadRatecard";
import UserServiceManagement from "./UserServiceManagement";
import Loader from "../../Loader";


// Referral Commission Edit Modal
const ReferralCommissionEditModal = ({
  isOpen,
  onClose,
  userId,
  currentValue,
  onSave,
}) => {
  const [newValue, setNewValue] = useState(currentValue || "");

  const handleSave = () => {
    onSave(newValue);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 animate-popup-in bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-4 rounded-lg w-full max-w-md shadow-2xl">
        <h2 className="text-[12px] sm:text-[14px] font-[600] mb-4 text-gray-700">
          Update Referral Commission
        </h2>
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] sm:text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0CBB7D] focus:border-transparent"
          placeholder="Enter commission percentage"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-[10px] sm:text-[12px] font-[600] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-2 rounded-lg bg-[#0CBB7D] text-white hover:bg-green-500 text-[10px] sm:text-[12px] font-[600] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Change Password Modal
const ChangePasswordModal = ({
  isOpen,
  onClose,
  email,
  onSave,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleSave = () => {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    onSave(newPassword);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 animate-popup-in bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
        <h2 className="text-[14px] sm:text-[16px] font-[600] mb-4 text-gray-700">
          Change Password
        </h2>
        <p className="text-[12px] text-gray-500 mb-2">Change password for: {email}</p>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (e.target.value.length >= 8) setError("");
          }}
          className={`w-full border ${error ? "border-red-500" : "border-gray-300"} rounded-lg px-3 py-2 text-[12px] sm:text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0CBB7D] focus:border-transparent`}
          placeholder="Enter new 8-character password"
        />
        {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-[10px] sm:text-[12px] font-[600] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-2 rounded-lg bg-[#0CBB7D] text-white hover:bg-opacity-90 text-[10px] sm:text-[12px] font-[600] transition-colors"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProfileCard() {
  const [activeTab, setActiveTab] = useState("My Profile");
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [tabContent, setTabContent] = useState({});
  const [userData, setUserData] = useState();
  const [admin, setAdmin] = useState(false);
  const [showBankEditModal, setShowBankEditModal] = useState(false);
  const [showAadharEditModal, setShowAadharEditModal] = useState(false);
  const [showPanEditModal, setShowPanEditModal] = useState(false);
  const [showGstEditModal, setShowGstEditModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showCreditLimitModal, setShowCreditLimitModal] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showRateCardModal, setShowRateCardModal] = useState(false);
  const [hoveredAddress, setHoveredAddress] = useState(null);
  const [hoveredAadharAddress, setHoveredAadharAddress] = useState(null);
  const [showEarlyCODModal, setShowEarlyCODModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [apiAccess, setApiAccess] = useState(false);
  const [showKAMEditModal, setShowKAMEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [rateCardType, setRateCardType] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [editedRates, setEditedRates] = useState({});
  const [rates, setRates] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [isUploadRatecardModalOpen, setIsUploadRatecardModalOpen] = useState(false);
  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false);
  const [rateSearch, setRateSearch] = useState("");
  const [rateLoading, setRateLoading] = useState(false);
  const [currentRatePlan, setCurrentRatePlan] = useState("");
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/user/getUserDetails`,
          {
            headers: { Authorization: `Bearer ${Cookies.get("session")}` },
          }
        );
        setAdmin(res.data.user.isAdmin);
      } catch (error) {
        console.log("Error fetching admin status:", error);
      }
    };
    fetchAdmin();
  }, []);
  const navigate = useNavigate();

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/saveRate/getPlanNames`, {
        headers: { Authorization: `Bearer ${Cookies.get("session")}` }
      });
      setAllPlans(response.data.planNames || []);
    } catch (error) {
      console.error("Failed to fetch plan names", error);
    }
  };

  const refreshRates = async () => {
    setRateLoading(true);
    try {
      const endpoint = rateCardType === "B2B" 
        ? `${REACT_APP_BACKEND_URL}/b2b/saveRate/getRateCard` 
        : `${REACT_APP_BACKEND_URL}/saveRate/getRateCard`;
        
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${Cookies.get("session")}` },
        params: { userId: id }
      });
      setRates(response.data.rateCards || response.data.B2BRateCard || []);
    } catch (error) {
      console.error("Failed to fetch rate cards", error);
      setRates([]);
    } finally {
      setRateLoading(false);
    }
  };

  const handleDeleteRateCard = async (rateId) => {
    if (window.confirm("Are you sure you want to delete this rate card?")) {
      try {
        await axios.delete(`${REACT_APP_BACKEND_URL}/saveRate/deleteRateCard/${rateId}`, {
          data: { userId: id }, 
          headers: { Authorization: `Bearer ${Cookies.get("session")}` }
        });
        Notification("Rate card deleted successfully", "success");
        refreshRates();
      } catch (error) {
        Notification("Failed to delete rate card", "error");
      }
    }
  };

  useEffect(() => {
    fetchPlans();
    refreshRates();
  }, [id, rateCardType]);

  useEffect(() => {
    if (userData?.rateCard) {
      setCurrentRatePlan(userData.rateCard);
      setRateCardType("B2C");
    } else if (userData?.b2bRateCard) {
      setCurrentRatePlan(userData.b2bRateCard);
      setRateCardType("B2B");
    }
  }, [userData]);

  const filteredUserRates = rates;

  const handleAutoCreateUserPlan = async () => {
    const sharedPlans = ["Basic Plan", "Silver", "Gold", "Platinum", "Bronze"];
    const currentPlan = String(userData?.rateCard || "");
    const uId = String(userData?.userId || "");
    const isShared = sharedPlans.includes(currentPlan) || (currentPlan !== "" && !currentPlan.includes(uId));

    if (!isShared) return userData?.rateCard;

    const desiredPlan = `${userData.fullname.replace(/\s+/g, '_')}_${userData.userId}`;
    try {
      const token = Cookies.get("session");
      await axios.post(`${REACT_APP_BACKEND_URL}/saveRate/createPlanName`, { planName: desiredPlan }, { headers: { Authorization: `Bearer ${token}` } });

      const assignData = {
        userId: id,
        userName: userData.fullname,
        planName: desiredPlan,
        rateCards: rates, 
      };
      await axios.put(`${REACT_APP_BACKEND_URL}/users/assignPlan`, assignData, { headers: { Authorization: `Bearer ${token}` } });

      Notification(`Custom plan ${desiredPlan} created and assigned!`, "success");
      fetchUsers(true);
      fetchPlans();
      setCurrentRatePlan(desiredPlan);
      return desiredPlan;
    } catch (error) {
      setCurrentRatePlan(desiredPlan);
      const token = Cookies.get("session");
      const assignData = {
        userId: id,
        userName: userData.fullname,
        planName: desiredPlan,
        rateCards: rates,
      };
      await axios.put(`${REACT_APP_BACKEND_URL}/users/assignPlan`, assignData, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers(true);
      Notification("Switched to user-specific plan", "info");
      return desiredPlan;
    }
  };



  const renderRateTable = () => (
    <div className="overflow-auto bg-white mt-2 max-h-[535px]">
      <table className="w-full text-center border-collapse">
        <thead className="sticky top-0 z-10 bg-[#0CBB7D] text-[10px] sm:text-[11px] text-white">
          <tr>
            <th className="px-2 py-2 font-bold">Provider</th>
            <th className="px-2 py-2 font-bold">Service</th>
            <th className="px-2 py-2 font-bold">Mode</th>
            <th className="px-2 py-2 font-bold">Weight</th>
            <th className="px-2 py-2 font-bold">Zone A</th>
            <th className="px-2 py-2 font-bold">Zone B</th>
            <th className="px-2 py-2 font-bold">Zone C</th>
            <th className="px-2 py-2 font-bold">Zone D</th>
            <th className="px-2 py-2 font-bold">Zone E</th>
            <th className="px-2 py-2 font-bold">COD</th>
            <th className="px-2 py-2 font-bold">Action</th>
          </tr>
        </thead>
        <tbody>
          {rateLoading ? (
            <tr><td colSpan="11" className="py-10"><Loader /></td></tr>
          ) : filteredUserRates.length > 0 ? (
            filteredUserRates.map((card, index) => (
              <React.Fragment key={index}>
                <tr className="border-b border-gray-50 text-[10px] sm:text-[11px] text-gray-700">
                  <td className="px-2 py-1.5" rowSpan={2}>{card.courierProviderName}</td>
                  <td className="px-2 py-1.5" rowSpan={2}>{card.courierServiceName}</td>
                  <td className="px-2 py-1.5" rowSpan={2}>{card.mode}</td>
                  <td className="px-2 py-1.5 text-gray-400">Basic: {card.weightPriceBasic[0]?.weight}gm</td>
                  <td className="px-2 py-1.5 font-medium">₹{card.weightPriceBasic[0]?.zoneA}</td>
                  <td className="px-2 py-1.5 font-medium">₹{card.weightPriceBasic[0]?.zoneB}</td>
                  <td className="px-2 py-1.5 font-medium">₹{card.weightPriceBasic[0]?.zoneC}</td>
                  <td className="px-2 py-1.5 font-medium">₹{card.weightPriceBasic[0]?.zoneD}</td>
                  <td className="px-2 py-1.5 font-medium">₹{card.weightPriceBasic[0]?.zoneE}</td>
                  <td className="px-2 py-1.5 font-medium" rowSpan={2}>₹{card.codCharge} / {card.codPercent}%</td>
                  <td className="px-2 py-1.5" rowSpan={2}>
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => navigate(`/dashboard/ratecard/update/${card._id}?userId=${id}`)} className="text-[#0CBB7D]"><FaEdit size={12} /></button>
                      <button onClick={() => handleDeleteRateCard(card._id)} className="text-red-500"><FaTrash size={12} /></button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-50 text-[10px] sm:text-[11px] text-gray-700">
                  <td className="px-2 py-1.5 text-gray-400">Addl: {card.weightPriceAdditional[0]?.weight}gm</td>
                  <td className="px-2 py-1.5">₹{card.weightPriceAdditional[0]?.zoneA}</td>
                  <td className="px-2 py-1.5">₹{card.weightPriceAdditional[0]?.zoneB}</td>
                  <td className="px-2 py-1.5">₹{card.weightPriceAdditional[0]?.zoneC}</td>
                  <td className="px-2 py-1.5">₹{card.weightPriceAdditional[0]?.zoneD}</td>
                  <td className="px-2 py-1.5">₹{card.weightPriceAdditional[0]?.zoneE}</td>
                </tr>
              </React.Fragment>
            ))
          ) : (
            <tr><td colSpan="11" className="py-10 text-gray-400">No rates found for this plan</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = Cookies.get("session");
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/user/getUserById`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { id },
        }
      );

      const user = response.data.userDetails;
      setUserData(user);
      setIsEnabled(user.isBlocked);
      setApiAccess(user.adminApiAccess);

      const dynamicTabs = {
        "Contact Details": {
          Name: user.fullname || "N/A",
          Email: user.email || "N/A",
          Phone: user.phoneNumber || "N/A",
          "User type": user?.gstDetails?.gstNumber ? "COMPANY" : "INDIVIDUAL",
          "Company name": user?.company || "--",
          Joined: new Date(user.createdAt)
            .toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            .replace(/ /g, " "),
        },
        "Address Details": {
          "Address":
            user?.gstDetails?.companyAddress ||
            user?.billingAddress?.address ||
            "N/A",
          City:
            user?.gstDetails?.city ||
            user?.billingAddress?.city ||
            "N/A",
          State:
            user?.gstDetails?.state ||
            user?.billingAddress?.state ||
            "N/A",
          Country: "India",
          Pincode:
            user?.gstDetails?.pincode ||
            user?.billingAddress?.postalCode ||
            "N/A",
          GSTIN: user?.gstDetails?.gstNumber || "--",
        },
        "Bank Details": {
          "Bank Name": user?.accountDetails?.bankName || "N/A",
          "Account Holder Name": user?.accountDetails?.beneficiaryName || "N/A",
          "Account Number": user?.accountDetails?.accountNumber || "N/A",
          IFSC: user?.accountDetails?.ifscCode || "N/A",
          "Branch Name": user?.accountDetails?.branchName || "N/A",
        },
        "Aadhar Details": {
          Name: user?.aadharDetails?.nameOnAadhar || "N/A",
          "Aadhaar Number": user?.aadharDetails?.aadharNumber || "N/A",
          State: user?.aadharDetails?.state || "N/A",
          Address: user?.aadharDetails?.address || "N/A",
        },
        "PAN Details": {
          "PAN Number": user?.panDetails?.panNumber || "N/A",
          Name: user?.panDetails?.nameOnPan || "N/A",
          Type: user?.panDetails?.panType || "N/A",
          "PAN Ref ID": user?.panDetails?.referenceId || "N/A",
        },
        "KYC using Aadhaar": {
          "KYC Status": user.kycStatus ? "Verified" : "Pending",
          "Verified at": user.kycStatus
            ? new Date(user.updatedAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            : "N/A",
        },
        "KAM Details": {
          "Name": user?.kamDetails?.kamName || "N/A",
          "Email": user?.kamDetails?.kamEmail || "N/A",
          "Phone": user?.kamDetails?.kamPhone || "N/A",
        },
        "API Details": {
          "Private Key": "xxxxxxxxxxxxxx",
          "Public Key": user?.apiKeys?.publicKey || "ulpvCErg0B3jiR4DAtnZ",
        },
      };

      setTabContent(dynamicTabs);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [showAadharEditModal, showBankEditModal, id]);

  const handleReferralSave = async (newValue) => {
    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/user/updateReferralCommission`,
        { userId: id, referralCommissionPercentage: Number(newValue) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Notification("Referral Commission updated successfully!", "success");
      setShowReferralModal(false);
      fetchUsers();
    } catch (error) {
      Notification("Failed to update Referral Commission.", "error");
      console.error("Error updating referral commission:", error);
    }
  };

  const handleChangePassword = async (newPassword) => {
    try {
      const token = Cookies.get("session");
      await axios.post(
        `${REACT_APP_BACKEND_URL}/external/changePasswordAdmin`,
        { email: userData.email, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Notification("Password updated successfully!", "success");
      setShowChangePasswordModal(false);
    } catch (error) {
      Notification(error.response?.data?.message || "Failed to update password.", "error");
      console.log("Error updating password:", error);
    }
  };



  const handleToggle = async () => {
    const newStatus = !isEnabled;
    setIsEnabled(newStatus);
    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/user/updateBlockStatus`,
        { userId: id, isBlocked: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Notification(
        response.data?.message ||
        `User has been ${newStatus ? "blocked" : "unblocked"} successfully.`,
        "success"
      );
    } catch (error) {
      console.error("Error updating user block status:", error);
      Notification(
        error.response?.data?.message ||
        "Failed to update user block status. Please try again.",
        "error"
      );
      setIsEnabled(!newStatus);
    }
  };

  const handleNotificationToggle = async (field, value) => {
    try {
      // ✅ Instantly reflect the toggle in UI
      setNotificationSettings((prev) => ({
        ...prev,
        [field]: value,
      }));

      // ✅ Send update to backend
      await axios.put(
        `${REACT_APP_BACKEND_URL}/notification/updateNotification`,
        { field, value, userId: id },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("session")}`,
          },
        }
      );

      const getChannelName = (f) => {
        if (f === "isAdminWhatsAppEnable") return "WhatsApp";
        if (f === "isAdminEmailEnable") return "Email";
        return "SMS";
      };

      Notification(
        `${getChannelName(field)} notification ${value ? "enabled" : "disabled"}.`,
        "success"
      );
    } catch (error) {
      console.error("Error updating notification setting:", error);
      Notification("Failed to update notification setting", "error");

      // ❌ Revert UI if API fails
      setNotificationSettings((prev) => ({
        ...prev,
        [field]: !value,
      }));
    }
  };
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/notification/getNotification`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("session")}`,
            },
            params: { userId: id }, // ✅ Pass userId here
          }
        );

        // console.log("Fetched notification data:", res.data);
        setNotificationSettings(res.data || {});
      } catch (error) {
        console.error("Error fetching notification settings:", error);
        Notification("Failed to load notification settings", "error");
      }
    };

    if (id) fetchNotificationSettings();
  }, [id]);

  // API call when toggle changes
  const handleApiToggle = async () => {
    const newValue = !apiAccess;
    setApiAccess(newValue);
    const token = Cookies.get("session");
    try {
      await axios.post(`${REACT_APP_BACKEND_URL}/user/apiAccess`, {
        userId: id,
        adminApiAccess: newValue,
      }, { headers: { Authorization: `Bearer ${token}` } });
      // console.log("API Access Updated:", newValue);
      Notification("API Access Updated", "success")
    } catch (error) {
      // console.error("Error updating API access:", error);
      Notification("Error updating API access", "error")
    }
  };


  const renderTabContent = () => {
    if (activeTab === "My Profile") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2">
          {/* LEFT SIDE - Main Details (Takes more width) */}
          <div className="lg:col-span-8 space-y-2 sm:space-y-2">
            {/* Contact Details */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 sm:px-4 py-1 sm:py-1 bg-gray-50 border-b border-gray-200">
                <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
                  <User size={16} className="text-gray-600" />
                  Contact Details
                </h3>

                {!!admin && (
                  <button className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <FiEdit size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>

              <div className="p-4 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                {Object.entries(tabContent["Contact Details"] || {}).map(([label, value]) => {
                  const isEmail = label.toLowerCase().includes("email");
                  const isPhone = label.toLowerCase().includes("phone") || label.toLowerCase().includes("mobile");

                  const isVerified =
                    (isEmail && userData?.isEmailVerified) ||
                    (isPhone && userData?.isPhoneVerified);

                  return (
                    <div key={label} className="flex gap-2 items-center">
                      <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">{label}:</p>

                      <div className="flex items-center gap-1 text-[10px] sm:text-[12px] text-gray-700 font-[600] break-words">
                        <span>{value}</span>
                        {(isEmail || isPhone) && (
                          isVerified ? (
                            <CheckCircleIcon size={14} className="text-[#0CBB7D]" />
                          ) : (
                            <FiAlertCircle size={14} className="text-red-400" />
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 sm:px-4 py-1 sm:py-1 bg-gray-50 border-b border-gray-200">
                <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
                  <MapPin size={16} className="text-gray-600" /> Address Details
                </h3>
                {!!admin && (
                  <button className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <FiEdit size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
              <div className="p-4 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {Object.entries(tabContent["Address Details"] || {}).map(
                  ([label, value]) => {
                    const isAddressField = label.toLowerCase() === "address";
                    const shouldTruncate = isAddressField && value && value.length > 30;
                    const truncatedValue = shouldTruncate
                      ? value.substring(0, 30) + "..."
                      : value;

                    return (
                      <div key={label} className="flex gap-2 items-start">
                        <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500 whitespace-nowrap">
                          {label}:
                        </p>
                        {shouldTruncate ? (
                          <>
                            <p className="md:hidden text-[10px] sm:text-[12px] text-gray-700 font-[600] break-words flex-1">
                              {value}
                            </p>
                            <div className="hidden md:flex items-center gap-1 relative flex-1">
                              <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600]">
                                {truncatedValue}
                              </p>
                              <div
                                className="relative"
                                onMouseEnter={() => setHoveredAddress(label)}
                                onMouseLeave={() => setHoveredAddress(null)}
                              >
                                <Info size={14} className="text-gray-500 cursor-help flex-shrink-0" />
                                {hoveredAddress === label && (
                                  <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-3 py-2 bg-gray-800 text-white text-[10px] rounded-lg shadow-lg whitespace-normal w-64 break-words">
                                    {value}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                      <div className="border-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600] break-words flex-1">
                            {value}
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 sm:px-4 py-1 sm:py-1 bg-gray-50 border-b border-gray-200">
                <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
                  <CreditCard size={16} className="text-gray-600" /> Bank Details
                </h3>
                {admin && (
                  <button
                    onClick={() => setShowBankEditModal(true)}
                    className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FiEdit size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
              <div className="p-4 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                {Object.entries(tabContent["Bank Details"] || {}).map(
                  ([label, value]) => (
                    <div key={label} className="flex gap-2 items-center">
                      <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                        {label}:
                      </p>
                      <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600] break-words">
                        {value}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Aadhar Details */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 sm:px-4 py-1 sm:py-1 bg-gray-50 border-b border-gray-200">
                <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
                  <IdCard size={16} className="text-gray-600" /> Aadhar Details
                </h3>
                {admin && (
                  <button
                    onClick={() => setShowAadharEditModal(true)}
                    className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FiEdit size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
              <div className="p-4 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {Object.entries(tabContent["Aadhar Details"] || {}).map(
                  ([label, value]) => {
                    const isAddressField = label.toLowerCase() === "address";
                    const shouldTruncate = isAddressField && value && value.length > 30;
                    const truncatedValue = shouldTruncate
                      ? value.substring(0, 30) + "..."
                      : value;

                    return (
                      <div key={label} className="flex gap-2 items-start">
                        <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500 whitespace-nowrap">
                          {label}:
                        </p>
                        {shouldTruncate ? (
                          <>
                            <p className="md:hidden text-[10px] sm:text-[12px] text-gray-700 font-[600] break-words flex-1">
                              {value}
                            </p>
                            <div className="hidden md:flex items-center gap-1 relative flex-1">
                              <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600]">
                                {truncatedValue}
                              </p>
                              <div
                                className="relative"
                                onMouseEnter={() => setHoveredAadharAddress(label)}
                                onMouseLeave={() => setHoveredAadharAddress(null)}
                              >
                                <Info size={14} className="text-gray-500 cursor-help flex-shrink-0" />
                                {hoveredAadharAddress === label && (
                                  <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-3 py-2 bg-gray-800 text-white text-[10px] rounded-lg shadow-lg whitespace-normal w-64 break-words">
                                    {value}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                      <div className="border-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600] break-words flex-1">
                            {value}
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* PAN Details */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 sm:px-4 py-1 sm:py-1 bg-gray-50 border-b border-gray-200">
                <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
                  <FileText size={16} className="text-gray-600" /> PAN Details
                </h3>
                {admin && (
                  <button
                    onClick={() => setShowPanEditModal(true)}
                    className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FiEdit size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
              <div className="p-4 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {Object.entries(tabContent["PAN Details"] || {}).map(
                  ([label, value]) => (
                    <div key={label} className="flex gap-2 items-center">
                      <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                        {label}:
                      </p>
                      <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600] break-words">
                        {value}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
            {/* Ratecard Management */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mt-2">
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 gap-2">
                <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
                  <CreditCard size={16} className="text-gray-600" />
                  Ratecard Management
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={async () => {
                      let planToUse = userData?.rateCard;
                      try {
                        const sharedPlans = ["Basic Plan", "Silver", "Gold", "Platinum", "Bronze"];
                        const currentPlan = String(userData?.rateCard || "");
                        const uId = String(userData?.userId || "");
                        const isShared = sharedPlans.includes(currentPlan) || (currentPlan !== "" && !currentPlan.includes(uId));
                        
                        if (userData?.rateCard && isShared) {
                          Notification("Preparing user-specific plan...", "info");
                          const newPlan = await handleAutoCreateUserPlan();
                          if (newPlan) planToUse = newPlan;
                        }
                      } catch (err) {
                        console.error("Plan auto-creation failed:", err);
                      } finally {
                        navigate(`/dashboard/ratecard/rateCardform?plan=${planToUse || ""}&userId=${id}`);
                      }
                    }}
                    className="bg-[#0CBB7D] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-green-600 transition-colors"
                  >
                    Add Rate Card
                  </button>
                  <button
                    onClick={() => {
                      setRateCardType("B2C");
                      setShowRateCardModal(true);
                    }}
                    className="bg-[#0CBB7D] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-green-600 transition-colors"
                  >
                    Assign
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const sharedPlans = ["Basic Plan", "Silver", "Gold", "Platinum", "Bronze"];
                        const currentPlan = String(userData?.rateCard || "");
                        const uId = String(userData?.userId || "");
                        const isShared = sharedPlans.includes(currentPlan) || (currentPlan !== "" && !currentPlan.includes(uId));
                        
                        if (userData?.rateCard && isShared) {
                          Notification("Preparing user-specific plan...", "info");
                          await handleAutoCreateUserPlan();
                        }
                      } catch (err) {
                        console.error("Plan auto-creation failed:", err);
                      } finally {
                        setTimeout(() => {
                          setIsUploadRatecardModalOpen(true);
                        }, 100);
                      }
                    }}
                    className="bg-[#0CBB7D] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-green-600 transition-colors"
                  >
                    Upload
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {renderRateTable()}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Account Info & API Details */}
          <div className="lg:col-span-4 space-y-2 sm:space-y-2">
            {/* Account Information */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm sticky top-4">
              <div className="px-4 sm:px-4 py-2.5 sm:py-2.5 bg-gray-50 border-b border-gray-200">
                <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
                  <Info size={16} className="text-gray-600" />
                  Account Information
                </h3>
              </div>

              <div className="p-4 sm:p-4 space-y-2 sm:space-y-2">
                {[
                  { label: "User ID", value: userData?.userId || "N/A" },
                  {
                    label: "Last Login",
                    value: userData?.lastLogin
                      ? new Date(userData.lastLogin).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                      : "N/A",
                  },
                  {
                    label: "Registration Date",
                    value: userData?.createdAt
                      ? new Date(userData.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      : "N/A",
                  },
                  {
                    label: "KYC Status",
                    value: (
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-[600] ${userData?.kycStatus ? "text-[#0CBB7D]" : "text-yellow-700"}`}>
                        {userData?.kycStatus ? (
                          <><CheckCircleIcon size={12} /> Verified</>
                        ) : (
                          <><Clock size={12} /> Pending</>
                        )}
                      </span>
                    ),
                  },
                  {
                    label: "COD Cycle",
                    value: (
                      <div className="flex items-center gap-2">
                        <span>{userData?.codPlan || "Standard"}</span>
                        {!!admin && (
                          <button
                            onClick={() => {
                              setSelectedUserId(userData?._id);
                              setShowEarlyCODModal(true);
                            }}
                            className="text-[#0CBB7D] hover:text-green-500"
                          >
                            <FiEdit size={12} />
                          </button>
                        )}
                      </div>
                    ),
                  },
                  {
                    label: "B2C Rate Card Plan Name",
                    value: admin ? (
                      <div className="flex items-center gap-2">
                        <span>{userData?.rateCard || "Basic Plan"}</span>
                        <button
                          onClick={() => { setShowRateCardModal(true); setRateCardType("B2C") }}
                          className="text-[#0CBB7D] hover:text-green-500"
                        >
                          <FiEdit size={12} />
                        </button>
                      </div>
                    ) : (
                      userData?.rateCard || "Basic Plan"
                    ),
                  },
                  {
                    label: "B2B Rate Card Plan Name",
                    value: admin ? (
                      <div className="flex items-center gap-2">
                        <span>{userData?.b2bRateCard || "Basic Plan"}</span>
                        <button
                          onClick={() => { setShowRateCardModal(true); setRateCardType("B2B") }}
                          className="text-[#0CBB7D] hover:text-green-500"
                        >
                          <FiEdit size={12} />
                        </button>
                      </div>
                    ) : (
                      userData?.b2bRateCard || "Basic Plan"
                    ),
                  },
                  { label: "Referral Code", value: userData?.referralCode || "N/A" },
                  {
                    label: "Change Password",
                    value: admin ? (
                      <button
                        onClick={() => setShowChangePasswordModal(true)}
                        className="text-[#0CBB7D] hover:text-green-500 flex items-center gap-1 font-[600]"
                      >
                        <Settings size={14} />
                        Change
                      </button>
                    ) : null,
                  },
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">{item.label}</p>
                    <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600] text-right">{item.value}</p>
                  </div>
                ))}

                {!!admin && !!userData?.referralCommissionPercentage && (
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">Referral Commission</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600]">{userData.referralCommissionPercentage}%</p>
                      <button onClick={() => setShowReferralModal(true)} className="text-[#0CBB7D] hover:text-green-500">
                        <FiEdit size={12} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">Credit Limit</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600]">{userData?.creditLimit || 0}</p>
                    <button onClick={() => setShowCreditLimitModal(true)} className="text-[#0CBB7D] hover:text-green-500">
                      <FiEdit size={12} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">WhatsApp Notification</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!notificationSettings?.isAdminWhatsAppEnable}
                      onChange={(e) => handleNotificationToggle("isAdminWhatsAppEnable", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-[#0CBB7D] transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">SMS Notification</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!notificationSettings?.isAdminSMSEnable}
                      onChange={(e) => handleNotificationToggle("isAdminSMSEnable", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-[#0CBB7D] transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">Email Notification</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!notificationSettings?.isAdminEmailEnable}
                      onChange={(e) => handleNotificationToggle("isAdminEmailEnable", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-[#0CBB7D] transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* KAM Details */}
            <div className="bg-white rounded-lg border w-full border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-1 bg-gray-50 border-b border-gray-200">
                <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
                  <BadgeCheck size={16} className="text-gray-600" /> KAM Details
                </h3>
                {!!admin && (
                  <button onClick={() => setShowKAMEditModal(true)} className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <FiEdit size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3 w-full">
                {Object.entries(tabContent["KAM Details"] || {}).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <p className="text-[11px] sm:text-[12px] font-semibold text-gray-500">{label}:</p>
                    <p className="text-[11px] sm:text-[12px] text-gray-700 font-semibold break-words">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* API Details */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-4 sm:px-4 py-2 sm:py-2 bg-gray-50 border-b border-gray-200">
                <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
                  <Settings size={16} className="text-gray-600" />API Details
                </h3>
              </div>
              <div className="p-4 sm:p-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] sm:text-[12px] font-[600]">
                  <p>Check latest version of API documentation</p>
                  <button onClick={() => window.open("https://api-docs.shipexindia.com/", "_blank")} className="hover:text-green-500 text-[#0CBB7D] transition-colors">
                    <ExternalLink size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] sm:text-[12px] font-[600]">
                  <p>API Access</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={apiAccess} onChange={handleApiToggle} />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-[#0CBB7D] transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </label>
                </div>
              </div>
            </div>
            {!!admin && (
              <UserServiceManagement
                userId={id}
                section="right"
                selectedService={selectedService}
                onServiceSelect={setSelectedService}
                editedRates={editedRates}
                onRateEdit={setEditedRates}
              />
            )}

          </div>
          {/* Mobile view only: section left moves to the end */}
          <div className="lg:hidden">

          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Content for {activeTab} coming soon...</p>
      </div>
    );
  };

  return (
    <div className="bg-gray-50">
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <ThreeDotLoader />
        </div>
      ) : (
        <>
          {/* Header Banner with Gradient */}
          <div className="relative bg-gradient-to-br from-[#0CBB7D]/20 via-teal-50 to-green-100 h-24 sm:h-36">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0CBB7D]/15 via-cyan-200/25 to-purple-200/30"></div>
            <div className="absolute top-10 left-20 w-32 h-32 bg-gradient-to-br from-[#0CBB7D]/40 to-cyan-300/40 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 right-32 w-40 h-40 bg-gradient-to-br from-green-300/40 to-purple-300/40 rounded-full blur-2xl"></div>
          </div>

          <div className="max-w-full mx-auto px-1 sm:px-2 lg:px-2 -mt-14 sm:-mt-24">
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-4 lg:p-4 mb-2 sm:mb-2">
              <div className="flex flex-row sm:flex-row items-center sm:items-start gap-4 sm:gap-4">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center p-1">
                    <img
                      src={userData?.logo || avatar}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="flex flex-row sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6 mt-12 sm:mt-24">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Wallet size={20} className="text-[#0CBB7D]" />
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-[12px] font-[600] text-gray-700">
                            Available: ₹{userData?.walletAmount?.toFixed(2) || "0.00"}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Hold: ₹{userData?.holdAmount?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!!admin && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {isEnabled ? "Blocked" : "Active"}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={handleToggle}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-red-500 transition-colors"></div>
                          <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full peer-checked:translate-x-5 transition-transform shadow-md"></div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pb-2">{renderTabContent()}</div>
          </div>
        </>
      )}

      {/* Modals */}
      <BankDetailsEditModal
        isOpen={showBankEditModal}
        onClose={() => setShowBankEditModal(false)}
      />
      <AadharDetailsEditModal
        isOpen={showAadharEditModal}
        onClose={() => setShowAadharEditModal(false)}
      />
      <PanDetailsEditModal
        isOpen={showPanEditModal}
        onClose={() => setShowPanEditModal(false)}
      />
      <GstDetailsEditModal
        isOpen={showGstEditModal}
        onClose={() => setShowGstEditModal(false)}
      />
      <ReferralCommissionEditModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        userId={id}
        currentValue={userData?.referralCommissionPercentage}
        onSave={handleReferralSave}
      />
      <UpdateCreditLimitEditModal
        isOpen={showCreditLimitModal}
        onClose={() => setShowCreditLimitModal(false)}
        userId={id}
        currentValue={userData?.creditLimit}
        refreshUserData={fetchUsers}
      />
      <KamDetailsEditModal
        isOpen={showKAMEditModal}
        onClose={() => setShowKAMEditModal(false)}
        userId={id}
      />

      {!!showChangePasswordModal && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          email={userData?.email}
          onSave={handleChangePassword}
        />
      )}

      <EarlyCODModal
        isOpen={showEarlyCODModal}
        onClose={() => setShowEarlyCODModal(false)}
        userId={selectedUserId}
      />

      {showRateCardModal && (
        <UpdateRateCardPopup
          id={id}
          userName={userData?.fullname}
          selectedRateCardValue={userData?.rateCard}
          isOpen={showRateCardModal}
          onClose={() => {
            setShowRateCardModal(false);
          }}
          onSubmit={() => {
            setShowRateCardModal(false);
            fetchUsers();
          }}
          rateCardType={rateCardType}
        />
      )}

      <UploadRatecard
        isOpen={isUploadRatecardModalOpen}
        onClose={() => setIsUploadRatecardModalOpen(false)}
        setRefresh={refreshRates}
        defaultPlanName={userData?.rateCard}
        replaceExisting={true}
        hidePlan={true}
        userId={id}
      />
    </div>
  );
}
