import React, { useEffect, useMemo, useState } from "react";
import AddCase from "./AddCase";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import Cookies from "js-cookie";
import { FiTag, FiTool, FiPhone, FiMail } from "react-icons/fi";
import { useBranding } from "../../context/BrandingContext";
import DetailedTicketView from "./DetailedTicketView";
import { StatusBadge, StatusTabs, useFillHeight } from "./StatusTabs";
import { formatTicketDate, replyCountText, shortAwbList, statusTab } from "./ticketStatus";

const SupportPage = ({ isSidebarAdmin }) => {
  const { supportEmail, supportPhone } = useBranding();
  const [refresh, setRefresh] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketHistoryData, setTicketHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeAccess, setEmployeeAccess] = useState({
    canCreate: false,
    canFeedbackView: false,
    canManageTickets: false,
  });
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTab, setSelectedTab] = useState("");
  const [listRef, listHeight] = useFillHeight(16);

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccessAndTickets = async () => {
      try {
        const token = Cookies.get("session");
        if (isSidebarAdmin) {
          setEmployeeAccess({
            canCreate: true,
            canFeedbackView: true,
            canManageTickets: true,
          });
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
          }
        }

        // Fetch ticket history as usual
        const headers = { authorization: `Bearer ${token}` };
        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/support/user`,
          { headers }
        );
        setTicketHistoryData(response.data || []);

        setRefresh(false);

      } catch (error) {
        setShowEmployeeAuthModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccessAndTickets();
  }, [refresh, isSidebarAdmin, REACT_APP_BACKEND_URL, navigate]);

  const closeModal = () => setIsModalOpen(false);

  const handleCreateTicket = () => {
    if (employeeAccess.canCreate) {
      setIsModalOpen(true);
    } else if (isSidebarAdmin === false) {
      setShowEmployeeAuthModal(true);
    }
  };

  const handleManageTickets = () => {
    navigate("/adminDashboard/support/manageTickets");
  };

  const visibleTickets = useMemo(
    () => (selectedTab ? ticketHistoryData.filter((t) => statusTab(t.status) === selectedTab) : ticketHistoryData),
    [ticketHistoryData, selectedTab]
  );

  if (selectedTicket) {
    return (
      <DetailedTicketView
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={(updated) =>
          setTicketHistoryData((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
        }
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[14px] md:text-[16px] font-[600] text-gray-800">Support</h2>
          <p className="text-[12px] text-gray-500 mt-0.5">We're here 24x7. Raise a ticket or reach us directly.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[12px] font-[600] text-gray-700">
            {supportPhone && (
              <span className="flex items-center gap-1.5"><FiPhone className="w-3.5 h-3.5 text-brand-primary" />{supportPhone}</span>
            )}
            {supportEmail && (
              <a href={`mailto:${supportEmail}`} className="flex items-center gap-1.5 hover:underline"><FiMail className="w-3.5 h-3.5 text-brand-primary" />{supportEmail}</a>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {(isSidebarAdmin || employeeAccess.canManageTickets) && (
            <button
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-[12px] font-[600] rounded-lg hover:bg-gray-50 transition"
              onClick={handleManageTickets}
            >
              <FiTool className="w-4 h-4" />
              Manage Tickets
            </button>
          )}
          <button
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-primary text-white text-[12px] font-[600] rounded-lg hover:opacity-90 transition"
            onClick={handleCreateTicket}
          >
            <FiTag className="w-4 h-4" />
            Create Ticket
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-[12px] text-gray-500 py-10">Loading...</p>
      ) : ticketHistoryData.length === 0 ? (
        <div ref={listRef} style={{ height: listHeight }} className="bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center text-center">
          <p className="text-[14px] font-[600] text-gray-700">No tickets yet</p>
          <p className="text-[12px] text-gray-500 mt-1">Your support tickets will show here once you raise one.</p>
        </div>
      ) : (
        <>
          <div className="mb-2">
            <StatusTabs tickets={ticketHistoryData} selected={selectedTab} onSelect={setSelectedTab} />
          </div>

          <div ref={listRef}>
          {visibleTickets.length === 0 ? (
            <div style={{ height: listHeight }} className="bg-white rounded-lg border border-gray-200 flex items-center justify-center text-[12px] text-gray-500">
              No tickets here.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div style={{ height: listHeight }} className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-brand-primary text-white text-[12px] font-[600]">
                      <th className="px-4 py-2.5">Ticket</th>
                      <th className="px-4 py-2.5">AWB</th>
                      <th className="px-4 py-2.5">Issue</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Last update</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTickets.map((row) => (
                      <tr key={row._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="text-[12px] font-[600] text-brand-primary">#{row.ticketNumber}</p>
                          <p className="text-[11px] text-gray-400">{formatTicketDate(row.createdAt)}</p>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-gray-600">{shortAwbList(row.awbNumbers)}</td>
                        <td className="px-4 py-2.5">
                          <p className="text-[12px] font-[600] text-gray-700">{row.subcategory}</p>
                          <p className="text-[11px] text-gray-400">{row.category}</p>
                        </td>
                        <td className="px-4 py-2.5"><StatusBadge status={row.status} /></td>
                        <td className="px-4 py-2.5">
                          <p className="text-[12px] text-gray-600">{formatTicketDate(row.lastRepliedAt || row.createdAt)}</p>
                          <p className="text-[11px] text-gray-400">{replyCountText(row)}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            className="px-3 py-1 rounded-lg border border-brand-primary text-brand-primary text-[12px] font-[600] hover:bg-brand-primary hover:text-white transition-colors"
                            onClick={() => setSelectedTicket(row)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View - Card Format */}
              <div style={{ height: listHeight }} className="md:hidden overflow-y-auto flex flex-col gap-2">
                {visibleTickets.map((row) => (
                  <div key={row._id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-[600] text-brand-primary">#{row.ticketNumber}</span>
                      <StatusBadge status={row.status} />
                    </div>
                    <p className="text-[12px] font-[600] text-gray-700 mt-1.5">{row.subcategory}</p>
                    <p className="text-[11px] text-gray-400">{row.category}</p>
                    <p className="text-[11px] text-gray-500 mt-1.5">AWB: {shortAwbList(row.awbNumbers)}</p>
                    <p className="text-[11px] text-gray-500">Updated {formatTicketDate(row.lastRepliedAt || row.createdAt)} · {replyCountText(row)}</p>
                    <button
                      className="mt-2 w-full py-1.5 rounded-lg border border-brand-primary text-brand-primary text-[12px] font-[600]"
                      onClick={() => setSelectedTicket(row)}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          </div>
        </>
      )}

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
