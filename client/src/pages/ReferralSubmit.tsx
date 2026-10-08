import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BadgePercent,
  CheckCircle2,
  Gift,
  Loader2,
  Mail,
  Send,
  User,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { NavBar, Footer } from "./Landing";

const SITE_URL = "https://www.layeronestaging.com";

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
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", `${SITE_URL}${canonicalPath}`);
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", `${SITE_URL}${canonicalPath}`);
    window.scrollTo(0, 0);
  }, [title, description, canonicalPath]);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/12 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#0A84FF]/60 transition-colors";
const errorInputClass = "border-red-500/60 focus:border-red-500/60";

type FormState = {
  referrerName: string;
  referrerEmail: string;
  leadCompany: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  referrerName: "",
  referrerEmail: "",
  leadCompany: "",
  leadName: "",
  leadEmail: "",
  leadPhone: "",
  notes: "",
};

function SectionHeader({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#0A84FF]" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-sm text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

export default function ReferralSubmit() {
  usePageMeta(
    "Submit a Referral Lead | Layer One Staging",
    "Send Layer One Staging a referral lead. Tell us about the company that needs IT staging, kitting, and deployment logistics in DFW.",
    "/referral-submit"
  );

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submitLead = trpc.referral.submitLead.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) =>
      setServerError(err.message || "Something went wrong submitting your lead. Please try again."),
  });

  const set = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (serverError) setServerError(null);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.referrerName.trim()) next.referrerName = "Please enter your full name.";
    if (!form.referrerEmail.trim()) {
      next.referrerEmail = "Please enter your email address.";
    } else if (!EMAIL_RE.test(form.referrerEmail.trim())) {
      next.referrerEmail = "That email address doesn't look right.";
    }
    if (!form.leadCompany.trim()) next.leadCompany = "Please enter the company's name.";
    if (!form.leadName.trim()) next.leadName = "Please enter a contact name.";
    if (!form.leadEmail.trim()) {
      next.leadEmail = "Please enter the contact's email address.";
    } else if (!EMAIL_RE.test(form.leadEmail.trim())) {
      next.leadEmail = "That email address doesn't look right.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    submitLead.mutate({
      referrerName: form.referrerName.trim(),
      referrerEmail: form.referrerEmail.trim(),
      leadCompany: form.leadCompany.trim(),
      leadName: form.leadName.trim(),
      leadEmail: form.leadEmail.trim(),
      leadPhone: form.leadPhone.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  const fieldError = (field: keyof FormState) =>
    errors[field] ? <p className="text-sm text-red-400 mt-1.5">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen bg-[#0B1320] text-slate-200">
      <NavBar />

      {/* Hero */}
      <section className="pt-28 pb-16 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/referrals" className="text-sm text-slate-500 hover:text-white transition-colors">
            ← Back to referrals
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6ee7b7]/40 bg-[#6ee7b7]/10 text-[#6ee7b7] text-xs font-semibold mt-6 mb-5">
            <BadgePercent className="w-3.5 h-3.5" />
            Referral Program
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-[-1.5px] text-white mb-5">
            Submit a referral lead
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            Know a company that needs staging, kitting, or deployment logistics?
            Send them our way. If they sign up and pay their first invoice, you
            get 10% of it.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-6">
          {submitted ? (
            <div className="rounded-2xl border border-[#6ee7b7]/30 bg-[#6ee7b7]/5 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#6ee7b7]/15 border border-[#6ee7b7]/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7 text-[#6ee7b7]" />
              </div>
              <h2 className="text-2xl font-black text-white mb-4">Thanks! We've got it from here.</h2>
              <div className="text-left max-w-md mx-auto space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#0A84FF] shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">
                    We will reach out to them shortly, and you will get an email
                    confirmation that your referral was received.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Gift className="w-5 h-5 text-[#0A84FF] shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">
                    If they sign up and pay, you earn 10% of their first paid
                    invoice, paid out after their payment clears.
                  </p>
                </div>
              </div>
              <p className="text-slate-500 text-sm">
                Got another one?{" "}
                <button
                  onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); }}
                  className="text-[#0A84FF] hover:text-[#3d9dff] font-semibold"
                >
                  Submit another lead
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-10">
              {/* Referrer section */}
              <div>
                <SectionHeader
                  icon={User}
                  title="Your info (the referrer)"
                  desc="So we know who the payout goes to."
                />
                <div className="space-y-5">
                  <div>
                    <label htmlFor="ref-your-name" className="block text-sm font-semibold text-slate-300 mb-1.5">
                      Your full name <span className="text-[#6ee7b7]">*</span>
                    </label>
                    <input
                      id="ref-your-name"
                      type="text"
                      value={form.referrerName}
                      onChange={e => set("referrerName", e.target.value)}
                      placeholder="James Stogner"
                      className={`${inputClass} ${errors.referrerName ? errorInputClass : ""}`}
                      autoComplete="name"
                    />
                    {fieldError("referrerName")}
                  </div>
                  <div>
                    <label htmlFor="ref-your-email" className="block text-sm font-semibold text-slate-300 mb-1.5">
                      Your email <span className="text-[#6ee7b7]">*</span>
                    </label>
                    <input
                      id="ref-your-email"
                      type="email"
                      value={form.referrerEmail}
                      onChange={e => set("referrerEmail", e.target.value)}
                      placeholder="you@example.com"
                      className={`${inputClass} ${errors.referrerEmail ? errorInputClass : ""}`}
                      autoComplete="email"
                    />
                    {fieldError("referrerEmail")}
                  </div>
                </div>
              </div>

              {/* Lead section */}
              <div>
                <SectionHeader
                  icon={Send}
                  title="The lead"
                  desc="The company you are referring to Layer One."
                />
                <div className="space-y-5">
                  <div>
                    <label htmlFor="ref-lead-company" className="block text-sm font-semibold text-slate-300 mb-1.5">
                      Company name <span className="text-[#6ee7b7]">*</span>
                    </label>
                    <input
                      id="ref-lead-company"
                      type="text"
                      value={form.leadCompany}
                      onChange={e => set("leadCompany", e.target.value)}
                      placeholder="Acme MSP"
                      className={`${inputClass} ${errors.leadCompany ? errorInputClass : ""}`}
                      autoComplete="organization"
                    />
                    {fieldError("leadCompany")}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="ref-lead-name" className="block text-sm font-semibold text-slate-300 mb-1.5">
                        Contact name <span className="text-[#6ee7b7]">*</span>
                      </label>
                      <input
                        id="ref-lead-name"
                        type="text"
                        value={form.leadName}
                        onChange={e => set("leadName", e.target.value)}
                        placeholder="Jane Doe"
                        className={`${inputClass} ${errors.leadName ? errorInputClass : ""}`}
                      />
                      {fieldError("leadName")}
                    </div>
                    <div>
                      <label htmlFor="ref-lead-phone" className="block text-sm font-semibold text-slate-300 mb-1.5">
                        Contact phone <span className="text-slate-500 font-normal">(optional)</span>
                      </label>
                      <input
                        id="ref-lead-phone"
                        type="tel"
                        value={form.leadPhone}
                        onChange={e => set("leadPhone", e.target.value)}
                        placeholder="(469) 555-0123"
                        className={inputClass}
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ref-lead-email" className="block text-sm font-semibold text-slate-300 mb-1.5">
                      Contact email <span className="text-[#6ee7b7]">*</span>
                    </label>
                    <input
                      id="ref-lead-email"
                      type="email"
                      value={form.leadEmail}
                      onChange={e => set("leadEmail", e.target.value)}
                      placeholder="jane@acme.com"
                      className={`${inputClass} ${errors.leadEmail ? errorInputClass : ""}`}
                    />
                    {fieldError("leadEmail")}
                  </div>
                  <div>
                    <label htmlFor="ref-notes" className="block text-sm font-semibold text-slate-300 mb-1.5">
                      Notes about the opportunity <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="ref-notes"
                      value={form.notes}
                      onChange={e => set("notes", e.target.value)}
                      placeholder="What do they need? Timeline?"
                      rows={4}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </div>

              {serverError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitLead.isPending}
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl text-sm font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitLead.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit referral lead
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Not signed up yet?{" "}
                <Link href="/referral-signup" className="text-[#0A84FF] hover:text-[#3d9dff]">
                  Sign up as a referrer
                </Link>{" "}
                so we know where your payout goes.
              </p>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
