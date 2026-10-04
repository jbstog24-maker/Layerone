import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageSquare, Send, User } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SupportMessages() {
  const { user } = useAuth();
  const clientId = (user as any)?.clientId as number | undefined;
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: messages = [], isLoading, isError, refetch } = trpc.messages.list.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId, refetchInterval: 60_000 },
  );

  const sendMsg = trpc.messages.send.useMutation({
    onSuccess: () => {
      setBody("");
      utils.messages.list.invalidate({ clientId: clientId! });
      utils.messages.myUnread.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const markRead = trpc.messages.markRead.useMutation({
    onSuccess: () => utils.messages.myUnread.invalidate(),
  });

  // Mark staff messages as read when page loads or new messages arrive
  useEffect(() => {
    if (clientId && messages.length > 0) {
      markRead.mutate({ clientId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed || sendMsg.isPending || !clientId) return;
    sendMsg.mutate({ clientId, body: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!clientId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Your account is not linked to a client. Please contact support.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4 h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Support Messages</h1>
            <p className="text-sm text-muted-foreground">Chat directly with the Layer One team</p>
          </div>
        </div>

        {/* Thread card */}
        <Card className="flex-1 bg-card/60 border-border/50 flex flex-col overflow-hidden">
          <CardHeader className="px-4 py-3 border-b border-border/30 shrink-0">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Layer One Support Team
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto px-4 py-3 space-y-3 p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full py-12">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <MessageSquare className="w-8 h-8 text-destructive/40 mb-2" />
                <p className="text-sm text-muted-foreground">Could not load messages</p>
                <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <MessageSquare className="w-10 h-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Send a message below and the Layer One team will reply shortly.
                </p>
              </div>
            ) : (
              <div className="px-4 py-3 space-y-3">
                {(messages as any[]).map((msg) => {
                  const fromStaff = msg.senderRole === "admin" || msg.senderRole === "staff";
                  const isOwn = !fromStaff; // customer's own messages on the right
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        fromStaff ? "bg-blue-500/20 text-blue-300" : "bg-slate-500/20 text-slate-300"
                      }`}>
                        {fromStaff ? <User className="w-3.5 h-3.5" /> : (user?.name?.charAt(0)?.toUpperCase() ?? "C")}
                      </div>
                      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                        <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${isOwn ? "flex-row-reverse" : ""}`}>
                          <span className="font-medium">{fromStaff ? msg.senderName : "You"}</span>
                          <span>·</span>
                          <span>{new Date(msg.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isOwn
                            ? "bg-primary/20 text-foreground rounded-tr-sm"
                            : "bg-muted/50 text-foreground rounded-tl-sm"
                        }`}>
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </CardContent>

          {/* Composer */}
          <div className="border-t border-border/30 p-3 flex gap-2 items-end shrink-0">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
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
        </Card>
      </div>
    </DashboardLayout>
  );
}
