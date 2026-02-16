import { useEffect, useState } from "react";
import {
  getZones,
  addLocation,
  removeLocation,
  deleteZone,
  lookupPincode,
} from "./zoneApi";
import { FiTrash2 } from "react-icons/fi";
import { Notification } from "../../Notification";
import Loader from "../../Loader";


export default function ZoneAdmin() {
  const [zones, setZones] = useState([]);
  const [zone, setZone] = useState("");
  const [pincode, setPincode] = useState("");
  const [lookup, setLookup] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);   // initial load
  const [lookupLoading, setLookupLoading] = useState(false); // search button
  const [tableLoading, setTableLoading] = useState(false);   // table reload



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

  /* 🔍 PINCODE LOOKUP */
  const handleLookup = async () => {
    if (!pincode) {
      Notification("Please enter pincode", "info");
      return;
    }

    try {
      setLookupLoading(true);
      const res = await lookupPincode(pincode);
      if (res.data.found) {
        setLookup(res.data);
      } else {
        setLookup(null);
        Notification("Pincode not found", "error");
      }
    } catch {
      Notification("Failed to lookup pincode", "error");
    } finally {
      setLookupLoading(false);
    }
  };


  /* ➕ ADD LOCATION */
  const handleAddLocation = async (name) => {
    if (!zone || !name) {
      Notification("Zone and location required", "info");
      return;
    }

    try {
      setTableLoading(true);
      await addLocation({ zone, locations: [{ name }] });
      Notification("Location added successfully", "success");
      setLookup(null);
      setZone("");
      setPincode("");
      await loadZones();
    } catch (err) {
      Notification(err.response?.data?.message || "Failed", "error");
    } finally {
      setTableLoading(false);
    }
  };


  /* ❌ REMOVE LOCATION */
  const handleRemoveLocation = async (zoneName, name) => {
    try {
      setTableLoading(true);
      await removeLocation({ zone: zoneName, name });
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
        {lookupLoading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
            <Loader />
          </div>
        )}

        <h2 className="text-[12px] font-[600] text-gray-700 mb-2">
          Add Location to Zone
        </h2>

        <div className="flex w-full gap-2">
          <input
            className="border px-3 py-2 font-[600] text-gray-500 rounded-md w-full text-[12px] sm:w-32 focus:outline-[#0CBB7D]"
            placeholder="Zone (N1)"
            value={zone}
            onChange={(e) => setZone(e.target.value.toUpperCase())}
          />

          <input
            className="border px-3 py-2 font-[600] text-gray-500 rounded-md w-full text-[12px] sm:w-32 focus:outline-[#0CBB7D]"
            placeholder="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />

          <button
            onClick={handleLookup}
            className="bg-[#0CBB7D] font-[600] text-white px-3 py-2 rounded-lg text-[10px] sm:text-[12px]"
          >
            Search
          </button>
        </div>

        {/* LOOKUP RESULT */}
        {lookup && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-4">
            {["state", "city"].map((type) => (
              <div
                key={type}
                className="border rounded-lg flex justify-between items-center p-3 text-gray-700"
              >
                <div className="flex gap-2 justify-center items-center">
                  <p className="text-[10px] text-gray-500 font-[600] uppercase">
                    {type} :
                  </p>
                  <p className="text-[12px] text-gray-700 font-[600]">
                    {lookup[type]}
                  </p>
                </div>
                <button
                  disabled={lookupLoading}
                  onClick={() => handleAddLocation(lookup[type])}
                  className="bg-[#0CBB7D] text-white px-3 py-1 rounded font-[600] text-[10px]"
                >
                  Add {type}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block bg-white overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#0CBB7D] border border-[#0CBB7D] text-white text-[12px]">
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
                          className="flex items-center font-[600] gap-2 bg-green-100 text-[#0CBB7D] px-3 py-1 rounded-full text-[10px]"
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
                    className="flex items-center gap-2 bg-green-100 font-[600] text-[#0CBB7D] px-3 py-1 rounded-full text-[10px]"
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
