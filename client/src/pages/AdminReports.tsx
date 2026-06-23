import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, Server, Ship, Building2, FileText, BarChart3, AlertTriangle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportCard({
  icon: Icon,
  title,
  description,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card/60 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function AdminReports() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "staff";

  const [deviceClientId, setDeviceClientId] = useState("all");
  const [shipmentClientId, setShipmentClientId] = useState("all");

  const { data: clients } = trpc.clients.list.useQuery({}, { enabled: isAdmin });
  const { data: stats } = trpc.dashboard.adminStats.useQuery(undefined, { enabled: isAdmin });

  // Fetch data for exports
  const { data: allDevices, isFetching: devFetching } = trpc.devices.list.useQuery(
    { clientId: deviceClientId !== "all" ? parseInt(deviceClientId) : undefined },
    { enabled: isAdmin }
  );
  const { data: allShipments, isFetching: shipFetching } = trpc.shipments.list.useQuery(
    { clientId: shipmentClientId !== "all" ? parseInt(shipmentClientId) : undefined },
    { enabled: isAdmin }
  );
  const { data: allClients, isFetching: clientFetching } = trpc.clients.list.useQuery({}, { enabled: isAdmin });

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
          <AlertTriangle className="w-10 h-10" />
          <p>Access restricted to admin and staff.</p>
          <Button variant="outline" onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleDeviceExport = () => {
    if (!allDevices?.length) { toast.error("No devices to export"); return; }
    const headers = ["Device Code", "Client ID", "Brand", "Model", "Type", "Serial Number", "MAC Address", "Asset Tag", "Staging Status", "Config Status", "Site", "Project", "Storage Location", "Created At"];
    const rows = allDevices.map(d => [
      d.deviceCode, String(d.clientId), d.brand ?? "", d.model ?? "", d.deviceType ?? "",
      d.serialNumber ?? "", d.macAddress ?? "", d.assetTag ?? "",
      d.stagingStatus, d.configStatus, d.siteName ?? "", d.projectName ?? "",
      d.storageLocation ?? "", new Date(d.createdAt).toLocaleDateString(),
    ]);
    const suffix = deviceClientId !== "all" ? `_client${deviceClientId}` : "_all";
    downloadCSV(`devices${suffix}_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
    toast.success(`Exported ${rows.length} devices`);
  };

  const handleShipmentExport = () => {
    if (!allShipments?.length) { toast.error("No shipments to export"); return; }
    const headers = ["Shipment Code", "Client ID", "Project", "Destination", "Carrier", "Tracking Number", "Status", "Date Packed", "Date Shipped", "Date Delivered"];
    const rows = allShipments.map((s: any) => [
      s.shipmentCode, String(s.clientId), s.projectName ?? "", s.destination ?? "",
      s.carrier ?? "", s.trackingNumber ?? "", s.status,
      s.datePacked ? new Date(s.datePacked).toLocaleDateString() : "",
      s.dateShipped ? new Date(s.dateShipped).toLocaleDateString() : "",
      s.dateDelivered ? new Date(s.dateDelivered).toLocaleDateString() : "",
    ]);
    const suffix = shipmentClientId !== "all" ? `_client${shipmentClientId}` : "_all";
    downloadCSV(`shipments${suffix}_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
    toast.success(`Exported ${rows.length} shipments`);
  };

  const handleClientExport = () => {
    if (!allClients?.length) { toast.error("No clients to export"); return; }
    const headers = ["ID", "Account Number", "Company", "Contact Name", "Contact Email", "Phone", "Status", "Payment Status", "Package ID", "Created At"];
    const rows = allClients.map(c => [
      String(c.id), c.accountNumber ?? "", c.companyName, c.contactName ?? "",
      c.contactEmail ?? "", c.contactPhone ?? "", c.status, c.paymentStatus,
      c.packageId ? String(c.packageId) : "", new Date(c.createdAt).toLocaleDateString(),
    ]);
    downloadCSV(`clients_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
    toast.success(`Exported ${rows.length} clients`);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports"
        subtitle="Export operational data as CSV for analysis and record-keeping"
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active Clients", value: stats?.clients ?? 0, color: "bg-indigo-500/10 text-indigo-400", icon: Building2 },
          { label: "Total Devices", value: stats?.devices ?? 0, color: "bg-violet-500/10 text-violet-400", icon: Server },
          { label: "Pending Shipments", value: stats?.pendingShipments ?? 0, color: "bg-orange-500/10 text-orange-400", icon: Ship },
          { label: "Draft Invoices", value: stats?.draftInvoices ?? 0, color: "bg-pink-500/10 text-pink-400", icon: FileText },
        ].map(item => (
          <Card key={item.label} className="bg-card/60 border-border/50">
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center mb-2`}>
                <item.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Device Export */}
        <ReportCard
          icon={Server}
          title="Device Inventory"
          description="Export all devices with staging status, serial numbers, and assignments."
          color="bg-violet-500/10 text-violet-400"
        >
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1.5 block">Filter by Client</Label>
              <Select value={deviceClientId} onValueChange={setDeviceClientId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{allDevices?.length ?? 0} devices</p>
            <Button size="sm" className="w-full gap-2" onClick={handleDeviceExport} disabled={devFetching}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </ReportCard>

        {/* Shipment Export */}
        <ReportCard
          icon={Ship}
          title="Outbound Shipments"
          description="Export shipment records with tracking numbers and delivery dates."
          color="bg-orange-500/10 text-orange-400"
        >
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1.5 block">Filter by Client</Label>
              <Select value={shipmentClientId} onValueChange={setShipmentClientId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{allShipments?.length ?? 0} shipments</p>
            <Button size="sm" className="w-full gap-2" onClick={handleShipmentExport} disabled={shipFetching}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </ReportCard>

        {/* Client Export */}
        <ReportCard
          icon={Building2}
          title="Client Directory"
          description="Export all active client accounts with contact and billing info."
          color="bg-indigo-500/10 text-indigo-400"
        >
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{allClients?.length ?? 0} active clients</p>
            <Button size="sm" className="w-full gap-2 mt-6" onClick={handleClientExport} disabled={clientFetching}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </ReportCard>
      </div>

      {/* Alerts section */}
      {((stats?.pendingShipments ?? 0) > 5 || (stats?.pendingTasks ?? 0) > 10 || (stats?.draftInvoices ?? 0) > 3) && (
        <Card className="mt-4 bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" /> Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(stats?.pendingShipments ?? 0) > 5 && (
              <p className="text-sm text-amber-300/80">{stats?.pendingShipments} shipments are pending — review the shipments queue.</p>
            )}
            {(stats?.pendingTasks ?? 0) > 10 && (
              <p className="text-sm text-amber-300/80">{stats?.pendingTasks} staging tasks are pending — check the staging board.</p>
            )}
            {(stats?.draftInvoices ?? 0) > 3 && (
              <p className="text-sm text-amber-300/80">{stats?.draftInvoices} draft invoices need review before sending.</p>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
