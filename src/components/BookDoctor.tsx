"use client";
import { useState, useEffect } from "react";
import { RazorpayButton } from "./RazorpayButton";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookDoctor() {
  const [doctors, setDoctors]   = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm]         = useState({ chamberId: "", slotTime: "", appointmentDate: "", reason: "" });
  const [booked, setBooked]     = useState<any>(null);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/doctors/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function book() {
    if (!form.appointmentDate || !form.slotTime) {
      setError("Please select a date and time slot."); return;
    }
    setLoading(true); setError("");
    const res = await fetch("/api/appointments", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        doctorId:        selected.id,
        chamberId:       form.chamberId || null,
        appointmentDate: form.appointmentDate,
        slotTime:        form.slotTime,
        reason:          form.reason,
        consultationFee: selected.chambers[0]?.consultationFee ?? 0,
      }),
    });
    if (res.ok) { const d = await res.json(); setBooked(d); }
    else { const d = await res.json(); setError(d.error ?? "Booking failed"); }
    setLoading(false);
  }

  if (booked) return (
    <div className="card max-w-md">
      <div className="text-4xl mb-3">✅</div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">Appointment Requested!</h3>
      <p className="text-slate-500 text-sm mb-4">Pay the consultation fee to confirm your slot.</p>
      <RazorpayButton
        type="APPOINTMENT"
        referenceId={booked.id}
        label={`Pay Consultation Fee (₹${Number(booked.consultationFee ?? 0).toFixed(2)})`}
        onSuccess={() => alert("Payment successful! Your appointment is confirmed.")}
        onError={(msg) => alert(msg)}
      />
      <button onClick={() => { setBooked(null); setSelected(null); setForm({ chamberId: "", slotTime: "", appointmentDate: "", reason: "" }); }}
        className="btn-secondary w-full mt-3">Book another</button>
    </div>
  );

  return (
    <div>
      {!selected ? (
        <>
          <div className="relative mb-4">
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
            <input
              placeholder="Search by name, specialization, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="grid gap-3">
            {doctors.map(d => (
              <div key={d.id} onClick={() => setSelected(d)}
                className="card cursor-pointer hover:shadow-md transition-shadow hover:border-sky-200 border border-transparent">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-xl">👨‍⚕️</div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{d.user.name}</p>
                    <p className="text-sm text-sky-600">{d.specialization}</p>
                    <p className="text-xs text-slate-400">{d.qualifications} · {d.experienceYears}y exp</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-medium text-green-700">
                        ₹{Number(d.chambers[0]?.consultationFee ?? 0).toFixed(0)} fee
                      </span>
                      {d.chambers[0]?.city && (
                        <span className="text-xs text-slate-400">📍 {d.chambers[0].city}</span>
                      )}
                    </div>
                    {d.chambers[0]?.schedules?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {d.chambers[0].schedules.map((s: any) => (
                          <span key={s.id} className="badge bg-slate-50 text-slate-600">
                            {DAYS[s.dayOfWeek]} {s.startTime}–{s.endTime}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {doctors.length === 0 && search && (
              <p className="text-slate-400 text-sm text-center py-8">No doctors found. Try a different search.</p>
            )}
          </div>
        </>
      ) : (
        <div className="card max-w-lg">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-xl">👨‍⚕️</div>
            <div>
              <p className="font-semibold">{selected.user.name}</p>
              <p className="text-sm text-sky-600">{selected.specialization}</p>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>}

          {selected.chambers.length > 0 && (
            <>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Chamber</label>
              <select value={form.chamberId} onChange={e => setForm(f => ({ ...f, chamberId: e.target.value }))} className="input mb-3">
                <option value="">-- Select Chamber --</option>
                {selected.chambers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.city} (₹{Number(c.consultationFee).toFixed(0)})</option>
                ))}
              </select>
            </>
          )}

          <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Date</label>
          <input type="date" value={form.appointmentDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => setForm(f => ({ ...f, appointmentDate: e.target.value }))}
            className="input mb-3"
          />

          <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Time</label>
          <input type="time" value={form.slotTime}
            onChange={e => setForm(f => ({ ...f, slotTime: e.target.value }))}
            className="input mb-3"
          />

          <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
          <textarea placeholder="Describe your symptoms or reason..." value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            className="input mb-4 h-20 resize-none"
          />

          <div className="flex gap-2">
            <button onClick={() => setSelected(null)} className="btn-secondary flex-1">← Back</button>
            <button onClick={book} disabled={loading} className="btn-primary flex-1">
              {loading ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
