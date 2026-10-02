import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PhoneCall, StickyNote, History, ShieldAlert, Check, X, Trash2, Plus, Ban } from "lucide-react";

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const AUTHOR_LABELS: Record<string, string> = {
  alex: "Alex",
  admin: "Staff",
  customer: "Customer",
  system: "System",
};

const KIND_ICON: Record<string, typeof StickyNote> = {
  note: StickyNote,
  change: History,
  approval: ShieldAlert,
};

/** Admin "Voice & Notes" section for the client detail page. */
export function ClientVoiceSection({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const { data: allUsers } = trpc.users.list.useQuery();
  const clientUsers = (allUsers ?? []).filter((u: any) => u.clientId === clientId);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const activeUserId = selectedUserId ?? clientUsers[0]?.id ?? null;

  const timeline = trpc.voice.admin.getAccountTimeline.useQuery(
    { userId: activeUserId as number },
    { enabled: !!activeUserId }
  );

  const resolveApproval = trpc.voice.admin.resolveVoiceApproval.useMutation({
    onSuccess: async () => {
      await utils.voice.admin.getAccountTimeline.invalidate();
      await utils.voice.admin.listVoiceApprovals.invalidate();
      await utils.alerts.list.invalidate();
      toast.success("Approval resolved");
    },
    onError: (err) => toast.error(err.message || "Could not resolve approval"),
  });

  const pendingApprovals = (timeline.data ?? []).filter(
    (i) => i.kind === "approval" && i.status === "pending"
  );

  return (
    <Card className="bg-card/60 border-border/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-sky-400" /> Voice & Notes
        </CardTitle>
        <CardDescription>Alex call notes, account changes, and pending phone-request approvals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {clientUsers.length > 1 && (
          <div className="space-y-1">
            <Label>Account user</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={activeUserId ?? ""}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
            >
              {clientUsers.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {pendingApprovals.length > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              {pendingApprovals.length} change{pendingApprovals.length === 1 ? "" : "s"} waiting for review
            </p>
            {pendingApprovals.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-2 rounded-md bg-background/60 p-2">
                <div className="min-w-0">
                  <p className="text-sm">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-400"
                    disabled={resolveApproval.isPending}
                    onClick={() => resolveApproval.mutate({ id: a.id, approve: true })}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/40 text-red-400"
                    disabled={resolveApproval.isPending}
                    onClick={() => resolveApproval.mutate({ id: a.id, approve: false })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Timeline</p>
          {timeline.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !timeline.data || timeline.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No voice activity for this account yet.</p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {timeline.data.map((item) => {
                const Icon = KIND_ICON[item.kind] ?? History;
                return (
                  <li key={`${item.kind}-${item.id}`} className="flex gap-2.5">
                    <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">{AUTHOR_LABELS[item.author] ?? item.author}</Badge>
                        {item.status && (
                          <Badge variant={item.status === "pending" ? "default" : "outline"} className="text-xs">
                            {item.status}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap break-words">{item.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Admin spam blocklist manager. Lives alongside the voice section. */
export function BlockedNumbersCard() {
  const utils = trpc.useUtils();
  const { data: numbers, isLoading } = trpc.voice.admin.listBlockedNumbers.useQuery();
  const [newPhone, setNewPhone] = useState("");
  const [newReason, setNewReason] = useState("");

  const add = trpc.voice.admin.addBlockedNumber.useMutation({
    onSuccess: async (r) => {
      await utils.voice.admin.listBlockedNumbers.invalidate();
      setNewPhone("");
      setNewReason("");
      toast.success(r.duplicate ? "Number was already blocked" : "Number blocked");
    },
    onError: (err) => toast.error(err.message || "Could not block number"),
  });

  const remove = trpc.voice.admin.removeBlockedNumber.useMutation({
    onSuccess: async () => {
      await utils.voice.admin.listBlockedNumbers.invalidate();
      toast.success("Number unblocked");
    },
    onError: (err) => toast.error(err.message || "Could not unblock number"),
  });

  const sourceBadge: Record<string, string> = {
    alex: "bg-sky-500/20 text-sky-300",
    manual: "bg-slate-500/20 text-slate-300",
    auto: "bg-violet-500/20 text-violet-300",
  };

  return (
    <Card className="bg-card/60 border-border/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Ban className="w-4 h-4 text-red-400" /> Blocked Numbers
        </CardTitle>
        <CardDescription>Inbound calls from these numbers are ended immediately. Alex also auto-blocks rapid repeat callers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="block-phone">Phone number</Label>
            <Input
              id="block-phone"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="(800) 555-0199"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="block-reason">Reason (optional)</Label>
            <Input
              id="block-reason"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Sales calls"
              maxLength={255}
            />
          </div>
          <Button
            onClick={() => newPhone.trim() && add.mutate({ phone: newPhone.trim(), reason: newReason.trim() || undefined })}
            disabled={add.isPending || !newPhone.trim()}
            className="gap-1"
          >
            <Plus className="w-4 h-4" /> Block
          </Button>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !numbers || numbers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blocked numbers.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {numbers.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-2 rounded-md bg-background/60 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.phone}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${sourceBadge[n.source] ?? sourceBadge.manual}`}>
                      {n.source}
                    </span>
                    {n.reason && <span className="text-xs text-muted-foreground truncate">{n.reason}</span>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-red-400 shrink-0"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate({ id: n.id })}
                  aria-label={`Unblock ${n.phone}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
