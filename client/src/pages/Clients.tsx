import { useLocation, useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, LoadingRows } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Building2, Plus, Search, ChevronRight, Mail, Phone, FileText, Warehouse, Calendar, CheckCircle, Clock, AlertCircle, Send, CreditCard, Download, MessageSquare, User, Archive, ArchiveRestore, ClipboardList, CheckCircle2, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/_core/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function ClientForm({ onClose, clientId }: { onClose: () => void; clientId?: number }) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.clients.get.useQuery({ id: clientId! }, { enabled: !!clientId });
  const { data: packages } = trpc.packages.list.useQuery();
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => { toast.success("Client created"); utils.clients.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => { toast.success("Client updated"); utils.clients.list.invalidate(); utils.clients.get.invalidate({ id: clientId }); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      companyName: existing?.companyName ?? "",
      contactName: existing?.contactName ?? "",
      contactEmail: existing?.contactEmail ?? "",
      contactPhone: existing?.contactPhone ?? "",
      billingEmail: existing?.billingEmail ?? "",
      packageId: existing?.packageId?.toString() ?? "",
      status: existing?.status ?? "onboarding",
      projectNotes: existing?.projectNotes ?? "",
      address: existing?.address ?? "",
    },
  });

  const onSubmit = (data: any) => {
    const payload = { ...data, packageId: data.packageId ? parseInt(data.packageId) : undefined };
    if (clientId) updateMutation.mutate({ id: clientId, ...payload });
    else createMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Company Name *</Label>
          <Input {...register("companyName")} placeholder="Acme Corp" className="mt-1" />
        </div>
        <div>
          <Label>Contact Name</Label>
          <Input {...register("contactName")} placeholder="John Smith" className="mt-1" />
        </div>
        <div>
          <Label>Contact Email</Label>
          <Input {...register("contactEmail")} type="email" placeholder="john@acme.com" className="mt-1" />
        </div>
        <div>
          <Label>Contact Phone</Label>
          <Input {...register("contactPhone")} placeholder="+1 (555) 000-0000" className="mt-1" />
        </div>
        <div>
          <Label>Billing Email</Label>
          <Input {...register("billingEmail")} type="email" placeholder="billing@acme.com" className="mt-1" />
        </div>
        <div>
          <Label>Package</Label>
          <Select onValueChange={(v) => setValue("packageId", v)} defaultValue={existing?.packageId?.toString()}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select package" /></SelectTrigger>
            <SelectContent>
              {packages?.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select onValueChange={(v) => setValue("status", v as any)} defaultValue={existing?.status ?? "onboarding"}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Address</Label>
          <Input {...register("address")} placeholder="123 Main St, Dallas TX 75201" className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Project Notes</Label>
          <Textarea {...register("projectNotes")} placeholder="Internal notes about this client..." className="mt-1" rows={3} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {clientId ? "Save Changes" : "Create Client"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function exportToCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) { toast.info("No data to export"); return; }
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}

export function ClientsList() {
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const { data: clients, isLoading } = trpc.clients.list.useQuery({ search: search || undefined, showArchived });
  const utils = trpc.useUtils();
  const archiveMut = trpc.clients.archive.useMutation({
    onSuccess: () => { toast.success("Client archived"); utils.clients.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const unarchiveMut = trpc.clients.unarchive.useMutation({
    onSuccess: () => { toast.success("Client restored"); utils.clients.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Clients"
        subtitle="Manage client accounts and company profiles"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportToCSV((clients ?? []).map(c => ({ id: c.id, accountNumber: (c as any).accountNumber ?? "", company: c.companyName, contact: c.contactName ?? "", email: c.contactEmail ?? "", phone: c.contactPhone ?? "", status: c.status, createdAt: new Date(c.createdAt).toLocaleDateString() })), "clients.csv")}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowArchived(v => !v)}>
              {showArchived ? <><ArchiveRestore className="w-4 h-4 mr-1" /> Active Clients</> : <><Archive className="w-4 h-4 mr-1" /> Archived</>}
            </Button>
            {!showArchived && (
              <Button onClick={() => setShowCreate(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" /> New Client
              </Button>
            )}
          </div>
        }
      />
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={5} /> : clients?.length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon={Building2} title="No clients yet" description="Add your first client to get started." /></td></tr>
              ) : clients?.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/clients/${c.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{c.companyName.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-sm">{c.companyName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      {c.contactName && <p>{c.contactName}</p>}
                      {c.contactEmail && <p className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{c.contactEmail}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {showArchived ? (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => unarchiveMut.mutate({ id: c.id })} disabled={unarchiveMut.isPending}>
                        <ArchiveRestore className="w-3.5 h-3.5 mr-1" /> Restore
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={() => archiveMut.mutate({ id: c.id })} disabled={archiveMut.isPending}>
                        <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
          <ClientForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Warehouse Assignment Form
function WarehouseAssignmentForm({ clientId, client, onSuccess }: { clientId: number; client: any; onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      warehouseUnitNumber: (client as any).warehouseUnitNumber ?? "",
      warehouseAddress: (client as any).warehouseAddress ?? "",
      warehouseAccessCode: (client as any).warehouseAccessCode ?? "",
      warehouseDimensions: (client as any).warehouseDimensions ?? "",
      warehouseNotes: (client as any).warehouseNotes ?? "",
    },
  });
  const assignMut = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Warehouse space assigned — client notification sent");
      utils.clients.get.invalidate({ id: clientId });
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const onSubmit = (data: any) => {
    assignMut.mutate({ id: clientId, ...data, warehouseAssignedAt: new Date().toISOString() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Unit / Bay Number *</Label>
          <Input {...register("warehouseUnitNumber")} placeholder="Unit 101" className="mt-1" />
        </div>
        <div>
          <Label>Access Code</Label>
          <Input {...register("warehouseAccessCode")} placeholder="1234#" className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Facility Address</Label>
          <Input {...register("warehouseAddress")} placeholder="123 Warehouse Blvd, North Richland Hills, TX" className="mt-1" />
        </div>
        <div>
          <Label>Dimensions (sq ft / dimensions)</Label>
          <Input {...register("warehouseDimensions")} placeholder="10x20 ft / 200 sq ft" className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Notes for Client</Label>
          <Textarea {...register("warehouseNotes")} placeholder="Loading dock hours, special instructions, etc." className="mt-1 h-20" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          <Send className="w-4 h-4" />
          {isSubmitting ? "Saving..." : "Assign & Notify Client"}
        </Button>
      </div>
    </form>
  );
}

// Onboarding Timeline Card
function OnboardingTimeline({ client }: { client: any }) {
  const steps = [
    {
      key: "inquiry",
      label: "Inquiry Received",
      done: true,
      date: client.createdAt,
      icon: CheckCircle,
      color: "text-green-400",
    },
    {
      key: "contract",
      label: "Contract Signed",
      done: !!(client as any).contractSignedAt,
      date: (client as any).contractSignedAt,
      icon: (client as any).contractSignedAt ? CheckCircle : Clock,
      color: (client as any).contractSignedAt ? "text-green-400" : "text-yellow-400",
    },
    {
      key: "payment",
      label: "First Payment",
      done: (client as any).paymentStatus === "paid",
      date: null,
      icon: (client as any).paymentStatus === "paid" ? CheckCircle : CreditCard,
      color: (client as any).paymentStatus === "paid" ? "text-green-400" : "text-slate-400",
    },
    {
      key: "warehouse",
      label: "Warehouse Assigned",
      done: !!(client as any).warehouseAssignedAt,
      date: (client as any).warehouseAssignedAt,
      icon: (client as any).warehouseAssignedAt ? CheckCircle : Warehouse,
      color: (client as any).warehouseAssignedAt ? "text-green-400" : "text-slate-400",
    },
    {
      key: "golive",
      label: "Go-Live Date",
      done: !!(client as any).goLiveDate && new Date((client as any).goLiveDate) <= new Date(),
      date: (client as any).goLiveDate,
      icon: (client as any).goLiveDate ? Calendar : AlertCircle,
      color: (client as any).goLiveDate ? "text-blue-400" : "text-slate-400",
    },
  ];

  return (
    <Card className="bg-card/60 border-border/50">
      <CardHeader><CardTitle className="text-sm">Onboarding Progress</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <Icon className={`w-4 h-4 mt-0.5 ${step.color}`} />
                  {i < steps.length - 1 && <div className={`w-px h-6 mt-1 ${step.done ? "bg-green-400/40" : "bg-border/40"}`} />}
                </div>
                <div className="flex-1 pb-1">
                  <p className={`text-sm font-medium ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                  {step.date && <p className="text-xs text-muted-foreground">{new Date(step.date).toLocaleDateString()}</p>}
                  {!step.done && step.key === "golive" && (client as any).contractSignedAt && (
                    <p className="text-xs text-blue-400">Est. {new Date(new Date((client as any).contractSignedAt).getTime() + 14 * 86400000).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Client Message Thread ───────────────────────────────────────────────────
function ClientMessageThread({ clientId, isAdminOrStaff }: { clientId: number; isAdminOrStaff: boolean }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading, isError, refetch } = trpc.messages.list.useQuery(
    { clientId },
    { refetchInterval: 15_000 },
  );

  const sendMsg = trpc.messages.send.useMutation({
    onSuccess: () => {
      setBody("");
      utils.messages.list.invalidate({ clientId });
    },
    onError: (e) => toast.error(e.message),
  });

  // Mark messages as read when thread is opened
  const markRead = trpc.messages.markRead.useMutation();
  useEffect(() => {
    if (messages.length > 0) {
      markRead.mutate({ clientId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, messages.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed || sendMsg.isPending) return;
    sendMsg.mutate({ clientId, body: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isStaffMsg = (role: string) => role === "admin" || role === "staff";

  return (
    <Card className="bg-card/60 border-border/50 mb-4">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <MessageSquare className="w-4 h-4 text-blue-400" />
        <CardTitle className="text-sm">Messages</CardTitle>
        <span className="text-xs text-muted-foreground ml-auto">Shift+Enter for new line · Enter to send</span>
      </CardHeader>
      <CardContent className="p-0">
        {/* Thread */}
        <div className="h-80 overflow-y-auto px-4 py-2 space-y-3 border-t border-border/30">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-8 h-8 text-destructive/40 mb-2" />
              <p className="text-sm text-muted-foreground">Could not load messages</p>
              <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Start the conversation below.</p>
            </div>
          ) : (
            (messages as any[]).map((msg) => {
              const fromStaff = isStaffMsg(msg.senderRole);
              const isOwn = fromStaff === isAdminOrStaff;
              return (
                <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    fromStaff ? "bg-blue-500/20 text-blue-300" : "bg-slate-500/20 text-slate-300"
                  }`}>
                    {fromStaff ? <User className="w-3.5 h-3.5" /> : msg.senderName?.charAt(0)?.toUpperCase() ?? "C"}
                  </div>
                  <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                    <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${isOwn ? "flex-row-reverse" : ""}`}>
                      <span className="font-medium">{msg.senderName}</span>
                      <span>·</span>
                      <span>{new Date(msg.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      {msg.readAt && isOwn && <span className="text-blue-400/60">✓ Read</span>}
                    </div>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isOwn
                        ? "bg-primary/20 text-primary-foreground rounded-tr-sm"
                        : "bg-muted/50 text-foreground rounded-tl-sm"
                    }`}>
                      {msg.body}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-border/30 p-3 flex gap-2 items-end">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAdminOrStaff ? "Reply to client…" : "Message NSDS team…"}
            className="resize-none min-h-[60px] max-h-32 text-sm bg-background/50"
            rows={2}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!body.trim() || sendMsg.isPending}
            className="h-10 px-3 shrink-0"
          >
            {sendMsg.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const id = parseInt(params?.id ?? "0");
  const [showEdit, setShowEdit] = useState(false);
  const [showWarehouse, setShowWarehouse] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === "admin" || user?.role === "staff";
  const { data: client, isLoading, refetch: refetchClient } = trpc.clients.get.useQuery({ id });
  const { data: packages } = trpc.packages.list.useQuery();
  const { data: clientDocs } = trpc.documents.clientDocs.list.useQuery({ clientId: id }, { enabled: isAdminOrStaff });
  const pkg = packages?.find(p => p.id === client?.packageId);

  if (isLoading) return <DashboardLayout><div className="animate-pulse space-y-4"><div className="h-8 bg-muted/50 rounded w-48" /><div className="h-32 bg-muted/50 rounded" /></div></DashboardLayout>;
  if (!client) return <DashboardLayout><EmptyState icon={Building2} title="Client not found" /></DashboardLayout>;

  const docStatusColor: Record<string, string> = {
    draft: "bg-slate-500/20 text-slate-300",
    sent: "bg-blue-500/20 text-blue-300",
    viewed: "bg-yellow-500/20 text-yellow-300",
    signed: "bg-green-500/20 text-green-300",
    approved: "bg-emerald-500/20 text-emerald-300",
    rejected: "bg-red-500/20 text-red-300",
    expired: "bg-orange-500/20 text-orange-300",
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={client.companyName}
        subtitle={`Client #${client.id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/clients")}>Back</Button>
            {isAdminOrStaff && <Button variant="outline" size="sm" onClick={() => setShowWarehouse(true)} className="gap-1"><Warehouse className="w-4 h-4" />Assign Space</Button>}
            <Button size="sm" onClick={() => setShowEdit(true)}>Edit</Button>
          </div>
        }
      />

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Card className="bg-card/60 border-border/50 md:col-span-2">
          <CardHeader><CardTitle className="text-sm">Client Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground text-xs mb-1">Status</p><StatusBadge status={client.status} /></div>
            <div><p className="text-muted-foreground text-xs mb-1">Package</p><p className="font-medium">{pkg?.name ?? "None"}</p></div>
            <div><p className="text-muted-foreground text-xs mb-1">Contact</p><p>{client.contactName ?? "—"}</p></div>
            <div><p className="text-muted-foreground text-xs mb-1">Email</p><p>{client.contactEmail ?? "—"}</p></div>
            <div><p className="text-muted-foreground text-xs mb-1">Phone</p><p>{client.contactPhone ?? "—"}</p></div>
            <div><p className="text-muted-foreground text-xs mb-1">Billing Email</p><p>{client.billingEmail ?? "—"}</p></div>
            <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Address</p><p>{client.address ?? "—"}</p></div>
            {client.projectNotes && (
              <div className="col-span-2"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-muted-foreground">{client.projectNotes}</p></div>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <OnboardingTimeline client={client} />
          <Card className="bg-card/60 border-border/50">
            <CardHeader><CardTitle className="text-sm">Quick Links</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Deliveries", path: `/deliveries?clientId=${id}` },
                { label: "Devices", path: `/devices?clientId=${id}` },
                { label: "Staging Tasks", path: `/staging?clientId=${id}` },
                { label: "Shipments", path: `/shipments?clientId=${id}` },
                { label: "Invoices", path: `/invoices?clientId=${id}` },
              ].map(({ label, path }) => (
                <button key={path} onClick={() => setLocation(path)} className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-sm">
                  <span>{label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Warehouse Details (if assigned) */}
      {(client as any).warehouseUnitNumber && (
        <Card className="bg-card/60 border-border/50 mb-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Warehouse className="w-4 h-4 text-blue-400" />Assigned Warehouse Space</CardTitle>
            {isAdminOrStaff && <Button size="sm" variant="outline" onClick={() => setShowWarehouse(true)}>Update</Button>}
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground text-xs mb-1">Unit / Bay</p><p className="font-mono font-bold text-blue-300">{(client as any).warehouseUnitNumber}</p></div>
            <div><p className="text-muted-foreground text-xs mb-1">Access Code</p><p className="font-mono">{(client as any).warehouseAccessCode ?? "—"}</p></div>
            <div><p className="text-muted-foreground text-xs mb-1">Dimensions</p><p>{(client as any).warehouseDimensions ?? "—"}</p></div>
            <div><p className="text-muted-foreground text-xs mb-1">Assigned</p><p>{(client as any).warehouseAssignedAt ? new Date((client as any).warehouseAssignedAt).toLocaleDateString() : "—"}</p></div>
            {(client as any).warehouseAddress && <div className="col-span-2 md:col-span-4"><p className="text-muted-foreground text-xs mb-1">Address</p><p>{(client as any).warehouseAddress}</p></div>}
            {(client as any).warehouseNotes && <div className="col-span-2 md:col-span-4"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-muted-foreground">{(client as any).warehouseNotes}</p></div>}
          </CardContent>
        </Card>
      )}

      {/* Messages Thread */}
      <ClientMessageThread clientId={id} isAdminOrStaff={isAdminOrStaff} />

      {/* Documents Tab (admin/staff only) */}
      {isAdminOrStaff && (
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" />Documents & Agreements</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setLocation("/documents")} className="gap-1"><Plus className="w-3 h-3" />Manage</Button>
          </CardHeader>
          <CardContent>
            {!clientDocs || clientDocs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No documents linked to this client yet.</p>
                <p className="text-xs mt-1">Go to the Document Library to send or auto-draft an MSA.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{doc.documentName ?? "Document"}</p>
                        <p className="text-xs text-muted-foreground">
                          Sent {doc.sentAt ? new Date(doc.sentAt).toLocaleDateString() : "—"}
                          {doc.signedAt && ` · Signed ${new Date(doc.signedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${docStatusColor[doc.status] ?? "bg-slate-500/20 text-slate-300"}`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1">
                            <Download className="w-3 h-3" />View
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Staging Instructions (staff/admin only) */}
      {isAdminOrStaff && <ClientInstructionsPanel clientId={id} />}

      {/* Internal Notes (staff/admin only) */}
      {isAdminOrStaff && <ClientInternalNotes clientId={id} />}

      {/* Edit Client Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
          <ClientForm onClose={() => setShowEdit(false)} clientId={id} />
        </DialogContent>
      </Dialog>

      {/* Warehouse Assignment Dialog */}
      <Dialog open={showWarehouse} onOpenChange={setShowWarehouse}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Warehouse className="w-5 h-5" />Assign Warehouse Space</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Once saved, the client will automatically receive an email with their warehouse details.</p>
          <WarehouseAssignmentForm clientId={id} client={client} onSuccess={() => { setShowWarehouse(false); void refetchClient(); }} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ─── Client Instructions Panel (admin/staff view) ────────────────────────────
function ClientInstructionsPanel({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.instructions.get.useQuery({ clientId });

  const acknowledgeMut = trpc.instructions.acknowledge.useMutation({
    onSuccess: () => { toast.success("Instructions acknowledged"); utils.instructions.get.invalidate({ clientId }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteFileMut = trpc.instructions.deleteFile.useMutation({
    onSuccess: () => utils.instructions.get.invalidate({ clientId }),
    onError: (e) => toast.error(e.message),
  });
  const getFileUrl = async (fileKey: string, fileName: string) => {
    try {
      const result = await utils.instructions.getFileUrl.fetch({ clientId, fileKey });
      const a = document.createElement("a"); a.href = result.url; a.download = fileName; a.target = "_blank"; a.click();
    } catch { toast.error("Could not get download link"); }
  };

  const instructions = data?.instructions;
  const files = data?.files ?? [];
  const hasContent = (instructions?.textBody && instructions.textBody.trim().length > 0) || files.length > 0;
  const acknowledged = !!instructions?.acknowledgedAt;

  return (
    <Card className="bg-card/60 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-400" /> Client Staging Instructions
          {hasContent && (
            acknowledged
              ? <span className="text-xs font-normal text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Acknowledged</span>
              : <span className="text-xs font-normal text-yellow-400">⚠ Needs review</span>
          )}
        </CardTitle>
        {hasContent && !acknowledged && (
          <Button size="sm" variant="outline" className="h-7 px-3 text-xs gap-1 border-green-500/40 text-green-400 hover:bg-green-500/10"
            onClick={() => acknowledgeMut.mutate({ clientId })} disabled={acknowledgeMut.isPending}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Reviewed
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="h-20 bg-muted/30 rounded animate-pulse" />
        ) : !hasContent ? (
          <p className="text-xs text-muted-foreground text-center py-6">No staging instructions provided by this client yet.</p>
        ) : (
          <>
            {instructions?.textBody && instructions.textBody.trim().length > 0 && (
              <div className="rounded-lg border border-border/50 bg-muted/10 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Written Instructions</p>
                <div className="text-sm prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: instructions.textBody }} />
                {acknowledged && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Reviewed by {instructions.acknowledgedByUserId ? `user #${instructions.acknowledgedByUserId}` : "staff"} on {new Date(instructions.acknowledgedAt!).toLocaleString()}
                  </p>
                )}
              </div>
            )}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Attached Files ({files.length})</p>
                {files.map(f => (
                  <div key={f.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/50 bg-muted/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-sm truncate">{f.fileName}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{new Date(f.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => getFileUrl(f.fileKey, f.fileName)} title="Download">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteFileMut.mutate({ id: f.id, clientId, fileName: f.fileName })} title="Remove">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Client Internal Notes Component ──────────────────────────────────────────
function ClientInternalNotes({ clientId }: { clientId: number }) {
  const [newNote, setNewNote] = useState("");
  const utils = trpc.useUtils();
  const { data: notes, isLoading } = trpc.clients.listNotes.useQuery({ clientId });

  const addMut = trpc.clients.addNote.useMutation({
    onSuccess: () => { setNewNote(""); utils.clients.listNotes.invalidate({ clientId }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.clients.deleteNote.useMutation({
    onSuccess: () => utils.clients.listNotes.invalidate({ clientId }),
    onError: (e) => toast.error(e.message),
  });
  const pinMut = trpc.clients.updateNote.useMutation({
    onSuccess: () => utils.clients.listNotes.invalidate({ clientId }),
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="bg-card/60 border-border/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" /> Internal Notes
          <span className="text-xs font-normal text-muted-foreground ml-1">(staff only — not visible to client)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add note */}
        <div className="flex gap-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add an internal note..."
            className="resize-none min-h-[60px] text-sm bg-background/50"
            rows={2}
          />
          <Button
            size="sm"
            className="h-10 px-3 shrink-0 self-end"
            onClick={() => { if (newNote.trim()) addMut.mutate({ clientId, body: newNote.trim() }); }}
            disabled={!newNote.trim() || addMut.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Notes list */}
        {isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}</div>
        ) : notes?.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No internal notes yet.</p>
        ) : (
          <div className="space-y-2">
            {notes?.map(note => (
              <div key={note.id} className={`rounded-lg border p-3 text-sm ${note.isPinned ? "border-amber-500/30 bg-amber-500/5" : "border-border/50 bg-muted/10"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 text-sm whitespace-pre-wrap">{note.body}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className={`p-1 rounded hover:bg-muted transition-colors ${note.isPinned ? "text-amber-400" : "text-muted-foreground"}`}
                      onClick={() => pinMut.mutate({ id: note.id, isPinned: !note.isPinned })}
                      title={note.isPinned ? "Unpin" : "Pin"}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => { if (confirm("Delete this note?")) deleteMut.mutate({ id: note.id }); }}
                      title="Delete"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {note.authorName ?? "Staff"} · {new Date(note.createdAt).toLocaleString()}
                  {note.isPinned && <span className="ml-2 text-amber-400 font-medium">Pinned</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
