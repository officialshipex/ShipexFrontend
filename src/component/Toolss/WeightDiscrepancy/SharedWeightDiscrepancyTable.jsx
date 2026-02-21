import React from "react";
import dayjs from "dayjs";
import { FiCopy, FiCheck } from "react-icons/fi";
import { getCarrierLogo } from "../../../Common/getCarrierLogo";
import ThreeDotLoader from "../../../Loader";
import NotFound from "../../../assets/nodatafound.png";

const SharedWeightDiscrepancyTable = ({
    orders,
    loading,
    isAdmin = false,
    selectedOrders = [],
    handleSelectAll,
    handleCheckboxChange,
    handleTrackingByAwb,
    handleCopyAwb,
    copiedAwb,
    actionsColumnTitle, // String: e.g. "Actions" or "Details", null if no actions column
    renderActions, // Function: (order, index) => ReactNode
    detailsColumnTitle,
    renderDetails,
}) => {
    return (
        <div className="hidden md:block relative">
            <div className="relative overflow-x-auto bg-white overflow-y-auto h-[calc(100vh-295px)] border-gray-300">
                <table className="w-full text-left border-collapse">
                    {/* Table Head */}
                    <thead className="sticky top-0 z-20 bg-[#0CBB7D]">
                        <tr className="text-white text-[12px] font-[600]">
                            <th className="py-2 px-3">
                                <div className="flex justify-center items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.length === orders.length && orders.length > 0}
                                        onChange={handleSelectAll}
                                        className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                                    />
                                </div>
                            </th>
                            {isAdmin && <th className="py-2 px-3">User Details</th>}
                            <th className="py-2 px-3">Product Details</th>
                            <th className="py-2 px-3">Upload On</th>
                            <th className="py-2 px-3">Shipping Details</th>
                            <th className="py-2 px-3">Applied Weight</th>
                            <th className="py-2 px-3">Charged Weight</th>
                            <th className="py-2 px-3">Excess Weight & Charges</th>
                            <th className="py-2 px-3">Status</th>
                            {detailsColumnTitle && <th className="py-2 px-3 text-center">{detailsColumnTitle}</th>}
                            {actionsColumnTitle && <th className="py-2 px-3 text-center">{actionsColumnTitle}</th>}
                        </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={isAdmin ? (actionsColumnTitle ? 10 : 9) : (actionsColumnTitle ? 9 : 8)} className="text-center py-4">
                                    <ThreeDotLoader />
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? (actionsColumnTitle ? 10 : 9) : (actionsColumnTitle ? 9 : 8)} className="text-center py-4">
                                    <div className="flex flex-col items-center justify-center">
                                        <img
                                            src={NotFound}
                                            alt="No Data Found"
                                            className="w-60 h-60 object-contain mb-2"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order, index) => {
                                const discrepancyDate = new Date(order.createdAt);
                                const today = new Date();
                                const daysPassed = Math.floor((today - discrepancyDate) / (1000 * 60 * 60 * 24));
                                const remainingDays = Math.max(7 - daysPassed, 0);

                                return (
                                    <tr key={index} className="text-[12px] border-b text-gray-500 hover:bg-gray-50 transition-all">
                                        {/* Checkbox and auto accept days left */}
                                        <td className="py-2 px-3 relative align-middle">
                                            {["new", "pending"].includes((order.status || "").toLowerCase()) && (
                                                <div className="absolute -top-2 left-2 bg-red-500 z-[40] text-white text-[10px] px-2 py-0.5 w-auto rounded-lg whitespace-nowrap">
                                                    {remainingDays > 0 ? `${remainingDays} days left` : "Auto Accepting Soon"}
                                                </div>
                                            )}
                                            <div className="flex justify-center items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOrders.includes(order._id)}
                                                    onChange={() => handleCheckboxChange(order._id)}
                                                    className="cursor-pointer accent-[#0CBB7D] w-3 h-3"
                                                />
                                            </div>
                                        </td>

                                        {/* Admin User Details */}
                                        {isAdmin && (
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                <p className="text-[#0CBB7D]">{order.user?.userId}</p>
                                                <p>{order.user?.fullname || order.user?.name}</p>
                                                <p className="text-gray-500 truncate max-w-[120px]" title={order.user?.email}>
                                                    {order.user?.email}
                                                </p>
                                                <p className="text-gray-500">{order.user?.phoneNumber}</p>
                                            </td>
                                        )}

                                        {/* Product Details */}
                                        <td className="py-2 px-3 whitespace-nowrap" style={{ maxWidth: "200px", width: "180px" }}>
                                            {(() => {
                                                const products = order.productDetails || [];
                                                const names = products.map(p => p.name).join(", ") || "-";
                                                const skus = products.map(p => p.sku).join(", ") || "-";
                                                const totalQty = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
                                                const truncateText = (text, limit = 18) => text.length > limit ? text.slice(0, limit) + "..." : text;

                                                return (
                                                    <div className="relative text-gray-700">
                                                        {/* NAME hover */}
                                                        <div className="relative group inline-block max-w-full">
                                                            <p className="inline-block max-w-full cursor-pointer border-b border-dashed border-gray-700 group-hover:border-gray-600">
                                                                {truncateText(names)}
                                                            </p>
                                                            {/* TOOLTIP */}
                                                            <div className="absolute z-[200] hidden group-hover:block bg-white text-gray-700 text-[10px] p-2 rounded shadow-2xl w-[280px] border top-1/2 left-full ml-2 transform -translate-y-1/2 whitespace-normal select-text pointer-events-auto">
                                                                <table className="w-full border-collapse">
                                                                    <thead>
                                                                        <tr className="text-left border-b">
                                                                            <th className="pb-1 pr-2 font-semibold">Name</th>
                                                                            <th className="pb-1 pr-2 font-semibold">SKU</th>
                                                                            <th className="pb-1 font-semibold">Qty</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {products.map((p, idx) => (
                                                                            <tr key={idx} className="border-b last:border-0">
                                                                                <td className="py-1 pr-2 break-words">{p.name}</td>
                                                                                <td className="py-1 pr-2 break-words">{p.sku}</td>
                                                                                <td className="py-1">{p.quantity}</td>
                                                                            </tr>
                                                                        ))}
                                                                        <tr className="font-semibold border-t">
                                                                            <td colSpan={2} className="pt-1">Total</td>
                                                                            <td className="pt-1">{totalQty}</td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <div className="absolute left-full top-0 w-3 h-full"></div>
                                                        </div>
                                                        <p className="text-[12px]">SKU: {truncateText(skus, 14)}</p>
                                                        <p className="text-[12px]">QTY: {totalQty}</p>
                                                    </div>
                                                );
                                            })()}
                                        </td>

                                        {/* Upload On */}
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            <p>{dayjs(order.createdAt).format("hh:mm A")}</p>
                                            <p>{dayjs(order.createdAt).format("DD MMM YYYY")}</p>
                                        </td>

                                        {/* Shipping Details */}
                                        <td className="py-2 px-3 whitespace-nowrap">
                                            <p className="text-gray-700">{order.courierServiceName}</p>
                                            <div className="flex items-center gap-1 group">
                                                <span
                                                    onClick={() => handleTrackingByAwb(order.awbNumber)}
                                                    className="text-[#0CBB7D] font-[600] cursor-pointer hover:underline text-[12px]"
                                                >
                                                    {order.awbNumber}
                                                </span>
                                                <button
                                                    onClick={() => handleCopyAwb(order.awbNumber, `awbdesk-${index}`)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-green-50 rounded"
                                                >
                                                    {copiedAwb === `awbdesk-${index}` ? (
                                                        <FiCheck className="w-3 h-3 text-[#0CBB7D]" />
                                                    ) : (
                                                        <FiCopy className="w-3 h-3 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>

                                        {/* Applied Weight */}
                                        <td className="py-2 px-3 whitespace-nowrap text-gray-500">
                                            <p className="font-[600]">Applied weight: {order.enteredWeight?.applicableWeight} Kg</p>
                                            <p>Dead Weight: {order.enteredWeight?.deadWeight} Kg</p>
                                            <div className="text-gray-500">
                                                <p>Volumetric weight:</p>
                                                <p>
                                                    {(
                                                        ((order.enteredWeight?.volumetricWeight?.length || 0) *
                                                            (order.enteredWeight?.volumetricWeight?.breadth || 0) *
                                                            (order.enteredWeight?.volumetricWeight?.height || 0)) / 5000
                                                    ).toFixed(2)}{" "}
                                                    Kg ({order.enteredWeight?.volumetricWeight?.length || 0}cm x{" "}
                                                    {order.enteredWeight?.volumetricWeight?.breadth || 0}cm x{" "}
                                                    {order.enteredWeight?.volumetricWeight?.height || 0}cm)
                                                </p>
                                            </div>
                                        </td>

                                        {/* Charged Weight */}
                                        <td className="py-2 px-3 whitespace-nowrap text-gray-500">
                                            <p className="font-[600]">Charged weight: {order.chargedWeight?.applicableWeight} Kg</p>
                                            <p>Dead Weight: {order.chargedWeight?.deadWeight} Kg</p>
                                            {order.chargedDimension?.length && order.chargedDimension?.breadth && order.chargedDimension?.height && (
                                                <p className="text-gray-500 text-[10px]">
                                                    Volumetric weight:{" "}
                                                    {(
                                                        (order.chargedDimension.length * order.chargedDimension.breadth * order.chargedDimension.height) / 5000
                                                    ).toFixed(2)}{" "}
                                                    Kg ({order.chargedDimension.length}cm x {order.chargedDimension.breadth}cm x{" "}
                                                    {order.chargedDimension.height}cm)
                                                </p>
                                            )}
                                        </td>

                                        {/* Excess Weight & Charges */}
                                        <td className="py-2 px-3 whitespace-nowrap text-gray-500" style={{ maxWidth: "230px", width: "180px" }}>
                                            <p className="font-medium">
                                                <span className="font-[600]">Excess Weight:</span>
                                                {order.excessWeightCharges?.excessWeight || 0} Kg
                                            </p>
                                            <p className="font-medium">
                                                <span className="font-[600]">Excess Charges:</span>{" "}
                                                ₹{Number(order.excessWeightCharges?.excessCharges || 0).toFixed(2)}
                                            </p>
                                            <p className="font-medium">
                                                <span className="font-[600]">Pending Amount:</span>
                                                ₹{Number(order.excessWeightCharges?.pendingAmount || 0).toFixed(2)}
                                            </p>
                                        </td>

                                        {/* Status */}
                                        <td className="py-2 px-3 whitespace-nowrap text-gray-500" style={{ maxWidth: "130px", width: "100px" }}>
                                            <span className="px-2 py-1 rounded text-[10px] bg-green-100 text-green-700">
                                                {order.adminStatus || order.status}
                                            </span>
                                        </td>

                                        {/* Details Column */}
                                        {detailsColumnTitle && (
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                {renderDetails && renderDetails(order, index)}
                                            </td>
                                        )}

                                        {/* Actions Column */}
                                        {actionsColumnTitle && (
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                {renderActions && renderActions(order, index)}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SharedWeightDiscrepancyTable;
