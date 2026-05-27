import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions — Seevak Care",
  description: "Terms and conditions governing use of the Seevak Care platform.",
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
  { id: "acceptance",         label: "Acceptance of Terms" },
  { id: "platform",           label: "Platform Description" },
  { id: "accounts",           label: "User Accounts" },
  { id: "services",           label: "Services & Bookings" },
  { id: "payments",           label: "Payments & Billing" },
  { id: "medical-disclaimer", label: "Medical Disclaimer" },
  { id: "user-obligations",   label: "User Obligations" },
  { id: "intellectual",       label: "Intellectual Property" },
  { id: "liability",          label: "Limitation of Liability" },
  { id: "termination",        label: "Termination" },
  { id: "governing-law",      label: "Governing Law & Jurisdiction" },
  { id: "changes",            label: "Changes to Terms" },
  { id: "contact",            label: "Contact" },
];

export default function TermsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card bg-gradient-to-br from-sky-50 to-white border-sky-100">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms &amp; Conditions</h1>
        <p className="text-slate-500 text-sm">
          <strong>Effective Date:</strong> 1 January 2025 &nbsp;·&nbsp;
          <strong>Last Updated:</strong> 27 May 2026
        </p>
        <p className="text-slate-600 text-sm mt-3 leading-relaxed">
          These Terms &amp; Conditions ("Terms") govern your access to and use of the Seevak Care
          platform, operated by <strong>Radius Care Well India Private Limited</strong>
          {" "}("Company", "we", "our", or "us"). By registering or using Seevak Care, you agree to
          be bound by these Terms. If you disagree with any part, you must discontinue use immediately.
        </p>
      </div>

      {/* TOC */}
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
      <Section id="acceptance" title="1. Acceptance of Terms">
        <p>By accessing or using the Seevak Care platform (website, mobile application, or API), you confirm that you are at least 18 years of age, have the legal capacity to enter into a binding agreement, and agree to comply with these Terms and our <Link href="/privacy-policy" className="text-sky-600 underline">Privacy Policy</Link>.</p>
        <p>These Terms constitute the entire agreement between you and the Company regarding your use of the platform, superseding any prior agreements.</p>
      </Section>

      <Section id="platform" title="2. Platform Description">
        <p>Seevak Care is a digital health technology platform that enables:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Booking appointments with registered doctors</li>
          <li>Accessing hospital departments and services</li>
          <li>Booking diagnostic lab tests with home sample collection</li>
          <li>Ordering prescription medicines with home delivery</li>
          <li>Receiving and storing digital prescriptions</li>
          <li>Tracking health records, orders, and payments via a unified dashboard</li>
          <li>Flexible payment options including EMI plans</li>
        </ul>
        <p>Seevak Care is a technology intermediary. The Company is not a healthcare provider, medical institution, pharmacy, or diagnostic laboratory. All healthcare services are rendered by the independent providers registered on the platform.</p>
      </Section>

      <Section id="accounts" title="3. User Accounts">
        <p><strong>Registration:</strong> You must register with accurate and complete information. You are responsible for maintaining the confidentiality of your login credentials (including OTPs).</p>
        <p><strong>Account Security:</strong> Notify us immediately at <a href="mailto:seevakcare@gmail.com" className="text-sky-600 underline">seevakcare@gmail.com</a> if you suspect unauthorised access to your account. The Company is not liable for losses resulting from your failure to maintain account security.</p>
        <p><strong>One Account:</strong> Each individual may maintain only one account. Accounts are non-transferable.</p>
        <p><strong>Roles:</strong> The platform supports four account roles — Patient, Doctor, Hospital Admin, and Lab/Store Manager. Each role has access only to features and data relevant to their function.</p>
      </Section>

      <Section id="services" title="4. Services &amp; Bookings">
        <p><strong>Appointments:</strong> Booking an appointment does not guarantee attendance of a specific doctor. In case of doctor unavailability, we will offer you a reschedule or full refund per our <Link href="/refund-policy" className="text-sky-600 underline">Refund Policy</Link>.</p>
        <p><strong>Lab Tests:</strong> Lab bookings require OTP verification by the sample collection agent before the service is activated for payment.</p>
        <p><strong>Medicine Orders:</strong> Medicines are dispensed only against valid prescriptions. Delivery is subject to availability and the service area of the partnered pharmacy. We do not guarantee specific delivery timelines.</p>
        <p><strong>Hospital Services:</strong> Services listed are for informational purposes. Actual availability, pricing, and admission are subject to the policies of the individual hospital.</p>
      </Section>

      <Section id="payments" title="5. Payments &amp; Billing">
        <p><strong>Payment Gateway:</strong> All payments are processed securely by <strong>Razorpay</strong> (Razorpay Software Private Limited). By making a payment on Seevak Care, you also agree to Razorpay&apos;s terms of service and privacy policy.</p>
        <p><strong>Pricing:</strong> All prices are displayed in Indian Rupees (INR) and are inclusive of applicable GST (5% on medicines; platform service charges as applicable). Delivery charges are added separately where applicable.</p>
        <p><strong>EMI Plans:</strong> EMI options are available at an annual interest rate as disclosed at the time of selection. The first instalment activates the service; remaining instalments are due monthly. Failure to pay subsequent instalments does not entitle you to a refund of completed services.</p>
        <p><strong>Refunds:</strong> Refund eligibility is governed by our <Link href="/refund-policy" className="text-sky-600 underline">Refund &amp; Cancellation Policy</Link>. Refunds are credited to the original payment method within 5–7 business days.</p>
        <p><strong>Failed Transactions:</strong> If a payment fails after debiting your bank account, the amount will typically be reversed by your bank within 5–7 business days. Contact us if the refund does not appear.</p>
      </Section>

      <Section id="medical-disclaimer" title="6. Medical Disclaimer">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-semibold text-amber-800 mb-2">Important Notice</p>
          <p className="text-amber-700">Seevak Care is a technology platform, NOT a medical provider. Content on the platform — including service descriptions, pricing, and doctor profiles — is for informational purposes only and does not constitute medical advice, diagnosis, or treatment.</p>
        </div>
        <p>Always seek the advice of a qualified healthcare professional for medical decisions. In case of a medical emergency, call <strong>108</strong> (national emergency ambulance service).</p>
        <p>The Company does not endorse any specific doctor, hospital, or lab on the platform. Patient outcomes and quality of care are the responsibility of the individual healthcare providers.</p>
      </Section>

      <Section id="user-obligations" title="7. User Obligations">
        <p>You agree that you will:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Provide accurate personal and medical information when required</li>
          <li>Use the platform only for lawful purposes and in accordance with these Terms</li>
          <li>Not misuse OTPs or attempt to impersonate another user or healthcare provider</li>
          <li>Not upload or share false prescriptions or medical documents</li>
          <li>Not attempt to circumvent the platform&apos;s security, authentication, or payment systems</li>
          <li>Not use automated scripts, bots, or crawlers to access the platform without written permission</li>
          <li>Respect the privacy and confidentiality of other users&apos; health information</li>
        </ul>
        <p>The Company reserves the right to suspend or terminate accounts that violate these obligations, with or without prior notice.</p>
      </Section>

      <Section id="intellectual" title="8. Intellectual Property">
        <p>All content on Seevak Care — including the brand name, logo, software, design, text, and data structures — is the exclusive property of Radius Care Well India Private Limited and is protected by Indian intellectual property law.</p>
        <p>You are granted a limited, non-exclusive, non-transferable licence to access and use the platform for its intended purpose. You may not copy, modify, distribute, sell, or reverse-engineer any part of the platform without express written consent.</p>
      </Section>

      <Section id="liability" title="9. Limitation of Liability">
        <p>To the maximum extent permitted by applicable law:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>The Company is not liable for the quality, accuracy, or outcome of healthcare services provided by independent doctors, hospitals, or labs on the platform</li>
          <li>The Company is not liable for any indirect, incidental, consequential, or punitive damages arising from your use of the platform</li>
          <li>The Company&apos;s total liability for any claim is limited to the amount actually paid by you for the specific service giving rise to the claim</li>
          <li>The Company is not responsible for third-party payment gateway failures, network outages, or force majeure events</li>
        </ul>
      </Section>

      <Section id="termination" title="10. Termination">
        <p><strong>By You:</strong> You may delete your account at any time by contacting <a href="mailto:seevakcare@gmail.com" className="text-sky-600 underline">seevakcare@gmail.com</a>. Pending orders or bookings must be resolved before deletion.</p>
        <p><strong>By Us:</strong> We may suspend or permanently terminate your account if you breach these Terms, engage in fraudulent activity, or for any other reason at our sole discretion, with or without notice. Outstanding payments remain due.</p>
        <p>Upon termination, your right to access the platform immediately ceases. Provisions regarding payment obligations, intellectual property, and limitation of liability survive termination.</p>
      </Section>

      <Section id="governing-law" title="11. Governing Law &amp; Jurisdiction">
        <p>These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in <strong>Darbhanga, Bihar, India</strong>.</p>
        <p>For consumer disputes under the Consumer Protection Act, 2019, you may also approach the appropriate Consumer Disputes Redressal Forum.</p>
      </Section>

      <Section id="changes" title="12. Changes to Terms">
        <p>We reserve the right to modify these Terms at any time. Material changes will be notified to registered users via email and/or in-app notice at least 7 days before taking effect. Continued use of the platform after the effective date constitutes acceptance of the revised Terms.</p>
      </Section>

      <Section id="contact" title="13. Contact">
        <p>For questions about these Terms:</p>
        <div className="bg-sky-50 rounded-xl border border-sky-100 p-4 space-y-1">
          <p><strong>Radius Care Well India Private Limited</strong></p>
          <p>1448, Chunabhatti, Naka N8 Ward No 14, Darbhanga-846009, Bihar, India</p>
          <p><a href="mailto:seevakcare@gmail.com" className="text-sky-600 underline">seevakcare@gmail.com</a></p>
          <p><a href="tel:+919771365160" className="text-sky-600 underline">+91 9771365160</a></p>
        </div>
      </Section>

      {/* Footer links */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Link href="/privacy-policy"  className="btn-secondary text-xs">Privacy Policy</Link>
        <Link href="/refund-policy"   className="btn-secondary text-xs">Refund Policy</Link>
        <Link href="/contact-us"      className="btn-secondary text-xs">Contact Us</Link>
      </div>
    </div>
  );
}
