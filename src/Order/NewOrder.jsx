import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import { useNavigate, useSearchParams } from "react-router-dom";
import AddPickupAddress from "./PickupAddress";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import AddReceiverAddress from "./AddReceiverAddress";
import { FiTruck } from "react-icons/fi";
import Cookies from "js-cookie";
import ProductDetails from "./ProductDetails";
import BulkUploadPopup from "./BulkUploadPopup";
import SelectOrderTypePopup from "./SelectOrderTypePopup";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowUp } from "@fortawesome/free-solid-svg-icons";

const NewOrder = () => {
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [pickupAddress, setPickUpAddress] = useState([]);
  const [reciveAddress, setReciveAddress] = useState([]);
  const [Recive, setRecive] = useState(null);
  const [Pickup, setPickUp] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const [isSelectOrderTypeOpen, setIsSelectOrderTypeOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState(null);
  const [clonedOrderData, setClonedOrderData] = useState(null);
  const [updateOrderData, setUpdateOrderData] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cloneId = searchParams.get("cloneId");
  const updateId = searchParams.get("updateId");
  const userId = searchParams.get("userId");
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Fetch Pickup Addresses
  useEffect(() => {
    const fetchPickupAddresses = async () => {
      try {
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/order/pickupAddress${userId ? `?userId=${userId}` : ""}`,
          {
            headers: { authorization: `Bearer ${token}` },
          },
        );
        const addresses = response.data?.data || response.data || [];
        setPickUpAddress(addresses);
      } catch (error) {
        console.error("Error fetching pickup addresses:", error);
      }
    };
    fetchPickupAddresses();
  }, [refresh, userId, REACT_APP_BACKEND_URL]);

  // Auto-select pickup address when cloning — runs whenever both addresses and cloned data are ready
  useEffect(() => {
    if (!cloneId || !clonedOrderData || pickupAddress.length === 0) return;
    const clonedPickup = clonedOrderData.pickupAddress;
    if (!clonedPickup) return;
    const matchingPickup = pickupAddress.find((addr) => {
      const a = addr.pickupAddress || addr;
      return (
        (a.contactName === clonedPickup.contactName && a.pinCode === clonedPickup.pinCode) ||
        (a.email === clonedPickup.email && a.phoneNumber === clonedPickup.phoneNumber)
      );
    });
    if (matchingPickup) {
      setPickUp(matchingPickup);
    }
  }, [cloneId, clonedOrderData, pickupAddress]);

  // Auto-select pickup address when updating — runs whenever both addresses and update data are ready
  useEffect(() => {
    if (!updateId || !updateOrderData || pickupAddress.length === 0) return;
    const updatePickup = updateOrderData.pickupAddress;
    if (!updatePickup) return;
    const matchingPickup = pickupAddress.find((addr) => {
      const a = addr.pickupAddress || addr;
      // Normalize pinCode to string for comparison (handles number vs string mismatch)
      const aPinCode = String(a.pinCode || "").trim();
      const uPinCode = String(updatePickup.pinCode || "").trim();
      return (
        (a.contactName === updatePickup.contactName && aPinCode === uPinCode) ||
        (a.phoneNumber === updatePickup.phoneNumber && aPinCode === uPinCode) ||
        (a.phoneNumber === updatePickup.phoneNumber && a.contactName === updatePickup.contactName) ||
        (a.email && updatePickup.email && a.email === updatePickup.email)
      );
    });
    if (matchingPickup) {
      setPickUp(matchingPickup);
    }
  }, [updateId, updateOrderData, pickupAddress]);

  // Fetch Cloned Order Data
  useEffect(() => {
    const fetchClonedOrder = async () => {
      if (!cloneId) return;
      try {
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/order/getOrderById/${cloneId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Handle both response.data and response.data.data structure
        const orderData = response.data?.data || response.data;

        if (orderData) {
          setClonedOrderData(orderData);
          if (orderData.receiverAddress) {
            setRecive(orderData.receiverAddress);
          }
        }
      } catch (error) {
        console.error("Error fetching cloned order:", error);
      }
    };
    fetchClonedOrder();
  }, [cloneId]);

  // Fetch Update Order Data
  useEffect(() => {
    const fetchUpdateOrder = async () => {
      if (!updateId) return;
      try {
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/order/getOrderById/${updateId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const orderData = response.data?.data || response.data;

        if (orderData) {
          setUpdateOrderData(orderData);
          if (orderData.receiverAddress) {
            setRecive(orderData.receiverAddress);
          }
        }
      } catch (error) {
        console.error("Error fetching order for update:", error);
      }
    };
    fetchUpdateOrder();
  }, [updateId]);

  const handleSetReceiverAddress = useCallback((newAddress) => {
    setReciveAddress([newAddress]);
    setRecive(newAddress);
  }, []);

  const handlePickupChange = (selectedOption) => {
    if (selectedOption?.value !== "no_address") {
      const selectedPickup = pickupAddress.find(
        (address) => address._id === selectedOption.value,
      );
      setPickUp(selectedPickup || null);
    } else {
      setPickUp(null);
    }
  };

  const pickupOptions =
    pickupAddress.length > 0
      ? pickupAddress.map((address) => ({
        value: address._id,
        label: address.pickupAddress?.contactName || "Unnamed Contact",
      }))
      : [{ value: "no_address", label: "No pickup addresses available" }];

  // When user chooses B2C or B2B
  const handleSelectOrderType = (type) => {
    setSelectedOrderType(type);
    setIsSelectOrderTypeOpen(false);
    setIsBulkUploadOpen(true);
  };

  return (
    <div className="sm:px-2 min-h-screen max-w-full mx-auto">
      <div className="flex justify-between mb-2">
        <div className="flex items-center gap-2 justify-center text-gray-700 font-[600] text-[12px] sm:text-[14px]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-green-200 transition"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <p className="text-[12px] sm:text-[14px]">{updateId ? "Update Order" : "New Order"}</p>
        </div>

        {/* BULK ORDER BUTTON */}
        <button
          className="px-3 py-2 rounded-lg bg-[#0CBB7D] text-white font-[600] text-[12px] flex items-center gap-1"
          onClick={() => setIsSelectOrderTypeOpen(true)}
        >
          <FontAwesomeIcon icon={faFileArrowUp} className="text-white pr-1" />
          Bulk Upload
        </button>
      </div>

      <div className="rounded-lg space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Pickup Details */}
          <div className="border rounded-lg p-4 space-y-2 bg-white border-[#0CBB7D]">
            <h2 className="text-[14px] text-gray-700 font-[600] flex items-center gap-2">
              <span className="bg-[#0CBB7D] text-white rounded-lg p-2">
                <FiTruck className="text-[14px]" />
              </span>
              Pickup Details
            </h2>

            <Select
              options={pickupOptions}
              onChange={handlePickupChange}
              value={Pickup ? { value: Pickup._id, label: Pickup.pickupAddress?.contactName } : null}
              className="w-full rounded-lg text-[12px]"
              // Custom theme (removes blue)
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: "#0CBB7D", // main green
                  primary75: "#0CBB7D",
                  primary50: "#DCFCE7", // hover green-100
                  primary25: "#DCFCE7",
                },
              })}
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: state.isFocused ? "#0CBB7D" : "#d1d5db",
                  boxShadow: state.isFocused ? "0 0 0 1px #0CBB7D" : "none",
                  "&:hover": { borderColor: "#0CBB7D" },
                  minHeight: "38px",
                  fontSize: "12px",
                }),

                option: (base, { isFocused, isSelected }) => ({
                  ...base,
                  backgroundColor: isSelected
                    ? "#0CBB7D" // selected color
                    : isFocused
                      ? "#DCFCE7" // hover color (green-100)
                      : "#FFFFFF",

                  color: isSelected ? "#FFFFFF" : "#1f2937",
                  fontWeight: isSelected ? "600" : "normal",
                  cursor: "pointer",
                }),

                menu: (base) => ({
                  ...base,
                  zIndex: 50,
                }),
              }}
            />

            <button
              onClick={() => setIsModalOpen1(true)}
              className="mt-3 text-[#0CBB7D] underline text-[12px] font-[600]"
            >
              + Add new pickup address
            </button>

            {Pickup && (
              <div className="mt-3 text-[12px] font-[600] bg-green-50 p-2 text-gray-500 rounded-lg">
                <p>
                  <span className="text-gray-700">Contact:</span>{" "}
                  {Pickup.pickupAddress?.contactName}
                </p>
                <p>
                  <span className="text-gray-700">Address:</span>{" "}
                  {Pickup.pickupAddress?.address}, {Pickup.pickupAddress?.city},{" "}
                  {Pickup.pickupAddress?.pinCode}
                </p>
              </div>
            )}
          </div>

          {/* Receiver Details */}
          <div className="border border-[#0CBB7D] rounded-lg p-4 space-y-2 bg-white">
            <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
              <span className="bg-[#0CBB7D] text-white rounded-lg p-2">
                <FiTruck className="text-[14px]" />
              </span>
              Receiver Details
            </h2>
            <AddReceiverAddress
              setRefresh={setRefresh}
              setReceiverAddress={handleSetReceiverAddress}
              initialData={clonedOrderData?.receiverAddress || updateOrderData?.receiverAddress}
            />
          </div>
        </div>

        {/* Package Details */}
        <ProductDetails Address={{ Recive, Pickup }} initialData={clonedOrderData || updateOrderData} userId={userId} updateId={updateId} />
      </div>

      {/* POPUPS */}
      <AddPickupAddress
        isOpen={isModalOpen1}
        onClose={() => setIsModalOpen1(false)}
        setRefresh={setRefresh}
        userId={userId}
        setPickupAddress={(newAddress) =>
          setPickUpAddress((prev) => [...prev, newAddress])
        }
      />

      {/* Select B2C / B2B Popup */}
      <SelectOrderTypePopup
        isOpen={isSelectOrderTypeOpen}
        onClose={() => setIsSelectOrderTypeOpen(false)}
        onSelect={handleSelectOrderType}
      />

      {/* Bulk Upload Popup */}
      {isBulkUploadOpen && (
        <BulkUploadPopup
          onClose={() => setIsBulkUploadOpen(false)}
          onBack={() => {
            setIsBulkUploadOpen(false);
            setIsSelectOrderTypeOpen(true);
          }}
          setRefresh={setRefresh}
          selectedOrderType={selectedOrderType}
          orderType={selectedOrderType}
        />
      )}
    </div>
  );
};

export default NewOrder;
