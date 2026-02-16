import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { FiChevronDown } from 'react-icons/fi';

const COD = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
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

    // Close dropdown on outside click
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
        <div className="sm:p-2 p-1 max-w-full mx-auto">
            <h1 className="text-[12px] md:text-[18px] text-gray-700 font-[600]">COD</h1>

            {/* Desktop Tabs */}
            <div className="hidden sm:flex mb-2 gap-2">
                {tabs.map(tab => (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={`px-3 py-2 text-gray-700 text-[12px] md:text-[12px] rounded-lg font-[600] transition-all duration-200 ${location.pathname === tab.path
                                ? 'bg-[#0CBB7D] text-white'
                                : 'bg-white text-gray-700 hover:bg-green-200'
                            }`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Custom Mobile Dropdown */}
            <div className="sm:hidden relative mt-2" ref={dropdownRef}>
                <button
                    onClick={() => setOpen(prev => !prev)}
                    className="w-full text-left px-3 py-2 rounded-lg text-white bg-[#0CBB7D] text-[12px] font-[600] focus:outline-none flex justify-between items-center"
                >
                    {currentTab.label}
                    <FiChevronDown
                        className={`w-5 h-5 ml-2 transform transition-transform ${open ? 'rotate-180' : 'rotate-0'
                            }`}
                    />
                </button>

                {open && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md">
                        {tabs.map(tab => (
                            <div
                                key={tab.path}
                                onClick={() => handleSelect(tab.path)}
                                className={`px-3 py-2 text-[12px] font-[600] cursor-pointer hover:bg-green-100 ${location.pathname === tab.path
                                        ? 'bg-green-100 text-gray-700'
                                        : 'text-gray-500'
                                    }`}
                            >
                                {tab.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tab Content */}
            <div className="mt-2">
                <Outlet />
            </div>
        </div>
    );
};

export default COD;
