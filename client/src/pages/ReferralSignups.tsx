import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Gift, Inbox, RefreshCw, Calendar, Mail, Phone, Building2 } from "lucide-react";

type ReferralSignup = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  plan: string | null;
  createdAt: Date | string;
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Gift className="w-7 h-7 text-slate-500" />
      </div>
      <p className="text-slate-300 font-medium mb-1">No referral signups yet</p>
      <p className="text-slate-500 text-sm max-w-xs">
        When someone signs up as a referrer from the public referral page, they'll appear here.
      </p>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-white/5">
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-white/8 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function ReferralSignups() {
  const { data: signups = [], isLoading, isError, refetch } = trpc.referral.listSignups.useQuery(
    undefined,
    { refetchInterval: 30_000 }
  );

  const rows = signups as ReferralSignup[];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-100">Referral Signups</h1>
              {!isLoading && rows.length > 0 && (
                <span className="inline-flex items-center justify-center px-2.5 h-6 rounded-full bg-[#6ee7b7]/15 border border-[#6ee7b7]/30 text-[#6ee7b7] text-xs font-bold">
                  {rows.length}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">
              People who signed up for the referral program from the public site.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/15 text-slate-300 hover:bg-white/8 shrink-0"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed Up</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <LoadingRows />
                ) : isError ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-slate-300 font-medium mb-1">Couldn't load signups</p>
                        <p className="text-slate-500 text-sm">Please try refreshing.</p>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  rows.map(s => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-100">{s.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${s.email}`} className="text-sm text-[#0A84FF] hover:underline flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {s.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {s.phone ? (
                          <a href={`tel:${s.phone}`} className="text-sm text-slate-200 hover:text-white flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {s.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.company ? (
                          <span className="text-sm text-slate-300 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {s.company}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.plan ? (
                          <span className="text-xs text-slate-300 max-w-[240px] block truncate" title={s.plan}>
                            {s.plan}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(s.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && !isError && rows.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/6 bg-white/2">
              <p className="text-xs text-slate-500">
                Showing {rows.length} {rows.length === 1 ? "signup" : "signups"}
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Inbox className="w-3.5 h-3.5" />
          The public signup page lives at{" "}
          <a href="/referral-signup" className="text-[#0A84FF] hover:underline">/referral-signup</a>
        </p>
      </div>
    </DashboardLayout>
  );
}
