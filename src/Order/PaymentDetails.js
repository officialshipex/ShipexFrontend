import React, { useState, useEffect } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { FiCreditCard } from "react-icons/fi";
import { Notification } from "../Notification";
import OtherDetails from "./OtherDetails";

const PaymentDetails = ({ packageData, initialData, userId, updateId }) => {
  const [paymentMode, setPaymentMode] = useState("COD");
  const [showAdditionalFees, setShowAdditionalFees] = useState(false);
  const navigate = useNavigate();
  const [otherDetails, setOtherDetails] = useState({
    resellerName: "",
    gstin: "",
    ewaybill: "",
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.paymentDetails?.method) {
        setPaymentMode(initialData.paymentDetails.method);
      }
      if (initialData.otherDetails) {
        setOtherDetails({
          resellerName: initialData.otherDetails.resellerName || "",
          gstin: initialData.otherDetails.gstin || "",
          ewaybill: initialData.otherDetails.ewaybill || "",
        });
      }
    }
  }, [initialData]);
  const [totalPrices, setTotalPrice] = useState("");
  const [fees, setFees] = useState({
    shippingCharges: 0,
    giftWrap: 0,
    transactionFee: 0,
    discounts: 0,
  });
  const [customOrderNumber, setCustomOrderNumber] = useState("");
  const [allData, setAllData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalAmount = allData?.totalPrice;

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  // console.log("other details",otherDetails)
  useEffect(() => {
    if (packageData) {
      setAllData((prevData) => ({
        ...prevData,
        ...packageData,
        receiverAddress: packageData?.address?.Recive || {}, // Fix key
      }));
    }
    // console.log(packageData, "this is package data");
  }, [packageData]);
  // console.log(allData, "all data");
  const handleFeeChange = (e) => {
    const { name, value } = e.target;
    setFees((prevFees) => ({
      ...prevFees,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleCreateOrder = async () => {
    setIsSubmitting(true);

    const totalOrderValue =
      fees.shippingCharges +
      fees.giftWrap +
      fees.transactionFee -
      fees.discounts;

    const orderData = {
      ...allData,
      fees,
      paymentMode,
      customOrderNumber,
      totalOrderValue,
      otherDetails,
    };

    // ✅ Validate required fields
    const requiredFields = [
      {
        key: orderData?.address?.Pickup?.pickupAddress?.contactName,
        label: "Pickup Contact Name",
      },
      // {
      //   key: orderData?.address?.Pickup?.pickupAddress?.email,
      //   label: "Pickup Email",
      // },
      {
        key: orderData?.address?.Pickup?.pickupAddress?.phoneNumber,
        label: "Pickup Phone Number",
      },
      {
        key: orderData?.address?.Pickup?.pickupAddress?.address,
        label: "Pickup Address",
      },
      {
        key: orderData?.address?.Pickup?.pickupAddress?.pinCode,
        label: "Pickup Pin Code",
      },
      {
        key: orderData?.address?.Pickup?.pickupAddress?.city,
        label: "Pickup City",
      },
      {
        key: orderData?.address?.Pickup?.pickupAddress?.state,
        label: "Pickup State",
      },
      {
        key: orderData?.receiverAddress?.contactName,
        label: "Receiver Contact Name",
      },
      // { key: orderData?.receiverAddress?.email, label: "Receiver Email" },
      {
        key: orderData?.receiverAddress?.phoneNumber,
        label: "Receiver Phone Number",
      },
      { key: orderData?.receiverAddress?.address, label: "Receiver Address" },
      { key: orderData?.receiverAddress?.pinCode, label: "Receiver Pin Code" },
      { key: orderData?.receiverAddress?.city, label: "Receiver City" },
      { key: orderData?.receiverAddress?.state, label: "Receiver State" },
      { key: orderData?.products?.length, label: "Products" },
      { key: orderData?.paymentMode, label: "Payment Mode" },

      // {key:orderData?.selectedCommodityId,label:"Product Type"}
    ];

    const missingField = requiredFields.find((field) => !field.key);
    if (missingField) {
      Notification(`${missingField.label} is required.`, "info");
      setIsSubmitting(false);
      return;
    }

    // B2C Specific Validation
    if (orderData.orderType === "B2C") {
      if (!orderData.deadWeight) {
        Notification("Dead Weight is required for B2C orders", "info");
        setIsSubmitting(false);
        return;
      }

      if (!orderData.dimensions?.length) {
        Notification("Length is required for B2C orders", "info");
        setIsSubmitting(false);
        return;
      }
      if (!orderData.dimensions?.width) {
        Notification("Width is required for B2C orders", "info");
        setIsSubmitting(false);
        return;
      }
      if (!orderData.dimensions?.height) {
        Notification("Height is required for B2C orders", "info");
        setIsSubmitting(false);
        return;
      }
    }

    // 🔍 B2B Validations
    if (orderData.orderType === "B2B") {
      if (
        !orderData.B2BPackageDetails ||
        orderData.B2BPackageDetails.length === 0
      ) {
        Notification("At least one B2B package is required", "info");
        setIsSubmitting(false);
        return;
      }

      // Check each package fields
      for (let i = 0; i < orderData.B2BPackageDetails.length; i++) {
        const pkg = orderData.B2BPackageDetails[i];

        if (!pkg.noOfBox) {
          Notification(`Package ${i + 1}: Number of Box is required`, "info");
          setIsSubmitting(false);
          return;
        }

        if (!pkg.weightPerBox) {
          Notification(`Package ${i + 1}: Weight Per Box is required`, "info");
          setIsSubmitting(false);
          return;
        }

        if (!pkg.length) {
          Notification(`Package ${i + 1}: Length is required`, "info");
          setIsSubmitting(false);
          return;
        }

        if (!pkg.width) {
          Notification(`Package ${i + 1}: Width is required`, "info");
          setIsSubmitting(false);
          return;
        }

        if (!pkg.height) {
          Notification(`Package ${i + 1}: Height is required`, "info");
          setIsSubmitting(false);
          return;
        }
      }
    }

    if (totalAmount >= 50000 && otherDetails.ewaybill === "") {
      Notification("GST E-Waybill number is required", "info");
      setIsSubmitting(false);
      return;
    }

    const data = {
      userId: userId,
      pickupAddress: {
        contactName: orderData.address.Pickup.pickupAddress.contactName,
        email: orderData.address.Pickup.pickupAddress.email,
        phoneNumber: orderData.address.Pickup.pickupAddress.phoneNumber,
        address: orderData.address.Pickup.pickupAddress.address,
        pinCode: orderData.address.Pickup.pickupAddress.pinCode,
        city: orderData.address.Pickup.pickupAddress.city,
        state: orderData.address.Pickup.pickupAddress.state,
      },
      receiverAddress: {
        contactName: orderData.receiverAddress.contactName,
        email: orderData.receiverAddress.email,
        phoneNumber: orderData.receiverAddress.phoneNumber,
        address: orderData.receiverAddress.address,
        pinCode: orderData.receiverAddress.pinCode,
        city: orderData.receiverAddress.city,
        state: orderData.receiverAddress.state,
      },
      productDetails: orderData.products,
      packageDetails: {
        deadWeight: orderData.deadWeight,
        applicableWeight: orderData.applicableWeight,
        volumetricWeight: {
          length: orderData.dimensions.length,
          width: orderData.dimensions.width,
          height: orderData.dimensions.height,
        },
      },
      paymentDetails: {
        method: orderData.paymentMode,
        amount: allData.totalPrice,
      },
      otherDetails: {
        resellerName: orderData.otherDetails.resellerName,
        gstin: orderData.otherDetails.gstin,
        ewaybill: orderData.otherDetails.ewaybill,
      },
      orderType: orderData.orderType,
      rovType: orderData.rovType,
      B2BPackageDetails: {
        applicableWeight: orderData.finalApplicableWeight,
        volumetricWeight: orderData.finalVolumetricWeight,
        packages: orderData.B2BPackageDetails, // full B2B array
      },
      // commodityId:orderData.selectedCommodityId
    };
    // console.log(data, "this is data");
    // console.log("package data",packageData)
    try {
      const token = Cookies.get("session");
      if (!token) {
        Notification("No authentication token found.", "error");
        setIsSubmitting(false);
        return;
      }

      if (updateId) {
        // Update existing order
        await axios.put(
          `${REACT_APP_BACKEND_URL}/order/updateOrder/${updateId}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        Notification("Order updated successfully", "success");
        navigate("/dashboard/b2c/order");
      } else {
        // Create new order
        await axios.post(`${REACT_APP_BACKEND_URL}/order/neworder`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        Notification("Order created successfully", "success");
        navigate("/dashboard/b2c/order");
      }
    } catch (error) {
      console.log("error", error);
      Notification("Something went wrong while creating the order.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="border mt-2 border-[#0CBB7D] rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
        <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 mb-2 text-left flex items-center gap-2">
          <span className="bg-[#0CBB7D] text-white rounded-lg p-2">
            <FiCreditCard className="text-[14px]" />
          </span>
          Payment Details
        </h2>
        <p className="mb-2 text-gray-700 text-[12px]">
          Select Mode of Payment that your buyer has chosen for the order
        </p>

        {/* Payment Mode */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="paymentMode"
                value="COD"
                checked={paymentMode === "COD"}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="h-4 w-4 appearance-none rounded-full border-2 border-[#0CBB7D] checked:bg-[#0CBB7D] focus:outline-none cursor-pointer"
              />
              <span className="text-gray-700 text-[12px] font-[600]">COD</span>
              <p className="text-[12px] text-gray-500 ml-2">
                ( Additional charges may be applicable. )
              </p>
            </div>

            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <input
                type="radio"
                name="paymentMode"
                value="Prepaid"
                checked={paymentMode === "Prepaid"}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="h-4 w-4 appearance-none rounded-full border-2 border-[#0CBB7D] checked:bg-[#0CBB7D] focus:outline-none cursor-pointer"
              />
              <span className="text-gray-700 text-[12px] font-[600]">
                Prepaid
              </span>
              <p className="text-[12px] text-gray-500 ml-2">
                ( No additional charges. )
              </p>
            </div>
          </div>
        </div>

        {/* Additional Fees */}
        <button
          onClick={() => setShowAdditionalFees(!showAdditionalFees)}
          className="text-[#e8cafe] text-xs flex items-left space-x-2"
        >
          <span className="text-[#0CBB7D] hover:underline text-left hover:text-green-500 text-[12px] font-[600]">
            <span className="text-[#0CBB7D] hover:underline hover:text-green-500 text-[12px] font-[600]">
              +
            </span>
            Add Shipping Charges, Gift Wrap, Transaction Fee
          </span>
          <span className="ml-2 text-[12px] font-[400] text-gray-500">
            (optional)
          </span>
        </button>

        {showAdditionalFees && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
            {[
              "Shipping Charges",
              "Gift Wrap",
              "Transaction Fee",
              "Discounts",
            ].map((label) => {
              const key = label.toLowerCase().replace(/ /g, "");
              return (
                <div key={key} className="flex flex-col">
                  <label className="text-[12px] font-[600] mb-1 text-gray-700">
                    {label}
                  </label>

                  {/* Input Wrapper */}
                  <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#0CBB7D] focus-within:border-[#0CBB7D]">
                    <input
                      type="number"
                      name={key}
                      value={fees[key] || ""}
                      onChange={handleFeeChange}
                      className="w-full px-3 py-2 text-[12px] focus:outline-none border-none"
                      placeholder="0"
                    />

                    <span className="px-3 py-2 bg-gray-100 text-[12px] text-gray-600 border-l">
                      ₹
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Finalize Order */}
      </div>
      <OtherDetails
        amount={totalAmount}
        otherDetails={otherDetails}
        setOtherDetails={setOtherDetails}
      />
      <div className="flex justify-end my-2">
        <button
          onClick={handleCreateOrder}
          disabled={isSubmitting}
          className="bg-[#0CBB7D] font-[600] hover:bg-green-500 text-white text-[12px] px-3 py-2 rounded-lg shadow-sm"
        >
          {isSubmitting ? "Processing..." : (updateId ? "Update Order" : "Create Order")}
        </button>
      </div>
    </div>
  );
};

export default PaymentDetails;
