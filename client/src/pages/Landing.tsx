import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Shield, Truck, Package, Warehouse, Box,
  ArrowRight, CheckCircle, ChevronRight, Zap, Lock,
  BarChart3, FileText, Camera, Activity,
  Thermometer, Video, MapPin, ChevronDown, Layers,
  Tags, ClipboardCheck, Send, Network, Users, Store,
  Server, Repeat,
} from "lucide-react";

const LOGO_URL = "/images/layerone-logo-on-dark.png";

function LayerOneLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={LOGO_URL}
      alt="Layer One Staging"
      className={className}
      style={{ height: 44, width: "auto" }}
    />
  );
}

function NavBar() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0B1320]/85 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" aria-label="Layer One Staging home">
          <LayerOneLogo />
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-400">
          <a href="#top" className="hover:text-white transition-colors">Home</a>
          <a href="#services" className="hover:text-white transition-colors">Services</a>
          <a href="#industries" className="hover:text-white transition-colors">Industries</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors"
            >
              Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <a
                href={getLoginUrl()}
                className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-2"
              >
                Sign In
              </a>
              <a
                href="/get-started"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors"
              >
                Get a Quote <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { isAuthenticated } = useAuth();
  return (
    <section id="top" className="relative pt-32 pb-24 overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[#0A84FF]/10 blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full bg-[#0A84FF]/5 blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-slate-400 text-xs mb-6">
              <span className="w-2 h-2 rounded-full bg-[#0A84FF] shadow-[0_0_0_5px_rgba(10,132,255,0.15)]" />
              Deployment Staging &amp; Warehouse Solutions — Carrollton, TX
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.02] tracking-[-2px] mb-6 text-white">
              Deployment Logistics.
              <br />
              <span className="text-[#0A84FF]">Staged. Tracked. Ready.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
              Professional receiving, staging, storage, kitting, and outbound logistics for technology deployments.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {isAuthenticated ? (
                <a
                  href="/dashboard"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <>
                  <a
                    href="/get-started"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
                  >
                    Get a Quote <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="#services"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold border border-white/15 bg-white/5 text-white hover:border-white/30 transition-colors"
                  >
                    View Our Services
                  </a>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {["Secure Receiving", "Staged & Organized", "Pack & Ship Nationwide"].map(b => (
                <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-400 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-[#0A84FF]" />{b}
                </span>
              ))}
            </div>
          </div>

          {/* Right — facility photo card */}
          <div className="relative hidden md:block">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
              <img
                src="/images/facility-corridor.jpg"
                alt="Layer One Staging secure warehouse corridor with organized client equipment"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1320]/95 via-[#0B1320]/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-sm font-bold text-white mb-1">Carrollton, TX Staging Facility</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Secure, camera-monitored units with dock access — your equipment received, organized, and staged under one roof.
                </p>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-[#0A84FF]/30 bg-[#0B1320]/95 backdrop-blur px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0A84FF]" />
                <span className="text-xs font-semibold text-white">Chain-of-custody tracking</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Every item logged from receipt to dispatch</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Services() {
  const services = [
    {
      icon: Truck,
      title: "Equipment Receiving & Inbound Documentation",
      desc: "We accept inbound freight on your behalf, count and inspect every pallet, box, and device, capture photos, and flag damage immediately.",
    },
    {
      icon: Warehouse,
      title: "Secure Short-Term Project Storage",
      desc: "Access-controlled, camera-monitored storage for project gear — isolated per client, organized on industrial racking.",
    },
    {
      icon: Layers,
      title: "Deployment Staging & Organization",
      desc: "Equipment sorted, configured, and staged to your exact project specifications so deployment day runs without surprises.",
    },
    {
      icon: Package,
      title: "Equipment Kitting & Site-by-Site Preparation",
      desc: "Site kits assembled per location — devices, patch cables, labels, packing lists, and install notes, ready to ship.",
    },
    {
      icon: Tags,
      title: "Asset Labeling / Inventory Tracking",
      desc: "Hierarchical tracking across pallets, boxes, and individual devices with QR-ready IDs and real-time status.",
    },
    {
      icon: ClipboardCheck,
      title: "QA / Deployment-Readiness Verification",
      desc: "Firmware checks, serial/MAC capture, and readiness review before anything leaves the dock.",
    },
    {
      icon: Send,
      title: "Pack-and-Ship / Forward Logistics",
      desc: "Professional packing and outbound dispatch to your sites nationwide, with carrier tracking and delivery confirmation.",
    },
    {
      icon: Camera,
      title: "Photo Documentation & Customer Visibility",
      desc: "Every step photographed — inbound condition, staging progress, outbound packing — all visible in your customer portal.",
    },
  ];

  return (
    <section id="services" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">Our Services</span>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">
            End-to-end deployment logistics,<br />
            <span className="text-[#0A84FF]">handled before the truck rolls.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Layer One is a fully managed staging and logistics operation. We don&apos;t offer self-service — every project is handled by our warehouse team with full accountability.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map(s => (
            <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-[#0A84FF]/40 hover:bg-white/[0.07] transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/10 border border-[#0A84FF]/25 flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-[#0A84FF]" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Submit Expected Delivery", desc: "Log your inbound shipment details through the portal so we know what's coming." },
    { n: "02", title: "We Receive & Document", desc: "Our team receives, counts, photographs, and logs every pallet, box, and device." },
    { n: "03", title: "Stage to Your Specs", desc: "Devices are organized, labeled, kitted, and staged according to your project requirements." },
    { n: "04", title: "Pack & Ship Out", desc: "We pack outbound shipments and dispatch with full carrier tracking." },
    { n: "05", title: "Portal Visibility", desc: "Track every step in real-time through your customer portal — photos, status, and invoices included." },
  ];

  return (
    <section id="how-it-works" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">How it works</h2>
          <p className="text-slate-400 text-lg">A simple, transparent process from first shipment to final delivery.</p>
        </div>
        <div className="grid md:grid-cols-5 gap-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative rounded-2xl border border-white/10 bg-white/5 p-5">
              {i < steps.length - 1 && (
                <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 z-10" />
              )}
              <div className="w-8 h-8 rounded-lg bg-[#0A84FF] flex items-center justify-center text-white text-xs font-black mb-4">
                {s.n}
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Packages() {
  const [, setLocation] = useLocation();
  const tiers = [
    {
      name: "Basic",
      price: "$499",
      priceSuffix: "/project",
      desc: "First-time customers testing the service on a small deployment.",
      features: ["One project, up to 14 days", "Up to 5 active devices", "Up to 5 boxes received", "Intake photos & serial/MAC capture", "1 outbound shipment coordination", "Staging labor billed separately"],
      featured: false,
    },
    {
      name: "Standard",
      price: "$750",
      priceSuffix: "/month starting",
      desc: "Light recurring receiving, organization, and short-term storage.",
      features: ["Up to 10 active devices stored", "Up to 10 boxes/month", "Up to 1 pallet/month", "30-day storage per item", "3 outbound shipment coordinations/mo", "Monthly usage summary"],
      featured: false,
    },
    {
      name: "Professional",
      price: "$1,500",
      priceSuffix: "/month starting",
      desc: "Recurring deployment work with more receiving volume and organized staging capacity.",
      features: ["Up to 30 active devices stored", "Up to 25 boxes/month", "Up to 2 pallets/month", "30-day storage per item", "8 outbound shipment coordinations/mo", "Dock/ramp coordination available"],
      featured: true,
    },
    {
      name: "Enterprise",
      price: "$3,500",
      priceSuffix: "/month starting",
      desc: "Dedicated staging zone with higher volume and a dedicated LayerOne-managed workflow.",
      features: ["Up to 75 active devices stored", "Up to 75 boxes/month", "Up to 6 pallets/month", "45-day storage per item", "20 outbound shipment coordinations/mo", "Weekly inventory report + 1 project call/mo"],
      featured: false,
    },
    {
      name: "Custom",
      price: "Custom",
      priceSuffix: "/project or month",
      desc: "Multi-site deployments, national rollouts, POS, security, and franchise tech rollouts.",
      features: ["Up to 150 active devices stored", "Up to 200 boxes/month", "Up to 20 pallets/month", "60-day storage per item", "50 outbound shipment coordinations/mo", "Chain-of-custody tracking & custom labor"],
      featured: false,
    },
  ];

  return (
    <section id="packages" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">Managed service packages</h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Every package includes full portal access, photo documentation, and transparent billing. All pricing is custom — contact us for a quote.
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
              <h3 className="text-lg font-black text-white mb-1">{t.name}</h3>
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
    { item: "Extra device stored", rate: "$15–$25/device/mo", note: "When stored device count exceeds package limit" },
    { item: "Extra parcel received", rate: "$5–$10/box", note: "Includes intake logging, photos & project assignment" },
    { item: "Extra pallet", rate: "$25–$40/pallet", note: "Rate depends on facility, size, handling & storage duration" },
    { item: "Extended storage", rate: "$2–$5/day", note: "After included duration: 14d Pilot · 30d Shelf/Bay · 45d Dedicated · 60d Rollout" },
    { item: "Extra outbound shipment", rate: "$20–$35/shipment", note: "Packing coordination, labels, carrier handoff & documentation" },
    { item: "Inventory & asset capture", rate: "$15/device", note: "Model, serial, MAC address, asset photo & inventory log" },
    { item: "Site-kit assembly", rate: "$250+/site kit", note: "Up to 2 hrs staging labor, QA checklist & photo docs — devices, patch cables, labels, packing list & install notes" },
    { item: "Layer One staging technician", rate: "$95–$125/hr", note: "Labeling, firmware checks, packing, site-kit prep & approved staging tasks" },
    { item: "Senior network technician", rate: "$135–$175/hr", note: "Switch, firewall, VLAN, VPN, IP plan & deployment readiness review" },
    { item: "Rush / weekend / after-hours", rate: "1.5×–2× rate", note: "Minimum labor block may apply" },
  ];

  return (
    <section id="addons" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">Overages &amp; add-on services</h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Package limits keep pricing predictable. Any volume or work outside the included allowance is billed as an overage or add-on after approval.
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
              <span className="font-semibold text-white">{a.item}</span>
              <span className="text-[#0A84FF] font-bold">{a.rate}</span>
              <span className="text-slate-400 text-xs leading-relaxed">{a.note}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-5 py-4">
          <p className="text-amber-200 text-sm leading-relaxed">
            <span className="font-bold">Not included by default:</span> unlimited storage, unlimited dock usage, free packing materials, shipping carrier costs, advanced configuration labor, troubleshooting, disposal/recycling, or insurance for unusually high-value equipment — unless added in writing.
          </p>
        </div>
      </div>
    </section>
  );
}

function PortalSection() {
  const features = [
    { icon: Warehouse, label: "Live inventory status", desc: "Track every pallet, box, and device in real time." },
    { icon: Camera, label: "Photo gallery", desc: "View photos from receiving, staging, and shipping." },
    { icon: Truck, label: "Shipment tracking", desc: "Monitor outbound shipments with carrier info." },
    { icon: FileText, label: "Invoices & billing", desc: "Review line-item invoices and usage against your package." },
    { icon: Activity, label: "Activity log", desc: "Full audit trail of every action taken on your account." },
    { icon: Lock, label: "Role-based access", desc: "Admin and viewer roles for your team members." },
  ];

  return (
    <section id="portal" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-slate-400 text-xs mb-6">
              <Shield className="w-3.5 h-3.5 text-[#0A84FF]" /> Customer Portal
            </div>
            <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-4">
              Full visibility into<br />
              <span className="text-[#0A84FF]">your operations.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Every Layer One client gets access to a dedicated customer portal. Track your inventory, view photos, monitor shipments, and review invoices — all in one place, in real time.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {features.map(f => (
                <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                  <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/10 border border-[#0A84FF]/20 flex items-center justify-center shrink-0">
                    <f.icon className="w-3.5 h-3.5 text-[#0A84FF]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{f.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portal preview card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-white">Your Package Usage</p>
                <p className="text-xs text-slate-400">Professional tier · June 2026</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#0A84FF]/10 border border-[#0A84FF]/25 text-[#5eb2ff] text-xs font-bold">Professional</span>
            </div>
            <div className="space-y-4">
              {[
                { label: "Devices", used: 312, max: 400, color: "bg-[#0A84FF]" },
                { label: "Pallets", used: 28, max: 40, color: "bg-violet-500" },
                { label: "Boxes", used: 61, max: 75, color: "bg-emerald-500" },
                { label: "Storage (GB)", used: 18, max: 50, color: "bg-amber-400" },
              ].map(m => {
                const pct = Math.round((m.used / m.max) * 100);
                const textColor = pct > 90 ? "text-red-400" : pct > 70 ? "text-amber-400" : "text-emerald-400";
                return (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">{m.label}</span>
                      <span className={textColor}>{m.used} / {m.max}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${m.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Active Tasks", value: "4", color: "text-amber-400" },
                { label: "Shipments", value: "7", color: "text-[#0A84FF]" },
                { label: "Open Invoices", value: "1", color: "text-pink-400" },
              ].map(s => (
                <div key={s.label}>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Industries() {
  const industries = [
    { icon: Network, title: "MSPs & Integrators", desc: "Offload receiving and staging so your engineers stay billable." },
    { icon: Users, title: "Technology Integrators", desc: "A warehouse extension for project-based integration work." },
    { icon: Store, title: "Retail & Franchise Deployments", desc: "Identical site kits, shipped to every location on schedule." },
    { icon: Repeat, title: "IT Equipment Brokers", desc: "Secure intake, inventory, and forward logistics for brokered gear." },
    { icon: Server, title: "Data Center Deployment Teams", desc: "Staged, labeled, and QA-verified equipment ready for install windows." },
    { icon: MapPin, title: "Multi-Location Rollouts", desc: "Coordinated site-by-site preparation for national technology rollouts." },
  ];

  return (
    <section id="industries" className="py-20 border-t border-white/10 bg-[#1F2937]/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">Built for your business</span>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">Industries we support</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Layer One is purpose-built for the teams that move technology at scale — from single-site installs to multi-location rollouts.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {industries.map(ind => (
            <div key={ind.title} className="rounded-2xl border border-white/10 bg-[#0B1320]/60 p-6 hover:border-[#0A84FF]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/10 border border-[#0A84FF]/25 flex items-center justify-center mb-4">
                <ind.icon className="w-5 h-5 text-[#0A84FF]" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{ind.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{ind.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">About Layer One</span>
            <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-4">
              A warehouse built for<br />technology deployments.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-6">
              Layer One Staging is a deployment staging, warehousing, and IT equipment logistics company based in Carrollton, Texas. We exist for one reason: to make sure the right equipment arrives at the right site, configured, labeled, and ready — every time.
            </p>
            <p className="text-slate-400 leading-relaxed mb-6">
              We are not an IT support company and we don&apos;t dispatch field technicians to your locations. We run the warehouse behind your rollout: receiving, secure storage, staging, kitting, QA verification, and outbound shipping — with photo documentation and live portal visibility on every step.
            </p>
            <ul className="space-y-3">
              {[
                "Single point of accountability for your deployment hardware",
                "Secure, camera-monitored facility with dock access",
                "Customer portal with real-time inventory, photos, and invoices",
              ].map(t => (
                <li key={t} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
            <img
              src="/images/facility-dock.jpg"
              alt="Layer One Staging loading dock for palletized freight deliveries"
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1320]/90 via-[#0B1320]/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-base font-bold text-white mb-1">Dock Access for Deliveries</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Roll-up dock doors accept palletized freight from any carrier — FedEx, UPS, LTL, and white-glove.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FACILITY_IMAGES = [
  {
    src: "/images/facility-corridor.jpg",
    title: "Secure Access Corridor",
    desc: "Individual secured units line the main corridor — client equipment organized on industrial racking, isolated, labeled, and access-controlled.",
    callouts: [
      { icon: Video, label: "Multi-Camera Coverage", pos: "top-4 left-4" },
      { icon: Shield, label: "Keypad-Secured Units", pos: "bottom-4 left-4" },
    ],
  },
  {
    src: "/images/facility-dock.jpg",
    title: "Dock Access for Deliveries",
    desc: "Roll-up dock doors with yellow safety bumpers accept palletized freight from any carrier — FedEx, UPS, LTL, and white-glove.",
    callouts: [
      { icon: Truck, label: "Dock-Height Access", pos: "bottom-4 right-4" },
      { icon: Video, label: "Dock Camera", pos: "top-4 left-4" },
    ],
  },
];

function FacilityGallery() {
  return (
    <section id="facility" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-slate-400 text-xs mb-6">
            <MapPin className="w-3.5 h-3.5 text-[#0A84FF]" /> 1501 Randolph St, Carrollton, TX 75006
          </div>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">
            Our facility, built for<br />
            <span className="text-[#0A84FF]">professional-grade staging.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Climate-controlled, camera-monitored, and dock-accessible — every square foot is purpose-built for receiving, staging, and shipping technology equipment.
          </p>
        </div>

        {/* Feature badges row */}
        <div className="flex flex-wrap gap-3 mb-10">
          {[
            { icon: Video, label: "24/7 Video Surveillance" },
            { icon: Thermometer, label: "Climate Controlled" },
            { icon: Truck, label: "Dock Access" },
            { icon: Shield, label: "Keypad-Secured Units" },
            { icon: Lock, label: "Access-Controlled Entry" },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/10 bg-white/5 text-slate-400 text-xs font-medium">
              <b.icon className="w-3.5 h-3.5 text-[#0A84FF]" />
              {b.label}
            </div>
          ))}
        </div>

        {/* 2x2 photo grid with callout overlays */}
        <div className="grid md:grid-cols-2 gap-5">
          {FACILITY_IMAGES.map(img => (
            <div key={img.title} className="group relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
              {/* Photo */}
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-72 object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
              />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1320]/90 via-[#0B1320]/20 to-transparent" />

              {/* Callout badges */}
              {img.callouts.map(c => (
                <div
                  key={c.label}
                  className={`absolute ${c.pos} flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/20 bg-[#0B1320]/80 backdrop-blur-sm text-xs font-semibold text-white shadow-lg`}
                >
                  <c.icon className="w-3.5 h-3.5 text-[#0A84FF] shrink-0" />
                  {c.label}
                </div>
              ))}

              {/* Bottom caption */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-base font-bold text-white mb-1">{img.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{img.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    category: "Services",
    q: "What exactly does Layer One do?",
    a: "Layer One Staging provides professional warehousing, receiving, staging, and outbound shipping services for technology equipment. We receive your hardware shipments, inventory every device, kit and stage equipment to your specifications, and ship it to your deployment sites — all tracked in real time through our customer portal."
  },
  {
    category: "Services",
    q: "What types of equipment do you handle?",
    a: "We handle a wide range of network and IT equipment including routers, switches, firewalls, access points, servers, UPS units, cabling, and other rack-mount hardware. If you're unsure whether your equipment qualifies, contact us and we'll confirm before you ship."
  },
  {
    category: "Services",
    q: "Do you offer staging and QA services?",
    a: "Yes. Depending on your package, our warehouse team can perform staging tasks such as firmware checks, asset labeling, serial/MAC capture, site-kit assembly, and deployment-readiness verification. Custom staging workflows are available on Professional, Enterprise, and Custom packages."
  },
  {
    category: "Pricing & Packages",
    q: "What is the difference between the packages?",
    a: "Our five tiers — Basic, Standard, Professional, Enterprise, and Custom — differ in storage capacity, device limits, included receiving volume, and outbound shipment coordination. Basic is ideal for one-time projects; Custom is designed for large-scale, ongoing enterprise deployments. See our Packages section for a full comparison."
  },
  {
    category: "Pricing & Packages",
    q: "Are there any setup fees?",
    a: "There are no hidden setup fees. The price listed for each package is the full monthly or per-project rate. Overages (extra pallets, boxes, devices, or labor hours beyond your plan limits) are billed at the rates listed in our Add-on Services table."
  },
  {
    category: "Pricing & Packages",
    q: "Can I add services to my existing package?",
    a: "Yes. Add-on services such as extended storage, rush staging, site-kit assembly, photo documentation, and inventory & asset capture can be added to any package. These are billed at the per-unit rates shown in our Add-ons section and appear as line items on your monthly invoice."
  },
  {
    category: "Onboarding",
    q: "How long does it take to get started after signing up?",
    a: "We require a 2-week setup period after your contract is signed and first payment is received. During this time, we configure your dedicated warehouse space and set up your customer portal account. You'll receive your warehouse details and go-live date via email as soon as your space is ready."
  },
  {
    category: "Onboarding",
    q: "What happens after I sign the agreement?",
    a: "Once your service agreement is signed, you'll receive a Stripe payment link for your first invoice. After payment is confirmed, your 2-week onboarding clock starts. You'll receive a welcome email with your assigned warehouse unit number, facility address, and loading dock instructions. Your portal account will be activated and ready to use on your go-live date."
  },
  {
    category: "Onboarding",
    q: "Can I ship equipment before my go-live date?",
    a: "We ask that all inbound shipments be coordinated after your go-live date to ensure your space is fully prepared. If you have a time-sensitive shipment, contact us in advance and we'll do our best to accommodate it during the setup period."
  },
  {
    category: "Security & Facility",
    q: "Is my equipment secure at your facility?",
    a: "Yes. Our facility features 24/7 HD surveillance cameras throughout all storage and staging areas, keypad-controlled access to individual units, climate-controlled environments maintained at 65–72°F, and fire suppression systems. All access events are logged. Only authorized Layer One staff and your designated representatives may access your space."
  },
  {
    category: "Security & Facility",
    q: "Is the facility climate controlled?",
    a: "Yes. The entire facility is climate controlled with temperature maintained between 65–72°F and humidity levels kept within safe ranges for sensitive electronics. This protects your equipment from thermal stress, condensation, and electrostatic damage during storage."
  },
  {
    category: "Security & Facility",
    q: "Do you have loading dock access for large deliveries?",
    a: "Yes. Our facility has dedicated dock-height loading bays with forklift access for pallet deliveries. We accept LTL (less-than-truckload) and FTL (full truckload) freight shipments. Please notify us in advance for large deliveries so we can coordinate dock availability and receiving staff."
  },
  {
    category: "Portal & Tracking",
    q: "How do I track my equipment through the portal?",
    a: "Your customer portal provides real-time visibility into every stage of your equipment's lifecycle. You can view expected delivery status, receiving logs with photos, pallet and box inventory, device-level staging progress, outbound shipment tracking, and invoices — all from a single dashboard accessible 24/7."
  },
  {
    category: "Portal & Tracking",
    q: "Can multiple people from my company access the portal?",
    a: "Yes. We support two customer roles: Customer Admin (full read access plus the ability to submit delivery requests and shipment requests) and Customer Viewer (read-only access to all data). Contact your Layer One account manager to add additional users to your account."
  },
  {
    category: "Portal & Tracking",
    q: "What happens if my equipment arrives damaged?",
    a: "Our receiving staff documents all inbound shipments with photos and flags any visible damage at the time of receipt. Damage exceptions are recorded in your receiving log and you'll be notified immediately. Photos are attached to the receiving record and visible in your portal. You can use this documentation for carrier claims or insurance purposes."
  },
];

function FAQ() {
  const categories = Array.from(new Set(FAQ_ITEMS.map(f => f.category)));
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = activeCategory === "All" ? FAQ_ITEMS : FAQ_ITEMS.filter(f => f.category === activeCategory);

  return (
    <section id="faq" className="py-20 border-t border-white/10">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Everything you need to know about Layer One services, pricing, onboarding, and facility security.</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {["All", ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat
                  ? "bg-[#0A84FF] text-white border-[#0A84FF]"
                  : "border-white/15 text-slate-400 hover:border-[#0A84FF]/50 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {filtered.map((item, i) => {
            const globalIndex = FAQ_ITEMS.indexOf(item);
            const isOpen = openIndex === globalIndex;
            return (
              <div
                key={globalIndex}
                className={`rounded-xl border transition-all ${
                  isOpen ? "border-[#0A84FF]/40 bg-white/[0.06]" : "border-white/10 bg-white/[0.03] hover:border-white/15"
                }`}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                  onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0A84FF]/15 text-[#5eb2ff] shrink-0">{item.category}</span>
                    <span className="font-medium text-sm text-slate-100">{item.q}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <div className="border-l-2 border-[#0A84FF]/20 pl-4">
                      <p className="text-sm text-slate-300 leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-slate-500 mt-10">
          Still have questions? <a href="mailto:info@layeronestaging.com" className="text-[#0A84FF] hover:underline">Contact our team</a> — we typically respond within one business day.
        </p>
      </div>
    </section>
  );
}

function CTA() {
  const { isAuthenticated } = useAuth();
  return (
    <section id="contact" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A84FF]/10 to-white/[0.04] p-12 text-center overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#0A84FF]/10 blur-[80px]" />
          </div>
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-black tracking-[-2px] text-white mb-4">
              Ready to stage smarter?
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
              Sign in to access your Layer One customer portal, or contact us to discuss a package for your team.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href={isAuthenticated ? "/dashboard" : getLoginUrl()}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
              >
                {isAuthenticated ? "Open Dashboard" : "Sign In to Portal"} <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="mailto:info@layeronestaging.com"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold border border-white/15 bg-white/5 text-white hover:border-white/30 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <LayerOneLogo />
        <p className="text-slate-400 text-sm text-center">
          © {new Date().getFullYear()} Layer One Staging · 1501 Randolph St, Carrollton, TX 75006
        </p>
        <div className="flex gap-5 text-sm text-slate-400">
          <a href="#services" className="hover:text-white transition-colors">Services</a>
          <a href="#packages" className="hover:text-white transition-colors">Packages</a>
          <a href={getLoginUrl()} className="hover:text-white transition-colors">Portal Login</a>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div
      id="top"
      className="min-h-screen"
      style={{
        background: "radial-gradient(circle at top left, rgba(10,132,255,0.12) 0%, transparent 35%), linear-gradient(135deg, #0B1320, #0B1320)",
        color: "#f5f8fc",
      }}
    >
      <NavBar />
      <main>
        <Hero />
        <Services />
        <HowItWorks />
        <Packages />
        <AddOns />
        <PortalSection />
        <Industries />
        <About />
        <FacilityGallery />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
