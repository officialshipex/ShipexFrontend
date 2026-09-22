/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        wave: {
          "0%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(10px)" },
          "100%": { transform: "translateX(0)" },
        },
        toastIn: {
          "0%": { opacity: 0, transform: "translateX(100%)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        toastOut: {
          "0%": { opacity: 1, transform: "translateX(0)" },
          "100%": { opacity: 0, transform: "translateX(100%)" },
        },
        popupIn: {
          "0%": { opacity: 0, transform: "translateY(-10px) scale(0.95)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        slideDownSmooth: {
          "0%": { opacity: 0, transform: "translateY(-10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        marquee: "marquee 8s linear infinite",
        wavy: "wave 1.5s ease-in-out infinite",
        "toast-in": "toastIn 0.3s ease-out",
        "toast-out": "toastOut 0.3s ease-in forwards",
        "popup-in": "popupIn 0.25s ease-out",
        "slide-down-smooth": "slideDownSmooth 0.25s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
      },
      colors: {
        customPink: "#e8cafe",
        // CSS-var-backed so BrandingContext can repaint these at runtime
        // per company, without a rebuild. Falls back to today's Shipex
        // green/blue if a var is unset (e.g. before branding loads).
        brand: {
          primary: "var(--brand-primary, #0CBB7D)",
          secondary: "var(--brand-secondary, #0F172A)",
          accent: "var(--brand-accent, #0CBB7D)",
        },
      },
    },
  },
  plugins: [require("tailwind-scrollbar")], // ✅ CORRECT location
};
