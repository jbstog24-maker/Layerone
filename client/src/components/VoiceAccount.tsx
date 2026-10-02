import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { KeyRound, PhoneCall, X, StickyNote, History } from "lucide-react";

const PIN_RE = /^\d{4,6}$/;

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Customer card: set or change the phone PIN Alex asks for on calls. */
export function PhonePinCard() {
  const utils = trpc.useUtils();
  const status = trpc.voice.getPhonePinStatus.useQuery();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentPin, setCurrentPin] = useState("");

  const setPinMutation = trpc.voice.setPhonePin.useMutation({
    onSuccess: async () => {
      await utils.voice.getPhonePinStatus.invalidate();
      setPin("");
      setConfirm("");
      setCurrentPin("");
      toast.success("Phone PIN saved");
    },
    onError: (err) => toast.error(err.message || "Could not save PIN"),
  });

  const handleSave = () => {
    if (!PIN_RE.test(pin)) {
      toast.error("PIN must be 4 to 6 digits");
      return;
    }
    if (pin !== confirm) {
      toast.error("PIN entries do not match");
      return;
    }
    setPinMutation.mutate({
      pin,
      currentPin: status.data?.isSet ? currentPin || undefined : undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" /> Phone PIN for Alex
        </CardTitle>
        <CardDescription>
          When you call in, Alex asks for this PIN (entered on your keypad) before sharing any account information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={status.data?.isSet ? "default" : "outline"}>
            {status.data?.isSet ? "PIN set" : "No PIN set"}
          </Badge>
          {status.data?.isSet && status.data.setAt && (
            <span className="text-xs text-muted-foreground">Set on {formatDateTime(status.data.setAt)}</span>
          )}
        </div>
        {status.data?.isSet && (
          <div className="space-y-2">
            <Label htmlFor="pin-current">Current PIN (to change it)</Label>
            <Input
              id="pin-current"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter current PIN"
              className="max-w-xs"
            />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pin-new">{status.data?.isSet ? "New PIN" : "Choose a PIN"}</Label>
            <Input
              id="pin-new"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="4 to 6 digits"
              className="max-w-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin-confirm">Confirm PIN</Label>
            <Input
              id="pin-confirm"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
              placeholder="Repeat the PIN"
              className="max-w-xs"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={setPinMutation.isPending}>
          {setPinMutation.isPending ? "Saving…" : status.data?.isSet ? "Change PIN" : "Save PIN"}
        </Button>
      </CardContent>
    </Card>
  );
}

/** Dismissible banner prompting customers without a PIN to set one. */
export function PhonePinBanner() {
  const [dismissed, setDismissed] = useState(false);
  const status = trpc.voice.getPhonePinStatus.useQuery(undefined, { retry: false });
  if (dismissed || status.isLoading || status.isError) return null;
  if (status.data?.isSet) return null;
  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <PhoneCall className="h-5 w-5 text-amber-400 shrink-0" />
      <p className="text-sm flex-1">
        <span className="font-semibold">Set a phone PIN</span> so Alex can verify you and help with your account when you call in.{" "}
        <a href="/account" className="underline underline-offset-2">Set it up in Account Settings</a>.
      </p>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const AUTHOR_LABELS: Record<string, string> = {
  alex: "Alex",
  admin: "Staff",
  customer: "You",
  system: "System",
};

/** Customer timeline of account notes and changes (their own data only). */
export function MyActivityTimeline() {
  const { data: items, isLoading } = trpc.voice.getMyActivity.useQuery();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" /> My Activity
        </CardTitle>
        <CardDescription>Notes and changes on your account, including phone calls with Alex.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex gap-3">
                <div className="mt-1 shrink-0">
                  {item.kind === "note" ? (
                    <StickyNote className="h-4 w-4 text-sky-400" />
                  ) : (
                    <History className="h-4 w-4 text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {AUTHOR_LABELS[item.author] ?? item.author}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap break-words">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
