import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, ArrowRight, CheckCircle, Zap, Shield, Truck,
  Server, Package, Warehouse, Box, Activity, FileText,
  Camera, Lock, Star, Phone, Mail, Building2, User, MessageSquare,
  Clock, BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";

const LOGO_URL = "/manus-storage/layerone-logo-on-dark_6114040f.png";

function NsdsLogo() {
  return (
    <img src={LOGO_URL} alt="Layer One" className="h-10 w-auto" />
  );
}

type Tier = {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  price: string;
  priceNote: string;
  featured: boolean;
  color: string;
  accentColor: string;
  gradient: string;
  devices: string;
  pallets: string;
  boxes: string;
  storage: string;
  support: string;
  features: { label: string; included: boolean }[];
  useCases: string[];
  highlights: { icon: React.ElementType; title: string; desc: string }[];
};

const TIERS: Record<string, Tier> = {
  basic: {
    id: "basic",
    name: "Project Staging Pilot",
    tagline: "Test the service on a small deployment.",
    desc: "For first-time customers testing Layer One on a single project. Includes full receiving, organization, intake photos, serial/MAC capture, and one outbound shipment coordination — no monthly commitment.",
    price: "$499",
    priceNote: "/project · one-time",
    featured: false,
    color: "text-[#39a7ff]",
    accentColor: "#39a7ff",
    gradient: "from-[#39a7ff]/20 to-transparent",
    devices: "Up to 5 active devices",
    pallets: "No pallet storage included",
    boxes: "Up to 5 boxes received",
    storage: "Up to 14-day project window",
    support: "Email support",
    features: [
      { label: "Customer portal access", included: true },
      { label: "Photo documentation", included: true },
      { label: "Receiving & logging", included: true },
      { label: "Activity log", included: true },
      { label: "Email support", included: true },
      { label: "Priority support", included: false },
      { label: "Dedicated coordinator", included: false },
      { label: "Rush staging", included: false },
      { label: "Custom workflows", included: false },
      { label: "API access", included: false },
    ],
    useCases: [
      "Single-site network installs",
      "Small office deployments",
      "Occasional equipment staging",
      "IT consultants with low volume",
    ],
    highlights: [
      { icon: Warehouse, title: "Secure Storage", desc: "Your equipment stored in our climate-controlled, camera-monitored facility." },
      { icon: Camera, title: "Photo Documentation", desc: "Every item photographed on receipt and visible in your portal." },
      { icon: Activity, title: "Activity Log", desc: "Full audit trail of every action taken on your account." },
    ],
  },
  standard: {
    id: "standard",
    name: "Shared Staging Shelf",
    tagline: "Light recurring receiving and short-term storage.",
    desc: "For MSPs and contractors with light recurring receiving, organization, and short-term storage needs. Assigned shelf/bin capacity with monthly usage summaries and up to 3 outbound shipment coordinations.",
    price: "$750",
    priceNote: "/month starting · 3, 6, or 12-mo terms",
    featured: false,
    color: "text-violet-400",
    accentColor: "#a78bfa",
    gradient: "from-violet-500/20 to-transparent",
    devices: "Up to 10 active devices stored",
    pallets: "Up to 1 pallet/month",
    boxes: "Up to 10 boxes/month",
    storage: "30-day storage per item",
    support: "3 outbound shipment coordinations/mo",
    features: [
      { label: "Customer portal access", included: true },
      { label: "Photo documentation", included: true },
      { label: "Receiving & logging", included: true },
      { label: "Activity log", included: true },
      { label: "Email support", included: true },
      { label: "Priority support", included: true },
      { label: "Dedicated coordinator", included: false },
      { label: "Rush staging", included: false },
      { label: "Custom workflows", included: false },
      { label: "API access", included: false },
    ],
    useCases: [
      "Multi-site rollouts",
      "Cabling & low-voltage contractors",
      "Growing MSP practices",
      "Regular equipment staging cycles",
    ],
    highlights: [
      { icon: Shield, title: "Priority Support", desc: "Your tickets jump the queue — faster response times for active projects." },
      { icon: FileText, title: "Full Billing Dashboard", desc: "Review every line-item charge before invoicing with no surprises." },
      { icon: Truck, title: "Carrier Coordination", desc: "We coordinate inbound and outbound shipments with any carrier." },
    ],
  },
  professional: {
    id: "professional",
    name: "Shared Staging Bay",
    tagline: "More volume, organized staging capacity.",
    desc: "Our most popular tier — purpose-built for recurring deployment work that needs more receiving volume and an organized staging zone. Includes dock/ramp coordination and up to 8 outbound shipment coordinations per month.",
    price: "$1,500",
    priceNote: "/month starting · 3, 6, or 12-mo terms",
    featured: true,
    color: "text-[#6ee7b7]",
    accentColor: "#6ee7b7",
    gradient: "from-[#6ee7b7]/20 to-transparent",
    devices: "Up to 30 active devices stored",
    pallets: "Up to 2 pallets/month",
    boxes: "Up to 25 boxes/month",
    storage: "30-day storage per item",
    support: "8 outbound shipment coordinations/mo",
    features: [
      { label: "Customer portal access", included: true },
      { label: "Photo documentation", included: true },
      { label: "Receiving & logging", included: true },
      { label: "Activity log", included: true },
      { label: "Email support", included: true },
      { label: "Priority support", included: true },
      { label: "Dedicated coordinator", included: true },
      { label: "Rush staging", included: true },
      { label: "Custom workflows", included: false },
      { label: "API access", included: false },
    ],
    useCases: [
      "Large multi-site network rollouts",
      "Security system installers",
      "Technology deployment firms",
      "High-volume MSP operations",
    ],
    highlights: [
      { icon: User, title: "Dedicated Coordinator", desc: "One point of contact who knows your projects and keeps things moving." },
      { icon: Zap, title: "Rush Staging", desc: "Need it fast? Rush staging gets your equipment configured and out the door." },
      { icon: BarChart3, title: "Full Billing Dashboard", desc: "Complete usage visibility with auto-generated invoices and overage tracking." },
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Dedicated Staging Area",
    tagline: "Separated project area with dedicated Layer One workflow.",
    desc: "For customers needing a separated project area, higher receiving volume, and a dedicated LayerOne-managed workflow. Includes weekly inventory reports, 20 outbound shipment coordinations, and one project coordination call per month.",
    price: "$3,500",
    priceNote: "/month starting · 3, 6, or 12-mo terms",
    featured: false,
    color: "text-yellow-400",
    accentColor: "#facc15",
    gradient: "from-yellow-500/20 to-transparent",
    devices: "Up to 75 active devices stored",
    pallets: "Up to 6 pallets/month",
    boxes: "Up to 75 boxes/month",
    storage: "45-day storage per item",
    support: "20 outbound shipment coordinations/mo",
    features: [
      { label: "Customer portal access", included: true },
      { label: "Photo documentation", included: true },
      { label: "Receiving & logging", included: true },
      { label: "Activity log", included: true },
      { label: "Email support", included: true },
      { label: "Priority support", included: true },
      { label: "Dedicated coordinator", included: true },
      { label: "Rush staging", included: true },
      { label: "Custom workflows", included: true },
      { label: "API access", included: true },
    ],
    useCases: [
      "Enterprise-scale network deployments",
      "National rollout programs",
      "Multi-region equipment staging",
      "Organizations with complex SLA requirements",
    ],
    highlights: [
      { icon: Lock, title: "Custom SLAs", desc: "Service level agreements tailored to your operational and compliance needs." },
      { icon: Server, title: "API Access", desc: "Integrate Layer One data directly into your own systems and dashboards." },
      { icon: Clock, title: "24/7 Support", desc: "Round-the-clock support for time-sensitive deployments." },
    ],
  },
  custom: {
    id: "custom",
    name: "Rollout Suite",
    tagline: "Multi-site deployments, national rollouts, and franchise tech.",
    desc: "For multi-site deployments, national rollout vendors, POS projects, security deployments, and franchise technology rollouts. Sole-use project area or dedicated suite with chain-of-custody tracking and custom Layer One labor blocks.",
    price: "Custom",
    priceNote: "/project or month · 3, 6, or 12-mo terms",
    featured: false,
    color: "text-pink-400",
    accentColor: "#f472b6",
    gradient: "from-pink-500/20 to-transparent",
    devices: "Up to 150 active devices stored",
    pallets: "Up to 20 pallets/month",
    boxes: "Up to 200 boxes/month",
    storage: "60-day storage per item",
    support: "50 outbound shipment coordinations/mo",
    features: [
      { label: "Customer portal access", included: true },
      { label: "Photo documentation", included: true },
      { label: "Receiving & logging", included: true },
      { label: "Activity log", included: true },
      { label: "Email support", included: true },
      { label: "Priority support", included: true },
      { label: "Dedicated coordinator", included: true },
      { label: "Rush staging", included: true },
      { label: "Custom workflows", included: true },
      { label: "API access", included: true },
    ],
    useCases: [
      "Organizations with unique operational requirements",
      "On-site staging and deployment",
      "White-glove equipment handling",
      "Custom integration requirements",
    ],
    highlights: [
      { icon: Star, title: "White-Glove Service", desc: "Every aspect of your engagement is handled with dedicated attention." },
      { icon: Building2, title: "On-Site Options", desc: "We can come to you — on-site staging available for select engagements." },
      { icon: FileText, title: "Executive Reporting", desc: "Custom reporting and dashboards for executive-level visibility." },
    ],
  },
};

const TIER_ORDER = ["basic", "standard", "professional", "enterprise", "custom"];

function InquiryForm({ tier }: { tier: Tier }) {
  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "", devices: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitMutation = trpc.inquiry.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message ?? "Submission failed. Please try again."),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    submitMutation.mutate({
      name: form.name,
      company: form.company,
      email: form.email,
      phone: form.phone || undefined,
      tier: tier.id as "basic" | "standard" | "professional" | "enterprise" | "custom",
      deviceVolume: form.devices || undefined,
      message: form.message || undefined,
    });
  };

  const submitting = submitMutation.isPending;

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#6ee7b7]/30 bg-[#6ee7b7]/5 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#6ee7b7]/15 border border-[#6ee7b7]/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-[#6ee7b7]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Request received!</h3>
        <p className="text-[#b7c5d5] text-sm leading-relaxed max-w-sm mx-auto">
          Thanks for your interest in the <strong className="text-white">{tier.name}</strong> package. Our team will reach out within one business day to discuss your requirements and provide a custom quote.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#b7c5d5] mb-1.5">Full Name *</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Jane Smith"
            className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#39a7ff]/60 focus:bg-white/8 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#b7c5d5] mb-1.5">Company *</label>
          <input
            required
            type="text"
            value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            placeholder="Acme Networks LLC"
            className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#39a7ff]/60 focus:bg-white/8 transition-colors"
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#b7c5d5] mb-1.5">Work Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="jane@acmenetworks.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#39a7ff]/60 focus:bg-white/8 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#b7c5d5] mb-1.5">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="(817) 555-0100"
            className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#39a7ff]/60 focus:bg-white/8 transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#b7c5d5] mb-1.5">Estimated monthly device volume</label>
        <select
          value={form.devices}
          onChange={e => setForm(f => ({ ...f, devices: e.target.value }))}
          className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[#0d1f35] text-white text-sm focus:outline-none focus:border-[#39a7ff]/60 transition-colors"
        >
          <option value="">Select a range...</option>
          <option value="1-25">1–25 devices</option>
          <option value="26-50">26–50 devices</option>
          <option value="51-150">51–150 devices</option>
          <option value="151-400">151–400 devices</option>
          <option value="400+">400+ devices</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#b7c5d5] mb-1.5">Tell us about your project</label>
        <textarea
          rows={4}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Describe your staging needs, timeline, equipment types, or any special requirements..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#39a7ff]/60 focus:bg-white/8 transition-colors resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#39a7ff] to-[#6ee7b7] text-[#06111f] hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 shadow-[0_14px_34px_rgba(57,167,255,0.24)]"
      >
        {submitting ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Sending request...
          </>
        ) : (
          <>
            Request a Quote for {tier.name} <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <p className="text-xs text-[#b7c5d5]/60 text-center">
        No commitment required. We'll respond within 1 business day.
      </p>
    </form>
  );
}

export default function PackageDetail() {
  const params = useParams<{ tier: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const tierId = params.tier?.toLowerCase() ?? "";
  const tier = TIERS[tierId];

  // Scroll to top whenever the tier changes (navigating between package pages)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tierId]);

  if (!tier) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #07111f, #0d1f35)", color: "#f5f8fc" }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Package not found</h1>
          <button onClick={() => setLocation("/")} className="text-[#39a7ff] hover:underline text-sm">
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  const currentIndex = TIER_ORDER.indexOf(tierId);
  const prevTier = currentIndex > 0 ? TIERS[TIER_ORDER[currentIndex - 1]] : null;
  const nextTier = currentIndex < TIER_ORDER.length - 1 ? TIERS[TIER_ORDER[currentIndex + 1]] : null;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "radial-gradient(circle at top left, rgba(57,167,255,0.15) 0%, transparent 35%), linear-gradient(135deg, #07111f, #0d1f35)",
        color: "#f5f8fc",
      }}
    >
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-[#b7c5d5] hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <NsdsLogo />
          </button>
          <div className="flex items-center gap-3">
            <a href="/#packages" className="text-sm text-[#b7c5d5] hover:text-white transition-colors px-3 py-2">
              All Packages
            </a>
            {isAuthenticated ? (
              <button
                onClick={() => setLocation("/dashboard")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#39a7ff] to-[#6ee7b7] text-[#06111f] hover:-translate-y-0.5 transition-transform"
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <a
                href={getLoginUrl()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#39a7ff] to-[#6ee7b7] text-[#06111f] hover:-translate-y-0.5 transition-transform"
              >
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6">

          {/* Hero */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setLocation("/")}
                className="flex items-center gap-1.5 text-xs text-[#b7c5d5] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Home
              </button>
              <span className="text-white/20">/</span>
              <span className="text-xs text-[#b7c5d5]">Packages</span>
              <span className="text-white/20">/</span>
              <span className="text-xs text-white font-medium">{tier.name}</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                {tier.featured && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6ee7b7]/15 border border-[#6ee7b7]/30 text-[#6ee7b7] text-xs font-bold mb-4">
                    <Zap className="w-3 h-3" /> Most Popular
                  </div>
                )}
                <h1 className="text-5xl font-black tracking-[-2px] text-white mb-2">
                  {tier.name}
                </h1>
                <p className={`text-xl font-semibold mb-4 ${tier.color}`}>{tier.tagline}</p>
                <p className="text-[#b7c5d5] text-lg leading-relaxed mb-8">{tier.desc}</p>

                {/* Capacity grid */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { icon: Server, label: "Devices", value: tier.devices },
                    { icon: Warehouse, label: "Pallets", value: tier.pallets },
                    { icon: Box, label: "Boxes", value: tier.boxes },
                    { icon: Camera, label: "Storage", value: tier.storage },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <m.icon className={`w-4 h-4 ${tier.color}`} />
                        <span className="text-xs text-[#b7c5d5]">{m.label}</span>
                      </div>
                      <p className="text-sm font-bold text-white">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Feature checklist */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-sm font-bold text-white mb-4">What's included</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {tier.features.map(f => (
                      <div key={f.label} className="flex items-center gap-2">
                        {f.included ? (
                          <CheckCircle className="w-3.5 h-3.5 text-[#6ee7b7] shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />
                        )}
                        <span className={`text-xs ${f.included ? "text-[#b7c5d5]" : "text-white/25 line-through"}`}>
                          {f.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inquiry form */}
              <div>
                <div className="rounded-2xl border border-white/12 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)] sticky top-24">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-lg font-bold text-white">Request a Quote</h2>
                      <span className={`text-sm font-bold ${tier.color}`}>{tier.price}</span>
                    </div>
                    <p className="text-xs text-[#b7c5d5]">{tier.priceNote}</p>
                  </div>
                  <InquiryForm tier={tier} />
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-center gap-5 text-xs text-[#b7c5d5]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#39a7ff]" />
                      (817) 555-Layer One
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#39a7ff]" />
                      hello@nsds.com
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="mb-16">
            <h2 className="text-2xl font-black tracking-tight text-white mb-6">Why {tier.name}?</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {tier.highlights.map(h => (
                <div key={h.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4`}
                    style={{ borderColor: `${tier.accentColor}30`, background: `${tier.accentColor}15` }}>
                    <h.icon className="w-5 h-5" style={{ color: tier.accentColor }} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{h.title}</h3>
                  <p className="text-xs text-[#b7c5d5] leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Use cases */}
          <div className="mb-16">
            <h2 className="text-2xl font-black tracking-tight text-white mb-6">Who is {tier.name} for?</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {tier.useCases.map(u => (
                <div key={u} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                  <CheckCircle className="w-4 h-4 text-[#6ee7b7] shrink-0" />
                  <span className="text-sm text-[#b7c5d5]">{u}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compare / nav to other tiers */}
          <div className="border-t border-white/8 pt-12">
            <h2 className="text-xl font-bold text-white mb-6 text-center">Compare other packages</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {TIER_ORDER.map(tid => {
                const t = TIERS[tid];
                const isActive = tid === tierId;
                return (
                  <button
                    key={tid}
                    onClick={() => setLocation(`/packages/${tid}`)}
                    className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                      isActive
                        ? "border-[#39a7ff]/40 bg-[#39a7ff]/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {t.featured && (
                      <div className="text-[10px] font-bold text-[#6ee7b7] mb-1">★ Popular</div>
                    )}
                    <p className={`text-sm font-bold mb-1 ${isActive ? "text-[#39a7ff]" : "text-white"}`}>{t.name}</p>
                    <p className="text-[10px] text-[#b7c5d5] leading-relaxed">{t.tagline}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prev / Next nav */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/8">
            {prevTier ? (
              <button
                onClick={() => setLocation(`/packages/${prevTier.id}`)}
                className="flex items-center gap-2 text-sm text-[#b7c5d5] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {prevTier.name}
              </button>
            ) : <div />}
            {nextTier ? (
              <button
                onClick={() => setLocation(`/packages/${nextTier.id}`)}
                className="flex items-center gap-2 text-sm text-[#b7c5d5] hover:text-white transition-colors"
              >
                {nextTier.name} <ArrowRight className="w-4 h-4" />
              </button>
            ) : <div />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <NsdsLogo />
          <p className="text-[#b7c5d5] text-sm">© {new Date().getFullYear()} Network Staging &amp; Deployment Solutions · Dallas, TX</p>
          <button onClick={() => setLocation("/")} className="text-sm text-[#b7c5d5] hover:text-white transition-colors">
            ← Back to home
          </button>
        </div>
      </footer>
    </div>
  );
}
