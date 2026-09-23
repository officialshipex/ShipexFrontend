import { PackageSearch } from "lucide-react";

// Drop-in replacement for the old `<img src={nodatafound.png} .../>` empty-state
// picture — that was a fixed PNG with green baked in, so it never matched a
// company's own brand color. An icon (from the set already used elsewhere in
// the app) styled with the brand-primary token does. Takes the same `className`
// callers already pass for sizing, so swapping it in is a 1:1 replacement.
export default function NoDataFound({ className = "w-40 h-40", alt = "No data found" }) {
  return (
    <PackageSearch
      className={`text-brand-primary/35 ${className}`}
      strokeWidth={1.25}
      role="img"
      aria-label={alt}
    />
  );
}
