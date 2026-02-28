import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Notification } from "../../Notification";
import { FiArrowLeft, FiChevronDown } from "react-icons/fi";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function RateCardForm() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const courierType = queryParams.get("courierType"); // Extracting mode from URL
  const navigate = useNavigate()


  const [couriers, setCouriers] = useState([]);
  const [services, setServices] = useState([]);
  const [providerNames, setProviderNames] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    plan: "",
    courierProviderName: "",
    courierServiceName: "",
    mode: "", // Assign courierType to mode
    status: "Active",
    shipmentType: "Forward",
    weightPriceBasic: [
      { weight: "", zoneA: "", zoneB: "", zoneC: "", zoneD: "", zoneE: "" },
    ],
    weightPriceAdditional: [
      { weight: "", zoneA: "", zoneB: "", zoneC: "", zoneD: "", zoneE: "" },
    ],
    codPercent: "",
    codCharge: "",
  });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${REACT_APP_BACKEND_URL}/saveRate/getPlanNames`);
        setPlans(response.data.planNames || []);  // Assuming your controller sends { planNames: [] }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      }
    };
    fetchPlans();
  }, []);

  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isShipmentTypeOpen, setIsShipmentTypeOpen] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/courierServices/couriers`
        );
        setCouriers(response.data);
        console.log(response.data);
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
    setErrors({ ...errors, [e.target.name]: "" }); // Clear error on field change
  };

  const handleWeightChange = (index, type, field, value) => {
    const updatedWeights = [...formData[type]];
    updatedWeights[index][field] = value;
    setFormData({ ...formData, [type]: updatedWeights });
    setErrors({ ...errors, [type]: "" }); // Clear error on weight change
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
    console.log(selectedService);
  };


  const handleSave = async (e) => {
    e.preventDefault();

    // Validate form data
    const newErrors = {};

    if (!formData.plan) {
      newErrors.plan = "Plan is required";
    }
    if (!formData.courierProviderName) {
      newErrors.courierProviderName = "Courier Provider is required";
    }
    if (!formData.courierServiceName) {
      newErrors.courierServiceName = "Courier Service is required";
    }
    if (!formData.status) {
      newErrors.status = "Status is required";
    }
    if (!formData.shipmentType) {
      newErrors.shipmentType = "Shipment Type is required";
    }

    formData.weightPriceBasic.forEach((item, index) => {
      if (!item.weight) {
        newErrors[`weightPriceBasicWeight-${index}`] = "Weight is required";
      }
      ["A", "B", "C", "D", "E"].forEach((zone) => {
        if (!item[`zone${zone}`]) {
          newErrors[
            `weightPriceBasicZone${zone}-${index}`
          ] = `Zone ${zone} is required`;
        }
      });
    });

    formData.weightPriceAdditional.forEach((item, index) => {
      if (!item.weight) {
        newErrors[`weightPriceAdditionalWeight-${index}`] =
          "Weight is required";
      }
      ["A", "B", "C", "D", "E"].forEach((zone) => {
        if (!item[`zone${zone}`]) {
          newErrors[
            `weightPriceAdditionalZone${zone}-${index}`
          ] = `Zone ${zone} is required`;
        }
      });
    });

    if (!formData.codPercent && !formData.codCharge) {
      newErrors.codError =
        "At least one of COD Percentage or COD Charge is required";
    }

    setErrors(newErrors);

    // If no errors, submit the form
    if (Object.keys(newErrors).length === 0) {
      try {
        console.log(formData);
        const response = await axios.post(
          `${REACT_APP_BACKEND_URL}/saveRate/saveB2CRate`,
          formData,
          {
            headers: { "Content-Type": "application/json" },
          }
        );


        if (response.status === 201) {
          Notification(response.data.message, "success")
          navigate("/dashboard/ratecard")

        } else {
          Notification("Something went wrong. Please try again.", "error")

        }
      } catch (error) {
        console.error("Error saving data:", error);
        Notification("An error occurred while saving the data.", "error")

      }
    }
  };

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
          Rate Cards <span className="text-gray-400 font-medium mx-1">|</span> <span className="text-[#0CBB7D]">Form</span>
        </h2>
      </div>

      {/* Form Header Selects */}
      <div className="flex flex-col sm:flex-row gap-2">
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
                      setErrors({ ...errors, plan: "" });
                      setIsPlanOpen(false);
                    }}
                    className="px-3 py-2 text-[10px] sm:text-[12px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                  >
                    {plan}
                  </div>
                ))}
              </div>
            )}
            {errors.plan && (
              <div className="text-red-500 text-[8px] sm:text-[10px] mt-1">{errors.plan}</div>
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
            {errors.courierProviderName && (
              <div className="text-red-500 text-[8px] sm:text-[10px] mt-1">{errors.courierProviderName}</div>
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
            {errors.courierServiceName && (
              <div className="text-red-500 text-[8px] sm:text-[10px] mt-1">{errors.courierServiceName}</div>
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
                      setErrors({ ...errors, status: "" });
                      setIsStatusOpen(false);
                    }}
                    className="px-3 py-2 text-[10px] sm:text-[12px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                  >
                    {status}
                  </div>
                ))}
              </div>
            )}
            {errors.status && (
              <div className="text-red-500 text-[8px] sm:text-[10px] mt-1">{errors.status}</div>
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
                      setErrors({ ...errors, shipmentType: "" });
                      setIsShipmentTypeOpen(false);
                    }}
                    className="px-3 py-2 text-[10px] sm:text-[12px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
            {errors.shipmentType && (
              <div className="text-red-500 text-[8px] sm:text-[10px] mt-1">{errors.shipmentType}</div>
            )}
          </div>
        </div>
      </div>

      {/* Weight Price Basic */}
      <h3 className="font-[600] mt-2 text-gray-500 text-[12px] sm:text-[14px]">
        Weight Type <span className="text-red-500">Basic *</span> (in gram)
      </h3>

      {formData.weightPriceBasic.map((item, index) => (
        <div key={index} className="grid grid-cols-3 sm:flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Weight (gm) *"
            className="border border-gray-300 h-9 text-gray-700 font-[600] px-3 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all"
            onChange={(e) =>
              handleWeightChange(index, "weightPriceBasic", "weight", e.target.value)
            }
          />
          {["A", "B", "C", "D", "E"].map((zone) => (
            <input
              key={zone}
              type="text"
              placeholder={`Zone ${zone} * ₹`}
              className="border border-gray-300 text-gray-700 font-[600] px-3 h-9 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all"
              onChange={(e) =>
                handleWeightChange(index, "weightPriceBasic", `zone${zone}`, e.target.value)
              }
            />
          ))}
        </div>
      ))}

      {/* Weight Price Additional */}
      <h3 className="font-[600] text-gray-500 text-[12px] sm:text-[14px] mt-2">
        Weight Type <span className="text-red-500">Additional *</span> (in gram)
      </h3>

      {formData.weightPriceAdditional.map((item, index) => (
        <div key={index} className="grid grid-cols-3 sm:flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Weight (gm) *"
            className="border border-gray-300 h-9 text-gray-700 font-[600] px-3 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all"
            onChange={(e) =>
              handleWeightChange(index, "weightPriceAdditional", "weight", e.target.value)
            }
          />
          {["A", "B", "C", "D", "E"].map((zone) => (
            <input
              key={zone}
              type="text"
              placeholder={`Zone ${zone} * ₹`}
              className="border border-gray-300 text-gray-700 font-[600] px-3 h-9 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all"
              onChange={(e) =>
                handleWeightChange(index, "weightPriceAdditional", `zone${zone}`, e.target.value)
              }
            />
          ))}
        </div>
      ))}

      {/* COD Charges */}
      <h3 className="font-[600] text-[12px] sm:text-[14px] text-gray-500 mt-2">
        Over Head Charges:
      </h3>
      <div className="flex gap-2">
        <input
          value={formData.codCharge}
          name="codCharge"
          type="text"
          placeholder="COD charges"
          className="border border-gray-300 h-9 text-gray-700 font-[600] mt-2 px-3 rounded-lg text-[10px] sm:text-[12px] w-full sm:w-auto focus:border-[#0CBB7D] focus:outline-none transition-all"
          onChange={handleChange}
        />
        <input
          value={formData.codPercent}
          name="codPercent"
          type="text"
          placeholder="COD Percentage"
          className="border border-gray-300 h-9 text-gray-700 font-[600] mt-2 px-3 rounded-lg text-[10px] sm:text-[12px] w-full sm:w-auto focus:border-[#0CBB7D] focus:outline-none transition-all"
          onChange={handleChange}
        />
      </div>
      {errors.codError && (
        <div className="text-red-500 text-[8px] sm:text-[10px]">{errors.codError}</div>
      )}

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
          onClick={handleSave}
        >
          Save Rate Card
        </button>
      </div>
    </div>

  );
}
