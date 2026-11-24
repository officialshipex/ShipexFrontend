import { useEffect, useState } from "react";
import {
  getMeta,
  getRateCard,
  createRateCard,
  updateRateCard,
  deleteRateCard,
  getB2BPlanNames,
  setB2BDefaultPlan,
} from "./rateCardApi";
import { FiEdit, FiTrash2, FiPlus, FiUpload } from "react-icons/fi";
import UploadRatesModal from "./UploadRatesModal";
import Loader from "../../Loader";
import { Notification } from "../../Notification";
import CustomDropdown from "./CustomDropdown";
import OverheadCharges, { withFixedTypes, pkgSlabProblem, odaBandProblem, withMinFreightMoved, typeMismatchesOf, labelOf, placesOf } from "./OverheadCharges";
import AddPlanModal from "../../components/RateCard/AddPlanModal";

// Each B2B service prices with its courier's zone matrix (getMeta: couriers[].zoneMatrixId + zoneMatrices[]).
// A backend from before zone matrices sends neither: then the one zone list (meta.zones), as before.
const matrixOf = (meta, serviceId) => {
  const service = meta?.couriers?.find((c) => c._id === serviceId);
  return meta?.zoneMatrices?.find((m) => m._id === service?.zoneMatrixId) || null;
};
const zonesFor = (meta, serviceId) => matrixOf(meta, serviceId)?.zones || meta?.zones || [];
const matrixNameFor = (meta, serviceId) => matrixOf(meta, serviceId)?.name || "";

export default function RateCardAdmin() {
  const [meta, setMeta] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [status, setStatus] = useState("active");
  const [overheadCharges, setOverheadCharges] = useState(null);
  // charges the card saved with another type than their row's (flagged until the admin ticks them checked)
  const [savedAs, setSavedAs] = useState({});
  const [checkedTypes, setCheckedTypes] = useState([]);
  const showOverheads = (oh) => {
    setOverheadCharges(oh);
    setSavedAs(typeMismatchesOf(oh));
    setCheckedTypes([]);
  };
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const rateType = "b2b";

  const [rateCard, setRateCard] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [mode, setMode] = useState("view");
  const [loading, setLoading] = useState(false);
  const [isPlanNameAdd, setPlanNameAdd] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // bumped after an upload so the shown card is fetched again
  const [uploadSaved, setUploadSaved] = useState(false);

  const openPlanForm = () => setIsAddPlanModalOpen(true);

  // The B2B plan every newly registered seller gets ("Set as default"; none marked = LITE). Separate from the B2C one.
  const [defaultPlan, setDefaultPlan] = useState("");
  const [unusableDefault, setUnusableDefault] = useState(""); // marked, but no active rate cards -> sellers get LITE
  const [settingDefault, setSettingDefault] = useState(false);
  const loadDefaultPlan = () =>
    getB2BPlanNames()
      .then((res) => {
        setDefaultPlan(res.data?.defaultPlan || "");
        setUnusableDefault(res.data?.defaultPlanUnusable ? res.data?.defaultPlanMarked || "" : "");
      })
      .catch(() => { /* the badge just doesn't show */ });
  // also after a save / delete / upload (reloadKey): a card can make the default plan usable or not
  useEffect(() => { loadDefaultPlan(); }, [reloadKey, isPlanNameAdd]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleSetDefaultPlan = async (plan) => {
    if (!plan || plan === defaultPlan || settingDefault) return;
    if (!window.confirm(`Give every newly registered seller the "${plan}" B2B plan?\n\nExisting sellers keep their current plans.`)) return;
    setSettingDefault(true);
    try {
      const res = await setB2BDefaultPlan(plan);
      setDefaultPlan(res.data?.defaultPlan || plan);
      setUnusableDefault("");
      Notification(res.data?.message || `New sellers will now get the "${plan}" B2B plan.`, "success");
    } catch (error) {
      Notification(error?.response?.data?.message || "Could not set the default plan.", "error");
    } finally {
      setSettingDefault(false);
    }
  };

  // same defaults as QuickPost's Cargo rate card and the backend (one type per charge)
  const defaultOverheadCharges = {
    pickupCharge: { type: "perKg", value: 0, min: 0 },

    handlingCharge: { type: "perKg", value: 0, min: 0 },

    codCharges: { type: "percentage", value: 0, min: 0 },

    fodCharges: { type: "percentage", value: 0, min: 0 },

    rovOwner: { type: "percentage", value: 0, min: 70 },

    rovCarrier: { type: "percentage", value: 0, min: 50 },

    odaCharges: { type: "perKg", value: 10, min: 1000 },

    fuelCharge: { type: "percentage", value: 20 },

    docketCharge: { type: "flat", value: 0 },

    appointmentDelivery: { type: "perKg", value: 0, min: 0 },

    greenTax: { type: "perKg", value: 0, min: 0, delhiOnly: true },

    deliveryCharge: { type: "perKg", value: 0, min: 0, places: [] },

    divisor: { type: "formula", value: 4500 },

    minimumFreight: { type: "flat", value: 0 }, // replaced by Min. LR Billing; always saved as 0

    gst: { type: "percentage", value: 18 },

    // carrier "unit charges" (e.g. Gati) — all 0 = not charged, so older cards price exactly as before
    odaCharges50to150: { type: "perKg", value: 0, min: 0 },
    odaCharges150plus: { type: "perKg", value: 0, min: 0 },
    packageHandling0to250: { type: "perKg", value: 0, min: 0 },
    packageHandling250to400: { type: "perKg", value: 0, min: 0 },
    packageHandling400plus: { type: "perKg", value: 0, min: 0 },
    minChargeableWeight: { type: "flat", value: 0 },
    minimumBilling: { type: "flat", value: 0 },
    csdDelivery: { type: "perKg", value: 0, min: 0 },
    floorDelivery: { type: "perKg", value: 0, min: 0 },
    demurrage: { type: "perKg", value: 0, min: 0 },
    reattemptCharge: { type: "perKg", value: 0, min: 0 },
    reattemptFreeCount: { type: "flat", value: 0 },
  };



  /* ================= LOAD META ================= */
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const res = await getMeta();
        setMeta(res.data);

        setSelectedCourier(res.data.couriers[0]?._id || "");
        const bronze = res.data.plans.find((p) => p.name === "Bronze");
        setSelectedPlan(bronze?._id || res.data.plans[0]?._id);
        setPlanNameAdd(false);
      } catch {
        // console.log(error,"error");
        Notification("Failed to load ratecard meta", "error");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isPlanNameAdd]);

  /* ================= FETCH RATECARD ================= */
  useEffect(() => {
    if (!selectedCourier || !selectedPlan || !meta) return;

    const loadRateCard = async () => {
      try {
        setLoading(true);
        const res = await getRateCard(selectedCourier, selectedPlan);
        console.log("resrateewew", res);

        if (res.data) {
          setRateCard(res.data);
          setStatus(res.data.status);
          // cards saved before the newer charge rows existed get those rows at 0 (= not charged)
          showOverheads(withMinFreightMoved({ ...defaultOverheadCharges, ...(res.data.overheadCharges || {}) }));
          setMatrix(buildMatrix(zonesFor(meta, selectedCourier), res.data.rates));
          setMode("view");
        } else {
          setRateCard(null);
          showOverheads(defaultOverheadCharges);
          setMatrix(buildEmptyMatrix(zonesFor(meta, selectedCourier)));
          setMode("create");
        }
      } catch(error) {
        console.log("error", error);
        Notification("Failed to load rate card", "error");
      } finally {
        setLoading(false);
      }
    };

    loadRateCard();
  }, [selectedCourier, selectedPlan, meta, reloadKey]);

  /* ================= MATRIX HELPERS ================= */
  const buildEmptyMatrix = (zones) =>
    zones.map((from) =>
      zones.map((to) => ({
        fromZone: from,
        toZone: to,
        price: "",
      }))
    );

  const buildMatrix = (zones, rates) =>
    zones.map((from) =>
      zones.map((to) => {
        const cell = rates.find(
          (r) => r.fromZone === from && r.toZone === to
        );
        return {
          fromZone: from,
          toZone: to,
          price: cell?.price ?? "",
        };
      })
    );

  const updateCell = (i, j, value) => {
    const copy = [...matrix];
    copy[i][j].price = value;
    setMatrix(copy);
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    const rates = matrix.flat().map((c) => ({
      fromZone: c.fromZone,
      toZone: c.toZone,
      price: Number(c.price),
    }));

    const slabProblem = pkgSlabProblem(overheadCharges) || odaBandProblem(overheadCharges);
    if (slabProblem) {
      Notification(slabProblem, "error");
      return;
    }
    // a charge saved with another type must be checked first: saving re-prices it with its row's type
    const unchecked = Object.keys(savedAs).filter((k) => !checkedTypes.includes(k));
    if (unchecked.length) {
      Notification(
        `Check these charges first (they were saved with another type): ${unchecked.map(labelOf).join(", ")}. Tick "Checked" on each.`,
        "error"
      );
      return;
    }
    const overheadsToSave = withFixedTypes(overheadCharges);
    // delivery charge: only for the places listed; a charge with no place would never apply
    const dc = overheadsToSave.deliveryCharge || {};
    if ((Number(dc.value || 0) > 0 || Number(dc.min || 0) > 0) && !placesOf(dc.places).length) {
      Notification("Delivery Charges: add at least one city, state or zone it applies to (or set it to 0).", "error");
      return;
    }

    try {
      setLoading(true);
      if (mode === "create") {
        await createRateCard({
          courierService: selectedCourier,
          plan: selectedPlan,
          rates,
          overheadCharges: overheadsToSave,
          status,
        });
        Notification("Rate card created", "success");
      } else {
        await updateRateCard(rateCard._id, { rates, overheadCharges: overheadsToSave, status });
        Notification("Rate card updated", "success");
      }

      const res = await getRateCard(selectedCourier, selectedPlan);
      setRateCard(res.data);
      // show what was actually saved (numbers, slabs sorted)
      showOverheads(withMinFreightMoved({ ...defaultOverheadCharges, ...(res.data?.overheadCharges || {}) }));
      setMatrix(buildMatrix(zonesFor(meta, selectedCourier), res.data.rates));
      setMode("view");
      loadDefaultPlan(); // a new / (de)activated card can make the default plan usable or not
    } catch (err) {
      Notification(err?.response?.data?.message || "Failed to save rate card", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteRateCard(rateCard._id);
      Notification("Rate card deleted", "success");
      setMatrix(buildEmptyMatrix(zonesFor(meta, selectedCourier)));
      setRateCard(null);
      setMode("create");
      loadDefaultPlan();
    } catch {
      Notification("Delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!meta || loading) return <Loader />;

  // the zones of the selected service's courier zone matrix (each courier may use its own)
  const zones = zonesFor(meta, selectedCourier);
  const zoneMatrixName = matrixNameFor(meta, selectedCourier);

  /* ================= DROPDOWN OPTIONS ================= */
  const planOptions = meta.plans.map((p) => ({
    label: p.name,
    value: p._id,
  }));
  const selectedPlanName = planOptions.find((p) => p.value === selectedPlan)?.label || "";
  // the dropdown marks the default plan (labels above stay plain: they are also used as the plan's name)
  const planDropdownOptions = planOptions.map((p) => ({ ...p, label: p.label === defaultPlan ? `${p.label} ★ Default` : p.label }));

  const courierOptions = meta.couriers.map((c) => ({
    label: c.name,
    value: c._id,
  }));

  const statusOptions = meta.statuses.map((s) => ({
    label: s,
    value: s,
  }));

  return (
    <div className="sm:p-2 p-1 space-y-2">
      {/* ================= TOP BAR ================= */}
      <div className="flex justify-between sm:flex-row flex-col gap-2">
        <div className="flex gap-2 sm:flex-row flex-row">
          <CustomDropdown
            options={planDropdownOptions}
            value={selectedPlan}
            onChange={setSelectedPlan}
          />
          {/* Default B2B plan for new sellers */}
          {selectedPlanName && (selectedPlanName === defaultPlan ? (
            <span
              title="Every newly registered seller gets this B2B plan"
              className="inline-flex items-center px-3 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 sm:text-[12px] text-[10px] font-bold whitespace-nowrap"
            >
              ★ Default for new sellers
            </span>
          ) : (
            <button
              className={`border border-gray-300 bg-white text-gray-700 sm:text-[12px] text-[10px] font-bold hover:border-amber-300 hover:text-amber-700 px-3 h-9 rounded-lg transition-all whitespace-nowrap ${settingDefault ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleSetDefaultPlan(selectedPlanName)}
              disabled={settingDefault}
              title={`Give every newly registered seller the "${selectedPlanName}" B2B plan`}
            >
              {settingDefault ? "Saving…" : "☆ Set as default"}
            </button>
          ))}

          <CustomDropdown
            options={courierOptions}
            value={selectedCourier}
            onChange={setSelectedCourier}
          />

          <CustomDropdown
            options={statusOptions}
            value={status}
            onChange={setStatus}
            disabled={mode === "view"}
          />
        </div>

        <div className="flex justify-end gap-2">
          {mode === "view" && rateCard && (
            <>
              <button
                onClick={() => setMode("edit")}
                className="bg-brand-primary text-white px-3 py-2 text-[12px] font-[600] rounded-lg
             flex items-center justify-center gap-2"
              >
                <FiEdit className="text-[14px]" />
                <span>Edit</span>
              </button>

              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-3 py-2 text-[12px] font-[600] rounded-lg
             flex items-center justify-center gap-2"
              >
                <FiTrash2 className="text-[14px]" />
                <span>Delete</span>
              </button>

            </>
          )}

          {(mode === "create" || mode === "edit") && (
            <button
              onClick={handleSave}
              className="bg-brand-primary text-white px-3 py-2 font-[600] text-[12px] rounded-lg
             flex items-center justify-center gap-2"
            >
              <FiPlus className="text-[14px]" />
              <span>Save</span>
            </button>
          )}

          {mode !== "edit" && (
            <button
              onClick={() => setIsUploadOpen(true)}
              title="Upload zone prices from Excel (overhead charges are not changed)"
              className="border border-brand-primary text-brand-primary bg-white px-3 py-2 text-[12px] font-[600] rounded-lg flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FiUpload className="text-[14px]" />
              <span>Upload Rates</span>
            </button>
          )}

          <button
            className={`bg-brand-primary font-[600] text-[10px] sm:w-auto w-full h-9 sm:text-[12px] text-white px-3 py-2 rounded-lg`}
            onClick={openPlanForm}
          // disabled={!canAction}
          >Add Plan</button>
        </div>
      </div>

      {unusableDefault && (
        <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          The default B2B plan "{unusableDefault}" has no active rate cards, so new sellers get "{defaultPlan}" for now.
          Add or activate its rate cards, or set another plan as default.
        </p>
      )}

      {/* ================= RATE CARD TITLE ================= */}
      <div className="py-2 flex items-center">
        <p className="text-[12px] font-[600] text-gray-700">
          {planOptions.find(p => p.value === selectedPlan)?.label}
          {" – "}
          {courierOptions.find(c => c.value === selectedCourier)?.label}
          {" – "}
          <span className="text-gray-500">Per 1 KG</span>
          {zoneMatrixName && <span className="ml-2 text-gray-500">· Zones: {zoneMatrixName}</span>}
        </p>
      </div>


      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-auto bg-white">
        <table className="min-w-full text-center text-[12px] font-[600]">
          <thead className="bg-brand-primary text-white">
            <tr className="border border-brand-primary">
              <th className="p-2">Zone</th>
              {zones.map((z) => (
                <th key={z} className="p-2">
                  {z}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!zones.length ||
              !matrix?.length ||
              matrix.length !== zones.length) ? (
              <tr>
                <td
                  colSpan={zones.length + 1}
                  className="p-6 text-center text-gray-500 text-sm"
                >
                  No data found
                </td>
              </tr>
            ) : (
              zones.map((from, i) => (
                <tr key={from} className="border border-gray-300">
                  <td className="p-2 font-[600] text-gray-700">
                    {from}
                  </td>

                  {zones.map((_, j) => (
                    <td key={j} className="px-1 py-2 text-gray-500">
                      {mode === "view" ? (
                        matrix[i]?.[j]?.price ?? "-"
                      ) : (
                        <input
                          type="text"
                          className="w-12 border text-center text-[12px] focus:outline-brand-primary"
                          value={matrix[i]?.[j]?.price ?? ""}
                          onChange={(e) =>
                            updateCell(i, j, e.target.value)
                          }
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="md:hidden space-y-2">
        {matrix.length === zones.length &&
          matrix.map((row, i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-3 shadow"
            >
              <p className="text-[12px] font-[700] text-gray-700 mb-2">
                From: {zones[i]}
              </p>

              <div className="grid grid-cols-3 gap-2">
                {row.map((cell, j) => (
                  <div
                    key={j}
                    className="flex justify-between items-center border rounded px-2 py-1"
                  >
                    <span className="text-[10px] text-gray-500">
                      To {zones[j]}
                    </span>

                    {mode === "view" ? (
                      <span className="text-[12px] font-[600]">
                        {cell?.price || "-"}
                      </span>
                    ) : (
                      <input
                        className="w-12 border focus:outline-brand-primary text-center text-[12px]"
                        value={cell?.price ?? ""}
                        onChange={(e) =>
                          updateCell(i, j, e.target.value)
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

      </div>

      {overheadCharges && (
        <OverheadCharges
          data={overheadCharges}
          mode={mode}
          onChange={setOverheadCharges}
          savedAs={savedAs}
          checked={checkedTypes}
          onCheck={(key, on) => setCheckedTypes((prev) => (on ? [...new Set([...prev, key])] : prev.filter((k) => k !== key)))}
        />
      )}

      <AddPlanModal
        isOpen={isAddPlanModalOpen}
        onClose={() => setIsAddPlanModalOpen(false)}
        rateType={rateType}
      // onSuccess={refreshRates}
      setPlanNameAdd={setPlanNameAdd}
      />

      <UploadRatesModal
        key={selectedPlan}
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          // refresh only once the window is closed: the page shows a full loader while it reloads,
          // which would otherwise close the window before the result could be read
          if (uploadSaved) { setUploadSaved(false); setReloadKey((k) => k + 1); }
        }}
        planId={selectedPlan}
        planName={planOptions.find((p) => p.value === selectedPlan)?.label}
        couriers={meta.courierAccounts || []}
        onDone={() => setUploadSaved(true)}
      />

      <div className="flex justify-end">
        {(mode === "create" || mode === "edit") && (
          <button
            onClick={handleSave}
            className="bg-brand-primary text-white px-3 py-2 font-[600] text-[12px] rounded-lg
             flex items-center justify-center gap-2"
          >
            <FiPlus className="text-[14px]" />
            <span>Save</span>
          </button>
        )}
      </div>
    </div>
  );
}
