// Couriers refuse a pickup address that is only words: it must carry a house / flat / plot / road number.
// Same rule as the backend (utils/pickupAddressCheck.js), checked before saving so the seller sees it at once.
export const PICKUP_ADDRESS_NEEDS_NUMBER =
  "Please add House No / Flat No / Plot No in the pickup address. The pickup address cannot be only text.";

export const pickupAddressHasNumber = (address) => /\d/.test(String(address || ""));

// Every field of a pickup address is mandatory, email included (same messages as the backend).
// Returns the first problem, or null.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LABELS = { contactName: "contact name", phoneNumber: "phone number", address: "address", pinCode: "pincode", city: "city", state: "state" };
export const pickupAddressProblem = (a = {}) => {
  const val = (f) => String(a?.[f] ?? "").trim();
  if (!val("contactName")) return `Please enter the ${LABELS.contactName} for the pickup address.`;
  if (!val("email")) return "Please enter the email for the pickup address.";
  if (!EMAIL_RE.test(val("email"))) return "Please enter a valid email for the pickup address (for example name@example.com).";
  for (const f of ["phoneNumber", "address", "pinCode", "city", "state"]) {
    if (!val(f)) return `Please enter the ${LABELS[f]} for the pickup address.`;
  }
  if (!pickupAddressHasNumber(a.address)) return PICKUP_ADDRESS_NEEDS_NUMBER;
  return null;
};
