import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Notification } from "../../Notification";
import Loader from "../../Loader";
import NotFound from "../../assets/nodatafound.png";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ZONES = ["A", "B", "C", "D", "E"];

const emptyWeightRow = () => ({ weight: "", zoneA: "", zoneB: "", zoneC: "", zoneD: "", zoneE: "" });

const defaultForm = () => ({
  courierServiceName: "",
  mode: "",
  status: "Active",
  shipmentType: "Forward",
  weightPriceBasic: [emptyWeightRow()],
  weightPriceAdditional: [emptyWeightRow()],
  codCharge: "",
  codPercent: "",
});

export default function CostingRateCard() {
  // ── Couriers & services ──────────────────────────────────────────────
  const [couriers, setCouriers] = useState([]);
  const [services, setServices] = useState([]);           // all unique service names
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isShipmentTypeOpen, setIsShipmentTypeOpen] = useState(false);

  // ── Form state ───────────────────────────────────────────────────────
  const [formData, setFormData] = useState(defaultForm());
  const [editingId, setEditingId] = useState(null);      // null ⇒ Add mode, string ⇒ Edit mode
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // ── Table state ──────────────────────────────────────────────────────
  const [rates, setRates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [tableHeight, setTableHeight] = useState("300px");

  // ── Fetch all unique courier services ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${REACT_APP_BACKEND_URL}/courierServices/couriers`);
        setCouriers(res.data || []);
        const uniqueServices = [...new Set((res.data || []).map((c) => c.name))];
        setServices(uniqueServices);
      } catch (e) {
        console.error("Error fetching couriers:", e);
      }
    };
    load();
  }, []);

  // ── Already-used service names (excluding the one currently being edited) ──
  const usedServiceNames = rates
    .filter((r) => r._id !== editingId)
    .map((r) => r.courierServiceName);

  // ── Available services = all services minus already-used ones ──
  const availableServices = services.filter(
    (s) => !usedServiceNames.includes(s)
  );

  // ── Fetch costing rate cards (table) ─────────────────────────────────
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${REACT_APP_BACKEND_URL}/costingRate/getAll`);
      setRates(res.data.costingRateCards || []);
    } catch (e) {
      console.error("Error fetching costing rates:", e);
      setRates([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  // ── Table height responsive ───────────────────────────────────────────
  useEffect(() => {
    const updateHeight = () => setTableHeight(`calc(100vh - 540px)`);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // ── When service selected, auto-populate mode ─────────────────────────
  const handleServiceSelect = (serviceName) => {
    const obj = couriers.find((c) => c.name === serviceName);
    setFormData((prev) => ({
      ...prev,
      courierServiceName: serviceName,
      mode: obj?.courierType || "",
    }));
    setErrors((prev) => ({ ...prev, courierServiceName: "" }));
    setIsServiceOpen(false);
  };

  // ── Weight row helpers ────────────────────────────────────────────────
  const handleWeightChange = (type, index, field, value) => {
    const updated = [...formData[type]];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, [type]: updated }));
  };

  // ── Validate ──────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!formData.courierServiceName)
      newErrors.courierServiceName = "Courier service is required";
    if (!formData.status) newErrors.status = "Status is required";
    if (!formData.shipmentType) newErrors.shipmentType = "Shipment type is required";

    formData.weightPriceBasic.forEach((row, i) => {
      if (!row.weight) newErrors[`basicWeight-${i}`] = "Weight required";
      ZONES.forEach((z) => {
        if (!row[`zone${z}`]) newErrors[`basicZone${z}-${i}`] = "Required";
      });
    });

    formData.weightPriceAdditional.forEach((row, i) => {
      if (!row.weight) newErrors[`addWeight-${i}`] = "Weight required";
      ZONES.forEach((z) => {
        if (!row[`zone${z}`]) newErrors[`addZone${z}-${i}`] = "Required";
      });
    });

    if (!formData.codCharge && !formData.codPercent)
      newErrors.cod = "At least one of COD charge or COD percent is required";

    return newErrors;
  };

  // ── Submit (Add or Edit) ──────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        codCharge: parseFloat(formData.codCharge) || 0,
        codPercent: parseFloat(formData.codPercent) || 0,
        weightPriceBasic: formData.weightPriceBasic.map((r) => ({
          weight: parseFloat(r.weight),
          zoneA: parseFloat(r.zoneA),
          zoneB: parseFloat(r.zoneB),
          zoneC: parseFloat(r.zoneC),
          zoneD: parseFloat(r.zoneD),
          zoneE: parseFloat(r.zoneE),
        })),
        weightPriceAdditional: formData.weightPriceAdditional.map((r) => ({
          weight: parseFloat(r.weight),
          zoneA: parseFloat(r.zoneA),
          zoneB: parseFloat(r.zoneB),
          zoneC: parseFloat(r.zoneC),
          zoneD: parseFloat(r.zoneD),
          zoneE: parseFloat(r.zoneE),
        })),
      };

      if (editingId) {
        // ── EDIT: delta is calculated on the backend ──────────────────
        const res = await axios.put(
          `${REACT_APP_BACKEND_URL}/costingRate/update/${editingId}`,
          payload
        );
        Notification(res.data.message, "success");
      } else {
        // ── ADD: simple save ──────────────────────────────────────────
        const res = await axios.post(`${REACT_APP_BACKEND_URL}/costingRate/save`, payload);
        Notification(res.data.message, "success");
      }

      setFormData(defaultForm());
      setEditingId(null);
      await fetchRates();
    } catch (err) {
      console.error("Save error:", err);
      Notification(err?.response?.data?.message || "An error occurred", "error");
    }
    setSaving(false);
  };

  // ── Populate form for editing ─────────────────────────────────────────
  const handleEdit = async (card) => {
    setEditingId(card._id);
    setFormData({
      courierServiceName: card.courierServiceName || "",
      mode: card.mode || "",
      status: card.status || "Active",
      shipmentType: card.shipmentType || "Forward",
      codCharge: String(card.codCharge ?? ""),
      codPercent: String(card.codPercent ?? ""),
      weightPriceBasic: (card.weightPriceBasic || [emptyWeightRow()]).map((r) => ({
        weight: String(r.weight ?? ""),
        zoneA: String(r.zoneA ?? ""),
        zoneB: String(r.zoneB ?? ""),
        zoneC: String(r.zoneC ?? ""),
        zoneD: String(r.zoneD ?? ""),
        zoneE: String(r.zoneE ?? ""),
      })),
      weightPriceAdditional: (card.weightPriceAdditional || [emptyWeightRow()]).map((r) => ({
        weight: String(r.weight ?? ""),
        zoneA: String(r.zoneA ?? ""),
        zoneB: String(r.zoneB ?? ""),
        zoneC: String(r.zoneC ?? ""),
        zoneD: String(r.zoneD ?? ""),
        zoneE: String(r.zoneE ?? ""),
      })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this costing rate card?")) return;
    setIsLoading(true);
    try {
      await axios.delete(`${REACT_APP_BACKEND_URL}/costingRate/delete/${id}`);
      Notification("Costing rate card deleted", "success");
      await fetchRates();
    } catch (e) {
      Notification("Failed to delete", "error");
    }
    setIsLoading(false);
  };

  // ── Cancel edit ───────────────────────────────────────────────────────
  const handleCancel = () => {
    setFormData(defaultForm());
    setEditingId(null);
    setErrors({});
  };

  // ── Filtered table rows ───────────────────────────────────────────────
  const filteredRates = rates.filter(
    (r) =>
      serviceSearch === "" ||
      r.courierServiceName?.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // ── Reusable dropdown ─────────────────────────────────────────────────
  const Dropdown = ({ label, value, options, open, setOpen, onSelect }) => (
    <div className="relative flex-1 sm:max-w-[200px]">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between font-[600] border border-gray-300 bg-white px-3 py-1.5 h-9 rounded-lg cursor-pointer hover:border-[#0CBB7D] transition-all group"
      >
        <span className={`text-[10px] sm:text-[12px] truncate ${value ? "text-gray-700" : "text-gray-400"}`}>
          {value || label}
        </span>
        <FiChevronDown className={`text-gray-400 group-hover:text-[#0CBB7D] transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="absolute font-[600] top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] max-h-48 overflow-y-auto">
          {options.map((opt, i) => (
            <div
              key={i}
              onClick={() => onSelect(opt)}
              className="px-3 py-2 text-[10px] sm:text-[12px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Weight rows renderer ──────────────────────────────────────────────
  const renderWeightRows = (type, labelType) => (
    <div className="mt-2">
      <h3 className="font-[600] text-gray-500 text-[12px] sm:text-[14px]">
        Weight Type <span className="text-red-500">{labelType} *</span> (in gram)
      </h3>
      {formData[type].map((row, i) => (
        <div key={i} className="grid grid-cols-3 sm:flex gap-2 mt-2">
          <input
            type="number"
            placeholder="Weight (gm) *"
            value={row.weight}
            className={`border h-9 text-gray-700 font-[600] px-3 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all ${errors[`${type === "weightPriceBasic" ? "basic" : "add"}Weight-${i}`] ? "border-red-400" : "border-gray-300"}`}
            onChange={(e) => handleWeightChange(type, i, "weight", e.target.value)}
          />
          {ZONES.map((z) => (
            <input
              key={z}
              type="number"
              placeholder={`Zone ${z} * ₹`}
              value={row[`zone${z}`]}
              className={`border text-gray-700 font-[600] px-3 h-9 rounded-lg text-[10px] sm:text-[12px] w-full focus:border-[#0CBB7D] focus:outline-none transition-all ${errors[`${type === "weightPriceBasic" ? "basic" : "add"}Zone${z}-${i}`] ? "border-red-400" : "border-gray-300"}`}
              onChange={(e) => handleWeightChange(type, i, `zone${z}`, e.target.value)}
            />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/30 sm:px-2">

      {/* ── FORM SECTION ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
          <h2 className="text-[12px] sm:text-[14px] font-bold text-gray-700">
            Costing Rate Card{" "}
            <span className="text-gray-400 font-medium mx-1">|</span>{" "}
            <span className="text-[#0CBB7D]">{editingId ? "Edit" : "Add"}</span>
          </h2>
          {editingId && (
            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
              ⚠ Editing will propagate rate delta to ALL plans of this service
            </span>
          )}
        </div>

        {/* Selects row */}
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          {/* Service Dropdown */}
          <div className="relative flex-1 sm:max-w-[240px]">
            <div
              onClick={() => !editingId && setIsServiceOpen(!isServiceOpen)}
              className={`flex items-center justify-between font-[600] border border-gray-300 bg-white px-3 py-1.5 h-9 rounded-lg transition-all group ${editingId ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-[#0CBB7D]"}`}
            >
              <span className={`text-[10px] sm:text-[12px] truncate ${formData.courierServiceName ? "text-gray-700" : "text-gray-400"}`}>
                {formData.courierServiceName || "Select Courier Service"}
              </span>
              <FiChevronDown className={`text-gray-400 group-hover:text-[#0CBB7D] transition-transform flex-shrink-0 ${isServiceOpen ? "rotate-180" : ""}`} />
            </div>
            {isServiceOpen && !editingId && (
              <div className="absolute font-[600] top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] max-h-48 overflow-y-auto">
                {availableServices.length > 0 ? (
                  availableServices.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => handleServiceSelect(s)}
                      className="px-3 py-2 text-[10px] sm:text-[12px] hover:bg-[#0CBB7D]/10 hover:text-[#0CBB7D] cursor-pointer transition-colors"
                    >
                      {s}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-[10px] text-gray-400">No services available</div>
                )}
              </div>
            )}
            {errors.courierServiceName && (
              <div className="text-red-500 text-[9px] mt-0.5">{errors.courierServiceName}</div>
            )}
          </div>

          {/* Status Dropdown */}
          <Dropdown
            label="Status"
            value={formData.status}
            options={["Active", "Inactive"]}
            open={isStatusOpen}
            setOpen={setIsStatusOpen}
            onSelect={(v) => { setFormData((p) => ({ ...p, status: v })); setIsStatusOpen(false); }}
          />

          {/* Shipment Type Dropdown */}
          <Dropdown
            label="Shipment Type"
            value={formData.shipmentType}
            options={["Forward", "Reverse"]}
            open={isShipmentTypeOpen}
            setOpen={setIsShipmentTypeOpen}
            onSelect={(v) => { setFormData((p) => ({ ...p, shipmentType: v })); setIsShipmentTypeOpen(false); }}
          />

          {/* Mode (read-only auto-fill) */}
          {formData.mode && (
            <div className="flex items-center h-9 px-3 border border-gray-200 rounded-lg bg-gray-50 text-[10px] sm:text-[12px] text-gray-500 font-[600]">
              Mode: <span className="ml-1 text-gray-700">{formData.mode}</span>
            </div>
          )}
        </div>

        {/* Weight rows */}
        {renderWeightRows("weightPriceBasic", "Basic")}
        {renderWeightRows("weightPriceAdditional", "Additional")}

        {/* COD */}
        <div className="mt-3">
          <h3 className="font-[600] text-[12px] sm:text-[14px] text-gray-500">Overhead Charges:</h3>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              name="codCharge"
              placeholder="COD Charge ₹"
              value={formData.codCharge}
              onChange={(e) => setFormData((p) => ({ ...p, codCharge: e.target.value }))}
              className={`border h-9 text-gray-700 font-[600] px-3 rounded-lg text-[10px] sm:text-[12px] w-full sm:w-auto focus:border-[#0CBB7D] focus:outline-none transition-all ${errors.cod ? "border-red-400" : "border-gray-300"}`}
            />
            <input
              type="number"
              name="codPercent"
              placeholder="COD Percentage %"
              value={formData.codPercent}
              onChange={(e) => setFormData((p) => ({ ...p, codPercent: e.target.value }))}
              className={`border h-9 text-gray-700 font-[600] px-3 rounded-lg text-[10px] sm:text-[12px] w-full sm:w-auto focus:border-[#0CBB7D] focus:outline-none transition-all ${errors.cod ? "border-red-400" : "border-gray-300"}`}
            />
          </div>
          {errors.cod && <div className="text-red-500 text-[9px] mt-0.5">{errors.cod}</div>}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-[10px] sm:text-[12px] font-bold hover:bg-gray-50 transition-all active:scale-95"
          >
            {editingId ? "Cancel Edit" : "Reset"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0CBB7D] text-white hover:bg-opacity-90 px-4 py-2 rounded-lg text-[10px] sm:text-[12px] font-bold transition-all active:scale-95 disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Update & Apply Delta" : "Save Costing Rate"}
          </button>
        </div>
      </div>

      {/* ── TABLE SECTION ────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
        {/* Table toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <h2 className="text-[12px] sm:text-[14px] font-bold text-gray-700">
            Costing Rate Cards
            <span className="ml-2 text-[10px] font-medium text-gray-400">({filteredRates.length})</span>
          </h2>
          <div className="relative font-[600] w-[200px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FiSearch size={13} />
            </div>
            <input
              type="text"
              placeholder="Search service..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="w-full border border-gray-300 pl-8 pr-3 py-1.5 h-8 rounded-lg text-[10px] sm:text-[12px] bg-white focus:border-[#0CBB7D] focus:ring-1 focus:ring-[#0CBB7D]/20 outline-none transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-auto" style={{ height: tableHeight, minHeight: "200px" }}>
          <table className="w-full text-center border-collapse">
            <thead className="sticky top-0 z-20 bg-[#0CBB7D] text-[12px] text-white">
              <tr>
                <th className="px-3 py-2 font-bold">Courier Service</th>
                <th className="px-3 py-2 font-bold">Mode</th>
                <th className="px-3 py-2 font-bold">Weight</th>
                <th className="px-3 py-2 font-bold">Zone A</th>
                <th className="px-3 py-2 font-bold">Zone B</th>
                <th className="px-3 py-2 font-bold">Zone C</th>
                <th className="px-3 py-2 font-bold">Zone D</th>
                <th className="px-3 py-2 font-bold">Zone E</th>
                <th className="px-3 py-2 font-bold">COD Charge</th>
                <th className="px-3 py-2 font-bold">COD %</th>
                <th className="px-3 py-2 font-bold">Status</th>
                <th className="px-3 py-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="">
                    <div className="flex justify-center items-center"><Loader /></div>
                  </td>
                </tr>
              ) : filteredRates.length > 0 ? (
                filteredRates.map((card, idx) => (
                  <React.Fragment key={idx}>
                    {/* Basic row */}
                    <tr className="border-b border-gray-100 text-center text-gray-700 text-[12px] transition-colors hover:bg-gray-50/50">
                      <td className="px-3 py-2" rowSpan={2}>{card.courierServiceName}</td>
                      <td className="px-3 py-2" rowSpan={2}>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold">{card.mode || "—"}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-gray-500">Basic:</span> {card.weightPriceBasic?.[0]?.weight}gm
                      </td>
                      <td className="px-3 py-2 font-medium">₹{card.weightPriceBasic?.[0]?.zoneA ?? "—"}</td>
                      <td className="px-3 py-2 font-medium">₹{card.weightPriceBasic?.[0]?.zoneB ?? "—"}</td>
                      <td className="px-3 py-2 font-medium">₹{card.weightPriceBasic?.[0]?.zoneC ?? "—"}</td>
                      <td className="px-3 py-2 font-medium">₹{card.weightPriceBasic?.[0]?.zoneD ?? "—"}</td>
                      <td className="px-3 py-2 font-medium">₹{card.weightPriceBasic?.[0]?.zoneE ?? "—"}</td>
                      <td className="px-3 py-2" rowSpan={2}>₹{card.codCharge}</td>
                      <td className="px-3 py-2" rowSpan={2}>{card.codPercent}%</td>
                      <td className="px-3 py-2" rowSpan={2}>
                        <span className={`px-2 py-0.5 rounded text-[10px] tracking-wider ${card.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="px-3 py-2" rowSpan={2}>
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleEdit(card)}
                            className="text-[#0CBB7D] hover:scale-110 transition-transform"
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(card._id)}
                            className="text-red-500 hover:scale-110 transition-transform"
                            title="Delete"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Additional row */}
                    <tr className="border-b border-gray-100 text-center text-[12px] text-gray-700 transition-colors hover:bg-gray-50/50">
                      <td className="px-3 py-2 border-t border-gray-50">
                        <span className="text-gray-500">Addl:</span> {card.weightPriceAdditional?.[0]?.weight}gm
                      </td>
                      <td className="px-3 py-2 border-t border-gray-50">₹{card.weightPriceAdditional?.[0]?.zoneA ?? "—"}</td>
                      <td className="px-3 py-2 border-t border-gray-50">₹{card.weightPriceAdditional?.[0]?.zoneB ?? "—"}</td>
                      <td className="px-3 py-2 border-t border-gray-50">₹{card.weightPriceAdditional?.[0]?.zoneC ?? "—"}</td>
                      <td className="px-3 py-2 border-t border-gray-50">₹{card.weightPriceAdditional?.[0]?.zoneD ?? "—"}</td>
                      <td className="px-3 py-2 border-t border-gray-50">₹{card.weightPriceAdditional?.[0]?.zoneE ?? "—"}</td>
                    </tr>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={12}>
                    <div className="flex flex-col items-center justify-center">
                      <img src={NotFound} alt="No Data" className="w-40 h-40 object-contain" />
                      {/* <p className="text-gray-400 text-[12px] mt-2 font-medium">No costing rate cards found</p> */}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-2 p-2 overflow-y-auto" style={{ maxHeight: "300px" }}>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader /></div>
          ) : filteredRates.length > 0 ? (
            filteredRates.map((card, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3 text-[10px] space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-700">{card.courierServiceName}</div>
                    <div className="text-gray-400 mt-0.5">{card.mode} • {card.shipmentType}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(card)} className="text-[#0CBB7D]"><FaEdit size={12} /></button>
                    <button onClick={() => handleDelete(card._id)} className="text-red-500"><FaTrash size={12} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded p-2">
                  <div>
                    <span className="text-gray-500 block">Basic (Zone A)</span>
                    <span className="font-bold text-[#0CBB7D]">₹{card.weightPriceBasic?.[0]?.zoneA ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Addl (Zone A)</span>
                    <span className="font-bold text-[#0CBB7D]">₹{card.weightPriceAdditional?.[0]?.zoneA ?? "—"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <div><span className="text-gray-500 block">COD Charge</span><span className="font-bold">₹{card.codCharge}</span></div>
                    <div><span className="text-gray-500 block">COD %</span><span className="font-bold">{card.codPercent}%</span></div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${card.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {card.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center py-8">
              <img src={NotFound} alt="No Data" className="w-32 h-32 object-contain" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
