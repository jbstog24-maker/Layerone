import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, LoadingRows } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Warehouse, Plus, ChevronRight, PackageCheck, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";

function PalletForm({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: clients } = trpc.clients.list.useQuery({});
  const createMutation = trpc.pallets.create.useMutation({
    onSuccess: () => { toast.success("Pallet created"); utils.pallets.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const { register, handleSubmit, setValue } = useForm({ defaultValues: { clientId: "", projectName: "", boxCount: "", storageLocation: "", notes: "" } });
  const onSubmit = (data: any) => createMutation.mutate({ ...data, clientId: parseInt(data.clientId), boxCount: data.boxCount ? parseInt(data.boxCount) : undefined });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Client *</Label>
          <Select onValueChange={(v) => setValue("clientId", v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Project Name</Label><Input {...register("projectName")} className="mt-1" /></div>
        <div><Label>Box Count</Label><Input {...register("boxCount")} type="number" className="mt-1" /></div>
        <div className="col-span-2"><Label>Storage Location</Label><Input {...register("storageLocation")} placeholder="Rack A-1" className="mt-1" /></div>
        <div className="col-span-2"><Label>Notes</Label><Textarea {...register("notes")} className="mt-1" rows={2} /></div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending}>Create Pallet</Button>
      </DialogFooter>
    </form>
  );
}

const PAGE_SIZE = 25;

export default function Pallets() {
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkNotify, setShowBulkNotify] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const { data: pallets, isLoading } = trpc.pallets.list.useQuery({});

  const totalPages = Math.max(1, Math.ceil((pallets?.length ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedPallets = pallets?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));
  const utils = trpc.useUtils();
  const updateMutation = trpc.pallets.update.useMutation({
    onSuccess: () => { toast.success("Updated"); utils.pallets.list.invalidate(); },
  });
  const bulkNotifyMutation = trpc.stagingNotify.notifyBulkItems.useMutation({
    onSuccess: (data) => {
      const ok = data.results.filter((r: any) => r.success).length;
      toast.success(`Marked ${ok} pallet(s) as Ready to Ship. Customers notified.`);
      setSelectedIds(new Set());
      setShowBulkNotify(false);
      setBulkMessage("");
      utils.pallets.list.invalidate();
    },
    onError: () => toast.error("Failed to notify. Please try again."),
  });

  function toggleSelect(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (!pallets) return;
    if (selectedIds.size === pallets.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pallets.map(p => p.id)));
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Pallets"
        subtitle="Track pallet inventory and storage locations"
        action={isStaff ? (
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button onClick={() => setShowBulkNotify(true)} size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white gap-1">
                <PackageCheck className="w-4 h-4" /> Mark {selectedIds.size} Ready to Ship
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Pallet</Button>
          </div>
        ) : undefined}
      />
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                {isStaff && (
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={pallets && pallets.length > 0 && selectedIds.size === pallets.length}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pallet Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Boxes</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Received</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={6} /> : pallets?.length === 0 ? (
                <tr><td colSpan={6}>
                  <EmptyState
                    icon={Warehouse}
                    title="No pallets yet"
                    description={isStaff
                      ? "Create a pallet when equipment arrives at the dock."
                      : "Pallets are created when we receive your equipment. Start by telling us what is headed our way."}
                    action={isStaff ? (
                      <Button onClick={() => setShowCreate(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Pallet</Button>
                    ) : (
                      <Button onClick={() => setLocation("/deliveries")} size="sm"><Truck className="w-4 h-4 mr-1" /> Add a Delivery</Button>
                    )}
                  />
                </td></tr>
              ) : pagedPallets?.map((p) => (
                <tr key={p.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer ${selectedIds.has(p.id) ? "bg-green-500/5" : ""}`} onClick={() => setLocation(`/pallets/${p.id}`)}>
                  {isStaff && (
                    <td className="px-4 py-3" onClick={(e) => toggleSelect(p.id, e)}>
                      <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => {}} aria-label={`Select ${p.palletCode}`} />
                    </td>
                  )}
                  <td className="px-4 py-3"><span className="font-mono text-sm font-medium text-primary">{p.palletCode}</span></td>
                  <td className="px-4 py-3 text-sm">{p.projectName ?? "-"}</td>
                  <td className="px-4 py-3 text-sm">{p.boxCount ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.storageLocation ?? "-"}</td>
                  <td className="px-4 py-3">
                    {isStaff ? (
                      <Select defaultValue={p.status} onValueChange={(v) => updateMutation.mutate({ id: p.id, status: v as any })}>
                        <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["received","in_storage","staging","ready_to_ship","shipped","exception"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <StatusBadge status={p.status} />}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(p.dateReceived).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(pallets?.length ?? 0) > PAGE_SIZE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}-{(currentPage - 1) * PAGE_SIZE + (pagedPallets?.length ?? 0)} of {pallets?.length} pallets
            </p>
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); goToPage(currentPage - 1); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-40" : undefined}
                  />
                </PaginationItem>
                {pageNumbers.map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === p}
                      onClick={(e) => { e.preventDefault(); goToPage(p); }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); goToPage(currentPage + 1); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-40" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Pallet</DialogTitle></DialogHeader>
          <PalletForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      {/* Bulk Ready to Ship dialog */}
      <Dialog open={showBulkNotify} onOpenChange={setShowBulkNotify}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-green-400" />
              Mark {selectedIds.size} Pallet{selectedIds.size !== 1 ? "s" : ""} Ready to Ship
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This will update the status of the selected pallets to <strong>Ready to Ship</strong> and send an email notification to the customer.
            </p>
            <div className="space-y-1">
              <Label htmlFor="bulk-msg-pallet">Optional message to customer</Label>
              <Textarea
                id="bulk-msg-pallet"
                placeholder="e.g. Your pallets are staged and ready for pickup or dispatch..."
                value={bulkMessage}
                onChange={e => setBulkMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkNotify(false)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={bulkNotifyMutation.isPending}
              onClick={() => bulkNotifyMutation.mutate({
                itemType: "pallet",
                itemIds: Array.from(selectedIds),
                message: bulkMessage || undefined,
              })}
            >
              {bulkNotifyMutation.isPending ? "Notifying..." : "Notify Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ─── Pallet Detail Page ───────────────────────────────────────────────────────
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Pencil, PackageCheck as PackageCheckIcon, Loader2 } from "lucide-react";

export function PalletDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const palletId = Number(id);
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "staff";

  const [showForwardingEdit, setShowForwardingEdit] = useState(false);
  const [forwardingForm, setForwardingForm] = useState({ forwardingAddress: "", forwardingContact: "", forwardingNotes: "", forwardingStatus: "pending" as "pending" | "in_transit" | "delivered" });
  const [showNotify, setShowNotify] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");

  const { data: pallet, isLoading } = trpc.pallets.get.useQuery({ id: palletId });

  const updateForwardingMutation = trpc.forwarding.updatePallet.useMutation({
    onSuccess: () => { utils.pallets.get.invalidate({ id: palletId }); setShowForwardingEdit(false); toast.success("Forwarding info updated"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const notifyMutation = trpc.stagingNotify.notifyBulkItems.useMutation({
    onSuccess: () => { setShowNotify(false); setNotifyMessage(""); toast.success("Customer notified!"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const openForwardingEdit = () => {
    setForwardingForm({
      forwardingAddress: pallet?.forwardingAddress ?? "",
      forwardingContact: pallet?.forwardingContact ?? "",
      forwardingNotes: pallet?.forwardingNotes ?? "",
      forwardingStatus: (pallet?.forwardingStatus as "pending" | "in_transit" | "delivered") ?? "pending",
    });
    setShowForwardingEdit(true);
  };

  const statusColor = (s: string | null) => {
    if (s === "delivered") return "bg-green-100 text-green-800 border-green-200";
    if (s === "in_transit") return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div></DashboardLayout>;
  if (!pallet) return <DashboardLayout><div className="p-6 text-muted-foreground">Pallet not found</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/pallets")}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-2xl font-bold">{pallet.palletCode ?? `Pallet #${pallet.id}`}</h1>
              <p className="text-muted-foreground text-sm">{pallet.projectName ?? ""}</p>
            </div>
          </div>
          {isStaff && pallet.status !== "ready_to_ship" && (
            <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => setShowNotify(true)}>
              <PackageCheckIcon className="h-4 w-4 mr-2" />Mark Ready to Ship
            </Button>
          )}
          {pallet.status === "ready_to_ship" && (
            <Badge className="bg-green-100 text-green-800 border border-green-200">Ready to Ship</Badge>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Status", value: pallet.status?.replace(/_/g, " ") },
            { label: "Box Count", value: pallet.boxCount ?? "-" },
            { label: "Storage Location", value: pallet.storageLocation ?? "-" },
            { label: "Received", value: pallet.dateReceived ? new Date(pallet.dateReceived).toLocaleDateString() : "-" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold capitalize">{String(value)}</p>
            </div>
          ))}
        </div>

        {/* Forwarding Location Card */}
        <div className="border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Forwarding Location</h2>
            </div>
            <Button variant="outline" size="sm" onClick={openForwardingEdit}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
            </Button>
          </div>
          <Separator />
          {!pallet.forwardingAddress ? (
            <p className="text-sm text-muted-foreground italic">No forwarding address set yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Address</p>
                <p className="whitespace-pre-line">{pallet.forwardingAddress}</p>
              </div>
              {pallet.forwardingContact && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contact</p>
                  <p>{pallet.forwardingContact}</p>
                </div>
              )}
              {pallet.forwardingNotes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p>{pallet.forwardingNotes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(pallet.forwardingStatus)}`}>
                  {pallet.forwardingStatus?.replace(/_/g, " ") ?? "pending"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {pallet.notes && (
          <div className="border rounded-lg p-5">
            <h2 className="font-semibold mb-2">Notes</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{pallet.notes}</p>
          </div>
        )}

        {/* Forwarding Edit Dialog */}
        <Dialog open={showForwardingEdit} onOpenChange={setShowForwardingEdit}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Forwarding Location</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Forwarding Address</Label>
                <Textarea rows={3} placeholder="123 Main St, Dallas, TX 75201" value={forwardingForm.forwardingAddress} onChange={e => setForwardingForm(f => ({ ...f, forwardingAddress: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Name / Phone</Label>
                <Input placeholder="John Doe - 214-555-0100" value={forwardingForm.forwardingContact} onChange={e => setForwardingForm(f => ({ ...f, forwardingContact: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} placeholder="Delivery instructions, dock hours, etc." value={forwardingForm.forwardingNotes} onChange={e => setForwardingForm(f => ({ ...f, forwardingNotes: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={forwardingForm.forwardingStatus} onValueChange={v => setForwardingForm(f => ({ ...f, forwardingStatus: v as "pending" | "in_transit" | "delivered" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForwardingEdit(false)}>Cancel</Button>
              <Button disabled={updateForwardingMutation.isPending} onClick={() => updateForwardingMutation.mutate({ palletId, ...forwardingForm })}>
                {updateForwardingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notify Dialog */}
        <Dialog open={showNotify} onOpenChange={setShowNotify}>
          <DialogContent>
            <DialogHeader><DialogTitle>Mark Ready to Ship</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">This will notify the customer that <strong>{pallet.palletCode ?? `Pallet #${pallet.id}`}</strong> is staged and ready to ship.</p>
              <div className="space-y-1.5">
                <Label>Optional Message</Label>
                <Textarea rows={3} placeholder="Add a personal note to the customer..." value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNotify(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={notifyMutation.isPending}
                onClick={() => notifyMutation.mutate({ itemType: "pallet", itemIds: [palletId], message: notifyMessage || undefined })}>
                {notifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackageCheckIcon className="h-4 w-4 mr-2" />}Notify Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
