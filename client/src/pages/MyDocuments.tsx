import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileSignature,
  FileText,
  Send,
  XCircle,
} from "lucide-react";

// Layer One Staging Solutions logo URL
const LAYERONE_LOGO_URL = "/images/layerone-logo-on-dark.png";

const DOC_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  sent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  viewed: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  signed: "bg-green-500/20 text-green-300 border-green-500/30",
  approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  expired: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

const DOC_STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <FileText className="w-3 h-3" />,
  sent: <Send className="w-3 h-3" />,
  viewed: <Eye className="w-3 h-3" />,
  signed: <FileSignature className="w-3 h-3" />,
  approved: <CheckCircle className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />,
  expired: <Clock className="w-3 h-3" />,
};

function DocStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`text-xs gap-1 ${DOC_STATUS_COLORS[status] ?? "bg-slate-500/20 text-slate-300"}`}>
      {DOC_STATUS_ICONS[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

type ClientDoc = {
  id: number;
  name: string;
  status: string;
  sentToEmail: string | null;
  sentAt: Date | string | null;
  signedAt: Date | string | null;
  signedByName: string | null;
  expiresAt: Date | string | null;
  signedFileUrl: string | null;
  notes: string | null;
};

// ─── Read-only document detail modal (no status update controls) ──────────────
function DocumentDetailModal({ doc, onClose }: { doc: ClientDoc | null; onClose: () => void }) {
  if (!doc) return null;

  return (
    <Dialog open={!!doc} onOpenChange={onClose}>
      <DialogContent className="bg-[#0d1f35] border-[#1e3a5f] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            {doc.name}
          </DialogTitle>
        </DialogHeader>

        {/* Layer One Logo Header */}
        <div className="bg-[#07111f] border border-[#1e3a5f] rounded-lg p-4 flex items-center gap-4">
          <img src={LAYERONE_LOGO_URL} alt="Layer One Staging Solutions" className="w-40 flex-shrink-0 object-contain" />
          <div className="text-xs text-slate-400 border-l border-[#1e3a5f] pl-4">
            <p className="font-semibold text-white text-sm">{doc.name}</p>
            <p className="mt-1">Status: <DocStatusBadge status={doc.status} /></p>
            {doc.sentAt && <p>Sent: {new Date(doc.sentAt).toLocaleDateString()}</p>}
            {doc.signedAt && <p>Signed: {new Date(doc.signedAt).toLocaleDateString()}</p>}
            {doc.expiresAt && <p>Expires: {new Date(doc.expiresAt).toLocaleDateString()}</p>}
          </div>
        </div>

        {/* Document details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {doc.sentToEmail && (
            <div><span className="text-slate-400">Sent To:</span> <span className="text-white break-all">{doc.sentToEmail}</span></div>
          )}
          {doc.signedByName && (
            <div><span className="text-slate-400">Signed By:</span> <span className="text-white">{doc.signedByName}</span></div>
          )}
          {doc.notes && (
            <div className="col-span-2"><span className="text-slate-400">Notes:</span> <span className="text-white">{doc.notes}</span></div>
          )}
        </div>

        {/* File download */}
        {doc.signedFileUrl ? (
          <a href={doc.signedFileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm underline">
            <Download className="w-4 h-4" /> View / Download Document
          </a>
        ) : (
          <p className="text-xs text-slate-500 italic">No signed file is attached to this document yet.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#1e3a5f] text-slate-300">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MyDocuments() {
  const { user } = useAuth();
  const clientId = (user as any)?.clientId as number | undefined;
  const [previewDoc, setPreviewDoc] = useState<ClientDoc | null>(null);

  const { data: docs = [], isLoading } = trpc.documents.clientDocs.list.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId }
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-400" />
            My Documents
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Your agreements, MSAs, and signed documents from Layer One Staging. Read-only.
          </p>
        </div>

        {!clientId ? (
          <Card className="bg-[#0d1f35] border-[#1e3a5f]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <FileSignature className="w-12 h-12 opacity-30" />
              <p className="text-lg font-medium">No documents available yet</p>
              <p className="text-sm text-center max-w-sm">
                Your account is not linked to a client record yet. Once your account is approved
                and documents are shared with you, they will appear here.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-xl bg-[#0d1f35]" />)}
          </div>
        ) : docs.length === 0 ? (
          <Card className="bg-[#0d1f35] border-[#1e3a5f]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <FileSignature className="w-12 h-12 opacity-30" />
              <p className="text-lg font-medium">No documents yet</p>
              <p className="text-sm text-center max-w-sm">
                When the Layer One team shares an agreement or MSA with your company,
                it will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(docs as ClientDoc[]).map((doc) => (
              <Card key={doc.id} className="bg-[#0d1f35] border-[#1e3a5f] hover:border-blue-500/40 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <span className="text-white font-medium text-sm truncate">{doc.name}</span>
                    </div>
                    <DocStatusBadge status={doc.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {doc.sentAt && <div><span className="text-slate-500">Sent: </span><span className="text-slate-300">{new Date(doc.sentAt).toLocaleDateString()}</span></div>}
                    {doc.signedAt && <div><span className="text-slate-500">Signed: </span><span className="text-slate-300">{new Date(doc.signedAt).toLocaleDateString()}</span></div>}
                    {doc.expiresAt && <div><span className="text-slate-500">Expires: </span><span className="text-slate-300">{new Date(doc.expiresAt).toLocaleDateString()}</span></div>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setPreviewDoc(doc)} className="flex-1 border-[#1e3a5f] text-slate-300 hover:text-white gap-1 text-xs">
                      <Eye className="w-3 h-3" /> View Details
                    </Button>
                    {doc.signedFileUrl && (
                      <a href={doc.signedFileUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="border-[#1e3a5f] text-slate-300 hover:text-white gap-1 text-xs">
                          <Download className="w-3 h-3" /> Download
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DocumentDetailModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </DashboardLayout>
  );
}
