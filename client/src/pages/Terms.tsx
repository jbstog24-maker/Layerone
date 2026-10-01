import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Acceptance",
    body: [
      "By accessing or using layeronestaging.com (the \"Site\"), you agree to these Terms & Conditions. If you do not agree, do not use the Site.",
      "These terms cover use of the website only. Actual staging, kitting, and logistics engagements are governed by a signed Master Services Agreement (\"MSA\") and accepted proposal — where those conflict with these website terms, the MSA and proposal control.",
    ],
  },
  {
    title: "Services & Quotes",
    body: [
      "Layer One Staging provides IT equipment staging, kitting, inventory, and deployment-logistics services for businesses in Dallas–Fort Worth and nationwide.",
      "Pricing shown on the Site (including per-pallet receiving and storage rates) is informational and may change. A quote request is not a booking — pricing becomes binding only in an accepted written proposal.",
      "Project quotes are scoped from the details you provide (locations, devices, services, schedule). Inaccurate information may change the final price.",
    ],
  },
  {
    title: "Payment Terms (Summary)",
    body: [
      "Storage is billed monthly in advance. Project, kitting, and staging labor are due as stated in the proposal — typically a 50% deposit at signing, with the balance due before equipment ships or is released. First-time engagements may require full payment before work begins.",
      "Invoices for overages, add-ons, or extended storage are due Net 15. Full payment terms are in the Master Services Agreement you sign before work starts.",
    ],
  },
  {
    title: "Acceptable Use",
    body: [
      "You agree not to misuse the Site: no submitting false quote requests, no attempting to access other customers' portal data, no scraping or automated harvesting, and no activity that disrupts the Site or violates any law.",
      "Portal accounts are for the registered customer only. You are responsible for keeping your login credentials confidential.",
    ],
  },
  {
    title: "Intellectual Property",
    body: [
      "The Site's content, branding, and design are the property of Layer One Staging and may not be copied or reused without permission. Your equipment, data, and configurations remain yours at all times.",
    ],
  },
  {
    title: "Limitation of Liability",
    body: [
      "The Site is provided \"as is\" without warranties of any kind. To the maximum extent allowed by law, Layer One Staging is not liable for indirect, incidental, or consequential damages arising from use of the Site.",
      "Liability for paid services is governed by the Master Services Agreement, which caps total liability and requires customers to insure their equipment while in our care.",
    ],
  },
  {
    title: "Governing Law",
    body: [
      "These terms are governed by the laws of the State of Texas. Any dispute will be resolved in the state or federal courts located in Texas.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update these terms from time to time; the current version will always be posted here with its effective date. Continued use of the Site after changes means you accept them.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions about these terms: info@layeronestaging.com — Layer One Staging, Dallas–Fort Worth, TX.",
    ],
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#b7c5d5] hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-extrabold mb-2">Terms &amp; Conditions</h1>
        <p className="text-[#b7c5d5] text-sm mb-10">Effective: October 1, 2026 · Layer One Staging</p>
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
          <Link href="/privacy" className="text-[#0A84FF] hover:underline">Privacy Policy</Link>
          <Link href="/" className="text-[#b7c5d5] hover:text-white">Home</Link>
        </div>
      </div>
    </div>
  );
}
