import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaTruck, FaPlane, FaSearch, FaEdit, FaChevronDown, FaCheck, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import { Notification } from "../../Notification";
import CustomDropdown from "./Dropdown";
import { getCarrierLogo } from "../../Common/getCarrierLogo";
import Cookies from "js-cookie";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// --- Modal Component ---
const ChangeProviderModal = ({ isOpen, onClose, selectedServices, onApply }) => {
  const [providers, setProviders] = useState([]);
  const [targetProvider, setTargetProvider] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProviders();
    }
  }, [isOpen]);

  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/allCourier/couriers`);
      setProviders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching providers:", err);
    }
  };

  if (!isOpen) return null;

  const firstProvider = selectedServices[0]?.provider;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-visible transform transition-all animate-popup-in border border-gray-100 relative">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-[14px] font-bold text-gray-700 flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg text-[#0CBB7D]">
              <FaTruck size={18} />
            </div>
            Change Provider
          </h2>
          <p className="text-[12px] text-gray-500 mt-1">Switch account for {selectedServices.length} service(s)</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-gray-700">Current Provider</label>
            <div className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-[12px] font-semibold text-[#0CBB7D]">
              {firstProvider}
            </div>
          </div>

          <div className="space-y-1.5">
            <CustomDropdown
              label="Select New Provider"
              value={targetProvider}
              onChange={(e) => setTargetProvider(e.target.value)}
              options={[...new Set(providers.map((p) => p.courierName))]}
              placeholder="Select Provider"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[12px] font-bold text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setLoading(true);
              onApply(targetProvider).finally(() => setLoading(false));
            }}
            disabled={!targetProvider || loading}
            className={`px-4 py-2 rounded-lg text-[12px] font-bold text-white transition-all 
              ${(!targetProvider || loading) ? "bg-gray-300 cursor-not-allowed" : "bg-[#0CBB7D] hover:bg-[#0aa66e] active:scale-95 shadow-sm"}`}
          >
            {loading ? "Processing..." : "Apply Changes"}
          </button>
        </div>

        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all"
          onClick={onClose}
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
};

const CourierServiceList = ({ refresh, canUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [couriers, setCouriers] = useState([]);
  const [filteredCouriers, setFilteredCouriers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isChangeProviderModalOpen, setIsChangeProviderModalOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [serviceToChangeProvider, setServiceToChangeProvider] = useState(null);

  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/courierServices/couriers`
        );

        if (Array.isArray(response.data)) {
          const updatedCouriers = response.data.map((courier) => ({
            ...courier,
            status: courier.status === "Enable" ? "Enable" : "Disable",
          }));
          setCouriers(updatedCouriers);
        }
      } catch (error) {
        console.error("Error fetching couriers:", error);
      }
    };
    fetchCouriers();
  }, [refresh]);

  useEffect(() => {
    let result = couriers;

    if (searchQuery) {
      result = result.filter(courier =>
        courier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        courier.provider?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(courier => courier.status === statusFilter);
    }

    setFilteredCouriers(result);
  }, [searchQuery, statusFilter, couriers]);

  const toggleStatus = async (index, courierId, currentStatus) => {
    const newStatus = currentStatus === "Enable" ? "Disable" : "Enable";
    try {
      setCouriers((prevCouriers) =>
        prevCouriers.map((courier) =>
          courier._id === courierId ? { ...courier, status: newStatus } : courier
        )
      );

      await axios.put(`${REACT_APP_BACKEND_URL}/courierServices/updateStatus/${courierId}`, {
        status: newStatus,
      });

      Notification(`Status updated successfully`, "success");
    } catch (error) {
      console.error("Error updating status:", error);
      Notification(`Error updating status`, "error");

      setCouriers((prevCouriers) =>
        prevCouriers.map((courier) =>
          courier._id === courierId ? { ...courier, status: currentStatus } : courier
        )
      );
    }
  };

  const editHandler = (courier) => {
    navigate("/dashboard/setup/courier-services/create", {
      state: { courierToEdit: courier },
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredCouriers.map(c => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleChangeProviderAction = () => {
    const selectedServices = filteredCouriers.filter(c => selectedIds.includes(c._id));
    if (selectedServices.length === 0) return;

    const firstProvider = selectedServices[0].provider;
    const allSame = selectedServices.every(s => s.provider === firstProvider);

    if (!allSame) {
      Notification("Multiple providers selected. Please select services from the same provider to switch accounts.", "error");
      setIsActionMenuOpen(false);
      return;
    }

    setIsChangeProviderModalOpen(true);
    setIsActionMenuOpen(false);
  };

  const handleChangeProvider = async (targetProvider) => {
    try {
      const response = await axios.post(`${REACT_APP_BACKEND_URL}/courierServices/changeProvider`, {
        serviceIds: selectedIds,
        targetProvider
      });

      if (response.data.success) {
        Notification(response.data.message, "success");
        setIsChangeProviderModalOpen(false);
        setSelectedIds([]);
        // Refresh couriers
        const res = await axios.get(`${REACT_APP_BACKEND_URL}/courierServices/couriers`);
        setCouriers(res.data);
      }
    } catch (err) {
      console.error("Error changing provider:", err);
      Notification(err.response?.data?.message || "Failed to change provider", "error");
    }
  };

  return (
    <div className="mx-auto sm:mt-2 mt-0">
      {/* Filters */}
      <div className="flex flex-row gap-2 mb-2 items-center justify-between">
        <div className="flex flex-row gap-2 items-center flex-1">
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-[12px]" />
            <input
              type="text"
              placeholder="Search Courier Service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-[10px] sm:text-[12px] focus:outline-none focus:border-[#0CBB7D] shadow-sm font-[600] text-gray-700 transition-all"
            />
          </div>
          <div className="w-full sm:w-48">
            <CustomDropdown
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={["All", "Enable", "Disable"]}
              placeholder="Select Status"
            />
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
            disabled={selectedIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all shadow-sm border
              ${selectedIds.length === 0 
                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed" 
                : "bg-[#0CBB7D] text-white border-[#0CBB7D] hover:bg-green-600 active:scale-95"}`}
          >
            <span>Actions</span>
            <FaChevronDown className={`transition-transform duration-200 ${isActionMenuOpen ? "rotate-180" : ""}`} size={10} />
          </button>

          {isActionMenuOpen && selectedIds.length > 0 && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-[100] py-1 animate-popup-in">
              <button
                onClick={handleChangeProviderAction}
                className="w-full text-left px-4 py-2 text-[11px] font-bold text-gray-600 hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-[#0CBB7D]/10 flex items-center justify-center">
                  <FaTruck size={12} />
                </div>
                Change Provider
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden">
        <div className="max-h-[calc(100vh-350px)] overflow-y-auto overflow-x-auto">
          <table className="min-w-full">
            <thead className="sticky top-0 z-10">
              <tr className="text-white bg-[#0CBB7D] font-[600] text-[12px]">
                <th className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-white/30 bg-white/20 checked:bg-white text-[#0CBB7D] accent-[#0CBB7D] focus:ring-0 cursor-pointer w-3 h-3"
                    checked={filteredCouriers.length > 0 && selectedIds.length === filteredCouriers.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="py-2 px-3 text-center">Sr.</th>
                <th className="py-2 px-3 text-left">Courier Service</th>
                <th className="py-2 px-3 text-center">Mode</th>
                <th className="py-2 px-3 text-left">Provider</th>
                <th className="py-2 px-3 text-left">Service Type</th>
                <th className="py-2 px-3 text-left">Status</th>
                <th className="py-2 px-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredCouriers.length > 0 ? (
                filteredCouriers.map((courier, index) => (
                  <tr key={courier._id} className="border-b border-gray-300 text-gray-500 hover:bg-gray-50 transition-all text-[12px]">
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-[#0CBB7D] accent-[#0CBB7D] focus:ring-[#0CBB7D]/20 cursor-pointer w-3 h-3"
                        checked={selectedIds.includes(courier._id)}
                        onChange={() => handleSelectRow(courier._id)}
                      />
                    </td>
                    <td className="py-2 px-3 text-center">{index + 1}</td>
                    <td className="py-2 px-3 text-gray-700 font-[600]">{courier.name}</td>
                    <td className="py-2 px-3">
                      <div className="flex justify-center">
                        {courier.courierType === "Domestic (Air)" ? (
                          <FaPlane className="text-gray-400" />
                        ) : (
                          <FaTruck className="text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[#0CBB7D] font-[700] bg-[#0CBB7D]/5 px-2 py-0.5 rounded-md border border-[#0CBB7D]/10">
                        {courier.provider}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-gray-600 font-[500]">{courier.courier || "-"}</span>
                    </td>
                    <td className="py-2 px-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={courier.status === "Enable"}
                          onChange={() => toggleStatus(index, courier._id, courier.status)}
                        />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0CBB7D]"></div>
                      </label>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          className={`p-1.5 rounded-lg text-[#0CBB7D] bg-[#0CBB7D]/5 hover:bg-[#0CBB7D]/20 transition-all ${canUpdate ? "active:scale-90" : "opacity-50 cursor-not-allowed"}`}
                          onClick={() => canUpdate && editHandler(courier)}
                          disabled={!canUpdate}
                          title="Edit Service"
                        >
                          <FaEdit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400 text-[12px] font-[500]">
                    No couriers found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-2 mt-2">
        {filteredCouriers.length > 0 ? (
          filteredCouriers.map((courier, index) => (
            <div
              key={courier._id}
              className="bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                      {getCarrierLogo(courier.name || courier.provider) ? (
                        <img
                          src={getCarrierLogo(courier.name || courier.provider)}
                          alt={courier.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-gray-300">
                          <FaTruck className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-[600] text-gray-700 truncate max-w-[150px]">
                      {courier.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="text-gray-400">
                        {courier.courierType === "Domestic (Air)" ? (
                          <FaPlane className="w-2.5 h-2.5" />
                        ) : (
                          <FaTruck className="w-2.5 h-2.5" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 font-[500] tracking-wider">
                        {courier.courierType?.replace("Domestic ", "")}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className={`p-2 rounded-full transition-all ${canUpdate ? "text-[#0CBB7D] active:scale-90" : "text-gray-300 cursor-not-allowed"}`}
                  onClick={() => canUpdate && editHandler(courier)}
                  disabled={!canUpdate}
                >
                  <FaEdit size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 text-[10px]">
                <div className="flex flex-col">
                  <span className="text-gray-700">Provider</span>
                  <span className="text-[#0CBB7D] font-[600]">{courier.provider}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-gray-700">Status</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-[700] ${courier.status === "Enable" ? "text-green-500" : "text-gray-400"}`}>
                      {courier.status}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={courier.status === "Enable"}
                        onChange={() => toggleStatus(index, courier._id, courier.status)}
                      />
                      <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0CBB7D]"></div>
                    </label>
                  </div>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400 text-[12px] font-[500]">No couriers found matching your filters.</p>
          </div>
        )}
      </div>

      <ChangeProviderModal
        isOpen={isChangeProviderModalOpen}
        onClose={() => {
          setIsChangeProviderModalOpen(false);
        }}
        selectedServices={filteredCouriers.filter(c => selectedIds.includes(c._id))}
        onApply={handleChangeProvider}
      />
    </div>
  );
};

export default CourierServiceList;
