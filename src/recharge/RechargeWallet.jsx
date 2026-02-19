import React, { useState, useEffect } from 'react';
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { deleteSession } from '../utils/session';
import { Notification } from "../Notification";
import { FiCreditCard, FiArrowLeft, FiActivity } from "react-icons/fi";

const RechargeWallet = () => {
  const [amount, setAmount] = useState(1000);
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  const [walletId, setWalletId] = useState(null);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();

  // Function to load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (amount < 500) {
      Notification("Minimum amount should be 500", "warning");
      return;
    }

    try {
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const token = Cookies.get("session");
      const { data } = await axios.post(
        `${REACT_APP_BACKEND_URL}/razorpay/create-order`,
        { amount, walletId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!data.order) {
        throw new Error("Failed to create Razorpay order");
      }

      const { id: order_id, amount: orderAmount, currency } = data.order;

      const options = {
        key: process.env.RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency: currency,
        name: "Shipex India",
        description: "Live Transaction",
        order_id: order_id,
        theme: { color: "#0CBB7D" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      deleteSession();
      console.error("Payment process failed:", error);
      Notification("Something went wrong. Please try again.", "error");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("session");
        if (!token) return;

        const response = await axios.get(`${REACT_APP_BACKEND_URL}/user/getUserDetails`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.data.user) {
          navigate('/login');
        } else {
          setUser(response.data.user);
          setBalance(response.data.user.Wallet.balance);
          setWalletId(response.data.user.Wallet._id);
        }

      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, [navigate, REACT_APP_BACKEND_URL]);

  const codRemittance = () => {
    navigate("/dashboard/CodRemittanceRecharge");
  }

  const handleAmountChange = (value) => {
    setAmount(value);
  };

  return (
    <Modal
      isOpen={true}
      onRequestClose={() => navigate(-1)}
      className="modal-content bg-white rounded-2xl shadow-2xl w-[95%] sm:w-[90%] md:w-[60%] lg:w-[45%] xl:w-[35%] max-h-[90vh] overflow-hidden relative outline-none page-slide-in pb-6"
      overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
    >
      {/* Header */}
      <div className="bg-[#0CBB7D] p-6 text-center relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-6 top-6 text-white hover:text-green-100 transition-colors"
        >
          <FiArrowLeft size={18} />
        </button>
        <h2 className="sm:text-[14px] text-[12px] font-bold text-white mb-2">Add Money to Wallet</h2>
        {/* <p className="text-green-100 text-[12px]">Secure & Instant Recharge</p> */}

        {/* Wallet Balance Card - Floating effect */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-[90%] bg-white rounded-xl shadow-lg p-4 flex justify-between items-center z-10">
          <div>
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Current Balance</p>
            <h3 className="sm:text-[14px] text-[12px] font-bold text-gray-800">₹ {(balance || 0).toFixed(2)}</h3>
          </div>
          <div className="bg-green-50 p-3 rounded-full">
            <FiCreditCard className="text-[#0CBB7D] sm:text-[14px] text-[12px]" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-12 px-6 pb-2 h-full overflow-y-auto custom-scrollbar">
        <div className="space-y-4">

          {/* Amount Input Section */}
          <div className="space-y-2">
            <label className="text-gray-700 font-semibold sm:text-[12px] text-[10px] block">
              Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold sm:text-[14px] text-[12px]">₹</span>
              <input
                type="number"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg sm:text-[14px] text-[12px] font-bold text-gray-700 focus:outline-none focus:border-[#0CBB7D] focus:ring-1 focus:ring-green-50 transition-all placeholder-gray-300"
                min={500}
                value={amount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <p className={`text-[10px] flex items-center gap-1 ${amount < 500 ? "text-red-500" : "text-gray-400"}`}>
              {amount < 500 && <FiActivity />} Minimum amount required is ₹ 500
            </p>
          </div>

          {/* Quick Amount Chips */}
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2500, 5000].map((val) => (
              <button
                key={val}
                onClick={() => handleAmountChange(val)}
                className={`py-2 px-1 rounded-lg sm:text-[12px] text-[10px] font-semibold transition-all duration-200 border ${amount === val
                    ? "bg-[#0CBB7D] text-white border-[#0CBB7D] shadow-md transform scale-105"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#0CBB7D] hover:bg-green-50"
                  }`}
              >
                ₹ {val}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-2">
            <button
              onClick={handlePayment}
              disabled={amount < 500}
              className={`w-full py-2 rounded-lg font-bold sm:text-[12px] text-[10px] text-white shadow-sm transition-all duration-300 transform active:scale-95 ${amount < 500
                  ? "bg-gray-300 cursor-not-allowed shadow-none"
                  : "bg-[#0CBB7D] hover:bg-[#0aa66d] hover:shadow-xl shadow-green-200"
                }`}
            >
              Proceed to Pay ₹ {amount || 0}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-medium uppercase">Or</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <button
              onClick={codRemittance}
              className="w-full py-2 rounded-lg font-bold sm:text-[12px] text-[10px] text-[#F59E0B] bg-yellow-50 border border-yellow-100 hover:bg-yellow-100 transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <span>Recharge via COD Remittance</span>
            </button>
          </div>

        </div>
      </div>
    </Modal>
  );
};

export default RechargeWallet;