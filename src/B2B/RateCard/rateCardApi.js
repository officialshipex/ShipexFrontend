import axios from "axios";
import Cookies from "js-cookie";
import { toTenantUrl } from "../../utils/tenantApiDomain";

const API = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API}/b2b/ratecard`,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("session");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // This instance has its own baseURL set once at module load, before this
  // company's apiDomain is known — resolved dynamically here instead, same
  // as the global interceptor in utils/axiosInterceptor.js.
  config.baseURL = toTenantUrl(config.baseURL);
  return config;
});

export const getMeta = () => api.get("/getMeta");
export const getRateCard = (courierId, planId) =>
  api.get(`/getRateCard/?courierId=${courierId}&planId=${planId}`);
export const createRateCard = (data) => api.post("/createRateCard", data);
export const updateRateCard = (id, data) => api.put(`/updateRateCard/${id}`, data);
export const deleteRateCard = (id) => api.delete(`/deleteRateCard/${id}`);
