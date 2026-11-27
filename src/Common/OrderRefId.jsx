import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy } from "lucide-react";

// A Customer Order ID (or channel order name) in a list, card or header. Customer Order IDs can be up to 100
// characters, so only the first `max` characters are shown; hovering (or tapping, on touch screens) shows the full
// id, and the copy icon copies the full id. Clicks never reach the row underneath (rows open the order).
// The tooltip is drawn in document.body so a table's scroll container can't cut it off. The copy control is a
// span (not a <button>) because the id also sits inside clickable rows that are buttons.

const copyText = async (text) => {
    if (!text) return false;
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // fall back below
        }
    }
    try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
};

const OrderRefId = ({ value, max = 12, brackets = false, label = "Customer Order ID", className = "", iconSize = 11 }) => {
    const full = value == null ? "" : String(value).trim();
    const ref = useRef(null);
    const [tip, setTip] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return undefined;
        const t = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(t);
    }, [copied]);

    // a tap outside closes a tooltip opened by tapping; scrolling closes it too (it would float away from the id)
    useEffect(() => {
        if (!tip) return undefined;
        const close = (e) => {
            if (e.type === "pointerdown" && ref.current && ref.current.contains(e.target)) return;
            setTip(null);
        };
        document.addEventListener("pointerdown", close);
        window.addEventListener("scroll", close, true);
        return () => {
            document.removeEventListener("pointerdown", close);
            window.removeEventListener("scroll", close, true);
        };
    }, [tip]);

    if (!full) return null;
    const short = full.length > max ? `${full.slice(0, max)}…` : full;

    const open = () => {
        const r = ref.current && ref.current.getBoundingClientRect();
        if (!r) return;
        // ids near the right edge open their tooltip leftward, so it stays on screen
        const right = r.left > window.innerWidth / 2;
        setTip({ x: right ? Math.min(r.right, window.innerWidth - 8) : Math.max(r.left, 8), y: r.top, right });
    };

    const doCopy = (e) => {
        e.stopPropagation();
        e.preventDefault();
        copyText(full).then((ok) => ok && setCopied(true));
    };

    return (
        <span
            ref={ref}
            className={`inline-flex items-center gap-1 min-w-0 max-w-full align-middle ${className}`}
            onMouseEnter={open}
            onMouseLeave={() => setTip(null)}
            onClick={(e) => {
                e.stopPropagation();
                if (tip) setTip(null);
                else open();
            }}
        >
            <span className="whitespace-nowrap cursor-default">{brackets ? `(${short})` : short}</span>
            <span
                role="button"
                tabIndex={0}
                onClick={doCopy}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") doCopy(e);
                }}
                title={copied ? "Copied" : `Copy ${label}`}
                aria-label={`Copy ${label} ${full}`}
                className="shrink-0 inline-flex items-center justify-center rounded p-0.5 cursor-pointer text-gray-400 hover:text-brand-primary focus:outline-none"
            >
                {copied ? (
                    <Check style={{ width: iconSize, height: iconSize }} className="text-green-600" />
                ) : (
                    <Copy style={{ width: iconSize, height: iconSize }} />
                )}
            </span>
            {tip &&
                createPortal(
                    <div
                        role="tooltip"
                        className="fixed z-[9999] pointer-events-none"
                        style={{
                            left: tip.x,
                            top: tip.y - 6,
                            transform: tip.right ? "translate(-100%, -100%)" : "translateY(-100%)",
                            maxWidth: "min(420px, calc(100vw - 16px))",
                        }}
                    >
                        <div className="bg-gray-800 text-white text-[11px] leading-4 font-normal normal-case py-1.5 px-2.5 rounded-md shadow-xl break-all">
                            <span className="text-gray-300">{label}: </span>
                            {full}
                            {copied && <span className="ml-1.5 text-green-300">Copied</span>}
                        </div>
                    </div>,
                    document.body
                )}
        </span>
    );
};

export default OrderRefId;
