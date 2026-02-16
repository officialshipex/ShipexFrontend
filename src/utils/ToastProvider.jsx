import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, X, AlertTriangle, Info, XCircle } from "lucide-react";

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback(
        (message, { type = "success", duration = 3000 } = {}) => {
            console.log("showToast called with:", message, type);
            const id = Date.now();
            setToasts((prev) => [...prev, { id, message, type }]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        },
        []
    );

    const typeStyles = {
        success: {
            bg: "bg-green-100 border-green-300 text-green-800",
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        },
        error: {
            bg: "bg-red-100 border-red-300 text-red-800",
            icon: <XCircle className="w-5 h-5 text-red-600" />, // <-- proper error icon
        },
        warning: {
            bg: "bg-yellow-100 border-yellow-300 text-yellow-800",
            icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        },
        info: {
            bg: "bg-blue-100 border-blue-300 text-blue-800",
            icon: <Info className="w-5 h-5 text-blue-600" />,
        },
    };

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div className="fixed top-4 right-4 space-y-2 z-50">
                {toasts.map((toast) => {
                    const { bg, icon } = typeStyles[toast.type] || typeStyles.success;
                    return (
                        <div
                            id={`toast-${toast.id}`}
                            key={toast.id}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-md border ${bg} 
        animate-toast-in`}
                        >
                            {icon}
                            <span className="text-sm">{toast.message}</span>
                            <X
                                className="w-4 h-4 cursor-pointer ml-2"
                                onClick={() => {
                                    const toastDiv = document.getElementById(`toast-${toast.id}`);
                                    if (toastDiv) {
                                        toastDiv.classList.remove("animate-toast-in");
                                        toastDiv.classList.add("animate-toast-out");
                                        setTimeout(() => {
                                            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                                        }, 300); // match exit animation duration
                                    }
                                }}
                            />

                        </div>
                    );
                })}

            </div>
        </ToastContext.Provider>
    );
};
