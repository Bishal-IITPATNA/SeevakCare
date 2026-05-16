"use client";
import { useState } from "react";

interface Props { appointmentId: string; patientName: string; }

const emptyMed = () => ({ medicineName: "", dosage: "", frequency: "", duration: "", instructions: "" });
const emptyTest = () => ({ testName: "", instructions: "" });

export function PrescribeMedicine({ appointmentId, patientName }: Props) {
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes]         = useState("");
  const [medicines, setMedicines] = useState([emptyMed()]);
  const [labTests, setLabTests]   = useState([emptyTest()]);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");

  function updateMed(i: number, field: string, value: string) {
    setMedicines(arr => arr.map((m, j) => j === i ? { ...m, [field]: value } : m));
  }
  function updateTest(i: number, field: string, value: string) {
    setLabTests(arr => arr.map((t, j) => j === i ? { ...t, [field]: value } : t));
  }

  async function submit() {
    if (!diagnosis) { setError("Diagnosis is required"); return; }
    setLoading(true); setError("");

    const validMeds  = medicines.filter(m => m.medicineName);
    const validTests = labTests.filter(t => t.testName);

    const res = await fetch("/api/prescriptions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ appointmentId, diagnosis, notes, medicines: validMeds, labTests: validTests }),
    });

    if (res.ok) setSuccess(true);
    else { const d = await res.json(); setError(d.error ?? "Failed to issue prescription"); }
    setLoading(false);
  }

  if (success) return (
    <div className="card text-center">
      <div className="text-4xl mb-3">✅</div>
      <p className="font-semibold text-slate-800">Prescription issued for {patientName}</p>
      <p className="text-slate-500 text-sm mt-1">The patient has been notified.</p>
    </div>
  );

  return (
    <div className="card max-w-2xl">
      <h2 className="text-lg font-bold text-slate-800 mb-1">Write Prescription</h2>
      <p className="text-sm text-slate-500 mb-4">Patient: <strong>{patientName}</strong></p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>}

      <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis *</label>
      <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Primary diagnosis..." className="input mb-3 h-16 resize-none" />

      <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Notes</label>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes or instructions..." className="input mb-4 h-16 resize-none" />

      <div className="border border-slate-100 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700">💊 Medicines</h3>
          <button onClick={() => setMedicines(arr => [...arr, emptyMed()])} className="text-sky-600 text-sm font-medium hover:underline">+ Add</button>
        </div>
        {medicines.map((m, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b border-slate-50 last:border-0">
            <input placeholder="Medicine name" value={m.medicineName} onChange={e => updateMed(i, "medicineName", e.target.value)} className="input col-span-2" />
            <input placeholder="Dosage (e.g. 500mg)" value={m.dosage} onChange={e => updateMed(i, "dosage", e.target.value)} className="input" />
            <input placeholder="Frequency (1-0-1)" value={m.frequency} onChange={e => updateMed(i, "frequency", e.target.value)} className="input" />
            <input placeholder="Duration (7 days)" value={m.duration} onChange={e => updateMed(i, "duration", e.target.value)} className="input" />
            <input placeholder="Instructions (after food)" value={m.instructions} onChange={e => updateMed(i, "instructions", e.target.value)} className="input" />
            {medicines.length > 1 && (
              <button onClick={() => setMedicines(arr => arr.filter((_, j) => j !== i))} className="text-red-400 text-xs hover:text-red-600 text-left">Remove</button>
            )}
          </div>
        ))}
      </div>

      <div className="border border-slate-100 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700">🧪 Lab Tests</h3>
          <button onClick={() => setLabTests(arr => [...arr, emptyTest()])} className="text-sky-600 text-sm font-medium hover:underline">+ Add</button>
        </div>
        {labTests.map((t, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input placeholder="Test name" value={t.testName} onChange={e => updateTest(i, "testName", e.target.value)} className="input flex-1" />
            <input placeholder="Instructions" value={t.instructions} onChange={e => updateTest(i, "instructions", e.target.value)} className="input flex-1" />
            {labTests.length > 1 && (
              <button onClick={() => setLabTests(arr => arr.filter((_, j) => j !== i))} className="text-red-400 text-xs hover:text-red-600">✕</button>
            )}
          </div>
        ))}
      </div>

      <button onClick={submit} disabled={loading} className="btn-primary w-full py-3">
        {loading ? "Issuing..." : "Issue Prescription"}
      </button>
    </div>
  );
}
