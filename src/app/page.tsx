import Link from "next/link";
import Image from "next/image";

const features = [
  { icon: "👨‍⚕️", title: "Book a Doctor",      desc: "Search verified doctors by specialization and city. Book slots online."    },
  { icon: "🏢", title: "Hospital Visits",     desc: "Find hospital departments, check bed availability, and schedule visits."   },
  { icon: "🧪", title: "Lab Tests",           desc: "Book diagnostic tests with home sample collection option."                  },
  { icon: "💊", title: "Medicine Delivery",   desc: "Order prescribed medicines with GST pricing and doorstep delivery."        },
  { icon: "📋", title: "Digital Prescriptions", desc: "Doctors issue digital prescriptions; download as PDF anytime."           },
  { icon: "📊", title: "Health Dashboard",    desc: "Track all appointments, orders, and lab reports in one place."             },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Nav */}
      <nav className="border-b border-sky-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="Seevak Care" width={44} height={44} className="rounded-xl object-contain" />
            <div>
              <span className="text-xl font-bold text-sky-700">Seevak Care</span>
              <p className="text-xs text-green-600 font-medium leading-none">Seeva Hamari, Suraksha Apki</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"    className="btn-secondary">Login</Link>
            <Link href="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-sky-200">
          <span>🇮🇳</span> Made for India — Razorpay · OTP Auth · GST Compliant
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
          Your Complete<br />
          <span className="text-sky-600">Digital Healthcare</span> Platform
        </h1>
        <p className="text-green-600 font-semibold text-lg mb-3 tracking-wide">Seeva Hamari, Suraksha Apki</p>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          Seevak Care connects patients, doctors, hospitals, and diagnostic labs — all in one seamless platform.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">
            Start for Free →
          </Link>
          <Link href="/login" className="btn-secondary px-8 py-3 text-base">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-center text-3xl font-bold text-slate-800 mb-10">Everything you need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-sky-600 text-white py-16 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Register",          desc: "Sign up with your email. OTP-based, no passwords needed." },
              { step: "2", title: "Book & Pay",         desc: "Choose a doctor, lab, or hospital. Pay securely via Razorpay." },
              { step: "3", title: "Track & Download",  desc: "Track orders, download prescriptions & lab reports as PDFs." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white text-sky-600 flex items-center justify-center text-xl font-bold mb-4">{s.step}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sky-100 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Brand */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Image src="/logo.jpg" alt="Seevak Care" width={36} height={36} className="rounded-lg object-contain" />
                <div>
                  <span className="font-bold text-sky-700">Seevak Care</span>
                  <p className="text-xs text-green-600 font-medium leading-none">Seeva Hamari, Suraksha Apki</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">RADIUS CARE WELL INDIA PRIVATE LIMITED</p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                1448, Chunabhatti, Naka N8 Ward No 14,<br />Darbhanga-846009, Bihar, India
              </p>
            </div>

            {/* Policy links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2">
              {[
                { href: "/about-us",             label: "About Us" },
                { href: "/contact-us",           label: "Contact Us" },
                { href: "/privacy-policy",       label: "Privacy Policy" },
                { href: "/terms-and-conditions", label: "Terms & Conditions" },
                { href: "/refund-policy",        label: "Refund Policy" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="text-sm text-slate-600 hover:text-sky-700 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Contact */}
            <div className="space-y-1 text-sm">
              <p className="font-medium text-slate-700 text-xs">Support</p>
              <a href="mailto:seevakcare@gmail.com" className="block text-sky-600 hover:underline text-sm">seevakcare@gmail.com</a>
              <a href="tel:+919771365160"           className="block text-sky-600 hover:underline text-sm">+91 9771365160</a>
              <p className="text-xs text-slate-400">Mon–Sat, 9 AM – 6 PM IST</p>
            </div>
          </div>

          {/* Bottom row */}
          <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Seevak Care · Radius Care Well India Private Limited · All rights reserved</p>
            <p>Payments secured by <span className="font-semibold text-slate-500">Razorpay</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
