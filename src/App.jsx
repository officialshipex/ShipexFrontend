import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./index.css"; // Tailwind CSS
import { getUserInfoFromToken } from "./utils/session.js";
// import { Toaster } from "react-hot-toast";
import { ToastProvider } from "./utils/ToastProvider";
import { ToastRegister } from "./Notification";
// Components
import ForgotPassword from "./components/Authentication/ForgetPassword.jsx";
import Navbar from "./component/Navbar/Nav.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Home from "./components/Home.jsx";
import Billing from "./components/Billings/Billing.jsx";
import Login from "./components/Authentication/Login.jsx";
import Register from "./components/Authentication/Register.jsx";
import OrdersPage from "./Order/OrderPage.jsx";
import PickupManifestDetails from "./Order/PickupManifestDetails.jsx";
import NewOrder from "./Order/NewOrder.jsx"; // Import the NewOrder component
import AdminDashboard from "./components/Dashboard/MainDashboard.jsx"; // Admin dashboard component
// import CourierList from "./components/Courier/CourierList.jsx";
import AddNewCourier from "./components/Courier/AddNewCourier.jsx";
import AddNewCourierB2B from "./B2B/Courier/AddNewCourier";
import NimbusPostAdd from "./components/Courier/NimbusPost/NimbuspostAdd.jsx";
import ShipRocketAdd from "./components/Courier/ShipRocket/ShipRocketAdd.jsx";
import XpressbeesAdd from "./components/Courier/Xpressbees/XpressbeesAdd.jsx";
import CourierServiceList from "./components/CourierServices/CourierServiceList.jsx";
import CreateNewCourier from "./components/CourierServices/CreateNewCourier.jsx";
import CreateNewCourierB2B from "./B2B/CourierServices/CreateNewCourier";
// import AllCostingRateCards from "./components/RateCard/AllCostingRateCards.jsx";
import AllRateCards from "./components/RateCard/AllRateCards.jsx";
// import CostingRateCardForm from "./components/RateCard/CostingRateCardForm.jsx";
// import PlanModal from "./components/RateCard/PlanModal.jsx";
import RateCardForm from "./components/RateCard/RateCardForm.jsx";
// import AdminCodRemittances from "./components/Billings/AdminCodRemittances.jsx";
import RemittanceDetails from "./components/Billings/RemittanceDetails.jsx";
// import NewOrder from "./Order/NewOrder"; // Import the NewOrder component
// import AdminDashboard from "./components/AdminDashboard"; // Admin dashboard component (you need to create this)
import Settings from "./component/All setting/Setting";
import Channel from "./components/Set-up&Mannage/Channels";
import Customer from "./components/Set-up&Mannage/Customers";
import PackageType from "./components/Set-up&Mannage/PackageType";
import PickupAddress from "./components/Set-up&Mannage/PickupAddress";
import AddChannel from "./components/Set-up&Mannage/AddChannel";
// import CourierSelection from "./component/All setting/Carrier Selection/CourierSelection";
import CostEstimation from "./component/Toolss/Cost Estimates/CostEstimation";
import Reports from "./component/Toolss/Report/ReportsPage";
import WeightDiscrepancy from "./component/Toolss/WeightDiscrepancy/WeightDiscrepancy";
import CourrierSelection from "./shipment/CourierSelection";
import Kyc from "./KYC/Kyc";
import ReportsPage from "./component/Toolss/Report/ReportsPage";
import NDRPage from "./NDR/ndr.jsx";
import RechargeWallet from "./recharge/RechargeWallet.jsx";
import UpdateOrder from "./Order/viewOrder/ViewOrder.jsx";
// import DashboardCards from "./components/Dashboard.jsx";
import DashboardCards from "./components/Dashboard/MainDashboard.jsx";
// import Changepassword from "./component/Navbar/changepassword.js";
import CompanyProfile from "./component/All setting/profile/ComapnyProfile.jsx";
import KYCDetails from "./component/All setting/profile/KYC.js";
import Users from "./components/Users/UserList.jsx";
import BulkSelection from "./shipment/BulkSelection.jsx";
import CodRemittanceRecharge from "./recharge/CodRemittanceRecharge.jsx";
import WooCommerceIntegration from "./components/Set-up&Mannage/WooCommerceIntegration.jsx";
import AdminWeightDiscrepancy from "./component/Toolss/WeightDiscrepancy/AdminDiscrepancy/WeightDiscrepancy.jsx";
import LabelCustomize from "./component/All setting/Label customization/LabelCustomize.jsx";
import Profile from "./components/Users/Profile.jsx"; // adjust path if needed

import Tracking from "./component/All setting/Tracking/Tracking.jsx";
// import Changepassword from "./component/Navbar/changepassword.js"
import UpdateRateCardForm from "./components/RateCard/UpdateRateCard.jsx";
import SupportPage from "./component/Support/SupportMain.jsx";
import ShopifyIntegration from "./components/Set-up&Mannage/ShopifyIntegration.jsx";
import StatusMaping from "./components/Set-up&Mannage/StatusMap/StatusMaping";
import Logo from "./assets/Group.png";
import PincodeInformation from "./components/Set-up&Mannage/Pincode Information/PincodeInformation";
// Integration Pages

// import DelhiveryAdd from "./components/Courier/DelhiveryAdd.jsx";
// import DtdcAdd from "./components/Courier/DtdcAdd.jsx";
// Add other courier integration pages here
// cod remittance-----
import AdminCodRemittances from "./components/Billings/AdminCodRemittances.jsx";
import CODRemittanceOrder from "./components/Billings/CODRemittanceOrder.jsx";
import CourierCODRemittance from "./components/Billings/CourierCODRemittance.jsx";
import SellerRemittanceData from "./components/Billings/SellerRemittanceDatas.jsx";
import ManageTickets from "./component/Support/ManageTickets.jsx";
import RoleList from "./components/Set-up&Mannage/Role/RoleList.jsx";
import AddRole from "./components/Set-up&Mannage/Role/AddRole.jsx";
import Cookies from "js-cookie";
import axios from "axios";
import Elogin from "./components/Authentication/E-Login.jsx";
import AdminOrder from "./adminOrder/OrderTab.jsx";
import AdminPickupManifestDetails from "./adminOrder/PickupManifestDetails.jsx";
import NdrTab from "./adminNDR/NdrTab.jsx";
import EmployeeAuthModal from "./employeeAuth/EmployeeAuthModal.jsx";
import COD from "./components/Billings/COD.jsx";
import Billings from "./components/adminBilling/Billings.jsx";
import Shippings from "./components/adminBilling/Shippings.jsx";
import CodRemmitances from "./components/adminBilling/CodRemmitances.jsx";
import Passbooks from "./components/adminBilling/Passbooks.jsx";
import WalletHistorys from "./components/adminBilling/WalletHistorys.jsx";
import Invoices from "./components/adminBilling/Invoices.jsx";
import AllocateRoles from "./components/Set-up&Mannage/Role/AllocateRoles.jsx";
import WalletHistoryForm from "./components/adminBilling/WalletHistoryForm.jsx";
import YourSellers from "./components/Set-up&Mannage/Role/YourSellers.jsx";
import EDDMapping from "./components/Set-up&Mannage/EDDMapping/EDDMapping";
import ResetPasswordPage from "./components/Authentication/ResetPasswordPage";
import FirstMile from "./Operations/firstMile/FirstMile.jsx";
import MidMile from "./Operations/midMile/MidMile.jsx";
import LastMile from "./Operations/lastMile/LastMile.jsx";
import CourierPriority from "./components/Set-up&Mannage/Courier/CourierPriority.jsx";
import CourierTab from "./components/Set-up&Mannage/Courier/CourierTab";
import CourierSelection from "./components/Set-up&Mannage/Courier/CourierSelection";
import CourierRules from "./components/Set-up&Mannage/Courier/CourierRules";
import Referral from "./component/All setting/Invite Friends/UserReferral.jsx";
import AdminReferral from "./component/All setting/Invite Friends/AdminReferral";
import WhatsApp from "./component/All setting/Notification/Whatsapp/Whatsapp";
import Message from "./component/All setting/Notification/Message/Message";
import Email from "./component/All setting/Notification/Email/Email";
import Notification from "./component/All setting/Notification/Notification";
import DelayDelivered from "./Operations/delayDelivered/DelayDelivered";
import Couriers from "./components/Courier/Courier";
//B2B

import B2BOrdersPage from "./B2B/Orders/OrderTab";
import B2BAdminOrder from "./B2B/adminOrders/OrderTab";
import ZoneMatrix from "./B2B/ZoneMatrix/ZoneMatrix";
import RateCard from "./B2B/RateCard/RateCard";
import CourierServices from "./components/CourierServices/CourierServices";
import CostEstimationB2B from "./component/Toolss/Cost Estimates/CostEstimationB2B";

import B2BCourrierSelection from "./B2B/Shipments/CourierSelection";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [employeeAuthenticated, setEmployeeAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // State for user
  const [refresh, setRefresh] = useState(false);
  const location = useLocation(); // Get current location
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const [kyc, setKyc] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userInfo = getUserInfoFromToken();
        if (userInfo) {
          if (userInfo.type === "employee") {
            setEmployeeAuthenticated(true);
            setIsAuthenticated(false);
            setUser(userInfo);
            setLoading(false);
          } else {
            setIsAuthenticated(true);
            setEmployeeAuthenticated(false);
            const res = await axios.get(
              `${REACT_APP_BACKEND_URL}/user/getUserDetails`,
              {
                headers: {
                  Authorization: `Bearer ${Cookies.get("session")}`,
                },
              }
            );
            setKyc(res.data.user.kycDone);
            // console.log("userdata", res.data.user);
            setUser(res.data.user);
            setLoading(false);
          }
        } else {
          setIsAuthenticated(false);
          setEmployeeAuthenticated(false);
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setEmployeeAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    };
    fetchData();
    // Only run on mount
    // eslint-disable-next-line
  }, [isAuthenticated, employeeAuthenticated, refresh]);

  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      (location.pathname === "/register" || location.pathname === "/login")
    ) {
      navigate(user.adminTab ? "/adminDashboard" : "/dashboard", {
        replace: true,
      });
    }

    if (employeeAuthenticated && location.pathname === "/e-login") {
      navigate("/adminDashboard", { replace: true });
    }
  }, [
    isAuthenticated,
    user,
    employeeAuthenticated,
    location.pathname,
    navigate,
  ]);

  // useEffect(() => {
  //   const kyc = localStorage.getItem("kyc");
  //   setKyc(kyc === "true" ? true : false);
  // }, []);

  if (loading || ((isAuthenticated || employeeAuthenticated) && !user)) {
    return (
      <div className="flex justify-center items-center h-screen bg-white relative overflow-hidden">
        {/* Logo in center */}
        <img
          src={Logo} // Replace with your logo path
          alt="Logo"
          className="z-10 w-10 h-10 object-contain"
        />

        {/* Expanding ripple effect */}
        <div className="absolute w-40 h-40 rounded-full bg-[#0CBB7D] opacity-30 animate-ping" />
      </div>
    );
  }

  return (
    <div>
      <ToastProvider>
        <ToastRegister />
        {/* Render Navbar only if user is authenticated */}
        {(isAuthenticated || employeeAuthenticated) && <Navbar />}

        <div className="flex">
          {/* Render Sidebar only if user is authenticated */}
          {(isAuthenticated || employeeAuthenticated) && (
            <Sidebar
              isAdmin={user?.isAdmin || false}
              adminTab={user?.adminTab || false}
            />
          )}{" "}
          {/* Pass isAdmin from user */}
          <div className="flex-grow p-2">
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={<Login setIsAuthenticated={setIsAuthenticated} />}
              />
              <Route
                path="/e-login"
                element={
                  <Elogin setEmployeeAuthenticated={setEmployeeAuthenticated} />
                }
              />

              <Route
                path="/register"
                element={<Register setIsAuthenticated={setIsAuthenticated} />}
              />

              <Route
                path="/reset-password"
                element={
                  <ResetPasswordPage setIsAuthenticated={setIsAuthenticated} />
                }
              />

              {/* Private Routes */}
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? (
                    <DashboardCards />
                  ) : employeeAuthenticated ? (
                    <Navigate to="/adminDashboard" />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/adminDashboard"
                element={
                  employeeAuthenticated ||
                    (isAuthenticated && (user?.isAdmin || user?.adminTab)) ? (
                    <AdminDashboard
                      isSidebarAdmin={
                        employeeAuthenticated ||
                        (isAuthenticated && (user?.isAdmin || user?.adminTab))
                      }
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/employeeAuthentication"
                element={
                  employeeAuthenticated ? (
                    <EmployeeAuthModal />
                  ) : (
                    <Navigate to="/e-login" />
                  )
                }
              />
              <Route
                path="/dashboard/rechargeWallet"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <RechargeWallet />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/CodRemittanceRecharge"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <CodRemittanceRecharge />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/user/profile"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <Profile />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              {!kyc && (
                <Route
                  path="/kyc"
                  element={
                    isAuthenticated || employeeAuthenticated ? (
                      <Kyc />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
              )}
              <Route
                path="/dashboard/b2c/order"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <OrdersPage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/order/pickup-manifest/:pickupId"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <PickupManifestDetails />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/b2b/order"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <B2BOrdersPage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/adminDashboard/b2c/order"
                element={
                  employeeAuthenticated ||
                    (isAuthenticated && user?.adminTab) ? (
                    <AdminOrder
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/adminDashboard/order/pickup-manifest/:pickupId"
                element={
                  employeeAuthenticated ||
                    (isAuthenticated && user?.adminTab) ? (
                    <AdminPickupManifestDetails />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/adminDashboard/b2b/order"
                element={
                  employeeAuthenticated ||
                    (isAuthenticated && user?.adminTab) ? (
                    <B2BAdminOrder
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/dashboard/order/tracking/:awb"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <Tracking />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/order/neworder" // New route for NewOrder page
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <NewOrder />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/order/neworder/updateOrder/:id" // New route for NewOrder page
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <UpdateOrder
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/ndr" // New route for NewOrder page
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <NDRPage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/adminDashboard/ndr" // New route for NewOrder page
                element={
                  employeeAuthenticated ||
                    (isAuthenticated && user?.adminTab) ? (
                    <NdrTab
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/order/courierSelection/:id" // New route for NewOrder page
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <CourrierSelection />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/dashboard/order/b2b/courierSelection/:id" // New route for NewOrder page
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <B2BCourrierSelection />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/billing"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <Billing />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/billing/RemittanceDetails/:id"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <RemittanceDetails />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/billing/sellerRemittanceData/:id"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <SellerRemittanceData />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/dashboard/AdminCodRemittances"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <AdminCodRemittances
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/finance/COD"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <COD isSidebarAdmin={isAuthenticated && user?.adminTab} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              >
                {/* Redirect /finance/COD to default tab */}
                <Route
                  index
                  element={<Navigate to="CODRemittance" replace />}
                />

                <Route
                  path="sellerCodRemittance"
                  element={
                    <CODRemittanceOrder
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
                <Route
                  path="CODRemittance"
                  element={
                    <AdminCodRemittances
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
                <Route
                  path="courierCodRemittance"
                  element={
                    <CourierCODRemittance
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
              </Route>

              <Route
                path="/finance/billing"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <Billings
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              >
                {/* Redirect /finance/COD to default tab */}
                <Route index element={<Navigate to="shipping" replace />} />

                <Route
                  path="shipping"
                  element={
                    <Shippings
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
                <Route
                  path="CODRemitance"
                  element={
                    <CodRemmitances
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
                <Route
                  path="passbook"
                  element={
                    <Passbooks
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
                <Route
                  path="walletHistory"
                  element={
                    <WalletHistorys
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
                <Route
                  path="invoice"
                  element={
                    <Invoices
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
              </Route>

              {/* Tools page */}
              <Route
                path="/dashboard/tools/Cost_Estimation/b2c"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <CostEstimation />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/tools/Cost_Estimation/b2b"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <CostEstimationB2B />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/dashboard/tools/reports"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <ReportsPage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/tools/Weight_Dependency"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <WeightDiscrepancy
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/adminDashboard/tools/Weight_Dependency"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <AdminWeightDiscrepancy
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Setup&Manage */}
              <Route
                path="/dashboard/Setup&Manage/Channel"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <Channel />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/channel/addchannel"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <AddChannel />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/channel/addchannel/Woocommerce"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <WooCommerceIntegration />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/channel/addchannel/Shopify"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <ShopifyIntegration />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/channel/addchannel/Shopify/:id"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <ShopifyIntegration />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/channel/addchannel/WooCommerce/:id"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <WooCommerceIntegration />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/Setup&Manage/Package_type"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <PackageType />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/Setup&Manage/Customer"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <Customer />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/Setup&Manage/Pickup_address"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <PickupAddress />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/dashboard/Setup&Manage/Courier"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <CourierTab
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              >
                {/* Redirect /finance/COD to default tab */}
                <Route
                  index
                  element={<Navigate to="courier_selection" replace />}
                />

                <Route
                  path="courier_selection"
                  element={
                    <CourierSelection
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
                <Route
                  path="courier_priority"
                  element={
                    <CourierPriority
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
                <Route
                  path="courier_rules"
                  element={
                    <CourierRules
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
              </Route>

              <Route
                path="/dashboard/Setup&Manage/User/Profile/:id/*"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <Profile />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/dashboard/Setup&Manage/Role_List"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <RoleList
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/Setup&Manage/Role_List/AddRole"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <AddRole />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/Setup&Manage/allocateRoles"
                element={
                  isAuthenticated && user?.isAdmin && user?.adminTab ? (
                    <AllocateRoles isSidebarAdmin={true} />
                  ) : employeeAuthenticated ? (
                    <YourSellers />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/adminDashboard/Setup&Manage/statusMap"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <StatusMaping
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/adminDashboard/Setup&Manage/EDD-map"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <EDDMapping
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/adminDashboard/Setup&Manage/pincode-information"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <PincodeInformation
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/adminDashboard/operations/firstmile"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <FirstMile
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/adminDashboard/operations/midmile"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <MidMile
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/adminDashboard/operations/lastmile"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <LastMile
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/adminDashboard/operations/delayDelivered"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <DelayDelivered
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/adminDashboard/setup/courier/add"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <Couriers
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              >
                {/* Redirect /finance/COD to default tab */}
                <Route index element={<Navigate to="b2c" replace />} />

                <Route
                  path="b2c"
                  element={
                    <AddNewCourier
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
                <Route
                  path="b2b"
                  element={
                    <AddNewCourierB2B
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
              </Route>

              <Route
                path="/adminDashboard/setup/courierservices/add"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <CourierServices
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              >
                {/* Redirect /finance/COD to default tab */}
                <Route index element={<Navigate to="b2c" replace />} />

                <Route
                  path="b2c"
                  element={
                    <CreateNewCourier
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
                <Route
                  path="b2b"
                  element={
                    <CreateNewCourierB2B
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  }
                />
              </Route>

              <Route
                path="/dashboard/user"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <Users isSidebarAdmin={isAuthenticated && user?.adminTab} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Integration Routes for Couriers */}
              <Route
                path="/dashboard/setup/courier/add/nimbuspost"
                element={<NimbusPostAdd />}
              />
              <Route
                path="/dashboard/setup/courier/add/shiprocket"
                element={<ShipRocketAdd />}
              />
              <Route
                path="/dashboard/setup/courier/add/xpressbees"
                element={<XpressbeesAdd />}
              />
              {/* <Route path="/dashboard/setup/courier/add/DelhiveryAdd" element={<DelhiveryAdd />} /> */}
              {/* <Route path="/dashboard/setup/courier/add/DtdcAdd" element={<DtdcAdd />} /> */}

              {/* Courier-services */}
              <Route
                path="/dashboard/setup/courier-services/create"
                element={<CreateNewCourier />}
              />

              <Route
                path="/adminDashboard/b2c/ratecard"
                element={
                  <AllRateCards
                    isSidebarAdmin={isAuthenticated && user?.adminTab}
                  />
                }
              />
              <Route
                path="/adminDashboard/b2b/ratecard"
                element={
                  <RateCard
                    isSidebarAdmin={isAuthenticated && user?.adminTab}
                  />
                }
              />
              <Route
                path="/adminDashboard/b2b/zonematrix"
                element={
                  <ZoneMatrix
                    isSidebarAdmin={isAuthenticated && user?.adminTab}
                  />
                }
              />
              <Route
                path="/adminDashboard/referral"
                element={
                  <AdminReferral
                    isSidebarAdmin={isAuthenticated && user?.adminTab}
                  />
                }
              />
              <Route
                path="/dashboard/ratecard/rateCardform"
                element={
                  <RateCardForm
                    isSidebarAdmin={isAuthenticated && user?.adminTab}
                  />
                }
              />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route
                path="/dashboard/ratecard/update/:id"
                element={
                  <UpdateRateCardForm
                    isSidebarAdmin={isAuthenticated && user?.adminTab}
                  />
                }
              />
              <Route path="/dashboard/settings" element={<Settings />}>
                <Route path="company-profile" element={<CompanyProfile />} />
                <Route path="kyc-profile" element={<KYCDetails />} />
                <Route path="label" element={<LabelCustomize />} />
                <Route path="change_password" element={<ForgotPassword />} />
                <Route path="referral" element={<Referral />} />

                {/* ✅ Nested notification route */}
                <Route path="notification" element={<Notification />}>
                  {/* Redirect default path to whatsapp */}
                  <Route index element={<Navigate to="whatsapp" replace />} />

                  <Route path="whatsapp" element={<WhatsApp />} />
                  <Route path="message" element={<Message />} />
                  <Route path="email" element={<Email />} />
                </Route>
              </Route>

              {/* Admin Route */}
              {isAuthenticated && user?.isAdmin && (
                <Route path="/admin" element={<AdminDashboard />} />
              )}

              {/* Catch-All Route */}
              <Route
                path="*"
                element={
                  employeeAuthenticated ||
                    (isAuthenticated && (user?.isAdmin || user?.adminTab)) ? (
                    <Navigate to="/adminDashboard" />
                  ) : isAuthenticated ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <Settings />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              {/* <Route
              path="/dashboard/settings/change_password"
              element={
                isAuthenticated || employeeAuthenticated ? (
                  <Changepassword />
                ) : (
                  <Navigate to="/login" />
                )
              }
            /> */}
              <Route
                path="/dashboard/support"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <SupportPage
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/adminDashboard/support/manageTickets"
                element={
                  isAuthenticated || employeeAuthenticated ? (
                    <ManageTickets
                      isSidebarAdmin={isAuthenticated && user?.adminTab}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/dashboard/order/bulkSelection"
                element={<BulkSelection />}
              />
            </Routes>
            {/* <AllCostingRateCards/> */}
            {/* <AllRateCards/> */}
            {/* <CostingRateCardForm/> */}
            {/* <PlanModal/> */}
            {/* <RateCardForm/> */}
          </div>
        </div>
      </ToastProvider>
    </div>
  );
}

export default App;
