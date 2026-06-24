import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Box,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  PackageCheck,
  Pencil,
  Search,
  Server,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type ForwardingStatus = "pending" | "in_transit" | "delivered";

interface ForwardingDialogState {
  type: "device" | "box" | "pallet";
  id: number;
  code: string;
  label: string;
  currentAddress: string | null;
  currentContact: string | null;
  currentNotes: string | null;
  currentStatus: ForwardingStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ForwardingStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",  icon: Clock },
  in_transit: { label: "In Transit", color: "bg-blue-500/15 text-blue-300 border-blue-500/30",        icon: Truck },
  delivered:  { label: "Delivered",  color: "bg-green-500/15 text-green-300 border-green-500/30",     icon: CheckCircle2 },
};

function ForwardingBadge({ status }: { status: ForwardingStatus | null | undefined }) {
  const s = status ?? "pending";
  const cfg = STATUS_CONFIG[s];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`text-xs gap-1 ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
}

function ForwardingAddressLine({ address }: { address: string | null | undefined }) {
  if (!address) return <span className="text-slate-500 italic text-xs">No forwarding address set</span>;
  return <span className="text-slate-300 text-xs">{address}</span>;
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────
function ForwardingDialog({
  state,
  onClose,
  onSaved,
}: {
  state: ForwardingDialogState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [address, setAddress] = useState(state.currentAddress ?? "");
  const [contact, setContact] = useState(state.currentContact ?? "");
  const [notes, setNotes] = useState(state.currentNotes ?? "");
  const [fwdStatus, setFwdStatus] = useState<ForwardingStatus>(state.currentStatus);

  const utils = trpc.useUtils();

  const updateDevice = trpc.forwarding.updateDevice.useMutation({
    onSuccess: () => { utils.forwarding.myItems.invalidate(); onSaved(); toast.success("Forwarding info saved"); },
    onError: (e) => toast.error(e.message),
  });
  const updateBox = trpc.forwarding.updateBox.useMutation({
    onSuccess: () => { utils.forwarding.myItems.invalidate(); onSaved(); toast.success("Forwarding info saved"); },
    onError: (e) => toast.error(e.message),
  });
  const updatePallet = trpc.forwarding.updatePallet.useMutation({
    onSuccess: () => { utils.forwarding.myItems.invalidate(); onSaved(); toast.success("Forwarding info saved"); },
    onError: (e) => toast.error(e.message),
  });

  const isPending = updateDevice.isPending || updateBox.isPending || updatePallet.isPending;

  const handleSave = () => {
    const payload = {
      forwardingAddress: address.trim() || null,
      forwardingContact: contact.trim() || null,
      forwardingNotes: notes.trim() || null,
      forwardingStatus: fwdStatus,
    };
    if (state.type === "device") updateDevice.mutate({ deviceId: state.id, ...payload });
    else if (state.type === "box") updateBox.mutate({ boxId: state.id, ...payload });
    else updatePallet.mutate({ palletId: state.id, ...payload });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-[#0a1628] border-[#1e3a5f] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <MapPin className="w-5 h-5 text-blue-400" />
            Set Forwarding Location
          </DialogTitle>
          <p className="text-sm text-slate-400 mt-1">
            {state.label} — <span className="font-mono text-blue-300">{state.code}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Forwarding Status */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Forwarding Status</Label>
            <Select value={fwdStatus} onValueChange={(v) => setFwdStatus(v as ForwardingStatus)}>
              <SelectTrigger className="bg-[#0d1f35] border-[#1e3a5f] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1f35] border-[#1e3a5f]">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Forwarding Address */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Forwarding Address *</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Suite 400&#10;Austin, TX 78701"
              rows={3}
              className="bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Contact at destination */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Contact at Destination</Label>
            <Input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="John Smith — (512) 555-0100"
              className="bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery instructions, dock hours, special requirements…"
              rows={2}
              className="bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#1e3a5f] text-slate-300">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? "Saving…" : "Save Forwarding Info"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────
function ItemCard({
  icon: Icon,
  code,
  label,
  sublabel,
  stagingStatus,
  forwardingAddress,
  forwardingContact,
  forwardingStatus,
  onEdit,
}: {
  icon: React.ElementType;
  code: string;
  label: string;
  sublabel?: string;
  stagingStatus?: string;
  forwardingAddress: string | null | undefined;
  forwardingContact: string | null | undefined;
  forwardingStatus: ForwardingStatus | null | undefined;
  onEdit: () => void;
}) {
  return (
    <Card className="bg-[#0d1f35] border-[#1e3a5f] hover:border-blue-500/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-blue-300">{code}</span>
              {stagingStatus && (
                <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-300 border-slate-500/30">
                  {stagingStatus.replace(/_/g, " ")}
                </Badge>
              )}
              <ForwardingBadge status={forwardingStatus} />
            </div>
            {label && <p className="text-sm text-white truncate">{label}</p>}
            {sublabel && <p className="text-xs text-slate-400 truncate">{sublabel}</p>}
            <div className="mt-2 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <ForwardingAddressLine address={forwardingAddress} />
                {forwardingContact && (
                  <p className="text-slate-400 mt-0.5">{forwardingContact}</p>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="border-[#1e3a5f] text-slate-300 hover:text-white gap-1 h-8 px-3 shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyDevices() {
  const { data, isLoading } = trpc.forwarding.myItems.useQuery();
  const { user } = useAuth();
  const clientId = (user as any)?.clientId as number | undefined;
  const [editState, setEditState] = useState<ForwardingDialogState | null>(null);
  const [deviceSearch, setDeviceSearch] = useState("");

  // Staging notifications (Ready to Ship)
  const { data: notifications, isLoading: notifLoading } = trpc.stagingNotify.listForClient.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId }
  );
  const acknowledgeMutation = trpc.stagingNotify.acknowledge.useMutation({
    onSuccess: () => utils.stagingNotify.listForClient.invalidate({ clientId: clientId! }),
    onError: (e) => toast.error(e.message),
  });
  const utils = trpc.useUtils();

  const unreadNotifs = (notifications ?? []).filter((n) => !n.acknowledgedAt);

  const allDevices = data?.devices ?? [];
  const boxes = data?.boxes ?? [];
  const pallets = data?.pallets ?? [];

  const devices = deviceSearch.trim()
    ? allDevices.filter((d) => {
        const q = deviceSearch.toLowerCase();
        return (
          d.deviceCode.toLowerCase().includes(q) ||
          (d.brand ?? "").toLowerCase().includes(q) ||
          (d.model ?? "").toLowerCase().includes(q) ||
          (d.serialNumber ?? "").toLowerCase().includes(q) ||
          (d.deviceType ?? "").toLowerCase().includes(q) ||
          (d.siteName ?? "").toLowerCase().includes(q)
        );
      })
    : allDevices;

  const totalItems = allDevices.length + boxes.length + pallets.length;
  const deliveredCount = [
    ...allDevices.map((d) => d.forwardingStatus),
    ...boxes.map((b) => b.forwardingStatus),
    ...pallets.map((p) => p.forwardingStatus),
  ].filter((s) => s === "delivered").length;
  const inTransitCount = [
    ...allDevices.map((d) => d.forwardingStatus),
    ...boxes.map((b) => b.forwardingStatus),
    ...pallets.map((p) => p.forwardingStatus),
  ].filter((s) => s === "in_transit").length;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">

        {/* Ready to Ship Notification Banners */}
        {!notifLoading && unreadNotifs.length > 0 && (
          <div className="space-y-2">
            {unreadNotifs.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"
              >
                <PackageCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-300">
                    Device <span className="font-mono">{n.deviceCode}</span> is Ready to Ship!
                  </p>
                  {n.message && (
                    <p className="text-xs text-slate-400 mt-0.5 italic">"{n.message}" — {n.notifiedByName}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 h-7"
                  onClick={() => acknowledgeMutation.mutate({ notificationId: n.id })}
                  disabled={acknowledgeMutation.isPending}
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MapPin className="w-7 h-7 text-blue-400" />
            My Devices & Forwarding
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track where your staged devices, boxes, and pallets are being forwarded to.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-[#0d1f35] border-[#1e3a5f]">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-white">{totalItems}</p>
              <p className="text-xs text-slate-400">Total Items</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0d1f35] border-[#1e3a5f]">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-yellow-300">{totalItems - inTransitCount - deliveredCount}</p>
              <p className="text-xs text-slate-400">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0d1f35] border-[#1e3a5f]">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-blue-300">{inTransitCount}</p>
              <p className="text-xs text-slate-400">In Transit</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0d1f35] border-[#1e3a5f]">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-green-300">{deliveredCount}</p>
              <p className="text-xs text-slate-400">Delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="devices">
          <TabsList className="bg-[#0d1f35] border border-[#1e3a5f]">
            <TabsTrigger value="devices" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Server className="w-3.5 h-3.5" />
              Devices <span className="text-xs opacity-70">({deviceSearch ? `${devices.length}/${allDevices.length}` : allDevices.length})</span>
            </TabsTrigger>
            <TabsTrigger value="boxes" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Box className="w-3.5 h-3.5" />
              Boxes <span className="text-xs opacity-70">({boxes.length})</span>
            </TabsTrigger>
            <TabsTrigger value="pallets" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Layers className="w-3.5 h-3.5" />
              Pallets <span className="text-xs opacity-70">({pallets.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Devices Tab */}
          <TabsContent value="devices" className="mt-4 space-y-3">
            {/* Device Search */}
            {allDevices.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by code, brand, model, serial..."
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  className="pl-9 bg-[#0d1f35] border-[#1e3a5f] text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
            )}
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl bg-[#0d1f35]" />)
            ) : devices.length === 0 ? (
              <Card className="bg-[#0d1f35] border-[#1e3a5f]">
                <CardContent className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <Server className="w-10 h-10 opacity-30" />
                  <p className="font-medium">No staged devices yet</p>
                  <p className="text-sm text-center">Devices will appear here once they have been staged by the Layer One team.</p>
                </CardContent>
              </Card>
            ) : (
              devices.map((d) => (
                <ItemCard
                  key={d.id}
                  icon={Server}
                  code={d.deviceCode}
                  label={[d.brand, d.model].filter(Boolean).join(" ") || d.deviceType || "Device"}
                  sublabel={d.serialNumber ? `S/N: ${d.serialNumber}` : d.siteName ?? undefined}
                  stagingStatus={d.stagingStatus}
                  forwardingAddress={d.forwardingAddress}
                  forwardingContact={d.forwardingContact}
                  forwardingStatus={d.forwardingStatus as ForwardingStatus | null}
                  onEdit={() => setEditState({
                    type: "device",
                    id: d.id,
                    code: d.deviceCode,
                    label: [d.brand, d.model].filter(Boolean).join(" ") || "Device",
                    currentAddress: d.forwardingAddress ?? null,
                    currentContact: d.forwardingContact ?? null,
                    currentNotes: d.forwardingNotes ?? null,
                    currentStatus: (d.forwardingStatus as ForwardingStatus) ?? "pending",
                  })}
                />
              ))
            )}
          </TabsContent>

          {/* Boxes Tab */}
          <TabsContent value="boxes" className="mt-4 space-y-2">
            {isLoading ? (
              [...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl bg-[#0d1f35]" />)
            ) : boxes.length === 0 ? (
              <Card className="bg-[#0d1f35] border-[#1e3a5f]">
                <CardContent className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <Box className="w-10 h-10 opacity-30" />
                  <p className="font-medium">No staged boxes yet</p>
                  <p className="text-sm text-center">Boxes will appear here once they have been staged.</p>
                </CardContent>
              </Card>
            ) : (
              boxes.map((b) => (
                <ItemCard
                  key={b.id}
                  icon={Box}
                  code={b.boxCode}
                  label={b.projectName ?? "Box"}
                  sublabel={b.contents ? `Contents: ${b.contents.slice(0, 60)}` : undefined}
                  stagingStatus={b.status}
                  forwardingAddress={b.forwardingAddress}
                  forwardingContact={b.forwardingContact}
                  forwardingStatus={b.forwardingStatus as ForwardingStatus | null}
                  onEdit={() => setEditState({
                    type: "box",
                    id: b.id,
                    code: b.boxCode,
                    label: b.projectName ?? "Box",
                    currentAddress: b.forwardingAddress ?? null,
                    currentContact: b.forwardingContact ?? null,
                    currentNotes: b.forwardingNotes ?? null,
                    currentStatus: (b.forwardingStatus as ForwardingStatus) ?? "pending",
                  })}
                />
              ))
            )}
          </TabsContent>

          {/* Pallets Tab */}
          <TabsContent value="pallets" className="mt-4 space-y-2">
            {isLoading ? (
              [...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl bg-[#0d1f35]" />)
            ) : pallets.length === 0 ? (
              <Card className="bg-[#0d1f35] border-[#1e3a5f]">
                <CardContent className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <Layers className="w-10 h-10 opacity-30" />
                  <p className="font-medium">No staged pallets yet</p>
                  <p className="text-sm text-center">Pallets will appear here once they have been staged.</p>
                </CardContent>
              </Card>
            ) : (
              pallets.map((p) => (
                <ItemCard
                  key={p.id}
                  icon={Layers}
                  code={p.palletCode}
                  label={p.projectName ?? "Pallet"}
                  sublabel={p.storageLocation ? `Storage: ${p.storageLocation}` : undefined}
                  stagingStatus={p.status}
                  forwardingAddress={p.forwardingAddress}
                  forwardingContact={p.forwardingContact}
                  forwardingStatus={p.forwardingStatus as ForwardingStatus | null}
                  onEdit={() => setEditState({
                    type: "pallet",
                    id: p.id,
                    code: p.palletCode,
                    label: p.projectName ?? "Pallet",
                    currentAddress: p.forwardingAddress ?? null,
                    currentContact: p.forwardingContact ?? null,
                    currentNotes: p.forwardingNotes ?? null,
                    currentStatus: (p.forwardingStatus as ForwardingStatus) ?? "pending",
                  })}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Help card */}
        <Card className="bg-[#0d1f35] border-[#1e3a5f]">
          <CardContent className="p-4 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-400">
              <p className="text-white font-medium mb-1">How forwarding works</p>
              <p>
                Once your devices or packages have been staged by the Layer One team, you can set the
                forwarding destination address here. Update the status to <strong className="text-blue-300">In Transit</strong> when
                items are picked up, and <strong className="text-green-300">Delivered</strong> once they arrive at the destination.
                The Layer One team can also see and update these details.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Edit dialog */}
      {editState && (
        <ForwardingDialog
          state={editState}
          onClose={() => setEditState(null)}
          onSaved={() => setEditState(null)}
        />
      )}
    </DashboardLayout>
  );
}
