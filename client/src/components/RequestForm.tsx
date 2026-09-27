import { useState } from "react";
import {
  CheckCircle2, Loader2, Building2, User, Mail, Phone,
  Package, MessageSquare, ChevronRight, Server, Box, Layers, Clock, Wrench,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const SERVICES = [
  { value: "basic", label: "Basic", desc: "Up to 25 devices / month", price: "From $299/mo" },
  { value: "standard", label: "Standard", desc: "Up to 100 devices / month", price: "From $699/mo" },
  { value: "professional", label: "Professional", desc: "Up to 500 devices / month", price: "From $1,499/mo" },
  { value: "enterprise", label: "Enterprise", desc: "Unlimited scale", price: "Custom pricing" },
  { value: "custom", label: "Not Sure Yet", desc: "We'll recommend the right tier", price: "Let us help" },
] as const;

type Tier = typeof SERVICES[number]["value"];

const ADDONS = [
  { key: "photo_doc", label: "Photo Documentation", desc: "Full chain-of-custody photos" },
  { key: "asset_tagging", label: "Asset Tagging & Labeling", desc: "Barcode / QR labeling" },
  { key: "firmware", label: "Firmware & Config Staging", desc: "Pre-configure before deployment" },
  { key: "custom_kitting", label: "Custom Kitting", desc: "Per-site box assembly" },
  { key: "expedited", label: "Expedited Turnaround", desc: "Priority processing" },
  { key: "onsite_delivery", label: "On-site Delivery", desc: "DFW metro delivery" },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-white/6 border border-white/12 text-white placeholder-white/30 focus:outline-none focus:border-[#0A84FF]/60 focus:bg-white/8 transition-colors";

/**
 * The Layer One quote-request form. Shared by the /get-started page and the
 * site-wide floating "Request a Quote" dialog so the branding, fields, and
 * behavior stay identical everywhere.
 */
export default function RequestForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    tier: "" as Tier | "",
    deviceCount: "",
    palletCount: "",
    boxCount: "",
    storageDays: "",
    message: "",
  });

  const submitMutation = trpc.inquiry.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      onSubmitted?.();
    },
    onError: err => toast.error(err.message || "Something went wrong. Please try again."),
  });

  const toggleAddon = (key: string) =>
    setSelectedAddons(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );

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
      deviceCount: form.deviceCount ? parseInt(form.deviceCount) : undefined,
      palletCount: form.palletCount ? parseInt(form.palletCount) : undefined,
      boxCount: form.boxCount ? parseInt(form.boxCount) : undefined,
      storageDays: form.storageDays ? parseInt(form.storageDays) : undefined,
      addons: selectedAddons.length > 0 ? selectedAddons : undefined,
      message: form.message || undefined,
    });
  };

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="w-20 h-20 rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-[#6ee7b7]" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Request Received!</h3>
        <p className="text-[#b7c5d5] mb-2">
          Thanks, <span className="text-white font-semibold">{form.name}</span>. A
          Layer One rep will be in touch shortly.
        </p>
        <p className="text-[#b7c5d5] text-sm">
          A confirmation has been sent to <span className="text-white">{form.email}</span>.
          Our team typically responds within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Contact Info ── */}
      <section>
        <h2 className="text-sm font-semibold text-[#b7c5d5] uppercase tracking-wider mb-4 flex items-center gap-2">
          <User className="w-4 h-4" /> Contact Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input required type="text" value={form.name} onChange={set("name")} placeholder="Jane Smith" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
              <Building2 className="inline w-3.5 h-3.5 mr-1 opacity-70" />Company <span className="text-red-400">*</span>
            </label>
            <input required type="text" value={form.company} onChange={set("company")} placeholder="Acme Networks" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
              <Mail className="inline w-3.5 h-3.5 mr-1 opacity-70" />Email <span className="text-red-400">*</span>
            </label>
            <input required type="email" value={form.email} onChange={set("email")} placeholder="jane@acmenetworks.com" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
              <Phone className="inline w-3.5 h-3.5 mr-1 opacity-70" />Phone <span className="text-[#b7c5d5]/50 font-normal">(optional)</span>
            </label>
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="(214) 555-0100" className={inputClass} />
          </div>
        </div>
      </section>

      {/* ── Service Tier ── */}
      <section>
        <h2 className="text-sm font-semibold text-[#b7c5d5] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" /> Service Tier <span className="text-red-400 font-normal normal-case tracking-normal">*</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SERVICES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, tier: s.value }))}
              className={`text-left px-4 py-3.5 rounded-xl border transition-all ${
                form.tier === s.value
                  ? "border-[#0A84FF] bg-[#0A84FF]/15 text-white"
                  : "border-white/12 bg-white/4 text-[#b7c5d5] hover:border-white/25 hover:bg-white/8"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm">{s.label}</span>
                <span className={`text-xs font-medium ${form.tier === s.value ? "text-[#6ee7b7]" : "text-[#b7c5d5]/60"}`}>{s.price}</span>
              </div>
              <div className="text-xs opacity-70">{s.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Volume Requirements ── */}
      <section>
        <h2 className="text-sm font-semibold text-[#b7c5d5] uppercase tracking-wider mb-1 flex items-center gap-2">
          <Server className="w-4 h-4" /> Volume Requirements
        </h2>
        <p className="text-xs text-[#b7c5d5]/60 mb-4">Estimates are fine — this helps us build an accurate quote.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(
            [
              { field: "deviceCount", label: "Devices", icon: Server, ph: "e.g. 50" },
              { field: "palletCount", label: "Pallets", icon: Layers, ph: "e.g. 4" },
              { field: "boxCount", label: "Boxes", icon: Box, ph: "e.g. 20" },
              { field: "storageDays", label: "Storage Days", icon: Clock, ph: "e.g. 30" },
            ] as const
          ).map(({ field, label, icon: Icon, ph }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-[#b7c5d5] mb-1.5 flex items-center gap-1">
                <Icon className="w-3 h-3" /> {label}
              </label>
              <input
                type="number"
                min="0"
                value={form[field]}
                onChange={set(field)}
                placeholder={ph}
                className="w-full px-3 py-2.5 rounded-xl bg-white/6 border border-white/12 text-white placeholder-white/30 focus:outline-none focus:border-[#0A84FF]/60 transition-colors text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Add-ons ── */}
      <section>
        <h2 className="text-sm font-semibold text-[#b7c5d5] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4" /> Add-ons <span className="text-[#b7c5d5]/50 font-normal normal-case tracking-normal">(optional)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ADDONS.map(a => (
            <button
              key={a.key}
              type="button"
              onClick={() => toggleAddon(a.key)}
              className={`text-left px-4 py-3 rounded-xl border transition-all flex items-start gap-3 ${
                selectedAddons.includes(a.key)
                  ? "border-[#6ee7b7]/50 bg-[#6ee7b7]/10 text-white"
                  : "border-white/10 bg-white/4 text-[#b7c5d5] hover:border-white/20 hover:bg-white/6"
              }`}
            >
              <div
                className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  selectedAddons.includes(a.key) ? "bg-[#6ee7b7] border-[#6ee7b7]" : "border-white/25"
                }`}
              >
                {selectedAddons.includes(a.key) && (
                  <svg className="w-2.5 h-2.5 text-[#06111f]" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <div className="text-sm font-medium">{a.label}</div>
                <div className="text-xs opacity-60">{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Message ── */}
      <section>
        <label className="block text-sm font-medium text-[#b7c5d5] mb-1.5">
          <MessageSquare className="inline w-3.5 h-3.5 mr-1 opacity-70" />Additional Notes <span className="text-[#b7c5d5]/50">(optional)</span>
        </label>
        <textarea
          value={form.message}
          onChange={set("message")}
          rows={4}
          placeholder="Describe your deployment timeline, special requirements, or any questions…"
          className={`${inputClass} resize-none`}
        />
      </section>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={submitMutation.isPending}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] text-[#06111f] hover:-translate-y-0.5 active:scale-[0.98] transition-transform shadow-[0_14px_34px_rgba(57,167,255,0.24)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
      >
        {submitMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Submitting…
          </>
        ) : (
          <>
            Request a Quote <ChevronRight className="w-5 h-5" />
          </>
        )}
      </button>
      <p className="text-center text-xs text-[#b7c5d5]/60">
        No credit card required. A rep will review your requirements and send a custom quote.
      </p>
    </form>
  );
}
