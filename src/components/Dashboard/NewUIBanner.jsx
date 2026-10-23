import React, { useState } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { useBranding } from "../../context/BrandingContext";

// Invites Shipex's own sellers to the new panel (QuickPost). Shown only for the platform's own company — never on a
// white-label company's site. Same account and data: they sign in there with the same email and password.
// "Later" hides it for 3 days in this browser.
const NEW_UI_URL = process.env.REACT_APP_NEW_UI_URL || "https://app.quickpost.in/login";
const HIDE_KEY = "newUiBannerHiddenUntil";
const HIDE_FOR_MS = 3 * 24 * 60 * 60 * 1000;

const isHidden = () => {
  try {
    return Number(localStorage.getItem(HIDE_KEY) || 0) > Date.now();
  } catch {
    return false;
  }
};

const NewUIBanner = () => {
  const { isDefaultCompany } = useBranding();
  const [hidden, setHidden] = useState(isHidden);

  if (!isDefaultCompany || hidden) return null;

  const hideForNow = () => {
    try {
      localStorage.setItem(HIDE_KEY, String(Date.now() + HIDE_FOR_MS));
    } catch {
      // storage blocked: hide for this visit only
    }
    setHidden(true);
  };

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 rounded-lg px-3 py-2.5 mb-2 shadow-sm border border-brand-primary bg-gradient-to-r from-brand-secondary/10 via-white to-brand-secondary/10">
      <div className="flex items-start sm:items-center gap-2.5 pr-6 sm:pr-0">
        <div className="shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[12px] sm:text-[13px] font-[700] text-gray-800">Experience our new panel</p>
          <p className="text-[10px] sm:text-[12px] text-gray-500">
            A faster, cleaner design with the same account and orders. Sign in with your usual email and password.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={hideForNow} className="text-[11px] sm:text-[12px] font-[600] text-gray-500 hover:text-gray-700 px-2 py-1.5">
          Later
        </button>
        <a
          href={NEW_UI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-brand-primary text-white text-[11px] sm:text-[12px] font-[600] px-3 py-2 rounded-lg hover:opacity-90 transition"
        >
          Try the new UI <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <button onClick={hideForNow} title="Hide" className="absolute top-2 right-2 sm:hidden text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NewUIBanner;
