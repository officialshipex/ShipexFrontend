import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiPlus } from "react-icons/hi";
import { Pencil, Trash2 } from "lucide-react";
import axios from "axios";
import ShopifyLogo from "../../assets/shopifyb.png";
import WoocommerceLogo from "../../assets/woocommerceb.png";
// import toast from "react-hot-toast";
import { FaExclamationTriangle } from "react-icons/fa";
import ThreeDotLoader from "../../Loader"
import Cookies from "js-cookie";
import {Notification} from "../../Notification"


const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Channels = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteChannelId, setDeleteChannelId] = useState(null);
  const [channel, setChannel] = useState()
  const [syncLoading, setSyncLoading] = useState({});
  const [isFetch, setIsFetch] = useState(true)
  const [loading, setLoading] = useState(true);


  // Fetch channels from backend
  const fetchChannels = async () => {
    try {
      setLoading(false);
      const token = Cookies.get("session");
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/channel/getAllChannel`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChannels(response.data.data || []);
      setLoading(true);
      console.log(response.data.data)
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [isFetch]);

  // Navigate to add channel page
  const handleNewChannelClick = () => {
    navigate("/channel/addchannel");
  };

  // Navigate to edit channel page
  const handleEditChannel = (channel, channelId) => {
    navigate(`/channel/addchannel/${channel}/${channelId}`);
  };

  // Open the delete confirmation modal
  const confirmDelete = (channelId, storeName) => {
    setChannel(storeName)
    setDeleteChannelId(channelId);
    setShowModal(true);
  };

  const handleSync = async (channel) => {
    const channelId = channel._id;
    setSyncLoading(prev => ({ ...prev, [channelId]: true }));


    if (channel.channel === "Shopify") {
      try {
        const token = Cookies.get("session");

        const response = await axios.post(
          `${REACT_APP_BACKEND_URL}/channel/fetchOrder`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          Notification("Order synced successfully","success");
          setIsFetch(!isFetch)
        } else {
          Notification("Error syncing order","error");
        }
      } catch (error) {
        Notification("Error syncing order","error");
      } finally {
        setSyncLoading(prev => ({ ...prev, [channelId]: false }));
      }
    }
  };

  // Delete channel from backend
  const handleDeleteChannel = async () => {
    try {
      const token = Cookies.get("session");
      await axios.delete(`${REACT_APP_BACKEND_URL}/channel/delete/${deleteChannelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChannels(channels.filter(channel => channel._id !== deleteChannelId));
      setShowModal(false);
    } catch (error) {
      console.error("Error deleting channel:", error);
    }
  };

  // Get channel logo based on channel name
  const getChannelLogo = (name) => {
    if (name.toLowerCase() === "shopify") return ShopifyLogo;
    if (name.toLowerCase() === "woocommerce") return WoocommerceLogo;
    return "https://via.placeholder.com/64";
  };

  return (
    <div className="flex">
      <div className="sm:px-2 px-1 w-full max-w-full">
        <div className="flex justify-between items-center mt-1 mb-2 flex-row">
          <h2 className="text-[14px] text-gray-700 font-[600]">Channels</h2>
          <button
            onClick={handleNewChannelClick}
            className="flex items-center bg-[#0CBB7D] text-white px-3 py-2 rounded-lg hover:opacity-90 transition-all text-[12px] font-[600]"
          >
            <HiPlus className="mr-2" /> New Channel
          </button>
        </div>

        {!loading ? (
          <div className="h-96 flex justify-center items-center">
            <ThreeDotLoader />
          </div>
        ) : (

          channels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              {channels.map((channel) => (
                <div key={channel._id} className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
                  <div className="flex justify-between items-center">
                    {/* <button
                      className="pz-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-[12px] flex items-center font-[600] text-gray-500 justify-center min-w-[60px]"
                      onClick={() => handleSync(channel)}
                      disabled={syncLoading[channel._id]}
                    >
                      {syncLoading[channel._id] ? (
                        <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l4-4-4-4v4a10 10 0 00-10 10h4z" />
                        </svg>
                      ) : (
                        "Sync"
                      )}
                    </button> */}

                    <div className="flex gap-2">
                      <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg" onClick={() => handleEditChannel(channel.channel, channel._id)}>
                        <Pencil size={16} className="text-gray-600" />
                      </button>
                      <button
                        className="p-2 bg-gray-100 hover:bg-red-200 rounded-lg"
                        onClick={() => confirmDelete(channel._id, channel.storeName)}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center mt-4">
                    <img src={getChannelLogo(channel.channel)} alt={channel.channel} className="w-16 h-16 object-contain" />
                    <h3 className="md:text-[12px] text-[10px] font-[600] text-gray-700 mt-2">{channel.channel}</h3>
                  </div>

                  {/* <div className="mt-3 text-center">
                    <p className="text-[12px] text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                      Last Sync - {channel.lastSync ? new Date(channel.lastSync).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }) : "N/A"}
                    </p>
                  </div> */}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 font-bold text-[14px] mt-4">
              No Channels Found
            </div>
          )

        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <div className="flex items-center space-x-4">
              <FaExclamationTriangle className="text-[12px] text-red-500 sm:text-[14px] animate-bounce" />
              <h3 className="text-[10px] sm:text-[12px] font-[600] text-gray-700">Delete Channel</h3>
            </div>
            <p className="mt-2 text-gray-500 text-[10px] sm:text-[12px]">Are you sure you want to delete this {channel}?</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                className="px-3 py-2 bg-gray-300 text-gray-500 rounded-lg text-[10px] sm:text-[12px] hover:bg-gray-400"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-[10px] sm:text-[12px] hover:bg-red-700"
                onClick={handleDeleteChannel}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channels;
