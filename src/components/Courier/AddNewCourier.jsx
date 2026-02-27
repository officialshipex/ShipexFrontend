import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import NimbusPostAdd from "./NimbusPost/NimbuspostAdd";
import Shiprocket from "./ShipRocket/ShipRocketAdd";
import Dtdc from "./DTDC/DtdcAdd";
import Delhivery from "./Delhivery/DelhiveryAdd";
import ShreeMaruti from "./ShreeMaruti/ShreeMarutiAdd";
import XpressbeesAdd from "./Xpressbees/XpressbeesAdd";
import SmartShip from "./SmartShip/SmartShipAdd";
import EcomExpressAdd from "./EcomExpress/EcomExpressAdd";
import AmazonAdd from "./Amazon/AmazonAdd";
import Ekart from "./Ekart/EkartAdd"
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import CustomDropdown from "./CustomDropdown";
import Vamaship from "./Vamaship/VamashipAdd";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";
import Loader from "../../Loader"
import { FaEllipsisV, FaTrashAlt, FaUpload, FaDownload, FaTruck } from "react-icons/fa";
import Zipypost from "./Zipypost/ZipypostAdd";
import { getCarrierLogo } from "../../Common/getCarrierLogo";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const courierOptions = [
  { value: "NimbusPost", label: "NimbusPost" },
  { value: "Shiprocket", label: "Shiprocket" },
  { value: "Dtdc", label: "Dtdc" },
  { value: "Delhivery", label: "Delhivery" },
  { value: "ShreeMaruti", label: "Shree Maruti" },
  { value: "Xpressbees", label: "Xpressbees" },
  { value: "SmartShip", label: "SmartShip" },
  { value: "EcomExpress", label: "EcomExpress" },
  { value: "Amazon", label: "Amazon Shipping" },
  { value: "Ekart", label: "Ekart" },
  { value: "Vamaship", label: "Vamaship" },
  { value: "ZipyPost", label: "ZipyPost" }
];

const AddNewCourier = ({ isSidebarAdmin }) => {
  const [selectedOption, setSelectedOption] = useState("NimbusPost");
  const [couriers, setCouriers] = useState([]);
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(false);
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [employeeAccess, setEmployeeAccess] = useState({ canView: false, canAction: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCourierSaved = () => {
    setRefresh(true);
  };

  useEffect(() => {
    const fetchAccessAndCouriers = async () => {
      try {
        if (isSidebarAdmin) {
          setEmployeeAccess({ canView: true, canAction: true });
          setShowEmployeeAuthModal(false);
        } else {
          const token = Cookies.get("session");
          const empRes = await axios.get(`${REACT_APP_BACKEND_URL}/staffRole/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const employee = empRes.data.employee;
          const canView = !!employee?.accessRights?.courier?.courier?.view;
          const canAction = !!employee?.accessRights?.courier?.courier?.action;
          setEmployeeAccess({ canView, canAction });

          if (!canView) {
            setShowEmployeeAuthModal(true);
            return;
          }
        }

        const response = await axios.get(`${REACT_APP_BACKEND_URL}/allCourier/couriers`);
        const updatedCouriers = response.data.map((courier) => ({
          ...courier,
          isActive: courier.isActive ?? true
        }));
        setCouriers(updatedCouriers);
        setRefresh(false);
      } catch (error) {
        setShowEmployeeAuthModal(true);
      }
    };

    fetchAccessAndCouriers();
  }, [refresh, isSidebarAdmin]);

  const canAction = isSidebarAdmin || employeeAccess.canAction;

  const toggleStatus = async (index) => {
    const courier = couriers[index];
    const provider = courier.courierProvider;
    const newStatus = courier.status === "Enable" ? "Disable" : "Enable";

    try {
      setLoading(true);
      await axios.post(`${REACT_APP_BACKEND_URL}/allCourier/updateStatus`, {
        provider,
        status: newStatus
      });

      setCouriers((prevCouriers) =>
        prevCouriers.map((c, i) =>
          i === index ? { ...c, status: newStatus } : c
        )
      );
      Notification('Status updated!', "success");
    } catch (err) {
      Notification('Failed to update status', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (courier) => {
    try {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".csv,.xlsx";
      fileInput.click();

      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);

        const response = await fetch(`${REACT_APP_BACKEND_URL}/serviceablePincode/${courier}/upload-pincode`, {
          method: "POST",
          body: formData,
        });
        setLoading(false);

        if (!response.ok) throw new Error("Failed to upload pincodes");

        const data = await response.json();
        Notification(data.message || "Pincodes uploaded successfully!", "success");
      };
    } catch (error) {
      setLoading(false);
      console.error("Upload Error:", error);
      Notification("Error uploading serviceable pincodes", "error");
    }
  };


  const handleDownload = async (courier) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${REACT_APP_BACKEND_URL}/serviceablePincode/${courier}/download-pincode`
      );
      setLoading(false);

      if (!response.ok) throw new Error("Failed to download pincodes");

      const blob = await response.blob();
      const csvBlob = new Blob([blob], { type: "text/csv;charset=utf-8;" });

      const url = window.URL.createObjectURL(csvBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `serviceable_pincodes_${courier}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setLoading(false);
      console.error("Download Error:", error);
      Notification("Error downloading serviceable pincodes", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${REACT_APP_BACKEND_URL}/allCourier/deleteCourier/${id}`);
      setCouriers((prevCouriers) => prevCouriers.filter((courier) => courier._id !== id));
      Notification("Courier deleted successfully!", "success");
    } catch (error) {
      Notification("Failed to delete courier.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".menu-popup") && !event.target.closest(".menu-button")) {
        setMenuOpen(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const existingCourierProviders = couriers.map((courier) => courier.courierProvider);
  const availableOptions = courierOptions.filter(
    (option) => !existingCourierProviders.includes(option.value)
  );

  const getInputField = () => {
    const props = { onCourierSaved: handleCourierSaved, canAction };
    switch (selectedOption) {
      case "NimbusPost":
        return <NimbusPostAdd {...props} />;
      case "Shiprocket":
        return <Shiprocket {...props} />;
      case "Dtdc":
        return <Dtdc {...props} />;
      case "Delhivery":
        return <Delhivery {...props} />;
      case "ShreeMaruti":
        return <ShreeMaruti {...props} />;
      case "Xpressbees":
        return <XpressbeesAdd {...props} />;
      case "EcomExpress":
        return <EcomExpressAdd {...props} />;
      case "Amazon":
        return <AmazonAdd {...props} />;
      case "Ekart":
        return <Ekart {...props} />;
      case "Vamaship":
        return <Vamaship {...props} />;
      case "ZipyPost":
        return <Zipypost {...props} />;
      case "SmartShip":
        return <SmartShip {...props} />;
      default:
        return null;
    }
  };

  if (!isSidebarAdmin && showEmployeeAuthModal) {
    return (
      <EmployeeAuthModal
        employeeModalShow={showEmployeeAuthModal}
        employeeModalClose={() => {
          setShowEmployeeAuthModal(false);
          window.history.back();
        }}
      />
    );
  }

  return (isSidebarAdmin || employeeAccess.canView) && (
    <div className="max-w-full sm:px-2 mx-auto">
      {/* Add Courier Section */}
      <div className="bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100 mb-2">
        <div className="flex items-center gap-2 mb-3 border-b border-gray-50 pb-2">
          <FaTruck className="text-[#0CBB7D] w-3.5 h-3.5" />
          <h2 className="text-[12px] md:text-[14px] text-gray-800 font-[700]">
            Add Courier
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-2">
          <div className="w-full lg:w-1/4">
            <CustomDropdown
              label="Select Courier Provider"
              options={availableOptions}
              selected={selectedOption}
              onChange={setSelectedOption}
            />
          </div>
          <div className="w-full lg:flex-1">{getInputField()}</div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden bg-white mt-2">
        <div className="h-[520px] overflow-y-auto custom-scrollbar">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="text-white bg-[#0CBB7D] font-[600] text-[12px]">
                <th className="py-2 px-3 text-center">Sr.</th>
                <th className="py-2 px-3 text-left">Courier Name</th>
                <th className="py-2 px-3 text-left">Provider</th>
                <th className="py-2 px-3 text-center">COD Contract</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {couriers.length > 0 ? (
                couriers.map((courier, index) => (
                  <tr
                    key={courier._id}
                    className="border-b border-gray-100 text-gray-600 hover:bg-gray-50 transition-all text-[12px] font-[500]"
                  >
                    <td className="py-2.5 px-4 text-center">{index + 1}</td>
                    <td className="py-2.5 px-3 text-gray-700 font-[600]">{courier.courierName}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <img src={getCarrierLogo(courier.courierProvider)} alt="" className="w-6 h-6 object-contain" />
                        <span className="text-[#0CBB7D] font-[600]">{courier.courierProvider}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">{courier.CODDays} Days</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex justify-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={courier.status === "Enable"}
                            onChange={() => toggleStatus(index)}
                            disabled={!canAction}
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0CBB7D]"></div>
                        </label>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center items-center gap-4">
                        <button
                          onClick={() => canAction && handleUpload(courier.courierName)}
                          className={`p-1.5 rounded-full transition-all ${canAction ? "text-[#0CBB7D] hover:bg-green-50" : "text-gray-300 cursor-not-allowed"}`}
                          title="Upload serviceable pincode"
                          disabled={!canAction}
                        >
                          <FaUpload size={14} />
                        </button>
                        <button
                          onClick={() => canAction && handleDownload(courier.courierName)}
                          className={`p-1.5 rounded-full transition-all ${canAction ? "text-blue-500 hover:bg-blue-50" : "text-gray-300 cursor-not-allowed"}`}
                          title="Download serviceable pincode"
                          disabled={!canAction}
                        >
                          <FaDownload size={14} />
                        </button>
                        <button
                          onClick={() => canAction && handleDelete(courier._id)}
                          className={`p-1.5 rounded-full transition-all ${canAction ? "text-red-500 hover:bg-red-50" : "text-gray-300 cursor-not-allowed"}`}
                          title="Delete courier"
                          disabled={!canAction}
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-400 text-[12px] font-[500]">
                    No couriers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-2 mt-2">
        {couriers.length > 0 ? (
          couriers.map((courier, index) => {
            const isMenuOpen = menuOpen === courier._id;
            return (
              <div
                key={courier._id}
                className="bg-white px-3 py-3 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {/* <span className="absolute -top-1 -left-1 w-4 h-4 bg-[#0CBB7D] text-white rounded-full flex items-center justify-center text-[8px] font-bold border border-white z-10">
                        {index + 1}
                      </span> */}
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 p-1">
                        <img src={getCarrierLogo(courier.courierProvider)} alt="" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-[600] text-gray-700">
                        {courier.courierName}
                      </span>
                      <span className="text-[10px] text-[#0CBB7D] font-[600]">
                        {courier.courierProvider}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(isMenuOpen ? null : courier._id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 active:scale-95 transition-all menu-button"
                    >
                      <FaEllipsisV size={14} />
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 w-48 py-1 animate-popup-in menu-popup">
                        <button
                          onClick={() => {
                            handleUpload(courier.courierName);
                            setMenuOpen(null);
                          }}
                          disabled={!canAction}
                          className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-[600] text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <FaUpload className="text-[#0CBB7D]" size={12} /> Upload Pincodes
                        </button>
                        <button
                          onClick={() => {
                            handleDownload(courier.courierName);
                            setMenuOpen(null);
                          }}
                          disabled={!canAction}
                          className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-[600] text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <FaDownload className="text-blue-500" size={12} /> Download Pincodes
                        </button>
                        <div className="border-t border-gray-50 my-1"></div>
                        <button
                          onClick={() => {
                            handleDelete(courier._id);
                            setMenuOpen(null);
                          }}
                          disabled={!canAction}
                          className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-[600] text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                        >
                          <FaTrashAlt size={12} /> Delete Courier
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-700">COD Contract</span>
                    <span className="text-gray-700 font-[600]">{courier.CODDays} Days</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-gray-700">Status</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-[600] ${courier.status === "Enable" ? "text-[#0CBB7D]" : "text-gray-400"}`}>
                        {courier.status}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={courier.status === "Enable"}
                          onChange={() => toggleStatus(index)}
                          disabled={!canAction}
                        />
                        <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#0CBB7D]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400 text-[12px] font-[500]">No couriers found.</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-30 z-[100]">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default AddNewCourier;
