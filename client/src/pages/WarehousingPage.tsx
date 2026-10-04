import { ArrowRight, Phone } from "lucide-react";
import { NavBar, Footer } from "./Landing";

const FEATURES = [
  { title: "Turnkey Setup", desc: "We handle everything: space, receiving, labor, and logistics. You get a fully operational warehousing solution without managing any of it." },
  { title: "Short-Term or Long-Term", desc: "Need space for a 3-month project or a 3-year operation? Flexible terms that match your timeline, not a rigid lease." },
  { title: "Secure & Monitored", desc: "Access-controlled facilities with camera monitoring. Your equipment is protected around the clock." },
  { title: "Customized to Your Needs", desc: "Shared cages, dedicated space, or anything in between. We build the solution around your specific requirements and budget." },
  { title: "Operational in 14 Days", desc: "From first call to receiving your first shipment. No long build-outs, no waiting on leases." },
  { title: "On-Demand Labor", desc: "Trained warehouse staff available when you need them, including 24/7 coverage for critical operations." },
];

function WarehousingContent() {
  return (
    <>
      <section className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">Warehousing as a Service</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-[-1.5px] text-white mb-4">
              Warehouse space without<br />
              <span className="text-[#0A84FF]">the warehouse headache.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl">
              Get the warehouse capacity you need in DFW without signing a lease, hiring staff, or managing a facility. We deliver a complete, customized warehousing solution through our network of secure DFW locations. You pay for what you use, we handle the rest.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-[#0A84FF]/40 hover:bg-white/[0.07] transition-all group">
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A84FF]/10 to-white/[0.04] p-12 text-center overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#0A84FF]/10 blur-[80px]" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black tracking-[-1.5px] text-white mb-4">
                Need warehouse space in DFW?
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
                Tell us about your storage needs and timeline. We will build a customized warehousing solution around your operation.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a
                  href="/get-started"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
                >
                  Request a Project Quote <ArrowRight className="w-4 h-4" />
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
    </>
  );
}

export default function WarehousingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "radial-gradient(circle at top left, rgba(10,132,255,0.12) 0%, transparent 35%), linear-gradient(135deg, #0B1320, #0B1320)",
        color: "#f5f8fc",
      }}
    >
      <NavBar />
      <main>
        <WarehousingContent />
      </main>
      <Footer />
    </div>
  );
}
