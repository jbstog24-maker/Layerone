// ─── Delivery Request Pricing ────────────────────────────────────────────────
// Single source of truth for customer delivery pricing. Used by the client-side
// live calculator and the server-side checkout creation so both always agree.
//
// Origin: 1501 Randolph St, Carrollton, TX 75006
// Formula: total = max(MIN_TRIP, BASE_FEE + MILEAGE_RATE * miles)
//          + packages * PACKAGE_RATE
//          + largeItems * LARGE_ITEM_RATE
//          + palletTier(pallets)
//          + deviceTier(devices)
// All money is in integer cents.

export const DELIVERY_BASE_FEE_CENTS = 5000; // $50
export const DELIVERY_MILEAGE_RATE_CENTS = 300; // $3 per mile, one-way
export const DELIVERY_MIN_TRIP_CENTS = 7500; // $75 minimum trip charge
export const DELIVERY_PACKAGE_RATE_CENTS = 1500; // $15 per package
export const DELIVERY_LARGE_ITEM_RATE_CENTS = 7500; // $75 per large item

export interface DeliveryQuoteInput {
  miles: number;
  packages: number;
  largeItems: number;
  pallets: number;
  looseDevices: number;
}

export interface DeliveryQuoteLine {
  label: string;
  amountCents: number;
}

export interface DeliveryQuote {
  lines: DeliveryQuoteLine[];
  tripCents: number;
  minimumApplied: boolean;
  totalCents: number;
}

function palletCostCents(pallets: number): number {
  if (pallets <= 0) return 0;
  if (pallets <= 3) return pallets * 17500;
  if (pallets <= 9) return pallets * 15000;
  return pallets * 12500;
}

function deviceCostCents(devices: number): number {
  if (devices <= 0) return 0;
  if (devices <= 10) return devices * 3000;
  return devices * 2500;
}

export function calculateDeliveryQuote(input: DeliveryQuoteInput): DeliveryQuote {
  const miles = Math.max(0, Math.floor(input.miles || 0));
  const packages = Math.max(0, Math.floor(input.packages || 0));
  const largeItems = Math.max(0, Math.floor(input.largeItems || 0));
  const pallets = Math.max(0, Math.floor(input.pallets || 0));
  const looseDevices = Math.max(0, Math.floor(input.looseDevices || 0));

  const rawTrip = DELIVERY_BASE_FEE_CENTS + DELIVERY_MILEAGE_RATE_CENTS * miles;
  const minimumApplied = rawTrip < DELIVERY_MIN_TRIP_CENTS;
  const tripCents = minimumApplied ? DELIVERY_MIN_TRIP_CENTS : rawTrip;

  const packageCents = packages * DELIVERY_PACKAGE_RATE_CENTS;
  const largeItemCents = largeItems * DELIVERY_LARGE_ITEM_RATE_CENTS;
  const palletCents = palletCostCents(pallets);
  const deviceCents = deviceCostCents(looseDevices);

  const lines: DeliveryQuoteLine[] = [];
  lines.push({
    label: `Trip charge ($50 base + $3/mi x ${miles} mi${minimumApplied ? ", raised to $75 minimum" : ""})`,
    amountCents: tripCents,
  });
  if (packages > 0) lines.push({ label: `Packages (${packages} x $15)`, amountCents: packageCents });
  if (largeItems > 0) lines.push({ label: `Large items (${largeItems} x $75)`, amountCents: largeItemCents });
  if (pallets > 0) {
    const rate = pallets <= 3 ? 175 : pallets <= 9 ? 150 : 125;
    lines.push({ label: `Pallets (${pallets} x $${rate})`, amountCents: palletCents });
  }
  if (looseDevices > 0) {
    const rate = looseDevices <= 10 ? 30 : 25;
    lines.push({ label: `Loose devices (${looseDevices} x $${rate})`, amountCents: deviceCents });
  }

  return {
    lines,
    tripCents,
    minimumApplied,
    totalCents: tripCents + packageCents + largeItemCents + palletCents + deviceCents,
  };
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const FAILED_DELIVERY_DISCLAIMER =
  "If our driver arrives at the scheduled time and location and delivery cannot be completed for reasons outside our control (site closed, no one available to receive, access denied, incorrect address provided), the full delivery charge still applies.";
