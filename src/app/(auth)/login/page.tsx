"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const router = useRouter();

  async function login() {
    if (!identifier || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");

    const res = await fetch("/api/auth/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ identifier, password }),
    });

    if (res.ok) {
      const me = await fetch("/api/auth/me").then(r => r.json());
      const routes: Record<string, string> = {
        PATIENT:        "/dashboard/patient",
        DOCTOR:         "/dashboard/doctor",
        HOSPITAL_ADMIN: "/dashboard/hospital-admin",
        LAB_STORE:      "/dashboard/lab-store",
        SYSTEM_ADMIN:   "/dashboard/system-admin",
      };
      router.push(routes[me.role] ?? "/dashboard/patient");
    } else {
      const d = await res.json();
      setError(d.error ?? "Login failed");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.jpg" alt="Seevak Care" width={80} height={80} className="mx-auto rounded-2xl object-contain" />
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Seevak Care</h1>
          <p className="text-green-600 text-xs font-medium mt-0.5">Seeva Hamari, Suraksha Apki</p>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email or Phone number
        </label>
        <input
          type="text"
          placeholder="you@example.com or +919876543210"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
          className="input mb-4"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <div className="relative mb-6">
          <input
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            className="input pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        <button
          onClick={login}
          disabled={loading || !identifier || !password}
          className="btn-primary w-full py-3"
        >
          {loading ? "Signing in..." : "Sign In →"}
        </button>

        <div className="flex items-center justify-between mt-4 text-sm">
          <Link href="/register" className="text-sky-600 hover:underline">
            Create account
          </Link>
          <Link href="/forgot-password" className="text-slate-400 hover:text-sky-600 hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
