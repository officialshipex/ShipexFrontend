import React, { useRef, useState, useEffect } from "react";
import CostEstimationHeader from "./CostEstimationHeader";
import CourierSelectionRate from "./CourierSelectionRate";
import costEstimationimg from "../../../assets/undraw_our_solution_re_8yk6 1.png";
import axios from "axios";
import Cookies from "js-cookie";
import { FiChevronDown, FiTrash2 } from "react-icons/fi";
import { Notification } from "../../../Notification";
import ImportantTerms from "./ImportantTerms";
import ThreeDotLoader from "../../../Loader";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CostEstimationB2B = () => {
    const resultSectionRef = useRef(null);
    const rovRef = useRef(null);
    const paymentRef = useRef(null);

    /* ================= FORM STATE ================= */
    const [form, setForm] = useState({
        rovType: "ROV Owner",
        pickupPincode: "",
        deliveryPincode: "",
        paymentType: "Prepaid",
        paymentValue: "",
    });

    const [packages, setPackages] = useState([
        {
            id: 1,
            noOfBox: "",
            weightPerBox: "",
            length: "",
            width: "",
            height: "",
        },
    ]);

    const [rovOpen, setRovOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);

    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDataFetched, setIsDataFetched] = useState(false);

    /* ================= OUTSIDE CLICK HANDLERS ================= */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (rovRef.current && !rovRef.current.contains(event.target)) {
                setRovOpen(false);
            }
            if (paymentRef.current && !paymentRef.current.contains(event.target)) {
                setPaymentOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    /* ================= HELPERS ================= */
    const updateForm = (e) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const updatePkg = (id, key, value) => {
        setPackages((prev) =>
            prev.map((p) => (p.id === id ? { ...p, [key]: value } : p))
        );
    };

    const getNextId = (list) =>
        list.length ? Math.max(...list.map((p) => p.id)) + 1 : 1;

    const addPackage = () => {
        setPackages((prev) => [
            ...prev,
            {
                id: getNextId(prev),
                noOfBox: "",
                weightPerBox: "",
                length: "",
                width: "",
                height: "",
            },
        ]);
    };

    const removePackage = (id) => {
        if (packages.length === 1) {
            Notification("At least one package is required", "info");
            return;
        }
        setPackages((prev) => prev.filter((p) => p.id !== id));
    };

    /* ================= CALCULATE ================= */
    const handleCalculate = async () => {
        try {
            // Validation
            if (!form.pickupPincode || !form.deliveryPincode || !form.paymentValue) {
                Notification("Please fill all required fields", "warning");
                return;
            }

            if (form.pickupPincode.length !== 6 || form.deliveryPincode.length !== 6) {
                Notification("Pincode must be exactly 6 digits", "warning");
                return;
            }

            // Validate packages
            for (let pkg of packages) {
                if (!pkg.noOfBox || !pkg.weightPerBox || !pkg.length || !pkg.width || !pkg.height) {
                    Notification("Please fill all package details", "warning");
                    return;
                }
            }

            setLoading(true);
            setIsDataFetched(false);

            const token = Cookies.get("session");

            const payload = {
                pickupPincode: form.pickupPincode,
                deliveryPincode: form.deliveryPincode,
                paymentType: form.paymentType,
                paymentValue: Number(form.paymentValue),
                rovType: form.rovType,
                packages,
            };

            const res = await axios.post(
                `${REACT_APP_BACKEND_URL}/b2b/rateCalculator/calculateB2BRateWithoutOrder`,
                payload,
                {
                    headers: { authorization: `Bearer ${token}` },
                }
            );

            if (!res.data?.rates?.length) {
                Notification("No serviceable couriers found", "info");
                setRates([]);
                setIsDataFetched(false);
                return;
            }

            setRates(res.data.rates);
            setIsDataFetched(true);

            setTimeout(() => {
                resultSectionRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);
        } catch (err) {
            console.error(err);
            Notification("Failed to calculate B2B rates", "error");
            setIsDataFetched(false);
        } finally {
            setLoading(false);
        }
    };

    /* ================= UI ================= */
    return (
        <div className="px-1 sm:px-2">
            <CostEstimationHeader />

            <div className="sm:bg-white mx-auto w-full border bg-white rounded-lg sm:shadow-sm p-2 sm:p-4 flex flex-col md:flex-row">

                {/* ================= LEFT FORM ================= */}
                <div className="space-y-4 w-full md:w-1/2 pr-0 md:pr-8">

                    {/* PINCODES */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block font-[600] mb-2 text-gray-500 text-[12px]">
                                Pickup Pincode <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="pickupPincode"
                                value={form.pickupPincode}
                                onChange={updateForm}
                                placeholder="6 Digit Pickup Pincode"
                                maxLength={6}
                                onInput={(e) => {
                                    e.target.value = e.target.value.replace(/\D/g, "");
                                }}
                                className="w-full border rounded-lg px-3 py-2 text-[12px] font-[600] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                            />
                        </div>

                        <div>
                            <label className="block font-[600] mb-2 text-gray-500 text-[12px]">
                                Delivery Pincode <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="deliveryPincode"
                                value={form.deliveryPincode}
                                onChange={updateForm}
                                placeholder="6 Digit Delivery Pincode"
                                maxLength={6}
                                onInput={(e) => {
                                    e.target.value = e.target.value.replace(/\D/g, "");
                                }}
                                className="w-full border rounded-lg px-3 py-2 text-[12px] font-[600] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                            />
                        </div>
                    </div>

                    {/* PAYMENT */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* ROV TYPE */}
                        <div className="relative" ref={rovRef}>
                            <label className="block font-[600] mb-2 text-gray-500 text-[12px]">
                                ROV Type <span className="text-red-500">*</span>
                            </label>

                            <div
                                onClick={() => setRovOpen(!rovOpen)}
                                className="flex justify-between items-center w-full border rounded-lg px-3 py-2 text-[12px] font-[600] text-gray-700 cursor-pointer"
                            >
                                {form.rovType}
                                <FiChevronDown
                                    className={`transition-transform ${rovOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </div>

                            {rovOpen && (
                                <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 text-[12px] shadow-lg overflow-hidden">
                                    {["ROV Owner", "ROV Carrier"].map((v) => (
                                        <div
                                            key={v}
                                            onClick={() => {
                                                setForm((p) => ({ ...p, rovType: v }));
                                                setRovOpen(false);
                                            }}
                                            className={`px-3 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-700 transition-colors ${form.rovType === v ? "bg-green-100" : ""
                                                }`}
                                        >
                                            {v}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={paymentRef}>
                            <label className="block font-[600] mb-2 text-gray-500 text-[12px]">
                                Payment Type <span className="text-red-500">*</span>
                            </label>

                            <div
                                onClick={() => setPaymentOpen(!paymentOpen)}
                                className="flex justify-between items-center w-full border rounded-lg px-3 py-2 text-[12px] font-[600] text-gray-700 cursor-pointer"
                            >
                                {form.paymentType}
                                <FiChevronDown
                                    className={`transition-transform ${paymentOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </div>

                            {paymentOpen && (
                                <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 text-[12px] shadow-lg overflow-hidden">
                                    {["Prepaid", "COD"].map((v) => (
                                        <div
                                            key={v}
                                            onClick={() => {
                                                setForm((p) => ({ ...p, paymentType: v }));
                                                setPaymentOpen(false);
                                            }}
                                            className={`px-3 py-2 hover:bg-green-50 cursor-pointer font-[600] text-gray-700 transition-colors ${form.paymentType === v ? "bg-green-100" : ""
                                                }`}
                                        >
                                            {v}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block font-[600] mb-2 text-gray-500 text-[12px]">
                                Invoice Value (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="paymentValue"
                                value={form.paymentValue}
                                onChange={updateForm}
                                placeholder="Invoice Value"
                                onInput={(e) => {
                                    e.target.value = e.target.value.replace(/\D/g, "");
                                }}
                                className="w-full border rounded-lg px-3 py-2 text-[12px] font-[600] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                            />
                        </div>
                    </div>

                    {/* PACKAGE DETAILS */}
                    {packages.map((pkg, idx) => (
                        <div
                            key={pkg.id}
                            className="border border-dashed border-[#0CBB7D] rounded-lg p-4 relative"
                        >
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0CBB7D] text-white w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-[600]">
                                {idx + 1}
                            </div>

                            <button
                                onClick={() => removePackage(pkg.id)}
                                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-[#FFE3DC] text-[#F1572C] hover:opacity-90 transition-all"
                            >
                                <FiTrash2 size={14} />
                            </button>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-6">
                                {[
                                    { key: "noOfBox", label: "No. of Boxes" },
                                    { key: "weightPerBox", label: "Weight / Box (kg)" },
                                    { key: "length", label: "Length (cm)" },
                                    { key: "width", label: "Width (cm)" },
                                    { key: "height", label: "Height (cm)" },
                                ].map((f) => (
                                    <div key={f.key}>
                                        <label className="text-[12px] font-[600] text-gray-500 mb-1 block">
                                            {f.label}
                                        </label>
                                        <input
                                            value={pkg[f.key]}
                                            onChange={(e) =>
                                                updatePkg(pkg.id, f.key, e.target.value)
                                            }
                                            onInput={(e) => {
                                                e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                                            }}
                                            className="w-full border rounded-lg px-3 py-2 text-[12px] font-[600] text-gray-700 outline-none focus:ring-1 focus:ring-[#0CBB7D]"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* ADD PACKAGE */}
                    <div className="flex justify-center">
                        <button
                            onClick={addPackage}
                            className="w-7 h-7 rounded-full bg-[#0CBB7D] text-white flex items-center justify-center font-[600] hover:opacity-90 transition-all"
                        >
                            +
                        </button>
                    </div>

                    {/* CALCULATE */}
                    <button
                        onClick={handleCalculate}
                        disabled={loading}
                        className="bg-[#0CBB7D] text-white text-[12px] font-[600] py-2 px-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Calculating...
                            </>
                        ) : (
                            "Calculate"
                        )}
                    </button>
                </div>

                {/* ================= RIGHT IMAGE ================= */}
                <div className="w-full md:w-1/2 flex justify-center items-center mt-6 md:mt-0">
                    <img
                        src={costEstimationimg}
                        alt="Illustration"
                        className="hidden md:block max-w-[360px]"
                    />
                </div>
            </div>

            {/* ================= RESULT ================= */}
            <div ref={resultSectionRef} className="mt-4">
                {loading && (
                    <div className="flex justify-center items-center py-10 bg-white rounded-lg shadow-sm">
                        <ThreeDotLoader />
                    </div>
                )}

                {!loading && isDataFetched && (
                    <CourierSelectionRate plan={rates} loading={loading} />
                )}
            </div>

            <div className="mt-4 mx-auto w-full">
                <ImportantTerms />
            </div>
        </div>
    );

};

export default CostEstimationB2B;
