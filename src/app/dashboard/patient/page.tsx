"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { PatientSidebar } from "@/components/sidebars/PatientSidebar";
import { StatsGrid } from "@/components/StatsGrid";
import { AppointmentCard } from "@/components/cards/AppointmentCard";
import { MedicineOrderCard } from "@/components/cards/MedicineOrderCard";
import { LabBookingCard } from "@/components/cards/LabBookingCard";
import { BookDoctor } from "@/components/BookDoctor";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS      = ["Male", "Female", "Other", "Prefer not to say"];

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser]               = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [orders, setOrders]           = useState<any[]>([]);
  const [labBookings, setLabBookings] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medicines, setMedicines]     = useState<any[]>([]);
  const [tab, setTab]                 = useState("overview");
  const [cart, setCart]               = useState<any[]>([]);
  const [orderStep, setOrderStep]     = useState<"browse" | "checkout">("browse");
  const [delivery, setDelivery]       = useState({ address: "", city: "", pincode: "" });
  const [orderMsg, setOrderMsg]       = useState("");

  // Profile state
  const [profile, setProfile]         = useState<any>(null);
  const [profileForm, setProfileForm] = useState<any>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]   = useState("");

  // Hospital search state
  const [hospitals, setHospitals]     = useState<any[]>([]);
  const [hospitalQuery, setHospitalQuery] = useState("");
  const [hospitalCity, setHospitalCity]   = useState("");
  const [hospitalSearching, setHospitalSearching] = useState(false);
  const [selectedHospital, setSelectedHospital]   = useState<any>(null);
  const [hBooking, setHBooking]       = useState({ departmentId: "", appointmentDate: "", slotTime: "", reason: "" });
  const [hBookingMsg, setHBookingMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) { router.push("/login"); return null; }
      return r.json();
    }).then(u => { if (u) setUser(u); });

    Promise.all([
      fetch("/api/appointments").then(r => r.json()),
      fetch("/api/medicine-orders").then(r => r.json()),
      fetch("/api/lab-bookings").then(r => r.json()),
      fetch("/api/prescriptions").then(r => r.json()),
      fetch("/api/medicines").then(r => r.json()),
    ]).then(([appts, ords, labs, pres, meds]) => {
      setAppointments(Array.isArray(appts) ? appts : []);
      setOrders(Array.isArray(ords) ? ords : []);
      setLabBookings(Array.isArray(labs) ? labs : []);
      setPrescriptions(Array.isArray(pres) ? pres : []);
      setMedicines(Array.isArray(meds) ? meds : []);
    });
  }, [router]);

  // Load profile when profile tab opens
  useEffect(() => {
    if (tab === "profile" && !profile) {
      fetch("/api/patients/profile").then(r => r.json()).then(d => {
        if (d && !d.error) {
          setProfile(d);
          setProfileForm({
            name:        d.user?.name   ?? "",
            phone:       d.user?.phone  ?? "",
            dateOfBirth: d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : "",
            gender:      d.gender      ?? "",
            bloodGroup:  d.bloodGroup  ?? "",
            address:     d.address     ?? "",
            city:        d.city        ?? "",
            pincode:     d.pincode     ?? "",
          });
        }
      });
    }
  }, [tab, profile]);

  async function saveProfile() {
    setProfileSaving(true); setProfileMsg("");
    const res = await fetch("/api/patients/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    if (res.ok) {
      setProfileMsg("Profile saved successfully!");
      setProfile(null); // force reload next time
    } else {
      const d = await res.json();
      setProfileMsg(d.error ?? "Failed to save profile");
    }
    setProfileSaving(false);
  }

  async function searchHospitals() {
    setHospitalSearching(true);
    const params = new URLSearchParams();
    if (hospitalQuery) params.set("q", hospitalQuery);
    if (hospitalCity)  params.set("city", hospitalCity);
    const res = await fetch(`/api/hospitals/search?${params}`);
    const data = await res.json();
    setHospitals(Array.isArray(data) ? data : []);
    setHospitalSearching(false);
  }

  async function bookHospitalAppointment() {
    if (!selectedHospital || !hBooking.departmentId || !hBooking.appointmentDate || !hBooking.slotTime) {
      setHBookingMsg("Please fill all required fields."); return;
    }
    const res = await fetch("/api/appointments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hospitalId:   selectedHospital.id,
        departmentId: hBooking.departmentId,
        appointmentDate: hBooking.appointmentDate,
        slotTime:     hBooking.slotTime,
        reason:       hBooking.reason,
      }),
    });
    if (res.ok) {
      setHBookingMsg("Appointment booked! Check the Appointments tab.");
      setSelectedHospital(null);
      setHBooking({ departmentId: "", appointmentDate: "", slotTime: "", reason: "" });
      const fresh = await fetch("/api/appointments").then(r => r.json());
      setAppointments(Array.isArray(fresh) ? fresh : []);
    } else {
      const d = await res.json();
      setHBookingMsg(d.error ?? "Booking failed");
    }
  }

  function addToCart(med: any) {
    setCart(c => {
      const exists = c.find(i => i.medicineId === med.id);
      if (exists) return c.map(i => i.medicineId === med.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { medicineId: med.id, medicineName: med.name, unitPrice: Number(med.price), quantity: 1 }];
    });
  }

  function removeFromCart(medicineId: string) {
    setCart(c => c.filter(i => i.medicineId !== medicineId));
  }

  const cartSubtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const gst          = parseFloat((cartSubtotal * 0.05).toFixed(2));
  const delivery_ch  = cartSubtotal < 500 ? 50 : parseFloat((cartSubtotal * 0.1).toFixed(2));
  const total        = parseFloat((cartSubtotal + gst + delivery_ch).toFixed(2));

  async function placeOrder() {
    if (!delivery.address || !delivery.city || !delivery.pincode) {
      setOrderMsg("Please fill in all delivery details."); return;
    }
    const items = cart.map(i => ({ medicineId: i.medicineId, quantity: i.quantity, unitPrice: i.unitPrice }));
    const res = await fetch("/api/medicine-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, deliveryAddress: delivery.address, deliveryCity: delivery.city, deliveryPincode: delivery.pincode }),
    });
    if (res.ok) {
      setCart([]); setOrderStep("browse"); setOrderMsg("");
      const fresh = await fetch("/api/medicine-orders").then(r => r.json());
      setOrders(Array.isArray(fresh) ? fresh : []);
      setTab("orders");
    } else { const d = await res.json(); setOrderMsg(d.error ?? "Failed to place order"); }
  }

  const stats = [
    { label: "Appointments",    value: appointments.length,  icon: "📅", color: "bg-blue-50 text-blue-700"   },
    { label: "Medicine Orders", value: orders.length,         icon: "💊", color: "bg-green-50 text-green-700" },
    { label: "Lab Tests",       value: labBookings.length,    icon: "🧪", color: "bg-purple-50 text-purple-700" },
    { label: "Prescriptions",   value: prescriptions.length,  icon: "📋", color: "bg-orange-50 text-orange-700" },
  ];

  const TAB_TITLES: Record<string, string> = {
    overview:      `Welcome back, ${user?.name?.split(" ")[0] ?? ""}! 👋`,
    appointments:  "My Appointments",
    prescriptions: "My Prescriptions",
    medicines:     "Order Medicines",
    lab:           "Lab Test Bookings",
    "book-doctor": "Find & Book a Doctor",
    hospitals:     "Find a Hospital",
    profile:       "My Profile",
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role={user?.role} userName={user?.name} />
      <div className="flex flex-1">
        <PatientSidebar active={tab} onNav={setTab} />
        <main className="flex-1 p-6 lg:p-8 max-w-5xl">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">{TAB_TITLES[tab] ?? ""}</h1>

          {tab === "overview" && (
            <>
              <StatsGrid stats={stats} />
              <section className="mt-8">
                <h2 className="font-semibold text-slate-700 mb-4">Recent Appointments</h2>
                {appointments.length === 0
                  ? <p className="text-slate-400 text-sm">No appointments yet. <button onClick={() => setTab("book-doctor")} className="text-sky-600 underline">Book one now →</button></p>
                  : <div className="grid gap-3">{appointments.slice(0, 3).map(a => <AppointmentCard key={a.id} appointment={a} />)}</div>
                }
              </section>
            </>
          )}

          {tab === "appointments" && (
            <div className="grid gap-3">
              {appointments.length === 0
                ? <p className="text-slate-400 text-sm">No appointments. <button onClick={() => setTab("book-doctor")} className="text-sky-600 underline">Book one →</button></p>
                : appointments.map(a => <AppointmentCard key={a.id} appointment={a} />)
              }
            </div>
          )}

          {tab === "prescriptions" && (
            <div className="grid gap-4">
              {prescriptions.map(p => (
                <div key={p.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-800">{p.diagnosis}</p>
                      <p className="text-sm text-sky-600">Dr. {p.doctor?.user?.name}</p>
                      <p className="text-xs text-slate-400">{new Date(p.createdAt).toDateString()}</p>
                    </div>
                  </div>
                  {p.medicines?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Medicines</p>
                      {p.medicines.map((m: any) => (
                        <div key={m.id} className="text-sm text-slate-700 py-0.5">
                          • {m.medicineName} — {m.dosage}, {m.frequency} for {m.duration}
                        </div>
                      ))}
                    </div>
                  )}
                  {p.labTests?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Lab Tests</p>
                      {p.labTests.map((t: any) => (
                        <div key={t.id} className="text-sm text-slate-700 py-0.5">• {t.testName}</div>
                      ))}
                    </div>
                  )}
                  {p.notes && <p className="text-sm text-slate-500 mt-2 italic">{p.notes}</p>}
                </div>
              ))}
              {prescriptions.length === 0 && <p className="text-slate-400 text-sm">No prescriptions yet.</p>}
            </div>
          )}

          {tab === "medicines" && (
            <div>
              {orderStep === "browse" && (
                <>
                  {cart.length > 0 && (
                    <div className="card bg-sky-50 border-sky-200 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sky-700">🛒 Cart ({cart.length} items)</p>
                        <button onClick={() => setOrderStep("checkout")} className="btn-primary text-xs">
                          Checkout → ₹{total.toFixed(2)}
                        </button>
                      </div>
                      {cart.map(i => (
                        <div key={i.medicineId} className="flex justify-between items-center text-sm py-1">
                          <span>{i.medicineName} × {i.quantity}</span>
                          <button onClick={() => removeFromCart(i.medicineId)} className="text-red-400 text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {medicines.map(m => (
                      <div key={m.id} className="card flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{m.name}</p>
                          <p className="text-xs text-slate-400">{m.genericName} · {m.unit}</p>
                          <p className="text-sm font-medium text-sky-700 mt-1">₹{Number(m.price).toFixed(2)}</p>
                          {m.requiresPrescription && <span className="badge bg-red-50 text-red-600 mt-1">Rx Required</span>}
                        </div>
                        <button onClick={() => addToCart(m)} className="btn-primary text-xs whitespace-nowrap">+ Add</button>
                      </div>
                    ))}
                    {medicines.length === 0 && <p className="text-slate-400 text-sm col-span-2">No medicines available.</p>}
                  </div>
                </>
              )}
              {orderStep === "checkout" && (
                <div className="card max-w-md">
                  <h3 className="font-bold text-slate-800 mb-3">Order Summary</h3>
                  {cart.map(i => (
                    <div key={i.medicineId} className="flex justify-between text-sm py-1">
                      <span>{i.medicineName} × {i.quantity}</span>
                      <span>₹{(i.unitPrice * i.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 mt-2 pt-2 space-y-1 text-sm">
                    <div className="flex justify-between text-slate-500"><span>GST (5%)</span><span>₹{gst.toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Delivery</span><span>₹{delivery_ch.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-sky-700 text-base"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                  </div>
                  <div className="border-t border-slate-100 mt-4 pt-4">
                    <h4 className="font-semibold text-sm text-slate-700 mb-2">Delivery Address</h4>
                    <input placeholder="Full address" value={delivery.address} onChange={e => setDelivery(d => ({ ...d, address: e.target.value }))} className="input mb-2" />
                    <div className="flex gap-2">
                      <input placeholder="City" value={delivery.city} onChange={e => setDelivery(d => ({ ...d, city: e.target.value }))} className="input flex-1" />
                      <input placeholder="Pincode" value={delivery.pincode} onChange={e => setDelivery(d => ({ ...d, pincode: e.target.value }))} className="input w-28" />
                    </div>
                  </div>
                  {orderMsg && <p className="text-red-500 text-sm mt-2">{orderMsg}</p>}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setOrderStep("browse")} className="btn-secondary flex-1">← Back</button>
                    <button onClick={placeOrder} className="btn-primary flex-1">Place Order & Get OTP</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "lab" && (
            <div className="grid gap-3">
              {labBookings.map(b => <LabBookingCard key={b.id} booking={b} onUpdate={() => {
                fetch("/api/lab-bookings").then(r => r.json()).then(d => setLabBookings(Array.isArray(d) ? d : []));
              }} />)}
              {labBookings.length === 0 && <p className="text-slate-400 text-sm">No lab bookings yet.</p>}
            </div>
          )}

          {tab === "orders" && (
            <div className="grid gap-3">
              {orders.map(o => <MedicineOrderCard key={o.id} order={o} onUpdate={() => {
                fetch("/api/medicine-orders").then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : []));
              }} />)}
              {orders.length === 0 && <p className="text-slate-400 text-sm">No medicine orders yet.</p>}
            </div>
          )}

          {tab === "book-doctor" && <BookDoctor />}

          {/* Hospital search & booking */}
          {tab === "hospitals" && (
            <div>
              {!selectedHospital ? (
                <>
                  <div className="flex gap-2 mb-4">
                    <input
                      placeholder="Search by name or keyword…"
                      value={hospitalQuery}
                      onChange={e => setHospitalQuery(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && searchHospitals()}
                      className="input flex-1"
                    />
                    <input
                      placeholder="City"
                      value={hospitalCity}
                      onChange={e => setHospitalCity(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && searchHospitals()}
                      className="input w-36"
                    />
                    <button onClick={searchHospitals} disabled={hospitalSearching} className="btn-primary whitespace-nowrap">
                      {hospitalSearching ? "…" : "Search"}
                    </button>
                  </div>

                  {hospitals.length === 0 && !hospitalSearching && (
                    <p className="text-slate-400 text-sm">Search hospitals by name or city to get started.</p>
                  )}

                  <div className="grid gap-3">
                    {hospitals.map(h => (
                      <div key={h.id} className="card">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">{h.name}</p>
                            <p className="text-sm text-slate-500">{h.address}, {h.city}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{h.phone} · {h.email}</p>
                          </div>
                          <button onClick={() => { setSelectedHospital(h); setHBookingMsg(""); }} className="btn-primary text-xs whitespace-nowrap">
                            Book →
                          </button>
                        </div>
                        {h.departments?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {h.departments.map((d: any) => (
                              <span key={d.id} className="badge bg-sky-50 text-sky-700 text-xs">{d.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="card max-w-md">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setSelectedHospital(null)} className="text-slate-400 hover:text-slate-600 text-sm">← Back</button>
                    <h3 className="font-bold text-slate-800">{selectedHospital.name}</h3>
                  </div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                  <select
                    value={hBooking.departmentId}
                    onChange={e => setHBooking(b => ({ ...b, departmentId: e.target.value }))}
                    className="input mb-3"
                  >
                    <option value="">Select department…</option>
                    {selectedHospital.departments?.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>

                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={hBooking.appointmentDate}
                    onChange={e => setHBooking(b => ({ ...b, appointmentDate: e.target.value }))}
                    className="input mb-3"
                  />

                  <label className="block text-sm font-medium text-slate-700 mb-1">Time Slot *</label>
                  <input
                    type="time"
                    value={hBooking.slotTime}
                    onChange={e => setHBooking(b => ({ ...b, slotTime: e.target.value }))}
                    className="input mb-3"
                  />

                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
                  <input
                    placeholder="Brief description…"
                    value={hBooking.reason}
                    onChange={e => setHBooking(b => ({ ...b, reason: e.target.value }))}
                    className="input mb-4"
                  />

                  {hBookingMsg && (
                    <p className={`text-sm mb-3 ${hBookingMsg.includes("booked") ? "text-green-600" : "text-red-500"}`}>
                      {hBookingMsg}
                    </p>
                  )}

                  <button onClick={bookHospitalAppointment} className="btn-primary w-full py-3">
                    Confirm Booking →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Patient profile */}
          {tab === "profile" && (
            <div className="card max-w-lg">
              {!profile ? (
                <p className="text-slate-400 text-sm">Loading profile…</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input
                        value={profileForm.name ?? ""}
                        onChange={e => setProfileForm((f: any) => ({ ...f, name: e.target.value }))}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        placeholder="+919876543210"
                        value={profileForm.phone ?? ""}
                        onChange={e => setProfileForm((f: any) => ({ ...f, phone: e.target.value }))}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={profileForm.dateOfBirth ?? ""}
                        onChange={e => setProfileForm((f: any) => ({ ...f, dateOfBirth: e.target.value }))}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                      <select
                        value={profileForm.gender ?? ""}
                        onChange={e => setProfileForm((f: any) => ({ ...f, gender: e.target.value }))}
                        className="input"
                      >
                        <option value="">Select…</option>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                      <select
                        value={profileForm.bloodGroup ?? ""}
                        onChange={e => setProfileForm((f: any) => ({ ...f, bloodGroup: e.target.value }))}
                        className="input"
                      >
                        <option value="">Select…</option>
                        {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                      <input
                        placeholder="Mumbai"
                        value={profileForm.city ?? ""}
                        onChange={e => setProfileForm((f: any) => ({ ...f, city: e.target.value }))}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <input
                      placeholder="Flat, Street, Area…"
                      value={profileForm.address ?? ""}
                      onChange={e => setProfileForm((f: any) => ({ ...f, address: e.target.value }))}
                      className="input"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                    <input
                      placeholder="400001"
                      value={profileForm.pincode ?? ""}
                      onChange={e => setProfileForm((f: any) => ({ ...f, pincode: e.target.value }))}
                      className="input w-36"
                    />
                  </div>

                  <div className="bg-slate-50 rounded-lg px-4 py-2 mb-4 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">Email:</span> {profile.user?.email}
                  </div>

                  {profileMsg && (
                    <p className={`text-sm mb-3 ${profileMsg.includes("success") ? "text-green-600" : "text-red-500"}`}>
                      {profileMsg}
                    </p>
                  )}

                  <button onClick={saveProfile} disabled={profileSaving} className="btn-primary w-full py-3">
                    {profileSaving ? "Saving…" : "Save Profile"}
                  </button>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
