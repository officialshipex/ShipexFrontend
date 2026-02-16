import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { FiChevronDown } from "react-icons/fi";

const CourierServices = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const dropdownRef = useRef(null)

    const [isOpen, setIsOpen] = useState(false)

    const tabs = [
        { label: 'B2C', path: '/adminDashboard/setup/courierservices/add/b2c' },
        { label: 'B2B', path: '/adminDashboard/setup/courierservices/add/b2b' },
    ]

    const selectedTab = tabs.find(tab => tab.path === location.pathname)

    const toggleDropdown = () => {
        setIsOpen(prev => !prev)
    }

    const handleSelect = (path) => {
        setIsOpen(false)
        navigate(path)
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <div className="sm:p-2 p-1 max-w-full mx-auto">
            {/* Desktop Tabs as Buttons */}
            <div className="hidden sm:flex gap-2">
                {tabs.map(tab => (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={`px-3 py-2 rounded-lg text-[12px] font-[600] transition-all duration-200 ${location.pathname === tab.path
                            ? 'bg-[#0CBB7D] text-white'
                            : 'text-gray-700 hover:bg-green-200 bg-white'
                            }`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Custom Mobile Dropdown */}
            <div className="sm:hidden mb-2 relative" ref={dropdownRef}>
                <button
                    onClick={toggleDropdown}
                    className="w-full text-left text-[12px] border bg-[#0CBB7D] rounded-lg px-3 py-2 font-[600] text-white focus:outline-none flex items-center justify-between"
                >
                    <span>{selectedTab?.label || "Select Option"}</span>
                    <FiChevronDown
                        className={`w-4 h-4 text-white transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                            }`}
                    />
                </button>

                <div
                    className={`absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-sm overflow-hidden transition-all duration-300 ease-in-out transform ${isOpen ? "max-h-[500px] opacity-100 scale-100" : "max-h-0 opacity-0 scale-95"
                        }`}
                >
                    {tabs.map((tab) => (
                        <div
                            key={tab.path}
                            onClick={() => handleSelect(tab.path)}
                            className={`px-3 py-2 text-[12px] cursor-pointer font-[600] transition-all ${location.pathname === tab.path
                                ? "bg-green-200 text-gray-700"
                                : "text-gray-700 hover:bg-green-50"
                                }`}
                        >
                            {tab.label}
                        </div>
                    ))}
                </div>
            </div>


            {/* Render Tab Content */}
            <div className="mt-2">
                <Outlet />
            </div>
        </div>
    )
}

export default CourierServices
