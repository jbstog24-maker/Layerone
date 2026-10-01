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
import { ClipboardList, Plus, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useForm } from "react-hook-form";

function ReceivingForm({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: clients } = trpc.clients.list.useQuery({});
  const { data: deliveries } = trpc.deliveries.list.useQuery({});
  const createMutation = trpc.receiving.create.useMutation({
    onSuccess: () => { toast.success("Receiving log created"); utils.receiving.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      clientId: "", deliveryId: "", projectName: "", carrier: "",
      trackingNumber: "", boxCount: "", palletCount: "",
      condition: "good", storageLocation: "", notes: "",
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      clientId: parseInt(data.clientId),
      deliveryId: data.deliveryId ? parseInt(data.deliveryId) : undefined,
      boxCount: data.boxCount ? parseInt(data.boxCount) : undefined,
      palletCount: data.palletCount ? parseInt(data.palletCount) : undefined,
    });
  };

  const selectedClientId = watch("clientId");
  const clientDeliveries = deliveries?.filter(d => d.clientId === parseInt(selectedClientId));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Client *</Label>
          <Select onValueChange={(v) => setValue("clientId", v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              {clients?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {clientDeliveries && clientDeliveries.length > 0 && (
          <div className="col-span-2">
            <Label>Link to Expected Delivery (optional)</Label>
            <Select onValueChange={(v) => setValue("deliveryId", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select delivery" /></SelectTrigger>
              <SelectContent>
                {clientDeliveries.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.projectName ?? `Delivery #${d.id}`}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label>Project Name</Label>
          <Input {...register("projectName")} placeholder="Site A Rollout" className="mt-1" />
        </div>
        <div>
          <Label>Carrier</Label>
          <Input {...register("carrier")} placeholder="FedEx" className="mt-1" />
        </div>
        <div>
          <Label>Tracking Number</Label>
          <Input {...register("trackingNumber")} className="mt-1" />
        </div>
        <div>
          <Label>Storage Location</Label>
          <Input {...register("storageLocation")} placeholder="Rack A-3" className="mt-1" />
        </div>
        <div>
          <Label>Box Count</Label>
          <Input {...register("boxCount")} type="number" placeholder="0" className="mt-1" />
        </div>
        <div>
          <Label>Pallet Count</Label>
          <Input {...register("palletCount")} type="number" placeholder="0" className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Condition</Label>
          <Select onValueChange={(v) => setValue("condition", v as any)} defaultValue="good">
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="exception">Exception</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Notes</Label>
          <Textarea {...register("notes")} placeholder="Any notes about this receiving..." className="mt-1" rows={3} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending}>Log Receiving</Button>
      </DialogFooter>
    </form>
  );
}

export function ReceivingList() {
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const { data: logs, isLoading } = trpc.receiving.list.useQuery({});

  return (
    <DashboardLayout>
      <PageHeader
        title="Receiving Logs"
        subtitle="Log and track inbound shipment receiving"
        action={
          isStaff ? (
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Log Receiving
            </Button>
          ) : undefined
        }
      />
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carrier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Boxes / Pallets</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Condition</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={7} /> : logs?.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={ClipboardList} title="No receiving logs yet" /></td></tr>
              ) : logs?.map((log) => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/receiving/${log.id}`)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{log.projectName ?? `Log #${log.id}`}</p>
                    <p className="text-xs text-muted-foreground font-mono">{log.trackingNumber ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{log.carrier ?? "-"}</td>
                  <td className="px-4 py-3 text-sm">{log.boxCount ?? 0} / {log.palletCount ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={log.condition ?? "good"} /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{log.storageLocation ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(log.receivedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Receiving</DialogTitle></DialogHeader>
          <ReceivingForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export function ReceivingDetail() {
  const [, params] = useRoute("/receiving/:id");
  const id = parseInt(params?.id ?? "0");
  const [, setLocation] = useLocation();
  const { data: log, isLoading } = trpc.receiving.get.useQuery({ id });

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-32 bg-muted/50 rounded" /></DashboardLayout>;
  if (!log) return <DashboardLayout><EmptyState icon={ClipboardList} title="Log not found" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title={log.projectName ?? `Receiving Log #${log.id}`}
        action={<Button variant="outline" size="sm" onClick={() => setLocation("/receiving")}>Back</Button>}
      />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card className="bg-card/60 border-border/50">
            <CardHeader><CardTitle className="text-sm">Log Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground text-xs mb-1">Condition</p><StatusBadge status={log.condition ?? "good"} /></div>
              <div><p className="text-muted-foreground text-xs mb-1">Status</p><StatusBadge status={log.status} /></div>
              <div><p className="text-muted-foreground text-xs mb-1">Carrier</p><p>{log.carrier ?? "-"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Tracking</p><p className="font-mono text-xs">{log.trackingNumber ?? "-"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Boxes</p><p>{log.boxCount ?? 0}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Pallets</p><p>{log.palletCount ?? 0}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Storage Location</p><p>{log.storageLocation ?? "-"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Received At</p><p>{new Date(log.receivedAt).toLocaleString()}</p></div>
              {log.notes && <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-muted-foreground">{log.notes}</p></div>}
            </CardContent>
          </Card>
        </div>
        <Card className="bg-card/60 border-border/50">
          <CardHeader><CardTitle className="text-sm">Photos</CardTitle></CardHeader>
          <CardContent>
            <PhotoGallery entityType="receiving_log" entityId={id} clientId={log.clientId} showUpload={false} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
