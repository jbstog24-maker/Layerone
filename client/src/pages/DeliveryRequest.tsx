import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Truck, Calculator, CreditCard, MapPin, Info } from "lucide-react";
import {
  calculateDeliveryQuote,
  formatCents,
  FAILED_DELIVERY_DISCLAIMER,
} from "../../../shared/delivery-pricing";

const TIME_WINDOWS = [
  { value: "morning", label: "Morning (8 AM - 12 PM)" },
  { value: "afternoon", label: "Afternoon (12 PM - 5 PM)" },
  { value: "custom", label: "Custom time window" },
];

function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || "0", 10)))}
        className="mt-1"
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

export default function DeliveryRequest() {
  const [, setLocation] = useLocation();
  const [timeWindow, setTimeWindow] = useState("morning");
  const [customTimeWindow, setCustomTimeWindow] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [siteName, setSiteName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("TX");
  const [zip, setZip] = useState("");
  const [miles, setMiles] = useState(10);
  const [packages, setPackages] = useState(0);
  const [largeItems, setLargeItems] = useState(0);
  const [pallets, setPallets] = useState(0);
  const [looseDevices, setLooseDevices] = useState(0);
  const [instructions, setInstructions] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const quote = useMemo(
    () =>
      calculateDeliveryQuote({
        miles,
        packages,
        largeItems,
        pallets,
        looseDevices,
      }),
    [miles, packages, largeItems, pallets, looseDevices]
  );

  const hasItems = packages + largeItems + pallets + looseDevices > 0;
  const formValid =
    deliveryDate && siteName.trim() && street.trim() && city.trim() && zip.trim() && hasItems && disclaimerAccepted;

  const createMutation = trpc.deliveryRequests.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Request ${data.trackingNumber} created - redirecting to payment`);
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLocation(`/delivery-requests/${data.id}`);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!formValid || createMutation.isPending) return;
    createMutation.mutate({
      deliveryDate,
      timeWindow: timeWindow as "morning" | "afternoon" | "custom",
      customTimeWindow: timeWindow === "custom" ? customTimeWindow : undefined,
      siteName: siteName.trim(),
      addressStreet: street.trim(),
      addressCity: city.trim(),
      addressState: state.trim() || "TX",
      addressZip: zip.trim(),
      estimatedMiles: miles,
      packageCount: packages,
      largeItemCount: largeItems,
      palletCount: pallets,
      looseDeviceCount: looseDevices,
      specialInstructions: instructions.trim() || undefined,
      disclaimerAccepted: true,
    });
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <DashboardLayout>
      <PageHeader
        title="Request a Delivery"
        subtitle="Tell us where it needs to go and what is coming with it. You will see the full price before you pay."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Form ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" /> Delivery details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Delivery date *</Label>
                  <Input
                    type="date"
                    min={minDate}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Time window *</Label>
                  <Select value={timeWindow} onValueChange={setTimeWindow}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_WINDOWS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {timeWindow === "custom" && (
                    <Input
                      placeholder="e.g. Between 9 and 11 AM"
                      value={customTimeWindow}
                      onChange={(e) => setCustomTimeWindow(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div>
                <Label>Site name *</Label>
                <Input
                  placeholder="e.g. Downtown Office - Suite 400"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <p className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Delivery address
                </p>
                <div>
                  <Label>Street address *</Label>
                  <Input
                    placeholder="1234 Main St, Building B"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label>City *</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1" maxLength={8} />
                  </div>
                  <div>
                    <Label>ZIP *</Label>
                    <Input value={zip} onChange={(e) => setZip(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>One-way miles from our Carrollton warehouse *</Label>
                  <Input
                    type="number"
                    min={0}
                    max={500}
                    value={miles}
                    onChange={(e) => setMiles(Math.max(0, Math.min(500, parseInt(e.target.value || "0", 10))))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    Enter your best estimate. We measure from 1501 Randolph St, Carrollton, TX 75006
                    and will verify the mileage before dispatch. The trip charge is $50 plus $3 per mile,
                    with a $75 minimum.
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <p className="text-sm font-medium">What are we delivering? *</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField label="Packages" value={packages} onChange={setPackages} hint="$15 each" />
                  <NumberField label="Large items" value={largeItems} onChange={setLargeItems} hint="$75 each" />
                  <NumberField
                    label="Pallets"
                    value={pallets}
                    onChange={setPallets}
                    hint="$175 each (1-3), $150 each (4-9), $125 each (10+)"
                  />
                  <NumberField
                    label="Loose devices"
                    value={looseDevices}
                    onChange={setLooseDevices}
                    hint="$30 each (1-10), $25 each (11+)"
                  />
                </div>
              </div>

              <div>
                <Label>Special instructions</Label>
                <Textarea
                  placeholder="Dock details, contact on site, gate codes, anything the driver should know..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="disclaimer"
                    checked={disclaimerAccepted}
                    onCheckedChange={(v) => setDisclaimerAccepted(v === true)}
                    className="mt-1"
                  />
                  <Label htmlFor="disclaimer" className="text-sm leading-relaxed cursor-pointer">
                    {FAILED_DELIVERY_DISCLAIMER}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Live price summary ── */}
        <div>
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" /> Price estimate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quote.lines.map((line, i) => (
                <div key={i} className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground">{line.label}</span>
                  <span className="font-medium whitespace-nowrap">{formatCents(line.amountCents)}</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold">Total due today</span>
                <span className="text-2xl font-bold">{formatCents(quote.totalCents)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Payment is collected up front through our secure checkout. Your delivery request is
                confirmed as soon as payment completes, and you will receive a tracking number.
              </p>
              <Button
                className="w-full"
                size="lg"
                disabled={!formValid || createMutation.isPending}
                onClick={handleSubmit}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "Preparing checkout..." : `Pay ${formatCents(quote.totalCents)} and book delivery`}
              </Button>
              {!hasItems && (
                <p className="text-xs text-amber-600">Add at least one package, large item, pallet, or device.</p>
              )}
              {!disclaimerAccepted && hasItems && (
                <p className="text-xs text-amber-600">Please accept the delivery terms above to continue.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
