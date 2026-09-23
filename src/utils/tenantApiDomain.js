// The current company's own branded API address (e.g. api.fulfillone.in),
// once BrandingContext's initial /v1/public/branding call resolves it.
// A plain module-level variable rather than React state because the
// consumer (axiosInterceptor.js) is a plain axios interceptor set up once
// outside any component and has no way to read context.
let apiDomain = null;

export function setTenantApiDomain(domain) {
  apiDomain = domain || null;
}

export function getTenantApiDomain() {
  return apiDomain;
}

// Rewrites a URL that points at the platform's shared default backend
// (REACT_APP_BACKEND_URL) to instead point at this tenant's own branded API
// domain, when one is set — same origin swap utils/tenantBackendUrl.js does
// on the backend for callback/webhook URLs, now also applied to the
// browser's own calls. Anything that isn't our own backend (or a tenant
// with no apiDomain set) passes through unchanged.
export function toTenantUrl(url) {
  if (!apiDomain || !url) return url;
  const backend = process.env.REACT_APP_BACKEND_URL;
  if (!backend) return url;

  try {
    const backendOrigin = new URL(backend).origin;
    const target = new URL(url, backend);
    if (target.origin !== backendOrigin) return url; // not our backend — leave alone
    target.protocol = "https:";
    target.host = apiDomain;
    return target.toString();
  } catch {
    return url;
  }
}
