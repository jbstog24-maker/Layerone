import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Phone, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

function getToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

function formatCentral(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function VerifyCall() {
  const [token] = useState(getToken);
  const [done, setDone] = useState<{ ok: boolean; scheduledFor?: string; name?: string; error?: string } | null>(null);
  const verify = trpc.scheduledCall.verify.useMutation();

  useEffect(() => {
    if (!token) {
      setDone({ ok: false, error: "This link is missing its verification token." });
      return;
    }
    verify
      .mutateAsync({ token })
      .then((res) => setDone({ ok: true, scheduledFor: res.scheduledFor, name: res.name }))
      .catch((err: any) => setDone({ ok: false, error: err?.message || "Verification failed." }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
        {!done ? (
          <>
            <Loader2 className="w-10 h-10 text-[#0A84FF] animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Confirming your callback…</h1>
            <p className="text-sm text-slate-400">One moment while we verify your request.</p>
          </>
        ) : done.ok ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">You're confirmed{done.name ? `, ${done.name.split(" ")[0]}` : ""}!</h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Alex will call you on{" "}
              <span className="text-white font-medium">{done.scheduledFor ? formatCentral(done.scheduledFor) : "your chosen time"}</span>{" "}
              (Central). The call comes from <span className="text-white font-medium">+1 (469) 537-4378</span> — save it so you know it's us.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors text-sm">
              Back to Homepage
            </Link>
          </>
        ) : (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Link didn't work</h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">{done.error}</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#0A84FF] text-white hover:bg-[#3d9dff] transition-colors text-sm">
                <Phone className="w-4 h-4" /> Book Again
              </Link>
              <a href="tel:+14695374378" className="text-sm text-slate-400 hover:text-white transition-colors">
                or call +1 (469) 537-4378
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
