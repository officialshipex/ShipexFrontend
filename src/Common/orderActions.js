import axios from "axios";
import Cookies from "js-cookie";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Notification } from "../Notification";
import { toTenantUrl } from "../utils/tenantApiDomain";
import { refreshNotifications } from "../utils/NotificationListProvider";
import { customerOrderIdOf } from "./customerOrderId";
import { startDownloadProgress } from "../utils/downloadProgress";
const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Plain fetch() calls skip the axios interceptor, which is what tells the backend which company a local
// (localhost) session is testing as. Without this header the PDF downloads below resolve the default company
// and answer "Order not found". Empty in production, where the real domain identifies the company.
// They also carry the login token: the backend only serves a label / invoice / manifest to the order's owner
// (or an admin). Every call below goes to our own backend.
const devTenantHeaders = () => {
  const devTenant = localStorage.getItem("dev_tenant_key") || localStorage.getItem("dev_tenant");
  const token = Cookies.get("session");
  return {
    ...(devTenant ? { "x-tenant-key": devTenant } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Amazon's shipments aren't only booked directly (provider "Amazon
// Shipping") — they're also booked through aggregator providers like
// Shiprocket and Jiffy, where the CourierService is created under that
// aggregator's provider name but its service name carries "ATS" (Amazon's
// own carrier code) as the admin-set naming convention marking it as an
// Amazon-fulfilled service. Either signal means the order should get
// Amazon's original label instead of the generated one.
export const isAmazonAtsOrder = (order) =>
  order?.provider === "Amazon Shipping" || /ats/i.test(order?.courierServiceName || "");

// Kicks off the backend bulk-ship job; progress/results surface via the navbar
// notification bell (JobDetailModal), not an inline popup — the server's
// partial-unique index on BulkShipJob.activeSlot is the sole duplicate-
// prevention mechanism (409 below), no client-side tracking needed.
export const submitBulkShip = async ({ selectedOrders, fetchOrders }) => {
  try {
    const token = Cookies.get("session");
    const response = await axios.post(
      `${REACT_APP_BACKEND_URL}/bulk/create-bulk-order`,
      { selectedOrders },
      { headers: { authorization: `Bearer ${token}` } }
    );
    if (response.data?.jobId) refreshNotifications();
    fetchOrders && fetchOrders();
  } catch (error) {
    if (error.response?.status === 409) {
      const { message } = error.response.data || {};
      refreshNotifications();
      Notification(message || "A bulk shipment is already in progress.", "info");
    } else {
      Notification(error.response?.data?.message || "Something went wrong while processing bulk shipment.", "error");
    }
  }
};

export const handleTrackingByAwb = (awb, navigate) => {
  navigate(`/dashboard/order/tracking/${awb}`);
};

export const handleClone = (id, navigate, userId) => {
  const url = `/dashboard/order/neworder?cloneId=${id}${userId ? `&userId=${userId}` : ""}`;
  navigate(url);
};

export const handleBulkClone = async ({ selectedOrders, setRefresh }) => {
  if (!selectedOrders || selectedOrders.length === 0) {
    Notification("Please select at least one order to clone.", "info");
    return;
  }

  setRefresh(false);

  const token = Cookies.get("session");
  const payload = {
    ids: selectedOrders, // Array of selected order IDs
  };

  try {
    const response = await axios.post(
      `${REACT_APP_BACKEND_URL}/order/bulkClone`,
      payload,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    Notification(response.data.message, "success");
    setRefresh(true);
  } catch (error) {
    console.error("Bulk clone error:", error);
    Notification(
      error.response?.data?.message || "Something went wrong while cloning orders.",
      "error"
    );
  }
};

export const handleManifest = async (id) => {
  try {
    const response = await axios.get(`${REACT_APP_BACKEND_URL}/manifest/generate-pdf?orderIds=${id}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "manifest.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading manifest:", error);
  }
};

export const handleBulkDownloadManifests = async (selectedOrders) => {
  if (!selectedOrders.length) {
    Notification("No orders selected.", "info");
    return;
  }
  // one request, so no count — an animated bar until the file is ready
  const progress = startDownloadProgress("manifest", null);
  try {
    // order IDs in the body: a large selection (600+) does not fit in a URL
    const response = await fetch(`${REACT_APP_BACKEND_URL}/manifest/generate-pdf`, {
      method: "POST",
      headers: { ...devTenantHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds: selectedOrders }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch manifest");
    }

    const blob = await response.blob();
    saveAs(blob, "bulk-manifest.pdf");

    progress.finish("success", `Manifest downloaded (${selectedOrders.length} orders)`);
  } catch (error) {
    console.error("Error downloading Manifest:", error);
    progress.finish("error", "Failed to download manifest", "Please try again.");
  }
};

export const ExportExcel = ({ selectedOrders, orders }) => {
  if (selectedOrders.length === 0) {
    Notification("No orders selected for export.", "info");
    return;
  }

  // Filter only selected orders
  const exportData = orders
    .filter((order) => selectedOrders.includes(order._id))
    .map((order) => ({
      "Order ID": order.orderId,
      "Customer Order ID": customerOrderIdOf(order),
      "Order Status": order.status,
      "Order Date": new Date(order.createdAt).toLocaleString(),
      "Sender Name": order.pickupAddress?.contactName,
      "Sender Email": order.pickupAddress?.email,
      "Sender Phone": order.pickupAddress?.phoneNumber,
      "Sender Address": order.pickupAddress?.address,
      "Sender City": order.pickupAddress?.city,
      "Sender State": order.pickupAddress?.state,
      "Sender Pin": order.pickupAddress?.pinCode,
      "Receiver Name": order.receiverAddress?.contactName,
      "Receiver Email": order.receiverAddress?.email,
      "Receiver Phone": order.receiverAddress?.phoneNumber,
      "Receiver Address": order.receiverAddress?.address,
      "Receiver City": order.receiverAddress?.city,
      "Receiver State": order.receiverAddress?.state,
      "Receiver Pin": order.receiverAddress?.pinCode,
      "Payment Method": order.paymentDetails?.method,
      "Payment Amount": order.paymentDetails?.amount,
      "Courier Service Name": order.courierServiceName,
      "AWB Number": order.awb_number,
      // Add more fields as needed
      Products: order.productDetails
        ?.map(
          (p) =>
            `Name: ${p.name}, SKU: ${p.sku}, Qty: ${p.quantity}, Price: ${p.unitPrice}`,
        )
        .join(" | "),
    }));

  // Create worksheet and workbook
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");

  // Generate buffer and save
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  saveAs(blob, "orders.xlsx");
};

export const handleInvoice = async (id) => {
  try {
    const response = await fetch(`${REACT_APP_BACKEND_URL}/printinvoice/download-invoice/${id}`, { headers: devTenantHeaders() });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error("Error downloading invoice:", error);
  }
};

export const handleLabel = async (id) => {
  try {
    const response = await fetch(`${REACT_APP_BACKEND_URL}/printlabel/generate-pdf/${id}`, { headers: devTenantHeaders() });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Label-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error("Error downloading invoice:", error);
  }
};

// B2B (cargo) orders print one label per box from the B2B label route, not the parcel label above.
export const handleB2BLabel = async (id) => {
  try {
    const response = await fetch(toTenantUrl(`${REACT_APP_BACKEND_URL}/b2b/generate-label/${id}`), { headers: devTenantHeaders() });
    if (!response.ok) throw new Error(await response.text());
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `B2B-Label-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error("Error downloading B2B label:", error);
    Notification("Failed to download label. Please try again.", "error");
  }
};

// Gati's own docket (LR) copy — Gati's pickup person collects it at pickup.
export const handleGatiDocketCopy = async (id) => {
  try {
    const response = await fetch(toTenantUrl(`${REACT_APP_BACKEND_URL}/b2b/gati/docketCopy/${id}`), { headers: devTenantHeaders() });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || "Failed to download the Gati docket copy");
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Gati-Docket-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    Notification(error.message || "Failed to download the Gati docket copy", "error");
  }
};

// A booked B2B order is cancelled with its courier (and refunded) by the B2B cancel route.
export const cancelB2BOrder = async ({ orderId, setRefresh }) => {
  try {
    Notification("Cancelling order, please wait...", "info");
    const token = Cookies.get("session");
    const response = await axios.post(
      `${REACT_APP_BACKEND_URL}/b2b/cancelOrder/${orderId}`,
      {},
      { headers: { authorization: `Bearer ${token}` } },
    );
    Notification(response.data?.message || "Order cancelled successfully", "success");
    if (setRefresh) setRefresh((prev) => !prev);
  } catch (error) {
    Notification(error?.response?.data?.message || "Failed to cancel order. Please try again.", "error");
  }
};

// Bulk label / invoice PDFs come from the backend in batches (POST <path> { orderIds }, one merged PDF per
// batch). Fetching one PDF per order fired 400–1000 requests for a 200–500 order selection, hit the backend's
// per-minute rate limit and failed the whole download; 50 per request keeps any selection to a few requests.
// Orders the backend could not render are skipped and counted, not a reason to fail the rest.
const BULK_PDF_BATCH = 50;
const fetchBulkPdfPages = async (path, orderIds, intoPdf, onProgress) => {
  const pages = [];
  let failed = 0;
  for (let i = 0; i < orderIds.length; i += BULK_PDF_BATCH) {
    if (onProgress) onProgress(i);
    const batch = orderIds.slice(i, i + BULK_PDF_BATCH);
    const response = await fetch(`${REACT_APP_BACKEND_URL}${path}`, {
      method: "POST",
      headers: { ...devTenantHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds: batch }),
    });
    if (!response.ok) {
      failed += batch.length;
      continue;
    }
    failed += Number(response.headers.get("X-Failed-Count")) || 0;
    const batchPdf = await PDFDocument.load(await response.arrayBuffer());
    pages.push(...(await intoPdf.copyPages(batchPdf, batchPdf.getPageIndices())));
  }
  if (onProgress) onProgress(orderIds.length);
  return { pages, failed };
};

// Close the progress card: "downloaded", or a warning naming how many orders were left out
const finishBulkProgress = (progress, what, requested, failed) => {
  if (failed > 0) {
    progress.finish("info", `${requested - failed} of ${requested} ${what} downloaded`, `${failed} order(s) could not be generated.`);
  } else {
    progress.finish("success", `${requested} ${what} downloaded`);
  }
};

export const handleBulkDownloadInvoice = async ({ selectedOrders }) => {
  if (selectedOrders.length === 0) {
    Notification("No orders selected for download.", "info");
    return;
  }

  // stays on screen (bottom-right) until the file is ready — the menu that started it has already closed
  const progress = startDownloadProgress("invoices", selectedOrders.length);
  try {
    const mergedPdf = await PDFDocument.create();
    const { pages, failed } = await fetchBulkPdfPages("/printinvoice/bulk-pdf", selectedOrders, mergedPdf, progress.update);
    if (!pages.length) throw new Error("No invoices could be generated");
    pages.forEach((page) => mergedPdf.addPage(page));

    const mergedPdfBytes = await mergedPdf.save();
    const mergedBlob = new Blob([mergedPdfBytes], {
      type: "application/pdf",
    });
    saveAs(mergedBlob, "bulk-invoices.pdf");

    finishBulkProgress(progress, "invoices", selectedOrders.length, failed);
  } catch (error) {
    console.error("Error downloading invoices:", error);
    progress.finish("error", "Failed to download invoices", "Please try again.");
  }
};

export const handleBulkDownloadLabel = async ({ selectedOrders }) => {
  if (!selectedOrders || selectedOrders.length === 0) {
    Notification("No orders selected.", "info");
    return;
  }
  // stays on screen (bottom-right) until the file is ready — the menu that started it has already closed
  const progress = startDownloadProgress("labels", selectedOrders.length);
  try {

    // ── 1. Layout follows each LABEL, not the person downloading ─────────
    // The backend draws a thermal label on a 4"×6" page (288×432 pt) and an A4 label on an A4 page, from the ORDER
    // OWNER's printer setting. A 4"×6" label goes on its own 4"×6" page (one label per sheet); A4 labels keep the
    // A4 layout (full page for 1–2, otherwise 2×2). Deciding from the downloader's own setting put a thermal
    // seller's labels four to an A4 page whenever an admin (A4) downloaded them.
    const isThermalPage = (p) => p.getWidth() <= 320 && p.getHeight() <= 480;

    const mergedPdf = await PDFDocument.create();
    // A4 pts
    const pageWidth  = 595;
    const pageHeight = 842;

    const labelWidth  = pageWidth  / 2; // for 2×2 grid
    const labelHeight = pageHeight / 2;

    let labelCount = 0;
    let currentPage = null;

    // ── 2. Download every label (in batches; the backend also uses Amazon's own label where it should) ──
    const { pages: labelPages, failed } = await fetchBulkPdfPages("/printlabel/bulk-pdf", selectedOrders, mergedPdf, progress.update);
    if (!labelPages.length) throw new Error("No labels could be generated");

    // ── 3. Lay them out ───────────────────────────────────────────────────

    const a4Total = labelPages.filter((p) => !isThermalPage(p)).length;
    for (const page of labelPages) {
      if (isThermalPage(page)) {
        // Thermal: one label per 4"×6" page, as generated
        mergedPdf.addPage(page);
      } else if (a4Total <= 2) {
        // A4, 1–2 labels: full page each
        const newPage = mergedPdf.addPage([pageWidth, pageHeight]);
        const embedded = await mergedPdf.embedPage(page);
        newPage.drawPage(embedded, { x: 0, y: 0, width: pageWidth, height: pageHeight });
      } else {
        // A4, 3+ labels: 2×2 grid
        if (labelCount % 4 === 0) {
          currentPage = mergedPdf.addPage([pageWidth, pageHeight]);
        }
        const x = (labelCount % 2) * labelWidth;
        const y = pageHeight - ((Math.floor(labelCount / 2) % 2) + 1) * labelHeight;
        const embedded = await mergedPdf.embedPage(page);
        currentPage.drawPage(embedded, { x, y, width: labelWidth, height: labelHeight });
        labelCount++;
      }
    }

    const mergedPdfBytes = await mergedPdf.save();
    const mergedBlob = new Blob([mergedPdfBytes], { type: "application/pdf" });
    // "-thermal" in the file name when every label is a 4"×6" thermal label
    const allThermal = labelPages.length > 0 && a4Total === 0;
    saveAs(mergedBlob, `bulk-labels${allThermal ? "-thermal" : ""}.pdf`);

    finishBulkProgress(progress, "labels", selectedOrders.length, failed);
  } catch (error) {
    console.error("Error downloading Label:", error);
    progress.finish("error", "Failed to download labels", "Please try again.");
  }
};

export const SavePackageDetails = async ({
  details,
  selectedOrders,
  setRefresh,
  refresh,
}) => {
  try {
    // Extract token from cookies (handle multiple cookies safely)
    const token = Cookies.get("session");
    if (!token) {
      console.error("Authorization token not found.");
      Notification("Session expired. Please login again.", "error");
      return;
    }

    // Validate selectedOrders
    if (
      !selectedOrders ||
      !Array.isArray(selectedOrders) ||
      selectedOrders.length === 0
    ) {
      console.error("No selected orders to update.");
      Notification("Please select at least one order.", "error");
      return;
    }

    const response = await axios.post(
      `${REACT_APP_BACKEND_URL}/order/updatePackageDetails`,
      { details, selectedOrders },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log("response", response.data);
    Notification("Package details updated successfully!", "success");
    setRefresh(!refresh);
  } catch (err) {
    console.error("error", err);
    Notification("Failed to update package details.", "error");
  }
};

export const BulkCancel = async ({ selectedOrders, setRefresh }) => {
  if (!selectedOrders || selectedOrders.length === 0) return;

  Notification(`Deleting ${selectedOrders.length} order(s), please wait...`, "info");

  // ONE request for the whole selection (POST /order/bulkDeleteNotShipped). One request per order, all at once,
  // hit the backend's per-minute rate limit on large selections (500 orders = 500 requests) and most failed.
  const token = Cookies.get("session");
  try {
    const { data } = await axios.post(
      `${REACT_APP_BACKEND_URL}/order/bulkDeleteNotShipped`,
      { orderIds: selectedOrders },
      { headers: { authorization: `Bearer ${token}` } }
    );
    Notification(data?.message || `Deleted ${data?.deleted ?? selectedOrders.length} order(s).`, data?.notDeleted ? "info" : "success");
  } catch (error) {
    Notification(error?.response?.data?.message || "Could not delete the selected orders. Please try again.", "error");
  }

  // refresh the list either way
  if (typeof setRefresh === "function") setRefresh((prev) => !prev);
};

export const BulkCancelB2B = BulkCancel;

export const cancelOrder = async ({ orderId, refresh, setRefresh }) => {
  try {
    Notification("Cancelling order, please wait...", "info");
    const token = Cookies.get("session");
    const response = await axios.post(
      `${REACT_APP_BACKEND_URL}/order/cancelOrdersAtNotShipped`,
      { orderId },
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
    Notification(response.data.message, "success");
    setRefresh(!refresh);
  } catch (error) {
    Notification("Failed to cancel order. Please try again.", "error");
  }
};

export const handleCancelOrderAtBooked = async (orderData, setRefresh) => {
  try {
    Notification("Cancelling booked order, please wait...", "info");
    console.log("order", orderData)
    const token = Cookies.get("session");
    const response = await axios.post(
      `${REACT_APP_BACKEND_URL}/order/cancelOrdersAtBooked`,
      orderData,
      {
        headers: { authorization: `Bearer ${token}` },
      }
    );
    Notification("Order canceled successfully", "success");
    if (setRefresh) setRefresh((prev) => !prev);
  } catch (error) {
    Notification(
      error?.response?.data?.error ||
      "Failed to cancel order. Please try again.", "error"
    );
  } finally {
  }
};
