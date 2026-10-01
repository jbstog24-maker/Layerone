import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import RichTextEditor from "@/components/RichTextEditor";
import { toast } from "sonner";
import {
  FileText, Upload, Trash2, Download, ClipboardList, CheckCircle2,
  AlertCircle, File, FileImage, FileArchive,
} from "lucide-react";

// ─── File type icon helper ─────────────────────────────────────────────────────
function FileIcon({ mimeType }: { mimeType?: string | null }) {
  if (!mimeType) return <File className="h-4 w-4 text-muted-foreground" />;
  if (mimeType.startsWith("image/")) return <FileImage className="h-4 w-4 text-blue-400" />;
  if (mimeType.includes("pdf")) return <FileText className="h-4 w-4 text-red-400" />;
  if (mimeType.includes("zip") || mimeType.includes("archive")) return <FileArchive className="h-4 w-4 text-yellow-400" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyInstructions() {
  const { user } = useAuth();
  const clientId = user?.clientId;

  const { data, isLoading, refetch } = trpc.instructions.get.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId }
  );

  const upsertMutation = trpc.instructions.upsert.useMutation({
    onSuccess: () => { toast.success("Instructions saved"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const uploadMutation = trpc.instructions.uploadFile.useMutation({
    onSuccess: () => { toast.success("File uploaded"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.instructions.deleteFile.useMutation({
    onSuccess: () => { toast.success("File removed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const utils = trpc.useUtils();

  const [editorContent, setEditorContent] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialise editor content once data loads
  const [initialised, setInitialised] = useState(false);
  if (data && !initialised) {
    setEditorContent(data.instructions?.textBody ?? "");
    setInitialised(true);
  }

  if (!clientId) {
    return (
      <div className="container py-12 text-center text-muted-foreground">
        <AlertCircle className="mx-auto h-10 w-10 mb-3 text-yellow-500" />
        <p className="text-lg font-medium">Account not linked</p>
        <p className="text-sm mt-1">Your account has not been linked to a client yet. Please contact support.</p>
      </div>
    );
  }

  const handleSave = () => {
    upsertMutation.mutate({ clientId, textBody: editorContent });
    setIsDirty(false);
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large - maximum 20 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadMutation.mutate({
        clientId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileDataBase64: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFileUpload);
  };

  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      const result = await utils.instructions.getFileUrl.fetch({ clientId: clientId!, fileKey });
      const a = document.createElement("a");
      a.href = result.url;
      a.download = fileName;
      a.target = "_blank";
      a.click();
    } catch {
      toast.error("Could not get download link");
    }
  };

  const acknowledged = !!data?.instructions?.acknowledgedAt;

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Staging &amp; Provisioning Instructions
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Provide detailed instructions for the Layer One team regarding how your devices should be staged,
            configured, or provisioned. You can type notes below and attach reference documents.
          </p>
        </div>
        {acknowledged && (
          <Badge variant="outline" className="border-green-500 text-green-400 shrink-0 gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Reviewed by Layer One
          </Badge>
        )}
      </div>

      {/* Text Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Written Instructions</CardTitle>
          <CardDescription>
            Describe any specific configuration requirements, naming conventions, VLAN assignments,
            firmware versions, labeling standards, or special handling notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <RichTextEditor
              value={editorContent}
              onChange={(html) => { setEditorContent(html); setIsDirty(true); }}
              placeholder="e.g. All switches should be configured with VLAN 10 for management. Hostname format: SITE-SW-01. Firmware must be 16.12.x or later..."
            />
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {isDirty ? "You have unsaved changes." : data?.instructions?.updatedAt
                ? `Last saved ${new Date(data.instructions.updatedAt).toLocaleString()}`
                : "No instructions saved yet."}
            </p>
            <Button
              onClick={handleSave}
              disabled={upsertMutation.isPending || !isDirty}
              size="sm"
            >
              {upsertMutation.isPending ? "Saving..." : "Save Instructions"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Attachments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reference Documents</CardTitle>
          <CardDescription>
            Attach configuration templates, network diagrams, spreadsheets, or any other reference
            files the Layer One team should review before staging begins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, images - up to 20 MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => Array.from(e.target.files ?? []).forEach(handleFileUpload)}
            />
          </div>

          {uploadMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Uploading...
            </div>
          )}

          {/* File list */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data?.files && data.files.length > 0 ? (
            <div className="space-y-2">
              <Separator />
              {data.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileIcon mimeType={file.mimeType} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(file.fileKey, file.fileName)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ id: file.id, clientId, fileName: file.fileName })}
                      disabled={deleteMutation.isPending}
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No files attached yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Info banner */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200/80 space-y-1">
              <p className="font-medium text-blue-300">How this works</p>
              <p>Your instructions are visible to the Layer One staging team as soon as you save them.
                The team will review them before beginning work on your devices and will mark them
                as acknowledged once reviewed. You can update your instructions at any time.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
