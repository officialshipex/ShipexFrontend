import { useBranding } from "../context/BrandingContext";
import defaultNoDataFound from "../assets/nodatafound.png";

// Drop-in replacement for the old `<img src={nodatafound.png} .../>` empty-state
// picture, used wherever a table/list has nothing to show. Renders the current
// company's own uploaded picture (Companies screen > Branding > Empty state
// picture) when set, falling back to today's original Shipex illustration
// otherwise — so shipex itself, and any company that hasn't uploaded its own,
// looks exactly as it always has. Takes the same `className` callers already
// pass for sizing, so swapping it in is a 1:1 replacement.
export default function NoDataFound({ className = "w-40 h-40", alt = "No data found" }) {
  const { emptyStateImageUrl } = useBranding();
  return <img src={emptyStateImageUrl || defaultNoDataFound} alt={alt} className={`object-contain ${className}`} />;
}
