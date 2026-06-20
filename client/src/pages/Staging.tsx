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
import { Archive, Plus, ChevronRight, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";

const TASK_TYPES = [
  { value: "firmware_update", label: "Firmware Update" },
  { value: "labeling", label: "Labeling" },
  { value: "site_kit_prep", label: "Site Kit Prep" },
  { value: "switch_staging", label: "Switch Staging" },
  { value: "firewall_staging", label: "Firewall Staging" },
  { value: "ap_prep", label: "AP Prep" },
  { value: "camera_nvr_kit", label: "Camera/NVR Kit" },
  { value: "config_backup", label: "Config Backup" },
  { value: "documentation", label: "Documentation" },
  { value: "other", label: "Other" },
];

function StagingForm({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: clients } = trpc.clients.list.useQuery({});
  const createMutation = trpc.staging.create.useMutation({
    onSuccess: () => { toast.success("Task created"); utils.staging.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { clientId: "", title: "", taskType: "other", priority: "normal", instructions: "", estimatedHours: "", notes: "" },
  });
  const onSubmit = (data: any) => createMutation.mutate({ ...data, clientId: parseInt(data.clientId) });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Client *</Label>
          <Select onValueChange={(v) => setValue("clientId", v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Task Title *</Label>
          <Input {...register("title")} placeholder="Stage 50 Meraki switches for Site A" className="mt-1" />
        </div>
        <div>
          <Label>Task Type</Label>
          <Select onValueChange={(v) => setValue("taskType", v as any)} defaultValue="other">
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select onValueChange={(v) => setValue("priority", v as any)} defaultValue="normal">
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="rush">Rush</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Est. Hours</Label>
          <Input {...register("estimatedHours")} type="number" step="0.5" placeholder="0" className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Instructions</Label>
          <Textarea {...register("instructions")} placeholder="Step-by-step staging instructions..." className="mt-1" rows={3} />
        </div>
        <div className="col-span-2">
          <Label>Notes</Label>
          <Textarea {...register("notes")} className="mt-1" rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending}>Create Task</Button>
      </DialogFooter>
    </form>
  );
}

export function StagingList() {
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const { data: tasks, isLoading } = trpc.staging.list.useQuery({});

  const priorityColor: Record<string, string> = {
    rush: "text-orange-400", high: "text-red-400", normal: "text-blue-400", low: "text-slate-400",
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Staging Tasks"
        subtitle="Manage device staging, configuration, and prep work"
        action={isStaff ? <Button onClick={() => setShowCreate(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Task</Button> : undefined}
      />
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Task</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Est. Hrs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={7} /> : tasks?.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={Archive} title="No staging tasks yet" /></td></tr>
              ) : tasks?.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/staging/${t.id}`)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.projectName ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{t.taskType?.replace(/_/g, " ") ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold uppercase ${priorityColor[t.priority ?? "normal"]}`}>{t.priority ?? "normal"}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />{t.estimatedHours ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Staging Task</DialogTitle></DialogHeader>
          <StagingForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export function StagingDetail() {
  const [, params] = useRoute("/staging/:id");
  const id = parseInt(params?.id ?? "0");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = role === "admin" || role === "staff";
  const utils = trpc.useUtils();

  const { data: task, isLoading } = trpc.staging.get.useQuery({ id });
  const updateMutation = trpc.staging.update.useMutation({
    onSuccess: () => { toast.success("Task updated"); utils.staging.get.invalidate({ id }); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-32 bg-muted/50 rounded" /></DashboardLayout>;
  if (!task) return <DashboardLayout><EmptyState icon={Archive} title="Task not found" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title={task.title}
        subtitle={task.taskType?.replace(/_/g, " ") ?? ""}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/staging")}>Back</Button>
          </div>
        }
      />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-card/60 border-border/50">
            <CardHeader><CardTitle className="text-sm">Task Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground text-xs mb-1">Status</p><StatusBadge status={task.status} /></div>
              <div><p className="text-muted-foreground text-xs mb-1">Priority</p><StatusBadge status={task.priority ?? "normal"} /></div>
              <div><p className="text-muted-foreground text-xs mb-1">Type</p><p>{task.taskType?.replace(/_/g, " ") ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Est. Hours</p><p>{task.estimatedHours ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Actual Hours</p><p>{task.actualHours ?? "—"}</p></div>
              <div><p className="text-muted-foreground text-xs mb-1">Project</p><p>{task.projectName ?? "—"}</p></div>
              {task.instructions && <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Instructions</p><p className="whitespace-pre-wrap text-sm">{task.instructions}</p></div>}
              {task.notes && <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-muted-foreground">{task.notes}</p></div>}
            </CardContent>
          </Card>

          {isStaff && (
            <Card className="bg-card/60 border-border/50">
              <CardHeader><CardTitle className="text-sm">Update Status</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["pending", "in_progress", "completed", "on_hold", "cancelled"].map((s) => (
                    <Button key={s} variant={task.status === s ? "default" : "outline"} size="sm"
                      onClick={() => updateMutation.mutate({ id, status: s as any })}
                      disabled={updateMutation.isPending}
                    >
                      {s.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {task.devices && task.devices.length > 0 && (
            <Card className="bg-card/60 border-border/50">
              <CardHeader><CardTitle className="text-sm">Assigned Devices ({task.devices.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                {task.devices.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{d.brand} {d.model}</p>
                      <p className="text-xs font-mono text-muted-foreground">{d.serialNumber ?? d.deviceCode}</p>
                    </div>
                    <StatusBadge status={d.stagingStatus} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-card/60 border-border/50">
          <CardHeader><CardTitle className="text-sm">Photos</CardTitle></CardHeader>
          <CardContent>
            <PhotoGallery entityType="staging_task" entityId={id} clientId={task.clientId} showUpload={isStaff} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
