import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calculator, Loader2, ReceiptText } from "lucide-react";
import { toast } from "sonner";

export type TerminableQuote = {
  id: number;
  inquiryId: number;
  totalAmount: string;
  status: "draft" | "sent" | "paid" | "cancelled";
};

const fmt = (cents: number) =>
  "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseDollars = (s: string): number => {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

function BreakdownRow({ label, cents, strong, tone }: { label: string; cents: number; strong?: boolean; tone?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`text-sm ${strong ? "font-semibold text-slate-100" : "text-slate-400"}`}>{label}</span>
      <span className={`text-sm font-mono ${strong ? "font-bold " + (tone ?? "text-slate-100") : "text-slate-300"}`}>
        {fmt(cents)}
      </span>
    </div>
  );
}

/**
 * Admin "Terminate & Refund" dialog for a paid quote.
 * Live-calculates the MSA Section 7.4 back-out breakdown
 * (space cost + 15% admin fee on the remainder) and, on confirmation,
 * issues the Stripe refund and records the termination.
 */
export default function TerminateQuoteDialog({
  quote,
  onClose,
  onDone,
}: {
  quote: TerminableQuote | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [spaceCost, setSpaceCost] = useState("");
  const [recovery, setRecovery] = useState("");
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const utils = trpc.useUtils();

  const spaceCostNum = parseDollars(spaceCost);
  const recoveryNum = parseDollars(recovery);

  const { data: existing, isLoading: checkingExisting } = trpc.termination.get.useQuery(
    { quoteId: quote?.id ?? 0 },
    { enabled: !!quote }
  );

  const { data: preview, isFetching: calculating } = trpc.termination.preview.useQuery(
    { quoteId: quote?.id ?? 0, spaceCost: spaceCostNum, recovery: recoveryNum },
    { enabled: !!quote && !existing }
  );

  const process = trpc.termination.process.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.refundCents > 0
          ? `Terminated - ${fmt(data.refundCents)} refunded${data.stripeRefundId ? ` (${data.stripeRefundId})` : ""}`
          : "Terminated - no refund due ($0)",
      );
      utils.termination.get.invalidate({ quoteId: quote!.id });
      utils.inquiry.listQuotes.invalidate({ inquiryId: quote!.inquiryId });
      setConfirmOpen(false);
      onDone();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const open = !!quote;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-[#0d1626] border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <Calculator className="w-4 h-4 text-[#0A84FF]" />
            Terminate &amp; Refund - Quote #{quote?.id}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            MSA §7.4 back-out: forfeit = committed space cost + 15% admin fee on the remainder.
          </DialogDescription>
        </DialogHeader>

        {checkingExisting ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : existing ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
            <p className="text-sm font-semibold text-amber-300 flex items-center gap-1.5 mb-3">
              <ReceiptText className="w-4 h-4" /> Already terminated
              <span className="text-xs font-normal text-slate-500">
                {new Date(existing.createdAt).toLocaleDateString()}
              </span>
            </p>
            <div className="divide-y divide-white/5">
              <BreakdownRow label="Total paid" cents={Math.round(parseFloat(existing.totalPaid) * 100)} />
              <BreakdownRow label="Space cost" cents={Math.round(parseFloat(existing.spaceCost) * 100)} />
              <BreakdownRow label="Re-lease recovery" cents={Math.round(parseFloat(existing.recovery) * 100)} />
              <BreakdownRow label="Admin fee (15%)" cents={Math.round(parseFloat(existing.adminFee) * 100)} />
              <BreakdownRow label="Forfeited" cents={Math.round(parseFloat(existing.forfeitAmount) * 100)} strong tone="text-red-300" />
              <BreakdownRow label="Refunded" cents={Math.round(parseFloat(existing.refundAmount) * 100)} strong tone="text-[#6ee7b7]" />
            </div>
            {existing.stripeRefundId && (
              <p className="text-[11px] text-slate-500 mt-2 font-mono">Stripe refund: {existing.stripeRefundId}</p>
            )}
            {existing.reason && <p className="text-xs text-slate-400 mt-2">Reason: {existing.reason}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Customer paid</p>
              <p className="text-2xl font-bold text-slate-100">
                ${parseFloat(quote?.totalAmount ?? "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">Space cost committed ($)</label>
                <Input
                  value={spaceCost}
                  onChange={(e) => setSpaceCost(e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                  className="bg-white/5 border-white/10 text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">Re-lease recovery ($)</label>
                <Input
                  value={recovery}
                  onChange={(e) => setRecovery(e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                  className="bg-white/5 border-white/10 text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Reason (optional, kept on record)</label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Customer cancelled before space was reserved"
                className="bg-white/5 border-white/10 text-slate-100"
              />
            </div>

            <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-2">
              {calculating || !preview ? (
                <div className="flex items-center justify-center py-4 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculating…
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  <BreakdownRow label="Net space cost" cents={preview.netSpaceCostCents} />
                  <BreakdownRow label="Admin fee (15% of remainder)" cents={preview.adminFeeCents} />
                  <BreakdownRow label="Total forfeited" cents={preview.forfeitCents} strong tone="text-red-300" />
                  <BreakdownRow label="Refund to customer" cents={preview.refundCents} strong tone="text-[#6ee7b7]" />
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/10 text-slate-300">
            {existing ? "Close" : "Cancel"}
          </Button>
          {!existing && preview && (
            <Button
              className="bg-red-500/90 hover:bg-red-500 text-white font-semibold"
              disabled={process.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {process.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Process Termination
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Final confirmation - shows the exact refund before any money moves */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-[#0d1626] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">Confirm termination</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will mark quote #{quote?.id} as cancelled
              {preview && preview.refundCents > 0 ? (
                <>
                  {" "}and issue a <strong className="text-[#6ee7b7]">{fmt(preview.refundCents)} Stripe refund</strong>{" "}
                  to the customer ({fmt(preview.forfeitCents)} forfeited: {fmt(preview.netSpaceCostCents)} space cost +{" "}
                  {fmt(preview.adminFeeCents)} admin fee).
                </>
              ) : (
                <> with no refund due ($0).</>
              )}{" "}
              This can't be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-slate-300">Go back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={process.isPending}
              onClick={() => {
                if (!preview || !quote) return;
                process.mutate({
                  quoteId: quote.id,
                  spaceCost: spaceCostNum,
                  recovery: recoveryNum,
                  reason: reason.trim() || undefined,
                  confirmAmountCents: preview.refundCents,
                });
              }}
            >
              {process.isPending ? "Processing…" : "Confirm & Process"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
