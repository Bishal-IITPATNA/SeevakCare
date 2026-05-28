"use client";
import { useState } from "react";
import Link from "next/link";
import { calculateEmi, EMI_ANNUAL_RATE, EMI_TENURES, type EmiTenure } from "@/lib/utils/emi";

declare global {
  interface Window { Razorpay: any; }
}

async function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src     = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve();
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

interface Props {
  type: "MEDICINE_ORDER" | "LAB_BOOKING" | "APPOINTMENT";
  referenceId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

type Mode = "full" | "upi" | "emi" | "cod";

export function PaymentOptions({ type, referenceId, amount, onSuccess, onError }: Props) {
  const [mode, setMode]                   = useState<Mode>("full");
  const [tenure, setTenure]               = useState<EmiTenure>(3);
  const [loading, setLoading]             = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const emi = calculateEmi(amount, tenure);

  /* ── COD ─────────────────────────────────────────── */
  async function confirmCod() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payments/cod", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ referenceId }),
      });
      if (!res.ok) {
        const d = await res.json();
        onError?.(d.error ?? "Failed to confirm COD order");
        return;
      }
      onSuccess?.();
    } catch (err: any) {
      onError?.(err.message ?? "COD confirmation error");
    } finally {
      setLoading(false);
    }
  }

  /* ── Razorpay (online / UPI / EMI) ───────────────── */
  async function pay(isEmi: boolean, upiOnly = false) {
    if (loading) return;
    setLoading(true);
    try {
      await loadRazorpayScript();

      const res = await fetch("/api/payments/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type, referenceId, isEmi, emiTenure: isEmi ? tenure : undefined }),
      });

      if (!res.ok) {
        const d = await res.json();
        onError?.(d.error ?? "Failed to create order");
        return;
      }

      const data = await res.json();
      const displayAmount = isEmi
        ? `Instalment 1/${tenure} — ₹${data.monthlyEmi?.toFixed(2)}`
        : `₹${amount.toFixed(2)}`;

      // UPI-only config: shows QR code + PhonePe / GPay / Paytm intent buttons
      const upiConfig = upiOnly
        ? {
            config: {
              display: {
                blocks: {
                  upi_block: {
                    name: "Pay via UPI",
                    instruments: [
                      { method: "upi", flows: ["qr"] },
                      { method: "upi", flows: ["intent"], apps: ["google_pay", "phonepe", "paytm"] },
                    ],
                  },
                },
                sequence: ["block.upi_block"],
                preferences: { show_default_blocks: false },
              },
            },
          }
        : {};

      const rzp = new window.Razorpay({
        key:         data.key,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.razorpayOrderId,
        name:        "Seevak Care",
        description: isEmi ? `EMI ${displayAmount}` : `Payment ${displayAmount}`,
        image:       "/logo.jpg",
        theme:       { color: "#0284c7" },
        prefill:     {},
        notes: {
          merchant_legal_entity: "RADIUS CARE WELL INDIA PRIVATE LIMITED",
          terms_url:  "/terms-and-conditions",
          refund_url: "/refund-policy",
        },
        ...upiConfig,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            onSuccess?.();
          } else {
            const d = await verifyRes.json();
            onError?.(d.error ?? "Payment verification failed");
          }
        },
        modal: { ondismiss: () => { setLoading(false); onError?.("Payment cancelled"); } },
      });

      rzp.open();
    } catch (err: any) {
      onError?.(err.message ?? "Payment error");
    } finally {
      setLoading(false);
    }
  }

  /* ── Shared tab style ─────────────────────────────── */
  function tabClass(m: Mode, activeColor: string) {
    return `flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
      mode === m ? `${activeColor} text-white border-transparent` : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
    }`;
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">

      {/* ── Mode tabs ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setMode("full")} className={tabClass("full", "bg-sky-600")}>
          💳 Card / Net Banking
        </button>
        <button onClick={() => setMode("upi")} className={tabClass("upi", "bg-violet-600")}>
          📱 UPI / Scanner
        </button>
        <button onClick={() => setMode("emi")} className={tabClass("emi", "bg-green-600")}>
          📅 Pay in EMI
        </button>
        {type === "MEDICINE_ORDER" && (
          <button onClick={() => setMode("cod")} className={tabClass("cod", "bg-amber-500")}>
            💵 Cash on Delivery
          </button>
        )}
      </div>

      {/* ── T&C ───────────────────────────────────────── */}
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 shrink-0"
        />
        <span className="text-xs text-slate-500 leading-relaxed">
          I agree to the{" "}
          <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/refund-policy" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline">
            Refund Policy
          </Link>{" "}
          of Seevak Care (Radius Care Well India Pvt Ltd)
        </span>
      </label>

      {/* ── Card / Net Banking ────────────────────────── */}
      {mode === "full" && (
        <button
          onClick={() => pay(false, false)}
          disabled={loading || !termsAccepted}
          className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          {loading ? "Processing…" : `💳 Pay ₹${amount.toFixed(2)} via Card / Net Banking`}
        </button>
      )}

      {/* ── UPI / Scanner ─────────────────────────────── */}
      {mode === "upi" && (
        <div className="space-y-3">
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 space-y-2">
            <p className="text-sm font-semibold text-violet-800">📱 Pay via UPI</p>
            <p className="text-xs text-violet-700">
              Scan the QR code or pay directly from PhonePe, Google Pay, or Paytm.
              Razorpay will open a QR code + app selector automatically.
            </p>
            {/* App logos row */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-medium bg-white border border-violet-200 rounded-full px-2 py-0.5 text-violet-700">PhonePe</span>
              <span className="text-xs font-medium bg-white border border-violet-200 rounded-full px-2 py-0.5 text-violet-700">Google Pay</span>
              <span className="text-xs font-medium bg-white border border-violet-200 rounded-full px-2 py-0.5 text-violet-700">Paytm</span>
              <span className="text-xs text-violet-500">+ any UPI app</span>
            </div>
          </div>
          <button
            onClick={() => pay(false, true)}
            disabled={loading || !termsAccepted}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Opening…" : `📱 Pay ₹${amount.toFixed(2)} via UPI`}
          </button>
        </div>
      )}

      {/* ── EMI ───────────────────────────────────────── */}
      {mode === "emi" && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">Select tenure ({EMI_ANNUAL_RATE}% interest p.a.)</p>
            <div className="flex gap-2">
              {EMI_TENURES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTenure(t)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                    tenure === t
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-green-50"
                  }`}
                >
                  {t}M
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Principal</span>
              <span className="font-medium">₹{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Interest ({EMI_ANNUAL_RATE}% p.a.)</span>
              <span className="font-medium text-orange-600">+₹{emi.totalInterest.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5">
              <span className="text-slate-500">Total payable</span>
              <span className="font-semibold">₹{emi.totalPayable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between bg-green-50 rounded-lg px-2 py-1.5 mt-1">
              <span className="text-green-700 font-semibold">Monthly EMI × {tenure}</span>
              <span className="text-green-700 font-bold text-base">₹{emi.monthlyEmi.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Service activates after 1st instalment. Remaining instalments due monthly.
          </p>
          <button
            onClick={() => pay(true, false)}
            disabled={loading || !termsAccepted}
            className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Processing…" : `📅 Pay 1st Instalment ₹${emi.monthlyEmi.toFixed(2)}`}
          </button>
        </div>
      )}

      {/* ── Cash on Delivery ──────────────────────────── */}
      {mode === "cod" && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-1">
            <p className="font-semibold">💵 Cash on Delivery</p>
            <p>Pay <strong>₹{amount.toFixed(2)}</strong> in cash when your order arrives at your door.</p>
            <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5 pt-1">
              <li>Keep exact change ready</li>
              <li>Share your 6-digit OTP with the delivery person to confirm receipt</li>
              <li>COD available for orders up to ₹5,000</li>
            </ul>
          </div>
          <button
            onClick={confirmCod}
            disabled={loading || !termsAccepted}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Confirming…" : `💵 Confirm COD — ₹${amount.toFixed(2)}`}
          </button>
        </div>
      )}
    </div>
  );
}
