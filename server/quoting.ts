/**
 * Autonomous quoting pipeline — builds a draft quote from a package inquiry.
 *
 * Workstream A. Called from the public `inquiry.submit` mutation right after
 * the inquiry row is inserted. All amounts are computed in dollars (rounded to
 * 2 decimals); Stripe-facing cents live in ./stripe-products.ts.
 */
import { eq } from "drizzle-orm";
import { TIER_PRICING, type PackageTier } from "./stripe-products";
import {
  quotes,
  type PackageInquiry,
  type Quote,
} from "../drizzle/schema";
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export interface DraftLineItem {
  label: string;
  qty: number;
  unitPrice: number; // dollars
  total: number; // dollars
}

/**
 * Add-on rates in cents, mirrored from client/src/lib/pricingConstants.ts
 * (single source of truth for displayed rates).
 */
const ADDON_RATES = {
  extraDevicePerMonth: 1800, // $18/device/mo
  extraBoxPerMonth: 750, // $7.50/box
  extraPalletPerMonth: 3000, // $30/pallet
  extraStorageDayPerBox: 350, // $3.50/day
  laborHourStandard: 11000, // $110/hr
  laborHourRush: 15500, // $155/hr
  rushFeeFlat: 15000, // $150 flat
  inboundReceivingPerPallet: 1200, // $12/pallet
  outboundShippingPerPallet: 2500, // $25/shipment
  photoDocumentationFlat: 5000, // $50 flat
  assetCapturePerDevice: 1500, // $15/device
  siteKitAssemblyFlat: 25000, // $250 flat
  deliveryDfwPerPallet: 17500, // $175/pallet (DFW metro, within 30 mi)
  deliveryDfwPerDevice: 3000, // $30/device (DFW metro, loose devices/boxes)
} as const;

/** Included allowances per tier (from the approved tier descriptions). */
const TIER_ALLOWANCES: Record<
  PackageTier,
  { maxDevices: number; maxBoxes: number; maxPallets: number; storageDays: number }
> = {
  basic: { maxDevices: 5, maxBoxes: 5, maxPallets: 1, storageDays: 14 },
  standard: { maxDevices: 10, maxBoxes: 10, maxPallets: 1, storageDays: 30 },
  professional: { maxDevices: 25, maxBoxes: 30, maxPallets: 3, storageDays: 30 },
  enterprise: { maxDevices: 75, maxBoxes: 75, maxPallets: 6, storageDays: 45 },
  custom: { maxDevices: 150, maxBoxes: 200, maxPallets: 20, storageDays: 60 },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Build a draft quote for an inquiry: base package price + volume overages +
 * selected add-ons. Per-pallet inquiries skip the tier framework and are
 * priced purely per pallet (receiving + storage + chosen services).
 * Inserts the quote with status 'draft' and returns the row.
 */
export async function buildDraftQuote(
  db: Db,
  inquiry: PackageInquiry
): Promise<Quote> {
  const items: DraftLineItem[] = [];
  const push = (label: string, qty: number, unitPrice: number) => {
    const unit = round2(unitPrice);
    items.push({ label, qty, unitPrice: unit, total: round2(qty * unit) });
  };

  const palletCount = inquiry.palletCount ?? 0;
  const deviceCount = inquiry.deviceCount ?? 0;
  const boxCount = inquiry.boxCount ?? 0;

  if (inquiry.quoteType === "pallet") {
    // ── Per-pallet quote: receiving + storage, no tier base ──
    const pallets = Math.max(palletCount, 1);
    push(
      `Pallet receiving & intake — ${pallets} pallet(s)`,
      pallets,
      ADDON_RATES.inboundReceivingPerPallet / 100
    );
    const storageMonths = Math.max(1, Math.ceil((inquiry.storageDays ?? 0) / 30));
    push(
      `Pallet storage — ${pallets} pallet(s) × ${storageMonths} month(s)`,
      pallets * storageMonths,
      ADDON_RATES.extraPalletPerMonth / 100
    );
  } else {
    // ── Project quote: tier base + volume overages ──
    const tierKey = inquiry.tier as PackageTier;
    const tier = TIER_PRICING[tierKey] ?? TIER_PRICING.custom;
    const allowances = TIER_ALLOWANCES[tierKey] ?? TIER_ALLOWANCES.custom;

    // (a) Base package item
    push(
      `${tier.name} — ${tier.mode === "payment" ? "one-time" : "/month"}`,
      1,
      tier.amountCents / 100
    );

    // (b) Volume overages vs. tier allowances
    if (deviceCount > allowances.maxDevices) {
      const extra = deviceCount - allowances.maxDevices;
      push(
        `Extra device storage — ${extra} over included ${allowances.maxDevices}`,
        extra,
        ADDON_RATES.extraDevicePerMonth / 100
      );
    }

    if (boxCount > allowances.maxBoxes) {
      const extra = boxCount - allowances.maxBoxes;
      push(
        `Extra parcels received — ${extra} over included ${allowances.maxBoxes}`,
        extra,
        ADDON_RATES.extraBoxPerMonth / 100
      );
    }

    if (palletCount > allowances.maxPallets) {
      const extra = palletCount - allowances.maxPallets;
      push(
        `Extra pallets — ${extra} over included ${allowances.maxPallets}`,
        extra,
        ADDON_RATES.extraPalletPerMonth / 100
      );
    }

    const storageDays = inquiry.storageDays ?? 0;
    if (storageDays > allowances.storageDays) {
      const extraDays = storageDays - allowances.storageDays;
      const billableUnits = Math.max(boxCount, 1);
      push(
        `Extended storage — ${extraDays} extra days × ${billableUnits} box(es)`,
        extraDays * billableUnits,
        ADDON_RATES.extraStorageDayPerBox / 100
      );
    }
  }

  // (c) Selected add-ons (inquiry.addons is a JSON array of key strings).
  // Handles both the RequestForm keys and canonical keys; unknown keys skip.
  let addonKeys: string[] = [];
  try {
    const parsed: unknown = inquiry.addons ? JSON.parse(inquiry.addons) : [];
    addonKeys = Array.isArray(parsed)
      ? parsed.filter((k): k is string => typeof k === "string")
      : [];
  } catch {
    addonKeys = [];
  }
  const seen = new Set<string>();
  for (const raw of addonKeys) {
    if (seen.has(raw)) continue;
    seen.add(raw);
    switch (raw) {
      case "inbound_receiving":
        push(
          "Inbound receiving",
          palletCount || 1,
          ADDON_RATES.inboundReceivingPerPallet / 100
        );
        break;
      case "asset_capture":
      case "asset_tagging": // RequestForm: "Asset Tagging & Labeling"
        push(
          "Inventory & asset capture",
          deviceCount || 1,
          ADDON_RATES.assetCapturePerDevice / 100
        );
        break;
      case "photo_documentation":
      case "photo_doc": // RequestForm: "Photo Documentation"
        push(
          "Photo documentation",
          1,
          ADDON_RATES.photoDocumentationFlat / 100
        );
        break;
      case "rush_fee":
      case "expedited": // RequestForm: "Expedited Turnaround"
        push("Rush fee", 1, ADDON_RATES.rushFeeFlat / 100);
        break;
      case "site_kit":
      case "site_kit_assembly":
      case "custom_kitting": // RequestForm: "Custom Kitting"
        push("Site-kit assembly", 1, ADDON_RATES.siteKitAssemblyFlat / 100);
        break;
      case "staging_tech":
        push(
          "Staging technician — verify hours",
          1,
          ADDON_RATES.laborHourStandard / 100
        );
        break;
      case "senior_network_tech":
        push(
          "Senior network technician — verify hours",
          1,
          ADDON_RATES.laborHourRush / 100
        );
        break;
      case "onsite_delivery":
        // DFW metro delivery: per-pallet for palletized freight, per-device
        // for loose devices/boxes. Competitive local rates (30-mi radius).
        if (palletCount > 0) {
          push(
            `DFW metro delivery — ${palletCount} pallet(s)`,
            palletCount,
            ADDON_RATES.deliveryDfwPerPallet / 100
          );
        } else {
          const units = deviceCount || boxCount || 1;
          push(
            `DFW metro delivery — ${units} device(s)/box(es)`,
            units,
            ADDON_RATES.deliveryDfwPerDevice / 100
          );
        }
        break;
      default:
        // Unknown add-on key — skip so a rep can price it manually.
        break;
    }
  }

  const subtotal = round2(items.reduce((sum, i) => sum + i.total, 0));

  const result = await db.insert(quotes).values({
    inquiryId: inquiry.id,
    lineItems: JSON.stringify(items),
    subtotal: subtotal.toFixed(2),
    tax: "0.00",
    totalAmount: subtotal.toFixed(2),
    status: "draft",
  });
  const id = (result[0] as any).insertId as number;
  const [row] = await db.select().from(quotes).where(eq(quotes.id, id));
  return row;
}
