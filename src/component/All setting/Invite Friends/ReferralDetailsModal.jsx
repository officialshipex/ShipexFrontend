import React from "react";
import { X, Mail, Phone, User, Users, Calendar, Truck, Wallet, FileText } from "lucide-react";
import dayjs from "dayjs";

const ReferralDetailsModal = ({ referral, onClose }) => {
  if (!referral) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-popup-in">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
          <div>
            <h2 className="text-[12px] sm:text-[14px] font-bold text-gray-700">Referral Performance Details</h2>
            <p className="text-[10px] sm:text-[12px] text-gray-500 font-medium">
              {dayjs().month(referral.month - 1).format("MMMM")} {referral.year}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-500 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Referrer Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 space-y-3">
              <h3 className="text-[10px] sm:text-[12px] font-bold text-[#0CBB7D] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
                Referrer Information
              </h3>
              <div className="space-y-2 text-[10px] sm:text-[12px]">
                <div className="flex justify-between border-b border-green-100 pb-1">
                  <span className="text-gray-500">Full Name</span>
                  <span className="font-bold text-gray-700">{referral.userName || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-green-100 pb-1">
                  <span className="text-gray-500">User ID</span>
                  <span className="font-bold text-[#0CBB7D]">{referral.userId || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span>{referral.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  <span>{referral.mobile || "-"}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
              <h3 className="text-[10px] sm:text-[12px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Monthly Summary
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-white rounded-lg border border-blue-100">
                  <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold">Orders</p>
                  <p className="text-[10px] sm:text-[12px] font-bold text-gray-700">{referral.totalOrderCount || 0}</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-blue-100">
                  <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold">Freight</p>
                  <p className="text-[10px] sm:text-[12px] font-bold text-[#0CBB7D]">₹{Math.round(referral.totalShipping || 0)}</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-blue-100">
                  <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold">Reward</p>
                  <p className="text-[10px] sm:text-[12px] font-bold text-blue-600">₹{Math.round(referral.totalCommission || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subuser Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] sm:text-[14px] font-bold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0CBB7D]" />
                Referred Customers Tracking
              </h3>
              <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest">
                {referral.subUsers?.length || 0} Total Active
              </span>
            </div>

            <div className="overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="sm:w-full w-[500px] text-[12px] border-collapse bg-white">
                  <thead className="bg-[#0CBB7D] text-white font-bold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left">User Details</th>
                      <th className="px-3 py-2 text-center">Orders</th>
                      <th className="px-3 py-2 text-right">Shipping (₹)</th>
                      <th className="px-3 py-2 text-right">Commission (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referral.subUsers && referral.subUsers.length > 0 ? (
                      referral.subUsers.map((sub, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2">
                            <p className="font-bold text-[#0CBB7D]">{sub.userId}</p>
                            <p className="text-gray-700">{sub.fullname}</p>
                            <div className="flex items-center gap-2 text-[12px] text-gray-400">
                              <span className="flex items-center">{sub.email}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-gray-700">{sub.orderCount}</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-500">
                            {Number(sub.totalShipping || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-[#0CBB7D]">
                            {Number(sub.commission || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-gray-500">
                          No detailed subuser tracking data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[10px] sm:text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition-all shadow-sm active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralDetailsModal;

