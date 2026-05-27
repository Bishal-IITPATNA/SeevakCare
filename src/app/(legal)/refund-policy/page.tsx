import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — Seevak Care",
  description: "Seevak Care refund and cancellation policy for appointments, medicines, and lab tests.",
};

function PolicyCard({ icon, title, rows }: {
  icon: string;
  title: string;
  rows: { condition: string; refund: string; status: "full" | "partial" | "none" }[];
}) {
  const statusClasses = {
    full:    "badge bg-green-50 text-green-700",
    partial: "badge bg-yellow-50 text-yellow-700",
    none:    "badge bg-red-50 text-red-700",
  };
  const statusLabels = { full: "Full Refund", partial: "50% Refund", none: "No Refund" };

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.condition} className="py-2.5 flex items-start gap-3">
            <span className={`${statusClasses[row.status]} mt-0.5 shrink-0 whitespace-nowrap`}>
              {statusLabels[row.status]}
            </span>
            <p className="text-slate-600 text-xs leading-relaxed">{row.condition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RefundPolicyPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card bg-gradient-to-br from-sky-50 to-white border-sky-100">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Refund &amp; Cancellation Policy</h1>
        <p className="text-slate-500 text-sm">
          <strong>Effective Date:</strong> 1 January 2025 &nbsp;·&nbsp;
          <strong>Last Updated:</strong> 27 May 2026
        </p>
        <p className="text-slate-600 text-sm mt-3 leading-relaxed">
          This policy applies to all services booked and payments made on the Seevak Care platform,
          operated by <strong>Radius Care Well India Private Limited</strong>. Please read this
          policy before making any payment. By completing a payment you agree to these terms.
        </p>
      </div>

      {/* Quick summary banner */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Refund Timeline", value: "5–7 Business Days" },
          { label: "Cancellation Window", value: "24 hrs before service" },
          { label: "Dispute Resolution", value: "Within 30 days" },
        ].map((item) => (
          <div key={item.label} className="card py-4">
            <p className="text-lg font-bold text-sky-700">{item.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Per-service policies */}
      <PolicyCard
        icon="👨‍⚕️"
        title="Doctor Appointments"
        rows={[
          { condition: "Cancellation made 24 hours or more before the scheduled appointment time", refund: "Full Refund", status: "full" },
          { condition: "Cancellation made between 12 and 24 hours before the scheduled appointment time", refund: "50% Refund", status: "partial" },
          { condition: "Cancellation made less than 12 hours before the appointment, or patient no-show", refund: "No Refund", status: "none" },
          { condition: "Doctor cancels or is unavailable — cancellation initiated by the platform", refund: "Full Refund", status: "full" },
          { condition: "Appointment completed (consultation attended)", refund: "No Refund", status: "none" },
        ]}
      />

      <PolicyCard
        icon="🧪"
        title="Lab Diagnostic Tests"
        rows={[
          { condition: "Cancellation made 24 hours or more before the scheduled sample collection time", refund: "Full Refund", status: "full" },
          { condition: "Cancellation made less than 24 hours before the scheduled sample collection time", refund: "No Refund", status: "none" },
          { condition: "Lab cancels or cannot fulfil the collection — cancellation initiated by the platform", refund: "Full Refund", status: "full" },
          { condition: "Sample collected and test processed", refund: "No Refund", status: "none" },
        ]}
      />

      <PolicyCard
        icon="💊"
        title="Medicine Orders"
        rows={[
          { condition: "Order cancelled before it is dispatched by the pharmacy (status: Processing)", refund: "Full Refund", status: "full" },
          { condition: "Order cancelled after dispatch (status: Shipped or Out for Delivery)", refund: "No Refund", status: "none" },
          { condition: "Wrong or damaged medicines delivered — complaint raised within 24 hours of delivery with photographic evidence", refund: "Full Refund", status: "full" },
          { condition: "Order delivered and accepted", refund: "No Refund", status: "none" },
        ]}
      />

      <PolicyCard
        icon="🏥"
        title="Hospital Services"
        rows={[
          { condition: "Cancellation made 48 hours or more before the scheduled service date", refund: "Full Refund", status: "full" },
          { condition: "Cancellation made between 24 and 48 hours before the scheduled service date", refund: "50% Refund", status: "partial" },
          { condition: "Cancellation made less than 24 hours before the scheduled date or no-show", refund: "No Refund", status: "none" },
          { condition: "Hospital-initiated cancellation or service unavailability", refund: "Full Refund", status: "full" },
        ]}
      />

      {/* EMI section */}
      <section className="card border-orange-100 bg-orange-50 space-y-2">
        <h2 className="text-base font-bold text-slate-800">EMI (Equated Monthly Instalments)</h2>
        <div className="text-slate-600 text-sm leading-relaxed space-y-2">
          <p>For services paid via EMI plans:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Refund eligibility is determined by the applicable service cancellation policy above, applied to the <strong>total principal amount</strong>.</li>
            <li>If a refund is due, the first instalment paid is refunded. Remaining future instalments are waived.</li>
            <li>If no refund is due (e.g., service completed), all remaining instalments continue to be payable as scheduled.</li>
            <li><strong>Interest charges already incurred are non-refundable.</strong></li>
          </ul>
        </div>
      </section>

      {/* Refund process */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Refund Process</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: "1", title: "Initiate",  desc: "Cancel via your dashboard or contact support within the eligible window." },
            { step: "2", title: "Review",    desc: "We verify the cancellation against this policy within 1–2 business days." },
            { step: "3", title: "Credit",    desc: "Approved refunds are credited to your original payment method within 5–7 business days." },
          ].map((s) => (
            <div key={s.step} className="card text-center">
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">{s.step}</div>
              <p className="font-semibold text-slate-800 text-sm">{s.title}</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-slate-500 text-xs space-y-1">
          <p>Refunds are processed to the original payment instrument — credit/debit card, UPI, net banking, or wallet. We do not issue cash refunds.</p>
          <p>Bank processing times are outside our control. If a refund is not received within 10 business days of our confirmation, contact your bank first, then reach out to us.</p>
        </div>
      </section>

      {/* Non-refundable items */}
      <section className="card border-red-100 bg-red-50 space-y-2">
        <h2 className="text-base font-bold text-red-800">Non-Refundable Items</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-red-700">
          <li>Platform convenience / service fees (if applicable)</li>
          <li>EMI interest charges already incurred</li>
          <li>Delivery charges for dispatched medicine orders</li>
          <li>Completed doctor consultations or lab tests</li>
          <li>Medicines that have been dispensed and delivered</li>
        </ul>
      </section>

      {/* Disputes */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Disputes &amp; Escalations</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          If you are dissatisfied with a refund decision, you may escalate the dispute to our Grievance Officer within 30 days of the original transaction. We will investigate and provide a final resolution within 15 business days of receipt of the escalation.
        </p>
        <div className="bg-sky-50 rounded-xl border border-sky-100 p-4 space-y-1 text-sm">
          <p><strong>Grievance Officer — Radius Care Well India Private Limited</strong></p>
          <p><a href="mailto:seevakcare@gmail.com" className="text-sky-600 underline">seevakcare@gmail.com</a></p>
          <p><a href="tel:+919771365160" className="text-sky-600 underline">+91 9771365160</a></p>
          <p>1448, Chunabhatti, Naka N8 Ward No 14, Darbhanga-846009, Bihar, India</p>
        </div>
        <p className="text-slate-500 text-xs">
          You may also approach the Consumer Disputes Redressal Forum under the Consumer Protection Act, 2019
          if your grievance is not resolved to your satisfaction.
        </p>
      </section>

      {/* Footer links */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Link href="/terms-and-conditions" className="btn-secondary text-xs">Terms & Conditions</Link>
        <Link href="/privacy-policy"       className="btn-secondary text-xs">Privacy Policy</Link>
        <Link href="/contact-us"           className="btn-secondary text-xs">Contact Us</Link>
      </div>
    </div>
  );
}
