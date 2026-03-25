import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Notification } from '../../../Notification';
import { Clock, Check } from 'lucide-react';

const AddEPD = ({ show, onClose, existingData = [] }) => {
  const [form, setForm] = useState({
    couriers: [],
    serviceNames: [],
    cutoffTime: '10:00'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [couriers, setCouriers] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);

  const [openCourierDropdown, setOpenCourierDropdown] = useState(false);
  const [openServiceDropdown, setOpenServiceDropdown] = useState(false);

  const courierRef = useRef(null);
  const serviceRef = useRef(null);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchCourier = async () => {
      try {
        const response = await axios.get(`${REACT_APP_BACKEND_URL}/EDD/getAllCourier`);
        setCouriers(response.data || []);
      } catch {
        setCouriers([]);
      }
    };

    const fetchCourierService = async () => {
      try {
        const response = await axios.get(`${REACT_APP_BACKEND_URL}/EDD/getAllCourierService`);
        setAllServices(response.data || []);
      } catch {
        setAllServices([]);
      }
    };

    fetchCourier();
    fetchCourierService();
  }, []);

  useEffect(() => {
    if (form.couriers.length > 0) {
      // Filter by selected provider AND exclude already-mapped pairs
      const filtered = allServices.filter(service => {
        const isSelectedProvider = form.couriers.includes(service.provider);
        const isAlreadyAdded = existingData.some(
          ed => ed.courier === service.provider && ed.serviceName === service.name
        );
        return isSelectedProvider && !isAlreadyAdded;
      });
      setFilteredServices(filtered);
      
      // Remove service names that are no longer in the filtered list
      const validNames = [...new Set(filtered.map(s => s.name))];
      setForm(prev => ({
        ...prev,
        serviceNames: prev.serviceNames.filter(name => validNames.includes(name))
      }));
    } else {
      setFilteredServices([]);
      setForm(prev => ({ ...prev, serviceNames: [] }));
    }
  }, [form.couriers, allServices]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (courierRef.current && !courierRef.current.contains(event.target)) {
        setOpenCourierDropdown(false);
      }
      if (serviceRef.current && !serviceRef.current.contains(event.target)) {
        setOpenServiceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCourierToggle = (courierName) => {
    setForm(prev => {
      const isSelected = prev.couriers.includes(courierName);
      if (isSelected) {
        return { ...prev, couriers: prev.couriers.filter(c => c !== courierName) };
      } else {
        return { ...prev, couriers: [...prev.couriers, courierName] };
      }
    });
  };

  const handleServiceToggle = (serviceName) => {
    setForm(prev => {
      const isSelected = prev.serviceNames.includes(serviceName);
      if (isSelected) {
        return { ...prev, serviceNames: prev.serviceNames.filter(s => s !== serviceName) };
      } else {
        return { ...prev, serviceNames: [...prev.serviceNames, serviceName] };
      }
    });
  };

  const toggleAllCouriers = () => {
    if (form.couriers.length === couriers.length) {
      setForm(prev => ({ ...prev, couriers: [] }));
    } else {
      setForm(prev => ({ ...prev, couriers: couriers.map(c => c.courierProvider) }));
    }
  };

  const toggleAllServices = () => {
    const uniqueServiceNames = [...new Set(filteredServices.map(s => s.name))];
    if (form.serviceNames.length === uniqueServiceNames.length) {
      setForm(prev => ({ ...prev, serviceNames: [] }));
    } else {
      setForm(prev => ({ ...prev, serviceNames: uniqueServiceNames }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.couriers.length === 0 || form.serviceNames.length === 0) {
      setError('Please select at least one courier and one service');
      setLoading(false);
      return;
    }

    try {
      // Logic: For each selected service name, find its corresponding courier(s) from filteredServices
      // and create mappings for each pair.
      const pairs = [];
      form.serviceNames.forEach(sName => {
        const matchingServices = filteredServices.filter(fs => fs.name === sName);
        matchingServices.forEach(ms => {
          pairs.push({
            courier: ms.provider,
            serviceName: ms.name,
            cutoffTime: form.cutoffTime
          });
        });
      });

      // API call to add each pair (backend doesn't support bulk yet)
      // To improve performance, we can use Promise.all
      await Promise.all(pairs.map(pair => 
        axios.post(`${REACT_APP_BACKEND_URL}/EPD/add`, pair)
      ));

      Notification("EPD Maps Added Successfully.", "success")
      onClose();
      setForm({
        couriers: [],
        serviceNames: [],
        cutoffTime: '10:00'
      });
    } catch (err) {
      Notification("Failed to add EPD Maps", "error")
      setError(err.response?.data?.error || 'Failed to add EPD Maps');
    } finally {
      setLoading(false);
    }
  };

  const formatTo12H = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    let h = parseInt(hours, 10);
    const m = minutes;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  if (!show) return null;

  const uniqueServiceNames = [...new Set(filteredServices.map(s => s.name))];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 animate-popup-in flex justify-center items-center z-[70] p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 w-full max-w-lg relative space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-[#0CBB7D]" />
          <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">Add Estimate Pickup Date</h2>
        </div>

        {error && <p className="text-red-600 text-[10px] sm:text-[12px] font-[600]">{error}</p>}

        <div className="flex space-x-2">
          {/* Courier Dropdown */}
          <div className="flex-1 min-w-0 relative" ref={courierRef}>
            <label className="block text-gray-700 text-[10px] sm:text-[12px] font-[600] mb-1">Couriers</label>
            <button
              type="button"
              onClick={() => setOpenCourierDropdown((prev) => !prev)}
              className="w-full border text-[10px] sm:text-[12px] font-[600] text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-[#0CBB7D] focus:border-[#0CBB7D] transition-all bg-white shadow-sm overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {form.couriers.length === 0 
                ? 'Select Couriers' 
                : form.couriers.length === couriers.length 
                ? 'All Couriers' 
                : form.couriers.length > 2 
                ? `${form.couriers.length} Selected` 
                : form.couriers.join(', ')}
            </button>
            {openCourierDropdown && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                <div 
                  className="px-3 py-2 text-[10px] sm:text-[12px] font-[600] text-gray-700 border-b cursor-pointer hover:bg-gray-50 flex items-center gap-2"
                  onClick={toggleAllCouriers}
                >
                  <input 
                    type="checkbox" 
                    checked={form.couriers.length === couriers.length && couriers.length > 0} 
                    readOnly 
                    className="accent-[#0CBB7D]"
                  />
                  Select All
                </div>
                {couriers.length === 0 ? (
                  <div className="p-2 text-[10px] sm:text-[12px] text-gray-500 text-center">No Couriers Available</div>
                ) : (
                  couriers.map((courier) => (
                    <div
                      key={courier._id}
                      onClick={() => handleCourierToggle(courier.courierProvider)}
                      className="cursor-pointer px-3 py-2 text-[10px] sm:text-[12px] font-[600] text-gray-500 hover:bg-green-50 flex items-center gap-2"
                    >
                      <input 
                        type="checkbox" 
                        checked={form.couriers.includes(courier.courierProvider)} 
                        readOnly 
                        className="accent-[#0CBB7D]"
                      />
                      {courier.courierProvider}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Courier Service Dropdown */}
          <div className="flex-1 min-w-0 relative" ref={serviceRef}>
            <label className="block text-gray-700 text-[10px] sm:text-[12px] font-[600] mb-1">Courier Services</label>
            <button
              type="button"
              onClick={() => setOpenServiceDropdown((prev) => !prev)}
              className={`w-full border border-gray-300 text-gray-700 text-[10px] sm:text-[12px] font-[600] rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-[#0CBB7D] focus:border-[#0CBB7D] transition-all bg-white shadow-sm overflow-hidden text-ellipsis whitespace-nowrap ${form.couriers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={form.couriers.length === 0}
            >
              {form.serviceNames.length === 0 
                ? 'Select Services' 
                : form.serviceNames.length === uniqueServiceNames.length 
                ? 'All Services' 
                : form.serviceNames.length > 2 
                ? `${form.serviceNames.length} Selected` 
                : form.serviceNames.join(', ')}
            </button>
            {openServiceDropdown && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                <div 
                  className="px-3 py-2 text-[10px] sm:text-[12px] font-[600] text-gray-700 border-b cursor-pointer hover:bg-gray-50 flex items-center gap-2"
                  onClick={toggleAllServices}
                >
                  <input 
                    type="checkbox" 
                    checked={form.serviceNames.length === uniqueServiceNames.length && uniqueServiceNames.length > 0} 
                    readOnly 
                    className="accent-[#0CBB7D]"
                  />
                  Select All
                </div>
                {uniqueServiceNames.length === 0 ? (
                  <div className="p-2 text-[10px] sm:text-[12px] text-gray-500 text-center">No Services Available</div>
                ) : (
                  uniqueServiceNames.map((name) => (
                    <div
                      key={name}
                      onClick={() => handleServiceToggle(name)}
                      className="cursor-pointer px-3 py-2 text-[10px] sm:text-[12px] font-[600] text-gray-500 hover:bg-green-50 flex items-center gap-2"
                    >
                      <input 
                        type="checkbox" 
                        checked={form.serviceNames.includes(name)} 
                        readOnly 
                        className="accent-[#0CBB7D]"
                      />
                      {name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-gray-700 text-[10px] sm:text-[12px] font-[600]">Cutoff Time (HH:mm)</label>
            <span className="text-[10px] sm:text-[12px] font-[700] text-[#0CBB7D] bg-green-50 px-2 py-0.5 rounded border border-green-100 italic">
              {formatTo12H(form.cutoffTime)}
            </span>
          </div>
          <input
            type="time"
            required
            className="w-full h-10 px-3 py-2 text-[10px] sm:text-[12px] border rounded-lg border-gray-300 focus:outline-none focus:ring-[#0CBB7D] focus:border-[#0CBB7D] bg-white transition-all shadow-sm"
            value={form.cutoffTime}
            onChange={e => setForm(prev => ({ ...prev, cutoffTime: e.target.value }))}
          />
          <p className="text-[10px] text-gray-400 mt-1 italic italic text-[8px] sm:text-[10px]">
            * Any shipment booked after this time will be scheduled for next day pickup.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-2 text-[10px] sm:text-[12px] font-[600] bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-3 py-2 text-[10px] sm:text-[12px] font-[600] rounded-lg text-white shadow-md ${loading ? 'bg-green-300 cursor-not-allowed' : 'bg-[#0CBB7D] hover:opacity-90'
              } transition`}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEPD;
