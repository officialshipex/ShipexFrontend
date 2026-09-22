import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Today's static Shipex branding — used until the fetch resolves, and
// permanently if it fails, so a backend hiccup never breaks the app (it
// just looks like today's Shipex instead of the right company's branding).
const FALLBACK_BRANDING = {
  companyDisplayName: "Shipex India",
  logoUrl: null, // null means "use the bundled static logo" (see Logo.jsx)
  faviconUrl: null,
  colors: { primary: "#0CBB7D", secondary: "#0F172A", accent: "#0CBB7D" },
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
          colors: { ...FALLBACK_BRANDING.colors, ...(res.data.colors || {}) },
        });
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

  // Repaint CSS vars + favicon + title as soon as branding resolves, so
  // every component using the brand-* Tailwind tokens (tailwind.config.js)
  // or the static <link rel="icon">/<title> in index.html updates without
  // needing its own effect.
  useEffect(() => {
    const root = document.documentElement;
    if (branding.colors.primary) root.style.setProperty("--brand-primary", branding.colors.primary);
    if (branding.colors.secondary) root.style.setProperty("--brand-secondary", branding.colors.secondary);
    if (branding.colors.accent) root.style.setProperty("--brand-accent", branding.colors.accent);

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
