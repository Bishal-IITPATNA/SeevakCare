"use client";
import { useState } from "react";
import { RazorpayButton } from "@/components/RazorpayButton";

const STATUS_STYLES: Record<string, string> = {
  PENDING:          "badge-pending",
  CONFIRMED:        "badge-accepted",
  SAMPLE_COLLECTED: "badge bg-blue-50 text-blue-700",
  REPORT_UPLOADED:  "badge bg-emerald-50 text-emerald-700",
  CANCELLED:        "badge bg-slate-100 text-slate-500",
};

export function LabBookingCard({ booking, onUpdate }: { booking: any; onUpdate?: () => void }) {
  const [otp, setOtp]           = useState("");
  const [verified, setVerified] = useState(booking.otpVerified);
  const [error, setError]       = useState("");

  async function verifyOTP() {
    const res = await fetch(`/api/lab-bookings/${booking.id}/verify-otp`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ otp }),
    });
    if (res.ok) { setVerified(true); setError(""); }
    else { const d = await res.json(); setError(d.error); }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <span className={STATUS_STYLES[booking.status] ?? "badge"}>{booking.status.replace("_", " ")}</span>
        <span className="text-xs text-slate-400">{new Date(booking.createdAt).toDateString()}</span>
      </div>

      <p className="font-semibold text-slate-800 mb-1">{booking.labTest?.name}</p>
      <p className="text-sm text-slate-500 mb-1">
        📍 {booking.labStore?.name} — {booking.collectionType === "HOME" ? "🏠 Home Collection" : "🏢 Visit Lab"}
      </p>
      <p className="text-sm text-slate-500 mb-1">
        📅 {new Date(booking.scheduledDate).toDateString()}
      </p>
      {booking.labTest?.sampleType && (
        <p className="text-xs text-slate-400 mb-3">Sample: {booking.labTest.sampleType}</p>
      )}
      <p className="text-sm font-medium text-sky-700 mb-3">₹{Number(booking.labTest?.price ?? 0).toFixed(2)}</p>

      {booking.status === "REPORT_UPLOADED" && booking.reportUrl && (
        <a
          href={booking.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center gap-2 mb-3"
        >
          📄 Download Report
        </a>
      )}

      {!verified && booking.status === "PENDING" && (
        <div className="border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-2">Verify OTP to confirm booking</p>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="flex gap-2">
            <input
              type="text" inputMode="numeric" maxLength={6} placeholder="OTP"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              className="input flex-1"
            />
            <button onClick={verifyOTP} disabled={otp.length !== 6} className="btn-primary">Verify</button>
          </div>
        </div>
      )}

      {verified && booking.status === "PENDING" && !booking.payment && (
        <RazorpayButton
          type="LAB_BOOKING"
          referenceId={booking.id}
          label="Pay & Confirm"
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}
