import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5"; // Import back icon
// import { toast } from "react-toastify";
import Shopify from "../../assets/shopifyb.png"
import CustomDropdown from "./Dropdown"
import Cookies from "js-cookie";
import {Notification} from "../../Notification"

const ShopifyIntegration = () => {
  const { id } = useParams();
  const [storeDetails, setStoreDetails] = useState({
    channel: "Shopify",
    storeName: "",
    storeURL: "",
    storeClientId: "",
    storeClientSecret: "",
    storeAccessToken: "",
    orderSyncFrequency: "",
    paymentStatusCOD: "",
    paymentStatusPrepaid: "",
    multiSeller: false,
    syncInventory: false,
    syncDate: "",
  });

  const navigate = useNavigate()
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (id) {
      // Fetch existing store details based on ID
      const [, token] = document.cookie.split("=")
      axios
        .get(`${REACT_APP_BACKEND_URL}/channel/getOneChannel/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then((response) => {
          setStoreDetails(response.data);
        })
        .catch((error) => console.error("Error fetching store details:", error));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStoreDetails({
      ...storeDetails,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async (e) => {
    const token = Cookies.get("session");
    // console.log("hi",token)

    try {

      const endpoint = id
        ? `${REACT_APP_BACKEND_URL}/channel/updateChannel/${id}` // Update existing
        : `${REACT_APP_BACKEND_URL}/channel/storeAllChannelDetails`; // Create new

      const method = id ? "put" : "post";

      const response = await axios[method](endpoint, storeDetails, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status == 200 || response.status == 201) {
        navigate("/dashboard/Setup&Manage/Channel")
      }
      console.log(response)
    } catch (error) {
      console.log(error)
      Notification(error?.response?.data?.message || "URL or Token or Secret key or Client ID are not matching","error")
    }
  };

  return (
    <div className="p-2 flex flex-col justify-start">
      <div className="flex items-center sm:mb-4 mb-2">
        {/* Back Button */}
        <IoArrowBack className="mr-2 w-6 p-1.5 rounded-full h-6 bg-gray-300 text-white hover:bg-gray-400 cursor-pointer" onClick={() => navigate(-1)} />
        <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center">
          <img
            src={Shopify}
            alt="Shopify Logo"
            className="h-6 w-auto"
          />
          <span className="ml-2">Shopify Integration</span>
        </h2>
      </div>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="w-full max-w-5xl bg-white shadow-lg rounded-lg p-4 sm:p-6">
          {/* Store Details */}
          <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
            <div>
              <label className="font-[600] block text-[10px] sm:text-[12px] text-gray-500">
                Store Name
              </label>
              <input
                type="text"
                name="storeName"
                value={storeDetails.storeName}
                onChange={handleChange}
                className="w-full px-3 py-2 h-9 border rounded-lg text-[12px] focus:outline-none"
                placeholder="Provide your store name"
              />
            </div>

            <div>
              <label className="font-[600] block text-[10px] sm:text-[12px] text-gray-500">
                Store URL
              </label>
              <input
                type="text"
                name="storeURL"
                value={storeDetails.storeURL}
                onChange={handleChange}
                className="w-full px-3 py-2 h-9 border rounded-lg text-[12px] focus:outline-none"
                placeholder="Provide your store URL"
              />
            </div>

            <div>
              <label className="font-[600] block text-[10px] sm:text-[12px] text-gray-500">
                Store Client ID
              </label>
              <input
                type="text"
                name="storeClientId"
                value={storeDetails.storeClientId}
                onChange={handleChange}
                className="w-full px-3 py-2 h-9 border rounded-lg text-[12px] focus:outline-none"
                placeholder="Provide your consumer key"
              />
            </div>

            <div>
              <label className="font-[600] block text-[10px] sm:text-[12px] text-gray-500">
                Store Client Secret
              </label>
              <input
                type="text"
                name="storeClientSecret"
                value={storeDetails.storeClientSecret}
                onChange={handleChange}
                className="w-full px-3 py-2 h-9 border rounded-lg text-[12px] focus:outline-none"
                placeholder="Provide your consumer secret"
              />
            </div>
            <div>
              <label className="font-[600] block text-[10px] sm:text-[12px] text-gray-500">
                Access Token
              </label>
              <input
                type="text"
                name="storeAccessToken"
                value={storeDetails.storeAccessToken}
                onChange={handleChange}
                className="w-full px-3 py-2 h-9 border rounded-lg text-[12px] focus:outline-none"
                placeholder="Provide your Access Token"
              />
            </div>

            <div>
              <label className="font-[600] block text-[10px] sm:text-[12px] text-gray-500">
                Order Sync Frequency
              </label>
              <CustomDropdown
                name="orderSyncFrequency"
                value={storeDetails.orderSyncFrequency}
                placeholder="Please Select"
                onChange={handleChange}
                options={[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                ]}
              />
            </div>
          </div>

          {/* Payment Status */}
          <div className="mt-4 w-full">
            <h3 className="font-[600] text-gray-700 text-[10px] sm:text-[12px]">Map Payment Statuses</h3>
            <div className="flex gap-4 justify-between">
              <div className="mt-2 w-full">
                <label className="font-[600] block text-[10px] sm:text-[12px] text-gray-500">
                  COD
                </label>
                <CustomDropdown
                  name="paymentStatusCOD"
                  value={storeDetails.paymentStatusCOD}
                  placeholder="Payment Status"
                  onChange={handleChange}
                  options={[
                    { value: "Pending", label: "Pending" },
                    { value: "Paid", label: "Paid" },
                  ]}
                />
              </div>

              <div className="mt-2 w-full">
                <label className="font-[600] block text-[10px] sm:text-[12px] text-gray-500">
                  Prepaid
                </label>
                <CustomDropdown
                  name="paymentStatusPrepaid"
                  value={storeDetails.paymentStatusPrepaid}
                  placeholder="Payment Status"
                  onChange={handleChange}
                  options={[
                    { value: "Pending", label: "Pending" },
                    { value: "Paid", label: "Paid" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Multi Seller */}
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              name="multiSeller"
              checked={storeDetails.multiSeller}
              onChange={handleChange}
              className="mr-2 accent-[#0CBB7D]"
            />
            <label className="font-[600] block text-[10px] sm:text-[12px] text-gray-500">Enable Multi Seller</label>
          </div>

          {/* Inventory Sync */}
          <div className="mt-4">
            <h3 className="font-[600] text-gray-700 text-[10px] sm:text-[12px]">Inventory</h3>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                name="syncInventory"
                checked={storeDetails.syncInventory}
                onChange={handleChange}
                className="mr-2 accent-[#0CBB7D]"
              />
              <label className="font-[600] block text-[10px] sm:text-[12px] text-gray-500">Enable Inventory Sync</label>
            </div>
            <div className="mt-2">
              <label className="font-[600] block text-[10px] sm:text-[12px] text-gray-500">
                Sync From Date
              </label>
              <input
                type="date"
                name="syncDate"
                value={storeDetails.syncDate}
                onChange={handleChange}
                className="w-full px-3 py-2 h-9 sm:w-48 border rounded-lg text-[12px] focus:outline-none"
              />
            </div>
          </div>

          {/* Add Channel Button */}
          <button
            onClick={handleSave}
            disabled={
              !storeDetails.storeName ||
              !storeDetails.storeURL ||
              !storeDetails.storeAccessToken ||
              !storeDetails.storeClientId ||
              !storeDetails.storeClientSecret
            }
            className={`mt-4 w-full text-[12px] sm:text-[12px] font-[600] sm:px-3 sm:w-32 py-2 rounded-lg transition ${!storeDetails.storeName ||
              !storeDetails.storeURL ||
              !storeDetails.storeAccessToken ||
              !storeDetails.storeClientId ||
              !storeDetails.storeClientSecret
              ? "bg-gray-400 cursor-not-allowed text-gray-700"
              : "bg-[#0CBB7D] text-white"
              }`}
          >
            {id ? "Update Channel" : "Add Channel"}
          </button>
          <p className="text-left text-[10px] mt-2 text-gray-700">Please click on the "Add Channel" button, to integrate with your shopify account.</p>
        </div>


        {/* Instructions Section */}
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-4 sm:p-6">
          <h3 className="text-[10px] sm:text-[14px] font-[600] text-gray-700">
            Steps to Integrate Shopify
          </h3>
          <ul className="list-decimal list-inside mt-2 text-gray-700 space-y-2 font-[400] text-[10px] sm:text-[12px]">
            <li>Fill in your Shopify Store name, Store URL, Store Client ID and Store client secret. Enter the details and click on add Channel to connect Shopify with Shipex.</li>
            <li>
              If you do not have these details available, Login to your Shopify account and copy the URL link in the address bar. This is the store URL. Store name is the name of your store.
            </li>
            <li>Click on settings and in the left menu choose apps and sales channels.</li>
            <li>
              Click on develop apps and in the new page, click on Create an App.
            </li>
            <li>Enter the App name and choose the app developer and click on Create.</li>
            <li>Click on API credentials. The API key is the Client ID, and the API secret is the client secret. Use the details provided to enter in the Carrier application and connect Shopify.</li>
            <li><span className="font-bold">Note:</span> If you have any questions regarding the instructions, feel free to reach out to us. We are always happy to help.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default ShopifyIntegration;
