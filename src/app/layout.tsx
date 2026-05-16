import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seevak Care — Seeva Hamari, Suraksha Apki",
  description:
    "Book doctor appointments, order medicines, and schedule lab tests with Seevak Care.",
  keywords: "healthcare, doctor appointments, lab tests, medicine delivery, India",
  authors: [{ name: "Seevak Care" }],
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Seevak Care",
    description: "Your complete digital healthcare companion.",
    type: "website",
    images: [{ url: "/logo.jpg", width: 1334, height: 750, alt: "Seevak Care" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
