import React, { useState } from 'react';
import axios from "axios";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
// const Razorpay = require("razorpay");
// import { toast } from "react-toastify";
import { deleteSession } from '../utils/session';
import {Notification} from "../Notification"



const RechargeWallet = () => {
  const [amount, setAmount] = useState(1000);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(0);
  const [showCoupons, setShowCoupons] = useState(false);
  const [user, setUser] = useState(null);
  const [cashfree, setCashfree] = useState(null);
  const [balance, setBalance] = useState(null);
  const [walletId, setWalletId] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (amount < 500) {
      Notification("Minimum amount should be 500","warning");
      return;
    }



    try {
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const token = Cookies.get("session");
      const { data } = await axios.post(
        `${REACT_APP_BACKEND_URL}/razorpay/create-order`,
        { amount, walletId }, // ✅ Correct placement of body
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
        theme: { color: "#3399cc" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      deleteSession()
      console.error("Payment process failed:", error);
      Notification("Something went wrong. Please try again.","error");
    }
  };



  // ✅ Function to load Razorpay script dynamically
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


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("session");
        // console.log(token)
        if (!token) {
          // navigate("/login");
          return;
        }

        const response = await axios.get(`${REACT_APP_BACKEND_URL}/user/getUserDetails`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response.data)

        if (!response.data.user) {
          navigate('/login');
        } else {
          setUser(response.data.user);
          setBalance(response.data.user.Wallet.balance);
          setWalletId(response.data.user.Wallet._id);
          // console.log(user)
          // console.log(balance)
          // console.log(walletId)
        }

      } catch (err) {
        console.error("Error fetching user:", err);
        // navigate('/login');
      }
    };

    fetchUser();


  }, [navigate, balance]);

  const codRemittance = () => {
    navigate("/dashboard/CodRemittanceRecharge")
  }
  const handleAmountChange = (value) => {
    setAmount(value);
  };

  const handleCouponApply = () => {
    setAppliedCoupon(0);
  };

  return (
    <Modal
      isOpen={true}
      onRequestClose={() => navigate(-1)}
      className="modal-content bg-white p-6 md:p-6 rounded-lg shadow-2xl w-[90%] sm:w-[80%] md:w-[50%] lg:w-[40%] xl:w-[30%] max-h-[85vh] overflow-hidden relative mt-14"
      overlayClassName="fixed inset-0 bg-transparent backdrop-blur-lg flex items-center justify-center"
      style={{ fontFamily: "__Archivo_8dfe08, __Archivo_Fallback_8dfe08, Helvetica, Arial, sans-serif" }}
    >


      {/* Close Button (Always Visible) */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-3 right-3 text-[#2d054b] hover:text-gray-900 text-2xl focus:outline-none block"
      >
        &times;
      </button>

      {/* Heading */}
      <div className="sticky top-0 bg-white z-10 pb-2">
        <h2 className="text-lg md:text-xl font-semibold text-[#2d054b] mb-3 text-center">
          Recharge Your Wallet
        </h2>
        <p className="text-[#2d054b] mb-4 text-sm text-center">
          Current wallet amount{" "}
          <span className="text-green-500 font-semibold">
            ₹{(balance || 0).toFixed(2)}
          </span>
        </p>

      </div>

      {/* Scrollable Content */}
      <div className="max-h-[70vh] overflow-y-auto px-2 pb-[4rem] md:pb-0">
        {/* Amount Input */}
        <div className="bg-green-50 p-2 rounded-lg mb-4">
          <label className="block text-[#2d054b] font-medium mb-1 text-sm text-center">
            Enter Amount (Multiples of 500)
          </label>
          <input
            type="text"
            className="w-full p-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d054b]"
            min={500}
            max={5000000}
            step={100}
            value={amount}
            onChange={(e) => handleAmountChange(Number(e.target.value))}
          />
          <p className="text-[#0CBB7D] text-xs mt-1 text-center">Min: ₹ 500 | Max: ₹ 5000000</p>

          {/* Predefined Amount Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            {[500, 1000, 2500, 5000].map((val) => (
              <button
                key={val}
                className={`px-3 py-2 rounded-lg border text-sm ${amount === val ? 'bg-[#0CBB7D] text-white' : 'bg-white text-[#2d054b]'
                  } focus:outline-none`}
                onClick={() => handleAmountChange(val)}
              >
                ₹ {val}
              </button>
            ))}
          </div>
        </div>

        {/* Coupon Section */}
        {/* <div className="mb-4">
          <label className="block text-[#2d054b] font-medium mb-1 text-sm text-center">
            Have a coupon?
          </label>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="Enter coupon"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#2d054b]"
            />
            <button
              onClick={handleCouponApply}
              className="bg-[#0CBB7D] text-white px-6 py-2 w-full md:w-auto rounded-lg focus:outline-none text-sm text-center"
            >
              Apply
            </button>
          </div>
          <button
            className="text-[#0CBB7D] mt-2 text-sm focus:outline-none"
            onClick={() => setShowCoupons(!showCoupons)}
          >
            View Available coupons {showCoupons ? '▲' : '▼'}
          </button>
          {showCoupons && (
            <div className="mt-2 p-2 bg-gray-100 text-[#0CBB7D] rounded-lg text-sm">
              <p>No coupons available</p>
            </div>
          )}
        </div> */}


        {/* Summary Section */}
        {/* <div className="bg-purple-50 p-6 rounded-lg mb-4 text-[13px]">
          <div className="flex justify-between text-[#2d054b] mb-2">
            <span>Recharge Amount</span>
            <span>₹ {amount}</span>
          </div>
          <div className="flex justify-between text-[#2d054b] mb-2">
            <span>Coupon Discount</span>
            <span>₹ {appliedCoupon}</span>
          </div>
          <div className="flex justify-between font-medium text-[#2d054b]">
            <span>Total to be credited</span>
            <span>₹ {amount - appliedCoupon}</span>
          </div>
        </div> */}

        {/* Buttons (Not Fixed, Slightly Cut in Mobile) */}
        <button
          onClick={handlePayment}
          // disabled={amount <= 1}
          className={`w-full p-2 rounded-lg font-medium text-sm focus:outline-none focus:ring-2 ${amount < 500
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-[#0CBB7D] text-white hover:bg-[#0aa66d]'
            }`}
        >
          Continue to Payment
        </button>
        <button
          onClick={codRemittance}
          className="w-full mt-2 p-2 bg-yellow-200 rounded-lg font-[600] text-[12px] focus:outline-none focus:ring-2 text-gray-700 hover:bg-yellow-300"
        >
          Recharge from COD Remittance
        </button>


      </div>
    </Modal>



  );
};

export default RechargeWallet;