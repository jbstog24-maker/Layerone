import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  LifeBuoy, Plus, Clock, CheckCircle2, AlertCircle, ChevronRight,
  MessageSquare, Send, Lock, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const CATEGORY_LABELS: Record<string, string> = {
  billing: "Billing", shipping: "Shipping", staging: "Staging",
  account: "Account", technical: "Technical", general: "General",
};
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  normal: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low: "bg-muted text-muted-foreground border-border",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  waiting_on_client: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  resolved: "bg-green-500/10 text-green-400 border-green-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};
const STATUS_LABELS: Record<string, string> = {
  open: "Open", in_progress: "In Progress", waiting_on_client: "Waiting on You",
  resolved: "Resolved", closed: "Closed",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "resolved" || status === "closed") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (status === "open") return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  return <Clock className="w-4 h-4 text-blue-400" />;
}

export default function SupportTickets() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const isStaff = user?.role === "admin" || user?.role === "staff";

  const { data: tickets = [], isLoading } = trpc.support.list.useQuery({});
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  // New ticket form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [priority, setPriority] = useState<string>("normal");
  const [description, setDescription] = useState("");

  const createMut = trpc.support.create.useMutation({
    onSuccess: () => {
      toast.success("Ticket submitted — our team will respond shortly.");
      setShowNew(false);
      setSubject(""); setCategory("general"); setPriority("normal"); setDescription("");
      utils.support.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.support.update.useMutation({
    onSuccess: () => {
      toast.success("Ticket updated.");
      utils.support.list.invalidate();
      utils.support.get.invalidate({ id: selectedId! });
    },
    onError: (e) => toast.error(e.message),
  });

  const replyMut = trpc.support.reply.useMutation({
    onSuccess: () => {
      setReplyBody("");
      utils.support.get.invalidate({ id: selectedId! });
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: ticketDetail } = trpc.support.get.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null }
  );

  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress" || t.status === "waiting_on_client");
  const closedTickets = tickets.filter(t => t.status === "resolved" || t.status === "closed");

  function TicketRow({ ticket }: { ticket: typeof tickets[0] }) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors border border-transparent hover:border-border/50"
        onClick={() => setSelectedId(ticket.id)}
      >
        <StatusIcon status={ticket.status} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {CATEGORY_LABELS[ticket.category]} · {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[ticket.priority]}`}>
            {ticket.priority}
          </Badge>
          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[ticket.status]}`}>
            {STATUS_LABELS[ticket.status]}
          </Badge>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Support Tickets</h1>
              <p className="text-xs text-muted-foreground">Submit and track support requests</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> New Ticket
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: ticket list */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <Card className="bg-card/60 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <LifeBuoy className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium">No tickets yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "New Ticket" to submit a support request</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {openTickets.length > 0 && (
                  <Card className="bg-card/60 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Open ({openTickets.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {openTickets.map(t => <TicketRow key={t.id} ticket={t} />)}
                    </CardContent>
                  </Card>
                )}
                {closedTickets.length > 0 && (
                  <Card className="bg-card/60 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Resolved / Closed ({closedTickets.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {closedTickets.map(t => <TicketRow key={t.id} ticket={t} />)}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Right: ticket detail / replies */}
          <div>
            {selectedId && ticketDetail ? (
              <Card className="bg-card/60 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm leading-tight">{ticketDetail.ticket.subject}</CardTitle>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[ticketDetail.ticket.status]}`}>
                          {STATUS_LABELS[ticketDetail.ticket.status]}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[ticketDetail.ticket.priority]}`}>
                          {ticketDetail.ticket.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[ticketDetail.ticket.category]}</span>
                      </div>
                    </div>
                    {isStaff && (
                      <Select
                        value={ticketDetail.ticket.status}
                        onValueChange={(v) => updateMut.mutate({ id: ticketDetail.ticket.id, status: v as any })}
                      >
                        <SelectTrigger className="w-36 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Original description */}
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      {ticketDetail.ticket.submittedByName} · {new Date(ticketDetail.ticket.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{ticketDetail.ticket.description}</p>
                  </div>

                  {/* Replies */}
                  {ticketDetail.replies.length > 0 && (
                    <div className="space-y-2">
                      {ticketDetail.replies.map(reply => {
                        const isStaffReply = reply.senderRole === "admin" || reply.senderRole === "staff";
                        return (
                          <div
                            key={reply.id}
                            className={`p-3 rounded-lg border text-sm ${
                              reply.isInternal
                                ? "bg-yellow-500/5 border-yellow-500/20"
                                : isStaffReply
                                  ? "bg-primary/5 border-primary/20"
                                  : "bg-muted/20 border-border/50"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-xs font-medium">{reply.senderName}</span>
                              {isStaffReply && <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">NSDS</Badge>}
                              {reply.isInternal && <Lock className="w-3 h-3 text-yellow-400" />}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {new Date(reply.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{reply.body}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reply box */}
                  {ticketDetail.ticket.status !== "closed" && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyBody}
                        onChange={e => setReplyBody(e.target.value)}
                        rows={3}
                        className="text-sm resize-none"
                      />
                      <div className="flex items-center justify-between">
                        {isStaff && (
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isInternal}
                              onChange={e => setIsInternal(e.target.checked)}
                              className="rounded"
                            />
                            <Lock className="w-3 h-3" /> Internal note
                          </label>
                        )}
                        <Button
                          size="sm"
                          className="ml-auto"
                          disabled={!replyBody.trim() || replyMut.isPending}
                          onClick={() => replyMut.mutate({ ticketId: selectedId, body: replyBody, isInternal })}
                        >
                          {replyMut.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span className="ml-1.5">Send</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/60 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Select a ticket to view details and replies</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit a Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Subject <span className="text-red-400">*</span></Label>
              <Input
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-red-400">*</span></Label>
              <Textarea
                placeholder="Describe your issue in detail. Include any relevant order numbers, device serial numbers, or error messages."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{description.length} chars</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button
              disabled={!subject.trim() || !description.trim() || description.length < 10 || createMut.isPending}
              onClick={() => createMut.mutate({ subject, category: category as any, priority: priority as any, description })}
            >
              {createMut.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
