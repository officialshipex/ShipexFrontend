import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
// import { toast } from "react-toastify";
import {Notification} from "../../Notification"
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
          Notification(response.data.message,"success")
          navigate("/dashboard/ratecard")

        } else {
          Notification("Something went wrong. Please try again.","error")

        }
      } catch (error) {
        console.error("Error saving data:", error);
        Notification("An error occurred while saving the data.","error")

      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto sm:p-6 p-1 sm:bg-white sm:shadow-lg sm:rounded-xl">
      <h2 className="text-[12px] sm:text-[18px] font-[600] border-b pb-2 mb-2 text-gray-700">
        Rate Cards | Form
      </h2>

      {/* Form Header Selects */}
      <div className="flex gap-2 sm:flex-row flex-col">
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            name="plan"
            className="px-3 rounded-lg h-9 border-2 text-[10px] text-gray-500 focus:outline-none sm:text-[12px] w-full sm:w-auto"
            value={formData.plan}
            onChange={(e) => {
              setFormData({ ...formData, plan: e.target.value });
              setErrors({ ...errors, plan: "" });
            }}
          >
            <option value="">Select Plans</option>
            {plans.map((plan, idx) => (
              <option key={idx} value={plan}>
                {plan}
              </option>
            ))}
          </select>
          {errors.plan && (
            <div className="text-red-500 text-[8px] sm:text-[10px]">{errors.plan}</div>
          )}

          <select
            name="courierProviderName"
            className="px-3 rounded-lg h-9 border-2 text-[10px] text-gray-500 focus:outline-none sm:text-[12px] w-full sm:w-auto"
            onChange={handleCourierSelect}
          >
            <option>Select Provider</option>
            {couriers &&
              couriers.length > 0 &&
              [...new Set(couriers.map((courier) => courier.provider))].map(
                (provider, index) => (
                  <option key={index} value={provider}>
                    {provider}
                  </option>
                )
              )}
          </select>
          {errors.courierProviderName && (
            <div className="text-red-500 text-[8px] sm:text-[10px]">
              {errors.courierProviderName}
            </div>
          )}
        </div>

        <div className="flex gap-2 w-full">
          <select
            name="courierServiceName"
            className="px-3 rounded-lg h-9 border-2 text-[10px] text-gray-500 focus:outline-none sm:text-[12px] w-full sm:w-auto"
            onChange={handleServiceSelect}
          >
            <option>Select Courier Service</option>
            {services.length > 0 ? (
              services.map((service, index) => (
                <option key={index} value={service}>
                  {service}
                </option>
              ))
            ) : (
              <option>No services available</option>
            )}
          </select>
          {errors.courierServiceName && (
            <div className="text-red-500 text-[8px] sm:text-[10px]">
              {errors.courierServiceName}
            </div>
          )}

          <select
            name="status"
            className="px-3 rounded-lg h-9 border-2 text-[10px] text-gray-500 focus:outline-none sm:text-[12px] w-full sm:w-auto"
            onChange={handleChange}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {errors.status && (
            <div className="text-red-500 text-[8px] sm:text-[10px]">{errors.status}</div>
          )}

          <select
            name="shipmentType"
            className="px-3 rounded-lg h-9 border-2 text-[10px] text-gray-500 focus:outline-none sm:text-[12px] w-full sm:w-auto"
            onChange={handleChange}
          >
            <option value="Forward">Forward</option>
            <option value="Reverse">Reverse</option>
          </select>
          {errors.shipmentType && (
            <div className="text-red-500 text-[8px] sm:text-[10px]">{errors.shipmentType}</div>
          )}
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
            className="border-2 border-gray-300 h-9 text-gray-500 px-3 rounded-lg text-[10px] sm:text-[12px] w-full"
            onChange={(e) =>
              handleWeightChange(index, "weightPriceBasic", "weight", e.target.value)
            }
          />
          {["A", "B", "C", "D", "E"].map((zone) => (
            <input
              key={zone}
              type="text"
              placeholder={`Zone ${zone} * ₹`}
              className="border-2 border-gray-300 text-gray-500 px-3 h-9 rounded-lg text-[10px] sm:text-[12px] w-full"
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
            className="border-2 border-gray-300 h-9 text-gray-500 px-3 rounded-lg text-[10px] sm:text-[12px] w-full"
            onChange={(e) =>
              handleWeightChange(index, "weightPriceAdditional", "weight", e.target.value)
            }
          />
          {["A", "B", "C", "D", "E"].map((zone) => (
            <input
              key={zone}
              type="text"
              placeholder={`Zone ${zone} * ₹`}
              className="border-2 border-gray-300 text-gray-500 px-3 h-9 rounded-lg text-[10px] sm:text-[12px] w-full"
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
          className="border-2 h-9 border-gray-300 text-gray-500 mt-2 px-3 rounded-lg text-[10px] sm:text-[12px] w-full sm:w-auto"
          onChange={handleChange}
        />
        <input
          value={formData.codPercent}
          name="codPercent"
          type="text"
          placeholder="COD Percentage"
          className="border-2 h-9 border-gray-300 text-gray-500 mt-2 px-3 rounded-lg text-[10px] sm:text-[12px] w-full sm:w-auto"
          onChange={handleChange}
        />
      </div>
      {errors.codError && (
        <div className="text-red-500 text-[8px] sm:text-[10px]">{errors.codError}</div>
      )}

      {/* Submit Button */}
      <div className="mt-4 text-center">
        <button
          className="bg-[#0CBB7D] text-white px-3 py-2 rounded-lg text-[10px] sm:text-[12px]"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>

  );
}
