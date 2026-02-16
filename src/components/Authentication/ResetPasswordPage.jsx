import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Notification } from "../../Notification";

const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Extract token from query parameters on page load
    useEffect(() => {
        const tokenParam = searchParams.get("token");
        if (!tokenParam) {
            Notification("Invalid or missing reset token", "error");
              navigate("/login");
        } else {
            setToken(tokenParam);
        }
    }, [searchParams, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            Notification("Please enter and confirm your new password", "info");
            return;
        }

        if (newPassword !== confirmPassword) {
            Notification("Passwords do not match", "error");
            return;
        }

        if (!token) {
            Notification("Reset token is missing", "error");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URL}/auth/reset-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, newPassword }),
                }
            );
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Failed to reset password");

            Notification("Your password has been reset successfully!", "success");
            navigate("/login");
        } catch (error) {
            Notification(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center bg-gray-100 p-4 mt-10">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
            >
                <h2 className="text-[16px] sm:text-[18px] font-[600] mb-6 text-center text-gray-700">
                    Reset Your Password
                </h2>

                {/* New Password Input */}
                <div className="relative mb-2">
                    <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="border rounded-lg px-3 py-2 w-full text-[12px] sm:text-[14px] outline-none focus:ring-1 focus:ring-[#0CBB7D] pr-10"
                        required
                    />
                    <span
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-2.5 cursor-pointer text-gray-500 hover:text-[#0CBB7D]"
                    >
                        {showNewPassword ? <FaEye /> : <FaEyeSlash />}
                    </span>
                </div>

                {/* Confirm Password Input */}
                <div className="relative mb-6">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border rounded-lg px-3 py-2 w-full text-[12px] sm:text-[14px] outline-none focus:ring-1 focus:ring-[#0CBB7D] pr-10"
                        required
                    />
                    <span
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-2.5 cursor-pointer text-gray-500 hover:text-[#0CBB7D]"
                    >
                        {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                    </span>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#0CBB7D] text-white text-[12px] sm:text-[14px] w-full px-3 py-2 rounded-lg font-[600] hover:bg-[#0ba76e] transition disabled:opacity-70"
                >
                    {loading ? "Saving..." : "Save"}
                </button>

            </form>
        </div>
    );
};

export default ResetPasswordPage;
