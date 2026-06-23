import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Users, Package, Truck, FileText, Loader2 } from "lucide-react";

type SearchResult = {
  id: number;
  label: string;
  sublabel?: string;
  type: "client" | "lead" | "shipment" | "invoice" | "device";
  href: string;
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { data: clients, isFetching: fetchingClients } = trpc.clients.list.useQuery(
    { search: query },
    { enabled: open && query.length >= 2 }
  );

  const { data: leads, isFetching: fetchingLeads } = trpc.leads.list.useQuery(
    { search: query },
    { enabled: open && query.length >= 2 }
  );

  const isLoading = fetchingClients || fetchingLeads;

  const results: SearchResult[] = [];

  if (clients) {
    clients.slice(0, 4).forEach(c => results.push({
      id: c.id,
      label: c.companyName,
      sublabel: c.contactEmail ?? c.contactPhone ?? undefined,
      type: "client",
      href: `/clients/${c.id}`,
    }));
  }

  if (leads) {
    leads.slice(0, 4).forEach(l => results.push({
      id: l.id,
      label: l.companyName,
      sublabel: l.status?.replace(/_/g, " ") + (l.city ? ` · ${l.city}` : ""),
      type: "lead",
      href: `/leads/${l.id}`,
    }));
  }

  const handleSelect = useCallback((href: string) => {
    navigate(href);
    setOpen(false);
    setQuery("");
  }, [navigate]);

  const typeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "client": return <Building2 className="h-4 w-4 text-blue-400" />;
      case "lead": return <Users className="h-4 w-4 text-purple-400" />;
      case "shipment": return <Truck className="h-4 w-4 text-green-400" />;
      case "invoice": return <FileText className="h-4 w-4 text-yellow-400" />;
      case "device": return <Package className="h-4 w-4 text-orange-400" />;
    }
  };

  const typeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "client": return "Client";
      case "lead": return "Lead";
      case "shipment": return "Shipment";
      case "invoice": return "Invoice";
      case "device": return "Device";
    }
  };

  return (
    <>
      {/* Trigger button shown in sidebar */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              autoFocus
              placeholder="Search clients, leads, shipments..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-base bg-transparent"
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}
            {query.length >= 2 && !isLoading && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results for "{query}"
              </div>
            )}
            {results.length > 0 && (
              <div className="py-2">
                {results.map((r, i) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors"
                    onClick={() => handleSelect(r.href)}
                  >
                    <span className="shrink-0">{typeIcon(r.type)}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{r.label}</span>
                      {r.sublabel && <span className="block text-xs text-muted-foreground truncate">{r.sublabel}</span>}
                    </span>
                    <Badge variant="outline" className="shrink-0 text-[10px] capitalize">{typeLabel(r.type)}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↵</kbd> to select</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">Esc</kbd> to close</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
