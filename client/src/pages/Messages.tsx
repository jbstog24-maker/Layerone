import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageSquare, Search, User, Building2, Send, RefreshCw, Circle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

function formatRelativeTime(date: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function isStaffMsg(role: string) {
  return role === "admin" || role === "staff";
}

export default function Messages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdminOrStaff = user?.role === "admin" || user?.role === "staff";

  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Deep link: /messages?client=<id> preselects that client's thread
  // (used by the admin Action Center alerts).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("client");
    if (fromUrl) {
      const id = parseInt(fromUrl, 10);
      if (Number.isFinite(id)) setSelectedClientId(id);
    }
  }, []);

  // Thread list
  const { data: threads = [], isLoading: threadsLoading, isError: threadsError, refetch: refetchThreads } = trpc.messages.threads.useQuery(
    undefined,
    { refetchInterval: 15_000 },
  );

  // Active thread messages
  const { data: messages = [], isLoading: msgsLoading, isError: msgsError, refetch: refetchMsgs } =
    trpc.messages.list.useQuery(
      { clientId: selectedClientId! },
      { enabled: selectedClientId !== null, refetchInterval: 10_000 },
    );

  const sendMsg = trpc.messages.send.useMutation({
    onSuccess: () => {
      setBody("");
      utils.messages.list.invalidate({ clientId: selectedClientId! });
      utils.messages.threads.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const markRead = trpc.messages.markRead.useMutation({
    onSuccess: () => {
      utils.messages.threads.invalidate();
    },
  });

  // Mark as read when thread is opened
  useEffect(() => {
    if (selectedClientId !== null && messages.length > 0) {
      markRead.mutate({ clientId: selectedClientId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed || sendMsg.isPending || selectedClientId === null) return;
    sendMsg.mutate({ clientId: selectedClientId, body: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredThreads = threads.filter((t) => {
    const matchSearch =
      !search ||
      t.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (t.contactName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchUnread = !unreadOnly || t.unreadCount > 0;
    return matchSearch && matchUnread;
  });

  const selectedThread = threads.find((t) => t.clientId === selectedClientId);
  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  if (!isAdminOrStaff) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Access restricted to admin and staff.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Messages"
        subtitle={totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? "s" : ""}` : "All client conversations"}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refetchThreads(); if (selectedClientId) refetchMsgs(); }}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        }
      />

      <div className="flex gap-4 h-[calc(100vh-11rem)]">
        {/* Thread list panel */}
        <div className="w-80 shrink-0 flex flex-col gap-2">
          {/* Search + filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients…"
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              variant={unreadOnly ? "default" : "outline"}
              className="h-8 px-2.5 text-xs shrink-0"
              onClick={() => setUnreadOnly((v) => !v)}
            >
              Unread
              {totalUnread > 0 && (
                <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-primary/20 text-primary border-0">
                  {totalUnread}
                </Badge>
              )}
            </Button>
          </div>

          {/* Thread rows */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
            {threadsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
              ))
            ) : threadsError ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <MessageSquare className="w-8 h-8 text-destructive/40 mb-2" />
                <p className="text-sm text-muted-foreground">Could not load threads</p>
                <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => refetchThreads()}>Retry</Button>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search || unreadOnly ? "No matching threads" : "No messages yet"}
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = selectedClientId === thread.clientId;
                const fromClient = !isStaffMsg(thread.latestSenderRole ?? "");
                return (
                  <button
                    key={thread.clientId}
                    onClick={() => setSelectedClientId(thread.clientId)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/40 hover:border-primary/30 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-xs font-bold text-blue-300">
                        {thread.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-sm truncate ${thread.unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                            {thread.companyName}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatRelativeTime(thread.latestAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {fromClient ? "" : "You: "}
                            {thread.latestBody?.slice(0, 50) ?? ""}
                          </p>
                          {thread.unreadCount > 0 && (
                            <span className="shrink-0 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                              {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message thread panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedClientId === null ? (
            <Card className="flex-1 bg-card/40 border-border/40 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Select a conversation</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Choose a client thread from the left to start messaging.</p>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 bg-card/60 border-border/50 flex flex-col overflow-hidden">
              {/* Thread header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-300">
                    {selectedThread?.companyName.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selectedThread?.companyName}</p>
                    {selectedThread?.contactName && (
                      <p className="text-xs text-muted-foreground">{selectedThread.contactName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{selectedThread?.totalMessages ?? 0} messages</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => setLocation(`/clients/${selectedClientId}`)}
                  >
                    <Building2 className="w-3 h-3" />
                    View Profile
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {msgsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : msgsError ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-8 h-8 text-destructive/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Could not load messages</p>
                    <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => refetchMsgs()}>Retry</Button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Send the first message below.</p>
                  </div>
                ) : (
                  (messages as any[]).map((msg) => {
                    const fromStaff = isStaffMsg(msg.senderRole);
                    const isOwn = fromStaff; // staff is always "own" in this view
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          fromStaff ? "bg-blue-500/20 text-blue-300" : "bg-slate-500/20 text-slate-300"
                        }`}>
                          {fromStaff ? <User className="w-3.5 h-3.5" /> : msg.senderName?.charAt(0)?.toUpperCase() ?? "C"}
                        </div>
                        <div className={`max-w-[70%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                          <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${isOwn ? "flex-row-reverse" : ""}`}>
                            <span className="font-medium">{msg.senderName}</span>
                            <span>·</span>
                            <span>{new Date(msg.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                            {msg.readAt && isOwn && <span className="text-blue-400/60 text-[10px]">✓ Read</span>}
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
              <div className="border-t border-border/30 p-3 flex gap-2 items-end shrink-0">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply to client… (Enter to send, Shift+Enter for new line)"
                  className="resize-none min-h-[60px] max-h-32 text-sm bg-background/50"
                  rows={2}
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!body.trim() || sendMsg.isPending || selectedClientId === null}
                  className="h-10 px-3 shrink-0"
                >
                  {sendMsg.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
