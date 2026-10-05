import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, CheckCircle2, Loader2, Building2, User, Mail, Phone,
  MessageSquare, ChevronRight, Monitor, Smartphone, Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-white/6 border border-white/12 text-white placeholder-white/30 focus:outline-none focus:border-[#0A84FF]/60 focus:bg-white/8 transition-colors";

type Platform = "windows" | "apple";

const GDAP_OPTIONS = [
  { value: "", label: "Select your situation" },
  { value: "have-gdap", label: "We already have a GDAP partner relationship" },
  { value: "need-invite", label: "We need a GDAP invitation from Layer One" },
  { value: "not-sure", label: "Not sure what GDAP is" },
];

const VOLUME_OPTIONS = [
  { value: "", label: "Select expected volume" },
  { value: "1-25", label: "1-25 devices" },
  { value: "26-100", label: "26-100 devices" },
  { value: "101-500", label: "101-500 devices" },
  { value: "500-plus", label: "500+ devices" },
  { value: "ongoing", label: "Ongoing / recurring" },
];

const TIMELINE_OPTIONS = [
  { value: "", label: "Select timeline" },
  { value: "asap", label: "ASAP - devices ready to ship" },
  { value: "2-4-weeks", label: "2-4 weeks" },
  { value: "1-3-months", label: "1-3 months" },
  { value: "planning", label: "Just planning ahead" },
];

function usePageMeta(title: string, description: string, canonicalPath: string) {
  useEffect(() => {
    document.title = title;
    const setMeta = (attr: string, key: string, value: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", `https://www.layeronestaging.com${canonicalPath}`);
  }, [title, description, canonicalPath]);
}

/**
 * Zero-touch enrollment intake form for MSPs. Collects the minimum info
 * needed to start an enrollment engagement: contact details, which
 * platforms (Windows Autopilot / Apple Business Manager), tenant and
 * profile identifiers, and expected volume/timeline. Submits into the
 * existing inquiry pipeline with quoteType "enrollment".
 */
export default function Enrollment() {
  usePageMeta(
    "Zero-Touch Enrollment Setup | Layer One Staging, DFW",
    "Get your devices enrolled in Windows Autopilot or Apple Business Manager before they ship. Quick setup form for MSPs - most of it takes under five minutes.",
    "/enrollment"
  );

  const [submitted, setSubmitted] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    intuneTenant: "",
    gdapStatus: "",
    autopilotProfiles: "",
    abmOrgId: "",
    mdmServer: "",
    enrollmentDeviceTypes: "",
    enrollmentVolume: "",
    enrollmentTimeline: "",
    message: "",
  });
  type FormField = keyof typeof form;

  const set = (field: FormField) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const togglePlatform = (p: Platform) =>
    setPlatforms(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]));

  const hasWindows = platforms.includes("windows");
  const hasApple = platforms.includes("apple");

  const submitMutation = trpc.inquiry.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: err => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (platforms.length === 0) {
      toast.error("Please select at least one platform (Windows or Apple).");
      return;
    }
    submitMutation.mutate({
      name: form.name,
      company: form.company,
      email: form.email,
      phone: form.phone,
      quoteType: "enrollment",
      enrollmentPlatforms: platforms,
      intuneTenant: form.intuneTenant || undefined,
      gdapStatus: form.gdapStatus || undefined,
      autopilotProfiles: form.autopilotProfiles || undefined,
      abmOrgId: form.abmOrgId || undefined,
      mdmServer: form.mdmServer || undefined,
      enrollmentDeviceTypes: form.enrollmentDeviceTypes || undefined,
      enrollmentVolume: form.enrollmentVolume || undefined,
      enrollmentTimeline: form.enrollmentTimeline || undefined,
      message: form.message || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#06111f] text-white flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <CheckCircle2 className="w-16 h-16 text-[#6ee7b7] mx-auto mb-6" />
          <h1 className="text-3xl font-extrabold mb-4">You're on the list.</h1>
          <p className="text-[#b7c5d5] text-lg mb-2">
            We've got your enrollment details for <span className="text-white font-semibold">{form.company}</span>.
          </p>
          <p className="text-[#b7c5d5] mb-8">
            Watch your inbox - you'll get a confirmation email with the exact next steps,
            including the one-page tenant access agreement to sign.
          </p>
          <Link
            href="/services/zero-touch-enrollment"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] text-[#06111f] hover:-translate-y-0.5 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Zero-Touch Enrollment
          </Link>
        </div>
      </div>
    );
  }

  const platformCard = (p: Platform, icon: React.ReactNode, title: string, desc: string) => {
    const active = platforms.includes(p);
    return (
      <button
        key={p}
        type="button"
        onClick={() => togglePlatform(p)}
        className={`flex-1 text-left rounded-2xl border p-5 transition-all ${
          active
            ? "border-[#0A84FF] bg-[#0A84FF]/10 shadow-[0_0_24px_rgba(10,132,255,0.25)]"
            : "border-white/12 bg-white/5 hover:border-white/25"
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-[#0A84FF]/20" : "bg-white/8"}`}>
            {icon}
          </div>
          <span className="font-bold text-white">{title}</span>
          {active && <CheckCircle2 className="w-5 h-5 text-[#6ee7b7] ml-auto" />}
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/8 max-w-4xl mx-auto">
        <Link href="/services/zero-touch-enrollment" className="flex items-center gap-2 text-[#b7c5d5] hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Zero-Touch Enrollment
        </Link>
        <span className="text-sm text-[#b7c5d5]/60">Takes about 5 minutes</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0A84FF]/30 bg-[#0A84FF]/10 text-[#0A84FF] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Zero-Touch Enrollment Setup
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 leading-tight">
            Get your devices<br />
            <span className="bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] bg-clip-text text-transparent">enrolled before they ship</span>
          </h1>
          <p className="text-[#b7c5d5] text-lg">
            Tell us where to enroll your devices and we'll take it from there.
            Most MSPs finish this in under five minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Contact ── */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-bold text-white mb-4">Your info</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                  <User className="inline w-3.5 h-3.5 mr-1 opacity-70" />Your Name *
                </label>
                <input required value={form.name} onChange={set("name")} placeholder="Jane Smith" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                  <Building2 className="inline w-3.5 h-3.5 mr-1 opacity-70" />Company *
                </label>
                <input required value={form.company} onChange={set("company")} placeholder="Acme MSP" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                  <Mail className="inline w-3.5 h-3.5 mr-1 opacity-70" />Email *
                </label>
                <input required type="email" value={form.email} onChange={set("email")} placeholder="jane@acmemsp.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                  <Phone className="inline w-3.5 h-3.5 mr-1 opacity-70" />Phone *
                </label>
                <input required value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" minLength={7} className={inputClass} />
              </div>
            </div>
          </section>

          {/* ── Platforms ── */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-bold text-white mb-1">Which platforms? *</h2>
            <p className="text-sm text-slate-400 mb-4">Pick one or both. We'll enroll devices into the right system for each.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {platformCard(
                "windows",
                <Monitor className="w-5 h-5 text-[#0A84FF]" />,
                "Windows Autopilot",
                "Devices register in your Intune tenant and get your Autopilot deployment profile automatically."
              )}
              {platformCard(
                "apple",
                <Smartphone className="w-5 h-5 text-[#0A84FF]" />,
                "Apple Business Manager",
                "Devices assign to your MDM server in ABM so they enroll on first boot."
              )}
            </div>
          </section>

          {/* ── Windows details ── */}
          {hasWindows && (
            <section className="rounded-2xl border border-[#0A84FF]/30 bg-[#0A84FF]/[0.04] p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[#0A84FF]" /> Windows Autopilot details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                    Intune tenant domain
                  </label>
                  <input value={form.intuneTenant} onChange={set("intuneTenant")} placeholder="contoso.onmicrosoft.com" className={inputClass} />
                  <p className="text-xs text-[#b7c5d5]/60 mt-1.5">Your Microsoft 365 tenant - we'll never ask for your admin password.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                    Partner access (GDAP)
                  </label>
                  <select value={form.gdapStatus} onChange={set("gdapStatus")} className={inputClass}>
                    {GDAP_OPTIONS.map(o => (
                      <option key={o.value} value={o.value} className="bg-[#0d1f35]">{o.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[#b7c5d5]/60 mt-1.5">
                    We enroll through Microsoft's delegated partner access - scoped to device enrollment only, revocable anytime.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                    Autopilot profile name(s)
                  </label>
                  <input value={form.autopilotProfiles} onChange={set("autopilotProfiles")} placeholder="e.g. Standard Laptop Profile, Kiosk Profile" className={inputClass} />
                  <p className="text-xs text-[#b7c5d5]/60 mt-1.5">Which deployment profile each device type should get. Leave blank and we'll confirm on a quick call.</p>
                </div>
              </div>
            </section>
          )}

          {/* ── Apple details ── */}
          {hasApple && (
            <section className="rounded-2xl border border-[#0A84FF]/30 bg-[#0A84FF]/[0.04] p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#0A84FF]" /> Apple Business Manager details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                    ABM Organization ID
                  </label>
                  <input value={form.abmOrgId} onChange={set("abmOrgId")} placeholder="Found in ABM under Settings" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                    MDM server name
                  </label>
                  <input value={form.mdmServer} onChange={set("mdmServer")} placeholder="e.g. Mosyle, Jamf, Kandji" className={inputClass} />
                  <p className="text-xs text-[#b7c5d5]/60 mt-1.5">Which MDM server in ABM devices should be assigned to.</p>
                </div>
              </div>
            </section>
          )}

          {/* ── Volume & timeline ── */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-bold text-white mb-4">Devices & timing</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                  Device types
                </label>
                <input value={form.enrollmentDeviceTypes} onChange={set("enrollmentDeviceTypes")} placeholder="e.g. Dell Latitude 5440, MacBook Air" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                  Expected volume
                </label>
                <select value={form.enrollmentVolume} onChange={set("enrollmentVolume")} className={inputClass}>
                  {VOLUME_OPTIONS.map(o => (
                    <option key={o.value} value={o.value} className="bg-[#0d1f35]">{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                  Timeline
                </label>
                <select value={form.enrollmentTimeline} onChange={set("enrollmentTimeline")} className={inputClass}>
                  {TIMELINE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value} className="bg-[#0d1f35]">{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                  <MessageSquare className="inline w-3.5 h-3.5 mr-1 opacity-70" />Anything else <span className="text-[#b7c5d5]/50">(optional)</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={set("message")}
                  rows={3}
                  placeholder="Special requirements, questions, or context we should know..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] text-[#06111f] hover:-translate-y-0.5 active:scale-[0.98] transition-transform shadow-[0_14px_34px_rgba(57,167,255,0.24)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {submitMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
            ) : (
              <>Start Zero-Touch Enrollment <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
          <p className="text-center text-xs text-[#b7c5d5]/60">
            No credit card required. We'll review your details and send the access agreement within 1 business day.
          </p>
        </form>
      </div>
    </div>
  );
}
