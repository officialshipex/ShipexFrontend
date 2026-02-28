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
import { FiChevronDown, FiArrowLeft, FiSearch } from "react-icons/fi";
import { getCarrierLogo } from "../../Common/getCarrierLogo";
import NotFound from "../../assets/nodatafound.png";


const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const RateCard = ({ isSidebarAdmin }) => {
  const [packageType, setPackageType] = useState("");
  const [courierSearch, setCourierSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rates, setRates] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [employeeAccess, setEmployeeAccess] = useState({ canView: false, canAction: false, canUpdate: false });
  const [showEmployeeAuthModal, setShowEmployeeAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [isUploadRatecardModalOpen, setIsUploadRatecardModalOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [tableHeight, setTableHeight] = useState("calc(100vh - 200px)");
  const rateType = "b2c";

  useEffect(() => {
    const updateHeight = () => {
      const top = 150; // approximation
      setTableHeight(`calc(100vh - ${top}px)`);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

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

  const filteredRates = rates
    .filter((card) => (packageType === "" || card.plan === packageType))
    .filter((card) => (courierSearch === "" || card.courierServiceName?.toLowerCase().includes(courierSearch.toLowerCase())))
    .filter((card) => (statusFilter === "" || card.status === statusFilter));


  if (!canView && showEmployeeAuthModal) {
    return <EmployeeAuthModal employeeModalShow={true} employeeModalClose={() => window.history.back()} />;
  }

  return (
    canView && (
      <div className="sm:px-2 flex flex-col h-full overflow-hidden bg-gray-50/30">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-[12px] sm:text-[14px] text-gray-700 font-bold tracking-tight">Rate Cards</h2>

        </div>

        <div className="flex flex-col sm:flex-row w-full gap-2 mb-2 items-end">
          <div className="flex flex-col sm:flex-row flex-1 gap-2 w-full">
            {/* Top Row for Mobile (Plan and Status side by side) / Flex items for Desktop */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
              {/* Custom Plan Dropdown */}
              <div className="relative w-full sm:min-w-[180px]">
                <div
                  onClick={() => setIsPlanOpen(!isPlanOpen)}
                  className="flex items-center justify-between font-[600] border border-gray-300 bg-white px-3 py-1.5 h-9 rounded-lg cursor-pointer hover:border-[#0CBB7D] transition-all group"
                >
                  <span className={`text-[10px] sm:text-[12px] truncate ${packageType ? "text-gray-700" : "text-gray-400"}`}>
                    {packageType || "Select Plan"}
                  </span>
                  <FiChevronDown className={`text-gray-400 group-hover:text-[#0CBB7D] transition-transform flex-shrink-0 ${isPlanOpen ? "rotate-180" : ""}`} />
                </div>
                {isPlanOpen && (
                  <div className="absolute font-[600] top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-sm z-[100] animate-in fade-in slide-in-from-top-2 max-h-48 overflow-y-auto">
                    <div
                      onClick={() => { setPackageType(""); setIsPlanOpen(false); }}
                      className="px-3 py-2 text-[10px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                    >
                      All Plans
                    </div>
                    {plans.map((plan, index) => (
                      <div
                        key={index}
                        onClick={() => { setPackageType(plan); setIsPlanOpen(false); }}
                        className="px-3 py-2 text-[10px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                      >
                        {plan}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Status Dropdown - Moved to be next to Plan on mobile rows */}
              <div className="relative w-full sm:min-w-[120px] font-[600] sm:order-last">
                <div
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="flex items-center justify-between border border-gray-300 bg-white px-3 py-1.5 h-9 rounded-lg cursor-pointer hover:border-[#0CBB7D] transition-all group"
                >
                  <span className={`text-[10px] sm:text-[12px] truncate ${statusFilter ? "text-gray-700" : "text-gray-400"}`}>
                    {statusFilter || "Status"}
                  </span>
                  <FiChevronDown className={`text-gray-400 group-hover:text-[#0CBB7D] transition-transform flex-shrink-0 ${isStatusOpen ? "rotate-180" : ""}`} />
                </div>
                {isStatusOpen && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] animate-in fade-in slide-in-from-top-2">
                    <div onClick={() => { setStatusFilter(""); setIsStatusOpen(false); }} className="px-3 py-2 text-[10px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors">All Status</div>
                    <div onClick={() => { setStatusFilter("Active"); setIsStatusOpen(false); }} className="px-3 py-2 text-[10px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors">Active</div>
                    <div onClick={() => { setStatusFilter("Inactive"); setIsStatusOpen(false); }} className="px-3 py-2 text-[10px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors">Inactive</div>
                  </div>
                )}
              </div>
            </div>

            {/* Courier Service Search - Second line on mobile */}
            <div className="relative font-[600] w-full sm:w-[220px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FiSearch size={14} />
              </div>
              <input
                type="text"
                placeholder="Search courier service..."
                value={courierSearch}
                onChange={(e) => setCourierSearch(e.target.value)}
                className="w-full border border-gray-300 pl-9 pr-3 py-1.5 h-9 rounded-lg text-[10px] sm:text-[12px] bg-white focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              className={`bg-[#0CBB7D] sm:text-[12px] text-[10px] font-bold hover:bg-opacity-90 text-white px-3 h-9 rounded-lg transition-all ${canAction ? "" : "opacity-50 cursor-not-allowed"}`}
              onClick={openRateCardForm}
              disabled={!canAction}
            >
              Add Rate Card
            </button>
            <button
              className={`bg-[#0CBB7D] sm:text-[12px] text-[10px] font-bold hover:bg-opacity-90 text-white px-3 h-9 rounded-lg transition-all ${canAction ? "" : "opacity-50 cursor-not-allowed"}`}
              onClick={openPlanForm}
              disabled={!canAction}
            >
              Add Plan
            </button>
            <button
              className={`bg-[#0CBB7D] sm:text-[12px] text-[10px] font-bold hover:bg-opacity-90 text-white px-3 h-9 rounded-lg transition-all ${canAction ? "" : "opacity-50 cursor-not-allowed"}`}
              onClick={() => canAction && setIsPopupOpen(true)}
              disabled={!canAction}
            >
              Assign
            </button>
            <button
              className={`bg-[#0CBB7D] sm:text-[12px] text-[10px] font-bold hover:bg-opacity-90 text-white px-3 h-9 rounded-lg transition-all ${canAction ? "" : "opacity-50 cursor-not-allowed"}`}
              onClick={() => setIsUploadRatecardModalOpen(true)}
              disabled={!canAction}
            >
              Upload
            </button>
          </div>
        </div>
        <div className="hidden sm:block overflow-auto border border-gray-200 bg-white" style={{ height: tableHeight }}>
          <table className="w-full text-center border-collapse">
            <thead className="sticky top-0 z-20 bg-[#0CBB7D] text-[12px] text-white">
              <tr className="">
                <th className="px-3 py-2 font-bold">Provider</th>
                <th className="px-3 py-2 font-bold">Courier Service</th>
                <th className="px-3 py-2 font-bold">Mode</th>
                <th className="px-3 py-2 font-bold">Weight</th>
                <th className="px-3 py-2 font-bold">Zone A</th>
                <th className="px-3 py-2 font-bold">Zone B</th>
                <th className="px-3 py-2 font-bold">Zone C</th>
                <th className="px-3 py-2 font-bold">Zone D</th>
                <th className="px-3 py-2 font-bold">Zone E</th>
                <th className="px-3 py-2 font-bold">COD charge</th>
                <th className="px-3 py-2 font-bold">COD percent</th>
                <th className="px-3 py-2 font-bold">Status</th>
                <th className="px-3 py-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="">
              {isLoading ? (
                <tr>
                  <td colSpan="13" className="py-20">
                    <div className="flex justify-center items-center">
                      <Loader />
                    </div>
                  </td>
                </tr>
              ) : filteredRates.length > 0 ? (
                filteredRates.map((card, index) => (
                  <React.Fragment key={index}>
                    <tr className="border-b border-gray-100 text-center text-gray-700 text-[12px] transition-colors">
                      <td className="px-3 py-2 text-gray-700" rowSpan={2}>{card.courierProviderName}</td>
                      <td className="px-3 py-2" rowSpan={2}>{card.courierServiceName}</td>
                      <td className="px-3 py-2" rowSpan={2}>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold">{card.mode}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-gray-500">Basic:</span> <span>{card.weightPriceBasic[0]?.weight}gm</span>
                      </td>
                      <td className="px-3 py-2 font-medium">₹{card.weightPriceBasic[0]?.zoneA || "-"}</td>
                      <td className="px-3 py-2 font-medium">₹{card.weightPriceBasic[0]?.zoneB || "-"}</td>
                      <td className="px-3 py-2 font-medium">₹{card.weightPriceBasic[0]?.zoneC || "-"}</td>
                      <td className="px-3 py-2 font-medium">₹{card.weightPriceBasic[0]?.zoneD || "-"}</td>
                      <td className="px-3 py-2 font-medium">₹{card.weightPriceBasic[0]?.zoneE || "-"}</td>
                      <td className="px-3 py-2 text-gray-700" rowSpan={2}>₹{card.codCharge}</td>
                      <td className="px-3 py-2 text-gray-700" rowSpan={2}>{card.codPercent}%</td>
                      <td className="px-3 py-2" rowSpan={2}>
                        <span className={`px-2 py-0.5 rounded text-[10px] tracking-wider ${card.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{card.status}</span>
                      </td>
                      <td rowSpan={2} className="px-3 py-2">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            className={`text-[#0CBB7D] transition-all ${canUpdate ? "" : "opacity-30 cursor-not-allowed"}`}
                            onClick={() => canUpdate && navigate(`/dashboard/ratecard/update/${card._id}`)}
                            disabled={!canUpdate}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            className={`text-red-500 transition-all ${canUpdate ? "" : "opacity-30 cursor-not-allowed"}`}
                            onClick={() => canUpdate && handleDelete(card._id)}
                            disabled={!canUpdate}
                            title="Delete"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 text-center text-[12px] text-gray-700 transition-colors">
                      <td className="px-3 py-2 border-t border-gray-50">
                        <span className="text-gray-500">Additional:</span> <span className="">{card.weightPriceAdditional[0]?.weight}gm</span>
                      </td>
                      <td className="px-3 py-2 border-t border-gray-50">₹{card.weightPriceAdditional[0]?.zoneA || "-"}</td>
                      <td className="px-3 py-2 border-t border-gray-50">₹{card.weightPriceAdditional[0]?.zoneB || "-"}</td>
                      <td className="px-3 py-2 border-t border-gray-50">₹{card.weightPriceAdditional[0]?.zoneC || "-"}</td>
                      <td className="px-3 py-2 border-t border-gray-50">₹{card.weightPriceAdditional[0]?.zoneD || "-"}</td>
                      <td className="px-3 py-2 border-t border-gray-50">₹{card.weightPriceAdditional[0]?.zoneE || "-"}</td>
                    </tr>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="h-full">
                    <div className="flex flex-col items-center h-full justify-center">
                      <img src={NotFound} alt="No Data Found" className="w-60 h-60 object-contain" />
                      {/* <p className="text-gray-400 font-bold text-[14px]">No rate cards found matching your search</p> */}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-2 overflow-y-auto" style={{ height: tableHeight }}>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader />
            </div>
          ) : filteredRates.length > 0 ? (
            filteredRates.map((card, index) => (
              <div
                key={index}
                className="bg-white relative rounded-lg shadow-sm border border-gray-200 px-3 py-2 text-[10px] space-y-2 animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1">
                      <img
                        src={getCarrierLogo(card.courierServiceName)}
                        alt={card.courierServiceName}
                        className="w-full h-full object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-[10px] text-gray-700 tracking-tight leading-4">
                        {card.courierServiceName}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">
                        {card.courierProviderName} • {card.plan}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => canUpdate && navigate(`/dashboard/ratecard/update/${card._id}`)} className="text-[#0CBB7D] transition-transform active:scale-90"><FaEdit size={12} /></button>
                    <button onClick={() => canUpdate && handleDelete(card._id)} className="text-red-500 transition-transform active:scale-90"><FaTrash size={12} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-gray-50 bg-gray-50/50 p-2 rounded-lg">
                  <div>
                    <span className="text-gray-700 text-[10px] tracking-wider block">Mode</span>
                    <span className="text-gray-700 font-bold text-[10px]">{card.mode}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-700 text-[10px] tracking-wider block">Price (Zone A)</span>
                    <span className="text-[#0CBB7D] font-bold text-[10px]">₹{card.weightPriceBasic[0]?.zoneA || "-"}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="flex gap-5">
                    <div>
                      <span className="text-gray-700 text-[10px] block tracking-tighter">COD Charge</span>
                      <span className="text-gray-700 font-bold">₹{card.codCharge}</span>
                    </div>
                    <div>
                      <span className="text-gray-700 text-[10px] block tracking-tighter">COD Percent</span>
                      <span className="text-gray-700 font-bold">{card.codPercent}%</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] tracking-widest ${card.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {card.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center">
              <img src={NotFound} alt="No Data Found" className="w-60 h-60 object-contain" />
              {/* <p className="text-gray-400 font-bold text-[13px]">No matching records found</p> */}
            </div>
          )}
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
          setRefresh={refreshRates}
        />
      </div>
    )
  );
};

export default RateCard;
