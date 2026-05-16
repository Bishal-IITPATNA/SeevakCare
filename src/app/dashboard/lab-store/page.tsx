"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { StatsGrid } from "@/components/StatsGrid";

const STATUS_OPTS = ["CONFIRMED", "SAMPLE_COLLECTED", "REPORT_UPLOADED", "CANCELLED"];

export default function LabStoreDashboard() {
  const router = useRouter();
  const [user, setUser]           = useState<any>(null);
  const [bookings, setBookings]   = useState<any[]>([]);
  const [tests, setTests]         = useState<any[]>([]);
  const [tab, setTab]             = useState("overview");
  const [reportUrls, setReportUrls] = useState<Record<string, string>>({});

  // Test form state
  const [testForm, setTestForm] = useState({
    name: "", description: "", price: "", turnaroundHours: "24", instructions: "", sampleType: "",
  });
  const [editingTest, setEditingTest] = useState<any>(null);
  const [testMsg, setTestMsg]         = useState("");

  // Profile form state
  const [profileForm, setProfileForm] = useState<any>({});
  const [profileMsg, setProfileMsg]   = useState("");

  // Change password state
  const [pwdForm, setPwdForm]   = useState({ currentPassword: "", newPassword: "" });
  const [pwdMsg, setPwdMsg]     = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) { router.push("/login"); return null; }
      return r.json();
    }).then(u => { if (u) setUser(u); });
    fetch("/api/lab-bookings").then(r => r.json()).then(d => setBookings(Array.isArray(d) ? d : []));
    fetch("/api/lab-store/tests").then(r => r.ok ? r.json() : []).then(d => setTests(Array.isArray(d) ? d : []));
    fetch("/api/lab-store/profile").then(r => r.ok ? r.json() : null).then(d => {
      if (d) {
        setProfileForm({
          name: d.name, address: d.address, city: d.city, phone: d.phone,
          homeCollection: d.homeCollection, homeCollectionCharge: d.homeCollectionCharge ?? "",
        });
      }
    });
  }, [router]);

  async function updateStatus(id: string, status: string, reportUrl?: string) {
    await fetch(`/api/lab-bookings/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(reportUrl ? { reportUrl } : {}) }),
    });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status, ...(reportUrl ? { reportUrl } : {}) } : b));
  }

  async function saveTest(e: React.FormEvent) {
    e.preventDefault();
    setTestMsg("");
    const url    = editingTest ? `/api/lab-store/tests/${editingTest.id}` : "/api/lab-store/tests";
    const method = editingTest ? "PUT" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...testForm,
        price:           Number(testForm.price),
        turnaroundHours: Number(testForm.turnaroundHours),
      }),
    });
    if (res.ok) {
      const saved = await res.json();
      if (editingTest) {
        setTests(prev => prev.map(t => t.id === saved.id ? saved : t));
      } else {
        setTests(prev => [saved, ...prev]);
      }
      setTestForm({ name: "", description: "", price: "", turnaroundHours: "24", instructions: "", sampleType: "" });
      setEditingTest(null);
      setTestMsg(editingTest ? "Test updated." : "Test added.");
    } else {
      const d = await res.json();
      setTestMsg(d.error ?? "Failed to save test.");
    }
  }

  async function deleteTest(id: string) {
    if (!confirm("Delete this test?")) return;
    const res = await fetch(`/api/lab-store/tests/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTests(prev => prev.filter(t => t.id !== id));
    } else {
      const d = await res.json();
      alert(d.error ?? "Failed to delete test.");
    }
  }

  function startEditTest(t: any) {
    setEditingTest(t);
    setTestForm({
      name: t.name, description: t.description ?? "", price: t.price.toString(),
      turnaroundHours: t.turnaroundHours.toString(), instructions: t.instructions ?? "", sampleType: t.sampleType ?? "",
    });
    setTab("tests");
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg("");
    const res = await fetch("/api/lab-store/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profileForm,
        homeCollectionCharge: profileForm.homeCollectionCharge ? Number(profileForm.homeCollectionCharge) : undefined,
      }),
    });
    if (res.ok) {
      setProfileMsg("Profile updated.");
    } else {
      const d = await res.json();
      setProfileMsg(d.error ?? "Failed to update profile.");
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg("");
    const res = await fetch("/api/auth/change-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pwdForm),
    });
    const d = await res.json();
    if (res.ok) {
      setPwdMsg("Password changed. You will be logged out shortly.");
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setPwdMsg(d.error ?? "Failed to change password.");
    }
  }

  const pending   = bookings.filter(b => b.status === "PENDING");
  const confirmed = bookings.filter(b => b.status === "CONFIRMED");
  const collected = bookings.filter(b => b.status === "SAMPLE_COLLECTED");
  const done      = bookings.filter(b => b.status === "REPORT_UPLOADED");

  const stats = [
    { label: "Pending",          value: pending.length,   icon: "⏳", color: "bg-yellow-50 text-yellow-700" },
    { label: "Confirmed",        value: confirmed.length, icon: "✅", color: "bg-green-50 text-green-700"  },
    { label: "Sample Collected", value: collected.length, icon: "🧫", color: "bg-blue-50 text-blue-700"   },
    { label: "Reports Uploaded", value: done.length,      icon: "📄", color: "bg-purple-50 text-purple-700" },
  ];

  const NAV = [
    { id: "overview",  label: "Overview",                    icon: "🏠" },
    { id: "pending",   label: `Pending (${pending.length})`, icon: "⏳" },
    { id: "active",    label: "Active Bookings",              icon: "🧫" },
    { id: "all",       label: "All Bookings",                 icon: "📋" },
    { id: "tests",     label: `Tests (${tests.length})`,     icon: "🔬" },
    { id: "profile",   label: "Profile",                     icon: "⚙️" },
  ];

  function BookingRow({ b }: { b: any }) {
    return (
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-slate-800">{b.patient?.user?.name}</p>
            <p className="text-sm text-sky-600">{b.labTest?.name}</p>
            <p className="text-sm text-slate-500">📅 {new Date(b.scheduledDate).toDateString()}</p>
            <p className="text-xs text-slate-400">
              {b.collectionType === "HOME" ? `🏠 Home: ${b.collectionAddress}` : "🏢 Visit Lab"}
            </p>
            {b.patient?.user?.phone && <p className="text-xs text-slate-400">📞 {b.patient.user.phone}</p>}
          </div>
          <span className={`badge ${
            b.status === "PENDING" ? "badge-pending" :
            b.status === "CONFIRMED" ? "badge-accepted" :
            b.status === "SAMPLE_COLLECTED" ? "bg-blue-50 text-blue-700 badge" :
            b.status === "REPORT_UPLOADED" ? "bg-emerald-50 text-emerald-700 badge" :
            "bg-slate-100 text-slate-500 badge"
          }`}>{b.status.replace("_", " ")}</span>
        </div>

        <div className="flex gap-2 flex-wrap mt-3">
          {b.status === "CONFIRMED" && (
            <button onClick={() => updateStatus(b.id, "SAMPLE_COLLECTED")} className="btn-primary text-xs">
              🧫 Mark Sample Collected
            </button>
          )}
          {b.status === "SAMPLE_COLLECTED" && (
            <div className="flex gap-2 w-full">
              <input
                placeholder="Report URL (PDF link)"
                value={reportUrls[b.id] ?? ""}
                onChange={e => setReportUrls(r => ({ ...r, [b.id]: e.target.value }))}
                className="input flex-1 text-sm"
              />
              <button
                onClick={() => updateStatus(b.id, "REPORT_UPLOADED", reportUrls[b.id])}
                disabled={!reportUrls[b.id]}
                className="btn-primary text-xs whitespace-nowrap"
              >
                📄 Upload Report
              </button>
            </div>
          )}
          {b.status === "PENDING" && (
            <button onClick={() => updateStatus(b.id, "CANCELLED")} className="btn-danger text-xs">Cancel</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role={user?.role} userName={user?.name} />
      <div className="flex flex-1">
        <aside className="w-56 shrink-0 bg-white border-r border-slate-100 min-h-screen p-4 hidden md:block">
          <div className="flex items-center gap-2 px-2 py-3 mb-4">
            <span className="text-xl">🧪</span>
            <span className="text-sm font-semibold text-slate-700">Lab Portal</span>
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

        <main className="flex-1 p-6 lg:p-8 max-w-5xl">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Lab Store Dashboard</h1>

          {tab === "overview" && (
            <>
              <StatsGrid stats={stats} />
              {pending.length > 0 && (
                <section className="mt-8">
                  <h2 className="font-semibold text-slate-700 mb-4">Bookings Awaiting Confirmation</h2>
                  <div className="grid gap-3">
                    {pending.slice(0, 5).map(b => (
                      <div key={b.id} className="card flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{b.patient?.user?.name}</p>
                          <p className="text-sm text-sky-600">{b.labTest?.name}</p>
                          <p className="text-xs text-slate-400">{new Date(b.scheduledDate).toDateString()}</p>
                        </div>
                        <button onClick={() => updateStatus(b.id, "CONFIRMED")} className="btn-success text-xs">
                          Confirm
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {tab === "pending" && (
            <div className="grid gap-3">
              {pending.map(b => (
                <div key={b.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{b.patient?.user?.name}</p>
                    <p className="text-sm text-sky-600">{b.labTest?.name}</p>
                    <p className="text-xs text-slate-400">{new Date(b.scheduledDate).toDateString()} · {b.collectionType}</p>
                  </div>
                  <button onClick={() => updateStatus(b.id, "CONFIRMED")} className="btn-success text-xs">✓ Confirm</button>
                </div>
              ))}
              {pending.length === 0 && <p className="text-slate-400 text-sm">No pending bookings.</p>}
            </div>
          )}

          {tab === "active" && (
            <div className="grid gap-3">
              {[...confirmed, ...collected].map(b => <BookingRow key={b.id} b={b} />)}
              {confirmed.length + collected.length === 0 && <p className="text-slate-400 text-sm">No active bookings.</p>}
            </div>
          )}

          {tab === "all" && (
            <div className="grid gap-3">
              {bookings.map(b => <BookingRow key={b.id} b={b} />)}
              {bookings.length === 0 && <p className="text-slate-400 text-sm">No bookings yet.</p>}
            </div>
          )}

          {tab === "tests" && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="font-semibold text-slate-700 mb-4">
                  {editingTest ? "Edit Test" : "Add New Test"}
                </h2>
                <form onSubmit={saveTest} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Test Name *</label>
                    <input required className="input" placeholder="e.g. Complete Blood Count"
                      value={testForm.name} onChange={e => setTestForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Price (₹) *</label>
                    <input required type="number" min="0" step="0.01" className="input" placeholder="299"
                      value={testForm.price} onChange={e => setTestForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Sample Type</label>
                    <input className="input" placeholder="e.g. Blood, Urine"
                      value={testForm.sampleType} onChange={e => setTestForm(f => ({ ...f, sampleType: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Turnaround (hours)</label>
                    <input type="number" min="1" className="input" placeholder="24"
                      value={testForm.turnaroundHours} onChange={e => setTestForm(f => ({ ...f, turnaroundHours: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Description</label>
                    <textarea className="input" rows={2} placeholder="Brief description of the test"
                      value={testForm.description} onChange={e => setTestForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Patient Instructions</label>
                    <textarea className="input" rows={2} placeholder="e.g. Fast for 8 hours before the test"
                      value={testForm.instructions} onChange={e => setTestForm(f => ({ ...f, instructions: e.target.value }))} />
                  </div>
                  {testMsg && (
                    <p className={`sm:col-span-2 text-sm ${testMsg.includes("ailed") ? "text-red-600" : "text-green-600"}`}>
                      {testMsg}
                    </p>
                  )}
                  <div className="sm:col-span-2 flex gap-2">
                    <button type="submit" className="btn-primary">
                      {editingTest ? "Update Test" : "Add Test"}
                    </button>
                    {editingTest && (
                      <button type="button" className="btn-secondary" onClick={() => {
                        setEditingTest(null);
                        setTestForm({ name: "", description: "", price: "", turnaroundHours: "24", instructions: "", sampleType: "" });
                        setTestMsg("");
                      }}>Cancel</button>
                    )}
                  </div>
                </form>
              </div>

              <div>
                <h2 className="font-semibold text-slate-700 mb-4">Your Tests ({tests.length})</h2>
                <div className="grid gap-3">
                  {tests.map(t => (
                    <div key={t.id} className="card flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{t.name}</p>
                        {t.description && <p className="text-sm text-slate-500">{t.description}</p>}
                        <div className="flex gap-3 mt-1 text-xs text-slate-400">
                          <span>₹{Number(t.price).toFixed(2)}</span>
                          {t.sampleType && <span>· {t.sampleType}</span>}
                          <span>· {t.turnaroundHours}h turnaround</span>
                        </div>
                        {t.instructions && <p className="text-xs text-slate-400 mt-1">ℹ️ {t.instructions}</p>}
                      </div>
                      <div className="flex gap-2 ml-3 shrink-0">
                        <button onClick={() => startEditTest(t)} className="btn-secondary text-xs">Edit</button>
                        <button onClick={() => deleteTest(t.id)} className="btn-danger text-xs">Delete</button>
                      </div>
                    </div>
                  ))}
                  {tests.length === 0 && <p className="text-slate-400 text-sm">No tests added yet.</p>}
                </div>
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div className="space-y-6 max-w-lg">
              <div className="card">
                <h2 className="font-semibold text-slate-700 mb-4">Lab Store Profile</h2>
                <form onSubmit={saveProfile} className="space-y-3">
                  <div>
                    <label className="label">Lab Name</label>
                    <input className="input" value={profileForm.name ?? ""}
                      onChange={e => setProfileForm((f: any) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" value={profileForm.phone ?? ""}
                      onChange={e => setProfileForm((f: any) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Address</label>
                    <input className="input" value={profileForm.address ?? ""}
                      onChange={e => setProfileForm((f: any) => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input className="input" value={profileForm.city ?? ""}
                      onChange={e => setProfileForm((f: any) => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="homeCollection" checked={!!profileForm.homeCollection}
                      onChange={e => setProfileForm((f: any) => ({ ...f, homeCollection: e.target.checked }))} />
                    <label htmlFor="homeCollection" className="text-sm text-slate-700">Home Collection Available</label>
                  </div>
                  {profileForm.homeCollection && (
                    <div>
                      <label className="label">Home Collection Charge (₹)</label>
                      <input type="number" min="0" className="input" value={profileForm.homeCollectionCharge ?? ""}
                        onChange={e => setProfileForm((f: any) => ({ ...f, homeCollectionCharge: e.target.value }))} />
                    </div>
                  )}
                  {profileMsg && (
                    <p className={`text-sm ${profileMsg.includes("ailed") ? "text-red-600" : "text-green-600"}`}>{profileMsg}</p>
                  )}
                  <button type="submit" className="btn-primary">Save Profile</button>
                </form>
              </div>

              <div className="card">
                <h2 className="font-semibold text-slate-700 mb-4">Change Password</h2>
                <form onSubmit={changePassword} className="space-y-3">
                  <div>
                    <label className="label">Current Password</label>
                    <input type="password" className="input" value={pwdForm.currentPassword}
                      onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <input type="password" className="input" value={pwdForm.newPassword}
                      onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} />
                  </div>
                  {pwdMsg && (
                    <p className={`text-sm ${pwdMsg.includes("ailed") || pwdMsg.includes("ncorrect") ? "text-red-600" : "text-green-600"}`}>{pwdMsg}</p>
                  )}
                  <button type="submit" className="btn-primary">Change Password</button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
