import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Save, Info, Settings, Search } from "lucide-react";
import { FiChevronDown, FiAlertCircle } from "react-icons/fi";
import { Notification } from "../../Notification";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function UserServiceManagement({ 
  userId, 
  section, 
  selectedService: propSelectedService, 
  onServiceSelect,
  editedRates: propEditedRates,
  onRateEdit 
}) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Use local state if no external state is provided
  const [localSelectedService, setLocalSelectedService] = useState(null);
  const [localEditedRates, setLocalEditedRates] = useState({});

  const selectedService = onServiceSelect ? propSelectedService : localSelectedService;
  const setSelectedService = onServiceSelect ? onServiceSelect : setLocalSelectedService;

  const editedRates = onRateEdit ? propEditedRates : localEditedRates;
  const setEditedRates = onRateEdit ? onRateEdit : setLocalEditedRates;

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/users/getUserServices`, {
        params: { userId },
        headers: { Authorization: `Bearer ${Cookies.get("session")}` }
      });
      if (response.data.success) {
        setServices(response.data.services);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchServices();
  }, [userId]);

  const providers = [...new Set(services.map(s => s.courierProviderName))];

  const handleProviderToggle = async (provider, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const response = await axios.post(`${REACT_APP_BACKEND_URL}/users/toggleProviderStatus`, {
        userId,
        provider,
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${Cookies.get("session")}` }
      });

      if (response.data.success) {
        Notification(response.data.message, "success");
        fetchServices();
      }
    } catch (error) {
      Notification("Error toggling provider", "error");
    }
  };

  const handleServiceToggle = async (serviceName, currentStatus) => {
    try {
      const newStatus = currentStatus !== "Active";
      const response = await axios.post(`${REACT_APP_BACKEND_URL}/users/toggleServiceStatus`, {
        userId,
        courierServiceName: serviceName,
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${Cookies.get("session")}` }
      });

      if (response.data.success) {
        Notification(response.data.message, "success");
        fetchServices();
        if (selectedService && selectedService.courierServiceName === serviceName) {
          setSelectedService(prev => ({ ...prev, status: newStatus ? "Active" : "Inactive" }));
        }
      }
    } catch (error) {
      Notification("Error toggling service", "error");
    }
  };

  const handleRateChange = (serviceName, type, index, zone, value) => {
    setEditedRates(prev => {
      const serviceRates = { ...(prev[serviceName] || services.find(s => s.courierServiceName === serviceName)) };
      const updatedSlabs = [...serviceRates[type]];
      updatedSlabs[index] = { ...updatedSlabs[index], [zone]: Number(value) };
      return { ...prev, [serviceName]: { ...serviceRates, [type]: updatedSlabs } };
    });
  };

  const handleCodChange = (serviceName, field, value) => {
    setEditedRates(prev => {
      const serviceRates = { ...(prev[serviceName] || services.find(s => s.courierServiceName === serviceName)) };
      return { ...prev, [serviceName]: { ...serviceRates, [field]: Number(value) } };
    });
  };

  const handleSaveRate = async (serviceName) => {
    try {
      const data = editedRates[serviceName];
      const response = await axios.post(`${REACT_APP_BACKEND_URL}/users/updateServiceRate`, {
        userId,
        courierServiceName: serviceName,
        weightPriceBasic: data.weightPriceBasic,
        weightPriceAdditional: data.weightPriceAdditional,
        codCharge: data.codCharge,
        codPercent: data.codPercent
      }, {
        headers: { Authorization: `Bearer ${Cookies.get("session")}` }
      });

      if (response.data.success) {
        Notification("Rate updated successfully", "success");
        setEditedRates(prev => {
          const newState = { ...prev };
          delete newState[serviceName];
          return newState;
        });
        fetchServices();
      }
    } catch (error) {
      Notification("Error saving rate", "error");
    }
  };

  if (loading) return null; // Return null while loading to avoid layout shifts in split mode

  const currentData = selectedService ? (editedRates[selectedService.courierServiceName] || services.find(s => s.courierServiceName === selectedService.courierServiceName)) : null;

  const renderLeftSection = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-4 py-2.5 sm:py-2.5 bg-gray-50 border-b border-gray-200">
        <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
          <Settings size={16} className="text-gray-600" />
          Service Performance & Rate
        </h3>
      </div>

      <div className="p-4 space-y-2">
        <div className="relative">
          <p className="text-[10px] sm:text-[12px] font-[600] text-gray-500 mb-1.5">Select Service</p>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between font-[600] border border-gray-300 bg-white px-3 py-1.5 h-10 rounded-lg cursor-pointer hover:border-[#0CBB7D] transition-all group"
          >
            <div className="flex items-center gap-2 truncate">
              <span className={`text-[10px] sm:text-[12px] truncate ${selectedService ? "text-gray-700" : "text-gray-400"}`}>
                {selectedService ? selectedService.courierServiceName : "Select a Courier Service"}
              </span>
              {selectedService?.isCustomRate && (
                <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-[1px] rounded-lg font-[600] shrink-0">custom</span>
              )}
            </div>
            <FiChevronDown className={`text-gray-400 group-hover:text-[#0CBB7D] transition-transform flex-shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </div>

          {isDropdownOpen && (
            <div className="absolute font-[600] top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] animate-in fade-in slide-in-from-top-2 max-h-44 overflow-y-auto">
              {services.map((service, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedService(service);
                    setIsDropdownOpen(false);
                  }}
                  className={`px-4 py-2.5 text-[12px] sm:text-[13px] border-b border-gray-50 last:border-0 hover:bg-[#0CBB7D]/5 hover:text-[#0CBB7D] cursor-pointer transition-colors flex items-center justify-between ${selectedService?.courierServiceName === service.courierServiceName ? 'bg-[#0CBB7D]/10 text-[#0CBB7D]' : 'text-gray-700'}`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <span>{service.courierServiceName}</span>
                       {service.isCustomRate && (
                         <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-[1px] rounded-lg font-[600]">custom</span>
                       )}
                    </div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">{service.courierProviderName} • {service.mode || 'N/A'}</span>
                  </div>
                  {service.status === "Active" ? (
                    <div className="w-2 h-2 rounded-full bg-[#0CBB7D]"></div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedService && currentData && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-300 space-y-5 pt-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex flex-col">
                <span className="text-[11px] sm:text-[12px] font-bold text-gray-700">Service Status</span>
                <span className="text-[9px] text-gray-500 font-semibold uppercase">{selectedService.mode || 'N/A'} Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold ${selectedService.status === 'Active' ? 'text-[#0CBB7D]' : 'text-gray-400'}`}>
                  {selectedService.status === 'Active' ? 'ENABLED' : 'DISABLED'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={selectedService.status === "Active"}
                    onChange={() => handleServiceToggle(selectedService.courierServiceName, selectedService.status)}
                  />
                  <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-[#0CBB7D] transition-all"></div>
                  <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4"></div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <h3 className="font-[600] text-gray-500 text-[10px] sm:text-[12px]">
                  Weight Type <span className="text-red-500">Basic *</span> (in gram)
                </h3>
                <div className="grid grid-cols-3 sm:flex gap-2 mt-2">
                  <div className="flex flex-col flex-1">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">Weight</p>
                    <input
                      type="text"
                      placeholder="Weight (gm) *"
                      className="border border-gray-300 h-9 text-gray-700 font-[600] px-3 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all"
                      value={currentData.weightPriceBasic[0]?.weight}
                      readOnly
                    />
                  </div>
                  {["A", "B", "C", "D", "E"].map((zone) => (
                    <div key={zone} className="flex flex-col flex-1">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">Zone {zone}</p>
                      <input
                        type="text"
                        placeholder={`Zone ${zone} * ₹`}
                        className="border border-gray-300 text-gray-700 font-[600] px-3 h-9 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all"
                        value={currentData.weightPriceBasic[0][`zone${zone}`]}
                        onChange={(e) => handleRateChange(selectedService.courierServiceName, 'weightPriceBasic', 0, `zone${zone}`, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-[600] text-gray-500 text-[10px] sm:text-[12px] mt-2">
                  Weight Type <span className="text-red-500">Additional *</span> (in gram)
                </h3>
                <div className="grid grid-cols-3 sm:flex gap-2 mt-2">
                  <div className="flex flex-col flex-1">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">Weight</p>
                    <input
                      type="text"
                      placeholder="Weight (gm) *"
                      className="border border-gray-300 h-9 text-gray-700 font-[600] px-3 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all"
                      value={currentData.weightPriceAdditional[0]?.weight}
                      readOnly
                    />
                  </div>
                  {["A", "B", "C", "D", "E"].map((zone) => (
                    <div key={zone} className="flex flex-col flex-1">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">Zone {zone}</p>
                      <input
                        type="text"
                        placeholder={`Zone ${zone} * ₹`}
                        className="border border-gray-300 text-gray-700 font-[600] px-3 h-9 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-blue-400 focus:outline-none transition-all"
                        value={currentData.weightPriceAdditional[0][`zone${zone}`]}
                        onChange={(e) => handleRateChange(selectedService.courierServiceName, 'weightPriceAdditional', 0, `zone${zone}`, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1 w-full flex flex-col">
                  <h3 className="font-[600] text-[10px] sm:text-[12px] text-gray-500">
                    Over Head Charges:
                  </h3>
                  <div className="flex gap-2 mt-2">
                    <div className="flex flex-col flex-1">
                      <p className="text-[10px] sm:text-[12px] font-bold text-gray-400 mb-1">COD charges</p>
                      <input
                        type="number"
                        placeholder="COD charges"
                        className="border border-gray-300 h-9 text-gray-700 font-[600] px-3 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all"
                        value={currentData.codCharge}
                        onChange={(e) => handleCodChange(selectedService.courierServiceName, 'codCharge', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <p className="text-[10px] sm:text-[12px] font-bold text-gray-400 mb-1">COD %</p>
                      <input
                        type="number"
                        placeholder="COD Percentage"
                        className="border border-gray-300 h-9 text-gray-700 font-[600] px-3 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all"
                        value={currentData.codPercent}
                        onChange={(e) => handleCodChange(selectedService.courierServiceName, 'codPercent', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  className={`h-9 px-6 rounded-lg text-white font-[600] text-[10px] sm:text-[12px] flex items-center justify-center gap-2 transition-all shadow-sm w-full sm:w-auto ${editedRates[selectedService.courierServiceName] ? 'bg-[#0CBB7D] hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`}
                  disabled={!editedRates[selectedService.courierServiceName]}
                  onClick={() => handleSaveRate(selectedService.courierServiceName)}
                >
                  <Save size={16} />
                  Save Rate Card
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedService && (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
            <Search size={32} className="text-gray-200 mb-2" />
            <p className="text-[12px] text-gray-400 font-medium">Select a service to manage its rates</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderRightSection = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700 flex items-center gap-2">
          <Info size={16} className="text-gray-600" />
          Provider Control
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {providers.map(provider => {
          const providerServices = services.filter(s => s.courierProviderName === provider);
          const isAllEnabled = providerServices.every(s => s.status === "Active");
          const isSomeEnabled = providerServices.some(s => s.status === "Active");

          return (
            <div key={provider} className="flex items-center justify-between pb-2 border-b border-gray-50 last:border-0 last:pb-0">
              <div className="flex flex-col">
                <span className="text-[11px] sm:text-[12px] font-[600] text-gray-700">{provider}</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase">{providerServices.length} Total Services</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isAllEnabled}
                  onChange={() => handleProviderToggle(provider, isAllEnabled)}
                />
                <div className={`w-9 h-5 rounded-full transition-colors ${isAllEnabled ? 'bg-[#0CBB7D]' : isSomeEnabled ? 'bg-yellow-400' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${isAllEnabled || isSomeEnabled ? 'translate-x-4' : ''} shadow-sm`}></div>
              </label>
            </div>
          );
        })}
      </div>

      <div className="mx-4 mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
        <p className="text-[10px] sm:text-[11px] text-yellow-800 font-bold leading-tight flex items-center gap-2">
          <FiAlertCircle size={14} className="shrink-0 text-yellow-600" />
          DTDC IS DISABLED BY DEFAULT FOR ALL NEW USERS.
        </p>
      </div>
    </div>
  );

  if (section === 'left') return renderLeftSection();
  if (section === 'right') return renderRightSection();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start pb-10">
      <div className="lg:col-span-8 space-y-2">
        {renderLeftSection()}
      </div>
      <div className="lg:col-span-4 space-y-2 sticky top-2">
        {renderRightSection()}
      </div>
    </div>
  );
}
