import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us — Seevak Care",
  description: "Get in touch with Seevak Care. Address, phone, and email contact details.",
};

export default function ContactUsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Contact Us</h1>
        <p className="text-slate-500 text-sm">
          We&apos;re available Monday to Saturday, 9 AM – 6 PM IST. For urgent medical emergencies, call 108.
        </p>
      </div>

      {/* Contact cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone */}
        <div className="card flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-xl shrink-0">📞</div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-0.5">Phone / WhatsApp</p>
            <a href="tel:+919771365160" className="text-sky-700 font-bold text-base hover:underline">
              +91 9771365160
            </a>
            <p className="text-xs text-slate-400 mt-0.5">Mon – Sat, 9 AM – 6 PM IST</p>
          </div>
        </div>

        {/* Email */}
        <div className="card flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-xl shrink-0">✉️</div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-0.5">Email Support</p>
            <a href="mailto:seevakcare@gmail.com" className="text-sky-700 font-bold text-base hover:underline break-all">
              seevakcare@gmail.com
            </a>
            <p className="text-xs text-slate-400 mt-0.5">Reply within 1–2 business days</p>
          </div>
        </div>
      </div>

      {/* Registered address */}
      <div className="card border-slate-200">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-xl shrink-0">📍</div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Registered Office</p>
            <p className="text-slate-800 font-semibold text-sm">RADIUS CARE WELL INDIA PRIVATE LIMITED</p>
            <address className="not-italic text-slate-600 text-sm mt-1 leading-relaxed">
              1448, Chunabhatti<br />
              Naka N8 Ward No 14<br />
              Darbhanga, Dhoi<br />
              Darbhanga – 846009<br />
              Bihar, India
            </address>
          </div>
        </div>
      </div>

      {/* Support categories */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4">How can we help?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: "💳", topic: "Payment Issues",        desc: "Refunds, failed transactions, EMI queries" },
            { icon: "📅", topic: "Appointments",          desc: "Booking, cancellation, rescheduling" },
            { icon: "💊", topic: "Medicine Orders",       desc: "Order status, delivery, returns" },
            { icon: "🧪", topic: "Lab Tests",             desc: "Booking, sample collection, reports" },
            { icon: "🔒", topic: "Account & Privacy",     desc: "Login issues, data requests, account deletion" },
            { icon: "📋", topic: "Medical Records",       desc: "Prescription access, digital reports" },
          ].map((item) => (
            <div key={item.topic} className="flex items-start gap-3 bg-white rounded-xl border border-slate-100 p-3">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.topic}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-3">
          For all the above, email us at{" "}
          <a href="mailto:seevakcare@gmail.com" className="text-sky-600 underline">seevakcare@gmail.com</a>{" "}
          with your registered phone number and a brief description of your issue.
        </p>
      </section>

      {/* Grievance officer */}
      <section className="card border-sky-100 bg-sky-50">
        <h2 className="text-base font-bold text-slate-800 mb-2">Grievance Officer</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection
          Act, 2023, the contact details of the Grievance Officer are:
        </p>
        <div className="mt-3 space-y-1 text-sm">
          <p><span className="text-slate-500 font-medium">Name:</span>{" "}<span className="text-slate-800">Seevak Care Grievance Team</span></p>
          <p><span className="text-slate-500 font-medium">Company:</span>{" "}<span className="text-slate-800">Radius Care Well India Private Limited</span></p>
          <p>
            <span className="text-slate-500 font-medium">Email:</span>{" "}
            <a href="mailto:seevakcare@gmail.com" className="text-sky-600 hover:underline">seevakcare@gmail.com</a>
          </p>
          <p>
            <span className="text-slate-500 font-medium">Phone:</span>{" "}
            <a href="tel:+919771365160" className="text-sky-600 hover:underline">+91 9771365160</a>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Complaints will be acknowledged within 48 hours and resolved within 30 days.
          </p>
        </div>
      </section>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <Link href="/privacy-policy"        className="btn-secondary text-xs">Privacy Policy</Link>
        <Link href="/terms-and-conditions"  className="btn-secondary text-xs">Terms & Conditions</Link>
        <Link href="/refund-policy"         className="btn-secondary text-xs">Refund Policy</Link>
      </div>
    </div>
  );
}
