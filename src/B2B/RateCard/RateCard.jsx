import { useEffect, useState } from "react";
import {
  getMeta,
  getRateCard,
  createRateCard,
  updateRateCard,
  deleteRateCard,
} from "./rateCardApi";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import Loader from "../../Loader";
import { Notification } from "../../Notification";
import CustomDropdown from "./CustomDropdown";
import OverheadCharges from "./OverheadCharges";
import AddPlanModal from "../../components/RateCard/AddPlanModal";

export default function RateCardAdmin() {
  const [meta, setMeta] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [status, setStatus] = useState("active");
  const [overheadCharges, setOverheadCharges] = useState(null);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const rateType = "b2b";

  const [rateCard, setRateCard] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [mode, setMode] = useState("view");
  const [loading, setLoading] = useState(false);
  const [isPlanNameAdd, setPlanNameAdd] = useState(false);

  const openPlanForm = () => setIsAddPlanModalOpen(true);

  const defaultOverheadCharges = {
    pickupCharge: { type: "percentage", value: 4, min: 0 },

    handlingCharge: { type: "flat", value: 0 },

    codCharges: { type: "percentage", value: 0, min: 0 },

    fodCharges: { type: "flat", value: 0 },

    rovOwner: { type: "percentage", value: 0, min: 70 },

    rovCarrier: { type: "percentage", value: 0, min: 50 },

    odaCharges: { type: "perKg", value: 10, min: 1000 },

    fuelCharge: { type: "percentage", value: 20 },

    docketCharge: { type: "flat", value: 0 },

    appointmentDelivery: { type: "flat", value: 0 },

    greenTax: { type: "flat", value: 0 },

    divisor: { type: "formula", value: 4500 },

    minimumFreight: { type: "flat", value: 220 },

    gst: { type: "percentage", value: 18 },
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
          setOverheadCharges(res.data.overheadCharges);
          setMatrix(buildMatrix(meta.zones, res.data.rates));
          setMode("view");
        } else {
          setRateCard(null);
          setOverheadCharges(defaultOverheadCharges);
          setMatrix(buildEmptyMatrix(meta.zones));
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
  }, [selectedCourier, selectedPlan, meta]);

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

    try {
      setLoading(true);
      if (mode === "create") {
        await createRateCard({
          courierService: selectedCourier,
          plan: selectedPlan,
          rates,
          overheadCharges,
          status,
        });
        Notification("Rate card created", "success");
      } else {
        await updateRateCard(rateCard._id, { rates, overheadCharges, status });
        Notification("Rate card updated", "success");
      }

      const res = await getRateCard(selectedCourier, selectedPlan);
      setRateCard(res.data);
      setMatrix(buildMatrix(meta.zones, res.data.rates));
      setMode("view");
    } catch {
      Notification("Failed to save rate card", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteRateCard(rateCard._id);
      Notification("Rate card deleted", "success");
      setMatrix(buildEmptyMatrix(meta.zones));
      setRateCard(null);
      setMode("create");
    } catch {
      Notification("Delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!meta || loading) return <Loader />;

  /* ================= DROPDOWN OPTIONS ================= */
  const planOptions = meta.plans.map((p) => ({
    label: p.name,
    value: p._id,
  }));

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
            options={planOptions}
            value={selectedPlan}
            onChange={setSelectedPlan}
          />

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
                className="bg-[#0CBB7D] text-white px-3 py-2 text-[12px] font-[600] rounded-lg
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
              className="bg-[#0CBB7D] text-white px-3 py-2 font-[600] text-[12px] rounded-lg
             flex items-center justify-center gap-2"
            >
              <FiPlus className="text-[14px]" />
              <span>Save</span>
            </button>
          )}

          <button
            className={`bg-[#0CBB7D] font-[600] text-[10px] sm:w-auto w-full h-9 sm:text-[12px] text-white px-3 py-2 rounded-lg`}
            onClick={openPlanForm}
          // disabled={!canAction}
          >Add Plan</button>
        </div>
      </div>

      {/* ================= RATE CARD TITLE ================= */}
      <div className="py-2 flex items-center">
        <p className="text-[12px] font-[600] text-gray-700">
          {planOptions.find(p => p.value === selectedPlan)?.label}
          {" – "}
          {courierOptions.find(c => c.value === selectedCourier)?.label}
          {" – "}
          <span className="text-gray-500">Per 1 KG</span>
        </p>
      </div>


      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-auto bg-white">
        <table className="min-w-full text-center text-[12px] font-[600]">
          <thead className="bg-[#0CBB7D] text-white">
            <tr className="border border-[#0CBB7D]">
              <th className="p-2">Zone</th>
              {meta.zones.map((z) => (
                <th key={z} className="p-2">
                  {z}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!meta?.zones?.length ||
              !matrix?.length ||
              matrix.length !== meta.zones.length) ? (
              <tr>
                <td
                  colSpan={meta?.zones?.length + 1 || 1}
                  className="p-6 text-center text-gray-500 text-sm"
                >
                  No data found
                </td>
              </tr>
            ) : (
              meta.zones.map((from, i) => (
                <tr key={from} className="border border-gray-300">
                  <td className="p-2 font-[600] text-gray-700">
                    {from}
                  </td>

                  {meta.zones.map((_, j) => (
                    <td key={j} className="px-1 py-2 text-gray-500">
                      {mode === "view" ? (
                        matrix[i]?.[j]?.price ?? "-"
                      ) : (
                        <input
                          type="text"
                          className="w-12 border text-center text-[12px] focus:outline-[#0CBB7D]"
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
        {matrix.length === meta.zones.length &&
          matrix.map((row, i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-3 shadow"
            >
              <p className="text-[12px] font-[700] text-gray-700 mb-2">
                From: {meta.zones[i]}
              </p>

              <div className="grid grid-cols-3 gap-2">
                {row.map((cell, j) => (
                  <div
                    key={j}
                    className="flex justify-between items-center border rounded px-2 py-1"
                  >
                    <span className="text-[10px] text-gray-500">
                      To {meta.zones[j]}
                    </span>

                    {mode === "view" ? (
                      <span className="text-[12px] font-[600]">
                        {cell?.price || "-"}
                      </span>
                    ) : (
                      <input
                        className="w-12 border focus:outline-[#0CBB7D] text-center text-[12px]"
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
        />
      )}

      <AddPlanModal
        isOpen={isAddPlanModalOpen}
        onClose={() => setIsAddPlanModalOpen(false)}
        rateType={rateType}
      // onSuccess={refreshRates}
      setPlanNameAdd={setPlanNameAdd}
      />

      <div className="flex justify-end">
        {(mode === "create" || mode === "edit") && (
          <button
            onClick={handleSave}
            className="bg-[#0CBB7D] text-white px-3 py-2 font-[600] text-[12px] rounded-lg
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
