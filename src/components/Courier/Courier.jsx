import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { ChevronDown } from "lucide-react";

const Courier = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const dropdownRef = useRef(null)

    const [isOpen, setIsOpen] = useState(false)

    const tabs = [
        { label: 'B2C', path: '/adminDashboard/setup/courier/add/b2c' },
        { label: 'B2B', path: '/adminDashboard/setup/courier/add/b2b' },
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
        <div className="max-w-full mx-auto">
            {/* Desktop Tabs */}
            <div className="hidden sm:flex sm:px-2 flex-row justify-between items-center gap-2 mb-2">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={`px-3 py-2 text-[12px] rounded-lg font-[600] transition-all duration-200 shadow-sm border ${location.pathname === tab.path
                                ? "bg-[#0CBB7D] text-white border-[#0CBB7D]"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-green-200"
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Mobile Tab Dropdown */}
            <div className="relative sm:hidden mb-2" ref={dropdownRef}>
                <button
                    className="w-full px-3 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-[12px] font-[600] text-gray-700 flex justify-between items-center"
                    onClick={toggleDropdown}
                >
                    {selectedTab?.label || "Select Option"} <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] overflow-hidden animate-popup-in">
                        {tabs.map((tab) => (
                            <button
                                key={tab.path}
                                className={`w-full text-left px-3 py-2 text-[12px] font-[600] transition-colors ${location.pathname === tab.path ? "bg-green-50 text-[#0CBB7D]" : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                onClick={() => handleSelect(tab.path)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Render Tab Content */}
            <div className="mt-2">
                <Outlet />
            </div>
        </div>
    )
}

export default Courier
