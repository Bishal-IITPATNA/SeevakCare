"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface NavbarProps {
  role?: string;
  userName?: string;
}

const TYPE_ICON: Record<string, string> = {
  APPOINTMENT: "📅",
  ORDER:       "💊",
  LAB:         "🧪",
  PAYMENT:     "💰",
};

const ROLE_LABELS: Record<string, string> = {
  PATIENT:        "Patient",
  DOCTOR:         "Doctor",
  HOSPITAL_ADMIN: "Hospital Admin",
  LAB_STORE:      "Lab Store",
  SYSTEM_ADMIN:   "System Admin",
};

export function Navbar({ role, userName }: NavbarProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen]                   = useState(false);
  const ref                               = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    loadNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadNotifications() {
    const res = await fetch("/api/notifications").catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setNotifications(data);
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  }

  async function markOneRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <span className="text-lg font-bold text-sky-700">Seevak Care</span>
        </Link>

        <div className="flex items-center gap-4">
          {role && (
            <span className="hidden sm:inline-flex badge bg-sky-50 text-sky-700">
              {ROLE_LABELS[role] ?? role}
            </span>
          )}
          {userName && (
            <span className="text-sm text-slate-600 hidden md:block">{userName}</span>
          )}

          {/* Notification bell */}
          <div ref={ref} className="relative">
            <button
              onClick={() => { setOpen(v => !v); if (!open) loadNotifications(); }}
              className="relative p-2 text-slate-500 hover:text-sky-600 transition"
              aria-label="Notifications"
            >
              🔔
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-sky-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No notifications yet</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markOneRead(n.id)}
                        className={`flex gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? "bg-sky-50/60" : ""}`}
                      >
                        <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.isRead ? "font-semibold text-slate-800" : "text-slate-700"}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-sky-500 mt-2 shrink-0" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={logout} className="btn-secondary text-xs">Sign out</button>
        </div>
      </div>
    </header>
  );
}
