import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ShippingComponent from "./Shippings";
import InvoicesComponent from "./Invoices";
import RemittanceComponent from "../Billings/Remittance";
import PassbookComponent from "./PassBook";
import EarlyCODModal from "./EarlyCodPopup";
import WalletHistory from "./WalletHistory";
import Cookies from "js-cookie";
import { ChevronDown } from "lucide-react";
// import DowngradeComponent from "../Billings/Downgrade";
import { Truck, Banknote, BookOpen, Wallet, CircleDollarSign } from "lucide-react";
import { Lock } from "lucide-react";

const icons = {
  Shipping: <Truck className="w-4 h-4" />,
  "COD Remittance": <Banknote className="w-4 h-4" />,
  PassBook: <BookOpen className="w-4 h-4" />,
  "Wallet History": <Wallet className="w-4 h-4" />,
};

const Billing = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState("Shipping");
  const [totalShipments, setTotalShipments] = useState(0);
  const [totalFreightCharges, setTotalFreightCharges] = useState(0);
  const [searchQueries, setSearchQueries] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [filtersApplied, setFiltersApplied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [clearFiltersTrigger, setClearFiltersTrigger] = useState(false);
  const [balance, setBalance] = useState(0);
  const [holdAmount, setHoldAmount] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const { id } = useParams();

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const toggleFilters = () => {
    if (filtersApplied) {
      // Trigger clear manually
      setClearFiltersTrigger(true); // Add this
      setFiltersApplied(false);
      setShowFilters(false);
    } else {
      setShowFilters((prev) => !prev);
    }
  };

  const clearFilters = () => { };

  const fetchWalletSummary = async () => {
    try {
      const token = Cookies.get("session");
      const params = {
        id
      }
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/recharge/getWalletBalanceAndHoldAmount`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setBalance(response.data.balance);
        setHoldAmount(response.data.holdAmount);
        setCreditLimit(response.data.creditLimit);
      } else {
        console.error("Failed to fetch wallet summary:", response.data.message);
      }
    } catch (err) {
      console.error("Error fetching wallet summary:", err);
    }
  };

  useEffect(() => {
    fetchWalletSummary();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = Cookies.get("session");
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/order/orders`,
          {
            headers: { authorization: `Bearer ${token}` },
          }
        );

        const orders = response.data;
        setTotalShipments(orders.length);

        const totalCharges = orders.reduce(
          (acc, order) => acc + (order.totalFreightCharges || 0),
          0
        );
        setTotalFreightCharges(totalCharges.toFixed(2));

        const responses = await axios.get(
          `${REACT_APP_BACKEND_URL}/order/getUser`,
          {
            headers: { authorization: `Bearer ${token}` },
          }
        );
        if (responses.data.isAdmin === true) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  const handleSearch = (selectedItem, event) => {
    setSearchQueries({
      ...searchQueries,
      [selectedItem]: event.target.value,
    });
  };

  const handleBoxClick = (label) => {
    setSelectedItem(label);
  };
  // const adminCODcallback = () => {
  //   navigate("/dashboard/AdminCodRemittances");
  // };
  const getTotalShipmentsText = (label) => {
    switch (label) {
      case "Shipping":
        return "Total Shipments";
      case "Invoices":
        return "Total Invoices raised";
      case "Remittance":
        return "Total COD Remitted";
      case "PassBook":
        return "Total Recharge Amount";

      // case "Downgrade":
      //   return "Total Downgrades Requests";
      default:
        return "Total Shipments";
    }
  };

  const tabs = ["Shipping", "COD Remittance", "PassBook", "Wallet History", "Invoices"];

  const renderComponent = () => {
    switch (selectedItem) {
      case "Shipping":
        return (
          <ShippingComponent
            showFilters={showFilters}
            setFiltersApplied={setFiltersApplied}
            clearFiltersTrigger={clearFiltersTrigger}
            setClearFiltersTrigger={setClearFiltersTrigger}
            setShowFilters={setShowFilters}
          />
        );
      case "Invoices":
        return (
          <InvoicesComponent
            setFiltersApplied={setFiltersApplied}
            clearFiltersTrigger={clearFiltersTrigger}
            setClearFiltersTrigger={setClearFiltersTrigger}
          />
        );
      case "COD Remittance":
        return (
          <RemittanceComponent
            setFiltersApplied={setFiltersApplied}
            clearFiltersTrigger={clearFiltersTrigger}
            setClearFiltersTrigger={setClearFiltersTrigger}
          />
        );
      case "PassBook":
        return (
          <PassbookComponent
            showFilters={showFilters}
            setFiltersApplied={setFiltersApplied}
            clearFiltersTrigger={clearFiltersTrigger}
            setClearFiltersTrigger={setClearFiltersTrigger}
            setShowFilters={setShowFilters}
          />
        );
      case "Wallet History":
        return (
          <WalletHistory
            setFiltersApplied={setFiltersApplied}
            clearFiltersTrigger={clearFiltersTrigger}
            setClearFiltersTrigger={setClearFiltersTrigger}
          />
        );
      // case "Downgrade":
      //   return <DowngradeComponent />;
      default:
        return null;
    }
  };

  return (
    <div className="sm:px-2 w-full">
      <div className="flex flex-row items-center sm:items-start justify-between w-full">
        {!id && (
          <div className="">
            <h1 className="sm:text-[14px] text-[12px] text-gray-700 font-[600]">Billings</h1>
          </div>
        )}



        {/* Search Box */}
        <div className="flex items-center">

          <div className="flex flex-row sm:flex-col w-full gap-2">
            <div className="w-full sm:w-full">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-[#0CBB7D] mb-2 sm:mb-0 text-white font-[600] px-3 py-2 rounded-lg text-[10px]"
              >
                Early COD
              </button>
            </div>


            <EarlyCODModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      </div>
      {/* Balance + Hold + Usable + Credit green boxes */}
      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-6/12 mb-2">

        <div className="flex gap-2 w-full">
          {/* Wallet Balance Box */}
          <div className="flex flex-row w-full bg-white text-gray-700 rounded-lg gap-2 px-2 h-14 items-center justify-start text-[12px] border border-[#0CBB7D]">
            <div className="p-2 rounded-full flex justify-center items-center bg-[#0CBB7D] text-white">
              <Wallet className="w-4 h-4" />
            </div>

            <div className="flex flex-col font-[600] leading-tight">
              <p>Wallet Balance</p>
              <p className="font-[700]">{Number(balance).toFixed(2)}</p>
            </div>
          </div>

          {/* Hold Amount Box */}
          <div className="flex flex-row w-full bg-white text-gray-700 rounded-lg gap-2 px-2 h-14 items-center justify-start text-[12px] border border-[#0CBB7D]">
            <div className="p-2 rounded-full flex justify-center items-center bg-[#0CBB7D] text-white">
              <Lock className="w-4 h-4" />
            </div>

            <div className="flex flex-col font-[600] leading-tight">
              <p>Hold Amount</p>
              <p className="font-[700]">{Number(holdAmount).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          {/* Credit Limit Box */}
          <div className="flex flex-row w-full bg-white text-gray-700 rounded-lg gap-2 px-2 h-14 items-center justify-start text-[12px] border border-[#0CBB7D]">
            <div className="p-2 rounded-full flex justify-center items-center bg-[#0CBB7D] text-white">
              <Lock className="w-4 h-4" />
            </div>

            <div className="flex flex-col font-[600] leading-tight">
              <p>Credit Limit</p>
              <p className="font-[700]">{Number(creditLimit).toFixed(2)}</p>
            </div>
          </div>

          {/* Usable Balance Box */}
          <div className="flex flex-row w-full bg-white text-gray-700 rounded-lg gap-2 px-3 py-2 items-center justify-start text-[12px] border border-[#0CBB7D]">
            <div className="p-2 rounded-full flex justify-center items-center bg-[#0CBB7D] text-white">
              <CircleDollarSign className="w-4 h-4 rotate-180" />
            </div>

            <div className="flex flex-col font-[600] leading-tight">
              <p>Usable Balance</p>
              <p className="font-[700]">
                {(Number(balance) - Number(holdAmount)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

      </div>


      {/* Main Content */}
      <div className="flex flex-col lg:flex-row sm:mb-[-15px]">
        {/* Right Panel */}
        <div className="w-full">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Four Action Boxes */}
            <div className="hidden md:flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`px-3 py-2 text-[12px] border rounded-lg font-[600] transition-all duration-200 ${selectedItem === tab
                    ? "bg-[#0CBB7D] text-white"
                    : "bg-white text-gray-700 hover:bg-green-200"
                    }`}
                  onClick={() => setSelectedItem(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="relative md:hidden mb-[-15px]">
        <button
          className="w-full px-3 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-[12px] font-[600] text-gray-700 flex justify-between items-center"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {selectedItem} <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
        </button>
        {showDropdown && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] overflow-hidden animate-popup-in max-h-80 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`w-full text-left px-4 py-2 text-[12px] font-[600] transition-colors ${selectedItem === tab ? "bg-green-50 text-[#0CBB7D]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                onClick={() => {
                  setSelectedItem(tab);
                  setShowDropdown(false);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Render Selected Component */}
      <div className="mt-6">{renderComponent()}</div>
    </div>
  );
};

export default Billing;
