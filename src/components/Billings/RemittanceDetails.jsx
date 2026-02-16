import React, { useEffect, useState } from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const RemittanceDetails = ({ remittanceId }) => {
  const [remittance, setRemittance] = useState(null);
  const navigate = useNavigate();
  const id = remittanceId;

  useEffect(() => {
    if (!id) return;

    const fetchRemittanceData = async () => {
      try {
        const token = Cookies.get("session");

        if (!token) {
          console.error("Authorization token missing");
          return;
        }

        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/cod/remittanceTransactionData/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success && response.data.data) {
          setRemittance(response.data.data);
        } else {
          console.error("API Error", response.data);
        }
      } catch (error) {
        console.error("Error fetching remittance data:", error);
      }
    };

    fetchRemittanceData();
  }, [remittanceId]);

  // Excel Export Function
  const exportToExcel = () => {
    if (!remittance) return;

    const XLSX = require("xlsx");

    const tableData = remittance.orderDataInArray.map((item) => {
      const lastTracking = item?.tracking?.at(-1);

      // Format date & time together
      const deliveryDateTime = lastTracking
        ? new Date(lastTracking.StatusDateTime).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        : "N/A";

      return {
        "Remittance ID": remittanceId,
        "Order ID": item.orderId,
        "Courier Service Name": item.courierServiceName || "N/A",
        "AWB Number": item.awb_number || "N/A",
        "Order Value (₹)": item.paymentDetails?.amount || 0,
        "Delivery Date & Time": deliveryDateTime, // merged column
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Remittance Data");

    XLSX.writeFile(workbook, `Remittance_${remittanceId}.xlsx`);
  };

  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  // Total remittance amount
  const totalAmount =
    remittance?.orderDataInArray.reduce(
      (sum, item) => sum + Number(item.paymentDetails?.amount || 0),
      0
    ) || 0;

  // Status icon function
  const StatusBadge = ({ status }) => {
    if (status === "Paid") {
      return (
        <div className="flex items-center gap-1 text-[#0CBB7D] font-[600] sm:text-[14px] text-[12px]">
          <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5" /> <span>Paid</span>
        </div>
      );
    }
    if (status === "Pending") {
      return (
        <div className="flex items-center gap-1 text-yellow-600 font-[600] sm:text-[14px] text-[12px]">
          <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" /> <span>Pending</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-gray-600 font-[600] sm:text-[14px] text-[12px]">
        <XCircle className="w-3 h-3 md:w-3.5 md:h-3.5" /> Unknown
      </div>
    );
  };

  if (!remittance) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  return (
    <div className="px-3 py-2 max-w-4xl">

      {/* Header Section */}
      <div className="flex w-full mb-2 justify-between items-center">

        {/* Left Block (ID + Amount + Reason) */}
        <div className="flex flex-col">
          <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
            Remittance ID : <span className="text-[#0CBB7D]">{remittanceId || "N/A"}</span>
          </h2>

          <p className="text-[12px] sm:text-[14px] font-[600] text-gray-700 mt-2">
            Total Amount : ₹{totalAmount}
          </p>

          {remittance.status === "Pending" && (remittance.reason !== "N/A" || remittance.reason === "") && (
            <p className="text-red-700 text-[12px] mt-1">
              Reason: {remittance.reason}
            </p>
          )}
        </div>

        {/* Right Block (Status Icon) */}
        <StatusBadge status={remittance.status} />
      </div>

      <hr className="my-2" />

      {/* Scrollable table container */}
      <div className="overflow-x-auto max-h-[350px] overflow-y-auto mb-2">

        <table className="sm:w-full min-w-[700px] text-left border-collapse">
          <thead className="bg-[#0CBB7D] sticky top-0 z-10">
            <tr className="text-white text-[12px] font-[600] border border-[#0CBB7D]">
              <th className="px-3 py-2">Order ID</th>
              <th className="px-3 py-2">Courier Service Name</th>
              <th className="px-3 py-2">AWB Number</th>
              <th className="px-3 py-2">Order Value</th>
              <th className="px-3 py-2">Delivery Date & Time</th>
            </tr>
          </thead>

          <tbody>
            {remittance.orderDataInArray.map((item, index) => {
              const lastTracking = item?.tracking?.at(-1);

              return (
                <tr
                  key={index}
                  className="border border-gray-200 text-[12px] hover:bg-gray-50 transition"
                >

                  {/* Order ID */}
                  <td className="px-3 py-2 text-[#0CBB7D]">
                    {item.orderId}
                  </td>

                  {/* AWB + Courier */}
                  <td className="px-3 py-2">
                    <p className="text-gray-500">{item.courierServiceName}</p>
                  </td>

                  {/* AWB */}
                  <td className="px-3 py-2 text-[#0CBB7D]">
                    <button
                      onClick={() => handleTrackingByAwb(item.awb_number)}
                      className="text-[#0CBB7D] hover:underline"
                    >
                      {item.awb_number}
                    </button>
                  </td>

                  {/* Order Amount */}
                  <td className="px-3 py-2 text-gray-500">
                    ₹{item.paymentDetails?.amount || "0.00"}
                  </td>

                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                    {lastTracking ? (
                      <div className="flex gap-2 leading-tight">
                        <span>
                          {new Date(lastTracking.StatusDateTime).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-gray-500">
                          {new Date(lastTracking.StatusDateTime).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Export Button */}
      <div className="w-full flex justify-center mt-3">
        <button
          onClick={exportToExcel}
          className="bg-[#0CBB7D] text-white px-3 py-2 rounded-lg text-[12px] font-[600] hover:bg-green-500 transition"
        >
          Export
        </button>
      </div>
    </div>
  );
};

export default RemittanceDetails;
