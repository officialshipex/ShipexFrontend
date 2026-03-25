import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Notification } from '../../../Notification';
import { Clock, X } from 'lucide-react';

const EditEPD = ({ item, onClose }) => {
  const [form, setForm] = useState({
    courier: item.courier || '',
    serviceName: item.serviceName || '',
    cutoffTime: item.cutoffTime || '10:00'
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
    if (form.courier) {
      const filtered = allServices.filter(
        service => service.provider === form.courier
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices([]);
    }
  }, [form.courier, allServices]);

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

  const handleCourierSelect = (courier) => {
    setForm(prev => ({ ...prev, courier: courier.courierProvider, serviceName: '' }));
    setOpenCourierDropdown(false);
  };

  const handleServiceSelect = (name) => {
    setForm(prev => ({ ...prev, serviceName: name }));
    setOpenServiceDropdown(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!form.courier || !form.serviceName) {
      setError('Courier and Service Name are required');
      setLoading(false);
      return;
    }

    try {
      await axios.put(`${REACT_APP_BACKEND_URL}/EPD/update/${item._id}`, {
        courier: form.courier,
        serviceName: form.serviceName,
        cutoffTime: form.cutoffTime
      });
      Notification("EPD Map Updated Successfully.", "success")
      onClose();
    } catch (err) {
      Notification("Failed to update EPD Map", "error")
      setError(err.response?.data?.error || 'Failed to update EPD Map');
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

  if (!item) return null;

  const selectedCourier = couriers.find(c => c.courierProvider === form.courier);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 animate-popup-in flex justify-center items-center z-[70] p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-[#0CBB7D]" />
          <h2 className="text-[14px] sm:text-[16px] font-[600] text-gray-700">Update Estimate Pickup Date</h2>
        </div>

        {error && <p className="text-red-600 text-[10px] sm:text-[12px] font-[600]">{error}</p>}

        <div className="flex space-x-4">
          {/* Courier Dropdown */}
          <div className="flex-1 relative" ref={courierRef}>
            <label className="block text-gray-700 text-[12px] font-[600] mb-1">Courier</label>
            <button
              type="button"
              onClick={() => setOpenCourierDropdown((prev) => !prev)}
              className="w-full border text-[12px] font-[600] text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] transition-all bg-white shadow-sm"
            >
              {selectedCourier ? selectedCourier.courierProvider : form.courier || 'Select Courier'}
            </button>
            {openCourierDropdown && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                {couriers.length === 0 ? (
                  <li className="p-2 text-[12px] text-gray-500">No Couriers Available</li>
                ) : (
                  couriers.map((courier) => (
                    <li
                      key={courier._id}
                      onClick={() => handleCourierSelect(courier)}
                      className="cursor-pointer px-3 py-2 text-[12px] font-[600] text-gray-600 hover:bg-green-50"
                    >
                      {courier.courierProvider}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Courier Service Dropdown */}
          <div className="flex-1 relative" ref={serviceRef}>
            <label className="block text-gray-700 text-[12px] font-[600] mb-1">Courier Service</label>
            <button
              type="button"
              onClick={() => setOpenServiceDropdown((prev) => !prev)}
              className={`w-full border border-gray-300 text-gray-700 text-[12px] font-[600] rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] transition-all bg-white shadow-sm ${!form.courier ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              disabled={!form.courier}
            >
              {form.serviceName || 'Select Courier Service'}
            </button>
            {openServiceDropdown && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                {filteredServices.length === 0 ? (
                  <li className="p-2 text-[12px] text-gray-500">No Services Available</li>
                ) : (
                  filteredServices.map((service) => (
                    <li
                      key={service._id}
                      onClick={() => handleServiceSelect(service.name)}
                      className="cursor-pointer px-3 py-2 text-[12px] font-[600] text-gray-600 hover:bg-green-50"
                    >
                      {service.name}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-gray-700 text-[12px] font-[600]">Cutoff Time (HH:mm)</label>
            <span className="text-[10px] sm:text-[12px] font-[700] text-[#0CBB7D] bg-green-50 px-2 py-0.5 rounded border border-green-100 italic">
               {formatTo12H(form.cutoffTime)}
            </span>
          </div>
          <input
            type="time"
            required
            className="w-full h-10 px-3 py-2 text-[12px] border rounded-lg border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] bg-white transition-all shadow-sm"
            value={form.cutoffTime}
            onChange={e => setForm(prev => ({ ...prev, cutoffTime: e.target.value }))}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-[12px] font-[600] bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 text-[12px] font-[600] rounded-lg text-white shadow-md ${loading ? 'bg-green-300 cursor-not-allowed' : 'bg-[#0CBB7D] hover:opacity-90'
              } transition`}
          >
            {loading ? 'Saving...' : 'Update Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEPD;
