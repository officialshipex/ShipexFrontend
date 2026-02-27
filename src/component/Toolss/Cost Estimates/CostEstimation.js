import React, { useRef, useState, useEffect } from "react";
import ImportantTerms from "./ImportantTerms";
import axios from "axios";
import CourierSelectionRate from "./CourierSelectionRate";
import costEstimationimg from "../../../assets/undraw_our_solution_re_8yk6 1.png";
import CostEstimationHeader from "./CostEstimationHeader";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { FiChevronDown } from "react-icons/fi";
import { Notification } from "../../../Notification";
import ThreeDotLoader from "../../../Loader";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CostEstimation = () => {
  const resultSectionRef = useRef(null);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    shipmentType: "Forward",
    pickUpPincode: "",
    deliveryPincode: "",
    weight: "",
    declaredValue: "",
    paymentType: "Prepaid",
    dimensions: { length: "", breadth: "", height: "" },
  });

  const [courierData, setCourierData] = useState([]);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("dimensions")) {
      const dimensionKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.pickUpPincode || !formData.deliveryPincode || !formData.weight || !formData.declaredValue) {
      Notification("Please fill all required fields", "warning");
      return;
    }

    if (formData.pickUpPincode.length !== 6 || formData.deliveryPincode.length !== 6) {
      Notification("Pincode must be exactly 6 digits", "warning");
      return;
    }

    if (!formData.dimensions.length || !formData.dimensions.breadth || !formData.dimensions.height) {
      Notification("Please fill all dimension fields", "warning");
      return;
    }

    // Convert dimensions to numbers for calculation
    const length = Number(formData.dimensions.length);
    const breadth = Number(formData.dimensions.breadth);
    const height = Number(formData.dimensions.height);
    const actualWeight = Number(formData.weight);

    // Calculate volumetric weight
    const volumetricWeight = (length * breadth * height) / 5000;

    // Determine applicable weight (whichever is greater)
    const applicableWeight = Math.max(actualWeight, volumetricWeight);

    // Updated payload
    const requestData = {
      ...formData,
      applicableWeight,
    };

    try {
      setLoading(true);
      setHasFetched(true);
      setIsDataFetched(false);

      const token = Cookies.get("session");
      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/ratecalculate/Rate`,
        requestData,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data[0].forward.finalCharges === null) {
        Notification("Pincode serviceability is not available", "info");
        setCourierData([]);
        setIsDataFetched(false);
      } else {
        setCourierData(response.data);
        setIsDataFetched(true);

        // Auto-scroll to the result section
        setTimeout(() => {
          resultSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    } catch (error) {
      console.log("Error submitting form:", error);
      Notification("Failed to calculate rates. Please try again.", "error");
      setIsDataFetched(false);
    } finally {
      setLoading(false);
      setHasFetched(false);
    }
  };

  return (
    <div className="sm:px-2">
      <CostEstimationHeader />

      <div className="sm:bg-white mx-auto w-full max-w-full border bg-white rounded-lg sm:p-4 p-2 flex flex-col md:flex-row">
        {/* Form Section - Left Side */}
        <form
          onSubmit={handleSubmit}
          className="space-y-2 w-full md:w-1/2 pr-0 md:pr-8"
        >
          <div className="grid grid-cols-2 gap-2">
            {/* Pick-up Area Pincode */}
            <div>
              <label className="block font-[600] mb-2 text-gray-700 text-[12px]">
                Pickup Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="pickUpPincode"
                value={formData.pickUpPincode}
                onChange={handleChange}
                placeholder="6 Digits Pickup Pincode"
                pattern="^\d{6}$"
                maxLength="6"
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, "");
                }}
                className="w-full border rounded-lg px-3 py-2 text-[12px] font-[600] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
              />
            </div>

            {/* Delivery Area Pincode */}
            <div>
              <label className="block font-[600] mb-2 text-gray-700 text-[12px]">
                Delivery Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="deliveryPincode"
                value={formData.deliveryPincode}
                onChange={handleChange}
                placeholder="6 Digits Delivery Pincode"
                pattern="^\d{6}$"
                maxLength="6"
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, "");
                }}
                title="Please enter exactly 6 digits"
                className="w-full border rounded-lg px-3 py-2 text-[12px] font-[600] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Approximate Weight */}
            <div>
              <label className="block font-[600] mb-2 text-gray-700 text-[12px]">
                Approximate Weight (kg) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center w-full rounded-lg overflow-hidden">
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="E.g. 1"
                  inputMode="decimal"
                  pattern="^\d*\.?\d*$"
                  onKeyDown={(e) => {
                    const allowedKeys = [
                      "Backspace",
                      "Tab",
                      "ArrowLeft",
                      "ArrowRight",
                      "Delete",
                      ".",
                    ];
                    const isNumber = /\d/.test(e.key);
                    if (!isNumber && !allowedKeys.includes(e.key))
                      e.preventDefault();
                    if (e.key === "." && e.currentTarget.value.includes("."))
                      e.preventDefault();
                  }}
                  className="flex-1 px-3 py-2 text-[12px] font-[600] text-gray-700 outline-none border border-r-0 rounded-l-lg"
                />
                <span className="w-10 py-2 flex items-center justify-center bg-[#0CBB7D] text-white text-[12px] font-[600] border border-l border-[#0CBB7D] rounded-r-lg">
                  kg
                </span>
              </div>
            </div>

            {/* Declared Value */}
            <div>
              <label className="block font-[600] mb-2 text-gray-700 text-[12px]">
                Declared Value in INR <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center w-full overflow-hidden">
                <input
                  type="text"
                  name="declaredValue"
                  value={formData.declaredValue}
                  onChange={handleChange}
                  placeholder="Declared Value"
                  inputMode="numeric"
                  pattern="^\d*$"
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, "");
                  }}
                  className="flex-1 px-3 py-2 border border-r-0 text-[12px] font-[600] text-gray-700 outline-none rounded-l-lg"
                />
                <span className="w-10 py-2 flex items-center justify-center bg-[#0CBB7D] text-white text-[12px] font-[600] border border-l border-[#0CBB7D] rounded-r-lg">
                  ₹
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Payment Type */}
            <div className="relative" ref={dropdownRef}>
              <label className="block font-[600] mb-2 text-gray-700 text-[12px]">
                Payment Type <span className="text-red-500">*</span>
              </label>

              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex justify-between items-center w-full border rounded-lg px-3 py-2 text-[12px] font-[600] text-gray-700 cursor-pointer focus:ring-1 focus:ring-[#0CBB7D]"
              >
                {formData.paymentType || "Select Payment Type"}
                <FiChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : "rotate-0"
                    }`}
                />
              </div>

              {dropdownOpen && (
                <div className="absolute z-10 left-0 right-0 bg-white mt-1 border border-gray-300 rounded-lg transition-all duration-200 text-[12px] overflow-hidden font-[600] text-gray-700 shadow-lg">
                  {["Prepaid", "COD"].map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setFormData({ ...formData, paymentType: option });
                        setDropdownOpen(false);
                      }}
                      className={`px-3 py-2 cursor-pointer hover:bg-green-50 transition-colors ${formData.paymentType === option
                        ? "bg-green-100 font-[600]"
                        : ""
                        }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dimensions */}
            <div>
              <label className="block font-[600] mb-2 text-gray-700 text-[12px]">
                Dimensions (cm)<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="dimensions.length"
                  value={formData.dimensions.length}
                  onChange={handleChange}
                  placeholder="Length"
                  className="w-full border rounded-lg px-2 py-2 text-[12px] font-[600] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                />
                <input
                  type="number"
                  name="dimensions.breadth"
                  value={formData.dimensions.breadth}
                  onChange={handleChange}
                  placeholder="Width"
                  className="w-full border rounded-lg px-2 py-2 text-[12px] font-[600] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                />
                <input
                  type="number"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleChange}
                  placeholder="Height"
                  className="w-full border rounded-lg px-2 py-2 text-[12px] font-[600] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                />
                {/* <span className="text-[12px] font-[600] text-gray-500 whitespace-nowrap">cm</span> */}
              </div>
            </div>
          </div>

          <div className="flex justify-start">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0CBB7D] text-[12px] text-white font-[600] py-2 px-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Calculating...
                </>
              ) : (
                "Calculate"
              )}
            </button>
          </div>
        </form>

        {/* Image Section - Right Side */}
        <div className="w-full md:w-1/2 flex items-center justify-center mt-6 md:mt-0">
          <img
            src={costEstimationimg}
            alt="Illustration"
            className="hidden md:block max-w-[370px] w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* Scroll to this section */}
      <div ref={resultSectionRef} className="mt-2 mx-auto w-full">
        {loading && hasFetched && (
          <div className="flex justify-center items-center py-10 bg-white rounded-lg shadow-sm">
            <ThreeDotLoader />
          </div>
        )}

        {!loading && isDataFetched && (
          <CourierSelectionRate
            plan={courierData.filter(
              (item) => item.forward.finalCharges !== null
            )}
            isDataFetched={isDataFetched}
            loading={loading}
            hasFetched={hasFetched}
          />
        )}
      </div>

      <div className="mt-2 mx-auto w-full">
        <ImportantTerms />
      </div>
    </div>
  );
};

export default CostEstimation;
