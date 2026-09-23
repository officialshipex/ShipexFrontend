import { useState, useEffect } from "react";
import Barcode from "../../../assets/barcode1.png";
import Barcode2 from "../../../assets/barcode2.png";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification";
import { useBranding } from "../../../context/BrandingContext";

// ── tiny sub-components ─────────────────────────────────────────────────────

function A4Preview() {
  return (
    <div className="flex flex-col items-center mt-4">
      <span className="text-[11px] font-[600] text-gray-500 mb-1">8&quot; (inches)</span>
      <div className="relative border-2 border-gray-400 bg-white" style={{ width: 120, height: 160 }}>
        {/* 2×2 grid lines */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="border border-gray-300" />
          ))}
        </div>
        {/* dimension label left */}
        <span
          className="absolute text-[9px] font-[600] text-gray-500"
          style={{ left: -34, top: "50%", transform: "translateY(-50%) rotate(-90deg)", whiteSpace: "nowrap" }}
        >
          11&quot; (inches)
        </span>
      </div>
    </div>
  );
}

function ThermalPreview() {
  return (
    <div className="flex flex-col items-center mt-4">
      <span className="text-[11px] font-[600] text-gray-500 mb-1">4&quot; (inches)</span>
      <div className="relative" style={{ width: 90, height: 160 }}>
        {/* dotted outer */}
        <div className="absolute inset-0 border-2 border-dashed border-gray-400" />
        {/* solid inner */}
        <div className="absolute border-2 border-gray-500 bg-white" style={{ top: 10, left: 10, right: 10, bottom: 10 }} />
        {/* dimension label left */}
        <span
          className="absolute text-[9px] font-[600] text-gray-500"
          style={{ left: -30, top: "50%", transform: "translateY(-50%) rotate(-90deg)", whiteSpace: "nowrap" }}
        >
          6&quot; (inches)
        </span>
      </div>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export default function LabelCustomize() {
  const { companyDisplayName } = useBranding();
  const [activeTab, setActiveTab] = useState("customize"); // "customize" | "size"
  const [uploadedLogo, setUploadedLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const [settings, setSettings] = useState({
    showLogoOnLabel: true,
    hideCustomerMobile: true,
    hideOrderBarcode: true,
    labelSize: "A4",           // ← new field
    warehouseSettings: {
      hidePickupAddress: true,
      hideRTOAddress: true,
      hideRTOName: true,
      hidePickupMobile: true,
      hideRTOMobile: true,
      hidePickupName: true,
      hideGstNumber: true,
    },
    productDetails: {
      hideSKU: true,
      hideHSN: true,
      hideQty: true,
      hideTotalAmount: true,
      hideOrderAmount: true,
      hideProduct: true,
    },
  });

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = Cookies.get("session");
        const res = await axios.get(`${REACT_APP_BACKEND_URL}/label/getLabel`, {
          headers: { authorization: `Bearer ${token}` },
        });
        setSettings(prev => ({ ...prev, ...res.data }));
      } catch (err) {
        console.error("Error fetching label settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const token = Cookies.get("session");
      const res = await axios.post(`${REACT_APP_BACKEND_URL}/label/uploadLogo`, formData, {
        headers: { "Content-Type": "multipart/form-data", authorization: `Bearer ${token}` },
      });
      setUploadedLogo(res.data.logoUrl);
      setSettings(prev => ({ ...prev, logoUrl: res.data.logoUrl }));
    } catch (err) {
      console.error("Logo upload failed", err);
    }
  };

  const handleSave = async () => {
    try {
      const token = Cookies.get("session");
      await axios.post(`${REACT_APP_BACKEND_URL}/label/saveLabel`, settings, {
        headers: { authorization: `Bearer ${token}` },
      });
      Notification("Label settings saved successfully", "success");
    } catch (error) {
      console.error("Error saving label settings", error);
      Notification("Failed to save label settings", "error");
    }
  };

  const handleChange = (section, key) => {
    setSettings(prev => {
      if (!prev) return prev;
      if (section) {
        return { ...prev, [section]: { ...prev[section], [key]: !prev[section][key] } };
      }
      return { ...prev, [key]: !prev[key] };
    });
  };

  const handleLabelSizeChange = (size) => {
    setSettings(prev => ({ ...prev, labelSize: size }));
  };

  if (loading) return <p className="text-[12px] text-gray-500 p-4">Loading settings...</p>;

  // ── tabs UI ────────────────────────────────────────────────────────────────
  const tabs = [
    { id: "customize", label: "Label Customization" },
    { id: "size",      label: "Label Size" },
  ];

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="flex flex-row gap-2 mb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-[12px] rounded-lg font-[600] transition-all duration-200 shadow-sm border ${
              activeTab === tab.id
                ? "bg-brand-primary text-white border-brand-primary"
                : "bg-white text-gray-700 border-gray-200 hover:bg-brand-secondary/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Label Customization ──────────────────────────────────────── */}
      {activeTab === "customize" && (
        <div className="flex flex-col md:flex-row gap-2 mt-2">
          {/* Settings Panel */}
          <div className="bg-white p-4 rounded-lg shadow-md w-full md:w-3/5 text-gray-700 space-y-4">
            <h2 className="sm:text-[14px] text-gray-700 text-[12px] font-[600] mt-2">Common Setting</h2>
            <div className="space-y-2 text-[10px] font-[600] text-gray-500 sm:text-[12px]">
              <label className="flex font-[600] text-gray-500 items-center gap-2">
                <input type="checkbox" checked={settings.showLogoOnLabel} onChange={() => handleChange(null, "showLogoOnLabel")} className="accent-brand-primary w-4" />
                Show Logo on Label
              </label>
              {settings.showLogoOnLabel && (
                <div className="mt-2 flex">
                  <label className="block font-[400]">Upload Logo:</label>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                </div>
              )}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={settings.hideCustomerMobile} onChange={() => handleChange(null, "hideCustomerMobile")} className="accent-brand-primary w-4" />
                Hide Customer Mobile Number
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={settings.hideOrderBarcode} onChange={() => handleChange(null, "hideOrderBarcode")} className="accent-brand-primary w-4" />
                Hide Customer Order Barcode
              </label>
            </div>

            <h2 className="sm:text-[14px] text-gray-700 text-[12px] font-[600] mt-2">Warehouse Setting</h2>
            <div className="grid grid-cols-2 gap-2 sm:text-[12px] font-[600] text-gray-500 text-[10px]">
              {Object.entries(settings.warehouseSettings).map(([key, val]) => (
                <label key={key} className="flex items-center gap-2 capitalize">
                  <input type="checkbox" checked={val} onChange={() => handleChange("warehouseSettings", key)} className="accent-brand-primary w-4" />
                  {key.replace(/([A-Z])/g, " $1")}
                </label>
              ))}
            </div>

            <h2 className="sm:text-[14px] text-gray-700 text-[12px] font-[600] mt-2">Hide/Show Product Details</h2>
            <div className="grid grid-cols-2 gap-2 sm:text-[12px] font-[600] text-gray-500 text-[10px]">
              {Object.entries(settings.productDetails).map(([key, val]) => (
                <label key={key} className="flex items-center gap-2 capitalize">
                  <input type="checkbox" checked={val} onChange={() => handleChange("productDetails", key)} className="accent-brand-primary w-4" />
                  {key.replace(/([A-Z])/g, " $1")}
                </label>
              ))}
            </div>

            <button onClick={handleSave} className="bg-brand-primary sm:text-[12px] font-[600] text-[10px] text-white px-3 py-2 rounded-lg hover:bg-green-500 mt-4">
              Save
            </button>
          </div>

          {/* Preview Panel */}
          <div className="bg-white p-4 rounded-lg shadow-md w-full md:w-2/5 print:w-full text-[12px] font-sans">
            <div className="border border-black p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p><strong>To:</strong></p>
                  <p>narinder kaur</p>
                  <p>block c 14/2 new govind pura street no-8 near</p>
                  <p>gandhi park</p>
                  <p>East Delhi, DELHI, 110051</p>
                  <p>MOBILE NO: {settings.hideCustomerMobile ? "**********" : "9718794406"}</p>
                </div>
                {settings.showLogoOnLabel && settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Uploaded Logo" className="w-16 h-16 object-contain" />
                )}
              </div>

              <div className="border-t border-black pt-2 flex justify-between items-center">
                <div>
                  <p><strong>Order Date:</strong> Mar 7, 2025</p>
                  <p><strong>Invoice No:</strong> 843987</p>
                  {!settings.warehouseSettings.hideGstNumber && (
                    <p><strong>GSTIN No:</strong> 22XXXXX0000SHI</p>
                  )}
                </div>
                {!settings.hideOrderBarcode && (
                  <div className="text-center">
                    <img src={Barcode} alt="barcode" className="h-20 w-40 mx-auto" />
                  </div>
                )}
              </div>

              <div className="border-t border-black pt-2 flex justify-between items-center">
                <div>
                  <p><strong>MODE:</strong> PREPAID</p>
                  {!settings.productDetails.hideOrderAmount && <p><strong>AMOUNT:</strong> 800</p>}
                  <p>WEIGHT: 0.4</p>
                  <p>Dimensions (cm): 10*10*10</p>
                </div>
                <div className="text-center" style={{ lineHeight: "1.1" }}>
                  <p className="font-[600]">{(companyDisplayName || "SHIPEX INDIA").toUpperCase()}</p>
                  <img src={Barcode2} alt="barcode2" className="h-30 w-40 mx-auto" />
                  <p>35973710008735</p>
                </div>
              </div>

              <table className="w-full mt-2 border border-black text-left">
                <thead className="bg-gray-200">
                  <tr>
                    {!settings.productDetails.hideSKU && <th className="border border-black px-1">SKU</th>}
                    {!settings.productDetails.hideProduct && <th className="border border-black px-1">Item Name</th>}
                    {!settings.productDetails.hideHSN && <th className="border border-black px-1">HSN</th>}
                    {!settings.productDetails.hideQty && <th className="border border-black px-1">Qty.</th>}
                    {!settings.productDetails.hideOrderAmount && <th className="border border-black px-1">Unit Price</th>}
                    {!settings.productDetails.hideTotalAmount && <th className="border border-black px-1">Total Amount</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {!settings.productDetails.hideSKU && <td className="border border-black px-1">1</td>}
                    {!settings.productDetails.hideProduct && <td className="border border-black px-1">honey</td>}
                    {!settings.productDetails.hideHSN && <td className="border border-black px-1">AAA</td>}
                    {!settings.productDetails.hideQty && <td className="border border-black px-1">1</td>}
                    {!settings.productDetails.hideOrderAmount && <td className="border border-black px-1">800</td>}
                    {!settings.productDetails.hideTotalAmount && <td className="border border-black px-1">800</td>}
                  </tr>
                </tbody>
              </table>

              <div className="mt-2">
                <p><strong>Pickup Address:</strong></p>
                {!settings.warehouseSettings.hidePickupName && <p>Ajeet Kumar</p>}
                {!settings.warehouseSettings.hidePickupAddress && (
                  <div>
                    <p>Vaidic Panchgavyya, Near LIC Building, Laxmi Sweets, Sagwan Chowk</p>
                    <p>Sirsa, HARYANA, 125055</p>
                  </div>
                )}
                {!settings.warehouseSettings.hidePickupMobile && <p>Mobile No: 9518156020</p>}
              </div>

              <div className="mt-2">
                <p><strong>Return Address:</strong></p>
                {!settings.warehouseSettings.hideRTOName && <p>Ajeet Kumar</p>}
                {!settings.warehouseSettings.hideRTOAddress && (
                  <div>
                    <p>Vaidic Panchgavyya, Near LIC Building, Laxmi Sweets, Sagwan Chowk</p>
                    <p>Sirsa, HARYANA, 125055</p>
                  </div>
                )}
                {!settings.warehouseSettings.hideRTOMobile && <p>Mobile No: 9518156020</p>}
              </div>

              <div className="border-t border-black pt-2">
                <p>This is a computer-generated document, hence does not require a signature.</p>
                <p><span><strong>Note:</strong></span> All disputes are subject to Delhi jurisdiction. Goods once sold will only be taken back or exchanged as per the store's exchange/return policy.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Label Size ───────────────────────────────────────────────── */}
      {activeTab === "size" && (
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
          <p className="text-[12px] text-gray-500 font-[600] mb-5">
            Choose the label size that matches your printer type.
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            {/* A4 Option */}
            <div
              onClick={() => handleLabelSizeChange("A4")}
              className={`flex-1 flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                settings.labelSize === "A4"
                  ? "border-brand-primary bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="mt-1">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  settings.labelSize === "A4" ? "border-brand-primary" : "border-gray-400"
                }`}>
                  {settings.labelSize === "A4" && (
                    <div className="w-2 h-2 rounded-full bg-brand-primary" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className={`text-[12px] font-[700] ${settings.labelSize === "A4" ? "text-brand-primary" : "text-gray-700"}`}>
                  Standard Desktop Printers - Size A4 (8"X11")
                </p>
                <p className="text-[11px] text-gray-500 font-[500] mt-0.5">
                  (Four Label Printed on one Sheet)
                </p>
                <A4Preview />
              </div>
            </div>

            {/* Thermal Option */}
            <div
              onClick={() => handleLabelSizeChange("thermal")}
              className={`flex-1 flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                settings.labelSize === "thermal"
                  ? "border-brand-primary bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="mt-1">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  settings.labelSize === "thermal" ? "border-brand-primary" : "border-gray-400"
                }`}>
                  {settings.labelSize === "thermal" && (
                    <div className="w-2 h-2 rounded-full bg-brand-primary" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className={`text-[12px] font-[700] ${settings.labelSize === "thermal" ? "text-brand-primary" : "text-gray-700"}`}>
                  Thermal Label Printers - Size (4"X6")
                </p>
                <p className="text-[11px] text-gray-500 font-[500] mt-0.5">
                  (Single Label on one Sheet)
                </p>
                <ThermalPreview />
              </div>
            </div>
          </div>

          <div className="flex justify-start mt-4">
            <button
              onClick={handleSave}
              className="bg-brand-primary text-white text-[12px] font-[600] py-2 px-3 rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
