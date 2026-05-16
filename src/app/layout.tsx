import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seevak Care — Unified Healthcare Platform",
  description:
    "Book doctor appointments, order medicines, and schedule lab tests with Seevak Care.",
  keywords: "healthcare, doctor appointments, lab tests, medicine delivery, India",
  authors: [{ name: "Seevak Care" }],
  openGraph: {
    title: "Seevak Care",
    description: "Your complete digital healthcare companion.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
