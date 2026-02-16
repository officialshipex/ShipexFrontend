import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import axios from 'axios';
import EmployeeAuthModal from '../../../employeeAuth/EmployeeAuthModal';
import Cookies from "js-cookie";

const RoleList = ({ isSidebarAdmin }) => {
    const navigate = useNavigate();
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const [roles, setRoles] = useState([]);
    const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);

    useEffect(() => {
        if (!isSidebarAdmin) {
            setShowEmployeeAuthModal(true);
            return;
        }
        const fetchRoles = async () => {
            try {
                const token = Cookies.get("session");
                const response = await axios.get(`${REACT_APP_BACKEND_URL}/staffRole`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setRoles(response.data);
                console.log(response.data);
            } catch (error) {
                console.error("Error fetching roles:", error);
            }
        };

        fetchRoles();
    }, [REACT_APP_BACKEND_URL, isSidebarAdmin]);

    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const handleEditRole = (role) => {
        navigate(`/dashboard/Setup&Manage/Role_list/AddRole`, { state: { role } });
    };
    if (!isSidebarAdmin && showEmployeeAuthModal) {
        return (
            <EmployeeAuthModal
                employeeModalShow={showEmployeeAuthModal}
                employeeModalClose={() => {
                    setShowEmployeeAuthModal(false);
                    window.history.back();
                }}
            />
        );
    }

    return (
        <div className='sm:px-2 p-1'>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[12px] sm:text-[18px] font-[600] text-gray-700">Employee Roles</h3>
                <button
                    className="text-white bg-[#0CBB7D] hover:bg-green-500 px-3 py-2 rounded-lg shadow text-[10px] sm:text-[12px] font-[600]"
                    onClick={() => navigate("/dashboard/Setup&Manage/Role_list/AddRole")}
                >
                    Add Role
                </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-[12px] bg-white">
                    <thead className="bg-[#0CBB7D] text-white text-[12px] font-[600] uppercase">
                        <tr className='border border-[#0CBB7D]'>
                            <th className="px-3 py-2 text-left">SL No.</th>
                            <th className="px-3 py-2 text-left">Employee Details</th>
                            <th className="px-3 py-2 text-left">Role</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Created At</th>
                            <th className="px-3 py-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-800">
                        {roles.map((role, index) => {
                            const { date, time } = formatDateTime(role.createdAt);
                            return (
                                <tr key={role._id || index} className="border hover:bg-gray-50 text-gray-500 text-[12px] border-gray-300">
                                    <td className="px-3 py-2 text-[12px]">{index + 1}</td>
                                    <td className="px-3 py-2">
                                        <div className="text-[12px]">{role.fullName}</div>
                                        <div className="text-gray-500">
                                            {role.email}
                                        </div>
                                        <div className="text-gray-500">
                                            {role.contactNumber}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-[12px]">{role.role}</td>
                                    <td className="px-3 py-2">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-medium ${role.isEmpActive ? 'bg-green-100 text-green-700 text-[10px]' : 'bg-red-100 text-red-600 text-[10px]'
                                            }`}>
                                            {role.isEmpActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-[12px]">
                                        <div>{date}</div>
                                        <div className="text-gray-500">{time}</div>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            title="Edit"
                                            className="text-white px-2 py-1 font-[600] rounded-lg text-[10px] sm:text-[12px] hover:text-green-500 bg-[#0CBB7D] transition-colors"
                                            onClick={() => handleEditRole(role)}
                                        >
                                            {/* <Pencil size={14} strokeWidth={2} /> */}
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
                {roles.map((role, index) => {
                    const { date, time } = formatDateTime(role.createdAt);
                    return (
                        <div
                            key={role._id || index}
                            className="bg-white rounded-lg shadow-md p-4 border border-gray-200 relative"
                        >
                            {/* Edit Button */}
                            <button
                                title="Edit"
                                className="absolute top-4 right-4 text-[#0CBB7D]"
                                onClick={() => handleEditRole(role)}
                            >
                                <Pencil size={18} strokeWidth={2} />
                            </button>

                            {/* Field Blocks */}
                            {/* <div className="text-[12px] font-semibold text-gray-900 mb-1">
          SL No:{" "}
          <span className="font-normal text-gray-700">{index + 1}</span>
        </div> */}

                            <div className="text-[12px] font-[600] text-gray-500 mb-1">
                                Name:{" "}
                                <span className="font-normal text-gray-500">{role.fullName}</span>
                            </div>

                            <div className="text-[12px] font-[600] text-gray-500 mb-1">
                                Email:{" "}
                                <span className="font-normal text-gray-500">{role.email}</span>
                            </div>

                            <div className="text-[12px] font-[600] text-gray-500 mb-1">
                                Contact:{" "}
                                <span className="font-normal text-gray-500">{role.contactNumber}</span>
                            </div>

                            <div className="text-[12px] font-[600] text-gray-500 mb-1">
                                Role:{" "}
                                <span className="font-normal text-gray-500">{role.role}</span>
                            </div>

                            <div className="text-[12px] font-[600] text-gray-500 mb-1">
                                Status:{" "}
                                <span
                                    className={`px-2 py-1 rounded-md text-[10px] font-[600] ${role.isEmpActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-600"
                                        }`}
                                >
                                    {role.isEmpActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div className="text-[12px] font-[600] text-gray-500 mb-1">
                                Date & Time:{" "}
                                <span className="font-normal text-gray-500">{date} • {time}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default RoleList;
