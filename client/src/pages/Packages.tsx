import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Package, Plus, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";

const TIERS = [
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
  { value: "custom", label: "Custom" },
];

function PackageForm({ onClose, packageId }: { onClose: () => void; packageId?: number }) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.packages.get.useQuery({ id: packageId! }, { enabled: !!packageId });
  const createMutation = trpc.packages.create.useMutation({
    onSuccess: () => { toast.success("Package created"); utils.packages.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.packages.update.useMutation({
    onSuccess: () => { toast.success("Package updated"); utils.packages.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      name: existing?.name ?? "",
      tier: existing?.tier ?? "basic",
      basePrice: existing?.basePrice?.toString() ?? "0.00",
      billingCycle: existing?.billingCycle ?? "monthly",
      maxDevices: existing?.maxDevices?.toString() ?? "",
      maxBoxes: existing?.maxBoxes?.toString() ?? "",
      maxPallets: existing?.maxPallets?.toString() ?? "",
      storageDays: existing?.storageDays?.toString() ?? "",
      maxOutboundShipments: existing?.maxOutboundShipments?.toString() ?? "",
      includedLaborHours: existing?.includedLaborHours?.toString() ?? "",
      description: existing?.description ?? "",
    },
  });

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      maxDevices: data.maxDevices ? parseInt(data.maxDevices) : undefined,
      maxBoxes: data.maxBoxes ? parseInt(data.maxBoxes) : undefined,
      maxPallets: data.maxPallets ? parseInt(data.maxPallets) : undefined,
      storageDays: data.storageDays ? parseInt(data.storageDays) : undefined,
      maxOutboundShipments: data.maxOutboundShipments ? parseInt(data.maxOutboundShipments) : undefined,
      includedLaborHours: data.includedLaborHours ? parseInt(data.includedLaborHours) : undefined,
    };
    if (packageId) updateMutation.mutate({ id: packageId, ...payload });
    else createMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Package Name *</Label>
          <Input {...register("name")} placeholder="Standard Bay" className="mt-1" />
        </div>
        <div>
          <Label>Tier</Label>
          <Select onValueChange={(v) => setValue("tier", v as any)} defaultValue={existing?.tier ?? "basic"}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Base Price ($)</Label>
          <Input {...register("basePrice")} type="number" step="0.01" placeholder="0.00" className="mt-1" />
        </div>
        <div>
          <Label>Billing Cycle</Label>
          <Select onValueChange={(v) => setValue("billingCycle", v as any)} defaultValue={existing?.billingCycle ?? "monthly"}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="one_time">One-Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Max Devices</Label>
          <Input {...register("maxDevices")} type="number" placeholder="Unlimited" className="mt-1" />
        </div>
        <div>
          <Label>Max Boxes</Label>
          <Input {...register("maxBoxes")} type="number" placeholder="Unlimited" className="mt-1" />
        </div>
        <div>
          <Label>Max Pallets</Label>
          <Input {...register("maxPallets")} type="number" placeholder="Unlimited" className="mt-1" />
        </div>
        <div>
          <Label>Storage Days</Label>
          <Input {...register("storageDays")} type="number" placeholder="30" className="mt-1" />
        </div>
        <div>
          <Label>Max Outbound Shipments</Label>
          <Input {...register("maxOutboundShipments")} type="number" placeholder="Unlimited" className="mt-1" />
        </div>
        <div>
          <Label>Included Labor Hours</Label>
          <Input {...register("includedLaborHours")} type="number" placeholder="0" className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Description</Label>
          <Textarea {...register("description")} placeholder="Package description..." className="mt-1" rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {packageId ? "Save Changes" : "Create Package"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function Packages() {
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const { data: packages, isLoading } = trpc.packages.list.useQuery();

  return (
    <DashboardLayout>
      <PageHeader
        title="Packages"
        subtitle="Define service tiers and pricing for clients"
        action={
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Package
          </Button>
        }
      />
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-card/60 rounded-xl border border-border/50 animate-pulse" />)}
        </div>
      ) : packages?.length === 0 ? (
        <EmptyState icon={Package} title="No packages yet" description="Create your first service package." />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {packages?.map((pkg) => (
            <Card key={pkg.id} className="bg-card/60 border-border/50 card-glow transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{pkg.name}</CardTitle>
                    <StatusBadge status={pkg.tier} className="mt-1" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">${Number(pkg.basePrice).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{pkg.billingCycle === "monthly" ? "/month" : "one-time"}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                {pkg.description && <p className="text-muted-foreground text-xs mb-2">{pkg.description}</p>}
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="text-muted-foreground">Devices:</span><span>{pkg.maxDevices ?? "Unlimited"}</span>
                  <span className="text-muted-foreground">Boxes:</span><span>{pkg.maxBoxes ?? "Unlimited"}</span>
                  <span className="text-muted-foreground">Pallets:</span><span>{pkg.maxPallets ?? "Unlimited"}</span>
                  <span className="text-muted-foreground">Storage:</span><span>{pkg.storageDays ? `${pkg.storageDays} days` : "Unlimited"}</span>
                  <span className="text-muted-foreground">Shipments:</span><span>{pkg.maxOutboundShipments ?? "Unlimited"}</span>
                  <span className="text-muted-foreground">Labor hrs:</span><span>{pkg.includedLaborHours ?? 0}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setEditId(pkg.id)}>Edit</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Package</DialogTitle></DialogHeader>
          <PackageForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Package</DialogTitle></DialogHeader>
          {editId && <PackageForm onClose={() => setEditId(null)} packageId={editId} />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
