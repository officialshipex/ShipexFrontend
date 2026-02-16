import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaTruck, FaPlane } from "react-icons/fa";
import {Notification} from "../../Notification"

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL

const CourierServiceList = ({ refresh, canUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [couriers, setCouriers] = useState([]);


  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/courierServices/couriers`
        );

        if (Array.isArray(response.data)) {
          // Ensure status is set to ENABLE/DISABLE (not boolean)
          const updatedCouriers = response.data.map((courier) => ({
            ...courier,
            status: courier.status === "Enable" ? "Enable" : "Disable", // Map to ENABLE/DISABLE
          }));
          setCouriers(updatedCouriers);
          console.log("Couriers:", updatedCouriers);
        } else {
          console.error("The response data is not an array:", response.data);
        }
      } catch (error) {
        console.error("Error fetching couriers:", error);
      }
    };
    fetchCouriers();

    if (location.state?.newCourier) {
      const updatedCourier = location.state.newCourier;
      if (updatedCourier && updatedCourier.id) {
        setCouriers((prevCouriers) =>
          prevCouriers.map((c) =>
            c.id === updatedCourier.id ? updatedCourier : c
          )
        );
      } else if (updatedCourier) {
        setCouriers((prevCouriers) => [
          ...prevCouriers,
          {
            id: prevCouriers.length + 1,
            logo: updatedCourier.logo,
            courier: updatedCourier.provider.toUpperCase(),
            name: updatedCourier.name,
            provider: updatedCourier.courierProvider,
            status: updatedCourier.status || "Enable", // Default status to ENABLE
          },
        ]);
      }
    }
  }, [location.state, refresh]);

  const editHandler = (courier) => {
    // console.log(courier)
    navigate("/dashboard/setup/courier-services/create", {
      state: { courierToEdit: courier },
    });
  };

  const toggleStatus = async (index, courierId, currentStatus) => {
    const newStatus = currentStatus === "Enable" ? "Disable" : "Enable";
    console.log("Toggling status for courier ID:", courierId, "to", newStatus, index, currentStatus);
    try {
      // Optimistic UI update — instantly reflect change
      setCouriers((prevCouriers) =>
        prevCouriers.map((courier, i) =>
          i === index ? { ...courier, status: newStatus } : courier
        )
      );

      // Call backend API
      await axios.put(`${REACT_APP_BACKEND_URL}/courierServices/updateStatus/${courierId}`, {
        status: newStatus,
      });

      console.log(`Status updated for courier ${courierId} → ${newStatus}`);
      Notification(`Status updated successfully`, "success");
    } catch (error) {
      console.error("Error updating status:", error);
      Notification(`Error updating status for`, "error");

      // Rollback UI on failure
      setCouriers((prevCouriers) =>
        prevCouriers.map((courier, i) =>
          i === index ? { ...courier, status: currentStatus } : courier
        )
      );
    }
  };


  return (
    <div className="mx-auto sm:mt-2 mt-0">
      <div className="overflow-x-auto">
        <table className="min-w-full hidden md:table">
          <thead>
            <tr className="text-white bg-[#0CBB7D] border border-[#0CBB7D] font-[600] text-[12px]">
              <th className="py-2 px-3">Sr.</th>
              <th className="py-2 px-3 text-left">Courier Service</th>
              <th className="py-2 px-3 text-left">Mode</th>
              <th className="py-2 px-3 text-left">Provider</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(couriers) && couriers.length > 0 ? (
              couriers.map((courier, index) => (
                <tr key={courier.id} className="border border-gray-300 font-[400] text-gray-500 hover:bg-gray-50 transition-all text-[12px]">
                  <td className="py-2 px-3 text-center">{index + 1}</td>
                  {/* <td className="py-2 px-4 flex items-center gap-2"> */}
                  {/* {courier.courier} */}
                  {/* </td> */}
                  <td className="py-2 px-3">{courier.name}</td>
                  <td className="py-2 px-3 text-center">
                    {courier.courierType === "Domestic (Air)" ? (
                      <FaPlane className="text-gray-500" />
                    ) : (
                      <FaTruck className="text-gray-500" />
                    )}
                  </td>
                  <td className="py-2 px-3 text-[#0CBB7D] underline cursor-pointer">
                    {courier.provider}
                  </td>
                  <td className="py-2 px-3">
                    {/* Toggle Switch for Activation with Arrow */}
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={courier.status === "Enable"}
                          onChange={() => toggleStatus(index, courier._id, courier.status)}
                        />
                        <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-[#0CBB7D] relative transition-all duration-300">
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${courier.status === "Enable" ? "translate-x-5" : "translate-x-1"
                              }`}
                          ></div>
                        </div>
                      </label>


                    </div>
                  </td>

                  <td className="py-2 px-3">
                    <button
                      className={`bg-[#0CBB7D] text-[10px] sm:text-[12px] font-[600] text-white px-3 py-1 rounded transition ${canUpdate ? "hover:bg-[#0CBB7D]" : "opacity-50 cursor-not-allowed"}`}
                      onClick={() => canUpdate && editHandler(courier)}
                      disabled={!canUpdate}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  No couriers available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-2 mt-2">
        {couriers.length > 0 ? (
          couriers.map((courier, index) => (
            <div
              key={courier.id}
              className="bg-white p-3 rounded-lg shadow border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  {index + 1}. {courier.name}
                </span>
                <div className="text-gray-500">
                  {courier.courierType === "Domestic (Air)" ? (
                    <FaPlane />
                  ) : (
                    <FaTruck />
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-1">
                Provider: <span className="text-[#0CBB7D] underline">{courier.provider}</span>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={courier.status === "Enable"}
                      onChange={() => toggleStatus(index, courier._id, courier.status)}
                    />
                    <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-[#0CBB7D] relative transition-all duration-300">
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${courier.status === "Enable" ? "translate-x-5" : "translate-x-1"
                          }`}
                      ></div>
                    </div>
                  </label>
                  <span className="text-xs text-gray-600">{courier.status}</span>
                </div>

                <button
                  className={`bg-[#0CBB7D] text-white text-xs font-semibold px-3 py-1 rounded transition ${canUpdate ? "hover:bg-[#0CBB7D]" : "opacity-50 cursor-not-allowed"
                    }`}
                  onClick={() => canUpdate && editHandler(courier)}
                  disabled={!canUpdate}
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-sm text-gray-500 mt-4">
            No couriers available.
          </div>
        )}
      </div>

    </div>
  );
};

export default CourierServiceList;
