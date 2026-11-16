// B2C <-> Cargo wallet transfer (backend POST /recharge/transfer, wallet/cargoWallet.js). Only for accounts that
// have a QuickPost Cargo wallet (the platform's own company); white-label sellers never see it.
// Every recharge lands in the B2C (main) wallet; B2B shipments are paid from the Cargo wallet. Minimum ₹1,000.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Notification } from "../Notification";

const MIN_TRANSFER = 1000;
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function TransferWalletModal({ open, onClose, onSuccess }) {
  const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [direction, setDirection] = useState("toCargo");
  const [amount, setAmount] = useState("");
  const [wallets, setWallets] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await axios.get(`${REACT_APP_BACKEND_URL}/recharge/wallets`);
      setWallets({
        main: { balance: Number(data.main?.balance || 0), holdAmount: Number(data.main?.holdAmount || 0) },
        cargo: { balance: Number(data.cargo?.balance || 0), holdAmount: Number(data.cargo?.holdAmount || 0) },
      });
    } catch (err) {
      Notification(err?.response?.data?.message || "Could not load the wallet balances", "error");
    }
  };

  useEffect(() => {
    if (!open) return;
    setDirection("toCargo");
    setAmount("");
    setWallets(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const from = wallets ? (direction === "toCargo" ? wallets.main : wallets.cargo) : null;
  const to = wallets ? (direction === "toCargo" ? wallets.cargo : wallets.main) : null;
  const available = from ? Math.max(0, Math.round((from.balance - from.holdAmount) * 100) / 100) : 0;
  const value = Number(amount) || 0;
  const fromName = direction === "toCargo" ? "B2C Wallet" : "Cargo Wallet";
  const toName = direction === "toCargo" ? "Cargo Wallet" : "B2C Wallet";
  const error =
    value > 0 && value < MIN_TRANSFER
      ? `Minimum transfer is ₹${MIN_TRANSFER.toLocaleString("en-IN")}`
      : value > available
        ? `Only ${inr(available)} can be transferred from the ${fromName}`
        : "";

  const submit = async () => {
    if (!value || error) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${REACT_APP_BACKEND_URL}/recharge/transfer`, { direction, amount: value });
      Notification(data.message || "Transferred", "success");
      onSuccess?.({ main: Number(data.main), cargo: Number(data.cargo) });
      onClose();
    } catch (err) {
      Notification(err?.response?.data?.message || "Transfer failed. Nothing was moved — please try again.", "error");
      load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg text-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[14px] font-[600]">Transfer Between Wallets</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-[16px] leading-none">×</button>
        </div>
        <p className="text-[11px] text-gray-500 mb-3">
          Recharges go to the B2C wallet. B2B (Cargo) shipments are paid from the Cargo wallet.
        </p>

        {!wallets ? (
          <p className="text-[12px] text-gray-500 py-6 text-center">Loading…</p>
        ) : (
          <>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="font-[600]">From · {fromName}</span>
                <span className={`font-[600] ${from.balance < 0 ? "text-red-500" : ""}`}>{inr(from.balance)}</span>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => { setDirection(direction === "toCargo" ? "toMain" : "toCargo"); setAmount(""); }}
                  className="text-[11px] font-[600] text-brand-primary border border-brand-primary rounded-full px-3 py-0.5 hover:bg-gray-50"
                >
                  ⇅ Switch direction
                </button>
              </div>
              <div className="flex justify-between rounded-lg border border-brand-primary/40 px-3 py-2">
                <span className="font-[600]">To · {toName}</span>
                <span className={`font-[600] ${to.balance < 0 ? "text-red-500" : ""}`}>{inr(to.balance)}</span>
              </div>
              {from.holdAmount > 0 && (
                <p className="text-[10px] text-amber-600">Hold {inr(from.holdAmount)} stays in the {fromName}.</p>
              )}
            </div>

            <label className="block text-[11px] font-[600] mt-3 mb-1">Amount (₹)</label>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder={`Minimum ₹${MIN_TRANSFER.toLocaleString("en-IN")}`}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-[12px] focus:outline-none focus:border-brand-primary"
            />
            <p className="text-[10px] text-gray-500 mt-1">Available to transfer: {inr(available)}</p>
            {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}

            <div className="flex gap-2 mt-3">
              <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-1.5 text-[12px] font-[600]">
                Cancel
              </button>
              <button
                type="button"
                disabled={!value || !!error || loading}
                onClick={submit}
                className="flex-1 rounded-lg bg-brand-primary py-1.5 text-[12px] font-[600] text-white disabled:opacity-50"
              >
                {loading ? "Transferring…" : `Transfer to ${toName}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
