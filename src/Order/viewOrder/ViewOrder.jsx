import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";
import ViewOrderHeader from "./ViewOrderHeader";
import OrderDetailsSection from "./OrderDetailsSection";
import PickupDetailsSection from "./PickupDetailsSection";
import ReceiverDetailsSection from "./ReceiverDetailsSection";
import PackageDetailsSection from "./PackageDetailsSection";
import ShippingDetailsSection from "./ShippingDetailsSection";
import ProductDetailsSection from "./ProductDetailsSection";
import TrackingDetailsSection from "./TrackingDetailsSection";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import Loader from "../../Loader"

const ViewOrder = ({ isSidebarAdmin }) => {
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [error, setError] = useState("");
  const [employeeAccess, setEmployeeAccess] = useState({
    isAdmin: false,
    canUpdate: false,
  });
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [userId, setUserId] = useState(null);

  const { id } = useParams();
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = Cookies.get("session");

        console.log("Fetching order with ID:", id);

        if (isSidebarAdmin) {
          setEmployeeAccess({ isAdmin: true, canUpdate: true });
          setShowEmployeeAuthModal(false);
        } else {
          const userInfo = JSON.parse(atob(token.split(".")[1]));
          setUserId(userInfo._id || userInfo.id);

          if (userInfo.employee && userInfo.employee.isEmployee === true) {
            const employeeResponse = await axios.get(
              `${REACT_APP_BACKEND_URL}/staffRole/verify`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const employee = employeeResponse.data.employee;
            const canUpdate =
              !!employee?.accessRights?.orders?.["All Orders"]?.update;
            setEmployeeAccess({ canUpdate });
            if (!canUpdate) setShowEmployeeAuthModal(true);
          } else {
            setUserId(userInfo._id || userInfo.id);
            setEmployeeAccess({ isAdmin: false, canUpdate: true });
            setShowEmployeeAuthModal(false);
          }
        }

        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/order/getOrderById/${id}`,
          { headers: { authorization: `Bearer ${token}` } }
        );

        console.log("Order fetched successfully:", response.data);
        setOrder(response.data);

        const filteredTracking = response.data.tracking
          ? response.data.tracking.filter(
            (item) => Object.keys(item).length > 1
          )
          : [];
        setTracking(filteredTracking);
      } catch (error) {
        console.error("Error fetching order:", error);
        console.error("Error details:", error.response?.data);
        setError(error.response?.data?.error || error.response?.data?.message || "Failed to fetch order.");
      }
    };

    if (id) {
      fetchOrder();
    } else {
      console.error("No order ID provided");
      setError("No order ID provided");
    }
  }, [id, isSidebarAdmin, REACT_APP_BACKEND_URL]);

  const handleUpdatePickupDetails = async (updatedData) => {
    try {
      const token = Cookies.get("session");

      await axios.put(
        `${REACT_APP_BACKEND_URL}/order/updateOrder/${id}`,
        { pickupAddress: updatedData },
        { headers: { authorization: `Bearer ${token}` } }
      );

      setOrder((prevOrder) => ({
        ...prevOrder,
        pickupAddress: updatedData,
      }));
      Notification("Pickup details updated successfully", "success");
    } catch (error) {
      Notification("Failed to update pickup details", "error");
      console.error("Error updating pickup details:", error);
    }
  };

  const handleUpdateReceiverDetails = async (updatedReceiverAddress) => {
    try {
      const token = Cookies.get("session");

      await axios.put(
        `${REACT_APP_BACKEND_URL}/order/updateOrder/${id}`,
        { receiverAddress: updatedReceiverAddress },
        { headers: { authorization: `Bearer ${token}` } }
      );

      setOrder((prevOrder) => ({
        ...prevOrder,
        receiverAddress: updatedReceiverAddress,
      }));
      Notification("Receiver details updated successfully", "success");
    } catch (error) {
      Notification("Failed to update receiver details", "error");
      console.error("Error updating receiver details:", error);
    }
  };

  const handleUpdatePackageDetails = async (updatedPackageData) => {
    try {
      const token = Cookies.get("session");

      // Check if this is a B2B order by checking if the data is an array (B2B packages)
      const isB2BUpdate = Array.isArray(updatedPackageData);

      if (isB2BUpdate) {
        // B2B Package Update
        await axios.put(
          `${REACT_APP_BACKEND_URL}/b2b/orders/${id}/b2b-packages`,
          { packages: updatedPackageData },
          { headers: { authorization: `Bearer ${token}` } }
        );

        // Recalculate weights
        const deadWeight = updatedPackageData.reduce((sum, pkg) => {
          return sum + (parseFloat(pkg.weightPerBox) || 0) * (parseFloat(pkg.noOfBox) || 0);
        }, 0);

        const volumetricWeight = updatedPackageData.reduce((sum, pkg) => {
          const vol = ((pkg.length * pkg.width * pkg.height) / 5000 || 0) * (parseFloat(pkg.noOfBox) || 0);
          return sum + vol;
        }, 0);

        const applicableWeight = Math.max(deadWeight, volumetricWeight);

        setOrder((prevOrder) => ({
          ...prevOrder,
          B2BPackageDetails: {
            packages: updatedPackageData,
            deadWeight,
            volumetricWeight,
            applicableWeight,
          },
        }));
      } else {
        // B2C Package Update
        const formattedData = {
          packageDetails: {
            applicableWeight: updatedPackageData.weight,
            volumetricWeight: {
              length: updatedPackageData.length,
              width: updatedPackageData.width,
              height: updatedPackageData.height,
            },
          },
        };

        await axios.put(
          `${REACT_APP_BACKEND_URL}/order/updateOrder/${id}`,
          formattedData,
          { headers: { authorization: `Bearer ${token}` } }
        );

        setOrder((prevOrder) => ({
          ...prevOrder,
          packageDetails: formattedData.packageDetails,
        }));
      }

      Notification("Package details updated successfully", "success");
    } catch (error) {
      console.error("Error updating package details:", error);
      console.error("Error response:", error.response?.data);
      Notification(error.response?.data?.message || "Failed to update package details", "error");
    }
  };

  const handleUpdateProductDetails = async (updatedProducts) => {
    try {
      const token = Cookies.get("session");

      await axios.put(
        `${REACT_APP_BACKEND_URL}/order/updateProductDetails/${id}`,
        { productDetails: updatedProducts },
        { headers: { authorization: `Bearer ${token}` } }
      );

      setOrder((prevOrder) => ({
        ...prevOrder,
        productDetails: updatedProducts,
      }));
      Notification("Product details updated successfully", "success");
    } catch (error) {
      Notification("Failed to update product details", "error");
      console.error("Error updating product details:", error);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-red-500 text-center p-8 rounded-lg">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p className="text-sm">No Order Found</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-[#0CBB7D] text-white rounded-lg hover:opacity-90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <Loader />
          {/* <p className="mt-4 text-gray-600 text-sm">Loading order details...</p> */}
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 sm:p-2 bg-gray-50">
      {/* Header */}
      <ViewOrderHeader order={order} />

      {/* Main Content - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-2">
        {/* Left Section - 80% on desktop */}
        <div className="lg:col-span-4 space-y-2">
          {/* Order Details */}
          <OrderDetailsSection order={order} />

          {/* Pickup Details */}
          {(isSidebarAdmin || employeeAccess.canUpdate) ? (
            <PickupDetailsSection
              order={order}
              onUpdate={handleUpdatePickupDetails}
              userId={order?.userId || userId}
            />
          ) : (
            <PickupDetailsSection
              order={order}
              onUpdate={() => setShowEmployeeAuthModal(true)}
              userId={order?.userId || userId}
            />
          )}

          {/* Receiver Details */}
          {(isSidebarAdmin || employeeAccess.canUpdate) ? (
            <ReceiverDetailsSection
              order={order}
              onUpdate={handleUpdateReceiverDetails}
            />
          ) : (
            <ReceiverDetailsSection
              order={order}
              onUpdate={() => setShowEmployeeAuthModal(true)}
            />
          )}

          {/* Package Details */}
          {(isSidebarAdmin || employeeAccess.canUpdate) ? (
            <PackageDetailsSection
              order={order}
              onUpdate={handleUpdatePackageDetails}
            />
          ) : (
            <PackageDetailsSection
              order={order}
              onUpdate={() => setShowEmployeeAuthModal(true)}
            />
          )}

          {/* Shipping Details - Only if not new and not cancelled */}
          <ShippingDetailsSection order={order} />

          {/* Product Details */}
          {(isSidebarAdmin || employeeAccess.canUpdate) ? (
            <ProductDetailsSection
              order={order}
              onUpdate={handleUpdateProductDetails}
            />
          ) : (
            <ProductDetailsSection
              order={order}
              onUpdate={() => setShowEmployeeAuthModal(true)}
            />
          )}
        </div>

        {/* Right Section - 20% on desktop - Tracking */}
        <div className="lg:col-span-2">
          <TrackingDetailsSection tracking={tracking} />
        </div>
      </div>

      {/* Employee Auth Modal */}
      {!isSidebarAdmin && showEmployeeAuthModal && (
        <EmployeeAuthModal
          employeeModalShow={showEmployeeAuthModal}
          employeeModalClose={() => setShowEmployeeAuthModal(false)}
        />
      )}
    </div>
  );
};

export default ViewOrder;
