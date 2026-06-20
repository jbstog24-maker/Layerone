import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  Truck, Server, Archive, Ship, FileText,
  Package, Warehouse, Box, ArrowRight, Loader2
} from "lucide-react";
import { useLocation } from "wouter";

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; href?: string;
}) {
  const [, setLocation] = useLocation();
  return (
    <Card
      className="bg-card/60 border-border/50 card-glow hover:border-primary/30 transition-all group cursor-pointer"
      onClick={() => href && setLocation(href)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          {href && <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function UsageMeter({ label, used, max, unit = "" }: { label: string; used: number; max?: number | null; unit?: string }) {
  const pct = max ? Math.min((used / max) * 100, 100) : 0;
  const color = pct > 90 ? "text-red-400" : pct > 70 ? "text-yellow-400" : "text-green-400";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={color}>
          {used}{unit} {max ? `/ ${max}${unit}` : "/ ∞"}
        </span>
      </div>
      {max ? <Progress value={pct} className="h-1.5" /> : <div className="h-1.5 rounded-full bg-muted/30" />}
    </div>
  );
}

function AdminDashboard() {
  const { data: stats } = trpc.dashboard.adminStats.useQuery();
  const { data: recentActivity } = trpc.activity.list.useQuery({ limit: 8 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Package} label="Active Clients" value={stats?.clients ?? 0} color="bg-indigo-500/10 text-indigo-400" href="/clients" />
        <StatCard icon={Server} label="Total Devices" value={stats?.devices ?? 0} sub={`${stats?.inProgressTasks ?? 0} in staging`} color="bg-violet-500/10 text-violet-400" href="/devices" />
        <StatCard icon={Archive} label="Staging Tasks" value={(stats?.pendingTasks ?? 0) + (stats?.inProgressTasks ?? 0)} sub="active" color="bg-yellow-500/10 text-yellow-400" href="/staging" />
        <StatCard icon={Ship} label="Pending Shipments" value={stats?.pendingShipments ?? 0} color="bg-orange-500/10 text-orange-400" href="/shipments" />
        <StatCard icon={Warehouse} label="Pallets" value={stats?.pallets ?? 0} color="bg-green-500/10 text-green-400" href="/pallets" />
        <StatCard icon={Box} label="Boxes" value={stats?.boxes ?? 0} color="bg-teal-500/10 text-teal-400" href="/boxes" />
        <StatCard icon={FileText} label="Draft Invoices" value={stats?.draftInvoices ?? 0} color="bg-pink-500/10 text-pink-400" href="/invoices" />
        <StatCard icon={Truck} label="Deliveries" value={stats?.deliveries ?? 0} sub="tracked" color="bg-blue-500/10 text-blue-400" href="/deliveries" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
          <CardContent className="p-0">
            {!recentActivity || recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4 pb-4">No activity yet.</p>
            ) : recentActivity.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-2.5 border-b border-border/50 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Task Pipeline</CardTitle></CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="space-y-3">
              {[
                { label: "Pending Tasks", value: stats?.pendingTasks ?? 0, color: "bg-yellow-500" },
                { label: "In Progress", value: stats?.inProgressTasks ?? 0, color: "bg-blue-500" },
                { label: "Pending Shipments", value: stats?.pendingShipments ?? 0, color: "bg-violet-500" },
                { label: "Draft Invoices", value: stats?.draftInvoices ?? 0, color: "bg-pink-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-muted-foreground flex-1">{item.label}</span>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CustomerDashboard() {
  const { data: usage } = trpc.dashboard.clientUsage.useQuery({});
  const { data: recentActivity } = trpc.activity.list.useQuery({ limit: 5 });

  const stats = usage?.usage;
  const pkg = usage?.pkg;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Truck} label="Deliveries" value={stats?.deliveries ?? 0} color="bg-blue-500/10 text-blue-400" href="/deliveries" />
        <StatCard icon={Server} label="My Devices" value={stats?.devices ?? 0} color="bg-violet-500/10 text-violet-400" href="/devices" />
        <StatCard icon={Archive} label="Staging Tasks" value={stats?.stagingTasks ?? 0} color="bg-yellow-500/10 text-yellow-400" href="/staging" />
        <StatCard icon={Ship} label="Shipments" value={stats?.shipments ?? 0} color="bg-orange-500/10 text-orange-400" href="/shipments" />
      </div>

      {pkg && (
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Package Usage</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{pkg.name}</span>
                <StatusBadge status={pkg.tier} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <UsageMeter label="Devices" used={stats?.devices ?? 0} max={pkg.maxDevices} />
              <UsageMeter label="Boxes" used={stats?.boxes ?? 0} max={pkg.maxBoxes} />
              <UsageMeter label="Pallets" used={stats?.pallets ?? 0} max={pkg.maxPallets} />
              <UsageMeter label="Outbound Shipments" used={stats?.shipments ?? 0} max={pkg.maxOutboundShipments} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/60 border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!recentActivity || recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 pb-4">No activity yet.</p>
          ) : recentActivity.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-2.5 border-b border-border/50 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{log.action}</p>
                <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const role = (user as any)?.role ?? "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Server className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">StagingOps Portal</h1>
          <p className="text-muted-foreground max-w-sm">
            Network staging, receiving, inventory, and logistics — all in one place.
          </p>
        </div>
        <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
          Sign In to Continue
        </Button>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {role === "admin" || role === "staff"
            ? "Here's an overview of all operations."
            : "Here's a summary of your account activity."}
        </p>
      </div>
      {role === "admin" || role === "staff" ? <AdminDashboard /> : <CustomerDashboard />}
    </DashboardLayout>
  );
}
