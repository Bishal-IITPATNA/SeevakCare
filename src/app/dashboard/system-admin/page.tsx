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

  // Admin bookings (appointments + lab bookings)
  const [adminAppts, setAdminAppts]           = useState<any[]>([]);
  const [adminLabs, setAdminLabs]             = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [apptActing, setApptActing]           = useState<Record<string, boolean>>({});
  const [apptMsg, setApptMsg]                 = useState<Record<string, string>>({});
  const [proposeForm, setProposeForm]         = useState<Record<string, { date: string; time: string }>>({});
  const [showPropose, setShowPropose]         = useState<Record<string, boolean>>({});

  // Admin doctor-prescriptions + bills
  const [adminPrescs, setAdminPrescs]         = useState<any[]>([]);
  const [prescsLoading, setPrescsLoading]     = useState(false);
  const [billForms, setBillForms]             = useState<Record<string, {
    items: { medicineName: string; quantity: number; unitPrice: number }[];
  }>>({});
  const [billCreating, setBillCreating]       = useState<Record<string, boolean>>({});
  const [billMsg, setBillMsg]                 = useState<Record<string, string>>({});

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
    if (tab === "bookings")      fetchAdminBookings();
    if (tab === "doctor-prescriptions") fetchAdminPrescs();
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

  async function fetchAdminBookings() {
    setBookingsLoading(true);
    try {
      const [appts, labs] = await Promise.all([
        fetch("/api/admin/appointments").then(r => r.json()),
        fetch("/api/admin/lab-bookings").then(r => r.json()),
      ]);
      setAdminAppts(Array.isArray(appts) ? appts : []);
      setAdminLabs(Array.isArray(labs)   ? labs   : []);
    } finally {
      setBookingsLoading(false);
    }
  }

  async function fetchAdminPrescs() {
    setPrescsLoading(true);
    try {
      const data = await fetch("/api/admin/prescriptions").then(r => r.json());
      const prescs = Array.isArray(data) ? data : [];
      setAdminPrescs(prescs);
      // Pre-populate bill forms from prescription medicines (for ones without a bill)
      const forms: Record<string, { items: { medicineName: string; quantity: number; unitPrice: number }[] }> = {};
      prescs.forEach((p: any) => {
        if (!p.bill && p.medicines?.length) {
          forms[p.id] = {
            items: p.medicines.map((m: any) => ({
              medicineName: m.medicineName,
              quantity:     1,
              unitPrice:    0,
            })),
          };
        }
      });
      setBillForms(prev => ({ ...forms, ...prev }));
    } finally {
      setPrescsLoading(false);
    }
  }

  async function actOnAppointment(id: string, status: string, extra?: { proposedDate?: string; proposedSlotTime?: string }) {
    setApptActing(a => ({ ...a, [id]: true }));
    setApptMsg(m => ({ ...m, [id]: "" }));
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setApptMsg(m => ({ ...m, [id]: d.error ?? "Action failed" }));
        return;
      }
      setShowPropose(s => ({ ...s, [id]: false }));
      await fetchAdminBookings();
    } finally {
      setApptActing(a => ({ ...a, [id]: false }));
    }
  }

  function getBillForm(id: string) {
    return billForms[id] ?? { items: [] };
  }

  function addBillItem(prescId: string) {
    setBillForms(f => {
      const form = f[prescId] ?? { items: [] };
      return { ...f, [prescId]: { items: [...form.items, { medicineName: "", quantity: 1, unitPrice: 0 }] } };
    });
  }

  function updateBillItem(prescId: string, idx: number, field: string, value: any) {
    setBillForms(f => {
      const form = { ...f[prescId] };
      const items = [...form.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, [prescId]: { ...form, items } };
    });
  }

  function removeBillItem(prescId: string, idx: number) {
    setBillForms(f => {
      const form = { ...f[prescId] };
      return { ...f, [prescId]: { items: form.items.filter((_: any, i: number) => i !== idx) } };
    });
  }

  async function generateBill(prescId: string) {
    if (billCreating[prescId]) return;
    const form = getBillForm(prescId);
    if (!form.items.length) {
      setBillMsg(m => ({ ...m, [prescId]: "Add at least one medicine item" })); return;
    }
    const invalid = form.items.find((i: any) => !i.medicineName || i.unitPrice <= 0 || i.quantity < 1);
    if (invalid) {
      setBillMsg(m => ({ ...m, [prescId]: "Fill all fields: medicine name, quantity (≥1), and unit price (>0)" })); return;
    }
    setBillCreating(c => ({ ...c, [prescId]: true }));
    setBillMsg(m => ({ ...m, [prescId]: "" }));
    try {
      const res = await fetch(`/api/admin/prescriptions/${prescId}/bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: form.items }),
      });
      const data = await res.json();
      if (!res.ok) { setBillMsg(m => ({ ...m, [prescId]: data.error ?? "Failed to generate bill" })); return; }
      setBillMsg(m => ({ ...m, [prescId]: `Bill generated! OTP: ${data.otpCode}` }));
      await fetchAdminPrescs();
    } finally {
      setBillCreating(c => ({ ...c, [prescId]: false }));
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

  const pendingHospitalAppts = adminAppts.filter(a => a.hospitalId && a.status === "PENDING");

  const NAV = [
    { id: "overview",              label: "Overview",                                                   icon: "📊" },
    { id: "bookings",              label: `Bookings${pendingHospitalAppts.length ? ` (${pendingHospitalAppts.length})` : ""}`, icon: "📅" },
    { id: "approvals",             label: `Orders (${pendingApproval.length})`,                         icon: "✅" },
    { id: "dispatch",              label: `Dispatch (${paid.length + dispatched.length})`,               icon: "🚚" },
    { id: "all-orders",            label: "All Orders",                                                 icon: "📦" },
    { id: "prescriptions",         label: `Rx Uploads${pendingPrescriptions.length ? ` (${pendingPrescriptions.length})` : ""}`, icon: "📄" },
    { id: "doctor-prescriptions",  label: "Rx & Bills",                                                 icon: "🧾" },
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
          {/* ── All Bookings Tab ─────────────────────────────────────── */}
          {tab === "bookings" && (
            <div className="space-y-8">
              {bookingsLoading && <p className="text-sm text-slate-400">Loading bookings…</p>}

              {/* Hospital Appointments */}
              {!bookingsLoading && (
                <section>
                  <h2 className="font-semibold text-slate-700 mb-3">
                    Hospital Appointments
                    {pendingHospitalAppts.length > 0 && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {pendingHospitalAppts.length} pending
                      </span>
                    )}
                  </h2>
                  <div className="space-y-3">
                    {adminAppts.filter(a => a.hospitalId).length === 0 && (
                      <p className="text-sm text-slate-400">No hospital appointments yet.</p>
                    )}
                    {adminAppts.filter(a => a.hospitalId).map(appt => {
                      const isPending   = appt.status === "PENDING";
                      const isAccepted  = appt.status === "ACCEPTED";
                      const propForm    = proposeForm[appt.id] ?? { date: "", time: "" };
                      const statusColor: Record<string, string> = {
                        PENDING:       "bg-yellow-50 text-yellow-700",
                        ACCEPTED:      "bg-green-50 text-green-700",
                        DECLINED:      "bg-red-50 text-red-600",
                        COMPLETED:     "bg-slate-100 text-slate-500",
                        CANCELLED:     "bg-slate-100 text-slate-400",
                        SLOT_PROPOSED: "bg-blue-50 text-blue-700",
                      };
                      return (
                        <div key={appt.id} className="card">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`badge ${statusColor[appt.status] ?? "bg-slate-100 text-slate-500"}`}>
                                  {appt.status.replace("_", " ")}
                                </span>
                                <span className="text-xs text-slate-400">{new Date(appt.appointmentDate).toDateString()} at {appt.slotTime}</span>
                              </div>
                              <p className="font-semibold text-slate-800">{appt.patient?.user?.name}</p>
                              <p className="text-xs text-slate-400">{appt.patient?.user?.phone} · {appt.patient?.user?.email}</p>
                              <p className="text-xs text-sky-700 mt-0.5">{appt.hospital?.name}{appt.department ? ` · ${appt.department.name}` : ""}</p>
                              {appt.reason && <p className="text-xs text-slate-500 mt-0.5">Reason: {appt.reason}</p>}
                              {appt.consultationFee && (
                                <p className="text-xs text-slate-500">Fee: ₹{Number(appt.consultationFee).toLocaleString("en-IN")}</p>
                              )}
                              {appt.status === "SLOT_PROPOSED" && appt.proposedDate && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Proposed: {new Date(appt.proposedDate).toDateString()} at {appt.proposedSlotTime}
                                </p>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col gap-2 shrink-0">
                              {isPending && (
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => actOnAppointment(appt.id, "ACCEPTED")}
                                    disabled={apptActing[appt.id]}
                                    className="btn-primary text-xs py-1.5 px-3"
                                  >✅ Accept</button>
                                  <button
                                    onClick={() => actOnAppointment(appt.id, "DECLINED")}
                                    disabled={apptActing[appt.id]}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                                  >❌ Decline</button>
                                  <button
                                    onClick={() => setShowPropose(s => ({ ...s, [appt.id]: !s[appt.id] }))}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium"
                                  >📅 Propose Slot</button>
                                </div>
                              )}
                              {isAccepted && (
                                <button
                                  onClick={() => actOnAppointment(appt.id, "COMPLETED")}
                                  disabled={apptActing[appt.id]}
                                  className="btn-primary text-xs py-1.5 px-3"
                                >🏁 Mark Complete</button>
                              )}
                            </div>
                          </div>

                          {/* Propose slot inline form */}
                          {showPropose[appt.id] && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 flex flex-wrap gap-3 items-end">
                              <div>
                                <p className="text-xs font-medium text-blue-700 mb-1">New Date</p>
                                <input
                                  type="date"
                                  min={new Date().toISOString().slice(0, 10)}
                                  value={propForm.date}
                                  onChange={e => setProposeForm(f => ({ ...f, [appt.id]: { ...propForm, date: e.target.value } }))}
                                  className="input text-sm w-40"
                                />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-blue-700 mb-1">New Time</p>
                                <input
                                  type="time"
                                  value={propForm.time}
                                  onChange={e => setProposeForm(f => ({ ...f, [appt.id]: { ...propForm, time: e.target.value } }))}
                                  className="input text-sm w-32"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  if (!propForm.date || !propForm.time) return;
                                  actOnAppointment(appt.id, "SLOT_PROPOSED", {
                                    proposedDate:     propForm.date,
                                    proposedSlotTime: propForm.time,
                                  });
                                }}
                                disabled={apptActing[appt.id] || !propForm.date || !propForm.time}
                                className="btn-primary text-xs py-2 px-4 self-end"
                              >Send Proposal</button>
                            </div>
                          )}

                          {apptMsg[appt.id] && (
                            <p className="text-xs text-red-500 mt-2">{apptMsg[appt.id]}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Doctor Appointments */}
              {!bookingsLoading && (
                <section>
                  <h2 className="font-semibold text-slate-700 mb-3">Doctor Appointments</h2>
                  <div className="space-y-2">
                    {adminAppts.filter(a => a.doctorId).length === 0 && (
                      <p className="text-sm text-slate-400">No doctor appointments yet.</p>
                    )}
                    {adminAppts.filter(a => a.doctorId).map(appt => {
                      const statusColor: Record<string, string> = {
                        PENDING:       "bg-yellow-50 text-yellow-700",
                        ACCEPTED:      "bg-green-50 text-green-700",
                        DECLINED:      "bg-red-50 text-red-600",
                        COMPLETED:     "bg-slate-100 text-slate-500",
                        CANCELLED:     "bg-slate-100 text-slate-400",
                        SLOT_PROPOSED: "bg-blue-50 text-blue-700",
                      };
                      return (
                        <div key={appt.id} className="card flex items-center justify-between gap-3 flex-wrap py-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`badge ${statusColor[appt.status] ?? "bg-slate-100 text-slate-500"}`}>
                                {appt.status.replace("_", " ")}
                              </span>
                              <span className="text-sm font-medium text-slate-800">{appt.patient?.user?.name}</span>
                              <span className="text-xs text-slate-400">→ Dr. {appt.doctor?.user?.name}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(appt.appointmentDate).toDateString()} at {appt.slotTime}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Lab Bookings */}
              {!bookingsLoading && (
                <section>
                  <h2 className="font-semibold text-slate-700 mb-3">Lab Bookings</h2>
                  <div className="space-y-2">
                    {adminLabs.length === 0 && (
                      <p className="text-sm text-slate-400">No lab bookings yet.</p>
                    )}
                    {adminLabs.map(lb => {
                      const statusColor: Record<string, string> = {
                        PENDING:          "bg-yellow-50 text-yellow-700",
                        CONFIRMED:        "bg-green-50 text-green-700",
                        SAMPLE_COLLECTED: "bg-blue-50 text-blue-700",
                        REPORT_UPLOADED:  "bg-purple-50 text-purple-700",
                        CANCELLED:        "bg-slate-100 text-slate-400",
                      };
                      return (
                        <div key={lb.id} className="card py-3">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`badge ${statusColor[lb.status] ?? "bg-slate-100 text-slate-500"}`}>
                              {lb.status.replace("_", " ")}
                            </span>
                            <span className="text-xs text-slate-400">{lb.collectionType === "HOME" ? "🏠 Home" : "🏥 Lab"}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-800">{lb.patient?.user?.name}</p>
                          <p className="text-xs text-slate-500">{lb.labTest?.name} · {lb.labStore?.name}</p>
                          <p className="text-xs text-slate-400">
                            Scheduled: {new Date(lb.scheduledDate).toDateString()}
                            {lb.collectionAddress && ` · ${lb.collectionAddress}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ── Doctor Prescriptions & Bill Generation ───────────────── */}
          {tab === "doctor-prescriptions" && (
            <div className="space-y-4">
              {prescsLoading && <p className="text-sm text-slate-400">Loading prescriptions…</p>}
              {!prescsLoading && adminPrescs.length === 0 && (
                <p className="text-sm text-slate-400">No doctor prescriptions yet.</p>
              )}
              {adminPrescs.map(presc => {
                const hasBill  = !!presc.bill;
                const form     = getBillForm(presc.id);
                const billSub  = form.items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice), 0);
                const billGst  = parseFloat((billSub * 0.05).toFixed(2));
                const billDel  = billSub < 500 ? 50 : parseFloat((billSub * 0.1).toFixed(2));
                const billTot  = parseFloat((billSub + billGst + billDel).toFixed(2));

                return (
                  <div key={presc.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-800">{presc.patient?.user?.name}</p>
                        <p className="text-xs text-slate-400">{presc.patient?.user?.email}</p>
                        <p className="text-xs text-sky-600 mt-0.5">Dr. {presc.doctor?.user?.name} · {new Date(presc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p className="text-sm text-slate-700 font-medium mt-1">{presc.diagnosis}</p>
                        {presc.notes && <p className="text-xs text-slate-500 italic">{presc.notes}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        hasBill ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {hasBill ? "✅ Bill Generated" : "⏳ No Bill Yet"}
                      </span>
                    </div>

                    {/* Prescribed medicines from doctor */}
                    {presc.medicines?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Prescribed Medicines</p>
                        <div className="space-y-1">
                          {presc.medicines.map((m: any) => (
                            <div key={m.id} className="text-xs text-slate-600 bg-slate-50 rounded px-3 py-1.5">
                              <span className="font-medium">{m.medicineName}</span>
                              {m.dosage && ` — ${m.dosage}`}
                              {m.frequency && ` · ${m.frequency}`}
                              {m.duration && ` for ${m.duration}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Existing bill summary */}
                    {hasBill && (
                      <div className="bg-green-50 rounded-xl border border-green-200 p-4 space-y-3">
                        <p className="text-sm font-semibold text-green-800">Bill Summary</p>
                        <div className="rounded-lg border border-green-200 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-green-100">
                              <tr>
                                <th className="text-left px-3 py-2 text-green-700 font-medium">Medicine</th>
                                <th className="text-center px-3 py-2 text-green-700 font-medium">Qty</th>
                                <th className="text-right px-3 py-2 text-green-700 font-medium">Unit Price</th>
                                <th className="text-right px-3 py-2 text-green-700 font-medium">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {presc.bill.items.map((item: any) => (
                                <tr key={item.id} className="border-t border-green-100">
                                  <td className="px-3 py-2 text-slate-700">{item.medicineName}</td>
                                  <td className="px-3 py-2 text-center text-slate-600">×{item.quantity}</td>
                                  <td className="px-3 py-2 text-right text-slate-500">₹{Number(item.unitPrice).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right text-slate-700 font-medium">₹{Number(item.totalPrice).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                          <span>Subtotal: <strong className="text-slate-700">₹{Number(presc.bill.subtotal).toFixed(2)}</strong></span>
                          <span>GST (5%): <strong className="text-slate-700">₹{Number(presc.bill.gstAmount).toFixed(2)}</strong></span>
                          <span>Delivery: <strong className="text-slate-700">₹{Number(presc.bill.deliveryCharge).toFixed(2)}</strong></span>
                          <span className="ml-auto text-sm font-bold text-sky-700">Total: ₹{Number(presc.bill.totalAmount).toFixed(2)}</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                          <p className="text-xs text-amber-700 font-medium">Delivery OTP (patient has this in their app)</p>
                          <p className="text-2xl font-bold tracking-widest text-amber-800 font-mono mt-1">{presc.bill.otpCode}</p>
                        </div>
                      </div>
                    )}

                    {/* Bill generation form */}
                    {!hasBill && (
                      <div className="border border-slate-100 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Generate Medicine Bill</p>
                        <p className="text-xs text-slate-500">Enter the quantity and price for each medicine to generate the bill with GST and delivery charges.</p>

                        {/* Bill items */}
                        <div className="space-y-2">
                          {form.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-2 flex-wrap items-center">
                              <input
                                placeholder="Medicine name"
                                value={item.medicineName}
                                onChange={e => updateBillItem(presc.id, idx, "medicineName", e.target.value)}
                                className="input flex-1 text-sm min-w-[140px]"
                              />
                              <input
                                type="number" min={1}
                                value={item.quantity}
                                onChange={e => updateBillItem(presc.id, idx, "quantity", Number(e.target.value))}
                                className="input w-20 text-sm text-center"
                                placeholder="Qty"
                              />
                              <input
                                type="number" min={0} step="0.01"
                                value={item.unitPrice}
                                onChange={e => updateBillItem(presc.id, idx, "unitPrice", parseFloat(e.target.value) || 0)}
                                className="input w-28 text-sm text-right"
                                placeholder="₹ Price"
                              />
                              <span className="text-xs text-slate-500 w-24 text-right">
                                ₹{(item.quantity * item.unitPrice).toFixed(2)}
                              </span>
                              <button onClick={() => removeBillItem(presc.id, idx)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                            </div>
                          ))}
                          <button onClick={() => addBillItem(presc.id)} className="text-sm text-sky-600 hover:underline">
                            + Add medicine
                          </button>
                        </div>

                        {/* Live cost preview */}
                        {billSub > 0 && (
                          <div className="bg-slate-50 rounded-lg px-4 py-3 flex flex-wrap gap-4 text-xs text-slate-500">
                            <span>Subtotal: <strong className="text-slate-700">₹{billSub.toFixed(2)}</strong></span>
                            <span>GST (5%): <strong className="text-slate-700">₹{billGst.toFixed(2)}</strong></span>
                            <span>Delivery: <strong className="text-slate-700">₹{billDel.toFixed(2)}</strong></span>
                            <span className="ml-auto text-sm font-bold text-sky-700">Total: ₹{billTot.toFixed(2)}</span>
                          </div>
                        )}

                        {billMsg[presc.id] && (
                          <p className={`text-xs ${billMsg[presc.id].startsWith("Bill generated") ? "text-green-600 font-medium" : "text-red-500"}`}>
                            {billMsg[presc.id]}
                          </p>
                        )}

                        <button
                          onClick={() => generateBill(presc.id)}
                          disabled={billCreating[presc.id] || !form.items.length}
                          className="btn-primary text-sm py-2 px-5"
                        >
                          {billCreating[presc.id] ? "Generating…" : "🧾 Generate Bill & Send OTP to Patient"}
                        </button>
                      </div>
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
