import React, { useState } from 'react';
import axios from 'axios';
import { Notification } from '../../../Notification';

const DeleteEPD = ({ item, onClose }) => {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${REACT_APP_BACKEND_URL}/EPD/delete/${item._id}`);
      Notification("EPD Map Deleted Successfully.", "success")
      onClose();
    } catch (err) {
      Notification("Failed to delete EPD Map", "error")
      setError(err.response?.data?.error || 'Failed to delete EPD Map');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-[70]">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm animate-popup-in">
        <h2 className="text-[14px] sm:text-[16px] font-[600] mb-2 text-gray-700">Confirm Delete</h2>
        <p className="mb-6 text-gray-500 font-[600] text-[12px]">
          Are you sure you want to delete EPD mapping for <strong>{item.courier}</strong> - <strong>{item.serviceName}</strong>?
        </p>

        {error && <p className="mb-4 text-red-600 text-[10px] sm:text-[12px] font-[600]">{error}</p>}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-[600] text-[12px] text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-[600] text-[12px] shadow-sm"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteEPD;
