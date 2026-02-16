import axios from "axios";
import Cookies from "js-cookie";

export function setupAxiosInterceptors() {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;

      if (status === 403 || status === 401) {
        console.warn("Invalid or expired token. Logging out...");
        Cookies.remove("session");
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }
  );
}
