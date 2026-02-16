import { useEffect, useState } from "react";
import { ChevronRight, Edit2, Eye, EyeOff,BadgeCheck } from "lucide-react";
import avatar from "../../assets/avatar.png";
import { useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import ThreeDotLoader from "../../Loader";
import { FiEdit, FiAlertCircle } from "react-icons/fi";
import BankDetailsEditModal from "./BankDetailsEditModal";
import AadharDetailsEditModal from "./AadharDetailsEditModal";
import PanDetailsEditModal from "./PanDetailsEditModal";
import GstDetailsEditModal from "./GstDetailsEditModal";
import { Notification } from "../../Notification";
import UpdateRateCardPopup from "./UpdateRateCardPopup"
import EarlyCODModal from "../Billings/EarlyCodPopup";
import UpdateCreditLimitEditModal from "./UpdateCreditLimitModal";
import { User, MapPin, ExternalLink, CheckCircleIcon, Clock, CreditCard, IdCard, FileText, Settings, Info, Wallet } from "lucide-react";
import KamDetailsEditModal from "./KamDetailsEditModal";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
  const [rateCardType, setRateCardType] = useState("");
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("session");
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/user/getUserById`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { id },
        }
      );

      const user = response.data.userDetails;
      // console.log("user", user);
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
  }, [showAadharEditModal, showBankEditModal]);

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

      Notification(
        `${field === "isAdminWhatsAppEnable" ? "WhatsApp" : "SMS"} notification ${value ? "enabled" : "disabled"
        }.`,
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

  const tabs = [];

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

                {admin && (
                  <button className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <FiEdit size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>

              <div className="p-4 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                {Object.entries(tabContent["Contact Details"] || {}).map(([label, value]) => {
                  // Determine verification state
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

                        {/* ✅ Show verified/unverified icons */}
                        {(isEmail || isPhone) && (
                          isVerified ? (
                            <CheckCircleIcon size={14} className="text-[#0CBB7D]" />
                          ) : (
                            <FiAlertCircle size={14} className="text-red-400" /> // unverified icon
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
                {admin && (
                  <button className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <FiEdit size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
              <div className="p-4 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {Object.entries(tabContent["Address Details"] || {}).map(
                  ([label, value]) => {
                    const isAddressField = label.toLowerCase() === "address";
                    // Only truncate on desktop (md and above)
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
                            {/* Mobile view - show full address */}
                            <p className="md:hidden text-[10px] sm:text-[12px] text-gray-700 font-[600] break-words flex-1">
                              {value}
                            </p>

                            {/* Desktop view - show truncated with tooltip */}
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
                            {/* Mobile view - show full address */}
                            <p className="md:hidden text-[10px] sm:text-[12px] text-gray-700 font-[600] break-words flex-1">
                              {value}
                            </p>

                            {/* Desktop view - show truncated with tooltip */}
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
          </div>

          {/* RIGHT SIDE - Account Info & API Details (Takes less width) */}
          <div className="lg:col-span-4 space-y-2 sm:space-y-2">
            {/* Account Information */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm sticky top-4">
              <div className="px-4 sm:px-4 py-2.5 sm:py-2.5 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xs sm:text-sm font-[600] text-gray-700 flex items-center gap-2">
                  <Info size={16} className="text-gray-600" />
                  Account Information
                </h3>
              </div>

              <div className="p-4 sm:p-4 space-y-2 sm:space-y-2">
                {[
                  {
                    label:"User ID",
                    value: userData?.userId || "N/A",
                  },
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
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-[600] ${userData?.kycStatus ? "text-[#0CBB7D]" : "text-yellow-700"
                          }`}
                      >
                        {userData?.kycStatus ? (
                          <>
                            <CheckCircleIcon size={12} />
                            Verified
                          </>
                        ) : (
                          <>
                            <Clock size={12} />
                            Pending
                          </>
                        )}
                      </span>
                    ),
                  },
                  {
                    label: "COD Cycle",
                    value: (
                      <div className="flex items-center gap-2">
                        <span>{userData?.codPlan || "Standard"}</span>
                        {admin && (
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
                          onClick={() => {setShowRateCardModal(true); setRateCardType("B2C")}}
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
                          onClick={() =>{setShowRateCardModal(true); setRateCardType("B2B")}}
                          className="text-[#0CBB7D] hover:text-green-500"
                        >
                          <FiEdit size={12} />
                        </button>
                      </div>
                    ) : (
                      userData?.b2bRateCard || "Basic Plan"
                    ),
                  },
                  {
                    label: "Referral Code",
                    value: userData?.referralCode || "N/A",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                      {item.label}
                    </p>
                    <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600] text-right">
                      {item.value}
                    </p>
                  </div>
                ))}

                {admin && userData?.referralCommissionPercentage && (
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                      Referral Commission
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600]">
                        {userData.referralCommissionPercentage}%
                      </p>
                      <button
                        onClick={() => setShowReferralModal(true)}
                        className="text-[#0CBB7D] hover:text-green-500"
                      >
                        <FiEdit size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* {admin && userData?.creditLimit && ( */}
                <div className="flex justify-between items-center">
                  <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                    Credit Limit
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] sm:text-[12px] text-gray-700 font-[600]">
                      {userData?.creditLimit || 0}
                    </p>
                    <button
                      onClick={() => setShowCreditLimitModal(true)}
                      className="text-[#0CBB7D] hover:text-green-500"
                    >
                      <FiEdit size={12} />
                    </button>
                  </div>
                </div>
                {/* )} */}

                {/* ✅ WhatsApp Notification */}
                <div className="flex justify-between items-center">
                  <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                    WhatsApp Notification
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!notificationSettings?.isAdminWhatsAppEnable}
                      onChange={(e) =>
                        handleNotificationToggle("isAdminWhatsAppEnable", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-[#0CBB7D] transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </label>
                </div>

                {/* ✅ SMS Notification */}
                <div className="flex justify-between items-center">
                  <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                    SMS Notification
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!notificationSettings?.isAdminSMSEnable}
                      onChange={(e) =>
                        handleNotificationToggle("isAdminSMSEnable", e.target.checked)
                      }
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

                {admin && (
                  <button
                    onClick={() => setShowKAMEditModal(true)}
                    className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FiEdit size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>

              {/* ALIGN KEY LEFT & VALUE RIGHT */}
              <div className="p-4 space-y-3 w-full">
                {Object.entries(tabContent["KAM Details"] || {}).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-2"
                  >
                    {/* LEFT SIDE LABEL */}
                    <p className="text-[11px] sm:text-[12px] font-semibold text-gray-500">
                      {label}:
                    </p>

                    {/* RIGHT SIDE VALUE */}
                    <p className="text-[11px] sm:text-[12px] text-gray-700 font-semibold break-words">
                      {value}
                    </p>
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
                  <button
                    onClick={() => window.open("https://api-docs.shipexindia.com/", "_blank")}
                    className="hover:text-green-500 text-[#0CBB7D] transition-colors"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-[12px] font-[600]">
                  <p>API Access</p>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={apiAccess}
                      onChange={handleApiToggle}
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-[#0CBB7D] transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </label>
                </div>

              </div>
            </div>

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
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <ThreeDotLoader />
        </div>
      ) : (
        <>
          {/* Header Banner with Gradient */}
          <div className="relative bg-gradient-to-br from-[#0CBB7D]/20 via-teal-50 to-green-100 h-24 sm:h-36">
            {/* Subtle overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0CBB7D]/15 via-cyan-200/25 to-purple-200/30"></div>

            {/* Decorative circles */}
            <div className="absolute top-10 left-20 w-32 h-32 bg-gradient-to-br from-[#0CBB7D]/40 to-cyan-300/40 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 right-32 w-40 h-40 bg-gradient-to-br from-green-300/40 to-purple-300/40 rounded-full blur-2xl"></div>
          </div>

          {/* Profile Section */}
          <div className="max-w-full mx-auto px-1 sm:px-2 lg:px-2 -mt-14 sm:-mt-24">
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-4 lg:p-4 mb-2 sm:mb-2">
              <div className="flex flex-row sm:flex-row items-center sm:items-start gap-4 sm:gap-4">
                {/* Profile Image with Edit Icon */}
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center p-1">
                    <img
                      src={userData?.logo || avatar}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  </div>
                </div>

                {/* Profile Info */}
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

                    {/* Block/Unblock Toggle (Admin Only) */}
                    {admin && (
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

            {/* Tab Content */}
            <div className="pb-6 sm:pb-8">{renderTabContent()}</div>
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
        refreshUserData={fetchUsers}    // 🔥 passes fetchUsers to modal
      />

      <KamDetailsEditModal
        isOpen={showKAMEditModal}
        onClose={() => setShowKAMEditModal(false)}
        userId={id}
      />

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
            // fetchUsers();
          }}
          onSubmit={() => {
            setShowRateCardModal(false);
            fetchUsers();
          }}
          rateCardType={rateCardType}
        />
      )}


    </div>
  );
}
