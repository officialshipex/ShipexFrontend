import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { Package } from "lucide-react";
import { ChevronDown } from "lucide-react";


const ProductDetailsSection = ({ order, onUpdate }) => {
    const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
    const [products, setProducts] = useState(order.productDetails || []);
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);

    const handleOpenEditPopup = () => {
        setProducts(
            (order.productDetails || []).map((product) => ({
                ...product,
                showAdditionalFields: hasAdditionalDetails(product),
            }))
        );
        setIsEditPopupOpen(true);
    };


    const hasAdditionalDetails = (product) => {
        return (
            product.category ||
            product.discount ||
            product.tax ||
            product.sku
        );
    };


    const handleSave = async () => {
        if (onUpdate) {
            await onUpdate(products);
        }
        setIsEditPopupOpen(false);
    };

    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...products];
        updatedProducts[index] = {
            ...updatedProducts[index],
            [field]: value,
        };
        setProducts(updatedProducts);
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
                tax: "",
                showAdditionalFields: false,
            },
        ]);

    };

    const removeProduct = (index) => {
        setProducts(products.filter((_, idx) => idx !== index));
    };

    const increaseQuantity = (index) => {
        const updatedProducts = [...products];
        updatedProducts[index].quantity = (parseInt(updatedProducts[index].quantity) || 0) + 1;
        setProducts(updatedProducts);
    };

    const decreaseQuantity = (index) => {
        const updatedProducts = [...products];
        if ((parseInt(updatedProducts[index].quantity) || 0) > 1) {
            updatedProducts[index].quantity = (parseInt(updatedProducts[index].quantity) || 0) - 1;
            setProducts(updatedProducts);
        }
    };

    const calculateTotal = () => {
        return products.reduce((total, product) => {
            const price = parseFloat(product.unitPrice) || 0;
            const quantity = parseInt(product.quantity) || 0;
            const discount = parseFloat(product.discount) || 0;
            return total + (price * quantity - discount);
        }, 0).toFixed(2);
    };

    return (
        <>
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <div className="flex items-center gap-2">
                        <p className="p-2 bg-green-100 hidden sm:block rounded-full">
                            <Package className="w-4 h-4 text-[#0CBB7D]" />
                        </p>

                        <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">
                            Product Details
                        </h2>
                    </div>


                    {/* {order.status === "new" && (
                        <button
                            onClick={handleOpenEditPopup}
                            className="p-2 bg-gray-500 rounded-full hover:opacity-90 transition"
                            title="Edit Product Details"
                        >
                            <FaEdit className="text-white text-[12px]" />
                        </button>
                    )} */}
                </div>

                {/* View Mode - Table with horizontal scroll for mobile */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left sm:text-[12px] text-[10px] min-w-[600px]">
                        <thead>
                            <tr className="text-gray-700 font-[600] border-b">
                                <th className="py-2 px-3">Product Name</th>
                                <th className="py-2 px-3">HSN</th>
                                <th className="py-2 px-3">Quantity</th>
                                <th className="py-2 px-3">Unit Price</th>
                                <th className="py-2 px-3">SKU</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.productDetails && order.productDetails.map((product, index) => (
                                <tr key={index} className="border-b font-[600] text-gray-500">
                                    <td className="py-2 px-3">{product.name || "0"}</td>
                                    <td className="py-2 px-3">{product.hsn || "0"}</td>
                                    <td className="py-2 px-3">{product.quantity || "0"}</td>
                                    <td className="py-2 px-3">₹ {product.unitPrice || "0"}</td>
                                    <td className="py-2 px-3">{product.sku || "0"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Total Amount - Always visible on mobile */}
                <div className="mt-3 pt-3 border-t flex justify-between items-center sm:text-[12px] text-[10px] font-[600]">
                    <span className="text-gray-700">Total Amount:</span>
                    <span className="text-[#0CBB7D]">
                        ₹{order.productDetails?.reduce((total, product) => {
                            const price = parseFloat(product.unitPrice) || 0;
                            const quantity = parseInt(product.quantity) || 0;
                            return total + (price * quantity);
                        }, 0).toFixed(2) || "0.00"}
                    </span>
                </div>
            </div>

            {/* Edit Popup - Referenced from ProductDetails.jsx */}
            {isEditPopupOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-[1000] transition-opacity duration-300">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4 animate-popup-in">
                        <div className="sticky top-0 bg-white border-b py-2 px-3 flex justify-between items-center z-10">
                            <h2 className="text-[12px] sm:text-[14px] font-[600] text-gray-700">Update Product Details</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setProducts(
                                            (order.productDetails || []).map((product) => ({
                                                ...product,
                                                showAdditionalFields: hasAdditionalDetails(product),
                                            }))
                                        );
                                        setIsEditPopupOpen(false);
                                    }}
                                    className="bg-gray-200 text-[10px] sm:text-[12px] font-[600] text-gray-500 px-5 py-2 rounded-lg hover:bg-gray-300 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-3 py-2 bg-[#0CBB7D] text-white rounded-lg text-[10px] sm:text-[12px] font-[600] hover:opacity-90"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>

                        <div className="px-3 py-4">
                            {products.map((product, index) => (
                                <div
                                    key={index}
                                    className="border border-dashed border-[#0CBB7D] rounded-lg p-4 mb-4 relative bg-white"
                                >
                                    {/* Number Badge */}
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#0CBB7D] text-white sm:w-8 sm:h-8 w-6 h-6 flex justify-center items-center rounded-full text-[12px] font-[600] shadow">
                                        {index + 1}
                                    </div>

                                    {/* Delete Button */}
                                    {products.length > 1 && (
                                        <div className="absolute -top-4 right-4 group">
                                            <button
                                                onClick={() => removeProduct(index)}
                                                className="w-8 h-8 flex items-center justify-center bg-red-100 hover:opacity-90 text-red-500 rounded-full shadow-sm"
                                            >
                                                <FiTrash2 className="h-4 w-4" />
                                            </button>
                                            <div className="absolute left-1/2 z-50 -translate-x-1/2 top-full mt-1 px-2 py-1 text-red-500 text-[10px] opacity-0 group-hover:opacity-100">
                                                Delete
                                            </div>
                                        </div>
                                    )}

                                    {/* Main Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 font-[600] text-gray-700">
                                        <div>
                                            <label className="font-[600] sm:text-[12px] text-[10px]">
                                                Product Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={product.name || ""}
                                                onChange={(e) => handleProductChange(index, "name", e.target.value)}
                                                className="w-full border rounded-lg px-3 py-2 sm:text-[12px] text-[10px] focus:outline-[#0CBB7D]"
                                                placeholder="Enter product name"
                                            />
                                        </div>

                                        <div>
                                            <label className="font-[600] sm:text-[12px] text-[10px]">HSN</label>
                                            <input
                                                type="text"
                                                value={product.hsn || ""}
                                                onChange={(e) => handleProductChange(index, "hsn", e.target.value)}
                                                className="w-full border rounded-lg px-3 py-2 sm:text-[12px] text-[10px] focus:outline-[#0CBB7D]"
                                                placeholder="HSN"
                                            />
                                        </div>

                                        <div>
                                            <label className="font-[600] sm:text-[12px] text-[10px]">
                                                Quantity <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center border rounded-lg sm:text-[12px] text-[10px]">
                                                <button
                                                    onClick={() => decreaseQuantity(index)}
                                                    className="px-3 h-[34px] bg-gray-100 hover:bg-gray-200"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    readOnly
                                                    value={product.quantity || 0}
                                                    className="w-full text-center px-3 focus:outline-none h-[34px]"
                                                />
                                                <button
                                                    onClick={() => increaseQuantity(index)}
                                                    className="px-3 h-[34px] bg-gray-50 hover:bg-gray-100"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="font-[600] sm:text-[12px] text-[10px]">
                                                Unit Price <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                                <input
                                                    type="text"
                                                    value={product.unitPrice || ""}
                                                    onChange={(e) => handleProductChange(index, "unitPrice", e.target.value)}
                                                    className="w-full pl-7 border rounded-lg px-3 py-2 sm:text-[12px] text-[10px] focus:outline-[#0CBB7D]"
                                                    placeholder="Unit Price"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Toggle Additional Fields */}
                                    <div
                                        className="mt-4 flex items-center gap-2 cursor-pointer select-none"
                                        onClick={() => {
                                            const updatedProducts = [...products];
                                            updatedProducts[index].showAdditionalFields =
                                                !updatedProducts[index].showAdditionalFields;
                                            setProducts(updatedProducts);
                                        }}

                                    >
                                        {/* Arrow Icon */}
                                        <ChevronDown
                                            className={`w-4 h-4 text-[#0CBB7D] transition-transform duration-300
    ${product.showAdditionalFields ? "rotate-180" : "rotate-0"}
  `}
                                        />


                                        {/* Text */}
                                        <span className="text-[#0CBB7D] sm:text-[12px] text-[10px] font-[600]">
                                            {product.showAdditionalFields
                                                ? "Hide additional fields"
                                                : "Add Category, Discount and Tax"}

                                        </span>

                                        <span className="sm:text-[12px] text-[10px] font-[600] text-gray-500">
                                            (optional)
                                        </span>
                                    </div>


                                    {/* Additional Fields */}
                                    {product.showAdditionalFields && (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-4 font-[600]">
                                            <div>
                                                <label className="font-[600] sm:text-[12px] text-[10px]">Category</label>
                                                <input
                                                    type="text"
                                                    value={product.category || ""}
                                                    onChange={(e) => handleProductChange(index, "category", e.target.value)}
                                                    className="w-full border rounded-lg px-3 py-2 sm:text-[12px] text-[10px] focus:outline-[#0CBB7D]"
                                                    placeholder="Product Category"
                                                />
                                            </div>

                                            <div>
                                                <label className="font-[600] sm:text-[12px] text-[10px]">SKU</label>
                                                <input
                                                    type="text"
                                                    value={product.sku || ""}
                                                    onChange={(e) => handleProductChange(index, "sku", e.target.value)}
                                                    className="w-full border rounded-lg px-3 py-2 sm:text-[12px] text-[10px] focus:outline-[#0CBB7D]"
                                                    placeholder="SKU"
                                                />
                                            </div>

                                            <div>
                                                <label className="font-[600] sm:text-[12px] text-[10px]">Discount</label>
                                                <input
                                                    type="text"
                                                    value={product.discount || ""}
                                                    onChange={(e) => handleProductChange(index, "discount", e.target.value)}
                                                    className="w-full border rounded-lg px-3 py-2 sm:text-[12px] text-[10px] focus:outline-[#0CBB7D]"
                                                    placeholder="Discount"
                                                />
                                            </div>

                                            <div>
                                                <label className="font-[600] sm:text-[12px] text-[10px]">Tax</label>
                                                <input
                                                    type="text"
                                                    value={product.tax || ""}
                                                    onChange={(e) => handleProductChange(index, "tax", e.target.value)}
                                                    className="w-full border rounded-lg px-3 py-2 sm:text-[12px] text-[10px] focus:outline-[#0CBB7D]"
                                                    placeholder="Tax"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add Product Button */}
                            <button
                                onClick={addProduct}
                                className="flex items-center justify-center sm:w-8 sm:h-8 w-6 h-6 bg-[#0CBB7D] text-white rounded-full mx-auto hover:opacity-90"
                            >
                                +
                            </button>

                            {/* Total Display */}
                            <div className="mt-2 px-3 py-2 bg-green-100 rounded-lg flex justify-between items-center">
                                <span className="sm:text-[12px] text-[10px] font-[600] text-gray-700">Total Amount</span>
                                <span className="sm:text-[12px] text-[10px] font-[600] text-[#0CBB7D]">₹ {calculateTotal()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductDetailsSection;
