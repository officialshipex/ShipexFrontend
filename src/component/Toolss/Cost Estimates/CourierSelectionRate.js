import React from "react";
import { Link } from "react-router-dom";
import { FaTruck, FaPlane, FaInfoCircle } from "react-icons/fa";
import ThreeDotLoader from "../../../Loader";
import {getCarrierLogo} from "../../../Common/getCarrierLogo"

import { useState, useEffect } from "react";

const isTouchDevice = () => window.matchMedia("(pointer: coarse)").matches;

const CourierSelectionRate = ({ plan, loading, hasFetched }) => {
  const [ratePopup, setRatePopup] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, right: 0 });

  useEffect(() => {
    if (!ratePopup) return;

    const handleOutsideClick = (e) => {
      // if click happened inside popup → do nothing
      if (e.target.closest(".rate-popup")) return;

      // if click happened on info icon → do nothing
      if (e.target.closest(".rate-info-icon")) return;

      setRatePopup(null);
    };

    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [ratePopup]);
  if (hasFetched && (!Array.isArray(plan) || plan.length === 0)) {
    return <p className="text-center py-4 text-gray-600">No Data Found</p>;
  }

  const openRatePopup = (e, working) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const popupWidth = 220;
    const screenPadding = 10;

    let left = rect.left + rect.width / 2 - popupWidth / 2;

    // keep popup inside viewport
    left = Math.max(screenPadding, left);
    left = Math.min(window.innerWidth - popupWidth - screenPadding, left);

    setPopupPos({
      top: rect.bottom + 10,
      left,
    });

    setRatePopup(working);
  };

  const showRatePopup = (e, working) => {
    if (isTouchDevice()) return; // ❌ block hover on mobile
    openRatePopup(e, working);
  };

  const hideRatePopup = () => {
    if (isTouchDevice()) return;
    setRatePopup(null);
  };

  if (hasFetched && loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <ThreeDotLoader />
      </div>
    );
  }

  return (
    <>
      {!hasFetched && plan.length > 0 && (
        <div className="">
          {/* Desktop View */}
          <div className="hidden md:block bg-white shadow rounded-lg p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b text-left bg-[#0CBB7D] text-white font-[600] text-[12px]">
                    <th className="px-3 py-2">Courier</th>
                    <th className="px-3 py-2 text-center">Mode</th>
                    <th className="px-3 py-2 text-center">Charges</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {plan
                    .sort(
                      (a, b) => a.forward.finalCharges - b.forward.finalCharges
                    )
                    .map((item) => (
                      <tr
                        key={item._id}
                        className="border-b text-gray-700 text-[12px]"
                      >
                        <td className="flex items-center space-x-4 px-3 py-2">
                          <img
                            src={getCarrierLogo(item.courierServiceName)}
                            alt={item.courierServiceName}
                            className="w-8 h-8"
                          />
                          <span>{item.courierServiceName}</span>
                        </td>

                        {item.orderType === "B2C" && (
                          <td className="text-center px-3 py-2">
                            <div className="flex justify-center">
                              {item.courierType === "Domestic (Air)" ? (
                                <FaPlane className="text-gray-500" />
                              ) : (
                                <FaTruck className="text-gray-500" />
                              )}
                            </div>
                          </td>
                        )}

                        {item.orderType === "B2B" && (
                          <td className="text-center px-3 py-2">
                            <div className="flex justify-center">
                              {item.mode_name === "air" ? (
                                <FaPlane className="text-gray-500" />
                              ) : (
                                <FaTruck className="text-gray-500" />
                              )}
                            </div>
                          </td>
                        )}

                        {item.orderType === "B2C" && (
                          <td className="text-center px-3 py-2 text-gray-700 font-[600]">
                            ₹{item.forward.finalCharges}
                          </td>
                        )}
                        {item.orderType === "B2B" && (
                          <td className="text-center font-[600] px-3 py-2 text-gray-500">
                            ₹{item.working.grand_total}
                            <FaInfoCircle
                              className="rate-info-icon inline ml-1 mb-0.5 text-[#0CBB7D] cursor-pointer"
                              onMouseEnter={(e) =>
                                showRatePopup(e, item.working)
                              }
                              onMouseLeave={hideRatePopup}
                              onClick={(e) => {
                                if (!isTouchDevice()) return;
                                e.stopPropagation();
                                openRatePopup(e, item.working);
                              }}
                            />
                          </td>
                        )}
                        <td className="text-center px-3 py-2">
                          {item.orderType === "B2C" && (
                            <Link to="/dashboard/b2c/order">
                              <button className="px-3 py-2 bg-[#0CBB7D] text-white rounded-lg text-[12px] font-[600] hover:opacity-90 transition-all">
                                + Create Shipment
                              </button>
                            </Link>
                          )}
                          {item.orderType === "B2B" && (
                            <Link to="/dashboard/b2b/order">
                              <button className="px-3 py-2 bg-[#0CBB7D] text-white rounded-lg text-[12px] font-[600] hover:opacity-90 transition-all">
                                + Create Shipment
                              </button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden bg-white rounded-lg mt-[-20px] sm:p-4">
            {plan.map((item) => (
              <div
                key={item._id}
                className="bg-white shadow-md rounded-lg p-4 mb-4"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={getCarrierLogo(item.courierServiceName)}
                    alt={item.courierServiceName}
                    className="w-12 h-12"
                  />
                  <div>
                    <h2 className="text-[10px] font-[600] text-gray-700">
                      {item.courierServiceName}
                    </h2>
                  </div>
                </div>

                <div className="mt-2 space-y-2">
                  {item.orderType === "B2C" && (
                    <div className="flex justify-between">
                      <p className="text-[10px] font-[600] text-gray-500">
                        Mode:
                      </p>
                      <div className="text-[12px]">
                        {item.courierType === "International" ? (
                          <FaPlane className="text-gray-500 text-[12px]" />
                        ) : (
                          <FaTruck className="text-gray-500 text-[12px]" />
                        )}
                      </div>
                    </div>
                  )}

                  {item.orderType === "B2B" && (
                    <div className="flex justify-between">
                      <p className="text-[10px] font-[600] text-gray-500">
                        Mode:
                      </p>
                      <div className="text-[12px]">
                        {item.mode_name === "air" ? (
                          <FaPlane className="text-gray-500 text-[12px]" />
                        ) : (
                          <FaTruck className="text-gray-500 text-[12px]" />
                        )}
                      </div>
                    </div>
                  )}

                  {item.orderType === "B2C" && (
                    <div className="flex justify-between font-[600] text-[10px] text-gray-500">
                      <span>Charges:</span>
                      <span className="font-[600] text-gray-500">
                        ₹{item.forward.finalCharges}
                      </span>
                    </div>
                  )}

                  {item.orderType === "B2B" && (
                    <div className="flex justify-between font-[600] text-[10px] text-gray-500">
                      <span>Charges:</span>
                      <div className="text-gray-700">
                        ₹{item.working.grand_total}
                        <FaInfoCircle
                          className="rate-info-icon inline ml-1 mb-0.5 text-[#0CBB7D] cursor-pointer"
                          onMouseEnter={(e) => showRatePopup(e, item.working)}
                          onMouseLeave={hideRatePopup}
                          onClick={(e) => {
                            if (!isTouchDevice()) return;
                            e.stopPropagation();
                            openRatePopup(e, item.working);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex justify-center">
                  {item.orderType === "B2C" && (
                    <Link to="/dashboard/b2c/order">
                      <button className="w-full py-2 px-3 bg-[#0CBB7D] text-white rounded-lg text-[10px] font-[600] hover:opacity-90 transition-all">
                        + Create Shipment
                      </button>
                    </Link>
                  )}
                  {item.orderType === "B2B" && (
                    <Link to="/dashboard/b2b/order">
                      <button className="w-full py-2 px-3 bg-[#0CBB7D] text-white rounded-lg text-[10px] font-[600] hover:opacity-90 transition-all">
                        + Create Shipment
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          {ratePopup && (
            <div
              className="rate-popup fixed z-[9999] bg-white border shadow-lg rounded-lg p-3 text-[12px]"
              style={{ top: popupPos.top, left: popupPos.left, width: "220px" }}
            >
              {[
                ["Freight", `₹${ratePopup.freight}`],
                ["Docket Charges", `₹${ratePopup.docket_charges}`],
                ["Pickup Charges", `₹${ratePopup.pickup_charge}`],
                ["Handling Charges", `₹${ratePopup.handling_charge}`],
                ["Appointment Charges", `₹${ratePopup.appointment_charge}`],
                ["COD Charges", `₹${ratePopup.cod_charges}`],
                ["ROV", `₹${ratePopup.rov}`],
                ["FSC", `₹${ratePopup.fsc}`],
                ["ODA", `₹${ratePopup.oda}`],
                ["Green Tax", `₹${ratePopup.green_tax}`],
                ["GST", `₹${ratePopup.gst}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-[2px]">
                  <span className="text-gray-500 font-[600]">{k}</span>
                  <span className="font-[600] text-gray-700">{v}</span>
                </div>
              ))}

              <div className="border-t mt-2 pt-1 flex text-gray-700 justify-between font-[700]">
                <span>Total</span>
                <span>₹{ratePopup.grand_total}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CourierSelectionRate;
