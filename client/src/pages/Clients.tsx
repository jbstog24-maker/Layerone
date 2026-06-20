import { useState } from "react";
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
import { Building2, Plus, Search, ChevronRight, Mail, Phone } from "lucide-react";
import { useForm } from "react-hook-form";

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

export function ClientsList() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const { data: clients, isLoading } = trpc.clients.list.useQuery({ search: search || undefined });

  return (
    <DashboardLayout>
      <PageHeader
        title="Clients"
        subtitle="Manage client accounts and company profiles"
        action={
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Client
          </Button>
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
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
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

export function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const id = parseInt(params?.id ?? "0");
  const [showEdit, setShowEdit] = useState(false);
  const [, setLocation] = useLocation();
  const { data: client, isLoading } = trpc.clients.get.useQuery({ id });
  const { data: packages } = trpc.packages.list.useQuery();
  const pkg = packages?.find(p => p.id === client?.packageId);

  if (isLoading) return <DashboardLayout><div className="animate-pulse space-y-4"><div className="h-8 bg-muted/50 rounded w-48" /><div className="h-32 bg-muted/50 rounded" /></div></DashboardLayout>;
  if (!client) return <DashboardLayout><EmptyState icon={Building2} title="Client not found" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title={client.companyName}
        subtitle={`Client #${client.id}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/clients")}>Back</Button>
            <Button size="sm" onClick={() => setShowEdit(true)}>Edit</Button>
          </div>
        }
      />
      <div className="grid md:grid-cols-3 gap-4">
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

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
          <ClientForm onClose={() => setShowEdit(false)} clientId={id} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
