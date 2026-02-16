import React from "react";
import { HiArrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

import FlipkartLogo from "../../assets/flipkartb.png";
import AmazonLogo from "../../assets/amazonb.png";
import WoocommerceLogo from "../../assets/woocommerceb.png";
import ShopifyLogo from "../../assets/shopifyb.png";
import WixLogo from "../../assets/wixb.png";
import SnapdealLogo from "../../assets/snapdealb.png";
import Magento2Logo from "../../assets/magento2b.png";
import GooglesheetsLogo from "../../assets/googlesheetsb.png";

const AddChannel = () => {
  const navigate = useNavigate();

  // List of channels
  const channels = [
    // { id: 1, name: "Flipkart", logo: FlipkartLogo },
    // { id: 2, name: "Amazon", logo: AmazonLogo },
    { id: 3, name: "Woocommerce", logo: WoocommerceLogo },
    { id: 4, name: "Shopify", logo: ShopifyLogo },
    // { id: 5, name: "Wix", logo: WixLogo },
    // { id: 6, name: "Snapdeal", logo: SnapdealLogo },
    // { id: 7, name: "Magento2", logo: Magento2Logo },
    // { id: 8, name: "Googlesheets", logo: GooglesheetsLogo },
  ];

  return (
    <div className="flex">
      {/* Main Box */}
      <div className="sm:p-2 p-1 w-full max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center mb-2">
          <div
            className="flex items-center text-gray-700 text-[14px] font-[600]"
          >
            <HiArrowLeft className="mr-2 w-6 p-1.5 rounded-full h-6 bg-gray-300 text-white hover:bg-green-400 transition-all cursor-pointer" onClick={() => navigate(-1)} />
            <span className="text-[14px]">Add Channel</span>
          </div>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 mx-auto">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="bg-gray-50 border border-gray-200 shadow-md rounded-lg flex sm:flex-col flex-row justify-between items-center text-center p-4 transition-transform transform hover:scale-100 hover:shadow-lg"
            // style={{ minHeight: "250px" }} // Adjusted height
            >
              {/* Channel Logo */}
              <img
                src={channel.logo}
                alt={channel.name}
                className="sm:w-16 sm:h-16 w-10 h-10 border-2 border-[#0CBB7D] sm:border-none rounded-full sm:mb-3 p-2"
              />
              {/* Channel Name */}
              <h3 className="text-[12px] font-[600] text-gray-500">{channel.name}</h3>
              {/* Add Button */}
              <button onClick={() => { navigate(`/channel/addchannel/${channel.name}`) }} className="bg-[#0CBB7D] text-white font-[600] rounded-lg px-3 py-1 text-[12px] hover:opacity-90 transition-all sm:mt-4">
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddChannel;
