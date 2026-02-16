import axios from "axios";
import Cookies from "js-cookie";

const API = process.env.REACT_APP_BACKEND_URL;

// ✅ Axios instance
const api = axios.create({
  baseURL: `${API}/b2b/zonematrix`,
});

// ✅ Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("session");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================= API CALLS =================

export const getZones = () => api.get("/getAll");

export const addLocation = (data) =>
  api.post("/addLocation", data);

export const removeLocation = (data) =>
  api.put("/removeLocation", data);

export const deleteZone = (id) =>
  api.delete(`/removeZone/${id}`);

export const lookupPincode = (pincode) =>
  api.get(`/lookup/pincode?pincode=${pincode}`);
