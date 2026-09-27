import axios from "axios";

// Uses the shared axios object (its interceptors are set up once in
// axiosInterceptor.js) instead of its own axios.create() instance -- a
// separate instance never picks up that global interceptor, so it was
// silently missing the Authorization token's matching tenant header
// (x-tenant-key, used for local multi-company testing) and the per-company
// API domain rewrite, causing 401s whenever a non-default tenant was active.
const API = process.env.REACT_APP_BACKEND_URL;
const BASE = `${API}/b2b/ratecard`;

export const getMeta = () => axios.get(`${BASE}/getMeta`);
export const getRateCard = (courierId, planId) =>
  axios.get(`${BASE}/getRateCard/?courierId=${courierId}&planId=${planId}`);
export const createRateCard = (data) => axios.post(`${BASE}/createRateCard`, data);
export const updateRateCard = (id, data) => axios.put(`${BASE}/updateRateCard/${id}`, data);
export const deleteRateCard = (id) => axios.delete(`${BASE}/deleteRateCard/${id}`);
