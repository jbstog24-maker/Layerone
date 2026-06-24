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
import { Server, Plus, ChevronRight, Search, Cpu, MapPin, CheckCircle2, Truck, Clock, Pencil, PackageCheck, Upload, FileText, AlertCircle, Download } from "lucide-react";
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

function parseDeviceCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { if (vals[i]) row[h] = vals[i]; });
    return row;
  });
}

const CSV_FIELD_MAP: Record<string, string> = {
  devicetype: "deviceType", device_type: "deviceType", type: "deviceType",
  brand: "brand", manufacturer: "brand",
  model: "model",
  serialnumber: "serialNumber", serial: "serialNumber", sn: "serialNumber",
  macaddress: "macAddress", mac: "macAddress",
  assettag: "assetTag", asset: "assetTag", tag: "assetTag",
  sitename: "siteName", site: "siteName",
  projectname: "projectName", project: "projectName",
  notes: "notes",
};

export function DevicesList() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importClientId, setImportClientId] = useState("");
  const [csvPreview, setCsvPreview] = useState<Array<Record<string, string>>>([]);
  const [csvError, setCsvError] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const canCreate = role === "admin" || role === "staff";
  const { data: devices, isLoading } = trpc.devices.list.useQuery({ search: search || undefined });
  const { data: clients } = trpc.clients.list.useQuery({}, { enabled: canCreate });
  const utils = trpc.useUtils();

  const batchImportMut = trpc.devices.batchImport.useMutation({
    onSuccess: (res) => {
      toast.success(`Imported ${res.imported} devices successfully`);
      utils.devices.list.invalidate();
      setShowImport(false);
      setCsvPreview([]);
      setImportClientId("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setCsvError("Please select a .csv file"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseDeviceCSV(text);
      if (rows.length === 0) { setCsvError("No data rows found in CSV"); return; }
      if (rows.length > 500) { setCsvError("Maximum 500 devices per import"); return; }
      setCsvError("");
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importClientId || csvPreview.length === 0) return;
    const mapped = csvPreview.map(row => {
      const device: Record<string, string> = {};
      Object.entries(row).forEach(([k, v]) => {
        const field = CSV_FIELD_MAP[k];
        if (field) device[field] = v;
      });
      return device;
    });
    batchImportMut.mutate({ clientId: parseInt(importClientId), devices: mapped });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Devices"
        subtitle="Track all network equipment by serial, MAC, and staging status"
        action={
          canCreate ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                if (!devices?.length) { return; }
                const rows = devices.map(d => ({ id: d.id, deviceCode: d.deviceCode, serialNumber: d.serialNumber ?? "", macAddress: d.macAddress ?? "", model: d.model ?? "", brand: d.brand ?? "", deviceType: d.deviceType ?? "", stagingStatus: d.stagingStatus, clientId: d.clientId ?? "" }));
                const keys = Object.keys(rows[0]);
                const lines = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify((r as any)[k] ?? "")).join(","))];
                const blob = new Blob([lines.join("\n")], { type: "text/csv" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "devices.csv"; a.click(); URL.revokeObjectURL(a.href);
              }}>
                <Download className="w-4 h-4 mr-1" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowImport(true); setCsvPreview([]); setCsvError(""); }}>
                <Upload className="w-4 h-4 mr-1" /> Import CSV
              </Button>
              <Button onClick={() => setShowCreate(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add Device
              </Button>
            </div>
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

      {/* CSV Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> Bulk Import Devices from CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Template download hint */}
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> CSV Format</p>
              <p>Accepted columns (case-insensitive): <code className="bg-muted px-1 rounded">deviceType, brand, model, serialNumber, macAddress, assetTag, siteName, projectName, notes</code></p>
              <p className="mt-1">First row must be headers. Maximum 500 rows per import.</p>
            </div>

            {/* Client selector */}
            <div>
              <Label className="text-sm mb-1.5 block">Assign to Client *</Label>
              <Select value={importClientId} onValueChange={setImportClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File picker */}
            <div>
              <Label className="text-sm mb-1.5 block">CSV File *</Label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-xs file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
              />
            </div>

            {/* Error */}
            {csvError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" /> {csvError}
              </div>
            )}

            {/* Preview */}
            {csvPreview.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">{csvPreview.length} device{csvPreview.length !== 1 ? "s" : ""} ready to import</p>
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        {["Brand", "Model", "Serial", "MAC", "Site"].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="px-3 py-1.5">{row.brand ?? "—"}</td>
                          <td className="px-3 py-1.5">{row.model ?? "—"}</td>
                          <td className="px-3 py-1.5 font-mono">{row.serialNumber ?? row.sn ?? row.serial ?? "—"}</td>
                          <td className="px-3 py-1.5 font-mono">{row.macAddress ?? row.mac ?? "—"}</td>
                          <td className="px-3 py-1.5">{row.siteName ?? row.site ?? "—"}</td>
                        </tr>
                      ))}
                      {csvPreview.length > 20 && (
                        <tr><td colSpan={5} className="px-3 py-1.5 text-muted-foreground text-center">... and {csvPreview.length - 20} more</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={!importClientId || csvPreview.length === 0 || batchImportMut.isPending}
            >
              {batchImportMut.isPending ? "Importing..." : `Import ${csvPreview.length} Device${csvPreview.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

const FWD_STATUS_CONFIG = {
  pending:    { label: "Pending",    color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",  icon: Clock },
  in_transit: { label: "In Transit", color: "bg-blue-500/15 text-blue-300 border-blue-500/30",        icon: Truck },
  delivered:  { label: "Delivered",  color: "bg-green-500/15 text-green-300 border-green-500/30",     icon: CheckCircle2 },
} as const;

export function DeviceDetail() {
  const [, params] = useRoute("/devices/:id");
  const id = parseInt(params?.id ?? "0");
  const [showEdit, setShowEdit] = useState(false);
  const [showFwdEdit, setShowFwdEdit] = useState(false);
  const [fwdAddress, setFwdAddress] = useState("");
  const [fwdContact, setFwdContact] = useState("");
  const [fwdNotes, setFwdNotes] = useState("");
  const [fwdStatus, setFwdStatus] = useState<"pending"|"in_transit"|"delivered">("pending");
  const [showNotify, setShowNotify] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const utils = trpc.useUtils();

  const { data: device, isLoading } = trpc.devices.get.useQuery({ id });
  const updateMutation = trpc.devices.update.useMutation({
    onMutate: async (vars) => {
      await utils.devices.get.cancel({ id });
      const prev = utils.devices.get.getData({ id });
      if (prev && vars.stagingStatus) {
        utils.devices.get.setData({ id }, { ...prev, stagingStatus: vars.stagingStatus });
      }
      return { prev };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) utils.devices.get.setData({ id }, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => { utils.devices.get.invalidate({ id }); },
    onSuccess: () => toast.success("Status updated"),
  });
  const notifyMutation = trpc.stagingNotify.notifyDevice.useMutation({
    onSuccess: () => {
      toast.success("Customer notified — device marked Ready to Ship");
      utils.devices.get.invalidate({ id });
      setShowNotify(false);
      setNotifyMessage("");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateForwarding = trpc.forwarding.updateDevice.useMutation({
    onSuccess: () => { toast.success("Forwarding info saved"); utils.devices.get.invalidate({ id }); setShowFwdEdit(false); },
    onError: (e) => toast.error(e.message),
  });
  const openFwdEdit = () => {
    setFwdAddress((device as any)?.forwardingAddress ?? "");
    setFwdContact((device as any)?.forwardingContact ?? "");
    setFwdNotes((device as any)?.forwardingNotes ?? "");
    setFwdStatus(((device as any)?.forwardingStatus ?? "pending") as any);
    setShowFwdEdit(true);
  };

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
            {isStaff && device.stagingStatus !== "ready_to_ship" && device.stagingStatus !== "shipped" && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5" onClick={() => setShowNotify(true)}>
                <PackageCheck className="w-4 h-4" /> Mark Ready to Ship
              </Button>
            )}
            {isStaff && device.stagingStatus === "ready_to_ship" && (
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 bg-emerald-500/10 gap-1 px-2 py-1">
                <PackageCheck className="w-3.5 h-3.5" /> Ready to Ship
              </Badge>
            )}
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
              {(() => {
                const fwdSt = ((device as any)?.forwardingStatus ?? "pending") as keyof typeof FWD_STATUS_CONFIG;
                const cfg = FWD_STATUS_CONFIG[fwdSt];
                const Icon = cfg.icon;
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs gap-1 ${cfg.color}`}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        {(device as any)?.forwardingAddress
                          ? <p className="text-foreground whitespace-pre-line">{(device as any).forwardingAddress}</p>
                          : <p className="text-muted-foreground italic text-xs">No forwarding address set</p>}
                        {(device as any)?.forwardingContact && <p className="text-muted-foreground text-xs mt-0.5">{(device as any).forwardingContact}</p>}
                        {(device as any)?.forwardingNotes && <p className="text-muted-foreground text-xs mt-1">{(device as any).forwardingNotes}</p>}
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/50">
            <CardHeader><CardTitle className="text-sm">Photos</CardTitle></CardHeader>
            <CardContent>
              <PhotoGallery entityType="device" entityId={id} clientId={device.clientId} showUpload={isStaff} />
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
            <Button onClick={() => updateForwarding.mutate({ deviceId: id, forwardingAddress: fwdAddress || null, forwardingContact: fwdContact || null, forwardingNotes: fwdNotes || null, forwardingStatus: fwdStatus })} disabled={updateForwarding.isPending}>
              {updateForwarding.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Device</DialogTitle></DialogHeader>
          <DeviceForm onClose={() => setShowEdit(false)} deviceId={id} />
        </DialogContent>
      </Dialog>

      {/* Ready to Ship Notify Dialog */}
      <Dialog open={showNotify} onOpenChange={setShowNotify}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
              Mark Ready to Ship
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-sm text-emerald-300 font-medium">{device.deviceCode}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{device.brand} {device.model} {device.serialNumber ? `— S/N: ${device.serialNumber}` : ""}</p>
            </div>
            <p className="text-sm text-muted-foreground">This will update the device status to <strong className="text-foreground">Ready to Ship</strong> and send an email notification to all users in this client account.</p>
            <div>
              <Label className="text-xs">Optional message to customer</Label>
              <Textarea
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                rows={3}
                className="mt-1 resize-none"
                placeholder="e.g. Your device has been fully staged and configured. Please confirm the shipping address in your portal."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotify(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
              onClick={() => notifyMutation.mutate({ deviceId: id, message: notifyMessage || undefined })}
              disabled={notifyMutation.isPending}
            >
              <PackageCheck className="w-4 h-4" />
              {notifyMutation.isPending ? "Sending…" : "Notify Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
