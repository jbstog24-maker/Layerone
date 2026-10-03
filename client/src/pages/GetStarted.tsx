import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { getLoginUrl } from "@/const";
import RequestForm from "@/components/RequestForm";

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
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", `https://www.layeronestaging.com${canonicalPath}`);
  }, [title, description, canonicalPath]);
}

export default function GetStarted() {
  usePageMeta(
    "Get a Project Quote | Layer One Staging, DFW",
    "Request a custom project quote or per-pallet pricing from Layer One Staging. IT hardware staging, kitting, and deployment logistics in Dallas-Fort Worth, shipped nationwide.",
    "/get-started"
  );

  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/8 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#b7c5d5] hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <a href={getLoginUrl()} className="text-sm text-[#b7c5d5] hover:text-white transition-colors">
          Already have an account? <span className="text-[#0A84FF] font-semibold">Sign In</span>
        </a>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0A84FF]/30 bg-[#0A84FF]/10 text-[#0A84FF] text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7] animate-pulse" />
            Free Consultation - No Commitment
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 leading-tight">
            Request Your<br />
            <span className="bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] bg-clip-text text-transparent">Project or Per-Pallet Quote</span>
          </h1>
          <p className="text-[#b7c5d5] text-lg">
            Planning a multi-site rollout? Tell us the locations, devices, services, and schedule - we&apos;ll scope a custom project quote.
            Just need pallets received, stored, and staged? Pick the per-pallet path for straightforward per-pallet pricing.
          </p>
        </div>

        <RequestForm />
      </div>
    </div>
  );
}
