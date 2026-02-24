import axios from "axios";
import React, { useEffect, useState } from "react";
import { CheckCircleIcon, ClockIcon } from "lucide-react";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
const KYCDetails = () => {
  const [aadhaar, setAadhaar] = useState({});
  const [pan, setPan] = useState({});
  const [bank, setBank] = useState({});
  const [gst, setGst] = useState({});
  const isVerified_A = aadhaar?.aadhaarNumber;
  const isVerified_P = pan?.pan;
  const isVerified_b = bank?.accountNumber && bank?.ifsc;
  const isVerified_g = gst?.gstin;

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  useEffect(() => {
    // this is for Aadhaar
    const fetchAllData = async () => {
      try {
        const token = Cookies.get("session");
        //aadhar
        const response_a = await axios.get(
          `${REACT_APP_BACKEND_URL}/getKyc/getAadhaar`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setAadhaar(response_a.data.data);
        //pan
        const response_p = await axios.get(
          `${REACT_APP_BACKEND_URL}/getKyc/getPan`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPan(response_p.data);
        //bank account

        const response_b = await axios.get(
          `${REACT_APP_BACKEND_URL}/getKyc/getBankAccount`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setBank(response_b.data);

        //GST
        const response_g = await axios.get(
          `${REACT_APP_BACKEND_URL}/getKyc/getGST`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setGst(response_g.data);
      } catch (error) {
        Notification("it getting some error to fetching data", "error");
      }
    };
    fetchAllData();
  }, []);

  return (
    <div className="">
      <div className="w-full mx-auto">
        {/* Page Header */}
        <h1 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
          KYC Details
        </h1>

        {/* KYC Details Container */}
        {/* <div className="b w-full"> */}
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
          {/* Aadhar Details */}
          <div className={`px-3 py-2 border border-[#0CBB7D] bg-white rounded-lg shadow-sm`}>
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                Aadhaar Details
              </h2>
              {isVerified_A ? (
                <div className="flex items-center text-[#0CBB7D]">
                  <CheckCircleIcon className="sm:w-5 sm:h-5 w-4 h-4 mr-1" />
                  <span className="text-[10px] sm:text-[12px] font-[600]">Verified</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <ClockIcon className="sm:w-5 sm:h-5 w-4 h-4 mr-1" />
                  <span className="text-[10px] sm:text-[12px] font-[600]">Pending</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mt-2">
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Name -{" "}
                <span className="text-gray-700 font-[600]">
                  {aadhaar?.name || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Aadhaar Number -{" "}
                <span className="text-gray-700 font-[600]">
                  {aadhaar?.aadhaarNumber || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Guardian Name -{" "}
                <span className="text-gray-700 font-[600]">
                  {aadhaar?.sonOf || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                State -{" "}
                <span className="text-gray-700 font-[600]">
                  {aadhaar?.state || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Address -{" "}
                <span className="text-gray-700 font-[600]">
                  {aadhaar?.address || "N/A"}
                </span>
              </p>
            </div>
          </div>
          {/* PAN Details */}
          <div className="px-3 py-2 border border-[#0CBB7D] bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                PAN Details
              </h2>
              {isVerified_P ? (
                <div className="flex items-center text-[#0CBB7D]">
                  <CheckCircleIcon className="sm:w-5 sm:h-5 w-4 h-4 mr-1" />
                  <span className="text-[10px] sm:text-[12px] font-[600]">Verified</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <ClockIcon className="sm:w-5 sm:h-5 w-4 h-4 mr-1" />
                  <span className="text-[10px] sm:text-[12px] font-[600]">Pending</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mt-2">
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                PAN Number -{" "}
                <span className="text-gray-700 font-[600]">
                  {pan?.pan || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Name on PAN -{" "}
                <span className="text-gray-700 font-[600]">
                  {pan?.registeredName || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Type -{" "}
                <span className="text-gray-700 font-[600]">
                  {pan?.panType || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                PAN Ref ID -{" "}
                <span className="text-gray-700 font-[600]">
                  {pan?.panRefId || "N/A"}
                </span>
              </p>
            </div>
          </div>

          {/* Bank Details */}
          <div className="px-3 py-2 border border-[#0CBB7D] rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                Bank Details
              </h2>
              {isVerified_b ? (
                <div className="flex items-center text-[#0CBB7D]">
                  <CheckCircleIcon className="sm:w-5 sm:h-5 w-4 h-4 mr-1" />
                  <span className="text-[10px] sm:text-[12px] font-[600]">Verified</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <ClockIcon className="sm:w-5 sm:h-5 w-4 h-4 mr-1" />
                  <span className="text-[10px] sm:text-[12px] font-[600]">Pending</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mt-2">
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Beneficiary Name -{" "}
                <span className="text-gray-700 font-[600]">
                  {bank?.nameAtBank || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Bank Name -{" "}
                <span className="text-gray-700 font-[600]">
                  {bank?.bank || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Account Number -{" "}
                <span className="text-gray-700 font-[600]">
                  {bank?.accountNumber || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                IFSC Code -{" "}
                <span className="text-gray-700 font-[600]">
                  {bank?.ifsc || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Branch -{" "}
                <span className="text-gray-700 font-[600]">
                  {bank?.branch || "N/A"}
                </span>
              </p>
            </div>
          </div>
          {/* GST Details */}
          <div className="px-3 py-2 border border-[#0CBB7D] rounded-lg shadow-sm bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                GST Details
              </h2>
              {isVerified_g ? (
                <div className="flex items-center text-[#0CBB7D]">
                  <CheckCircleIcon className="sm:w-5 sm:h-5 w-4 h-4 mr-1" />
                  <span className="text-[10px] sm:text-[12px] font-[600]">Verified</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <ClockIcon className="sm:w-5 sm:h-5 w-4 h-4 mr-1" />
                  <span className="text-[10px] sm:text-[12px] font-[600]">Pending</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mt-2">
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                GST Number -{" "}
                <span className="text-gray-700 font-[600]">
                  {gst?.gstin || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Company Name -{" "}
                <span className="text-gray-700 font-[600]">
                  {gst?.nameOfBusiness || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Company Address -{" "}
                <span className="text-gray-700 font-[600]">
                  {gst?.address || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                Pincode -{" "}
                <span className="text-gray-700 font-[600]">
                  {gst?.pincode || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                City -{" "}
                <span className="text-gray-700 font-[600]">
                  {gst?.city || "N/A"}
                </span>
              </p>
              <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500">
                State -{" "}
                <span className="text-gray-700 font-[600]">
                  {gst?.state || "N/A"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* </div> */}
      </div>
    </div>
  );
};

export default KYCDetails;
