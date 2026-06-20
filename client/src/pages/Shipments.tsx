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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Ship, Plus, ChevronRight, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";

function ShipmentForm({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const { data: clients } = trpc.clients.list.useQuery({}, { enabled: role === "admin" || role === "staff" });
  const createMutation = trpc.shipments.create.useMutation({
    onSuccess: () => { toast.success("Shipment created"); utils.shipments.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { clientId: (user as any)?.clientId?.toString() ?? "", projectName: "", destination: "", carrier: "", trackingNumber: "", notes: "" },
  });
  const onSubmit = (data: any) => createMutation.mutate({ ...data, clientId: parseInt(data.clientId) });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(role === "admin" || role === "staff") && (
          <div className="col-span-2">
            <Label>Client *</Label>
            <Select onValueChange={(v) => setValue("clientId", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div><Label>Project Name</Label><Input {...register("projectName")} className="mt-1" /></div>
        <div><Label>Destination</Label><Input {...register("destination")} placeholder="Dallas, TX" className="mt-1" /></div>
        <div><Label>Carrier</Label><Input {...register("carrier")} placeholder="FedEx, UPS..." className="mt-1" /></div>
        <div><Label>Tracking Number</Label><Input {...register("trackingNumber")} className="mt-1" /></div>
        <div className="col-span-2"><Label>Notes</Label><Textarea {...register("notes")} className="mt-1" rows={2} /></div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending}>Create Shipment</Button>
      </DialogFooter>
    </form>
  );
}

export function ShipmentsList() {
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const { data: shipments, isLoading } = trpc.shipments.list.useQuery({});

  return (
    <DashboardLayout>
      <PageHeader
        title="Outbound Shipments"
        subtitle="Track outbound shipments and delivery status"
        action={
          role !== "customer_viewer" ? (
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Shipment
            </Button>
          ) : undefined
        }
      />
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Shipment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carrier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tracking</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={7} /> : shipments?.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={Ship} title="No shipments yet" /></td></tr>
              ) : shipments?.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/shipments/${s.id}`)}>
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm font-medium text-violet-400">{s.shipmentCode}</p>
                    <p className="text-xs text-muted-foreground">{s.projectName ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.destination ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.carrier ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{s.trackingNumber ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Shipment</DialogTitle></DialogHeader>
          <ShipmentForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export function ShipmentDetail() {
  const [, params] = useRoute("/shipments/:id");
  const id = parseInt(params?.id ?? "0");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const utils = trpc.useUtils();

  const { data: shipment, isLoading } = trpc.shipments.get.useQuery({ id });
  const updateMutation = trpc.shipments.update.useMutation({
    onSuccess: () => { toast.success("Shipment updated"); utils.shipments.get.invalidate({ id }); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-32 bg-muted/50 rounded" /></DashboardLayout>;
  if (!shipment) return <DashboardLayout><EmptyState icon={Ship} title="Shipment not found" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title={shipment.shipmentCode}
        subtitle={shipment.projectName ?? ""}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/shipments")}>Back</Button>
          </div>
        }
      />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-card/60 border-border/50">
            <CardHeader><CardTitle className="text-sm">Shipment Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground text-xs mb-1">Status</p><StatusBadge status={shipment.status} /></div>
              <div><p className="text-muted-foreground text-xs mb-1">Destination</p><p>{shipment.destination ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Carrier</p><p>{shipment.carrier ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Tracking</p><p className="font-mono text-xs">{shipment.trackingNumber ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Date Packed</p><p>{shipment.datePacked ? new Date(shipment.datePacked).toLocaleDateString() : "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Date Shipped</p><p>{shipment.dateShipped ? new Date(shipment.dateShipped).toLocaleDateString() : "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Date Delivered</p><p>{shipment.dateDelivered ? new Date(shipment.dateDelivered).toLocaleDateString() : "—"}</p></div>
              {shipment.notes && <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-muted-foreground">{shipment.notes}</p></div>}
            </CardContent>
          </Card>

          {isStaff && (
            <Card className="bg-card/60 border-border/50">
              <CardHeader><CardTitle className="text-sm">Update Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {["requested", "packing", "ready_to_ship", "shipped", "delivered", "exception", "closed"].map((s) => (
                    <Button key={s} variant={shipment.status === s ? "default" : "outline"} size="sm"
                      onClick={() => {
                        const now = new Date().toISOString();
                        updateMutation.mutate({
                          id,
                          status: s as any,
                          ...(s === "shipped" ? { dateShipped: now } : {}),
                          ...(s === "delivered" ? { dateDelivered: now } : {}),
                          ...(s === "packing" ? { datePacked: now } : {}),
                        });
                      }}
                      disabled={updateMutation.isPending}
                    >
                      {s.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Carrier</Label>
                    <Input
                      defaultValue={shipment.carrier ?? ""}
                      className="mt-1 h-8 text-sm"
                      onBlur={(e) => e.target.value !== shipment.carrier && updateMutation.mutate({ id, carrier: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tracking Number</Label>
                    <Input
                      defaultValue={shipment.trackingNumber ?? ""}
                      className="mt-1 h-8 text-sm"
                      onBlur={(e) => e.target.value !== shipment.trackingNumber && updateMutation.mutate({ id, trackingNumber: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {shipment.items && shipment.items.length > 0 && (
            <Card className="bg-card/60 border-border/50">
              <CardHeader><CardTitle className="text-sm">Items ({shipment.items.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                {shipment.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0">
                    <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm capitalize">{item.itemType}</span>
                    <span className="text-xs font-mono text-muted-foreground">#{item.itemId}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-card/60 border-border/50">
          <CardHeader><CardTitle className="text-sm">Photos</CardTitle></CardHeader>
          <CardContent>
            <PhotoGallery entityType="shipment" entityId={id} clientId={shipment.clientId} showUpload={isStaff} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
