import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText, Upload, Send, Eye, CheckCircle, XCircle, Clock,
  Download, Plus, RefreshCw, Building2, FileSignature, Wand2
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

// ─── Upload Template Dialog ───────────────────────────────────────────────────
function UploadTemplateDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("agreement");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0");
  const [file, setFile] = useState<File | null>(null);

  const uploadMut = trpc.documents.templates.upload.useMutation({
    onSuccess: () => {
      toast.success("Template uploaded successfully");
      onSuccess();
      onClose();
      setName(""); setCategory("agreement"); setDescription(""); setVersion("1.0"); setFile(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = async () => {
    if (!name || !file) { toast.error("Name and file are required"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadMut.mutate({
        name, category: category as any, description, version,
        fileName: file.name, mimeType: file.type || "application/pdf",
        fileSizeBytes: file.size, fileBase64: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0d1f35] border-[#1e3a5f] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-blue-400" /> Upload Document Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Template Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Master Service Agreement" className="bg-[#07111f] border-[#1e3a5f] text-white mt-1" /></div>
          <div><Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-[#07111f] border-[#1e3a5f] text-white mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d1f35] border-[#1e3a5f] text-white">
                {["agreement","onboarding","sow","nda","authorization","checklist","other"].map(c => (
                  <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this template..." className="bg-[#07111f] border-[#1e3a5f] text-white mt-1 h-20" /></div>
          <div><Label>Version</Label><Input value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0" className="bg-[#07111f] border-[#1e3a5f] text-white mt-1" /></div>
          <div>
            <Label>File (PDF, DOCX, etc.) *</Label>
            <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30 cursor-pointer" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#1e3a5f] text-slate-300">Cancel</Button>
          <Button onClick={handleSubmit} disabled={uploadMut.isPending} className="bg-blue-600 hover:bg-blue-700">
            {uploadMut.isPending ? "Uploading..." : "Upload Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Send Document Dialog ─────────────────────────────────────────────────────
function SendDocumentDialog({ open, onClose, onSuccess, templateId, templateName }: {
  open: boolean; onClose: () => void; onSuccess: () => void;
  templateId?: number; templateName?: string;
}) {
  const [clientId, setClientId] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");

  const { data: clientsData } = trpc.clients.list.useQuery({});
  const clientsList = Array.isArray(clientsData) ? clientsData : (clientsData as any)?.clients ?? [];
  const sendMut = trpc.documents.clientDocs.send.useMutation({
    onSuccess: () => { toast.success("Document sent successfully"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleClientChange = (id: string) => {
    setClientId(id);
    const client = clientsList.find((c: any) => c.id.toString() === id);
    if (client?.contactEmail) setEmail(client.contactEmail);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0d1f35] border-[#1e3a5f] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-blue-400" /> Send Document to Client</DialogTitle>
        </DialogHeader>
        {templateName && <p className="text-sm text-slate-400 -mt-2">Template: <span className="text-blue-300">{templateName}</span></p>}
        <div className="space-y-4">
          <div><Label>Client *</Label>
            <Select value={clientId} onValueChange={handleClientChange}>
              <SelectTrigger className="bg-[#07111f] border-[#1e3a5f] text-white mt-1"><SelectValue placeholder="Select client..." /></SelectTrigger>
              <SelectContent className="bg-[#0d1f35] border-[#1e3a5f] text-white">
                {clientsList.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Send To Email *</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="client@company.com" className="bg-[#07111f] border-[#1e3a5f] text-white mt-1" /></div>
          <div><Label>Message (optional)</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Please review and sign the attached document..." className="bg-[#07111f] border-[#1e3a5f] text-white mt-1 h-24" /></div>
          <div><Label>Expires In (days)</Label><Input type="number" value={expiresInDays} onChange={e => setExpiresInDays(e.target.value)} className="bg-[#07111f] border-[#1e3a5f] text-white mt-1" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#1e3a5f] text-slate-300">Cancel</Button>
          <Button
            onClick={() => sendMut.mutate({ clientId: parseInt(clientId), templateId, sentToEmail: email, sentMessage: message, expiresInDays: parseInt(expiresInDays) })}
            disabled={sendMut.isPending || !clientId || !email}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sendMut.isPending ? "Sending..." : "Send Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Auto-Draft MSA Dialog ────────────────────────────────────────────────────
function AutoDraftMsaDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [clientId, setClientId] = useState("");
  const [addOns, setAddOns] = useState("");

  const { data: clientsData2 } = trpc.clients.list.useQuery({});
  const clientsList2 = Array.isArray(clientsData2) ? clientsData2 : (clientsData2 as any)?.clients ?? [];
  const draftMut = trpc.documents.clientDocs.autoDraftMsa.useMutation({
    onSuccess: () => { toast.success("MSA auto-drafted successfully"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0d1f35] border-[#1e3a5f] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-green-400" /> Auto-Draft MSA</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-400">Automatically generate a Master Service Agreement based on the client's assigned package. The MSA will include all package terms, pricing, add-on clauses, and the 2-week onboarding period.</p>
        <div className="space-y-4">
          <div><Label>Client *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="bg-[#07111f] border-[#1e3a5f] text-white mt-1"><SelectValue placeholder="Select client..." /></SelectTrigger>
              <SelectContent className="bg-[#0d1f35] border-[#1e3a5f] text-white">
                {clientsList2.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Add-On Services (one per line)</Label>
            <Textarea
              value={addOns}
              onChange={e => setAddOns(e.target.value)}
              placeholder={"Extended storage (per pallet/mo)\nRush staging service\nDedicated tech support"}
              className="bg-[#07111f] border-[#1e3a5f] text-white mt-1 h-28"
            />
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
            <strong>Layer One Logo</strong> will be included in the document header. The MSA will be stored securely and linked to the client's account.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#1e3a5f] text-slate-300">Cancel</Button>
          <Button
            onClick={() => draftMut.mutate({ clientId: parseInt(clientId), addOns: addOns.split("\n").filter(Boolean) })}
            disabled={draftMut.isPending || !clientId}
            className="bg-green-600 hover:bg-green-700"
          >
            {draftMut.isPending ? "Generating..." : "Generate MSA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Document Preview Modal ───────────────────────────────────────────────────
function DocumentPreviewModal({ doc, open, onClose, onStatusUpdate }: {
  doc: any; open: boolean; onClose: () => void; onStatusUpdate: () => void;
}) {
  const [newStatus, setNewStatus] = useState("");
  const [signedByName, setSignedByName] = useState("");
  const [signedByEmail, setSignedByEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const updateMut = trpc.documents.clientDocs.updateStatus.useMutation({
    onSuccess: () => { toast.success("Document status updated"); onStatusUpdate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
            <p>Client: <span className="text-blue-300">{doc.clientName ?? `Client #${doc.clientId}`}</span></p>
            <p>Status: <DocStatusBadge status={doc.status} /></p>
            {doc.sentAt && <p>Sent: {new Date(doc.sentAt).toLocaleDateString()}</p>}
            {doc.signedAt && <p>Signed: {new Date(doc.signedAt).toLocaleDateString()}</p>}
            {doc.expiresAt && <p>Expires: {new Date(doc.expiresAt).toLocaleDateString()}</p>}
          </div>
        </div>

        {/* Document details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {doc.sentToEmail && <div><span className="text-slate-400">Sent To:</span> <span className="text-white">{doc.sentToEmail}</span></div>}
          {doc.signedByName && <div><span className="text-slate-400">Signed By:</span> <span className="text-white">{doc.signedByName}</span></div>}
          {doc.notes && <div className="col-span-2"><span className="text-slate-400">Notes:</span> <span className="text-white">{doc.notes}</span></div>}
        </div>

        {/* File link */}
        {doc.signedFileUrl && (
          <a href={doc.signedFileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm underline">
            <Download className="w-4 h-4" /> View / Download Document
          </a>
        )}

        {/* Status update */}
        <div className="border-t border-[#1e3a5f] pt-4 space-y-3">
          <Label className="text-slate-300">Update Status</Label>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="bg-[#07111f] border-[#1e3a5f] text-white"><SelectValue placeholder="Select new status..." /></SelectTrigger>
            <SelectContent className="bg-[#0d1f35] border-[#1e3a5f] text-white">
              {["draft","sent","viewed","signed","approved","rejected","expired"].map(s => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {newStatus === "signed" && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Signed By Name</Label><Input value={signedByName} onChange={e => setSignedByName(e.target.value)} className="bg-[#07111f] border-[#1e3a5f] text-white mt-1" /></div>
              <div><Label>Signed By Email</Label><Input value={signedByEmail} onChange={e => setSignedByEmail(e.target.value)} className="bg-[#07111f] border-[#1e3a5f] text-white mt-1" /></div>
            </div>
          )}
          {newStatus === "rejected" && (
            <div><Label>Rejection Reason</Label><Input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="bg-[#07111f] border-[#1e3a5f] text-white mt-1" /></div>
          )}
          <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-[#07111f] border-[#1e3a5f] text-white mt-1 h-16" /></div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#1e3a5f] text-slate-300">Close</Button>
          {newStatus && (
            <Button
              onClick={() => updateMut.mutate({ id: doc.id, status: newStatus as any, signedByName, signedByEmail, rejectionReason, notes })}
              disabled={updateMut.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateMut.isPending ? "Updating..." : "Update Status"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Documents Page ──────────────────────────────────────────────────────
export default function Documents() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"templates" | "all_docs">("templates");
  const [showUpload, setShowUpload] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showAutoDraft, setShowAutoDraft] = useState(false);
  const [sendTemplateId, setSendTemplateId] = useState<number | undefined>();
  const [sendTemplateName, setSendTemplateName] = useState<string | undefined>();
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const isAdminOrStaff = user?.role === "admin" || user?.role === "staff";

  const { data: templates, refetch: refetchTemplates } = trpc.documents.templates.list.useQuery(undefined, { enabled: isAdminOrStaff });
  const { data: allDocs, refetch: refetchDocs } = trpc.documents.clientDocs.listAll.useQuery(undefined, { enabled: isAdminOrStaff });

  if (!isAdminOrStaff) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-slate-400">You do not have permission to access this page.</div>
      </DashboardLayout>
    );
  }

  const handleSendTemplate = (tpl: any) => {
    setSendTemplateId(tpl.id);
    setSendTemplateName(tpl.name);
    setShowSend(true);
  };

  const refetchAll = () => { refetchTemplates(); refetchDocs(); };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-blue-400" />
              Document Repository
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage templates, send documents to clients, and track signature status</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowAutoDraft(true)} className="bg-green-600 hover:bg-green-700 gap-2 text-sm">
              <Wand2 className="w-4 h-4" /> <span className="hidden xs:inline">Auto-Draft </span>MSA
            </Button>
            <Button onClick={() => { setSendTemplateId(undefined); setSendTemplateName(undefined); setShowSend(true); }} variant="outline" className="border-blue-500/40 text-blue-300 hover:bg-blue-500/10 gap-2 text-sm">
              <Send className="w-4 h-4" /> Send
            </Button>
            <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700 gap-2 text-sm">
              <Upload className="w-4 h-4" /> Upload
            </Button>
          </div>
        </div>

        {/* Layer One Branding Banner */}
        <div className="bg-gradient-to-r from-[#0d1f35] to-[#07111f] border border-[#1e3a5f] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <img src={LAYERONE_LOGO_URL} alt="Layer One Staging Solutions" className="w-36 sm:w-44 flex-shrink-0 object-contain" />
          <div className="sm:border-l sm:border-[#1e3a5f] sm:pl-4 text-sm text-slate-400">
            <p className="text-white font-semibold">All documents include the Layer One logo and branding</p>
            <p>Auto-generated MSAs, SOWs, and forms are branded with your logo and company details. Documents are stored securely and linked to each client's account.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#0d1f35] border border-[#1e3a5f] rounded-lg p-1 w-full sm:w-fit">
          {[
            { key: "templates", label: "Document Templates", icon: <FileText className="w-4 h-4" /> },
            { key: "all_docs", label: "Client Documents", icon: <Building2 className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.key ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              {tab.icon} <span className="hidden xs:inline sm:inline">{tab.label}</span><span className="xs:hidden sm:hidden">{tab.key === "templates" ? "Templates" : "Client Docs"}</span>
            </button>
          ))}
        </div>

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            {!templates || templates.length === 0 ? (
              <Card className="bg-[#0d1f35] border-[#1e3a5f]">
                <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                  <FileText className="w-12 h-12 opacity-30" />
                  <p className="text-lg font-medium">No templates yet</p>
                  <p className="text-sm">Upload your first document template or use Auto-Draft to generate an MSA.</p>
                  <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700 mt-2 gap-2">
                    <Plus className="w-4 h-4" /> Upload First Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map((tpl: any) => (
                  <Card key={tpl.id} className="bg-[#0d1f35] border-[#1e3a5f] hover:border-blue-500/40 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <CardTitle className="text-sm font-semibold text-white leading-tight">{tpl.name}</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 flex-shrink-0">
                          {tpl.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {tpl.description && <p className="text-xs text-slate-400 line-clamp-2">{tpl.description}</p>}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>v{tpl.version}</span>
                        <span>{tpl.mimeType?.includes("pdf") ? "PDF" : tpl.mimeType?.includes("word") ? "DOCX" : "File"}</span>
                        {tpl.fileSizeBytes && <span>{(tpl.fileSizeBytes / 1024).toFixed(0)} KB</span>}
                      </div>
                      <div className="flex gap-2 pt-1">
                        {tpl.fileUrl && (
                          <a href={tpl.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="border-[#1e3a5f] text-slate-300 hover:text-white gap-1 text-xs">
                              <Download className="w-3 h-3" /> View
                            </Button>
                          </a>
                        )}
                        <Button size="sm" onClick={() => handleSendTemplate(tpl)} className="bg-blue-600 hover:bg-blue-700 gap-1 text-xs flex-1">
                          <Send className="w-3 h-3" /> Send to Client
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Client Documents Tab */}
        {activeTab === "all_docs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{allDocs?.length ?? 0} document(s) across all clients</p>
              <Button size="sm" variant="outline" onClick={() => { void refetchDocs(); }} className="border-[#1e3a5f] text-slate-300 gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
            </div>
            {!allDocs || allDocs.length === 0 ? (
              <Card className="bg-[#0d1f35] border-[#1e3a5f]">
                <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                  <FileSignature className="w-12 h-12 opacity-30" />
                  <p className="text-lg font-medium">No client documents yet</p>
                  <p className="text-sm">Send a document to a client or auto-draft an MSA to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-[#1e3a5f]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1e3a5f] bg-[#0d1f35]">
                        {["Document", "Client", "Status", "Sent To", "Sent", "Signed", "Expires", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allDocs.map((doc: any) => (
                        <tr key={doc.id} className="border-b border-[#1e3a5f]/50 hover:bg-[#0d1f35]/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              <span className="text-white font-medium text-xs max-w-[180px] truncate">{doc.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-xs">{doc.clientName ?? `#${doc.clientId}`}</td>
                          <td className="px-4 py-3"><DocStatusBadge status={doc.status} /></td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{doc.sentToEmail ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{doc.sentAt ? new Date(doc.sentAt).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{doc.signedAt ? new Date(doc.signedAt).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="outline" onClick={() => setPreviewDoc(doc)} className="border-[#1e3a5f] text-slate-300 hover:text-white gap-1 text-xs">
                              <Eye className="w-3 h-3" /> View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile card list */}
                <div className="md:hidden space-y-3">
                  {allDocs.map((doc: any) => (
                    <Card key={doc.id} className="bg-[#0d1f35] border-[#1e3a5f]">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span className="text-white font-medium text-sm truncate">{doc.name}</span>
                          </div>
                          <DocStatusBadge status={doc.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div><span className="text-slate-500">Client: </span><span className="text-slate-300">{doc.clientName ?? `#${doc.clientId}`}</span></div>
                          {doc.sentToEmail && <div className="col-span-2"><span className="text-slate-500">Sent to: </span><span className="text-slate-300 break-all">{doc.sentToEmail}</span></div>}
                          {doc.sentAt && <div><span className="text-slate-500">Sent: </span><span className="text-slate-300">{new Date(doc.sentAt).toLocaleDateString()}</span></div>}
                          {doc.signedAt && <div><span className="text-slate-500">Signed: </span><span className="text-slate-300">{new Date(doc.signedAt).toLocaleDateString()}</span></div>}
                          {doc.expiresAt && <div><span className="text-slate-500">Expires: </span><span className="text-slate-300">{new Date(doc.expiresAt).toLocaleDateString()}</span></div>}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setPreviewDoc(doc)} className="w-full border-[#1e3a5f] text-slate-300 hover:text-white gap-1 text-xs">
                          <Eye className="w-3 h-3" /> View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <UploadTemplateDialog open={showUpload} onClose={() => setShowUpload(false)} onSuccess={refetchTemplates} />
      <SendDocumentDialog open={showSend} onClose={() => setShowSend(false)} onSuccess={refetchDocs} templateId={sendTemplateId} templateName={sendTemplateName} />
      <AutoDraftMsaDialog open={showAutoDraft} onClose={() => setShowAutoDraft(false)} onSuccess={refetchDocs} />
      <DocumentPreviewModal doc={previewDoc} open={!!previewDoc} onClose={() => setPreviewDoc(null)} onStatusUpdate={refetchAll} />
    </DashboardLayout>
  );
}
