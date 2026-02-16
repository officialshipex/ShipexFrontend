import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AssignPopup from "./AsignPopup";
import EmployeeAuthModal from "../../employeeAuth/EmployeeAuthModal";
import Loader from "../../Loader";
import AddPlanModal from "./AddPlanModal";
import UploadRatecard from "./UploadRatecard";
import Cookies from "js-cookie";
import { FaEdit, FaTrash } from "react-icons/fa";


const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const RateCard = ({ isSidebarAdmin }) => {
  const [packageType, setPackageType] = useState("");
  const [direction, setDirection] = useState("Forward");
  const [rates, setRates] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [employeeAccess, setEmployeeAccess] = useState({ canView: false, canAction: false, canUpdate: false });
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [isUploadRatecardModalOpen, setIsUploadRatecardModalOpen] = useState(false);
  const rateType = "b2c";

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${REACT_APP_BACKEND_URL}/saveRate/getPlanNames`);
        setPlans(response.data.planNames || []);
      } catch (error) {
        console.error("Failed to fetch plans", error);
      }
    };
    fetchPlans();
  }, []);

  const navigate = useNavigate();

  // Data-fetching for rates
  const refreshRates = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${REACT_APP_BACKEND_URL}/saveRate/getRateCard`);
      setRates(response.data.rateCards || []);
    } catch (error) {
      setRates([]);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this ratecard?")) {
      setIsLoading(true);
      try {
        await axios.delete(`${REACT_APP_BACKEND_URL}/saveRate/deleteRateCard/${id}`);
        await refreshRates();
      } catch (error) {
        alert("Failed to delete ratecard.");
      }
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        if (isSidebarAdmin) {
          setEmployeeAccess({ canView: true, canAction: true, canUpdate: true });
          setShowEmployeeAuthModal(false);
        } else {
          const token = Cookies.get("session");
          const empRes = await axios.get(`${REACT_APP_BACKEND_URL}/staffRole/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const employee = empRes.data.employee;
          const canView = !!employee?.accessRights?.courier?.["Rate Cards"]?.view;
          const canAction = !!employee?.accessRights?.courier?.["Rate Cards"]?.action;
          const canUpdate = !!employee?.accessRights?.courier?.["Rate Cards"]?.update;
          setEmployeeAccess({ canView, canAction, canUpdate });
          if (!canView) {
            setShowEmployeeAuthModal(true);
            setIsLoading(false);
            return;
          }
        }
        await refreshRates();
      } catch (error) {
        setShowEmployeeAuthModal(true);
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, [isSidebarAdmin]);

  const openRateCardForm = () => navigate("/dashboard/ratecard/rateCardform");
  const openPlanForm = () => setIsAddPlanModalOpen(true);

  const { canView, canAction, canUpdate } = employeeAccess;

  if (isLoading) {
    return <Loader />;
  }

  if (!canView && showEmployeeAuthModal) {
    return <EmployeeAuthModal employeeModalShow={true} employeeModalClose={() => window.history.back()} />;
  }

  return (
    canView && (
      <div className="px-1 sm:px-2">
        <h2 className="text-[12px] sm:text-[18px] font- text-gray-700">Rate Cards</h2>
        <div className="flex sm:flex-row flex-col w-full gap-2 mb-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={packageType}
              onChange={(e) => setPackageType(e.target.value)}
              className="border-2 focus:outline-none sm:w-auto px-3 py-1 w-full h-9 rounded-lg text-[10px] sm:text-[12px]"
            >
              <option value="">All</option>
              {plans.map((plan, index) => (
                <option key={index} value={plan}>{plan}</option>
              ))}
            </select>
            <select value={direction} onChange={(e) => setDirection(e.target.value)} className="border-2 w-full sm:w-auto focus:outline-none h-9 px-3 py-1 rounded-lg text-[10px] sm:text-[12px]">
              {["Forward", "Reverse"].map((dir) => (
                <option key={dir} value={dir}>{dir}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex gap-2 w-full sm:w-auto">
            <button
              className={`bg-[#0CBB7D] border-2 text-[10px] sm:w-auto w-full h-9 sm:text-[12px] text-white px-3 py-2 rounded-lg ${canAction ? "hover:bg-green-500" : "opacity-50 cursor-not-allowed"}`}
              onClick={openRateCardForm}
              disabled={!canAction}
            >Add Rate Card</button>
            <button
              className={`bg-[#0CBB7D] border-2 text-[10px] sm:w-auto w-full h-9 sm:text-[12px] text-white px-3 py-2 rounded-lg ${canAction ? "hover:bg-green-500" : "opacity-50 cursor-not-allowed"}`}
              onClick={openPlanForm}
              disabled={!canAction}
            >Add Plan</button>
            <button
              className={`bg-[#0CBB7D] text-[10px] sm:text-[12px] border-2 text-white px-3 py-2 rounded-lg ${canAction ? "hover:bg-green-500" : "opacity-50 cursor-not-allowed"}`}
              onClick={() => canAction && setIsPopupOpen(true)}
              disabled={!canAction}
            >Assign</button>
            <button
              className={`bg-[#0CBB7D] border-2 text-[10px] sm:w-auto w-full h-9 sm:text-[12px] text-white px-3 py-2 rounded-lg ${canAction ? "hover:bg-green-500" : "opacity-50 cursor-not-allowed"}`}
              onClick={() => setIsUploadRatecardModalOpen(true)}
              disabled={!canAction}
            >
              Upload Rate Card
            </button>

          </div>
        </div>
        <div className="hidden sm:block">
          <table className="w-full">
            <thead className="bg-[#0CBB7D] text-[12px] text-white text-center">
              <tr className="border border-[#0CBB7D]">
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Courier Service</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2">Weight</th>
                <th className="px-3 py-2">Zone A</th>
                <th className="px-3 py-2">Zone B</th>
                <th className="px-3 py-2">Zone C</th>
                <th className="px-3 py-2">Zone D</th>
                <th className="px-3 py-2">Zone E</th>
                <th className="px-3 py-2">COD charge</th>
                <th className="px-3 py-2">COD percent</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rates
                .filter((card) => card.plan === packageType || packageType === "")
                .map((card, index) => (
                  <React.Fragment key={index}>
                    <tr className="border border-gray-300 text-center text-gray-500 text-[12px]">
                      <td className="px-3 py-2" rowSpan={2}>{card.courierProviderName}</td>
                      <td className="px-3 py-2" rowSpan={2}>{card.courierServiceName}</td>
                      <td className="px-3 py-2" rowSpan={2}>{card.mode}</td>
                      <td className="px-3 py-2">Basic: {card.weightPriceBasic[0]?.weight || "-"}</td>
                      <td className="px-3 py-2">{card.weightPriceBasic[0]?.zoneA || "-"}</td>
                      <td className="px-3 py-2">{card.weightPriceBasic[0]?.zoneB || "-"}</td>
                      <td className="px-3 py-2">{card.weightPriceBasic[0]?.zoneC || "-"}</td>
                      <td className="px-3 py-2">{card.weightPriceBasic[0]?.zoneD || "-"}</td>
                      <td className="px-3 py-2">{card.weightPriceBasic[0]?.zoneE || "-"}</td>
                      <td className="px-3 py-2" rowSpan={2}>{card.codCharge}</td>
                      <td className="px-3 py-2" rowSpan={2}>{card.codPercent}</td>
                      <td className="px-3 py-2" rowSpan={2}>
                        <span className={`px-3 py-1 rounded-lg text-[10px] ${card.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{card.status}</span>
                      </td>
                      <td
                        rowSpan={2}
                        className="px-3 py-2 border-gray-300 align-middle"
                      >
                        <div className="flex justify-center items-center gap-2 h-full">
                          <button
                            className={`p-2 bg-[#0CBB7D] text-white text-[12px] rounded-full ${canUpdate
                              ? "hover:bg-green-500"
                              : "opacity-50 cursor-not-allowed"
                              }`}
                            onClick={() => canUpdate && navigate(`/dashboard/ratecard/update/${card._id}`)}
                            disabled={!canUpdate}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className={`p-2 bg-red-500 text-white text-[12px] rounded-full ${canUpdate
                              ? "hover:bg-red-600"
                              : "opacity-50 cursor-not-allowed"
                              }`}
                            onClick={() => canUpdate && handleDelete(card._id)}
                            disabled={!canUpdate}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>


                    </tr>
                    <tr className="border text-center border-gray-300 text-[10px] text-gray-500">
                      <td className="px-3 py-2">Additional: {card.weightPriceAdditional[0]?.weight || "-"}</td>
                      <td className="px-3 py-2">{card.weightPriceAdditional[0]?.zoneA || "-"}</td>
                      <td className="px-3 py-2">{card.weightPriceAdditional[0]?.zoneB || "-"}</td>
                      <td className="px-3 py-2">{card.weightPriceAdditional[0]?.zoneC || "-"}</td>
                      <td className="px-3 py-2">{card.weightPriceAdditional[0]?.zoneD || "-"}</td>
                      <td className="px-3 py-2">{card.weightPriceAdditional[0]?.zoneE || "-"}</td>
                    </tr>
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
        <div className="sm:hidden space-y-2">
          {rates
            .filter((card) => card.plan === packageType || packageType === "")
            .map((card, index) => (
              <div
                key={index}
                className="bg-white relative rounded-lg shadow p-3 text-[12px] space-y-1"
              >
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    className={`p-2 bg-[#0CBB7D] text-white text-[12px] rounded-full ${canUpdate ? "hover:bg-green-500" : "opacity-50 cursor-not-allowed"}`}
                    onClick={() => canUpdate && navigate(`/dashboard/ratecard/update/${card._id}`)}
                    disabled={!canUpdate}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className={`p-2 bg-red-500 text-white text-[12px] rounded-full ${canUpdate ? "hover:bg-red-600" : "opacity-50 cursor-not-allowed"}`}
                    onClick={() => canUpdate && handleDelete(card._id)}
                    disabled={!canUpdate}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div className="font- text-[12px] text-gray-700">
                  {card.courierProviderName} - {card.courierServiceName}
                </div>
                <div className="text-gray-500">Mode: {card.mode}</div>
                <div className="text-[10px]">
                  <div className="font- text-gray-700">Basic Weight</div>
                  <div className="flex flex-wrap gap-1">
                    <div>W: {card.weightPriceBasic[0]?.weight || "-"}</div>
                    <div>A: {card.weightPriceBasic[0]?.zoneA || "-"}</div>
                    <div>B: {card.weightPriceBasic[0]?.zoneB || "-"}</div>
                    <div>C: {card.weightPriceBasic[0]?.zoneC || "-"}</div>
                    <div>D: {card.weightPriceBasic[0]?.zoneD || "-"}</div>
                    <div>E: {card.weightPriceBasic[0]?.zoneE || "-"}</div>
                  </div>
                </div>
                <div className="text-[10px]">
                  <div className="font- text-gray-700">Additional Weight</div>
                  <div className="flex flex-wrap gap-1">
                    <div>W: {card.weightPriceAdditional[0]?.weight || "-"}</div>
                    <div>A: {card.weightPriceAdditional[0]?.zoneA || "-"}</div>
                    <div>B: {card.weightPriceAdditional[0]?.zoneB || "-"}</div>
                    <div>C: {card.weightPriceAdditional[0]?.zoneC || "-"}</div>
                    <div>D: {card.weightPriceAdditional[0]?.zoneD || "-"}</div>
                    <div>E: {card.weightPriceAdditional[0]?.zoneE || "-"}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div>COD: {card.codCharge}</div>
                    <div>%: {card.codPercent}</div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-[10px] ${card.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {card.status}
                  </span>
                </div>
              </div>
            ))}
        </div>
        <AssignPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
        <AddPlanModal
          isOpen={isAddPlanModalOpen}
          onClose={() => setIsAddPlanModalOpen(false)}
          onSuccess={refreshRates}
          rateType={rateType}
        />
        <UploadRatecard
          isOpen={isUploadRatecardModalOpen}
          onClose={() => setIsUploadRatecardModalOpen(false)}
          setRefresh={refreshRates} // if you want to refresh after upload
        />

      </div>
    )
  );
};

export default RateCard;
