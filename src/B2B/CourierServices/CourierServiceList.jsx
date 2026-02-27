import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaTruck, FaPlane, FaSearch, FaEdit } from "react-icons/fa";
import { Notification } from "../../Notification";
import CustomDropdown from "./Dropdown";
import { getCarrierLogo } from "../../Common/getCarrierLogo";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL

const CourierServiceList = ({ refresh, canUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [couriers, setCouriers] = useState([]);
  const [filteredCouriers, setFilteredCouriers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
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

      await axios.put(`${REACT_APP_BACKEND_URL}/b2b/courierServices/updateCourierServicesStatus/${courierId}`, {
        status: newStatus,
      });

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

  return (
    <div className="mx-auto sm:mt-2 mt-0">
      {/* Filters */}
      <div className="flex flex-row gap-2 mb-2 items-center">
        <div className="relative w-full sm:w-72">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-[12px]" />
          <input
            type="text"
            placeholder="Search B2B Courier Service..."
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

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden">
        <div className="max-h-[calc(100vh-350px)] overflow-y-auto overflow-x-auto">
          <table className="min-w-full">
            <thead className="sticky top-0 z-10">
              <tr className="text-white bg-[#0CBB7D] font-[600] text-[12px]">
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
                  <tr key={courier._id} className="border-b border-gray-300 text-gray-500 hover:bg-gray-50 transition-all text-[12px]">
                    <td className="py-2 px-3 text-center">{index + 1}</td>
                    <td className="py-2 px-3 text-gray-700">{courier.name}</td>
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
                      <span className="text-[#0CBB7D] font-[500]">{courier.provider}</span>
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
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0CBB7D]"></div>
                      </label>
                    </td>
                    <td className="py-2 px-3">
                      <button
                        className={`text-[#0CBB7D] transition-all ${canUpdate ? "hover:scale-110 active:scale-95" : "opacity-50 cursor-not-allowed"}`}
                        onClick={() => canUpdate && editHandler(courier)}
                        disabled={!canUpdate}
                        title="Edit B2B Courier"
                      >
                        <FaEdit size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-400 text-[12px] font-[500]">
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

              {/* Optional: Add Weight to mobile view if needed */}
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
    </div>
  );
};

export default CourierServiceList;
