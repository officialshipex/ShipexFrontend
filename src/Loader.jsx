import icon from "./assets/Group.png" // falls back to this until the company's own favicon loads (or if it never uploaded one)
import { useBranding } from "./context/BrandingContext";
const SpinnerWithCompanyIcon = () => {
    const { faviconUrl } = useBranding();
    return (
        <div className="flex justify-center items-center h-20">
            <div className="relative w-10 h-10">
                {/* Spinner Circle */}
                <div className="absolute inset-0 rounded-full border-4 border-t-gray-300 border-r-gray-300 border-b-brand-primary border-l-brand-primary animate-spin"></div>

                {/* Company Logo in Center */}
                <img
                    src={faviconUrl || icon}
                    alt="Company Logo"
                    className="absolute inset-0 m-auto w-5 h-5 object-contain"
                />
            </div>
        </div>
    );
};
export default SpinnerWithCompanyIcon;