import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Shield, Truck, Package, Warehouse, Box,
  ArrowRight, CheckCircle, ChevronRight, Zap, Lock,
  BarChart3, FileText, Camera, Activity,
  Thermometer, Video, MapPin,
  Tags, ClipboardCheck, Send, Network, Users, Store,
  Server, Phone, Facebook, Linkedin, ChevronDown,
  Smartphone, Sparkles, GraduationCap, Tent, Menu, X,
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

export function NavBar() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const serviceLinks = [
    { href: "/#services", label: "IT Staging Services" },
    { href: "/warehousing", label: "Warehousing as a Service" },
    { href: "/how-we-work", label: "How We Work" },
    { href: "/pricing", label: "Packages & Pricing" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0B1320]/85 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" aria-label="Layer One Staging home">
          <LayerOneLogo />
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-400">
          <a href="/" className="hover:text-white transition-colors">Home</a>
          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              className="flex items-center gap-1 hover:text-white transition-colors"
              onClick={() => setServicesOpen(!servicesOpen)}
            >
              Services <ChevronDown className={`w-3.5 h-3.5 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
            </button>
            {servicesOpen && (
              <div className="absolute top-full left-0 pt-2 w-64">
                <div className="rounded-xl border border-white/10 bg-[#0B1320] shadow-[0_16px_40px_rgba(0,0,0,0.5)] py-2">
                  {serviceLinks.map(l => (
                    <a
                      key={l.href}
                      href={l.href}
                      className="block px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setServicesOpen(false)}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <a href="/about" className="hover:text-white transition-colors">About</a>
          <a href="/blog" className="hover:text-white transition-colors">Blog</a>
          <a href="/#contact" className="hover:text-white transition-colors">Contact</a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-white hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <a
            href="tel:+14695374378"
            aria-label="Call Layer One Staging at (469) 537-4378"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-white/20 text-white hover:border-[#0A84FF] hover:text-[#0A84FF] transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">(469) 537-4378</span>
          </a>
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
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-white/10 bg-[#0B1320]/95 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col text-sm">
            <a
              href="/"
              className="py-3 text-white border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </a>
            <button
              className="flex items-center justify-between py-3 text-white border-b border-white/5"
              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
              aria-expanded={mobileServicesOpen}
            >
              Services
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileServicesOpen && (
              <div className="border-b border-white/5 bg-white/[0.02]">
                {serviceLinks.map(l => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="block px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                    onClick={() => { setMobileServicesOpen(false); setMobileMenuOpen(false); }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            )}
            <a
              href="/about"
              className="py-3 text-white border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </a>
            <a
              href="/blog"
              className="py-3 text-white border-b border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </a>
            <a
              href="/#contact"
              className="py-3 text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </a>
          </div>
        </nav>
      )}
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
              IT Staging &amp; Rollout Logistics - Dallas–Fort Worth, TX
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.02] tracking-[-2px] mb-6 text-white">
              IT Equipment Staged, Kitted
              <br />
              <span className="text-[#0A84FF]">&amp; Deployment-Ready.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
              Ship your equipment to us. We receive, inventory, configure, label, QA, kit by location, and forward it to the field - ready for installation.
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

          {/* Right - facility photo card */}
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
                  Secure, camera-monitored units with dock access - your equipment received, organized, and staged under one roof.
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

function ServiceCard({ icon: Icon, title, desc, badge, href }: { icon: any; title: string; desc: string; badge?: string; href?: string }) {
  const inner = (
    <>
      <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/10 border border-[#0A84FF]/25 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[#0A84FF]" />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-bold text-white">{title}</h3>
        {badge && (
          <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-[#0A84FF] text-[#06111f]">{badge}</span>
        )}
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </>
  );
  const cardClass = "rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-[#0A84FF]/40 hover:bg-white/[0.07] transition-all group";
  return href ? (
    <a href={href} className={cardClass}>{inner}</a>
  ) : (
    <div className={cardClass}>{inner}</div>
  );
}

function Services() {
  const [showAll, setShowAll] = useState(false);
  const topServices = [
    {
      icon: Package,
      title: "Site-Specific Kitting",
      desc: "Kits assembled per location: devices, patch cables, labels, packing lists, and install notes - ready to open and install.",
    },
    {
      icon: Truck,
      title: "Receiving & Inventory Control",
      desc: "We accept inbound freight on your behalf - every pallet, box, and device counted, inspected, photographed, and logged. Damage is flagged immediately.",
    },
    {
      icon: ClipboardCheck,
      title: "QA Verification",
      desc: "Deployment-readiness verification on every device - power-on checks, config review, and a signed QA checklist.",
    },
    {
      icon: MapPin,
      title: "Local DFW Delivery",
      desc: "Palletized freight or loose-device delivery across the Dallas–Fort Worth metro, coordinated to your schedule.",
    },
    {
      icon: Tags,
      title: "Asset Tagging & Labeling",
      desc: "Barcode and QR asset tags plus site labels applied to your specification - scannable from receiving to install.",
    },
    {
      icon: Warehouse,
      title: "Secure Equipment Storage",
      desc: "Access-controlled, camera-monitored storage. Your equipment is isolated per client and organized on industrial racking.",
    },
  ];
  const moreServices = [
    {
      icon: BarChart3,
      title: "Serial Number / MAC Capture",
      desc: "Model, serial number, and MAC address captured per device and recorded in your portal inventory.",
    },
    {
      icon: Zap,
      title: "Firmware & Device Configuration",
      desc: "Firmware updates and baseline device configuration completed to your spec sheet before anything ships.",
    },
    {
      icon: Camera,
      title: "Photo Documentation",
      desc: "Every stage photographed - inbound condition, staging progress, outbound packing - visible in your customer portal.",
    },
    {
      icon: Box,
      title: "Palletization & Shipping",
      desc: "Professional packing and palletizing with outbound dispatch to your sites nationwide, carrier-tracked.",
    },
    {
      icon: Shield,
      title: "Chain-of-Custody Tracking",
      desc: "Every item tracked from receipt to dispatch with a complete audit trail - nothing moves without a record.",
    },
    {
      icon: Users,
      title: "Dedicated Staging Support",
      desc: "Staging labor scoped to your rollout and approved by you - labeling, config, packing, and kit prep handled by our team.",
    },
    {
      icon: Warehouse,
      title: "Warehousing as a Service",
      desc: "Short-term or long-term warehouse space in DFW without the lease commitment. Secure, camera-monitored storage with on-demand labor.",
      href: "/warehousing",
    },
    {
      icon: Smartphone,
      title: "Zero-Touch Enrollment",
      desc: "Windows Autopilot and Apple Business Manager enrollment in staging. Devices arrive ready for users - no tech touch needed.",
      badge: "NEW",
      href: "/services/zero-touch-enrollment",
    },
    {
      icon: Tent,
      title: "Tradeshow & Event Storage",
      desc: "Booth materials, displays, and signage stored securely between shows, kitted by event, and shipped to venues nationwide.",
      badge: "NEW",
      href: "/services/tradeshow-event-equipment-storage",
    },
  ];

  return (
    <section id="services" className="py-16 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">What we do</span>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">
            A complete staging operation,<br />
            <span className="text-[#0A84FF]">not a storage unit with a forklift.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Every capability your rollout needs between procurement and installation - run by our warehouse team with full accountability and portal visibility.
          </p>
        </div>
        {/* Featured: Zero-Touch Enrollment spotlight */}
        <a
          href="/services/zero-touch-enrollment"
          className="block mb-6 rounded-2xl border border-[#0A84FF]/40 bg-gradient-to-r from-[#0A84FF]/15 via-[#0A84FF]/5 to-transparent p-6 hover:border-[#0A84FF]/70 transition-all group"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0A84FF]/20 border border-[#0A84FF]/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-[#0A84FF]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#0A84FF] text-[#06111f]">New</span>
                <h3 className="text-xl font-bold text-white">Zero-Touch Enrollment</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                Windows Autopilot and Apple Business Manager enrollment done in staging. Devices ship ready for users to sign in - no technician ever touches them. <span className="text-[#0A84FF] font-semibold">Learn more <ArrowRight className="inline w-4 h-4" /></span>
              </p>
            </div>
          </div>
        </a>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(showAll ? [...topServices, ...moreServices] : topServices).map(s => (
            <ServiceCard key={s.title} icon={s.icon} title={s.title} desc={s.desc} badge={(s as any).badge} href={(s as any).href} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold border border-white/15 bg-white/5 text-white hover:border-[#0A84FF]/50 transition-colors"
          >
            {showAll ? "Show fewer services" : `See all ${topServices.length + moreServices.length} services`}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
    </section>
  );
}

function WarehousingAsAService() {
  const highlights = [
    { title: "Turnkey Setup", desc: "Space, receiving, labor, and logistics handled for you." },
    { title: "Short-Term or Long-Term", desc: "Flexible terms that match your timeline, not a rigid lease." },
    { title: "Operational in 14 Days", desc: "From first call to receiving your first shipment." },
  ];

  return (
    <section id="waas" className="py-16 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">Warehousing as a Service</span>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">
            Warehouse space without<br />
            <span className="text-[#0A84FF]">the warehouse headache.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Get the warehouse capacity you need in DFW without signing a lease, hiring staff, or managing a facility.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {highlights.map(f => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <a
          href="/warehousing"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
        >
          Learn More <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}

function WhyLayerOne() {
  const points = [
    { title: "Deployment-ready equipment", desc: "Configured, labeled, and QA-verified before it leaves our dock." },
    { title: "Reduced onsite technician time", desc: "Techs install instead of unboxing, sorting, and troubleshooting." },
    { title: "Fewer missing or wrong devices", desc: "Per-site kits are checked against the site list before they ship." },
    { title: "Standardized configurations", desc: "Every location gets the same baseline - no snowflake installs." },
    { title: "Documented QA", desc: "A signed readiness checklist and photos travel with every kit." },
    { title: "One staging point for multi-site deployments", desc: "A single accountable partner between your vendors and your field teams." },
  ];

  return (
    <section id="why-layer-one" className="py-16 border-t border-white/10 bg-[#1F2937]/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="md:sticky md:top-24">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">Why Layer One</span>
            <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-4">
              Rollouts fail in the gaps<br />between vendors and techs.<br />
              <span className="text-[#0A84FF]">We close the gaps.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Most deployment problems aren&apos;t installation problems - they&apos;re staging problems. Wrong gear at the wrong site, missing cables, unconfigured devices, no record of what shipped where. Layer One exists to eliminate that entire category of failure.
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

function WhoWeServe() {
  const groups = [
    { icon: Network, title: "MSPs & IT Integrators", desc: "Offload receiving and staging so your engineers stay billable." },
    { icon: Store, title: "Retail & Franchise Rollouts", desc: "Identical kits for every store - POS, network, and peripherals staged to plan." },
    { icon: Zap, title: "Network Refreshes & SD-WAN", desc: "Switches and edge devices configured, labeled, and shipped per site schedule." },
    { icon: BarChart3, title: "POS Deployments", desc: "Terminals, printers, and payment hardware kitted complete with install guides." },
    { icon: GraduationCap, title: "Schools & Education", desc: "Chromebook and device rollouts staged, enrolled, and shipped ready for students." },
    { icon: MapPin, title: "Multi-Location Rollouts", desc: "Coordinated site-by-site preparation for national technology rollouts." },
    { icon: Tent, title: "Tradeshows & Events", desc: "Booth gear stored between shows, kitted by event, and shipped to venues nationwide." },
  ];

  return (
    <section id="who-we-serve" className="py-16 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">Who we serve</span>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-4">
            Built for dozens, hundreds, or<br />
            <span className="text-[#0A84FF]">thousands of locations.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            One staging point, one inventory, one accountable team - whether you&apos;re opening five stores or refreshing five hundred sites.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {groups.map(g => (
            <div key={g.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-[#0A84FF]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/10 border border-[#0A84FF]/25 flex items-center justify-center mb-4">
                <g.icon className="w-5 h-5 text-[#0A84FF]" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{g.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{g.desc}</p>
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
    { n: "01", icon: Truck, title: "Receive", desc: "Inbound freight accepted on your behalf - every pallet, box, and device counted and inspected at the dock." },
    { n: "02", icon: ClipboardCheck, title: "Inventory", desc: "Every item logged into your portal with photos, quantities, and condition notes." },
    { n: "03", icon: Zap, title: "Configure", desc: "Firmware updates and baseline configuration completed to your spec sheet before anything ships." },
    { n: "04", icon: Tags, title: "Asset Tag", desc: "Asset tags and labels applied; serial numbers and MAC addresses captured per device." },
    { n: "05", icon: Shield, title: "QA", desc: "Deployment-readiness checks - power-on tests, config review, and a signed QA checklist." },
    { n: "06", icon: Package, title: "Kit by Site", desc: "Site-specific kits assembled: devices, patch cables, labels, packing lists, and install notes per location." },
    { n: "07", icon: Camera, title: "Document", desc: "Photo documentation at every stage - inbound, staging, and outbound - visible in your portal." },
    { n: "08", icon: Send, title: "Ship / Deliver", desc: "Palletized or parcel outbound shipped nationwide with tracking - or local DFW delivery to your sites." },
  ];

  return (
    <section id="how-it-works" className="py-16 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">How it works</span>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-4">
            The operational bridge between procurement<br className="hidden md:block" />
            <span className="text-[#0A84FF]"> and installation.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-3xl leading-relaxed">
            Your vendors ship to us. Your technicians receive finished kits. In between, Layer One runs a disciplined staging operation -{" "}
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

function PricingTeaser() {
  const highlights = [
    { title: "Project-Based Quotes", desc: "Every rollout is quoted as a project around your locations, devices, and schedule." },
    { title: "Managed Packages", desc: "Five tiers from $499/project to custom enterprise, with volume discounts built in." },
    { title: "Transparent Add-Ons", desc: "Published overage rates. Nothing is billed without your approval." },
  ];

  return (
    <section id="packages" className="py-16 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">Pricing</span>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">
            Straightforward pricing,<br />
            <span className="text-[#0A84FF]">no surprises.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Project-based quotes, managed service packages, and published add-on rates.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {highlights.map(h => (
            <div key={h.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-base font-bold text-white mb-2">{h.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
        >
          View Packages &amp; Pricing <ArrowRight className="w-4 h-4" />
        </a>
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
    <section id="portal" className="py-16 border-t border-white/10">
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
              Every Layer One client gets access to a dedicated customer portal. Track your inventory, view photos, monitor shipments, and review invoices - all in one place, in real time.
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

function DirectLine() {
  const points = [
    { icon: Zap, title: "No hold time", desc: "Your call is answered right away, day or night." },
    { icon: FileText, title: "Account questions", desc: "Ask about quotes, invoices, shipments, and balances." },
    { icon: ClipboardCheck, title: "Process questions", desc: "How staging, kitting, and delivery work, explained plainly." },
    { icon: Phone, title: "Always Alex", desc: "Our AI receptionist knows your account and your history." },
  ];
  return (
    <section id="direct-line" className="py-16 border-t border-white/10 bg-[#1F2937]/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-slate-400 text-xs mb-6">
              <Phone className="w-3.5 h-3.5 text-[#0A84FF]" /> 24/7 Direct Line
            </div>
            <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-4">
              A dedicated point of contact,<br />
              <span className="text-[#0A84FF]">around the clock.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Every Layer One customer company gets a direct line that is answered 24/7. No hold music, no phone tree. Call any time with questions about your account, your shipments, our process, or any feature, and get an answer on the spot.
            </p>
            <a
              href="tel:+14695374378"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
            >
              <Phone className="w-4 h-4" /> Call (469) 537-4378
            </a>
          </div>
          <div className="grid gap-3">
            {points.map(p => (
              <div key={p.title} className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#0A84FF]/10 border border-[#0A84FF]/20 flex items-center justify-center shrink-0">
                  <p.icon className="w-4 h-4 text-[#0A84FF]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{p.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-16 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">About Layer One</span>
            <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-4">
              A warehouse built for<br />technology deployments.
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0A84FF]/40 bg-[#0A84FF]/10 text-[#6ea8ff] text-xs font-semibold mb-5">
              Disabled Veteran-Owned · 20+ Years in IT
            </div>
            <p className="text-slate-400 text-lg leading-relaxed mb-6">
              Layer One Staging is a disabled veteran-owned deployment staging, warehousing, and IT equipment logistics company based in Carrollton, Texas - founded by a U.S. Air Force veteran with more than 20 years in the IT field. We exist for one reason: to make sure the right equipment arrives at the right site, configured, labeled, and ready - every time.
            </p>
            <p className="text-slate-400 leading-relaxed mb-6">
              We are not an IT support company and we don&apos;t dispatch field technicians to your locations. We run the warehouse behind your rollout: receiving, secure storage, staging, kitting, QA verification, and outbound shipping - with photo documentation and live portal visibility on every step.
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
            <a href="/about" className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-[#0A84FF] hover:text-[#3d9dff] transition-colors">
              More about us <ArrowRight className="w-4 h-4" />
            </a>
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
              <p className="text-xs text-slate-300 leading-relaxed">Roll-up dock doors accept palletized freight from any carrier - FedEx, UPS, LTL, and white-glove.</p>
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
    desc: "Individual secured units line the main corridor - client equipment organized on industrial racking, isolated, labeled, and access-controlled.",
    callouts: [
      { icon: Video, label: "Multi-Camera Coverage", pos: "top-4 left-4" },
      { icon: Shield, label: "Keypad-Secured Units", pos: "bottom-4 left-4" },
    ],
  },
  {
    src: "/images/facility-dock.jpg",
    title: "Dock Access for Deliveries",
    desc: "Roll-up dock doors with yellow safety bumpers accept palletized freight from any carrier - FedEx, UPS, LTL, and white-glove.",
    callouts: [
      { icon: Truck, label: "Dock-Height Access", pos: "bottom-4 right-4" },
      { icon: Video, label: "Dock Camera", pos: "top-4 left-4" },
    ],
  },
];

function FacilityGallery() {
  return (
    <section id="facility" className="py-16 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-slate-400 text-xs mb-6">
            <MapPin className="w-3.5 h-3.5 text-[#0A84FF]" /> Dallas–Fort Worth, TX
          </div>
          <h2 className="text-4xl font-black tracking-[-1.5px] text-white mb-3">
            Our facility, built for<br />
            <span className="text-[#0A84FF]">professional-grade staging.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Purpose-built for receiving, staging, and shipping technology equipment - every device tracked from dock to dispatch.
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

function FAQTeaser() {
  return (
    <section id="faq" className="py-16 border-t border-white/10">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">FAQ</span>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-8">Everything you need to know about Layer One services, pricing, onboarding, and facility security.</p>
        <a
          href="/faq"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
        >
          View all FAQs <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}

function CTA() {
  const { isAuthenticated } = useAuth();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  return (
    <section id="contact" className="py-16 border-t border-white/10">
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
            <p className="text-slate-500 text-sm mt-6">
              Prefer to talk? Call <a href="tel:+14695374378" className="text-[#0A84FF] hover:underline">(469) 537-4378</a> any time. Answered around the clock, no hold time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const FOOTER_SERVICES = [
  { href: "/services/it-equipment-staging-dallas-fort-worth", label: "IT Equipment Staging - DFW" },
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
  { href: "/services/tradeshow-event-equipment-storage", label: "Tradeshow & Event Storage" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 pt-14 pb-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div>
            <LayerOneLogo />
            <p className="text-slate-400 text-sm leading-relaxed mt-4 max-w-xs">
              The operational layer between equipment procurement and field deployment - serving the Dallas–Fort Worth metro and shipping nationwide.
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
              <li><a href="/about" className="text-sm text-slate-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="/team" className="text-sm text-slate-400 hover:text-white transition-colors">Meet the Team</a></li>
              <li><a href="/#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="/#why-layer-one" className="text-sm text-slate-400 hover:text-white transition-colors">Why Layer One</a></li>
              <li><a href="/#who-we-serve" className="text-sm text-slate-400 hover:text-white transition-colors">Who We Serve</a></li>
              <li><a href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="/faq" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/blog" className="text-sm text-slate-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="/get-started" className="text-sm text-slate-400 hover:text-white transition-colors">Request a Project Quote</a></li>
              <li><a href={getLoginUrl()} className="text-sm text-slate-400 hover:text-white transition-colors">Portal Login</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs text-center">
            © {new Date().getFullYear()} Layer One Staging · Dallas–Fort Worth, TX · <a href="tel:+14695374378" className="hover:text-white transition-colors">(469) 537-4378</a>
          </p>
          <div className="flex items-center gap-5">
            <span className="text-slate-500 text-xs uppercase tracking-widest font-bold">Follow Us</span>
            <a href="https://www.facebook.com/profile.php?id=61591450593413" target="_blank" rel="noopener noreferrer" aria-label="Layer One Staging on Facebook" className="text-slate-400 hover:text-white transition-colors">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="https://www.linkedin.com/company/l1staging" target="_blank" rel="noopener noreferrer" aria-label="Layer One Staging on LinkedIn" className="text-slate-400 hover:text-white transition-colors">
              <Linkedin className="w-6 h-6" />
            </a>
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
    "IT equipment staging, kitting, and deployment logistics. We receive, inventory, configure, label, QA, kit by location, and ship technology equipment deployment-ready - serving Dallas–Fort Worth and shipping nationwide.",
  url: "https://www.layeronestaging.com",
  email: "info@layeronestaging.com",
  telephone: "+1-469-537-4378",
  priceRange: "$$",
  sameAs: [
    "https://www.facebook.com/profile.php?id=61591450593413",
    "https://www.linkedin.com/company/l1staging",
  ],
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
        {/* Full-width warehouse image break */}
        <section className="relative border-t border-white/10 overflow-hidden">
          <img
            src="/images/warehouse-team-home.png"
            alt="Layer One Staging warehouse team preparing equipment"
            className="w-full h-72 md:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1320]/60 via-transparent to-transparent pointer-events-none" />
        </section>
        <WarehousingAsAService />
        <WhyLayerOne />
        <WhoWeServe />
        <PricingTeaser />
        <PortalSection />
        <DirectLine />
        <About />
        <FacilityGallery />
        <FAQTeaser />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
