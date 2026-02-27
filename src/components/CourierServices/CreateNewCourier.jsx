import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import CourierServiceList from "./CourierServiceList";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import CustomDropdown from "./Dropdown"
import { Notification } from "../../Notification"
import Cookies from "js-cookie"
import { FaEdit,FaPlus  } from "react-icons/fa";
import { getUserInfoFromToken } from "../../utils/session";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CreateNewCourier({ isSidebarAdmin }) {
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [employeeAccess, setEmployeeAccess] = useState({ canView: false, canAction: false, isAdmin: false });
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    _id: null,
    id: null,
    provider: "",
    courier: "",
    courierType: "",
    name: "",
    status: "",
  });

  const [courierProviders, setCourierProviders] = useState([]);
  const [providerServices, setProviderServices] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [refresh, setRefresh] = useState(false);

  const fetchServicesForProvider = async (providerName) => {
    try {
      let services = [];
      switch (providerName) {
        case "NimbusPost":
          const nimbusRes = await axios.get(`${REACT_APP_BACKEND_URL}/NimbusPost/getCourierServices`);
          services = nimbusRes.data.map((item) => item.service);
          break;
        case "Xpressbees":
          const xpressRes = await axios.get(`${REACT_APP_BACKEND_URL}/Xpressbees/getCourierList`);
          services = xpressRes.data.map((item) => item.service);
          break;
        case "Shiprocket":
          const shipRes = await axios.get(`${REACT_APP_BACKEND_URL}/Shiprocket/getAllActiveCourierServices`);
          services = shipRes.data.map((item) => item.service);
          break;
        case "Dtdc":
          services = ["B2C SMART EXPRESS", "B2C PRIORITY", "B2C GROUND ECONOMY"];
          break;
        default:
          services = [];
          break;
      }
      setProviderServices(services);
    } catch (error) {
      console.error(`Error fetching ${providerName} services:`, error);
      setProviderServices([]);
    }
  };

  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const userInfo = getUserInfoFromToken();
        const isMainAdmin = userInfo?.type !== "employee" && (userInfo?.isAdmin || userInfo?.adminTab);

        if (isSidebarAdmin || isMainAdmin) {
          setEmployeeAccess({ canView: true, canAction: true, canUpdate: true });
          setShowEmployeeAuthModal(false);
        } else {
          const token = Cookies.get("session");
          const empRes = await axios.get(`${REACT_APP_BACKEND_URL}/staffRole/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const employee = empRes.data.employee;
          const canView = !!employee?.accessRights?.courier?.["courier service"]?.view;
          const canAction = !!employee?.accessRights?.courier?.["courier service"]?.action;
          const canUpdate = !!employee?.accessRights?.courier?.["courier service"]?.update;
          setEmployeeAccess({ canView, canAction, canUpdate });
          if (!canView) {
            setShowEmployeeAuthModal(true);
            return;
          }
          setShowEmployeeAuthModal(false);
        }

        const response = await axios.get(`${REACT_APP_BACKEND_URL}/allCourier/couriers`);
        setCourierProviders(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        const userInfo = getUserInfoFromToken();
        const isMainAdmin = userInfo?.type !== "employee" && (userInfo?.isAdmin || userInfo?.adminTab);
        if (isMainAdmin) {
          setEmployeeAccess({ canView: true, canAction: true, canUpdate: true });
          setShowEmployeeAuthModal(false);
        } else {
          setCourierProviders([]);
          setShowEmployeeAuthModal(true);
        }
      }
    };

    fetchCouriers();

    if (location.state?.courierToEdit) {
      const editCourier = location.state.courierToEdit;
      setFormData({
        _id: editCourier._id || null,
        id: editCourier.id || null,
        provider: editCourier.provider || "",
        courier: editCourier.courier || "",
        courierType: editCourier.courierType || "",
        name: editCourier.name || "",
        status: editCourier.status || "",
      });
      setSelectedProvider(editCourier.provider);
      fetchServicesForProvider(editCourier.provider);
    }
  }, [location.state, isSidebarAdmin, refresh]);

  const canSave = isSidebarAdmin || employeeAccess.canAction || employeeAccess.canUpdate;
  const canView = isSidebarAdmin || employeeAccess.canView;
  const canUpdate = isSidebarAdmin || employeeAccess.canUpdate;

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "provider") {
      setSelectedProvider(value);
      setFormData((prev) => ({ ...prev, courier: "" }));
      fetchServicesForProvider(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.provider || !formData.name || !formData.status || !formData.courierType || (providerServices.length > 0 && !formData.courier)) {
      Notification("Please fill all required fields", "info");
      return;
    }

    try {
      if (formData._id) {
        await axios.put(`${REACT_APP_BACKEND_URL}/courierServices/couriers/${formData._id}`, formData);
      } else {
        await axios.post(`${REACT_APP_BACKEND_URL}/courierServices/couriers`, formData);
      }
      Notification("Courier saved successfully!", "success");
      setRefresh(prev => !prev);
      setFormData({
        _id: null,
        id: null,
        provider: "",
        courier: "",
        courierType: "",
        name: "",
        status: "",
      });
      setProviderServices([]);
      setSelectedProvider("");
    } catch (error) {
      Notification("Error saving courier", "error");
      console.error("Error saving courier:", error);
    }
  };


  if (!canSave && showEmployeeAuthModal) {
    return (
      <EmployeeAuthModal
        employeeModalShow={showEmployeeAuthModal}
        employeeModalClose={() => {
          setShowEmployeeAuthModal(false);
          if (window.history.length > 1) {
            window.history.back();
          } else {
            navigate("/adminDashboard");
          }
        }}
      />
    );
  }

  return (
    canView && (
      <div className="max-w-full sm:px-2 mx-auto">
        <div className="bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100 mb-2">
          <div className="flex items-center gap-2 mb-3 border-b border-gray-50">
            {formData._id ? (
              <FaEdit className="text-[#0CBB7D] w-3.5 h-3.5" />
            ) : (
              <FaPlus className="text-[#0CBB7D] w-3.5 h-3.5" />
            )}

            <h2 className="text-[12px] md:text-[14px] text-gray-700 font-[600]">
              {formData._id ? "Edit Courier Service" : "Add New Courier Service"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {/* Provider */}
              <CustomDropdown
                label="Provider"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                options={[...new Set(courierProviders.map((c) => c.courierProvider))]}
                placeholder="Select Provider"
              />

              {/* Courier */}
              <CustomDropdown
                label={selectedProvider === "Dtdc" ? "Service Type" : "Courier"}
                name="courier"
                value={formData.courier}
                onChange={handleChange}
                options={providerServices}
                placeholder={selectedProvider ? `Select ${selectedProvider === "Dtdc" ? "Service Type" : "Courier"}` : "Select Provider first"}
              />

              {/* Courier Type */}
              <CustomDropdown
                label="Courier Type"
                name="courierType"
                value={formData.courierType}
                onChange={handleChange}
                options={["Domestic (Surface)", "Domestic (Air)"]}
                placeholder="Select Type"
              />

              {/* Status */}
              <CustomDropdown
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={["Enable", "Disable"]}
                placeholder="Select Status"
              />

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] sm:text-[12px] font-[600] text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[10px] sm:text-[12px] focus:outline-none focus:border-[#0CBB7D] transition-all font-[600] text-gray-700"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className={`bg-[#0CBB7D] font-[700] text-white py-2 px-3 text-[10px] sm:text-[12px] rounded-lg shadow-sm transition-all hover:bg-opacity-90 active:scale-95 ${!canSave ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!canSave}
              >
                {formData._id ? "Update Courier" : "Save Courier"}
              </button>
            </div>
          </form>
        </div>

        <CourierServiceList refresh={refresh} canUpdate={canUpdate} />
      </div>
    )
  );
}
