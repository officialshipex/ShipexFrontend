import React from "react";

const ReferralDetailsModal = ({ referral, onClose }) => {
  if (!referral) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[95%] sm:w-[750px] max-h-[85vh] overflow-y-auto p-5 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-lg font-bold"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
          Referral Details
        </h2>

        {/* Referrer info */}
        <div className="space-y-2 text-[13px] text-gray-700 mb-3">
          <p>
            <span className="font-semibold">Referrer Name:</span>{" "}
            {referral.userName || "-"}
          </p>
          <p>
            <span className="font-semibold">User ID:</span>{" "}
            {referral.userId || "-"}
          </p>
          <p>
            <span className="font-semibold">Email:</span>{" "}
            {referral.email || "-"}
          </p>
          <p>
            <span className="font-semibold">Mobile:</span>{" "}
            {referral.mobile || "-"}
          </p>
        </div>

        {/* Subuser table */}
        <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">
          Subuser Details (with Stats)
        </h3>

        {referral.perSubUser && referral.perSubUser.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#0CBB7D] text-white">
                  <th className="px-2 py-1 text-left">User ID</th>
                  <th className="px-2 py-1 text-left">Name</th>
                  <th className="px-2 py-1 text-left">Email</th>
                  <th className="px-2 py-1 text-left">Mobile</th>
                  <th className="px-2 py-1 text-center">Orders</th>
                  <th className="px-2 py-1 text-center">Shipping (₹)</th>
                  <th className="px-2 py-1 text-center">Commission (₹)</th>
                </tr>
              </thead>
              <tbody>
                {referral.subUsers.map((sub, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-1">{sub.userId}</td>
                    <td className="px-2 py-1">{sub.fullname}</td>
                    <td className="px-2 py-1">{sub.email}</td>
                    <td className="px-2 py-1">{sub.mobile}</td>
                    <td className="px-2 py-1 text-center">{sub.orderCount}</td>
                    <td className="px-2 py-1 text-center">
                      {sub.totalShipping?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-2 py-1 text-center">
                      {sub.commission || "0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-3">
            No subuser details found.
          </p>
        )}
      </div>
    </div>
  );
};

export default ReferralDetailsModal;
