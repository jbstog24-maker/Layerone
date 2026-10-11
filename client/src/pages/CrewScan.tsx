import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ScanLine, Search, ArrowLeft, Camera, Keyboard, Loader2 } from "lucide-react";

const STATUS_ACTIONS: { label: string; value: string }[] = [
  { label: "Received", value: "received" },
  { label: "QA Passed", value: "inventory_captured" },
  { label: "In Staging", value: "in_staging" },
  { label: "Staged", value: "staged" },
  { label: "Labeled", value: "labeled" },
  { label: "Packed", value: "packed" },
  { label: "Ready to Ship", value: "ready_to_ship" },
];

type Device = {
  id: number;
  deviceType?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  assetTag?: string | null;
  stagingStatus?: string | null;
  siteName?: string | null;
};

type Phase = "scan" | "searching" | "pick" | "device" | "notfound";

export default function CrewScan() {
  const [phase, setPhase] = useState<Phase>("scan");
  const [scannerOn, setScannerOn] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [serialInput, setSerialInput] = useState("");
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Device[]>([]);
  const [device, setDevice] = useState<Device | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const utils = trpc.useUtils();

  const { data: results, isLoading } = trpc.devices.list.useQuery(
    { search: searchTerm ?? undefined },
    { enabled: searchTerm !== null }
  );

  useEffect(() => {
    if (!isLoading && searchTerm !== null && results !== undefined) {
      const list = (results as Device[]) ?? [];
      if (list.length === 0) {
        setPhase("notfound");
      } else if (list.length === 1) {
        setDevice(list[0]);
        setPhase("device");
      } else {
        setCandidates(list);
        setPhase("pick");
      }
      setSearchTerm(null);
    }
  }, [isLoading, results, searchTerm]);

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {
      // already stopped
    }
    scannerRef.current = null;
    setScannerOn(false);
  };

  const startScanner = async () => {
    const elId = "crew-scan-region";
    try {
      const scanner = new Html5Qrcode(elId);
      scannerRef.current = scanner;
      setScannerOn(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decodedText) => {
          void stopScanner();
          setSearchTerm(decodedText.trim());
          setPhase("searching");
        },
        () => {}
      );
    } catch (e: any) {
      setScannerOn(false);
      scannerRef.current = null;
      toast.error("Camera unavailable. Use manual entry instead.");
      setManualEntry(true);
    }
  };

  useEffect(() => {
    return () => {
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSearch = () => {
    const v = serialInput.trim();
    if (!v) return;
    setSearchTerm(v);
    setPhase("searching");
  };

  const resetToScan = () => {
    setDevice(null);
    setCandidates([]);
    setSerialInput("");
    setManualEntry(false);
    setPhase("scan");
  };

  const updateMutation = trpc.devices.update.useMutation({
    onSuccess: (_data, vars) => {
      const label = STATUS_ACTIONS.find((a) => a.value === vars.stagingStatus)?.label ?? "updated";
      toast.success(`Marked ${label}`);
      utils.devices.list.invalidate();
      resetToScan();
    },
    onError: (e) => toast.error(e.message),
  });

  const renderDeviceCard = (d: Device, onPick?: () => void) => (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {d.deviceType ?? "Device"}{d.model ? ` - ${d.model}` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-base">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={d.stagingStatus ?? "pending"} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Serial</span>
          <span className="font-mono text-sm break-all text-right">{d.serialNumber ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Asset tag</span>
          <span className="font-mono text-sm">{d.assetTag ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Site</span>
          <span className="text-sm text-right">{d.siteName ?? "-"}</span>
        </div>
        {onPick && (
          <Button className="mt-2 min-h-[56px] w-full text-base" onClick={onPick}>
            Select this device
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {phase !== "scan" && (
            <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={resetToScan} aria-label="Back to scanner">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold">Crew Scan</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {phase === "scan" && (
          <>
            {!scannerOn && !manualEntry && (
              <div className="space-y-3">
                <Button className="min-h-[72px] w-full text-lg" onClick={startScanner}>
                  <Camera className="mr-2 h-6 w-6" /> Start camera scan
                </Button>
                <Button variant="outline" className="min-h-[72px] w-full text-lg" onClick={() => setManualEntry(true)}>
                  <Keyboard className="mr-2 h-6 w-6" /> Enter serial manually
                </Button>
              </div>
            )}

            {scannerOn && (
              <Card>
                <CardContent className="pt-4">
                  <div id="crew-scan-region" className="w-full overflow-hidden rounded-lg" />
                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    Point the camera at a device barcode
                  </p>
                  <Button variant="outline" className="mt-3 min-h-[56px] w-full" onClick={() => { void stopScanner(); setManualEntry(true); }}>
                    Use manual entry instead
                  </Button>
                </CardContent>
              </Card>
            )}

            {manualEntry && !scannerOn && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Manual serial entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    placeholder="Serial number or asset tag"
                    className="min-h-[56px] text-lg"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleManualSearch(); }}
                  />
                  <Button className="min-h-[56px] w-full text-lg" onClick={handleManualSearch}>
                    <Search className="mr-2 h-5 w-5" /> Find device
                  </Button>
                  <Button variant="ghost" className="min-h-[48px] w-full" onClick={() => setManualEntry(false)}>
                    Back
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {phase === "searching" && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-lg">Looking up device...</p>
          </div>
        )}

        {phase === "notfound" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <ScanLine className="h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-semibold">No device found</p>
              <p className="text-sm text-muted-foreground">Nothing matched the scanned value. Try again or check the serial.</p>
              <Button className="mt-2 min-h-[56px] w-full text-lg" onClick={resetToScan}>
                Scan again
              </Button>
            </CardContent>
          </Card>
        )}

        {phase === "pick" && (
          <div className="space-y-3">
            <p className="text-lg font-semibold">Multiple matches, pick one:</p>
            {candidates.map((d) => (
              <div key={d.id}>
                {renderDeviceCard(d, () => { setDevice(d); setCandidates([]); setPhase("device"); })}
              </div>
            ))}
            <Button variant="outline" className="min-h-[56px] w-full" onClick={resetToScan}>
              Scan again
            </Button>
          </div>
        )}

        {phase === "device" && device && (
          <div className="space-y-4">
            {renderDeviceCard(device)}
            <div>
              <p className="mb-2 text-lg font-semibold">Update status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_ACTIONS.map(({ label, value }) => {
                  const isCurrent = device.stagingStatus === value;
                  return (
                    <Button
                      key={value}
                      variant={isCurrent ? "default" : "outline"}
                      className="min-h-[64px] text-base"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id: device.id, stagingStatus: value as any })}
                    >
                      {updateMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <Button variant="ghost" className="min-h-[56px] w-full text-lg" onClick={resetToScan}>
              Scan next device
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
