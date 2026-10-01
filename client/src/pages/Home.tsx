import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import InfoTip from "@/components/InfoTip";
import {
  Truck, Server, Archive, Ship, FileText,
  Package, Warehouse, Box, ArrowRight, Loader2,
  AlertTriangle, Clock, ChevronRight, Hash,
  MessageSquare, Inbox, PenLine, User, ClipboardList,
  CheckCircle2, BellRing
} from "lucide-react";
import { useEffect } from "react";
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

function OverdueFollowUpWidget() {
  const { data: overdueLeads, isLoading } = trpc.leads.listOverdue.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) return null;
  if (!overdueLeads || overdueLeads.length === 0) return null;

  const top3 = overdueLeads.slice(0, 3);

  return (
    <Card className="bg-amber-500/5 border-amber-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Overdue Follow-Ups
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-1.5 py-0 h-5">
              {overdueLeads.length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-amber-400 hover:text-amber-300 h-7 px-2"
            onClick={() => setLocation("/leads")}
          >
            View all <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {top3.map((lead: any) => {
          const daysOverdue = lead.nextFollowUpAt
            ? Math.floor((Date.now() - new Date(lead.nextFollowUpAt).getTime()) / 86_400_000)
            : 0;
          return (
            <div
              key={lead.id}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-all group"
              onClick={() => setLocation(`/leads/${lead.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-amber-300 transition-colors">
                  {lead.companyName}
                </p>
                {lead.contactName && (
                  <p className="text-xs text-muted-foreground truncate">{lead.contactName}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <Clock className="w-3 h-3" />
                  <span>{daysOverdue === 0 ? "Today" : `${daysOverdue}d overdue`}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
        {overdueLeads.length > 3 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{overdueLeads.length - 3} more overdue leads
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ActionCenter() {
  const { data: alerts = [], isLoading } = trpc.alerts.list.useQuery(
    undefined,
    { refetchInterval: 30_000 }
  );
  const [, setLocation] = useLocation();

  const kindIcon: Record<string, React.ElementType> = {
    message: MessageSquare,
    inquiry: Inbox,
    quote: FileText,
    msa: PenLine,
    user: User,
    onboarding: ClipboardList,
  };
  const severityStyle: Record<string, string> = {
    urgent: "bg-red-500/10 text-red-400 border-red-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };

  if (isLoading) return null;

  return (
    <Card className="bg-card/60 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BellRing className="w-4 h-4 text-primary" />
            Needs Attention
            {alerts.length > 0 && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-1.5 py-0 h-5">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          {alerts.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Tap an item to jump to it
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            All caught up - nothing needs your attention.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 8).map(alert => {
              const Icon = kindIcon[alert.kind] ?? Inbox;
              return (
                <div
                  key={alert.id}
                  onClick={() => setLocation(alert.href)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all hover:bg-white/5 ${severityStyle[alert.severity] ?? severityStyle.info}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {alert.title}
                    </p>
                    {alert.detail && (
                      <p className="text-xs text-muted-foreground truncate">
                        {alert.detail}
                      </p>
                    )}
                  </div>
                  <InfoTip title="What to do">{alert.actionHint}</InfoTip>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              );
            })}
            {alerts.length > 8 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{alerts.length - 8} more items
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
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

      {/* Overdue Follow-Up Widget */}
      <OverdueFollowUpWidget />

      {/* Action Center: pending alerts routed to the right customer/item */}
      <ActionCenter />

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
  const { data: stagingProgress } = trpc.staging.customerProgress.useQuery();

  const stats = usage?.usage;
  const pkg = usage?.pkg;
  const client = usage?.client;

  return (
    <div className="space-y-6">
      {/* Account Number Banner */}
      {client?.accountNumber && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 w-fit">
          <Hash className="w-3.5 h-3.5 text-primary/70" />
          <span className="text-xs text-muted-foreground">Account</span>
          <span className="text-xs font-mono font-semibold text-primary">{client.accountNumber}</span>
        </div>
      )}

      {/* What needs your attention */}
      <CustomerAttention />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Truck} label="Deliveries" value={stats?.deliveries ?? 0} color="bg-blue-500/10 text-blue-400" href="/deliveries" />
        <StatCard icon={Server} label="My Devices" value={stats?.devices ?? 0} color="bg-violet-500/10 text-violet-400" href="/devices" />
        <StatCard icon={Archive} label="Staging Tasks" value={stats?.stagingTasks ?? 0} color="bg-yellow-500/10 text-yellow-400" href="/staging" />
        <StatCard icon={Ship} label="Shipments" value={stats?.shipments ?? 0} color="bg-orange-500/10 text-orange-400" href="/shipments" />
      </div>

      {/* Staging Progress Bar */}
      {stagingProgress && stagingProgress.tasks.length > 0 && (
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Active Staging Progress</CardTitle>
              <span className="text-xs text-muted-foreground">
                {stagingProgress.stagedDevices} of {stagingProgress.totalDevices} devices staged
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall progress */}
            {stagingProgress.totalDevices > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Overall</span>
                  <span className={stagingProgress.stagedDevices === stagingProgress.totalDevices ? "text-green-400" : "text-primary"}>
                    {stagingProgress.totalDevices > 0 ? Math.round((stagingProgress.stagedDevices / stagingProgress.totalDevices) * 100) : 0}%
                  </span>
                </div>
                <Progress
                  value={stagingProgress.totalDevices > 0 ? (stagingProgress.stagedDevices / stagingProgress.totalDevices) * 100 : 0}
                  className="h-2"
                />
              </div>
            )}
            {/* Per-task breakdown */}
            {stagingProgress.tasks.length > 1 && (
              <div className="space-y-3 pt-1">
                {stagingProgress.tasks.map((task) => (
                  <div key={task.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[60%]">{task.name}</span>
                      <span className="text-muted-foreground shrink-0">
                        {task.stagedDevices}/{task.totalDevices} devices
                        {task.percentComplete === 100 && <span className="ml-1 text-green-400">✓</span>}
                      </span>
                    </div>
                    <Progress value={task.percentComplete} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

function CustomerAttention() {
  const { data: alerts = [], isLoading } = trpc.alerts.myList.useQuery(
    undefined,
    { refetchInterval: 30_000 }
  );
  const [, setLocation] = useLocation();

  const kindIcon: Record<string, React.ElementType> = {
    message: MessageSquare,
    inquiry: Inbox,
    quote: FileText,
    msa: PenLine,
    user: User,
    onboarding: ClipboardList,
  };

  if (isLoading || alerts.length === 0) return null;

  return (
    <Card className="bg-amber-500/5 border-amber-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BellRing className="w-4 h-4 text-amber-400" />
          What needs your attention
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-1.5 py-0 h-5">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {alerts.map(alert => {
          const Icon = kindIcon[alert.kind] ?? Inbox;
          return (
            <div
              key={alert.id}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-black/20 border border-amber-500/20"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.detail}</p>
              </div>
              <InfoTip title="What do I need to do?">{alert.actionHint}</InfoTip>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-amber-500/30 text-amber-300 hover:text-amber-200 h-8"
                onClick={() => setLocation(alert.href)}
              >
                View
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const role = (user as any)?.role ?? "";
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
