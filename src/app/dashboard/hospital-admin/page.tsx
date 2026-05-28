"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { StatsGrid } from "@/components/StatsGrid";
import { MobileDrawer } from "@/components/MobileDrawer";

function TcSection({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5" dangerouslySetInnerHTML={{ __html: title }} />
      <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function ServiceForm({ form, setForm, departments, msg, onSubmit, submitLabel, cardClass }: {
  form: any; setForm: (f: any) => void;
  departments: any[];
  msg: string; onSubmit: () => void; submitLabel: string; cardClass: string;
}) {
  const includesDisplay = form.includes?.split("|").join("\n") ?? "";
  const excludesDisplay = form.excludes?.split("|").join("\n") ?? "";

  return (
    <div className={cardClass}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* Row 1 */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Service Name *</label>
          <input placeholder="e.g. Kidney Stone Removal (PCNL)" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Category *</label>
          <select value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))} className="input">
            {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* Subcategory */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Sub-category <span className="text-slate-400">(optional — e.g. Kidney Stone, Cataract, Baby Delivery)</span>
          </label>
          <input
            placeholder="Enter sub-category to group similar services…"
            value={form.subcategory ?? ""}
            onChange={e => setForm((f: any) => ({ ...f, subcategory: e.target.value }))}
            className="input"
          />
        </div>
        {/* Row 2 */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Package Price (₹) *</label>
          <input type="number" min="0" step="0.01" placeholder="85000" value={form.price} onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">GST (%)</label>
          <input type="number" min="0" max="28" step="0.01" placeholder="0" value={form.gstPercent} onChange={e => setForm((f: any) => ({ ...f, gstPercent: e.target.value }))} className="input" />
        </div>
        {/* Row 3 */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Admission Days (0 = Outpatient)</label>
          <input type="number" min="0" value={form.admissionDays} onChange={e => setForm((f: any) => ({ ...f, admissionDays: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Department (optional)</label>
          <select value={form.departmentId} onChange={e => setForm((f: any) => ({ ...f, departmentId: e.target.value }))} className="input">
            <option value="">— None —</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Short Description</label>
          <input placeholder="Brief description of the procedure…" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="input" />
        </div>
      </div>

      {/* T&C section */}
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-4">Terms &amp; Conditions</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">What&apos;s Included <span className="text-slate-400">(one item per line)</span></label>
          <textarea rows={6} placeholder="Room charges&#10;Nursing care&#10;Surgeon fee" value={includesDisplay}
            onChange={e => setForm((f: any) => ({ ...f, includes: e.target.value.split("\n").join("|") }))}
            className="input resize-y text-xs" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">What&apos;s Excluded <span className="text-slate-400">(one item per line)</span></label>
          <textarea rows={6} placeholder="ICU charges&#10;Blood transfusion" value={excludesDisplay}
            onChange={e => setForm((f: any) => ({ ...f, excludes: e.target.value.split("\n").join("|") }))}
            className="input resize-y text-xs" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Pre-operative Instructions</label>
          <textarea rows={5} value={form.preOpInstructions} onChange={e => setForm((f: any) => ({ ...f, preOpInstructions: e.target.value }))} className="input resize-y text-xs" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Post-operative / Discharge Instructions</label>
          <textarea rows={5} value={form.postOpInstructions} onChange={e => setForm((f: any) => ({ ...f, postOpInstructions: e.target.value }))} className="input resize-y text-xs" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Payment Terms</label>
          <textarea rows={5} value={form.paymentTerms} onChange={e => setForm((f: any) => ({ ...f, paymentTerms: e.target.value }))} className="input resize-y text-xs" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Cancellation &amp; Refund Policy</label>
          <textarea rows={5} value={form.cancellationPolicy} onChange={e => setForm((f: any) => ({ ...f, cancellationPolicy: e.target.value }))} className="input resize-y text-xs" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Additional Terms &amp; Conditions</label>
          <textarea rows={5} value={form.additionalTerms} onChange={e => setForm((f: any) => ({ ...f, additionalTerms: e.target.value }))} className="input resize-y text-xs" />
        </div>
      </div>

      {msg && <p className="text-red-500 text-sm mb-2">{msg}</p>}
      <button onClick={onSubmit} className="btn-primary text-sm">{submitLabel}</button>
    </div>
  );
}

const APPT_BADGE: Record<string, string> = {
  PENDING:       "badge bg-yellow-50 text-yellow-700",
  ACCEPTED:      "badge bg-green-50 text-green-700",
  DECLINED:      "badge bg-red-50 text-red-600",
  COMPLETED:     "badge bg-slate-100 text-slate-500",
  CANCELLED:     "badge bg-slate-100 text-slate-400",
  SLOT_PROPOSED: "badge bg-purple-50 text-purple-700",
};

const NAV = [
  { id: "overview",     label: "Overview",       icon: "🏠" },
  { id: "departments",  label: "Departments",    icon: "🏢" },
  { id: "services",     label: "Services",       icon: "💊" },
  { id: "appointments", label: "Appointments",   icon: "📅" },
  { id: "info",         label: "Hospital Info",  icon: "✏️" },
  { id: "settings",     label: "Settings",       icon: "⚙️" },
];

const SERVICE_CATEGORIES = ["Surgery", "Diagnostics", "Consultation", "Therapy", "Emergency", "Maternity", "Rehabilitation", "Other"];

const BLANK_SERVICE = {
  name: "", description: "", category: "Surgery", subcategory: "", departmentId: "",
  price: "", gstPercent: "0", admissionDays: "1",
  includes: "Room charges (General ward)\nNursing care\nSurgeon fee\nAnesthesia fee\nOperation theater charges\nBasic medications (as per protocol)\nPre-operative investigations\nPost-operative dressings",
  excludes: "ICU charges (if required)\nBlood and blood products\nImplants and prosthetics\nSpecialized investigations\nPrivate room upgrade\nPersonal care items",
  preOpInstructions: "• Complete fasting (no food or water) for 8 hours before surgery\n• All routine blood tests, ECG and X-ray must be completed before admission\n• Inform doctor of all current medications; some may be stopped 7 days prior\n• Bathing with antiseptic soap the night before is recommended\n• Bring a responsible adult attendant for post-operative care",
  postOpInstructions: "• Follow-up visit is mandatory within 7 days of discharge\n• Suture / stitch removal will be scheduled by the treating surgeon\n• Activity restriction as per surgeon's advice for 2-4 weeks\n• Any sign of fever, wound redness, swelling or discharge — report immediately\n• Take all prescribed medications as directed; do not self-medicate",
  paymentTerms: "• 50% advance payment is required at the time of admission\n• Remaining balance must be settled before discharge\n• Accepted modes of payment: Cash, Credit/Debit card, UPI, Net banking\n• EMI facility available on select cards (minimum 3 months)\n• Insurance: Pre-authorization must be obtained before admission",
  cancellationPolicy: "• Surgery rescheduled by patient 48+ hours prior: No cancellation charge\n• Surgery rescheduled by patient within 48 hours: ₹2,000 rescheduling fee\n• Surgery cancelled after admission: Admission and investigation charges are non-refundable\n• No-show without prior intimation: Advance deposit forfeited\n• Hospital-initiated postponement: Full advance refunded within 7 working days",
  additionalTerms: "• Package rates are valid for 30 days from the date of quotation\n• Rates are subject to change without prior notice after the validity period\n• This is an estimated package; final billing may vary depending on clinical condition\n• The hospital reserves the right to shift the patient to ICU / HDU if medically necessary (charges extra)\n• In case of complications requiring extended stay, per-day charges will apply\n• The treating surgeon reserves the right to modify the surgical plan based on intra-operative findings\n• All disputes are subject to the jurisdiction of local courts only",
};

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

  // Slot proposal
  const [proposingFor, setProposingFor]     = useState<string | null>(null); // appointment id
  const [proposalForm, setProposalForm]     = useState({ date: "", time: "", note: "" });
  const [proposalMsg, setProposalMsg]       = useState("");

  // Password change
  const [pwdForm, setPwdForm]   = useState({ currentPassword: "", newPassword: "" });
  const [pwdMsg, setPwdMsg]     = useState("");

  // Services
  const [services, setServices]           = useState<any[]>([]);
  const [showAddSvc, setShowAddSvc]       = useState(false);
  const [svcForm, setSvcForm]             = useState<any>(BLANK_SERVICE);
  const [svcMsg, setSvcMsg]               = useState("");
  const [editSvc, setEditSvc]             = useState<any>(null);
  const [editSvcForm, setEditSvcForm]     = useState<any>(BLANK_SERVICE);
  const [editSvcMsg, setEditSvcMsg]       = useState("");
  const [expandedSvc, setExpandedSvc]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) { router.push("/login"); return null; }
      return r.json();
    }).then(u => { if (u) setUser(u); });

    loadHospital();
    loadServices();
    fetch("/api/appointments").then(r => r.json()).then(d => setAppointments(Array.isArray(d) ? d : []));
  }, [router]);

  async function loadServices() {
    const res = await fetch("/api/hospital-admin/services");
    if (res.ok) setServices(await res.json());
  }

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

  const activeServices = services.filter((s: any) => s.isActive).length;

  const stats = [
    { label: "Departments",    value: departments.length, icon: "🏢", color: "bg-blue-50 text-blue-700"    },
    { label: "Total Beds",     value: totalBeds,          icon: "🛏️", color: "bg-indigo-50 text-indigo-700" },
    { label: "Occupancy",      value: `${occupancyPct}%`, icon: "📊", color: occupancyPct > 80 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700" },
    { label: "Pending Appts",  value: pendingAppts,       icon: "⏳", color: "bg-yellow-50 text-yellow-700" },
    { label: "Active Services",value: activeServices,     icon: "💊", color: "bg-violet-50 text-violet-700" },
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
    if (res.ok) {
      const updated = await res.json();
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: updated.status } : a));
    }
  }

  async function proposeSlot(id: string) {
    setProposalMsg("");
    if (!proposalForm.date || !proposalForm.time) {
      setProposalMsg("Please enter both a date and time."); return;
    }
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status:          "SLOT_PROPOSED",
        proposedDate:    proposalForm.date,
        proposedSlotTime: proposalForm.time,
        notes:           proposalForm.note || undefined,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: updated.status } : a));
      setProposingFor(null);
      setProposalForm({ date: "", time: "", note: "" });
    } else {
      const d = await res.json();
      setProposalMsg(d.error ?? "Failed to propose slot.");
    }
  }

  // ── Services ───────────────────────────────────────────────────────────────

  async function addService() {
    setSvcMsg("");
    if (!svcForm.name || !svcForm.category || !svcForm.price) { setSvcMsg("Name, category and price are required."); return; }
    const res = await fetch("/api/hospital-admin/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...svcForm, price: Number(svcForm.price), gstPercent: Number(svcForm.gstPercent), admissionDays: Number(svcForm.admissionDays) }),
    });
    if (res.ok) { setSvcForm(BLANK_SERVICE); setShowAddSvc(false); loadServices(); }
    else { const d = await res.json(); setSvcMsg(d.error ?? "Failed to add service"); }
  }

  async function saveEditSvc() {
    setEditSvcMsg("");
    const res = await fetch(`/api/hospital-admin/services/${editSvc.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editSvcForm, price: Number(editSvcForm.price), gstPercent: Number(editSvcForm.gstPercent), admissionDays: Number(editSvcForm.admissionDays) }),
    });
    if (res.ok) { setEditSvc(null); loadServices(); }
    else { const d = await res.json(); setEditSvcMsg(d.error ?? "Update failed"); }
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    await fetch(`/api/hospital-admin/services/${id}`, { method: "DELETE" });
    loadServices();
  }

  async function toggleSvcActive(svc: any) {
    await fetch(`/api/hospital-admin/services/${svc.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !svc.isActive }),
    });
    loadServices();
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

          {/* Services */}
          {tab === "services" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Hospital Services &amp; Charges</h1>
                <button onClick={() => { setShowAddSvc(v => !v); setSvcMsg(""); }} className="btn-primary text-sm">
                  {showAddSvc ? "Cancel" : "+ Add Service"}
                </button>
              </div>

              {/* Add service form */}
              {showAddSvc && (
                <ServiceForm
                  form={svcForm} setForm={setSvcForm}
                  departments={departments}
                  msg={svcMsg}
                  onSubmit={addService}
                  submitLabel="Add Service"
                  cardClass="card border-sky-200 bg-sky-50/40"
                />
              )}

              {/* Edit service inline */}
              {editSvc && (
                <div className="card border-amber-200 bg-amber-50/30 space-y-2">
                  <h3 className="font-semibold text-slate-700">Edit — {editSvc.name}</h3>
                  <ServiceForm
                    form={editSvcForm} setForm={setEditSvcForm}
                    departments={departments}
                    msg={editSvcMsg}
                    onSubmit={saveEditSvc}
                    submitLabel="Save Changes"
                    cardClass=""
                  />
                  <button onClick={() => setEditSvc(null)} className="btn-secondary text-sm mt-1">Cancel</button>
                </div>
              )}

              {/* Group by category */}
              {services.length === 0 && !showAddSvc && (
                <p className="text-slate-400 text-sm">No services configured yet. Add one to display charges to patients.</p>
              )}

              {Array.from(new Set(services.map((s: any) => s.category))).map((cat: any) => (
                <div key={cat}>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{cat}</h2>
                  <div className="space-y-3">
                    {services.filter((s: any) => s.category === cat).map((svc: any) => {
                      const priceWithGst = Number(svc.price) * (1 + Number(svc.gstPercent) / 100);
                      const includesList = svc.includes ? svc.includes.split("|").filter(Boolean) : [];
                      const excludesList = svc.excludes ? svc.excludes.split("|").filter(Boolean) : [];
                      const isExpanded = expandedSvc === svc.id;
                      return (
                        <div key={svc.id} className={`card border ${svc.isActive ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="font-semibold text-slate-800">{svc.name}</p>
                                {svc.department && (
                                  <span className="badge bg-sky-50 text-sky-700 text-xs">{svc.department.name}</span>
                                )}
                                {!svc.isActive && <span className="badge bg-slate-100 text-slate-400 text-xs">Inactive</span>}
                              </div>
                              {svc.description && <p className="text-xs text-slate-500 mb-1">{svc.description}</p>}
                              <div className="flex items-baseline gap-3 flex-wrap">
                                <span className="text-lg font-bold text-slate-900">₹{Number(svc.price).toLocaleString("en-IN")}</span>
                                {Number(svc.gstPercent) > 0 && (
                                  <span className="text-xs text-slate-400">+{svc.gstPercent}% GST = ₹{priceWithGst.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                )}
                                <span className="text-xs text-slate-400">
                                  {Number(svc.admissionDays) === 0 ? "Outpatient / Day-care" : `${svc.admissionDays} day${Number(svc.admissionDays) > 1 ? "s" : ""} admission`}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0 items-end">
                              <div className="flex gap-1.5">
                                <button onClick={() => { setEditSvc(svc); setEditSvcForm({ name: svc.name, description: svc.description ?? "", category: svc.category, subcategory: svc.subcategory ?? "", departmentId: svc.departmentId ?? "", price: svc.price.toString(), gstPercent: svc.gstPercent.toString(), admissionDays: svc.admissionDays.toString(), includes: svc.includes, excludes: svc.excludes, preOpInstructions: svc.preOpInstructions ?? "", postOpInstructions: svc.postOpInstructions ?? "", paymentTerms: svc.paymentTerms ?? "", cancellationPolicy: svc.cancellationPolicy ?? "", additionalTerms: svc.additionalTerms ?? "" }); setEditSvcMsg(""); setExpandedSvc(null); }} className="btn-secondary text-xs">✏️ Edit</button>
                                <button onClick={() => deleteService(svc.id)} className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded-lg">Delete</button>
                              </div>
                              <button onClick={() => toggleSvcActive(svc)} className={`text-xs px-2 py-1 rounded-lg border ${svc.isActive ? "border-slate-200 text-slate-500 hover:bg-slate-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                                {svc.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </div>

                          {/* T&C toggle */}
                          <button onClick={() => setExpandedSvc(isExpanded ? null : svc.id)} className="mt-3 flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 font-medium">
                            <span>{isExpanded ? "▲" : "▼"}</span> Terms &amp; Conditions
                          </button>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-4 text-sm">
                              {/* Includes / Excludes */}
                              <div className="grid sm:grid-cols-2 gap-4">
                                {includesList.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-green-700 uppercase mb-1.5">Included in Package</p>
                                    <ul className="space-y-0.5">
                                      {includesList.map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-1.5 text-slate-600 text-xs">
                                          <span className="text-green-500 mt-0.5">✓</span> {item.trim()}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {excludesList.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-red-600 uppercase mb-1.5">Not Included</p>
                                    <ul className="space-y-0.5">
                                      {excludesList.map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-1.5 text-slate-600 text-xs">
                                          <span className="text-red-400 mt-0.5">✗</span> {item.trim()}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {/* Pre-op */}
                              {svc.preOpInstructions && (
                                <TcSection title="Pre-operative Instructions" text={svc.preOpInstructions} />
                              )}

                              {/* Post-op */}
                              {svc.postOpInstructions && (
                                <TcSection title="Post-operative / Discharge Instructions" text={svc.postOpInstructions} />
                              )}

                              {/* Payment */}
                              {svc.paymentTerms && (
                                <TcSection title="Payment Terms" text={svc.paymentTerms} />
                              )}

                              {/* Cancellation */}
                              {svc.cancellationPolicy && (
                                <TcSection title="Cancellation &amp; Refund Policy" text={svc.cancellationPolicy} />
                              )}

                              {/* Additional */}
                              {svc.additionalTerms && (
                                <TcSection title="Additional Terms &amp; Conditions" text={svc.additionalTerms} />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Appointments */}
          {tab === "appointments" && (
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
              {appointments.length === 0 && <p className="text-slate-400 text-sm">No appointments yet.</p>}
              {appointments.map((a: any) => (
                <div key={a.id} className="card space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={APPT_BADGE[a.status] ?? "badge"}>
                          {a.status === "SLOT_PROPOSED" ? "🔄 Slot Proposed" : a.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(a.appointmentDate).toDateString()} @ {a.slotTime}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800">{a.patient?.user?.name}</p>
                      <p className="text-sm text-slate-500">{a.department?.name ?? "General"}</p>
                      {a.reason && <p className="text-xs text-slate-400 mt-0.5">{a.reason}</p>}
                      {a.consultationFee && Number(a.consultationFee) > 0 && (
                        <p className="text-xs text-sky-600 mt-0.5 font-medium">
                          Fee: ₹{Number(a.consultationFee).toLocaleString("en-IN")}
                          {a.payment?.status === "SUCCESS" && <span className="ml-1 text-green-600">✅ Paid</span>}
                        </p>
                      )}
                      {/* Show what slot was proposed */}
                      {a.status === "SLOT_PROPOSED" && a.proposedDate && (
                        <p className="text-xs text-purple-600 mt-1">
                          Proposed: {new Date(a.proposedDate).toDateString()} @ {a.proposedSlotTime}
                          {a.notes && ` — "${a.notes}"`}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0 items-end">
                      {a.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => updateApptStatus(a.id, "ACCEPTED")}
                            className="btn-success text-xs"
                          >✓ Accept</button>
                          <button
                            onClick={() => { setProposingFor(a.id); setProposalForm({ date: "", time: "", note: "" }); setProposalMsg(""); }}
                            className="text-xs bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 px-3 py-1 rounded-lg"
                          >🔄 Propose Slot</button>
                          <button
                            onClick={() => updateApptStatus(a.id, "DECLINED")}
                            className="text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg"
                          >✕ Decline</button>
                        </>
                      )}
                      {a.status === "SLOT_PROPOSED" && (
                        <span className="text-xs text-purple-600 text-right">
                          Awaiting<br />patient response
                        </span>
                      )}
                      {a.status === "ACCEPTED" && (
                        <button
                          onClick={() => updateApptStatus(a.id, "COMPLETED")}
                          className="btn-secondary text-xs"
                        >Mark Completed</button>
                      )}
                    </div>
                  </div>

                  {/* Inline propose-slot form */}
                  {proposingFor === a.id && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-purple-700">Propose a different date &amp; time</p>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          min={new Date().toISOString().slice(0, 10)}
                          value={proposalForm.date}
                          onChange={e => setProposalForm(f => ({ ...f, date: e.target.value }))}
                          className="input text-sm flex-1"
                        />
                        <input
                          type="time"
                          value={proposalForm.time}
                          onChange={e => setProposalForm(f => ({ ...f, time: e.target.value }))}
                          className="input text-sm w-32"
                        />
                      </div>
                      <input
                        placeholder="Reason / note to patient (optional)"
                        value={proposalForm.note}
                        onChange={e => setProposalForm(f => ({ ...f, note: e.target.value }))}
                        className="input text-sm"
                      />
                      {proposalMsg && <p className="text-xs text-red-500">{proposalMsg}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => proposeSlot(a.id)}
                          className="btn-primary text-xs"
                        >Send Proposal</button>
                        <button
                          onClick={() => setProposingFor(null)}
                          className="btn-secondary text-xs"
                        >Cancel</button>
                      </div>
                    </div>
                  )}
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
