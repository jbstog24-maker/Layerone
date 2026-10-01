import { Link, useParams } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  PenLine,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

// Public customer-facing MSA signing page. No login required - access is gated
// by the unguessable per-document token in the URL (/sign/:token).
export default function SignMsa() {
  const params = useParams();
  const token = params.token ?? "";
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [agree, setAgree] = useState(false);

  const doc = trpc.msa.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const sign = trpc.msa.sign.useMutation({
    onSuccess: () => {
      toast.success("Agreement signed - thank you!");
      utils.msa.getByToken.invalidate({ token });
    },
    onError: (err) => toast.error(err.message || "Failed to sign agreement"),
  });

  const handleSign = () => {
    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!agree) {
      toast.error("You must agree to the terms to sign");
      return;
    }
    sign.mutate({
      token,
      name: name.trim(),
      title: title.trim() || undefined,
      agree: true,
    });
  };

  const shell = (content: React.ReactNode) => (
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
      <div className="max-w-3xl mx-auto px-6 py-10">{content}</div>
    </div>
  );

  // ── No token at all ──────────────────────────────────────────────────────
  if (!token) {
    return shell(
      <StateCard
        icon={<AlertTriangle className="w-8 h-8 text-amber-400" />}
        title="Invalid signing link"
        body="This signing link is missing its token. Please use the link from your proposal email."
      />
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (doc.isLoading) {
    return shell(
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-[#0A84FF] animate-spin" />
        <p className="text-slate-400 text-sm">Loading your agreement…</p>
      </div>
    );
  }

  // ── Invalid / expired ────────────────────────────────────────────────────
  if (doc.isError) {
    const expired = /expired/i.test(doc.error.message);
    return shell(
      <StateCard
        icon={<AlertTriangle className="w-8 h-8 text-amber-400" />}
        title={expired ? "This signing link has expired" : "Agreement not found"}
        body={
          expired
            ? "Signing links expire after 30 days. Please contact your Layer One rep and we'll send you a fresh link."
            : "We couldn't find an agreement for this link. It may have been withdrawn - please contact your Layer One rep."
        }
      />
    );
  }

  const data = doc.data;
  if (!data) {
    return shell(
      <StateCard
        icon={<AlertTriangle className="w-8 h-8 text-amber-400" />}
        title="Agreement not found"
        body="We couldn't find an agreement for this link."
      />
    );
  }

  // ── Already signed ───────────────────────────────────────────────────────
  if (data.status === "signed") {
    return shell(
      <StateCard
        icon={<CheckCircle2 className="w-10 h-10 text-[#6ee7b7]" />}
        title="Agreement signed"
        body={
          <>
            <p className="mb-2">
              Thank you{data.signedByName ? `, ${data.signedByName}` : ""} - your
              Master Services Agreement with Layer One Staging is on file.
            </p>
            {data.signedAt && (
              <p className="text-xs text-slate-500">
                Signed {new Date(data.signedAt).toLocaleString()}
              </p>
            )}
            <p className="mt-4 text-sm text-slate-400">
              Next step: complete your payment using the payment link in your
              proposal email. Our team will reach out with onboarding details.
            </p>
          </>
        }
      />
    );
  }

  // ── Pending → show document + signature form ─────────────────────────────
  return shell(
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#0A84FF]/30 bg-[#0A84FF]/10 text-[#0A84FF] text-xs font-semibold mb-4">
          <FileText className="w-3.5 h-3.5" />
          Master Services Agreement
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">
          Sign your agreement
        </h1>
        <p className="text-[#b7c5d5]">
          {data.company && (
            <>
              Prepared for <span className="font-semibold text-white">{data.company}</span>
              {data.contactName && <> - {data.contactName}</>}
            </>
          )}
        </p>
        {(data.tierLabel || data.amount) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.tierLabel && (
              <span className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-slate-300">
                {data.tierLabel}
              </span>
            )}
            {data.amount && (
              <span className="text-xs bg-[#6ee7b7]/10 border border-[#6ee7b7]/30 px-2.5 py-1 rounded-full text-[#6ee7b7] font-semibold">
                {data.amount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Agreement document */}
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="bg-white text-slate-900 px-8 py-8 max-h-[60vh] overflow-y-auto">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: data.htmlSnapshot }}
          />
        </div>
      </div>

      {/* Signature form */}
      <div className="rounded-2xl border border-white/10 bg-white/3 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <PenLine className="w-4 h-4 text-[#6ee7b7]" />
          <h2 className="text-lg font-bold text-white">Electronic signature</h2>
        </div>
        <p className="text-xs text-slate-500">
          By signing below you agree to the Master Services Agreement above on
          behalf of {data.company || "your company"}. Your IP address and the
          signing time are recorded with your signature.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Full name <span className="text-red-400">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="bg-white/5 border-white/12 text-slate-100 placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Title <span className="text-slate-600">(optional)</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Operations Manager"
              className="bg-white/5 border-white/12 text-slate-100 placeholder-slate-500"
            />
          </div>
        </div>
        <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-white/10 bg-white/3 px-4 py-3 hover:border-[#0A84FF]/40 transition-colors">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#0A84FF]"
          />
          <span className="text-sm text-slate-300">
            I have read and agree to the Master Services Agreement above, and I
            am authorized to sign on behalf of{" "}
            <span className="font-semibold text-white">
              {data.company || "my company"}
            </span>
            .
          </span>
        </label>
        <Button
          onClick={handleSign}
          disabled={sign.isPending}
          className="w-full bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] text-[#06111f] font-bold hover:opacity-90 h-11"
        >
          {sign.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing…
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 mr-2" /> Sign Agreement
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function StateCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-10 text-center max-w-xl mx-auto">
      <div className="flex justify-center mb-4">{icon}</div>
      <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
      <div className="text-slate-400 text-sm leading-relaxed">{body}</div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 mt-6 text-sm text-[#0A84FF] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
}
