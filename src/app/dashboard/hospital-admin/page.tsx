"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { StatsGrid } from "@/components/StatsGrid";
import { MobileDrawer } from "@/components/MobileDrawer";

const APPT_BADGE: Record<string, string> = {
  PENDING:   "badge bg-yellow-50 text-yellow-700",
  ACCEPTED:  "badge bg-green-50 text-green-700",
  DECLINED:  "badge bg-red-50 text-red-600",
  COMPLETED: "badge bg-slate-100 text-slate-500",
  CANCELLED: "badge bg-slate-100 text-slate-400",
};

const NAV = [
  { id: "overview",     label: "Overview",       icon: "🏠" },
  { id: "departments",  label: "Departments",    icon: "🏢" },
  { id: "appointments", label: "Appointments",   icon: "📅" },
  { id: "info",         label: "Hospital Info",  icon: "✏️" },
  { id: "settings",     label: "Settings",       icon: "⚙️" },
];

export default function HospitalAdminDashboard() {
  const router = useRouter();
  const [user, setUser]               = useState<any>(null);
  const [hospital, setHospital]       = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tab, setTab]                 = useState("overview");
  const [msg, setMsg]                 = useState("");

  // Hospital info form
  const [infoForm, setInfoForm]       = useState<any>({});
  const [infoSaving, setInfoSaving]   = useState(false);

  // Add department
  const [showAddDept, setShowAddDept] = useState(false);
  const [deptForm, setDeptForm]       = useState({ name: "", description: "", totalBeds: "" });
  const [deptMsg, setDeptMsg]         = useState("");

  // Edit department
  const [editDept, setEditDept]       = useState<any>(null);
  const [editDeptForm, setEditDeptForm] = useState({ name: "", description: "", totalBeds: "", occupiedBeds: "" });
  const [editDeptMsg, setEditDeptMsg] = useState("");

  // Doctor search & assign
  const [doctorSearch, setDoctorSearch]   = useState<Record<string, string>>({});
  const [doctorResults, setDoctorResults] = useState<Record<string, any[]>>({});
  const [assignMsg, setAssignMsg]         = useState<Record<string, string>>({});

  // Password change
  const [pwdForm, setPwdForm]   = useState({ currentPassword: "", newPassword: "" });
  const [pwdMsg, setPwdMsg]     = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) { router.push("/login"); return null; }
      return r.json();
    }).then(u => { if (u) setUser(u); });

    loadHospital();
    fetch("/api/appointments").then(r => r.json()).then(d => setAppointments(Array.isArray(d) ? d : []));
  }, [router]);

  async function loadHospital() {
    const res = await fetch("/api/hospital");
    if (res.ok) {
      const h = await res.json();
      setHospital(h);
      setInfoForm({ name: h.name, address: h.address, city: h.city, phone: h.phone, email: h.email, website: h.website ?? "" });
    }
  }

  const departments  = hospital?.departments ?? [];
  const totalBeds    = departments.reduce((s: number, d: any) => s + d.totalBeds, 0);
  const occupiedBeds = departments.reduce((s: number, d: any) => s + d.occupiedBeds, 0);
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const pendingAppts = appointments.filter((a: any) => a.status === "PENDING").length;
  const totalDoctors = departments.reduce((s: number, d: any) => s + (d.doctors?.length ?? 0), 0);

  const stats = [
    { label: "Departments",    value: departments.length, icon: "🏢", color: "bg-blue-50 text-blue-700"    },
    { label: "Total Beds",     value: totalBeds,          icon: "🛏️", color: "bg-indigo-50 text-indigo-700" },
    { label: "Occupancy",      value: `${occupancyPct}%`, icon: "📊", color: occupancyPct > 80 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700" },
    { label: "Pending Appts",  value: pendingAppts,       icon: "⏳", color: "bg-yellow-50 text-yellow-700" },
  ];

  // ── Hospital info ──────────────────────────────────────────────────────────

  async function saveInfo() {
    setInfoSaving(true); setMsg("");
    const res = await fetch("/api/hospital", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(infoForm),
    });
    if (res.ok) { setMsg("Hospital info saved."); loadHospital(); }
    else { const d = await res.json(); setMsg(d.error ?? "Save failed"); }
    setInfoSaving(false);
  }

  // ── Departments ────────────────────────────────────────────────────────────

  async function addDepartment() {
    setDeptMsg("");
    if (!deptForm.name || !deptForm.totalBeds) { setDeptMsg("Name and total beds are required."); return; }
    const res = await fetch("/api/hospital-admin/departments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: deptForm.name, description: deptForm.description, totalBeds: Number(deptForm.totalBeds) }),
    });
    if (res.ok) { setDeptForm({ name: "", description: "", totalBeds: "" }); setShowAddDept(false); loadHospital(); }
    else { const d = await res.json(); setDeptMsg(d.error ?? "Failed to add department"); }
  }

  async function saveEditDept() {
    setEditDeptMsg("");
    const res = await fetch(`/api/hospital-admin/departments/${editDept.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:         editDeptForm.name        || undefined,
        description:  editDeptForm.description || undefined,
        totalBeds:    Number(editDeptForm.totalBeds),
        occupiedBeds: Number(editDeptForm.occupiedBeds),
      }),
    });
    if (res.ok) { setEditDept(null); loadHospital(); }
    else { const d = await res.json(); setEditDeptMsg(d.error ?? "Update failed"); }
  }

  async function deleteDepartment(id: string) {
    if (!confirm("Delete this department? This cannot be undone.")) return;
    await fetch(`/api/hospital-admin/departments/${id}`, { method: "DELETE" });
    loadHospital();
  }

  // ── Doctor assignment ──────────────────────────────────────────────────────

  async function searchDoctors(deptId: string, q: string) {
    setDoctorSearch(s => ({ ...s, [deptId]: q }));
    if (!q.trim()) { setDoctorResults(r => ({ ...r, [deptId]: [] })); return; }
    const res = await fetch(`/api/doctors/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setDoctorResults(r => ({ ...r, [deptId]: Array.isArray(data) ? data : [] }));
  }

  async function assignDoctor(deptId: string, doctorId: string, doctorName: string) {
    const res = await fetch(`/api/hospital-admin/departments/${deptId}/doctors`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId }),
    });
    if (res.ok) {
      setAssignMsg(m => ({ ...m, [deptId]: `Dr. ${doctorName} assigned.` }));
      setDoctorSearch(s => ({ ...s, [deptId]: "" }));
      setDoctorResults(r => ({ ...r, [deptId]: [] }));
      loadHospital();
    } else {
      const d = await res.json();
      setAssignMsg(m => ({ ...m, [deptId]: d.error ?? "Failed" }));
    }
  }

  async function removeDoctor(deptId: string, doctorId: string) {
    await fetch(`/api/hospital-admin/departments/${deptId}/doctors`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId }),
    });
    loadHospital();
  }

  // ── Appointments ───────────────────────────────────────────────────────────

  async function updateApptStatus(id: string, status: string) {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  // ── Password ───────────────────────────────────────────────────────────────

  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setPwdMsg("");
    const res = await fetch("/api/auth/change-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pwdForm),
    });
    const d = await res.json();
    if (res.ok) { setPwdMsg("Password changed. Redirecting to login…"); setTimeout(() => router.push("/login"), 2000); }
    else setPwdMsg(d.error ?? "Failed");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role={user?.role} userName={user?.name} />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="w-56 shrink-0 bg-white border-r border-slate-100 min-h-screen p-4 hidden md:block">
          <div className="flex items-center gap-2 px-2 py-3 mb-4">
            <Image src="/logo.jpg" alt="Seevak Care" width={32} height={32} className="rounded-lg object-contain shrink-0" />
            <span className="text-sm font-semibold text-slate-700 truncate">{hospital?.name ?? "Hospital Admin"}</span>
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
                  <Image src="/logo.jpg" alt="Seevak Care" width={28} height={28} className="rounded-lg object-contain shrink-0" />
                  <span className="text-sm font-semibold text-slate-700 truncate">{hospital?.name ?? "Hospital Admin"}</span>
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

        <main className="flex-1 p-6 lg:p-8 max-w-5xl space-y-6">

          {/* Overview */}
          {tab === "overview" && (
            <>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{hospital?.name ?? "Hospital Admin"}</h1>
                <p className="text-slate-500 text-sm">{hospital?.address}, {hospital?.city}</p>
              </div>
              <StatsGrid stats={stats} />

              {/* Department occupancy cards */}
              <section>
                <h2 className="font-semibold text-slate-700 mb-3">Department Occupancy</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {departments.map((d: any) => {
                    const pct = d.totalBeds > 0 ? Math.round((d.occupiedBeds / d.totalBeds) * 100) : 0;
                    return (
                      <div key={d.id} className="card">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-slate-800 text-sm">{d.name}</p>
                          <span className={`badge text-xs ${pct > 80 ? "bg-red-50 text-red-700" : pct > 50 ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"}`}>
                            {pct}% full
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{d.occupiedBeds}/{d.totalBeds} beds · {d.doctors?.length ?? 0} doctor{d.doctors?.length !== 1 ? "s" : ""}</p>
                        <div className="bg-slate-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${pct > 80 ? "bg-red-400" : pct > 50 ? "bg-yellow-400" : "bg-green-400"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {departments.length === 0 && <p className="text-slate-400 text-sm col-span-2">No departments yet. Add one from the Departments tab.</p>}
                </div>
              </section>
            </>
          )}

          {/* Departments */}
          {tab === "departments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
                <button onClick={() => setShowAddDept(v => !v)} className="btn-primary text-sm">
                  {showAddDept ? "Cancel" : "+ Add Department"}
                </button>
              </div>

              {/* Add department form */}
              {showAddDept && (
                <div className="card border-sky-200 bg-sky-50/40">
                  <h3 className="font-semibold text-slate-700 mb-3">New Department</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                      <input placeholder="e.g. Cardiology" value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Total Beds *</label>
                      <input type="number" min="1" value={deptForm.totalBeds} onChange={e => setDeptForm(f => ({ ...f, totalBeds: e.target.value }))} className="input" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                      <input placeholder="Brief description…" value={deptForm.description} onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))} className="input" />
                    </div>
                  </div>
                  {deptMsg && <p className="text-red-500 text-sm mb-2">{deptMsg}</p>}
                  <button onClick={addDepartment} className="btn-primary text-sm">Add Department</button>
                </div>
              )}

              {/* Edit department modal */}
              {editDept && (
                <div className="card border-amber-200 bg-amber-50/30">
                  <h3 className="font-semibold text-slate-700 mb-3">Edit — {editDept.name}</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                      <input value={editDeptForm.name} onChange={e => setEditDeptForm(f => ({ ...f, name: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                      <input value={editDeptForm.description} onChange={e => setEditDeptForm(f => ({ ...f, description: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Total Beds</label>
                      <input type="number" min="0" value={editDeptForm.totalBeds} onChange={e => setEditDeptForm(f => ({ ...f, totalBeds: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Occupied Beds</label>
                      <input type="number" min="0" value={editDeptForm.occupiedBeds} onChange={e => setEditDeptForm(f => ({ ...f, occupiedBeds: e.target.value }))} className="input" />
                    </div>
                  </div>
                  {editDeptMsg && <p className="text-red-500 text-sm mb-2">{editDeptMsg}</p>}
                  <div className="flex gap-2">
                    <button onClick={saveEditDept} className="btn-primary text-sm">Save Changes</button>
                    <button onClick={() => setEditDept(null)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </div>
              )}

              {/* Department list */}
              {departments.length === 0 && !showAddDept && (
                <p className="text-slate-400 text-sm">No departments configured.</p>
              )}

              {departments.map((d: any) => {
                const pct = d.totalBeds > 0 ? Math.round((d.occupiedBeds / d.totalBeds) * 100) : 0;
                return (
                  <div key={d.id} className="card space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{d.name}</p>
                        {d.description && <p className="text-xs text-slate-500 mt-0.5">{d.description}</p>}
                      </div>
                      <div className="flex gap-2 ml-4 shrink-0">
                        <button onClick={() => { setEditDept(d); setEditDeptForm({ name: d.name, description: d.description ?? "", totalBeds: d.totalBeds.toString(), occupiedBeds: d.occupiedBeds.toString() }); setEditDeptMsg(""); }} className="btn-secondary text-xs">
                          ✏️ Edit
                        </button>
                        <button onClick={() => deleteDepartment(d.id)} className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded-lg">
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Bed stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500">🛏️ <strong>{d.occupiedBeds}</strong>/{d.totalBeds} beds occupied</span>
                      <span className={`badge text-xs ${pct > 80 ? "bg-red-50 text-red-700" : pct > 50 ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"}`}>{pct}%</span>
                    </div>

                    {/* Doctors in this dept */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Assigned Doctors</p>
                      {d.doctors?.length === 0 && <p className="text-xs text-slate-400">No doctors assigned yet.</p>}
                      <div className="flex flex-wrap gap-2">
                        {d.doctors?.map((dd: any) => (
                          <div key={dd.doctorId} className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1 text-xs">
                            <span className="text-slate-700 font-medium">{dd.doctor?.user?.name}</span>
                            <span className="text-slate-400">{dd.doctor?.specialization}</span>
                            <button onClick={() => removeDoctor(d.id, dd.doctorId)} className="text-red-400 hover:text-red-600 ml-1">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assign doctor search */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Add Doctor</p>
                      <input
                        placeholder="Search doctor by name or specialization…"
                        value={doctorSearch[d.id] ?? ""}
                        onChange={e => searchDoctors(d.id, e.target.value)}
                        className="input text-sm mb-1"
                      />
                      {doctorResults[d.id]?.length > 0 && (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          {doctorResults[d.id].map((dr: any) => {
                            const alreadyAssigned = d.doctors?.some((dd: any) => dd.doctorId === dr.id);
                            return (
                              <div key={dr.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{dr.user.name}</p>
                                  <p className="text-xs text-slate-400">{dr.specialization} · {dr.qualifications}</p>
                                </div>
                                {alreadyAssigned ? (
                                  <span className="text-xs text-green-600">✓ Assigned</span>
                                ) : (
                                  <button onClick={() => assignDoctor(d.id, dr.id, dr.user.name)} className="btn-primary text-xs">Assign</button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {assignMsg[d.id] && <p className="text-xs text-green-600 mt-1">{assignMsg[d.id]}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Appointments */}
          {tab === "appointments" && (
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
              {appointments.length === 0 && <p className="text-slate-400 text-sm">No appointments yet.</p>}
              {appointments.map((a: any) => (
                <div key={a.id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={APPT_BADGE[a.status] ?? "badge"}>{a.status}</span>
                        <span className="text-xs text-slate-400">{new Date(a.appointmentDate).toDateString()} @ {a.slotTime}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{a.patient?.user?.name}</p>
                      <p className="text-sm text-slate-500">{a.department?.name ?? "General"}</p>
                      {a.reason && <p className="text-xs text-slate-400 mt-0.5">{a.reason}</p>}
                    </div>
                    {a.status === "PENDING" && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => updateApptStatus(a.id, "ACCEPTED")} className="btn-success text-xs">✓ Accept</button>
                        <button onClick={() => updateApptStatus(a.id, "DECLINED")} className="text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg">✕ Decline</button>
                      </div>
                    )}
                    {a.status === "ACCEPTED" && (
                      <button onClick={() => updateApptStatus(a.id, "COMPLETED")} className="btn-secondary text-xs shrink-0">Mark Completed</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hospital Info */}
          {tab === "info" && (
            <div className="max-w-lg space-y-4">
              <h1 className="text-2xl font-bold text-slate-800">Hospital Information</h1>
              <div className="card space-y-4">
                {[
                  { label: "Hospital Name",  field: "name",    placeholder: "e.g. City General Hospital" },
                  { label: "Address",        field: "address", placeholder: "Street, Area" },
                  { label: "City",           field: "city",    placeholder: "Mumbai" },
                  { label: "Phone",          field: "phone",   placeholder: "+919876543210" },
                  { label: "Email",          field: "email",   placeholder: "info@hospital.com" },
                  { label: "Website",        field: "website", placeholder: "https://hospital.com" },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                    <input
                      placeholder={placeholder}
                      value={infoForm[field] ?? ""}
                      onChange={e => setInfoForm((f: any) => ({ ...f, [field]: e.target.value }))}
                      className="input"
                    />
                  </div>
                ))}
                {msg && <p className={`text-sm ${msg.includes("aved") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
                <button onClick={saveInfo} disabled={infoSaving} className="btn-primary w-full py-3">
                  {infoSaving ? "Saving…" : "Save Hospital Info"}
                </button>
              </div>
            </div>
          )}

          {/* Settings */}
          {tab === "settings" && (
            <div className="max-w-sm">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">Settings</h1>
              <div className="card">
                <h2 className="font-semibold text-slate-700 mb-4">Change Password</h2>
                <form onSubmit={changePassword} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                    <input type="password" className="input" value={pwdForm.currentPassword}
                      onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input type="password" className="input" value={pwdForm.newPassword}
                      onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} />
                  </div>
                  {pwdMsg && <p className={`text-sm ${pwdMsg.includes("ailed") ? "text-red-600" : "text-green-600"}`}>{pwdMsg}</p>}
                  <button type="submit" className="btn-primary w-full">Change Password</button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
