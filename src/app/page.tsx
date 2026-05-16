import Link from "next/link";

const features = [
  { icon: "👨‍⚕️", title: "Book a Doctor",      desc: "Search verified doctors by specialization and city. Book slots online."    },
  { icon: "🏥", title: "Hospital Visits",     desc: "Find hospital departments, check bed availability, and schedule visits."   },
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
            <span className="text-2xl">🏥</span>
            <span className="text-xl font-bold text-sky-700">Seevak Care</span>
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
      <footer className="border-t bg-white py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <span className="font-bold text-sky-700">Seevak Care</span>
          </div>
          <p className="text-slate-400 text-sm">
            Support: <a href="mailto:seevakcare@gmail.com" className="text-sky-600">seevakcare@gmail.com</a> ·{" "}
            <a href="tel:+919771365160" className="text-sky-600">+91 97713 65160</a>
          </p>
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} Seevak Care</p>
        </div>
      </footer>
    </div>
  );
}
