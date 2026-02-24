import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import axios from "axios";
import { FaTruck, FaPlane } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";
import { getCarrierLogo } from "../../../Common/getCarrierLogo";
import Loader from "../../../Loader";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CourierSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchTerm = "" } = useOutletContext() || {};
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true); // loader state

  const filteredCouriers = couriers.filter((courier) =>
    courier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchCouriers = async () => {
      setLoading(true); // start loader
      try {
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/courier/getCourierServices`,
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );

        if (
          response.data &&
          response.data.success &&
          response.data.data &&
          Array.isArray(response.data.data.rateCard)
        ) {
          const updatedCouriers = response.data.data.rateCard.map(
            (courier, index) => ({
              id: index + 1,
              name: courier.courierServiceName || "-",
              provider: courier.courierProviderName || "-",
              courierType: courier.mode || "Domestic (Surface)",
              status: courier.status === "Active" ? "Active" : "Inactive",
            })
          );
          setCouriers(updatedCouriers);
        } else {
          setCouriers([]); // no data
        }
      } catch (error) {
        console.error("Error fetching couriers:", error);
        setCouriers([]);
      } finally {
        setLoading(false); // stop loader
      }
    };

    fetchCouriers();
  }, [location.state]);

  const updateCourierStatus = async (courier) => {
    try {
      const token = Cookies.get("session");
      await axios.post(
        `${REACT_APP_BACKEND_URL}/courier/updateCourierServiceStatus`,
        {
          courierProviderName: courier.provider,
          courierServiceName: courier.name,
          status: courier.status,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      Notification(`Status updated successfully for ${courier.name}`, "success");
    } catch (error) {
      console.error(`Error updating status for ${courier.name}:`, error);
      Notification(`Error updating status for ${courier.name}`, "error");
    }
  };

  const toggleStatus = (id) => {
    setCouriers((prevCouriers) =>
      prevCouriers.map((courier) => {
        if (courier.id === id) {
          const updatedCourier = {
            ...courier,
            status: courier.status === "Active" ? "Inactive" : "Active",
          };
          updateCourierStatus(updatedCourier);
          return updatedCourier;
        }
        return courier;
      })
    );
  };

  if (loading) {
    return <div className="mt-10"><Loader /></div>; // show loader while fetching
  }

  if (!loading && couriers.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 mt-4">
        No couriers found.
      </div>
    );
  }

  return (
    <div className="mx-auto sm:mt-1 mt-0">
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="relative overflow-x-auto bg-white overflow-y-auto h-[calc(100dvh-150px)] shadow-sm">
          <table className="min-w-full text-left">
            <thead className="sticky top-0 z-20">
              <tr className="text-white bg-[#0CBB7D] font-[600] text-[12px]">
                <th className="py-2 px-3">Sr.</th>
                <th className="py-2 px-3">Courier Service</th>
                <th className="py-2 px-3 text-center">Mode</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCouriers.map((courier, index) => (
                <tr
                  key={courier.id}
                  className="border-b border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-[12px]"
                >
                  <td className="py-2 px-3 text-left">{index + 1}</td>
                  <td className="py-2 px-3 flex items-center gap-2">
                    <img
                      src={getCarrierLogo(courier.name)}
                      alt="courier"
                      className="w-6 h-6 object-contain rounded-full border border-gray-100 p-0.5"
                    />
                    <span>{courier.name}</span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex justify-center">
                      {courier.courierType.includes("Air") ? (
                        <FaPlane className="text-gray-500" />
                      ) : (
                        <FaTruck className="text-gray-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex justify-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={courier.status === "Active"}
                          onChange={() => toggleStatus(courier.id)}
                        />
                        <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-[#0CBB7D] relative transition-all duration-300">
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${courier.status === "Active" ? "translate-x-5" : "translate-x-1"
                              }`}
                          ></div>
                        </div>
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="flex flex-col gap-2 h-[calc(100dvh-180px)] overflow-y-auto pb-2">
          {filteredCouriers.map((courier) => (
            <div
              key={courier.id}
              className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img
                    src={getCarrierLogo(courier.name)}
                    alt="courier"
                    className="w-8 h-8 object-contain rounded-full border border-gray-300 p-1"
                  />
                  <span className="text-[12px] font-[600] text-gray-700">
                    {courier.name}
                  </span>
                </div>
                <div className="text-gray-400">
                  {courier.courierType.includes("Air") ? <FaPlane size={14} /> : <FaTruck size={14} />}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 px-1">
                <div className="text-[11px] text-gray-500">
                  Status: <span className={courier.status === "Active" ? "text-[#0CBB7D] font-[600]" : "text-red-500 font-[600]"}>{courier.status}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={courier.status === "Active"}
                    onChange={() => toggleStatus(courier.id)}
                  />
                  <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-[#0CBB7D] relative transition-all duration-300">
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${courier.status === "Active" ? "translate-x-5" : "translate-x-1"
                        }`}
                    ></div>
                  </div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourierSelection;
