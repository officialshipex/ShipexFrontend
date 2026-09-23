import React, { useEffect, useState } from "react";
import axios from "axios";
import UpdateSenderAdd from "../../Order/viewOrder/UpdateSenderAdd";
// import { toast } from "react-toastify";
import { FiEdit, FiTrash2, FiSearch, FiCopy, FiCheck } from "react-icons/fi"
import { Notification } from "../../Notification";
import Cookies from "js-cookie";
import UserFilter from "../../filter/UserFilter";
import PaginationFooter from "../../Common/PaginationFooter";
import ThreeDotLoader from "../../Loader";

const PickupAddress = ({ isAdminView = false }) => {
  const [pickupAddress, setPickupAddress] = useState([]);
  const [primaryAddressId, setPrimaryAddressId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("Add New Address");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clearUserTrigger, setClearUserTrigger] = useState(false);

  const handleUserSelect = (id) => {
    setSelectedUserId(id);
    setPage(1);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    Notification("Address copied to clipboard", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPickupAddress = pickupAddress.filter((item) => {
    const search = searchTerm.toLowerCase();
    const address = item.pickupAddress;
    return (
      address.contactName.toLowerCase().includes(search) ||
      address.email.toLowerCase().includes(search) ||
      address.phoneNumber.toLowerCase().includes(search) ||
      address.address.toLowerCase().includes(search)
    );
  });

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchPickupAddress = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("session");
      const params = {
        page,
        limit,
      };
      if (isAdminView && selectedUserId) {
        params.userId = selectedUserId;
      }
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/order/pickupAddress`, {
        headers: { authorization: `Bearer ${token}` },
        params,
      });
      setPickupAddress(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      const primary = (response.data.data || []).find((item) => item.isPrimary);
      setPrimaryAddressId(primary?._id || null);
    } catch (error) {
      console.error("Error fetching pickup addresses:", error);
      Notification("Failed to load pickup addresses", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickupAddress();
  }, [selectedUserId, page, limit]);

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

  const handleDownloadExcel = async () => {
    try {
      const token = Cookies.get("session");
      const params = {};
      if (isAdminView && selectedUserId) {
        params.userId = selectedUserId;
      }
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/order/pickupAddress/download-excel`, {
        headers: { authorization: `Bearer ${token}` },
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "pickup-addresses.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      Notification("Excel download started successfully", "success");
    } catch (error) {
      console.error("Error downloading Excel sheet:", error);
      Notification("Failed to download Excel sheet", "error");
    }
  };

  return (
    <div className="sm:px-2 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
        <h1 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 order-1">
          {isAdminView ? "Pickup Addresses" : "Pickup Addresses"}
        </h1>

        {/* Buttons */}
        <div className="flex gap-2 order-2 sm:order-3">
          <button
            onClick={handleDownloadExcel}
            className="border border-brand-primary text-brand-primary hover:bg-green-50 text-[10px] sm:text-[12px] transition-all rounded-lg font-[600] px-3 py-2"
          >
            Download Excel
          </button>
          {!isAdminView && (
            <button
              onClick={() => {
                openModal();
                setTitle("Add New Address");
              }}
              className="bg-brand-primary text-white text-[10px] sm:text-[12px] hover:opacity-90 transition-all rounded-lg font-[600] px-3 py-2"
            >
              + Add New Address
            </button>
          )}
        </div>

        {/* User Filter (Admin Only) */}
        {isAdminView && (
          <div className="w-full sm:w-auto order-3 sm:order-2 sm:ml-auto flex items-center gap-2">
            <div className="w-full sm:w-72">
              <UserFilter
                onUserSelect={handleUserSelect}
                clearTrigger={clearUserTrigger}
              />
            </div>
            {selectedUserId && (
              <button
                onClick={() => {
                  setSelectedUserId(null);
                  setClearUserTrigger((prev) => !prev);
                }}
                className="text-[12px] text-red-500 hover:text-red-600 font-[600] whitespace-nowrap px-2"
              >
                Clear Filter
              </button>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className={`relative w-full sm:w-64 order-3 sm:order-2 group ${!isAdminView ? 'sm:ml-auto' : ''}`}>
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 
             text-gray-400 
             group-focus-within:text-brand-primary 
             transition-colors duration-200"
            size={14}
          />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[10px] sm:text-[12px] 
             border border-gray-300 
             rounded-lg 
             outline-none 
             focus:border-brand-primary 
             transition-all duration-200"
          />
        </div>
      </div>

      {/* Table for Desktop */}
      <div className="hidden sm:block">
        <div className="relative overflow-x-auto bg-white overflow-y-auto h-[calc(100dvh-165px)] shadow-sm">
          <table className="min-w-full text-left">
            <thead className="bg-brand-primary text-white sticky top-0 z-20">
              <tr className="text-[12px] font-[600]">
                {isAdminView && <th className="px-3 py-2 text-left">User Details</th>}
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Address</th>
                <th className="px-3 py-2 text-left">Primary</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdminView ? 7 : 6} className="text-center py-6">
                    <ThreeDotLoader />
                  </td>
                </tr>
              ) : filteredPickupAddress.length > 0 ? (
                filteredPickupAddress.map((address, index) => (
                  <tr key={index} className="border-b text-gray-700 text-[12px] border-gray-200 hover:bg-gray-50 transition-all">
                    {isAdminView && (
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700" style={{ maxWidth: "120px", width: "110px" }}>
                        <p className="text-brand-primary">{address.userId?.userId || "N/A"}</p>
                        <p className="">{address.userId?.fullname || "N/A"}</p>
                        <p className="text-gray-500 max-w-[160px] truncate sm:max-w-[200px]" title={address.userId?.email}>
                          {address.userId?.email || "N/A"}
                        </p>
                        {/* <p className="text-gray-500">{address.userId?.phoneNumber || "N/A"}</p> */}
                      </td>
                    )}
                    <td className="px-3 py-2" style={{ maxWidth: "300px", width: "250px" }}>{address.pickupAddress.contactName}</td>
                    <td className="px-3 py-2" style={{ maxWidth: "300px", width: "200px" }}>{address.pickupAddress.phoneNumber}</td>
                    <td className="px-3 py-2" style={{ maxWidth: "300px", width: "250px" }}>{address.pickupAddress.email}</td>
                    <td className="px-3 py-2" style={{ maxWidth: "600px", width: "550px" }}>
                      <div className="flex items-center group relative">
                        <span className="truncate">{address.pickupAddress.address}</span>
                        <button
                          onClick={() => handleCopy(address.pickupAddress.address, address._id)}
                          className="ml-2 p-1 text-gray-400 hover:text-brand-primary transition-colors opacity-0 group-hover:opacity-100"
                        >
                          {copiedId === address._id ? <FiCheck size={12} className="text-green-500" /> : <FiCopy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2" style={{ maxWidth: "300px", width: "100px" }}>
                      <label className="inline-flex items-center cursor-pointer relative">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={primaryAddressId === address._id}
                          onChange={() => handlePrimaryChange(address._id)}
                        />
                        <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-focus:outline-none peer-checked:bg-brand-primary transition-colors duration-300"></div>
                        <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 transform peer-checked:translate-x-5"></div>
                      </label>
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          className="p-2 rounded-full text-green-600 bg-green-100 hover:bg-brand-secondary/10 transition"
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
                ))
              ) : (
                <tr>
                  <td colSpan={isAdminView ? 7 : 6} className="text-center py-6 text-gray-500">
                    No pickup addresses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View (Card Format) */}
      <div className="sm:hidden">
        <div className="flex flex-col gap-2 h-[calc(100dvh-220px)] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <ThreeDotLoader />
            </div>
          ) : filteredPickupAddress.length > 0 ? (
            filteredPickupAddress.map((address, index) => (
              <div
                key={index}
                className="bg-white shadow-sm rounded-lg text-gray-500 p-2 text-[10px] border border-gray-200 flex flex-col gap-1"
              >
                {isAdminView && (
                  <div className="border-b pb-1 mb-1 flex justify-between items-center bg-green-50/50 p-1.5 rounded">
                    <span className="text-[10px] font-bold text-brand-primary truncate max-w-[120px]">{address.userId?.company || "N/A"}</span>
                    <span className="text-[9px] text-gray-500 truncate max-w-[120px]">{address.userId?.fullname || "N/A"}</span>
                  </div>
                )}
                {/* Top Row: Name and Actions */}
                <div className="flex justify-between items-center border-b pb-1">
                  <span className="text-gray-700 font-[700] truncate max-w-[150px]">{address.pickupAddress.contactName}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-gray-500">Primary</span>
                      <label className="inline-flex items-center cursor-pointer relative">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={primaryAddressId === address._id}
                          onChange={() => handlePrimaryChange(address._id)}
                        />
                        <div className="w-7 h-3.5 bg-gray-200 rounded-full peer peer-focus:outline-none peer-checked:bg-brand-primary transition-colors duration-300"></div>
                        <div className="absolute left-0.5 top-0.5 bg-white w-2.5 h-2.5 rounded-full transition-transform duration-300 transform peer-checked:translate-x-3.5"></div>
                      </label>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        className="p-1.5 rounded-full text-green-600 bg-green-50 hover:bg-green-100 transition"
                        onClick={() => {
                          openModal({ ...address.pickupAddress, _id: address._id });
                          setTitle("Edit Address");
                        }}
                      >
                        <FiEdit size={12} />
                      </button>
                      <button
                        className="p-1.5 rounded-full text-red-600 bg-red-100 hover:bg-red-200 transition"
                        onClick={() => handleDelete(address._id)}
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* info layout */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-0.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500">Phone</span>
                    <span className="text-gray-700 font-[600] truncate">{address.pickupAddress.phoneNumber}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500">Email</span>
                    <span className="text-gray-700 font-[600] truncate">{address.pickupAddress.email}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500">Location</span>
                    <span className="text-gray-700 font-[600] truncate">{address.pickupAddress.city}, {address.pickupAddress.state}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500">Pin Code</span>
                    <span className="text-gray-700 font-[600]">{address.pickupAddress.pinCode}</span>
                  </div>
                </div>

                {/* Address with Copy */}
                <div className="bg-green-50 p-1.5 rounded-md mt-1 flex justify-between items-start gap-2">
                  <span className="text-gray-700 font-[500] leading-tight text-[10px] line-clamp-2 flex-1">
                    {address.pickupAddress.address}
                  </span>
                  <button
                    onClick={() => handleCopy(address.pickupAddress.address, address._id)}
                    className="p-1 text-gray-400 hover:text-brand-primary shrink-0"
                  >
                    {copiedId === address._id ? <FiCheck size={12} className="text-green-500" /> : <FiCopy size={12} />}
                  </button>
                </div>


              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              No pickup addresses found.
            </div>
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      {(isAdminView || totalPages > 1) && (
        <PaginationFooter
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
        />
      )}

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
