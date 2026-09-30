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
  DollarSign,
  Plus,
  Minus,
  Send,
  FileText,
  Server,
  Layers,
  Box,
  ExternalLink,
  PenLine,
  Copy,
  FileSearch,
  CreditCard,
  Rocket,
  Trophy,
  ThumbsDown,
  MapPin,
  CalendarDays,
} from "lucide-react";

const DURATION_LABELS: Record<string, string> = {
  "under-1-month": "Under 1 month",
  "1-3-months": "1–3 months",
  "3-6-months": "3–6 months",
  "6-12-months": "6–12 months",
  "12-plus": "12+ months / ongoing",
};
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { ADDON_RATES, TIER_PRICING } from "@/lib/pricingConstants";

// ─── Types ────────────────────────────────────────────────────────────────────
// Full inquiry lifecycle (matches the DB enum in drizzle/schema.ts).
type InquiryStatus =
  | "new" | "needs_review" | "contacted" | "quote_sent" | "proposal_sent"
  | "msa_signed" | "paid" | "onboarding" | "won" | "lost" | "closed";
// Statuses the staff UI can filter/set. proposal_sent/msa_signed/paid/onboarding
// are normally set by the autonomous flow, but reps can correct them manually.
type InquiryStatusFilter = InquiryStatus;

type Inquiry = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  tier: "basic" | "standard" | "professional" | "enterprise" | "custom";
  deviceVolume: string | null;
  deviceCount: number | null;
  palletCount: number | null;
  boxCount: number | null;
  storageDays: number | null;
  addons: string | null;
  message: string | null;
  locationCount: number | null;
  equipmentTypes: string | null;
  startDate: string | null;
  rolloutDuration: string | null;
  status: InquiryStatus;
  createdAt: Date;
};

type LineItem = { label: string; qty: number; unitPrice: number; total: number };

type Quote = {
  id: number;
  inquiryId: number;
  lineItems: string;
  subtotal: string;
  tax: string;
  totalAmount: string;
  notes: string | null;
  stripePaymentLinkId: string | null;
  stripePaymentLinkUrl: string | null;
  msaStatus: "pending" | "signed" | "waived" | null;
  msaDocumentId: number | null;
  status: "draft" | "sent" | "paid" | "cancelled";
  sentAt: Date | null;
  createdAt: Date;
};

function MsaChip({ status }: { status: Quote["msaStatus"] }) {
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
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${cfg}`}>
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

const STATUS_CONFIG: Record<InquiryStatus, { label: string; icon: any; color: string }> = {
  new: { label: "New", icon: Clock, color: "bg-[#0A84FF]/15 text-[#0A84FF] border-[#0A84FF]/30" },
  needs_review: { label: "Needs Review", icon: FileSearch, color: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  contacted: { label: "Contacted", icon: CheckCircle2, color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  quote_sent: { label: "Quote Sent", icon: FileText, color: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  proposal_sent: { label: "Proposal Sent", icon: Send, color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  msa_signed: { label: "MSA Signed", icon: PenLine, color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  paid: { label: "Paid", icon: CreditCard, color: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40" },
  onboarding: { label: "Onboarding", icon: Rocket, color: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  won: { label: "Won", icon: Trophy, color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  lost: { label: "Lost", icon: ThumbsDown, color: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  closed: { label: "Closed", icon: XCircle, color: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};
const FALLBACK_STATUS = { label: "Unknown", icon: Clock, color: "bg-slate-500/15 text-slate-400 border-slate-500/30" };

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: InquiryStatus }) {
  const cfg = STATUS_CONFIG[status] ?? FALLBACK_STATUS;
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
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-white/8 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Quote Builder Dialog ─────────────────────────────────────────────────────
function QuoteBuilderDialog({
  inquiry,
  onClose,
}: {
  inquiry: Inquiry | null;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (!inquiry) return [];
    const tier = inquiry.tier as keyof typeof TIER_PRICING;
    const pricing = TIER_PRICING[tier];
    const items: LineItem[] = [];
    if (pricing) {
      items.push({
        label: pricing.name,
        qty: 1,
        unitPrice: pricing.amountCents / 100,
        total: pricing.amountCents / 100,
      });
    }
    if (inquiry.deviceCount && inquiry.deviceCount > (pricing?.maxDevices ?? 0)) {
      const extra = inquiry.deviceCount - (pricing?.maxDevices ?? 0);
      if (extra > 0) {
        items.push({
          label: `Extra Devices (${extra} over plan limit)`,
          qty: extra,
          unitPrice: ADDON_RATES.extraDevicePerMonth / 100,
          total: (extra * ADDON_RATES.extraDevicePerMonth) / 100,
        });
      }
    }
    if (inquiry.palletCount && inquiry.palletCount > (pricing?.maxPallets ?? 0)) {
      const extra = inquiry.palletCount - (pricing?.maxPallets ?? 0);
      if (extra > 0) {
        items.push({
          label: `Extra Pallets (${extra} over plan limit)`,
          qty: extra,
          unitPrice: ADDON_RATES.extraPalletPerMonth / 100,
          total: (extra * ADDON_RATES.extraPalletPerMonth) / 100,
        });
      }
    }
    if (inquiry.storageDays && inquiry.storageDays > (pricing?.storageDays ?? 30)) {
      const extraDays = inquiry.storageDays - (pricing?.storageDays ?? 30);
      const boxes = inquiry.boxCount ?? 1;
      const cost = (extraDays * boxes * ADDON_RATES.extraStorageDayPerBox) / 100;
      if (cost > 0) {
        items.push({
          label: `Extended Storage (${extraDays} extra days × ${boxes} boxes)`,
          qty: 1,
          unitPrice: cost,
          total: cost,
        });
      }
    }
    return items.length > 0 ? items : [{ label: "", qty: 1, unitPrice: 0, total: 0 }];
  });
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [confirmSend, setConfirmSend] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<number | null>(null);

  const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + tax;

  const createQuote = trpc.inquiry.createQuote.useMutation({
    onSuccess: (data) => {
      setCreatedQuoteId(data.id);
      utils.inquiry.listQuotes.invalidate({ inquiryId: inquiry!.id });
      toast.success("Quote saved as draft");
    },
    onError: (err) => toast.error(err.message || "Failed to save quote"),
  });

  const sendQuote = trpc.inquiry.sendQuote.useMutation({
    onSuccess: (data) => {
      utils.inquiry.list.invalidate();
      utils.inquiry.listQuotes.invalidate({ inquiryId: inquiry!.id });
      toast.success("Quote sent to customer!");
      if (data.paymentLinkUrl) {
        toast.info("Stripe payment link created and included in the email.");
      }
      onClose();
    },
    onError: (err) => toast.error(err.message || "Failed to send quote"),
  });

  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => {
      const next = [...prev];
      const item = { ...next[i], [field]: value };
      if (field === "qty" || field === "unitPrice") {
        item.total = Math.round(Number(item.qty) * Number(item.unitPrice) * 100) / 100;
      }
      next[i] = item;
      return next;
    });
  };

  const addItem = () => setLineItems(prev => [...prev, { label: "", qty: 1, unitPrice: 0, total: 0 }]);
  const removeItem = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSaveAndSend = async () => {
    const validItems = lineItems.filter(li => li.label.trim());
    if (validItems.length === 0) { toast.error("Add at least one line item"); return; }

    if (createdQuoteId) {
      setConfirmSend(true);
    } else {
      const result = await createQuote.mutateAsync({
        inquiryId: inquiry!.id,
        lineItems: validItems,
        notes: notes || undefined,
        taxRate,
      });
      setCreatedQuoteId(result.id);
      setConfirmSend(true);
    }
  };

  if (!inquiry) return null;

  return (
    <>
      <Dialog open={!!inquiry} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-2xl bg-[#0d1f35] border-white/12 text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-100">
              <DollarSign className="w-4 h-4 text-[#6ee7b7]" />
              Build Quote — {inquiry.company}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Build a custom quote based on the customer's requirements. The quote will be emailed with a Stripe payment link.
            </DialogDescription>
          </DialogHeader>

          {/* Requirements Summary */}
          <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Customer Requirements</p>
            <div className="flex flex-wrap gap-2">
              <TierBadge tier={inquiry.tier} />
              {inquiry.deviceCount != null && (
                <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-300">
                  <Server className="w-3 h-3" /> {inquiry.deviceCount} devices
                </span>
              )}
              {inquiry.palletCount != null && (
                <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-300">
                  <Layers className="w-3 h-3" /> {inquiry.palletCount} pallets
                </span>
              )}
              {inquiry.boxCount != null && (
                <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-300">
                  <Box className="w-3 h-3" /> {inquiry.boxCount} boxes
                </span>
              )}
              {inquiry.storageDays != null && (
                <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-300">
                  <Clock className="w-3 h-3" /> {inquiry.storageDays} days storage
                </span>
              )}
              {inquiry.locationCount != null && (
                <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-300">
                  <MapPin className="w-3 h-3" /> {inquiry.locationCount} locations
                </span>
              )}
              {inquiry.startDate && (
                <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-300">
                  <CalendarDays className="w-3 h-3" /> starts {inquiry.startDate}
                </span>
              )}
              {inquiry.rolloutDuration && (
                <span className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-300">
                  <Clock className="w-3 h-3" /> {DURATION_LABELS[inquiry.rolloutDuration] ?? inquiry.rolloutDuration}
                </span>
              )}
            </div>
            {inquiry.equipmentTypes && (() => {
              try {
                const types: string[] = JSON.parse(inquiry.equipmentTypes);
                return types.length > 0 ? (
                  <p className="text-xs text-slate-400">Equipment: {types.join(", ")}</p>
                ) : null;
              } catch { return null; }
            })()}
            {inquiry.addons && (() => {
              try {
                const addons: string[] = JSON.parse(inquiry.addons);
                return addons.length > 0 ? (
                  <p className="text-xs text-slate-400">Add-ons: {addons.join(", ")}</p>
                ) : null;
              } catch { return null; }
            })()}
            {inquiry.message && (
              <p className="text-xs text-slate-400 italic">"{inquiry.message}"</p>
            )}
          </div>

          {/* Line Items */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Line Items</p>
            <div className="space-y-2">
              {lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_80px_80px_32px] gap-2 items-center">
                  <Input
                    value={li.label}
                    onChange={e => updateItem(i, "label", e.target.value)}
                    placeholder="Service / item description"
                    className="bg-white/5 border-white/12 text-slate-100 placeholder-slate-500 text-sm h-8"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={li.qty}
                    onChange={e => updateItem(i, "qty", parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border-white/12 text-slate-100 text-sm h-8 text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={li.unitPrice}
                    onChange={e => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border-white/12 text-slate-100 text-sm h-8 text-right"
                  />
                  <div className="text-right text-sm font-semibold text-[#6ee7b7]">{fmt(li.total)}</div>
                  <button onClick={() => removeItem(i)} disabled={lineItems.length === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_60px_80px_80px_32px] gap-2 text-xs text-slate-500 px-1">
                <span>Description</span><span className="text-center">Qty</span><span className="text-right">Unit $</span><span className="text-right">Total</span><span />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={addItem}
              className="mt-2 border-white/15 text-slate-300 hover:bg-white/8 h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Line Item
            </Button>
          </div>

          {/* Notes + Tax */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Any notes for the customer…"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/12 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-[#0A84FF]/50 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tax Rate</label>
              <Select value={taxRate.toString()} onValueChange={v => setTaxRate(parseFloat(v))}>
                <SelectTrigger className="bg-white/5 border-white/12 text-slate-100 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1f35] border-white/12">
                  <SelectItem value="0">No tax (0%)</SelectItem>
                  <SelectItem value="0.0825">Texas Sales Tax (8.25%)</SelectItem>
                  <SelectItem value="0.1">10%</SelectItem>
                </SelectContent>
              </Select>

              {/* Totals */}
              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tax ({(taxRate * 100).toFixed(2)}%)</span><span>{fmt(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white border-t border-white/10 pt-1.5">
                  <span>Total</span><span className="text-[#6ee7b7] text-base">{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" className="border-white/15 text-slate-300 hover:bg-white/8"
              onClick={() => {
                const validItems = lineItems.filter(li => li.label.trim());
                if (validItems.length === 0) { toast.error("Add at least one line item"); return; }
                createQuote.mutate({ inquiryId: inquiry.id, lineItems: validItems, notes: notes || undefined, taxRate });
              }}
              disabled={createQuote.isPending}>
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Save as Draft
            </Button>
            <Button size="sm"
              className="bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] text-[#06111f] font-bold hover:opacity-90"
              onClick={handleSaveAndSend}
              disabled={createQuote.isPending || sendQuote.isPending}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Save &amp; Send Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent className="bg-[#0d1f35] border-white/12 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Quote to {inquiry.company}?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will email a quote for <strong className="text-white">{fmt(total)}</strong> to <strong className="text-white">{inquiry.email}</strong> with a Stripe payment link (if Stripe is configured). The inquiry will be marked as "Quote Sent".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] text-[#06111f] font-bold"
              onClick={() => {
                if (createdQuoteId) {
                  sendQuote.mutate({ quoteId: createdQuoteId, inquiryId: inquiry.id });
                }
              }}
            >
              Send Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────
function InquiryDetailDialog({
  inquiry,
  onClose,
  onStatusChange,
  onDelete,
  onBuildQuote,
  isAdmin,
}: {
  inquiry: Inquiry | null;
  onClose: () => void;
  onStatusChange: (id: number, status: InquiryStatusFilter) => void;
  onDelete: (id: number) => void;
  onBuildQuote: (inquiry: Inquiry) => void;
  isAdmin: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [approvedLinks, setApprovedLinks] = useState<{ msaUrl: string; payUrl: string } | null>(null);
  const utils = trpc.useUtils();

  const { data: quotes = [] } = trpc.inquiry.listQuotes.useQuery(
    { inquiryId: inquiry?.id ?? 0 },
    { enabled: !!inquiry }
  );

  // Reset any just-generated links when a different inquiry is opened.
  useEffect(() => {
    setApprovedLinks(null);
  }, [inquiry?.id]);

  const approveAndSend = trpc.quotes.approveAndSend.useMutation({
    onSuccess: (data) => {
      setApprovedLinks({ msaUrl: data.msaUrl, payUrl: data.payUrl });
      utils.inquiry.listQuotes.invalidate({ inquiryId: inquiry!.id });
      utils.inquiry.list.invalidate();
      toast.success("Proposal sent — MSA + payment link emailed to the customer");
    },
    onError: (err) => toast.error(err.message || "Failed to approve quote"),
  });

  if (!inquiry) return null;

  const otherStatuses = (["new", "contacted", "quote_sent", "won", "lost", "closed"] as const).filter(s => s !== inquiry.status);

  return (
    <>
      <Dialog open={!!inquiry} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-lg bg-[#0d1f35] border-white/12 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-100">
              <MessageSquare className="w-4 h-4 text-[#0A84FF]" />
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
              {inquiry.deviceCount != null && (
                <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  {inquiry.deviceCount} devices
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
                  <a href={`mailto:${inquiry.email}`} className="text-sm text-[#0A84FF] hover:underline">
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

            {/* Volume requirements */}
            {(inquiry.deviceCount != null || inquiry.palletCount != null || inquiry.boxCount != null || inquiry.storageDays != null) && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Requirements</p>
                <div className="grid grid-cols-2 gap-2">
                  {inquiry.deviceCount != null && (
                    <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2 flex items-center gap-2">
                      <Server className="w-3.5 h-3.5 text-[#0A84FF]" />
                      <div>
                        <p className="text-xs text-slate-500">Devices</p>
                        <p className="text-sm font-semibold text-slate-100">{inquiry.deviceCount}</p>
                      </div>
                    </div>
                  )}
                  {inquiry.palletCount != null && (
                    <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-[#6ee7b7]" />
                      <div>
                        <p className="text-xs text-slate-500">Pallets</p>
                        <p className="text-sm font-semibold text-slate-100">{inquiry.palletCount}</p>
                      </div>
                    </div>
                  )}
                  {inquiry.boxCount != null && (
                    <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2 flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-amber-400" />
                      <div>
                        <p className="text-xs text-slate-500">Boxes</p>
                        <p className="text-sm font-semibold text-slate-100">{inquiry.boxCount}</p>
                      </div>
                    </div>
                  )}
                  {inquiry.storageDays != null && (
                    <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-violet-400" />
                      <div>
                        <p className="text-xs text-slate-500">Storage Days</p>
                        <p className="text-sm font-semibold text-slate-100">{inquiry.storageDays}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Message */}
            {inquiry.message && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Message</p>
                <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
                </div>
              </div>
            )}

            {/* Existing quotes */}
            {quotes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quotes</p>
                <div className="space-y-2">
                  {(quotes as Quote[]).map(q => (
                    <div key={q.id} className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${
                            q.status === "sent" ? "bg-violet-500/15 text-violet-300 border-violet-500/30" :
                            q.status === "paid" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                            q.status === "cancelled" ? "bg-red-500/15 text-red-300 border-red-500/30" :
                            "bg-slate-500/15 text-slate-400 border-slate-500/30"
                          }`}>{q.status}</span>
                          {q.status !== "draft" && <MsaChip status={q.msaStatus} />}
                          <span className="text-sm font-bold text-[#6ee7b7]">${parseFloat(q.totalAmount).toFixed(2)}</span>
                          <span className="text-xs text-slate-500">{new Date(q.createdAt).toLocaleDateString()}</span>
                        </div>
                        {q.status === "draft" ? (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] text-[#06111f] font-semibold h-7 text-xs"
                            disabled={approveAndSend.isPending}
                            onClick={() => approveAndSend.mutate({ quoteId: q.id })}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            {approveAndSend.isPending ? "Sending…" : "Approve & Send"}
                          </Button>
                        ) : (
                          q.stripePaymentLinkUrl && (
                            <a href={q.stripePaymentLinkUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-[#0A84FF] hover:underline flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> Payment Link
                            </a>
                          )
                        )}
                      </div>
                      {q.status === "draft" && (
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          Approving creates the Stripe payment link, mints the MSA, and emails the proposal to the customer.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer-facing links generated by Approve & Send */}
            {approvedLinks && (
              <div className="rounded-xl border border-[#6ee7b7]/25 bg-[#6ee7b7]/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Proposal sent — customer links
                </p>
                {[
                  { label: "Sign MSA", url: approvedLinks.msaUrl },
                  { label: "Pay", url: approvedLinks.payUrl },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 w-16 shrink-0">{row.label}</span>
                    <input
                      readOnly
                      value={row.url}
                      onClick={e => (e.target as HTMLInputElement).select()}
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 truncate focus:outline-none"
                    />
                    <button
                      onClick={() => copyLink(row.url, row.label)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#6ee7b7] hover:bg-[#6ee7b7]/10 transition-colors shrink-0"
                      title={`Copy ${row.label} link`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
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
            {otherStatuses.slice(0, 2).map(s => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className="border-white/15 text-slate-300 hover:bg-white/8"
                onClick={() => onStatusChange(inquiry.id, s)}
              >
                Mark {STATUS_CONFIG[s].label}
              </Button>
            ))}
            <Button size="sm"
              className="bg-gradient-to-r from-[#0A84FF] to-[#6ee7b7] text-[#06111f] font-semibold"
              onClick={() => { onClose(); onBuildQuote(inquiry); }}>
              <DollarSign className="w-3.5 h-3.5 mr-1.5" />
              Build Quote
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
  const [statusFilter, setStatusFilter] = useState<"all" | InquiryStatusFilter>("all");
  const [tierFilter, setTierFilter] = useState<"all" | "basic" | "standard" | "professional" | "enterprise" | "custom">("all");
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [quoteTarget, setQuoteTarget] = useState<Inquiry | null>(null);

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

  const counts = useMemo(() => {
    const all = inquiries as Inquiry[];
    const c: Record<string, number> = {};
    for (const i of all) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
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
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0A84FF] text-[#06111f] text-xs font-bold">
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
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(["new", "needs_review", "proposal_sent", "msa_signed", "paid", "won"] as const).map(s => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`rounded-xl border p-3 text-left transition-all hover:border-white/20 ${
                  statusFilter === s ? "border-[#0A84FF]/40 bg-[#0A84FF]/8" : "border-white/8 bg-white/3"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">{cfg.label}</span>
                </div>
                <p className="text-xl font-bold text-slate-100">{counts[s] ?? 0}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, company, email…"
              className="pl-9 bg-white/5 border-white/12 text-slate-100 placeholder-slate-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
            <SelectTrigger className="w-40 bg-white/5 border-white/12 text-slate-300">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1f35] border-white/12">
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(STATUS_CONFIG) as InquiryStatus[]).map(s => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={v => setTierFilter(v as any)}>
            <SelectTrigger className="w-44 bg-white/5 border-white/12 text-slate-300">
              <Package className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1f35] border-white/12">
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <LoadingRows />
                ) : (inquiries as Inquiry[]).length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState filtered={isFiltered} />
                    </td>
                  </tr>
                ) : (
                  (inquiries as Inquiry[]).map(inq => (
                    <tr key={inq.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-100">{inq.name}</p>
                        <p className="text-xs text-slate-400">{inq.company}</p>
                        <p className="text-xs text-slate-500">{inq.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <TierBadge tier={inq.tier} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-xs text-slate-400">
                          {inq.deviceCount != null && <span>{inq.deviceCount} devices</span>}
                          {inq.palletCount != null && <span>{inq.palletCount} pallets</span>}
                          {inq.storageDays != null && <span>{inq.storageDays}d storage</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inq.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            title="Build Quote"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#6ee7b7] hover:bg-[#6ee7b7]/10 transition-colors"
                            onClick={() => setQuoteTarget(inq)}
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button
                            title="Mark as Contacted"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                            onClick={() => updateStatus.mutate({ id: inq.id, status: "contacted" })}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            title="Reply via email"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0A84FF] hover:bg-[#0A84FF]/10 transition-colors"
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
        onBuildQuote={inq => setQuoteTarget(inq)}
        isAdmin={isAdmin}
      />

      {/* Quote builder dialog */}
      <QuoteBuilderDialog
        inquiry={quoteTarget}
        onClose={() => setQuoteTarget(null)}
      />
    </DashboardLayout>
  );
}
