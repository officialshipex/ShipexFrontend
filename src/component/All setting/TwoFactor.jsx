import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { FiAlertCircle, FiArrowLeft, FiCheckCircle, FiClock, FiShield, FiSmartphone } from "react-icons/fi";
import { Notification } from "../../Notification";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const OTP_LENGTH = 6;

const errorOf = (err) => err?.response?.data || {};

// Counts a number of seconds down to 0. Call start(n) to begin again.
function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  const endRef = useRef(0);
  const running = seconds > 0;

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      setSeconds(Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  const start = (next) => {
    endRef.current = Date.now() + next * 1000;
    setSeconds(Math.max(0, Math.ceil(next)));
  };

  return { seconds, start };
}

const formatCountdown = (total) => `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;

function OtpBoxes({ value, onChange, onComplete, disabled, hasError, focusWhen = true }) {
  const refs = useRef([]);

  useEffect(() => {
    if (!focusWhen || disabled || value) return undefined;
    const timer = setTimeout(() => refs.current[0]?.focus(), 50);
    return () => clearTimeout(timer);
  }, [focusWhen, disabled, value]);

  const apply = (next, focusIndex) => {
    const clean = next.replace(/\D/g, "").slice(0, OTP_LENGTH);
    onChange(clean);
    refs.current[Math.min(focusIndex, OTP_LENGTH - 1)]?.focus();
    if (clean.length === OTP_LENGTH && clean !== value) onComplete?.(clean);
  };

  const onBoxChange = (index, raw) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    // a browser filling in the SMS code, or a typed digit in a filled box
    apply(value.slice(0, index) + digits + value.slice(index + digits.length), index + digits.length);
  };

  const onKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[index]) apply(value.slice(0, index) + value.slice(index + 1), index);
      else if (index > 0) apply(value.slice(0, index - 1) + value.slice(index), index - 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="One-time password">
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          disabled={disabled}
          value={value[index] || ""}
          onChange={(e) => onBoxChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={(e) => {
            e.preventDefault();
            apply(e.clipboardData.getData("text"), OTP_LENGTH - 1);
          }}
          onFocus={(e) => e.target.select()}
          className={`w-9 h-10 md:w-10 md:h-11 text-center text-[14px] font-[600] text-gray-700 border rounded-lg outline-none focus:ring-1 disabled:bg-gray-100 disabled:text-gray-400 ${hasError ? "border-red-500 focus:ring-red-500" : "focus:ring-brand-primary"}`}
        />
      ))}
    </div>
  );
}

// The back of the login card: the OTP step after a correct email and password.
export function LoginOtpFace({ challenge, active, onBack, onSuccess }) {
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resending, setResending] = useState(false);
  const resend = useCountdown();
  const block = useCountdown();

  // each new login attempt starts this side afresh
  useEffect(() => {
    if (!challenge) return;
    setOtp("");
    setStatus("idle");
    setError("");
    setNotice(challenge.message || "");
    resend.start(challenge.resendInSeconds || 0);
    block.start(challenge.retryAfterSeconds || 0);
  }, [challenge]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!challenge) return null;

  const verify = async (code) => {
    if (status !== "idle") return;
    setStatus("verifying");
    setError("");
    try {
      const response = await axios.post(`${REACT_APP_BACKEND_URL}/two-factor/login/verify`, {
        challengeToken: challenge.challengeToken,
        otp: code,
      });
      setStatus("success");
      setNotice("");
      onSuccess(response.data);
    } catch (err) {
      const data = errorOf(err);
      setStatus("idle");
      setOtp("");
      if (data.code === "CHALLENGE_EXPIRED") {
        onBack(data.message);
        return;
      }
      setNotice("");
      setError(data.message || "Could not verify the OTP. Please try again.");
    }
  };

  const resendOtp = async () => {
    setResending(true);
    setError("");
    try {
      const response = await axios.post(`${REACT_APP_BACKEND_URL}/two-factor/login/resend`, {
        challengeToken: challenge.challengeToken,
      });
      setOtp("");
      setNotice(response.data.message);
      resend.start(response.data.resendInSeconds || 0);
      block.start(response.data.retryAfterSeconds || 0);
    } catch (err) {
      const data = errorOf(err);
      if (data.code === "CHALLENGE_EXPIRED") {
        onBack(data.message);
        return;
      }
      if (data.code === "OTP_BLOCKED") block.start(data.retryAfterSeconds || 0);
      if (data.code === "OTP_COOLDOWN") resend.start(data.retryAfterSeconds || 0);
      setNotice("");
      setError(data.message || "Could not send the OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <fieldset disabled={!active} className="space-y-3">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-brand-secondary/8 flex items-center justify-center">
          <FiShield className="text-brand-primary text-[18px]" />
        </div>
        <h1 className="text-[18px] md:text-[24px] font-[600] mb-1 text-brand-primary">Verify it's you</h1>
        <p className="text-gray-500 text-[12px] font-[600]">
          Enter the {OTP_LENGTH}-digit OTP sent to your registered mobile number {challenge.maskedPhone}.
        </p>
      </div>

      <OtpBoxes
        value={otp}
        onChange={(value) => { setOtp(value); if (error) setError(""); }}
        onComplete={verify}
        disabled={status !== "idle" || !active}
        hasError={!!error}
        focusWhen={active}
      />

      {error && (
        <p className="flex items-start gap-1.5 text-[12px] text-red-500 font-[600]">
          <FiAlertCircle className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
      {!error && notice && status === "idle" && (
        <p className="flex items-start gap-1.5 text-[12px] text-brand-primary font-[600]">
          <FiCheckCircle className="mt-0.5 shrink-0" /> {notice}
        </p>
      )}
      {status === "success" && (
        <p className="flex items-start gap-1.5 text-[12px] text-brand-primary font-[600]">
          <FiCheckCircle className="mt-0.5 shrink-0" /> OTP verified. Login successful! Redirecting...
        </p>
      )}

      <button
        type="button"
        onClick={() => verify(otp)}
        disabled={otp.length !== OTP_LENGTH || status !== "idle"}
        className={`py-2 px-3 text-[12px] font-[600] rounded-lg w-full transition ${otp.length !== OTP_LENGTH || status !== "idle" ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-brand-primary text-white hover:bg-opacity-90"}`}
      >
        {status === "verifying" ? "Verifying..." : "Verify & Login"}
      </button>

      <div className="text-center text-[12px] font-[600] text-gray-500">
        {block.seconds > 0 ? (
          <span className="text-amber-700">OTP limit reached (3 per hour). You can request a new one in {formatCountdown(block.seconds)}.</span>
        ) : resend.seconds > 0 ? (
          <span>Didn't get the OTP? Resend in {resend.seconds}s</span>
        ) : (
          <span>
            Didn't get the OTP?{" "}
            <button type="button" onClick={resendOtp} disabled={resending || status !== "idle"} className="text-brand-primary hover:underline disabled:opacity-50">
              {resending ? "Sending..." : "Resend OTP"}
            </button>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onBack()}
        disabled={status !== "idle"}
        className="mx-auto flex items-center gap-1.5 text-[12px] font-[600] text-gray-500 hover:text-gray-700 disabled:opacity-50"
      >
        <FiArrowLeft /> Back to login
      </button>
    </fieldset>
  );
}

// An admin looking at a seller's profile: the status, and the way back in for a seller who lost their mobile.
export function TwoFactorAdminCard({ userId }) {
  const [enabled, setEnabled] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    axios.get(`${REACT_APP_BACKEND_URL}/two-factor/admin/${userId}`)
      .then((res) => { if (alive) setEnabled(!!res.data.enabled); })
      .catch(() => { if (alive) Notification("Could not load the two-factor status.", "error"); });
    return () => { alive = false; };
  }, [userId]);

  const disable = async () => {
    setSaving(true);
    try {
      const res = await axios.post(`${REACT_APP_BACKEND_URL}/two-factor/admin/${userId}/disable`);
      setEnabled(false);
      setConfirming(false);
      Notification(res.data.message, "success");
    } catch (err) {
      Notification(errorOf(err).message || "Could not turn off two-factor authentication.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 w-full">
      <h2 className="flex items-center gap-2 text-[12px] sm:text-[14px] font-[600] text-gray-700 mb-2">
        <FiShield className="text-brand-primary" /> Two-Factor Authentication
      </h2>
      {enabled === null ? (
        <p className="text-[12px] text-gray-500">Loading...</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] text-gray-500">
            This user has two-factor authentication <span className="font-[600] text-gray-700">{enabled ? "enabled" : "disabled"}</span>. Only the user can turn it on.
          </p>
          {enabled && !confirming && (
            <button type="button" onClick={() => setConfirming(true)} className="self-start px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[12px] font-[600]">
              Turn off for this user
            </button>
          )}
          {enabled && confirming && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex flex-col gap-2">
              <p className="text-[12px] text-red-700">Use this only when the user can no longer receive OTPs. Their next login will need just the email and password.</p>
              <div className="flex gap-2">
                <button type="button" onClick={disable} disabled={saving} className="px-3 py-2 rounded-lg bg-red-600 text-white text-[12px] font-[600] disabled:opacity-50">
                  {saving ? "Turning off..." : "Yes, turn off"}
                </button>
                <button type="button" onClick={() => setConfirming(false)} disabled={saving} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-[12px] font-[600]">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// The account owner's own two-factor switch. Used by the Company Profile page and the Settings page.
export default function TwoFactor() {
  const [status, setStatus] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [pending, setPending] = useState(null); // the change waiting for an OTP
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const resend = useCountdown();
  const block = useCountdown();

  const applyStatus = useCallback((next) => {
    setStatus(next);
    if (next.blockedSeconds) block.start(next.blockedSeconds);
    if (next.resendInSeconds) resend.start(next.resendInSeconds);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    setLoadFailed(false);
    axios.get(`${REACT_APP_BACKEND_URL}/two-factor/status`)
      .then((res) => applyStatus(res.data))
      .catch(() => setLoadFailed(true));
  }, [applyStatus]);

  useEffect(() => { load(); }, [load]);

  const sendOtp = async (target) => {
    setSending(true);
    setOtpError("");
    try {
      const res = await axios.post(`${REACT_APP_BACKEND_URL}/two-factor/settings/send-otp`);
      setPending(target);
      setOtp("");
      setNotice(res.data.message);
      resend.start(res.data.resendInSeconds || 0);
      if (res.data.retryAfterSeconds) block.start(res.data.retryAfterSeconds);
      Notification(res.data.message, "success");
    } catch (err) {
      const data = errorOf(err);
      if (data.code === "OTP_BLOCKED") {
        block.start(data.retryAfterSeconds || 0);
        Notification(data.message, "error");
      } else if (data.code === "OTP_COOLDOWN") {
        // an OTP went out moments ago: it is still the one to enter
        setPending(target);
        resend.start(data.retryAfterSeconds || 0);
        setNotice(`Enter the OTP already sent to ${status?.maskedPhone || "your mobile"}.`);
      } else {
        Notification(data.message || "Could not send the OTP. Please try again.", "error");
      }
    } finally {
      setSending(false);
    }
  };

  const submitChange = async (target, code) => {
    setBusy(true);
    setOtpError("");
    try {
      const res = await axios.post(`${REACT_APP_BACKEND_URL}/two-factor/settings/change`, { enabled: target, ...(code ? { otp: code } : {}) });
      applyStatus(res.data);
      setPending(null);
      setOtp("");
      setNotice("");
      Notification(res.data.message, "success");
    } catch (err) {
      const data = errorOf(err);
      if (data.code === "OTP_REQUIRED") {
        // the 24 hours ran out while this page was open
        setStatus((s) => (s ? { ...s, otpRequired: true } : s));
        await sendOtp(target);
      } else if (pending !== null) {
        setOtp("");
        setOtpError(data.message || "Could not verify the OTP. Please try again.");
      } else {
        Notification(data.message || "Could not update two-factor authentication.", "error");
      }
    } finally {
      setBusy(false);
    }
  };

  // An admin signed in as this seller: the OTP would go to the seller's mobile
  const readOnly = !!localStorage.getItem("admin_token_backup");

  const onToggle = () => {
    if (!status || busy || sending || readOnly) return;
    const target = !status.enabled;
    if (status.otpRequired) sendOtp(target);
    else submitChange(target);
  };

  const cancelOtp = () => {
    setPending(null);
    setOtp("");
    setOtpError("");
    setNotice("");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 w-full">
      <h2 className="flex items-center gap-2 text-[12px] sm:text-[14px] font-[600] text-gray-700 mb-3">
        <FiShield className="text-brand-primary" /> Two-Factor Authentication
      </h2>

      {!status && !loadFailed && <p className="text-[12px] text-gray-500">Loading...</p>}

      {loadFailed && (
        <p className="text-[12px] text-red-500">
          Could not load your two-factor settings.{" "}
          <button type="button" onClick={load} className="font-[600] underline">Try again</button>
        </p>
      )}

      {status && !status.available && (
        <p className="text-[12px] text-gray-500">
          {status.ownerOnly ? "Only the account owner can change two-factor authentication." : "Two-factor authentication is not available for your company."}
        </p>
      )}

      {status?.available && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3">
            <div className="min-w-0">
              <p className="text-[12px] font-[600] text-gray-700">{status.enabled ? "Enabled" : "Disabled"}</p>
              <p className="text-[12px] text-gray-500 mt-1">
                When enabled, each login needs an OTP sent to your registered mobile number, after your email and password.
              </p>
              {status.maskedPhone && (
                <p className="text-[12px] text-gray-500 mt-1 flex items-center gap-1.5">
                  <FiSmartphone className="shrink-0" /> {status.maskedPhone}
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!status.enabled}
              aria-label="Two-factor authentication"
              disabled={busy || sending || readOnly || pending !== null || (status.otpRequired && block.seconds > 0)}
              onClick={onToggle}
              className={`relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${status.enabled ? "bg-brand-primary" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${status.enabled ? "translate-x-4" : ""}`} />
            </button>
          </div>

          {readOnly && (
            <p className="text-[12px] text-gray-500">You are signed in as this seller. Only the seller can change this setting, as the OTP goes to their mobile.</p>
          )}

          {sending && pending === null && <p className="text-[12px] text-gray-500">Sending OTP...</p>}

          {pending === null && !status.otpRequired && !readOnly && (
            <p className="flex items-start gap-1.5 text-[12px] text-brand-primary">
              <FiCheckCircle className="mt-0.5 shrink-0" />
              OTP verified. You can change this setting without an OTP for the next {Math.max(1, Math.ceil((status.verifiedSeconds || 0) / 3600))} hour(s).
            </p>
          )}

          {block.seconds > 0 && status.otpRequired && pending === null && (
            <p className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 text-[12px] text-amber-700">
              <FiClock className="mt-0.5 shrink-0" />
              You have reached the limit of 3 OTPs. You can request a new one in {formatCountdown(block.seconds)}.
            </p>
          )}

          {pending !== null && (
            <div className="rounded-lg border border-gray-200 p-3 flex flex-col gap-3">
              <div className="text-center">
                <p className="text-[12px] font-[600] text-gray-700">
                  Enter the OTP to {pending ? "enable" : "disable"} two-factor authentication
                </p>
                {notice && <p className="text-[12px] text-gray-500 mt-1">{notice}</p>}
              </div>

              <OtpBoxes
                value={otp}
                onChange={(value) => { setOtp(value); if (otpError) setOtpError(""); }}
                onComplete={(code) => submitChange(pending, code)}
                disabled={busy}
                hasError={!!otpError}
              />

              {otpError && (
                <p className="flex items-start justify-center gap-1.5 text-[12px] text-red-500 text-center">
                  <FiAlertCircle className="mt-0.5 shrink-0" /> {otpError}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button type="button" onClick={cancelOtp} disabled={busy} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-[12px] font-[600] disabled:opacity-50">
                  Cancel
                </button>
                <div className="flex items-center gap-3 ml-auto">
                  {block.seconds > 0 ? (
                    <span className="text-[12px] text-amber-700">OTP limit reached. Resend in {formatCountdown(block.seconds)}</span>
                  ) : resend.seconds > 0 ? (
                    <span className="text-[12px] text-gray-500">Resend in {resend.seconds}s</span>
                  ) : (
                    <button type="button" onClick={() => sendOtp(pending)} disabled={sending || busy} className="text-[12px] font-[600] text-brand-primary hover:underline disabled:opacity-50">
                      {sending ? "Sending..." : "Resend OTP"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => submitChange(pending, otp)}
                    disabled={busy || otp.length !== OTP_LENGTH}
                    className="px-3 py-2 rounded-lg bg-brand-primary text-white text-[12px] font-[600] hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
