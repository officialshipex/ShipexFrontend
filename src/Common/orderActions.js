import axios from "axios";
import Cookies from "js-cookie";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Notification } from "../Notification";
const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const handleTrackingByAwb = (awb, navigate) => {
  navigate(`/dashboard/order/tracking/${awb}`);
};

export const handleClone = async (id, setRefresh) => {
  try {
    if (setRefresh) setRefresh(false);
    const token = Cookies.get("session");

    const payload = { id };

    const response = await axios.post(
      `${REACT_APP_BACKEND_URL}/order/clone`,
      payload,
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    // Check backend response and show appropriate message
    if (response.data.success) {
      Notification(response?.data?.message || "Order cloned successfully", "success");
      if (setRefresh) setRefresh((prev) => !prev);
    } else {
      Notification(response.data.message || "Order cannot be cloned", "info");
    }
  } catch (error) {
    console.error("Error cloning order:", error);

    Notification(
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Something went wrong while cloning the order.",
      "error"
    );
  }
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
  try {
    if (!selectedOrders.length) {
      Notification("No orders selected.", "info");
      return;
    }

    const orderIds = selectedOrders.join(",");
    const response = await fetch(
      `${REACT_APP_BACKEND_URL}/manifest/generate-pdf?orderIds=${orderIds}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch manifest");
    }

    const blob = await response.blob();
    saveAs(blob, "bulk-manifest.pdf");

    Notification("Manifest downloaded successfully!", "success");
  } catch (error) {
    console.error("Error downloading Manifest:", error);
    Notification("Failed to download Manifest.", "error");
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
    const response = await fetch(
      `${REACT_APP_BACKEND_URL}/printinvoice/download-invoice/${id}`,
    );
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
    const response = await fetch(
      `${REACT_APP_BACKEND_URL}/printlabel/generate-pdf/${id}`,
    );
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

export const handleBulkDownloadInvoice = async ({ selectedOrders }) => {
  if (selectedOrders.length === 0) {
    Notification("No orders selected for download.", "info");
    return;
  }

  try {
    const mergedPdf = await PDFDocument.create();

    for (let orderId of selectedOrders) {
      const response = await fetch(
        `${REACT_APP_BACKEND_URL}/printinvoice/download-invoice/${orderId}`,
      );
      const blob = await response.blob();
      const existingPdfBytes = await blob.arrayBuffer();

      const existingPdf = await PDFDocument.load(existingPdfBytes);
      const copiedPages = await mergedPdf.copyPages(
        existingPdf,
        existingPdf.getPageIndices(),
      );

      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const mergedBlob = new Blob([mergedPdfBytes], {
      type: "application/pdf",
    });
    saveAs(mergedBlob, "bulk-invoices.pdf");

    Notification("Invoices downloaded successfully!", "success");
  } catch (error) {
    console.error("Error downloading invoices:", error);
    Notification("Failed to download invoices.", "error");
  }
};

export const handleBulkDownloadLabel = async ({ selectedOrders }) => {
  try {
    const mergedPdf = await PDFDocument.create();
    const pageWidth = 595; // A4 width
    const pageHeight = 842; // A4 height
    const labelWidth = pageWidth / 2; // For 2x2 grid
    const labelHeight = pageHeight / 2; // For 2x2 grid

    let labelCount = 0;
    let currentPage = null;

    // 🟢 Fetch all order details first (so we know which are Amazon)
    const orderResponses = await Promise.all(
      selectedOrders.map((id) =>
        fetch(`${REACT_APP_BACKEND_URL}/orders/checkCourier/${id}`).then(
          (res) => res.json(),
        ),
      ),
    );

    for (const orderData of orderResponses) {
      let response;
      if (orderData.provider === "Amazon Shipping" && orderData.label) {
        // 🟡 Use Amazon-provided label link directly
        response = await fetch(
          `${REACT_APP_BACKEND_URL}/printlabel/proxy-label?url=${encodeURIComponent(orderData.label)}`,
        );
      } else {
        // 🟢 Generate label from your system
        response = await fetch(
          `${REACT_APP_BACKEND_URL}/printlabel/generate-pdf/${orderData._id}`,
        );
      }

      const blob = await response.blob();
      const existingPdfBytes = await blob.arrayBuffer();
      const existingPdf = await PDFDocument.load(existingPdfBytes);
      const copiedPages = await mergedPdf.copyPages(
        existingPdf,
        existingPdf.getPageIndices(),
      );

      for (const page of copiedPages) {
        if (selectedOrders.length === 1) {
          // If only 1 label, make it full-page
          let singlePage = mergedPdf.addPage([pageWidth, pageHeight]);
          const embeddedPage = await mergedPdf.embedPage(page);
          singlePage.drawPage(embeddedPage, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          });
        } else if (selectedOrders.length === 2) {
          // If 2 labels, each label gets a full page
          let newPage = mergedPdf.addPage([pageWidth, pageHeight]);
          const embeddedPage = await mergedPdf.embedPage(page);
          newPage.drawPage(embeddedPage, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          });
        } else {
          // 4 or more labels → Arrange in 2x2 grid
          if (labelCount % 4 === 0) {
            currentPage = mergedPdf.addPage([pageWidth, pageHeight]);
          }

          const x = (labelCount % 2) * labelWidth;
          const y =
            pageHeight - ((Math.floor(labelCount / 2) % 2) + 1) * labelHeight;

          const embeddedPage = await mergedPdf.embedPage(page);
          currentPage.drawPage(embeddedPage, {
            x,
            y,
            width: labelWidth,
            height: labelHeight,
          });

          labelCount++;
        }
      }
    }

    const mergedPdfBytes = await mergedPdf.save();
    const mergedBlob = new Blob([mergedPdfBytes], { type: "application/pdf" });
    saveAs(mergedBlob, "bulk-labels.pdf");

    Notification("Label downloaded successfully!", "success");
  } catch (error) {
    console.error("Error downloading Label:", error);
    Notification("Failed to download Label.", "error");
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
  let allSuccess = true;

  for (let orderId of selectedOrders) {
    try {
      const token = Cookies.get("session");
      await axios.post(
        `${REACT_APP_BACKEND_URL}/order/cancelOrdersAtNotShipped`,
        { orderId },
        {
          headers: { authorization: `Bearer ${token}` },
        },
      );
    } catch (error) {
      allSuccess = false;
    }
  }

  setRefresh((prev) => !prev);

  if (allSuccess) {
    Notification("All selected orders cancelled successfully.", "success");
  } else {
    Notification(
      "Some orders could not be cancelled. Please try again.",
      "error",
    );
  }
};

export const cancelOrder = async ({ orderId, refresh, setRefresh }) => {
  try {
    // setRefresh(!refresh)
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
    // console.error("Error canceling order:", error);
    Notification("Failed to cancel order. Please try again.", "error");
  }
};

export const handleCancelOrderAtBooked = async (orderData, setRefresh) => {
  try {
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
