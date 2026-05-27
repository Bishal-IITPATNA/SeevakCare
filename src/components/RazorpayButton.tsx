"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  type: "MEDICINE_ORDER" | "LAB_BOOKING" | "APPOINTMENT";
  referenceId: string;
  label?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

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

export function RazorpayButton({ type, referenceId, label = "Pay Now", disabled, onSuccess, onError }: Props) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  async function handlePayment() {
    try {
      await loadRazorpayScript();

      const res = await fetch("/api/payments/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type, referenceId }),
      });

      if (!res.ok) {
        const d = await res.json();
        onError?.(d.error ?? "Failed to create order");
        return;
      }

      const data = await res.json();

      const rzp = new window.Razorpay({
        key:        data.key,
        amount:     data.amount,
        currency:   data.currency,
        order_id:   data.razorpayOrderId,
        name:       "Seevak Care",
        description: `Payment for ${type.replace(/_/g, " ")}`,
        image:      "/logo.jpg",
        theme:      { color: "#0284c7" },
        prefill:    {},
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
        modal: {
          ondismiss: () => onError?.("Payment cancelled"),
        },
      });

      rzp.open();
    } catch (err: any) {
      onError?.(err.message ?? "Payment error");
    }
  }

  return (
    <div className="space-y-2">
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
      <button
        onClick={handlePayment}
        disabled={disabled || !termsAccepted}
        className="btn-primary flex items-center gap-2"
      >
        <span>💳</span> {label}
      </button>
    </div>
  );
}
