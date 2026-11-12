import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../Notification";

// Downloads a file from a login-only backend route and saves it.
// window.open(url) / <a href={url}> cannot send the login token, so such routes answer
// "Authorization header is missing"; this fetches the file with the token instead.
export async function downloadWithAuth(url, fallbackName, { params } = {}) {
  const token = Cookies.get("session");
  try {
    const res = await axios.get(url, {
      params,
      responseType: "blob",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const disposition = res.headers?.["content-disposition"] || "";
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    const name = match ? decodeURIComponent(match[1]) : fallbackName;

    const href = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    return true;
  } catch (err) {
    let message = "Download failed. Please try again.";
    const data = err?.response?.data;
    if (data instanceof Blob) {
      try { message = JSON.parse(await data.text())?.message || message; } catch { /* not JSON */ }
    } else if (data?.message) {
      message = data.message;
    }
    Notification(message, "error");
    return false;
  }
}
