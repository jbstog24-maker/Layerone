import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  ClipboardCheck,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

const SITE_URL = "https://www.layeronestaging.com";
const JAMES_PHOTO = "/images/james-stogner.jpg";

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

function JamesPhoto() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-3xl overflow-hidden border border-white/10 bg-[#0A84FF]/10 shrink-0">
      {!failed ? (
        <img
          src={JAMES_PHOTO}
          alt="James Stogner, founder of Layer One Staging"
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-4">
          <span className="text-5xl font-black text-[#0A84FF]">JS</span>
          <span className="text-xs text-slate-500">Founder photo<br />coming soon</span>
        </div>
      )}
    </div>
  );
}

function AiCard({
  avatar,
  name,
  role,
  icon: Icon,
  blurb,
  quote,
  accent,
}: {
  avatar: string;
  name: string;
  role: string;
  icon: typeof Phone;
  blurb: string;
  quote: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 flex flex-col hover:border-white/20 transition-colors">
      <div className="flex items-center gap-5 mb-5">
        <img
          src={avatar}
          alt={`${name} illustrated avatar`}
          className="w-20 h-20 rounded-2xl object-cover border border-white/10"
        />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-white">{name}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/30 text-[#6ea8ff] text-[11px] font-bold">
              <Bot className="w-3 h-3" /> AI
            </span>
          </div>
          <p className={`text-sm font-semibold ${accent}`}>{role}</p>
        </div>
      </div>
      <div className="flex items-start gap-2.5 mb-4">
        <Icon className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
        <p className="text-slate-400 text-sm leading-relaxed">{blurb}</p>
      </div>
      <blockquote className="mt-auto pt-4 border-t border-white/10">
        <MessageCircle className="w-4 h-4 text-[#0A84FF] mb-2" />
        <p className="text-slate-200 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
      </blockquote>
    </div>
  );
}

export default function Team() {
  usePageMeta(
    "Meet the Team | Layer One Staging",
    "One human, three AI teammates. Helpful technology, with James accountable for the work. Meet James Stogner, Alex, Morgan, and Casey at Layer One Staging.",
    "/team"
  );

  return (
    <div className="min-h-screen bg-[#0B1320] text-slate-200">
      {/* Hero */}
      <section className="pt-28 pb-14 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-white transition-colors">
            ← Back to home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0A84FF]/40 bg-[#0A84FF]/10 text-[#6ea8ff] text-xs font-semibold mt-6 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            The crew
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-[-1.5px] text-white mb-5">
            Meet the team.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            One human. Three robots with headsets. A shared understanding of
            who&rsquo;s in charge.
          </p>
        </div>
      </section>

      {/* The human */}
      <section className="py-14 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-6">
            The human
          </span>
          <div className="rounded-3xl border border-[#0A84FF]/25 bg-[#0A84FF]/[0.05] p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
            <JamesPhoto />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl md:text-3xl font-black tracking-[-0.5px] text-white">
                  James Stogner
                </h2>
                <Star className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-[#6ea8ff] font-semibold mb-4">
                Founder &amp; Owner — the one with the pulse
              </p>
              <div className="space-y-4 text-slate-400 leading-relaxed max-w-3xl">
                <p>
                  U.S. Air Force veteran. 20+ years in IT infrastructure, telecom,
                  and multi-site technology deployments. James founded Layer One
                  Staging, runs the operation, and signs off on every rollout.
                </p>
                <p>
                  The AI crew assists. <span className="text-white font-semibold">James answers
                  for the outcome</span> — every pallet, every device, every deadline.
                  That&rsquo;s the deal, and it&rsquo;s non-negotiable, mostly because
                  James wrote this page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The AI crew */}
      <section className="py-14 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">
            The artificial ones
          </span>
          <h2 className="text-3xl font-black tracking-[-1px] text-white mb-4">
            Helpful technology. Zero mystery.
          </h2>
          <p className="text-slate-400 leading-relaxed max-w-3xl mb-10">
            Alex, Morgan, and Casey are AI — they&rsquo;ll tell you so themselves,
            usually in the first minute. They joke lightly, confirm details carefully,
            and loop James in the moment anything needs a real decision. Which, around
            here, is most things.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <AiCard
              avatar="/images/alex-avatar.png"
              name="Alex"
              role="AI Client Representative"
              icon={Phone}
              accent="text-amber-300/90"
              blurb="The voice you'll hear when you call (469) 537-4378. In his 60s, deep raspy voice, warm Texas drawl — friendly, patient, quietly confident, with a gentle sarcasm that keeps calls interesting. Alex asks the right questions, takes a great message, and does not freelance: anything needing a decision goes straight to James."
              quote="Yes sir, I'm AI. They gave me the manners; James kept the good looks."
            />
            <AiCard
              avatar="/images/morgan-avatar.png"
              name="Morgan"
              role="AI Scheduling Coordinator"
              icon={CalendarCheck}
              accent="text-teal-300/90"
              blurb="Warm, sharp, organized — with playful, dry humor and an iron grip on the calendar. Morgan keeps conversations moving and makes sure 'sometime next week' turns into an actual date. Vague timelines fear her."
              quote="'Sometime next week' is a feeling, honey. Let's get you an actual date."
            />
            <AiCard
              avatar="/images/casey-avatar.png"
              name="Casey"
              role="AI Project Coordinator"
              icon={ClipboardCheck}
              accent="text-sky-300/90"
              blurb="Calm, detail-oriented, practical. Casey tracks the moving pieces of your rollout with deadpan humor and careful follow-through. Nothing slips — Casey checked twice."
              quote="I like my projects organized and my surprises limited to birthday parties."
            />
          </div>
        </div>
      </section>

      {/* House rules */}
      <section className="py-14 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">
            Operating principles
          </span>
          <h2 className="text-3xl font-black tracking-[-1px] text-white mb-8">
            House rules for the robots
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <MessageCircle className="w-6 h-6 text-[#0A84FF] mb-3" />
              <h3 className="text-white font-bold mb-2">Joke lightly.</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                A little humor keeps things human. Mostly.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <ShieldCheck className="w-6 h-6 text-[#0A84FF] mb-3" />
              <h3 className="text-white font-bold mb-2">Confirm details carefully.</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Dates, counts, addresses — read back before anything moves.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <Star className="w-6 h-6 text-[#0A84FF] mb-3" />
              <h3 className="text-white font-bold mb-2">James decides.</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Anything needing a real decision goes to the human in charge.
                The robots know their place. James made sure of it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Accountability band + CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Bot className="w-8 h-8 text-[#0A84FF] mx-auto mb-5" />
          <h2 className="text-3xl md:text-4xl font-black tracking-[-1px] text-white mb-4">
            Helpful technology, with James accountable for the work.
          </h2>
          <p className="text-slate-400 leading-relaxed max-w-2xl mx-auto mb-8">
            AI makes the operation faster and sharper. A veteran-owned business
            with a human being&rsquo;s name on it makes it trustworthy.
            That&rsquo;s the whole idea.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#0A84FF] text-white font-bold hover:bg-[#3d9dff] transition-colors"
            >
              Meet them in action <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:+14695374378"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-white/15 text-white font-bold hover:border-white/30 transition-colors"
            >
              <Phone className="w-4 h-4" /> Say hi to Alex
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
