import { useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  HelpCircle,
  Package,
  Users,
} from "lucide-react";
import { getServicePage, SERVICE_PAGES } from "./serviceData";

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

export default function ServicePage() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const page = params.slug ? getServicePage(params.slug) : undefined;

  useEffect(() => {
    if (!params.slug || !getServicePage(params.slug)) {
      setLocation("/404");
    }
  }, [params.slug, setLocation]);

  const canonicalPath = `/services/${params.slug ?? ""}`;
  usePageMeta(
    page?.title ?? "Service | Layer One Staging",
    page?.metaDescription ?? "",
    canonicalPath
  );

  if (!page) return null;

  const related = SERVICE_PAGES.filter((p) => p.slug !== page.slug).slice(0, 4);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.h1,
    description: page.metaDescription,
    url: `${SITE_URL}${canonicalPath}`,
    provider: {
      "@type": "ProfessionalService",
      name: "Layer One Staging",
      url: SITE_URL,
      areaServed: "Dallas-Fort Worth, TX",
    },
    areaServed: {
      "@type": "Place",
      name: "Dallas-Fort Worth, TX",
    },
  };

  return (
    <div className="min-h-screen bg-[#0B1320] text-white">
      <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <nav className="flex items-center gap-2 text-sm text-[#b7c5d5]/70">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/services" className="hover:text-white transition-colors">Services</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white/90">{page.h1}</span>
        </nav>
      </div>

      {/* Hero */}
      <header className="max-w-4xl mx-auto px-6 pt-10 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A84FF] mb-4">
          Layer One Staging
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">{page.h1}</h1>
        {page.intro.map((para, i) => (
          <p key={i} className="text-[#b7c5d5] text-lg leading-relaxed mb-4">{para}</p>
        ))}
        <div className="flex flex-wrap gap-4 mt-8">
          <Link
            href={page.ctaHref ?? "/get-started"}
            className="inline-flex items-center gap-2 bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
          >
            {page.ctaLabel ?? "Request a Project Quote"} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/#services"
            className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
          >
            Explore Our Services
          </Link>
        </div>
      </header>

      {/* What's included */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Package className="w-6 h-6 text-[#0A84FF]" /> What&apos;s included
        </h2>
        <p className="text-[#b7c5d5]/70 mb-6">Every engagement is scoped to your project - these are the standard building blocks.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {page.included.map((item) => (
            <div key={item.title} className="bg-white/4 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold mb-1.5 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6ee7b7] mt-1 flex-shrink-0" />
                {item.title}
              </h3>
              <p className="text-sm text-[#b7c5d5] pl-6">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-gradient-to-br from-[#0A84FF]/10 to-transparent border border-[#0A84FF]/20 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#0A84FF]" /> {page.processTitle}
          </h2>
          <p className="text-[#b7c5d5] leading-relaxed">{page.processNote}</p>
          <p className="text-[#b7c5d5] leading-relaxed mt-4">
            Every project runs through our standard staging workflow - receive, inventory, configure,
            asset tag, QA, kit by site, document, and ship - with portal visibility at each step.
          </p>
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-[#0A84FF]" /> Who it&apos;s for
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {page.audiences.map((aud) => (
            <div key={aud.title} className="border-l-2 border-[#0A84FF]/50 pl-4 py-1">
              <h3 className="font-semibold">{aud.title}</h3>
              <p className="text-sm text-[#b7c5d5]">{aud.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-[#0A84FF]" /> Common questions
        </h2>
        <div className="space-y-4">
          {page.faqs.map((faq) => (
            <div key={faq.q} className="bg-white/4 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold mb-2">{faq.q}</h3>
              <p className="text-sm text-[#b7c5d5] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-[#0A84FF] rounded-3xl p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
            {page.ctaHeading ?? `Planning a project that needs ${page.h1.toLowerCase()}?`}
          </h2>
          <p className="text-white/85 mb-6 max-w-xl mx-auto">
            {page.ctaBody ?? "Send us your equipment list, site count, and deployment schedule. We'll build a staging and logistics plan around your rollout."}
          </p>
          <Link
            href={page.ctaHref ?? "/get-started"}
            className="inline-flex items-center gap-2 bg-white text-[#0A84FF] font-bold px-8 py-4 rounded-xl hover:bg-white/90 transition-colors"
          >
            {page.ctaLabel ?? "Request Your Rollout Quote"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Related services */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-bold mb-4">Related services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {related.map((r) => (
            <Link
              key={r.slug}
              href={`/services/${r.slug}`}
              className="flex items-center justify-between bg-white/4 border border-white/10 rounded-xl px-5 py-4 hover:border-[#0A84FF]/50 hover:bg-white/6 transition-colors"
            >
              <span className="font-medium text-sm">{r.h1}</span>
              <ArrowRight className="w-4 h-4 text-[#0A84FF] flex-shrink-0" />
            </Link>
          ))}
        </div>
        <Link href="/services" className="inline-flex items-center gap-1.5 text-sm text-[#0A84FF] hover:text-white transition-colors mt-6">
          <ArrowLeft className="w-4 h-4" /> View all services
        </Link>
      </section>
    </div>
  );
}
