import { useState } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { NavBar, Footer } from "./Landing";

export const FAQ_ITEMS = [
  {
    category: "Services",
    q: "What exactly does Layer One do?",
    a: "Layer One Staging provides professional warehousing, receiving, staging, and outbound shipping services for technology equipment. We receive your hardware shipments, inventory every device, kit and stage equipment to your specifications, and ship it to your deployment sites - all tracked in real time through our customer portal."
  },
  {
    category: "Services",
    q: "What types of equipment do you handle?",
    a: "We handle a wide range of network and IT equipment including routers, switches, firewalls, access points, servers, UPS units, cabling, and other rack-mount hardware. If you're unsure whether your equipment qualifies, contact us and we'll confirm before you ship."
  },
  {
    category: "Services",
    q: "Do you offer staging and QA services?",
    a: "Yes. Depending on your package, our warehouse team can perform staging tasks such as firmware checks, asset labeling, serial/MAC capture, site-kit assembly, and deployment-readiness verification. Custom staging workflows are available on Professional, Enterprise, and Custom packages."
  },
  {
    category: "Pricing & Packages",
    q: "What is the difference between the packages?",
    a: "Our five tiers - Basic, Standard, Professional, Enterprise, and Custom - differ in storage capacity, device limits, included receiving volume, and outbound shipment coordination. Basic is ideal for one-time projects; Custom is designed for large-scale, ongoing enterprise deployments. See our pricing page for a full comparison."
  },
  {
    category: "Pricing & Packages",
    q: "Are there any setup fees?",
    a: "There are no hidden setup fees. The price listed for each package is the full monthly or per-project rate. Overages (extra pallets, boxes, devices, or labor hours beyond your plan limits) are billed at the rates listed in our add-on services table on the pricing page."
  },
  {
    category: "Pricing & Packages",
    q: "Can I add services to my existing package?",
    a: "Yes. Add-on services such as extended storage, rush staging, site-kit assembly, photo documentation, and inventory & asset capture can be added to any package. These are billed at the per-unit rates shown in the add-ons table on our pricing page and appear as line items on your monthly invoice."
  },
  {
    category: "Onboarding",
    q: "How long does it take to get started after signing up?",
    a: "We require a 2-week setup period after your contract is signed and first payment is received. During this time, we configure your dedicated warehouse space and set up your customer portal account. You'll receive your warehouse details and go-live date via email as soon as your space is ready."
  },
  {
    category: "Onboarding",
    q: "What happens after I sign the agreement?",
    a: "Once your service agreement is signed, you'll receive a Stripe payment link for your first invoice. After payment is confirmed, your 2-week onboarding clock starts. You'll receive a welcome email with your assigned warehouse unit number, facility address, and loading dock instructions. Your portal account will be activated and ready to use on your go-live date."
  },
  {
    category: "Onboarding",
    q: "Can I ship equipment before my go-live date?",
    a: "We ask that all inbound shipments be coordinated after your go-live date to ensure your space is fully prepared. If you have a time-sensitive shipment, contact us in advance and we'll do our best to accommodate it during the setup period."
  },
  {
    category: "Security & Facility",
    q: "Is my equipment secure at your facility?",
    a: "Yes. Our facility features 24/7 HD surveillance cameras throughout all storage and staging areas, keypad-controlled access to individual units, climate-controlled environments maintained at 65–72°F, and fire suppression systems. All access events are logged. Only authorized Layer One staff and your designated representatives may access your space."
  },
  {
    category: "Security & Facility",
    q: "Is the facility climate controlled?",
    a: "Yes. The entire facility is climate controlled with temperature maintained between 65–72°F and humidity levels kept within safe ranges for sensitive electronics. This protects your equipment from thermal stress, condensation, and electrostatic damage during storage."
  },
  {
    category: "Security & Facility",
    q: "Do you have loading dock access for large deliveries?",
    a: "Yes. Our facility has dedicated dock-height loading bays with forklift access for pallet deliveries. We accept LTL (less-than-truckload) and FTL (full truckload) freight shipments. Please notify us in advance for large deliveries so we can coordinate dock availability and receiving staff."
  },
  {
    category: "Portal & Tracking",
    q: "How do I track my equipment through the portal?",
    a: "Your customer portal provides real-time visibility into every stage of your equipment's lifecycle. You can view expected delivery status, receiving logs with photos, pallet and box inventory, device-level staging progress, outbound shipment tracking, and invoices - all from a single dashboard accessible 24/7."
  },
  {
    category: "Portal & Tracking",
    q: "Can multiple people from my company access the portal?",
    a: "Yes. We support two customer roles: Customer Admin (full read access plus the ability to submit delivery requests and shipment requests) and Customer Viewer (read-only access to all data). Contact your Layer One account manager to add additional users to your account."
  },
  {
    category: "Portal & Tracking",
    q: "What happens if my equipment arrives damaged?",
    a: "Our receiving staff documents all inbound shipments with photos and flags any visible damage at the time of receipt. Damage exceptions are recorded in your receiving log and you'll be notified immediately. Photos are attached to the receiving record and visible in your portal. You can use this documentation for carrier claims or insurance purposes."
  },
];

function FaqContent() {
  const categories = Array.from(new Set(FAQ_ITEMS.map(f => f.category)));
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = activeCategory === "All" ? FAQ_ITEMS : FAQ_ITEMS.filter(f => f.category === activeCategory);

  return (
    <section className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#0A84FF] mb-3">FAQ</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-[-1.5px] mb-4 text-white">Frequently Asked Questions</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Everything you need to know about Layer One services, pricing, onboarding, and facility security.</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {["All", ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat
                  ? "bg-[#0A84FF] text-white border-[#0A84FF]"
                  : "border-white/15 text-slate-400 hover:border-[#0A84FF]/50 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {filtered.map((item) => {
            const globalIndex = FAQ_ITEMS.indexOf(item);
            const isOpen = openIndex === globalIndex;
            return (
              <div
                key={globalIndex}
                className={`rounded-xl border transition-all ${
                  isOpen ? "border-[#0A84FF]/40 bg-white/[0.06]" : "border-white/10 bg-white/[0.03] hover:border-white/15"
                }`}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                  onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0A84FF]/15 text-[#5eb2ff] shrink-0">{item.category}</span>
                    <span className="font-medium text-sm text-slate-100">{item.q}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <div className="border-l-2 border-[#0A84FF]/20 pl-4">
                      <p className="text-sm text-slate-300 leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-slate-500 mt-10">
          Still have questions? <a href="mailto:info@layeronestaging.com" className="text-[#0A84FF] hover:underline">Contact our team</a> - we typically respond within one business day.
        </p>

        <div className="text-center mt-10">
          <a
            href="/get-started"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
          >
            Request a Project Quote <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default function FaqPage() {
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
        <FaqContent />
      </main>
      <Footer />
    </div>
  );
}
