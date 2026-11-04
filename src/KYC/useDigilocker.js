// Aadhaar through DigiLocker (backend kyc/digilocker.js): opens Cashfree's DigiLocker link in a new window, then asks
// the backend every few seconds until DigiLocker says verified / refused / expired.
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const BASE = `${process.env.REACT_APP_BACKEND_URL}/merchant/verfication/digilocker`;
const POLL_MS = 4000;
const GIVE_UP_MS = 11 * 60 * 1000; // the link itself is valid for 10 minutes

const post = (path, body) =>
  axios.post(`${BASE}/${path}`, body, { headers: { authorization: `Bearer ${Cookies.get("session")}` } });

// null when the browser blocks pop-ups: the page then shows an "Open DigiLocker" link instead
function openBlankWindow() {
  try {
    const w = window.open("", "digilocker", "width=520,height=760");
    if (w) w.document.write('<p style="font-family:system-ui;padding:24px">Opening DigiLocker…</p>');
    return w;
  } catch {
    return null;
  }
}

/** phase: "idle" | "starting" | "waiting". onVerified gets the backend's answer (data = the saved Aadhaar). */
export function useDigilocker({ onVerified, onFailed }) {
  const [phase, setPhase] = useState("idle");
  const [link, setLink] = useState("");
  const verificationId = useRef("");
  const timer = useRef(null);
  const deadline = useRef(0);
  const inFlight = useRef(false);
  const win = useRef(null);
  const cb = useRef({ onVerified, onFailed });
  useEffect(() => { cb.current = { onVerified, onFailed }; }, [onVerified, onFailed]);

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    verificationId.current = "";
    setPhase("idle");
    setLink("");
    try { if (win.current && !win.current.closed) win.current.close(); } catch { /* ignore */ }
    win.current = null;
  }, []);

  const checkNow = useCallback(async () => {
    const id = verificationId.current;
    if (!id || inFlight.current) return;
    if (Date.now() > deadline.current) {
      stop();
      cb.current.onFailed("The DigiLocker link expired. Please start again.");
      return;
    }
    inFlight.current = true;
    try {
      const res = await post("status", { verificationId: id });
      if (verificationId.current !== id) return;
      const body = res.data || {};
      if (body.status === "VERIFIED") {
        stop();
        cb.current.onVerified(body);
      } else if (body.status === "FAILED" || body.success === false) {
        stop();
        cb.current.onFailed(body.message || "DigiLocker verification failed. Please try again or use OTP.");
      }
    } catch (err) {
      const status = err?.response?.status;
      // a refusal (4xx) is final; a network blip or 5xx is retried on the next tick
      if (status && status < 500 && verificationId.current === id) {
        stop();
        cb.current.onFailed(err?.response?.data?.message || "DigiLocker verification failed. Please try again or use OTP.");
      }
    } finally {
      inFlight.current = false;
    }
  }, [stop]);

  const start = useCallback(async (aadhaarNo) => {
    if (phase !== "idle") return;
    const popup = openBlankWindow(); // opened inside the click so the browser does not block it
    setPhase("starting");
    try {
      const res = await post("start", { aadhaarNo });
      const body = res.data || {};
      if (body.alreadyVerified) {
        try { popup?.close(); } catch { /* ignore */ }
        setPhase("idle");
        cb.current.onVerified({ ...body, status: "VERIFIED" });
        return;
      }
      if (!body.success || !body.url || !body.verificationId) throw new Error(body.message || "Could not open DigiLocker");
      verificationId.current = body.verificationId;
      deadline.current = Date.now() + GIVE_UP_MS;
      setLink(body.url);
      if (popup && !popup.closed) {
        popup.location.href = body.url;
        win.current = popup;
      }
      setPhase("waiting");
      timer.current = window.setInterval(() => { checkNow(); }, POLL_MS);
    } catch (err) {
      try { popup?.close(); } catch { /* ignore */ }
      setPhase("idle");
      cb.current.onFailed(err?.response?.data?.message || err?.message || "Could not open DigiLocker. Please try again or use OTP.");
    }
  }, [phase, checkNow]);

  // The return page (public/digilocker-return.html) tells us DigiLocker is done: check at once.
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin === window.location.origin && e.data?.type === "digilocker-return") checkNow();
    };
    const onFocus = () => { if (verificationId.current) checkNow(); };
    window.addEventListener("message", onMessage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("focus", onFocus);
    };
  }, [checkNow]);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  return { phase, link, start, cancel: stop, checkNow };
}
