import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Information We Collect",
    body: [
      "Contact and business information you provide through our quote request forms, such as your name, company, email address, phone number, and project details (locations, equipment types, schedules).",
      "Account information you provide when registering for the customer portal, such as your name, email address, and password (stored securely as a hash - we never see your password).",
      "Support and project communications, including messages you send through the portal and emails to info@layeronestaging.com.",
      "Payment information is processed securely by our payment provider, Stripe. We do not store full credit card numbers on our servers.",
      "Basic technical information collected automatically, such as IP address, browser type, and pages visited, used for security and to keep the site running reliably.",
    ],
  },
  {
    title: "How We Use Your Information",
    body: [
      "To prepare and deliver quotes, proposals, and staging/logistics services you request.",
      "To communicate with you about your projects, invoices, shipments, and support requests.",
      "To operate and improve our website and customer portal, and to protect against fraud and abuse.",
      "We do not sell your personal information to anyone, and we do not share it with third parties for their marketing.",
    ],
  },
  {
    title: "Service Providers",
    body: [
      "We use a small number of trusted providers to operate the site: Render (hosting), TiDB Cloud (database), Resend (transactional email), and Stripe (payment processing). Each processes only the data needed to perform its function and is bound by its own privacy obligations.",
    ],
  },
  {
    title: "Data Security & Retention",
    body: [
      "We use commercially reasonable safeguards - encrypted connections (HTTPS), hashed passwords, and restricted administrative access - to protect your information. No method of transmission over the internet is completely secure, so we cannot guarantee absolute security.",
      "We keep quote inquiries, project records, and messages for as long as needed to operate the business and meet legal obligations. You may request deletion of your personal information at any time (see Contact below); some records may be retained where the law requires it.",
    ],
  },
  {
    title: "Your Choices",
    body: [
      "You may request a copy, correction, or deletion of your personal information by emailing info@layeronestaging.com. We will respond within a reasonable time.",
      "Marketing emails, if any, will always include a way to opt out. Transactional messages about your active projects are not marketing and cannot be opted out of while work is in progress.",
    ],
  },
  {
    title: "Children",
    body: [
      "This site is a business-to-business service and is not directed at children under 13. We do not knowingly collect information from children.",
    ],
  },
  {
    title: "Changes to This Policy",
    body: [
      "If we change this policy, we will post the updated version here with a new effective date. Continued use of the site after changes means you accept the updated policy.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions about this policy: info@layeronestaging.com - Layer One Staging, Dallas–Fort Worth, TX.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#b7c5d5] hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-extrabold mb-2">Privacy Policy</h1>
        <p className="text-[#b7c5d5] text-sm mb-10">Effective: October 1, 2026 · Layer One Staging</p>
        <p className="text-[#d7e1ec] leading-relaxed mb-8">
          Layer One Staging ("we", "us") provides IT equipment staging, kitting, and deployment-logistics
          services. This policy explains what information we collect through layeronestaging.com and how we use it.
        </p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="mb-8">
            <h2 className="text-xl font-bold mb-3 text-white">{s.title}</h2>
            <ul className="space-y-2.5">
              {s.body.map((p, i) => (
                <li key={i} className="text-[#b7c5d5] leading-relaxed text-[15px]">{p}</li>
              ))}
            </ul>
          </section>
        ))}
        <div className="pt-8 border-t border-white/10 flex gap-6 text-sm">
          <Link href="/terms" className="text-[#0A84FF] hover:underline">Terms &amp; Conditions</Link>
          <Link href="/" className="text-[#b7c5d5] hover:text-white">Home</Link>
        </div>
      </div>
    </div>
  );
}
