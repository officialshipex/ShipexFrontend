import React, { useState, useEffect } from "react";
import axios from "axios";
import { Listbox } from "@headlessui/react";
import { createPortal } from "react-dom";
import Cookies from "js-cookie";
import { BsThreeDotsVertical } from "react-icons/bs"; // Bootstrap icons

import { ChevronsUpDownIcon } from "lucide-react";

function ThemedDropdown({ label, options, selected, setSelected }) {
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter(
    (opt) =>
      opt.name.toLowerCase().includes(search.toLowerCase()) ||
      (opt.employeeId &&
        opt.employeeId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative w-full sm:w-[250px] text-[10px] md:text-[12px]">
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative">
          <Listbox.Button className="w-full cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-left shadow-sm focus:outline-none focus:ring-0 focus:ring-green-500 focus:border-green-500 text-gray-500">
            {selected ? selected.name : label}
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ChevronsUpDownIcon className="h-5 w-5 text-gray-500" />
            </span>
          </Listbox.Button>
          <Listbox.Options className="absolute text-gray-500 left-0 right-0 z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-[12px]">
            <div className="px-3 py-2 sticky top-0 bg-white z-10">
              <input
                type="text"
                className="w-full border border-green-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-gray-500">No results</div>
            )}
            {filteredOptions.map((option) => (
              <Listbox.Option
                key={option.id}
                value={option}
                className={({ active }) =>
                  `cursor-pointer select-none px-3 py-2 ${active ? "bg-green-100 text-green-900" : "text-gray-500"
                  }`
                }
              >
                {option.name}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
}

function AllocateRoles() {
  const [executivesList, setExecutivesList] = useState([]);
  const [sellersList, setSellersList] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    const fetchExecutives = async () => {
      try {
        const token = Cookies.get("session");
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/staffRole/sales-executives`,
          { headers: { authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setExecutivesList(
            res.data.executives.map((e) => ({
              id: e._id,
              name: `${e.employeeId} - ${e.fullName} (${e.role})`, // <-- Show EmployeeId first
              employeeId: e.employeeId, // <-- Add for searching
            }))
          );
        }
      } catch (err) {
        setExecutivesList([]);
      }
    };
    fetchExecutives();
  }, []);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const token = Cookies.get("session");
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/users/getUsers`,
          { headers: { authorization: `Bearer ${token}` } }
        );
        // Format: { id: userId, name: "userId - name" }
        setSellersList(
          (res.data.sellers || []).map((seller) => ({
            id: seller.userId,
            name: `${seller.userId} - ${seller.name}`,
            userId: seller.userId,
          }))
        );
      } catch (err) {
        setSellersList([]);
      }
    };
    fetchSellers();
  }, []);

  const fetchAllocations = async () => {
    try {
      const token = Cookies.get("session");
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/staffRole/allAllocations`,
        { headers: { authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setAllocations(res.data.allocations);
    } catch (err) {
      setAllocations([]);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  const handleSave = async () => {
    if (!selectedSeller || !selectedExecutive) {
      alert("Please select both seller and sales executive.");
      return;
    }
    try {
      const token = Cookies.get("session");
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/staffRole/allocate`,
        {
          sellerId: selectedSeller.userId,
          sellerName: selectedSeller.name.split(" - ").slice(1).join(" - "),
          employeeId: selectedExecutive.employeeId,
          employeeName: selectedExecutive.name
            .split(" - ")
            .slice(1)
            .join(" - "),
        },
        { headers: { authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert("Allocation saved!");
        // Optionally refresh allocations table
        fetchAllocations();
      }
    } catch (err) {
      alert("Failed to save allocation.");
    }
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      // If click is outside both the dropdown and the three dots button, close
      if (
        !e.target.closest(".allocation-action-dropdown") &&
        !e.target.closest(".allocation-action-btn")
      ) {
        setActionDropdownOpen(null);
      }
    };
    if (actionDropdownOpen !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionDropdownOpen]);

  const handleDeleteAllocation = async (allocationId) => {
    if (!window.confirm("Are you sure you want to delete this allocation?"))
      return;
    try {
      const token = Cookies.get("session");
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/staffRole/deleteAllocation/${allocationId}`,
        { headers: { authorization: `Bearer ${token}` } }
      );
      setActionDropdownOpen(null);
      fetchAllocations();
    } catch (err) {
      alert("Failed to delete allocation.");
    }
  };

  const handleActionDropdown = (id, event) => {
    if (actionDropdownOpen === id) {
      setActionDropdownOpen(null); // Close if already open
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });
    setActionDropdownOpen(id); // Open for this row
  };
  const filteredAllocations = allocations.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.sellerId?.toLowerCase().includes(query) ||
      item.sellerName?.toLowerCase().includes(query) ||
      item.employeeId?.toLowerCase().includes(query) ||
      item.employeeName?.toLowerCase().includes(query)
    );
  });


  return (
    <div className="container mx-auto sm:px-2 p-1">
      {/* Dropdowns and Save Button */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div>
          <ThemedDropdown
            label="Select a Seller"
            options={sellersList}
            selected={selectedSeller}
            setSelected={setSelectedSeller}
          />
        </div>

        <div>
          <ThemedDropdown
            label="Select the Sales Executive"
            options={executivesList}
            selected={selectedExecutive}
            setSelected={setSelectedExecutive}
          />
        </div>

        <div className="w-full md:w-auto">
          <button
            className="w-full md:w-auto border-2 bg-[#0CBB7D] text-white font-[600] py-2 px-3 rounded-lg shadow-sm hover:bg-[#0CBB7D] focus:outline-none focus:ring-2 focus:ring-[#0CBB7D] focus:ring-opacity-50 text-[10px] md:text-[12px]"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>

      {/* Search bar above table */}
      <div className="my-2">
        <input
          type="text"
          className="block w-full sm:w-[300px] px-3 py-2 border-2 border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-0 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] text-[10px] md:text-[12px]"
          placeholder="Search by SellerID, Seller Name, EmployeeID, Employee Name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

      </div>

      {/* Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm text-[12px]">
          <thead>
            <tr className="bg-[#0CBB7D] text-white border border-[#0CBB7D]">
              <th className="px-3 py-2 text-left uppercase">
                SL No.
              </th>
              <th className="px-3 py-2 text-left uppercase">
                Seller
              </th>
              <th className="px-3 py-2 text-left uppercase">
                Allotted Sales Executive
              </th>
              <th className="px-3 py-2 text-left uppercase">
                Date of Allocation
              </th>
              <th className="px-3 py-2 text-center uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAllocations.map((item, idx) => (
              <tr key={item._id} className="text-gray-500 hover:bg-gray-50 text-[12px] border border-gray-300">
                <td className="px-3 py-2 text-left">{idx + 1}</td>
                <td className="px-3 py-2 text-left">{item.sellerName}</td>
                <td className="px-3 py-2 text-left">{item.employeeName}</td>
                <td className="px-3 py-2 text-left">
                  {new Date(item.allocatedAt).toLocaleString()}
                </td>
                <td className="px-3 py-2 relative flex justify-center items-center">
                  <button
                    className="p-2 rounded-full bg-[#0CBB7D] hover:bg-gray-250 allocation-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionDropdown(item._id, e);
                    }}
                  >
                    <BsThreeDotsVertical className="text-white text-[10px] sm:text-[12px] cursor-pointer" />
                  </button>
                  {actionDropdownOpen === item._id &&
                    createPortal(
                      <div
                        className="allocation-action-dropdown fixed z-50 bg-white border mr-20 border-gray-200 rounded-lg shadow-lg"
                        style={{
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          width: "160px",
                        }}
                      >
                        <ul>
                          <li
                            className="px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer text-[12px]"
                            onClick={() => handleDeleteAllocation(item._id)}
                          >
                            Delete Allocation
                          </li>
                        </ul>
                      </div>,
                      document.body
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {filteredAllocations.map((item, idx) => (
          <div
            key={item._id}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 relative"
          >
            {/* Delete Button in Top-Right */}
            <button
              className="absolute top-3 right-3 text-[10px] font-[600] text-white bg-red-600 rounded-lg px-2 py-1"
              onClick={() => handleDeleteAllocation(item._id)}
            >
              Delete
            </button>

            {/* Field Blocks */}
            {/* <div className="text-[12px] font-semibold text-gray-900 mb-1">
              SL No:{" "}
              <span className="font-normal text-gray-700">{idx + 1}</span>
            </div> */}

            <div className="text-[12px] font-[600] text-gray-500 mb-1">
              Seller:{" "}
              <span className="font-normal text-gray-500">{item.sellerName}</span>
            </div>

            <div className="text-[12px] font-[600] text-gray-500 mb-1">
              Allotted Executive:{" "}
              <span className="font-normal text-gray-500">{item.employeeName}</span>
            </div>

            <div className="text-[12px] font-[600] text-gray-500">
              Allocation Date:{" "}
              <span className="font-normal text-gray-500">
                {new Date(item.allocatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>




    </div>
  );
}

export default AllocateRoles;
