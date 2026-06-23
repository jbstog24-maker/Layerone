import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Wand2,
  Download,
  RefreshCw,
  Trash2,
  Tag,
  Clock,
  ChevronRight,
  Film,
  Mic,
  LayoutList,
  MessageSquare,
  Music,
  Zap,
  Share2,
  Hash,
  Copy,
  Check,
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  ChevronDown,
  Globe,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";

// ─── Image style presets ──────────────────────────────────────────────────────
const IMAGE_STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "corporate_clean", label: "Corporate Clean" },
  { value: "cinematic", label: "Cinematic" },
  { value: "isometric_3d", label: "Isometric 3D" },
  { value: "dark_tech", label: "Dark Tech" },
  { value: "flat_illustration", label: "Flat Illustration" },
  { value: "editorial", label: "Editorial / Magazine" },
];

// ─── Caption scenario templates ─────────────────────────────────────────────
const CAPTION_TEMPLATES = [
  {
    label: "Warehouse Operations",
    desc: "Professional IT hardware staging warehouse with organized rows of servers and network equipment on pallets, technicians in branded uniforms, clean industrial environment",
  },
  {
    label: "Device Staging",
    desc: "Technicians staging and configuring laptops and network switches on clean workbenches, professional IT lab, organized cables and multiple monitors",
  },
  {
    label: "Secure Shipping",
    desc: "Professionally packed IT equipment in branded boxes on pallets ready for shipment, warehouse dock, logistics team, clean and organized",
  },
  {
    label: "Team & Expertise",
    desc: "Professional NSDS IT staging team collaborating around servers and network equipment, confident and expert, modern DFW warehouse facility",
  },
  {
    label: "Customer Portal",
    desc: "Modern dark-themed operations dashboard on a large monitor showing device tracking, shipment status, and staging progress charts, professional office",
  },
];

// ─── Image prompt templates ───────────────────────────────────────────────────
const IMAGE_TEMPLATES = [
  {
    label: "Warehouse Operations",
    title: "NSDS Warehouse Operations",
    prompt: "Modern IT hardware staging warehouse with organized rows of servers and network equipment on pallets, professional lighting, workers in branded uniforms, clean industrial environment",
  },
  {
    label: "Device Staging",
    title: "NSDS Device Staging Lab",
    prompt: "Technicians staging and configuring laptops and network switches on clean workbenches, professional IT lab environment, organized cables, multiple monitors showing configuration screens",
  },
  {
    label: "Secure Shipping",
    title: "NSDS Secure Shipping",
    prompt: "Professionally packed IT equipment in branded boxes on pallets ready for shipment, warehouse dock, logistics team, clean and organized",
  },
  {
    label: "Customer Portal",
    title: "StagingOps Portal Dashboard",
    prompt: "Modern dark-themed operations dashboard on a large monitor showing device tracking, shipment status, and staging progress charts, professional office environment",
  },
  {
    label: "Team & Expertise",
    title: "NSDS Expert Team",
    prompt: "Professional IT staging team collaborating around servers and network equipment, confident and expert, modern warehouse facility, NSDS branding",
  },
  {
    label: "DFW Headquarters",
    title: "NSDS DFW Headquarters",
    prompt: "Aerial view of modern Dallas-Fort Worth logistics and technology facility, professional exterior, branded signage, fleet vehicles, corporate campus",
  },
];

// ─── Video duration options ───────────────────────────────────────────────────
const VIDEO_DURATIONS = [
  { value: "15s", label: "15 seconds — Social / Reel" },
  { value: "30s", label: "30 seconds — Standard Ad" },
  { value: "60s", label: "60 seconds — Explainer" },
];

// ─── Video concept templates ──────────────────────────────────────────────────
const VIDEO_TEMPLATES = [
  {
    label: "Brand Overview",
    title: "NSDS Brand Overview 2026",
    concept: "NSDS company overview highlighting our end-to-end IT staging and deployment services for MSPs and enterprise IT teams in the DFW area",
  },
  {
    label: "Customer Success",
    title: "How NSDS Saves IT Teams Time",
    concept: "How NSDS helps IT teams save time and reduce errors by handling device staging, imaging, and deployment prep so they can focus on their core business",
  },
  {
    label: "Service Walkthrough",
    title: "NSDS Staging Process Walkthrough",
    concept: "Step-by-step walkthrough of the NSDS staging process: receiving, organizing, staging, imaging, packing, and shipping IT hardware",
  },
  {
    label: "Portal Demo",
    title: "StagingOps Portal Demo",
    concept: "Demo of the StagingOps customer portal showing real-time device tracking, forwarding addresses, shipment status, and document management",
  },
  {
    label: "Why Choose NSDS",
    title: "Why Choose NSDS",
    concept: "Key differentiators of NSDS: DFW-based, secure facility, certified technicians, chain-of-custody tracking, and dedicated customer portal",
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function ContentStudio() {
  const utils = trpc.useUtils();

  // Image generation state
  const [imageTitle, setImageTitle] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("photorealistic");
  const [imageTags, setImageTags] = useState("");
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [generatedImage, setGeneratedImage] = useState<{ id: number; url?: string } | null>(null);
  const [selectedImageTemplate, setSelectedImageTemplate] = useState<string | null>(null);

  // Captions state
  const [captionAssetId, setCaptionAssetId] = useState<number | null>(null);
  const [captionCustomDesc, setCaptionCustomDesc] = useState("");
  const [captionPlatforms, setCaptionPlatforms] = useState<string[]>(["linkedin", "instagram", "twitter", "facebook"]);
  const [captionTone, setCaptionTone] = useState<"professional" | "conversational" | "energetic" | "educational">("professional");
  const [captionIncludeHashtags, setCaptionIncludeHashtags] = useState(true);
  const [captionIncludeEmoji, setCaptionIncludeEmoji] = useState(true);
  const [captionContext, setCaptionContext] = useState("");
  const [captionResult, setCaptionResult] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Video generation state
  const [videoTitle, setVideoTitle] = useState("");
  const [videoConcept, setVideoConcept] = useState("");
  const [videoDuration, setVideoDuration] = useState<"15s" | "30s" | "60s">("30s");
  const [videoStyle, setVideoStyle] = useState("");
  const [videoTags, setVideoTags] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<{ id: number; videoPackage: any; thumbnailUrl?: string | null } | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedVideoTemplate, setSelectedVideoTemplate] = useState<string | null>(null);

  // Clear helpers
  const clearImageForm = () => {
    setImageTitle(""); setImagePrompt(""); setImageStyle("photorealistic");
    setImageTags(""); setEnhancePrompt(true); setGeneratedImage(null); setSelectedImageTemplate(null);
  };
  const clearVideoForm = () => {
    setVideoTitle(""); setVideoConcept(""); setVideoDuration("30s");
    setVideoStyle(""); setVideoTags(""); setGeneratedVideo(null); setSelectedVideoTemplate(null);
  };
  const clearCaptionsForm = () => {
    setCaptionAssetId(null); setCaptionCustomDesc(""); setCaptionPlatforms(["linkedin", "instagram", "twitter", "facebook"]);
    setCaptionTone("professional"); setCaptionIncludeHashtags(true); setCaptionIncludeEmoji(true);
    setCaptionContext(""); setCaptionResult(null);
  };

  // Mutations
  const generateImageMut = trpc.content.generateImage.useMutation({
    onSuccess: (data) => {
      setGeneratedImage(data);
      utils.content.list.invalidate();
      toast.success("Image generated successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  const generateCaptionsMut = trpc.content.generateCaptions.useMutation({
    onSuccess: (data) => {
      setCaptionResult(data);
      toast.success("Captions generated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: galleryImages = [] } = trpc.content.list.useQuery(
    { assetType: "image", status: "ready" },
    { staleTime: 30_000 }
  );

  const handleCopyCaption = (key: string, text: string, hashtags: string[]) => {
    const full = captionIncludeHashtags && hashtags?.length
      ? `${text}\n\n${hashtags.map((h: string) => `#${h.replace(/^#/, "")}`).join(" ")}`
      : text;
    navigator.clipboard.writeText(full);
    setCopiedKey(key);
    toast.success(`${key} caption copied!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateCaptions = () => {
    if (!captionAssetId && !captionCustomDesc.trim()) {
      toast.error("Select a gallery image or enter a description");
      return;
    }
    if (captionPlatforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }
    setCaptionResult(null);
    generateCaptionsMut.mutate({
      assetId: captionAssetId ?? undefined,
      imageDescription: captionCustomDesc || undefined,
      platforms: captionPlatforms as any,
      tone: captionTone,
      includeHashtags: captionIncludeHashtags,
      includeEmoji: captionIncludeEmoji,
      campaignContext: captionContext || undefined,
    });
  };

  const generateVideoMut = trpc.content.generateVideo.useMutation({
    onSuccess: (data) => {
      setGeneratedVideo(data);
      setVideoDialogOpen(true);
      utils.content.list.invalidate();
      toast.success("Video production package created!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerateImage = () => {
    if (!imageTitle.trim() || !imagePrompt.trim()) {
      toast.error("Please provide a title and prompt");
      return;
    }
    setGeneratedImage(null);
    generateImageMut.mutate({
      title: imageTitle,
      prompt: imagePrompt,
      style: imageStyle || undefined,
      tags: imageTags || undefined,
      enhancePrompt,
    });
  };

  const handleGenerateVideo = () => {
    if (!videoTitle.trim() || !videoConcept.trim()) {
      toast.error("Please provide a title and concept");
      return;
    }
    setGeneratedVideo(null);
    generateVideoMut.mutate({
      title: videoTitle,
      concept: videoConcept,
      duration: videoDuration,
      style: videoStyle || undefined,
      tags: videoTags || undefined,
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#39a7ff]" />
            Content Studio
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate AI-powered marketing images and video production packages for NSDS
          </p>
        </div>
        <Link href="/content-gallery">
          <Button variant="outline" className="gap-2 border-slate-700 text-slate-300 hover:text-white">
            <LayoutList className="h-4 w-4" />
            Asset Gallery
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="image" className="space-y-6">
        <TabsList className="bg-slate-800/60 border border-slate-700">
          <TabsTrigger value="image" className="gap-2 data-[state=active]:bg-[#39a7ff]/20 data-[state=active]:text-[#39a7ff]">
            <ImageIcon className="h-4 w-4" />
            Image Generator
          </TabsTrigger>
          <TabsTrigger value="video" className="gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Video className="h-4 w-4" />
            Video Producer
          </TabsTrigger>
          <TabsTrigger value="captions" className="gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            <Share2 className="h-4 w-4" />
            Social Captions
          </TabsTrigger>
        </TabsList>

        {/* ─── IMAGE TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="image" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Controls */}
            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-[#39a7ff]" />
                        Image Settings
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs mt-1">
                        Describe the marketing image you want to create
                      </CardDescription>
                    </div>
                    {(imageTitle || imagePrompt || generatedImage) && (
                      <Button variant="ghost" size="sm" onClick={clearImageForm} className="text-slate-500 hover:text-white text-xs h-7 px-2">
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Asset Title *</Label>
                    <Input
                      placeholder="e.g. Q3 Warehouse Hero Shot"
                      value={imageTitle}
                      onChange={(e) => setImageTitle(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-xs">Image Prompt *</Label>
                      <span className={`text-xs ${imagePrompt.length > 400 ? "text-amber-400" : "text-slate-600"}`}>{imagePrompt.length}/500</span>
                    </div>
                    <Textarea
                      placeholder="Describe the scene, subjects, environment, mood..."
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      maxLength={500}
                      rows={4}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Style</Label>
                    <Select value={imageStyle} onValueChange={setImageStyle}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {IMAGE_STYLES.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-slate-200 focus:bg-slate-700">
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Tags (comma-separated)</Label>
                    <Input
                      placeholder="e.g. warehouse, hero, q3-2026"
                      value={imageTags}
                      onChange={(e) => setImageTags(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div>
                      <p className="text-slate-300 text-xs font-medium">AI Prompt Enhancement</p>
                      <p className="text-slate-500 text-xs">Automatically improve your prompt for better results</p>
                    </div>
                    <Switch
                      checked={enhancePrompt}
                      onCheckedChange={setEnhancePrompt}
                    />
                  </div>

                  <Button
                    onClick={handleGenerateImage}
                    disabled={generateImageMut.isPending}
                    className="w-full bg-[#39a7ff] hover:bg-[#2196f3] text-[#07111f] font-semibold gap-2"
                  >
                    {generateImageMut.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating... (10–20s)
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Quick templates */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">Quick Templates</CardTitle>
                    {selectedImageTemplate && (
                      <span className="text-xs text-[#39a7ff] bg-[#39a7ff]/10 px-2 py-0.5 rounded-full">Selected</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {IMAGE_TEMPLATES.map((t) => {
                    const isSelected = selectedImageTemplate === t.label;
                    return (
                      <button
                        key={t.label}
                        onClick={() => {
                          setImageTitle(t.title);
                          setImagePrompt(t.prompt);
                          setSelectedImageTemplate(t.label);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition-all group ${
                          isSelected
                            ? "bg-[#39a7ff]/10 border-[#39a7ff]/50 ring-1 ring-[#39a7ff]/30"
                            : "bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-[#39a7ff]/40"
                        }`}
                      >
                        <p className={`text-xs font-medium transition-colors ${isSelected ? "text-[#39a7ff]" : "text-slate-300 group-hover:text-[#39a7ff]"}`}>{t.label}</p>
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{t.prompt}</p>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right: Preview */}
            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[#6ee7b7]" />
                    Generated Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generateImageMut.isPending ? (
                    <div className="aspect-video bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 border border-slate-700">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-[#39a7ff]/30 border-t-[#39a7ff] animate-spin" />
                        <Sparkles className="h-5 w-5 text-[#39a7ff] absolute inset-0 m-auto" />
                      </div>
                      <div className="text-center">
                        <p className="text-slate-300 text-sm font-medium">Creating your image...</p>
                        <p className="text-slate-500 text-xs mt-1">AI is generating a professional marketing visual</p>
                      </div>
                    </div>
                  ) : generatedImage?.url ? (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden border border-slate-700">
                        <img
                          src={generatedImage.url}
                          alt="Generated marketing image"
                          className="w-full object-cover"
                        />
                      </div>
                      <div className="flex gap-2">
                        <a href={generatedImage.url} download target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button variant="outline" className="w-full gap-2 border-slate-600 text-slate-300 hover:text-white text-xs">
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                        </a>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2 border-slate-600 text-slate-300 hover:text-white text-xs"
                          onClick={() => {
                            generateImageMut.mutate({
                              title: imageTitle,
                              prompt: imagePrompt,
                              style: imageStyle || undefined,
                              tags: imageTags || undefined,
                              enhancePrompt,
                            });
                          }}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-800/50 rounded-xl flex flex-col items-center justify-center gap-2 border border-dashed border-slate-700">
                      <ImageIcon className="h-10 w-10 text-slate-600" />
                      <p className="text-slate-500 text-sm">Your generated image will appear here</p>
                      <p className="text-slate-600 text-xs">Fill in the settings and click Generate</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-4 space-y-2">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Pro Tips</p>
                  <ul className="space-y-1.5 text-slate-500 text-xs">
                    <li className="flex gap-2"><Zap className="h-3 w-3 text-[#39a7ff] mt-0.5 shrink-0" />Enable AI Enhancement for significantly better results</li>
                    <li className="flex gap-2"><Zap className="h-3 w-3 text-[#39a7ff] mt-0.5 shrink-0" />Be specific about lighting, environment, and mood</li>
                    <li className="flex gap-2"><Zap className="h-3 w-3 text-[#39a7ff] mt-0.5 shrink-0" />Use "Regenerate" to get variations of the same concept</li>
                    <li className="flex gap-2"><Zap className="h-3 w-3 text-[#39a7ff] mt-0.5 shrink-0" />All assets are saved to the gallery automatically</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── VIDEO TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="video" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Controls */}
            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <Film className="h-4 w-4 text-purple-400" />
                        Video Settings
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs mt-1">
                        Describe your video concept — AI generates a full production package with script, scenes, and storyboard
                      </CardDescription>
                    </div>
                    {(videoTitle || videoConcept || generatedVideo) && (
                      <Button variant="ghost" size="sm" onClick={clearVideoForm} className="text-slate-500 hover:text-white text-xs h-7 px-2">
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Video Title *</Label>
                    <Input
                      placeholder="e.g. NSDS Brand Overview 2026"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-xs">Video Concept *</Label>
                      <span className={`text-xs ${videoConcept.length > 400 ? "text-amber-400" : "text-slate-600"}`}>{videoConcept.length}/500</span>
                    </div>
                    <Textarea
                      placeholder="Describe what the video should communicate, who the audience is, and the key message..."
                      value={videoConcept}
                      onChange={(e) => setVideoConcept(e.target.value)}
                      maxLength={500}
                      rows={4}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Duration</Label>
                    <Select value={videoDuration} onValueChange={(v) => setVideoDuration(v as any)}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {VIDEO_DURATIONS.map((d) => (
                          <SelectItem key={d.value} value={d.value} className="text-slate-200 focus:bg-slate-700">
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Style / Tone (optional)</Label>
                    <Input
                      placeholder="e.g. professional, energetic, trustworthy, cinematic"
                      value={videoStyle}
                      onChange={(e) => setVideoStyle(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Tags (comma-separated)</Label>
                    <Input
                      placeholder="e.g. brand, social, q3-2026"
                      value={videoTags}
                      onChange={(e) => setVideoTags(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <Button
                    onClick={handleGenerateVideo}
                    disabled={generateVideoMut.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-2"
                  >
                    {generateVideoMut.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Producing... (15–30s)
                      </>
                    ) : (
                      <>
                        <Film className="h-4 w-4" />
                        Generate Video Package
                      </>
                    )}
                  </Button>

                  <p className="text-slate-600 text-xs text-center">
                    Generates: script, scene-by-scene breakdown, voiceover, CTA, music direction + storyboard thumbnail
                  </p>
                </CardContent>
              </Card>

              {/* Quick templates */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">Quick Templates</CardTitle>
                    {selectedVideoTemplate && (
                      <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">Selected</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {VIDEO_TEMPLATES.map((t) => {
                    const isSelected = selectedVideoTemplate === t.label;
                    return (
                      <button
                        key={t.label}
                        onClick={() => {
                          setVideoTitle(t.title);
                          setVideoConcept(t.concept);
                          setSelectedVideoTemplate(t.label);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition-all group ${
                          isSelected
                            ? "bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/30"
                            : "bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-purple-500/40"
                        }`}
                      >
                        <p className={`text-xs font-medium transition-colors ${isSelected ? "text-purple-400" : "text-slate-300 group-hover:text-purple-400"}`}>{t.label}</p>
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{t.concept}</p>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right: What you get */}
            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Video className="h-4 w-4 text-purple-400" />
                    What You'll Receive
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: Zap, color: "text-yellow-400", title: "Hook Line", desc: "Attention-grabbing opening for the first 3 seconds" },
                    { icon: Mic, color: "text-[#39a7ff]", title: "Full Voiceover Script", desc: "Complete narration text ready for recording" },
                    { icon: Film, color: "text-purple-400", title: "Scene Breakdown", desc: "Timestamped scenes with visual descriptions and text overlays" },
                    { icon: MessageSquare, color: "text-[#6ee7b7]", title: "Call-to-Action", desc: "Optimized CTA text for your target audience" },
                    { icon: Music, color: "text-pink-400", title: "Music Direction", desc: "Mood and style guidance for background music" },
                    { icon: ImageIcon, color: "text-orange-400", title: "Storyboard Thumbnail", desc: "AI-generated visual for the opening scene" },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-3 items-start">
                      <div className={`mt-0.5 ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-slate-200 text-xs font-medium">{item.title}</p>
                        <p className="text-slate-500 text-xs">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {generatedVideo && (
                <Card className="bg-slate-900 border-purple-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Film className="h-4 w-4 text-purple-400" />
                      Latest Package Ready
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {generatedVideo.thumbnailUrl && (
                      <img
                        src={generatedVideo.thumbnailUrl}
                        alt="Storyboard thumbnail"
                        className="w-full rounded-lg border border-slate-700 object-cover"
                      />
                    )}
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2 text-xs"
                      onClick={() => setVideoDialogOpen(true)}
                    >
                      <Film className="h-3.5 w-3.5" />
                      View Full Production Package
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        {/* ─── CAPTIONS TAB ──────────────────────────────────────────────────── */}
        <TabsContent value="captions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Controls */}
            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-green-400" />
                        Caption Settings
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs mt-1">
                        Pick a generated image or describe one — AI writes platform-optimised captions
                      </CardDescription>
                    </div>
                    {(captionAssetId || captionCustomDesc || captionResult) && (
                      <Button variant="ghost" size="sm" onClick={clearCaptionsForm} className="text-slate-500 hover:text-white text-xs h-7 px-2">
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Image source */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Source Image</Label>
                    {galleryImages.length > 0 ? (
                      <Select
                        value={captionAssetId ? String(captionAssetId) : "custom"}
                        onValueChange={(v) => {
                          if (v === "custom") setCaptionAssetId(null);
                          else setCaptionAssetId(Number(v));
                        }}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                          <SelectValue placeholder="Select a gallery image..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="custom" className="text-slate-200 focus:bg-slate-700">Custom description (no image)</SelectItem>
                          {galleryImages.map((img) => (
                            <SelectItem key={img.id} value={String(img.id)} className="text-slate-200 focus:bg-slate-700">
                              {img.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-500 text-xs bg-slate-800 rounded-lg p-3 border border-slate-700">
                        No gallery images yet — generate one in the Image Generator tab first, or use a custom description below.
                      </p>
                    )}
                  </div>

                  {/* Selected image preview */}
                  {captionAssetId && (() => {
                    const img = galleryImages.find((i) => i.id === captionAssetId);
                    return img?.fileUrl ? (
                      <div className="rounded-lg overflow-hidden border border-slate-700">
                        <img src={img.fileUrl} alt={img.title} className="w-full object-cover max-h-36" />
                      </div>
                    ) : null;
                  })()}

                  {/* Caption templates (shown when no gallery image selected) */}
                  {!captionAssetId && (
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-xs">Quick Scenarios</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {CAPTION_TEMPLATES.map((t) => (
                          <button
                            key={t.label}
                            onClick={() => setCaptionCustomDesc(t.desc)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                              captionCustomDesc === t.desc
                                ? "bg-green-500/15 border-green-500/50 text-green-400"
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-green-400 hover:border-green-500/30"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom description */}
                  {!captionAssetId && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-300 text-xs">Image Description *</Label>
                        <span className={`text-xs ${captionCustomDesc.length > 300 ? "text-amber-400" : "text-slate-600"}`}>{captionCustomDesc.length}/400</span>
                      </div>
                      <Textarea
                        placeholder="Describe the image scene, subjects, and mood..."
                        value={captionCustomDesc}
                        onChange={(e) => setCaptionCustomDesc(e.target.value)}
                        maxLength={400}
                        rows={3}
                        className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                      />
                    </div>
                  )}

                  {/* Platforms */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-xs">Platforms ({captionPlatforms.length} selected)</Label>
                      <button
                        onClick={() => setCaptionPlatforms(
                          captionPlatforms.length === 4 ? ["linkedin"] : ["linkedin", "instagram", "twitter", "facebook"]
                        )}
                        className="text-xs text-slate-500 hover:text-green-400 transition-colors"
                      >
                        {captionPlatforms.length === 4 ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: "linkedin", label: "LinkedIn", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                        { id: "instagram", label: "Instagram", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
                        { id: "twitter", label: "Twitter / X", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
                        { id: "facebook", label: "Facebook", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
                      ] as const).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setCaptionPlatforms((prev) => {
                            if (prev.includes(p.id)) {
                              // Prevent deselecting the last platform
                              if (prev.length === 1) return prev;
                              return prev.filter((x) => x !== p.id);
                            }
                            return [...prev, p.id];
                          })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                            captionPlatforms.includes(p.id)
                              ? `${p.bg} ${p.color}`
                              : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${captionPlatforms.includes(p.id) ? "bg-current" : "bg-slate-600"}`} />
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tone */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Tone</Label>
                    <Select value={captionTone} onValueChange={(v) => setCaptionTone(v as any)}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="professional" className="text-slate-200 focus:bg-slate-700">Professional</SelectItem>
                        <SelectItem value="conversational" className="text-slate-200 focus:bg-slate-700">Conversational</SelectItem>
                        <SelectItem value="energetic" className="text-slate-200 focus:bg-slate-700">Energetic</SelectItem>
                        <SelectItem value="educational" className="text-slate-200 focus:bg-slate-700">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Options */}
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={captionIncludeHashtags}
                        onCheckedChange={(v) => setCaptionIncludeHashtags(!!v)}
                        className="border-slate-600"
                      />
                      <span className="text-slate-300 text-xs">Include hashtags</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={captionIncludeEmoji}
                        onCheckedChange={(v) => setCaptionIncludeEmoji(!!v)}
                        className="border-slate-600"
                      />
                      <span className="text-slate-300 text-xs">Include emoji</span>
                    </label>
                  </div>

                  {/* Campaign context */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs">Campaign Context (optional)</Label>
                    <Input
                      placeholder="e.g. Q3 lead gen campaign targeting DFW MSPs"
                      value={captionContext}
                      onChange={(e) => setCaptionContext(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <Button
                    onClick={handleGenerateCaptions}
                    disabled={generateCaptionsMut.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold gap-2"
                  >
                    {generateCaptionsMut.isPending ? (
                      <><RefreshCw className="h-4 w-4 animate-spin" />Generating captions...</>
                    ) : (
                      <><Share2 className="h-4 w-4" />Generate Captions</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: Results */}
            <div className="space-y-4">
              {generateCaptionsMut.isPending ? (
                <Card className="bg-slate-900 border-slate-700">
                  <CardContent className="pt-8 pb-8 flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-green-500/30 border-t-green-500 animate-spin" />
                      <Share2 className="h-5 w-5 text-green-400 absolute inset-0 m-auto" />
                    </div>
                    <p className="text-slate-300 text-sm font-medium">Writing captions...</p>
                    <p className="text-slate-500 text-xs">Crafting {captionPlatforms.length} platform-specific versions</p>
                  </CardContent>
                </Card>
              ) : captionResult ? (
                <div className="space-y-3">
                  {/* Alt text */}
                  {captionResult.altText && (
                    <Card className="bg-slate-900 border-slate-700">
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Accessibility Alt Text
                          </span>
                          <Button variant="ghost" size="sm" className="h-5 text-xs text-slate-600 hover:text-white"
                            onClick={() => { navigator.clipboard.writeText(captionResult.altText); toast.success("Alt text copied"); }}>
                            Copy
                          </Button>
                        </div>
                        <p className="text-slate-400 text-xs italic">{captionResult.altText}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Per-platform captions */}
                  {([
                    { id: "linkedin", label: "LinkedIn", accent: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5" },
                    { id: "instagram", label: "Instagram", accent: "text-pink-400", border: "border-pink-500/20", bg: "bg-pink-500/5" },
                    { id: "twitter", label: "Twitter / X", accent: "text-sky-400", border: "border-sky-500/20", bg: "bg-sky-500/5" },
                    { id: "facebook", label: "Facebook", accent: "text-indigo-400", border: "border-indigo-500/20", bg: "bg-indigo-500/5" },
                  ] as const)
                    .filter((p) => captionResult.captions?.[p.id])
                    .map((p) => {
                      const cap = captionResult.captions[p.id];
                      const isCopied = copiedKey === p.id;
                      return (
                        <Card key={p.id} className={`bg-slate-900 ${p.border} border`}>
                          <CardHeader className="pb-2 pt-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className={`text-sm flex items-center gap-2 ${p.accent}`}>
                                <Share2 className="h-3.5 w-3.5" />
                                {p.label}
                                {cap.charCount > 0 && (
                                  <span className="text-slate-600 text-xs font-normal">{cap.charCount} chars</span>
                                )}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 text-xs gap-1 ${isCopied ? "text-green-400" : "text-slate-500 hover:text-white"}`}
                                onClick={() => handleCopyCaption(p.id, cap.text, cap.hashtags)}
                              >
                                {isCopied ? <><Check className="h-3 w-3" />Copied!</> : <><Copy className="h-3 w-3" />Copy</>}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className={`pt-0 rounded-b-xl ${p.bg}`}>
                            <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line">{cap.text}</p>
                            {captionIncludeHashtags && cap.hashtags?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {cap.hashtags.map((tag: string, i: number) => (
                                  <span key={i} className={`text-xs ${p.accent} opacity-70`}>
                                    #{tag.replace(/^#/, "")}
                                  </span>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}

                  <Button
                    variant="outline"
                    className="w-full border-slate-700 text-slate-400 hover:text-white gap-2 text-xs"
                    onClick={() => {
                      const all = Object.entries(captionResult.captions)
                        .map(([platform, cap]: [string, any]) => `=== ${platform.toUpperCase()} ===\n${cap.text}${captionIncludeHashtags && cap.hashtags?.length ? `\n\n${cap.hashtags.map((h: string) => `#${h.replace(/^#/, "")}`).join(" ")}` : ""}`)
                        .join("\n\n");
                      navigator.clipboard.writeText(all);
                      toast.success("All captions copied!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy All Captions
                  </Button>
                </div>
              ) : (
                <Card className="bg-slate-900 border-slate-700">
                  <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3">
                    <Share2 className="h-10 w-10 text-slate-600" />
                    <p className="text-slate-400 text-sm">Your captions will appear here</p>
                    <p className="text-slate-600 text-xs text-center max-w-xs">
                      Select an image from your gallery (or enter a description), choose your platforms, and click Generate
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Video Package Dialog ─────────────────────────────────────────────── */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Film className="h-5 w-5 text-purple-400" />
              Video Production Package
            </DialogTitle>
          </DialogHeader>
          {generatedVideo?.videoPackage && (
            <VideoPackageView pkg={generatedVideo.videoPackage} thumbnailUrl={generatedVideo.thumbnailUrl} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Video Package View ───────────────────────────────────────────────────────
function VideoPackageView({ pkg, thumbnailUrl }: { pkg: any; thumbnailUrl?: string | null }) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-5">
      {/* Storyboard thumbnail */}
      {thumbnailUrl && (
        <div className="rounded-xl overflow-hidden border border-slate-700">
          <img src={thumbnailUrl} alt="Storyboard" className="w-full object-cover" />
          <div className="bg-slate-800 px-3 py-1.5 flex items-center gap-2">
            <Film className="h-3 w-3 text-purple-400" />
            <span className="text-slate-400 text-xs">Opening Scene Storyboard</span>
          </div>
        </div>
      )}

      {/* Hook */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-yellow-400" /> Hook (0:00–0:03)
          </h3>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-500 hover:text-white" onClick={() => copyToClipboard(pkg.hook, "Hook")}>
            Copy
          </Button>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p className="text-white text-sm font-medium">"{pkg.hook}"</p>
        </div>
      </div>

      {/* Voiceover */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5 text-[#39a7ff]" /> Full Voiceover Script
          </h3>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-500 hover:text-white" onClick={() => copyToClipboard(pkg.voiceover, "Voiceover")}>
            Copy
          </Button>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p className="text-slate-200 text-sm leading-relaxed">{pkg.voiceover}</p>
        </div>
      </div>

      {/* Scenes */}
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

      {/* CTA + Music */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[#6ee7b7]" /> Call to Action
          </h3>
          <div className="bg-slate-800 rounded-lg p-3 border border-[#6ee7b7]/20 h-full">
            <p className="text-[#6ee7b7] text-sm font-medium">{pkg.cta}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Music className="h-3.5 w-3.5 text-pink-400" /> Music Direction
          </h3>
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 h-full">
            <p className="text-slate-300 text-sm">{pkg.music_mood}</p>
          </div>
        </div>
      </div>

      {/* Key Messages */}
      {pkg.key_messages?.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Key Messages</h3>
          <div className="flex flex-wrap gap-2">
            {pkg.key_messages.map((msg: string, i: number) => (
              <Badge key={i} className="bg-[#39a7ff]/10 text-[#39a7ff] border-[#39a7ff]/20 text-xs">
                {msg}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Copy all */}
      <Button
        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 gap-2 text-xs"
        onClick={() => copyToClipboard(JSON.stringify(pkg, null, 2), "Full package")}
      >
        <Download className="h-3.5 w-3.5" />
        Copy Full Package as JSON
      </Button>
    </div>
  );
}
