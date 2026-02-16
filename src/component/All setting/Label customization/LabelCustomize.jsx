import { useState, useEffect } from "react";
import Barcode from "../../../assets/barcode1.png"
import Barcode2 from "../../../assets/barcode2.png"
import axios from "axios";
// import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { Notification } from "../../../Notification"

export default function LabelCustomize() {
    const [uploadedLogo, setUploadedLogo] = useState(null);
    const [loading, setLoading] = useState(true);
    const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const [settings, setSettings] = useState({
        showLogoOnLabel: true,
        // showSupportInfo: false,
        hideCustomerMobile: true,
        hideOrderBarcode: true,
        warehouseSettings: {
            hidePickupAddress: true,
            hideRTOAddress: true,
            hideRTOName: true,
            hidePickupMobile: true,
            hideRTOMobile: true,
            hidePickupName: true,
            hideGstNumber: true
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




    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("logo", file);
            try {
                const token = Cookies.get("session");
                const res = await axios.post(`${REACT_APP_BACKEND_URL}/label/uploadLogo`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        authorization: `Bearer ${token}`
                    },
                });
                setUploadedLogo(res.data.logoUrl);
                console.log(res.data.logoUrl)
                // Update the settings with logo URL
                setSettings(prev => ({ ...prev, logoUrl: res.data.logoUrl }));
            } catch (err) {
                console.error("Logo upload failed", err);
            }
        }
    };


    const handleSave = async () => {
        try {
            const token = Cookies.get("session");
            await axios.post(`${REACT_APP_BACKEND_URL}/label/saveLabel`, settings, {
                headers: {
                    authorization: `Bearer ${token}`
                }
            });
            // alert("Label settings saved successfully!");
            Notification("Label settings saved successfully", "success")
        } catch (error) {
            console.error("Error saving label settings", error);
            Notification("Failed to save label settings", "error")
            // alert("Failed to save label settings.");
        }
    };


    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = Cookies.get("session");
                const res = await axios.get(`${REACT_APP_BACKEND_URL}/label/getLabel`, {
                    headers: { authorization: `Bearer ${token}` }
                });
                setSettings(res.data); // Assuming labelSettings is returned
            } catch (err) {
                console.error("Error fetching label settings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    if (loading) return <p>Loading settings...</p>;
    // if (!settings) return <p>Unable to load settings.</p>;


    const handleChange = (section, key) => {
        setSettings(prev => {
            if (!prev) return prev;
            if (section) {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [key]: !prev[section][key],
                    },
                };
            } else {
                return {
                    ...prev,
                    [key]: !prev[key],
                };
            }
        });
    };

    return (
        <div className="flex flex-col md:flex-row gap-2 mt-2">
            {/* Settings Panel */}
            <div className="bg-white p-4 rounded-lg shadow-md w-full md:w-3/5 text-gray-700 space-y-4">
                <h2 className="sm:text-[14px] text-gray-700 text-[12px] font-[600] mt-2">Common Setting</h2>
                <div className="space-y-2 text-[10px] font-[600] text-gray-500 sm:text-[12px]">
                    <label className="flex font-[600] text-gray-500 items-center gap-2">
                        <input type="checkbox" checked={settings.showLogoOnLabel} onChange={() => handleChange(null, "showLogoOnLabel")} className="accent-[#0CBB7D] w-4" />
                        Show Logo on Label
                    </label>
                    {settings.showLogoOnLabel && (
                        <div className="mt-2 flex">
                            <label className="block font-[400]">Upload Logo:</label>
                            <input type="file" accept="image/*" onChange={handleLogoUpload} />
                        </div>
                    )}
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={settings.hideCustomerMobile} onChange={() => handleChange(null, "hideCustomerMobile")} className="accent-[#0CBB7D] w-4" />
                        Hide Customer Mobile Number
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={settings.hideOrderBarcode} onChange={() => handleChange(null, "hideOrderBarcode")} className="accent-[#0CBB7D] w-4" />
                        Hide Customer Order Barcode
                    </label>
                </div>

                <h2 className="sm:text-[14px] text-gray-700 text-[12px] font-[600] mt-2">Warehouse Setting</h2>
                <div className="grid grid-cols-2 gap-2 sm:text-[12px] font-[600] text-gray-500 text-[10px]">
                    {Object.entries(settings.warehouseSettings).map(([key, val]) => (
                        <label key={key} className="flex items-center gap-2 capitalize">
                            <input
                                type="checkbox"
                                checked={val}
                                onChange={() => handleChange("warehouseSettings", key)}
                                className="accent-[#0CBB7D] w-4"
                            />
                            {key.replace(/([A-Z])/g, " $1")}
                        </label>
                    ))}
                </div>

                <h2 className="sm:text-[14px] text-gray-700 text-[12px] font-[600] mt-2">Hide/Show Product Details</h2>
                <div className="grid grid-cols-2 gap-2 sm:text-[12px] font-[600] text-gray-500 text-[10px]">
                    {Object.entries(settings.productDetails).map(([key, val]) => (
                        <label key={key} className="flex items-center gap-2 capitalize">
                            <input
                                type="checkbox"
                                checked={val}
                                onChange={() => handleChange("productDetails", key)}
                                className="accent-[#0CBB7D] w-4"
                            />
                            {key.replace(/([A-Z])/g, " $1")}
                        </label>
                    ))}
                </div>

                <button onClick={handleSave} className="bg-[#0CBB7D] sm:text-[12px] font-[600] text-[10px] text-white px-3 py-2 rounded-lg hover:bg-green-500 mt-4">
                    Save
                </button>
            </div>

            {/* Preview Panel */}
            <div className="bg-white p-4 rounded-lg shadow-md w-full md:w-2/5 print:w-full text-[12px] font-sans">
                <div className="border border-black p-4 space-y-2">
                    {/* TO SECTION */}
                    <div className="flex justify-between items-center">
                        <div>
                            <p><strong>To:</strong></p>
                            <p>narinder kaur</p>
                            <p>block c 14/2 new govind pura street no-8 near</p>
                            <p>gandhi park</p>
                            <p>East Delhi, DELHI, 110051</p>
                            <p>
                                MOBILE NO:{" "}
                                {settings.hideCustomerMobile ? "**********" : "9718794406"}
                            </p>
                        </div>

                        {settings.showLogoOnLabel && settings.logoUrl && (
                            <img src={settings.logoUrl} alt="Uploaded Logo" className="w-16 h-16 object-contain" />
                        )}

                    </div>


                    {/* Order date and invoice */}
                    <div className="border-t border-black pt-2 flex justify-between items-center">
                        <div>
                            <p>
                                <strong>Order Date:</strong> Mar 7, 2025
                            </p>
                            <p>
                                <strong>Invoice No:</strong> 843987
                            </p>
                            {!settings.warehouseSettings.hideGstNumber && (
                                <p>
                                    <strong>GSTIN No:</strong> 22XXXXX0000SHI
                                </p>
                            )}
                        </div>
                        {!settings.hideOrderBarcode && (
                            <div className="text-center">
                                <img src={Barcode} alt="barcode" className="h-20 w-40 mx-auto" />
                                {/* <p>843987</p> */}
                            </div>
                        )}
                    </div>

                    {/* Mode and Surface */}
                    <div className="border-t border-black pt-2 flex justify-between items-center">
                        <div>
                            <p>
                                <strong>MODE:</strong> PREPAID
                            </p>
                            {!settings.productDetails.hideOrderAmount && (
                                <p>
                                    <strong>AMOUNT:</strong> 800
                                </p>
                            )}
                            <p>WEIGHT: 0.4</p>
                            <p>Dimensions (cm): 10*10*10</p>
                        </div>
                        <div className="text-center" style={{ lineHeight: '1.1' }}>
                            <p className="font-[600]">SHIPEX INDIA</p>
                            <img src={Barcode2} alt="barcode2" className="h-30 w-40 mx-auto" />
                            <p>35973710008735</p>
                        </div>
                    </div>

                    {/* Product Table */}
                    <table className="w-full mt-2 border border-black text-left">
                        <thead className="bg-gray-200">
                            <tr>
                                {!settings.productDetails.hideSKU && (
                                    <th className="border border-black px-1">SKU</th>
                                )}
                                {!settings.productDetails.hideProduct && (
                                    <th className="border border-black px-1">Item Name</th>
                                )}
                                {!settings.productDetails.hideHSN && (
                                    <th className="border border-black px-1">HSN</th>
                                )}
                                {!settings.productDetails.hideQty && (
                                    <th className="border border-black px-1">Qty.</th>
                                )}
                                {!settings.productDetails.hideOrderAmount && (
                                    <th className="border border-black px-1">Unit Price</th>
                                )}
                                {!settings.productDetails.hideTotalAmount && (
                                    <th className="border border-black px-1">Total Amount</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {!settings.productDetails.hideSKU && (
                                    <td className="border border-black px-1">1</td>
                                )}
                                {!settings.productDetails.hideProduct && (
                                    <td className="border border-black px-1">honey</td>
                                )}
                                {!settings.productDetails.hideHSN && (
                                    <td className="border border-black px-1">AAA</td>
                                )}
                                {!settings.productDetails.hideQty && (
                                    <td className="border border-black px-1">1</td>
                                )}
                                {!settings.productDetails.hideOrderAmount && (
                                    <td className="border border-black px-1">800</td>
                                )}
                                {!settings.productDetails.hideTotalAmount && (
                                    <td className="border border-black px-1">800</td>
                                )}
                            </tr>
                        </tbody>
                    </table>

                    {/* Pickup/Return Address */}

                    <div className="mt-2">
                        <p><strong>Pickup Address:</strong></p>
                        {!settings.warehouseSettings.hidePickupName && (
                            <p>Ajeet Kumar</p>
                        )}

                        {!settings.warehouseSettings.hidePickupAddress && (
                            <div>
                                <p>
                                    Vaidic Panchgavyya, Near LIC Building, Laxmi Sweets, Sagwan
                                    Chowk
                                </p>

                                <p>Sirsa, HARYANA, 125055</p>
                            </div>
                        )}
                        {!settings.warehouseSettings.hidePickupMobile && (
                            <p>Mobile No: 9518156020</p>
                        )}

                    </div>


                    <div className="mt-2">
                        <p><strong>Return Address:</strong></p>
                        {!settings.warehouseSettings.hideRTOName && (
                            <p>Ajeet Kumar</p>
                        )}

                        {!settings.warehouseSettings.hideRTOAddress && (
                            <div>
                                <p>
                                    Vaidic Panchgavyya, Near LIC Building, Laxmi Sweets, Sagwan
                                    Chowk
                                </p>

                                <p>Sirsa, HARYANA, 125055</p>
                            </div>
                        )}
                        {!settings.warehouseSettings.hideRTOMobile && (
                            <p>Mobile No: 9518156020</p>
                        )}

                    </div>


                    {/* Footer */}
                    <div className="border-t border-black pt-2">
                        <p>This is a computer-generated document, hence does not require a signature.</p>
                        <p>
                            <span><strong>Note:</strong></span> All disputes are subject to Delhi jurisdiction. Goods once
                            sold will only be taken back or exchanged as per the store’s
                            exchange/return policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
