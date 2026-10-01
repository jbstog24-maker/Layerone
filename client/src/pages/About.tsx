import { useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Award,
  ClipboardCheck,
  Medal,
  ShieldCheck,
} from "lucide-react";

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

export default function About() {
  usePageMeta(
    "About Us | Disabled Veteran-Owned IT Staging — Layer One Staging",
    "Layer One Staging is a disabled veteran-owned company. Our founder, a U.S. Air Force veteran, brings 20+ years in IT infrastructure, telecom, and multi-site technology deployments to every rollout.",
    "/about"
  );

  return (
    <div className="min-h-screen bg-[#0B1320] text-slate-200">
      {/* Hero */}
      <section className="pt-28 pb-16 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-white transition-colors">
            ← Back to home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0A84FF]/40 bg-[#0A84FF]/10 text-[#6ea8ff] text-xs font-semibold mt-6 mb-5">
            <Medal className="w-3.5 h-3.5" />
            Disabled Veteran-Owned Business
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-[-1.5px] text-white mb-5">
            About Layer One Staging
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            The operational layer between equipment procurement and field deployment —
            run by people who have spent their careers on both sides of a rollout.
          </p>
        </div>
      </section>

      {/* Founder story */}
      <section className="py-16 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">
            Our Story
          </span>
          <h2 className="text-3xl font-black tracking-[-1px] text-white mb-6">
            Built by a veteran.<br />Shaped by 20+ years in IT.
          </h2>
          <div className="space-y-5 text-slate-400 leading-relaxed max-w-3xl">
            <p>
              Layer One Staging was founded by a <strong className="text-slate-200">disabled U.S. Air Force veteran</strong> with{" "}
              <strong className="text-slate-200">more than 20 years in the IT field</strong> — spanning IT infrastructure,
              telecom, structured cabling, retail technology rollouts, and multi-site enterprise deployments.
            </p>
            <p>
              Across two decades of network and server hardware installs, staging and testing, POS deployments,
              fiber runs, and MDF/IDF builds, he kept running into the same failure point: the gap between
              equipment procurement and field deployment. Hardware arriving unsorted, unlabeled, and untested —
              and field teams paying for it in delays, rework, and blown timelines.
            </p>
            <p>
              Layer One Staging exists to close that gap. We run the warehouse behind your rollout — receiving,
              secure storage, staging, kitting, QA verification, and outbound shipping — so the right equipment
              arrives at the right site, configured, labeled, and ready. Every time.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            {[
              {
                icon: Medal,
                title: "Veteran-Owned",
                desc: "A disabled veteran-owned business, operated with the accountability service instills.",
              },
              {
                icon: Award,
                title: "20+ Years in IT",
                desc: "Two decades across infrastructure, telecom, cabling, and national retail rollouts.",
              },
              {
                icon: ClipboardCheck,
                title: "Process-Driven",
                desc: "Documented staging, photo verification, and live portal visibility on every step.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <c.icon className="w-6 h-6 text-[#0A84FF] mb-3" />
                <h3 className="text-white font-bold mb-1.5">{c.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we do / don't do */}
      <section className="py-16 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">
            What We Do
          </span>
          <h2 className="text-3xl font-black tracking-[-1px] text-white mb-6">
            One job, done right.
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <h3 className="text-emerald-300 font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> We handle
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  "Freight & parcel receiving with documented intake",
                  "Secure, camera-monitored warehouse storage",
                  "Equipment staging, configuration & QA testing",
                  "Kitting & labeling by site",
                  "Asset tagging & serial/MAC capture",
                  "Outbound shipping & carrier handoffs",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span className="text-emerald-400 mt-0.5">✓</span> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-slate-200 font-bold mb-3">What we're not</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                We are not an IT support company, and we don't dispatch field technicians to your
                locations. We stay in our lane — the warehouse — so your field teams get
                deployment-ready hardware without surprises.
              </p>
              <p className="text-sm text-slate-400 leading-relaxed mt-3">
                Serving the Dallas–Fort Worth metro, shipping nationwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black tracking-[-1px] text-white mb-4">
            Have a rollout coming up?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Tell us about your locations, equipment, and timeline — we'll build a project quote around it.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors"
          >
            Request a Project Quote <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
