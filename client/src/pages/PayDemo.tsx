import { Link } from "wouter";
import { ArrowLeft, CreditCard, FlaskConical } from "lucide-react";

// Demo-only payment page. Linked from demo/test proposal emails when no real
// Stripe payment link should be generated. Shows the order summary with the
// pay button disabled — no charge is possible here.
const DEMO_ITEMS = [
  { label: "Receiving — pallet intake, count & inspect", qty: 24, amount: "$288.00" },
  { label: "Storage — secure pallet storage (1 month)", qty: 24, amount: "$720.00" },
  { label: "Asset tagging, serial/MAC capture", qty: 180, amount: "$450.00" },
  { label: "Site kitting labor (per site kit)", qty: 12, amount: "$1,140.00" },
  { label: "DFW pallet delivery", qty: 12, amount: "$2,100.00" },
];

export default function PayDemo() {
  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/8 max-w-4xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#b7c5d5] hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="text-sm font-bold bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] bg-clip-text text-transparent">
          Layer One
        </span>
      </nav>
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-semibold mb-4">
          <FlaskConical className="w-3.5 h-3.5" />
          Demo preview — no payment processed
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Complete your payment</h1>
        <p className="text-[#b7c5d5] mb-6">
          Stogner IT Services — Project Quote
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-6 mb-6">
          {DEMO_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2.5 border-b border-white/8 last:border-0"
            >
              <div>
                <p className="text-sm text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-500">Qty {item.qty}</p>
              </div>
              <p className="text-sm font-semibold text-white">{item.amount}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/10">
            <p className="text-sm font-semibold text-slate-300">Total due</p>
            <p className="text-xl font-extrabold text-white">$4,698.00</p>
          </div>
        </div>

        <button
          disabled
          className="w-full h-11 rounded-xl bg-white/10 text-slate-400 font-bold cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4" /> Pay $4,698.00 (demo — disabled)
        </button>
        <p className="text-xs text-slate-500 mt-4 text-center leading-relaxed">
          This is a demo of the customer payment step. In a live proposal this
          button opens a secure Stripe checkout. No card details are collected
          and no charge is made here.
        </p>
      </div>
    </div>
  );
}
