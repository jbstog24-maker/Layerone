import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Upload,
  Trash2,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── File type icon helper ────────────────────────────────────────────────────
function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith("image/")) return <FileImage className={className} />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv"))
    return <FileSpreadsheet className={className} />;
  if (mimeType.includes("pdf") || mimeType.includes("text") || mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className={className} />;
  return <File className={className} />;
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

// ─── Upload Dialog ────────────────────────────────────────────────────────────
function UploadDialog({
  shipmentId,
  clientId,
  onClose,
  onUploaded,
}: {
  shipmentId: number;
  clientId: number;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.shipmentDocs.upload.useMutation({
    onSuccess: () => { toast.success("Document uploaded"); onUploaded(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleFile = (f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error("Unsupported file type. Please upload a PDF, image, Word, Excel, or CSV file.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 25 MB.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        shipmentId,
        clientId,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        fileDataBase64: base64,
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-400" />
            Upload Shipment Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragging ? "border-blue-400 bg-blue-500/10" : "border-border hover:border-blue-400/60 hover:bg-muted/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileIcon mimeType={file.type} className="w-10 h-10 text-blue-400" />
                <p className="font-medium text-sm truncate max-w-full">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  Change file
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="w-8 h-8 opacity-50" />
                <p className="text-sm font-medium">Drop a file here or click to browse</p>
                <p className="text-xs">PDF, Word, Excel, CSV, or image - max 25 MB</p>
              </div>
            )}
          </div>

          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-sm">Label (optional)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Bill of Lading, Packing List, Insurance…"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context about this document…"
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />Upload</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface ShipmentDocumentsProps {
  shipmentId: number;
  clientId: number;
}

export default function ShipmentDocuments({ shipmentId, clientId }: ShipmentDocumentsProps) {
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const userId = (user as any)?.id;
  const isCustomerViewer = role === "customer_viewer";

  const utils = trpc.useUtils();
  const { data: docs, isLoading } = trpc.shipmentDocs.list.useQuery({ shipmentId });
  const [showUpload, setShowUpload] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const getDownloadUrl = trpc.shipmentDocs.getDownloadUrl.useQuery(
    { docId: downloadingId! },
    {
      enabled: downloadingId !== null,
    onSuccess: (data: { url: string; filename: string }) => {
      window.open(data.url, "_blank");
      setDownloadingId(null);
    },
    onError: (e: { message: string }) => { toast.error(e.message); setDownloadingId(null); },
  } as any
  );

  const deleteMutation = trpc.shipmentDocs.delete.useMutation({
    onSuccess: () => { toast.success("Document deleted"); utils.shipmentDocs.list.invalidate({ shipmentId }); },
    onError: (e) => toast.error(e.message),
  });

  const canUpload = !isCustomerViewer;
  const canDelete = (doc: any) => {
    if (role === "admin" || role === "staff") return true;
    if (role === "customer_admin" && doc.uploadedById === userId) return true;
    return false;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading…" : `${docs?.length ?? 0} document${(docs?.length ?? 0) !== 1 ? "s" : ""}`}
        </p>
        {canUpload && (
          <Button size="sm" onClick={() => setShowUpload(true)} className="gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Document list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : docs?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2 border border-dashed border-border rounded-lg">
          <FileText className="w-8 h-8 opacity-30" />
          <p className="text-sm font-medium">No documents uploaded yet</p>
          {canUpload && (
            <p className="text-xs text-center max-w-xs">
              Upload bills of lading, packing lists, insurance certificates, or any other shipment-related documents.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {docs?.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/40 hover:bg-card/60 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <FileIcon mimeType={doc.mimeType} className="w-4.5 h-4.5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.label || doc.filename}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {doc.label && <span className="truncate max-w-[180px]">{doc.filename}</span>}
                  {doc.fileSize && <span>{formatBytes(doc.fileSize)}</span>}
                  <span>·</span>
                  <span>{doc.uploadedByName ?? "Unknown"}</span>
                  <span>·</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
                {doc.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.notes}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  title="Download"
                  onClick={() => setDownloadingId(doc.id)}
                  disabled={downloadingId === doc.id}
                >
                  {downloadingId === doc.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Download className="w-3.5 h-3.5" />}
                </Button>
                {canDelete(doc) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    title="Delete"
                    onClick={() => {
                      if (confirm(`Delete "${doc.label || doc.filename}"?`)) {
                        deleteMutation.mutate({ docId: doc.id });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload dialog */}
      {showUpload && (
        <UploadDialog
          shipmentId={shipmentId}
          clientId={clientId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => utils.shipmentDocs.list.invalidate({ shipmentId })}
        />
      )}
    </div>
  );
}
