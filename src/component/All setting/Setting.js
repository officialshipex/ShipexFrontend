import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  FiUser,
  FiLock,
  FiFileText,
  FiCreditCard,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const settingsCards = [
  {
    title: "Company Profile",
    subtitle: "Edit your company details",
    icon: FiUser,
    link: "/dashboard/settings/company-profile",
  },
  {
    title: "KYC",
    subtitle: "Manage KYC documents",
    icon: FiShield,
    link: "/dashboard/settings/kyc-profile",
  },
  {
    title: "Change Password",
    subtitle: "Update your credentials",
    icon: FiLock,
    link: "/dashboard/settings/change_password",
  },
  {
    title: "Label",
    subtitle: "Customize your labels",
    icon: FiFileText,
    link: "/dashboard/settings/label",
  },
  {
    title: "Invoice",
    subtitle: "Manage invoice settings",
    icon: FiCreditCard,
    link: "#",
  },
  {
    title: "Invite & Earn",
    subtitle: "Invite your friends and earn rewards",
    icon: FiUsers,
    link: "/dashboard/settings/referral",
  },
  {
    title: "Notification Settings",
    subtitle: "Manage Notification for status update",
    icon: FaWhatsapp,
    link: "/dashboard/settings/notification",
  },
];

const Settings = () => {
  const location = useLocation();
  const isMainSettingsPage = location.pathname === "/dashboard/settings";

  return (
    <div className="md:px-2 px-1">
      <div className="max-w-full mx-auto">
        {isMainSettingsPage ? (
          <div>
            <h1 className="md:text-[18px] text-[14px] font-[600] mb-2 text-gray-700">
              Settings
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {settingsCards.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={idx}
                    to={item.link}
                    className="group flex flex-row sm:flex-col items-center sm:items-center justify-start sm:justify-center gap-3 sm:gap-2 text-gray-700 font-[400] h-auto sm:h-24 p-3 border-2 border-[#0CBB7D] rounded-md bg-white hover:bg-[#0CBB7D] hover:text-white shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-8 h-8 flex-shrink-0 rounded bg-[#0CBB7D] flex items-center justify-center transition-all group-hover:bg-white">
                      <Icon className="text-white group-hover:text-[#0CBB7D] text-[16px] transition-all" />
                    </div>
                    <div className="flex flex-col sm:items-center sm:text-center">
                      <span className="text-[14px] text-gray-500 font-[600] group-hover:text-white transition-all">
                        {item.title}
                      </span>
                      <span className="text-[12px] text-gray-500 group-hover:text-white transition-all">
                        {item.subtitle}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
};

export default Settings;
