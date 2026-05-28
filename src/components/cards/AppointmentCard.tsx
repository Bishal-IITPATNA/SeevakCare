"use client";
import { useState } from "react";
import { PaymentOptions } from "@/components/PaymentOptions";
import { StarInput } from "@/components/StarRating";

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "badge-pending",
  ACCEPTED:  "badge-accepted",
  DECLINED:  "badge-declined",
  COMPLETED: "badge-completed",
  CANCELLED: "bg-slate-50 text-slate-500 badge",
};

export function AppointmentCard({ appointment, onStatusChange }: { appointment: any; onStatusChange?: () => void }) {
  const docName  = appointment.doctor?.user?.name;
  const hospName = appointment.hospital?.name;
  const dateStr  = new Date(appointment.appointmentDate).toDateString();
  const isPaid   = appointment.payment?.status === "SUCCESS";
  const hasFee   = appointment.consultationFee && Number(appointment.consultationFee) > 0;

  // Review state
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const isCompleted = appointment.status === "COMPLETED";
  const canReview   = isCompleted && (appointment.doctorId || appointment.hospitalId);

  async function submitReview() {
    if (rating === 0) { setReviewError("Please select a star rating."); return; }
    setReviewing(true); setReviewError("");
    const res = await fetch("/api/reviews", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewType: appointment.doctorId ? "DOCTOR" : "HOSPITAL",
        doctorId:   appointment.doctorId   || undefined,
        hospitalId: appointment.hospitalId || undefined,
        rating,
        comment: comment.trim() || undefined,
      }),
    });
    if (res.ok) {
      setReviewDone(true);
      onStatusChange?.();
    } else {
      const d = await res.json();
      setReviewError(d.error ?? "Failed to submit review.");
    }
    setReviewing(false);
  }

  return (
    <div className="card flex flex-col gap-4">
      {/* Info row */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={STATUS_STYLES[appointment.status] ?? "badge"}>
              {appointment.status}
            </span>
            {isPaid && <span className="badge-paid">✅ PAID</span>}
          </div>
          <p className="font-semibold text-slate-800">
            {docName ? `Dr. ${docName}` : hospName ?? "Appointment"}
          </p>
          <p className="text-sm text-slate-500">{dateStr} at {appointment.slotTime}</p>
          {appointment.reason && (
            <p className="text-xs text-slate-400 mt-1">{appointment.reason}</p>
          )}
          {appointment.chamber && (
            <p className="text-xs text-slate-400">{appointment.chamber.name} — {appointment.chamber.city}</p>
          )}
          {appointment.department && (
            <p className="text-xs text-slate-400">Dept: {appointment.department.name}</p>
          )}
          {hasFee && (
            <p className="text-sm font-semibold text-sky-700 mt-1">
              Fee: ₹{Number(appointment.consultationFee).toLocaleString("en-IN")}
            </p>
          )}
        </div>
      </div>

      {/* Awaiting acceptance notice */}
      {appointment.status === "PENDING" && hasFee && !isPaid && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
          ⏳ Awaiting confirmation — payment will be available once your appointment is accepted.
        </div>
      )}

      {/* Payment options — shown once accepted and fee is unpaid */}
      {appointment.status === "ACCEPTED" && hasFee && !isPaid && (
        <PaymentOptions
          type="APPOINTMENT"
          referenceId={appointment.id}
          amount={Number(appointment.consultationFee)}
          onSuccess={onStatusChange}
          onError={(msg) => alert(msg)}
        />
      )}

      {/* Review widget — shown for completed appointments */}
      {canReview && (
        <div className="border-t border-slate-100 pt-4">
          {reviewDone ? (
            <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700 font-medium">
              ✅ Thank you for your review!
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">
                ⭐ Rate your experience with {docName ? `Dr. ${docName}` : hospName}
              </p>
              <StarInput value={rating} onChange={setRating} />
              <textarea
                placeholder="Share your experience (optional)…"
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="input h-20 resize-none text-sm"
              />
              {reviewError && <p className="text-xs text-red-500">{reviewError}</p>}
              <button
                onClick={submitReview}
                disabled={reviewing || rating === 0}
                className="btn-primary text-sm py-2 disabled:opacity-50"
              >
                {reviewing ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
