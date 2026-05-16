"use client";
import { RazorpayButton } from "@/components/RazorpayButton";

const STATUS_STYLES: Record<string, string> = {
  PENDING_APPROVAL: "badge bg-yellow-50 text-yellow-700",
  APPROVED:         "badge bg-blue-50 text-blue-700",
  PAYMENT_PENDING:  "badge bg-orange-50 text-orange-700",
  PAID:             "badge-paid",
  DISPATCHED:       "badge bg-indigo-50 text-indigo-700",
  DELIVERED:        "badge-accepted",
  CANCELLED:        "badge bg-slate-100 text-slate-500",
};

const OTP_VISIBLE_STATUSES = new Set(["PENDING_APPROVAL", "APPROVED", "PAYMENT_PENDING", "PAID", "DISPATCHED"]);

export function MedicineOrderCard({ order, onUpdate }: { order: any; onUpdate?: () => void }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <span className={STATUS_STYLES[order.status] ?? "badge"}>
          {order.status.replace(/_/g, " ")}
        </span>
        <span className="text-xs text-slate-400">{new Date(order.createdAt).toDateString()}</span>
      </div>

      <div className="mb-3">
        {order.items?.map((item: any) => (
          <div key={item.id} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
            <span className="text-slate-700">{item.medicine?.name} × {item.quantity}</span>
            <span className="text-slate-500">₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1 mb-3">
        <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">GST (5%)</span><span>₹{Number(order.gstAmount).toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span>₹{Number(order.deliveryCharge).toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold text-sky-700 text-base border-t border-slate-200 pt-1">
          <span>Total</span><span>₹{Number(order.totalAmount).toFixed(2)}</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">📦 {order.deliveryAddress}, {order.deliveryCity} — {order.deliveryPincode}</p>

      {order.trackingNumber && (
        <p className="text-xs text-sky-600 mb-3">🚚 Tracking: {order.trackingNumber}</p>
      )}

      {/* Delivery OTP — shown to patient, shared with delivery person at door */}
      {order.otpCode && OTP_VISIBLE_STATUSES.has(order.status) && !order.otpVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
          <p className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">Delivery OTP</p>
          <p className="text-3xl font-bold text-amber-800 tracking-[0.4em] text-center py-1">
            {order.otpCode}
          </p>
          <p className="text-xs text-amber-600 text-center mt-1">
            Share this with the delivery person when your medicines arrive
          </p>
        </div>
      )}

      {order.otpVerified && order.status === "DELIVERED" && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 text-xs text-green-700">
          ✅ Delivery confirmed — medicines received
        </div>
      )}

      {order.status === "PAYMENT_PENDING" && (
        <RazorpayButton
          type="MEDICINE_ORDER"
          referenceId={order.id}
          label="Pay Now"
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}
