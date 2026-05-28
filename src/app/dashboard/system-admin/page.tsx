"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { StatsGrid } from "@/components/StatsGrid";
import { formatINR } from "@/lib/utils/pricing";
import { MobileDrawer } from "@/components/MobileDrawer";

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

  // Prescription uploads
  const [prescUploads, setPrescUploads]       = useState<any[]>([]);
  const [prescUploadsLoading, setPrescUploadsLoading] = useState(false);
  const [medicines, setMedicines]             = useState<any[]>([]);
  const [orderForms, setOrderForms]           = useState<Record<string, {
    items: { medicineId: string; quantity: number; unitPrice: number }[];
    deliveryAddress: string; deliveryCity: string; deliveryPincode: string;
  }>>({});
  const [orderCreating, setOrderCreating]     = useState<Record<string, boolean>>({});
  const [orderMsg, setOrderMsg]               = useState<Record<string, string>>({});
  const [rejectForms, setRejectForms]         = useState<Record<string, string>>({});
  const [rejectSubmitting, setRejectSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) { router.push("/login"); return null; }
      return r.json();
    }).then(u => { if (u) setUser(u); });

    fetch("/api/admin/analytics").then(r => r.json()).then(setAnalytics);
    fetch("/api/medicine-orders").then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : []));
    fetch("/api/medicines").then(r => r.json()).then(d => setMedicines(Array.isArray(d) ? d : []));
  }, [router]);

  async function fetchPrescUploads() {
    setPrescUploadsLoading(true);
    try {
      const res = await fetch("/api/prescription-uploads");
      if (res.ok) setPrescUploads(await res.json());
    } finally {
      setPrescUploadsLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "prescriptions") fetchPrescUploads();
  }, [tab]);

  function getOrderForm(id: string) {
    return orderForms[id] ?? { items: [], deliveryAddress: "", deliveryCity: "", deliveryPincode: "" };
  }

  function addMedicineItem(uploadId: string) {
    setOrderForms(f => {
      const form = f[uploadId] ?? { items: [], deliveryAddress: "", deliveryCity: "", deliveryPincode: "" };
      return { ...f, [uploadId]: { ...form, items: [...form.items, { medicineId: "", quantity: 1, unitPrice: 0 }] } };
    });
  }

  function updateItem(uploadId: string, idx: number, field: string, value: any) {
    setOrderForms(f => {
      const form = { ...f[uploadId] };
      const items = [...form.items];
      if (field === "medicineId") {
        const med = medicines.find((m: any) => m.id === value);
        items[idx] = { ...items[idx], medicineId: value, unitPrice: med ? Number(med.price) : 0 };
      } else {
        items[idx] = { ...items[idx], [field]: value };
      }
      return { ...f, [uploadId]: { ...form, items } };
    });
  }

  function removeItem(uploadId: string, idx: number) {
    setOrderForms(f => {
      const form = { ...f[uploadId] };
      const items = form.items.filter((_: any, i: number) => i !== idx);
      return { ...f, [uploadId]: { ...form, items } };
    });
  }

  async function createOrder(uploadId: string) {
    if (orderCreating[uploadId]) return;
    const form = getOrderForm(uploadId);
    if (!form.items.length || !form.deliveryAddress || !form.deliveryCity || !form.deliveryPincode) {
      setOrderMsg(m => ({ ...m, [uploadId]: "Please fill all delivery fields and add at least one medicine." }));
      return;
    }
    setOrderCreating(c => ({ ...c, [uploadId]: true }));
    setOrderMsg(m => ({ ...m, [uploadId]: "" }));
    try {
      const res = await fetch(`/api/prescription-uploads/${uploadId}/create-order`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setOrderMsg(m => ({ ...m, [uploadId]: data.error ?? "Failed" })); return; }
      setOrderMsg(m => ({ ...m, [uploadId]: `Order created! Delivery OTP: ${data.deliveryOTP}` }));
      fetchPrescUploads();
    } finally {
      setOrderCreating(c => ({ ...c, [uploadId]: false }));
    }
  }

  async function rejectUpload(uploadId: string) {
    if (rejectSubmitting[uploadId]) return;
    setRejectSubmitting(r => ({ ...r, [uploadId]: true }));
    try {
      await fetch(`/api/prescription-uploads/${uploadId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: rejectForms[uploadId] ?? "Not valid" }),
      });
      fetchPrescUploads();
    } finally {
      setRejectSubmitting(r => ({ ...r, [uploadId]: false }));
    }
  }

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

  const pendingPrescriptions = prescUploads.filter(u => u.status === "PENDING");

  const NAV = [
    { id: "overview",       label: "Overview",                                           icon: "📊" },
    { id: "approvals",      label: `Approvals (${pendingApproval.length})`,              icon: "✅" },
    { id: "dispatch",       label: `Dispatch (${paid.length + dispatched.length})`,      icon: "🚚" },
    { id: "all-orders",     label: "All Orders",                                         icon: "📦" },
    { id: "prescriptions",  label: `Prescriptions${pendingPrescriptions.length ? ` (${pendingPrescriptions.length})` : ""}`, icon: "📄" },
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
        {/* Desktop sidebar */}
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

        {/* Mobile drawer */}
        <MobileDrawer>
          {(close) => (
            <aside className="w-64 bg-white border-r border-slate-100 min-h-screen p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛡️</span>
                  <span className="text-sm font-semibold text-slate-700">Admin Portal</span>
                </div>
                <button onClick={close} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
              </div>
              <nav className="space-y-1">
                {NAV.map(item => (
                  <button key={item.id} onClick={() => { setTab(item.id); close(); }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tab === item.id ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-50"
                    }`}>
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}
              </nav>
            </aside>
          )}
        </MobileDrawer>

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
            <div className="grid gap-4">
              <p className="text-sm text-slate-500">{pendingApproval.length} orders awaiting approval</p>
              {pendingApproval.map(o => (
                <div key={o.id} className="card">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={ORDER_STATUS_BADGES[o.status]}>{o.status.replace("_", " ")}</span>
                        {o.payment?.razorpayOrderId?.startsWith("COD_") && (
                          <span className="badge bg-amber-100 text-amber-700">💵 COD</span>
                        )}
                        <span className="text-xs text-slate-400">{new Date(o.createdAt).toDateString()}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{o.patient?.user?.name}</p>
                      <p className="text-xs text-slate-400">{o.patient?.user?.phone} · {o.patient?.user?.email}</p>
                      <p className="text-xs text-slate-400 mt-1">📦 {o.deliveryAddress}, {o.deliveryCity} — {o.deliveryPincode}</p>
                    </div>
                    <button onClick={() => approveOrder(o.id)} className="btn-primary whitespace-nowrap self-start">
                      ✅ Approve
                    </button>
                  </div>

                  {/* Medicine items table */}
                  {o.items?.length > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-100 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-3 py-2 text-slate-500 font-medium">Medicine</th>
                            <th className="text-center px-3 py-2 text-slate-500 font-medium">Qty</th>
                            <th className="text-right px-3 py-2 text-slate-500 font-medium">Unit Price</th>
                            <th className="text-right px-3 py-2 text-slate-500 font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((item: any) => (
                            <tr key={item.id} className="border-t border-slate-50">
                              <td className="px-3 py-2 text-slate-700 font-medium">{item.medicine?.name ?? "—"}</td>
                              <td className="px-3 py-2 text-center text-slate-600">×{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-slate-500">{formatINR(Number(item.unitPrice))}</td>
                              <td className="px-3 py-2 text-right text-slate-700 font-medium">{formatINR(Number(item.unitPrice) * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Price summary */}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span>Subtotal: <strong className="text-slate-700">{formatINR(Number(o.totalAmount) - Number(o.gstAmount) - Number(o.deliveryCharge))}</strong></span>
                    <span>GST: <strong className="text-slate-700">{formatINR(Number(o.gstAmount))}</strong></span>
                    <span>Delivery: <strong className="text-slate-700">{formatINR(Number(o.deliveryCharge))}</strong></span>
                    <span className="ml-auto text-sm font-bold text-sky-700">Total: {formatINR(Number(o.totalAmount))}</span>
                  </div>
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
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={ORDER_STATUS_BADGES[o.status]}>{o.status.replace(/_/g, " ")}</span>
                        {o.payment?.razorpayOrderId?.startsWith("COD_") && (
                          <span className="badge bg-amber-100 text-amber-700">💵 Cash on Delivery</span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800">{o.patient?.user?.name}</p>
                      <p className="text-xs text-slate-400">{o.patient?.user?.phone}</p>
                      <p className="text-xs text-slate-400 mb-2">📦 {o.deliveryAddress}, {o.deliveryCity} — {o.deliveryPincode}</p>

                      {/* Medicine items */}
                      {o.items?.length > 0 && (
                        <div className="mb-3 rounded-lg border border-slate-100 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="text-left px-3 py-1.5 text-slate-500 font-medium">Medicine</th>
                                <th className="text-center px-3 py-1.5 text-slate-500 font-medium">Qty</th>
                                <th className="text-right px-3 py-1.5 text-slate-500 font-medium">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.items.map((item: any) => (
                                <tr key={item.id} className="border-t border-slate-50">
                                  <td className="px-3 py-1.5 text-slate-700 font-medium">{item.medicine?.name ?? "—"}</td>
                                  <td className="px-3 py-1.5 text-center text-slate-600">×{item.quantity}</td>
                                  <td className="px-3 py-1.5 text-right text-slate-700">{formatINR(Number(item.unitPrice) * item.quantity)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <p className="text-sm font-semibold text-sky-700 mb-3">Total: {formatINR(Number(o.totalAmount))}</p>
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

          {tab === "prescriptions" && (
            <div className="space-y-4">
              {prescUploadsLoading && <p className="text-sm text-slate-400">Loading…</p>}
              {!prescUploadsLoading && prescUploads.length === 0 && (
                <p className="text-sm text-slate-400">No prescription uploads yet.</p>
              )}
              {prescUploads.map(u => {
                const form = getOrderForm(u.id);
                const isOrdered  = u.status === "ORDERED";
                const isRejected = u.status === "REJECTED";
                return (
                  <div key={u.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-800">{u.patient?.user?.name}</p>
                        <p className="text-xs text-slate-400">{u.patient?.user?.email} · {u.patient?.user?.phone}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Uploaded {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.status === "PENDING"  ? "bg-yellow-100 text-yellow-700" :
                        u.status === "ORDERED"  ? "bg-green-100 text-green-700"  :
                        "bg-red-100 text-red-700"
                      }`}>
                        {u.status === "PENDING" ? "Pending Review" : u.status === "ORDERED" ? "Order Created" : "Rejected"}
                      </span>
                    </div>

                    {/* File + notes */}
                    <div className="flex gap-4 flex-wrap">
                      <a href={u.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:underline bg-sky-50 px-3 py-1.5 rounded-lg">
                        📄 View Prescription
                      </a>
                      {u.notes && (
                        <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 flex-1">{u.notes}</p>
                      )}
                    </div>

                    {/* Existing orders */}
                    {u.medicineOrders?.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3 text-xs text-green-700">
                        Order created: {formatINR(Number(u.medicineOrders[0].totalAmount))} — {u.medicineOrders[0].status}
                      </div>
                    )}

                    {/* Admin action: create order */}
                    {!isOrdered && !isRejected && (
                      <div className="border border-slate-100 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Create Medicine Order</p>

                        {/* Medicine items */}
                        <div className="space-y-2">
                          {form.items.map((item, idx) => (
                            <div key={idx} className="flex gap-2 flex-wrap items-center">
                              <select
                                value={item.medicineId}
                                onChange={e => updateItem(u.id, idx, "medicineId", e.target.value)}
                                className="input flex-1 text-sm min-w-0"
                              >
                                <option value="">Select medicine…</option>
                                {medicines.map((m: any) => (
                                  <option key={m.id} value={m.id}>{m.name} (₹{Number(m.price).toFixed(2)}/{m.unit})</option>
                                ))}
                              </select>
                              <input
                                type="number" min={1} value={item.quantity}
                                onChange={e => updateItem(u.id, idx, "quantity", Number(e.target.value))}
                                className="input w-20 text-sm text-center"
                                placeholder="Qty"
                              />
                              <span className="text-xs text-slate-500 w-20">₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
                              <button onClick={() => removeItem(u.id, idx)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                            </div>
                          ))}
                          <button onClick={() => addMedicineItem(u.id)} className="text-sm text-sky-600 hover:underline">+ Add medicine</button>
                        </div>

                        {/* Delivery details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input placeholder="Delivery address" value={form.deliveryAddress}
                            onChange={e => setOrderForms(f => ({ ...f, [u.id]: { ...f[u.id] ?? form, deliveryAddress: e.target.value } }))}
                            className="input text-sm col-span-1 sm:col-span-1" />
                          <input placeholder="City" value={form.deliveryCity}
                            onChange={e => setOrderForms(f => ({ ...f, [u.id]: { ...f[u.id] ?? form, deliveryCity: e.target.value } }))}
                            className="input text-sm" />
                          <input placeholder="Pincode" value={form.deliveryPincode}
                            onChange={e => setOrderForms(f => ({ ...f, [u.id]: { ...f[u.id] ?? form, deliveryPincode: e.target.value } }))}
                            className="input text-sm" />
                        </div>

                        {orderMsg[u.id] && (
                          <p className={`text-xs ${orderMsg[u.id].startsWith("Order created") ? "text-green-600" : "text-red-500"}`}>
                            {orderMsg[u.id]}
                          </p>
                        )}

                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={() => createOrder(u.id)}
                            disabled={orderCreating[u.id]}
                            className="btn-primary text-sm py-2 px-4"
                          >
                            {orderCreating[u.id] ? "Creating…" : "✅ Create Order for Patient"}
                          </button>

                          {/* Reject */}
                          <div className="flex gap-2 items-center">
                            <input
                              placeholder="Reason for rejection…"
                              value={rejectForms[u.id] ?? ""}
                              onChange={e => setRejectForms(r => ({ ...r, [u.id]: e.target.value }))}
                              className="input text-sm w-48"
                            />
                            <button
                              onClick={() => rejectUpload(u.id)}
                              disabled={rejectSubmitting[u.id]}
                              className="px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                            >
                              {rejectSubmitting[u.id] ? "…" : "❌ Reject"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {isRejected && u.adminNote && (
                      <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">Rejection note: {u.adminNote}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
