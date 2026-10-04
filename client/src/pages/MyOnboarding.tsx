import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ClipboardCheck, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

// ─── Customer-facing onboarding page ──────────────────────────────────────────
// Read-only view of the customer's own onboarding checklist progress.
export default function MyOnboarding() {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError } = trpc.onboarding.myChecklist.useQuery();

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

        {isLoading && (
          <Card className="bg-[#0d1f35] border-[#1e3a5f]">
            <CardContent className="flex items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Loading your checklist...</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && (isError || !data) && (
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
        )}

        {!isLoading && data && (
          <div className="space-y-6">
            {/* Progress summary */}
            <Card className="bg-[#0d1f35] border-[#1e3a5f]">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">
                    Onboarding progress
                  </p>
                  <p className="text-sm text-slate-400">{data.progress}% complete</p>
                </div>
                <Progress value={data.progress} className="h-2" />
                <p className="text-xs text-slate-500 capitalize">
                  Status: {data.checklist.status.replace("_", " ")}
                </p>
              </CardContent>
            </Card>

            {/* Task list (read-only) */}
            <Card className="bg-[#0d1f35] border-[#1e3a5f]">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-white mb-4">Checklist</p>
                <ul className="space-y-3">
                  {data.tasks.map((task: any) => {
                    const done = Boolean(task.completedAt);
                    return (
                      <li key={task.id} className="flex items-start gap-3">
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-sm ${done ? "text-slate-400 line-through" : "text-white"}`}>
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="text-xs text-slate-500 mt-0.5">{task.notes}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {data.tasks.length === 0 && (
                  <p className="text-sm text-slate-500">No tasks on this checklist yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
