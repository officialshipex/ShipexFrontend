import React, { useState, useEffect } from "react";
import { Truck, Wallet, Settings } from "lucide-react";
import { FaCheck } from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";
import Bluedart from "../../../assets/bluedart.png";
import Delehivery from "../../../assets/delehivery.png";
import EcomExpress from "../../../assets/ecom-expresss.avif";
import Shadowfax from "../../../assets/shadowfax.png";
import Xpressbees from "../../../assets/xpressbees.png";
import Shiprocket from "../../../assets/shiprocket.webp";
import NimbusPost from "../../../assets/nimbuspost.webp";
import ShreeMaruti from "../../../assets/shreemaruti.png";
import DTDC from "../../../assets/dtdc.png";
import Amazon from "../../../assets/amazon.jpg";
import Loader from "../../../Loader"

const CourierPriority = () => {
  const [selected, setSelected] = useState("Cheapest");
  const [showCustomList, setShowCustomList] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [availableCouriers, setAvailableCouriers] = useState([]);
  const [customPriority, setCustomPriority] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allCouriers, setAllCouriers] = useState([]);

  const courierImages = [
    { keyword: "Bluedart", img: Bluedart },
    { keyword: "Delhivery", img: Delehivery },
    { keyword: "Ecom Express", img: EcomExpress },
    { keyword: "Shadowfax", img: Shadowfax },
    { keyword: "Xpressbees", img: Xpressbees },
    { keyword: "Shiprocket", img: Shiprocket },
    { keyword: "NimbusPost", img: NimbusPost },
    { keyword: "Shree Maruti", img: ShreeMaruti },
    { keyword: "Dtdc", img: DTDC },
    { keyword: "Amazon", img: Amazon },
  ];

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // ✅ Fetch couriers dynamically from backend
  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const token = Cookies.get("session");
        const res = await axios.get(`${REACT_APP_BACKEND_URL}/courier/getCourierServices`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          const { rateCard, courierPriority, priorityType } = res.data.data;

          // Map rateCard into UI format
          const all = rateCard.map((c, i) => {
            const matched = courierImages.find((ci) =>
              c.courierServiceName.toLowerCase().includes(ci.keyword.toLowerCase())
            );
            return {
              id: i.toString(),
              name: c.courierServiceName || "N/A",
              provider: c.courierProviderName || "N/A",
              mode: c.mode || "N/A",
              img: matched ? matched.img : "https://via.placeholder.com/40", // fallback image
            };
          });

          setAllCouriers(all);

          // If courierPriority exists, set customPriority
          if (courierPriority && courierPriority.length > 0) {
            const custom = courierPriority.map((c) => {
              const match = all.find((ac) => ac.name === c.name);
              return match ? { ...match } : c;
            });

            const available = all.filter(
              (c) => !custom.some((p) => p.name === c.name)
            );

            setCustomPriority(custom);
            setAvailableCouriers(available);


            setSelected("Custom");
            setShowCustomList(true);
          } else {
            setCustomPriority([]);
            setAvailableCouriers(all);
            setSelected(priorityType || "Cheapest");
            setShowCustomList(priorityType === "Custom");
          }
        }
      } catch (err) {
        console.error("Error fetching couriers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCouriers();
  }, []);

  const handleEdit = () => {
    // Custom priority stays as it is
    // Available couriers = rateCard - customPriority
    setAvailableCouriers((prev) =>
      prev.filter((c) => !customPriority.some((p) => p.name === c.name))
    );
    setIsEditing(true);
  };


  // ✅ Save priority setting
  const handleSave = async () => {
    try {
      if (selected === "Custom") {
        if (!customPriority || customPriority.length === 0) {
          Notification("Please set your custom courier priority before saving.", "info");
          return; // stop execution here
        }
      }

      const payload = {
        type: selected,
        couriers:
          selected === "Custom"
            ? customPriority // ordered from drag & drop
            : availableCouriers, // fallback for non-custom types
      };

      console.log("Payload to send:", payload);

      const token = Cookies.get("session");

      const res = await axios.post(
        `${REACT_APP_BACKEND_URL}/courier/saveCourierPriority`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        Notification("Courier priority saved successfully.", "success");
        if (selected === "Custom") {
          setAllCouriers([...customPriority, ...availableCouriers]);
        }
        setIsEditing(false);
      } else {
        Notification("Failed to save courier priority.", "error");
      }
    } catch (error) {
      console.error("Error saving courier priority:", error);
      Notification("Something went wrong while saving.", "error");
    }
  };



  const handleSelect = (label) => {
    setSelected(label);
    setShowCustomList(label === "Custom");
    setIsEditing(false);
  };

  const options = [
    { label: "Fastest", icon: <Truck className="w-5 h-5 text-white" />, desc: "Prioritize couriers with fastest delivery times." },
    { label: "Cheapest", icon: <Wallet className="w-5 h-5 text-white" />, desc: "Choose couriers offering the lowest rates." },
    { label: "Custom", icon: <Settings className="w-5 h-5 text-white" />, desc: "Manually set your own courier ranking." },
  ];

  // 🟩 Handle Drag and Drop logic
  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      const list =
        source.droppableId === "available"
          ? Array.from(availableCouriers)
          : Array.from(customPriority);
      const [moved] = list.splice(source.index, 1);
      list.splice(destination.index, 0, moved);
      source.droppableId === "available"
        ? setAvailableCouriers(list)
        : setCustomPriority(list);
    } else {
      const sourceList =
        source.droppableId === "available"
          ? Array.from(availableCouriers)
          : Array.from(customPriority);
      const destList =
        destination.droppableId === "available"
          ? Array.from(availableCouriers)
          : Array.from(customPriority);
      const [moved] = sourceList.splice(source.index, 1);
      destList.splice(destination.index, 0, moved);

      // ✅ FIXED HERE
      if (source.droppableId === "available") {
        setAvailableCouriers(sourceList);
        setCustomPriority(destList);
      } else {
        setAvailableCouriers(destList);
        setCustomPriority(sourceList);
      }
    }
  };


  if (loading) {
    return <div className="text-center py-6 text-gray-500"><Loader /></div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-[14px] font-[600] text-gray-700 mb-1">Courier Priority</h2>
      <p className="text-[12px] text-gray-700 mb-4">Set your courier priority ranking for order assignment.</p>

      {/* Selection Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => handleSelect(opt.label)}
            className={`flex items-center justify-between w-full p-3 rounded-lg border transition-all duration-300 ${selected === opt.label ? "border-[#0CBB7D] bg-green-50" : "border-gray-200 hover:border-gray-300"
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#0CBB7D]">{opt.icon}</div>
              <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
            </div>
            {selected === opt.label && (
              <div className="w-5 h-5 rounded-full bg-[#0CBB7D] flex items-center justify-center text-white text-xs">
                <FaCheck />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Courier Section */}
      {showCustomList && (
        <div className="mt-4">
          {!isEditing ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">Edit to customize and reorder the courier ranking.</h3>
                <button
                  onClick={handleEdit}
                  className="px-4 py-1.5 text-sm border border-[#0CBB7D] text-[#0CBB7D] rounded-lg hover:bg-[#0CBB7D] hover:text-white transition"
                >
                  Edit
                </button>
              </div>
              <div className="grid max-h-[300px] overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCouriers.map((c, i) => {
                  // const priorityIndex = customPriority.findIndex(p => p.name === c.name);
                  return (
                    <div
                      key={c.id}
                      className="relative flex items-center gap-3 border border-gray-200 rounded-lg px-5 py-3 bg-white hover:shadow-sm transition"
                    >
                      {/* {priorityIndex !== -1 && ( */}
                      <span className="absolute top-0 left-0 bg-[#0CBB7D] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-tl-lg rounded-br-md">
                        {i + 1}ᵗʰ
                      </span>
                      {/* )} */}
                      <img src={c.img} alt={c.name} className="w-10 h-10 rounded-full object-contain bg-gray-100" />
                      <div>
                        <h4 className="text-[10px] sm:text-[12px] font-semibold text-gray-700">{c.name}</h4>
                        <p className="text-xs text-gray-500">{c.mode}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg bg-gray-50 h-[370px] flex flex-col">
                  <h4 className="font-[600] text-[12px] sm:text-[14px] text-gray-700 p-4 pb-2">Custom Courier Priority</h4>
                  <Droppable droppableId="custom">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 overflow-y-auto px-4 pb-4"
                      >
                        {customPriority.length === 0 ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-md h-full flex items-center justify-center text-gray-500 text-[10px] sm:text-[12px] min-h-[100px]">
                            Drag couriers from the right panel here
                          </div>
                        ) : (
                          customPriority.map((c, i) => (
                            <Draggable key={c.id} draggableId={c.id} index={i}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-between border border-gray-200 rounded-xl p-3 bg-white mb-2"
                                >
                                  <div className="flex items-center gap-3">
                                    <img src={c.img} alt={c.name} className="w-10 h-10 rounded-full object-contain bg-gray-100" />
                                    <div>
                                      <h4 className="text-[10px] sm:text-[12px] font-semibold text-gray-700">{c.name}</h4>
                                      <p className="text-xs text-gray-500">
                                        {c.mode}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-gray-400 cursor-grab">⋮⋮</div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                <div className="border rounded-lg bg-gray-50 h-[370px] flex flex-col">
                  <h4 className="font-[600] text-[12px] sm:text-[14px] text-gray-700 p-4 pb-2">Available Couriers</h4>
                  <Droppable droppableId="available">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 overflow-y-auto px-4 pb-4"
                      >
                        {availableCouriers.map((c, i) => (
                          <Draggable key={c.id} draggableId={c.id} index={i}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="flex items-center justify-between border border-gray-200 rounded-xl p-3 bg-white mb-2"
                              >
                                <div className="flex items-center gap-3">
                                  <img src={c.img} alt={c.name} className="w-10 h-10 rounded-full object-contain bg-gray-100" />
                                  <div>
                                    <h4 className="text-[10px] sm:text-[12px] font-semibold text-gray-700">{c.name}</h4>
                                    <p className="text-xs text-gray-500">
                                      {c.mode}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-gray-500 cursor-grab">⋮⋮</div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 border text-[12px] font-[600] border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-[#0CBB7D] text-[12px] hover:opacity-90 transition-all text-white px-3 py-2 rounded-lg font-[600]"
                >
                  Save
                </button>
              </div>
            </DragDropContext>
          )}
        </div>
      )}

      {!isEditing && (
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={handleSave}
            className="bg-[#0CBB7D] text-[12px] hover:opacity-90 transition-all text-white px-3 py-2 rounded-lg font-[600]"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default CourierPriority;
