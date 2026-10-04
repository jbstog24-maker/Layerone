import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";
import { useLocation } from "wouter";

// ─── Customer-facing onboarding page ──────────────────────────────────────────
// There is currently no client-scoped onboarding query on the server (all
// onboarding procedures require a staff or admin role), so this page shows a
// graceful empty state. If a customer-visible onboarding endpoint is added
// later, the read-only checklist progress display belongs here.
export default function MyOnboarding() {
  const [, setLocation] = useLocation();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-blue-400" />
            My Onboarding
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your onboarding progress as the Layer One team brings your account online.
          </p>
        </div>

        {/* Graceful empty state */}
        <Card className="bg-[#0d1f35] border-[#1e3a5f]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <ClipboardCheck className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium text-white">No onboarding checklist yet</p>
            <p className="text-sm text-center max-w-sm">
              Your onboarding checklist will appear here once the Layer One team starts
              your setup. If you believe this is a mistake, send us a message and we will
              look into it.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/support-messages")}
              className="border-[#1e3a5f] text-slate-300 hover:text-white mt-2"
            >
              Contact the Layer One Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
