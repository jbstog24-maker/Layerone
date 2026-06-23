/**
 * Stripe product/price definitions for each Layer One package tier.
 * These are used to create Checkout Sessions for client onboarding.
 * 
 * IMPORTANT: After claiming your Stripe sandbox, create these products in the
 * Stripe Dashboard and replace the priceId values with real Stripe Price IDs.
 * Until then, the system uses dynamic pricing via price_data in checkout sessions.
 */

export type PackageTier = "basic" | "standard" | "professional" | "enterprise" | "custom";

export interface TierPricing {
  name: string;
  description: string;
  /** Amount in cents */
  amountCents: number;
  /** 'one_time' or 'recurring' */
  mode: "payment" | "subscription";
  /** For subscriptions: 'month' */
  interval?: "month";
  /** Optional Stripe Price ID if pre-created in dashboard */
  stripePriceId?: string;
}

export const TIER_PRICING: Record<PackageTier, TierPricing> = {
  basic: {
    name: "Project Staging Pilot",
    description: "Up to 25 devices, 10 boxes, 2 pallets. Ideal for one-time projects.",
    amountCents: 49900, // $499
    mode: "payment",
  },
  standard: {
    name: "Shared Staging Shelf",
    description: "Up to 50 devices, 25 boxes, 5 pallets. Monthly shared staging space.",
    amountCents: 75000, // $750/mo
    mode: "subscription",
    interval: "month",
  },
  professional: {
    name: "Shared Staging Bay",
    description: "Up to 150 devices, 75 boxes, 15 pallets. Dedicated bay in shared facility.",
    amountCents: 150000, // $1,500/mo
    mode: "subscription",
    interval: "month",
  },
  enterprise: {
    name: "Dedicated Staging Area",
    description: "Up to 500 devices, 200 boxes, 50 pallets. Private dedicated staging area.",
    amountCents: 350000, // $3,500/mo
    mode: "subscription",
    interval: "month",
  },
  custom: {
    name: "Rollout Suite / Custom",
    description: "Unlimited devices, boxes, and pallets. Custom pricing for large rollouts.",
    amountCents: 500000, // $5,000/mo base — overridden per client
    mode: "subscription",
    interval: "month",
  },
};

/** Add-on rates for line items */
export const ADDON_RATES = {
  extraDevicePerMonth: 1500,      // $15/device/mo
  extraBoxPerMonth: 500,           // $5/box/mo
  extraPalletPerMonth: 2500,       // $25/pallet/mo
  extraStorageDayPerBox: 100,      // $1/box/day
  laborHourStandard: 7500,         // $75/hr
  laborHourRush: 12500,            // $125/hr
  rushFeeFlat: 15000,              // $150 flat rush fee
  inboundReceivingPerPallet: 2500, // $25/pallet
  outboundShippingPerPallet: 3500, // $35/pallet
  photoDocumentationFlat: 5000,    // $50 flat
};
