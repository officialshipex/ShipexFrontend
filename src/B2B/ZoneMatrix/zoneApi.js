import axios from "axios";

// Uses the shared axios object (its interceptors are set up once in
// axiosInterceptor.js) instead of its own axios.create() instance -- a
// separate instance never picks up that global interceptor, so it was
// silently missing the Authorization token's matching tenant header
// (x-tenant-key, used for local multi-company testing) and the per-company
// API domain rewrite, causing 401s whenever a non-default tenant was active.
const API = process.env.REACT_APP_BACKEND_URL;
const BASE = `${API}/b2b/zonematrix`;

// ================= API CALLS =================

// matrixId: the zone matrix to work on (each courier prices with one); omitted = the Default matrix
export const getZones = (matrixId) => axios.get(`${BASE}/getAll`, { params: matrixId ? { matrixId } : undefined });

export const addLocation = (data) =>
  axios.post(`${BASE}/addLocation`, data);

export const removeLocation = (data) =>
  axios.put(`${BASE}/removeLocation`, data);

// zone matrices + which matrix each courier uses
export const getMatrices = () => axios.get(`${BASE}/matrices`);
export const createMatrix = (data) => axios.post(`${BASE}/matrices`, data); // { name, copyFromId? }
export const renameMatrix = (id, name) => axios.put(`${BASE}/matrices/${id}`, { name });
export const deleteMatrix = (id) => axios.delete(`${BASE}/matrices/${id}`);
export const assignMatrix = (courierId, matrixId) => axios.put(`${BASE}/assign`, { courierId, matrixId });

export const deleteZone = (id) =>
  axios.delete(`${BASE}/removeZone/${id}`);

export const lookupPincode = (pincode) =>
  axios.get(`${BASE}/lookup/pincode?pincode=${pincode}`);

export const searchLocations = (q) =>
  axios.get(`${BASE}/search`, { params: { q } });
