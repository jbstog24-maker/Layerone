import { useLocation } from "wouter";
import { ArrowRight, CheckCircle, Info, Phone, Zap } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NavBar, Footer } from "./Landing";

function Packages() {
  const [, setLocation] = useLocation();
  // Detail values pulled from server/stripe-products.ts TIER_PRICING descriptions.
  const tiers = [
    {
      name: "Basic",
      price: "$499",
      priceSuffix: "/project",
      desc: "First-time customers testing the service on a small deployment.",
      features: ["One project, up to 14 days", "Up to 5 active devices", "Up to 5 boxes received", "No pallet storage included", "Intake photos & serial/MAC capture", "1 outbound shipment coordination", "Staging labor billed separately"],
      featured: false,
      details: {
        billing: "One-time · $499 per project",
        devices: "Up to 5 active devices",
        boxes: "Up to 5 boxes received",
        pallets: "Not included",
        storage: "14-day project window",
        shipments: "1 outbound shipment coordination",
      },
    },
    {
      name: "Standard",
      price: "$750",
      priceSuffix: "/month starting",
      desc: "Light recurring receiving, organization, and short-term storage.",
      features: ["Up to 10 active devices stored", "Up to 10 boxes/month", "Up to 1 pallet/month", "30-day storage per item", "3 outbound shipment coordinations/mo", "Monthly usage summary"],
      featured: false,
      details: {
        billing: "Monthly · $750/mo",
        devices: "Up to 10 active devices",
        boxes: "Up to 10 boxes / month",
        pallets: "Up to 1 pallet / month",
        storage: "30-day storage per item",
        shipments: "3 outbound shipment coordinations / mo",
      },
    },
    {
      name: "Professional",
      price: "$1,500",
      priceSuffix: "/month starting",
      desc: "Recurring deployment work with more receiving volume and organized staging capacity.",
      features: ["Up to 25 active devices stored", "Up to 30 boxes/month", "Up to 3 pallets/month", "30-day storage per item", "8 outbound shipment coordinations/mo", "Dock/ramp coordination available"],
      featured: true,
      details: {
        billing: "Monthly · $1,500/mo",
        devices: "Up to 25 active devices",
        boxes: "Up to 30 boxes / month",
        pallets: "Up to 3 pallets / month",
        storage: "30-day storage per item",
        shipments: "8 outbound shipment coordinations / mo",
      },
    },
    {
      name: "Enterprise",
      price: "$3,500",
      priceSuffix: "/month starting",
      desc: "Dedicated staging zone with higher volume and a dedicated LayerOne-managed workflow.",
      features: ["Up to 75 active devices stored", "Up to 75 boxes/month", "Up to 6 pallets/month", "45-day storage per item", "20 outbound shipment coordinations/mo", "Weekly inventory report + 1 project call/mo"],
      featured: false,
      details: {
        billing: "Monthly · $3,500/mo",
        devices: "Up to 75 active devices",
        boxes: "Up to 75 boxes / month",
        pallets: "Up to 6 pallets / month",
        storage: "45-day storage per item",
        shipments: "20 outbound shipment coordinations / mo",
      },
    },
    {
      name: "Custom",
      price: "Custom",
      priceSuffix: "/project or month",
      desc: "Multi-site deployments, national rollouts, POS, security, and franchise tech rollouts.",
      features: ["Up to 150 active devices stored", "Up to 200 boxes/month", "Up to 20 pallets/month", "60-day storage per item", "50 outbound shipment coordinations/mo", "Chain-of-custody tracking & custom labor"],
      featured: false,
      details: {
        billing: "Monthly · $5,000/mo base (custom-quoted)",
        devices: "Up to 150 active devices",
        boxes: "Up to 200 boxes / month",
        pallets: "Up to 20 pallets / month",
        storage: "60-day storage per item",
        shipments: "50 outbound shipment coordinations / mo",
      },
    },
  ];

  return (
    <section id="packages" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Project-quote lead-in */}
        <div className="relative rounded-3xl border border-[#0A84FF]/30 bg-gradient-to-br from-[#0A84FF]/10 to-white/[0.03] p-8 md:p-10 mb-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 left-1/3 w-[400px] h-[200px] rounded-full bg-[#0A84FF]/10 blur-[70px]" />
          </div>
          <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">Project-based &amp; volume pricing</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-[-1.5px] text-white mb-3">
                Every rollout is quoted as a project.
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                Tell us the number of locations, devices, services required, storage needs, and deployment schedule - we&apos;ll build a staging and logistics quote around your rollout. Volume discounts apply: per-device and per-site rates come down as quantities scale, itemized in your quote. Prefer it simple? Our per-pallet path is $12/pallet receiving and $30/pallet/month storage, plus the services you pick.
              </p>
            </div>
            <a
              href="/get-started"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)] whitespace-nowrap"
            >
              Request a Project Quote <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">Managed service packages</h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Our package tiers are starting frameworks for recurring work - most multi-site projects are custom-quoted. Every package includes full portal access, photo documentation, and transparent billing.
          </p>
        </div>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {tiers.map(t => (
            <div
              key={t.name}
              className={`rounded-2xl border p-5 flex flex-col transition-all ${
                t.featured
                  ? "border-[#0A84FF]/50 bg-gradient-to-b from-[#0A84FF]/10 to-white/5 shadow-[0_20px_60px_rgba(10,132,255,0.15)]"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              {t.featured && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/30 text-[#5eb2ff] text-xs font-bold mb-3 self-start">
                  <Zap className="w-3 h-3" /> Most Popular
                </div>
              )}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-lg font-black text-white">{t.name}</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${t.name} package details`}
                      className="shrink-0 p-1.5 rounded-full text-slate-400 hover:text-[#0A84FF] hover:bg-[#0A84FF]/10 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-72 max-w-[calc(100vw-2rem)] bg-[#0B1320] border border-white/10 rounded-xl p-4 shadow-2xl"
                  >
                    <p className="text-sm font-bold text-white mb-1">{t.name} - what's included</p>
                    <p className="text-xs text-[#0A84FF] font-semibold mb-3">{t.details.billing}</p>
                    <dl className="space-y-2 text-xs">
                      {[
                        ["Devices", t.details.devices],
                        ["Boxes", t.details.boxes],
                        ["Pallets", t.details.pallets],
                        ["Storage", t.details.storage],
                        ["Outbound", t.details.shipments],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-3">
                          <dt className="text-slate-500 shrink-0">{label}</dt>
                          <dd className="text-slate-200 text-right">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 pt-3 border-t border-white/10 text-[11px] leading-relaxed text-slate-500">
                      Anything beyond the included limits bills as an overage at our published add-on rates.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="mb-3">
                <span className="text-2xl font-black text-[#0A84FF]">{t.price}</span>
                <span className="text-xs text-slate-400 ml-1">{t.priceSuffix}</span>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{t.desc}</p>
              <ul className="space-y-2 flex-1 mb-5">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setLocation(`/packages/${t.name.toLowerCase()}`)}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  t.featured
                    ? "bg-[#0A84FF] text-white hover:bg-[#3d9dff]"
                    : "border border-white/15 bg-white/5 text-white hover:border-white/30"
                }`}
              >
                Get Started <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Pricing note */}
        <p className="mt-6 text-xs text-slate-500 text-center">
          Final pricing depends on selected DFW facility, storage footprint, receiving volume, and exact work scope. 3, 6, or 12-month terms available.
        </p>
      </div>
    </section>
  );
}

function AddOns() {
  const addons = [
    {
      item: "Extra device stored",
      rate: "$15–$25/device/mo",
      note: "When stored device count exceeds package limit",
      points: [
        "Applies when your stored device count goes over your package's included limit.",
        "Secure, inventoried storage with full visibility in your client portal.",
        "Billed monthly per device - only for devices above your included limit.",
      ],
    },
    {
      item: "Extra parcel received",
      rate: "$5–$10/box",
      note: "Includes intake logging, photos & project assignment",
      points: [
        "Applies to inbound parcels beyond your package's included allowance.",
        "Receiving inspection, photo documentation, portal logging, and assignment to your project.",
        "Billed per box received.",
      ],
    },
    {
      item: "Extra pallet",
      rate: "$25–$40/pallet",
      note: "Rate depends on facility, size, handling & storage duration",
      points: [
        "Applies to pallets received or stored beyond your included allowance.",
        "Forklift receiving, inspection, and secure floor or rack storage.",
        "Billed per pallet - final rate depends on facility, size, handling, and duration.",
      ],
    },
    {
      item: "Extended storage",
      rate: "$2–$5/day",
      note: "After included duration: 14d Pilot · 30d Shelf/Bay · 45d Dedicated · 60d Rollout",
      points: [
        "Applies when gear stays in storage past your package's included window: 14 days (Pilot), 30 days (Shelf/Bay), 45 days (Dedicated), 60 days (Rollout).",
        "Keeps your equipment secure and inventoried while you finalize deployment dates.",
        "Billed per day until the gear ships or the project closes.",
      ],
    },
    {
      item: "Extra outbound shipment",
      rate: "$20–$35/shipment",
      note: "Packing coordination, labels, carrier handoff & documentation",
      points: [
        "Applies to outbound shipments beyond your package's included allowance.",
        "Packing coordination, shipping labels, carrier handoff, and shipment documentation.",
        "Billed per shipment.",
      ],
    },
    {
      item: "Inventory & asset capture",
      rate: "$15/device",
      note: "Model, serial, MAC address, asset photo & inventory log",
      points: [
        "Per-device service available on any package.",
        "Captures model, serial number, MAC address, asset photo, and inventory log entry.",
        "Billed once per device.",
      ],
    },
    {
      item: "Site-kit assembly",
      rate: "$250+/site kit",
      note: "Up to 2 hrs staging labor, QA checklist & photo docs - devices, patch cables, labels, packing list & install notes",
      points: [
        "Fixed-price kit build for a single site deployment.",
        "Up to 2 hours of staging labor, QA checklist, and photo documentation.",
        "Includes devices, patch cables, labels, packing list, and install notes.",
        "Billed per site kit.",
      ],
    },
    {
      item: "Layer One staging technician",
      rate: "$95–$125/hr",
      note: "Labeling, firmware checks, packing, site-kit prep & approved staging tasks",
      points: [
        "Hands-on staging labor: labeling, firmware checks, packing, site-kit prep, and other approved staging tasks.",
        "Work is approved by you before it starts.",
        "Billed by the hour.",
      ],
    },
    {
      item: "Senior network technician",
      rate: "$135–$175/hr",
      note: "Switch, firewall, VLAN, VPN, IP plan & deployment readiness review",
      points: [
        "Engineering-level work: switch and firewall configuration, VLANs, VPN, IP planning, and deployment readiness review.",
        "Scoped and approved by you before work starts.",
        "Billed by the hour.",
      ],
    },
    {
      item: "Rush / weekend / after-hours",
      rate: "1.5×–2× rate",
      note: "Minimum labor block may apply",
      points: [
        "Expedited turnaround when your timeline can't wait for standard scheduling.",
        "Applies a 1.5×–2× multiplier to the standard labor rate.",
        "A minimum labor block may apply - confirmed with you before work starts.",
      ],
    },
  ];

  return (
    <section id="addons" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">Overages &amp; add-on services</h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Package limits keep pricing predictable. Any volume or work outside the included allowance is billed as an overage or add-on after approval. On large rollouts, per-device and per-site rates are discounted by volume - your project quote will show the scaled pricing.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-3 bg-white/10 px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Service / Overage</span>
            <span>Starting Rate</span>
            <span>Notes</span>
          </div>
          {addons.map((a, i) => (
            <div
              key={a.item}
              className={`grid grid-cols-3 px-5 py-4 text-sm gap-4 ${
                i % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"
              } border-t border-white/10`}
            >
              <span className="font-semibold text-white flex items-center gap-1.5">
                {a.item}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${a.item} details`}
                      className="shrink-0 p-1 rounded-full text-slate-500 hover:text-[#0A84FF] hover:bg-[#0A84FF]/10 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-72 max-w-[calc(100vw-2rem)] bg-[#0B1320] border border-white/10 rounded-xl p-4 shadow-2xl"
                  >
                    <p className="text-sm font-bold text-white mb-1">{a.item}</p>
                    <p className="text-xs text-[#0A84FF] font-semibold mb-3">{a.rate}</p>
                    <ul className="space-y-2">
                      {a.points.map(p => (
                        <li key={p} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                          <span className="text-[#0A84FF] shrink-0">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 pt-3 border-t border-white/10 text-[11px] leading-relaxed text-slate-500">
                      All overages and add-ons are approved by you before they're billed.
                    </p>
                  </PopoverContent>
                </Popover>
              </span>
              <span className="text-[#0A84FF] font-bold">{a.rate}</span>
              <span className="text-slate-400 text-xs leading-relaxed">{a.note}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-5 py-4">
          <p className="text-amber-200 text-sm leading-relaxed">
            <span className="font-bold">Not included by default:</span> unlimited storage, unlimited dock usage, free packing materials, shipping carrier costs, advanced configuration labor, troubleshooting, disposal/recycling, or insurance for unusually high-value equipment - unless added in writing.
          </p>
        </div>
      </div>
    </section>
  );
}


function PricingCTA() {
  return (
    <section className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A84FF]/10 to-white/[0.04] p-12 text-center overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#0A84FF]/10 blur-[80px]" />
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-black tracking-[-1.5px] text-white mb-4">
              Ready to talk numbers?
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
              Send us your equipment list, site count, and deployment schedule. We will build a staging and logistics quote around your rollout.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="/get-started"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
              >
                Request a Project Quote <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="tel:+14695374378"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold border border-white/15 bg-white/5 text-white hover:border-white/30 transition-colors"
              >
                <Phone className="w-4 h-4" /> (469) 537-4378
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PackagesPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "radial-gradient(circle at top left, rgba(10,132,255,0.12) 0%, transparent 35%), linear-gradient(135deg, #0B1320, #0B1320)",
        color: "#f5f8fc",
      }}
    >
      <NavBar />
      <main className="pt-16">
        <Packages />
        <AddOns />
        <PricingCTA />
      </main>
      <Footer />
    </div>
  );
}
