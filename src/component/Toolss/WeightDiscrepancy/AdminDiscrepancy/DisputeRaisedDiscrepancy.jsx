import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import ThreeDotLoader from "../../../../Loader";
import Cookies from "js-cookie";
import { Notification } from "../../../../Notification";
import PaginationFooter from "../../../../Common/PaginationFooter";
import UserFilter from "../../../../filter/UserFilter";
import DiscrepancyFilter from "../../../../filter/DiscrepancyFilter";
import { getCarrierLogo } from "../../../../Common/getCarrierLogo";
import NotFound from "../../../../assets/nodatafound.png";
import DetailsModal from "./DetailsModal";
import AcceptDiscrepancy from "./AcceptDiscrepancy";
import DeclinePopup from "./DeclinePopup";

const DisputeRaisedDiscrepancy = ({ refresh, setRefresh, canAction }) => {
  const [orders, setOrders] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [clearTrigger, setClearTrigger] = useState(false);
  const [page, setPage] = useState(1);
  const [provider, setProvider] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchBy, setSearchBy] = useState("awbNumber");
  const [inputValue, setInputValue] = useState("");
  const [selectedDispute, setSelectedDispute] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  const [isOpen, setIsOpen] = useState(false);
  const [isOpen1, setIsOpen1] = useState(false);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [selectedData, setSelectedData] = useState({});
  const [disputeAwbNumber, setDisputeAwbNumber] = useState();
  const [acceptAwb, setAcceptAwb] = useState("");

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiscrepancy();
  }, [selectedUserId, dateRange, page, limit, inputValue, searchBy, provider]);

  const fetchDiscrepancy = async () => {
    try {
      const token = Cookies.get("session");
      setLoading(true);
      const params = {
        userSearch: selectedUserId || "",
        page,
        limit,
        provider,
        status: "Discrepancy Raised"
      };

      if (dateRange?.[0]) {
        params.fromDate = dateRange[0].startDate.toISOString();
        params.toDate = dateRange[0].endDate.toISOString();
      }

      if (inputValue?.trim()) {
        params[searchBy] = inputValue.trim();
      }

      const response = await axios.get(
        `${REACT_APP_BACKEND_URL}/dispreancy/getAllDiscrepancy`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: params
        }
      );
      const totalCount = response.data.total || 0;
      setOrders(response.data.results || []);
      setTotal(totalCount);
      setTotalPages(Math.ceil(totalCount / limit));
      setLoading(false);
    } catch (error) {
      Notification("Error fetching transactions", "error");
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedDispute.length === orders.length && orders.length > 0) {
      setSelectedDispute([]);
    } else {
      setSelectedDispute(orders.map((order) => order._id));
    }
  };

  const handleCheckboxChange = (orderId) => {
    setSelectedDispute((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleExport = async () => {
    if (selectedDispute.length === 0) {
      Notification("Please select at least one order to export.", "info");
      return;
    }

    try {
      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/dispreancy/exportWeightDiscrepancy`,
        { disputeId: selectedDispute },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "weight_discrepancy_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Notification("Export successful!", "success");
    } catch (error) {
      Notification("Failed to export data.", "error");
    }
  };

  const handleBulkDecline = () => {
    if (selectedDispute.length === 0) {
      Notification("Please select at least one dispute to decline.", "info");
      return;
    }
    const selectedAwbNumbers = orders
      .filter((order) => selectedDispute.includes(order._id))
      .map((o) => o.awbNumber);
    setDisputeAwbNumber(selectedAwbNumbers);
    setIsOpen1(true);
  };

  const handleTrackingByAwb = (awb) => {
    navigate(`/dashboard/order/tracking/${awb}`);
  };

  const handleOpenModal = (text, imageUrl) => {
    setSelectedData({ text, imageUrl });
    setIsModalOpen1(true);
  };

  const handleOpenPopup = (awb) => {
    setAcceptAwb(awb);
    setIsOpen(true);
  };

  const handleDeclinePopup = (awb) => {
    setDisputeAwbNumber([awb]);
    setIsOpen1(true);
  };

  return (
    <div className="w-full">
      <DiscrepancyFilter
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        dateRange={dateRange}
        setDateRange={setDateRange}
        searchBy={searchBy}
        setSearchBy={setSearchBy}
        inputValue={inputValue}
        setInputValue={setInputValue}
        provider={provider}
        setProvider={setProvider}
        clearTrigger={clearTrigger}
        setClearTrigger={setClearTrigger}
        setPage={setPage}
        handleExport={handleExport}
        selectedDispute={selectedDispute}
        customActions={[
          {
            label: "Decline",
            onClick: handleBulkDecline
          }
        ]}
      />

      <div className="hidden md:block relative">
        <div className="relative overflow-x-auto bg-white overflow-y-auto h-[calc(100vh-310px)] border-gray-300">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="text-white bg-[#0CBB7D] text-[12px]">
                <th className="py-2 px-3">
                  <input
                    type="checkbox"
                    checked={selectedDispute.length === orders.length && orders.length > 0}
                    onChange={handleSelectAll}
                    className="cursor-pointer accent-[#FFFFFF] w-4"
                  />
                </th>
                <th className="py-2 px-3">User Details</th>
                <th className="py-2 px-3">Product Details</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Shipping Details</th>
                <th className="py-2 px-3">Applied Weight</th>
                <th className="py-2 px-3">Charged Weight</th>
                <th className="py-2 px-3">Excess Weight & Charges</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-center">Details</th>
                <th className="py-2 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-4">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <img src={NotFound} alt="No data found" className="w-60 h-60" />
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 transition-all text-[12px] text-gray-500"
                  >
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDispute.includes(order._id)}
                        onChange={() => handleCheckboxChange(order._id)}
                        className="cursor-pointer accent-[#0CBB7D] w-4"
                      />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <p className="text-[#0CBB7D]">{order.user.userId}</p>
                      <p>{order.user.fullname || order.user.name}</p>
                      <p
                        className="text-gray-500 truncate max-w-[120px]"
                        title={order.user.email}
                      >
                        {order.user.email}
                      </p>
                      <p className="text-gray-500">{order.user.phoneNumber}</p>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap text-gray-500" style={{ maxWidth: "180px", width: "130px" }}>
                      <p>
                        <span className="font-[600]">Product Name:</span>{" "}
                        <span
                          className="inline-block w-36 truncate align-bottom"
                          title={order.productDetails.map((item) => item.name).join(", ")}
                        >
                          {order.productDetails.map((item) => item.name).join(", ")}
                        </span>
                      </p>
                      <p className="break-words whitespace-normal">
                        <span className="font-bold">SKU:</span>{" "}
                        {order.productDetails.map((item) => item.sku).join(", ")}
                      </p>
                      <p>
                        <span className="font-bold">QTY:</span>{" "}
                        {order.productDetails.map((item) => item.quantity).join(", ")}
                      </p>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      <p>{new Date(order.createdAt).toLocaleTimeString()}</p>
                      <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap text-gray-500">
                      <p>
                        <span className="font-bold">AWB: </span>
                        <span
                          onClick={() => handleTrackingByAwb(order.awbNumber)}
                          className="text-[#0CBB7D] cursor-pointer"
                        >
                          {order.awbNumber}
                        </span>
                      </p>
                      <p className="text-gray-500">{order.courierServiceName}</p>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap text-gray-500">
                      <p className="font-[600]">
                        Applied weight: {order.enteredWeight?.applicableWeight} Kg
                      </p>
                      <p>Dead Weight: {order.enteredWeight?.deadWeight} Kg</p>
                      <div className="text-gray-500">
                        <p>Volumetric weight:</p>
                        <p>
                          {(
                            ((order.enteredWeight?.volumetricWeight?.length || 0) *
                              (order.enteredWeight?.volumetricWeight?.breadth || 0) *
                              (order.enteredWeight?.volumetricWeight?.height || 0)) /
                            5000
                          ).toFixed(2)}{" "}
                          Kg ({order.enteredWeight?.volumetricWeight?.length || 0}cm x{" "}
                          {order.enteredWeight?.volumetricWeight?.breadth || 0}cm x{" "}
                          {order.enteredWeight?.volumetricWeight?.height || 0}cm)
                        </p>
                      </div>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap text-gray-500">
                      <p className="font-[600]">
                        Charged weight: {order.chargedWeight?.applicableWeight} Kg
                      </p>
                      <p>Dead Weight: {order.chargedWeight?.deadWeight} Kg</p>
                      {order.chargedDimension?.length &&
                        order.chargedDimension?.breadth &&
                        order.chargedDimension?.height && (
                          <p className="text-gray-500 text-[10px]">
                            Volumetric weight:{" "}
                            {(
                              (order.chargedDimension.length *
                                order.chargedDimension.breadth *
                                order.chargedDimension.height) /
                              5000
                            ).toFixed(2)}{" "}
                            Kg ({order.chargedDimension.length}cm x{" "}
                            {order.chargedDimension.breadth}cm x{" "}
                            {order.chargedDimension.height}cm)
                          </p>
                        )}
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap text-gray-500" style={{ maxWidth: "230px", width: "180px" }}>
                      <p className="font-medium">
                        <span className="font-[600]">Excess Weight:</span>
                        {order.excessWeightCharges?.excessWeight} Kg
                      </p>
                      <p className="font-medium">
                        <span className="font-[600]">Excess Charges:</span>{" "}
                        ₹{Number(order.excessWeightCharges?.excessCharges || 0).toFixed(2)}
                      </p>
                      <p className="font-medium">
                        <span className="font-[600]">Pending Amount:</span>
                        ₹{Number(order.excessWeightCharges?.pendingAmount || 0).toFixed(2)}
                      </p>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap text-gray-500" style={{ maxWidth: "130px", width: "100px" }}>
                      <span className="px-2 py-1 rounded text-[10px] bg-green-100 text-green-700">
                        {order.adminStatus || order.status}
                      </span>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleOpenModal(order.text, order.imageUrl)}
                        className="bg-[#0CBB7D] text-white px-2 py-1 rounded-lg text-[10px] hover:bg-opacity-90 transition"
                      >
                        View Details
                      </button>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <button
                          onClick={() => handleOpenPopup(order.awbNumber)}
                          className="w-16 bg-[#0CBB7D] text-white px-2 py-1 rounded-lg text-[10px] hover:bg-opacity-90 transition disabled:opacity-50"
                          disabled={!canAction}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclinePopup(order.awbNumber)}
                          className="w-16 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] hover:bg-opacity-90 transition disabled:opacity-50"
                          disabled={!canAction}
                        >
                          Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="block md:hidden">
        <div className="px-2 py-1 bg-green-200 rounded-lg flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={selectedDispute.length === orders.length && orders.length > 0}
            onChange={handleSelectAll}
            className="accent-[#0CBB7D] w-3 h-3"
          />
          <span className="text-[10px] font-[600] text-gray-500">Select All</span>
        </div>
        <div className="space-y-4 h-[calc(100vh-290px)] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <ThreeDotLoader />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
              <img src={NotFound} alt="No data found" className="w-60 h-60" />
            </div>
          ) : (
            orders.map((order, index) => (
              <div
                key={index}
                className="rounded-lg shadow-sm border border-gray-200 bg-white overflow-hidden text-[12px]"
              >
                {/* Courier Section */}
                <div className="flex items-center justify-between bg-green-50 px-3 py-2 border-t text-[11px]">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedDispute.includes(order._id)}
                      onChange={() => handleCheckboxChange(order._id)}
                      className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                    />
                    <img
                      src={getCarrierLogo(order.courierServiceName)}
                      alt="courier"
                      className="w-6 h-6 border-2 border-gray-300 rounded-full object-contain"
                    />
                    <span className="text-gray-500">
                      {order.courierServiceName}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    AWB : <span className="text-[#0CBB7D]">{order.awbNumber}</span>
                  </span>
                </div>

                {/* Shipment Header */}
                <div className="px-3 text-gray-500">
                  Order ID : #{order.channelOrderId || order.orderId}
                </div>

                {/* Weight Comparison Row */}
                <div className="flex justify-between items-center bg-red-50 text-[10px] text-gray-700 px-3 py-2">
                  <div className="text-red-700">
                    Charged Weight: {order.chargedWeight?.applicableWeight} Kg
                  </div>
                  <div className="text-gray-700">
                    Applied Weight: {order.enteredWeight?.applicableWeight} Kg
                  </div>
                </div>

                {/* Raised Date + Action */}
                <div className="flex justify-between items-center px-3 py-2 text-gray-500">
                  <p>
                    Discrepancy Raised On:{" "}
                    <span className="">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  <p className="text-[12px] text-gray-500">
                    ₹{Number(order?.excessWeightCharges?.pendingAmount || 0).toFixed(2)}
                  </p>
                </div>

                {/* User Details */}
                <div className="bg-green-50 px-3 py-2 border-t flex justify-between items-center text-[10px] text-gray-700">
                  <div className="space-y-1">
                    <p className="">{order.user.fullname || order.user.name}</p>
                    <p>{order.user.phoneNumber}</p>
                    <p className="text-[#0CBB7D] truncate max-w-[150px]">{order.user.email}</p>
                  </div>
                  <span className="text-[10px] text-green-700 bg-green-100 px-2 py-1 rounded-lg">
                    {order.adminStatus || order.status}
                  </span>
                </div>

                {/* Specific Action Row for Dispute Raised */}
                <div className="px-3 py-2 bg-gray-50 flex justify-between items-center border-t">
                  <button
                    onClick={() => handleOpenModal(order.text, order.imageUrl)}
                    className="bg-[#0CBB7D] text-white px-3 py-1 rounded-md text-[10px]"
                  >
                    Details
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenPopup(order.awbNumber)}
                      className="bg-[#0CBB7D] text-white px-3 py-1 rounded-md text-[10px] disabled:opacity-50"
                      disabled={!canAction}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclinePopup(order.awbNumber)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md text-[10px] disabled:opacity-50"
                      disabled={!canAction}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        limit={limit}
        setLimit={setLimit}
      />

      {/* Modals and Popups */}
      {isOpen && (
        <AcceptDiscrepancy
          awb={acceptAwb}
          setIsOpen={setIsOpen}
          refresh={() => fetchDiscrepancy()}
        />
      )}
      {isOpen1 && (
        <DeclinePopup
          awbNumber={disputeAwbNumber}
          setIsOpen={setIsOpen1}
          refresh={() => fetchDiscrepancy()}
        />
      )}
      {isModalOpen1 && (
        <DetailsModal
          isOpen={isModalOpen1}
          onClose={() => setIsModalOpen1(false)}
          data={selectedData}
        />
      )}
    </div>
  );
};

export default DisputeRaisedDiscrepancy;
