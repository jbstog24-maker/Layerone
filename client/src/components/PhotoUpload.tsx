import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  entityType: "delivery" | "receiving_log" | "pallet" | "box" | "device" | "staging_task" | "shipment" | "exception";
  entityId: number;
  clientId: number;
  onUploaded?: (url: string) => void;
  className?: string;
}

export function PhotoUpload({ entityType, entityId, clientId, onUploaded, className }: PhotoUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const uploadMutation = trpc.photos.upload.useMutation({
    onSuccess: (data) => {
      toast.success("Photo uploaded");
      utils.photos.list.invalidate({ entityType, entityId });
      onUploaded?.(data.url);
    },
    onError: (e) => toast.error(`Upload failed: ${e.message}`),
  });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataBase64 = (e.target?.result as string).split(",")[1];
      await uploadMutation.mutateAsync({
        entityType,
        entityId,
        clientId,
        fileName: file.name,
        mimeType: file.type,
        dataBase64,
      });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <div className="flex flex-col items-center gap-2">
        {uploading ? (
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          {uploading ? "Uploading..." : "Drop photo here or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP up to 10MB</p>
      </div>
    </div>
  );
}

interface PhotoGalleryProps {
  entityType: string;
  entityId: number;
  clientId: number;
  showUpload?: boolean;
}

export function PhotoGallery({ entityType, entityId, clientId, showUpload = false }: PhotoGalleryProps) {
  const { data: photos, isLoading } = trpc.photos.list.useQuery({ entityType: entityType as any, entityId });
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {showUpload && (
        <PhotoUpload
          entityType={entityType as any}
          entityId={entityId}
          clientId={clientId}
        />
      )}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map(i => <div key={i} className="aspect-square bg-muted/50 rounded-lg animate-pulse" />)}
        </div>
      ) : photos?.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-muted-foreground gap-2">
          <ImageIcon className="w-8 h-8 opacity-40" />
          <p className="text-sm">No photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos?.map((photo) => (
            <div
              key={photo.id}
              className="aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelected(photo.url)}
            >
              <img src={photo.url} alt={photo.caption ?? photo.fileName ?? "Photo"} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setSelected(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={selected} alt="Uploaded facility or equipment photo preview" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
