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
// import { toast } from "react-toastify";
import EcomExpressAdd from "./EcomExpress/EcomExpressAdd";
import AmazonAdd from "./Amazon/AmazonAdd";
import Ekart from "./Ekart/EkartAdd"
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import CustomDropdown from "./CustomDropdown"; // <-- Import custom dropdown
import Vamaship from "./Vamaship/VamashipAdd";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";
import Loader from "../../Loader"
import { FaEllipsisV, FaTrashAlt, FaUpload, FaDownload } from "react-icons/fa";
import Zipypost from "./Zipypost/ZipypostAdd";


const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const courierOptions = [
  { value: "NimbusPost", label: "NimbusPost" },
  { value: "Shiprocket", label: "Shiprocket" },
  { value: "Dtdc", label: "Dtdc" },
  { value: "Delhivery", label: "Delhivery" },
  { value: "Shree Maruti", label: "Shree Maruti" },
  { value: "Xpressbees", label: "Xpressbees" },
  { value: "SmartShip", label: "SmartShip" },
  { value: "EcomExpress", label: "EcomExpress" },
  { value: "Amazon Shipping", label: "Amazon Shipping" },
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

        const response = await axios.get(`${REACT_APP_BACKEND_URL}/b2b/couriers/getAllCouriers`);
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
      await axios.post(`${REACT_APP_BACKEND_URL}/b2b/couriers/updateCourierStatus`, {
        provider,    // You may not need provider in body if in URL
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
  // Upload serviceable pincodes
  const handleUpload = async (courier) => {
    try {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".csv,.xlsx"; // support CSV and XLSX
      fileInput.click();

      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true); // start loader

        const response = await fetch(`${REACT_APP_BACKEND_URL}/b2b/couriers/${courier}/uploadPincode`, {
          method: "POST",
          body: formData,
        });
        // console.log("res pinc", response)
        setLoading(false); // stop loader

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


  // Download serviceable pincodes
  const handleDownload = async (courier) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${REACT_APP_BACKEND_URL}/b2b/couriers/${courier}/downloadPincode`
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
      await axios.delete(`${REACT_APP_BACKEND_URL}/b2b/couriers/deleteCourier/${id}`);
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
      // Close menu if clicking outside any menu
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
    switch (selectedOption) {
      case "NimbusPost":
        return <NimbusPostAdd canAction={canAction} />;
      case "Shiprocket":
        return <Shiprocket canAction={canAction} />;
      case "DTDC":
        return <Dtdc canAction={canAction} />;
      case "Delhivery":
        return <Delhivery onCourierSaved={handleCourierSaved} canAction={canAction} />;
      case "ShreeMaruti":
        return <ShreeMaruti onCourierSaved={handleCourierSaved} canAction={canAction} />;
      case "Xpressbees":
        return <XpressbeesAdd onCourierSaved={handleCourierSaved} canAction={canAction} />;
      case "EcomExpress":
        return <EcomExpressAdd onCourierSaved={handleCourierSaved} canAction={canAction} />;
      case "Amazon":
        return <AmazonAdd onCourierSaved={handleCourierSaved} canAction={canAction} />;
      case "Ekart":
        return <Ekart canAction={canAction} />
      case "Vamaship":
        return <Vamaship canAction={canAction} />
      case "ZipyPost":
        return <Zipypost canAction={canAction} />
      default:
        return <SmartShip canAction={canAction} />;
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
    <div>
      {/* Loader */}


      <h2 className="text-[12px] md:text-[18px] text-gray-700 font-[600] mb-1">
        Add Courier
      </h2>

      <div className="mb-4">
        <CustomDropdown
          label="Select Courier"
          options={availableOptions}
          selected={selectedOption}
          onChange={setSelectedOption}
        />
        <div className="my-2">{getInputField()}</div>
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-md rounded-lg hidden md:table">
          <thead className="bg-[#0CBB7D] text-white">
            <tr className="text-white bg-[#0CBB7D] border border-[#0CBB7D] font-[600] text-[12px]">
              <th className="py-2 px-3 text-center">S.No</th>
              <th className="py-2 px-3 text-center">Courier Name</th>
              <th className="py-2 px-3 text-center">Courier Provider</th>
              <th className="py-2 px-3 text-center">COD Contract</th>
              <th className="py-2 px-3 text-center">Status</th>
              <th className="py-2 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {couriers.length > 0 ? (
              couriers.map((courier, index) => (
                <tr
                  key={courier._id}
                  className="border border-gray-300 font-[400] text-gray-500 hover:bg-gray-50 transition-all text-[12px]"
                >
                  <td className="py-2 px-3 text-center">{index + 1}</td>
                  <td className="py-2 px-3 text-center">{courier.courierName}</td>
                  <td className="py-2 px-3 text-center">{courier.courierProvider}</td>
                  <td className="py-2 px-3 text-center">{courier.CODDays}</td>
                  <td className="py-2 px-3 text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={courier.status === "Enable"}
                        onChange={() => toggleStatus(index)}
                        disabled={!canAction}
                      />
                      <div
                        className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${courier.status === "Enable" ? "bg-[#0CBB7D]" : "bg-gray-300"
                          }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${courier.status === "Enable" ? "translate-x-5" : ""
                            }`}
                        ></span>
                      </div>
                    </label>
                  </td>
                  <td className="px-3 py-2 text-center flex justify-center items-center gap-3">
                    {/* Upload */}
                    <div className="relative group">
                      <div
                        onClick={() => canAction && handleUpload(courier.courierName)}
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition ${canAction
                          ? "bg-[#0CBB7D] hover:bg-green-500 cursor-pointer"
                          : "bg-gray-400 cursor-not-allowed opacity-70"
                          }`}
                      >
                        <FaUpload className="text-white text-[12px]" />
                      </div>
                      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-20 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition pointer-events-none">
                        Upload serviceable pincode
                      </span>

                    </div>

                    {/* Download */}
                    <div className="relative group">
                      <div
                        onClick={() => canAction && handleDownload(courier.courierName)}
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition ${canAction
                          ? "bg-[#0CBB7D] hover:bg-green-500 cursor-pointer"
                          : "bg-gray-400 cursor-not-allowed opacity-70"
                          }`}
                      >
                        <FaDownload className="text-white text-[12px]" />
                      </div>
                      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-20 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition pointer-events-none">
                        Download serviceable pincode
                      </span>
                    </div>

                    {/* Delete */}
                    <div className="relative group">
                      <div
                        onClick={() => canAction && handleDelete(courier._id)}
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition ${canAction
                          ? "bg-red-500 hover:bg-red-700 cursor-pointer"
                          : "bg-gray-400 cursor-not-allowed opacity-70"
                          }`}
                      >
                        <FaTrashAlt className="text-white text-[12px]" />
                      </div>
                      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-20 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition pointer-events-none">
                        Delete courier
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-2 text-center text-gray-500">
                  No data available in table
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Table - Card Format */}
      <div className="md:hidden space-y-3">
        {couriers.length > 0 ? (
          couriers.map((courier, index) => {
            const isMenuOpen = menuOpen === courier._id;
            return (
              <div
                key={courier._id}
                className="relative bg-white rounded-lg shadow-md p-5 border border-gray-200 overflow-visible"
              >
                {/* 3-dot menu */}
                <button
                  onClick={() => setMenuOpen(isMenuOpen ? null : courier._id)}
                  className="menu-button absolute top-2 right-5 w-6 h-6 flex items-center justify-center bg-[#0CBB7D] rounded-full text-white hover:bg-green-500 transition shadow-md z-10"
                >
                  <FaEllipsisV size={12} />
                </button>


                {/* Card Content */}
                <div className="mt-6 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">S.No:</span>
                    <span className="text-gray-800">{index + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Courier Name:</span>
                    <span className="text-gray-800">{courier.courierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Provider:</span>
                    <span className="text-gray-800">{courier.courierProvider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">COD Days:</span>
                    <span className="text-gray-800">{courier.CODDays}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600">Status:</span>
                    <label className="inline-flex items-center cursor-pointer ml-2">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={courier.status === "Enable"}
                        onChange={() => toggleStatus(index)}
                        disabled={!canAction}
                      />
                      <div
                        className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${courier.status === "Enable" ? "bg-[#0CBB7D]" : "bg-gray-300"
                          }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${courier.status === "Enable" ? "translate-x-5" : ""
                            }`}
                        ></span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Popup Menu */}
                {isMenuOpen && (
                  <div className="menu-popup absolute right-2 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-[180px]">

                    <button
                      onClick={() => {
                        handleUpload(courier.courierName);
                        setMenuOpen(null);
                      }}
                      disabled={!canAction}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-100 transition ${canAction ? "text-gray-700" : "opacity-50 cursor-not-allowed"
                        }`}
                    >
                      <FaUpload className="text-[#0CBB7D]" /> Upload serviceable pincode
                    </button>
                    <button
                      onClick={() => {
                        handleDownload(courier.courierName);
                        setMenuOpen(null);
                      }}
                      disabled={!canAction}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-100 transition ${canAction ? "text-gray-700" : "opacity-50 cursor-not-allowed"
                        }`}
                    >
                      <FaDownload className="text-[#0CBB7D]" /> Download serviceable pincode
                    </button>
                    <button
                      onClick={() => {
                        handleDelete(courier._id);
                        setMenuOpen(null);
                      }}
                      disabled={!canAction}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-red-50 transition ${canAction ? "text-red-600" : "opacity-50 cursor-not-allowed"
                        }`}
                    >
                      <FaTrashAlt className="text-red-500" /> Delete courier
                    </button>
                  </div>
                )}
              </div>

            );
          })
        ) : (
          <div className="text-center text-gray-500 text-sm mt-4">
            No data available in table
          </div>
        )}
      </div>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-30 z-50">
          <Loader />
        </div>
      )}

    </div>
  );

};

export default AddNewCourier;
