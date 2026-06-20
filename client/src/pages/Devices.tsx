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
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Server, Plus, ChevronRight, Search, Cpu } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";

function DeviceForm({ onClose, deviceId }: { onClose: () => void; deviceId?: number }) {
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const { data: existing } = trpc.devices.get.useQuery({ id: deviceId! }, { enabled: !!deviceId });
  const { data: clients } = trpc.clients.list.useQuery({}, { enabled: role === "admin" || role === "staff" });

  const createMutation = trpc.devices.create.useMutation({
    onSuccess: () => { toast.success("Device added"); utils.devices.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.devices.update.useMutation({
    onSuccess: () => { toast.success("Device updated"); utils.devices.list.invalidate(); utils.devices.get.invalidate({ id: deviceId }); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      clientId: existing?.clientId?.toString() ?? (user as any)?.clientId?.toString() ?? "",
      projectName: existing?.projectName ?? "",
      siteName: existing?.siteName ?? "",
      deviceType: existing?.deviceType ?? "",
      brand: existing?.brand ?? "",
      model: existing?.model ?? "",
      serialNumber: existing?.serialNumber ?? "",
      macAddress: existing?.macAddress ?? "",
      assetTag: existing?.assetTag ?? "",
      firmwareVersion: existing?.firmwareVersion ?? "",
      storageLocation: existing?.storageLocation ?? "",
      notes: existing?.notes ?? "",
    },
  });

  const onSubmit = (data: any) => {
    const payload = { ...data, clientId: parseInt(data.clientId) };
    if (deviceId) updateMutation.mutate({ id: deviceId, ...payload });
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
          <Input {...register("projectName")} placeholder="Site A" className="mt-1" />
        </div>
        <div>
          <Label>Site Name</Label>
          <Input {...register("siteName")} placeholder="Dallas HQ" className="mt-1" />
        </div>
        <div>
          <Label>Device Type</Label>
          <Input {...register("deviceType")} placeholder="Switch, AP, Firewall..." className="mt-1" />
        </div>
        <div>
          <Label>Brand</Label>
          <Input {...register("brand")} placeholder="Cisco, Meraki, Ubiquiti..." className="mt-1" />
        </div>
        <div>
          <Label>Model</Label>
          <Input {...register("model")} placeholder="MX68, MS120..." className="mt-1" />
        </div>
        <div>
          <Label>Serial Number</Label>
          <Input {...register("serialNumber")} className="mt-1" />
        </div>
        <div>
          <Label>MAC Address</Label>
          <Input {...register("macAddress")} placeholder="AA:BB:CC:DD:EE:FF" className="mt-1" />
        </div>
        <div>
          <Label>Asset Tag</Label>
          <Input {...register("assetTag")} className="mt-1" />
        </div>
        <div>
          <Label>Firmware Version</Label>
          <Input {...register("firmwareVersion")} className="mt-1" />
        </div>
        <div>
          <Label>Storage Location</Label>
          <Input {...register("storageLocation")} placeholder="Rack B-2" className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Notes</Label>
          <Textarea {...register("notes")} className="mt-1" rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {deviceId ? "Save Changes" : "Add Device"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DevicesList() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const canCreate = role === "admin" || role === "staff";
  const { data: devices, isLoading } = trpc.devices.list.useQuery({ search: search || undefined });

  return (
    <DashboardLayout>
      <PageHeader
        title="Devices"
        subtitle="Track all network equipment by serial, MAC, and staging status"
        action={
          canCreate ? (
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Device
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search serial, MAC, model..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Device</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Serial / MAC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Project / Site</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Staging</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Config</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={6} /> : devices?.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={Server} title="No devices yet" /></td></tr>
              ) : devices?.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/devices/${d.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <Cpu className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{d.brand} {d.model}</p>
                        <p className="text-xs text-muted-foreground">{d.deviceCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-mono text-muted-foreground">{d.serialNumber ?? "—"}</p>
                    <p className="text-xs font-mono text-muted-foreground">{d.macAddress ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{d.projectName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{d.siteName ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={d.stagingStatus} /></td>
                  <td className="px-4 py-3"><StatusBadge status={d.configStatus} /></td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Device</DialogTitle></DialogHeader>
          <DeviceForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export function DeviceDetail() {
  const [, params] = useRoute("/devices/:id");
  const id = parseInt(params?.id ?? "0");
  const [showEdit, setShowEdit] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const utils = trpc.useUtils();

  const { data: device, isLoading } = trpc.devices.get.useQuery({ id });
  const updateMutation = trpc.devices.update.useMutation({
    onSuccess: () => { toast.success("Status updated"); utils.devices.get.invalidate({ id }); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-32 bg-muted/50 rounded" /></DashboardLayout>;
  if (!device) return <DashboardLayout><EmptyState icon={Server} title="Device not found" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title={`${device.brand ?? ""} ${device.model ?? "Device"}`}
        subtitle={device.deviceCode}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/devices")}>Back</Button>
            {isStaff && <Button size="sm" onClick={() => setShowEdit(true)}>Edit</Button>}
          </div>
        }
      />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-card/60 border-border/50">
            <CardHeader><CardTitle className="text-sm">Device Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground text-xs mb-1">Staging Status</p><StatusBadge status={device.stagingStatus} /></div>
              <div><p className="text-muted-foreground text-xs mb-1">Config Status</p><StatusBadge status={device.configStatus} /></div>
              <div><p className="text-muted-foreground text-xs mb-1">Type</p><p>{device.deviceType ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Brand / Model</p><p>{device.brand} {device.model}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Serial Number</p><p className="font-mono text-xs">{device.serialNumber ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">MAC Address</p><p className="font-mono text-xs">{device.macAddress ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Asset Tag</p><p>{device.assetTag ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Firmware</p><p>{device.firmwareVersion ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Project</p><p>{device.projectName ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Site</p><p>{device.siteName ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Storage Location</p><p>{device.storageLocation ?? "—"}</p></div>
              {device.notes && <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-muted-foreground">{device.notes}</p></div>}
            </CardContent>
          </Card>

          {isStaff && (
            <Card className="bg-card/60 border-border/50">
              <CardHeader><CardTitle className="text-sm">Update Staging Status</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["expected", "received", "inventory_captured", "ready_for_staging", "in_staging", "staged", "labeled", "packed", "ready_to_ship", "shipped"].map((s) => (
                    <Button key={s} variant={device.stagingStatus === s ? "default" : "outline"} size="sm"
                      onClick={() => updateMutation.mutate({ id, stagingStatus: s as any })}
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
            <PhotoGallery entityType="device" entityId={id} clientId={device.clientId} showUpload={isStaff} />
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Device</DialogTitle></DialogHeader>
          <DeviceForm onClose={() => setShowEdit(false)} deviceId={id} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
