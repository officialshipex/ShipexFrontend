import React from "react";
import { useBranding } from "../context/BrandingContext";
import ShipexLogo from "../assets/Shipex.jpg";

// Drop-in replacement for the old `<img src={ShipexLogo} .../>` pattern —
// same props, but resolves to the current tenant's uploaded logo once
// branding loads, falling back to today's static Shipex logo until then
// (or if a company hasn't uploaded one yet).
export function Logo({ alt = "Logo", ...imgProps }) {
  const { logoUrl } = useBranding();
  return <img src={logoUrl || ShipexLogo} alt={alt} {...imgProps} />;
}
