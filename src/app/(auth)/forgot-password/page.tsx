"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "email" | "otp" | "newpassword" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep]           = useState<Step>("email");
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const router = useRouter();

  async function sendOTP() {
    if (!email) { setError("Enter your email"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "FORGOT_PASSWORD" }),
    });
    // Always advance to OTP step (prevents email enumeration)
    setStep("otp");
    setLoading(false);
  }

  async function verifyAndReset() {
    if (otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    if (!newPassword || newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPw) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    if (res.ok) { setStep("done"); }
    else { const d = await res.json(); setError(d.error ?? "Reset failed"); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🔐</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Forgot Password</h1>
          <p className="text-slate-500 text-sm mt-1">
            {step === "email"       && "Enter your registered email"}
            {step === "otp"        && "Enter the OTP + set new password"}
            {step === "done"       && "Password reset complete"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}

        {step === "email" && (
          <>
            <label className="block text-sm font-medium text-slate-700 mb-1">Registered Email</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendOTP()}
              className="input mb-4"
            />
            <button onClick={sendOTP} disabled={loading || !email} className="btn-primary w-full py-3">
              {loading ? "Sending OTP..." : "Send OTP →"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <p className="text-sm text-slate-600 mb-4">
              A 6-digit OTP has been sent to <strong>{email}</strong>. Enter it below along with your new password.
            </p>

            <label className="block text-sm font-medium text-slate-700 mb-1">OTP Code</label>
            <input
              type="text" inputMode="numeric" placeholder="• • • • • •" maxLength={6}
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              className="input mb-4 text-center text-2xl tracking-[0.5em] font-bold"
            />

            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <div className="relative mb-3">
              <input
                type={showPw ? "text" : "password"} placeholder="Min 6 characters"
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="input pr-12"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-2.5 text-slate-400 text-sm">
                {showPw ? "Hide" : "Show"}
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input type="password" placeholder="Re-enter password"
              value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              className="input mb-4"
            />

            <button onClick={verifyAndReset} disabled={loading || otp.length !== 6 || !newPassword} className="btn-primary w-full py-3">
              {loading ? "Resetting..." : "Reset Password →"}
            </button>

            <div className="flex justify-between mt-3 text-sm">
              <button onClick={() => { setStep("email"); setOtp(""); setError(""); }} className="text-slate-400 hover:text-slate-600">
                ← Change email
              </button>
              <button onClick={sendOTP} disabled={loading} className="text-sky-600 hover:underline">
                Resend OTP
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="font-semibold text-slate-800 mb-2">Password reset successfully!</p>
            <p className="text-slate-500 text-sm mb-6">Sign in with your new password.</p>
            <button onClick={() => router.push("/login")} className="btn-primary w-full py-3">
              Go to Login →
            </button>
          </div>
        )}

        {step !== "done" && (
          <p className="text-center text-sm text-slate-500 mt-6">
            <Link href="/login" className="text-sky-600 hover:underline">← Back to Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}
