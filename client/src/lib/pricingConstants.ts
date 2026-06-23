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
    description: "Up to 25 devices, 10 boxes, 2 pallets. Ideal for one-time projects.",
    amountCents: 49900,
    mode: "payment",
    maxDevices: 25,
    maxBoxes: 10,
    maxPallets: 2,
    storageDays: 30,
  },
  standard: {
    name: "Shared Staging Shelf",
    description: "Up to 50 devices, 25 boxes, 5 pallets. Monthly shared staging space.",
    amountCents: 75000,
    mode: "subscription",
    interval: "month",
    maxDevices: 50,
    maxBoxes: 25,
    maxPallets: 5,
    storageDays: 30,
  },
  professional: {
    name: "Shared Staging Bay",
    description: "Up to 150 devices, 75 boxes, 15 pallets. Dedicated bay in shared facility.",
    amountCents: 150000,
    mode: "subscription",
    interval: "month",
    maxDevices: 150,
    maxBoxes: 75,
    maxPallets: 15,
    storageDays: 30,
  },
  enterprise: {
    name: "Dedicated Staging Area",
    description: "Up to 500 devices, 200 boxes, 50 pallets. Private dedicated staging area.",
    amountCents: 350000,
    mode: "subscription",
    interval: "month",
    maxDevices: 500,
    maxBoxes: 200,
    maxPallets: 50,
    storageDays: 30,
  },
  custom: {
    name: "Rollout Suite / Custom",
    description: "Unlimited devices, boxes, and pallets. Custom pricing for large rollouts.",
    amountCents: 500000,
    mode: "subscription",
    interval: "month",
    maxDevices: 9999,
    maxBoxes: 9999,
    maxPallets: 9999,
    storageDays: 30,
  },
};

/** Add-on rates for quote line items (in cents) */
export const ADDON_RATES = {
  extraDevicePerMonth: 1500,       // $15/device/mo
  extraBoxPerMonth: 500,            // $5/box/mo
  extraPalletPerMonth: 2500,        // $25/pallet/mo
  extraStorageDayPerBox: 100,       // $1/box/day
  laborHourStandard: 7500,          // $75/hr
  laborHourRush: 12500,             // $125/hr
  rushFeeFlat: 15000,               // $150 flat rush fee
  inboundReceivingPerPallet: 2500,  // $25/pallet
  outboundShippingPerPallet: 3500,  // $35/pallet
  photoDocumentationFlat: 5000,     // $50 flat
};
