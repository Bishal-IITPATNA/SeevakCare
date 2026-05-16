"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { DoctorSidebar } from "@/components/sidebars/DoctorSidebar";
import { StatsGrid } from "@/components/StatsGrid";
import { PrescribeMedicine } from "@/components/PrescribeMedicine";

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "badge-pending",
  ACCEPTED:  "badge-accepted",
  DECLINED:  "badge-declined",
  COMPLETED: "badge-completed",
};

export default function DoctorDashboard() {
  const router = useRouter();
  const [user, setUser]               = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [tab, setTab]                 = useState("overview");
  const [prescribeFor, setPrescribeFor] = useState<any>(null);

  // Profile state
  const [profile, setProfile]             = useState<any>(null);
  const [profileForm, setProfileForm]     = useState<any>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState("");

  // Chamber form
  const [showAddChamber, setShowAddChamber] = useState(false);
  const [chamberForm, setChamberForm]       = useState({ name: "", address: "", city: "", consultationFee: "" });
  const [chamberMsg, setChamberMsg]         = useState("");

  // Schedule form: chamberId → form
  const [scheduleForm, setScheduleForm] = useState<Record<string, { dayOfWeek: string; startTime: string; endTime: string; slotDurationMinutes: string; maxSlots: string }>>({});
  const [scheduleMsg, setScheduleMsg]   = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) { router.push("/login"); return null; }
      return r.json();
    }).then(u => { if (u) setUser(u); });

    Promise.all([
      fetch("/api/appointments").then(r => r.json()),
      fetch("/api/prescriptions").then(r => r.json()),
    ]).then(([appts, pres]) => {
      setAppointments(Array.isArray(appts) ? appts : []);
      setPrescriptions(Array.isArray(pres) ? pres : []);
    });
  }, [router]);

  // Load doctor profile when profile tab opens
  useEffect(() => {
    if (tab === "profile" && !profile) loadProfile();
  }, [tab]);

  async function loadProfile() {
    const res = await fetch("/api/doctors/profile");
    if (res.ok) {
      const d = await res.json();
      setProfile(d);
      setProfileForm({
        name:            d.user?.name            ?? "",
        phone:           d.user?.phone           ?? "",
        specialization:  d.specialization        ?? "",
        qualifications:  d.qualifications        ?? "",
        experienceYears: d.experienceYears       ?? "",
        bio:             d.bio                   ?? "",
      });
    }
  }

  async function saveProfile() {
    setProfileSaving(true); setProfileMsg("");
    const res = await fetch("/api/doctors/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    if (res.ok) { setProfileMsg("Profile saved!"); setProfile(null); loadProfile(); }
    else { const d = await res.json(); setProfileMsg(d.error ?? "Save failed"); }
    setProfileSaving(false);
  }

  async function addChamber() {
    setChamberMsg("");
    const res = await fetch("/api/doctors/chambers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: chamberForm.name,
        address: chamberForm.address,
        city: chamberForm.city,
        consultationFee: Number(chamberForm.consultationFee),
      }),
    });
    if (res.ok) {
      setChamberForm({ name: "", address: "", city: "", consultationFee: "" });
      setShowAddChamber(false);
      setProfile(null); loadProfile();
    } else {
      const d = await res.json(); setChamberMsg(d.error ?? "Failed to add chamber");
    }
  }

  async function deleteChamber(chamberId: string) {
    if (!confirm("Delete this chamber and all its schedules?")) return;
    await fetch(`/api/doctors/chambers/${chamberId}`, { method: "DELETE" });
    setProfile(null); loadProfile();
  }

  async function addSchedule(chamberId: string) {
    const f = scheduleForm[chamberId];
    if (!f?.dayOfWeek || !f.startTime || !f.endTime) {
      setScheduleMsg(m => ({ ...m, [chamberId]: "Day, start time and end time are required" })); return;
    }
    const res = await fetch(`/api/doctors/chambers/${chamberId}/schedules`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayOfWeek:           Number(f.dayOfWeek),
        startTime:           f.startTime,
        endTime:             f.endTime,
        slotDurationMinutes: f.slotDurationMinutes ? Number(f.slotDurationMinutes) : 15,
        maxSlots:            f.maxSlots            ? Number(f.maxSlots)            : 20,
      }),
    });
    if (res.ok) {
      setScheduleMsg(m => ({ ...m, [chamberId]: "" }));
      setScheduleForm(s => ({ ...s, [chamberId]: { dayOfWeek: "", startTime: "", endTime: "", slotDurationMinutes: "15", maxSlots: "20" } }));
      setProfile(null); loadProfile();
    } else {
      const d = await res.json();
      setScheduleMsg(m => ({ ...m, [chamberId]: d.error ?? "Failed" }));
    }
  }

  async function deleteSchedule(chamberId: string, scheduleId: string) {
    await fetch(`/api/doctors/chambers/${chamberId}/schedules`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId }),
    });
    setProfile(null); loadProfile();
  }

  async function updateChamberFee(chamberId: string, consultationFee: number) {
    await fetch(`/api/doctors/chambers/${chamberId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultationFee }),
    });
    setProfile(null); loadProfile();
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
  }

  const pending   = appointments.filter(a => a.status === "PENDING");
  const accepted  = appointments.filter(a => a.status === "ACCEPTED");
  const completed = appointments.filter(a => a.status === "COMPLETED");

  const stats = [
    { label: "Pending",   value: pending.length,            icon: "⏳", color: "bg-yellow-50 text-yellow-700" },
    { label: "Upcoming",  value: accepted.length,           icon: "📅", color: "bg-blue-50 text-blue-700"    },
    { label: "Completed", value: completed.length,          icon: "✅", color: "bg-green-50 text-green-700"  },
    { label: "Prescriptions", value: prescriptions.length,  icon: "📋", color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role={user?.role} userName={user?.name} />
      <div className="flex flex-1">
        <DoctorSidebar active={tab} onNav={id => { setTab(id); setPrescribeFor(null); }} />
        <main className="flex-1 p-6 lg:p-8 max-w-5xl">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">
            {tab === "overview"      && `Dr. ${user?.name?.split(" ").slice(1).join(" ") ?? user?.name ?? ""}`}
            {tab === "pending"       && "Pending Requests"}
            {tab === "upcoming"      && "Upcoming Appointments"}
            {tab === "prescriptions" && "Prescriptions Issued"}
            {tab === "prescribe"     && "Write Prescription"}
            {tab === "profile"       && "My Profile & Settings"}
          </h1>

          {tab === "overview" && (
            <>
              <StatsGrid stats={stats} />
              {pending.length > 0 && (
                <section className="mt-8">
                  <h2 className="font-semibold text-slate-700 mb-4">Requests Needing Action</h2>
                  <div className="grid gap-3">
                    {pending.slice(0, 5).map(a => (
                      <div key={a.id} className="card flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-xl">🧑</div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{a.patient?.user?.name}</p>
                          <p className="text-sm text-slate-500">{new Date(a.appointmentDate).toDateString()} @ {a.slotTime}</p>
                          {a.reason && <p className="text-xs text-slate-400">{a.reason}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(a.id, "ACCEPTED")} className="btn-success">Accept</button>
                          <button onClick={() => updateStatus(a.id, "DECLINED")} className="btn-danger">Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {tab === "pending" && (
            <div className="grid gap-3">
              {pending.length === 0 ? <p className="text-slate-400 text-sm">No pending requests.</p> :
                pending.map(a => (
                  <div key={a.id} className="card flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><span className="badge-pending">PENDING</span></div>
                      <p className="font-semibold text-slate-800">{a.patient?.user?.name}</p>
                      <p className="text-sm text-slate-500">{new Date(a.appointmentDate).toDateString()} @ {a.slotTime}</p>
                      {a.reason && <p className="text-xs text-slate-400">{a.reason}</p>}
                      {a.patient?.user?.phone && <p className="text-xs text-slate-400">📞 {a.patient.user.phone}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => updateStatus(a.id, "ACCEPTED")} className="btn-success">✓ Accept</button>
                      <button onClick={() => updateStatus(a.id, "DECLINED")} className="btn-danger">✕ Decline</button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {tab === "upcoming" && (
            <div className="grid gap-3">
              {accepted.length === 0 ? <p className="text-slate-400 text-sm">No upcoming appointments.</p> :
                accepted.map(a => (
                  <div key={a.id} className="card">
                    <div className="flex items-center gap-2 mb-2"><span className="badge-accepted">ACCEPTED</span></div>
                    <p className="font-semibold text-slate-800">{a.patient?.user?.name}</p>
                    <p className="text-sm text-slate-500">{new Date(a.appointmentDate).toDateString()} @ {a.slotTime}</p>
                    {a.chamber && <p className="text-xs text-slate-400">{a.chamber.name}</p>}
                    <div className="flex gap-2 mt-3">
                      {!prescriptions.find(p => p.appointment?.id === a.id) && (
                        <button onClick={() => { setPrescribeFor(a); setTab("prescribe"); }} className="btn-primary text-xs">
                          ✍️ Write Prescription
                        </button>
                      )}
                      <button onClick={() => updateStatus(a.id, "COMPLETED")} className="btn-success text-xs">
                        Mark Completed
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {tab === "prescriptions" && (
            <div className="grid gap-4">
              {prescriptions.map(p => (
                <div key={p.id} className="card">
                  <p className="font-semibold text-slate-800">{p.patient?.user?.name}</p>
                  <p className="text-sm text-sky-600">{p.diagnosis}</p>
                  <p className="text-xs text-slate-400 mb-3">{new Date(p.createdAt).toDateString()}</p>
                  {p.medicines?.length > 0 && (
                    <div className="text-sm text-slate-600">
                      {p.medicines.map((m: any) => (
                        <span key={m.id} className="inline-block bg-slate-50 rounded px-2 py-0.5 mr-1 mb-1 text-xs">
                          {m.medicineName} {m.dosage}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {prescriptions.length === 0 && <p className="text-slate-400 text-sm">No prescriptions issued yet.</p>}
            </div>
          )}

          {tab === "prescribe" && (
            prescribeFor
              ? <PrescribeMedicine appointmentId={prescribeFor.id} patientName={prescribeFor.patient?.user?.name ?? "Patient"} />
              : (
                <div>
                  <p className="text-slate-500 text-sm mb-4">Select a patient from Upcoming Appointments to write a prescription.</p>
                  <button onClick={() => setTab("upcoming")} className="btn-secondary">← Go to Upcoming</button>
                </div>
              )
          )}

          {tab === "profile" && (
            <div className="max-w-2xl space-y-6">
              {!profile ? (
                <p className="text-slate-400 text-sm">Loading profile…</p>
              ) : (
                <>
                  {/* Basic Info */}
                  <div className="card">
                    <h2 className="font-semibold text-slate-800 mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input value={profileForm.name ?? ""} onChange={e => setProfileForm((f: any) => ({ ...f, name: e.target.value }))} className="input" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input type="tel" value={profileForm.phone ?? ""} onChange={e => setProfileForm((f: any) => ({ ...f, phone: e.target.value }))} className="input" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                        <input placeholder="e.g. Cardiology" value={profileForm.specialization ?? ""} onChange={e => setProfileForm((f: any) => ({ ...f, specialization: e.target.value }))} className="input" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Experience (years)</label>
                        <input type="number" min={0} value={profileForm.experienceYears ?? ""} onChange={e => setProfileForm((f: any) => ({ ...f, experienceYears: e.target.value }))} className="input" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Qualifications</label>
                      <input placeholder="e.g. MBBS, MD (Cardiology)" value={profileForm.qualifications ?? ""} onChange={e => setProfileForm((f: any) => ({ ...f, qualifications: e.target.value }))} className="input" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bio / About</label>
                      <textarea
                        placeholder="Brief description about your expertise…"
                        value={profileForm.bio ?? ""}
                        onChange={e => setProfileForm((f: any) => ({ ...f, bio: e.target.value }))}
                        className="input h-24 resize-none"
                      />
                    </div>
                    <div className="bg-slate-50 rounded-lg px-4 py-2 mb-4 text-sm text-slate-500">
                      <span className="font-medium text-slate-700">Email:</span> {profile.user?.email}
                    </div>
                    {profileMsg && (
                      <p className={`text-sm mb-3 ${profileMsg.includes("saved") ? "text-green-600" : "text-red-500"}`}>{profileMsg}</p>
                    )}
                    <button onClick={saveProfile} disabled={profileSaving} className="btn-primary">
                      {profileSaving ? "Saving…" : "Save Profile"}
                    </button>
                  </div>

                  {/* Chambers */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-slate-800">Chambers & Clinics</h2>
                      <button onClick={() => setShowAddChamber(v => !v)} className="btn-primary text-xs">
                        {showAddChamber ? "Cancel" : "+ Add Chamber"}
                      </button>
                    </div>

                    {showAddChamber && (
                      <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <input placeholder="Chamber name *" value={chamberForm.name} onChange={e => setChamberForm(f => ({ ...f, name: e.target.value }))} className="input" />
                          <input placeholder="City *" value={chamberForm.city} onChange={e => setChamberForm(f => ({ ...f, city: e.target.value }))} className="input" />
                          <input placeholder="Address *" value={chamberForm.address} onChange={e => setChamberForm(f => ({ ...f, address: e.target.value }))} className="input sm:col-span-2" />
                          <input type="number" placeholder="Consultation fee (₹) *" value={chamberForm.consultationFee} onChange={e => setChamberForm(f => ({ ...f, consultationFee: e.target.value }))} className="input" />
                        </div>
                        {chamberMsg && <p className="text-red-500 text-sm mb-2">{chamberMsg}</p>}
                        <button onClick={addChamber} className="btn-primary text-sm">Add Chamber</button>
                      </div>
                    )}

                    {profile.chambers?.length === 0 && !showAddChamber && (
                      <p className="text-slate-400 text-sm">No chambers yet. Add one to let patients book appointments.</p>
                    )}

                    {profile.chambers?.map((chamber: any) => (
                      <ChamberCard
                        key={chamber.id}
                        chamber={chamber}
                        onDelete={() => deleteChamber(chamber.id)}
                        onAddSchedule={(s) => {
                          setScheduleForm(sf => ({ ...sf, [chamber.id]: { ...sf[chamber.id], ...s } }));
                          addSchedule(chamber.id);
                        }}
                        onDeleteSchedule={(sid) => deleteSchedule(chamber.id, sid)}
                        onFeeUpdate={(fee) => updateChamberFee(chamber.id, fee)}
                        scheduleForm={scheduleForm[chamber.id] ?? { dayOfWeek: "", startTime: "", endTime: "", slotDurationMinutes: "15", maxSlots: "20" }}
                        setScheduleForm={(s) => setScheduleForm(sf => ({ ...sf, [chamber.id]: s }))}
                        scheduleMsg={scheduleMsg[chamber.id] ?? ""}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── ChamberCard sub-component ───────────────────────────────────────────────

const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ChamberCard({
  chamber, onDelete, onDeleteSchedule, onFeeUpdate,
  scheduleForm, setScheduleForm, scheduleMsg,
}: {
  chamber: any;
  onDelete: () => void;
  onAddSchedule: (s: any) => void;
  onDeleteSchedule: (id: string) => void;
  onFeeUpdate: (fee: number) => void;
  scheduleForm: any;
  setScheduleForm: (s: any) => void;
  scheduleMsg: string;
}) {
  const [editFee, setEditFee] = useState(false);
  const [feeVal, setFeeVal]   = useState(String(Number(chamber.consultationFee)));
  const [addSched, setAddSched] = useState(false);
  const [saving, setSaving]   = useState(false);

  async function saveFee() {
    setSaving(true);
    await onFeeUpdate(Number(feeVal));
    setEditFee(false); setSaving(false);
  }

  async function saveSchedule() {
    setSaving(true);
    const res = await fetch(`/api/doctors/chambers/${chamber.id}/schedules`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayOfWeek:           Number(scheduleForm.dayOfWeek),
        startTime:           scheduleForm.startTime,
        endTime:             scheduleForm.endTime,
        slotDurationMinutes: scheduleForm.slotDurationMinutes ? Number(scheduleForm.slotDurationMinutes) : 15,
        maxSlots:            scheduleForm.maxSlots            ? Number(scheduleForm.maxSlots)            : 20,
      }),
    });
    if (res.ok) {
      setAddSched(false);
      setScheduleForm({ dayOfWeek: "", startTime: "", endTime: "", slotDurationMinutes: "15", maxSlots: "20" });
      window.location.reload();
    }
    setSaving(false);
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 mb-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-slate-800">{chamber.name}</p>
          <p className="text-sm text-slate-500">{chamber.address}, {chamber.city}</p>
        </div>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
      </div>

      {/* Consultation fee */}
      <div className="flex items-center gap-2 mb-3">
        {editFee ? (
          <>
            <span className="text-sm text-slate-600">Fee ₹</span>
            <input type="number" value={feeVal} onChange={e => setFeeVal(e.target.value)} className="input w-24 text-sm" />
            <button onClick={saveFee} disabled={saving} className="btn-primary text-xs">Save</button>
            <button onClick={() => setEditFee(false)} className="btn-secondary text-xs">Cancel</button>
          </>
        ) : (
          <>
            <span className="text-sm text-slate-600">Fee: <strong>₹{Number(chamber.consultationFee).toFixed(0)}</strong></span>
            <button onClick={() => setEditFee(true)} className="text-sky-500 text-xs underline">Edit</button>
          </>
        )}
      </div>

      {/* Schedules */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Availability</p>
        {chamber.schedules?.length === 0 && <p className="text-xs text-slate-400">No schedule added yet.</p>}
        {chamber.schedules?.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-50 last:border-0">
            <span className="text-slate-700">
              {DAYS_FULL[s.dayOfWeek]} &nbsp;
              <span className="text-slate-500">{s.startTime} – {s.endTime}</span>
              <span className="text-xs text-slate-400 ml-2">({s.slotDurationMinutes}min slots, max {s.maxSlots})</span>
            </span>
            <button onClick={() => onDeleteSchedule(s.id)} className="text-red-400 hover:text-red-600 text-xs ml-2">✕</button>
          </div>
        ))}
      </div>

      {/* Add schedule */}
      {!addSched ? (
        <button onClick={() => setAddSched(true)} className="text-sky-600 text-xs hover:underline">+ Add schedule slot</button>
      ) : (
        <div className="bg-slate-50 rounded-lg p-3 mt-2">
          <p className="text-xs font-semibold text-slate-600 mb-2">New Schedule</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-slate-500 mb-0.5 block">Day</label>
              <select value={scheduleForm.dayOfWeek} onChange={e => setScheduleForm({ ...scheduleForm, dayOfWeek: e.target.value })} className="input text-sm">
                <option value="">Select…</option>
                {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-0.5 block">Slot duration (min)</label>
              <input type="number" value={scheduleForm.slotDurationMinutes} onChange={e => setScheduleForm({ ...scheduleForm, slotDurationMinutes: e.target.value })} className="input text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-0.5 block">Start time</label>
              <input type="time" value={scheduleForm.startTime} onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} className="input text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-0.5 block">End time</label>
              <input type="time" value={scheduleForm.endTime} onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} className="input text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-0.5 block">Max slots</label>
              <input type="number" value={scheduleForm.maxSlots} onChange={e => setScheduleForm({ ...scheduleForm, maxSlots: e.target.value })} className="input text-sm" />
            </div>
          </div>
          {scheduleMsg && <p className="text-red-500 text-xs mb-2">{scheduleMsg}</p>}
          <div className="flex gap-2">
            <button onClick={saveSchedule} disabled={saving} className="btn-primary text-xs">Save Schedule</button>
            <button onClick={() => setAddSched(false)} className="btn-secondary text-xs">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
