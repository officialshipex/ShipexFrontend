import React, { useState, useEffect } from "react";
import axios from "axios";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { Notification } from "../../Notification"

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ChevronDownIcon = ({ isOpen }) => (
  <svg
    className={`w-4 h-4 ml-2 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""
      }`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const AsignPopup = ({ isOpen, onClose }) => {
  const [plans, setPlans] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedSeller, setSelectedSeller] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
  const [sellerDropdownOpen, setSellerDropdownOpen] = useState(false);
  const [planOptions, setPlanOptions] = useState([]);

  // const planOptions = ["bronze", "silver", "gold", "platinum", "custom"];
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/saveRate/getPlanNames`
        );
        console.log("response", response.data.planNames);
        setPlanOptions(response.data.planNames || []);
      } catch (error) {
        console.error("Failed to fetch plans", error);
      }
    };
    fetchPlans();
  }, [])

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${REACT_APP_BACKEND_URL}/saveRate/getRateCard`);
        setPlans(response.data.rateCards || []);
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    };
    const fetchSellers = async () => {
      try {
        const token = Cookies.get("session");
        const response = await axios.get(`${REACT_APP_BACKEND_URL}/users/getUsers`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        setSellers(response.data.sellers || []);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      }
    };

    if (isOpen) {
      fetchPlans();
      fetchSellers();
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedPlan || !selectedSeller) {
      Notification("Please select a plan and a seller.", "info");
      return;
    }

    const selectedSellerDetails = sellers.find((seller) => seller.id === selectedSeller);
    if (!selectedSellerDetails) {
      Notification("Seller not found.", "error");
      return;
    }

    const filteredRateCards = plans.filter((card) => card.plan === selectedPlan);
    if (filteredRateCards.length === 0) {
      Notification("No rate cards found for the selected plan.", "error");
      return;
    }

    const data = {
      userId: selectedSeller,
      userName: selectedSellerDetails.name,
      planName: selectedPlan,
      rateCards: filteredRateCards,
    };

    try {
      const response = await axios.put(`${REACT_APP_BACKEND_URL}/users/assignPlan`, data);
      if (response.status >= 200 && response.status < 300) {
        Notification("Assigned Successfully", "success");
        onClose();
      } else {
        Notification(`Unexpected response: ${response.status}`, "error");
      }
    } catch (error) {
      console.error("Error assigning plan:", error);
      Notification(`An error occurred: ${error.response?.data?.error || error.message}`, "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-[12px] sm:text-[14px] text-gray-700 font-[600] mb-2">Assign Rate Card</h2>

        {/* Custom Plan Dropdown */}
        <label className="block text-[12px] font-[600] text-gray-500 mb-1">Select Plan</label>
        <div className="relative mb-2">
          <button
            className="w-full border border-gray-300 rounded-lg text-gray-500 p-2 text-left flex justify-between items-center h-9 text-[10px] sm:text-[12px]"
            onClick={() => setPlanDropdownOpen(!planDropdownOpen)}
          >
            <span>{selectedPlan ? selectedPlan : "Choose Plan"}</span>
            <ChevronDownIcon isOpen={planDropdownOpen} />
          </button>
          {planDropdownOpen && (
            <div className="absolute z-10 bg-white text-gray-500 border border-gray-300 rounded-lg w-full mt-1 max-h-40 overflow-auto shadow-sm">
              {planOptions.map((plan) => (
                <div
                  key={plan}
                  className="px-3 py-2 hover:bg-green-50 cursor-pointer text-[12px]"
                  onClick={() => {
                    setSelectedPlan(plan);
                    setPlanDropdownOpen(false);
                  }}
                >
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Seller Dropdown with Search */}
        <label className="block text-[12px] font-[600] text-gray-500 mb-1">Select Seller</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search Seller..."
            className="w-full border border-gray-300 p-2 text-gray-500 focus:outline-none focus:border-[#0CBB7D] rounded-lg mb-2 h-9 placeholder:text-[12px] text-[12px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSellerDropdownOpen(true)}
          />
          <button
            className="w-full border border-gray-300 p-2 rounded-lg text-left flex justify-between items-center text-gray-500 h-9 text-[12px]"
            onClick={() => setSellerDropdownOpen(!sellerDropdownOpen)}
          >
            <span>
              {selectedSeller
                ? `${sellers.find((s) => s.id === selectedSeller)?.userId} - ${sellers.find((s) => s.id === selectedSeller)?.name
                }`
                : "Choose Seller"}
            </span>
            <ChevronDownIcon isOpen={sellerDropdownOpen} />
          </button>
          {sellerDropdownOpen && (
            <div className="absolute z-10 bg-white text-[12px] text-gray-500 border border-gray-300 rounded-lg w-full mt-1 max-h-60 overflow-auto shadow-sm">
              {sellers
                .filter(
                  (seller) =>
                    seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    seller.id.includes(searchTerm)
                )
                .map((seller) => (
                  <div
                    key={seller.id}
                    className="px-3 py-2 hover:bg-green-50 cursor-pointer text-[12px]"
                    onClick={() => {
                      setSelectedSeller(seller.id);
                      setSellerDropdownOpen(false);
                    }}
                  >
                    {seller.userId} - {seller.name}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end mt-4">
          <button className="bg-gray-300 px-3 text-[10px] sm:text-[12px] font-[600] text-gray-700 py-2 rounded-lg mr-2" onClick={onClose}>
            Cancel
          </button>
          <button className="bg-[#0CBB7D] text-white px-3 py-2 font-[600] rounded-lg text-[10px] sm:text-[12px]" onClick={handleAssign}>
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsignPopup;
