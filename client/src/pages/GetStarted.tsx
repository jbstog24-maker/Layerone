import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Loader2, Building2, User, Mail, Phone, Package, MessageSquare, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const SERVICES = [
  { value: "basic", label: "Basic", desc: "Small deployments, up to 25 devices" },
  { value: "standard", label: "Standard", desc: "Mid-size rollouts, up to 100 devices" },
  { value: "professional", label: "Professional", desc: "Large deployments, up to 500 devices" },
  { value: "enterprise", label: "Enterprise", desc: "Unlimited scale, dedicated support" },
  { value: "custom", label: "Custom / Not Sure", desc: "Tell us what you need" },
] as const;

type Tier = typeof SERVICES[number]["value"];

export default function GetStarted() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    tier: "" as Tier | "",
    deviceVolume: "",
    message: "",
  });

  const submitMutation = trpc.inquiry.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err.message || "Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tier) {
      toast.error("Please select a service tier.");
      return;
    }
    submitMutation.mutate({
      name: form.name,
      company: form.company,
      email: form.email,
      phone: form.phone || undefined,
      tier: form.tier as Tier,
      deviceVolume: form.deviceVolume || undefined,
      message: form.message || undefined,
    });
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#06111f] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#39a7ff]/15 border border-[#39a7ff]/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#6ee7b7]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Request Received!</h1>
          <p className="text-[#b7c5d5] text-lg mb-2">
            Thanks, <span className="text-white font-semibold">{form.name}</span>. We'll be in touch shortly.
          </p>
          <p className="text-[#b7c5d5] text-sm mb-8">
            A confirmation has been sent to <span className="text-white">{form.email}</span>. Our team typically responds within one business day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold border border-white/15 bg-white/5 text-white hover:-translate-y-0.5 transition-transform"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <a
              href={getLoginUrl()}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold bg-gradient-to-r from-[#39a7ff] to-[#6ee7b7] text-[#06111f] hover:-translate-y-0.5 transition-transform"
            >
              Sign In <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/8 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#b7c5d5] hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <a
          href={getLoginUrl()}
          className="text-sm text-[#b7c5d5] hover:text-white transition-colors"
        >
          Already have an account? <span className="text-[#39a7ff] font-semibold">Sign In</span>
        </a>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#39a7ff]/30 bg-[#39a7ff]/10 text-[#39a7ff] text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7] animate-pulse" />
            Free Consultation
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 leading-tight">
            Get Started with<br />
            <span className="bg-gradient-to-r from-[#39a7ff] to-[#6ee7b7] bg-clip-text text-transparent">Layer One</span>
          </h1>
          <p className="text-[#b7c5d5] text-lg">
            Tell us about your deployment needs and we'll put together a custom quote. No commitment required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name + Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                <User className="inline w-3.5 h-3.5 mr-1 opacity-70" />Full Name <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="Jane Smith"
                className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/12 text-white placeholder-white/30 focus:outline-none focus:border-[#39a7ff]/60 focus:bg-white/8 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                <Building2 className="inline w-3.5 h-3.5 mr-1 opacity-70" />Company <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="text"
                value={form.company}
                onChange={set("company")}
                placeholder="Acme Networks"
                className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/12 text-white placeholder-white/30 focus:outline-none focus:border-[#39a7ff]/60 focus:bg-white/8 transition-colors"
              />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                <Mail className="inline w-3.5 h-3.5 mr-1 opacity-70" />Email <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="jane@acmenetworks.com"
                className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/12 text-white placeholder-white/30 focus:outline-none focus:border-[#39a7ff]/60 focus:bg-white/8 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
                <Phone className="inline w-3.5 h-3.5 mr-1 opacity-70" />Phone <span className="text-[#b7c5d5]/50 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="(214) 555-0100"
                className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/12 text-white placeholder-white/30 focus:outline-none focus:border-[#39a7ff]/60 focus:bg-white/8 transition-colors"
              />
            </div>
          </div>

          {/* Service Tier */}
          <div>
            <label className="block text-sm font-medium text-[#b7c5d5] mb-3">
              <Package className="inline w-3.5 h-3.5 mr-1 opacity-70" />Service Tier <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SERVICES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, tier: s.value }))}
                  className={`text-left px-4 py-3 rounded-xl border transition-all ${
                    form.tier === s.value
                      ? "border-[#39a7ff] bg-[#39a7ff]/15 text-white"
                      : "border-white/12 bg-white/4 text-[#b7c5d5] hover:border-white/25 hover:bg-white/8"
                  }`}
                >
                  <div className="font-semibold text-sm mb-0.5">{s.label}</div>
                  <div className="text-xs opacity-70">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Device Volume */}
          <div>
            <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
              Estimated Device Volume <span className="text-[#b7c5d5]/50 font-normal">(optional)</span>
            </label>
            <select
              value={form.deviceVolume}
              onChange={set("deviceVolume")}
              className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/12 text-white focus:outline-none focus:border-[#39a7ff]/60 focus:bg-white/8 transition-colors appearance-none"
            >
              <option value="" className="bg-[#06111f]">Select a range…</option>
              <option value="1-25" className="bg-[#06111f]">1–25 devices</option>
              <option value="26-100" className="bg-[#06111f]">26–100 devices</option>
              <option value="101-500" className="bg-[#06111f]">101–500 devices</option>
              <option value="500+" className="bg-[#06111f]">500+ devices</option>
              <option value="not-sure" className="bg-[#06111f]">Not sure yet</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
              <MessageSquare className="inline w-3.5 h-3.5 mr-1 opacity-70" />Tell Us More <span className="text-[#b7c5d5]/50 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.message}
              onChange={set("message")}
              rows={4}
              placeholder="Describe your deployment, timeline, special requirements, or any questions you have…"
              className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/12 text-white placeholder-white/30 focus:outline-none focus:border-[#39a7ff]/60 focus:bg-white/8 transition-colors resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#39a7ff] to-[#6ee7b7] text-[#06111f] hover:-translate-y-0.5 active:scale-[0.98] transition-transform shadow-[0_14px_34px_rgba(57,167,255,0.24)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {submitMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
            ) : (
              <>Request a Quote <ChevronRight className="w-5 h-5" /></>
            )}
          </button>

          <p className="text-center text-xs text-[#b7c5d5]/60">
            No credit card required. We'll reach out within one business day.
          </p>
        </form>
      </div>
    </div>
  );
}
