import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { getLoginUrl } from "@/const";
import RequestForm from "@/components/RequestForm";

export default function GetStarted() {
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
            Free Consultation — No Commitment
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 leading-tight">
            Request Your<br />
            <span className="bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] bg-clip-text text-transparent">Rollout Quote</span>
          </h1>
          <p className="text-[#b7c5d5] text-lg">
            Tell us the number of locations, devices, services required, storage needs, and deployment schedule — we&apos;ll build a staging and logistics quote around your rollout.
          </p>
        </div>

        <RequestForm />
      </div>
    </div>
  );
}
