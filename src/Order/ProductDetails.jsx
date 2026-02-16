import React, { useState } from "react";
import PaymentDetails from "./PaymentDetails.js";
import { FiTag, FiTrash2 } from "react-icons/fi";
import PackageDetails from "./PackageDetails"; // NEW IMPORT

const ProductDetails = ({ Address }) => {
    const [products, setProducts] = useState([
        { id: 1, quantity: 1, hsn: "", name: "", sku: "", unitPrice: "", category: "", discount: "", tax: "" },
    ]);

    const [deadWeight, setDeadWeight] = useState(0);
    const [dimensions, setDimensions] = useState({
        length: "",
        width: "",
        height: "",
    });
    const [orderType, setOrderType] = useState("B2C");
    const [rovType, setRovType] = useState("ROV Owner");
    const [B2BPackageDetails, setB2BPackageDetails] = useState([]);

    const [finalDeadWeight, setFinalDeadWeight] = useState(0);
    const [finalVolumetricWeight, setFinalVolumetricWeight] = useState(0);
    const [finalApplicableWeight, setFinalApplicableWeight] = useState(0);



    const [showAdditionalFees, setShowAdditionalFees] = useState(false);

    const handleDimensionChange = (e) => {
        const { name, value } = e.target;
        setDimensions((prev) => ({
            ...prev,
            [name]: value.replace(/[^0-9.]/g, ""),
        }));
    };

    const addProduct = () => {
        setProducts([
            ...products,
            {
                id: products.length + 1,
                quantity: 1,
                name: "",
                hsn: "",
                sku: "",
                unitPrice: "",
                category: "",
                discount: "",
                tax: ""
            },
        ]);
    };

    // console.log("product", products)

    const removeProduct = (id) => {
        setProducts(products.filter((product) => product.id !== id));
    };

    const increaseQuantity = (id) => {
        setProducts(
            products.map((product) =>
                product.id === id ? { ...product, quantity: product.quantity + 1 } : product
            )
        );
    };

    const decreaseQuantity = (id) => {
        setProducts(
            products.map((product) =>
                product.id === id && product.quantity > 1
                    ? { ...product, quantity: product.quantity - 1 }
                    : product
            )
        );
    };

    const handleInputChange = (id, field, value) => {
        setProducts(
            products.map((product) =>
                product.id === id ? { ...product, [field]: value } : product
            )
        );
    };

    const volumetricWeight = (
        (dimensions.length * dimensions.width * dimensions.height) /
        5000 || 0
    ).toFixed(2);

    const applicableWeight = Math.max(deadWeight, volumetricWeight, 0.5);

    const totalPrice = products.reduce((total, product) => {
        const price = parseFloat(product.unitPrice) || 0;
        const discount = parseFloat(product.discount) || 0;

        const finalPrice = price - discount;

        return total + finalPrice * product.quantity;
    }, 0);

    // console.log("total proce", totalPrice);

    const packageData = {
        deadWeight,
        dimensions,
        volumetricWeight,
        applicableWeight,
        products,
        address: Address,
        totalPrice,
        finalDeadWeight,
        finalVolumetricWeight,
        finalApplicableWeight
    };
    packageData.orderType = orderType;
    packageData.rovType = rovType;
    packageData.B2BPackageDetails = B2BPackageDetails;

    return (
        <div className="max-w-full mx-auto">
            <div className="border border-[#0CBB7D] rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                <h2 className="text-[14px] font-[600] text-gray-700 mb-2 flex items-center gap-2">
                    <span className="bg-[#0CBB7D] text-white rounded-lg p-2">
                        <FiTag className="text-[14px]" />
                    </span>
                    Product Details
                </h2>

                {products.map((product, index) => (
                    <div
                        key={product.id}
                        className="border border-dashed border-[#0CBB7D] rounded-lg p-4 mb-6 relative bg-white"
                    >
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#0CBB7D] text-white w-8 h-8 flex justify-center items-center rounded-full text-[12px] font-[600] shadow">
                            {index + 1}
                        </div>

                        <div className="absolute -top-4 right-4 group">
                            <button
                                onClick={() => removeProduct(product.id)}
                                className="w-8 h-8 flex items-center justify-center bg-[#FFE3DC] hover:opacity-90 text-[#F1572C] rounded-full shadow-sm"
                            >
                                <FiTrash2 className="h-4 w-4" />
                            </button>

                            <div className="absolute left-1/2 z-50 -translate-x-1/2 top-full mt-1 px-2 py-1 text-[#F1572C] text-[12px] opacity-0 group-hover:opacity-100">
                                Delete
                            </div>
                        </div>


                        <div className="grid grid-cols-2 md:grid-cols-4 font-[600] text-gray-700 gap-2">
                            <div>
                                <label className="font-[600] text-[12px]">Product Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={product.name}
                                    placeholder="Enter name or search"
                                    onChange={(e) => handleInputChange(product.id, "name", e.target.value)}
                                    className="w-full border focus:outline-[#0CBB7D] rounded-lg px-3 py-2 text-[12px]"
                                />
                            </div>
                            <div>
                                <label className="font-[600] text-[12px]">HSN</label>
                                <input
                                    type="text"
                                    value={product.hsn}
                                    placeholder="HSN"
                                    onChange={(e) => handleInputChange(product.id, "hsn", e.target.value)}
                                    className="w-full border rounded-lg focus:outline-[#0CBB7D] px-3 py-2 text-[12px]"
                                />
                            </div>

                            <div>
                                <label className="font-[600] text-[12px]">Quantity <span className="text-red-500">*</span></label>
                                <div className="flex items-center text-[12px] border rounded-lg">
                                    <button onClick={() => decreaseQuantity(product.id)} className="px-3 h-[34px] bg-gray-100">
                                        -
                                    </button>
                                    <input readOnly value={product.quantity} className="w-full text-center px-3 focus:outline-none h-[34px]" />
                                    <button onClick={() => increaseQuantity(product.id)} className="px-3 h-[34px] bg-gray-50">
                                        +
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="font-[600] text-[12px]">Unit Price <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1.5 text-gray-500">₹</span>
                                    <input
                                        type="text"
                                        value={product.unitPrice}
                                        placeholder="Unit Price"
                                        onChange={(e) => handleInputChange(product.id, "unitPrice", e.target.value)}
                                        className="w-full pl-7 border focus:outline-[#0CBB7D] rounded-lg px-3 py-2 text-[12px]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div
                            className="mt-4 flex items-center space-x-1 cursor-pointer text-[12px]"
                            onClick={() => setShowAdditionalFees(!showAdditionalFees)}
                        >
                            <span className="text-[#0CBB7D] text-[12px] font-[600]">
                                + Add Category, SKU, Discount and Tax
                            </span>
                            <span className="text-[12px] font-[600] text-gray-500">(optional)</span>
                        </div>

                        {showAdditionalFees && (
                            <div className="grid grid-cols-2 font-[600] md:grid-cols-4 gap-2 mt-4">
                                <input className="border rounded-lg px-3 py-2 text-[12px] focus:outline-[#0CBB7D]" type="text" placeholder="Product Category" onChange={(e) => handleInputChange(product.id, "category", e.target.value)} value={product.category} />
                                <input className="border rounded-lg px-3 py-2 text-[12px] focus:outline-[#0CBB7D]" type="text" placeholder="SKU" onChange={(e) => handleInputChange(product.id, "sku", e.target.value)} value={product.sku} />
                                <input className="border rounded-lg px-3 py-2 text-[12px] focus:outline-[#0CBB7D]" type="text" placeholder="Discount" onChange={(e) => handleInputChange(product.id, "discount", e.target.value)} value={product.discount} />
                                <input className="border rounded-lg px-3 py-2 text-[12px] focus:outline-[#0CBB7D]" type="text" placeholder="Tax" onChange={(e) => handleInputChange(product.id, "tax", e.target.value)} value={product.tax} />
                            </div>
                        )}
                    </div>
                ))}

                <button
                    onClick={addProduct}
                    className="flex items-center justify-center w-8 h-8 bg-[#0CBB7D] text-white rounded-full mx-auto"
                >
                    +
                </button>
            </div>

            {/* CALL PACKAGE DETAILS HERE */}
            <PackageDetails
                deadWeight={deadWeight}
                setDeadWeight={setDeadWeight}
                dimensions={dimensions}
                setDimensions={setDimensions}
                volumetricWeight={volumetricWeight}
                applicableWeight={applicableWeight}
                totalPrice={totalPrice}

                orderType={orderType}
                setOrderType={setOrderType}
                rovType={rovType}
                setRovType={setRovType}

                B2BPackageDetails={B2BPackageDetails}
                setB2BPackageDetails={setB2BPackageDetails}

                finalDeadWeight={finalDeadWeight}
                finalVolumetricWeight={finalVolumetricWeight}
                finalApplicableWeight={finalApplicableWeight}
                setFinalDeadWeight={setFinalDeadWeight}
                setFinalVolumetricWeight={setFinalVolumetricWeight}
                setFinalApplicableWeight={setFinalApplicableWeight}
            />


            {/* PAYMENT DETAILS */}
            <PaymentDetails packageData={packageData} />
        </div>
    );
};

export default ProductDetails;
