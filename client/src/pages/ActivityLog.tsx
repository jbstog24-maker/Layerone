import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, LoadingRows } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity } from "lucide-react";

export default function ActivityLog() {
  const { data: logs, isLoading } = trpc.activity.list.useQuery({ limit: 100 });

  const entityColor: Record<string, string> = {
    delivery: "bg-blue-500",
    receiving_log: "bg-cyan-500",
    pallet: "bg-green-500",
    box: "bg-teal-500",
    device: "bg-violet-500",
    staging_task: "bg-yellow-500",
    shipment: "bg-orange-500",
    invoice: "bg-pink-500",
    client: "bg-indigo-500",
    user: "bg-red-500",
  };

  return (
    <DashboardLayout>
      <PageHeader title="Activity Log" subtitle="Full audit trail of all operations" />
      <Card className="bg-card/60 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={3} /> : logs?.length === 0 ? (
                <tr><td colSpan={3}><EmptyState icon={Activity} title="No activity yet" /></td></tr>
              ) : logs?.map((log) => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${entityColor[log.entityType ?? ""] ?? "bg-muted-foreground"}`} />
                      <p className="text-sm">{log.action}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground capitalize">
                      {log.entityType?.replace(/_/g, " ") ?? "system"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
