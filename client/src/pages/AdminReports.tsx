import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Download, Server, Ship, Building2, FileText, BarChart3, AlertTriangle,
  TrendingUp, DollarSign, Filter,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, FunnelChart, Funnel, LabelList, Legend,
} from "recharts";

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const CHART_COLORS = {
  devices: "#6366f1",
  shipments: "#06b6d4",
  receivings: "#10b981",
  revenue: "#8b5cf6",
};

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/50 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-medium mb-1.5 text-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.dataKey}:</span>
          <span className="font-medium text-foreground">
            {p.dataKey === "revenue" ? `$${Number(p.value).toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AdminReports() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "staff";

  const [deviceClientId, setDeviceClientId] = useState("all");
  const [shipmentClientId, setShipmentClientId] = useState("all");
  const [throughputMonths, setThroughputMonths] = useState(12);
  const [revenueMonths, setRevenueMonths] = useState(12);

  const { data: clients } = trpc.clients.list.useQuery({}, { enabled: isAdmin });
  const { data: stats } = trpc.dashboard.adminStats.useQuery(undefined, { enabled: isAdmin });
  const { data: monthlyData, isLoading: monthlyLoading } = trpc.dashboard.monthlyStats.useQuery(
    { months: throughputMonths }, { enabled: isAdmin }
  );
  const { data: revenueData, isLoading: revenueLoading } = trpc.dashboard.revenueByClient.useQuery(
    { months: revenueMonths }, { enabled: isAdmin }
  );
  const { data: funnelData, isLoading: funnelLoading } = trpc.dashboard.pipelineFunnel.useQuery(
    undefined, { enabled: isAdmin }
  );

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
    const rows = allDevices.map(d => [d.deviceCode, String(d.clientId), d.brand ?? "", d.model ?? "", d.deviceType ?? "", d.serialNumber ?? "", d.macAddress ?? "", d.assetTag ?? "", d.stagingStatus, d.configStatus, d.siteName ?? "", d.projectName ?? "", d.storageLocation ?? "", new Date(d.createdAt).toLocaleDateString()]);
    downloadCSV(`devices_${deviceClientId !== "all" ? `client${deviceClientId}_` : ""}${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
    toast.success(`Exported ${rows.length} devices`);
  };

  const handleShipmentExport = () => {
    if (!allShipments?.length) { toast.error("No shipments to export"); return; }
    const headers = ["Shipment Code", "Client ID", "Project", "Destination", "Carrier", "Tracking Number", "Status", "Date Packed", "Date Shipped", "Date Delivered"];
    const rows = allShipments.map((s: any) => [s.shipmentCode, String(s.clientId), s.projectName ?? "", s.destination ?? "", s.carrier ?? "", s.trackingNumber ?? "", s.status, s.datePacked ? new Date(s.datePacked).toLocaleDateString() : "", s.dateShipped ? new Date(s.dateShipped).toLocaleDateString() : "", s.dateDelivered ? new Date(s.dateDelivered).toLocaleDateString() : ""]);
    downloadCSV(`shipments_${shipmentClientId !== "all" ? `client${shipmentClientId}_` : ""}${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
    toast.success(`Exported ${rows.length} shipments`);
  };

  const handleClientExport = () => {
    if (!allClients?.length) { toast.error("No clients to export"); return; }
    const headers = ["ID", "Account Number", "Company", "Contact Name", "Contact Email", "Phone", "Status", "Payment Status", "Package ID", "Created At"];
    const rows = allClients.map(c => [String(c.id), c.accountNumber ?? "", c.companyName, c.contactName ?? "", c.contactEmail ?? "", c.contactPhone ?? "", c.status, c.paymentStatus, c.packageId ? String(c.packageId) : "", new Date(c.createdAt).toLocaleDateString()]);
    downloadCSV(`clients_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
    toast.success(`Exported ${rows.length} clients`);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports"
        subtitle="Operational analytics, charts, and CSV exports"
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

      {/* ── Monthly Throughput Chart ── */}
      <Card className="bg-card/60 border-border/50 mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <SectionTitle icon={TrendingUp} title="Monthly Throughput" subtitle="Devices staged, shipments dispatched, and receivings per month" />
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <Select value={String(throughputMonths)} onValueChange={v => setThroughputMonths(Number(v))}>
                <SelectTrigger className="h-7 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                  <SelectItem value="24">Last 24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {monthlyLoading ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 8 }} />
                <Bar dataKey="devices" name="Devices" fill={CHART_COLORS.devices} radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="shipments" name="Shipments" fill={CHART_COLORS.shipments} radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="receivings" name="Receivings" fill={CHART_COLORS.receivings} radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* ── Revenue by Client Chart ── */}
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <SectionTitle icon={DollarSign} title="Revenue by Client" subtitle="Top 10 clients by invoiced amount" />
              <Select value={String(revenueMonths)} onValueChange={v => setRevenueMonths(Number(v))}>
                <SelectTrigger className="h-7 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div>
            ) : !revenueData?.length ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No invoice data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="companyName" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" radius={[0, 3, 3, 0]} maxBarSize={18}>
                    {revenueData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${260 + i * 12}, 70%, ${60 - i * 3}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Pipeline Funnel ── */}
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-3">
            <SectionTitle icon={BarChart3} title="Sales Pipeline Funnel" subtitle="Inquiries → Quoted → Paid → Active Clients" />
          </CardHeader>
          <CardContent>
            {funnelLoading ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div>
            ) : (
              <div className="space-y-2 py-2">
                {(funnelData ?? []).map((item, i) => {
                  const max = Math.max(...(funnelData ?? []).map(d => d.count), 1);
                  const pct = max > 0 ? (item.count / max) * 100 : 0;
                  return (
                    <div key={item.stage} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{item.stage}</span>
                        <span className="font-semibold tabular-nums">{item.count}</span>
                      </div>
                      <div className="h-7 rounded-md bg-muted/30 overflow-hidden">
                        <div
                          className="h-full rounded-md transition-all duration-700 flex items-center px-3"
                          style={{ width: `${Math.max(pct, 8)}%`, background: item.fill }}
                        >
                          {pct > 20 && <span className="text-white text-xs font-medium">{item.count}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── CSV Exports ── */}
      <Card className="bg-card/60 border-border/50 mb-4">
        <CardHeader className="pb-3">
          <SectionTitle icon={Download} title="CSV Exports" subtitle="Download operational data for offline analysis" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Device Export */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium">Device Inventory</span>
              </div>
              <p className="text-xs text-muted-foreground">Export all devices with staging status, serial numbers, and assignments.</p>
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

            {/* Shipment Export */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium">Outbound Shipments</span>
              </div>
              <p className="text-xs text-muted-foreground">Export shipment records with tracking numbers and delivery dates.</p>
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

            {/* Client Export */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium">Client Directory</span>
              </div>
              <p className="text-xs text-muted-foreground">Export all active client accounts with contact and billing info.</p>
              <div className="h-[60px]" />
              <p className="text-xs text-muted-foreground">{allClients?.length ?? 0} active clients</p>
              <Button size="sm" className="w-full gap-2" onClick={handleClientExport} disabled={clientFetching}>
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {((stats?.pendingShipments ?? 0) > 5 || (stats?.pendingTasks ?? 0) > 10 || (stats?.draftInvoices ?? 0) > 3) && (
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" /> Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(stats?.pendingShipments ?? 0) > 5 && <p className="text-sm text-amber-300/80">{stats?.pendingShipments} shipments are pending - review the shipments queue.</p>}
            {(stats?.pendingTasks ?? 0) > 10 && <p className="text-sm text-amber-300/80">{stats?.pendingTasks} staging tasks are pending - check the staging board.</p>}
            {(stats?.draftInvoices ?? 0) > 3 && <p className="text-sm text-amber-300/80">{stats?.draftInvoices} draft invoices need review before sending.</p>}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
