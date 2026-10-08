import { useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Gift,
  Handshake,
  Mail,
  Users,
} from "lucide-react";
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

const STEPS = [
  {
    icon: Users,
    title: "Tell someone about Layer One",
    desc: "Know an MSP, IT integrator, or multi-location business with gear to stage? Send them our way.",
  },
  {
    icon: Mail,
    title: "They name you, or you submit the lead",
    desc: "When they request a quote, they name you as their referrer. Or submit the lead directly yourself from the /referral-submit form. Either way, sign up first so we know where the 10% goes.",
  },
  {
    icon: Handshake,
    title: "They sign and pay their first invoice",
    desc: "Once their first invoice is paid in full, your referral is locked in. No chasing, no fine print.",
  },
  {
    icon: Gift,
    title: "You get 10%",
    desc: "We pay you 10% of that first invoice. One-time payout per referral, paid out after their payment clears.",
  },
];

const TERMS = [
  "10% of the referred customer's first paid invoice",
  "One-time payout per referral, not recurring",
  "Paid after the customer's first invoice is paid in full",
  "Anyone can refer: customers, partners, friends, vendors",
  "No cap on the number of referrals you can send",
];

export default function Referrals() {
  usePageMeta(
    "Referral Program | Earn 10% - Layer One Staging",
    "Refer a customer to Layer One Staging and earn 10% of their first paid invoice. No cap, no fine print. IT hardware staging, kitting, and deployment logistics in DFW.",
    "/referrals"
  );

  return (
    <div className="min-h-screen bg-[#0B1320] text-slate-200">
      <NavBar />

      {/* Hero */}
      <section className="pt-28 pb-16 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-white transition-colors">
            ← Back to home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6ee7b7]/40 bg-[#6ee7b7]/10 text-[#6ee7b7] text-xs font-semibold mt-6 mb-5">
            <BadgePercent className="w-3.5 h-3.5" />
            Referral Program
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-[-1.5px] text-white mb-5">
            Know someone who needs staging?
            <br />
            <span className="bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] bg-clip-text text-transparent">
              Earn 10% for sending them our way.
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            If you know an MSP, IT integrator, or multi-location business drowning in
            unboxed gear, point them at Layer One. When they sign up and pay their
            first invoice, you get 10% of it. Simple as that.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black tracking-[-1px] text-white mb-3">
            How it works
          </h2>
          <p className="text-slate-400 mb-10 max-w-2xl">
            Two ways to refer, four steps to your payout. No referral codes, no
            dashboard to check.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center shrink-0">
                    <s.icon className="w-5 h-5 text-[#0A84FF]" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="py-16 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black tracking-[-1px] text-white mb-3">
            The terms, in plain English
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl">
            No legal maze. Here is exactly how the referral payout works.
          </p>
          <ul className="space-y-4 max-w-2xl">
            {TERMS.map(t => (
              <li key={t} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#6ee7b7] shrink-0 mt-0.5" />
                <span className="text-slate-300">{t}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-500 mt-8 max-w-2xl leading-relaxed">
            Referral payouts are sent after the referred customer's first invoice is
            paid in full. If a customer cancels before paying, there is no payout.
            Layer One Staging reserves the right to update these terms at any time.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black tracking-[-1px] text-white mb-4">
            Start referring today
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Sign up as a referrer, then send someone our way.
            We handle the rest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/referral-signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors"
            >
              Sign Up as a Referrer <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/referral-submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border border-white/20 text-white hover:border-[#0A84FF] hover:text-[#0A84FF] transition-colors"
            >
              Submit a Lead
            </Link>
            <a
              href="mailto:info@layeronestaging.com?subject=Referral%20Program%20Question"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border border-white/20 text-white hover:border-[#0A84FF] hover:text-[#0A84FF] transition-colors"
            >
              <Mail className="w-4 h-4" /> Ask About Referrals
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-8">
            Questions? Call <a href="tel:+14695374378" className="text-[#0A84FF] hover:text-[#3d9dff]">(469) 537-4378</a> or email <a href="mailto:info@layeronestaging.com" className="text-[#0A84FF] hover:text-[#3d9dff]">info@layeronestaging.com</a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
