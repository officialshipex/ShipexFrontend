import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { Notification } from "../Notification";
import { FiArrowLeft, FiActivity, FiRefreshCw } from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CodRemittanceRecharge = () => {
  const [amount, setAmount] = useState(1000);
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  const [walletId, setWalletId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const token = Cookies.get("session");

      if (!token) {
        console.error("Authentication token is missing.");
        return;
      }

      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/cod/codRemittanceRecharge`,
        { amount, walletId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Notification(response.data.message || "Payment Successful", "success");
      console.log("Payment successful:", response.data);

      // Navigate or update state as needed - navigate(-1) goes back to previous page (likely RechargeWallet or Dashboard)
      // Original code had navigate("/login") commented out in a weird way, assuming we want to stay or go back.
      // Going back to dashboard seems appropriate after success.
      navigate("/dashboard");

      // Update balance logic if we stayed on page (but we navigated away)
      setBalance((prev) => prev - amount);

    } catch (error) {
      if (error.response?.status === 404) {
        Notification(error.response?.data.message || "Warning: Insufficient Balance", "warning");
      } else {
        Notification(error.response?.data.message || "Error processing payment", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get("session");
        if (!token) return;

        const responses = await axios.get(
          `${REACT_APP_BACKEND_URL}/cod/getCodRemitance`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setBalance(responses.data.remittance);

        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/user/getUserDetails`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.data.user) {
          navigate("/login");
        } else {
          setUser(response.data.user);
          setWalletId(response.data.user.Wallet._id);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, [navigate]);

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
      <div className="bg-[#F59E0B] p-6 text-center relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-6 top-6 text-white hover:text-yellow-100 transition-colors"
        >
          <FiArrowLeft size={18} />
        </button>
        <h2 className="sm:text-[14px] text-[12px] font-bold text-white mb-2">COD Remittance Recharge</h2>
        {/* <p className="text-yellow-100 text-[12px]">Transfer from COD to Wallet</p> */}

        {/* Balance Card - Floating effect */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-[90%] bg-white rounded-xl shadow-lg p-4 flex justify-between items-center z-10">
          <div>
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Available Remittance</p>
            <h3 className="sm:text-[14px] text-[12px] font-bold text-gray-700">₹ {(balance || 0).toFixed(2)}</h3>
          </div>
          <div className="bg-yellow-50 p-3 rounded-full">
            <FaMoneyBillWave className="text-[#F59E0B] text-[14px]" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 px-6 pb-2 h-full overflow-y-auto custom-scrollbar">
        <div className="space-y-6">

          {/* Amount Input Section */}
          <div className="space-y-2">
            <label className="text-gray-700 font-semibold sm:text-[12px] text-[10px] block">
              Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold sm:text-[14px] text-[12px]">₹</span>
              <input
                type="number"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg sm:text-[14px] text-[12px] font-bold text-gray-700 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-yellow-50 transition-all placeholder-gray-300"
                min={500}
                value={amount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <p className={`text-[10px] flex items-center gap-1 ${amount < 500 ? "text-red-500" : "text-gray-400"}`}>
              {amount < 500 && <FiActivity />} Minimum transfer amount is ₹ 500
            </p>
          </div>

          {/* Quick Amount Chips */}
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2500, 5000].map((val) => (
              <button
                key={val}
                onClick={() => handleAmountChange(val)}
                className={`py-2 px-1 rounded-lg sm:text-[12px] text-[10px] font-semibold transition-all duration-200 border ${amount === val
                    ? "bg-[#F59E0B] text-white border-[#F59E0B] shadow-md transform scale-105"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#F59E0B] hover:bg-yellow-50"
                  }`}
              >
                ₹ {val}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={handlePayment}
              disabled={loading || amount < 500 || (balance || 0) < amount}
              className={`w-full py-2 rounded-lg font-bold sm:text-[12px] text-[10px] text-white shadow-lg transition-all duration-300 transform active:scale-95 flex justify-center items-center gap-2 ${loading || amount < 500 || (balance || 0) < amount
                  ? "bg-gray-300 cursor-not-allowed shadow-none"
                  : "bg-[#F59E0B] hover:bg-[#e08e00] hover:shadow-xl shadow-yellow-200"
                }`}
            >
              {loading ? (
                <>
                  <FiRefreshCw className="animate-spin text-[14px]" /> Processing...
                </>
              ) : (
                `Transfer ₹ ${amount || 0} to Wallet`
              )}
            </button>
            {(balance || 0) < amount && (
              <p className="text-red-500 text-[10px] text-center mt-2 font-medium">
                Insufficient remittance balance
              </p>
            )}
          </div>

        </div>
      </div>
    </Modal>
  );
};

export default CodRemittanceRecharge;
