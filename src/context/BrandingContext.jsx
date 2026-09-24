import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { setTenantApiDomain } from "../utils/tenantApiDomain";

// Today's static Shipex branding — used until the fetch resolves, and
// permanently if it fails, so a backend hiccup never breaks the app (it
// just looks like today's Shipex instead of the right company's branding).
const FALLBACK_BRANDING = {
  companyDisplayName: "Shipex India",
  logoUrl: null, // null means "use the bundled static logo" (see Logo.jsx)
  faviconUrl: null,
  emptyStateImageUrl: null, // null means "use the bundled default picture" (see Common/NoDataFound.jsx)
  colors: { primary: "#0CBB7D", secondary: "#0F172A", accent: "#0CBB7D" },
  supportEmail: "support@shipexindia.com",
  supportPhone: "+91 98139 81344",
};

const BrandingContext = createContext({ ...FALLBACK_BRANDING, loading: true });

export function useBranding() {
  return useContext(BrandingContext);
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(FALLBACK_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/public/branding`)
      .then((res) => {
        if (cancelled || !res.data?.success) return;
        setBranding({
          companyDisplayName: res.data.companyDisplayName || FALLBACK_BRANDING.companyDisplayName,
          logoUrl: res.data.logoUrl || null,
          faviconUrl: res.data.faviconUrl || null,
          emptyStateImageUrl: res.data.emptyStateImageUrl || null,
          colors: { ...FALLBACK_BRANDING.colors, ...(res.data.colors || {}) },
          supportEmail: res.data.supportEmail || FALLBACK_BRANDING.supportEmail,
          supportPhone: res.data.supportPhone || FALLBACK_BRANDING.supportPhone,
        });
        // From here on, this company's OWN calls to our backend (axiosInterceptor.js)
        // go to its branded API domain instead of the shared default, when it has one.
        setTenantApiDomain(res.data.apiDomain || null);
      })
      .catch(() => {
        // Stay on FALLBACK_BRANDING — see comment above.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Convert #HEX to "R, G, B" channels so Tailwind opacity modifiers (e.g. bg-brand-secondary/16)
  // generate valid rgba(R, G, B, 0.16) CSS instead of invalid rgb(#HEX / 0.16) which browsers drop.
  useEffect(() => {
    const hexToRgb = (hex) => {
      if (!hex || typeof hex !== "string") return null;
      let c = hex.replace("#", "").trim();
      if (c.length === 3) {
        c = c.split("").map((x) => x + x).join("");
      }
      if (c.length === 6) {
        const num = parseInt(c, 16);
        if (!isNaN(num)) {
          return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
        }
      }
      return null;
    };

    const root = document.documentElement;
    if (branding.colors?.primary) {
      root.style.setProperty("--brand-primary", branding.colors.primary);
      const rgb = hexToRgb(branding.colors.primary);
      if (rgb) root.style.setProperty("--brand-primary-rgb", rgb);
    }
    if (branding.colors?.secondary) {
      root.style.setProperty("--brand-secondary", branding.colors.secondary);
      const rgb = hexToRgb(branding.colors.secondary);
      if (rgb) root.style.setProperty("--brand-secondary-rgb", rgb);
    }
    if (branding.colors?.accent) {
      root.style.setProperty("--brand-accent", branding.colors.accent);
      const rgb = hexToRgb(branding.colors.accent);
      if (rgb) root.style.setProperty("--brand-accent-rgb", rgb);
    }

    document.title = branding.companyDisplayName;

    if (branding.faviconUrl) {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = branding.faviconUrl;
    }
  }, [branding]);

  return <BrandingContext.Provider value={{ ...branding, loading }}>{children}</BrandingContext.Provider>;
}
