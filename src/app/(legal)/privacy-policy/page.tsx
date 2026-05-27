import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Seevak Care",
  description: "How Seevak Care collects, uses, and protects your personal and health data.",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3 scroll-mt-28">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

const TOC = [
  { id: "information-collected",  label: "Information We Collect" },
  { id: "how-we-use",             label: "How We Use Your Information" },
  { id: "information-sharing",    label: "Information Sharing" },
  { id: "data-security",          label: "Data Security" },
  { id: "data-retention",         label: "Data Retention" },
  { id: "your-rights",            label: "Your Rights" },
  { id: "cookies",                label: "Cookies & Tracking" },
  { id: "third-party",            label: "Third-Party Services" },
  { id: "children",               label: "Children's Privacy" },
  { id: "changes",                label: "Changes to This Policy" },
  { id: "contact",                label: "Contact & Grievance" },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card bg-gradient-to-br from-sky-50 to-white border-sky-100">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm">
          <strong>Effective Date:</strong> 1 January 2025 &nbsp;·&nbsp;
          <strong>Last Updated:</strong> 27 May 2026
        </p>
        <p className="text-slate-600 text-sm mt-3 leading-relaxed">
          This Privacy Policy describes how <strong>Radius Care Well India Private Limited</strong>
          {" "}(trading as <strong>Seevak Care</strong>, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects, uses, and
          protects your personal information when you use our platform and services. Please read this
          policy carefully before using Seevak Care.
        </p>
      </div>

      {/* Table of contents */}
      <div className="card border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Contents</p>
        <ol className="space-y-1">
          {TOC.map((item, i) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-sm text-sky-600 hover:underline">
                {i + 1}. {item.label}
              </a>
            </li>
          ))}
        </ol>
      </div>

      {/* Sections */}
      <Section id="information-collected" title="1. Information We Collect">
        <p><strong>Personal Information:</strong> When you register or use Seevak Care, we collect your name, email address, mobile phone number, date of birth, gender, and profile details you choose to provide.</p>
        <p><strong>Medical &amp; Health Information:</strong> To facilitate healthcare services, we collect and process health-related information including appointment details, prescriptions issued by doctors, diagnostic test bookings and results, and medicine orders. This information is shared only with the healthcare providers you engage with.</p>
        <p><strong>Payment Information:</strong> Payments are processed by Razorpay, a PCI-DSS compliant payment gateway. We do not store your card details, UPI credentials, or net banking passwords. We receive transaction identifiers, payment status, and order reference numbers from Razorpay to confirm and record your payments.</p>
        <p><strong>Usage &amp; Technical Data:</strong> We automatically collect certain technical information including your IP address, browser type, device information, pages visited, and time spent on the platform to improve service quality and security.</p>
        <p><strong>OTP &amp; Authentication Data:</strong> We send One-Time Passwords (OTPs) to your registered phone number and email for identity verification. OTPs are not stored after use.</p>
      </Section>

      <Section id="how-we-use" title="2. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>To create and maintain your account and authenticate your identity</li>
          <li>To facilitate doctor appointments, hospital visits, lab bookings, and medicine orders</li>
          <li>To generate and deliver digital prescriptions and lab reports in PDF format</li>
          <li>To process payments and manage EMI plans through Razorpay</li>
          <li>To send appointment reminders, order updates, and OTP notifications via SMS and email</li>
          <li>To calculate accurate pricing including GST and delivery charges</li>
          <li>To resolve disputes, respond to grievances, and enforce our policies</li>
          <li>To comply with applicable Indian laws and regulations including the Digital Personal Data Protection Act, 2023</li>
          <li>To analyse usage patterns and improve the platform (using aggregated, anonymised data)</li>
        </ul>
        <p>We do not use your data for unsolicited marketing without your explicit consent.</p>
      </Section>

      <Section id="information-sharing" title="3. Information Sharing">
        <p>We do not sell, rent, or trade your personal information to third parties. We share your information only in the following circumstances:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Healthcare Providers:</strong> Doctors, hospitals, and labs you book with receive the information required to deliver care (e.g., your name, contact details, appointment purpose, prescription).</li>
          <li><strong>Payment Processors:</strong> Razorpay receives transaction data necessary to process payments. Razorpay&apos;s own privacy policy governs their data practices.</li>
          <li><strong>Communication Services:</strong> Third-party SMTP and SMS providers may process your email address or phone number solely to deliver OTPs, confirmations, and appointment reminders.</li>
          <li><strong>Legal Requirements:</strong> We may disclose your information to law enforcement, courts, or government authorities when required by law or to protect the rights and safety of our users.</li>
          <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale, your data may be transferred to the successor entity, who will be bound by this Privacy Policy.</li>
        </ul>
      </Section>

      <Section id="data-security" title="4. Data Security">
        <p>We implement industry-standard technical and organisational measures to protect your information:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>All data is transmitted over HTTPS (TLS encryption)</li>
          <li>Passwords are hashed using bcrypt and never stored in plain text</li>
          <li>OTP-based authentication adds a second layer of identity verification</li>
          <li>Access to health data is role-restricted — only relevant healthcare providers and platform administrators can view records pertaining to their scope</li>
          <li>Payment data is handled exclusively by Razorpay&apos;s PCI-DSS compliant infrastructure</li>
        </ul>
        <p>Despite these measures, no system is 100% secure. Please notify us immediately at <a href="mailto:seevakcare@gmail.com" className="text-sky-600 underline">seevakcare@gmail.com</a> if you suspect unauthorised access to your account.</p>
      </Section>

      <Section id="data-retention" title="5. Data Retention">
        <p>We retain your personal data for as long as your account is active or as needed to provide services. Medical records and prescription data are retained for a minimum of 7 years in compliance with applicable healthcare regulations in India.</p>
        <p>Payment records are retained as required under the GST Act and Income Tax Act. Upon account deletion, we will anonymise or delete personal data within 90 days, except where retention is required by law.</p>
      </Section>

      <Section id="your-rights" title="6. Your Rights">
        <p>Under the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable Indian law, you have the following rights:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete data</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your data where it is no longer necessary</li>
          <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for processing where consent is the legal basis</li>
          <li><strong>Right to Grievance Redressal:</strong> Lodge a complaint with our Grievance Officer (details below)</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href="mailto:seevakcare@gmail.com" className="text-sky-600 underline">seevakcare@gmail.com</a>. We will respond within 30 days.</p>
      </Section>

      <Section id="cookies" title="7. Cookies &amp; Tracking">
        <p>Seevak Care uses session cookies for authentication purposes (to keep you logged in securely). We do not use third-party advertising cookies or tracking pixels.</p>
        <p>You can configure your browser to refuse cookies, but this may affect your ability to use certain features of the platform, including staying logged in.</p>
      </Section>

      <Section id="third-party" title="8. Third-Party Services">
        <p>Our platform integrates with the following third-party services, each governed by their own privacy policies:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Razorpay</strong> – Payment processing (razorpay.com/privacy)</li>
          <li><strong>Vercel Blob Storage</strong> – Prescription and document upload storage</li>
          <li><strong>SMTP Email Providers</strong> – Transactional email delivery</li>
        </ul>
        <p>We encourage you to review the privacy policies of these third-party services.</p>
      </Section>

      <Section id="children" title="9. Children's Privacy">
        <p>Seevak Care is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a minor has registered on our platform, contact us immediately and we will delete the account and associated data.</p>
      </Section>

      <Section id="changes" title="10. Changes to This Policy">
        <p>We may update this Privacy Policy periodically to reflect changes in our practices or applicable law. When we make material changes, we will notify you via email or a prominent in-app notice at least 7 days before the changes take effect.</p>
        <p>Your continued use of Seevak Care after the effective date of the revised policy constitutes your acceptance of the changes.</p>
      </Section>

      <Section id="contact" title="11. Contact &amp; Grievance Redressal">
        <p>For privacy-related queries or to exercise your rights, contact our Grievance Officer:</p>
        <div className="bg-sky-50 rounded-xl border border-sky-100 p-4 space-y-1">
          <p><strong>Company:</strong> Radius Care Well India Private Limited</p>
          <p><strong>Address:</strong> 1448, Chunabhatti, Naka N8 Ward No 14, Darbhanga-846009, Bihar, India</p>
          <p><strong>Email:</strong> <a href="mailto:seevakcare@gmail.com" className="text-sky-600 underline">seevakcare@gmail.com</a></p>
          <p><strong>Phone:</strong> <a href="tel:+919771365160" className="text-sky-600 underline">+91 9771365160</a></p>
          <p className="text-xs text-slate-500 mt-2">We will acknowledge your complaint within 48 hours and resolve it within 30 days.</p>
        </div>
      </Section>

      {/* Footer links */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Link href="/terms-and-conditions" className="btn-secondary text-xs">Terms & Conditions</Link>
        <Link href="/refund-policy"        className="btn-secondary text-xs">Refund Policy</Link>
        <Link href="/contact-us"           className="btn-secondary text-xs">Contact Us</Link>
      </div>
    </div>
  );
}
