import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import EarlyCODModal from "./EarlyCodPopup";

const COD = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    const tabs = [
        { label: 'All COD Orders', path: '/finance/COD/CODRemittance' },
        { label: 'Seller COD Remittance', path: '/finance/COD/sellerCodRemittance' },
        { label: 'Courier COD Remittance', path: '/finance/COD/courierCodRemittance' },
    ];

    const currentTab = tabs.find(tab => tab.path === location.pathname) || tabs[0];

    const handleSelect = (path) => {
        setOpen(false);
        navigate(path);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="sm:px-2 w-full mx-auto">
            <div className="flex flex-row items-center sm:items-start justify-between w-full mb-2 sm:mb-0">
                <div>
                    <h1 className="text-[12px] md:text-[14px] text-gray-700 font-[600]">COD</h1>
                </div>

                <div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#0CBB7D] text-white font-[600] px-3 py-2 rounded-lg text-[10px]"
                    >
                        Early COD
                    </button>
                    <EarlyCODModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                </div>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex flex-wrap gap-2 mb-[-15px]">
                {tabs.map(tab => (
                    <button
                        key={tab.path}
                        onClick={() => navigate(tab.path)}
                        className={`px-3 py-2 text-[12px] border rounded-lg font-[600] transition-all duration-200 ${location.pathname === tab.path
                            ? 'bg-[#0CBB7D] text-white'
                            : 'bg-white text-gray-700 hover:bg-green-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Mobile Dropdown - Matching Billing.jsx design */}
            <div className="relative md:hidden mb-[-15px]" ref={dropdownRef}>
                <button
                    onClick={() => setOpen(prev => !prev)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-[12px] font-[600] text-gray-700 flex justify-between items-center"
                >
                    {currentTab.label}
                    <ChevronDown
                        className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                </button>

                {open && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] overflow-hidden animate-popup-in max-h-80 overflow-y-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.path}
                                onClick={() => handleSelect(tab.path)}
                                className={`w-full text-left px-4 py-2 text-[12px] font-[600] transition-colors ${location.pathname === tab.path
                                    ? 'bg-green-50 text-[#0CBB7D]'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                <Outlet />
            </div>
        </div>
    );
};

export default COD;
