import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import AddModal from './AddEPD';
import EditModal from './EditEPD';
import DeleteModal from './DeleteEPD';
import { getCarrierLogo } from '../../../Common/getCarrierLogo';
import { Search } from 'lucide-react';
import NotFound from "../../../assets/nodatafound.png";

const EPDMapping = () => {
  const [data, setData] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    axios.get(`${REACT_APP_BACKEND_URL}/EPD/maps`).then(res => setData(res.data));
  }, []);

  const formatTo12H = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    let h = parseInt(hours, 10);
    const m = minutes;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  const reload = () => axios.get(`${REACT_APP_BACKEND_URL}/EPD/maps`).then(res => setData(res.data));

  return (
    <section className="w-full mx-auto sm:px-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <h1 className="text-[12px] sm:text-[14px] text-gray-700 font-[600]">Estimate Pickup Date</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 flex-1 sm:w-64 border border-gray-300 rounded-lg focus-within:border-[#0CBB7D] group shadow-sm bg-white transition-all h-9">
            <Search className="w-3.5 h-3.5 text-gray-400 group-focus-within:text-[#0CBB7D] transition-colors" />
            <input
              type="text"
              placeholder="Search Courier Service..."
              className="w-full text-[10px] sm:text-[12px] focus:outline-none border-none p-0 bg-transparent text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-2 text-[10px] sm:text-[12px] font-[600] bg-[#0CBB7D] text-white rounded-lg hover:bg-opacity-90 transition shadow-sm whitespace-nowrap h-9"
          >
            Add Cutoff Time
          </button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden sm:block bg-white">
        <div className="h-[calc(100vh-130px)] overflow-y-auto">
          <table className="min-w-full bg-white divide-y text-[12px] divide-gray-200">
            <thead className="bg-[#0CBB7D] text-white font-[600] sticky top-0 z-10">
              <tr>
                {["Courier", "Courier Service", "Cutoff Time (IST)", "Actions"].map(header => (
                  <th
                    key={header}
                    className="px-3 py-2 text-left text-[12px] font-[600] tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.filter(item =>
                item?.courier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item?.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map(item => (
                <tr key={item._id} className="text-gray-700 hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap flex items-center gap-2">
                    {getCarrierLogo(item?.courier) && (
                      <img src={getCarrierLogo(item.courier)} alt={item.courier} className="w-7 h-7 rounded-md border" />
                    )}
                    {item?.courier}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{item?.serviceName}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-[#0CBB7D]">{formatTo12H(item?.cutoffTime)}</td>
                  <td className="px-3 py-2 whitespace-nowrap flex space-x-2">
                    <button
                      onClick={() => setEditItem(item)}
                      className="p-1 text-white hover:text-gray-100 hover:bg-green-500 rounded-full bg-[#0CBB7D] transition"
                      aria-label="Edit"
                      title="Edit"
                    >
                      <AiOutlineEdit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteItem(item)}
                      className="p-1 text-red-600 bg-red-100 rounded-full hover:text-red-700 hover:bg-red-200 transition"
                      aria-label="Delete"
                      title="Delete"
                    >
                      <AiOutlineDelete size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {data.filter(item =>
                item?.courier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item?.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <img
                          src={NotFound}
                          alt="No Data Found"
                          className="w-60 h-60 object-contain"
                        />
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="block sm:hidden w-full">
        <div className="h-[calc(100vh-150px)] overflow-y-auto space-y-2">
          {data.filter(item =>
            item?.courier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item?.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map(item => (
            <div key={item._id} className="bg-white rounded-lg shadow p-3 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCarrierLogo(item?.courier) && (
                    <img src={getCarrierLogo(item.courier)} alt={item.courier} className="w-8 h-8 rounded-md border" />
                  )}
                  <div>
                    <div className="font-[600] text-gray-700 text-[12px]">{item.courier}</div>
                    <div className="text-[12px] text-gray-500">{item.serviceName}</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditItem(item)}
                    className="p-1 rounded-full bg-[#0CBB7D] text-white hover:bg-green-500 transition"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <AiOutlineEdit size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteItem(item)}
                    className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <AiOutlineDelete size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-[12px] text-gray-500 font-[600]">Cutoff Time:</div>
                <div className="font-[600] text-[#0CBB7D] text-[12px]">{formatTo12H(item.cutoffTime)}</div>
              </div>
            </div>
          ))}
          {data.filter(item =>
            item?.courier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item?.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 && (
              <div className="py-10 flex flex-col items-center justify-center bg-white rounded-lg border">
                <img
                  src={NotFound}
                  alt="No Data Found"
                  className="w-60 h-60 object-contain"
                />
              </div>
            )}
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddModal show={showAdd} onClose={() => { setShowAdd(false); reload(); }} existingData={data} />
      )}
      {editItem && (
        <EditModal item={editItem} onClose={() => { setEditItem(null); reload(); }} />
      )}
      {deleteItem && (
        <DeleteModal item={deleteItem} onClose={() => { setDeleteItem(null); reload(); }} />
      )}
    </section>
  );
};

export default EPDMapping;
