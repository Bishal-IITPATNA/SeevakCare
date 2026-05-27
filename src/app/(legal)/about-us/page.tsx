import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us — Seevak Care",
  description: "Learn about Seevak Care, operated by RADIUS CARE WELL INDIA PRIVATE LIMITED.",
};

const SERVICES = [
  { icon: "👨‍⚕️", title: "Doctor Consultations", desc: "Book verified doctors by specialization. OTP-confirmed appointments with digital prescriptions." },
  { icon: "🏥", title: "Hospital Services",     desc: "Access hospital departments, check services and charges, schedule visits seamlessly." },
  { icon: "🧪", title: "Lab Diagnostics",        desc: "Book diagnostic tests with home sample collection and online reports." },
  { icon: "💊", title: "Medicine Delivery",      desc: "Order prescribed medicines with GST-inclusive pricing and doorstep delivery." },
  { icon: "📋", title: "Digital Prescriptions",  desc: "Doctors issue verifiable digital prescriptions downloadable as PDF." },
  { icon: "📊", title: "Health Dashboard",       desc: "Unified view of appointments, orders, lab reports, and payment history." },
];

export default function AboutUsPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="card bg-gradient-to-br from-sky-50 to-white border-sky-100">
        <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          Digital Healthcare · Made for India
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">About Seevak Care</h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Seevak Care is a comprehensive digital healthcare platform that connects patients with
          doctors, hospitals, and diagnostic labs — all in one seamless experience.
        </p>
      </div>

      {/* Legal entity notice */}
      <div className="card border-amber-100 bg-amber-50">
        <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">Legal Entity</p>
        <p className="text-slate-800 font-bold text-lg">RADIUS CARE WELL INDIA PRIVATE LIMITED</p>
        <p className="text-slate-500 text-sm mt-1">
          Seevak Care is the consumer brand of{" "}
          <span className="font-semibold text-slate-700">Radius Care Well India Private Limited</span>,
          a company incorporated under the Companies Act, 2013 in the state of Bihar, India.
        </p>
      </div>

      {/* Mission */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-3">Our Mission</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Our mission is to make quality healthcare accessible, affordable, and transparent for
          every Indian — regardless of location. We believe technology can bridge the gap between
          patients and healthcare providers, reducing friction at every step of the care journey.
        </p>
      </section>

      {/* Tagline */}
      <div className="bg-sky-600 rounded-2xl px-6 py-5 text-white text-center">
        <p className="text-2xl font-bold mb-1">सेवा हमारी, सुरक्षा आपकी</p>
        <p className="text-sky-100 text-sm">Our Service, Your Protection</p>
      </div>

      {/* Services */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-5">What We Offer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SERVICES.map((s) => (
            <div key={s.title} className="card flex gap-3">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{s.title}</h3>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Registered details */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Company Details</h2>
        <div className="card divide-y divide-slate-100">
          {[
            { label: "Legal Name",          value: "RADIUS CARE WELL INDIA PRIVATE LIMITED" },
            { label: "Brand / Trading Name", value: "Seevak Care" },
            { label: "Registered Address",   value: "1448, Chunabhatti, Naka N8 Ward No 14, Darbhanga, Dhoi, Darbhanga-846009, Bihar, India" },
            { label: "State of Incorporation", value: "Bihar, India" },
            { label: "Contact Email",        value: "seevakcare@gmail.com" },
            { label: "Contact Phone",        value: "+91 9771365160" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 first:pt-0 last:pb-0">
              <span className="text-slate-500 text-xs font-medium sm:w-44 shrink-0">{label}</span>
              <span className="text-slate-800 text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center space-y-3">
        <p className="text-slate-500 text-sm">Have questions? We&apos;re here to help.</p>
        <div className="flex justify-center gap-3">
          <Link href="/contact-us" className="btn-primary">Contact Us</Link>
          <Link href="/register"   className="btn-secondary">Get Started</Link>
        </div>
      </div>
    </div>
  );
}
