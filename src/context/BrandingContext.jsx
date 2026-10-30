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
  // true only for the platform's own company (Shipex), never a white-label one; off until the server says so
  isDefaultCompany: false,
  // whether this company offers two-factor login (QuickPost > Companies); off until the server says so
  twoFactorEnabled: false,
};

// A company's branding is remembered in this browser, per domain, so a returning visitor sees the right logo, name and
// colours at once even when the server is slow. Only non-secret branding is kept.
const CACHE_KEY = `branding:${typeof window !== "undefined" ? window.location.hostname : ""}`;

function readCachedBranding() {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (saved && saved.branding && saved.branding.companyDisplayName) return saved;
  } catch {
    // no storage / bad value: behave as if nothing was remembered
  }
  return null;
}

function writeCachedBranding(branding, apiDomain) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ branding, apiDomain: apiDomain || null }));
  } catch {
    // storage full or blocked: the app works the same, just without the head start
  }
}

// What is shown while a first-time visitor's branding has not arrived yet. It has no logo, no name and no brand
// colour on purpose: showing the platform's own (or any other company's) branding here would be wrong for this domain.
function NeutralSplash({ failedAttempts, onRetry }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#ffffff", fontFamily: "system-ui, sans-serif", color: "#64748b" }}>
      <style>{"@keyframes brandingNeutralSpin { to { transform: rotate(360deg); } }"}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "4px solid #e2e8f0", borderTopColor: "#94a3b8", animation: "brandingNeutralSpin 0.9s linear infinite" }} />
      {failedAttempts >= 2 && (
        <div style={{ marginTop: 16, fontSize: 13, textAlign: "center", padding: "0 16px" }}>
          <div>Taking longer than usual. Please wait...</div>
          <button
            type="button"
            onClick={onRetry}
            style={{ marginTop: 10, padding: "6px 14px", fontSize: 12, border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#475569", cursor: "pointer" }}
          >
            Retry now
          </button>
        </div>
      )}
    </div>
  );
}

const BrandingContext = createContext({ ...FALLBACK_BRANDING, loading: true });

export function useBranding() {
  return useContext(BrandingContext);
}

export function BrandingProvider({ children }) {
  // Remembered branding (if this browser has seen this domain before) is used immediately; otherwise nothing is
  // known yet and the neutral screen is shown until the server answers. The platform's own branding is never used
  // as a stand-in for a company that has not loaded yet.
  const cached = readCachedBranding();
  const [branding, setBranding] = useState(cached ? cached.branding : FALLBACK_BRANDING);
  const [resolved, setResolved] = useState(Boolean(cached)); // true once the real branding for this domain is known
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [retryTick, setRetryTick] = useState(0);
  const loading = !resolved;

  const hadCache = Boolean(cached);
  // the branded API address must be known before the first API call, so apply the remembered one straight away (once)
  useState(() => {
    if (cached && cached.apiDomain) setTenantApiDomain(cached.apiDomain);
    return null;
  });

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const load = (attempt) => {
      axios
        .get(`${process.env.REACT_APP_BACKEND_URL}/public/branding`, { timeout: 15000 })
        .then((res) => {
          if (cancelled) return;
          if (!res.data?.success) throw new Error("branding not available");
          const fresh = {
            companyDisplayName: res.data.companyDisplayName || FALLBACK_BRANDING.companyDisplayName,
            logoUrl: res.data.logoUrl || null,
            faviconUrl: res.data.faviconUrl || null,
            emptyStateImageUrl: res.data.emptyStateImageUrl || null,
            colors: { ...FALLBACK_BRANDING.colors, ...(res.data.colors || {}) },
            supportEmail: res.data.supportEmail || FALLBACK_BRANDING.supportEmail,
            supportPhone: res.data.supportPhone || FALLBACK_BRANDING.supportPhone,
            isDefaultCompany: res.data.isDefaultCompany === true,
            twoFactorEnabled: res.data.twoFactorEnabled === true,
          };
          setBranding(fresh);
          // From here on, this company's OWN calls to our backend (axiosInterceptor.js)
          // go to its branded API domain instead of the shared default, when it has one.
          setTenantApiDomain(res.data.apiDomain || null);
          writeCachedBranding(fresh, res.data.apiDomain);
          setFailedAttempts(0);
          setResolved(true);
        })
        .catch(() => {
          if (cancelled) return;
          // A slow or briefly unreachable server: keep trying (2s, 4s, 6s ... up to 10s apart). With remembered
          // branding the visitor already sees the right company meanwhile; without it the neutral screen stays.
          if (hadCache) return; // the remembered branding is already on screen; it refreshes on the next visit
          setFailedAttempts((n) => n + 1);
          timer = setTimeout(() => load(attempt + 1), Math.min(2000 * (attempt + 1), 10000));
        });
    };

    load(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [retryTick]);

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

    // the tab title and icon are set only for the real branding, never from the stand-in values
    if (!resolved) return;
    document.title = branding.companyDisplayName;

    // index.html no longer carries an icon (it would show the platform's icon on every company's domain while this
    // loads); the company's own, or the platform default when it has none, is set here.
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl || "/Group.png";
  }, [branding, resolved]);

  if (!resolved) {
    return <NeutralSplash failedAttempts={failedAttempts} onRetry={() => setRetryTick((n) => n + 1)} />;
  }

  return <BrandingContext.Provider value={{ ...branding, loading: false }}>{children}</BrandingContext.Provider>;
}
