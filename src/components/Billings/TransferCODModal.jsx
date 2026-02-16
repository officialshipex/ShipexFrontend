import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Cookies from "js-cookie";
import { Notification } from "../../Notification";
import { Wallet, Lock } from "lucide-react";


const TranseferCODModal = ({ id, onClose, selectedRemittanceIds = [] }) => {
  const [remittance, setRemittance] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);

  const [balance, setBalance] = useState(0);
  const [holdAmount, setHoldAmount] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);

  const [approveTopup, setApproveTopup] = useState(true); // NEW

  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // ======================================================================
  // FETCH DATA
  // ======================================================================
  useEffect(() => {
    const fetchCodTransfer = async () => {
      if (!id || !selectedRemittanceIds?.length) return;

      try {
        const token = Cookies.get("session");

        const response = await axios.get(
          `${REACT_APP_BACKEND_URL}/cod/getCODTransferData/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { selectedRemittanceIds },
          }
        );

        const fetched = response.data?.data;
        setRemittance(Array.isArray(fetched) ? fetched[0] : fetched);

        setBankDetails(response.data.bankDetails || null);

        setBalance(
          Number(
            response.data.walletBalance ??
            response.data.balance ??
            0
          )
        );

        setHoldAmount(
          Number(
            response.data.holdAmount ??
            response.data.holdamount ??
            0
          )
        );
      } catch (error) {
        console.error("Error fetching remittance data:", error);
      }
    };

    fetchCodTransfer();
  }, [id, selectedRemittanceIds, REACT_APP_BACKEND_URL]);

  // ======================================================================
  // REMITTANCE ENTRIES PROCESSING
  // ======================================================================
  const remittanceEntries = useMemo(() => {
    if (!remittance?.remittanceData) return [];

    return remittance.remittanceData.map((r) => {
      const cod = Number(r.codAvailable || 0);
      const walletAmt = Number(r.amountCreditedToWallet || 0);
      const early = Number(r.earlyCodCharges || 0);

      const remAmount = Number((cod).toFixed(2));

      return {
        ...r,
        remittanceAmount: remAmount,
      };
    });
  }, [remittance]);

  // ======================================================================
  // HOLD LOGIC (unchanged)
  // ======================================================================
  const holdResolved = useMemo(() => {
    if (!holdAmount || holdAmount <= 0)
      return { heldIds: [], heldAmount: 0 };

    const sortedAsc = [...remittanceEntries].sort(
      (a, b) => a.remittanceAmount - b.remittanceAmount
    );

    const single = sortedAsc.find(
      (r) => r.remittanceAmount >= Number(holdAmount)
    );

    if (single) {
      return {
        heldIds: [String(single.remittanceId || single._id)],
        heldAmount: single.remittanceAmount,
      };
    }

    const sortedDesc = [...remittanceEntries].sort(
      (a, b) => b.remittanceAmount - a.remittanceAmount
    );

    let total = 0;
    const chosen = [];

    for (const r of sortedDesc) {
      chosen.push(r);
      total += r.remittanceAmount;
      if (total >= Number(holdAmount)) break;
    }

    return {
      heldIds: chosen.map((c) => String(c.remittanceId || c._id)),
      heldAmount: total,
    };
  }, [holdAmount, remittanceEntries]);

  // ======================================================================
  // WALLET TOPUP LOGIC
  // ======================================================================
  const walletTopUp = useMemo(() => {
    const needed = balance < 0 ? Math.abs(balance) : 0;
    if (needed <= 0)
      return { needed: 0, topUpIds: [], topUpAmount: 0 };

    const available = remittanceEntries.filter(
      (r) => !holdResolved.heldIds.includes(String(r.remittanceId || r._id))
    );

    const sortedAsc = [...available].sort(
      (a, b) => a.remittanceAmount - b.remittanceAmount
    );

    const single = sortedAsc.find((r) => r.remittanceAmount >= needed);

    if (single) {
      return {
        needed,
        topUpIds: [String(single.remittanceId || single._id)],
        topUpAmount: single.remittanceAmount,
      };
    }

    let sum = 0;
    const chosen = [];

    for (const r of sortedAsc) {
      chosen.push(r);
      sum += r.remittanceAmount;
      if (sum >= needed) break;
    }

    return {
      needed,
      topUpIds: chosen.map((s) => String(s.remittanceId || s._id)),
      topUpAmount: sum,
    };
  }, [balance, remittanceEntries, holdResolved]);

  // ======================================================================
  // FROZEN LOGIC → if checkbox unchecked
  // ======================================================================
  const frozenIds = useMemo(() => {
    if (!approveTopup) return [...walletTopUp.topUpIds];
    return [];
  }, [approveTopup, walletTopUp]);

  // ======================================================================
  // PAYABLE LOGIC
  // ======================================================================
  const payableInfo = useMemo(() => {
    const heldSet = new Set(holdResolved.heldIds.map(String));
    const frozenSet = new Set(frozenIds.map(String));
    const topUpSet = new Set(walletTopUp.topUpIds.map(String));

    const payable = remittanceEntries.filter((r) => {
      const id = String(r.remittanceId || r._id);

      if (heldSet.has(id)) return false;
      if (frozenSet.has(id)) return false;

      if (approveTopup && topUpSet.has(id)) return false;

      return true;
    });

    const total = payable.reduce(
      (sum, r) => sum + (r.remittanceAmount || 0),
      0
    );

    return {
      payable,
      payableIds: payable.map((p) => String(p.remittanceId || p._id)),
      payableTotal: Number(total.toFixed(2)),
    };
  }, [
    remittanceEntries,
    holdResolved,
    walletTopUp,
    frozenIds,
    approveTopup,
  ]);

  // ======================================================================
  // SUBMIT HANDLER (UTR optional when payable = 0)
  // ======================================================================
  const handleSubmit = async () => {
    if (payableInfo.payableTotal > 0 && !utr.trim()) {
      Notification("Please enter UTR", "info");
      return;
    }

    const payload = {
      utr: utr || null,
      selectedRemittanceIds: remittanceEntries.map((r) =>
        String(r.remittanceId || r._id)
      ),
      payableRemittanceIds: payableInfo.payableIds,
      topUpRemittanceIds: approveTopup ? walletTopUp.topUpIds : [],
      frozenRemittanceIds: frozenIds,
    };

    setLoading(true);

    try {
      const token = Cookies.get("session");

      const response = await axios.post(
        `${REACT_APP_BACKEND_URL}/cod/transferCOD/${id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Notification(response?.data?.message || "COD transfer done", "success");
      onClose();

    } catch (error) {
      Notification(
        error?.response?.data?.message || "Failed to transfer COD",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================================
  // UI REMAINS EXACTLY THE SAME AS BEFORE
  // ======================================================================
  const boxClass = (isPositive) =>
    `p-3 rounded-lg shadow-sm flex items-center gap-3 ${isPositive ? "bg-green-50" : "bg-red-50"
    }`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-4 relative overflow-y-auto max-h-[90vh]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
          >
            ✕
          </button>

          {/* Title */}
          <h2 className="text-[14px] sm:text-[16px] font-[600] mb-4 text-gray-700 border-b pb-2">
            Transfer COD Details
          </h2>

          {/* LOADING */}
          {!remittance ? (
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
            </div>
          ) : (
            <>
              {/* BALANCE + HOLD SECTION (unchanged UI) */}
              <h3 className="text-[12px] font-[600] mb-2 text-gray-700">
                Wallet Details
              </h3>
              <div className="mb-2 flex flex-col sm:flex-row w-full gap-2">
                <div className="flex gap-2 w-full">
                  {/* Wallet Balance */}
                  <div className={`${boxClass(balance >= 0)} w-full`}>

                    <div className="flex items-center gap-2 w-full">

                      {/* Icon with dynamic background */}
                      <div
                        className={`p-2 rounded-full ${balance >= 0 ? "bg-[#0CBB7D] text-white" : "bg-red-600 text-white"
                          }`}
                      >
                        <Wallet size={16} />
                      </div>

                      <div>
                        <div className="text-[10px] font-[600]">Wallet Balance</div>
                        <div
                          className={`text-[16px] font-[600] ${balance >= 0 ? "text-green-700" : "text-red-600"
                            }`}
                        >
                          ₹{balance.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hold Amount */}
                  <div
                    className={`${boxClass(holdAmount === 0)} w-full`}
                  // style={{ minWidth: 180, flex: 1 }}
                  >
                    <div className="flex items-center gap-2 w-full">

                      {/* Icon with dynamic background */}
                      <div
                        className={`p-2 rounded-full ${holdAmount > 0 ? "bg-red-600 text-white" : "bg-[#0CBB7D] text-white"
                          }`}
                      >
                        <Lock size={16} />
                      </div>

                      <div>
                        <div className="text-[10px] font-[600]">Hold Amount</div>
                        <div
                          className={`text-[16px] font-[700] ${holdAmount > 0 ? "text-red-600" : "text-green-700"
                            }`}
                        >
                          ₹{holdAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  {/* Credit Limit */}
                  <div
                    className={`${boxClass(creditLimit === 0)} w-full`}
                  // style={{ minWidth: 180, flex: 1 }}
                  >
                    <div className="flex items-center gap-2 w-full">

                      {/* Icon with dynamic background */}
                      <div
                        className={`p-2 rounded-full ${creditLimit > 0 ? "bg-red-600 text-white" : "bg-[#0CBB7D] text-white"
                          }`}
                      >
                        <Lock size={16} />
                      </div>

                      <div>
                        <div className="text-[10px] font-[600]">Credit Limit</div>
                        <div
                          className={`text-[16px] font-[700] ${creditLimit > 0 ? "text-red-600" : "text-green-700"
                            }`}
                        >
                          ₹{creditLimit.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Usable Amount */}
                  <div
                    className={`${boxClass(balance.toFixed(2) - holdAmount.toFixed(2) >= 0)} w-full`}
                  // style={{ minWidth: 180, flex: 1 }}
                  >
                    <div className="flex items-center gap-2 w-full">

                      {/* Icon with dynamic background */}
                      <div
                        className={`p-2 rounded-full ${balance.toFixed(2) - holdAmount.toFixed(2) < 0 ? "bg-red-600 text-white" : "bg-[#0CBB7D] text-white"
                          }`}
                      >
                        <Lock size={16} />
                      </div>

                      <div>
                        <div className="text-[10px] font-[600]">Usable Balance</div>
                        <div
                          className={`text-[16px] font-[700] ${balance.toFixed(2) - holdAmount.toFixed(2) > 0 ? "text-[#0CBB7D]" : "text-red-600"
                            }`}
                        >
                          ₹{(balance - holdAmount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>



              {/* If Wallet Negative → same UI + checkbox */}
              {balance < 0 && (
                <section className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-600 font-semibold mb-1">
                    Wallet is negative: ₹{balance.toFixed(2)}
                  </div>

                  <div className="text-[12px] font-[600]">Top-up Required:</div>

                  <input
                    readOnly
                    value={`₹${walletTopUp.topUpAmount.toFixed(2)}`}
                    className="w-full mt-1 px-3 py-2 text-[12px] bg-gray-50 border border-gray-300 rounded"
                  />

                  <div className="text-[11px] mt-1 text-gray-600">
                    Top-up Candidate Remittance(s):{" "}
                    {walletTopUp.topUpIds.join(", ")}
                  </div>

                  {/* NEW CHECKBOX (UI unchanged position) */}
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={approveTopup}
                      onChange={() => setApproveTopup(!approveTopup)}
                    />
                    <span className="text-[12px] font-semibold">
                      Adjust this amount into wallet
                    </span>
                  </label>

                  {!approveTopup && (
                    <div className="text-purple-600 text-[11px] mt-1">
                      These remittances will be Frozen (not paid + not adjusted)
                    </div>
                  )}
                </section>
              )}
              <h3 className="text-[12px] font-[600] mb-2 text-gray-700">
                Bank Details
              </h3>
              {/* Bank Details (unchanged) */}
              {bankDetails && (
                <div className="mb-2 px-3 py-2 border border-gray-200 rounded-lg bg-green-50 shadow-sm">
                  <div className="grid sm:grid-cols-2 grid-cols-1 gap-2 text-[11px] text-gray-700">
                    <div>
                      <span className="font-[600]">Account Holder:</span>{" "}
                      {bankDetails.nameAtBank}
                    </div>
                    <div>
                      <span className="font-[600]">Account Number:</span>{" "}
                      {bankDetails.accountNumber}
                    </div>
                    <div>
                      <span className="font-[600]">Bank:</span>{" "}
                      {bankDetails.bank}
                    </div>
                    <div>
                      <span className="font-[600]">Branch:</span>{" "}
                      {bankDetails.branch}
                    </div>
                    <div>
                      <span className="font-[600]">City:</span>{" "}
                      {bankDetails.city}
                    </div>
                    <div>
                      <span className="font-[600]">IFSC:</span>{" "}
                      {bankDetails.ifsc}
                    </div>
                  </div>
                </div>
              )}
              <h3 className="text-[12px] font-[600] mb-2 text-gray-700">
                Remittance Details
              </h3>
              {/* Summary Section — unchanged */}
              <section className="mb-2 grid sm:grid-cols-2 grid-cols-1 font-[600] px-3 py-2 gap-2 text-[11px] border border-gray-200 rounded-lg bg-green-50 shadow-sm text-gray-700">
                <div className="text-[#0CBB7D]">
                  <span>Remittance Initiated:</span>{" "}
                  ₹{remittance.RemittanceInitiated.toFixed(2)}
                </div>
                <div className="text-orange-500">
                  <span className="font-[600]">COD To Be Remitted:</span>{" "}
                  ₹{remittance.CODToBeRemitted.toFixed(2)}
                </div>
              </section>

              {/* Remittance Table — unchanged layout */}
              <section className="mb-4">
                <h3 className="text-[12px] font-[600] mb-2">Remittance Data</h3>

                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                  <table className="sm:w-full min-w-[700px] text-left border-collapse text-[11px]">
                    <thead className="bg-green-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 border-b">Remittance ID</th>
                        <th className="px-3 py-2 border-b">Total COD Amount</th>
                        <th className="px-3 py-2 border-b">Amount Credited to Wallet</th>
                        <th className="px-3 py-2 border-b">Early COD Charges</th>
                        <th className="px-3 py-2 border-b">Remittance Amount</th>
                        <th className="px-3 py-2 border-b">Status</th>
                        <th className="px-3 py-2 border-b">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {remittanceEntries.map((item) => {
                        const idStr = String(item.remittanceId || item._id);

                        const isHeld = holdResolved.heldIds.includes(idStr);
                        const isTopUp = walletTopUp.topUpIds.includes(idStr);
                        const isFrozen = frozenIds.includes(idStr);

                        return (
                          <tr key={idStr} className="border-b">
                            <td className="px-3 py-2 text-[#0CBB7D]">
                              {item.remittanceId}
                            </td>
                            <td className="px-3 py-2">
                              ₹{(
                                Number(item.codAvailable || 0) +
                                Number(item.amountCreditedToWallet || 0) +
                                Number(item.earlyCodCharges || 0)
                              ).toFixed(2)}
                            </td>
                            <td className="px-3 py-2">
                              ₹{Number(item.amountCreditedToWallet).toFixed(2)}
                            </td>
                            <td className="px-3 py-2">
                              ₹{Number(item.earlyCodCharges).toFixed(2)}
                            </td>
                            <td className="px-3 py-2">
                              ₹{item.remittanceAmount.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 capitalize text-orange-500">
                              {item.status}
                            </td>

                            {/* NOTE COLUMN */}
                            <td className="px-3 py-2">
                              {isHeld ? (
                                <span className="text-red-600 font-semibold">
                                  Held
                                </span>
                              ) : isFrozen ? (
                                <span className="text-purple-600 font-semibold">
                                  Frozen
                                </span>
                              ) : isTopUp ? (
                                <span className="text-blue-600 font-semibold">
                                  TopUp
                                </span>
                              ) : (
                                <span className="text-green-600 font-semibold">
                                  Payable
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mb-4 p-3 border rounded-lg flex flex-col justify-center bg-gray-50">

                {/* Amount Payable Row */}
                <div className="flex w-full justify-between items-center gap-2">
                  <div className="text-[12px] font-[700]">
                    Amount payable to client :
                  </div>
                  <div className="text-[18px] font-[600] text-gray-700">
                    ₹{payableInfo.payableTotal.toFixed(2)}
                  </div>
                </div>

                {/* UTR input INSIDE this box */}
                {payableInfo.payableTotal > 0 && (
                  <div className="flex flex-row gap-2 items-center justify-between">
                    <label className="block text-gray-700 font-[600] sm:min-w-0 min-w-[150px] mb-1 text-[12px]">
                      Enter UTR :
                    </label>
                    <input
                      type="text"
                      value={utr}
                      placeholder="Enter UTR here"
                      onChange={(e) => setUtr(e.target.value)}
                      className="sm:w-[200px] w-full px-3 py-2 border border-gray-300 focus:outline-none rounded-lg text-[12px]"
                    />
                  </div>
                )}

              </section>


              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-4">
                <button
                  className="px-3 py-2 rounded-lg border text-[10px] sm:text-[12px] text-gray-700 hover:bg-gray-100"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  className="px-3 py-2 bg-[#0CBB7D] text-[10px] sm:text-[12px] text-white rounded-lg font-[600] hover:bg-green-500 disabled:opacity-60"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>

            </>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TranseferCODModal;
