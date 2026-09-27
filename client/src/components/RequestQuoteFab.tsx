import { useState } from "react";
import { useLocation } from "wouter";
import { ClipboardList } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import RequestForm from "@/components/RequestForm";

/**
 * Floating "Request a Quote" button + dialog, rendered on every page (see
 * App.tsx) so the quote request form is always one tap away. Hidden on the
 * dedicated /get-started page where the full form already lives.
 */
export default function RequestQuoteFab() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  if (location === "/get-started") return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] text-[#06111f] shadow-[0_14px_34px_rgba(57,167,255,0.35)] hover:-translate-y-0.5 active:scale-[0.97] transition-transform"
        aria-label="Request a quote"
      >
        <ClipboardList className="w-5 h-5" />
        <span className="hidden sm:inline">Request a Quote</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0a1a2e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="mb-2 pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0A84FF]/30 bg-[#0A84FF]/10 text-[#0A84FF] text-xs font-semibold mb-3 self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7] animate-pulse" />
              Free Consultation — No Commitment
            </div>
            <DialogTitle className="text-2xl font-extrabold text-white leading-tight text-left">
              Get Started with{" "}
              <span className="bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] bg-clip-text text-transparent">
                Layer One
              </span>
            </DialogTitle>
            <DialogDescription className="text-[#b7c5d5] mt-1 text-left">
              Tell us about your deployment needs and a rep will build a custom quote for you.
            </DialogDescription>
          </DialogHeader>
          <RequestForm onSubmitted={() => setTimeout(() => setOpen(false), 4000)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
