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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Ship, Plus, ChevronRight, Package, FileText, CheckCircle2, Circle, Truck, MapPin, Clock, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";
import ShipmentDocuments from "@/components/ShipmentDocuments";

// ─── Shipment Status Timeline ────────────────────────────────────────────────
const SHIPMENT_STEPS = [
  { key: "requested",     label: "Requested",      icon: Clock,          desc: "Shipment request submitted" },
  { key: "packing",       label: "Packing",         icon: Package,        desc: "Items being packed at warehouse" },
  { key: "ready_to_ship", label: "Ready to Ship",   icon: CheckCircle2,   desc: "Packed and awaiting carrier pickup" },
  { key: "shipped",       label: "Shipped",         icon: Truck,          desc: "In transit with carrier" },
  { key: "delivered",     label: "Delivered",       icon: MapPin,         desc: "Delivered to destination" },
];

function ShipmentTimeline({ shipment }: { shipment: any }) {
  const statusOrder = ["requested", "packing", "ready_to_ship", "shipped", "delivered"];
  const currentIdx = statusOrder.indexOf(shipment.status);
  const isException = shipment.status === "exception";

  return (
    <div className="space-y-0">
      {isException && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>There is an exception with this shipment. Please contact support.</span>
        </div>
      )}
      {SHIPMENT_STEPS.map((step, idx) => {
        const isDone = currentIdx > idx;
        const isCurrent = currentIdx === idx;
        const isPending = currentIdx < idx;
        const dateMap: Record<string, string | null | undefined> = {
          requested: shipment.createdAt,
          packing: shipment.datePacked,
          ready_to_ship: shipment.datePacked,
          shipped: shipment.dateShipped,
          delivered: shipment.dateDelivered,
        };
        const date = dateMap[step.key];
        return (
          <div key={step.key} className="flex gap-3">
            {/* Connector line + icon */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                isDone ? "bg-green-500/20 border-green-500 text-green-400" :
                isCurrent ? "bg-blue-500/20 border-blue-400 text-blue-400 ring-2 ring-blue-400/30" :
                "bg-muted/30 border-border/50 text-muted-foreground/40"
              }`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
              </div>
              {idx < SHIPMENT_STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[24px] my-1 ${
                  isDone ? "bg-green-500/40" : "bg-border/30"
                }`} />
              )}
            </div>
            {/* Content */}
            <div className="pb-4 pt-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${
                  isDone ? "text-green-400" : isCurrent ? "text-blue-300" : "text-muted-foreground/50"
                }`}>{step.label}</span>
                {isCurrent && !isException && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full px-2 py-0.5 font-medium">Current</span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${
                isPending ? "text-muted-foreground/30" : "text-muted-foreground"
              }`}>{step.desc}</p>
              {date && (
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">{new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
              )}
              {/* Show tracking info at shipped step */}
              {step.key === "shipped" && isCurrent && shipment.carrier && (
                <div className="mt-2 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                  <span className="font-medium">{shipment.carrier}</span>
                  {shipment.trackingNumber && (
                    <span className="ml-2 font-mono"><TrackingLink trackingNumber={shipment.trackingNumber} /></span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

// ─── Carrier tracking URLs ───────────────────────────────────────────────────
/** Build a carrier tracking URL from a tracking number, detected by format. */
function getTrackingUrl(trackingNumber: string): string {
  const num = trackingNumber.trim();
  const encoded = encodeURIComponent(num);
  if (/^1Z/i.test(num)) {
    return `https://www.ups.com/track?tracknum=${encoded}`;
  }
  if (/^\d{20,22}$/.test(num) || num.startsWith("94")) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
  }
  if (/^\d{12,15}$/.test(num)) {
    return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
  }
  return `https://www.google.com/search?q=${encoded}`;
}

function TrackingLink({ trackingNumber, className }: { trackingNumber: string; className?: string }) {
  return (
    <a
      href={getTrackingUrl(trackingNumber)}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-blue-400 hover:text-blue-300 hover:underline underline-offset-2 ${className ?? ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {trackingNumber}
    </a>
  );
}

const PAGE_SIZE = 25;

export function ShipmentsList() {
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const { data: shipments, isLoading } = trpc.shipments.list.useQuery({});

  const totalPages = Math.max(1, Math.ceil((shipments?.length ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedShipments = shipments?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

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
              ) : pagedShipments?.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/shipments/${s.id}`)}>
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm font-medium text-violet-400">{s.shipmentCode}</p>
                    <p className="text-xs text-muted-foreground">{s.projectName ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.destination ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.carrier ?? "-"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{s.trackingNumber ?? "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(shipments?.length ?? 0) > PAGE_SIZE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}-{(currentPage - 1) * PAGE_SIZE + (pagedShipments?.length ?? 0)} of {shipments?.length} shipments
            </p>
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); goToPage(currentPage - 1); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-40" : undefined}
                  />
                </PaginationItem>
                {pageNumbers.map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === p}
                      onClick={(e) => { e.preventDefault(); goToPage(p); }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); goToPage(currentPage + 1); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-40" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
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
              <div><p className="text-muted-foreground text-xs mb-1">Destination</p><p>{shipment.destination ?? "-"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Carrier</p><p>{shipment.carrier ?? "-"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Tracking</p>{shipment.trackingNumber ? <TrackingLink trackingNumber={shipment.trackingNumber} className="font-mono text-xs" /> : <p className="text-xs">-</p>}</div>
              <div><p className="text-muted-foreground text-xs mb-1">Date Packed</p><p>{shipment.datePacked ? new Date(shipment.datePacked).toLocaleDateString() : "-"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Date Shipped</p><p>{shipment.dateShipped ? new Date(shipment.dateShipped).toLocaleDateString() : "-"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Date Delivered</p><p>{shipment.dateDelivered ? new Date(shipment.dateDelivered).toLocaleDateString() : "-"}</p></div>
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

        <div className="space-y-4">
          <Card className="bg-card/60 border-border/50">
            <CardHeader><CardTitle className="text-sm">Shipment Progress</CardTitle></CardHeader>
            <CardContent className="pt-2">
              <ShipmentTimeline shipment={shipment} />
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/50">
            <CardHeader><CardTitle className="text-sm">Photos</CardTitle></CardHeader>
            <CardContent>
              <PhotoGallery entityType="shipment" entityId={id} clientId={shipment.clientId} showUpload={isStaff} />
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ShipmentDocuments shipmentId={id} clientId={shipment.clientId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
