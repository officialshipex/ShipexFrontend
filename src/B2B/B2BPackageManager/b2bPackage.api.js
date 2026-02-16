import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export const getB2BPackages = async (orderId) => {
    // console.log("Fetching B2B packages for orderId:", orderId);
  return axios.get(`${API}/b2b/orders/${orderId}/b2b-packages`);
};

export const updateB2BPackages = async (orderId, payload) => {
  return axios.put(`${API}/b2b/orders/${orderId}/b2b-packages`, payload);
};
