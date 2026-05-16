"use client";
import { useEffect, useState } from "react";

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

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:     "bg-blue-50 text-blue-700",
  COMPLETED:  "bg-green-50 text-green-700",
  DEFAULTED:  "bg-red-50 text-red-700",
};

const INST_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID:    "bg-green-50 text-green-700",
  OVERDUE: "bg-red-50 text-red-700",
};

function planLabel(plan: any): string {
  if (plan.payment?.medicineOrder) return "Medicine Order";
  if (plan.payment?.labBooking)    return `Lab: ${plan.payment.labBooking.labTest?.name ?? "Test"}`;
  if (plan.payment?.appointment) {
    const docName = plan.payment.appointment.doctor?.user?.name;
    return docName ? `Dr. ${docName} Consultation` : "Hospital Appointment";
  }
  return "Payment";
}

export function EmiPlansSection() {
  const [plans, setPlans]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [msg, setMsg]         = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/emi/plans")
      .then(r => r.json())
      .then(d => { setPlans(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  function refresh() {
    setLoading(true);
    fetch("/api/emi/plans")
      .then(r => r.json())
      .then(d => { setPlans(Array.isArray(d) ? d : []); setLoading(false); });
  }

  async function payInstallment(installment: any) {
    setPayingId(installment.id);
    setMsg(m => ({ ...m, [installment.id]: "" }));
    try {
      await loadRazorpayScript();

      const res = await fetch(`/api/emi/installments/${installment.id}/pay`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        setMsg(m => ({ ...m, [installment.id]: d.error ?? "Failed" }));
        return;
      }

      const data = await res.json();

      const rzp = new window.Razorpay({
        key:         data.key,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.razorpayOrderId,
        name:        "Seevak Care",
        description: `EMI Instalment ${data.installmentNumber}/${data.tenureMonths}`,
        image:       "/logo.jpg",
        theme:       { color: "#16a34a" },
        prefill:     {},
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/verify-emi", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              installmentId:     installment.id,
            }),
          });
          if (verifyRes.ok) {
            const d = await verifyRes.json();
            setMsg(m => ({ ...m, [installment.id]: d.planCompleted ? "All instalments paid! ✅" : "Instalment paid ✅" }));
            refresh();
          } else {
            const d = await verifyRes.json();
            setMsg(m => ({ ...m, [installment.id]: d.error ?? "Verification failed" }));
          }
        },
        modal: { ondismiss: () => setMsg(m => ({ ...m, [installment.id]: "Payment cancelled" })) },
      });

      rzp.open();
    } catch (err: any) {
      setMsg(m => ({ ...m, [installment.id]: err.message ?? "Error" }));
    } finally {
      setPayingId(null);
    }
  }

  if (loading) return <p className="text-slate-400 text-sm">Loading EMI plans…</p>;
  if (plans.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-4xl mb-3">📅</p>
        <p className="text-slate-600 font-medium">No active EMI plans</p>
        <p className="text-slate-400 text-sm mt-1">Choose EMI while paying for medicines, lab tests, or appointments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map(plan => {
        const paidCount = plan.installments.filter((i: any) => i.status === "PAID").length;
        const progress  = Math.round((paidCount / plan.tenureMonths) * 100);

        return (
          <div key={plan.id} className="card">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-800">{planLabel(plan)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {plan.tenureMonths}-month EMI · 15% p.a. · Started {new Date(plan.createdAt).toDateString()}
                </p>
              </div>
              <span className={`badge text-xs ${STATUS_COLORS[plan.status] ?? ""}`}>{plan.status}</span>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3 mb-3 text-center">
              <div className="bg-slate-50 rounded-lg py-2">
                <p className="text-xs text-slate-400">Principal</p>
                <p className="font-semibold text-slate-700 text-sm">₹{Number(plan.totalAmount).toFixed(2)}</p>
              </div>
              <div className="bg-green-50 rounded-lg py-2">
                <p className="text-xs text-slate-400">Monthly EMI</p>
                <p className="font-semibold text-green-700 text-sm">₹{Number(plan.monthlyEmi).toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg py-2">
                <p className="text-xs text-slate-400">Total Payable</p>
                <p className="font-semibold text-slate-700 text-sm">₹{Number(plan.totalPayable).toFixed(2)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{paidCount} of {plan.tenureMonths} instalments paid</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Installments */}
            <div className="space-y-2">
              {plan.installments.map((inst: any) => (
                <div key={inst.id} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className={`badge text-xs ${INST_COLORS[inst.status] ?? ""}`}>
                      {inst.status === "PAID" ? "✓" : inst.installmentNumber}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Instalment {inst.installmentNumber} — ₹{Number(inst.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Due: {new Date(inst.dueDate).toDateString()}
                        {inst.paidAt && ` · Paid: ${new Date(inst.paidAt).toDateString()}`}
                      </p>
                    </div>
                  </div>
                  {(inst.status === "PENDING" || inst.status === "OVERDUE") && (
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => payInstallment(inst)}
                        disabled={payingId === inst.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-50"
                      >
                        {payingId === inst.id ? "…" : inst.status === "OVERDUE" ? "Pay (Overdue)" : "Pay Now"}
                      </button>
                      {msg[inst.id] && (
                        <p className={`text-xs ${msg[inst.id].includes("✅") ? "text-green-600" : "text-red-500"}`}>
                          {msg[inst.id]}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
