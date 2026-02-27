import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Notification } from '../../../Notification';
import { Clock } from 'lucide-react';

const EditEDD = ({ item, onClose, existingServices = [] }) => {
    const [form, setForm] = useState({
        courier: item.courier || '',
        serviceName: item.serviceName || '',
        zoneA: item.zoneRates.zoneA || '',
        zoneB: item.zoneRates.zoneB || '',
        zoneC: item.zoneRates.zoneC || '',
        zoneD: item.zoneRates.zoneD || '',
        zoneE: item.zoneRates.zoneE || ''
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
        if (allServices.length > 0) {
            const matchedService = allServices.find(s => s.name.toLowerCase() === (item.serviceName || '').toLowerCase());
            setForm(prev => ({
                ...prev,
                serviceName: matchedService ? matchedService.name : '',
            }));
        }
    }, [allServices, item.serviceName]);


    useEffect(() => {
        if (form.courier) {
            const filtered = allServices.filter(service => {
                const isSameCourier = service.provider === form.courier;
                const isNotExistingOrCurrent = !existingServices.includes(service.name) || service.name === form.serviceName;
                return isSameCourier && isNotExistingOrCurrent;
            });
            setFilteredServices(filtered);

            if (!filtered.find(s => s.name === form.serviceName)) {
                setForm(prev => ({ ...prev, serviceName: '' }));
            }
        } else {
            setFilteredServices([]);
            setForm(prev => ({ ...prev, serviceName: '' }));
        }
    }, [form.courier]);

    useEffect(() => {
        const handleClickOutside = event => {
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

    const handleChange = e => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleCourierSelect = courier => {
        setForm(prev => ({
            ...prev,
            courier: courier.courierProvider,
            serviceName: '' // reset service when courier changes
        }));
        setOpenCourierDropdown(false);
    };

    const handleServiceSelect = name => {
        setForm(prev => ({
            ...prev,
            serviceName: name
        }));
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
            await axios.put(`${REACT_APP_BACKEND_URL}/EDD/updateEDD/${item._id}`, {
                courier: form.courier,
                serviceName: form.serviceName,
                zoneRates: {
                    zoneA: Number(form.zoneA),
                    zoneB: Number(form.zoneB),
                    zoneC: Number(form.zoneC),
                    zoneD: Number(form.zoneD),
                    zoneE: Number(form.zoneE)
                }
            });
            Notification("EDD Update Successfully.", "success")
            onClose();
        } catch (err) {
            Notification("Failed to update EDD")
            setError(err.response?.data?.error || 'Failed to update EDD');
        } finally {
            setLoading(false);
        }
    };

    const selectedCourier = couriers.find(c => c.courierProvider === form.courier);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 animate-popup-in flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 w-full max-w-lg relative space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-[#0CBB7D]" />
                    <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">Update Estimate Date and Time</h2>
                </div>

                {error && <p className="text-red-600 text-[10px] sm:text-[12px] font-[600]">{error}</p>}

                {/* Courier and Courier Service in one row */}
                <div className="flex space-x-2">
                    {/* Courier */}
                    <div className="flex-1 relative" ref={courierRef}>
                        <label className="block text-gray-700 text-[10px] sm:text-[12px] font-[600] mb-1">Courier</label>
                        <button
                            type="button"
                            onClick={() => setOpenCourierDropdown(prev => !prev)}
                            className="w-full border text-[10px] sm:text-[12px] font-[600] border-gray-300 rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] transition-all"
                        >
                            {selectedCourier ? selectedCourier.courierProvider : 'Select Courier'}
                        </button>
                        {openCourierDropdown && (
                            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto border border-gray-300 rounded-lg bg-white shadow-sm">
                                {couriers.length === 0 ? (
                                    <li className="p-2 text-[10px] sm:text-[12px] text-gray-500">No Couriers Available</li>
                                ) : (
                                    couriers.map(courier => (
                                        <li
                                            key={courier._id}
                                            onClick={() => handleCourierSelect(courier)}
                                            className="cursor-pointer px-3 py-2 text-[10px] sm:text-[12px] font-[600] text-gray-500 hover:bg-green-100"
                                        >
                                            {courier.courierProvider}
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>

                    {/* Courier Service */}
                    <div className="flex-1 relative" ref={serviceRef}>
                        <label className="block text-gray-700 text-[10px] sm:text-[12px] font-[600] mb-1">Courier Service</label>
                        <button
                            type="button"
                            onClick={() => setOpenServiceDropdown(prev => !prev)}
                            className={`w-full border border-gray-300 text-gray-700 text-[10px] sm:text-[12px] font-[600] rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] transition-all ${!form.courier ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            disabled={!form.courier}
                        >
                            {form.serviceName || 'Select Courier Service'}
                        </button>

                        {openServiceDropdown && (
                            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto border border-gray-300 rounded-lg bg-white shadow-sm">
                                {filteredServices.length === 0 ? (
                                    <li className="p-2 text-sm text-gray-500">No Services Available</li>
                                ) : (
                                    filteredServices.map(service => (
                                        <li
                                            key={service._id}
                                            onClick={() => handleServiceSelect(service.name)}
                                            className="cursor-pointer px-3 py-2 text-[10px] sm:text-[12px] font-[600] text-gray-500 hover:bg-green-100"
                                        >
                                            {service.name}
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Zones in one row */}
                <div className="flex flex-wrap -mx-2">
                    {['zoneA', 'zoneB', 'zoneC', 'zoneD', 'zoneE'].map(zone => (
                        <div key={zone} className="w-1/5 px-2">
                            <label className="block text-gray-700 text-[10px] sm:text-[12px] font-[600] mb-1">{zone}</label>
                            <input
                                type="number"
                                name={zone}
                                value={form[zone]}
                                onChange={e => setForm(prev => ({ ...prev, [zone]: e.target.value }))}
                                min="0"
                                step="any"
                                className="block w-full px-2 py-1 text-gray-700 rounded-lg border text-[10px] sm:text-[12px] border-gray-300 shadow-sm focus:ring-1 focus:ring-[#0CBB7D] focus:border-[#0CBB7D] transition-all outline-none"
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-3 py-2 text-[10px] sm:text-[12px] font-[600] bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-3 py-2 text-[10px] sm:text-[12px] font-[600] rounded-lg text-white ${loading ? 'bg-green-300 cursor-not-allowed' : 'bg-[#0CBB7D] hover:opacity-90'
                            } transition`}
                    >
                        {loading ? 'Saving...' : 'Update'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditEDD;
