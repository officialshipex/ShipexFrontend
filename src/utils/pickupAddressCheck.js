// Couriers refuse a pickup address that is only words: it must carry a house / flat / plot / road number.
// Same rule as the backend (utils/pickupAddressCheck.js), checked before saving so the seller sees it at once.
export const PICKUP_ADDRESS_NEEDS_NUMBER =
  "Please add House No / Flat No / Plot No in the pickup address. The pickup address cannot be only text.";

export const pickupAddressHasNumber = (address) => /\d/.test(String(address || ""));
