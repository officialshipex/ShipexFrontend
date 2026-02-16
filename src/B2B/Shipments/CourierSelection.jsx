import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Notification } from "../../Notification";
import Bluedart from "../../assets/bluedart.png";
import Delehivery from "../../assets/delehivery.png";
import EcomExpress from "../../assets/ecom-expresss.avif";
import Shadowfax from "../../assets/shadowfax.png";
import Xpressbees from "../../assets/xpressbees.png";
import Shiprocket from "../../assets/shiprocket.webp";
import NimbusPost from "../../assets/nimbuspost.webp";
import ShreeMaruti from "../../assets/shreemaruti.png";
import DTDC from "../../assets/dtdc.png";
import Smartship from "../../assets/bluedart.png";
import Amazon from "../../assets/amazon.jpg";
import Ekart from "../../assets/ekart.png"
import ThreeDotLoader from "../../Loader";
import { FaTruck, FaPlane, FaStar, FaInfoCircle } from "react-icons/fa";
import Cookies from "js-cookie";

const isTouchDevice = () =>
  window.matchMedia("(pointer: coarse)").matches;

const carrierLogos = {
  Bluedart,
  Delhivery: Delehivery,
  EcomExpress,
  Shadowfax,
  Xpressbees,
  NimbusPost,
  Shiprocket,
  "Shree Maruti": ShreeMaruti,
  Dtdc: DTDC,
  Amazon: Amazon,
  "Amazon Shipping": Amazon,
  Smartship,
  Ekart
};

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
  const [ratePopup, setRatePopup] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, right: 0 });

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleShip = async (courierItem) => {
    if (courierItem && typeof courierItem !== "object") return;
    const courierToShip = courierItem || selectedCourier;
    // console.log("courier servi", courierToShip);
    if (!courierToShip) return;

    const { provider, working,serviceId,modeId, courierServiceName, courier, estimatedDeliveryDate } = courierToShip;

    // sanitize provider (remove all spaces)
    const safeProvider = provider.replace(/\s+/g, "");

    const charges = parseFloat(working?.grand_total);

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
        courierServiceName,
        courier,
        estimatedDeliveryDate,
        finalCharges: working.grand_total,
        rateBreakup: working,
        serviceId,
        modeId
      };
      // console.log("payload", payload);

      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/b2b/${safeProvider}/createShipment`,
        payload
      );

      if (response.data.error) throw new Error(response.data.error);

      Notification(response?.data?.message || "Shipment created successfully", "success");
      navigate("/dashboard/b2b/order");
    } catch (error) {
      Notification(error.response?.data?.message || "Something went wrong", "error");
      console.log("service error", error);
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [courierServiceName]: false }));
      setIsAnyShipmentProcessing(false);
    }
  };

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




  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/b2b/shipNow/${id}`,
          { headers: { authorization: `Bearer ${token}` } }
        );
        console.log("courier", response.data)
        setOrderDetails(response.data.order);
        setPlan(response.data.rates);
      } catch (error) { } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id, REACT_APP_BACKEND_URL]);


  const getCarrierLogo = (courierServiceName) => {
    const lowerName = courierServiceName?.toLowerCase() || "";
    // Find a carrierLogo key that's included in the courierServiceName
    const foundKey = Object.keys(carrierLogos).find(key =>
      lowerName.includes(key.toLowerCase())
    );
    return foundKey ? carrierLogos[foundKey] : Shadowfax;
  };


  return (
    <div className="sm:px-2 bg-[#f5f7fb] text-gray-700 relative pb-2">
      <h1 className="sm:text-[18px] text-[14px] font-[600] text-gray-700 mb-2 tracking-tight">
        Order ID : <span className="text-[#0CBB7D]">{orderDetails?.orderId}</span>
      </h1>

      <div className="sm:flex hidden flex-wrap gap-2 items-center justify-between bg-white rounded-lg px-3 py-2 mb-2 shadow border">
        <div className="flex flex-col items-center gap-1 flex-1 justify-center min-w-[110px] border-b sm:border-none pb-2 sm:pb-0">
          <span className="text-gray-500 text-[12px] sm:text-[14px]">From</span>
          <span className="font-[600] text-gray-700 text-[12px] sm:text-[14px]">{orderDetails?.pickupAddress?.city || ""}</span>
          <span className="text-gray-500 text-[12px] sm:text-[14px]">{orderDetails?.pickupAddress?.pinCode || ""}</span>
        </div>
        <div className="text-2xl mx-4">→</div>
        <div className="flex flex-col items-center gap-1 flex-1 justify-center min-w-[110px] border-b sm:border-none pb-2 sm:pb-0">
          <span className="text-gray-500 text-[12px] sm:text-[14px]">To</span>
          <span className="font-[600] text-gray-700 text-[12px] sm:text-[14px]">{orderDetails?.receiverAddress?.city || ""}</span>
          <span className="text-gray-500 text-[12px] sm:text-[14px]">{orderDetails?.receiverAddress?.pinCode || ""}</span>
        </div>
        <div className="flex flex-col items-center gap-1 flex-1 min-w-[110px] px-4">
          <span className="text-gray-500 text-[12px] sm:text-[14px]">Order Value</span>
          <span className="font-[600] text-gray-700 text-[12px] sm:text-[14px]">
            ₹{orderDetails?.paymentDetails?.amount || ""}
          </span>
          <span className="text-gray-500 text-[12px] sm:text-[14px]">
            {orderDetails?.paymentDetails?.method}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 flex-1 min-w-[90px] border-l px-4">
          <span className="text-gray-500 text-[12px] sm:text-[14px]">Weight</span>
          <span className="font-[600] text-gray-700 text-[12px] sm:text-[14px]">{orderDetails?.B2BPackageDetails?.applicableWeight || ""} kg</span>
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
            <div className="mt-7 flex flex-col items-center">
              <span className="text-[12px] font-[600] text-gray-700">{orderDetails?.pickupAddress?.state || ""}</span>
              <span className="text-gray-500 text-[12px] font-[600]">{orderDetails?.pickupAddress?.pinCode || ""}</span>
              <span className="text-gray-400 text-[14px] mt-0.5 mb-1">&#8595;</span>
              <span className="text-[12px] font-[600] text-gray-700">{orderDetails?.receiverAddress?.state || ""}</span>
              <span className="text-gray-500 text-[12px] font-[600]">{orderDetails?.receiverAddress?.pinCode || ""}</span>
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
              <span className="text-[12px] font-[600] text-gray-700">{orderDetails?.B2BPackageDetails?.applicableWeight || ""}Kg</span>
              {/* <span className="text-[11px] text-gray-400">(Dead Weight)</span> */}
            </div>
          </div>
        </div>
      </div>




      <div className="">
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
                    className={`relative border text-[12px] rounded-lg p-4 mb-2 shadow-lg bg-white cursor-pointer transition
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

                          <div className="text-[12px] flex flex-col justify-center items-end">
                            <div className="flex justify-center items-center">
                              <span>Mode :</span><span>{item.courierType === "Domestic (Air)" ? (
                                <FaPlane className="text-gray-500 text-[14px]" />
                              ) : (
                                <FaTruck className="text-gray-500 text-[14px]" />
                              )}</span>
                            </div>
                            <p className="text-center text-[12px] sm:text-[14px] font-[600] text-gray-500">
                              {(() => {
                                const serviceWeight = Number(item?.courierServiceName?.match(/\d+/)?.[0]);
                                const applicableWeight = item?.working?.billable_weight || 0;

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
                        <div className="text-gray-700">₹{item.working.grand_total}
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
                    </div>

                  </div>
                );
              })}
              {/* Bottom Fixed Button */}
              <div className="fixed bottom-0 left-0 w-full px-4 pb-3 z-50 md:hidden bg-gradient-to-t from-[#f5f7fb] via-[#ffffffcc] to-transparent">
                <button
                  onClick={() => handleShip()}
                  disabled={!selectedCourier || loadingButtons[selectedCourier?.courierServiceName || isAnyShipmentProcessing]}
                  className={`w-full px-3 py-2 rounded-lg font-[600] text-white bg-[#0CBB7D] shadow text-[12px] transition
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
            {/* Desktop View (Table) remains unchanged */}
            <div className="hidden md:block">

              <div className="overflow-x-auto rounded-lg shadow bg-white max-h-[550px] overflow-y-auto">
                <table className="w-full border rounded-lg overflow-hidden text-[14px] bg-white table-fixed">
                  <thead className="bg-green-100 text-gray-700 font-[600] sticky top-0 z-10">
                    <tr>
                      <th className="py-3 pl-3 text-left">Courier Partner</th>
                      <th className="py-3 text-center">Mode</th>
                      <th className="py-3 text-center">Estimated Delivery Date</th>
                      <th className="py-3 text-center">Chargeable Weight</th>
                      <th className="py-3 text-center">Charges</th>
                      <th className="py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.map((item) => (
                      <tr key={item._id} className={`${item.isRecommended ? "bg-[#e9fff6]" : "bg-white"} border-b last:border-b-0`}>
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
                          {(item?.working?.billable_weight || 0)} kg
                        </td>
                        <td className="text-center font-[600] text-gray-700 text-[12px] relative">
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


                        </td>

                        <td className="text-center">
                          <button
                            onClick={() => handleShip(item)}
                            disabled={loadingButtons[item.courierServiceName] || isAnyShipmentProcessing}
                            className={`px-3 py-2 rounded-lg font-[600] text-[10px] sm:text-[12px] text-white bg-[#0CBB7D] shadow
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
          <p className="text-center py-6 text-gray-700 font-semibold">No Courier Serviceable for this Pincode</p>
        )}
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
  );
};

export default CarrierSelection;


