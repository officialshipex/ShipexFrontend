import React, { useEffect, useState } from "react";
import axios from "axios";
import UpdateSenderAdd from "../../Order/viewOrder/UpdateSenderAdd";
// import { toast } from "react-toastify";
import { FiEdit, FiTrash2 } from "react-icons/fi"
import { Notification } from "../../Notification";
import Cookies from "js-cookie";

const PickupAddress = () => {
  const [pickupAddress, setPickupAddress] = useState([]);
  const [primaryAddressId, setPrimaryAddressId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("Add New Address");

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchPickupAddress = async () => {
    try {
      const token = Cookies.get("session");
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/order/pickupAddress`, {
        headers: { authorization: `Bearer ${token}` },
      });
      setPickupAddress(response.data.data);
      const primary = response.data.data.find((item) => item.isPrimary);
      setPrimaryAddressId(primary?._id || null);
    } catch (error) {
      console.error("Error fetching pickup addresses:", error);
      Notification("Failed to load pickup addresses", "error");
    }
  };

  useEffect(() => {
    fetchPickupAddress();
  }, []);

  const handlePrimaryChange = async (id) => {
    try {
      const token = Cookies.get("session");
      await axios.patch(`${REACT_APP_BACKEND_URL}/order/pickupAddress/setPrimary/${id}`, {}, {
        headers: { authorization: `Bearer ${token}` },
      });
      setPrimaryAddressId(id);
      fetchPickupAddress();
      Notification("Primary address updated", "success");
    } catch (error) {
      console.error("Error updating primary address:", error);
      Notification("Failed to update primary address", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = Cookies.get("session");
      await axios.delete(`${REACT_APP_BACKEND_URL}/order/pickupAddress/${id}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      Notification("Address deleted", "success");
      fetchPickupAddress();
    } catch (error) {
      console.error("Error deleting address:", error);
      Notification("Failed to delete address", "error");
    }
  };

  const openModal = (data = null) => {
    setEditData(data);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditData(null);
    setIsModalOpen(false);
  };

  const handleSave = async (formData) => {
    try {
      const token = Cookies.get("session");
      if (editData && editData._id) {
        await axios.put(
          `${REACT_APP_BACKEND_URL}/order/updatePickupAddress/${editData._id}`,
          formData,
          {
            headers: { authorization: `Bearer ${token}` },
          }
        );
        Notification("Address updated successfully", "success");
      } else {
        await axios.post(
          `${REACT_APP_BACKEND_URL}/order/pickupAddress`,
          formData,
          {
            headers: { authorization: `Bearer ${token}` },
          }
        );
        Notification("Address added successfully", "success");
      }
      fetchPickupAddress();
      closeModal();
    } catch (error) {
      console.error("Error saving address:", error);
      Notification("Failed to save address", "error");
    }
  };

  return (
    <div className="p-1 sm:p-2 space-y-2">
      <div className="flex justify-between items-center">
        <h1 className="text-[14px] font-[600] text-gray-700">Pickup Addresses</h1>
        <button
          onClick={() => {
            openModal();
            setTitle("Add New Address");
          }}
          className="bg-[#0CBB7D] text-white text-[12px] hover:opacity-90 transition-all rounded-lg font-[600] px-3 py-2"
        >
          + Add New Address
        </button>
      </div>

      {/* Table for Desktop */}
      <div className="hidden sm:block">
        <div className="relative overflow-x-auto bg-white overflow-y-auto h-[calc(100dvh-150px)] shadow-sm">
          <table className="min-w-full text-left">
            <thead className="bg-[#0CBB7D] text-white sticky top-0 z-20">
              <tr className="text-[12px] font-[600]">
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Address</th>
                <th className="px-3 py-2 text-left">Primary</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pickupAddress.map((address, index) => (
                <tr key={index} className="border-b text-gray-700 text-[12px] border-gray-200 hover:bg-gray-50 transition-all">
                  <td className="px-3 py-2" style={{ maxWidth: "300px", width: "250px" }}>{address.pickupAddress.contactName}</td>
                  <td className="px-3 py-2" style={{ maxWidth: "300px", width: "200px" }}>{address.pickupAddress.phoneNumber}</td>
                  <td className="px-3 py-2" style={{ maxWidth: "300px", width: "250px" }}>{address.pickupAddress.email}</td>
                  <td className="px-3 py-2" style={{ maxWidth: "600px", width: "550px" }}>{address.pickupAddress.address}</td>
                  <td className="px-3 py-2" style={{ maxWidth: "300px", width: "100px" }}>
                    <label className="inline-flex items-center cursor-pointer relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={primaryAddressId === address._id}
                        onChange={() => handlePrimaryChange(address._id)}
                      />
                      <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-focus:outline-none peer-checked:bg-[#0CBB7D] transition-colors duration-300"></div>
                      <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 transform peer-checked:translate-x-5"></div>
                    </label>
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 justify-center">
                      <button
                        className="p-2 rounded-full text-green-600 bg-green-100 hover:bg-green-200 transition"
                        onClick={() => {
                          openModal({ ...address.pickupAddress, _id: address._id });
                          setTitle("Edit Address");
                        }}
                      >
                        <FiEdit size={12} />
                      </button>
                      <button
                        className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition"
                        onClick={() => handleDelete(address._id)}
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View (Card Format) */}
      <div className="sm:hidden">
        <div className="flex flex-col gap-3 h-[calc(100dvh-160px)] overflow-y-auto pb-4">
          {pickupAddress.map((address, index) => (
            <div
              key={index}
              className="bg-white shadow-sm rounded-lg text-gray-500 p-4 text-[10px] font-[600] border border-gray-200"
            >
              {/* Name, Email, Phone */}
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="text-gray-700 underline">{address.pickupAddress.contactName}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="text-gray-700 underline">{address.pickupAddress.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="text-gray-700 underline">{address.pickupAddress.phoneNumber}</span>
              </div>

              {/* Pin Code, City, State - Each with Label */}
              <div className="flex justify-between">
                <span>Pin Code:</span>
                <span className="text-gray-700">{address.pickupAddress.pinCode}</span>
              </div>
              <div className="flex justify-between">
                <span>City:</span>
                <span className="text-gray-700">{address.pickupAddress.city}</span>
              </div>
              <div className="flex justify-between">
                <span>State:</span>
                <span className="text-gray-700">{address.pickupAddress.state}</span>
              </div>
              {/* Address - One Line, No Title */}
              <div className="font-[600] text-gray-700 bg-gray-50 p-2 rounded-md mt-1">
                {address.pickupAddress.address}
              </div>

              {/* Action Buttons + Primary Toggle */}
              <div className="flex items-center justify-between pt-2 border-t mt-2">
                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    className="p-2 rounded-full text-green-600 bg-green-100 hover:bg-green-200 transition"
                    onClick={() => {
                      openModal({ ...address.pickupAddress, _id: address._id });
                      setTitle("Edit Address");
                    }}
                  >
                    <FiEdit size={16} />
                  </button>
                  <button
                    className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition"
                    onClick={() => handleDelete(address._id)}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>

                {/* Primary Toggle */}
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center cursor-pointer relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={primaryAddressId === address._id}
                      onChange={() => handlePrimaryChange(address._id)}
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-focus:outline-none peer-checked:bg-[#0CBB7D] transition-colors duration-300"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform peer-checked:translate-x-5"></div>
                  </label>
                  <span className="text-[10px] text-gray-500 font-[700]">Primary</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <UpdateSenderAdd
          isOpen={isModalOpen}
          onClose={closeModal}
          PickupAddress={editData}
          onSave={handleSave}
          title={title}
        />
      )}
    </div>
  );
};

export default PickupAddress;
