import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  TicketCheck, Search, MessageSquare, Clock, AlertTriangle,
  CheckCircle2, XCircle, RefreshCw, ChevronRight, Send, Lock
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  waiting_on_client: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400",
  normal: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <Clock className="w-3.5 h-3.5" />,
  in_progress: <RefreshCw className="w-3.5 h-3.5" />,
  waiting_on_client: <MessageSquare className="w-3.5 h-3.5" />,
  resolved: <CheckCircle2 className="w-3.5 h-3.5" />,
  closed: <XCircle className="w-3.5 h-3.5" />,
};

export default function AdminTickets() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const utils = trpc.useUtils();

  const { data: tickets = [], isLoading } = trpc.support.list.useQuery({});

  const { data: ticketDetail, isLoading: detailLoading } = trpc.support.get.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null }
  );

  const updateMut = trpc.support.update.useMutation({
    onSuccess: () => {
      utils.support.list.invalidate();
      utils.support.get.invalidate({ id: selectedId! });
      toast.success("Ticket updated");
    },
  });

  const replyMut = trpc.support.reply.useMutation({
    onSuccess: () => {
      utils.support.get.invalidate({ id: selectedId! });
      utils.support.list.invalidate();
      setReplyBody("");
      toast.success("Reply sent");
    },
  });

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.submittedByName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCount = tickets.filter(t => t.status === "open").length;
  const urgentCount = tickets.filter(t => t.priority === "urgent" && t.status !== "closed" && t.status !== "resolved").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  const handleStatusChange = (status: string) => {
    if (!selectedId) return;
    updateMut.mutate({ id: selectedId, status: status as any });
  };

  const handleReply = () => {
    if (!selectedId || !replyBody.trim()) return;
    replyMut.mutate({ ticketId: selectedId, body: replyBody.trim(), isInternal });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TicketCheck className="w-7 h-7 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
            <p className="text-sm text-slate-400">Manage and respond to client support requests</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open", value: openCount, color: "text-blue-400", icon: <Clock className="w-4 h-4" /> },
          { label: "Urgent", value: urgentCount, color: "text-red-400", icon: <AlertTriangle className="w-4 h-4" /> },
          { label: "In Progress", value: inProgressCount, color: "text-yellow-400", icon: <RefreshCw className="w-4 h-4" /> },
          { label: "Resolved", value: resolvedCount, color: "text-green-400", icon: <CheckCircle2 className="w-4 h-4" /> },
        ].map(stat => (
          <Card key={stat.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <span className={stat.color}>{stat.icon}</span>
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main layout: list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ticket list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_on_client">Waiting on Client</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ticket list */}
          <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Loading tickets...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No tickets found</div>
            ) : filtered.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => setSelectedId(ticket.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === ticket.id
                    ? "bg-blue-500/10 border-blue-500/40"
                    : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-white truncate flex-1">{ticket.subject}</p>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs px-1.5 py-0 border ${STATUS_COLORS[ticket.status] ?? ""}`}>
                    <span className="flex items-center gap-1">
                      {STATUS_ICONS[ticket.status]}
                      {ticket.status.replace("_", " ")}
                    </span>
                  </Badge>
                  <Badge className={`text-xs px-1.5 py-0 ${PRIORITY_COLORS[ticket.priority] ?? ""}`}>
                    {ticket.priority}
                  </Badge>
                  <span className="text-xs text-slate-500 ml-auto">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">By {ticket.submittedByName}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Ticket detail */}
        <div className="lg:col-span-3">
          {!selectedId ? (
            <Card className="bg-slate-800/30 border-slate-700 h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center text-slate-500">
                <TicketCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a ticket to view details</p>
              </div>
            </Card>
          ) : detailLoading ? (
            <Card className="bg-slate-800/30 border-slate-700 h-full flex items-center justify-center min-h-[400px]">
              <p className="text-slate-400">Loading...</p>
            </Card>
          ) : ticketDetail ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{ticketDetail.ticket.subject}</CardTitle>
                    <p className="text-xs text-slate-400 mt-1">
                      Submitted by {ticketDetail.ticket.submittedByName} · {new Date(ticketDetail.ticket.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-xs border ${STATUS_COLORS[ticketDetail.ticket.status] ?? ""}`}>
                      {ticketDetail.ticket.status.replace("_", " ")}
                    </Badge>
                    <Badge className={`text-xs ${PRIORITY_COLORS[ticketDetail.ticket.priority] ?? ""}`}>
                      {ticketDetail.ticket.priority}
                    </Badge>
                  </div>
                </div>
                {/* Status changer */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-slate-400">Change status:</span>
                  {["open", "in_progress", "waiting_on_client", "resolved", "closed"].map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={ticketDetail.ticket.status === s || updateMut.isPending}
                      className={`text-xs px-2 py-1 rounded border transition-all ${
                        ticketDetail.ticket.status === s
                          ? "bg-blue-500/20 border-blue-500/40 text-blue-300 cursor-default"
                          : "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white"
                      }`}
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Original description */}
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1 font-medium">Original Request</p>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{ticketDetail.ticket.description}</p>
                </div>

                <Separator className="bg-slate-700" />

                {/* Reply thread */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {ticketDetail.replies.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">No replies yet</p>
                  ) : ticketDetail.replies.map((reply: any) => (
                    <div
                      key={reply.id}
                      className={`rounded-lg p-3 ${
                        reply.isInternal
                          ? "bg-yellow-500/10 border border-yellow-500/20"
                          : reply.senderRole === "admin" || reply.senderRole === "staff"
                          ? "bg-blue-500/10 border border-blue-500/20"
                          : "bg-slate-700/50 border border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white flex items-center gap-1.5">
                          {reply.isInternal && <Lock className="w-3 h-3 text-yellow-400" />}
                          {reply.senderName}
                          <span className="text-slate-400 font-normal">({reply.senderRole})</span>
                        </span>
                        <span className="text-xs text-slate-500">{new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap">{reply.body}</p>
                    </div>
                  ))}
                </div>

                <Separator className="bg-slate-700" />

                {/* Reply composer */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white min-h-[80px] resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="internal"
                        checked={isInternal}
                        onCheckedChange={setIsInternal}
                      />
                      <Label htmlFor="internal" className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        Internal note (not visible to client)
                      </Label>
                    </div>
                    <Button
                      onClick={handleReply}
                      disabled={!replyBody.trim() || replyMut.isPending}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      {replyMut.isPending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
