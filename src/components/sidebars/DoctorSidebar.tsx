"use client";
import { MobileDrawer } from "@/components/MobileDrawer";

const NAV = [
  { id: "overview",      label: "Overview",           icon: "🏠" },
  { id: "pending",       label: "Pending Requests",   icon: "⏳" },
  { id: "upcoming",      label: "Upcoming",           icon: "📅" },
  { id: "prescriptions", label: "Prescriptions",      icon: "📋" },
  { id: "prescribe",     label: "Write Prescription", icon: "✍️" },
  { id: "profile",       label: "My Profile",         icon: "👤" },
];

export function DoctorSidebar({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  function handleNav(id: string, close?: () => void) {
    onNav(id);
    close?.();
  }

  const navItems = (close?: () => void) => (
    <nav className="space-y-1">
      {NAV.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNav(item.id, close)}
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
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-100 min-h-screen p-4 hidden md:block">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <span className="text-xl">👨‍⚕️</span>
          <span className="text-sm font-semibold text-slate-700">Doctor Portal</span>
        </div>
        {navItems()}
      </aside>

      {/* Mobile drawer */}
      <MobileDrawer>
        {(close) => (
          <aside className="w-64 bg-white border-r border-slate-100 min-h-screen p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">👨‍⚕️</span>
                <span className="text-sm font-semibold text-slate-700">Doctor Portal</span>
              </div>
              <button onClick={close} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            {navItems(close)}
          </aside>
        )}
      </MobileDrawer>
    </>
  );
}
