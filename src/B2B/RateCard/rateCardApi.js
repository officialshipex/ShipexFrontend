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
// the B2B plan every newly registered seller gets (none marked = LITE); same as the B2C "Set as default"
export const getB2BPlanNames = () => axios.get(`${API}/b2b/saveRate/getPlanNames`);
export const setB2BDefaultPlan = (planName) => axios.post(`${API}/b2b/saveRate/setDefaultPlan`, { planName });
export const getRateCard = (courierId, planId) =>
  axios.get(`${BASE}/getRateCard/?courierId=${courierId}&planId=${planId}`);
export const createRateCard = (data) => axios.post(`${BASE}/createRateCard`, data);
export const updateRateCard = (id, data) => axios.put(`${BASE}/updateRateCard/${id}`, data);
export const deleteRateCard = (id) => axios.delete(`${BASE}/deleteRateCard/${id}`);
// Excel upload of the zone prices only (overhead charges are not changed by it)
// courierId: one courier (account) -> its services with its own zone matrix; omitted = every courier
export const downloadRateTemplate = (planId, courierId) =>
  axios.get(`${BASE}/uploadTemplate`, {
    params: { ...(planId ? { planId } : {}), ...(courierId ? { courierId } : {}) },
    responseType: "blob",
  });
export const uploadRateFile = (file) => {
  const form = new FormData();
  form.append("file", file);
  return axios.post(`${BASE}/uploadRates`, form, { headers: { "Content-Type": "multipart/form-data" } });
};
