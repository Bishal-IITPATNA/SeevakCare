import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/about-us",             label: "About Us" },
  { href: "/contact-us",           label: "Contact Us" },
  { href: "/privacy-policy",       label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/refund-policy",        label: "Refund & Cancellation" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="Seevak Care" width={36} height={36} className="rounded-lg object-contain" />
            <div>
              <span className="font-bold text-sky-700">Seevak Care</span>
              <p className="text-xs text-green-600 font-medium leading-none">Seeva Hamari, Suraksha Apki</p>
            </div>
          </Link>
          <Link href="/" className="btn-secondary text-xs hidden sm:block">← Back to Home</Link>
        </div>

        {/* Secondary policy nav */}
        <div className="border-t border-slate-100 overflow-x-auto scrollbar-hide">
          <div className="max-w-4xl mx-auto px-4 flex gap-1 py-1.5 min-w-max sm:min-w-0">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="whitespace-nowrap px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-4xl mx-auto px-4 py-10">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-white py-10 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Image src="/logo.jpg" alt="Seevak Care" width={28} height={28} className="rounded-md object-contain" />
            <span className="font-bold text-sky-700 text-sm">Seevak Care</span>
          </div>
          <p className="text-slate-600 text-xs font-medium">
            RADIUS CARE WELL INDIA PRIVATE LIMITED
          </p>
          <p className="text-slate-400 text-xs">
            1448, Chunabhatti, Naka N8 Ward No 14, Darbhanga, Dhoi, Darbhanga-846009, Bihar
          </p>
          <p className="text-slate-400 text-xs">
            <a href="tel:+919771365160" className="hover:text-sky-600">+91 9771365160</a>
            {" · "}
            <a href="mailto:seevakcare@gmail.com" className="hover:text-sky-600">seevakcare@gmail.com</a>
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-xs text-sky-600 hover:underline">
                {l.label}
              </Link>
            ))}
          </div>
          <p className="text-slate-400 text-xs pt-1">
            © {new Date().getFullYear()} Seevak Care · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
