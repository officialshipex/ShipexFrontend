import icon from "./assets/Group.png" // used only once branding has actually resolved and the company has no favicon of its own
import { useBranding } from "./context/BrandingContext";
const SpinnerWithCompanyIcon = () => {
    // Withheld while branding is still loading, so this spinner — reused across
    // nearly every table/list in the app — never flashes the platform's own icon
    // for a company that has its own favicon (this was the "sometimes shows
    // Shipex, sometimes shows my logo" glitch: whichever had resolved first).
    const { faviconUrl, loading } = useBranding();
    return (
        <div className="flex justify-center items-center h-20">
            <div className="relative w-10 h-10">
                {/* Spinner Circle */}
                <div className="absolute inset-0 rounded-full border-4 border-t-gray-300 border-r-gray-300 border-b-brand-primary border-l-brand-primary animate-spin"></div>

                {/* Company Logo in Center */}
                {!loading && (
                    <img
                        src={faviconUrl || icon}
                        alt="Company Logo"
                        className="absolute inset-0 m-auto w-5 h-5 object-contain"
                    />
                )}
            </div>
        </div>
    );
};
export default SpinnerWithCompanyIcon;