import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Gift,
  Handshake,
  Loader2,
  Send,
  Users,
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

const PAYOUT_POINTS = [
  {
    icon: Gift,
    title: "10% of the first paid invoice",
    desc: "Every referral that turns into a customer earns you 10% of their first paid invoice.",
  },
  {
    icon: Handshake,
    title: "One-time payout per referral",
    desc: "Each referral pays once. There is no cap on how many referrals you can send.",
  },
  {
    icon: CheckCircle2,
    title: "Paid after the invoice clears",
    desc: "Once the customer's first invoice is paid in full, your payout is on its way.",
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/12 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#0A84FF]/60 transition-colors";
const errorInputClass = "border-red-500/60 focus:border-red-500/60";

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

const EMPTY_FORM: FormState = { name: "", email: "", phone: "", company: "", notes: "" };

export default function ReferralSignup() {
  usePageMeta(
    "Become a Referrer | Layer One Staging",
    "Sign up for the Layer One Staging referral program. Earn 10% of every referred customer's first paid invoice.",
    "/referral-signup"
  );

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [signedUp, setSignedUp] = useState(false);

  const signup = trpc.referral.signup.useMutation({
    onSuccess: () => setSignedUp(true),
    onError: (err) =>
      setServerError(err.message || "Something went wrong signing you up. Please try again."),
  });

  const set = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (serverError) setServerError(null);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Please enter your full name.";
    if (!form.email.trim()) {
      next.email = "Please enter your email address.";
    } else if (!EMAIL_RE.test(form.email.trim())) {
      next.email = "That email address doesn't look right.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    signup.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
      plan: form.notes.trim() || undefined,
    });
  };

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
            Become a Layer One referrer
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            Sign up below so we know where to send your payout. Then point any
            MSP, IT integrator, or multi-location business our way and earn 10%
            of their first paid invoice.
          </p>
        </div>
      </section>

      {/* How it works recap */}
      <section className="py-16 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black tracking-[-1px] text-white mb-3">
            How the payout works
          </h2>
          <p className="text-slate-400 mb-10 max-w-2xl">
            The full terms live on the referrals page. The short version:
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            {PAYOUT_POINTS.map(p => (
              <div
                key={p.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-[#0A84FF]" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black tracking-[-1px] text-white mb-3">
            Sign up
          </h2>
          <p className="text-slate-400 mb-8">
            Takes about a minute. We will email you the program details once
            you are in.
          </p>

          {signedUp ? (
            <div className="rounded-2xl border border-[#6ee7b7]/30 bg-[#6ee7b7]/5 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#6ee7b7]/15 border border-[#6ee7b7]/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7 text-[#6ee7b7]" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">You're signed up!</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Check your email for the details. Got someone in mind already?
                Send them our way right now.
              </p>
              <Link
                href="/referral-submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors"
              >
                <Send className="w-4 h-4" /> Submit a lead now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="ref-name" className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Full name <span className="text-[#6ee7b7]">*</span>
                </label>
                <input
                  id="ref-name"
                  type="text"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="James Stogner"
                  className={`${inputClass} ${errors.name ? errorInputClass : ""}`}
                  autoComplete="name"
                />
                {errors.name && <p className="text-sm text-red-400 mt-1.5">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="ref-email" className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Email <span className="text-[#6ee7b7]">*</span>
                </label>
                <input
                  id="ref-email"
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="you@example.com"
                  className={`${inputClass} ${errors.email ? errorInputClass : ""}`}
                  autoComplete="email"
                />
                {errors.email && <p className="text-sm text-red-400 mt-1.5">{errors.email}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="ref-phone" className="block text-sm font-semibold text-slate-300 mb-1.5">
                    Phone <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    id="ref-phone"
                    type="tel"
                    value={form.phone}
                    onChange={e => set("phone", e.target.value)}
                    placeholder="(469) 555-0123"
                    className={inputClass}
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label htmlFor="ref-company" className="block text-sm font-semibold text-slate-300 mb-1.5">
                    Company <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    id="ref-company"
                    type="text"
                    value={form.company}
                    onChange={e => set("company", e.target.value)}
                    placeholder="Your company"
                    className={inputClass}
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ref-notes" className="block text-sm font-semibold text-slate-300 mb-1.5">
                  How do you plan to refer people? <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  id="ref-notes"
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="I work with MSPs in DFW and..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {serverError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={signup.isPending}
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl text-sm font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {signup.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing you up...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" /> Sign up as a referrer
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center leading-relaxed">
                By signing up you agree to the referral terms on our{" "}
                <Link href="/referrals" className="text-[#0A84FF] hover:text-[#3d9dff]">
                  referrals page
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
