// The order id the seller knows the order by, exported as "Customer Order ID" next to our own Order ID:
// the id they gave on bulk upload / the external API (clientOrderId), else the channel's order name
// (e.g. Shopify "#VN55038"). Rows built by the backend (passbook, COD, weight discrepancy) already carry
// it as customerOrderId. Same rule as the backend's utils/customerOrderId.js.
export const customerOrderIdOf = (row) =>
  row?.customerOrderId || row?.clientOrderId || row?.channelOrderName || "";

// The reference shown in brackets next to our Order ID on the order list / details: the same id, falling
// back to the raw channelId for older synced orders that have no channelOrderName yet.
export const orderReferenceOf = (order) => customerOrderIdOf(order) || order?.channelId || "";
