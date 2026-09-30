import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaTruck,
  FaPlane,
  FaSearch,
  FaEdit,
  FaChevronDown,
  FaExclamationTriangle,
  FaTrashAlt,
  FaTimes,
} from "react-icons/fa";
import { Notification } from "../../Notification";
import CustomDropdown from "./Dropdown";
import { getCarrierLogo } from "../../Common/getCarrierLogo";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// --- Delete Warning & Confirmation Modal ---
const DeleteServiceModal = ({ isOpen, onClose, servicesToDelete, onDeleted }) => {
  const [stats, setStats] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && servicesToDelete && servicesToDelete.length > 0) {
      fetchPreview();
    } else {
      setStats(null);
      setError(null);
    }
  }, [isOpen, servicesToDelete]);

  const fetchPreview = async () => {
    setLoadingPreview(true);
    setError(null);
    try {
      const response = await axios.post(`${REACT_APP_BACKEND_URL}/b2b/courierServices/previewDelete`, {
        serviceIds: servicesToDelete.map((s) => s._id),
      });
      if (response.data.success) {
        setStats(response.data);
      } else {
        setError(response.data.message || "Failed to calculate matching rates");
      }
    } catch (err) {
      console.error("Error fetching B2B delete preview:", err);
      setError(err.response?.data?.message || "Failed to fetch rate match preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      let res;
      if (servicesToDelete.length === 1) {
        res = await axios.delete(
          `${REACT_APP_BACKEND_URL}/b2b/courierServices/couriers/${servicesToDelete[0]._id}`
        );
      } else {
        res = await axios.post(`${REACT_APP_BACKEND_URL}/b2b/courierServices/bulkDelete`, {
          serviceIds: servicesToDelete.map((s) => s._id),
        });
      }

      if (res.data.success) {
        Notification(
          res.data.message || "B2B Courier service(s) and matching rates deleted successfully",
          "success"
        );
        onDeleted();
        onClose();
      } else {
        Notification(res.data.message || "Failed to delete B2B courier service", "error");
      }
    } catch (err) {
      console.error("Error deleting B2B service:", err);
      Notification(
        err.response?.data?.error || err.response?.data?.message || "Failed to delete B2B service",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !servicesToDelete || servicesToDelete.length === 0) return null;

  const isBulk = servicesToDelete.length > 1;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-popup-in border border-gray-100 relative">
        {/* Header */}
        <div className="p-4 bg-red-50/80 border-b border-red-100 flex items-center gap-3">
          <div className="bg-red-500/10 p-2.5 rounded-xl text-red-600 shrink-0">
            <FaExclamationTriangle size={20} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-gray-800">
              {isBulk
                ? `Delete ${servicesToDelete.length} B2B Courier Services`
                : `Delete B2B Courier Service`}
            </h2>
            <p className="text-[11px] text-red-600 font-medium mt-0.5">
              Warning: Rates in all user plans will be removed
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {loadingPreview ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-gray-500">
              <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[12px] font-semibold">Calculating matching rates across all user plans...</p>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[12px]">
              {error}
            </div>
          ) : (
            <>
              {/* Highlight Warning Alert */}
              <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <FaExclamationTriangle className="text-amber-600 shrink-0 mt-0.5" size={14} />
                  <div className="text-[12px] text-amber-900 leading-relaxed font-medium">
                    Are you sure you want to permanently delete{" "}
                    <span className="font-bold text-gray-900">
                      {isBulk
                        ? `${servicesToDelete.length} B2B courier services`
                        : `"${servicesToDelete[0].name}" (${servicesToDelete[0].provider})`}
                    </span>
                    ? All matching rate cards will be{" "}
                    <span className="font-bold text-red-600">deleted from all user plans</span>.
                  </div>
                </div>
              </div>

              {/* Rate Match Counts Summary */}
              {stats && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Impact & Rate Match Summary
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs">
                      <div className="text-[18px] font-bold text-red-600">{stats.totalRates}</div>
                      <div className="text-[10px] font-semibold text-gray-600">Total Matching Rates</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs">
                      <div className="text-[18px] font-bold text-brand-primary">{stats.totalGlobalRates}</div>
                      <div className="text-[10px] font-semibold text-gray-600">Global Rate Cards</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs">
                      <div className="text-[18px] font-bold text-orange-600">{stats.affectedUserPlans}</div>
                      <div className="text-[10px] font-semibold text-gray-600">User Plans Affected</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 italic text-center pt-1">
                    Matching service name & provider: {stats.totalUserPlanRates} rate entries across{" "}
                    {stats.affectedUserPlans} user plans will be stripped.
                  </p>
                </div>
              )}

              {/* Services Breakdown */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Service{isBulk ? "s" : ""} to be deleted:
                </label>
                <div className="max-h-44 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
                  {servicesToDelete.map((svc) => {
                    const svcStat = stats?.services?.find((s) => s.id === svc._id);
                    return (
                      <div
                        key={svc._id}
                        className="p-2.5 flex items-center justify-between text-[12px] hover:bg-gray-50"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">{svc.name}</span>
                          <span className="text-[10px] text-gray-500">{svc.courierType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded border border-brand-primary/20">
                            {svc.provider}
                          </span>
                          {svcStat && (
                            <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200">
                              {svcStat.totalRateCount} rates
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-[12px] font-bold text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={loadingPreview || deleting}
            className={`px-4 py-2 rounded-lg text-[12px] font-bold text-white transition-all shadow-sm flex items-center gap-2
              ${
                loadingPreview || deleting
                  ? "bg-red-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 active:scale-95 cursor-pointer"
              }`}
          >
            {deleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>

        {/* Close Icon Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all p-1"
          onClick={onClose}
          disabled={deleting}
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
};

const CourierServiceList = ({ refresh, canUpdate = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [couriers, setCouriers] = useState([]);
  const [filteredCouriers, setFilteredCouriers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [servicesToDelete, setServicesToDelete] = useState([]);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const fetchCouriers = async () => {
    try {
      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/b2b/courierServices/getAllCourierServices`
      );

      if (Array.isArray(response.data)) {
        const updatedCouriers = response.data.map((courier) => ({
          ...courier,
          status: courier.status === "Enable" ? "Enable" : "Disable",
        }));
        setCouriers(updatedCouriers);
      }
    } catch (error) {
      console.error("Error fetching B2B couriers:", error);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, [refresh]);

  useEffect(() => {
    let result = couriers;

    if (searchQuery) {
      result = result.filter(
        (courier) =>
          courier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          courier.provider?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((courier) => courier.status === statusFilter);
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

      await axios.put(
        `${REACT_APP_BACKEND_URL}/b2b/courierServices/updateCourierServicesStatus/${courierId}`,
        {
          status: newStatus,
        }
      );

      Notification(`Status updated successfully`, "success");
    } catch (error) {
      console.error("Error updating B2B status:", error);
      Notification(`Error updating status`, "error");

      setCouriers((prevCouriers) =>
        prevCouriers.map((courier) =>
          courier._id === courierId ? { ...courier, status: currentStatus } : courier
        )
      );
    }
  };

  const editHandler = (courier) => {
    navigate("/adminDashboard/setup/courierservices/add/b2b", {
      state: { courierToEdit: courier },
    });
  };

  const handleDeleteClick = (courier) => {
    setServicesToDelete([courier]);
    setIsDeleteModalOpen(true);
  };

  const handleBulkDeleteClick = () => {
    const selected = filteredCouriers.filter((c) => selectedIds.includes(c._id));
    if (selected.length === 0) return;
    setServicesToDelete(selected);
    setIsDeleteModalOpen(true);
    setIsActionMenuOpen(false);
  };

  const onServiceDeleted = async () => {
    setSelectedIds([]);
    await fetchCouriers();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredCouriers.map((c) => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="mx-auto sm:mt-2 mt-0">
      {/* Filters & Actions Bar */}
      <div className="flex flex-row justify-between items-center gap-2 mb-2">
        <div className="flex flex-row gap-2 items-center flex-1">
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-[12px]" />
            <input
              type="text"
              placeholder="Search B2B Courier Service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-[10px] sm:text-[12px] focus:outline-none focus:border-brand-primary shadow-sm font-[600] text-gray-700 transition-all"
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

        {/* Bulk Actions Button */}
        <div className="relative">
          <button
            onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
            disabled={selectedIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all shadow-sm border
              ${
                selectedIds.length === 0
                  ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-brand-primary text-white border-brand-primary hover:bg-green-600 active:scale-95 cursor-pointer"
              }`}
          >
            <span>Actions ({selectedIds.length})</span>
            <FaChevronDown
              className={`transition-transform duration-200 ${isActionMenuOpen ? "rotate-180" : ""}`}
              size={10}
            />
          </button>

          {isActionMenuOpen && selectedIds.length > 0 && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-[100] py-1 animate-popup-in">
              <button
                onClick={handleBulkDeleteClick}
                className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <FaTrashAlt size={11} />
                </div>
                <span>Delete Selected ({selectedIds.length})</span>
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
              <tr className="text-white bg-brand-primary font-[600] text-[12px]">
                <th className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-white/30 bg-white/20 checked:bg-white text-brand-primary accent-brand-primary focus:ring-0 cursor-pointer w-3 h-3"
                    checked={filteredCouriers.length > 0 && selectedIds.length === filteredCouriers.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="py-2 px-3 text-center">Sr.</th>
                <th className="py-2 px-3 text-left">Courier Service</th>
                <th className="py-2 px-3 text-center">Mode</th>
                <th className="py-2 px-3 text-left">Provider</th>
                <th className="py-2 px-3 text-left">Service Type</th>
                <th className="py-2 px-3 text-left">Weight</th>
                <th className="py-2 px-3 text-left">Status</th>
                <th className="py-2 px-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredCouriers.length > 0 ? (
                filteredCouriers.map((courier, index) => (
                  <tr
                    key={courier._id}
                    className="border-b border-gray-300 text-gray-500 hover:bg-gray-50 transition-all text-[12px]"
                  >
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-brand-primary accent-brand-primary focus:ring-brand-primary/20 cursor-pointer w-3 h-3"
                        checked={selectedIds.includes(courier._id)}
                        onChange={() => handleToggleSelect(courier._id)}
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
                      <span className="text-brand-primary font-[700] bg-brand-primary/5 px-2 py-0.5 rounded-md border border-brand-primary/10">
                        {courier.provider}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-gray-600 font-[500]">{courier.courier || "-"}</span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-gray-600 font-[500]">{courier.weight || "-"}</span>
                    </td>
                    <td className="py-2 px-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={courier.status === "Enable"}
                          onChange={() => toggleStatus(index, courier._id, courier.status)}
                        />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          className={`p-1.5 rounded-lg text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/20 transition-all ${
                            canUpdate ? "active:scale-90 cursor-pointer" : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => canUpdate && editHandler(courier)}
                          disabled={!canUpdate}
                          title="Edit Service"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          className={`p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-all ${
                            canUpdate ? "active:scale-90 cursor-pointer" : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => canUpdate && handleDeleteClick(courier)}
                          disabled={!canUpdate}
                          title="Delete Service & Associated Rates"
                        >
                          <FaTrashAlt size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-gray-400 text-[12px] font-[500]">
                    No B2B couriers found matching your filters.
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
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-brand-primary accent-brand-primary focus:ring-brand-primary/20 cursor-pointer w-3.5 h-3.5"
                    checked={selectedIds.includes(courier._id)}
                    onChange={() => handleToggleSelect(courier._id)}
                  />
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
                <div className="flex items-center gap-1">
                  <button
                    className={`p-2 rounded-full transition-all ${
                      canUpdate ? "text-brand-primary active:scale-90 cursor-pointer" : "text-gray-300 cursor-not-allowed"
                    }`}
                    onClick={() => canUpdate && editHandler(courier)}
                    disabled={!canUpdate}
                    title="Edit Service"
                  >
                    <FaEdit size={14} />
                  </button>
                  <button
                    className={`p-2 rounded-full transition-all ${
                      canUpdate ? "text-red-500 active:scale-90 cursor-pointer" : "text-gray-300 cursor-not-allowed"
                    }`}
                    onClick={() => canUpdate && handleDeleteClick(courier)}
                    disabled={!canUpdate}
                    title="Delete Service"
                  >
                    <FaTrashAlt size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 text-[10px]">
                <div className="flex flex-col">
                  <span className="text-gray-700">Provider</span>
                  <span className="text-brand-primary font-[600]">{courier.provider}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-gray-700">Status</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-[700] ${courier.status === "Enable" ? "text-brand-primary" : "text-gray-400"}`}
                    >
                      {courier.status}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={courier.status === "Enable"}
                        onChange={() => toggleStatus(index, courier._id, courier.status)}
                      />
                      <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {courier.weight && (
                <div className="text-[10px] text-gray-500 border-t border-gray-50 pt-1">
                  Weight: <span className="font-[600] text-gray-700">{courier.weight}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400 text-[12px] font-[500]">No B2B couriers found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation & Rate Match Modal */}
      <DeleteServiceModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setServicesToDelete([]);
        }}
        servicesToDelete={servicesToDelete}
        onDeleted={onServiceDeleted}
      />
    </div>
  );
};

export default CourierServiceList;
