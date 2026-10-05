import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";
import {
  PERMISSION_FLAGS,
  getPermissionCatalog,
  emptyAccessRights,
  toFormRights,
} from "../../../utils/employeeAccess";

const ROLE_OPTIONS = {
  admin: [
    "Admin",
    "Sub Admin",
    "Finance",
    "Sales Manager",
    "Sales Executive",
    "Key Account Manager",
    "Operations",
    "Customer Support",
  ],
  user: ["Manager", "Operations", "Accounts", "Customer Support", "Staff"],
};

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Add / edit an employee. `panel` is the side the employee will work in:
//   "admin" – created by an admin, sees the admin panel
//   "user"  – created by a merchant, sees the user panel
export default function AddRole({ panel = "admin" }) {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const { state } = useLocation();
  const role = state?.role;
  const isEdit = !!role;

  const catalog = getPermissionCatalog(panel);
  const roleOptions = ROLE_OPTIONS[panel] || ROLE_OPTIONS.admin;

  const [form, setForm] = useState({
    fullName: role?.fullName || "",
    email: role?.email || "",
    contactNumber: role?.contactNumber || "",
    password: "",
  });
  const [isActive, setIsActive] = useState(role ? role.isEmpActive !== false : true);
  const [selectedRole, setSelectedRole] = useState(role?.role || "");
  const [rights, setRights] = useState(() =>
    role ? toFormRights(role.accessRights, panel) : emptyAccessRights(panel)
  );
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setField = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

  // Section master switch: turns every flag of every item on / off.
  const toggleSection = (section, items, enabled) => {
    setRights((prev) => {
      const next = { ...prev[section], enabled };
      items.forEach(({ key }) => {
        next[key] = { view: enabled, update: enabled, action: enabled };
      });
      return { ...prev, [section]: next };
    });
  };

  // update / action only make sense on a page the employee can open, so they imply view,
  // and removing view removes them.
  const toggleFlag = (section, itemKey, flag) => {
    setRights((prev) => {
      const current = prev[section][itemKey] || { view: false, update: false, action: false };
      const next = { ...current, [flag]: !current[flag] };
      if (flag === "view" && !next.view) {
        next.update = false;
        next.action = false;
      } else if (flag !== "view" && next[flag]) {
        next.view = true;
      }
      const section_ = { ...prev[section], [itemKey]: next };
      section_.enabled = Object.entries(section_).some(([k, v]) => k !== "enabled" && v?.view);
      return { ...prev, [section]: section_ };
    });
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Full name is required";
    if (!EMAIL_PATTERN.test(form.email.trim())) return "Enter a valid email address";
    if (!form.contactNumber.trim()) return "Contact number is required";
    if (!isEdit && form.password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (isEdit && form.password && form.password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (!selectedRole.trim()) return "Role / designation is required";
    return null;
  };

  const handleSubmit = async () => {
    const problem = validate();
    if (problem) {
      Notification(problem, "error");
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      contactNumber: form.contactNumber.trim(),
      role: selectedRole.trim(),
      isActive,
      accessRights: rights,
      // tells the server which panel's employees this belongs to (an admin can use both panels)
      mode: panel,
    };
    // Editing: a blank password keeps the current one
    if (form.password) payload.password = form.password;

    const token = Cookies.get("session");
    const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } };

    setSubmitting(true);
    try {
      if (isEdit) {
        await axios.put(`${REACT_APP_BACKEND_URL}/staffRole/updateRole/${role._id}`, payload, config);
        Notification("Employee updated successfully!", "success");
      } else {
        await axios.post(`${REACT_APP_BACKEND_URL}/staffRole/createRole`, payload, config);
        Notification("Employee created successfully!", "success");
      }
      navigate("/dashboard/Setup&Manage/Role_List");
    } catch (error) {
      Notification(error?.response?.data?.message || "Failed to submit. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "border-2 border-gray-300 text-gray-500 focus:outline-none px-3 py-2 rounded-lg w-full text-[12px] placeholder:text-[12px]";

  return (
    <div className="min-h-screen flex justify-center sm:px-2 p-1">
      <div className="rounded-lg w-full max-w-full">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-[12px] sm:text-[18px] text-gray-700 font-[600]">
            {isEdit ? "Edit Employee" : "Add Employee"}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-500">{isActive ? "Active" : "Inactive"}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isActive}
                onChange={() => setIsActive(!isActive)}
              />
              <div className="sm:w-12 sm:h-6 w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-brand-primary relative transition duration-300">
                <div
                  className={`absolute left-1 top-1 sm:w-4 sm:h-4 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${isActive ? "translate-x-6" : "translate-x-0"}`}
                ></div>
              </div>
            </label>
          </div>
        </div>

        {/* Input Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 text-gray-500 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[12px] mb-1">Full Name *</label>
            <input
              value={form.fullName}
              onChange={setField("fullName")}
              className={inputClass}
              placeholder="Enter Full Name"
            />
          </div>

          <div>
            <label className="block text-[12px] mb-1">Email ID *</label>
            <input
              value={form.email}
              onChange={setField("email")}
              type="email"
              autoComplete="off"
              disabled={isEdit}
              className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
              placeholder="Enter Email ID"
            />
          </div>

          <div>
            <label className="block text-[12px] mb-1">Contact Number *</label>
            <input
              value={form.contactNumber}
              onChange={setField("contactNumber")}
              type="tel"
              className={inputClass}
              placeholder="Enter Mobile No."
            />
          </div>

          <div className="relative">
            <label className="block text-[12px] mb-1">
              Password {isEdit ? "(leave blank to keep current)" : "*"}
            </label>
            <div className="flex items-center border border-gray-300 border-1 pr-2 rounded-lg w-full">
              <input
                value={form.password}
                onChange={setField("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="border-1 border border-gray-300 text-gray-500 focus:outline-none px-3 py-2 rounded-tl-lg rounded-bl-lg w-full text-[12px] placeholder:text-[12px]"
                placeholder={isEdit ? "Unchanged" : "Min. 8 characters"}
              />
              <button
                type="button"
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="w-full">
            <label className="block text-[12px] mb-1">Role / Designation *</label>
            {/* Free text, like QuickPost; the list only suggests common designations */}
            <input
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              list="employee-role-options"
              className={inputClass}
              placeholder="e.g. Support Executive"
            />
            <datalist id="employee-role-options">
              {roleOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Access Rights: one block per sidebar section, one row per sidebar item */}
        <h2 className="text-[12px] sm:text-[16px] text-gray-700 font-[600] mt-2">Access Rights</h2>
        <p className="text-[11px] text-gray-500">
          The employee sees every menu item; items without View access are locked and show a
          "no access" message when clicked.
        </p>

        {catalog.map(({ section, title, items }) => {
          const sectionRights = rights[section] || {};
          return (
            <div key={section} className="mt-2 p-4 rounded-lg border bg-white border-gray-300 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-[600] text-[12px] sm:text-[14px] text-gray-500">{title}</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!sectionRights.enabled}
                    onChange={() => toggleSection(section, items, !sectionRights.enabled)}
                  />
                  <div className="sm:w-12 sm:h-6 w-10 h-5 bg-gray-300 peer-checked:bg-brand-primary rounded-full transition-colors"></div>
                  <div className="absolute left-1 top-1 sm:w-4 sm:h-4 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </label>
              </div>

              <table className="w-full mt-2 text-[10px] sm:text-[12px] text-gray-500 table-fixed">
                <thead>
                  <tr>
                    <th className="w-[40%] px-3 py-2 text-left">Permission</th>
                    {PERMISSION_FLAGS.map(({ key, label }) => (
                      <th key={key} className="w-[20%] px-3 py-2 text-center">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ key: itemKey, label }) => (
                    <tr key={itemKey}>
                      <td className="w-[40%] px-3 py-2 text-left">{label}</td>
                      {PERMISSION_FLAGS.map(({ key: flag }) => (
                        <td key={flag} className="w-[20%] px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            className="accent-brand-primary"
                            checked={!!sectionRights[itemKey]?.[flag]}
                            onChange={() => toggleFlag(section, itemKey, flag)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        <div className="mt-2 text-right">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-brand-primary text-[10px] sm:text-[12px] font-[600] text-white px-3 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {submitting ? "Saving…" : isEdit ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
