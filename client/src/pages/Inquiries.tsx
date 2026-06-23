import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Inbox,
  Search,
  Mail,
  Phone,
  Building2,
  Package,
  MessageSquare,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Inquiry = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  tier: "basic" | "standard" | "professional" | "enterprise" | "custom";
  deviceVolume: string | null;
  message: string | null;
  status: "new" | "contacted" | "closed";
  createdAt: Date;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const TIER_LABELS: Record<string, string> = {
  basic: "Project Staging Pilot",
  standard: "Shared Staging Shelf",
  professional: "Shared Staging Bay",
  enterprise: "Dedicated Staging Area",
  custom: "Rollout Suite",
};

const TIER_COLORS: Record<string, string> = {
  basic: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  standard: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  professional: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  enterprise: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  custom: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const STATUS_CONFIG = {
  new: { label: "New", icon: Clock, color: "bg-[#39a7ff]/15 text-[#39a7ff] border-[#39a7ff]/30" },
  contacted: { label: "Contacted", icon: CheckCircle2, color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  closed: { label: "Closed", icon: XCircle, color: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Inquiry["status"] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function TierBadge({ tier }: { tier: Inquiry["tier"] }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TIER_COLORS[tier]}`}>
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Inbox className="w-7 h-7 text-slate-500" />
      </div>
      <p className="text-slate-300 font-medium mb-1">
        {filtered ? "No inquiries match your filters" : "No inquiries yet"}
      </p>
      <p className="text-slate-500 text-sm max-w-xs">
        {filtered
          ? "Try adjusting your search or filter criteria."
          : "When prospects submit an inquiry from the landing page, they'll appear here."}
      </p>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-white/5">
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-white/8 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────
function InquiryDetailDialog({
  inquiry,
  onClose,
  onStatusChange,
  onDelete,
  isAdmin,
}: {
  inquiry: Inquiry | null;
  onClose: () => void;
  onStatusChange: (id: number, status: Inquiry["status"]) => void;
  onDelete: (id: number) => void;
  isAdmin: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!inquiry) return null;

  const otherStatuses = (["new", "contacted", "closed"] as const).filter(s => s !== inquiry.status);

  return (
    <>
      <Dialog open={!!inquiry} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-lg bg-[#0d1f35] border-white/12 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-100">
              <MessageSquare className="w-4 h-4 text-[#39a7ff]" />
              Inquiry from {inquiry.company}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Submitted {new Date(inquiry.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Status + Tier */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={inquiry.status} />
              <TierBadge tier={inquiry.tier} />
              {inquiry.deviceVolume && (
                <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  {inquiry.deviceVolume} devices
                </span>
              )}
            </div>

            {/* Contact info */}
            <div className="rounded-xl border border-white/8 bg-white/3 divide-y divide-white/6">
              <div className="flex items-center gap-3 px-4 py-3">
                <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Contact</p>
                  <p className="text-sm font-medium text-slate-100">{inquiry.name}</p>
                  <p className="text-xs text-slate-400">{inquiry.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Email</p>
                  <a href={`mailto:${inquiry.email}`} className="text-sm text-[#39a7ff] hover:underline">
                    {inquiry.email}
                  </a>
                </div>
              </div>
              {inquiry.phone && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                    <a href={`tel:${inquiry.phone}`} className="text-sm text-slate-200 hover:text-white">
                      {inquiry.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            {inquiry.message && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Message</p>
                <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 sm:mr-auto"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            )}
            {otherStatuses.map(s => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className="border-white/15 text-slate-300 hover:bg-white/8"
                onClick={() => onStatusChange(inquiry.id, s)}
              >
                Mark as {STATUS_CONFIG[s].label}
              </Button>
            ))}
            <Button size="sm" asChild className="bg-[#39a7ff] hover:bg-[#39a7ff]/90 text-[#06111f] font-semibold">
              <a href={`mailto:${inquiry.email}?subject=Re: Layer One ${TIER_LABELS[inquiry.tier]} Inquiry`}>
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                Reply via Email
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="bg-[#0d1f35] border-white/12 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this inquiry?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently remove the inquiry from {inquiry.company}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { setConfirmDelete(false); onDelete(inquiry.id); onClose(); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Inquiries() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "contacted" | "closed">("all");
  const [tierFilter, setTierFilter] = useState<"all" | "basic" | "standard" | "professional" | "enterprise" | "custom">("all");
  const [selected, setSelected] = useState<Inquiry | null>(null);

  const utils = trpc.useUtils();

  const { data: inquiries = [], isLoading } = trpc.inquiry.list.useQuery(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      tier: tierFilter !== "all" ? tierFilter : undefined,
      search: search.trim() || undefined,
    },
    { refetchInterval: 30_000 },
  );

  const { data: newCount = 0 } = trpc.inquiry.countNew.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const updateStatus = trpc.inquiry.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      utils.inquiry.list.invalidate();
      utils.inquiry.countNew.invalidate();
      toast.success(`Inquiry marked as ${STATUS_CONFIG[vars.status].label}`);
      // Update selected if open
      setSelected(prev => prev?.id === vars.id ? { ...prev, status: vars.status } : prev);
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteInquiry = trpc.inquiry.delete.useMutation({
    onSuccess: () => {
      utils.inquiry.list.invalidate();
      utils.inquiry.countNew.invalidate();
      toast.success("Inquiry deleted");
    },
    onError: () => toast.error("Failed to delete inquiry"),
  });

  const isFiltered = statusFilter !== "all" || tierFilter !== "all" || search.trim() !== "";

  // Summary counts
  const counts = useMemo(() => {
    const all = inquiries as Inquiry[];
    return {
      new: all.filter(i => i.status === "new").length,
      contacted: all.filter(i => i.status === "contacted").length,
      closed: all.filter(i => i.status === "closed").length,
    };
  }, [inquiries]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-100">Inquiries Inbox</h1>
              {newCount > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#39a7ff] text-[#06111f] text-xs font-bold">
                  {newCount > 99 ? "99+" : newCount}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">Package inquiry submissions from the public landing page.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 text-slate-300 hover:bg-white/8 shrink-0"
            onClick={() => { utils.inquiry.list.invalidate(); utils.inquiry.countNew.invalidate(); }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {(["new", "contacted", "closed"] as const).map(s => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`rounded-xl border p-4 text-left transition-all hover:border-white/20 ${
                  statusFilter === s ? "border-[#39a7ff]/40 bg-[#39a7ff]/8" : "border-white/8 bg-white/3"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${s === "new" ? "text-[#39a7ff]" : s === "contacted" ? "text-amber-400" : "text-slate-500"}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{cfg.label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-100">{counts[s]}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <Input
              placeholder="Search by name, company, email, or message…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/12 text-slate-100 placeholder:text-slate-500 focus:border-[#39a7ff]/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-40 bg-white/5 border-white/12 text-slate-300">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1f35] border-white/12">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={v => setTierFilter(v as typeof tierFilter)}>
            <SelectTrigger className="w-52 bg-white/5 border-white/12 text-slate-300">
              <Package className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <SelectValue placeholder="Package" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1f35] border-white/12">
              <SelectItem value="all">All Packages</SelectItem>
              <SelectItem value="basic">Project Staging Pilot</SelectItem>
              <SelectItem value="standard">Shared Staging Shelf</SelectItem>
              <SelectItem value="professional">Shared Staging Bay</SelectItem>
              <SelectItem value="enterprise">Dedicated Staging Area</SelectItem>
              <SelectItem value="custom">Rollout Suite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Package</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Devices</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Received</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <LoadingRows />
                ) : inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState filtered={isFiltered} />
                    </td>
                  </tr>
                ) : (
                  (inquiries as Inquiry[]).map(inq => (
                    <tr
                      key={inq.id}
                      className="border-b border-white/5 hover:bg-white/4 cursor-pointer transition-colors group"
                      onClick={() => setSelected(inq)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-100 group-hover:text-white">{inq.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {inq.company}
                        </p>
                        <p className="text-xs text-[#39a7ff]/80 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {inq.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <TierBadge tier={inq.tier} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inq.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {inq.deviceVolume ?? <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {inq.status === "new" && (
                            <button
                              title="Mark as Contacted"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                              onClick={() => updateStatus.mutate({ id: inq.id, status: "contacted" })}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {inq.status !== "closed" && (
                            <button
                              title="Mark as Closed"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors"
                              onClick={() => updateStatus.mutate({ id: inq.id, status: "closed" })}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            title="Reply via email"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#39a7ff] hover:bg-[#39a7ff]/10 transition-colors"
                            onClick={() => {
                              window.location.href = `mailto:${inq.email}?subject=Re: Layer One ${TIER_LABELS[inq.tier]} Inquiry`;
                            }}
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            title="View details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-colors"
                            onClick={() => setSelected(inq)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!isLoading && inquiries.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/6 bg-white/2">
              <p className="text-xs text-slate-500">
                Showing {inquiries.length} {inquiries.length === 1 ? "inquiry" : "inquiries"}
                {isFiltered && " (filtered)"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail dialog */}
      <InquiryDetailDialog
        inquiry={selected}
        onClose={() => setSelected(null)}
        onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
        onDelete={id => deleteInquiry.mutate({ id })}
        isAdmin={isAdmin}
      />
    </DashboardLayout>
  );
}
