import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, MapPin, Phone, Globe, Plus, CheckCircle, Loader2, Building2 } from "lucide-react";

type PlaceResult = {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  types?: string[];
};

export default function LeadFinder() {
  const utils = trpc.useUtils();
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("Dallas, TX");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [importedIds, setImportedIds] = useState<string[]>([]);

  const { mutate: searchPlaces, isPending: isSearching } = trpc.leads.searchPlaces.useQuery as unknown as { mutate: never; isPending: never };

  // Use useQuery with enabled flag for search
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const { data: searchData, isFetching } = trpc.leads.searchPlaces.useQuery(
    { query: searchQuery ?? "" },
    {
      enabled: !!searchQuery,
      onSuccess: (data: PlaceResult[]) => {
        setResults(data ?? []);
        if ((data?.length ?? 0) === 0) toast.info("No results found — try a different industry or location");
      },
    } as any
  );

  const importMutation = trpc.leads.importPlace.useMutation({
    onSuccess: (_: unknown, vars: { placeId: string; name: string; address?: string; phone?: string; website?: string; industry?: string }) => {
      setImportedIds(prev => [...prev, vars.placeId]);
      utils.leads.list.invalidate();
      utils.leads.stats.invalidate();
      toast.success("Lead imported to pipeline");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const doSearch = (q: string) => {
    if (!q.trim()) return;
    const query = `${q} in ${location}`;
    setSearchQuery(query);
  };

  const QUICK_INDUSTRIES = ["IT companies", "Healthcare", "Logistics", "Manufacturing", "Finance", "Retail", "Education", "Construction", "Real Estate", "Law Firms"];
  const displayResults: PlaceResult[] = (searchData as PlaceResult[] | undefined) ?? results;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><MapPin className="h-6 w-6 text-primary" />Lead Finder</h1>
          <p className="text-muted-foreground mt-1">Search for DFW businesses by industry using Google Maps. Import them directly into your pipeline.</p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="py-4 px-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Industry (e.g. IT companies, healthcare, logistics...)"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="pl-9"
                  onKeyDown={e => { if (e.key === "Enter" && industry.trim()) doSearch(industry); }}
                />
              </div>
              <div className="relative w-full sm:w-48">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                disabled={!industry.trim() || isFetching}
                onClick={() => doSearch(industry)}
                className="shrink-0"
              >
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Search
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_INDUSTRIES.map(q => (
                <button
                  key={q}
                  className="text-xs px-2.5 py-1 rounded-full border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  onClick={() => { setIndustry(q); doSearch(q); }}
                >
                  {q}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {displayResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{displayResults.length} results found</p>
              <Button
                size="sm"
                variant="outline"
                disabled={importMutation.isPending}
                onClick={() => {
                  const unimported = displayResults.filter(r => !importedIds.includes(r.place_id));
                  unimported.forEach(r => importMutation.mutate({ placeId: r.place_id, name: r.name, address: r.formatted_address, industry }));
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />Import All
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayResults.map(place => {
                const imported = importedIds.includes(place.place_id);
                return (
                  <Card key={place.place_id} className={imported ? "opacity-60" : ""}>
                    <CardContent className="py-3 px-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{place.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{place.formatted_address}</span>
                          </p>
                        </div>
                        {place.rating && <Badge variant="outline" className="text-xs shrink-0">★ {place.rating}</Badge>}
                      </div>
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs"
                        variant={imported ? "secondary" : "default"}
                        disabled={imported || importMutation.isPending}
                        onClick={() => importMutation.mutate({ placeId: place.place_id, name: place.name, address: place.formatted_address, industry })}
                      >
                        {imported ? <><CheckCircle className="h-3 w-3 mr-1" />Imported</> : <><Plus className="h-3 w-3 mr-1" />Import to Pipeline</>}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {displayResults.length === 0 && !isFetching && (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Search for businesses above</p>
            <p className="text-sm mt-1">Try "IT companies", "healthcare", or "logistics" in Dallas, TX</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
