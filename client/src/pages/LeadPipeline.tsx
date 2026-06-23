import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Flame, Thermometer, Snowflake, Kanban } from "lucide-react";

const COLUMNS = [
  { key: "new", label: "New", color: "bg-blue-500" },
  { key: "contacted", label: "Contacted", color: "bg-purple-500" },
  { key: "qualified", label: "Qualified", color: "bg-cyan-500" },
  { key: "demo_scheduled", label: "Demo Scheduled", color: "bg-indigo-500" },
  { key: "proposal_sent", label: "Proposal Sent", color: "bg-orange-500" },
  { key: "negotiating", label: "Negotiating", color: "bg-yellow-500" },
  { key: "follow_up", label: "Follow Up", color: "bg-pink-500" },
  { key: "won", label: "Won", color: "bg-green-500" },
  { key: "lost", label: "Lost", color: "bg-red-500" },
  { key: "on_hold", label: "On Hold", color: "bg-gray-400" },
  { key: "unqualified", label: "Unqualified", color: "bg-slate-400" },
];

function TempIcon({ temp }: { temp?: string | null }) {
  if (temp === "hot") return <Flame className="h-3 w-3 text-red-500" />;
  if (temp === "warm") return <Thermometer className="h-3 w-3 text-orange-400" />;
  return <Snowflake className="h-3 w-3 text-blue-400" />;
}

export default function LeadPipeline() {
  const [, navigate] = useLocation();
  const { data: leads, isLoading } = trpc.leads.list.useQuery({});

  const byStatus = (status: string) => leads?.filter(l => l.status === status) ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Kanban className="h-6 w-6 text-primary" />Pipeline</h1>
          <p className="text-muted-foreground mt-1">Visual overview of all leads by stage. Click any card to open the lead.</p>
        </div>

        {isLoading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>}

        {!isLoading && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {COLUMNS.map(col => {
                const colLeads = byStatus(col.key);
                return (
                  <div key={col.key} className="w-56 flex-shrink-0 space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <div className={`h-2 w-2 rounded-full ${col.color}`} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{col.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{colLeads.length}</span>
                    </div>
                    <div className="space-y-2 min-h-[120px]">
                      {colLeads.map(lead => (
                        <Card
                          key={lead.id}
                          className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-sm"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          <CardContent className="py-2.5 px-3 space-y-1.5">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-sm font-medium leading-tight line-clamp-2">{lead.companyName}</p>
                              <TempIcon temp={lead.temperature} />
                            </div>
                            {lead.contactName && <p className="text-xs text-muted-foreground truncate">{lead.contactName}</p>}
                            <div className="flex items-center gap-1.5">
                              {lead.industry && <span className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[80px]">{lead.industry}</span>}
                              {lead.score != null && (
                                <span className={`text-xs font-bold ml-auto ${lead.score >= 70 ? "text-green-600" : lead.score >= 40 ? "text-orange-500" : "text-muted-foreground"}`}>
                                  {lead.score}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {colLeads.length === 0 && (
                        <div className="h-16 border-2 border-dashed rounded-lg flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Empty</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
