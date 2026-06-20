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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Warehouse, Plus, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";

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

export default function Pallets() {
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const { data: pallets, isLoading } = trpc.pallets.list.useQuery({});
  const utils = trpc.useUtils();
  const updateMutation = trpc.pallets.update.useMutation({
    onSuccess: () => { toast.success("Updated"); utils.pallets.list.invalidate(); },
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Pallets"
        subtitle="Track pallet inventory and storage locations"
        action={isStaff ? <Button onClick={() => setShowCreate(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Pallet</Button> : undefined}
      />
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
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
                <tr><td colSpan={6}><EmptyState icon={Warehouse} title="No pallets yet" /></td></tr>
              ) : pallets?.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3"><span className="font-mono text-sm font-medium text-primary">{p.palletCode}</span></td>
                  <td className="px-4 py-3 text-sm">{p.projectName ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">{p.boxCount ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.storageLocation ?? "—"}</td>
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
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Pallet</DialogTitle></DialogHeader>
          <PalletForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
