import React, { useState, useEffect } from "react";
import Modal from "../Modal";

const UpdateOrderDetails = ({
  isOpen,
  onClose,
  order,
  handleUpdateOrderDetails,
}) => {
  const [formData, setFormData] = useState({
    paymentMethod: "",
    weight: "",
    length: "",
    breadth: "",
    height: "",
    codAmount: "",
    gstin: "",
  });

  useEffect(() => {
    if (order) {
      setFormData({
        paymentMethod: order?.paymentDetails?.method || "",
        weight: order?.packageDetails?.applicableWeight || "",
        length: order?.packageDetails?.volumetricWeight?.length || "",
        breadth: order?.packageDetails?.volumetricWeight?.width || "",
        height: order?.packageDetails?.volumetricWeight?.height || "",
        codAmount: order?.paymentDetails?.amount || "",
        gstin: order?.otherDetails?.gstin || "",
      });
    }
  }, [order, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleUpdateOrderDetails(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="text-[14px] font-[600] text-gray-700">
          Update Order Details
        </span>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[12px] font-[600] text-gray-700"
      >
        {/* Payment Method */}
        <div>
          <label className="block mb-1">Payment Method</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="w-full h-9 px-3 rounded-lg border focus:outline-[#0CBB7D]"
          >
            <option value="Prepaid">Prepaid</option>
            <option value="COD">Cash on Delivery</option>
          </select>
        </div>

        {/* Weight (Only B2C) */}
        {order?.orderType !== "B2B" && (
          <div>
            <label className="block mb-1">Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className="w-full py-2 px-3 rounded-lg border-2 focus:outline-[#0CBB7D]"
              step="0.01"
            />
          </div>
        )}

        {/* COD Amount */}
        <div>
          <label className="block mb-1">COD Amount</label>
          <input
            type="number"
            name="codAmount"
            value={formData.codAmount}
            onChange={handleChange}
            className="w-full py-2 px-3 font-[600] rounded-lg border focus:outline-[#0CBB7D]"
            step="0.01"
          />
        </div>

        {/* Dimensions (Only B2C) */}
        {order?.orderType !== "B2B" && (
          <>
            <div>
              <label className="block mb-1">Length (cm)</label>
              <input
                type="number"
                name="length"
                value={formData.length}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-lg border-2 focus:outline-green-200"
                step="0.1"
              />
            </div>

            <div>
              <label className="block mb-1">Breadth (cm)</label>
              <input
                type="number"
                name="breadth"
                value={formData.breadth}
                onChange={handleChange}
                className="w-full py-2 px-3 font-[600] rounded-lg border focus:outline-[#0CBB7D]"
                step="0.1"
              />
            </div>

            <div>
              <label className="block mb-1">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="w-full py-2 px-3 font-[600] rounded-lg border focus:outline-[#0CBB7D]"
                step="0.1"
              />
            </div>
          </>
        )}

        {/* GSTIN */}
        <div>
          <label className="block mb-1">GSTIN</label>
          <input
            type="text"
            name="gstin"
            value={formData.gstin}
            onChange={handleChange}
            className="w-full h-9 px-3 rounded-lg border focus:outline-[#0CBB7D]"
          />
        </div>

        {/* Submit */}
        <div className="col-span-1 sm:col-span-2 md:col-span-3 text-right mt-2">
          <button
            type="submit"
            className="bg-[#0CBB7D] text-white px-3 py-2 rounded-lg hover:opacity-90 transition"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateOrderDetails;
