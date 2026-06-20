import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, LoadingRows } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Box, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";

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

export default function Boxes() {
  const [showCreate, setShowCreate] = useState(false);
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={6} /> : boxes?.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={Box} title="No boxes yet" /></td></tr>
              ) : boxes?.map((b) => (
                <tr key={b.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3"><span className="font-mono text-sm font-medium text-cyan-400">{b.boxCode}</span></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{(b as any).palletCode ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{b.trackingNumber ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.condition ?? "good"} /></td>
                  <td className="px-4 py-3">
                    {isStaff ? (
                      <Select defaultValue={b.status} onValueChange={(v) => updateMutation.mutate({ id: b.id, status: v as any })}>
                        <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["received","in_storage","staging","packed","shipped","exception"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <StatusBadge status={b.status} />}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{b.storageLocation ?? "—"}</td>
                </tr>
              ))}
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
