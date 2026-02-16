import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import AddModal from './AddEDD';
import EditModal from './EditEDD';
import DeleteModal from './DeleteEDD';
import Amazon from "../../../assets/amazon.jpg";
import ShreeMaruti from "../../../assets/shreemaruti.png";
import Smartship from "../../../assets/bluedart.png";
import DTDC from "../../../assets/dtdc.png";
import Delehivery from "../../../assets/delehivery.png";

// Courier logo mapping (add more as needed)
const courierImages = {
  "Amazon Shipping": Amazon,
  Amazon:Amazon,
  "Shree Maruti": ShreeMaruti,
  ShreeMaruti:ShreeMaruti,
  Smartship,
  Dtdc:DTDC,
  Delhivery: Delehivery,
};

const EDDMapping = () => {
  const [data, setData] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    axios.get(`${REACT_APP_BACKEND_URL}/EDD/getAllEddMap`).then(res => setData(res.data));
  }, []);

  const reload = () => axios.get(`${REACT_APP_BACKEND_URL}/EDD/getAllEddMap`).then(res => setData(res.data));

  const getCourierLogo = (name) => {
    if (!name) return null;
    // standardize key for mapping
    const key = Object.keys(courierImages).find(k => k.toLowerCase() === name.toLowerCase());
    return courierImages[key] || null;
  };

  return (
    <section className="w-full mx-auto px-2">
      {/* Heading, Add Rate button */}
      <h1 className="text-[14px] text-gray-700 sm:text-[18px] font-[600] mb-2">Estimate Date and Time</h1>
      <button
        onClick={() => setShowAdd(true)}
        className="mb-2 px-3 py-2 text-[10px] sm:text-[12px] font-[600] bg-[#0CBB7D] text-white rounded-lg hover:bg-green-500 transition"
      >
        Add Estimate Date
      </button>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden sm:block overflow-x-auto border rounded-lg shadow">
        <table className="min-w-full bg-white divide-y text-[12px] divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {["Courier","Courier Service", "Zone A", "Zone B", "Zone C", "Zone D", "Zone E", "Actions"].map(header => (
                <th
                  key={header}
                  className="px-3 py-2 bg-[#0CBB7D] text-left text-[12px] font-[600] text-white uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map(rate => (
              <tr key={rate._id} className="text-gray-700">
                <td className="px-3 py-2 whitespace-nowrap flex items-center gap-2">
                  {getCourierLogo(rate?.courier) && (
                    <img src={getCourierLogo(rate.courier)} alt={rate.courier} className="w-7 h-7 rounded-md border" />
                  )}
                  {rate?.courier}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{rate?.serviceName}</td>
                <td className="px-3 py-2 whitespace-nowrap">{rate?.zoneRates?.zoneA}</td>
                <td className="px-3 py-2 whitespace-nowrap">{rate?.zoneRates?.zoneB}</td>
                <td className="px-3 py-2 whitespace-nowrap">{rate?.zoneRates?.zoneC}</td>
                <td className="px-3 py-2 whitespace-nowrap">{rate?.zoneRates?.zoneD}</td>
                <td className="px-3 py-2 whitespace-nowrap">{rate?.zoneRates?.zoneE}</td>
                <td className="px-3 py-2 whitespace-nowrap flex space-x-2">
                  <button
                    onClick={() => setEditItem(rate)}
                    className="p-1 text-white hover:text-gray-100 hover:bg-green-500 rounded-full bg-[#0CBB7D] transition"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <AiOutlineEdit size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteItem(rate)}
                    className="p-1 text-red-600 bg-red-100 rounded-full hover:text-red-700 hover:bg-red-200 transition"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <AiOutlineDelete size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="block sm:hidden w-full">
        <div className="space-y-3">
          {data.map(rate => (
            <div key={rate._id} className="bg-white rounded-lg shadow p-3 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCourierLogo(rate?.courier) && (
                    <img src={getCourierLogo(rate.courier)} alt={rate.courier} className="w-8 h-8 rounded-md border" />
                  )}
                  <div>
                    <div className="font-[600] text-gray-700 text-[12px]">{rate.courier}</div>
                    <div className="text-[12px] text-gray-500">{rate.serviceName}</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditItem(rate)}
                    className="p-1 rounded-full bg-[#0CBB7D] text-white hover:bg-green-500 transition"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <AiOutlineEdit size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteItem(rate)}
                    className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <AiOutlineDelete size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] text-gray-500 font-[600] text-center">Zone A</div>
                  <div className="font-[600] text-gray-700 text-[10px] text-center">{rate.zoneRates?.zoneA}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] text-gray-500 font-[600] text-center">Zone B</div>
                  <div className="font-[600] text-gray-700 text-[10px] text-center">{rate.zoneRates?.zoneB}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] text-gray-500 font-[600] text-center">Zone C</div>
                  <div className="font-[600] text-gray-700 text-[10px] text-center">{rate.zoneRates?.zoneC}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] text-gray-500 font-[600] text-center">Zone D</div>
                  <div className="font-[600] text-gray-700 text-[10px] text-center">{rate.zoneRates?.zoneD}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] text-gray-500 font-[600] text-center">Zone E</div>
                  <div className="font-[600] text-gray-700 text-[10px] text-center">{rate.zoneRates?.zoneE}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AddModal show={showAdd} onClose={() => { setShowAdd(false); reload(); }} />
      {editItem && (
        <EditModal item={editItem} onClose={() => { setEditItem(null); reload(); }} />
      )}
      {deleteItem && (
        <DeleteModal item={deleteItem} onClose={() => { setDeleteItem(null); reload(); }} />
      )}
    </section>
  );
};

export default EDDMapping;
