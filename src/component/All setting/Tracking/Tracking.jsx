
import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import Shipex from "../../../assets/shipexNoBG.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faTruckFast,
  faTruck,
  faCheckCircle,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "../../../Loader";
import { getCarrierLogo } from "../../../Common/getCarrierLogo";

function Tracing2() {
  const [input, setInput] = useState(""); // Multi-AWB input
  const [results, setResults] = useState([]); // Array of tracking objects
  const [error, setError] = useState(""); // Error message
  const [loading, setLoading] = useState(false); // Loading state
  const [copiedField, setCopiedField] = useState(null); // Which field was copied
  const { awb } = useParams();
  const [admin, setAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState(false);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;



  useEffect(() => {
    if (awb) {
      setInput(awb);
    }
  }, [awb]);

  const statusSteps = {
    "Ready To Ship": 0,
    "In-transit": 1,
    "Out for Delivery": 2,
    Delivered: 3,
    Undelivered: 1,
    RTO: 2,
    "RTO In-transit": 2,
    "RTO Out for Delivery": 2,
    "RTO Delivered": 3,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/user/getUserDetails`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("session")}`,
            },
          }
        );
        // console.log("user", res.data.user)
        setAdmin(res.data.user.isAdmin);
        setAdminTab(res.data.user.adminTab)

      } catch (error) {
        console.log("Error fetching admin status:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchSingleAwb() {
      if (!awb) return;
      setLoading(true);
      try {
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/orders/GetTrackingByAwb/${awb}`,
          { headers: { authorization: `Bearer ${token}` } }
        );
        if (response.status === 200) {
          setResults([response.data]); // wrap single tracking data in array
          setError("");
        } else {
          setResults([]);
          setError("Order not found");
        }
      } catch (err) {
        setResults([]);
        setError("Error fetching tracking info. Try again.");
      }
      setLoading(false);
    }
    fetchSingleAwb();
  }, [awb, REACT_APP_BACKEND_URL]);

  async function handleTrack() {
    setLoading(true);
    setError("");
    setResults([]);
    const awbs = input
      .split(/[,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (!awbs.length) {
      setError("Please enter at least one AWB number.");
      setLoading(false);
      return;
    }
    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/orders/GetTrackingByAwbs`,
        { awbs },
        { headers: { authorization: `Bearer ${token}` } }
      );
      setResults(response.data || []);
    } catch (err) {
      setError("Error fetching tracking info. Try again.");
    }
    setLoading(false);
  }


  // Copyable text helper
  const CopyableText = ({ label, text, copyKey }) => {
    const handleCopy = () => {
      if (!text) return;
      navigator.clipboard.writeText(text);
      setCopiedField(copyKey);
      setTimeout(() => setCopiedField(null), 2000);
    };
    return (
      <span
        onClick={handleCopy}
        className="flex items-center justify-end gap-1 cursor-pointer select-text max-w-full"
        title={`Copy ${label}`}
      >
        {label} :{" "}
        <span className="font-[600] text-[#0CBB7D] truncate max-w-[150px] sm:max-w-full">
          {text || "-"}
        </span>
        {copiedField === copyKey ? (
          <Check size={14} className="text-green-500 flex-shrink-0" />
        ) : (
          <Copy size={14} className="text-[#0CBB7D] hover:text-green-500 flex-shrink-0" />
        )}
      </span>
    );
  };

  return (
    <div className="relative bg-[#f7fafc] min-h-screen py-4 px-1 sm:px-4">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="my-4 flex flex-col gap-2 w-full items-center">
          <img className="w-40 h-14 -mt-[15px]" src={Shipex} alt="Shipex" />
          {admin && adminTab && (
            <div className="w-full">
              <div className="flex w-full flex-col">
                <div className="flex w-full gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Enter AWB numbers, separated by comma"
                    className="w-full px-3 py-2 sm:h-12 h-10 text-[12px] sm:text-[14px] text-gray-500 border rounded-lg resize-y outline-none"
                    disabled={loading}
                  />
                  <button
                    className="px-3 py-2 sm:w-[14%] w-[28%] border border-gray-100 bg-[#0CBB7D] sm:h-12 h-10 text-white font-[600] text-[10px] sm:text-[12px] rounded-lg hover:bg-green-500 transition"
                    onClick={handleTrack}
                    disabled={loading}
                  >
                    {loading ? "Tracking..." : "Track Now"}
                  </button>
                </div>

                {/* Message below input */}
                <div className="text-[8px] sm:text-[10px] text-gray-500 font-[600] mt-1 text-left">
                  Track multiple AWB separated by commas
                </div>

                {/* Error message aligned left */}
                {error && (
                  <div className="text-red-600 font-[600] text-[10px] sm:text-[12px] mt-1 text-left">
                    {error}
                  </div>
                )}
              </div>
            </div>

          )}
        </div>
        <div className="w-full">
          {loading && <Loader />}
          {results.length === 0 && !loading && (
            <div className="flex h-[15vh] items-center justify-center bg-gray-50 mt-4">
              <div className="text-gray-600 font-semibold text-lg">No tracking data yet</div>
            </div>
          )}
          {results.map((trackingAwb, idx) => (
            <TrackingCard
              key={trackingAwb?.awb_number || idx}
              trackingAwb={trackingAwb}
              statusSteps={statusSteps}
              CopyableText={CopyableText}
            />
          ))}
        </div>
      </div>
      <div className="mt-8 mb-2 text-center text-gray-500 text-xs select-none">
        Powered by{" "}
        <span className="font-bold">
          <span className="text-black">Ship</span>
          <span className="text-[#0cbb7d]">ex</span>
        </span>
      </div>
    </div>
  );
}

function TrackingCard({ trackingAwb, statusSteps, CopyableText }) {
  const [showOrder, setShowOrder] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  const isCancelled = trackingAwb.status.toLowerCase() === "cancelled";

  const steps = useMemo(() => {
    let flow;
    if (isCancelled) {
      flow = [
        { label: "Order Cancelled", icon: faBoxOpen, key: "cancelled" },
        { label: "In Transit", icon: faTruckFast, key: "In-transit" },
        { label: "Out For Delivery", icon: faTruck, key: "Out for Delivery" },
        { label: "Delivered", icon: faCheckCircle, key: "Delivered" },
      ];
    } else if (
      trackingAwb.status === "RTO" ||
      trackingAwb.status === "RTO In-transit"
    ) {
      flow = [
        { label: "Order Created", icon: faBoxOpen, key: "Ready To Ship" },
        { label: "In Transit", icon: faTruckFast, key: "In-transit" },
        { label: "RTO", icon: faTruck, key: "RTO" },
        { label: "Delivered", icon: faCheckCircle, key: "Delivered" },
      ];
    } else if (trackingAwb.status === "RTO Delivered") {
      flow = [
        { label: "Order Created", icon: faBoxOpen, key: "Ready To Ship" },
        { label: "In Transit", icon: faTruckFast, key: "In-transit" },
        { label: "RTO", icon: faTruck, key: "RTO" },
        { label: "RTO Delivered", icon: faCheckCircle, key: "RTO Delivered" },
      ];
    } else {
      flow = [
        { label: "Order Created", icon: faBoxOpen, key: "Ready To Ship" },
        { label: "In Transit", icon: faTruckFast, key: "In-transit" },
        { label: "Out For Delivery", icon: faTruck, key: "Out for Delivery" },
        { label: "Delivered", icon: faCheckCircle, key: "Delivered" },
      ];
    }
    return flow;
  }, [trackingAwb.status, isCancelled]);

  const currentStep = useMemo(
    () => (isCancelled ? 0 : statusSteps[trackingAwb?.status] ?? 0),
    [trackingAwb, statusSteps, isCancelled]
  );
  const tracking = trackingAwb?.tracking || [];

  if (!trackingAwb || Object.keys(trackingAwb).length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center bg-gray-50">
        <div className="text-red-600 font-semibold text-xl">Order not found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 mx-auto w-full mb-6">
      {/* Courier summary */}
      <div className="flex flex-row justify-between items-center px-3 pt-4 pb-2 gap-2">
        <div className="flex flex-col font-[600] text-[10px] gap-1 items-start sm:text-[12px] text-gray-700">
          <div className="flex items-center gap-2 max-w-full md:max-w-[50%] min-w-0">
            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
              <img
                src={getCarrierLogo(trackingAwb.provider)}
                alt={trackingAwb.provider}
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="font-[600] text-[12px] sm:text-[14px] text-gray-700">
              {trackingAwb.provider === "Smartship" ? "Bluedart" : trackingAwb.provider}
            </span>
          </div>
          <CopyableText label="Order ID" text={trackingAwb.orderId} copyKey="orderId" />
          <CopyableText label="Tracking ID" text={trackingAwb.awb_number} copyKey="trackingId" />
          {(trackingAwb.status === "RTO" || trackingAwb.status === "RTO In-transit" || trackingAwb.status === "RTO Delivered") && (
            <CopyableText label="RTO Tracking ID" text={trackingAwb.awb_number} copyKey="trackingId" />
          )}
          <span>
            Status :{" "}
            <span
              className={`font-[600] text-[8px] sm:text-[10px] p-1 rounded-lg ${isCancelled ? "bg-red-600 text-white" : "bg-[#0CBB7D] text-white"
                }`}
            >
              {trackingAwb.status}
            </span>
          </span>
        </div>
        <div className="flex flex-col font-[600] gap-1 text-[10px] sm:text-[12px] text-gray-700 text-right max-w-full md:max-w-[50%] break-words">
          <div className="flex gap-1">
            <p>Booked On :{" "}</p>
            <div className="font-[600] flex gap-1 text-gray-500">
              <p>{trackingAwb.shipmentCreatedAt ? new Date(trackingAwb.shipmentCreatedAt).toLocaleDateString() : "-"}</p>
              <p>{trackingAwb.shipmentCreatedAt ? new Date(trackingAwb.shipmentCreatedAt).toLocaleTimeString() : "-"}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <p>EDD :{" "}</p>
            <div className="font-[600] flex gap-1 text-gray-500">
              <p>{trackingAwb.estimatedDeliveryDate ? new Date(trackingAwb.estimatedDeliveryDate).toLocaleDateString() : "-"}</p>
              {/* <p>{trackingAwb.estimatedDeliveryDate ? new Date(trackingAwb.estimatedDeliveryDate).toLocaleTimeString() : "-"}</p> */}
            </div>
          </div>
          <div className="flex gap-1">
            <p>Last Update :{" "}</p>
            <div className="font-[600] flex gap-1 text-gray-500">
              <p>
                {trackingAwb.tracking && trackingAwb.tracking.length && trackingAwb.tracking.at(-1).StatusDateTime
                  ? new Date(new Date(trackingAwb.tracking.at(-1).StatusDateTime).getTime() - 5.5 * 60 * 60 * 1000).toLocaleDateString()
                  : "-"}
              </p>
              <p>
                {trackingAwb.tracking && trackingAwb.tracking.length && trackingAwb.tracking.at(-1).StatusDateTime
                  ? new Date(new Date(trackingAwb.tracking.at(-1).StatusDateTime).getTime() - 5.5 * 60 * 60 * 1000).toLocaleTimeString()
                  : "-"}
              </p>
            </div>
          </div>
          <div className="flex">
            <p>Delivered On :{" "}</p>
            {(trackingAwb.status === "Delivered" || trackingAwb.status === "RTO Delivered") && (
              <div className="font-[600] flex gap-1 text-gray-500">
                <p>
                  {trackingAwb.tracking && trackingAwb.tracking.length && trackingAwb.tracking.at(-1).StatusDateTime
                    ? new Date(new Date(trackingAwb.tracking.at(-1).StatusDateTime).getTime() - 5.5 * 60 * 60 * 1000).toLocaleDateString()
                    : "-"}
                </p>
                <p>
                  {trackingAwb.tracking && trackingAwb.tracking.length && trackingAwb.tracking.at(-1).StatusDateTime
                    ? new Date(new Date(trackingAwb.tracking.at(-1).StatusDateTime).getTime() - 5.5 * 60 * 60 * 1000).toLocaleTimeString()
                    : "-"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step counter */}
      <div className="w-full px-3 pt-4 pb-2 flex items-center justify-center overflow-x-auto">
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center min-w-[50px] sm:min-w-[100px] relative">
              <div
                className={`rounded-full flex items-center justify-center w-6 h-6 sm:w-10 sm:h-10 border-2 transition-all ${idx <= currentStep
                  ? isCancelled && idx === 0
                    ? "bg-red-600 border-red-600"
                    : "bg-[#0CBB7D] border-[#0CBB7D]"
                  : "bg-gray-100 border-gray-300"
                  }`}
              >
                <FontAwesomeIcon
                  icon={step.icon}
                  className={`text-[10px] sm:text-[18px] ${idx <= currentStep
                    ? isCancelled && idx === 0
                      ? "text-white"
                      : "text-white"
                    : "text-gray-300"
                    }`}
                />
              </div>
              <span
                className={`mt-2 text-[9px] sm:text-[12px] font-[600] text-center max-w-[80px] sm:max-w-[120px] ${idx <= currentStep
                  ? isCancelled && idx === 0
                    ? "text-red-600"
                    : "text-[#0CBB7D]"
                  : "text-gray-500"
                  }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-1 w-[40px] sm:w-[150px] self-center ${idx < currentStep
                  ? isCancelled && idx === 0
                    ? "bg-red-600"
                    : "bg-[#0CBB7D]"
                  : "bg-gray-300"
                  } rounded`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Tracking details */}
      <div className="px-3 pb-4">
        <div className="font-[600] text-gray-700 text-[12px] sm:text-[14px] my-2 flex items-center gap-2">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#0cbb7d]" />
          Tracking Details
        </div>

        <div className="max-h-[220px] overflow-y-auto pr-2 border rounded-lg bg-gray-50 px-3 py-1">
          {[...new Map(
            (tracking || [])
              .filter(item => item.StatusDateTime)
              .map(item => [item.StatusDateTime, item])
          ).values()]
            .reverse()
            .map((item, idx, arr) => {
              const isCancelled = item?.status?.toLowerCase() === "cancelled";
              // const isLast = idx === arr.length - 1;
              const showCancelledRed = isCancelled;

              return (
                <div key={idx} className="flex gap-3 py-2 relative">
                  {/* Date & Time */}
                  <div className="w-[80px] text-right pr-2 flex-shrink-0">
                    {item?.StatusDateTime ? (() => {
                      const d = new Date(new Date(item.StatusDateTime).getTime() - 5.5 * 3600 * 1000);
                      const year = d.getFullYear();
                      const month = d.toLocaleString("en-US", { month: "short" });
                      const day = String(d.getDate()).padStart(2, "0");
                      let hours = d.getHours();
                      const minutes = String(d.getMinutes()).padStart(2, "0");
                      const amPm = hours >= 12 ? "PM" : "AM";
                      hours = hours % 12 || 12;
                      const hourStr = String(hours).padStart(2, "0");
                      return (
                        <div className="flex flex-col items-end text-gray-500">
                          <p className="text-[10px] sm:text-[12px] font-[600]">{`${year} ${month} ${day}`}</p>
                          <p className="text-[10px] sm:text-[12px] font-[600]">{`${hourStr}:${minutes} ${amPm}`}</p>
                        </div>
                      );
                    })() : "N/A"}
                  </div>

                  {/* Timeline & Dot */}
                  <div className="flex flex-col items-center pt-1 w-[20px]">
                    <button
                      onClick={() => alert(`Clicked on step: ${item.Instructions}`)}
                      className={`w-3 h-3 rounded-full border-2 transition-all duration-300
                  ${showCancelledRed
                          ? "bg-red-600 border-red-600"
                          : idx === 0
                            ? "bg-[#0CBB7D] border-[#0CBB7D]"
                            : "bg-green-200 border-[#0CBB7D]"
                        }
                  hover:scale-110 hover:ring-2 hover:ring-[#0CBB7D] cursor-pointer`}
                    ></button>

                    {/* Vertical Line */}
                    {idx < arr.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 mt-1 mb-1 transition-colors rounded 
                    ${showCancelledRed ? "bg-red-600" : "bg-[#0CBB7D]"}`}
                      ></div>
                    )}
                  </div>

                  {/* Activity Info */}
                  <div className="flex-1 min-w-0 text-gray-500">
                    <div className="text-[10px] sm:text-[12px] font-[600] mb-0.5">
                      <span className="text-gray-700">Activity:</span> {item.Instructions}
                    </div>
                    <div className="text-[10px] sm:text-[12px] font-[600]">
                      <span className="text-gray-700">Location:</span> {item.StatusLocation}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* From/To Address Table */}
      <table className="w-full text-[10px] sm:text-[12px] my-2 border border-gray-200 rounded-lg">
        <thead>
          <tr className="bg-green-50">
            <th className="font-[600] text-gray-700 px-2 py-1"></th>
            <th className="font-[600] text-gray-700 px-2 py-1">City</th>
            <th className="font-[600] text-gray-700 px-2 py-1">State</th>
            <th className="font-[600] text-gray-700 px-2 py-1">Pin Code</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-[600] text-gray-700 px-2 py-1">From</td>
            <td className="px-2 py-1 text-center">{trackingAwb.pickupAddress?.city || "-"}</td>
            <td className="px-2 py-1 text-center">{trackingAwb.pickupAddress?.state || "-"}</td>
            <td className="px-2 py-1 text-center">{trackingAwb.pickupAddress?.pinCode || "-"}</td>
          </tr>
          <tr className="border-t">
            <td className="font-[600] text-gray-700 px-2 py-1">To</td>
            <td className="px-2 py-1 text-center">{trackingAwb.receiverAddress?.city || "-"}</td>
            <td className="px-2 py-1 text-center">{trackingAwb.receiverAddress?.state || "-"}</td>
            <td className="px-2 py-1 text-center">{trackingAwb.receiverAddress?.pinCode || "-"}</td>
          </tr>
        </tbody>
      </table>
      <button
        className="flex items-center justify-between w-full px-3 py-2 font-[600] text-gray-700 bg-transparent hover:bg-gray-50 text-[12px] sm:text-[14px] transition rounded-md"
        onClick={() => setShowOrder(!showOrder)}
      >
        <span>Order Details</span>
        {showOrder ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {showOrder && (
        <div className="border-t pt-2 pb-2 px-2 text-[10px] sm:text-[12px] w-full">
          <div className="flex justify-between">
            <span className="font-[600] text-gray-500">Order ID:</span>
            <span className="font-[600] text-gray-700">{trackingAwb.orderId || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-[600] text-gray-500">Booked On:</span>
            <span className="font-[600] text-gray-700">{trackingAwb.shipmentCreatedAt ? new Date(trackingAwb.shipmentCreatedAt).toLocaleDateString() : "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-[600] text-gray-500">Status:</span>
            <span className="font-[600] text-gray-700">{trackingAwb.status || "-"}</span>
          </div>
          {trackingAwb?.paymentDetails?.method && (
            <div className="flex justify-between">
              <span className="font-[600] text-gray-500">Payment Method:</span>
              <span className="font-[600] text-gray-700">{trackingAwb.paymentDetails.method}</span>
            </div>
          )}
          <div className="py-2 text-[10px] w-full sm:text-[12px] flex sm:flex-row flex-col gap-2 text-gray-500">
            <div className="sm:w-[50%]">
              <h4 className="font-bold text-gray-700 text-[10px] sm:text-[12px]">Pickup Address :</h4>
              <div className="flex flex-col gap-1">
                <div><span className="font-semibold">Name:</span> {trackingAwb.pickupAddress?.contactName || "-"}</div>
                <div><span className="font-semibold">Address:</span> {trackingAwb.pickupAddress?.address || "-"}</div>
                <div><span className="font-semibold">City:</span> {trackingAwb.pickupAddress?.city || "-"}</div>
                <div><span className="font-semibold">State:</span> {trackingAwb.pickupAddress?.state || "-"}</div>
                <div><span className="font-semibold">Pin:</span> {trackingAwb.pickupAddress?.pinCode || "-"}</div>
                <div><span className="font-semibold">Phone:</span> {trackingAwb.pickupAddress?.phoneNumber || "-"}</div>
                <div><span className="font-semibold">Email:</span> {trackingAwb.pickupAddress?.email || "-"}</div>
              </div>
            </div>
            <div className="sm:w-[50%]">
              <h4 className="font-bold text-gray-700 text-[10px] sm:text-[12px]">Receiver Address :</h4>
              <div className="flex flex-col gap-1">
                <div><span className="font-semibold">Name:</span> {trackingAwb.receiverAddress?.contactName || "-"}</div>
                <div><span className="font-semibold">Address:</span> {trackingAwb.receiverAddress?.address || "-"}</div>
                <div><span className="font-semibold">City:</span> {trackingAwb.receiverAddress?.city || "-"}</div>
                <div><span className="font-semibold">State:</span> {trackingAwb.receiverAddress?.state || "-"}</div>
                <div><span className="font-semibold">Pin:</span> {trackingAwb.receiverAddress?.pinCode || "-"}</div>
                <div><span className="font-semibold">Phone:</span> {trackingAwb.receiverAddress?.phoneNumber || "-"}</div>
                <div><span className="font-semibold">Email:</span> {trackingAwb.receiverAddress?.email || "-"}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowProducts(!showProducts)}
            className="flex items-center justify-between w-full mt-4 font-semibold bg-transparent hover:bg-gray-100 rounded px-2 py-1"
          >
            <span>Product Details</span>
            {showProducts ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showProducts && (
            <ul className="border rounded mt-2 mb-2 bg-gray-50 max-h-48 overflow-y-auto">
              {(trackingAwb.productDetails || []).map((product, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center px-3 py-1 border-b last:border-none text-[10px] sm:text-[12px]"
                >
                  <span className="font-[600]">{product.name}</span>
                  <span>
                    {product.quantity} X ₹{product.unitPrice}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Tracing2;


