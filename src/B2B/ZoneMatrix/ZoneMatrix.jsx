import { useEffect, useRef, useState } from "react";
import {
  getZones,
  addLocation,
  removeLocation,
  deleteZone,
  searchLocations,
  getMatrices,
  createMatrix,
  renameMatrix,
  deleteMatrix,
  assignMatrix,
} from "./zoneApi";
import { FiTrash2, FiPlus, FiEdit } from "react-icons/fi";
import { Notification } from "../../Notification";
import Loader from "../../Loader";

// Each B2B courier prices with one zone matrix (a named set of zones). The Default matrix holds the zones made
// before matrices existed and is used by every courier until it is assigned another.
export default function ZoneAdmin() {
  const [matrices, setMatrices] = useState([]); // [{ _id, name, isDefault, zoneCount, couriers }]
  const [couriers, setCouriers] = useState([]); // [{ _id, courierName, courierProvider, status, zoneMatrixId }]
  const [matrixId, setMatrixId] = useState("");
  const [zones, setZones] = useState([]);
  const [zone, setZone] = useState("");

  // Locations picked for the zone currently being built — nothing is sent
  // to the backend until "Submit" is clicked, so you can search and add
  // several cities/states first and save them all in one go.
  const [staged, setStaged] = useState([]); // [{ name, label, detail }]

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tableLoading, setTableLoading] = useState(false); // table reload
  const searchBoxRef = useRef(null);

  // zone matrix management
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [copyFrom, setCopyFrom] = useState("");
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(null); // the new name being typed
  const [assigningId, setAssigningId] = useState(null);
  const [ratesToUpdate, setRatesToUpdate] = useState(null); // { courier, matrix, cards }

  const current = matrices.find((m) => m._id === matrixId);
  const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

  const loadMatrices = async (select) => {
    try {
      const res = await getMatrices();
      const list = res.data?.matrices || [];
      setMatrices(list);
      setCouriers(res.data?.couriers || []);
      setMatrixId((prev) => {
        if (select && list.some((m) => m._id === select)) return select;
        if (list.some((m) => m._id === prev)) return prev;
        return (list.find((m) => m.isDefault) || list[0])?._id || "";
      });
    } catch (err) {
      Notification(errMsg(err, "Failed to load zone matrices"), "error");
    }
  };

  const loadZones = async (id = matrixId) => {
    if (!id) return;
    try {
      setTableLoading(true);
      const res = await getZones(id);
      setZones(Array.isArray(res.data) ? res.data : []);
    } catch {
      Notification("Failed to load zones", "error");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    loadMatrices();
  }, []);

  useEffect(() => {
    if (!matrixId) return;
    setZone("");
    setStaged([]);
    loadZones(matrixId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrixId]);

  /* 🔍 DEBOUNCED SEARCH — by city, state, or pincode, whichever it looks like */
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await searchLocations(q);
        setSuggestions(res.data?.results || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close the suggestion dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ➕ STAGE a suggestion (local only — not sent to the backend yet) */
  const handleStage = (suggestion) => {
    setStaged((prev) => {
      if (prev.some((s) => s.name.toLowerCase() === suggestion.name.toLowerCase())) {
        Notification(`"${suggestion.name}" is already added`, "info");
        return prev;
      }
      return [...prev, suggestion];
    });
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleUnstage = (name) => {
    setStaged((prev) => prev.filter((s) => s.name !== name));
  };

  /* ✅ SUBMIT — one call with every staged location, added to the zone (existing or new) of this matrix */
  const handleSubmit = async () => {
    if (!zone.trim()) {
      Notification("Zone is required", "info");
      return;
    }
    if (staged.length === 0) {
      Notification("Add at least one city or state first", "info");
      return;
    }

    try {
      setSubmitting(true);
      await addLocation({
        matrixId,
        zone: zone.trim().toUpperCase(),
        locations: staged.map((s) => ({ name: s.name })),
      });
      Notification("Locations added successfully", "success");
      setZone("");
      setStaged([]);
      setSearchQuery("");
      await Promise.all([loadZones(), loadMatrices()]);
    } catch (err) {
      Notification(err.response?.data?.message || "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ❌ REMOVE LOCATION (from an already-created zone, in the table below) */
  const handleRemoveLocation = async (zoneNameArg, name) => {
    try {
      setTableLoading(true);
      await removeLocation({ matrixId, zone: zoneNameArg, name });
      Notification("Location removed successfully", "success");
      loadZones();
    } catch (err) {
      Notification("Failed to remove location", "error");
    } finally {
      setTableLoading(false);
    }
  };

  /* 🗑 DELETE ZONE */
  const handleDeleteZone = async (id) => {
    try {
      setTableLoading(true);
      await deleteZone(id);
      Notification("Zone deleted successfully", "success");
      loadZones();
      loadMatrices();
    } catch (err) {
      Notification("Failed to delete zone", "error");
    } finally {
      setTableLoading(false);
    }
  };

  /* zone matrices */
  const handleCreateMatrix = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      setCreating(true);
      const res = await createMatrix({ name, ...(copyFrom ? { copyFromId: copyFrom } : {}) });
      const copied = res.data?.copiedZones || 0;
      Notification(copied ? `Zone matrix "${name}" created with ${copied} zones copied` : `Zone matrix "${name}" created`, "success");
      setShowNew(false);
      setNewName("");
      setCopyFrom("");
      await loadMatrices(res.data?.matrix?._id);
    } catch (err) {
      Notification(errMsg(err, "Failed to create zone matrix"), "error");
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async () => {
    const name = (renaming || "").trim();
    if (!current || !name || name === current.name) {
      setRenaming(null);
      return;
    }
    try {
      await renameMatrix(current._id, name);
      Notification("Zone matrix renamed", "success");
      setRenaming(null);
      await loadMatrices();
    } catch (err) {
      Notification(errMsg(err, "Failed to rename zone matrix"), "error");
    }
  };

  const handleDeleteMatrix = async () => {
    if (!current) return;
    if (current.couriers.length) {
      Notification(`Assign another zone matrix to ${current.couriers.map((c) => c.courierName).join(", ")} first`, "info");
      return;
    }
    if (!window.confirm(`Delete the zone matrix "${current.name}" and all its zones?`)) return;
    try {
      await deleteMatrix(current._id);
      Notification(`Zone matrix "${current.name}" deleted`, "success");
      await loadMatrices(matrices.find((m) => m.isDefault)?._id);
    } catch (err) {
      Notification(errMsg(err, "Failed to delete zone matrix"), "error");
    }
  };

  const handleAssign = async (courier, toMatrix) => {
    if (courier.zoneMatrixId === toMatrix) return;
    try {
      setAssigningId(courier._id);
      const res = await assignMatrix(courier._id, toMatrix);
      const target = matrices.find((m) => m._id === toMatrix)?.name || "";
      const cards = res.data?.ratesToUpdate || [];
      Notification(`${courier.courierName} now uses the zone matrix "${target}"`, cards.length ? "info" : "success");
      setRatesToUpdate(cards.length ? { courier: courier.courierName, matrix: target, cards } : null);
      await loadMatrices();
    } catch (err) {
      Notification(errMsg(err, "Failed to assign zone matrix"), "error");
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="sm:p-2 px-1 space-y-4 relative">

      {/* ================= ZONE MATRIX ================= */}
      <div className="bg-white rounded-lg p-4 shadow space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-[12px] font-[600] text-gray-700 shrink-0">Zone matrix</label>
          <select
            value={matrixId}
            onChange={(e) => setMatrixId(e.target.value)}
            className="border px-3 py-2 font-[600] text-gray-600 rounded-md text-[12px] focus:outline-brand-primary sm:w-72"
          >
            {matrices.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}{m.isDefault ? " (default)" : ""} · {m.zoneCount} zone{m.zoneCount === 1 ? "" : "s"}
              </option>
            ))}
          </select>

          {current && renaming === null && !current.isDefault && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRenaming(current.name)}
                className="border border-brand-primary text-brand-primary px-3 py-2 rounded-lg text-[12px] font-[600] flex items-center gap-1"
              >
                <FiEdit /> Rename
              </button>
              <button
                type="button"
                onClick={handleDeleteMatrix}
                className="border border-red-300 text-red-600 px-3 py-2 rounded-lg text-[12px] font-[600] flex items-center gap-1"
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          )}
          {renaming !== null && (
            <div className="flex gap-2">
              <input
                autoFocus
                value={renaming}
                onChange={(e) => setRenaming(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(null); }}
                maxLength={60}
                className="border px-3 py-2 font-[600] text-gray-600 rounded-md text-[12px] focus:outline-brand-primary"
              />
              <button type="button" onClick={handleRename} className="bg-brand-primary text-white px-3 py-2 rounded-lg text-[12px] font-[600]">Save</button>
              <button type="button" onClick={() => setRenaming(null)} className="border px-3 py-2 rounded-lg text-[12px] font-[600] text-gray-600">Cancel</button>
            </div>
          )}

          <button
            type="button"
            onClick={() => { setShowNew(true); setCopyFrom(""); }}
            className="sm:ml-auto bg-brand-primary text-white px-3 py-2 rounded-lg text-[12px] font-[600] flex items-center justify-center gap-1"
          >
            <FiPlus /> New zone matrix
          </button>
        </div>
        {current && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
            <span className="font-[600] text-gray-700">Used by:</span>
            {current.couriers.length ? current.couriers.map((c) => (
              <span key={c._id} className="bg-brand-primary/12 text-brand-primary font-[600] px-2 py-0.5 rounded-full">{c.courierName}</span>
            )) : <span>no courier yet — assign it below</span>}
          </div>
        )}
      </div>

      {/* ================= ADD SECTION ================= */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h2 className="text-[12px] font-[600] text-gray-700 mb-2">
          Add Location to Zone{current ? ` — ${current.name}` : ""}
        </h2>

        <div className="flex flex-col sm:flex-row w-full gap-2">
          <input
            className="border px-3 py-2 font-[600] text-gray-500 rounded-md w-full sm:w-40 text-[12px] focus:outline-brand-primary"
            placeholder="Zone (N1)"
            value={zone}
            onChange={(e) => setZone(e.target.value.toUpperCase())}
          />

          {/* Search box + suggestion dropdown — type a city, state, or pincode */}
          <div className="relative w-full sm:max-w-xs" ref={searchBoxRef}>
            <input
              className="border px-3 py-2 font-[600] text-gray-500 rounded-md w-full text-[12px] focus:outline-brand-primary"
              placeholder="Search city, state or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />

            {showSuggestions && (
              <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader />
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((s, i) => (
                    <button
                      key={`${s.label}-${s.name}-${i}`}
                      type="button"
                      onClick={() => handleStage(s)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-brand-primary/8 border-b last:border-0"
                    >
                      <div className="min-w-0">
                        <span className="text-[9px] font-[600] uppercase text-brand-primary bg-brand-primary/16 rounded px-1.5 py-0.5 mr-2">
                          {s.label}
                        </span>
                        <span className="text-[12px] font-[600] text-gray-700">{s.name}</span>
                        {s.detail && (
                          <span className="text-[10px] text-gray-400 ml-1">({s.detail})</span>
                        )}
                      </div>
                      <span className="text-brand-primary text-[10px] font-[600] shrink-0">+ Add</span>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-400 text-[11px] italic text-center py-3">No matches found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* STAGED LOCATIONS — nothing saved yet, click Submit to save them all */}
        {staged.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-[600] text-gray-500 mb-1">
              Locations to add ({staged.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {staged.map((s) => (
                <span
                  key={s.name}
                  className="flex items-center font-[600] gap-2 bg-brand-primary/12 text-brand-primary px-3 py-1 rounded-full text-[10px]"
                >
                  {s.name}
                  <button
                    type="button"
                    onClick={() => handleUnstage(s.name)}
                    className="text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={submitting || !matrixId}
          onClick={handleSubmit}
          className="mt-3 bg-brand-primary font-[600] text-white px-4 py-2 rounded-lg text-[12px] disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block bg-white overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-brand-primary border border-brand-primary text-white text-[12px]">
            <tr>
              <th className="px-3 py-2">Zone</th>
              <th className="px-3 py-2">Cities / States</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>

          {tableLoading ? (
            <tbody>
              <tr>
                <td colSpan={3} className="py-10 text-center">
                  <Loader />
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {zones.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[12px] text-gray-400">No zones in this zone matrix yet</td>
                </tr>
              )}
              {zones.map((z) => (
                <tr
                  key={z._id}
                  className="border hover:bg-gray-50"
                >
                  <td className="px-3 py-2 text-[12px] font-[600] text-gray-700" style={{ maxWidth: "300px", width: "200px" }}>
                    {z.zone}
                  </td>

                  <td className="px-3 py-2" style={{ maxWidth: "1200px", width: "1000px" }}>
                    <div className="flex flex-wrap gap-2">
                      {z.locations.map((l, i) => (
                        <span
                          key={i}
                          className="flex items-center font-[600] gap-2 bg-brand-primary/12 text-brand-primary px-3 py-1 rounded-full text-[10px]"
                        >
                          {l.name}
                          <button
                            onClick={() =>
                              handleRemoveLocation(z.zone, l.name)
                            }
                            className="text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-3 py-2 text-right" style={{ maxWidth: "300px", width: "200px" }}>
                    <button
                      onClick={() => handleDeleteZone(z._id)}
                      className="text-red-600 bg-red-100 hover:bg-red-200 p-2 rounded-full text-[12px]"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="md:hidden space-y-4">
        {tableLoading ? (
          <div className="py-10 flex justify-center">
            <Loader />
          </div>
        ) : zones.length === 0 ? (
          <p className="text-center text-[12px] text-gray-400 py-6">No zones in this zone matrix yet</p>
        ) : (
          zones.map((z) => (
            <div
              key={z._id}
              className="bg-white rounded-lg shadow p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-[12px] font-[600] text-gray-700">
                  Zone: {z.zone}
                </p>
                <button
                  onClick={() => handleDeleteZone(z._id)}
                  className="text-red-600 bg-red-100 hover:bg-red-200 p-2 rounded-full text-[12px]"
                >
                  <FiTrash2 />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {z.locations.map((l, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-2 bg-brand-primary/12 font-[600] text-brand-primary px-3 py-1 rounded-full text-[10px]"
                  >
                    {l.name}
                    <button
                      onClick={() =>
                        handleRemoveLocation(z.zone, l.name)
                      }
                      className="text-red-500 font-[600]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= COURIER ZONE MATRICES ================= */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b">
          <h2 className="text-[12px] font-[600] text-gray-700">Courier zone matrices</h2>
          <p className="text-[11px] text-gray-500">Each courier prices B2B shipments with the zones of its zone matrix. Several couriers can share one.</p>
        </div>
        {couriers.length === 0 ? (
          <p className="px-4 py-3 text-[12px] text-gray-400">No B2B couriers yet — add them under Couriers first.</p>
        ) : (
          <div className="divide-y">
            {couriers.map((c) => (
              <div key={c._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2">
                <div>
                  <p className="text-[12px] font-[600] text-gray-700">{c.courierName}</p>
                  <p className="text-[10px] text-gray-400">{c.courierProvider}{c.status && c.status !== "Enable" ? " · disabled" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {assigningId === c._id && <span className="text-[10px] text-gray-400">Saving…</span>}
                  <select
                    value={c.zoneMatrixId || ""}
                    disabled={assigningId !== null}
                    onChange={(e) => handleAssign(c, e.target.value)}
                    className="border px-3 py-2 font-[600] text-gray-600 rounded-md text-[12px] focus:outline-brand-primary disabled:opacity-50"
                    aria-label={`Zone matrix of ${c.courierName}`}
                  >
                    {matrices.map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ratesToUpdate && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] font-[600] text-amber-800">
              {ratesToUpdate.courier} now uses "{ratesToUpdate.matrix}". These rate cards have prices for zones that matrix does not have — update them in the B2B Rate Card (or with Upload Rates):
            </p>
            <button type="button" onClick={() => setRatesToUpdate(null)} className="text-amber-700 font-[600]">×</button>
          </div>
          <ul className="mt-1 text-[11px] text-amber-800 list-disc pl-4">
            {ratesToUpdate.cards.map((c, i) => <li key={i}>{c.plan} · {c.service}: {c.missing.join(", ")}</li>)}
          </ul>
        </div>
      )}

      {/* ================= NEW ZONE MATRIX ================= */}
      {showNew && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/40" onClick={() => !creating && setShowNew(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-[600] text-brand-primary">New zone matrix</h3>
              <button type="button" onClick={() => !creating && setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-[18px]">×</button>
            </div>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateMatrix()}
              maxLength={60}
              placeholder="Name, e.g. Gati zones"
              className="border px-3 py-2 font-[600] text-gray-600 rounded-md w-full text-[12px] focus:outline-brand-primary"
            />
            <p className="text-[12px] font-[600] text-gray-700 mt-3 mb-1">Start with</p>
            <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer">
              <input type="radio" checked={!copyFrom} onChange={() => setCopyFrom("")} className="accent-brand-primary" /> An empty zone matrix
            </label>
            <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer mt-1">
              <input type="radio" checked={!!copyFrom} onChange={() => setCopyFrom(current?._id || matrices[0]?._id || "")} className="accent-brand-primary" /> A copy of
            </label>
            {!!copyFrom && (
              <select
                value={copyFrom}
                onChange={(e) => setCopyFrom(e.target.value)}
                className="mt-2 border px-3 py-2 font-[600] text-gray-600 rounded-md w-full text-[12px] focus:outline-brand-primary"
              >
                {matrices.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} · {m.zoneCount} zones</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={handleCreateMatrix}
              disabled={creating || !newName.trim()}
              className="mt-4 w-full bg-brand-primary text-white px-3 py-2 rounded-lg text-[12px] font-[600] disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create zone matrix"}
            </button>
            <p className="text-[10px] text-gray-400 mt-2">Then assign it to couriers under "Courier zone matrices".</p>
          </div>
        </div>
      )}
    </div>
  );
}
