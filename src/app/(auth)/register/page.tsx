"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const ROLES = [
  { value: "PATIENT",        label: "Patient",                  icon: "🧑‍🦱" },
  { value: "DOCTOR",         label: "Doctor",                   icon: "👨‍⚕️" },
  { value: "HOSPITAL_ADMIN", label: "Hospital Admin",           icon: "🏢" },
  { value: "LAB_STORE",      label: "Lab / Diagnostics",        icon: "🧪" },
];

export default function RegisterPage() {
  const [form, setForm]   = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "PATIENT" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [done, setDone]     = useState(false);
  const router = useRouter();

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function register() {
    if (!form.name || !form.email || !form.password) {
      setError("Name, email and password are required"); return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters"); return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match"); return;
    }
    setLoading(true); setError("");

    const res = await fetch("/api/auth/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        name:     form.name,
        email:    form.email,
        phone:    form.phone || undefined,
        password: form.password,
        role:     form.role,
      }),
    });

    if (res.ok) { setDone(true); }
    else { const d = await res.json(); setError(d.error ?? "Registration failed"); }
    setLoading(false);
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Created!</h2>
        <p className="text-slate-500 mb-6">Sign in with your email/phone and password.</p>
        <button onClick={() => router.push("/login")} className="btn-primary w-full py-3">
          Sign In →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.jpg" alt="Seevak Care" width={80} height={80} className="mx-auto rounded-2xl object-contain" />
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Create Account</h1>
          <p className="text-green-600 text-xs font-medium mt-0.5">Seeva Hamari, Suraksha Apki</p>
          <p className="text-slate-500 text-sm mt-1">Join Seevak Care</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
        <input type="text" placeholder="Rahul Verma" value={form.name} onChange={set("name")} className="input mb-3" />

        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
        <input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} className="input mb-3" />

        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number (optional)</label>
        <input type="tel" placeholder="+919876543210" value={form.phone} onChange={set("phone")} className="input mb-3" />

        <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
        <div className="relative mb-3">
          <input
            type={showPw ? "text" : "password"}
            placeholder="Min 6 characters"
            value={form.password}
            onChange={set("password")}
            className="input pr-12"
          />
          <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-2.5 text-slate-400 text-sm">
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
        <input
          type="password"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          className="input mb-4"
        />

        <label className="block text-sm font-medium text-slate-700 mb-2">I am a…</label>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, role: r.value }))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                form.role === r.value
                  ? "border-sky-500 bg-sky-50 text-sky-700"
                  : "border-slate-200 text-slate-600 hover:border-sky-300"
              }`}
            >
              <span>{r.icon}</span> {r.label}
            </button>
          ))}
        </div>

        <button onClick={register} disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Creating account..." : "Create Account →"}
        </button>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-sky-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
