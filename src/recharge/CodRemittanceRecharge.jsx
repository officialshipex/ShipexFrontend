import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
// import { toast } from "react-toastify";
import {Notification} from "../Notification"

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CodRemittanceRecharge = () => {
  const [amount, setAmount] = useState(1000);
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  const [walletId, setWalletId] = useState(null);
  const [loading, setLoading] = useState(false); // ✅ Added loading state
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (loading) return; // Prevent multiple clicks

    try {
      setLoading(true); // ✅ Start loading state
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

      Notification(response.data.message || "Payment Successful","success");
      console.log("Payment successful:", response.data);
    //   if(){
        navigate("/login");
    //   }
      // ✅ Update balance after payment
      setBalance((prev) => prev - amount);

    } catch (error) {
      if (error.response?.status === 404) {
        Notification(error.response?.data.message || "Warning: Insufficient Balance","warning");
      } else {
        Notification(error.response?.data.message || "Error processing payment","error");
      }
    } finally {
      setLoading(false); // ✅ Stop loading state
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
      className="modal-content bg-white p-6 md:p-6 rounded-lg shadow-2xl w-[90%] sm:w-[80%] md:w-[50%] lg:w-[40%] xl:w-[30%] max-h-[85vh] overflow-hidden relative mt-14"
      overlayClassName="fixed inset-0 bg-transparent backdrop-blur-lg flex items-center justify-center"
      style={{
        fontFamily:
          "__Archivo_8dfe08, __Archivo_Fallback_8dfe08, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Close Button */}
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
          COD Remittance available{" "}
          <span className="text-green-500 font-semibold"> ₹{balance || 0}</span>
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="max-h-[70vh] overflow-y-auto px-2 pb-[4rem] md:pb-0">
        {/* Amount Input */}
        <div className="bg-green-50 p-2 rounded-lg mb-4">
          <label className="block text-[#2d054b] font-medium mb-1 text-sm text-center">
            Enter Amount (Multiples of 100)
          </label>
          <input
            type="text"
            className="w-full p-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2d054b]"
            min={499}
            max={5000000}
            step={100}
            value={amount}
            onChange={(e) => handleAmountChange(Number(e.target.value))}
          />
          <p className="text-[#2d054b] text-xs mt-1 text-center">
            Min: ₹ 500 | Max: ₹ 5000000
          </p>

          {/* Predefined Amount Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            {[500, 1000, 2500, 5000].map((val) => (
              <button
                key={val}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  amount === val
                    ? "bg-[#0CBB7D] text-white"
                    : "bg-white text-[#2d054b]"
                } focus:outline-none`}
                onClick={() => handleAmountChange(val)}
              >
                ₹ {val}
              </button>
            ))}
          </div>
        </div>

        {/* Recharge Button */}
        <button
          onClick={handlePayment}
          disabled={loading || amount <= 499 || balance === 0} // ✅ Disabled when loading
          className={`w-full p-2 rounded-lg font-medium text-sm focus:outline-none focus:ring-2 ${
            loading || amount <= 499 || balance === 0
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-[#0CBB7D] text-white hover:bg-green-500"
          }`}
        >
          {loading ? "Processing..." : "Continue to Recharge"} {/* ✅ Updated text */}
        </button>
      </div>
    </Modal>
  );
};

export default CodRemittanceRecharge;
