"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { StatsGrid } from "@/components/StatsGrid";
import { formatINR } from "@/lib/utils/pricing";

const ORDER_STATUS_BADGES: Record<string, string> = {
  PENDING_APPROVAL: "badge bg-yellow-50 text-yellow-700",
  PAYMENT_PENDING:  "badge bg-orange-50 text-orange-700",
  PAID:             "badge-paid",
  DISPATCHED:       "badge bg-indigo-50 text-indigo-700",
  DELIVERED:        "badge-accepted",
  CANCELLED:        "badge bg-slate-100 text-slate-500",
};

export default function SystemAdminDashboard() {
  const router = useRouter();
  const [user, setUser]       = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders]   = useState<any[]>([]);
  const [tab, setTab]         = useState("overview");
  const [tracking, setTracking] = useState<Record<string, { trackingNumber: string; estimatedDelivery: string }>>({});
  const [deliveryOtp, setDeliveryOtp] = useState<Record<string, string>>({});
  const [otpError, setOtpError]       = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) { router.push("/login"); return null; }
      return r.json();
    }).then(u => { if (u) setUser(u); });

    fetch("/api/admin/analytics").then(r => r.json()).then(setAnalytics);
    fetch("/api/medicine-orders").then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : []));
  }, [router]);

  async function approveOrder(id: string) {
    await fetch(`/api/medicine-orders/${id}/approve`, { method: "POST" });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "PAYMENT_PENDING" } : o));
  }

  async function updateTracking(id: string, status: string) {
    const t = tracking[id];
    await fetch(`/api/medicine-orders/${id}/tracking`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, trackingNumber: t?.trackingNumber, estimatedDelivery: t?.estimatedDelivery }),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, trackingNumber: t?.trackingNumber, estimatedDelivery: t?.estimatedDelivery } : o));
  }

  async function confirmDelivery(id: string) {
    const otp = deliveryOtp[id];
    if (!otp || otp.length !== 6) {
      setOtpError(e => ({ ...e, [id]: "Enter the 6-digit OTP from the patient" })); return;
    }
    setOtpError(e => ({ ...e, [id]: "" }));
    const res = await fetch(`/api/medicine-orders/${id}/verify-otp`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });
    if (res.ok) {
      // Mark as DELIVERED after OTP verified
      await updateTracking(id, "DELIVERED");
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "DELIVERED", otpVerified: true } : o));
    } else {
      const d = await res.json();
      setOtpError(e => ({ ...e, [id]: d.error ?? "Invalid OTP" }));
    }
  }

  const pendingApproval = orders.filter(o => o.status === "PENDING_APPROVAL");
  const paid            = orders.filter(o => o.status === "PAID");
  const dispatched      = orders.filter(o => o.status === "DISPATCHED");

  const NAV = [
    { id: "overview",   label: "Overview",                                           icon: "📊" },
    { id: "approvals",  label: `Approvals (${pendingApproval.length})`,              icon: "✅" },
    { id: "dispatch",   label: `Dispatch (${paid.length + dispatched.length})`,      icon: "🚚" },
    { id: "all-orders", label: "All Orders",                                         icon: "📦" },
  ];

  const stats = analytics ? [
    { label: "Total Patients",  value: analytics.totals.patients,     icon: "👤", color: "bg-blue-50 text-blue-700"    },
    { label: "Total Revenue",   value: formatINR(analytics.totals.revenue), icon: "💰", color: "bg-green-50 text-green-700" },
    { label: "Appointments",    value: analytics.totals.appointments, icon: "📅", color: "bg-purple-50 text-purple-700" },
    { label: "Pending Orders",  value: analytics.pending.orders,      icon: "⏳", color: "bg-yellow-50 text-yellow-700" },
  ] : [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role={user?.role} userName={user?.name} />
      <div className="flex flex-1">
        <aside className="w-56 shrink-0 bg-white border-r border-slate-100 min-h-screen p-4 hidden md:block">
          <div className="flex items-center gap-2 px-2 py-3 mb-4">
            <span className="text-xl">🛡️</span>
            <span className="text-sm font-semibold text-slate-700">Admin Portal</span>
          </div>
          <nav className="space-y-1">
            {NAV.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === item.id ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-50"
                }`}>
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">System Admin</h1>

          {tab === "overview" && analytics && (
            <>
              <StatsGrid stats={stats} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="card">
                  <h3 className="font-semibold text-slate-700 mb-3">Appointments by Status</h3>
                  {analytics.appointmentsByStatus?.map((s: any) => (
                    <div key={s.status} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0 text-sm">
                      <span className="text-slate-600">{s.status}</span>
                      <span className="font-semibold text-sky-700">{s.count}</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h3 className="font-semibold text-slate-700 mb-3">Orders by Status</h3>
                  {analytics.ordersByStatus?.map((s: any) => (
                    <div key={s.status} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0 text-sm">
                      <span className="text-slate-600">{s.status.replace("_", " ")}</span>
                      <span className="font-semibold text-sky-700">{s.count}</span>
                    </div>
                  ))}
                </div>
                {analytics.revenueByMonth?.length > 0 && (
                  <div className="card md:col-span-2">
                    <h3 className="font-semibold text-slate-700 mb-3">Revenue (Last 6 Months)</h3>
                    {analytics.revenueByMonth.map((r: any) => (
                      <div key={r.month} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0 text-sm">
                        <span className="text-slate-600">{r.month}</span>
                        <span className="font-semibold text-green-700">{formatINR(r.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "approvals" && (
            <div className="grid gap-3">
              <p className="text-sm text-slate-500">{pendingApproval.length} orders awaiting approval</p>
              {pendingApproval.map(o => (
                <div key={o.id} className="card flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={ORDER_STATUS_BADGES[o.status]}>{o.status.replace("_", " ")}</span>
                      <span className="text-xs text-slate-400">{new Date(o.createdAt).toDateString()}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{o.patient?.user?.name}</p>
                    <p className="text-sm text-slate-500">{o.items?.length} items · {formatINR(Number(o.totalAmount))}</p>
                    <p className="text-xs text-slate-400">📦 {o.deliveryAddress}, {o.deliveryCity}</p>
                    <div className="text-xs text-slate-400 mt-1">
                      GST: {formatINR(Number(o.gstAmount))} · Delivery: {formatINR(Number(o.deliveryCharge))}
                    </div>
                  </div>
                  <button onClick={() => approveOrder(o.id)} className="btn-primary whitespace-nowrap">Approve</button>
                </div>
              ))}
              {pendingApproval.length === 0 && <p className="text-slate-400 text-sm">No orders pending approval. 🎉</p>}
            </div>
          )}

          {tab === "dispatch" && (
            <div className="grid gap-4">
              {/* Paid orders — ready to dispatch */}
              {paid.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-slate-600">Ready to Dispatch ({paid.length})</p>
                  {paid.map(o => (
                    <div key={o.id} className="card">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={ORDER_STATUS_BADGES[o.status]}>{o.status.replace(/_/g, " ")}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{o.patient?.user?.name}</p>
                      <p className="text-sm text-slate-500">{formatINR(Number(o.totalAmount))} · {o.items?.length} items</p>
                      <p className="text-xs text-slate-400 mb-3">📦 {o.deliveryAddress}, {o.deliveryCity} — {o.deliveryPincode}</p>
                      <div className="flex gap-2 flex-wrap">
                        <input placeholder="Tracking number"
                          value={tracking[o.id]?.trackingNumber ?? ""}
                          onChange={e => setTracking(t => ({ ...t, [o.id]: { ...t[o.id], trackingNumber: e.target.value } }))}
                          className="input w-40 text-sm"
                        />
                        <input type="date"
                          value={tracking[o.id]?.estimatedDelivery ?? ""}
                          onChange={e => setTracking(t => ({ ...t, [o.id]: { ...t[o.id], estimatedDelivery: e.target.value } }))}
                          className="input w-36 text-sm"
                        />
                        <button onClick={() => updateTracking(o.id, "DISPATCHED")} className="btn-primary text-xs">🚚 Dispatch</button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Dispatched orders — confirm delivery via OTP */}
              {dispatched.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-slate-600 mt-2">Out for Delivery — Confirm OTP ({dispatched.length})</p>
                  {dispatched.map(o => (
                    <div key={o.id} className="card border-indigo-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={ORDER_STATUS_BADGES[o.status]}>{o.status.replace(/_/g, " ")}</span>
                        <span className="text-xs text-slate-400">{o.patient?.user?.name}</span>
                      </div>
                      <p className="text-sm text-slate-500 mb-1">{formatINR(Number(o.totalAmount))} · {o.items?.length} items</p>
                      <p className="text-xs text-slate-400 mb-3">📦 {o.deliveryAddress}, {o.deliveryCity} — {o.deliveryPincode}</p>
                      {o.trackingNumber && <p className="text-xs text-sky-600 mb-3">🚚 {o.trackingNumber}</p>}

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-2">Enter OTP shown to patient in their app</p>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP"
                            value={deliveryOtp[o.id] ?? ""}
                            onChange={e => setDeliveryOtp(v => ({ ...v, [o.id]: e.target.value.replace(/\D/g, "") }))}
                            className="input w-36 text-center font-bold tracking-widest"
                          />
                          <button
                            onClick={() => confirmDelivery(o.id)}
                            disabled={(deliveryOtp[o.id] ?? "").length !== 6}
                            className="btn-primary text-xs whitespace-nowrap"
                          >
                            ✅ Confirm Delivered
                          </button>
                        </div>
                        {otpError[o.id] && <p className="text-xs text-red-500 mt-1">{otpError[o.id]}</p>}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {paid.length === 0 && dispatched.length === 0 && (
                <p className="text-slate-400 text-sm">No orders in dispatch queue.</p>
              )}
            </div>
          )}

          {tab === "all-orders" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="pb-2 pr-4">Patient</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2">Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 pr-4">{o.patient?.user?.name}</td>
                      <td className="py-2 pr-4 font-medium text-sky-700">{formatINR(Number(o.totalAmount))}</td>
                      <td className="py-2 pr-4"><span className={ORDER_STATUS_BADGES[o.status]}>{o.status.replace("_", " ")}</span></td>
                      <td className="py-2 pr-4 text-slate-400">{new Date(o.createdAt).toDateString()}</td>
                      <td className="py-2 text-slate-400">{o.trackingNumber ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <p className="text-slate-400 text-sm py-4">No orders yet.</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
