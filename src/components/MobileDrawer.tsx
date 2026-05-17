"use client";
import { useState } from "react";

interface Props {
  children: (close: () => void) => React.ReactNode;
}

export function MobileDrawer({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-4 z-50 md:hidden bg-sky-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {children(() => setOpen(false))}
      </div>
    </>
  );
}
