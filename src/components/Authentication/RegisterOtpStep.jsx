import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

// OTP check of the email AND mobile number before an account is created — only when this company has
// "OTP at registration" switched on (QuickPost > System > Companies). The register call then carries
// emailOtpToken + phoneOtpToken; the backend refuses it without them.
//
//   const otp = useRegisterOtp();
//   const tokens = await otp.verify(email, phone);   // null = closed by the user
//   ... register with { ...form, ...tokens } ...
//   {otp.dialog}

const API = process.env.REACT_APP_BACKEND_URL;
const normEmail = (v) => String(v || "").trim().toLowerCase();
const normPhone = (v) => String(v || "").replace(/\D/g, "").slice(-10);

async function call(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok || data.success === false) {
    const err = new Error(data.message || "Something went wrong. Please try again.");
    err.retryAfter = data.retryAfter;
    err.status = res.status;
    throw err;
  }
  return data;
}

// fields: the form's input names, so "Change email / mobile" can put the cursor back in that field.
export function useRegisterOtp(fields = { email: "email", phone: "phoneNumber" }) {
  const [required, setRequired] = useState(null);
  const [open, setOpen] = useState(null); // { email, phone }
  const verified = useRef({}); // { email: { target, token }, phone: { target, token } }
  const resolver = useRef(null);
  const [, rerender] = useState(0);

  // Which of these two are verified already (for the ticks on the form).
  const status = (email, phone) => ({
    email: verified.current.email?.target === normEmail(email),
    phone: verified.current.phone?.target === normPhone(phone),
  });

  useEffect(() => {
    call("/auth/register-otp/config")
      .then((d) => setRequired(d.required === true))
      .catch(() => setRequired(false)); // an older backend: no OTP step (it would not ask for one either)
  }, []);

  const tokensFor = (email, phone) => {
    const e = verified.current.email, p = verified.current.phone;
    if (e?.target === normEmail(email) && p?.target === normPhone(phone)) {
      return { emailOtpToken: e.token, phoneOtpToken: p.token };
    }
    return null;
  };

  const verify = useCallback(async (email, phone) => {
    let need = required;
    if (need === null) {
      try { need = (await call("/auth/register-otp/config")).required === true; } catch { need = false; }
      setRequired(need);
    }
    if (!need) return {};
    const ready = tokensFor(email, phone);
    if (ready) return ready;
    return new Promise((resolve) => { resolver.current = resolve; setOpen({ email, phone }); });
  }, [required]);

  const finish = (t) => {
    setOpen(null);
    if (resolver.current) resolver.current(t);
    resolver.current = null;
  };

  const dialog = open ? (
    <RegisterOtpDialog
      email={open.email}
      phone={open.phone}
      already={verified.current}
      onVerified={(ch, v) => { verified.current = { ...verified.current, [ch]: v }; rerender((n) => n + 1); }}
      onDone={() => finish(tokensFor(open.email, open.phone))}
      onClose={() => finish(null)}
      onEdit={(ch) => {
        finish(null);
        setTimeout(() => {
          const el = document.querySelector(`input[name="${fields[ch]}"]`);
          if (el) { el.focus(); el.select(); }
        }, 50);
      }}
    />
  ) : null;

  return { required, verify, status, dialog };
}

// Shown on the form (under email + mobile) when this company asks for OTP at registration.
export function RegisterOtpFormBar({ otp, email, phone }) {
  if (otp.required !== true) return null;
  const s = otp.status(email || "", phone || "");
  const ready = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim()) && /^[6-9]\d{9}$/.test(normPhone(phone));
  const tick = (ok, label) => (
    <span className={`text-[11px] font-[600] ${ok ? "text-green-600" : "text-gray-400"}`}>
      {ok ? "✓" : "○"} {label} {ok ? "verified" : "not verified"}
    </span>
  );
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-col">
        <span className="text-[12px] font-[600] text-gray-700">Verify your email and mobile with OTP</span>
        <div className="flex gap-3">{tick(s.email, "Email")}{tick(s.phone, "Mobile")}</div>
      </div>
      {!(s.email && s.phone) && (
        <button
          type="button"
          disabled={!ready}
          onClick={() => { otp.verify(email, phone); }}
          title={ready ? undefined : "Enter a valid email and 10-digit mobile number first"}
          className="py-1.5 px-3 rounded-lg bg-brand-primary text-white text-[12px] font-[600] disabled:opacity-50 shrink-0"
        >
          Send OTP
        </button>
      )}
    </div>
  );
}

function OtpRow({ channel, label, shown, target, already, onVerified, onEdit }) {
  const [done, setDone] = useState(already?.target === target);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);
  const [msg, setMsg] = useState(null); // { ok, text }
  // already registered: no OTP can be sent, only changing it (or logging in) helps
  const [taken, setTaken] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const body = channel === "email" ? { channel, email: target } : { channel, phoneNumber: target };

  const send = async () => {
    setSending(true); setMsg(null);
    try {
      const d = await call("/auth/register-otp/send", body);
      setSent(true); setWait(d.resendAfter || 30);
      setMsg({ ok: true, text: d.message || "OTP sent" });
    } catch (e) {
      if (e.status === 409) { setTaken(e.message || `This ${label.toLowerCase()} is already registered.`); return; }
      if (e.retryAfter) { setSent(true); setWait(e.retryAfter); }
      setMsg({ ok: false, text: e.message });
    } finally { setSending(false); }
  };

  useEffect(() => {
    if (done || started.current) return;
    started.current = true;
    send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const check = async () => {
    if (!/^\d{6}$/.test(code)) { setMsg({ ok: false, text: "Enter the 6-digit OTP" }); return; }
    setChecking(true); setMsg(null);
    try {
      const d = await call("/auth/register-otp/verify", { ...body, otp: code });
      onVerified({ target, token: d.token });
      setDone(true);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally { setChecking(false); }
  };

  return (
    <div className={`rounded-lg border p-3 ${done ? "border-green-200 bg-green-50" : taken ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12px] font-[600] text-gray-700">{label}</p>
          <p className="text-[11px] text-gray-500 truncate">{shown}</p>
        </div>
        {done && <span className="text-[12px] font-[600] text-green-600 shrink-0">✓ Verified</span>}
      </div>
      {taken ? (
        <div className="mt-2">
          <p className="text-[11px] text-red-600">{taken}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onEdit}
              className="py-1.5 px-3 rounded-lg bg-brand-primary text-white text-[12px] font-[600]"
            >
              Change {channel === "email" ? "email" : "mobile number"}
            </button>
            <Link to="/login" className="text-[12px] font-[600] text-brand-primary">Log in instead</Link>
          </div>
        </div>
      ) : !done && (
        <>
          <div className="flex gap-2 mt-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); check(); } }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit OTP"
              className="flex-1 min-w-0 py-2 px-3 border rounded-lg text-[12px] font-[600] text-gray-700 outline-none tracking-[0.3em]"
            />
            <button
              type="button"
              onClick={check}
              disabled={checking || code.length !== 6}
              className="px-4 rounded-lg bg-brand-primary text-white text-[12px] font-[600] disabled:opacity-50 shrink-0"
            >
              {checking ? "Checking…" : "Verify"}
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 gap-2">
            {msg ? (
              <p className={`text-[11px] ${msg.ok ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>
            ) : <span />}
            <div className="flex items-center gap-3 shrink-0">
              <button type="button" onClick={onEdit} className="text-[11px] font-[600] text-gray-500 hover:text-gray-800">
                Change
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending || wait > 0}
                className="text-[11px] font-[600] text-brand-primary disabled:text-gray-400"
              >
                {sending ? "Sending…" : wait > 0 ? `Resend in ${wait}s` : sent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RegisterOtpDialog({ email, phone, already, onVerified, onDone, onClose, onEdit }) {
  const e = normEmail(email), p = normPhone(phone);
  const [ok, setOk] = useState({ email: already.email?.target === e, phone: already.phone?.target === p });
  const both = ok.email && ok.phone;

  // both verified: carry on with the registration by itself
  useEffect(() => {
    if (!both) return undefined;
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [both]);

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-5">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 text-[18px]">×</button>
        <h3 className="text-[16px] font-[600] text-brand-primary mb-1">Verify your email and mobile</h3>
        <p className="text-[12px] text-gray-500 mb-3">We send a 6-digit code to each. Enter both to create your account.</p>
        <div className="space-y-2">
          <OtpRow channel="email" label="Email" shown={String(email).trim()} target={e} already={already.email}
            onVerified={(v) => { onVerified("email", v); setOk((s) => ({ ...s, email: true })); }} onEdit={() => onEdit("email")} />
          <OtpRow channel="phone" label="Mobile number" shown={`+91 ${p}`} target={p} already={already.phone}
            onVerified={(v) => { onVerified("phone", v); setOk((s) => ({ ...s, phone: true })); }} onEdit={() => onEdit("phone")} />
        </div>
        {both && <p className="text-[11px] text-center mt-3 text-green-600 font-[600]">Verified. Creating your account…</p>}
      </div>
    </div>,
    document.body
  );
}
