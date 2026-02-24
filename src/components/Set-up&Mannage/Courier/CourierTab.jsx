import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { FiChevronDown, FiSearch } from "react-icons/fi";

const CourierTab = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const dropdownRef = useRef(null)

    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("");

    const tabs = [
        { label: 'Courier Selection', path: '/dashboard/Setup&Manage/Courier/courier_selection' },
        { label: 'Courier Priority', path: '/dashboard/Setup&Manage/Courier/courier_priority' },
        // { label: 'Courier Rules', path: '/dashboard/Setup&Manage/Courier/courier_rules' },
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
        <div className="sm:px-2 max-w-full mx-auto">
            <h1 className="text-[12px] sm:text-[14px] text-gray-700 font-[600]">Courier</h1>

            {/* Desktop Tabs and Search Bar */}
            <div className="hidden sm:flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                    {tabs.map(tab => (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={`px-3 py-2 rounded-lg border text-[12px] font-[600] transition-all duration-200 ${location.pathname === tab.path
                                ? 'bg-[#0CBB7D] text-white'
                                : 'text-gray-700 hover:bg-green-200 bg-white'
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop Search Bar - Only for Courier Selection */}
                {location.pathname === '/dashboard/Setup&Manage/Courier/courier_selection' && (
                    <div className="relative w-64 group">
                        <FiSearch
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0CBB7D] transition-colors duration-200"
                            size={14}
                        />
                        <input
                            type="text"
                            placeholder="Search by courier service..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-[12px] border border-gray-300 rounded-lg outline-none focus:border-[#0CBB7D] transition-all duration-200"
                        />
                    </div>
                )}
            </div>

            {/* Mobile View Structure */}
            <div className="sm:hidden flex flex-col gap-2">
                {/* Mobile Tab Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={toggleDropdown}
                        className="w-full text-left text-[12px] border bg-white rounded-lg px-3 py-2 font-[600] text-gray-700 focus:outline-none flex items-center justify-between transition-all duration-200"
                    >
                        <span>{selectedTab?.label || "Select Option"}</span>
                        <FiChevronDown
                            className={`w-4 h-4 text-gray-700 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    <div
                        className={`absolute z-30 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-md overflow-hidden transition-all duration-300 ease-in-out transform origin-top ${isOpen ? "max-h-[500px] opacity-100 scale-100" : "max-h-0 opacity-0 scale-95 pointer-events-none"
                            }`}
                    >
                        {tabs.map((tab) => (
                            <div
                                key={tab.path}
                                onClick={() => handleSelect(tab.path)}
                                className={`px-3 py-2 text-[12px] cursor-pointer font-[600] transition-all ${location.pathname === tab.path
                                    ? "bg-green-100 text-[#0CBB7D]"
                                    : "text-gray-700 hover:bg-green-50"
                                    }`}
                            >
                                {tab.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile Search Bar - Only for Courier Selection */}
                {location.pathname === '/dashboard/Setup&Manage/Courier/courier_selection' && (
                    <div className="relative w-full group">
                        <FiSearch
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0CBB7D] transition-colors duration-200"
                            size={14}
                        />
                        <input
                            type="text"
                            placeholder="Search by courier service"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-[10px] border border-gray-300 rounded-lg outline-none focus:border-[#0CBB7D] transition-all duration-200"
                        />
                    </div>
                )}
            </div>


            {/* Render Tab Content */}
            <div className="mt-2 text-gray-700">
                <Outlet context={{ searchTerm }} />
            </div>
        </div>
    )
}

export default CourierTab
