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

export function PaymentOptions({ type, referenceId, amount, onSuccess, onError }: Props) {
  const [mode, setMode]           = useState<"full" | "emi" | "cod">("full");
  const [tenure, setTenure]       = useState<EmiTenure>(3);
  const [loading, setLoading]     = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const emi = calculateEmi(amount, tenure);

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

  async function pay(isEmi: boolean) {
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

      const rzp = new window.Razorpay({
        key:         data.key,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.razorpayOrderId,
        name:        "Seevak Care",
        description: isEmi ? `EMI ${displayAmount}` : `Full payment ${displayAmount}`,
        image:       "/logo.jpg",
        theme:       { color: "#0284c7" },
        prefill:     {},
        notes: {
          merchant_legal_entity: "RADIUS CARE WELL INDIA PRIVATE LIMITED",
          terms_url: "/terms-and-conditions",
          refund_url: "/refund-policy",
        },
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
        modal: { ondismiss: () => onError?.("Payment cancelled") },
      });

      rzp.open();
    } catch (err: any) {
      onError?.(err.message ?? "Payment error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setMode("full")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
            mode === "full"
              ? "bg-sky-600 text-white border-sky-600"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          💳 Pay Online
        </button>
        <button
          onClick={() => setMode("emi")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
            mode === "emi"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          📅 EMI
        </button>
        {type === "MEDICINE_ORDER" && (
          <button
            onClick={() => setMode("cod")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === "cod"
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-slate-600 border-slate-200 hover:bg-amber-50"
            }`}
          >
            💵 Cash on Delivery
          </button>
        )}
      </div>

      {/* T&C acceptance — required by Razorpay guidelines */}
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

      {mode === "full" && (
        <button
          onClick={() => pay(false)}
          disabled={loading || !termsAccepted}
          className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          {loading ? "Processing…" : `💳 Pay ₹${amount.toFixed(2)} Online`}
        </button>
      )}

      {mode === "emi" && (
        <div className="space-y-3">
          {/* Tenure picker */}
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

          {/* EMI breakdown */}
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
            onClick={() => pay(true)}
            disabled={loading || !termsAccepted}
            className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Processing…" : `📅 Pay 1st Instalment ₹${emi.monthlyEmi.toFixed(2)}`}
          </button>
        </div>
      )}
      {mode === "cod" && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-1">
            <p className="font-semibold">💵 Cash on Delivery</p>
            <p>Pay <strong>₹{amount.toFixed(2)}</strong> in cash when your order arrives at your door.</p>
            <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5 pt-1">
              <li>Keep exact change ready</li>
              <li>You will receive a 6-digit OTP — share it with the delivery person to confirm receipt</li>
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
