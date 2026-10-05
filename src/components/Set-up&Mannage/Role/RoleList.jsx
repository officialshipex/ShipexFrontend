import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import Cookies from "js-cookie";
import EmployeeAuthModal from '../../../employeeAuth/EmployeeAuthModal';
import { Notification } from "../../../Notification";

// Employee list. `panel` says whose employees to manage: "admin" (the admin panel's staff) or
// "user" (the merchant's own staff).
const RoleList = ({ isSidebarAdmin, panel = 'admin' }) => {
    const navigate = useNavigate();
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(!isSidebarAdmin);

    const [copied, setCopied] = useState(false);
    const employeeLoginUrl = `${window.location.origin}/e-login`;

    const copyLoginUrl = () => {
        navigator.clipboard.writeText(employeeLoginUrl)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => Notification("Couldn't copy. Select the link and copy it manually.", "error"));
    };

    const authConfig = useCallback(
        () => ({ headers: { Authorization: `Bearer ${Cookies.get("session")}` } }),
        []
    );

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${REACT_APP_BACKEND_URL}/staffRole`, {
                ...authConfig(),
                params: { mode: panel },
            });
            setRoles(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching roles:", error);
            Notification(error?.response?.data?.message || "Failed to load employees", "error");
            setRoles([]);
        } finally {
            setLoading(false);
        }
    }, [REACT_APP_BACKEND_URL, panel, authConfig]);

    useEffect(() => {
        if (!isSidebarAdmin) {
            setShowEmployeeAuthModal(true);
            return;
        }
        fetchRoles();
    }, [isSidebarAdmin, fetchRoles]);

    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const handleEditRole = (role) => {
        navigate(`/dashboard/Setup&Manage/Role_List/AddRole`, { state: { role } });
    };

    const handleToggleStatus = async (role) => {
        setBusyId(role._id);
        try {
            const res = await axios.patch(
                `${REACT_APP_BACKEND_URL}/staffRole/toggleStatus/${role._id}`,
                {},
                authConfig()
            );
            setRoles((prev) =>
                prev.map((r) => (r._id === role._id ? { ...r, isEmpActive: res.data.isEmpActive } : r))
            );
            Notification(`Employee ${res.data.isEmpActive ? 'activated' : 'deactivated'}`, "success");
        } catch (error) {
            Notification(error?.response?.data?.message || "Failed to update status", "error");
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (role) => {
        if (!window.confirm(`Delete ${role.fullName}? They will immediately lose access.`)) return;
        setBusyId(role._id);
        try {
            await axios.delete(`${REACT_APP_BACKEND_URL}/staffRole/deleteRole/${role._id}`, {
                ...authConfig(),
                params: { mode: panel },
            });
            setRoles((prev) => prev.filter((r) => r._id !== role._id));
            Notification("Employee deleted", "success");
        } catch (error) {
            Notification(error?.response?.data?.message || "Failed to delete employee", "error");
        } finally {
            setBusyId(null);
        }
    };

    if (!isSidebarAdmin && showEmployeeAuthModal) {
        return (
            <EmployeeAuthModal
                employeeModalShow={showEmployeeAuthModal}
                message="Employees cannot manage other employees."
                employeeModalClose={() => {
                    setShowEmployeeAuthModal(false);
                    window.history.back();
                }}
            />
        );
    }

    const StatusBadge = ({ active }) => (
        <span className={`px-2 py-1 rounded-md text-[10px] font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );

    return (
        <div className='sm:px-2 p-1'>
            {/* Employee login URL banner — share this with employees */}
            <div className="flex flex-wrap items-center gap-2 mb-3 px-3 py-2 rounded-lg border border-gray-200 bg-green-50">
                <span className="text-[11px] sm:text-[12px] text-gray-600 font-medium">
                    Employee login URL — share this with your employees:
                </span>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex-1 min-w-[200px] max-w-sm">
                    <span className="text-[11px] text-gray-800 font-mono truncate flex-1">{employeeLoginUrl}</span>
                    <button
                        type="button"
                        onClick={copyLoginUrl}
                        className="shrink-0 text-[10px] font-bold text-brand-primary hover:opacity-80"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[12px] sm:text-[18px] font-[600] text-gray-700">Employees</h3>
                <button
                    className="text-white bg-brand-primary hover:opacity-90 px-3 py-2 rounded-lg shadow text-[10px] sm:text-[12px] font-[600]"
                    onClick={() => navigate("/dashboard/Setup&Manage/Role_List/AddRole")}
                >
                    Add Employee
                </button>
            </div>

            {!loading && roles.length === 0 && (
                <p className="text-[12px] text-gray-500 py-6 text-center">No employees yet.</p>
            )}

            {/* Desktop Table */}
            {roles.length > 0 && (
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-[12px] bg-white">
                        <thead className="bg-brand-primary text-white text-[12px] font-[600] uppercase">
                            <tr className='border border-brand-primary'>
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
                                    <tr key={role._id} className="border hover:bg-gray-50 text-gray-500 text-[12px] border-gray-300">
                                        <td className="px-3 py-2">{index + 1}</td>
                                        <td className="px-3 py-2">
                                            <div>{role.fullName}</div>
                                            <div>{role.email}</div>
                                            <div>{role.contactNumber}</div>
                                            <div className="text-[10px] text-gray-400">ID: {role.employeeId}</div>
                                        </td>
                                        <td className="px-3 py-2">{role.role}</td>
                                        <td className="px-3 py-2"><StatusBadge active={role.isEmpActive} /></td>
                                        <td className="px-3 py-2">
                                            <div>{date}</div>
                                            <div className="text-gray-500">{time}</div>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    title="Edit"
                                                    className="text-white px-2 py-1 font-[600] rounded-lg text-[10px] sm:text-[12px] bg-brand-primary hover:opacity-90 transition"
                                                    onClick={() => handleEditRole(role)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    title={role.isEmpActive ? 'Deactivate' : 'Activate'}
                                                    disabled={busyId === role._id}
                                                    className="px-2 py-1 font-[600] rounded-lg text-[10px] sm:text-[12px] border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50"
                                                    onClick={() => handleToggleStatus(role)}
                                                >
                                                    {role.isEmpActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    title="Delete"
                                                    disabled={busyId === role._id}
                                                    className="px-2 py-1 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition disabled:opacity-50"
                                                    onClick={() => handleDelete(role)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
                {roles.map((role) => {
                    const { date, time } = formatDateTime(role.createdAt);
                    return (
                        <div key={role._id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200 relative">
                            <div className="absolute top-4 right-4 flex items-center gap-3">
                                <button title="Edit" className="text-brand-primary" onClick={() => handleEditRole(role)}>
                                    <Pencil size={18} strokeWidth={2} />
                                </button>
                                <button
                                    title="Delete"
                                    disabled={busyId === role._id}
                                    className="text-red-600 disabled:opacity-50"
                                    onClick={() => handleDelete(role)}
                                >
                                    <Trash2 size={18} strokeWidth={2} />
                                </button>
                            </div>

                            <div className="text-[12px] font-[600] text-gray-500 mb-1">
                                Name: <span className="font-normal">{role.fullName}</span>
                            </div>
                            <div className="text-[12px] font-[600] text-gray-500 mb-1">
                                Email: <span className="font-normal">{role.email}</span>
                            </div>
                            <div className="text-[12px] font-[600] text-gray-500 mb-1">
                                Contact: <span className="font-normal">{role.contactNumber}</span>
                            </div>
                            <div className="text-[12px] font-[600] text-gray-500 mb-1">
                                Role: <span className="font-normal">{role.role}</span>
                            </div>
                            <div className="text-[12px] font-[600] text-gray-500 mb-1 flex items-center gap-2">
                                Status: <StatusBadge active={role.isEmpActive} />
                                <button
                                    disabled={busyId === role._id}
                                    className="text-[10px] underline text-brand-primary disabled:opacity-50"
                                    onClick={() => handleToggleStatus(role)}
                                >
                                    {role.isEmpActive ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                            <div className="text-[12px] font-[600] text-gray-500 mb-1">
                                Date & Time: <span className="font-normal">{date} • {time}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RoleList;
