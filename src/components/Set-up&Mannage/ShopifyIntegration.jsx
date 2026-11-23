import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5"; // Import back icon
// import { toast } from "react-toastify";
import Shopify from "../../assets/shopifyb.png"
import Cookies from "js-cookie";
import {Notification} from "../../Notification"
import { useBranding } from "../../context/BrandingContext";
import ShopifyGuideSteps from "./ShopifyGuideSteps";

const ShopifyIntegration = () => {
  const { companyDisplayName } = useBranding();
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
          </div>


          {/* Add Channel Button */}
          <button
            onClick={handleSave}
            disabled={
              !storeDetails.storeName ||
              !storeDetails.storeURL ||
              !storeDetails.storeClientId ||
              !storeDetails.storeClientSecret
            }
            className={`mt-4 w-full text-[12px] sm:text-[12px] font-[600] sm:px-3 sm:w-32 py-2 rounded-lg transition ${!storeDetails.storeName ||
              !storeDetails.storeURL ||
              !storeDetails.storeClientId ||
              !storeDetails.storeClientSecret
              ? "bg-gray-400 cursor-not-allowed text-gray-700"
              : "bg-brand-primary text-white"
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
          <p className="mt-1 text-[10px] sm:text-[12px] text-gray-500">
            Follow these steps to connect your Shopify store with {companyDisplayName}.
          </p>
          <ShopifyGuideSteps />
        </div>

      </div>
    </div>
  );
};

export default ShopifyIntegration;
