import axios from "axios";
import Cookies from "js-cookie";
import { toTenantUrl } from "./tenantApiDomain";
import { getUserInfoFromToken } from "./session";

// The backend answers every request of a company that has been switched off (Companies screen: "block login only"
// or "complete shutdown") with code COMPANY_DISABLED. A user who was already logged in is signed out at once and
// taken to the login page, which shows the reason. Several requests can fail together, so this runs only once.
const COMPANY_DISABLED = "COMPANY_DISABLED";
export const LOGOUT_REASON_KEY = "logoutReason";
let signingOut = false;

function signOutBecauseCompanyDisabled(message) {
  // Not logged in (e.g. the login request itself was refused): nothing to sign out of, the page shows the message.
  if (signingOut || !Cookies.get("session")) return;
  signingOut = true;
  const loginPage = getUserInfoFromToken()?.type === "employee" ? "/e-login" : "/login";
  try {
    sessionStorage.setItem(LOGOUT_REASON_KEY, message || "Something went wrong please contact with your account manager");
  } catch {
    // storage blocked: the login page just won't repeat the reason
  }
  Cookies.remove("session", { path: "/" });
  Cookies.remove("session");
  window.location.replace(loginPage);
}

// Most screens use axios, but some call our backend with fetch; those refusals are recognised here too.
function watchFetchForCompanyDisabled() {
  if (typeof window === "undefined" || !window.fetch || window.fetch.__companyDisabledWatch) return;
  const originalFetch = window.fetch.bind(window);
  const watched = (input, init) =>
    originalFetch(input, init).then((response) => {
      if (response.status === 400) {
        const url = typeof input === "string" ? input : input?.url;
        if (isBackendRequest({ url })) {
          response
            .clone()
            .json()
            .then((body) => {
              if (body?.code === COMPANY_DISABLED) signOutBecauseCompanyDisabled(body.message);
            })
            .catch(() => {});
        }
      }
      return response;
    });
  watched.__companyDisabledWatch = true;
  window.fetch = watched;
}

// True only when the request goes to OUR backend: the same origin (scheme, host, port) as
// REACT_APP_BACKEND_URL. Comparing origins, not a URL prefix, so a look-alike host such as
// https://api.example.com.evil.net can never receive the token.
function isBackendRequest(config) {
  const backend = process.env.REACT_APP_BACKEND_URL;
  if (!backend) return false;
  try {
    const base = new URL(backend);
    const target = new URL(`${config.baseURL || ""}${config.url || ""}`, base);
    return target.origin === base.origin;
  } catch {
    return false;
  }
}

export function setupAxiosInterceptors() {
  watchFetchForCompanyDisabled();

  // Send the login token with every call to OUR backend, so a route that requires a login
  // (see the backend's ENFORCE_AUTH_PREFIXES) works from every screen without each call
  // having to remember to attach it. A call that already sets its own Authorization keeps
  // it, and nothing is ever attached to a request that goes anywhere else.
  axios.interceptors.request.use((config) => {
    const token = Cookies.get("session");
    const alreadySet =
      (typeof config.headers?.has === "function" && config.headers.has("Authorization")) ||
      Boolean(config.headers?.Authorization || config.headers?.authorization);

    // Checked BEFORE any URL rewrite below — isBackendRequest compares against
    // REACT_APP_BACKEND_URL's origin, which a rewritten URL would no longer match.
    if (token && !alreadySet && isBackendRequest(config)) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    const devTenant = localStorage.getItem("dev_tenant_key") || localStorage.getItem("dev_tenant");
    if (devTenant && isBackendRequest(config)) {
      config.headers = config.headers || {};
      config.headers["x-tenant-key"] = devTenant;
    }

    // Every call site builds its URL as `${REACT_APP_BACKEND_URL}/...`, so this one
    // rewrite point is what makes the current company's own branded API domain (if it
    // has one) apply everywhere, instead of editing all ~250 of those call sites.
    // toTenantUrl no-ops for anything that isn't our own backend or has no apiDomain set.
    if (config.url) config.url = toTenantUrl(config.url);
    if (config.baseURL) config.baseURL = toTenantUrl(config.baseURL);

    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;

      if (status === 400 && error.response?.data?.code === COMPANY_DISABLED) {
        signOutBecauseCompanyDisabled(error.response.data.message);
        return Promise.reject(error);
      }

      if (status === 403 || status === 401) {
        console.warn("Invalid or expired token. Logging out...");
        Cookies.remove("session");
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }
  );
}
