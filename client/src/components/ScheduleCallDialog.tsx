import { useMemo, useState } from "react";
import { Phone, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Convert an America/Chicago wall-clock date+time to a UTC ISO string.
 * Handles DST by probing the zone offset for that exact date.
 */
export function centralToUtcIso(dateStr: string, timeStr: string): string {
  const [Y, M, D] = dateStr.split("-").map(Number);
  const [h, m] = timeStr.split(":").map(Number);
  const asUtc = Date.UTC(Y, M - 1, D, h, m);
  const inChicago = new Date(new Date(asUtc).toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const inUtc = new Date(new Date(asUtc).toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = inChicago.getTime() - inUtc.getTime();
  return new Date(asUtc - offsetMs).toISOString();
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#0A84FF]/60 focus:ring-2 focus:ring-[#0A84FF]/20";

export function ScheduleCallDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [topic, setTopic] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [booked, setBooked] = useState<{ emailSent: boolean } | null>(null);

  const book = trpc.scheduledCall.book.useMutation();

  const minDate = useMemo(() => todayPlus(0), []);
  const maxDate = useMemo(() => todayPlus(30), []);

  const reset = () => {
    setName(""); setPhone(""); setEmail(""); setCompany("");
    setDate(""); setTime(""); setTopic("");
    setFormError(null); setBooked(null); book.reset();
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) return setFormError("Please enter your name.");
    if (phone.replace(/\D/g, "").length < 7) return setFormError("Please enter a valid phone number.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setFormError("Please enter a valid email address.");
    if (!date || !time) return setFormError("Please choose a date and time.");
    let scheduledFor: string;
    try {
      scheduledFor = centralToUtcIso(date, time);
    } catch {
      return setFormError("Please choose a valid date and time.");
    }
    if (new Date(scheduledFor).getTime() < Date.now() + 15 * 60 * 1000) {
      return setFormError("Please choose a time at least 15 minutes in the future.");
    }
    try {
      const res = await book.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        topic: topic.trim() || undefined,
        scheduledFor,
      });
      setBooked({ emailSent: res.emailSent });
    } catch (err: any) {
      const msg =
        err?.data?.code === "TOO_MANY_REQUESTS" || err?.shape?.data?.code === "TOO_MANY_REQUESTS"
          ? err?.message
          : err?.message || "Something went wrong. Please try again.";
      setFormError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0b1526] border-white/10 text-white max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <span className="w-9 h-9 rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center">
              <Phone className="w-4 h-4 text-[#0A84FF]" />
            </span>
            Schedule a Call
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Pick a time and Alex — our AI receptionist — will call you. We verify your email first so nobody can book calls in your name.
          </DialogDescription>
        </DialogHeader>

        {booked ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Almost done — check your email</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {booked.emailSent ? (
                <>We sent a confirmation link to <span className="text-white font-medium">{email}</span>. Click it within an hour and Alex will call you at your chosen time.</>
              ) : (
                <>Your request was received, but we couldn't send the confirmation email. Please double-check the address and submit again.</>
              )}
            </p>
            <button
              onClick={() => handleClose(false)}
              className="mt-6 px-5 py-2.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors text-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3.5 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" className={inputClass} maxLength={120} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Company</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" className={inputClass} maxLength={200} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Phone *</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(214) 555-0100" type="tel" className={inputClass} maxLength={30} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" type="email" className={inputClass} maxLength={320} />
              <p className="text-[11px] text-slate-500 mt-1">We'll send a confirmation link here — the call is only scheduled after you click it.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Date *</label>
                <input value={date} onChange={(e) => setDate(e.target.value)} type="date" min={minDate} max={maxDate} className={`${inputClass} [color-scheme:dark]`} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Time (Central) *</label>
                <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className={`${inputClass} [color-scheme:dark]`} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">What should we talk about?</label>
              <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Staging 200 laptops across 12 sites next quarter" rows={2} className={`${inputClass} resize-none`} maxLength={2000} />
            </div>
            {formError && (
              <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={book.isPending}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors disabled:opacity-60 shadow-[0_14px_34px_rgba(10,132,255,0.3)]"
            >
              {book.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              {book.isPending ? "Booking…" : "Request My Call"}
            </button>
            <p className="text-[11px] text-slate-500 text-center">Calls come from +1 (469) 537-4378 — save it so you know it's us.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
