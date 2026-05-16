"use client";

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
        description: `Payment for ${type.replace("_", " ")}`,
        image:      "/logo.png",
        theme:      { color: "#0284c7" },
        prefill: {},
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
    <button
      onClick={handlePayment}
      disabled={disabled}
      className="btn-primary flex items-center gap-2"
    >
      <span>💳</span> {label}
    </button>
  );
}
