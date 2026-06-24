import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Brain, Mail, FileText, Send, Trash2, Loader2, Copy, Download, Play, Flame, Thermometer, Snowflake, Plus, UserPlus, Calendar, AlertCircle } from "lucide-react";

const STATUSES = ["new","contacted","qualified","proposal_sent","negotiating","won","lost","on_hold","unqualified","follow_up","demo_scheduled"];
const CAMPAIGN_TYPES = ["cold_email","follow_up","linkedin","call_script"];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const leadId = Number(id);

  const [showEnroll, setShowEnroll] = useState(false);
  const [selectedSeqId, setSelectedSeqId] = useState<string>("");
  const [showQuote, setShowQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ title: "", deviceCount: "", monthlyRate: "", setupFee: "", notes: "" });
  const [campaignType, setCampaignType] = useState<string>("cold_email");
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<string>("");

  const { data: lead, isLoading } = trpc.leads.get.useQuery({ id: leadId });
  const { data: messages } = trpc.leads.listMessages.useQuery({ leadId });
  const { data: quotes } = trpc.leads.listQuotes.useQuery({ leadId });
  const { data: sequences } = trpc.leads.listSequences.useQuery();

  const updateMutation = trpc.leads.update.useMutation({
    onMutate: async (vars) => {
      await utils.leads.get.cancel({ id: leadId });
      const prev = utils.leads.get.getData({ id: leadId });
      if (prev) {
        utils.leads.get.setData({ id: leadId }, {
          ...prev,
          ...(vars.status !== undefined ? { status: vars.status } : {}),
          ...(vars.temperature !== undefined ? { temperature: vars.temperature } : {}),
        });
      }
      return { prev };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) utils.leads.get.setData({ id: leadId }, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => { utils.leads.get.invalidate({ id: leadId }); },
    onSuccess: () => toast.success("Lead updated"),
  });

  const scoreMutation = trpc.leads.scoreWithAI.useMutation({
    onSuccess: r => { utils.leads.get.invalidate({ id: leadId }); toast.success(`Score: ${r.score}/100`); },
    onError: e => toast.error(e.message),
  });

  const generateMutation = trpc.leads.generateCampaign.useMutation({
    onSuccess: () => { utils.leads.listMessages.invalidate({ leadId }); toast.success("Message generated"); },
    onError: e => toast.error(e.message),
  });

  const deleteMessageMutation = trpc.leads.deleteMessage.useMutation({
    onSuccess: () => { utils.leads.listMessages.invalidate({ leadId }); toast.success("Deleted"); },
    onError: e => toast.error(e.message),
  });

  const createQuoteMutation = trpc.leads.createQuote.useMutation({
    onSuccess: () => { utils.leads.listQuotes.invalidate({ leadId }); setShowQuote(false); toast.success("Quote created"); },
    onError: e => toast.error(e.message),
  });

  const deleteQuoteMutation = trpc.leads.deleteQuote.useMutation({
    onSuccess: () => { utils.leads.listQuotes.invalidate({ leadId }); toast.success("Quote deleted"); },
    onError: e => toast.error(e.message),
  });

  const enrollMutation = trpc.leads.enrollLead.useMutation({
    onSuccess: () => { setShowEnroll(false); toast.success("Lead enrolled in drip sequence"); },
    onError: e => toast.error(e.message),
  });

  const convertMutation = trpc.leads.convertToClient.useMutation({
    onSuccess: r => {
      utils.leads.get.invalidate({ id: leadId });
      setShowConvertDialog(false);
      toast.success("Lead converted to client! Redirecting...");
      setTimeout(() => navigate(`/clients/${r.clientId}`), 1500);
    },
    onError: e => toast.error(e.message),
  });

  const followUpMutation = trpc.leads.setFollowUpDate.useMutation({
    onSuccess: () => {
      utils.leads.get.invalidate({ id: leadId });
      setShowFollowUpPicker(false);
      toast.success("Follow-up date set");
    },
    onError: e => toast.error(e.message),
  });

  const exportQuoteCSV = () => {
    if (!quotes?.length) return;
    const rows = [["Title","Devices","Monthly Rate","Setup Fee","Notes","Created"]];
    quotes.forEach(q => rows.push([q.title, String(q.deviceCount ?? ""), String(q.monthlyRate ?? ""), String(q.setupFee ?? ""), q.notes ?? "", new Date(q.createdAt).toLocaleDateString()]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `quote-${lead?.companyName ?? leadId}.csv`; a.click();
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div></DashboardLayout>;
  if (!lead) return <DashboardLayout><div className="p-6 text-muted-foreground">Lead not found</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/leads")}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-2xl font-bold">{lead.companyName}</h1>
              <p className="text-muted-foreground text-sm">{lead.contactName ?? ""} {lead.email ? `· ${lead.email}` : ""} {lead.phone ? `· ${lead.phone}` : ""}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) <= new Date() && lead.status !== "won" && lead.status !== "lost" && (
              <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                <AlertCircle className="h-3 w-3" />Follow-up overdue
              </Badge>
            )}
            <Button size="sm" variant="outline" disabled={scoreMutation.isPending} onClick={() => scoreMutation.mutate({ id: leadId })}>
              {scoreMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Brain className="h-3 w-3 mr-1" />}AI Score
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setFollowUpDate(lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().split("T")[0] : ""); setShowFollowUpPicker(true); }}>
              <Calendar className="h-3 w-3 mr-1" />Follow-Up
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowEnroll(true)}>
              <Play className="h-3 w-3 mr-1" />Enroll in Drip
            </Button>
            {lead.status !== "won" && lead.status !== "lost" && (
              <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => setShowConvertDialog(true)}>
                <UserPlus className="h-3 w-3 mr-1" />Convert to Client
              </Button>
            )}
          </div>
        </div>

        {/* Info + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="sm:col-span-2">
            <CardContent className="py-4 px-5 grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Industry", value: lead.industry },
                { label: "City", value: lead.city },
                { label: "Source", value: lead.source?.replace(/_/g, " ") },
                { label: "Website", value: lead.website },
                { label: "Score", value: lead.score != null ? `${lead.score}/100` : null },
                { label: "Temperature", value: lead.temperature },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value ?? "—"}</p>
                </div>
              ))}
              {lead.notes && <div className="col-span-2"><p className="text-xs text-muted-foreground">Notes</p><p className="text-sm">{lead.notes}</p></div>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 px-5 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={lead.status} onValueChange={v => updateMutation.mutate({ id: leadId, status: v as any })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Temperature</Label>
                <Select value={lead.temperature ?? "cold"} onValueChange={v => updateMutation.mutate({ id: leadId, temperature: v as any })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot"><span className="flex items-center gap-1"><Flame className="h-3 w-3 text-red-500" />Hot</span></SelectItem>
                    <SelectItem value="warm"><span className="flex items-center gap-1"><Thermometer className="h-3 w-3 text-orange-400" />Warm</span></SelectItem>
                    <SelectItem value="cold"><span className="flex items-center gap-1"><Snowflake className="h-3 w-3 text-blue-400" />Cold</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="campaign">
          <TabsList>
            <TabsTrigger value="campaign"><Mail className="h-3.5 w-3.5 mr-1.5" />Campaign Messages</TabsTrigger>
            <TabsTrigger value="quotes"><FileText className="h-3.5 w-3.5 mr-1.5" />Quotes</TabsTrigger>
          </TabsList>

          {/* Campaign Tab */}
          <TabsContent value="campaign" className="space-y-4 mt-4">
            <div className="flex gap-3">
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button disabled={generateMutation.isPending} onClick={() => generateMutation.mutate({ leadId, type: campaignType as any })}>
                {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}Generate with AI
              </Button>
            </div>
            {messages?.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">No messages yet — generate one above</div>}
            {messages?.map(msg => (
              <Card key={msg.id}>
                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{msg.type?.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(msg.body ?? ""); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteMessageMutation.mutate({ id: msg.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <pre className="text-sm whitespace-pre-wrap font-sans">{msg.body}</pre>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button onClick={() => setShowQuote(true)}><Plus className="h-4 w-4 mr-2" />New Quote</Button>
              {(quotes?.length ?? 0) > 0 && <Button variant="outline" onClick={exportQuoteCSV}><Download className="h-4 w-4 mr-2" />Export CSV</Button>}
            </div>
            {quotes?.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">No quotes yet</div>}
            {quotes?.map(q => (
              <Card key={q.id}>
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold">{q.title}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {q.deviceCount != null && <span>{q.deviceCount} devices</span>}
                        {q.monthlyRate != null && <span>${q.monthlyRate}/mo</span>}
                        {q.setupFee != null && <span>Setup: ${q.setupFee}</span>}
                      </div>
                      {q.notes && <p className="text-xs text-muted-foreground">{q.notes}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0" onClick={() => deleteQuoteMutation.mutate({ id: q.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Enroll Dialog */}
        <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
          <DialogContent>
            <DialogHeader><DialogTitle>Enroll in Drip Sequence</DialogTitle></DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">Select a sequence to enroll <strong>{lead.companyName}</strong>. Emails will send automatically based on the sequence schedule.</p>
              <Select value={selectedSeqId} onValueChange={setSelectedSeqId}>
                <SelectTrigger><SelectValue placeholder="Select a sequence..." /></SelectTrigger>
                <SelectContent>
                  {sequences?.filter(s => s.isActive).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  {sequences?.filter(s => s.isActive).length === 0 && <SelectItem value="none" disabled>No active sequences — create one first</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEnroll(false)}>Cancel</Button>
              <Button disabled={!selectedSeqId || selectedSeqId === "none" || enrollMutation.isPending} onClick={() => enrollMutation.mutate({ leadId, sequenceId: Number(selectedSeqId) })}>
                {enrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}Enroll
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quote Dialog */}
        <Dialog open={showQuote} onOpenChange={setShowQuote}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Quote</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5"><Label>Title</Label><Input placeholder="e.g. 500 Laptops — Q3 Staging" value={quoteForm.title} onChange={e => setQuoteForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label>Devices</Label><Input type="number" min={0} value={quoteForm.deviceCount} onChange={e => setQuoteForm(f => ({ ...f, deviceCount: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Monthly Rate</Label><Input type="number" min={0} step="0.01" value={quoteForm.monthlyRate} onChange={e => setQuoteForm(f => ({ ...f, monthlyRate: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Setup Fee</Label><Input type="number" min={0} step="0.01" value={quoteForm.setupFee} onChange={e => setQuoteForm(f => ({ ...f, setupFee: e.target.value }))} /></div>
              </div>

              <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={quoteForm.notes} onChange={e => setQuoteForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuote(false)}>Cancel</Button>
              <Button disabled={!quoteForm.title.trim() || createQuoteMutation.isPending} onClick={() => createQuoteMutation.mutate({ leadId, title: quoteForm.title, deviceCount: quoteForm.deviceCount ? Number(quoteForm.deviceCount) : undefined, monthlyRate: quoteForm.monthlyRate || undefined, setupFee: quoteForm.setupFee || undefined, notes: quoteForm.notes || undefined })}>
                {createQuoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Convert to Client Dialog */}
        <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Convert Lead to Client</DialogTitle></DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">This will create a new client record for <strong>{lead.companyName}</strong> using the lead's contact information, set the lead status to <strong>Won</strong>, and redirect you to the new client profile.</p>
              <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium">{lead.companyName}</span></div>
                {lead.contactName && <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span className="font-medium">{lead.contactName}</span></div>}
                {lead.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{lead.email}</span></div>}
                {lead.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{lead.phone}</span></div>}
              </div>
              <p className="text-xs text-muted-foreground">You can assign a service package and complete onboarding from the client profile.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConvertDialog(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" disabled={convertMutation.isPending} onClick={() => convertMutation.mutate({ id: leadId })}>
                {convertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}Convert to Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Follow-Up Date Picker Dialog */}
        <Dialog open={showFollowUpPicker} onOpenChange={setShowFollowUpPicker}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Set Follow-Up Date</DialogTitle></DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">Schedule a follow-up reminder for <strong>{lead.companyName}</strong>. An overdue badge will appear on the lead when the date passes.</p>
              <div className="space-y-1.5">
                <Label>Follow-Up Date</Label>
                <Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
              {lead.nextFollowUpAt && (
                <p className="text-xs text-muted-foreground">Current: {new Date(lead.nextFollowUpAt).toLocaleDateString()}</p>
              )}
            </div>
            <DialogFooter className="gap-2">
              {lead.nextFollowUpAt && (
                <Button variant="ghost" className="text-destructive" disabled={followUpMutation.isPending} onClick={() => followUpMutation.mutate({ id: leadId, followUpAt: null })}>Clear</Button>
              )}
              <Button variant="outline" onClick={() => setShowFollowUpPicker(false)}>Cancel</Button>
              <Button disabled={!followUpDate || followUpMutation.isPending} onClick={() => followUpMutation.mutate({ id: leadId, followUpAt: followUpDate })}>
                {followUpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}Set Date
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
