import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Mail, Phone, LogOut, ListChecks } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import InfoTip from "@/components/InfoTip";

export default function PendingApproval() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Account Pending Approval</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            Your account has been created successfully. A Layer One team member will review and approve your access shortly.
          </p>
        </div>

        {/* Status card */}
        <Card className="bg-card/60 border-border/50">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
              <Clock className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Awaiting admin approval</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your account isn't linked to an approved client record yet. You will receive an email once access is granted.
                </p>
              </div>
            </div>

            {user?.name && (
              <div className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user.name}</span>
                {user.email && <span> ({user.email})</span>}
              </div>
            )}

            {/* What do I need to do? */}
            <div className="border-t border-border/50 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  What do I need to do?
                </p>
                <InfoTip title="Why am I seeing this?">
                  Customer accounts must be linked to a client record before the
                  portal opens up. Nothing is wrong with your sign-in — this is
                  just the approval step.
                </InfoTip>
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground list-none">
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span><span className="text-foreground font-medium">Wait for approval</span> — a Layer One team member links your account to your company's client record.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span><span className="text-foreground font-medium">Watch your email</span> — you'll get a message at {user?.email ?? "your email address"} once access is granted.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span><span className="text-foreground font-medium">Sign in again</span> — you'll land on your dashboard with messages, documents, and onboarding.</span>
                </li>
              </ol>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Need help? Contact Layer One</p>
              <div className="space-y-2">
                <a
                  href="mailto:info@layeronestaging.com"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  info@layeronestaging.com
                </a>
                <a
                  href="tel:+14695374378"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Phone className="w-4 h-4" />
                  +1 (469) 537-4378
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign out */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
