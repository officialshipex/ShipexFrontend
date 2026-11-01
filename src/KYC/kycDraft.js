import { useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";

// Unfinished KYC forms are kept on the server (backend kyc/kycDraft.js), so a seller can leave and continue later.
const DRAFT_URL = `${process.env.REACT_APP_BACKEND_URL}/merchant/verfication/manual-kyc/draft`;
const headers = () => ({ Authorization: `Bearer ${Cookies.get("session")}` });

export const loadDraft = async () => {
  try {
    const res = await axios.get(DRAFT_URL, { headers: headers() });
    return res.data && res.data.draft ? res.data.draft : null;
  } catch (_) {
    return null; // the form simply starts empty
  }
};

export const saveDraft = (body) => axios.post(DRAFT_URL, body, { headers: headers() }).catch(() => {});

// Uploads one document straight away; the final submit then uses it without sending it again.
export const uploadDraftDocument = async (field, file) => {
  const fd = new FormData();
  fd.append(field, file);
  const res = await axios.post(`${DRAFT_URL}/document/${field}`, fd, { headers: headers() });
  return res.data.document;
};

export const removeDraftDocument = (field) => axios.post(`${DRAFT_URL}/document/${field}/remove`, {}, { headers: headers() });

// Saves `payload` shortly after it stops changing, and on leaving the form. Off until `enabled` (the draft has loaded).
export function useDraftAutosave(payload, enabled) {
  const json = JSON.stringify(payload);
  const unsaved = useRef(null);
  const lastSaved = useRef(null);

  const flush = () => {
    if (unsaved.current === null) return;
    const body = unsaved.current;
    unsaved.current = null;
    lastSaved.current = body;
    saveDraft(JSON.parse(body)); // a refusal (KYC just submitted) or a network error only costs the latest keystrokes
  };

  useEffect(() => {
    if (!enabled) {
      unsaved.current = null;
      return undefined;
    }
    if (json === lastSaved.current) return undefined;
    unsaved.current = json;
    const timer = setTimeout(flush, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json, enabled]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => flush, []);
}
