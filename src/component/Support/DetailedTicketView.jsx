import React from "react";
import { IoArrowBack } from "react-icons/io5";
// import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";

const DetailedTicketView = ({
  ticket,
  onClose,
  onStatusChange, // Optional: parent can pass this to update list
  isSidebarAdmin,
  employeeAccess,
  roleData,
}) => {
  if (!ticket) return null;

  const {
    _id,
    ticketNumber,
    fullname,
    email,
    phoneNumber,
    awbNumbers,
    category,
    subcategory,
    status,
    createdAt,
    company,
    message,
    isAdmin,
  } = ticket;

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleStatusChange = async (newStatus) => {
    try {
      const token = Cookies.get("session");
      if (!token) {
        Notification("Session expired. Please log in again.","error");
        return;
      }
      const headers = { authorization: `Bearer ${token}` };

      // Check access if props provided, else allow (for admin)
      let canUpdate = true;
      if (typeof isSidebarAdmin !== "undefined" && !isSidebarAdmin) {
        canUpdate =
          !!employeeAccess?.canUpdate && roleData?.isEmpActive === true;
      }

      if (canUpdate) {
        const response = await axios.put(
          `${REACT_APP_BACKEND_URL}/support/${_id}/status`,
          { status: newStatus },
          { headers }
        );
        if (response.status === 200) {
        //   toast.success(
        //     newStatus === "resolved"
        //       ? "Ticket marked as resolved!"
        //       : "Ticket marked as deleted!"
        //   );
          if (onStatusChange) onStatusChange(_id, newStatus);
          onClose();
        } else {
          Notification("Failed to update ticket status. Try again.","error");
        }
      } else {
        Notification("Unauthorized to update ticket status.","error");
      }
    } catch (error) {
      Notification("Failed to update ticket status.","error");
    }
  };

  return (
    <div className="overflow-y-auto z-50 md:p-2 flex flex-col">
      <div className="w-full mx-auto bg-white rounded-lg p-2 md:p-4 flex-1 flex flex-col">
        {/* Header with back arrow */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={onClose}
            className="text-[#0CBB7D] hover:text-[#099e67] sm:text-[18px] text-[16px]"
          >
            <IoArrowBack />
          </button>
          <h2 className="sm:text-[18px] text-[14px] font-[600] text-[#0CBB7D]">Ticket Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-[12px] font-[600] text-gray-500">Ticket ID</p>
            <p className="font-[600] text-[12px] text-gray-700">{ticketNumber}</p>
          </div>
          <div>
            <p className="text-[12px] font-[600] text-gray-500">Status</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-[600] ${
                status === "resolved"
                  ? "bg-green-100 text-green-700"
                  : status === "deleted"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {status || "Pending"}
            </span>
          </div>
          <div>
            <p className="text-[12px] font-[600] text-gray-500">Created On</p>
            <p className="text-[12px] font-[600] text-gray-700">{createdAt ? new Date(createdAt).toLocaleString() : "N/A"}</p>
          </div>
          <div>
            <p className="text-[12px] font-[600] text-gray-500">Category</p>
            <p className="text-[12px] font-[600] text-gray-700">{category || "N/A"}</p>
          </div>
          <div>
            <p className="text-[12px] font-[600] text-gray-500">Subcategory</p>
            <p className="text-[12px] font-[600] text-gray-700">{subcategory || "N/A"}</p>
          </div>
          <div>
            <p className="text-[12px] font-[600] text-gray-500">Platform</p>
            <p className="text-[12px] font-[600] text-gray-700">{isAdmin ? "Admin" : "User"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-[12px] font-[600] text-gray-500">Name</p>
            <p className="text-[12px] font-[600] text-gray-700">{fullname || "N/A"}</p>
          </div>
          <div>
            <p className="text-[12px] font-[600] text-gray-500">Email</p>
            <p className="text-[12px] font-[600] text-gray-700">{email || "N/A"}</p>
          </div>
          <div>
            <p className="text-[12px] font-[600] text-gray-500">Phone</p>
            <p className="text-[12px] font-[600] text-gray-700">{phoneNumber || "N/A"}</p>
          </div>
          <div>
            <p className="text-[12px] font-[600] text-gray-500">AWB Number(s)</p>
            <p className="text-[12px] font-[600] text-gray-700">
              {awbNumbers && awbNumbers.length > 0
                ? awbNumbers.join(", ")
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-[12px] font-[600] text-gray-500">Company</p>
            <p className="text-[12px] font-[600] text-gray-700">{company || "N/A"}</p>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-[12px] font-[600] text-gray-500">Detailed Description</p>
          <div className="bg-gray-100 rounded p-3 font-[600] text-gray-700 text-[12px] whitespace-pre-line">
            {message || "No message provided."}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between mt-6 gap-2 sm:gap-0">
          <button
            onClick={onClose}
            className="px-3 py-2 h-9 rounded-lg bg-gray-200 text-gray-700 font-[600] text-[10px] sm:text-[12px] hover:bg-gray-300 flex items-center justify-center"
          >
            <IoArrowBack className="inline mr-2" />
            Back
          </button>

          <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
            <button
              className="px-3 py-2 h-9 rounded-lg bg-[#0CBB7D] text-white font-[600] sm:text-[12px] text-[10px] hover:bg-[#0aa66d]"
              onClick={() => handleStatusChange("resolved")}
            >
              Resolved
            </button>
            <button
              className="px-3 py-2 h-9 rounded-lg bg-red-600 text-white font-[600] text-[10px] sm:text-[12px] hover:bg-red-700"
              onClick={() => handleStatusChange("deleted")}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedTicketView;
