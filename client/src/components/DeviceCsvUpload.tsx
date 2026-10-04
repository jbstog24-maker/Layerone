import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Download, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

const HEADERS = ["deviceType", "brand", "model", "serialNumber", "macAddress", "assetTag", "projectName", "siteName", "notes"] as const;

type DeviceRow = Record<(typeof HEADERS)[number], string>;

function parseCsv(text: string): DeviceRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  // Parse a single line honoring double-quoted fields
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; }
          else inQuotes = false;
        } else cur += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headerCells = splitLine(lines[0]).map((h) => h.trim());
  const colIndex: Record<string, number> = {};
  headerCells.forEach((h, i) => { colIndex[h] = i; });
  const rows: DeviceRow[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = splitLine(lines[r]);
    const row = {} as DeviceRow;
    for (const h of HEADERS) {
      const idx = colIndex[h];
      row[h] = idx !== undefined && idx < cells.length ? cells[idx] : "";
    }
    // Skip fully-empty rows
    if (Object.values(row).every((v) => !v)) continue;
    rows.push(row);
  }
  return rows;
}

function toCsv(rows: DeviceRow[]): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [HEADERS.join(","), ...rows.map((r) => HEADERS.map((h) => esc(r[h] ?? "")).join(","))].join("\n");
}

const EXAMPLE_ROW: DeviceRow = {
  deviceType: "Laptop",
  brand: "Dell",
  model: "Latitude 5440",
  serialNumber: "ABC123456",
  macAddress: "AA:BB:CC:DD:EE:FF",
  assetTag: "ASSET-001",
  projectName: "Chicago Rollout",
  siteName: "Chicago HQ",
  notes: "Needs Windows 11 image",
};

export default function DeviceCsvUpload({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: number; errors: string[] } | null>(null);
  const utils = trpc.useUtils();
  const bulkImport = trpc.devices.bulkImport.useMutation();

  const downloadTemplate = () => {
    const blob = new Blob([toCsv([EXAMPLE_ROW])], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "device-upload-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setResult(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    setRows(parsed);
    setFileName(file.name);
  };

  const handleUpload = async () => {
    if (rows.length === 0 || uploading) return;
    setUploading(true);
    setResult(null);
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];
    try {
      // Server caps at 50 rows per call; batch client-side too.
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50).map((r) => {
          const clean: Record<string, string> = {};
          for (const h of HEADERS) if (r[h]) clean[h] = r[h];
          return clean;
        });
        const res = await bulkImport.mutateAsync({ rows: batch as any });
        imported += res.imported;
        failed += res.failed;
        errors.push(...res.errors);
      }
      setResult({ imported, failed, errors });
      setRows([]);
      setFileName("");
      utils.forwarding.myItems.invalidate();
    } catch (err: any) {
      setResult({ imported, failed: rows.length - imported, errors: [err?.message ?? "Upload failed"] });
    } finally {
      setUploading(false);
    }
  };

  const close = () => {
    setRows([]);
    setFileName("");
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="bg-[#0d1f35] border-[#1e3a5f] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            Upload Devices via CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Upload a CSV file to add many devices at once. Download the template below to see the expected format.
            All fields are optional except at least one identifying field per row (serial number or asset tag recommended).
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-[#1e3a5f] text-slate-300 gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download CSV template
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="border-[#1e3a5f] text-slate-300 gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Choose CSV file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
          </div>

          {fileName && (
            <p className="text-xs text-slate-500">
              File: <span className="text-slate-300 font-mono">{fileName}</span> ({rows.length} row{rows.length === 1 ? "" : "s"} parsed)
            </p>
          )}

          {rows.length > 0 && (
            <Card className="bg-black/20 border-[#1e3a5f] overflow-hidden">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1e3a5f]">
                      {HEADERS.map((h) => (
                        <th key={h} className="text-left px-2 py-2 text-slate-400 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-b border-[#1e3a5f]/50 last:border-0">
                        {HEADERS.map((h) => (
                          <td key={h} className="px-2 py-1.5 text-slate-300 whitespace-nowrap max-w-[160px] truncate">{r[h] || <span className="text-slate-600">-</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && (
                <p className="text-xs text-slate-500 px-3 py-2">Showing first 10 of {rows.length} rows.</p>
              )}
            </Card>
          )}

          {result && (
            <div className={`rounded-xl border p-4 ${result.failed > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
              <div className="flex items-center gap-2">
                {result.failed > 0
                  ? <AlertTriangle className="w-4 h-4 text-amber-400" />
                  : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                <p className="text-sm font-semibold text-white">
                  {result.imported} device{result.imported === 1 ? "" : "s"} imported
                  {result.failed > 0 && `, ${result.failed} failed`}
                </p>
              </div>
              {result.errors.length > 0 && (
                <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <li key={i} className="text-xs text-amber-300/90 font-mono">{e}</li>
                  ))}
                  {result.errors.length > 20 && (
                    <li className="text-xs text-slate-500">...and {result.errors.length - 20} more</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={close} className="text-slate-400">
            <X className="w-4 h-4 mr-1" /> {result ? "Done" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={handleUpload}
              disabled={rows.length === 0 || uploading}
              className="bg-blue-600 hover:bg-blue-700 gap-1.5"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              Upload {rows.length > 0 ? `${rows.length} devices` : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
