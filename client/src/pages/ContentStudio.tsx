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
} from "lucide-react";
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

// ─── Image prompt templates ───────────────────────────────────────────────────
const IMAGE_TEMPLATES = [
  {
    label: "Warehouse Operations",
    prompt: "Modern IT hardware staging warehouse with organized rows of servers and network equipment on pallets, professional lighting, workers in branded uniforms, clean industrial environment",
  },
  {
    label: "Device Staging",
    prompt: "Technicians staging and configuring laptops and network switches on clean workbenches, professional IT lab environment, organized cables, multiple monitors showing configuration screens",
  },
  {
    label: "Secure Shipping",
    prompt: "Professionally packed IT equipment in branded boxes on pallets ready for shipment, warehouse dock, logistics team, clean and organized",
  },
  {
    label: "Customer Portal",
    prompt: "Modern dark-themed operations dashboard on a large monitor showing device tracking, shipment status, and staging progress charts, professional office environment",
  },
  {
    label: "Team & Expertise",
    prompt: "Professional IT staging team collaborating around servers and network equipment, confident and expert, modern warehouse facility, NSDS branding",
  },
  {
    label: "DFW Headquarters",
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
    concept: "NSDS company overview highlighting our end-to-end IT staging and deployment services for MSPs and enterprise IT teams in the DFW area",
  },
  {
    label: "Customer Success",
    concept: "How NSDS helps IT teams save time and reduce errors by handling device staging, imaging, and deployment prep so they can focus on their core business",
  },
  {
    label: "Service Walkthrough",
    concept: "Step-by-step walkthrough of the NSDS staging process: receiving, organizing, staging, imaging, packing, and shipping IT hardware",
  },
  {
    label: "Portal Demo",
    concept: "Demo of the StagingOps customer portal showing real-time device tracking, forwarding addresses, shipment status, and document management",
  },
  {
    label: "Why Choose NSDS",
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

  // Video generation state
  const [videoTitle, setVideoTitle] = useState("");
  const [videoConcept, setVideoConcept] = useState("");
  const [videoDuration, setVideoDuration] = useState<"15s" | "30s" | "60s">("30s");
  const [videoStyle, setVideoStyle] = useState("");
  const [videoTags, setVideoTags] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<{ id: number; videoPackage: any; thumbnailUrl?: string | null } | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  // Mutations
  const generateImageMut = trpc.content.generateImage.useMutation({
    onSuccess: (data) => {
      setGeneratedImage(data);
      utils.content.list.invalidate();
      toast.success("Image generated successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

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
        </TabsList>

        {/* ─── IMAGE TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="image" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Controls */}
            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-[#39a7ff]" />
                    Image Settings
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Describe the marketing image you want to create
                  </CardDescription>
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
                    <Label className="text-slate-300 text-xs">Image Prompt *</Label>
                    <Textarea
                      placeholder="Describe the scene, subjects, environment, mood..."
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
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
                  <CardTitle className="text-white text-sm">Quick Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {IMAGE_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setImagePrompt(t.prompt)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-[#39a7ff]/40 transition-colors group"
                    >
                      <p className="text-slate-300 text-xs font-medium group-hover:text-[#39a7ff] transition-colors">{t.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{t.prompt}</p>
                    </button>
                  ))}
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
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Film className="h-4 w-4 text-purple-400" />
                    Video Settings
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Describe your video concept — AI generates a full production package with script, scenes, and storyboard
                  </CardDescription>
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
                    <Label className="text-slate-300 text-xs">Video Concept *</Label>
                    <Textarea
                      placeholder="Describe what the video should communicate, who the audience is, and the key message..."
                      value={videoConcept}
                      onChange={(e) => setVideoConcept(e.target.value)}
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
                  <CardTitle className="text-white text-sm">Quick Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {VIDEO_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setVideoConcept(t.concept)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/40 transition-colors group"
                    >
                      <p className="text-slate-300 text-xs font-medium group-hover:text-purple-400 transition-colors">{t.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{t.concept}</p>
                    </button>
                  ))}
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
