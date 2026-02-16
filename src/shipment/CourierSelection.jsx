import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Notification } from "../Notification";
import ThreeDotLoader from "../Loader";
import { FaTruck, FaPlane, FaStar } from "react-icons/fa";
import Cookies from "js-cookie";
import { getCarrierLogo } from "../Common/getCarrierLogo";
import SchedulePickupModal from "./SchedulePickupModal";

const getWeightValue = (name, fallback) => {
  const n = Number(name?.match(/\d+/)?.[0]);
  return n > 0 ? n : fallback;
};

const CarrierSelection = () => {
  const { id } = useParams();
  const [orderDetails, setOrderDetails] = useState({});
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingButtons, setLoadingButtons] = useState({});
  const [selectedCourier, setSelectedCourier] = useState(null);
  const navigate = useNavigate();
  const [isAnyShipmentProcessing, setIsAnyShipmentProcessing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [shipmentResponse, setShipmentResponse] = useState(null);
  const [openPopup, setOpenPopup] = useState(null);
  const popupRef = useRef(null);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleShip = async (courierItem) => {
    if (courierItem && typeof courierItem !== "object") return;
    const courierToShip = courierItem || selectedCourier;
    console.log("courier servi", courierToShip);
    if (!courierToShip) return;

    const { provider, forward, courierServiceName, courier, estimatedDeliveryDate } = courierToShip;

    // sanitize provider (remove all spaces)
    const safeProvider = provider.replace(/\s+/g, "");

    const charges = parseFloat(forward?.finalCharges);

    // ✅ Validate mandatory fields + charge value
    if (
      !id ||
      !provider ||
      !courierServiceName ||
      isNaN(charges) ||
      charges <= 0
    ) {
      Notification(
        "Missing or invalid fields: id, provider, courierServiceName, or charges (must be > 0)",
        "error"
      );
      return;
    }

    setIsAnyShipmentProcessing(true);
    setLoadingButtons((prev) => ({ ...prev, [courierServiceName]: true }));
    try {
      const payload = {
        id,
        provider,
        finalCharges: forward.finalCharges,
        courierServiceName,
        courier,
        estimatedDeliveryDate,
      };
      // console.log("payload", payload);

      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/${safeProvider}/createShipment`,
        payload
      );

      if (response.data.error) throw new Error(response.data.error);

      Notification(response?.data?.message || "Shipment created successfully", "success");
      setShipmentResponse(response.data);
      setShowScheduleModal(true);
      // navigate("/dashboard/b2c/order");
    } catch (error) {
      Notification(error.response?.data?.message || "Something went wrong", "error");
      console.log("service error", error);
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [courierServiceName]: false }));
      setIsAnyShipmentProcessing(false);
    }
  };



  // useEffect(() => {
  //   if (selectedCourier) {
  //     handleShip();
  //   }
  // }, [selectedCourier]);


  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/order/ship/${id}`,
          { headers: { authorization: `Bearer ${token}` } }
        );
        console.log("courier", response.data)
        setOrderDetails(response.data.order);
        setPlan(response.data.updatedRates);
      } catch (error) { } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id, REACT_APP_BACKEND_URL]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpenPopup(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // const sortedPlan = plan.sort((a, b) => {
  //   if ((b?.isRecommended ? 1 : 0) - (a?.isRecommended ? 1 : 0) !== 0) {
  //     return (b?.isRecommended ? 1 : 0) - (a?.isRecommended ? 1 : 0);
  //   }
  //   return a?.forward?.finalCharges - b?.forward?.finalCharges;
  // });



  return (
    <div className="bg-[#f5f7fb] text-gray-700 relative h-screen flex flex-col overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 px-2 pt-2 bg-[#f5f7fb] z-40">
        <h1 className="sm:text-[14px] text-[12px] font-[600] text-gray-700 mb-2 tracking-tight">
          Order ID : <span className="text-[#0CBB7D]">{orderDetails.orderId}</span>
        </h1>

        <div className="sm:flex hidden font-[600] flex-wrap gap-2 items-center justify-between bg-white rounded-lg px-3 py-2 mb-2 shadow border">
          {/* FROM (PICKUP) */}
          <div className="flex flex-col items-center gap-1 flex-1 justify-center min-w-[110px] border-b sm:border-none pb-2 sm:pb-0 relative group">
            <span className="text-gray-500 text-[10px] sm:text-[12px]">From</span>
            <span className="font-[600] text-gray-700 text-[10px] sm:text-[12px] border-b border-dashed border-gray-400 cursor-help">
              {orderDetails?.pickupAddress?.state || ""}
            </span>
            <span className="text-gray-500 text-[10px] sm:text-[12px]">{orderDetails?.pickupAddress?.pinCode || ""}</span>

            {/* Desktop Hover Tooltip */}
            <div className="absolute z-[100] hidden group-hover:block bg-white text-gray-700 text-[10px] p-3 rounded-md border shadow-2xl w-64 top-full left-1/2 -translate-x-1/2 mt-2 whitespace-normal break-words leading-relaxed">
              <p className="font-[600] text-gray-700 mb-1">Pickup Address</p>
              <p>{orderDetails?.pickupAddress?.address}</p>
              <p>{orderDetails?.pickupAddress?.city}, {orderDetails?.pickupAddress?.state} - {orderDetails?.pickupAddress?.pinCode}</p>
            </div>
          </div>

          <div className="text-2xl mx-4 text-gray-400">→</div>

          {/* TO (DELIVERY) */}
          <div className="flex flex-col items-center gap-1 flex-1 justify-center min-w-[110px] border-b sm:border-none pb-2 sm:pb-0 relative group">
            <span className="text-gray-500 text-[10px] sm:text-[12px]">To</span>
            <span className="font-[600] text-gray-700 text-[10px] sm:text-[12px] border-b border-dashed border-gray-400 cursor-help">
              {orderDetails?.receiverAddress?.state || ""}
            </span>
            <span className="text-gray-500 text-[10px] sm:text-[12px]">{orderDetails?.receiverAddress?.pinCode || ""}</span>

            {/* Desktop Hover Tooltip */}
            <div className="absolute z-[100] hidden group-hover:block bg-white text-gray-700 text-[10px] p-3 rounded-md border shadow-2xl w-64 top-full left-1/2 -translate-x-1/2 mt-2 whitespace-normal break-words leading-relaxed">
              <p className="font-[600] text-gray-700 mb-1">Delivery Address</p>
              <p>{orderDetails?.receiverAddress?.address}</p>
              <p>{orderDetails?.receiverAddress?.city}, {orderDetails?.receiverAddress?.state} - {orderDetails?.receiverAddress?.pinCode}</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1 min-w-[110px] px-4">
            <span className="text-gray-500 text-[10px] sm:text-[12px]">Order Value</span>
            <span className="font-[600] text-gray-700 text-[10px] sm:text-[12px]">
              ₹{Number(orderDetails?.paymentDetails?.amount || 0).toFixed(1)}
            </span>
            <span className="text-gray-500 text-[10px] sm:text-[12px]">
              {orderDetails?.paymentDetails?.method}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1 min-w-[90px] border-l px-4">
            <span className="text-gray-500 text-[10px] sm:text-[12px]">Weight</span>
            <span className="font-[600] text-gray-700 text-[10px] sm:text-[12px]">{orderDetails?.packageDetails?.applicableWeight || ""} kg</span>
          </div>
        </div>

        {/* Mobile View Card */}
        <div className="block sm:hidden w-full my-2 mt-6">
          <div className="relative bg-white rounded-lg shadow-md border flex py-3 px-0 min-h-[115px]">
            {/* FROM/TO COLUMN */}
            <div className="flex-1 flex flex-col items-center justify-center relative border-r last:border-r-0">
              {/* Floating Icon */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                <span className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full shadow p-1">
                  <i className="fa-solid fa-location-dot text-[#0CBB7D] text-[18px]"></i>
                </span>
              </div>
              <div className="mt-7 flex flex-col items-center w-full px-1">
                {/* Pickup Address Clickable */}
                <div
                  className="flex flex-col items-center relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPopup(openPopup === "pickup" ? null : "pickup");
                  }}
                >
                  <span className="text-[12px] font-[600] text-gray-700 border-b border-dashed border-gray-400">{orderDetails?.pickupAddress?.state || ""}</span>
                  <span className="text-gray-500 text-[12px] font-[600]">{orderDetails?.pickupAddress?.pinCode || ""}</span>

                  {openPopup === "pickup" && (
                    <div ref={popupRef} className="absolute z-[300] bg-white border shadow-xl rounded-lg p-3 w-[220px] top-full mt-2 left-1/2 -translate-x-1/2 animate-popup-in transition-all duration-200 ease-out">
                      <p className="font-semibold text-[10px] text-gray-700 mb-1">Pickup Address</p>
                      <p className="text-[10px] text-gray-600 leading-relaxed">{orderDetails?.pickupAddress?.address}</p>
                      <p className="text-[10px] text-gray-600">{orderDetails?.pickupAddress?.city}, {orderDetails?.pickupAddress?.state} - {orderDetails?.pickupAddress?.pinCode}</p>
                    </div>
                  )}
                </div>

                <span className="text-gray-400 text-[14px] mt-0.5 mb-1">&#8595;</span>

                {/* Delivery Address Clickable */}
                <div
                  className="flex flex-col items-center relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPopup(openPopup === "delivery" ? null : "delivery");
                  }}
                >
                  <span className="text-[12px] font-[600] text-gray-700 border-b border-dashed border-gray-400">{orderDetails?.receiverAddress?.state || ""}</span>
                  <span className="text-gray-500 text-[12px] font-[600]">{orderDetails?.receiverAddress?.pinCode || ""}</span>

                  {openPopup === "delivery" && (
                    <div ref={popupRef} className="absolute z-[300] bg-white border shadow-xl rounded-lg p-3 w-[220px] bottom-full mb-2 left-1/2 -translate-x-1/2 animate-popup-in transition-all duration-200 ease-out">
                      <p className="font-semibold text-[10px] text-gray-700 mb-1">Delivery Address</p>
                      <p className="text-[10px] text-gray-600 leading-relaxed">{orderDetails?.receiverAddress?.address}</p>
                      <p className="text-[10px] text-gray-600">{orderDetails?.receiverAddress?.city}, {orderDetails?.receiverAddress?.state} - {orderDetails?.receiverAddress?.pinCode}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* ORDER VALUE COLUMN */}
            <div className="flex-1 flex flex-col items-center justify-center relative border-r last:border-r-0">
              {/* Floating Icon */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                <span className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full shadow p-1">
                  <i className="fa-solid fa-indian-rupee-sign text-[#0CBB7D] text-[18px]"></i>
                </span>
              </div>
              <div className="mt-7 flex flex-col items-center">
                <span className="font-[600] text-[12px] text-gray-700">{orderDetails?.paymentDetails?.method?.toUpperCase()}</span>
                <span className="text-gray-500 font-[600] text-[12px] mt-0.5">Order Value</span>
                <span className="text-[12px] font-[600] text-gray-700 mt-0.5 mb-1">₹{Number(orderDetails?.paymentDetails?.amount || 0).toFixed(1)}</span>
              </div>
            </div>
            {/* WEIGHT COLUMN */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Floating Icon */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                <span className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full shadow p-1">
                  <i className="fa-solid fa-weight-hanging text-[#0CBB7D] text-[18px]"></i>
                </span>
              </div>
              <div className="mt-7 flex flex-col items-center">
                <span className="text-gray-500 font-[600] text-[12px]">Applicable Weight</span>
                <span className="text-[12px] font-[600] text-gray-700">{orderDetails?.packageDetails?.applicableWeight || ""}Kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-2 pb-20 sm:pb-2 scrollbar-none">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <ThreeDotLoader />
          </div>
        ) : plan.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden">
              {plan.map((item, idx) => {
                const isActive = selectedCourier?.courierServiceName === item.courierServiceName;
                return (
                  <div
                    key={item._id}
                    className={`relative border text-[10px] rounded-lg p-4 mb-2 shadow-sm bg-white cursor-pointer transition
                      ${isActive ? "border-[#0CBB7D] ring-1 ring-[#0CBB7D]" : "border-gray-200"}
                    `}
                    onClick={() => setSelectedCourier(item)}
                  >
                    <div className="flex justify-between items-center gap-4 w-full mb-2">
                      <div className="flex justify-center gap-4 w-full">
                        <img
                          src={getCarrierLogo(item.courierServiceName)}
                          alt={item.courierServiceName}
                          className="w-10 h-10 rounded-md border"
                        />
                        <div className="flex justify-between w-full">
                          <div className="flex justify-center items-start flex-col">
                            <h2 className="font-[600]">
                              {item.courierServiceName}
                            </h2>
                            <span className="text-gray-500">
                              {item.courierType}
                            </span>
                          </div>

                          <div className="text-[10px] flex flex-col justify-center items-end">
                            <div className="flex font-[600] justify-center items-center text-gray-500">
                              <span>Mode :</span><span>{item.courierType === "Domestic (Air)" ? (
                                <FaPlane className="text-gray-500 text-[14px]" />
                              ) : (
                                <FaTruck className="text-gray-500 text-[14px]" />
                              )}</span>
                            </div>
                            <p className="text-center text-[10px] font-[600] text-gray-500">
                              {(() => {
                                const serviceWeight = Number(item?.courierServiceName?.match(/\d+/)?.[0]);
                                const applicableWeight = orderDetails?.packageDetails?.applicableWeight || 0;

                                return serviceWeight > applicableWeight ? serviceWeight : applicableWeight;
                              })()}{" "}
                              kg
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 p-2 bg-green-50 rounded-lg font-[600] border-t border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estimated Delivery Date</span>
                        <div>
                          {item?.estimatedDeliveryDate
                            ? new Date(item.estimatedDeliveryDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                            : "—"}
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Charges</span>
                        <div className="text-gray-700">₹{item.forward.finalCharges}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Bottom Fixed Button */}
              <div className="fixed bottom-0 left-0 w-full px-4 pb-4 z-50 md:hidden bg-gradient-to-t from-[#f5f7fb] via-[#f5f7fb] to-transparent">
                <button
                  onClick={() => handleShip()}
                  disabled={!selectedCourier || loadingButtons[selectedCourier?.courierServiceName || isAnyShipmentProcessing]}
                  className={`w-full px-3 py-3 rounded-lg font-[600] text-white bg-[#0CBB7D] shadow-lg text-[12px] transition
                    ${(!selectedCourier || isAnyShipmentProcessing) ? "opacity-50 cursor-not-allowed" : ""}
                    ${loadingButtons[selectedCourier?.courierServiceName] ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {selectedCourier
                    ? loadingButtons[selectedCourier.courierServiceName]
                      ? "Processing..."
                      : `Ship With ${selectedCourier.courierServiceName}`
                    : "Select a courier to ship"}
                </button>
              </div>
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block">
              <div className="overflow-auto relative bg-white border rounded-lg shadow-sm">
                <table className="w-full text-[14px] bg-white table-fixed">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-[#0CBB7D] text-white text-[12px] font-[600]">
                      <th className="py-2 px-3 text-left bg-[#0CBB7D]">Courier Partner</th>
                      <th className="py-2 px-3 text-center bg-[#0CBB7D]">Mode</th>
                      <th className="py-2 px-3 text-center bg-[#0CBB7D]">Estimated Delivery Date</th>
                      <th className="py-2 px-3 text-center bg-[#0CBB7D]">Chargeable Weight</th>
                      <th className="py-2 px-3 text-center bg-[#0CBB7D]">Charges</th>
                      <th className="py-2 px-3 text-center bg-[#0CBB7D]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.map((item) => (
                      <tr key={item._id} className={`${item.isRecommended ? "bg-[#e9fff6]" : "bg-white"} border-b last:border-b-0 hover:bg-gray-50 transition-colors`}>
                        <td className="flex text-[12px] items-center gap-3 py-4 pl-3">
                          <img
                            src={getCarrierLogo(item.courierServiceName)}
                            alt={item.courierServiceName}
                            className="w-11 h-11 rounded-md border"
                          />
                          <div>
                            <span className="font-[600] text-gray-700">{item.courierServiceName}</span>
                            <div className="text-[10px] text-gray-500">{item.courierType}</div>
                          </div>
                        </td>
                        <td className="text-center align-middle py-4">
                          {item.courierType === "Domestic (Air)" ? (
                            <FaPlane className="inline-block text-gray-500 text-[18px] align-middle" />
                          ) : (
                            <FaTruck className="inline-block text-gray-500 text-[18px] align-middle" />
                          )}
                        </td>
                        <td className="text-center font-[600] text-[12px]">
                          {item?.estimatedDeliveryDate
                            ? new Date(item.estimatedDeliveryDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                            : "—"}
                        </td>

                        <td className="text-center font-[600] text-gray-500 text-[12px]">
                          {getWeightValue(item.courierServiceName, orderDetails?.packageDetails?.applicableWeight || 0)} kg
                        </td>
                        <td className="text-center font-[600] text-gray-700 text-[12px]">₹{item.forward.finalCharges}</td>
                        <td className="text-center">
                          <button
                            onClick={() => handleShip(item)}
                            disabled={loadingButtons[item.courierServiceName] || isAnyShipmentProcessing}
                            className={`px-3 py-2 rounded-lg font-[600] text-[10px] text-white bg-[#0CBB7D] shadow
              ${(loadingButtons[item.courierServiceName] || isAnyShipmentProcessing) ? "opacity-50 cursor-not-allowed" : ""}
              `}
                          >
                            {loadingButtons[item.courierServiceName] ? "Processing..." : `Ship Now`}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center py-6 text-gray-600 font-semibold">No Courier Serviceable for this Pincode</p>
        )}
      </div>

      {showScheduleModal && shipmentResponse && (
        <SchedulePickupModal
          orderId={shipmentResponse.order?._id || id}
          awb={shipmentResponse.awb_number}
          pickupAddress={`${orderDetails?.pickupAddress?.address}, ${orderDetails?.pickupAddress?.city}, ${orderDetails?.pickupAddress?.state} - ${orderDetails?.pickupAddress?.pinCode}`}
          onClose={() => {
            setShowScheduleModal(false);
            navigate("/dashboard/b2c/order");
          }}
        />
      )}
    </div>
  );
};

export default CarrierSelection;


