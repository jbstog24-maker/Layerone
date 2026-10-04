import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Phone, ClipboardList, MapPin, Package, Users, CheckCircle2, Sparkles } from "lucide-react";

function usePageMeta(title: string, description: string, canonicalPath: string) {
  useState(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = `https://www.layeronestaging.com${canonicalPath}`;
  });
}

const steps = [
  {
    icon: ClipboardList,
    step: "Step 1",
    title: "Get a Custom Quote",
    desc: "Tell us about your project: number of locations, devices, storage needs, and timeline. We build a tailored quote around your specific requirements. No generic packages, no guesswork. You get transparent pricing for exactly what you need.",
  },
  {
    icon: MapPin,
    step: "Step 2",
    title: "We Secure Your Location",
    desc: "Based on your quote, we select and secure the right warehouse space from our DFW network. Need it close to your sites? Centralized for distribution? A shared cage to keep costs down? We match the location and footprint to your operation.",
  },
  {
    icon: Package,
    step: "Step 3",
    title: "Staging Space Configured",
    desc: "Your space gets set up for your workflow: racking, staging benches, labeling stations, and inventory systems. Everything configured before your first shipment arrives, typically within 14 days of your signed quote.",
  },
  {
    icon: Users,
    step: "Step 4",
    title: "Team Assigned & Onboarded",
    desc: "Dedicated warehouse techs are assigned to your project and briefed on your specs, labeling standards, and handling requirements. You get named contacts, not a rotating crew. On-demand scaling including 24/7 coverage when your timeline demands it.",
  },
  {
    icon: CheckCircle2,
    step: "Step 5",
    title: "You Are Operational",
    desc: "Start shipping equipment to your dedicated receiving dock. Every pallet is inventoried, every device tracked in your customer portal. From here, it's staging, kitting, and outbound shipping on your schedule.",
  },
];

export default function HowWeWork() {
  usePageMeta(
    "How We Work | Layer One Staging, DFW",
    "From custom quote to operational in 14 days. See how Layer One Staging builds your turnkey warehousing solution.",
    "/how-we-work"
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
            How we work
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-[-1.5px] text-white mb-5">
            From quote to operational<br />
            <span className="text-[#0A84FF]">in 14 days.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            No leases to negotiate. No staff to hire. No facility to manage.
            Here is exactly how your turnkey warehousing solution comes together.
          </p>
        </div>
      </section>

      {/* Infographic */}
      <section className="py-12 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <img
            src="/images/how-we-work-infographic.png"
            alt="How We Work: from receipt to deployment in 6 steps"
            className="w-full rounded-2xl border border-white/10"
          />
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                {i < steps.length - 1 && (
                  <div className="absolute left-[27px] top-[72px] bottom-[-24px] w-px bg-[#0A84FF]/25" />
                )}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 hover:border-[#0A84FF]/40 transition-all">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#0A84FF]/10 border border-[#0A84FF]/25 flex items-center justify-center shrink-0">
                      <s.icon className="w-6 h-6 text-[#0A84FF]" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold tracking-widest uppercase text-[#0A84FF]">
                        {s.step}
                      </span>
                      <h2 className="text-xl md:text-2xl font-bold text-white mt-1 mb-2">
                        {s.title}
                      </h2>
                      <p className="text-slate-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A84FF]/10 to-white/[0.04] p-12 text-center overflow-hidden">
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black tracking-[-1.5px] text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
                Step one is a conversation. Tell us what you need and we will build the quote.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a
                  href="/get-started"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
                >
                  Get a Custom Quote <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="tel:+14695374378"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold border border-white/15 bg-white/5 text-white hover:border-white/30 transition-colors"
                >
                  <Phone className="w-4 h-4" /> (469) 537-4378
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
