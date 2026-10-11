import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import {
  demoProject,
  pipelineStages,
  demoSites,
  demoDevices,
  demoTasks,
  demoDeliveries,
  demoActivity,
} from "@/data/demo-portal-data";
import {
  Package,
  MapPin,
  Truck,
  ClipboardList,
  Activity,
  MonitorSmartphone,
  ArrowRight,
  Image as ImageIcon,
  ChevronDown,
  CheckCircle2,
  Clock,
  CalendarDays,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/40 p-4 text-center">
      <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
      <span className="text-[11px] font-medium text-muted-foreground">Photo placeholder</span>
      <span className="text-[10px] text-muted-foreground/70">{label}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-[11px] text-muted-foreground/80">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gear pipeline: {demoProject.projectName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {pipelineStages.map((stage, i) => {
            const pct = Math.round((stage.count / demoProject.totalDevices) * 100);
            return (
              <div key={stage.key} className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{stage.label}</div>
                <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-muted">
                  <div
                    className={cn(
                      "flex h-full items-center justify-end rounded-md pr-2 transition-all",
                      i === pipelineStages.length - 1 ? "bg-emerald-500/70" : "bg-primary/70"
                    )}
                    style={{ width: `${pct}%` }}
                  >
                    <span className="text-xs font-semibold text-primary-foreground">{stage.count}</span>
                  </div>
                </div>
                <div className="w-12 shrink-0 text-right text-xs text-muted-foreground">{pct}%</div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Counts show devices that have completed each stage. Every device is photographed and logged as it moves through the shop.
        </p>
      </CardContent>
    </Card>
  );
}

function SitesView() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {demoSites.map((site) => {
        const pct = Math.round((site.kitted / site.devices) * 100);
        return (
          <Card key={site.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm font-semibold">{site.name}</p>
                </div>
                <StatusBadge status={site.status} />
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Devices</span>
                  <span className="font-medium text-foreground">{site.devices}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kitted</span>
                  <span className="font-medium text-foreground">{site.kitted} of {site.devices}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivered</span>
                  <span className="font-medium text-foreground">{site.delivered} of {site.devices}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-medium text-foreground">{site.deliveryDate}</span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary/80" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{pct}% kitted</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DevicesView() {
  const [openId, setOpenId] = useState<number | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Device inventory <span className="font-normal text-muted-foreground">(showing 12 of 240)</span></CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Serial</th>
                <th className="px-4 py-2.5 font-medium">Asset tag</th>
                <th className="px-4 py-2.5 font-medium">Site</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {demoDevices.map((d) => (
                <>
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-2.5 font-medium">{d.type}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{d.serial}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{d.assetTag}</td>
                    <td className="px-4 py-2.5 text-xs">{d.site}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-2.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setOpenId(openId === d.id ? null : d.id)}>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", openId === d.id && "rotate-180")} />
                      </Button>
                    </td>
                  </tr>
                  {openId === d.id && (
                    <tr key={`${d.id}-detail`} className="border-b bg-muted/30">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="mb-2 text-xs font-semibold text-muted-foreground">DEVICE DETAIL</p>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                              <dt className="text-muted-foreground">Type</dt><dd className="font-medium">{d.type}</dd>
                              <dt className="text-muted-foreground">Serial</dt><dd className="font-mono">{d.serial}</dd>
                              <dt className="text-muted-foreground">Asset tag</dt><dd className="font-mono">{d.assetTag}</dd>
                              <dt className="text-muted-foreground">Assigned site</dt><dd>{d.site}</dd>
                              <dt className="text-muted-foreground">QA result</dt><dd className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Passed</dd>
                              <dt className="text-muted-foreground">Chain of custody</dt><dd>Logged at receiving, QA, kitting</dd>
                            </dl>
                          </div>
                          <div>
                            <p className="mb-2 text-xs font-semibold text-muted-foreground">PHOTOS</p>
                            <div className="grid grid-cols-3 gap-2">
                              <PhotoPlaceholder label="Receiving" />
                              <PhotoPlaceholder label="QA bench" />
                              <PhotoPlaceholder label="Asset tag" />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TasksView() {
  return (
    <div className="grid gap-4">
      {demoTasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {task.taskType} - {task.site}
                </p>
              </div>
              <StatusBadge status={task.status} />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Updated {task.updatedAt}
            </div>
            {task.photoCount > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: Math.min(task.photoCount, 4) }).map((_, i) => (
                  <PhotoPlaceholder key={i} label={`Step ${i + 1}`} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs italic text-muted-foreground">No photos yet. Photos are added as work is completed.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DeliveriesView() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" /> Upcoming deliveries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoDeliveries.map((del) => (
            <div key={del.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="text-sm font-semibold">{del.site}</p>
                <p className="text-xs text-muted-foreground">
                  {del.date} - {del.window} - {del.devices} devices
                </p>
              </div>
              <StatusBadge status={del.status} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" /> Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l border-muted pl-5">
            {demoActivity.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-sm">{a.text}</p>
                <p className="text-[11px] text-muted-foreground">{a.time}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PortalDemo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Persistent demo banner */}
      <div className="sticky top-0 z-50 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium sm:text-sm">
            <Badge variant="outline" className="mr-2 border-amber-500/50 text-amber-600 dark:text-amber-400">
              Interactive Demo
            </Badge>
            This is sample data showing what your client portal would look like.
          </p>
          <Link href="/get-started">
            <Button size="sm">
              Get a quote <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Portal header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Layer One Staging</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Client Portal</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {demoProject.clientName} - {demoProject.projectName}
            </p>
          </div>
          <Link href="/get-started">
            <Button variant="outline" size="sm">
              Talk to us about your rollout <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Summary stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Boxes} label="Total devices" value="240" sub="5 device types" />
          <StatCard icon={MapPin} label="Sites" value="12" sub="Across DFW" />
          <StatCard icon={ClipboardList} label="Staging tasks" value="6" sub="2 in progress" />
          <StatCard icon={Truck} label="Deliveries booked" value="5" sub="Next: Mon, Oct 13" />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 flex w-full flex-nowrap justify-start gap-1 overflow-x-auto">
            <TabsTrigger value="overview" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-sm">
              <Package className="h-4 w-4" /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="sites" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-sm">
              <MapPin className="h-4 w-4" /> Sites
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-sm">
              <MonitorSmartphone className="h-4 w-4" /> Devices
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-sm">
              <ClipboardList className="h-4 w-4" /> Staging tasks
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-sm">
              <Truck className="h-4 w-4" /> Deliveries
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PipelineView />
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Client</dt><dd className="font-medium">{demoProject.clientName}</dd>
                    <dt className="text-muted-foreground">Project</dt><dd className="font-medium">{demoProject.projectName}</dd>
                    <dt className="text-muted-foreground">Started</dt><dd className="font-medium">{demoProject.startDate}</dd>
                    <dt className="text-muted-foreground">Devices</dt><dd className="font-medium">{demoProject.totalDevices}</dd>
                    <dt className="text-muted-foreground">Delivered</dt><dd className="font-medium">48 of 240</dd>
                    <dt className="text-muted-foreground">On schedule</dt><dd className="font-medium text-emerald-500">Yes</dd>
                  </dl>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Latest activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {demoActivity.slice(0, 3).map((a) => (
                    <div key={a.id}>
                      <p className="text-sm">{a.text}</p>
                      <p className="text-[11px] text-muted-foreground">{a.time}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sites">
            <SitesView />
          </TabsContent>

          <TabsContent value="devices">
            <DevicesView />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksView />
          </TabsContent>

          <TabsContent value="schedule">
            <DeliveriesView />
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <Card className="mt-8 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-lg font-bold">This could be your gear, tracked like this.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Every rollout gets its own portal: live pipeline, per-site kits, device-level tracking, photo documentation, and delivery scheduling.
              </p>
            </div>
            <Link href="/get-started">
              <Button size="lg" className="shrink-0">
                Get a quote <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Interactive demo with fictional sample data. Metroplex Dental Group is not a real customer.
        </p>
      </main>
    </div>
  );
}
