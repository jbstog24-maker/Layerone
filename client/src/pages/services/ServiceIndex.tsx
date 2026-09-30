import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronRight, Layers } from "lucide-react";
import { SERVICE_PAGES } from "./serviceData";

export default function ServiceIndex() {
  useEffect(() => {
    document.title = "Staging & Deployment Services | Layer One Staging";
    let el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "description");
      document.head.appendChild(el);
    }
    el.setAttribute(
      "content",
      "Layer One Staging services: IT equipment staging, network kitting, POS deployment, asset tagging, and multi-site rollout logistics in Dallas–Fort Worth and nationwide."
    );
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1320] text-white">
      <div className="max-w-5xl mx-auto px-6 pt-8">
        <nav className="flex items-center gap-2 text-sm text-[#b7c5d5]/70">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white/90">Services</span>
        </nav>
      </div>

      <header className="max-w-5xl mx-auto px-6 pt-10 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A84FF] mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Services
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
          Staging &amp; Deployment Services
        </h1>
        <p className="text-[#b7c5d5] text-lg leading-relaxed max-w-3xl">
          Layer One Staging is the operational layer between equipment procurement and field
          deployment. We receive, inventory, configure, label, QA, kit by location, and forward
          your equipment to the field — ready for installation.
        </p>
      </header>

      <section className="max-w-5xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICE_PAGES.map((p) => (
            <Link
              key={p.slug}
              href={`/services/${p.slug}`}
              className="group bg-white/4 border border-white/10 rounded-2xl p-6 hover:border-[#0A84FF]/50 hover:bg-white/6 transition-colors flex flex-col"
            >
              <h2 className="font-bold text-lg mb-2 group-hover:text-[#0A84FF] transition-colors">
                {p.h1}
              </h2>
              <p className="text-sm text-[#b7c5d5] leading-relaxed flex-1">
                {p.metaDescription}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm text-[#0A84FF] font-medium mt-4">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-br from-[#0A84FF]/10 to-transparent border border-[#0A84FF]/20 rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-extrabold mb-3">Not sure which service fits your project?</h2>
          <p className="text-[#b7c5d5] mb-6 max-w-xl mx-auto">
            Tell us about your rollout — locations, devices, and timeline — and we&apos;ll scope
            the right staging plan.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
          >
            Request Your Rollout Quote <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
