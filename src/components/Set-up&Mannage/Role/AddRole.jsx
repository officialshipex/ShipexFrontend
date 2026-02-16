import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaChevronDown } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification"

export default function AddRole() {
  const [isActive, setIsActive] = useState(false);
  const [ndrChecked, setNdrChecked] = useState(false);
  const [toolsChecked, setToolsChecked] = useState(false);

  const [financeChecked, setFinanceChecked] = useState(false);
  const [setupAndManageChecked, setSetupAndManageChecked] = useState(false);
  const [courierChecked, setCourierChecked] = useState(false);
  const [ordersChecked, setOrdersChecked] = useState(false);
  const [supportChecked, setSupportChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Choose Role");
  const [operationChecked, setOperationChecked] = useState(false);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const navigate = useNavigate();
  const { state } = useLocation();
  const { role } = state || {};

  useEffect(() => {
    if (role) {
      // Set initial values from role into state variables
      setIsActive(role.isActive || false); // Assuming isActive is a boolean
      setSelectedRole(role.role || "Choose Role");

      // Set permissions checkboxes
      setNdrChecked(role.accessRights?.ndr?.enabled || false);
      setToolsChecked(role.accessRights?.tools?.enabled || false);

      setFinanceChecked(role.accessRights?.finance?.enabled || false);
      setSetupAndManageChecked(
        role.accessRights?.setupAndManage?.enabled || false
      );
      setCourierChecked(role.accessRights?.courier?.enabled || false);
      setOrdersChecked(role.accessRights?.orders?.enabled || false);
      setSupportChecked(role.accessRights?.support?.enabled || false);

      // Set permissions rights
      setNdrRights(
        role.accessRights?.ndr || initializePermissions(ndrPermissions)
      );
      setToolsRights(
        role.accessRights?.tools || initializePermissions(toolsPermissions)
      );

      setFinanceRights(
        role.accessRights?.finance || initializePermissions(financePermissions)
      );
      setSetupAndManageRights(
        role.accessRights?.setupAndManage ||
        initializePermissions(setupAndManagePermissions)
      );
      setCourierRights(
        role.accessRights?.courier || initializePermissions(courierPermissions)
      );
      setOrderRights(
        role.accessRights?.orders || initializePermissions(ordersPermissions)
      );
      setOperationChecked(role.accessRights?.operation?.enabled || false);
      setOperationRights(
        role.accessRights?.operation || initializePermissions(operationPermissions)
      );
      setSupportRights(
        role.accessRights?.support || initializePermissions(supportPermissions)
      );
    }
  }, [role]);

  const roles = [
    "Admin",
    "Sub Admin",
    "Finance",
    "Sales Manager",
    "Sales Executive",
    "Key Account Manager",
    "Operations",
    "Customer Support",
  ];

  const ndrPermissions = ["All NDR"];
  const toolsPermissions = ["Admin Weight Discrepancy"];

  const financePermissions = [
    "COD Remittance Order",
    "Seller COD Remittance",
    "Courier COD Remittance",
  ];

  const setupAndManagePermissions = ["Users", "Roles"];

  const courierPermissions = ["courier", "courier service", "Rate Cards"];

  const ordersPermissions = ["All Orders"];
  const operationPermissions = ["First Mile", "Mid Mile", "Last Mile"];

  const supportPermissions = ["Create Ticket", "Feedbacks", "Manage ticket"];

  const permissionOrder = [
    { key: "view", label: "View" },
    { key: "update", label: "Update" },
    { key: "action", label: "Action" },
  ];

  const initializePermissions = (items) =>
    items.reduce((acc, item) => {
      acc[item] = { view: false, update: false, action: false };
      return acc;
    }, {});

  const [ndrRights, setNdrRights] = useState(
    initializePermissions(ndrPermissions)
  );
  const [toolsRights, setToolsRights] = useState(
    initializePermissions(toolsPermissions)
  );

  const [financeRights, setFinanceRights] = useState(
    initializePermissions(financePermissions)
  );
  const [setupAndManageRights, setSetupAndManageRights] = useState(
    initializePermissions(setupAndManagePermissions)
  );
  const [courierRights, setCourierRights] = useState(
    initializePermissions(courierPermissions)
  );
  const [orderRights, setOrderRights] = useState(
    initializePermissions(ordersPermissions)
  );
  const [operationRights, setOperationRights] = useState(
    initializePermissions(operationPermissions)
  );

  const [supportRights, setSupportRights] = useState(
    initializePermissions(supportPermissions)
  );

  const handlePermissionChange = (section, item, permissionType) => {
    const updater = {
      NDR: setNdrRights,
      Tools: setToolsRights,
      Finance: setFinanceRights,
      setupAndManage: setSetupAndManageRights,
      Courier: setCourierRights,
      Orders: setOrderRights,
      Operation: setOperationRights,
      Support: setSupportRights,
    };
    const current = {
      NDR: ndrRights,
      Tools: toolsRights,
      Finance: financeRights,
      setupAndManage: setupAndManageRights,
      Courier: courierRights,
      Orders: orderRights,
      Operation: operationRights,
      Support: supportRights,
    };

    // Ensure the permission object exists for this item
    const prevSection = current[section] || {};
    const prevItem = prevSection[item] || {
      view: false,
      update: false,
      action: false,
    };

    updater[section]({
      ...prevSection,
      [item]: {
        ...prevItem,
        [permissionType]: !prevItem[permissionType],
      },
    });
  };

  const sections = [
    {
      title: "NDR",
      checked: ndrChecked,
      setChecked: setNdrChecked,
      permissions: ndrPermissions,
      state: ndrRights,
      setState: setNdrRights,
    },
    {
      title: "Tools",
      checked: toolsChecked,
      setChecked: setToolsChecked,
      permissions: toolsPermissions,
      state: toolsRights,
      setState: setToolsRights,
    },
    {
      title: "Finance",
      checked: financeChecked,
      setChecked: setFinanceChecked,
      permissions: financePermissions,
      state: financeRights,
      setState: setFinanceRights,
    },
    {
      title: "setupAndManage",
      checked: setupAndManageChecked,
      setChecked: setSetupAndManageChecked,
      permissions: setupAndManagePermissions,
      state: setupAndManageRights,
      setState: setSetupAndManageRights,
    },
    {
      title: "Courier",
      checked: courierChecked,
      setChecked: setCourierChecked,
      permissions: courierPermissions,
      state: courierRights,
      setState: setCourierRights,
    },
    {
      title: "Orders",
      checked: ordersChecked,
      setChecked: setOrdersChecked,
      permissions: ordersPermissions,
      state: orderRights,
      setState: setOrderRights,
    },
    {
      title: "Operation",
      checked: operationChecked,
      setChecked: setOperationChecked,
      permissions: operationPermissions,
      state: operationRights,
      setState: setOperationRights,
    },

    {
      title: "Support",
      checked: supportChecked,
      setChecked: setSupportChecked,
      permissions: supportPermissions,
      state: supportRights,
      setState: setSupportRights,
    },
  ];

  const handleCheckboxChange = (section) => {
    switch (section) {
      case "ndr":
        setNdrChecked(!ndrChecked);
        break;
      case "tools":
        setToolsChecked(!toolsChecked);
        break;
      case "finance":
        setFinanceChecked(!financeChecked);
        break;
      case "setupAndManage":
        setSetupAndManageChecked(!setupAndManageChecked);
        break;
      case "courier":
        setCourierChecked(!courierChecked);
        break;
      case "orders":
        setOrdersChecked(!ordersChecked);
        break;
      case "operation":
        setOperationChecked(!operationChecked);
        break;

      case "support":
        setSupportChecked(!supportChecked);
        break;

      default:
        break;
    }
  };

  const handleSubmit = async () => {
    const token = Cookies.get("session");

    const payload = {
      fullName: document.querySelector("input[placeholder='Enter Full Name']")
        .value,
      email: document.querySelector("input[placeholder='Enter Email ID']")
        .value,
      contactNumber: document.querySelector(
        "input[placeholder='Enter Mobile No.']"
      ).value,
      password: document.querySelector("input[placeholder='Enter Password']")
        .value,
      role: selectedRole,
      isActive,
      accessRights: {
        ndr: {
          ...ndrRights,
          enabled: ndrChecked,
        },
        tools: {
          ...toolsRights,
          enabled: toolsChecked,
        },

        finance: {
          ...financeRights,
          enabled: financeChecked,
        },
        setupAndManage: {
          ...setupAndManageRights,
          enabled: setupAndManageChecked,
        },
        courier: {
          ...courierRights,
          enabled: courierChecked,
        },
        orders: {
          ...orderRights,
          enabled: ordersChecked,
        },
        operation: {
          ...operationRights,
          enabled: operationChecked,
        },
        support: {
          ...supportRights,
          enabled: supportChecked,
        },
      },
    };

    try {
      let response;
      if (role) {
        // Update existing role
        response = await axios.put(
          `${REACT_APP_BACKEND_URL}/staffRole/updateRole/${role._id}`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Create new role
        response = await axios.post(
          `${REACT_APP_BACKEND_URL}/staffRole/createRole`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      if (response.status === 201 || response.status === 200) {
        Notification("Role updated successfully!", "success");
        navigate("/dashboard/Setup&Manage/Role_List");
      } else {
        Notification(response.data.message || "Something went wrong!", "error");
        // alert(response.data.message || "Something went wrong!");
      }
    } catch (error) {
      console.error("Submission Error:", error);
      Notification(error?.response?.data?.message || "Failed to submit. Please try again.", "error");
      // alert(
      //   error?.response?.data?.message || "Failed to submit. Please try again."
      // );
    }
  };

  return (
    <div className="min-h-screen flex justify-center sm:px-2 p-1">
      <div className="rounded-lg w-full max-w-full">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-[12px] sm:text-[18px] text-gray-700 font-[600]">Basic</h2>
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isActive}
                onChange={() => setIsActive(!isActive)}
              />
              <div className="sm:w-12 sm:h-6 w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-[#0CBB7D] relative transition duration-300">
                <div
                  className={`absolute left-1 top-1 sm:w-4 sm:h-4 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${isActive ? "translate-x-6" : "translate-x-0"
                    }`}
                ></div>
              </div>
            </label>
          </div>
        </div>

        {/* Input Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 text-gray-500 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[12px] mb-1">
              Full Name *
            </label>
            <input
              defaultValue={role?.fullName || ""}
              className="border-2 border-gray-300 text-gray-500 focus:outline-none px-3 py-2 rounded-lg w-full text-[12px] placeholder:text-[12px]"
              placeholder="Enter Full Name"
            />
          </div>

          <div>
            <label className="block text-[12px] mb-1">Email ID *</label>
            <input
              defaultValue={role?.email || ""}
              type="email"
              className="border-2 border-gray-300 text-gray-500 focus:outline-none px-3 py-2 rounded-lg w-full text-[12px] placeholder:text-[12px]"
              placeholder="Enter Email ID"
            />
          </div>

          <div>
            <label className="block text-[12px] mb-1">
              Contact Number *
            </label>
            <input
              defaultValue={role?.contactNumber || ""}
              type="tel"
              className="border-2 border-gray-300 text-gray-500 focus:outline-none px-3 py-2 rounded-lg w-full text-[12px] placeholder:text-[12px]"
              placeholder="Enter Mobile No."
            />
          </div>

          <div className="relative">
            <label className="block text-[12px] mb-1">Password *</label>
            <div className="flex items-center border border-gray-300 border-1 pr-2 rounded-lg w-full">
              <input
                defaultValue={role?.password || ""}
                type={showPassword ? "text" : "password"}
                className="border-1 border border-gray-300 text-gray-500 focus:outline-none px-3 py-2 rounded-tl-lg rounded-bl-lg w-full text-[12px] placeholder:text-[12px]"
                placeholder="Enter Password"
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

          <div className="relative w-full">
            <label className="block text-[12px] text-gray-500 mb-1">
              Select Role *
            </label>
            <div
              className="border-2 px-3 py-2 text-gray-500 rounded-lg w-full flex justify-between items-center cursor-pointer bg-white shadow-sm text-[12px]"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span>{selectedRole}</span>
              <FaChevronDown
                className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"
                  }`}
              />
            </div>
            {isOpen && (
              <ul className="absolute w-full mt-1 bg-white border text-gray-500 rounded-lg shadow-lg z-10 max-h-48 overflow-auto text-[12px]">
                {roles.map((role, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-green-50 cursor-pointer"
                    onClick={() => {
                      setSelectedRole(role);
                      setIsOpen(false);
                    }}
                  >
                    {role}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Access Rights Sections */}
        <h2 className="text-[12px] sm:text-[16px] text-gray-700 font-[600] mt-2">Access Rights</h2>

        {sections.map(
          ({ title, checked, setChecked, permissions, state, setState }) => (
            <div
              key={title}
              className="mt-2 p-4 rounded-lg border bg-white border-gray-300 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-[600] text-[12px] sm:text-[14px] text-gray-500">{title}</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={() => {
                      const newChecked = !checked;
                      setChecked(newChecked);

                      const updatedPermissions = {};
                      permissions.forEach((item) => {
                        updatedPermissions[item] = {
                          view: newChecked,
                          update: newChecked,
                          action: newChecked,
                        };
                      });
                      setState(updatedPermissions);
                    }}
                  />
                  <div className="sm:w-12 sm:h-6 w-10 h-5 bg-gray-300 peer-checked:bg-[#0CBB7D] rounded-full transition-colors"></div>
                  <div className="absolute left-1 top-1 sm:w-4 sm:h-4 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </label>
              </div>

              <table className="w-full mt-2 text-[10px] sm:text-[12px] text-gray-500 table-fixed">
                <thead>
                  <tr>
                    <th className="w-[40%] px-3 py-2 text-left">Permission</th>
                    {permissionOrder.map(({ label }) => (
                      <th key={label} className="w-[20%] px-3 py-2 text-center">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((item) => (
                    <tr key={item}>
                      <td className="w-[40%] px-3 py-2 text-left">{item}</td>
                      {permissionOrder.map(({ key }) => (
                        <td key={key} className="w-[20%] px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            className="accent-[#0CBB7D]"
                            checked={!!(state[item] && state[item][key])}
                            onChange={() => handlePermissionChange(title, item, key)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )
        )}
        <div className="mt-2 text-right">
          <button
            onClick={handleSubmit}
            className="bg-[#0CBB7D] text-[10px] sm:text-[12px] font-[600] text-white px-3 py-2 rounded-lg hover:bg-green-500 transition"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
