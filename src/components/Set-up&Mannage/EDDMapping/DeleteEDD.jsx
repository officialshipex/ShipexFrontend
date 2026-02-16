import React, { useState } from 'react';
import axios from 'axios';
import { Notification } from '../../../Notification';

const DeleteEDD = ({ item, onClose }) => {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${REACT_APP_BACKEND_URL}/EDD/deleteEDD/${item._id}`);
      Notification("EDD Deleted Successfully.","success")
      onClose();
    } catch (err) {
        Notification("Failed to delete EDD","error")
      setError(err.response?.data?.error || 'Failed to delete EDD');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-sm">
        <h2 className="text-[14px] font-[600] mb-2 text-gray-700">Confirm Delete</h2>
        <p className="mb-4 text-gray-500 font-[600] text-[10px] sm:text-[12px]">
          Are you sure you want to delete <strong>{item.courier}</strong> - <strong>{item.serviceName}</strong>?
        </p>

        {error && <p className="mb-4 text-red-600 text-[10px] font-[600]">{error}</p>}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition font-[600] text-[10px] sm:text-[12px]"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-[600] text-[10px] sm:text-[12px]"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteEDD;
