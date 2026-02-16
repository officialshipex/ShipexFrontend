import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function YourSellers() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchAllocations = async () => {
      setLoading(true);
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("session="))
          ?.split("=")[1];

        if (!token) {
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${REACT_APP_BACKEND_URL}/staffRole/myAllocations`,
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );

        setAllocations(res.data.allocations || []);
      } catch (err) {
        setAllocations([]);
        console.log("Error fetching allocations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest(".seller-action-dropdown") &&
        !e.target.closest(".seller-action-btn")
      ) {
        setActionDropdownOpen(null);
      }
    };
    if (actionDropdownOpen !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionDropdownOpen]);

  const handleShowOrders = (item) => {
    // console.log(item.sellerMongoId);
    navigate(`/adminDashboard/order?userId=${item.sellerMongoId}`);
  };
  const handleShowNdr = (item) => {
    navigate(`/adminDashboard/ndr?userId=${item.sellerMongoId}`);
  };

  return (
    <div className="container mx-auto">
      <h2 className="text-lg font-semibold mb-4">Your Allocated Sellers</h2>

      {loading ? (
        <p>Loading...</p>
      ) : allocations.length === 0 ? (
        <p>No sellers allocated to you.</p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow border border-gray-200">
              <thead className="bg-green-50 text-left text-gray-700 text-[14px] font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3 border-b border-gray-200">SL No.</th>
                  <th className="px-6 py-3 border-b border-gray-200">
                    Seller ID
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200">
                    Seller Name
                  </th>

                  <th className="px-6 py-3 border-b border-gray-200">
                    Allocated At
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200">Action</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((item, idx) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 text-gray-800 text-[12px]"
                  >
                    <td className="px-6 py-2 border-b border-gray-100">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-2 border-b border-gray-100">
                      {item.sellerId}
                    </td>
                    <td className="px-6 py-2 border-b border-gray-100">
                      {item.sellerName}
                    </td>

                    <td className="px-6 py-2 border-b border-gray-100">
                      {new Date(item.allocatedAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-2 border-b border-gray-100 relative">
                      <button
                        className="text-sm bg-gray-200 rounded-md px-4 py-2 seller-action-btn"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownPosition({
                            top: rect.bottom + window.scrollY + 4, // 4px gap
                            left: rect.right + window.scrollX - 160, // 160 = dropdown width
                          });
                          setActionDropdownOpen(
                            actionDropdownOpen === item._id ? null : item._id
                          );
                        }}
                      >
                        ...
                      </button>
                      {actionDropdownOpen === item._id && (
                        <div
                          className="seller-action-dropdown fixed w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                          style={{
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            maxWidth: "90vw",
                          }}
                        >
                          <ul className="py-2">
                            <li
                              className="px-3 py-1 hover:bg-green-50 cursor-pointer text-[14px]"
                              onClick={() => handleShowOrders(item)}
                            >
                              Show Orders
                            </li>
                            <li
                              className="px-3 py-1 hover:bg-green-50 cursor-pointer text-[14px]"
                              onClick={() => handleShowNdr(item)}
                            >
                              Show NDR
                            </li>
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {allocations.map((item, idx) => (
              <div
                key={item._id}
                className="bg-green-50 rounded-xl shadow-md p-4 border border-gray-200 flex flex-col gap-1 relative"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[12px] font-semibold text-gray-900">
                      SL No:{" "}
                      <span className="text-[12px] font-normal text-gray-700">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="text-[12px] font-semibold text-gray-900">
                      Seller ID:{" "}
                      <span className="text-[12px] font-normal text-gray-700">
                        {item.sellerId}
                      </span>
                    </div>
                    <div className="text-[12px] font-semibold text-gray-900">
                      Name:{" "}
                      <span className="text-[12px] font-normal text-gray-700">
                        {item.sellerName}
                      </span>
                    </div>
                  </div>
                  <button
                    className="absolute top-3 right-3 text-[10px] bg-green-200 rounded-md px-2 py-1 seller-action-btn"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDropdownPosition({
                        top: rect.bottom + window.scrollY + 4,
                        left: rect.right + window.scrollX - 160,
                      });
                      setActionDropdownOpen(
                        actionDropdownOpen === item._id ? null : item._id
                      );
                    }}
                  >
                    Action
                  </button>

                  {actionDropdownOpen === item._id && (
                    <div
                      className="seller-action-dropdown absolute right-0 bottom-[-5px] w-25 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                      style={{ maxWidth: "90vw" }}
                    >
                      <ul className="py-2">
                        <li
                          className="px-3 py-1 hover:bg-green-50 cursor-pointer text-[12px]"
                          onClick={() => handleShowOrders(item)}
                        >
                          Show Orders
                        </li>
                        <li
                          className="px-3 py-1 hover:bg-green-50 cursor-pointer text-[12px]"
                          onClick={() => handleShowNdr(item)}
                        >
                          Show NDR
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                <div className="text-[12px] font-semibold text-gray-500">
                  Allocated At:{" "}
                  <span className="text-[12px] font-normal text-gray-700">
                    {new Date(item.allocatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default YourSellers;
