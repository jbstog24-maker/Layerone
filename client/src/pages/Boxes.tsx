import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, LoadingRows } from "@/components/EmptyState";
import { PhotoGallery } from "@/components/PhotoUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Box, Plus, ChevronRight, MapPin, CheckCircle2, Truck, Clock, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Forwarding helpers ───────────────────────────────────────────────────────
const FWD_STATUS_CONFIG = {
  pending:    { label: "Pending",    color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",  icon: Clock },
  in_transit: { label: "In Transit", color: "bg-blue-500/15 text-blue-300 border-blue-500/30",        icon: Truck },
  delivered:  { label: "Delivered",  color: "bg-green-500/15 text-green-300 border-green-500/30",     icon: CheckCircle2 },
} as const;

// ─── Box Create Form ──────────────────────────────────────────────────────────
function BoxForm({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: clients } = trpc.clients.list.useQuery({});
  const { data: pallets } = trpc.pallets.list.useQuery({});
  const createMutation = trpc.boxes.create.useMutation({
    onSuccess: () => { toast.success("Box created"); utils.boxes.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const { register, handleSubmit, setValue, watch } = useForm({ defaultValues: { clientId: "", palletId: "", trackingNumber: "", condition: "good", contents: "", storageLocation: "", notes: "" } });
  const selectedClientId = watch("clientId");
  const clientPallets = pallets?.filter(p => p.clientId === parseInt(selectedClientId));
  const onSubmit = (data: any) => createMutation.mutate({ ...data, clientId: parseInt(data.clientId), palletId: data.palletId ? parseInt(data.palletId) : undefined });
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
        {clientPallets && clientPallets.length > 0 && (
          <div className="col-span-2">
            <Label>Pallet (optional)</Label>
            <Select onValueChange={(v) => setValue("palletId", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select pallet" /></SelectTrigger>
              <SelectContent>{clientPallets.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.palletCode}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div><Label>Tracking Number</Label><Input {...register("trackingNumber")} className="mt-1" /></div>
        <div>
          <Label>Condition</Label>
          <Select onValueChange={(v) => setValue("condition", v as any)} defaultValue="good">
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="exception">Exception</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label>Storage Location</Label><Input {...register("storageLocation")} placeholder="Rack A-1" className="mt-1" /></div>
        <div className="col-span-2"><Label>Contents</Label><Textarea {...register("contents")} className="mt-1" rows={2} /></div>
        <div className="col-span-2"><Label>Notes</Label><Textarea {...register("notes")} className="mt-1" rows={2} /></div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending}>Create Box</Button>
      </DialogFooter>
    </form>
  );
}

// ─── Boxes List ───────────────────────────────────────────────────────────────
export default function Boxes() {
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const { data: boxes, isLoading } = trpc.boxes.list.useQuery({});
  const utils = trpc.useUtils();
  const updateMutation = trpc.boxes.update.useMutation({
    onSuccess: () => { toast.success("Updated"); utils.boxes.list.invalidate(); },
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Boxes"
        subtitle="Track individual box inventory and conditions"
        action={isStaff ? <Button onClick={() => setShowCreate(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Box</Button> : undefined}
      />
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Box Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pallet</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tracking</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Condition</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Forwarding</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={8} /> : boxes?.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={Box} title="No boxes yet" /></td></tr>
              ) : boxes?.map((b) => {
                const fwdSt = ((b as any).forwardingStatus ?? "pending") as keyof typeof FWD_STATUS_CONFIG;
                const fwdCfg = FWD_STATUS_CONFIG[fwdSt];
                const FwdIcon = fwdCfg.icon;
                return (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/boxes/${b.id}`)}>
                    <td className="px-4 py-3"><span className="font-mono text-sm font-medium text-cyan-400">{b.boxCode}</span></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{(b as any).palletCode ?? "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{b.trackingNumber ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.condition ?? "good"} /></td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {isStaff ? (
                        <Select defaultValue={b.status} onValueChange={(v) => updateMutation.mutate({ id: b.id, status: v as any })}>
                          <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["received","in_storage","staging","packed","shipped","exception"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : <StatusBadge status={b.status} />}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs gap-1 ${fwdCfg.color}`}>
                        <FwdIcon className="w-3 h-3" />{fwdCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{b.storageLocation ?? "—"}</td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Box</DialogTitle></DialogHeader>
          <BoxForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ─── Box Detail ───────────────────────────────────────────────────────────────
export function BoxDetail() {
  const [, params] = useRoute("/boxes/:id");
  const id = parseInt(params?.id ?? "0");
  const [showFwdEdit, setShowFwdEdit] = useState(false);
  const [fwdAddress, setFwdAddress] = useState("");
  const [fwdContact, setFwdContact] = useState("");
  const [fwdNotes, setFwdNotes] = useState("");
  const [fwdStatus, setFwdStatus] = useState<"pending" | "in_transit" | "delivered">("pending");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const utils = trpc.useUtils();

  const { data: box, isLoading } = trpc.boxes.get.useQuery({ id });
  const updateStatus = trpc.boxes.update.useMutation({
    onSuccess: () => { toast.success("Status updated"); utils.boxes.get.invalidate({ id }); },
    onError: (e) => toast.error(e.message),
  });
  const updateForwarding = trpc.forwarding.updateBox.useMutation({
    onSuccess: () => { toast.success("Forwarding info saved"); utils.boxes.get.invalidate({ id }); setShowFwdEdit(false); },
    onError: (e) => toast.error(e.message),
  });

  const openFwdEdit = () => {
    setFwdAddress((box as any)?.forwardingAddress ?? "");
    setFwdContact((box as any)?.forwardingContact ?? "");
    setFwdNotes((box as any)?.forwardingNotes ?? "");
    setFwdStatus(((box as any)?.forwardingStatus ?? "pending") as any);
    setShowFwdEdit(true);
  };

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-32 bg-muted/50 rounded m-6" /></DashboardLayout>;
  if (!box) return <DashboardLayout><EmptyState icon={Box} title="Box not found" /></DashboardLayout>;

  const fwdSt = ((box as any)?.forwardingStatus ?? "pending") as keyof typeof FWD_STATUS_CONFIG;
  const fwdCfg = FWD_STATUS_CONFIG[fwdSt];
  const FwdIcon = fwdCfg.icon;

  return (
    <DashboardLayout>
      <PageHeader
        title={box.boxCode}
        subtitle={box.projectName ?? "Box Detail"}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/boxes")}>Back</Button>
          </div>
        }
      />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {/* Box Details */}
          <Card className="bg-card/60 border-border/50">
            <CardHeader><CardTitle className="text-sm">Box Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground text-xs mb-1">Status</p><StatusBadge status={box.status} /></div>
              <div><p className="text-muted-foreground text-xs mb-1">Condition</p><StatusBadge status={box.condition ?? "good"} /></div>
              <div><p className="text-muted-foreground text-xs mb-1">Tracking Number</p><p className="font-mono text-xs">{box.trackingNumber ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Storage Location</p><p>{box.storageLocation ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Project</p><p>{box.projectName ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Received</p><p>{new Date(box.createdAt).toLocaleDateString()}</p></div>
              {box.contents && <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Contents</p><p className="text-muted-foreground">{box.contents}</p></div>}
              {box.notes && <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-muted-foreground">{box.notes}</p></div>}
            </CardContent>
          </Card>

          {/* Status update (staff only) */}
          {isStaff && (
            <Card className="bg-card/60 border-border/50">
              <CardHeader><CardTitle className="text-sm">Update Status</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["received", "in_storage", "staging", "packed", "shipped", "exception"].map((s) => (
                    <Button key={s} variant={box.status === s ? "default" : "outline"} size="sm"
                      onClick={() => updateStatus.mutate({ id, status: s as any })}
                      disabled={updateStatus.isPending}
                    >
                      {s.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {/* Forwarding Card */}
          <Card className="bg-card/60 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" /> Forwarding Location
              </CardTitle>
              <Button size="sm" variant="outline" onClick={openFwdEdit} className="h-7 px-2 text-xs gap-1">
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs gap-1 ${fwdCfg.color}`}>
                  <FwdIcon className="w-3 h-3" />{fwdCfg.label}
                </Badge>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  {(box as any)?.forwardingAddress
                    ? <p className="text-foreground whitespace-pre-line">{(box as any).forwardingAddress}</p>
                    : <p className="text-muted-foreground italic text-xs">No forwarding address set</p>}
                  {(box as any)?.forwardingContact && <p className="text-muted-foreground text-xs mt-0.5">{(box as any).forwardingContact}</p>}
                  {(box as any)?.forwardingNotes && <p className="text-muted-foreground text-xs mt-1">{(box as any).forwardingNotes}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card className="bg-card/60 border-border/50">
            <CardHeader><CardTitle className="text-sm">Photos</CardTitle></CardHeader>
            <CardContent>
              <PhotoGallery entityType="box" entityId={id} clientId={box.clientId} showUpload={isStaff} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forwarding Edit Dialog */}
      <Dialog open={showFwdEdit} onOpenChange={setShowFwdEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-400" />Set Forwarding Location</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Forwarding Status</Label>
              <Select value={fwdStatus} onValueChange={(v) => setFwdStatus(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Forwarding Address</Label>
              <Textarea value={fwdAddress} onChange={(e) => setFwdAddress(e.target.value)} rows={3} className="mt-1 resize-none" placeholder="123 Main St, Austin TX 78701" />
            </div>
            <div>
              <Label className="text-xs">Contact at Destination</Label>
              <Input value={fwdContact} onChange={(e) => setFwdContact(e.target.value)} className="mt-1" placeholder="John Smith — (512) 555-0100" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={fwdNotes} onChange={(e) => setFwdNotes(e.target.value)} rows={2} className="mt-1 resize-none" placeholder="Delivery instructions…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFwdEdit(false)}>Cancel</Button>
            <Button
              onClick={() => updateForwarding.mutate({ boxId: id, forwardingAddress: fwdAddress || null, forwardingContact: fwdContact || null, forwardingNotes: fwdNotes || null, forwardingStatus: fwdStatus })}
              disabled={updateForwarding.isPending}
            >
              {updateForwarding.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
