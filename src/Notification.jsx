import { useToast } from "./utils/ToastProvider";

let show;

export const Notification = (message, type = "success") => {
    console.log("notiti")
    try {
        console.log("Notification show is:", message);
        if (show) {
            
            show(message, { type });   // ✅ pass as object
        } else {
            console.warn("ToastProvider not mounted yet");
        }
    } catch (err) {
        console.error("Notification error:", err);
    }
};


// Hook to capture the showToast function
export const ToastRegister = () => {
    const toast = useToast();
    console.log("ToastRegister assigned showToast:", toast);
    show = toast;
    return null;
};
