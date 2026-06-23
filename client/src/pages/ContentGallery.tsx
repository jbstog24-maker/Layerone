import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Video,
  Download,
  Trash2,
  RefreshCw,
  Search,
  Sparkles,
  Film,
  Clock,
  Tag,
  AlertCircle,
  ChevronLeft,
  Eye,
  Zap,
  Mic,
  MessageSquare,
  Music,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";

export default function ContentGallery() {
  const utils = trpc.useUtils();
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "generating" | "failed">("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);
  const [videoDialogAsset, setVideoDialogAsset] = useState<any | null>(null);

  const { data: assets = [], isLoading, refetch } = trpc.content.list.useQuery({
    assetType: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const deleteMut = trpc.content.delete.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      toast.success("Asset deleted");
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const regenerateMut = trpc.content.regenerate.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      toast.success("Image regenerated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = assets.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.prompt.toLowerCase().includes(q) ||
      (a.tags ?? "").toLowerCase().includes(q)
    );
  });

  const imageCount = assets.filter((a) => a.assetType === "image" && a.status === "ready").length;
  const videoCount = assets.filter((a) => a.assetType === "video" && a.status === "ready").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/content-studio">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-400 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
              Studio
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[#39a7ff]" />
              Asset Gallery
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {imageCount} images · {videoCount} video packages
            </p>
          </div>
        </div>
        <Link href="/content-studio">
          <Button className="bg-[#39a7ff] hover:bg-[#2196f3] text-[#07111f] font-semibold gap-2">
            <Sparkles className="h-4 w-4" />
            Create New
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by title, prompt, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-slate-200 focus:bg-slate-700">All Types</SelectItem>
            <SelectItem value="image" className="text-slate-200 focus:bg-slate-700">Images</SelectItem>
            <SelectItem value="video" className="text-slate-200 focus:bg-slate-700">Videos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-slate-200 focus:bg-slate-700">All Status</SelectItem>
            <SelectItem value="ready" className="text-slate-200 focus:bg-slate-700">Ready</SelectItem>
            <SelectItem value="generating" className="text-slate-200 focus:bg-slate-700">Generating</SelectItem>
            <SelectItem value="failed" className="text-slate-200 focus:bg-slate-700">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()} className="border-slate-600 text-slate-400 hover:text-white">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-video bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-medium">No assets yet</p>
          <p className="text-slate-600 text-sm mt-1">Head to the Content Studio to generate your first marketing asset</p>
          <Link href="/content-studio">
            <Button className="mt-4 bg-[#39a7ff] hover:bg-[#2196f3] text-[#07111f] font-semibold gap-2">
              <Sparkles className="h-4 w-4" />
              Open Content Studio
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onDelete={() => setDeleteId(asset.id)}
              onPreview={() => {
                if (asset.assetType === "image") setPreviewAsset(asset);
                else setVideoDialogAsset(asset);
              }}
              onRegenerate={() => regenerateMut.mutate({ id: asset.id })}
              isRegenerating={regenerateMut.isPending && regenerateMut.variables?.id === asset.id}
            />
          ))}
        </div>
      )}

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Asset</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete the asset. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteId && deleteMut.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image preview dialog */}
      <Dialog open={!!previewAsset} onOpenChange={(o) => !o && setPreviewAsset(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">{previewAsset?.title}</DialogTitle>
          </DialogHeader>
          {previewAsset?.fileUrl && (
            <div className="space-y-3">
              <img src={previewAsset.fileUrl} alt={previewAsset.title} className="w-full rounded-xl border border-slate-700" />
              <div className="flex gap-2">
                <a href={previewAsset.fileUrl} download target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2 border-slate-600 text-slate-300 hover:text-white">
                    <Download className="h-4 w-4" />
                    Download Full Resolution
                  </Button>
                </a>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Prompt Used</p>
                <p className="text-slate-300 text-xs leading-relaxed">{previewAsset.prompt}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video package dialog */}
      <Dialog open={!!videoDialogAsset} onOpenChange={(o) => !o && setVideoDialogAsset(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Film className="h-5 w-5 text-purple-400" />
              {videoDialogAsset?.title}
            </DialogTitle>
          </DialogHeader>
          {videoDialogAsset?.fileUrl && (() => {
            try {
              const pkg = JSON.parse(videoDialogAsset.fileUrl);
              return <VideoPackageView pkg={pkg} thumbnailUrl={videoDialogAsset.thumbnailUrl} />;
            } catch {
              return <p className="text-slate-400 text-sm">Could not parse video package data.</p>;
            }
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Asset Card ───────────────────────────────────────────────────────────────
function AssetCard({
  asset,
  onDelete,
  onPreview,
  onRegenerate,
  isRegenerating,
}: {
  asset: any;
  onDelete: () => void;
  onPreview: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  const isImage = asset.assetType === "image";
  const isReady = asset.status === "ready";
  const isFailed = asset.status === "failed";
  const isGenerating = asset.status === "generating";

  return (
    <Card className="bg-slate-900 border-slate-700 overflow-hidden group hover:border-slate-500 transition-colors">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-800 overflow-hidden">
        {isImage && isReady && asset.fileUrl ? (
          <img
            src={asset.fileUrl}
            alt={asset.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : !isImage && asset.thumbnailUrl ? (
          <div className="relative w-full h-full">
            <img
              src={asset.thumbnailUrl}
              alt={asset.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-purple-600/80 rounded-full p-2">
                <Film className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <RefreshCw className="h-6 w-6 text-[#39a7ff] animate-spin mx-auto" />
              <p className="text-slate-500 text-xs">Generating...</p>
            </div>
          </div>
        ) : isFailed ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <AlertCircle className="h-6 w-6 text-red-400 mx-auto" />
              <p className="text-red-400 text-xs">Failed</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isImage ? <ImageIcon className="h-8 w-8 text-slate-600" /> : <Film className="h-8 w-8 text-slate-600" />}
          </div>
        )}

        {/* Hover overlay */}
        {isReady && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs gap-1 bg-white/10 hover:bg-white/20 text-white border-0"
              onClick={onPreview}
            >
              <Eye className="h-3 w-3" />
              View
            </Button>
            {isImage && asset.fileUrl && (
              <a href={asset.fileUrl} download target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary" className="h-7 text-xs gap-1 bg-white/10 hover:bg-white/20 text-white border-0">
                  <Download className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <Badge className={`text-xs px-1.5 py-0.5 ${isImage ? "bg-[#39a7ff]/20 text-[#39a7ff] border-[#39a7ff]/30" : "bg-purple-500/20 text-purple-400 border-purple-500/30"}`}>
            {isImage ? <ImageIcon className="h-2.5 w-2.5 mr-1" /> : <Film className="h-2.5 w-2.5 mr-1" />}
            {isImage ? "Image" : "Video"}
          </Badge>
        </div>

        {/* Status badge */}
        {!isReady && (
          <div className="absolute top-2 right-2">
            <Badge className={`text-xs px-1.5 py-0.5 ${isGenerating ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
              {isGenerating ? "Generating" : "Failed"}
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <CardContent className="p-3 space-y-2">
        <p className="text-white text-xs font-medium line-clamp-1">{asset.title}</p>
        <p className="text-slate-500 text-xs line-clamp-2">{asset.prompt}</p>

        {asset.tags && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.split(",").slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-slate-600 text-xs bg-slate-800 px-1.5 py-0.5 rounded">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-600 text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(asset.createdAt).toLocaleDateString()}
          </span>
          <div className="flex gap-1">
            {isImage && isReady && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-500 hover:text-[#39a7ff]"
                onClick={onRegenerate}
                disabled={isRegenerating}
                title="Regenerate"
              >
                <RefreshCw className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-500 hover:text-red-400"
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Video Package View (reused from ContentStudio) ───────────────────────────
function VideoPackageView({ pkg, thumbnailUrl }: { pkg: any; thumbnailUrl?: string | null }) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-5">
      {thumbnailUrl && (
        <div className="rounded-xl overflow-hidden border border-slate-700">
          <img src={thumbnailUrl} alt="Storyboard" className="w-full object-cover" />
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-yellow-400" /> Hook
          </h3>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-500 hover:text-white" onClick={() => copyToClipboard(pkg.hook, "Hook")}>Copy</Button>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p className="text-white text-sm font-medium">"{pkg.hook}"</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5 text-[#39a7ff]" /> Voiceover Script
          </h3>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-500 hover:text-white" onClick={() => copyToClipboard(pkg.voiceover, "Voiceover")}>Copy</Button>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p className="text-slate-200 text-sm leading-relaxed">{pkg.voiceover}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
          <Film className="h-3.5 w-3.5 text-purple-400" /> Scene Breakdown
        </h3>
        <div className="space-y-2">
          {pkg.scenes?.map((scene: any, i: number) => (
            <div key={i} className="bg-slate-800 rounded-lg p-3 border border-slate-700 grid grid-cols-[60px_1fr] gap-3">
              <div className="text-center">
                <div className="bg-purple-500/20 text-purple-400 text-xs font-bold rounded-md px-2 py-1">{scene.timestamp}</div>
                <div className="text-slate-600 text-xs mt-1">{scene.duration}</div>
              </div>
              <div className="space-y-1">
                <p className="text-slate-200 text-xs">{scene.visual}</p>
                {scene.text_overlay && (
                  <div className="bg-slate-700 rounded px-2 py-1 inline-block">
                    <p className="text-[#39a7ff] text-xs font-medium">"{scene.text_overlay}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[#6ee7b7]" /> CTA
          </h3>
          <div className="bg-slate-800 rounded-lg p-3 border border-[#6ee7b7]/20">
            <p className="text-[#6ee7b7] text-sm font-medium">{pkg.cta}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Music className="h-3.5 w-3.5 text-pink-400" /> Music
          </h3>
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <p className="text-slate-300 text-sm">{pkg.music_mood}</p>
          </div>
        </div>
      </div>

      {pkg.key_messages?.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Key Messages</h3>
          <div className="flex flex-wrap gap-2">
            {pkg.key_messages.map((msg: string, i: number) => (
              <Badge key={i} className="bg-[#39a7ff]/10 text-[#39a7ff] border-[#39a7ff]/20 text-xs">{msg}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
