import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
import {Notification} from "../../Notification"
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
        Notification("Rate Card updated successfully!","success");
        navigate("/dashboard/rateCard");
      })
      .catch((error) => console.error("Error updating rate card:", error));
  };

  if (loading)
    return <p className="text-center text-lg font-semibold">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500">Error loading rate card.</p>;

  return (
    <div className="max-w-5xl mx-auto sm:p-6 p-1 sm:bg-white sm:shadow-lg sm:rounded-xl">
      <h2 className="text-[12px] sm:text-[18px] font-[600] border-b pb-2 mb-2 text-gray-700">
        Rate Cards | Form
      </h2>

      {/* Plan, Provider, Service */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            name="plan"
            className="px-3 rounded-lg h-9 border-2 text-[10px] text-gray-500 focus:outline-none sm:text-[12px] w-full sm:w-auto"
            onChange={handleChange}
            value={formData.plan}
          >
            <option value="">Select Plans</option>
            {plans.map((planName, index) => (
              <option key={index} value={planName.toLowerCase()}>
                {planName}
              </option>
            ))}
          </select>

          <select
            name="courierProviderName"
            className="px-3 rounded-lg h-9 border-2 text-[10px] text-gray-500 focus:outline-none sm:text-[12px] w-full sm:w-auto"
            onChange={handleCourierSelect}
          >
            <option>Select Provider</option>
            {[...new Set(couriers.map((courier) => courier.provider))].map((provider, index) => (
              <option key={index} value={provider}>
                {provider}
              </option>
            ))}
          </select>
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

          <select
            name="status"
            className="px-3 rounded-lg h-9 border-2 text-[10px] text-gray-500 focus:outline-none sm:text-[12px] w-full sm:w-auto"
            onChange={handleChange}
            value={formData.status}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            name="shipmentType"
            className="px-3 rounded-lg h-9 border-2 text-[10px] text-gray-500 focus:outline-none sm:text-[12px] w-full sm:w-auto"
            onChange={handleChange}
            value={formData.shipmentType}
          >
            <option value="Forward">Forward</option>
            <option value="Reverse">Reverse</option>
          </select>
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
            className="border-2 border-gray-300 h-9 text-gray-500 px-3 rounded-lg text-[10px] sm:text-[12px] w-full"
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
            className="border-2 border-gray-300 h-9 text-gray-500 px-3 rounded-lg text-[10px] sm:text-[12px] w-full"
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

      {/* Submit Button */}
      <div className="mt-4 text-center">
        <button
          className="bg-[#0CBB7D] text-white px-3 py-2 rounded-lg text-[10px] sm:text-[12px]"
          onClick={handleSubmit}
        >
          Save
        </button>
      </div>
    </div>


  );
};

export default RateCardUpdateForm;
