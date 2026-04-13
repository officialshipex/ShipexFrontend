import React, { useState } from "react";
import Notification from "../../All setting/Notification/Notification";
import UserFilter from "../../../filter/UserFilter";

const AdminNotification = () => {
  const [selectedUserId, setSelectedUserId] = useState(() => {
    return localStorage.getItem("admin_notif_target_user") || null;
  });
  const [clearTrigger, setClearTrigger] = useState(false);

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    if (userId) {
      localStorage.setItem("admin_notif_target_user", userId);
    } else {
      localStorage.removeItem("admin_notif_target_user");
    }
  };

  const handleClear = () => {
    setSelectedUserId(null);
    localStorage.removeItem("admin_notif_target_user");
    setClearTrigger((prev) => !prev);
  };

  return (
    <div className="sm:px-2 w-full">
      <div className="space-y-2 mt-2">
        {/* User Search Section */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 w-full">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                 <label className="text-[12px] font-bold text-gray-500 mb-1 block">Search User</label>
                 <UserFilter onUserSelect={handleUserSelect} clearTrigger={clearTrigger} />
              </div>
              {selectedUserId && (
                <button 
                  onClick={handleClear}
                  className="text-[12px] text-red-500 font-bold hover:underline"
                >
                  Clear Selection
                </button>
              )}
           </div>
        </div>

        {/* Reused Notification Component Section */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 w-full">
          <Notification 
            targetUserId={selectedUserId} 
            basePath="/adminDashboard/tools/notification" 
          />
        </div>
      </div>
    </div>
  );
};

export default AdminNotification;
