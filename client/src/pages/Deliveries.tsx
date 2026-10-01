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
import { Truck, Plus, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";

function DeliveryForm({ onClose, deliveryId }: { onClose: () => void; deliveryId?: number }) {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const { data: existing } = trpc.deliveries.get.useQuery({ id: deliveryId! }, { enabled: !!deliveryId });
  const { data: clients } = trpc.clients.list.useQuery({}, { enabled: role === "admin" || role === "staff" });

  const createMutation = trpc.deliveries.create.useMutation({
    onSuccess: () => { toast.success("Delivery created"); utils.deliveries.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.deliveries.update.useMutation({
    onSuccess: () => { toast.success("Delivery updated"); utils.deliveries.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      clientId: existing?.clientId?.toString() ?? (user as any)?.clientId?.toString() ?? "",
      projectName: existing?.projectName ?? "",
      carrier: existing?.carrier ?? "",
      trackingNumber: existing?.trackingNumber ?? "",
      expectedDate: existing?.expectedDate ? new Date(existing.expectedDate).toISOString().split("T")[0] : "",
      expectedBoxCount: existing?.expectedBoxCount?.toString() ?? "",
      expectedPalletCount: existing?.expectedPalletCount?.toString() ?? "",
      expectedContents: existing?.expectedContents ?? "",
      siteName: existing?.siteName ?? "",
      specialInstructions: existing?.specialInstructions ?? "",
    },
  });

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      clientId: parseInt(data.clientId),
      expectedBoxCount: data.expectedBoxCount ? parseInt(data.expectedBoxCount) : undefined,
      expectedPalletCount: data.expectedPalletCount ? parseInt(data.expectedPalletCount) : undefined,
    };
    if (deliveryId) updateMutation.mutate({ id: deliveryId, ...payload });
    else createMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(role === "admin" || role === "staff") && (
          <div className="col-span-2">
            <Label>Client *</Label>
            <Select onValueChange={(v) => setValue("clientId", v)} defaultValue={existing?.clientId?.toString()}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label>Project Name</Label>
          <Input {...register("projectName")} placeholder="Site A Rollout" className="mt-1" />
        </div>
        <div>
          <Label>Site Name</Label>
          <Input {...register("siteName")} placeholder="Dallas HQ" className="mt-1" />
        </div>
        <div>
          <Label>Carrier</Label>
          <Input {...register("carrier")} placeholder="FedEx, UPS, etc." className="mt-1" />
        </div>
        <div>
          <Label>Tracking Number</Label>
          <Input {...register("trackingNumber")} placeholder="1Z999AA10123456784" className="mt-1" />
        </div>
        <div>
          <Label>Expected Date</Label>
          <Input {...register("expectedDate")} type="date" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Expected Boxes</Label>
            <Input {...register("expectedBoxCount")} type="number" placeholder="0" className="mt-1" />
          </div>
          <div>
            <Label>Expected Pallets</Label>
            <Input {...register("expectedPalletCount")} type="number" placeholder="0" className="mt-1" />
          </div>
        </div>
        <div className="col-span-2">
          <Label>Expected Contents</Label>
          <Textarea {...register("expectedContents")} placeholder="Describe what's in the shipment..." className="mt-1" rows={2} />
        </div>
        <div className="col-span-2">
          <Label>Special Instructions</Label>
          <Textarea {...register("specialInstructions")} placeholder="Any special handling notes..." className="mt-1" rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {deliveryId ? "Save Changes" : "Create Delivery"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DeliveriesList() {
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const { data: deliveries, isLoading } = trpc.deliveries.list.useQuery({});

  return (
    <DashboardLayout>
      <PageHeader
        title="Expected Deliveries"
        subtitle="Track inbound shipments and expected arrivals"
        action={
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Delivery
          </Button>
        }
      />
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carrier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expected</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Boxes / Pallets</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={6} /> : deliveries?.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={Truck} title="No deliveries yet" description="Submit an expected delivery to get started." /></td></tr>
              ) : deliveries?.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/deliveries/${d.id}`)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{d.projectName ?? `Delivery #${d.id}`}</p>
                    {d.siteName && <p className="text-xs text-muted-foreground">{d.siteName}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{d.carrier ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{d.expectedDate ? new Date(d.expectedDate).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{d.expectedBoxCount ?? 0} / {d.expectedPalletCount ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Expected Delivery</DialogTitle></DialogHeader>
          <DeliveryForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export function DeliveryDetail() {
  const [, params] = useRoute("/deliveries/:id");
  const id = parseInt(params?.id ?? "0");
  const [showEdit, setShowEdit] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const utils = trpc.useUtils();

  const { data: delivery, isLoading } = trpc.deliveries.get.useQuery({ id });
  const updateMutation = trpc.deliveries.update.useMutation({
    onSuccess: () => { toast.success("Status updated"); utils.deliveries.get.invalidate({ id }); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-32 bg-muted/50 rounded" /></DashboardLayout>;
  if (!delivery) return <DashboardLayout><EmptyState icon={Truck} title="Delivery not found" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title={delivery.projectName ?? `Delivery #${delivery.id}`}
        subtitle={delivery.siteName ?? ""}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/deliveries")}>Back</Button>
            {isStaff && <Button size="sm" onClick={() => setShowEdit(true)}>Edit</Button>}
          </div>
        }
      />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-card/60 border-border/50">
            <CardHeader><CardTitle className="text-sm">Delivery Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground text-xs mb-1">Status</p><StatusBadge status={delivery.status} /></div>
              <div><p className="text-muted-foreground text-xs mb-1">Carrier</p><p>{delivery.carrier ?? "-"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Tracking</p><p className="font-mono text-xs">{delivery.trackingNumber ?? "-"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Expected Date</p><p>{delivery.expectedDate ? new Date(delivery.expectedDate).toLocaleDateString() : "-"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Expected Boxes</p><p>{delivery.expectedBoxCount ?? 0}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Expected Pallets</p><p>{delivery.expectedPalletCount ?? 0}</p></div>
              {delivery.expectedContents && <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Contents</p><p>{delivery.expectedContents}</p></div>}
              {delivery.specialInstructions && <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Special Instructions</p><p className="text-muted-foreground">{delivery.specialInstructions}</p></div>}
            </CardContent>
          </Card>

          {isStaff && (
            <Card className="bg-card/60 border-border/50">
              <CardHeader><CardTitle className="text-sm">Update Status</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["expected", "in_transit", "received", "partially_received", "damaged", "exception", "closed"].map((s) => (
                    <Button
                      key={s}
                      variant={delivery.status === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateMutation.mutate({ id, status: s as any })}
                      disabled={updateMutation.isPending}
                    >
                      {s.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-card/60 border-border/50">
          <CardHeader><CardTitle className="text-sm">Photos</CardTitle></CardHeader>
          <CardContent>
            <PhotoGallery
              entityType="delivery"
              entityId={id}
              clientId={delivery.clientId}
              showUpload={!!(role !== "customer_viewer")}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Delivery</DialogTitle></DialogHeader>
          <DeliveryForm onClose={() => setShowEdit(false)} deliveryId={id} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
