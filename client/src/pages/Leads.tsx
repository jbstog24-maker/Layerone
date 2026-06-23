import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Users, Plus, Search, Flame, Thermometer, Snowflake, Loader2, Trash2, ExternalLink, Brain } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  contacted: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  qualified: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  proposal_sent: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  negotiating: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  won: "bg-green-500/10 text-green-600 border-green-500/20",
  lost: "bg-red-500/10 text-red-600 border-red-500/20",
  on_hold: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  unqualified: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  follow_up: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  demo_scheduled: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

const STATUSES = ["new","contacted","qualified","proposal_sent","negotiating","won","lost","on_hold","unqualified","follow_up","demo_scheduled"];
const SOURCES = ["manual","inquiry_form","google_maps","referral","linkedin","other"];

function TempIcon({ temp }: { temp?: string | null }) {
  if (temp === "hot") return <Flame className="h-4 w-4 text-red-500" />;
  if (temp === "warm") return <Thermometer className="h-4 w-4 text-orange-400" />;
  return <Snowflake className="h-4 w-4 text-blue-400" />;
}

export default function Leads() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ companyName: "", contactName: "", email: "", phone: "", industry: "", city: "", source: "manual", status: "new", temperature: "cold", notes: "" });

  const { data: leads, isLoading } = trpc.leads.list.useQuery({ search: search || undefined, status: statusFilter === "all" ? undefined : statusFilter });
  const { data: stats } = trpc.leads.stats.useQuery();

  const createMutation = trpc.leads.create.useMutation({
    onSuccess: () => { utils.leads.list.invalidate(); utils.leads.stats.invalidate(); setShowCreate(false); setForm({ companyName: "", contactName: "", email: "", phone: "", industry: "", city: "", source: "manual", status: "new", temperature: "cold", notes: "" }); toast.success("Lead created"); },
    onError: e => toast.error(e.message),
  });

  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => { utils.leads.list.invalidate(); utils.leads.stats.invalidate(); toast.success("Lead deleted"); },
    onError: e => toast.error(e.message),
  });

  const scoreMutation = trpc.leads.scoreWithAI.useMutation({
    onSuccess: (r, vars) => { utils.leads.list.invalidate(); toast.success(`AI scored: ${r.score}/100 — ${r.reasoning}`); },
    onError: e => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" />Leads</h1>
            <p className="text-muted-foreground mt-1">Manage your sales pipeline and track prospects.</p>
          </div>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Add Lead</Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: (stats as {status:string;count:number}[]).reduce((a,s)=>a+s.count,0), color: "text-foreground" },
              { label: "New", value: (stats as {status:string;count:number}[]).find(s=>s.status==="new")?.count??0, color: "text-blue-600" },
              { label: "Qualified", value: (stats as {status:string;count:number}[]).find(s=>s.status==="qualified")?.count??0, color: "text-cyan-600" },
              { label: "Won", value: (stats as {status:string;count:number}[]).find(s=>s.status==="won")?.count??0, color: "text-green-600" },
            ].map(s => (
              <Card key={s.label}><CardContent className="py-3 px-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></CardContent></Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search company, contact, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Temp</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                )}
                {!isLoading && leads?.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>
                )}
                {leads?.map(lead => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <TableCell className="font-medium">{lead.companyName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.contactName ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[lead.status] ?? ""}`}>
                        {lead.status.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell><TempIcon temp={lead.temperature} /></TableCell>
                    <TableCell>
                      {lead.score != null ? (
                        <span className={`text-sm font-bold ${lead.score >= 70 ? "text-green-600" : lead.score >= 40 ? "text-orange-500" : "text-muted-foreground"}`}>{lead.score}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">{lead.source?.replace(/_/g, " ") ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{lead.industry ?? "—"}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="AI Score"
                          disabled={scoreMutation.isPending}
                          onClick={() => scoreMutation.mutate({ id: lead.id })}>
                          <Brain className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Delete this lead?")) deleteMutation.mutate({ id: lead.id }); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="col-span-2 space-y-1.5"><Label>Company Name *</Label><Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Contact Name</Label><Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button disabled={!form.companyName.trim() || createMutation.isPending} onClick={() => createMutation.mutate({ companyName: form.companyName, contactName: form.contactName || undefined, email: form.email || undefined, phone: form.phone || undefined, industry: form.industry || undefined, city: form.city || undefined, source: form.source as any, status: form.status as any, temperature: form.temperature as any, notes: form.notes || undefined })}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
