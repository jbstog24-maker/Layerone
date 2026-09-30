import { useState } from "react";
import {
  CheckCircle2, Loader2, Building2, User, Mail, Phone,
  MessageSquare, ChevronRight, Server, Box, Layers, Clock, Wrench,
  MapPin, CalendarDays, Cpu, ClipboardList, Forklift,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type QuoteType = "project" | "pallet";

const QUOTE_TYPES: { value: QuoteType; label: string; desc: string; price: string }[] = [
  {
    value: "project",
    label: "Project Quote",
    desc: "Multi-site rollout — locations, devices, services & schedule scoped into one custom project price.",
    price: "Custom",
  },
  {
    value: "pallet",
    label: "Per-Pallet Quote",
    desc: "Straightforward pallet pricing — $12/pallet receiving, $30/pallet/month storage, plus the services you pick.",
    price: "Per pallet",
  },
];

const ADDONS = [
  { key: "photo_doc", label: "Photo Documentation", desc: "Full chain-of-custody photos" },
  { key: "asset_tagging", label: "Asset Tagging & Labeling", desc: "Barcode / QR labeling" },
  { key: "firmware", label: "Firmware & Config Staging", desc: "Pre-configure before deployment" },
  { key: "custom_kitting", label: "Custom Kitting", desc: "Per-site box assembly" },
  { key: "expedited", label: "Expedited Turnaround", desc: "Priority processing" },
  { key: "onsite_delivery", label: "On-site Delivery", desc: "DFW metro — $175/pallet, $30/device" },
];

const EQUIPMENT_TYPES = [
  "Network & Switching",
  "Wi-Fi / Access Points",
  "POS Systems",
  "Servers & Compute",
  "Kiosks & Displays",
  "Cabling & Infrastructure",
  "Other",
];

const ROLLOUT_DURATIONS = [
  { value: "under-1-month", label: "Under 1 month" },
  { value: "1-3-months", label: "1–3 months" },
  { value: "3-6-months", label: "3–6 months" },
  { value: "6-12-months", label: "6–12 months" },
  { value: "12-plus", label: "12+ months / ongoing" },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-white/6 border border-white/12 text-white placeholder-white/30 focus:outline-none focus:border-[#0A84FF]/60 focus:bg-white/8 transition-colors";

const smallInputClass =
  "w-full px-3 py-2.5 rounded-xl bg-white/6 border border-white/12 text-white placeholder-white/30 focus:outline-none focus:border-[#0A84FF]/60 transition-colors text-sm";

/**
 * The Layer One quote-request form. Shared by the /get-started page and the
 * site-wide floating "Request a Quote" dialog so the branding, fields, and
 * behavior stay identical everywhere.
 *
 * Two quote paths: "project" (multi-site rollout scoping -> custom project
 * price) and "pallet" (per-pallet receiving + storage + chosen services).
 * Both flow into the same inquiry -> draft quote -> Approve & Send pipeline.
 */
export default function RequestForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [quoteType, setQuoteType] = useState<QuoteType>("project");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    deviceCount: "",
    palletCount: "",
    boxCount: "",
    storageDays: "",
    locationCount: "",
    startDate: "",
    rolloutDuration: "",
    message: "",
  });
  type FormField = keyof typeof form;

  const isPallet = quoteType === "pallet";

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

  const toggleEquipment = (label: string) =>
    setSelectedEquipment(prev =>
      prev.includes(label) ? prev.filter(k => k !== label) : [...prev, label]
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pallets = form.palletCount ? parseInt(form.palletCount) : 0;
    if (isPallet && pallets < 1) {
      toast.error("Please enter the number of pallets for a per-pallet quote.");
      return;
    }
    submitMutation.mutate({
      name: form.name,
      company: form.company,
      email: form.email,
      phone: form.phone,
      quoteType,
      tier: "custom",
      deviceCount: form.deviceCount ? parseInt(form.deviceCount) : undefined,
      palletCount: form.palletCount ? parseInt(form.palletCount) : undefined,
      boxCount: form.boxCount ? parseInt(form.boxCount) : undefined,
      storageDays: form.storageDays ? parseInt(form.storageDays) : undefined,
      addons: selectedAddons.length > 0 ? selectedAddons : undefined,
      message: form.message || undefined,
      // Rollout scoping only applies to the project path.
      locationCount: !isPallet && form.locationCount ? parseInt(form.locationCount) : undefined,
      equipmentTypes: selectedEquipment.length > 0 ? selectedEquipment : undefined,
      startDate: !isPallet && form.startDate ? form.startDate : undefined,
      rolloutDuration: !isPallet && form.rolloutDuration ? form.rolloutDuration : undefined,
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
              <Phone className="inline w-3.5 h-3.5 mr-1 opacity-70" />Phone <span className="text-red-400">*</span>
            </label>
            <input required type="tel" value={form.phone} onChange={set("phone")} placeholder="(214) 555-0100" className={inputClass} />
          </div>
        </div>
      </section>

      {/* ── Quote Type ── */}
      <section>
        <h2 className="text-sm font-semibold text-[#b7c5d5] uppercase tracking-wider mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Quote Type <span className="text-red-400 font-normal normal-case tracking-normal">*</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUOTE_TYPES.map(q => {
            const Icon = q.value === "project" ? MapPin : Forklift;
            const active = quoteType === q.value;
            return (
              <button
                key={q.value}
                type="button"
                onClick={() => setQuoteType(q.value)}
                className={`text-left px-4 py-3.5 rounded-xl border transition-all ${
                  active
                    ? "border-[#0A84FF] bg-[#0A84FF]/15 text-white"
                    : "border-white/12 bg-white/4 text-[#b7c5d5] hover:border-white/25 hover:bg-white/8"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <Icon className="w-4 h-4" /> {q.label}
                  </span>
                  <span className={`text-xs font-medium ${active ? "text-[#6ee7b7]" : "text-[#b7c5d5]/60"}`}>{q.price}</span>
                </div>
                <div className="text-xs opacity-70">{q.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Volume Requirements ── */}
      <section>
        <h2 className="text-sm font-semibold text-[#b7c5d5] uppercase tracking-wider mb-1 flex items-center gap-2">
          <Server className="w-4 h-4" /> {isPallet ? "Pallet Details" : "Volume Requirements"}
        </h2>
        <p className="text-xs text-[#b7c5d5]/60 mb-4">
          {isPallet
            ? "How many pallets are we receiving, and how long should we hold them?"
            : "Estimates are fine — this helps us build an accurate quote."}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(
            (
              isPallet
                ? [
                    { field: "palletCount", label: "Pallets", icon: Layers, ph: "e.g. 4", required: true },
                    { field: "deviceCount", label: "Devices", icon: Server, ph: "e.g. 50", required: false },
                    { field: "storageDays", label: "Storage Days", icon: Clock, ph: "e.g. 30", required: false },
                  ]
                : [
                    { field: "deviceCount", label: "Devices", icon: Server, ph: "e.g. 50", required: false },
                    { field: "palletCount", label: "Pallets", icon: Layers, ph: "e.g. 4", required: false },
                    { field: "boxCount", label: "Boxes", icon: Box, ph: "e.g. 20", required: false },
                    { field: "storageDays", label: "Storage Days", icon: Clock, ph: "e.g. 30", required: false },
                  ]
            ) as { field: FormField; label: string; icon: typeof Layers; ph: string; required: boolean }[]
          ).map(({ field, label, icon: Icon, ph, required }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-[#b7c5d5] mb-1.5 flex items-center gap-1">
                <Icon className="w-3 h-3" /> {label} {required && <span className="text-red-400">*</span>}
              </label>
              <input
                type="number"
                min={required ? 1 : 0}
                value={form[field]}
                onChange={set(field)}
                placeholder={ph}
                className={smallInputClass}
              />
            </div>
          ))}
        </div>
        {isPallet && (
          <p className="text-xs text-[#b7c5d5]/60 mt-3">
            Per-pallet pricing: <span className="text-white font-medium">$12/pallet</span> receiving &amp; intake,{" "}
            <span className="text-white font-medium">$30/pallet/month</span> storage, plus any services below.
          </p>
        )}
      </section>

      {/* ── Rollout Details (project path only) ── */}
      {!isPallet && (
        <section>
          <h2 className="text-sm font-semibold text-[#b7c5d5] uppercase tracking-wider mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Rollout Details <span className="text-[#b7c5d5]/50 font-normal normal-case tracking-normal">(optional)</span>
          </h2>
          <p className="text-xs text-[#b7c5d5]/60 mb-4">For multi-site projects — helps us scope staging, kitting, and scheduling.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-[#b7c5d5] mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Deployment Locations
              </label>
              <input
                type="number"
                min="0"
                value={form.locationCount}
                onChange={set("locationCount")}
                placeholder="e.g. 25"
                className={smallInputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#b7c5d5] mb-1.5 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Est. Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={set("startDate")}
                className={`${smallInputClass} [color-scheme:dark]`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#b7c5d5] mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Rollout Duration
              </label>
              <select
                value={form.rolloutDuration}
                onChange={set("rolloutDuration")}
                className={smallInputClass}
              >
                <option value="" className="bg-[#0B1320]">Select…</option>
                {ROLLOUT_DURATIONS.map(d => (
                  <option key={d.value} value={d.value} className="bg-[#0B1320]">{d.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* ── Equipment Types ── */}
      <section>
        <label className="text-sm font-semibold text-[#b7c5d5] uppercase tracking-wider mb-1 flex items-center gap-2">
          <Cpu className="w-4 h-4" /> Equipment Types <span className="text-[#b7c5d5]/50 font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <p className="text-xs text-[#b7c5d5]/60 mb-4">
          {isPallet ? "What's on the pallets?" : "What are we staging for this rollout?"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EQUIPMENT_TYPES.map(label => (
            <button
              key={label}
              type="button"
              onClick={() => toggleEquipment(label)}
              className={`text-left px-4 py-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                selectedEquipment.includes(label)
                  ? "border-[#0A84FF]/60 bg-[#0A84FF]/10 text-white"
                  : "border-white/10 bg-white/4 text-[#b7c5d5] hover:border-white/20 hover:bg-white/6"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  selectedEquipment.includes(label) ? "bg-[#0A84FF] border-[#0A84FF]" : "border-white/25"
                }`}
              >
                {selectedEquipment.includes(label) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="text-sm font-medium">{label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Add-ons ── */}
      <section>
        <h2 className="text-sm font-semibold text-[#b7c5d5] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4" /> Services Needed <span className="text-[#b7c5d5]/50 font-normal normal-case tracking-normal">(optional)</span>
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
          placeholder={isPallet ? "Pallet dimensions, stackability, delivery appointment needs…" : "Describe your deployment timeline, special requirements, or any questions…"}
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
            {isPallet ? "Request Your Per-Pallet Quote" : "Request Your Project Quote"} <ChevronRight className="w-5 h-5" />
          </>
        )}
      </button>
      <p className="text-center text-xs text-[#b7c5d5]/60">
        No credit card required. A rep will review your requirements and send a custom quote.
      </p>
    </form>
  );
}
