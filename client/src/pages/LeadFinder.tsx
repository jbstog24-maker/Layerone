import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import RichTextEditor, { plainTextToHtml } from "@/components/RichTextEditor";
import {
  Search, MapPin, Plus, CheckCircle, Loader2, Building2,
  Mail, Sparkles, Send, RefreshCw, ChevronRight, Target,
} from "lucide-react";

type PlaceResult = {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  types?: string[];
  business_status?: string;
};

// ─── Layer One-specific prospect categories ───────────────────────────────────────
const PROSPECT_CATEGORIES = [
  {
    group: "Core Targets",
    color: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    items: [
      { label: "Managed Service Providers", query: "managed service provider MSP IT services" },
      { label: "IT VARs & Resellers", query: "IT value added reseller VAR technology solutions" },
      { label: "IT Staffing & Consulting", query: "IT staffing consulting technology services" },
    ],
  },
  {
    group: "Installation & Integration",
    color: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    items: [
      { label: "Cabling Contractors", query: "network cabling contractor low voltage structured cabling" },
      { label: "Security Integrators", query: "security systems integrator access control surveillance" },
      { label: "AV & Low-Voltage", query: "audio visual AV integrator low voltage installation" },
    ],
  },
  {
    group: "Enterprise IT",
    color: "bg-green-500/10 border-green-500/30 text-green-400",
    items: [
      { label: "Healthcare IT", query: "healthcare IT technology hospital clinic network" },
      { label: "Financial Services IT", query: "financial services technology bank credit union IT" },
      { label: "Logistics & Distribution", query: "logistics distribution warehouse technology IT" },
    ],
  },
  {
    group: "Other B2B",
    color: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    items: [
      { label: "Construction Tech", query: "construction technology IT services general contractor" },
      { label: "Manufacturing IT", query: "manufacturing technology IT services industrial" },
      { label: "Government & Education IT", query: "government municipality school district IT technology" },
    ],
  },
];

// ─── DFW sub-regions ──────────────────────────────────────────────────────────
const DFW_REGIONS = [
  { label: "All DFW", value: "" },
  { label: "Dallas", value: "Dallas" },
  { label: "Fort Worth", value: "Fort Worth" },
  { label: "Plano", value: "Plano" },
  { label: "Irving", value: "Irving" },
  { label: "Frisco", value: "Frisco" },
  { label: "McKinney", value: "McKinney" },
  { label: "Arlington", value: "Arlington" },
  { label: "Garland", value: "Garland" },
  { label: "Richardson", value: "Richardson" },
  { label: "Allen", value: "Allen" },
  { label: "Carrollton", value: "Carrollton" },
];

// ─── DFW center coordinates ───────────────────────────────────────────────────
const DFW_COORDS: Record<string, string> = {
  "": "32.7767,-96.7970",
  "Dallas": "32.7767,-96.7970",
  "Fort Worth": "32.7555,-97.3308",
  "Plano": "33.0198,-96.6989",
  "Irving": "32.8140,-96.9489",
  "Frisco": "33.1507,-96.8236",
  "McKinney": "33.1972,-96.6397",
  "Arlington": "32.7357,-97.1081",
  "Garland": "32.9126,-96.6389",
  "Richardson": "32.9483,-96.7299",
  "Allen": "33.1032,-96.6705",
  "Carrollton": "32.9537,-96.8903",
};

export default function LeadFinder() {
  const utils = trpc.useUtils();
  const [customQuery, setCustomQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [subRegion, setSubRegion] = useState("");
  const [importedIds, setImportedIds] = useState<string[]>([]);

  // Intro email state
  const [introDialogOpen, setIntroDialogOpen] = useState(false);
  const [introTarget, setIntroTarget] = useState<PlaceResult | null>(null);
  const [introLeadId, setIntroLeadId] = useState<number | null>(null);
  const [introSubject, setIntroSubject] = useState("");
  const [introBody, setIntroBody] = useState("");
  const [introEmail, setIntroEmail] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);

  const { data: searchData, isFetching } = trpc.leads.searchPlaces.useQuery(
    {
      query: activeQuery ?? "",
      location: DFW_COORDS[subRegion] ?? "32.7767,-96.7970",
      subRegion: subRegion || undefined,
    },
    { enabled: !!activeQuery, staleTime: 60_000 }
  );

  const importMutation = trpc.leads.importPlace.useMutation({
    onSuccess: (data, vars) => {
      setImportedIds((prev) => [...prev, vars.placeId]);
      setIntroLeadId(data.id);
      utils.leads.list.invalidate();
      utils.leads.stats?.invalidate?.();
      toast.success("Lead imported to pipeline");
    },
    onError: (e) => toast.error(e.message),
  });

  const draftIntroMut = trpc.leads.draftIntroEmail.useMutation({
    onSuccess: (data) => {
      setIntroSubject(data.subject);
      // Convert plain-text AI draft to HTML for the rich text editor
      const isHtml = data.body.trimStart().startsWith("<");
      setIntroBody(isHtml ? data.body : plainTextToHtml(data.body));
      setIsDrafting(false);
    },
    onError: (e) => {
      toast.error(e.message);
      setIsDrafting(false);
    },
  });

  const sendIntroMut = trpc.leads.sendIntroEmail.useMutation({
    onSuccess: () => {
      toast.success("Introduction email sent!");
      setIntroDialogOpen(false);
      setIntroTarget(null);
      setIntroLeadId(null);
      setIntroSubject("");
      setIntroBody("");
      setIntroEmail("");
    },
    onError: (e) => toast.error(e.message),
  });

  const doSearch = (query: string, categoryLabel?: string) => {
    if (!query.trim()) return;
    setActiveQuery(query);
    setActiveCategory(categoryLabel ?? null);
  };

  const openIntroDialog = async (place: PlaceResult) => {
    setIntroTarget(place);
    setIntroSubject("");
    setIntroBody("");
    setIntroEmail("");
    setIntroDialogOpen(true);
    setIsDrafting(true);

    // Parse city from address
    const parts = place.formatted_address.split(",");
    const city = parts.length >= 2 ? parts[parts.length - 3]?.trim() ?? "DFW" : "DFW";

    draftIntroMut.mutate({
      companyName: place.name,
      city,
    });
  };

  const handleSendIntro = () => {
    if (!introLeadId) {
      toast.error("Import this lead to your pipeline first before sending an email");
      return;
    }
    if (!introEmail.trim()) {
      toast.error("Please enter the recipient's email address");
      return;
    }
    sendIntroMut.mutate({
      leadId: introLeadId,
      subject: introSubject,
      body: introBody,
      recipientEmail: introEmail,
    });
  };

  const displayResults: PlaceResult[] = (searchData as PlaceResult[] | undefined) ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Lead Finder
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Discover DFW businesses that match Layer One's customer profile — MSPs, IT VARs, cabling contractors, security integrators, and enterprise IT teams.
            </p>
          </div>
        </div>

        {/* Search + Sub-region */}
        <Card>
          <CardContent className="py-4 px-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Custom search (e.g. MSP, retail rollout company, data-center contractor...)"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  className="pl-9"
                  onKeyDown={(e) => { if (e.key === "Enter" && customQuery.trim()) doSearch(customQuery); }}
                />
              </div>
              <Button
                disabled={!customQuery.trim() || isFetching}
                onClick={() => doSearch(customQuery)}
                className="shrink-0"
              >
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Search
              </Button>
            </div>

            {/* DFW Sub-region filter */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">DFW Area</p>
              <div className="flex flex-wrap gap-2">
                {DFW_REGIONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setSubRegion(r.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      subRegion === r.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layer One Prospect Categories */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Layer One Target Prospect Categories
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROSPECT_CATEGORIES.map((group) => (
              <Card key={group.group} className="bg-card">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.group}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1.5">
                  {group.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => doSearch(item.query, item.label)}
                      disabled={isFetching}
                      className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                        activeCategory === item.label
                          ? group.color
                          : "bg-muted/30 border-border hover:bg-muted"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Results */}
        {isFetching && (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Searching {subRegion || "DFW"} for {activeCategory ?? "businesses"}...</span>
          </div>
        )}

        {!isFetching && displayResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{displayResults.length}</strong> prospects found
                  {activeCategory && <span className="ml-1">· {activeCategory}</span>}
                  {subRegion && <span className="ml-1">· {subRegion}</span>}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={importMutation.isPending}
                onClick={() => {
                  const unimported = displayResults.filter((r) => !importedIds.includes(r.place_id));
                  unimported.forEach((r) =>
                    importMutation.mutate({
                      placeId: r.place_id,
                      name: r.name,
                      address: r.formatted_address,
                      industry: activeCategory ?? customQuery,
                    })
                  );
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Import All
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayResults.map((place) => {
                const imported = importedIds.includes(place.place_id);
                return (
                  <Card key={place.place_id} className={`transition-opacity ${imported ? "opacity-70" : ""}`}>
                    <CardContent className="py-3 px-4 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm leading-tight">{place.name}</p>
                          {place.rating && (
                            <Badge variant="outline" className="text-xs shrink-0">★ {place.rating}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-start gap-1">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                          <span>{place.formatted_address}</span>
                        </p>
                        {activeCategory && (
                          <Badge variant="secondary" className="text-xs">
                            {activeCategory}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          variant={imported ? "secondary" : "default"}
                          disabled={imported || importMutation.isPending}
                          onClick={() =>
                            importMutation.mutate({
                              placeId: place.place_id,
                              name: place.name,
                              address: place.formatted_address,
                              industry: activeCategory ?? customQuery,
                            })
                          }
                        >
                          {imported ? (
                            <><CheckCircle className="h-3 w-3 mr-1" />Imported</>
                          ) : (
                            <><Plus className="h-3 w-3 mr-1" />Import</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs gap-1"
                          onClick={() => openIntroDialog(place)}
                          title="Draft & send introduction email"
                        >
                          <Mail className="h-3 w-3" />
                          Intro
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {!isFetching && displayResults.length === 0 && !activeQuery && (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Select a prospect category above or enter a custom search</p>
            <p className="text-sm mt-1">Results are filtered to show only operational B2B businesses in the DFW area</p>
          </div>
        )}

        {!isFetching && displayResults.length === 0 && activeQuery && (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No results found</p>
            <p className="text-sm mt-1">Try a different category or sub-region</p>
          </div>
        )}
      </div>

      {/* Introduction Email Dialog */}
      <Dialog open={introDialogOpen} onOpenChange={setIntroDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Send Introduction Email
              {introTarget && <span className="text-muted-foreground font-normal">— {introTarget.name}</span>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {isDrafting ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <Sparkles className="h-4 w-4 text-primary absolute inset-0 m-auto" />
                </div>
                <p className="text-sm">AI is drafting a professional introduction...</p>
              </div>
            ) : (
              <>
                {!introLeadId && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>Import this lead to your pipeline first (click Import on the card) so the email is tracked in their record.</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Recipient Email *</Label>
                  <Input
                    placeholder="contact@company.com"
                    value={introEmail}
                    onChange={(e) => setIntroEmail(e.target.value)}
                    type="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Subject Line</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs gap-1 text-muted-foreground"
                      disabled={isDrafting || draftIntroMut.isPending}
                      onClick={() => {
                        if (!introTarget) return;
                        setIsDrafting(true);
                        const parts = introTarget.formatted_address.split(",");
                        const city = parts.length >= 2 ? parts[parts.length - 3]?.trim() ?? "DFW" : "DFW";
                        draftIntroMut.mutate({ companyName: introTarget.name, city });
                      }}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Redraft
                    </Button>
                  </div>
                  <Input
                    value={introSubject}
                    onChange={(e) => setIntroSubject(e.target.value)}
                    placeholder="Subject line..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Email Body</Label>
                  <RichTextEditor
                    value={introBody}
                    onChange={setIntroBody}
                    placeholder="Start typing your email..."
                    minHeight={220}
                  />
                  <p className="text-xs text-muted-foreground">
                    {introBody.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length} words — use the toolbar to add formatting, bullet points, and links
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIntroDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendIntro}
              disabled={isDrafting || !introSubject || !introBody || !introEmail || sendIntroMut.isPending}
              className="gap-2"
            >
              {sendIntroMut.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
              ) : (
                <><Send className="h-4 w-4" />Send Introduction</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
