import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Shield, Truck, Package, Warehouse, Box,
  ArrowRight, CheckCircle, ChevronRight, Zap, Lock,
  BarChart3, FileText, Camera, Activity,
  Thermometer, Video, MapPin, ChevronDown, Layers,
  Tags, ClipboardCheck, Send, Network, Users, Store,
  Server, Repeat, Info, Phone,
} from "lucide-react";
import { ScheduleCallDialog } from "@/components/ScheduleCallDialog";

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
                Request a Project Quote <ArrowRight className="w-3.5 h-3.5" />
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
  const [scheduleOpen, setScheduleOpen] = useState(false);
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
              IT Staging &amp; Rollout Logistics — Dallas–Fort Worth, TX
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.02] tracking-[-2px] mb-6 text-white">
              IT Equipment Staged, Kitted
              <br />
              <span className="text-[#0A84FF]">&amp; Deployment-Ready.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
              Ship your equipment to us. We receive, inventory, configure, label, QA, kit by location, and forward it to the field — ready for installation.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {isAuthenticated ? (
                <>
                  <a
                    href="/dashboard"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setScheduleOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold border border-white/15 bg-white/5 text-white hover:border-white/30 transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Schedule a Call
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/get-started"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
                  >
                    Request a Project Quote <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setScheduleOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold border border-white/15 bg-white/5 text-white hover:border-white/30 transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Schedule a Call
                  </button>
                  <a
                    href="#services"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold border border-white/15 bg-white/5 text-white hover:border-white/30 transition-colors"
                  >
                    Explore Our Services
                  </a>
                </>
              )}
            </div>
            <ScheduleCallDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
            <div className="flex flex-wrap gap-2">
              {["Received & inventoried", "Configured & labeled", "Kitted by site, shipped nationwide"].map(b => (
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
      title: "Receiving & Inventory Control",
      desc: "We accept inbound freight on your behalf — every pallet, box, and device counted, inspected, photographed, and logged. Damage is flagged immediately.",
    },
    {
      icon: Warehouse,
      title: "Secure Equipment Storage",
      desc: "Access-controlled, camera-monitored storage. Your equipment is isolated per client and organized on industrial racking.",
    },
    {
      icon: BarChart3,
      title: "Serial Number / MAC Capture",
      desc: "Model, serial number, and MAC address captured per device and recorded in your portal inventory.",
    },
    {
      icon: Tags,
      title: "Asset Tagging & Labeling",
      desc: "Barcode and QR asset tags plus site labels applied to your specification — scannable from receiving to install.",
    },
    {
      icon: Zap,
      title: "Firmware & Device Configuration",
      desc: "Firmware updates and baseline device configuration completed to your spec sheet before anything ships.",
    },
    {
      icon: ClipboardCheck,
      title: "QA Verification",
      desc: "Deployment-readiness verification on every device — power-on checks, config review, and a signed QA checklist.",
    },
    {
      icon: Camera,
      title: "Photo Documentation",
      desc: "Every stage photographed — inbound condition, staging progress, outbound packing — visible in your customer portal.",
    },
    {
      icon: Package,
      title: "Site-Specific Kitting",
      desc: "Kits assembled per location: devices, patch cables, labels, packing lists, and install notes — ready to open and install.",
    },
    {
      icon: Box,
      title: "Palletization & Shipping",
      desc: "Professional packing and palletizing with outbound dispatch to your sites nationwide, carrier-tracked.",
    },
    {
      icon: MapPin,
      title: "Local DFW Delivery",
      desc: "Palletized freight or loose-device delivery across the Dallas–Fort Worth metro, coordinated to your schedule.",
    },
    {
      icon: Shield,
      title: "Chain-of-Custody Tracking",
      desc: "Every item tracked from receipt to dispatch with a complete audit trail — nothing moves without a record.",
    },
    {
      icon: Users,
      title: "Dedicated Staging Support",
      desc: "Staging labor scoped to your rollout and approved by you — labeling, config, packing, and kit prep handled by our team.",
    },
  ];

  return (
    <section id="services" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">What we do</span>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">
            A complete staging operation,<br />
            <span className="text-[#0A84FF]">not a storage unit with a forklift.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Every capability your rollout needs between procurement and installation — run by our warehouse team with full accountability and portal visibility.
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

function WhyLayerOne() {
  const points = [
    { title: "Deployment-ready equipment", desc: "Configured, labeled, and QA-verified before it leaves our dock." },
    { title: "Reduced onsite technician time", desc: "Techs install instead of unboxing, sorting, and troubleshooting." },
    { title: "Fewer missing or wrong devices", desc: "Per-site kits are checked against the site list before they ship." },
    { title: "Standardized configurations", desc: "Every location gets the same baseline — no snowflake installs." },
    { title: "Documented QA", desc: "A signed readiness checklist and photos travel with every kit." },
    { title: "Site-specific kits", desc: "Each location receives exactly what it needs — nothing more, nothing less." },
    { title: "Centralized rollout inventory", desc: "One live inventory across all sites, visible in your portal." },
    { title: "One staging point for multi-site deployments", desc: "A single accountable partner between your vendors and your field teams." },
  ];

  return (
    <section id="why-layer-one" className="py-20 border-t border-white/10 bg-[#1F2937]/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="md:sticky md:top-24">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">Why Layer One</span>
            <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-4">
              Rollouts fail in the gaps<br />between vendors and techs.<br />
              <span className="text-[#0A84FF]">We close the gaps.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Most deployment problems aren&apos;t installation problems — they&apos;re staging problems. Wrong gear at the wrong site, missing cables, unconfigured devices, no record of what shipped where. Layer One exists to eliminate that entire category of failure.
            </p>
          </div>
          <ul className="space-y-3">
            {points.map(p => (
              <li key={p.title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0B1320]/60 p-5">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">{p.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Rollouts() {
  const useCases = [
    { icon: Store, title: "Retail Rollouts", desc: "Identical kits for every store — POS, network, and peripherals staged to the planogram." },
    { icon: Users, title: "Restaurant & Franchise Deployments", desc: "Repeatable site kits that make 10 locations feel like one." },
    { icon: Network, title: "Network Refreshes", desc: "Switches and firewalls configured, labeled, and shipped per site cutover schedule." },
    { icon: BarChart3, title: "POS Deployments", desc: "Terminals, printers, and payment hardware kitted complete with install guides." },
    { icon: Zap, title: "Wi-Fi Upgrades", desc: "Access points pre-configured and labeled by mounting location." },
    { icon: Repeat, title: "SD-WAN Deployments", desc: "Edge devices staged with site-specific configs, ready for zero-touch or assisted install." },
    { icon: Box, title: "Kiosk Rollouts", desc: "Kiosks and displays assembled, tested, and packed for safe transit." },
    { icon: Server, title: "Data Center Equipment", desc: "Rack-ready gear labeled and QA-verified for tight install windows." },
    { icon: MapPin, title: "New Store Openings", desc: "Full technology packages delivered on opening-day timelines." },
  ];

  return (
    <section id="rollouts" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">Multi-site rollouts</span>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-4">
            Built for dozens, hundreds, or<br />
            <span className="text-[#0A84FF]">thousands of locations.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            One staging point, one inventory, one accountable team — whether you&apos;re opening five stores or refreshing five hundred sites.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {useCases.map(u => (
            <div key={u.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-[#0A84FF]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/10 border border-[#0A84FF]/25 flex items-center justify-center mb-4">
                <u.icon className="w-5 h-5 text-[#0A84FF]" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{u.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a
            href="/get-started"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
          >
            Request a Project Quote <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", icon: Truck, title: "Receive", desc: "Inbound freight accepted on your behalf — every pallet, box, and device counted and inspected at the dock." },
    { n: "02", icon: ClipboardCheck, title: "Inventory", desc: "Every item logged into your portal inventory with photos, quantities, and condition notes." },
    { n: "03", icon: Zap, title: "Configure", desc: "Firmware updates and baseline device configuration completed to your spec sheet before anything ships." },
    { n: "04", icon: Tags, title: "Asset Tag", desc: "Asset tags and labels applied; serial numbers and MAC addresses captured per device." },
    { n: "05", icon: Shield, title: "QA", desc: "Deployment-readiness verification — power-on checks, config review, and a signed QA checklist." },
    { n: "06", icon: Package, title: "Kit by Site", desc: "Site-specific kits assembled: devices, patch cables, labels, packing lists, and install notes per location." },
    { n: "07", icon: Camera, title: "Document", desc: "Photo documentation at every stage — inbound, staging, and outbound — visible in your portal." },
    { n: "08", icon: Send, title: "Ship / Deliver", desc: "Palletized or parcel outbound shipped nationwide with tracking — or local DFW delivery to your sites." },
  ];

  return (
    <section id="how-it-works" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">How it works</span>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-4">
            The operational bridge between procurement<br className="hidden md:block" />
            <span className="text-[#0A84FF]"> and installation.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-3xl leading-relaxed">
            Your vendors ship to us. Your technicians receive finished kits. In between, Layer One runs a disciplined staging operation —{" "}
            <span className="text-slate-100 font-semibold">every technician receives the correct equipment, configured correctly, labeled, documented, and ready to install before they arrive onsite.</span>
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-[#0A84FF]/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#0A84FF]/10 border border-[#0A84FF]/25 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-[#0A84FF]" />
                </div>
                <span className="text-xs font-black text-white/20">{s.n}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <ChevronRight className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 w-5 h-5 text-[#0A84FF]/40 z-10 bg-[#0B1320] rounded-full" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Packages() {
  const [, setLocation] = useLocation();
  // Detail values pulled from server/stripe-products.ts TIER_PRICING descriptions.
  const tiers = [
    {
      name: "Basic",
      price: "$499",
      priceSuffix: "/project",
      desc: "First-time customers testing the service on a small deployment.",
      features: ["One project, up to 14 days", "Up to 5 active devices", "Up to 5 boxes received", "Intake photos & serial/MAC capture", "1 outbound shipment coordination", "Staging labor billed separately"],
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
                Tell us the number of locations, devices, services required, storage needs, and deployment schedule — we&apos;ll build a staging and logistics quote around your rollout. Volume discounts apply: per-device and per-site rates come down as quantities scale, itemized in your quote. Prefer it simple? Our per-pallet path is $12/pallet receiving and $30/pallet/month storage, plus the services you pick.
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
            Our package tiers are starting frameworks for recurring work — most multi-site projects are custom-quoted. Every package includes full portal access, photo documentation, and transparent billing.
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
                    <p className="text-sm font-bold text-white mb-1">{t.name} — what's included</p>
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
        "Billed monthly per device — only for devices above your included limit.",
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
        "Billed per pallet — final rate depends on facility, size, handling, and duration.",
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
      note: "Up to 2 hrs staging labor, QA checklist & photo docs — devices, patch cables, labels, packing list & install notes",
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
        "A minimum labor block may apply — confirmed with you before work starts.",
      ],
    },
  ];

  return (
    <section id="addons" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">Overages &amp; add-on services</h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Package limits keep pricing predictable. Any volume or work outside the included allowance is billed as an overage or add-on after approval. On large rollouts, per-device and per-site rates are discounted by volume — your project quote will show the scaled pricing.
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
            <MapPin className="w-3.5 h-3.5 text-[#0A84FF]" /> Dallas–Fort Worth, TX
          </div>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">
            Our facility, built for<br />
            <span className="text-[#0A84FF]">professional-grade staging.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Purpose-built for receiving, staging, and shipping technology equipment — every device tracked from dock to dispatch.
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
  const [scheduleOpen, setScheduleOpen] = useState(false);
  return (
    <section id="contact" className="py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A84FF]/10 to-white/[0.04] p-12 text-center overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#0A84FF]/10 blur-[80px]" />
          </div>
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-black tracking-[-2px] text-white mb-4">
              Planning a Multi-Site<br className="hidden md:block" /> Technology Rollout?
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
              Send us your equipment list, site count, and deployment schedule. We&apos;ll build a staging and logistics plan around your rollout.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="/get-started"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
              >
                Request a Project Quote <ArrowRight className="w-4 h-4" />
              </a>
              {isAuthenticated ? (
                <a
                  href="/dashboard"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold border border-white/15 bg-white/5 text-white hover:border-white/30 transition-colors"
                >
                  Open Dashboard
                </a>
              ) : (
                <a
                  href="mailto:info@layeronestaging.com"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold border border-white/15 bg-white/5 text-white hover:border-white/30 transition-colors"
                >
                  Contact Us
                </a>
              )}
              <button
                type="button"
                onClick={() => setScheduleOpen(true)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold border border-white/15 bg-white/5 text-white hover:border-white/30 transition-colors"
              >
                <Phone className="w-4 h-4" /> Schedule a Call
              </button>
            </div>
            <ScheduleCallDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
          </div>
        </div>
      </div>
    </section>
  );
}

const FOOTER_SERVICES = [
  { href: "/services/it-equipment-staging-dallas-fort-worth", label: "IT Equipment Staging — DFW" },
  { href: "/services/network-equipment-staging", label: "Network Equipment Staging" },
  { href: "/services/it-rollout-logistics", label: "IT Rollout Logistics" },
  { href: "/services/technology-deployment-logistics", label: "Technology Deployment Logistics" },
  { href: "/services/pos-deployment-staging", label: "POS Deployment Staging" },
  { href: "/services/network-deployment-kitting", label: "Network Deployment Kitting" },
  { href: "/services/it-equipment-kitting-services", label: "IT Equipment Kitting" },
  { href: "/services/multi-site-technology-rollouts", label: "Multi-Site Technology Rollouts" },
  { href: "/services/it-asset-tagging-inventory", label: "IT Asset Tagging & Inventory" },
  { href: "/services/device-configuration-firmware-staging", label: "Device Configuration & Firmware" },
  { href: "/services/retail-technology-deployment", label: "Retail Technology Deployment" },
  { href: "/services/restaurant-franchise-technology-rollouts", label: "Restaurant & Franchise Rollouts" },
];

function Footer() {
  return (
    <footer className="border-t border-white/10 pt-14 pb-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div>
            <LayerOneLogo />
            <p className="text-slate-400 text-sm leading-relaxed mt-4 max-w-xs">
              The operational layer between equipment procurement and field deployment — serving the Dallas–Fort Worth metro and shipping nationwide.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Services</p>
            <ul className="grid grid-cols-1 gap-2.5">
              {FOOTER_SERVICES.map(s => (
                <li key={s.href}>
                  <a href={s.href} className="text-sm text-slate-400 hover:text-white transition-colors">{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Company</p>
            <ul className="space-y-2.5">
              <li><a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#why-layer-one" className="text-sm text-slate-400 hover:text-white transition-colors">Why Layer One</a></li>
              <li><a href="#rollouts" className="text-sm text-slate-400 hover:text-white transition-colors">Multi-Site Rollouts</a></li>
              <li><a href="#packages" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/get-started" className="text-sm text-slate-400 hover:text-white transition-colors">Request a Project Quote</a></li>
              <li><a href={getLoginUrl()} className="text-sm text-slate-400 hover:text-white transition-colors">Portal Login</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs text-center">
            © {new Date().getFullYear()} Layer One Staging · Dallas–Fort Worth, TX
          </p>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="text-slate-500 text-xs hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-slate-500 text-xs hover:text-white transition-colors">Terms &amp; Conditions</a>
          </div>
          <p className="text-slate-500 text-xs">Deployment staging &amp; rollout logistics · DFW &amp; nationwide</p>
        </div>
      </div>
    </footer>
  );
}

const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": "https://www.layeronestaging.com/#business",
  name: "Layer One Staging",
  description:
    "IT equipment staging, kitting, and deployment logistics. We receive, inventory, configure, label, QA, kit by location, and ship technology equipment deployment-ready — serving Dallas–Fort Worth and shipping nationwide.",
  url: "https://www.layeronestaging.com",
  email: "info@layeronestaging.com",
  priceRange: "$$",
  areaServed: [
    { "@type": "City", name: "Dallas–Fort Worth" },
    { "@type": "State", name: "Texas" },
    { "@type": "Country", name: "United States" },
  ],
  knowsAbout: [
    "IT equipment staging",
    "Network equipment staging",
    "Technology deployment logistics",
    "IT equipment kitting",
    "Multi-site technology rollouts",
    "POS deployment staging",
    "IT asset tagging and inventory",
    "Device configuration and firmware staging",
  ],
};

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
      <script type="application/ld+json">{JSON.stringify(LOCAL_BUSINESS_SCHEMA)}</script>
      <NavBar />
      <main>
        <Hero />
        <HowItWorks />
        <Services />
        <WhyLayerOne />
        <Rollouts />
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
