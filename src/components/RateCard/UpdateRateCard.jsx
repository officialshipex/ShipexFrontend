import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Notification } from "../../Notification";
import { FiArrowLeft, FiChevronDown } from "react-icons/fi";

const RateCardUpdateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    plan: "",
    courierProviderName: "",
    courierServiceName: "",
    mode: "",
    status: "Active",
    shipmentType: "Forward",
    weightPriceBasic: {
      weight: "",
      zoneA: "",
      zoneB: "",
      zoneC: "",
      zoneD: "",
      zoneE: "",
    },
    weightPriceAdditional: {
      weight: "",
      zoneA: "",
      zoneB: "",
      zoneC: "",
      zoneD: "",
      zoneE: "",
    },
    codPercent: "",
    codCharge: "",
  });

  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [plans, setPlans] = useState([]); // State for fetched plans
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isShipmentTypeOpen, setIsShipmentTypeOpen] = useState(false);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    axios
      .get(`${REACT_APP_BACKEND_URL}/saveRate/getRateCard/${id}`)
      .then((response) => {
        const data = response.data.rateCard;
        console.log("Raw API Response:", data);

        const cleanWeightPriceBasic = { ...data.weightPriceBasic[0] };
        const cleanWeightPriceAdditional = { ...data.weightPriceAdditional[0] };

        // Ensure ID is removed
        delete cleanWeightPriceBasic.id;
        delete cleanWeightPriceAdditional.id;

        console.log(
          "Processed Data:",
          cleanWeightPriceBasic,
          cleanWeightPriceAdditional
        );

        setFormData({
          ...data,
          weightPriceBasic: cleanWeightPriceBasic,
          weightPriceAdditional: cleanWeightPriceAdditional,
        });

        setCouriers(response.data.couriers || []);
        setServices(response.data.services || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching rate card:", error);
        setError(error);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/saveRate/getPlanNames`
        );
        setPlans(response.data.planNames || []);
      } catch (error) {
        console.error("Failed to fetch plans", error);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/courierServices/couriers`
        );
        setCouriers(response.data); // Set the couriers state with fetched data
        console.log(response.data); // Optional: Log to verify data
      } catch (err) {
        console.error("Error fetching couriers:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedService) {
      setFormData((prevData) => ({
        ...prevData,
        mode: selectedService.courierType || "", // Update mode
      }));
    }
  }, [selectedService]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleWeightChange = (type, e) => {
    const { name, value } = e.target;

    if (name === "id") return; // Prevent updates to 'id'

    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [name]: value,
      },
    }));
  };

  const handleCourierSelect = (e) => {
    const selectedProvider = e.target.value;
    setFormData({ ...formData, courierProviderName: selectedProvider });

    const filteredArray = couriers.filter(
      (item) => item.provider === selectedProvider
    );
    const serviceNames =
      filteredArray.length > 0 ? filteredArray.map((item) => item.name) : [];
    setServices(serviceNames);
  };

  const handleServiceSelect = (e) => {
    const selectedServiceName = e.target.value;
    setFormData({ ...formData, courierServiceName: selectedServiceName });

    const selectedObject = couriers.find(
      (item) => item.name === selectedServiceName
    );
    setSelectedService(selectedObject || null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .put(`${REACT_APP_BACKEND_URL}/saveRate/updateRateCard/${id}`, formData)
      .then(() => {
        Notification("Rate Card updated successfully!", "success");
        navigate("/dashboard/rateCard");
      })
      .catch((error) => console.error("Error updating rate card:", error));
  };

  if (loading)
    return <p className="text-center text-lg font-semibold">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500">Error loading rate card.</p>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:bg-white sm:shadow-sm sm:rounded-lg mt-4 bg-white min-h-[calc(100vh-320px)]">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-green-100 rounded-full transition-colors text-gray-600"
        >
          <FiArrowLeft size={16} />
        </button>
        <h2 className="text-[12px] sm:text-[14px] font-bold text-gray-700">
          Rate Cards <span className="text-gray-400 font-medium mx-1">|</span> <span className="text-[#0CBB7D]">Update</span>
        </h2>
      </div>

      {/* Plan, Provider, Service */}
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <div className="flex gap-2 w-full sm:w-auto flex-1">
          {/* Plan Dropdown */}
          <div className="relative flex-1 sm:max-w-[180px]">
            <div
              onClick={() => setIsPlanOpen(!isPlanOpen)}
              className="flex items-center justify-between font-[600] border border-gray-300 bg-white px-3 py-1.5 h-9 rounded-lg cursor-pointer hover:border-[#0CBB7D] transition-all group"
            >
              <span className={`text-[10px] sm:text-[12px] truncate ${formData.plan ? "text-gray-700" : "text-gray-400"}`}>
                {formData.plan || "Select Plans"}
              </span>
              <FiChevronDown className={`text-gray-400 group-hover:text-[#0CBB7D] transition-transform flex-shrink-0 ${isPlanOpen ? "rotate-180" : ""}`} />
            </div>
            {isPlanOpen && (
              <div className="absolute font-[600] top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-sm z-[100] animate-in fade-in slide-in-from-top-2 max-h-48 overflow-y-auto">
                {plans.map((plan, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setFormData({ ...formData, plan: plan });
                      setIsPlanOpen(false);
                    }}
                    className="px-3 py-2 text-[10px] sm:text-[12px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                  >
                    {plan}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Provider Dropdown */}
          <div className="relative flex-1 sm:w-[200px] sm:max-w-[200px]">
            <div
              onClick={() => setIsProviderOpen(!isProviderOpen)}
              className="flex items-center justify-between font-[600] border border-gray-300 bg-white px-3 py-1.5 h-9 rounded-lg cursor-pointer hover:border-[#0CBB7D] transition-all group"
            >
              <span className={`text-[10px] sm:text-[12px] truncate ${formData.courierProviderName ? "text-gray-700" : "text-gray-400"}`}>
                {formData.courierProviderName || "Select Provider"}
              </span>
              <FiChevronDown className={`text-gray-400 group-hover:text-[#0CBB7D] transition-transform flex-shrink-0 ${isProviderOpen ? "rotate-180" : ""}`} />
            </div>
            {isProviderOpen && (
              <div className="absolute font-[600] top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-sm z-[100] animate-in fade-in slide-in-from-top-2 max-h-48 overflow-y-auto">
                {couriers &&
                  couriers.length > 0 &&
                  [...new Set(couriers.map((courier) => courier.provider))].map((provider, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        const selectedProvider = provider;
                        setFormData({ ...formData, courierProviderName: selectedProvider });
                        const filteredArray = couriers.filter((item) => item.provider === selectedProvider);
                        const serviceNames = filteredArray.length > 0 ? filteredArray.map((item) => item.name) : [];
                        setServices(serviceNames);
                        setIsProviderOpen(false);
                      }}
                      className="px-3 py-2 text-[10px] sm:text-[12px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                    >
                      {provider}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full">
          {/* Service Dropdown */}
          <div className="relative flex-1 sm:max-w-[220px]">
            <div
              onClick={() => setIsServiceOpen(!isServiceOpen)}
              className="flex items-center justify-between font-[600] border border-gray-300 bg-white px-3 py-1.5 h-9 rounded-lg cursor-pointer hover:border-[#0CBB7D] transition-all group"
            >
              <span className={`text-[10px] sm:text-[12px] truncate ${formData.courierServiceName ? "text-gray-700" : "text-gray-400"}`}>
                {formData.courierServiceName || "Select Courier Service"}
              </span>
              <FiChevronDown className={`text-gray-400 group-hover:text-[#0CBB7D] transition-transform flex-shrink-0 ${isServiceOpen ? "rotate-180" : ""}`} />
            </div>
            {isServiceOpen && (
              <div className="absolute font-[600] top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-sm z-[100] animate-in fade-in slide-in-from-top-2 max-h-48 overflow-y-auto">
                {services.length > 0 ? (
                  services.map((service, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        const selectedServiceName = service;
                        setFormData({ ...formData, courierServiceName: selectedServiceName });
                        const selectedObject = couriers.find((item) => item.name === selectedServiceName);
                        setSelectedService(selectedObject || null);
                        setIsServiceOpen(false);
                      }}
                      className="px-3 py-2 text-[10px] sm:text-[12px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                    >
                      {service}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-[10px] sm:text-[12px] text-gray-400">No services available</div>
                )}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative min-w-[100px] flex-1 sm:max-w-[120px]">
            <div
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="flex items-center justify-between font-[600] border border-gray-300 bg-white px-3 py-1.5 h-9 rounded-lg cursor-pointer hover:border-[#0CBB7D] transition-all group"
            >
              <span className="text-[10px] sm:text-[12px] text-gray-700">{formData.status}</span>
              <FiChevronDown className={`text-gray-400 group-hover:text-[#0CBB7D] transition-transform flex-shrink-0 ${isStatusOpen ? "rotate-180" : ""}`} />
            </div>
            {isStatusOpen && (
              <div className="absolute font-[600] top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-sm z-[100] animate-in fade-in slide-in-from-top-2">
                {["Active", "Inactive"].map((status) => (
                  <div
                    key={status}
                    onClick={() => {
                      setFormData({ ...formData, status });
                      setIsStatusOpen(false);
                    }}
                    className="px-3 py-2 text-[10px] sm:text-[12px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                  >
                    {status}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shipment Type Dropdown */}
          <div className="relative min-w-[100px] flex-1 sm:max-w-[120px]">
            <div
              onClick={() => setIsShipmentTypeOpen(!isShipmentTypeOpen)}
              className="flex items-center justify-between font-[600] border border-gray-300 bg-white px-3 py-1.5 h-9 rounded-lg cursor-pointer hover:border-[#0CBB7D] transition-all group"
            >
              <span className="text-[10px] sm:text-[12px] text-gray-700">{formData.shipmentType}</span>
              <FiChevronDown className={`text-gray-400 group-hover:text-[#0CBB7D] transition-transform flex-shrink-0 ${isShipmentTypeOpen ? "rotate-180" : ""}`} />
            </div>
            {isShipmentTypeOpen && (
              <div className="absolute font-[600] top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-sm z-[100] animate-in fade-in slide-in-from-top-2">
                {["Forward", "Reverse"].map((type) => (
                  <div
                    key={type}
                    onClick={() => {
                      setFormData({ ...formData, shipmentType: type });
                      setIsShipmentTypeOpen(false);
                    }}
                    className="px-3 py-2 text-[10px] sm:text-[12px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weight Type Basic */}
      <h3 className="font-[600] mt-2 text-gray-500 text-[12px] sm:text-[14px]">
        Weight Type <span className="text-red-500">Basic *</span> (in gram)
      </h3>
      <div className="grid grid-cols-3 sm:flex gap-2 mt-2">
        {["weight", "zoneA", "zoneB", "zoneC", "zoneD", "zoneE"].map((field) => (
          <input
            key={field}
            name={field}
            value={formData.weightPriceBasic[field] || ""}
            onChange={(e) => handleWeightChange("weightPriceBasic", e)}
            className="border border-gray-300 h-9 font-[600] text-gray-700 px-3 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all"
            placeholder={
              field === "weight" ? "Weight (gm) *" : `Zone ${field.slice(-1)} * ₹`
            }
          />
        ))}
      </div>

      {/* Weight Type Additional */}
      <h3 className="font-[600] mt-2 text-gray-500 text-[12px] sm:text-[14px]">
        Weight Type <span className="text-red-500">Additional *</span> (in gram)
      </h3>
      <div className="grid grid-cols-3 sm:flex gap-2 mt-2">
        {["weight", "zoneA", "zoneB", "zoneC", "zoneD", "zoneE"].map((field) => (
          <input
            key={field}
            name={field}
            value={formData.weightPriceAdditional[field] || ""}
            onChange={(e) => handleWeightChange("weightPriceAdditional", e)}
            className="border border-gray-300 h-9 font-[600] text-gray-700 px-3 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all"
            placeholder={
              field === "weight" ? "Weight (gm) *" : `Zone ${field.slice(-1)} * ₹`
            }
          />
        ))}
      </div>

      {/* Overhead Charges */}
      <h3 className="font-[600] text-[12px] sm:text-[14px] text-gray-500 mt-2">
        Over Head Charges:
      </h3>
      <div className="flex gap-2">
        <input
          value={formData.codCharge}
          name="codCharge"
          type="text"
          placeholder="COD charges"
          className="border border-gray-300 h-9 font-[600] text-gray-700 mt-2 px-3 rounded-lg text-[10px] sm:text-[12px] w-full sm:w-auto focus:border-[#0CBB7D] focus:outline-none transition-all"
          onChange={handleChange}
        />
        <input
          value={formData.codPercent}
          name="codPercent"
          type="text"
          placeholder="COD Percentage"
          className="border border-gray-300 h-9 font-[600] text-gray-700 mt-2 px-3 rounded-lg text-[10px] sm:text-[12px] w-full sm:w-auto focus:border-[#0CBB7D] focus:outline-none transition-all"
          onChange={handleChange}
        />
      </div>

      {/* Submit Button */}
      <div className="mt-4 flex justify-center gap-2 border-t border-gray-100 pt-6">
        <button
          className="bg-white border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-bold hover:bg-gray-50 transition-all active:scale-95"
          onClick={() => navigate(-1)}
        >
          Cancel
        </button>
        <button
          className="bg-[#0CBB7D] text-white hover:bg-opacity-90 px-3 py-2 rounded-lg text-[10px] sm:text-[12px] font-bold transition-all"
          onClick={handleSubmit}
        >
          Update Rate Card
        </button>
      </div>
    </div>


  );
};

export default RateCardUpdateForm;
