const NAV = [
  { id: "overview",      label: "Overview",        icon: "🏠" },
  { id: "appointments",  label: "Appointments",    icon: "📅" },
  { id: "prescriptions", label: "Prescriptions",   icon: "📋" },
  { id: "medicines",     label: "Order Medicines",  icon: "💊" },
  { id: "orders",        label: "My Orders",        icon: "📦" },
  { id: "prescriptions-upload", label: "My Prescriptions", icon: "📄" },
  { id: "lab",           label: "Lab Tests",        icon: "🧪" },
  { id: "book-doctor",   label: "Find a Doctor",    icon: "👨‍⚕️" },
  { id: "hospitals",     label: "Hospitals",        icon: "🏢" },
  { id: "emi",           label: "My EMI Plans",     icon: "📅" },
  { id: "profile",      label: "My Profile",       icon: "👤" },
];

export function PatientSidebar({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-100 min-h-screen p-4 hidden md:block">
      <div className="flex items-center gap-2 px-2 py-3 mb-4">
        <span className="text-xl">🧑‍🦱</span>
        <span className="text-sm font-semibold text-slate-700">Patient Portal</span>
      </div>
      <nav className="space-y-1">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === item.id
                ? "bg-sky-50 text-sky-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-8 px-3 py-3 bg-sky-50 rounded-lg">
        <p className="text-xs text-sky-700 font-medium mb-1">Support</p>
        <p className="text-xs text-sky-600">seevakcare@gmail.com</p>
        <p className="text-xs text-sky-600">+91 97713 65160</p>
      </div>
    </aside>
  );
}
