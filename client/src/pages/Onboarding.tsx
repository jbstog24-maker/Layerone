import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Inbox,
  Loader2,
  PenLine,
  Save,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
// NOTE: server listChecklists returns each checklist row joined with the
// inquiry's company + inquiryStatus (no task counts — those are fetched per
// row below for the progress display).
type UnitAssignment = {
  bays: string[];
  shelves: string[];
  pallets: string[];
  notes?: string;
} | null;

type ChecklistRow = {
  id: number;
  inquiryId: number;
  status: "open" | "in_progress" | "complete";
  notes: string | null;
  unitAssignment: UnitAssignment;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  company: string;
  inquiryStatus: string;
};

type Task = {
  id: number;
  checklistId: number;
  label: string;
  detail: string | null;
  sortOrder: number;
  completedAt: Date | null;
  completedBy: string | null;
};

type QuoteSummary = {
  totalAmount: string;
  msaStatus: "pending" | "signed" | "waived" | null;
  stripePaymentLinkUrl: string | null;
  status: string;
  sentAt: Date | null;
};

const STATUS_CONFIG: Record<ChecklistRow["status"], { label: string; color: string }> = {
  open: { label: "Open", color: "bg-[#0A84FF]/15 text-[#0A84FF] border-[#0A84FF]/30" },
  in_progress: { label: "In Progress", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  complete: { label: "Complete", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
};

function StatusChip({ status }: { status: ChecklistRow["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function MsaChip({ status }: { status: QuoteSummary["msaStatus"] }) {
  if (!status) return null;
  const cfg =
    status === "signed"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : status === "waived"
        ? "bg-slate-500/15 text-slate-400 border-slate-500/30"
        : "bg-amber-500/15 text-amber-300 border-amber-500/30";
  const label =
    status === "signed" ? "MSA signed" : status === "waived" ? "MSA waived" : "MSA pending";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg}`}>
      <PenLine className="w-3 h-3" />
      {label}
    </span>
  );
}

function copyLink(text: string, label: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`${label} copied to clipboard`))
    .catch(() => toast.error("Copy failed"));
}

// ─── Unit assignment form (keyed by checklist id so state resets per list) ───
function UnitAssignmentForm({
  checklistId,
  inquiryId,
  initial,
}: {
  checklistId: number;
  inquiryId: number;
  initial: UnitAssignment;
}) {
  const utils = trpc.useUtils();
  const [bays, setBays] = useState((initial?.bays ?? []).join(", "));
  const [shelves, setShelves] = useState((initial?.shelves ?? []).join(", "));
  const [pallets, setPallets] = useState((initial?.pallets ?? []).join(", "));
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const assign = trpc.onboarding.assignUnits.useMutation({
    onSuccess: () => {
      utils.onboarding.getChecklist.invalidate({ inquiryId });
      utils.onboarding.listChecklists.invalidate();
      toast.success("Unit assignment saved");
    },
    onError: (err) => toast.error(err.message || "Failed to save assignment"),
  });

  const parse = (s: string) =>
    s.split(",").map(v => v.trim()).filter(Boolean);

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Warehouse className="w-3.5 h-3.5" /> Unit Assignment
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { label: "Bays", value: bays, set: setBays, placeholder: "Bay A-3, Bay A-4" },
          { label: "Shelves", value: shelves, set: setShelves, placeholder: "Shelf 12, Shelf 13" },
          { label: "Pallets", value: pallets, set: setPallets, placeholder: "P-101, P-102" },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
            <Input
              value={f.value}
              onChange={e => f.set(e.target.value)}
              placeholder={f.placeholder}
              className="bg-white/5 border-white/12 text-slate-100 placeholder-slate-500 text-sm"
            />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Assignment notes</label>
        <Input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Bays near dock door 2 for easy freight access"
          className="bg-white/5 border-white/12 text-slate-100 placeholder-slate-500 text-sm"
        />
      </div>
      <p className="text-[11px] text-slate-500">Separate multiple units with commas.</p>
      <Button
        size="sm"
        className="bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] text-[#06111f] font-semibold"
        disabled={assign.isPending}
        onClick={() =>
          assign.mutate({
            checklistId,
            unitAssignment: {
              bays: parse(bays),
              shelves: parse(shelves),
              pallets: parse(pallets),
              notes: notes.trim() || undefined,
            },
          })
        }
      >
        <Save className="w-3.5 h-3.5 mr-1.5" />
        {assign.isPending ? "Saving…" : "Save Assignment"}
      </Button>
    </div>
  );
}

// ─── Notes editor ─────────────────────────────────────────────────────────────
function NotesEditor({
  checklistId,
  inquiryId,
  initial,
}: {
  checklistId: number;
  inquiryId: number;
  initial: string | null;
}) {
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState(initial ?? "");
  const [savedNotes, setSavedNotes] = useState(initial ?? "");
  const dirty = notes !== savedNotes;

  const save = trpc.onboarding.updateNotes.useMutation({
    onSuccess: () => {
      setSavedNotes(notes);
      utils.onboarding.getChecklist.invalidate({ inquiryId });
      utils.onboarding.listChecklists.invalidate();
      toast.success("Notes saved");
    },
    onError: (err) => toast.error(err.message || "Failed to save notes"),
  });

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Onboarding Notes</p>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={4}
        placeholder="Internal notes — kickoff call summary, special handling, key contacts…"
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/12 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-[#0A84FF]/50 resize-none"
      />
      <Button
        size="sm"
        variant="outline"
        className="border-white/15 text-slate-300 hover:bg-white/8"
        disabled={!dirty || save.isPending}
        onClick={() => save.mutate({ checklistId, notes })}
      >
        <Save className="w-3.5 h-3.5 mr-1.5" />
        {save.isPending ? "Saving…" : dirty ? "Save Notes" : "Saved"}
      </Button>
    </div>
  );
}

// ─── Checklist detail ─────────────────────────────────────────────────────────
function ChecklistDetail({
  row,
  onBack,
}: {
  row: ChecklistRow;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [confirmComplete, setConfirmComplete] = useState(false);

  const { data, isLoading } = trpc.onboarding.getChecklist.useQuery({
    inquiryId: row.inquiryId,
  });
  const { data: quotes = [] } = trpc.inquiry.listQuotes.useQuery({
    inquiryId: row.inquiryId,
  });

  const tasks = (data?.tasks ?? []) as Task[];
  const checklist = data?.checklist;
  const done = tasks.filter(t => t.completedAt != null).length;

  const quote = (quotes as QuoteSummary[]).find(q => q.stripePaymentLinkUrl) ??
    (quotes as QuoteSummary[])[0];

  const toggle = trpc.onboarding.toggleTask.useMutation({
    onSuccess: (res) => {
      utils.onboarding.getChecklist.invalidate({ inquiryId: row.inquiryId });
      utils.onboarding.listChecklists.invalidate();
      if (res.allComplete) toast.success("All tasks complete — checklist closed out!");
    },
    onError: (err) => toast.error(err.message || "Failed to update task"),
  });

  const complete = trpc.onboarding.completeChecklist.useMutation({
    onSuccess: () => {
      utils.onboarding.getChecklist.invalidate({ inquiryId: row.inquiryId });
      utils.onboarding.listChecklists.invalidate();
      toast.success("Onboarding marked complete");
      setConfirmComplete(false);
    },
    onError: (err) => toast.error(err.message || "Failed to complete checklist"),
  });

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All checklists
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{row.company}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StatusChip status={row.status} />
            <span className="text-xs text-slate-500">
              Inquiry: {row.inquiryStatus.replace(/_/g, " ")}
            </span>
          </div>
        </div>
        {row.status !== "complete" ? (
          <Button
            size="sm"
            className={
              confirmComplete
                ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                : "bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] text-[#06111f] font-semibold"
            }
            disabled={complete.isPending}
            onClick={() => {
              if (confirmComplete) {
                complete.mutate({ checklistId: row.id });
              } else {
                setConfirmComplete(true);
                setTimeout(() => setConfirmComplete(false), 5000);
              }
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            {complete.isPending
              ? "Completing…"
              : confirmComplete
                ? "Click again to confirm — closes remaining tasks"
                : "Mark Complete"}
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            {row.completedAt
              ? `Completed ${new Date(row.completedAt).toLocaleDateString()}`
              : "Completed"}
          </span>
        )}
      </div>

      {/* MSA / payment summary */}
      {quote && (
        <div className="rounded-xl border border-white/8 bg-white/3 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Agreement &amp; Payment
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-lg font-bold text-[#6ee7b7]">
              ${parseFloat(quote.totalAmount).toFixed(2)}
            </span>
            <MsaChip status={quote.msaStatus} />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              quote.status === "paid"
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-slate-500/15 text-slate-400 border-slate-500/30"
            }`}>
              Payment {quote.status === "paid" ? "received" : quote.status}
            </span>
            {quote.stripePaymentLinkUrl && (
              <div className="flex items-center gap-1.5">
                <a
                  href={quote.stripePaymentLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#0A84FF] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Payment Link
                </a>
                <button
                  onClick={() => copyLink(quote.stripePaymentLinkUrl!, "Payment link")}
                  className="p-1 rounded text-slate-500 hover:text-[#6ee7b7] hover:bg-[#6ee7b7]/10 transition-colors"
                  title="Copy payment link"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress + tasks */}
      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Onboarding Tasks
          </p>
          <span className="text-xs text-slate-400 font-medium">
            {done}/{tasks.length} complete
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] transition-all"
            style={{ width: tasks.length ? `${(done / tasks.length) * 100}%` : "0%" }}
          />
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 justify-center text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading tasks…
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No tasks on this checklist.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map(t => {
              const isDone = t.completedAt != null;
              return (
                <button
                  key={t.id}
                  onClick={() =>
                    toggle.mutate({
                      taskId: t.id,
                      completed: !isDone,
                      completedBy: (user as any)?.email ?? (user as any)?.name,
                    })
                  }
                  className={`w-full text-left rounded-lg border px-3.5 py-3 flex items-start gap-3 transition-colors ${
                    isDone
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-white/8 bg-white/2 hover:border-white/20"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${isDone ? "text-slate-400 line-through" : "text-slate-100"}`}>
                      {t.label}
                    </p>
                    {t.detail && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.detail}</p>
                    )}
                    {isDone && t.completedBy && (
                      <p className="text-[11px] text-slate-600 mt-1">
                        Completed by {t.completedBy}
                        {t.completedAt && ` · ${new Date(t.completedAt).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Unit assignment + notes */}
      {checklist && (
        <UnitAssignmentForm
          key={checklist.id}
          checklistId={checklist.id}
          inquiryId={row.inquiryId}
          initial={checklist.unitAssignment}
        />
      )}
      <NotesEditor
        key={`notes-${row.id}`}
        checklistId={row.id}
        inquiryId={row.inquiryId}
        initial={row.notes}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "complete">("all");
  const [selected, setSelected] = useState<ChecklistRow | null>(null);

  const { data: checklists = [], isLoading } = trpc.onboarding.listChecklists.useQuery(
    statusFilter === "all" ? {} : { status: statusFilter },
    { refetchInterval: 30_000 }
  );
  const rows = checklists as ChecklistRow[];

  // Per-row task counts for the x/y progress display (listChecklists doesn't
  // include them, so we fan out one small query per checklist).
  const progressQueries = trpc.useQueries((t) =>
    rows.map(r => t.onboarding.getChecklist({ inquiryId: r.inquiryId }))
  );
  const progressByInquiry = new Map<number, { done: number; total: number }>();
  progressQueries.forEach((q, i) => {
    const tasks = ((q.data as any)?.tasks ?? []) as Task[];
    progressByInquiry.set(rows[i].inquiryId, {
      done: tasks.filter(t => t.completedAt != null).length,
      total: tasks.length,
    });
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {selected ? (
          <ChecklistDetail row={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <ClipboardCheck className="w-6 h-6 text-[#6ee7b7]" />
                <h1 className="text-2xl font-bold text-slate-100">Customer Onboarding</h1>
              </div>
              <p className="text-slate-400 text-sm">
                Checklists are created automatically when a customer signs the MSA and payment clears.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  ["all", "All"],
                  ["open", "Open"],
                  ["in_progress", "In Progress"],
                  ["complete", "Complete"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setStatusFilter(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    statusFilter === v
                      ? "border-[#0A84FF]/40 bg-[#0A84FF]/10 text-white"
                      : "border-white/10 bg-white/3 text-slate-400 hover:border-white/25"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex items-center gap-2 py-16 justify-center text-slate-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading checklists…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Inbox className="w-7 h-7 text-slate-500" />
                </div>
                <p className="text-slate-300 font-medium mb-1">No onboarding checklists</p>
                <p className="text-slate-500 text-sm max-w-xs">
                  They'll appear here automatically once customers sign their MSA and pay.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rows.map(r => {
                  const prog = progressByInquiry.get(r.inquiryId);
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="text-left rounded-2xl border border-white/8 bg-white/2 p-4 hover:border-white/20 hover:bg-white/4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-slate-100 truncate">{r.company}</p>
                        <StatusChip status={r.status} />
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        Inquiry: {r.inquiryStatus.replace(/_/g, " ")} · Updated{" "}
                        {new Date(r.updatedAt).toLocaleDateString()}
                      </p>
                      {prog ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">Tasks</span>
                            <span className="text-xs text-slate-300 font-medium">
                              {prog.done}/{prog.total}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] transition-all"
                              style={{ width: prog.total ? `${(prog.done / prog.total) * 100}%` : "0%" }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="h-1.5 rounded-full bg-white/8 animate-pulse" />
                      )}
                      {r.unitAssignment &&
                        (r.unitAssignment.bays.length > 0 ||
                          r.unitAssignment.shelves.length > 0 ||
                          r.unitAssignment.pallets.length > 0) && (
                          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                            <Warehouse className="w-3 h-3" />
                            {[
                              r.unitAssignment.bays.length > 0 && `${r.unitAssignment.bays.length} bay${r.unitAssignment.bays.length > 1 ? "s" : ""}`,
                              r.unitAssignment.shelves.length > 0 && `${r.unitAssignment.shelves.length} shelf${r.unitAssignment.shelves.length > 1 ? "ves" : ""}`,
                              r.unitAssignment.pallets.length > 0 && `${r.unitAssignment.pallets.length} pallet${r.unitAssignment.pallets.length > 1 ? "s" : ""}`,
                            ]
                              .filter(Boolean)
                              .join(" · ")} assigned
                          </p>
                        )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
