import { useEffect, useRef, useState } from "react";
import {
  getZones,
  addLocation,
  removeLocation,
  deleteZone,
  searchLocations,
} from "./zoneApi";
import { FiTrash2 } from "react-icons/fi";
import { Notification } from "../../Notification";
import Loader from "../../Loader";


export default function ZoneAdmin() {
  const [zones, setZones] = useState([]);
  const [zone, setZone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingName, setAddingName] = useState(null); // which suggestion is being added right now
  const [tableLoading, setTableLoading] = useState(false);   // table reload
  const searchBoxRef = useRef(null);


  const loadZones = async () => {
    try {
      setTableLoading(true);
      const res = await getZones();
      setZones(res.data);
    } catch {
      Notification("Failed to load zones", "error");
    } finally {
      setTableLoading(false);
    }
  };


  useEffect(() => {
    loadZones();
  }, []);

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

  /* ➕ ADD LOCATION — adds immediately on click, no staging/batch step */
  const handleAddLocation = async (name) => {
    if (!zone || !name) {
      Notification("Zone and location required", "info");
      return;
    }

    try {
      setAddingName(name);
      setTableLoading(true);
      await addLocation({ zone: zone.trim().toUpperCase(), locations: [{ name }] });
      Notification("Location added successfully", "success");
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      await loadZones();
    } catch (err) {
      Notification(err.response?.data?.message || "Failed", "error");
    } finally {
      setAddingName(null);
      setTableLoading(false);
    }
  };

  /* ❌ REMOVE LOCATION (from an already-created zone, in the table below) */
  const handleRemoveLocation = async (zoneNameArg, name) => {
    try {
      setTableLoading(true);
      await removeLocation({ zone: zoneNameArg, name });
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
    } catch (err) {
      Notification("Failed to delete zone", "error");
    } finally {
      setTableLoading(false);
    }
  };

  return (
    <div className="sm:p-2 px-1 space-y-4 relative">

      {/* ================= ADD SECTION ================= */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h2 className="text-[12px] font-[600] text-gray-700 mb-2">
          Add Location to Zone
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
                      disabled={addingName === s.name}
                      onClick={() => handleAddLocation(s.name)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-brand-primary/8 border-b last:border-0 disabled:opacity-50"
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
                      <span className="text-brand-primary text-[10px] font-[600] shrink-0">
                        {addingName === s.name ? "Adding..." : "+ Add"}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-400 text-[11px] italic text-center py-3">No matches found</p>
                )}
              </div>
            )}
          </div>
        </div>
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
            <tr>
              <td colSpan={3} className="py-10 text-center">
                <Loader />
              </td>
            </tr>
          ) : (
            <tbody>
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
    </div>
  );
}
