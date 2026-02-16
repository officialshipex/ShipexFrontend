import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import CourierServiceList from "./CourierServiceList";
// import { toast } from "react-toastify";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import CustomDropdown from "./Dropdown"
import { Notification } from "../../Notification"
import Cookies from "js-cookie"

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

  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        if (isSidebarAdmin) {
          setEmployeeAccess({ canView: true, canAction: true });
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
        setCourierProviders([]);
        setShowEmployeeAuthModal(true);
      }
    };

    if (location.state?.courierToEdit) {
      const editCourier = location.state.courierToEdit;
      setFormData({
        _id: editCourier._id || null, // Ensure _id is included!
        id: editCourier.id || null,
        provider: editCourier.provider || "",
        courier: editCourier.courier || "",
        courierType: editCourier.courierType || "",
        name: editCourier.name || "",
        status: editCourier.status || "",
      });
      setSelectedProvider(editCourier.provider);
      handleChange({ target: { name: "provider", value: editCourier.provider } });
    }

    fetchCouriers();

    if (location.state?.courierToEdit) {
      setFormData(location.state.courierToEdit);
      setSelectedProvider(location.state.courierToEdit.provider);
      handleChange({ target: { name: "provider", value: location.state.courierToEdit.provider } });
    }
    // eslint-disable-next-line
  }, [location.state, isSidebarAdmin, refresh]);

  const canSave = isSidebarAdmin || employeeAccess.canAction;
  const canView = isSidebarAdmin || employeeAccess.canView;
  const canUpdate = isSidebarAdmin || employeeAccess.canUpdate;

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "provider") {
      setSelectedProvider(value);

      try {
        let response;
        let services = [];

        switch (value) {
          case "NimbusPost":
            response = await axios.get(`${REACT_APP_BACKEND_URL}/NimbusPost/getCourierServices`);
            services = response.data.map((item) => item.service);
            break;
          case "Xpressbees":
            response = await axios.get(`${REACT_APP_BACKEND_URL}/Xpressbees/getCourierList`);
            services = response.data.map((item) => item.service);
            break;
          case "Shiprocket":
            response = await axios.get(`${REACT_APP_BACKEND_URL}/Shiprocket/getAllActiveCourierServices`);
            services = response.data.map((item) => item.service);
            break;
          case "Dtdc":
            services = ["B2C SMART EXPRESS", "B2C PRIORITY", "B2C GROUND ECONOMY"];
            break;
          default:
            services = [];
            break;
        }

        setProviderServices(services);
        setFormData((prev) => ({ ...prev, courier: "" }));
      } catch (error) {
        console.error(`Error fetching ${value} services:`, error);
        setProviderServices([]);
      }
    }
  };
  // console.log("location", location.state?.courierToEdit._id)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await axios.put(`${REACT_APP_BACKEND_URL}/courierServices/couriers/${formData._id}`, formData);
      } else {
        await axios.post(`${REACT_APP_BACKEND_URL}/courierServices/couriers`, formData);
      }
      Notification("Courier saved successfully!", "success");
      setRefresh(true);
      setFormData({
        _id: null, // Reset here as well!
        id: null,
        provider: "",
        courier: "",
        courierType: "",
        name: "",
        status: "",
      });
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
          window.history.back();
        }}
      />
    );
  }

  return (
    canView && (
      <div className="max-w-full mx-auto">
        <h2 className="text-[12px] md:text-[18px] text-gray-700 font-[600] mb-1">Courier Services Form</h2>

        <form onSubmit={handleSubmit} className="flex sm:flex-row flex-col gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Provider */}
            <div className="w-full sm:w-auto">
              <CustomDropdown
                label="Provider"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                options={[...new Set(courierProviders.map((c) => c.courierProvider))]}
                placeholder="Select Provider"
                className=""
              />
            </div>

            {/* Courier */}
            {["NimbusPost", "Xpressbees", "Shiprocket", "Dtdc"].includes(selectedProvider) && (
              <div className="">
                <CustomDropdown
                  label={selectedProvider === "Dtdc" ? "Service Type" : "Courier"}
                  name="courier"
                  value={formData.courier}
                  onChange={handleChange}
                  options={providerServices}
                  placeholder={`Select ${selectedProvider === "Dtdc" ? "Service Type" : "Courier"}`}
                  className="w-full max-w-[180px]"
                />
              </div>
            )}

            {/* Courier Type */}
            <div className="w-full sm:w-auto">
              <CustomDropdown
                label="Courier Type"
                name="courierType"
                value={formData.courierType}
                onChange={handleChange}
                options={["Domestic (Surface)", "Domestic (Air)"]}
                placeholder="Select Type"
                className="w-full max-w-[180px]"
              />
            </div>

            {/* Status */}
            <div className="w-full sm:w-auto">
              <CustomDropdown
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={["Enable", "Disable"]}
                placeholder="Select Status"
                className="w-full max-w-[180px]"
              />
            </div>

          </div>
          <div className="flex gap-2 w-full">
            {/* Name */}
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] sm:text-[12px] text-gray-500">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full sm:w-auto max-w-full px-3 py-2 h-8 border rounded-lg text-[12px] focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className={`bg-[#0CBB7D] font-[600] text-white h-8 px-3 text-[10px] sm:text-[12px] rounded-lg ${!canSave ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                disabled={!canSave}
              >
                Save
              </button>
            </div>
          </div>
        </form>

        <CourierServiceList refresh={refresh} canUpdate={canUpdate} />
      </div>



    )
  );
}
