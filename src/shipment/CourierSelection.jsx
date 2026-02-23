import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Notification } from "../Notification";
import ThreeDotLoader from "../Loader";
import { FaTruck, FaPlane, FaStar, FaMapMarkerAlt, FaRupeeSign, FaWeightHanging } from "react-icons/fa";
import { FiInfo } from "react-icons/fi";
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
        priceBreakup: {
          freight: forward.charges,
          cod: courierToShip.cod,
          gst: forward.gst,
          total: forward.finalCharges
        }
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
        // console.log("courier", response.data)
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
    <div className="bg-[#f5f7fb] sm:px-2 text-gray-700 relative flex flex-col overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 bg-[#f5f7fb] z-40">
        <h1 className="sm:text-[14px] text-[12px] font-[600] text-gray-700 mb-2 tracking-tight">
          Order ID : <span className="text-[#0CBB7D]">{orderDetails.orderId}</span>
        </h1>

        <div className="sm:flex hidden font-[600] flex-wrap gap-2 items-center justify-between bg-white rounded-lg px-3 py-2 mb-2 shadow border">
          {/* FROM (PICKUP) */}
          <div className="flex flex-col items-center gap-1 flex-1 justify-center min-w-[110px] border-b sm:border-none pb-2 sm:pb-0">
            <span className="text-gray-500 text-[10px] sm:text-[12px]">From</span>
            <div className="relative inline-block group">
              <p className="text-gray-700 border-b border-dashed border-gray-400 cursor-pointer font-[600] text-[10px] sm:text-[12px]">
                {orderDetails?.pickupAddress?.city || ""}, {orderDetails?.pickupAddress?.state || ""}
              </p>


              {/* TOOLTIP CONTENT */}
              <div className="absolute z-[200] hidden group-hover:block 
                  bg-white text-gray-700 text-[10px] 
                  p-2 rounded border shadow-2xl w-64 
                  top-1/2 left-full ml-3 transform -translate-y-1/2 
                  whitespace-normal select-text pointer-events-auto leading-relaxed">
                <div className="text-left text-gray-500">
                  <p className="font-[600] text-gray-700">
                    {orderDetails?.pickupAddress?.contactName}
                  </p>
                  <p>{orderDetails?.pickupAddress?.address}</p>
                  <p>
                    {orderDetails?.pickupAddress?.city}, {orderDetails?.pickupAddress?.state} - {orderDetails?.pickupAddress?.pinCode}
                  </p>
                  <p className="text-gray-500 text-[600]">
                    {orderDetails?.pickupAddress?.phoneNumber}
                  </p>
                </div>
              </div>
              {/* INVISIBLE HOVER BRIDGE */}
              <div className="absolute left-full top-0 w-4 h-full"></div>
            </div>
            <span className="text-gray-500 text-[10px] sm:text-[12px] text-center">{orderDetails?.pickupAddress?.pinCode || ""}</span>
          </div>

          <div className="text-2xl mx-4 text-gray-400">→</div>

          {/* TO (DELIVERY) */}
          <div className="flex flex-col items-center gap-1 flex-1 justify-center min-w-[110px] border-b sm:border-none pb-2 sm:pb-0">
            <span className="text-gray-500 text-[10px] sm:text-[12px]">To</span>
            <div className="relative group inline-block">
              <p className="text-gray-700 border-b border-dashed border-gray-400 cursor-pointer font-[600] text-[10px] sm:text-[12px]">
                {orderDetails?.pickupAddress?.city || ""}, {orderDetails?.pickupAddress?.state || ""}
              </p>


              {/* TOOLTIP CONTENT */}
              <div className="absolute z-[200] hidden group-hover:block 
                  bg-white text-gray-700 text-[10px] 
                  p-2 rounded border shadow-2xl w-64 
                  top-1/2 right-full mr-3 transform -translate-y-1/2 
                  whitespace-normal select-text pointer-events-auto leading-relaxed">
                <div className="text-left text-gray-500 text-[600]">
                  <p className="font-[600] text-gray-700">
                    {orderDetails?.receiverAddress?.contactName}
                  </p>
                  <p>{orderDetails?.receiverAddress?.address}</p>
                  <p>
                    {orderDetails?.receiverAddress?.city}, {orderDetails?.receiverAddress?.state} - {orderDetails?.receiverAddress?.pinCode}
                  </p>
                  <p className="text-gray-500">
                    {orderDetails?.receiverAddress?.phoneNumber}
                  </p>
                </div>
              </div>
              {/* INVISIBLE HOVER BRIDGE */}
              <div className="absolute right-full top-0 w-4 h-full"></div>
            </div>
            <span className="text-gray-500 text-[10px] sm:text-[12px] ml-1">{orderDetails?.receiverAddress?.pinCode || ""}</span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1 min-w-[110px] px-4">
            <span className="text-gray-500 text-[10px] sm:text-[12px]">Order Value</span>
            <span className="font-[600] text-gray-700 text-[10px] sm:text-[12px]">
              ₹{Number(orderDetails?.paymentDetails?.amount || 0).toFixed(2)}
            </span>
            <span className="text-gray-500 text-[10px] sm:text-[12px]">
              {orderDetails?.paymentDetails?.method}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1 min-w-[90px] border-l px-4">
            <span className="text-gray-500 text-[10px] sm:text-[12px]">Weight</span>
            <div className="relative group inline-block">
              <p className="text-gray-700 border-b border-dashed border-gray-400 cursor-pointer font-[600] text-[10px] sm:text-[12px]">
                {orderDetails?.packageDetails?.applicableWeight || ""} kg
              </p>

              {/* TOOLTIP CONTENT */}
              <div className="absolute z-[200] hidden group-hover:block 
                  bg-white text-gray-700 text-[10px] 
                  p-2 rounded border shadow-2xl w-56 
                  top-1/2 right-full mr-3 transform -translate-y-1/2 
                  whitespace-normal select-text pointer-events-auto leading-relaxed font-normal">
                <div className="text-left">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dead Weight:</span>
                      <span>{orderDetails?.packageDetails?.weight || orderDetails?.packageDetails?.applicableWeight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Volumetric Weight:</span>
                      <span>
                        {Number(
                          ((orderDetails?.packageDetails?.volumetricWeight?.length || 0) *
                            (orderDetails?.packageDetails?.volumetricWeight?.width || 0) *
                            (orderDetails?.packageDetails?.volumetricWeight?.height || 0)) /
                          5000
                        ).toFixed(2)}{" "}
                        kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">Applicable Weight:</span>
                      <span className="font-semibold">{orderDetails?.packageDetails?.applicableWeight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">L*W*H:</span>
                      <span>
                        {orderDetails?.packageDetails?.volumetricWeight?.length} * {orderDetails?.packageDetails?.volumetricWeight?.width} * {orderDetails?.packageDetails?.volumetricWeight?.height}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* INVISIBLE HOVER BRIDGE */}
              <div className="absolute right-full top-0 w-4 h-full"></div>
            </div>
          </div>
        </div>

        {/* Mobile View Card */}
        <div className="block sm:hidden w-full my-2 mt-6">
          <div className="relative bg-white rounded-lg shadow-md border flex py-3 px-0 min-h-[115px]">
            {/* FROM/TO COLUMN */}
            <div className="flex-1 flex flex-col items-center justify-center relative border-r last:border-r-0">
              {/* Floating Icon */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-50">
                <span className="w-10 h-10 flex items-center justify-center text-gray-700 bg-white rounded-full shadow-lg border p-1">
                  <FaMapMarkerAlt className="text-[#0CBB7D] text-[16px]" />
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
                    <div ref={popupRef} className="absolute animate-popup-in z-[200] bg-white border shadow-2xl rounded-md p-3 w-[220px] top-0 left-full ml-4">
                      <div className="text-left select-text text-[10px] leading-tight">
                        <p className="font-[600] text-gray-700">{orderDetails?.pickupAddress?.contactName}</p>
                        <p className="text-[10px] text-gray-600 mt-1">{orderDetails?.pickupAddress?.address}</p>
                        <p className="text-[10px] text-gray-600">
                          {orderDetails?.pickupAddress?.city}, {orderDetails?.pickupAddress?.state} - {orderDetails?.pickupAddress?.pinCode}
                        </p>
                        <p className="text-[10px] text-gray-700 mt-1">{orderDetails?.pickupAddress?.phoneNumber}</p>
                      </div>
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
                    <div ref={popupRef} className="absolute z-[200] bg-white border shadow-2xl rounded-md p-3 w-[220px] bottom-0 left-full animate-popup-in ml-4">
                      <div className="text-left select-text text-[10px] leading-tight">
                        <p className="font-[600] text-gray-700">{orderDetails?.receiverAddress?.contactName}</p>
                        <p className="text-[10px] text-gray-600 mt-1">{orderDetails?.receiverAddress?.address}</p>
                        <p className="text-[10px] text-gray-600">
                          {orderDetails?.receiverAddress?.city}, {orderDetails?.receiverAddress?.state} - {orderDetails?.receiverAddress?.pinCode}
                        </p>
                        <p className="text-[10px] text-gray-700 mt-1">{orderDetails?.receiverAddress?.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* ORDER VALUE COLUMN */}
            <div className="flex-1 flex flex-col items-center justify-center relative border-r last:border-r-0">
              {/* Floating Icon */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-50">
                <span className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg border p-1">
                  <FaRupeeSign className="text-[#0CBB7D] text-[16px]" />
                </span>
              </div>
              <div className="mt-7 flex flex-col items-center">
                <span className="font-[600] text-[12px] text-gray-700">{orderDetails?.paymentDetails?.method?.toUpperCase()}</span>
                <span className="text-gray-500 font-[600] text-[12px] mt-0.5">Order Value</span>
                <span className="text-[12px] font-[600] text-gray-700 mt-0.5 mb-1">₹{Number(orderDetails?.paymentDetails?.amount || 0).toFixed(2)}</span>
              </div>
            </div>
            {/* WEIGHT COLUMN */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Floating Icon */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-50">
                <span className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg border p-1">
                  <FaWeightHanging className="text-[#0CBB7D] text-[16px]" />
                </span>
              </div>
              <div
                className="mt-7 flex flex-col items-center relative"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenPopup(openPopup === "weight" ? null : "weight");
                }}
              >
                <span className="text-gray-500 font-[600] text-[12px]">Weight</span>
                <span className="text-[12px] font-[600] text-gray-700 border-b border-dashed border-gray-400">
                  {orderDetails?.packageDetails?.applicableWeight || ""}Kg
                </span>

                {openPopup === "weight" && (
                  <div ref={popupRef} className="absolute z-[300] bg-white border shadow-xl rounded-lg p-3 w-[220px] top-0 right-full mr-4 animate-popup-in transition-all duration-200 ease-out">
                    <p className="font-semibold text-[10px] text-gray-700 mb-2 border-b pb-1">Weight Details</p>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dead Weight:</span>
                        <span className="font-[600]">{orderDetails?.packageDetails?.weight || orderDetails?.packageDetails?.applicableWeight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Volumetric Weight:</span>
                        <span className="font-[600]">
                          {Number(
                            ((orderDetails?.packageDetails?.volumetricWeight?.length || 0) *
                              (orderDetails?.packageDetails?.volumetricWeight?.width || 0) *
                              (orderDetails?.packageDetails?.volumetricWeight?.height || 0)) /
                            5000
                          ).toFixed(2)}{" "}
                          kg
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Applicable Weight:</span>
                        <span className="font-[600]">{orderDetails?.packageDetails?.applicableWeight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">L*W*H:</span>
                        <span className="font-[600]">
                          {orderDetails?.packageDetails?.volumetricWeight?.length}*{orderDetails?.packageDetails?.volumetricWeight?.width}*{orderDetails?.packageDetails?.volumetricWeight?.height}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden sm:pb-2">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <ThreeDotLoader />
          </div>
        ) : plan.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden overflow-y-auto h-[calc(100vh-210px)] pb-10">
              {plan.map((item, idx) => {
                const isActive = selectedCourier?.courierServiceName === item.courierServiceName;
                return (
                  <div
                    key={item._id}
                    className={`relative border text-[10px] rounded-lg p-3 mb-2 shadow-sm bg-white cursor-pointer transition
                      ${isActive ? "border-[#0CBB7D] ring-[#0CBB7D]" : "border-gray-200"}
                    `}
                    onClick={() => setSelectedCourier(item)}
                  >
                    <div className="flex justify-between items-center gap-4 w-full mb-2">
                      <div className="flex justify-center gap-4 w-full">
                        <img
                          src={getCarrierLogo(item.courierServiceName)}
                          alt={item.courierServiceName}
                          className="w-8 h-8 rounded-md border"
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
                            <div
                              className="relative cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenPopup(openPopup === `weight_${idx}` ? null : `weight_${idx}`);
                              }}
                            >
                              <p className="text-center text-[10px] font-[600] text-gray-500 border-b border-dashed border-gray-400">
                                {(() => {
                                  const serviceWeight = Number(item?.courierServiceName?.match(/\d+/)?.[0]);
                                  const applicableWeight = orderDetails?.packageDetails?.applicableWeight || 0;
                                  return serviceWeight > applicableWeight ? serviceWeight : applicableWeight;
                                })()}{" "}
                                kg
                              </p>
                              {openPopup === `weight_${idx}` && (
                                <div ref={popupRef} className={`absolute z-[500] bg-white border shadow-xl rounded-lg p-3 w-[200px] right-0 animate-popup-in transition-all duration-200 ${idx === 0 ? "top-full mt-2" : "bottom-full mb-2"}`}>
                                  <p className="font-semibold text-gray-700 mb-2 border-b pb-1">Weight Details</p>
                                  <div className="space-y-1 text-[10px]">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Dead Weight:</span>
                                      <span className="font-[600]">{orderDetails?.packageDetails?.weight || orderDetails?.packageDetails?.applicableWeight} kg</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Volumetric:</span>
                                      <span className="font-[600]">
                                        {Number(
                                          ((orderDetails?.packageDetails?.volumetricWeight?.length || 0) *
                                            (orderDetails?.packageDetails?.volumetricWeight?.width || 0) *
                                            (orderDetails?.packageDetails?.volumetricWeight?.height || 0)) /
                                          5000
                                        ).toFixed(2)}{" "}
                                        kg
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Dimensions:</span>
                                      <span className="font-[600]">
                                        {orderDetails?.packageDetails?.volumetricWeight?.length}*{orderDetails?.packageDetails?.volumetricWeight?.width}*{orderDetails?.packageDetails?.volumetricWeight?.height}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Applicable Weight:</span>
                                      <span className="font-[600]">{orderDetails?.packageDetails?.applicableWeight} kg</span>
                                    </div>

                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-1 p-2 bg-green-50 rounded-lg font-[600] border-t border-gray-100">
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

                      <div className="flex justify-between relative">
                        <span className="text-gray-500">Charges</span>
                        <div className="text-gray-700 flex items-center gap-1">
                          ₹{Number(item.forward.finalCharges).toFixed(2)}
                          <FiInfo
                            className="text-[#0CBB7D] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenPopup(openPopup === `charges_${idx}` ? null : `charges_${idx}`);
                            }}
                          />
                          {openPopup === `charges_${idx}` && (
                            <div ref={popupRef} className={`absolute z-[300] bg-white border shadow-xl rounded-lg p-3 w-[200px] right-0 animate-popup-in transition-all duration-200 ${idx === 0 ? "top-full mt-2" : "bottom-full mb-2"}`}>
                              <p className="font-semibold text-gray-700 mb-2 border-b pb-1">Price Details</p>
                              <div className="space-y-1 text-[10px]">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Freight:</span>
                                  <span className="font-[600]">₹{Number(item?.forward?.charges || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">COD:</span>
                                  <span className="font-[600]">₹{Number(item?.cod || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">GST:</span>
                                  <span className="font-[600]">₹{Number(item?.forward?.gst || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1">
                                  <span className="text-gray-700 font-bold">Total:</span>
                                  <span className="font-bold text-[#0CBB7D]">₹{Number(item?.forward?.finalCharges || 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Bottom Fixed Button */}
              <div className="fixed bottom-0 left-0 w-full px-2 pb-2 z-50 md:hidden bg-gradient-to-t from-[#f5f7fb] via-[#f5f7fb] to-transparent">
                <button
                  onClick={() => handleShip()}
                  disabled={!selectedCourier || loadingButtons[selectedCourier?.courierServiceName || isAnyShipmentProcessing]}
                  className={`w-full px-3 py-2 rounded-lg font-[600] text-white bg-[#0CBB7D] shadow-lg text-[12px] transition
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
            <div className="hidden md:flex flex-col flex-1 min-h-0">
              <div className="overflow-auto relative bg-white h-[calc(100vh-205px)] shadow-sm">
                <table className="w-full text-[12px] bg-white table-fixed">
                  <thead className="sticky top-0 z-10">
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
                    {plan.map((item, index) => (
                      <tr key={item._id} className={`${item.isRecommended ? "bg-[#e9fff6]" : "bg-white"} border-b last:border-b-1 hover:bg-gray-50 transition-colors`}>
                        <td className="flex text-[12px] items-center gap-3 py-3 pl-3">
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
                        <td className="text-center align-middle py-3">
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
                          <div className="relative inline-block group">
                            <span className="border-b border-dashed border-gray-400 cursor-pointer">
                              {getWeightValue(item.courierServiceName, orderDetails?.packageDetails?.applicableWeight || 0)} kg
                            </span>
                            {/* HOVER DETAILS (STAYS OPEN) - Match OrdersTable Style */}
                            <div className={`absolute z-[200] hidden group-hover:block bg-white text-gray-700 text-[10px] p-3 rounded-md border shadow-2xl w-64 right-full mr-3 whitespace-normal break-words leading-relaxed font-normal ${index >= plan.length - 2 ? "bottom-0 mb-4" : "top-1/2 -translate-y-1/2"
                              }`}>
                              <div className="text-left select-text">
                                <p className="font-[600] text-gray-700 mb-1 border-b pb-1">Weight Detail</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Dead Weight:</span>
                                    <span>{orderDetails?.packageDetails?.weight || orderDetails?.packageDetails?.applicableWeight} kg</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Volumetric Weight:</span>
                                    <span>
                                      {Number(
                                        ((orderDetails?.packageDetails?.volumetricWeight?.length || 0) *
                                          (orderDetails?.packageDetails?.volumetricWeight?.width || 0) *
                                          (orderDetails?.packageDetails?.volumetricWeight?.height || 0)) /
                                        5000
                                      ).toFixed(2)}{" "}
                                      kg
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Applicable Weight:</span>
                                    <span className="font-[600]">{orderDetails?.packageDetails?.applicableWeight} kg</span>
                                  </div>

                                </div>
                              </div>
                              {/* INVISIBLE HOVER BRIDGE */}
                              <div className="absolute left-full top-0 w-3 h-full"></div>
                            </div>
                          </div>
                        </td>

                        <td className="text-center font-[600] text-gray-700 text-[12px]">
                          <div className="flex items-center justify-center gap-1">
                            ₹{Number(item.forward.finalCharges).toFixed(2)}
                            <div className="relative group p-1">
                              <FiInfo className="text-[#0CBB7D] cursor-help" />
                              {/* HOVER DETAILS (STAYS OPEN) - Match OrdersTable Style */}
                              <div className={`absolute z-[200] hidden group-hover:block bg-white text-gray-700 text-[10px] p-3 rounded-md border shadow-2xl w-48 right-full mr-3 whitespace-normal break-words leading-relaxed font-normal ${index >= plan.length - 2 ? "bottom-0 mb-4" : "top-1/2 -translate-y-1/2"
                                }`}>
                                <div className="text-left select-text">
                                  <p className="font-[600] text-gray-700 mb-1 border-b pb-1">Price Breakup</p>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-gray-500">
                                      <span>Freight:</span>
                                      <span className="text-gray-700">₹{Number(item?.forward?.charges || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500">
                                      <span>COD:</span>
                                      <span className="text-gray-700">₹{Number(item?.cod || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500">
                                      <span>GST:</span>
                                      <span className="text-gray-700">₹{Number(item?.forward?.gst || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-t mt-1 pt-1 font-[600]">
                                      <span className="text-gray-700">Total:</span>
                                      <span className="text-[#0CBB7D]">₹{Number(item?.forward?.finalCharges || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* INVISIBLE HOVER BRIDGE */}
                                <div className="absolute left-full top-0 w-3 h-full"></div>
                              </div>
                            </div>
                          </div>
                        </td>
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
        )
        }
      </div >

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
    </div >
  );
};

export default CarrierSelection;


