import React, { useEffect, useState } from "react";
import AddCase from "./AddCase";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import Cookies from "js-cookie";
import { FiTag, FiBarChart2, FiTool } from "react-icons/fi";

const SupportPage = ({ isSidebarAdmin }) => {
  const [refresh, setRefresh] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketHistoryData, setTicketHistoryData] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeAccess, setEmployeeAccess] = useState({
    canCreate: false,
    canFeedbackView: false,
    canManageTickets: false,
  });
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccessAndTickets = async () => {
      try {
        const token = Cookies.get("session");
        console.log(token)
        if (isSidebarAdmin) {
          setEmployeeAccess({
            canCreate: true,
            canFeedbackView: true,
            canManageTickets: true,
          });
          setIsAdmin(true);
          setIsEmployee(false);
          setShowEmployeeAuthModal(false);
        } else {
          try {
            const empRes = await axios.get(
              `${REACT_APP_BACKEND_URL}/staffRole/verify`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsEmployee(true);
            const employee = empRes.data.employee;
            const canCreate =
              !!employee?.accessRights?.support?.["Create Ticket"]?.view;
            const canFeedbackView =
              !!employee?.accessRights?.support?.["Feedbacks"]?.view;
            const canManageTickets =
              !!employee?.accessRights?.support?.["Manage ticket"]?.view ||
              !!employee?.accessRights?.support?.["Manage Ticket"]?.view;

            setEmployeeAccess({ canCreate, canFeedbackView, canManageTickets });
            if (employee.isAdmin) setIsAdmin(true);
            setShowEmployeeAuthModal(!canCreate && !canFeedbackView);
          } catch (err) {
            // Not an employee, treat as normal user
            setIsEmployee(false);
            setEmployeeAccess({
              canCreate: true,
              canFeedbackView: true,
              canManageTickets: false,
            });
            setShowEmployeeAuthModal(false);
            setIsAdmin(false);
          }
        }

        // Fetch ticket history as usual
        const headers = { authorization: `Bearer ${token}` };
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/support/user`,
          { headers }
        );
        console.log("Ticket History Data:", response);
        setTicketHistoryData(response.data || []);

        setRefresh(false);

      } catch (error) {
        if (error.response && error.response.status === 401) {
          setShowEmployeeAuthModal(true);
        } else {
          setShowEmployeeAuthModal(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccessAndTickets();
  }, [refresh, isSidebarAdmin, REACT_APP_BACKEND_URL, navigate]);

  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openManageTickets = () => navigate("/dashboard/support/manageTickets");

  const tableHeaders = [
    { key: "ticketNumber", label: "Ticket Number" },
    { key: "category", label: "Category" },
    { key: "subcategory", label: "Subcategory" },
    { key: "status", label: "Status" },
  ];
  const handleCreateTicket = () => {
    if (employeeAccess.canCreate) {
      setIsModalOpen(true);
    } else if (isSidebarAdmin === false) {
      setShowEmployeeAuthModal(true);
    }
  };
  const handleFeedback = () => {
    if (employeeAccess.canFeedbackView) {
      // navigate("/dashboard/support/feedback");
    } else if (isSidebarAdmin === false) {
      setShowEmployeeAuthModal(true);
    }
  };

  const handleManageTickets = () => {
    navigate("/adminDashboard/support/manageTickets");
  };
  return (
    <div className="">
      <div className="md:p-2 p-2 w-full mx-auto">
        <h2 className="text-[12px] md:text-[18px] font-[600] text-gray-700 text-center">
          Have a query?
        </h2>
        <p className="text-center text-gray-700 text-[12px] md:text-[14px] mt-2">
          For Support (24x7), Contact us through{" "}
          <span className="font-[600] text-gray-700 animate-wavy">
            +91 9813981344
          </span>{" "}
          | Email:
          <a
            href="mailto:support@shipexindia.com"
            className="text-gray-700 font-[600]"
          >
            support@shipexindia.com
          </a>
        </p>

        {/* Mobile: Buttons Centered Above "Ticket History" */}
        <div className="md:hidden flex flex-col items-center mt-4">
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1 px-3 py-2 bg-[#0CBB7D] text-white text-[10px] sm:text-[12px] font-[600] rounded-lg hover:bg-green-500 transition"
              onClick={handleCreateTicket}
            >
              <FiTag className="w-4 h-4" />
              Create Ticket
            </button>

            <button
              className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 text-[10px] sm:text-[12px] font-[600] rounded-lg hover:bg-gray-300 transition"
              onClick={handleFeedback}
            >
              <FiBarChart2 className="w-4 h-4" />
              Feedback
            </button>
            {(isSidebarAdmin || employeeAccess.canManageTickets) && (
              <button
                className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-[10px] sm:text-[12px] font-[600] rounded-lg hover:bg-red-700 transition"
                onClick={handleManageTickets}
              >
                <FiTool className="w-4 h-4" />
                Manage Tickets
              </button>
            )}
          </div>
        </div>

        {/* Ticket History & Buttons (Desktop: Buttons in Same Row) */}
        <div className="hidden md:flex items-center justify-between mt-4">
          <h3 className="text-[10px] md:text-[14px] font-[600] text-gray-500 whitespace-nowrap">
            Ticket History:
          </h3>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1 px-3 py-2 bg-[#0CBB7D] text-white text-[10px] sm:text-[12px] font-[600] rounded-lg hover:bg-green-500 transition"
              onClick={handleCreateTicket}
            >
              <FiTag className="w-4 h-4" />
              Create Ticket
            </button>

            <button
              className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 text-[10px] sm:text-[12px] font-[600] rounded-lg hover:bg-gray-300 transition"
              onClick={handleFeedback}
            >
              <FiBarChart2 className="w-4 h-4" />
              Feedback
            </button>
            {(isSidebarAdmin || employeeAccess.canManageTickets) && (
              <button
                className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-[10px] sm:text-[12px] font-[600] rounded-lg hover:bg-red-700 transition"
                onClick={handleManageTickets}
              >
                <FiTool className="w-4 h-4" />
                Manage Tickets
              </button>
            )}
          </div>
        </div>

        {/* Ticket Table or No Record Message */}
        <div className="mt-2">
          {isLoading ? (
            <p className="text-center">Loading...</p>
          ) : ticketHistoryData.length === 0 ? (
            <p className="text-center">No record available</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-[#0CBB7D] text-white text-[12px] font-[600] border border-gray-200">
                      <th className="px-3 py-2 text-center" style={{ width: "80px", maxWidth: "100px" }}>
                        Sl No.
                      </th>
                      {tableHeaders.map(({ label }, index) => (
                        <th
                          key={index}
                          className="px-3 py-2 text-left"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ticketHistoryData.map((row, index) => (
                      <tr key={index} className="border-b border-gray-200 text-[12px] font-[400] text-gray-500">
                        <td className="px-3 py-2 text-center" style={{ width: "80px", maxWidth: "100px" }}>
                          {index + 1}
                        </td>
                        {tableHeaders.map(({ key }) => (
                          <td
                            key={key}
                            className="px-3 py-2"
                          >
                            {row[key] || "N/A"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View - Card Format */}
              <div className="md:hidden">
                <h3 className="text-[12px] font-[600] text-gray-700 mb-2 whitespace-nowrap">
                  Ticket History:
                </h3>
                {ticketHistoryData.map((row, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-md p-2 mb-2"
                  >
                    {/* <div className="flex justify-between py-1">
                      <span className="text-[10px] font-[600] text-gray-500">Sl No.</span>
                      <span className="text-[10px] text-gray-700">{index + 1}</span>
                    </div> */}
                    {tableHeaders.map(({ key, label }) => (
                      <div
                        key={key}
                        className="flex py-1 text-[10px] text-gray-700"
                      >
                        <span className="font-[600] text-gray-500 w-1/3">{label}</span>
                        <span className="w-[10px] text-center">:</span>
                        <span
                          className={`w-2/3 text-right break-words ${key === "subcategory" ? "max-w-[calc(100%-20px)]" : ""}`}
                        >
                          {row[key] || "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

            </>
          )}
        </div>
      </div>

      {/* Modal Component */}
      <AddCase isOpen={isModalOpen} onClose={closeModal} refresh={setRefresh} />
      {isEmployee && showEmployeeAuthModal && (
        <EmployeeAuthModal
          employeeModalShow={showEmployeeAuthModal}
          employeeModalClose={() => {
            setShowEmployeeAuthModal(false);
            // window.history.back();
          }}
        />
      )}
    </div>
  );
};

export default SupportPage;
