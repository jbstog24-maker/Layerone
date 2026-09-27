/**
 * Client-side mirror of server/stripe-products.ts pricing constants.
 * Used in the quote builder to pre-populate line items based on tier and volume.
 */

export type PackageTier = "basic" | "standard" | "professional" | "enterprise" | "custom";

export interface TierPricing {
  name: string;
  description: string;
  /** Amount in cents */
  amountCents: number;
  mode: "payment" | "subscription";
  interval?: "month";
  /** Included limits */
  maxDevices: number;
  maxBoxes: number;
  maxPallets: number;
  /** Included storage days */
  storageDays: number;
}

export const TIER_PRICING: Record<PackageTier, TierPricing> = {
  basic: {
    name: "Project Staging Pilot",
    description: "Up to 5 devices, 5 boxes, 1 pallet. Ideal for one-time projects.",
    amountCents: 49900,
    mode: "payment",
    maxDevices: 5,
    maxBoxes: 5,
    maxPallets: 1,
    storageDays: 14,
  },
  standard: {
    name: "Shared Staging Shelf",
    description: "Up to 10 devices, 10 boxes, 1 pallet. Monthly shared staging space.",
    amountCents: 75000,
    mode: "subscription",
    interval: "month",
    maxDevices: 10,
    maxBoxes: 10,
    maxPallets: 1,
    storageDays: 30,
  },
  professional: {
    name: "Shared Staging Bay",
    description: "Up to 25 devices, 30 boxes, 3 pallets. Dedicated bay in shared facility.",
    amountCents: 150000,
    mode: "subscription",
    interval: "month",
    maxDevices: 25,
    maxBoxes: 30,
    maxPallets: 3,
    storageDays: 30,
  },
  enterprise: {
    name: "Dedicated Staging Area",
    description: "Up to 75 devices, 75 boxes, 6 pallets. Private dedicated staging area.",
    amountCents: 350000,
    mode: "subscription",
    interval: "month",
    maxDevices: 75,
    maxBoxes: 75,
    maxPallets: 6,
    storageDays: 45,
  },
  custom: {
    name: "Rollout Suite / Custom",
    description: "Up to 150 devices, 200 boxes, 20 pallets. Custom pricing for large rollouts.",
    amountCents: 500000,
    mode: "subscription",
    interval: "month",
    maxDevices: 150,
    maxBoxes: 200,
    maxPallets: 20,
    storageDays: 60,
  },
};

/** Add-on rates for quote line items (in cents) */
export const ADDON_RATES = {
  extraDevicePerMonth: 1800,       // $18/device/mo
  extraBoxPerMonth: 750,            // $7.50/box/mo
  extraPalletPerMonth: 3000,        // $30/pallet/mo
  extraStorageDayPerBox: 350,       // $3.50/box/day
  laborHourStandard: 11000,         // $110/hr
  laborHourRush: 15500,            // $155/hr
  rushFeeFlat: 15000,               // $150 flat rush fee
  inboundReceivingPerPallet: 1200,  // $12/pallet
  outboundShippingPerPallet: 2500,  // $25/shipment
  photoDocumentationFlat: 5000,     // $50 flat
};
