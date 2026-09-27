/**
 * Stripe product/price definitions for each Layer One package tier.
 * Products and prices are pre-created in Stripe (test sandbox) and referenced by ID.
 * Run scripts/create-stripe-products.mjs once to re-create them if needed.
 */
export type PackageTier = "basic" | "standard" | "professional" | "enterprise" | "custom";

export interface TierPricing {
  name: string;
  description: string;
  /** Amount in cents */
  amountCents: number;
  /** 'payment' (one-time) or 'subscription' (recurring) */
  mode: "payment" | "subscription";
  /** For subscriptions: 'month' */
  interval?: "month";
  /** Stripe Product ID */
  stripeProductId: string;
  /** Stripe Price ID — used in Checkout Sessions */
  stripePriceId: string;
}

export const TIER_PRICING: Record<PackageTier, TierPricing> = {
  basic: {
    name: "Project Staging Pilot",
    description:
      "For first-time customers testing Layer One on a single project. Includes full receiving, organization, intake photos, serial/MAC capture, and one outbound shipment coordination — no monthly commitment. Up to 5 active devices, 5 boxes received, 14-day project window.",
    amountCents: 49900, // $499 one-time
    mode: "payment",
    stripeProductId: "prod_UlTppqC7T0otVz",
    stripePriceId: "price_1TlwrWBWI1iQIlucm8IxtIgg",
  },
  standard: {
    name: "Shared Staging Shelf",
    description:
      "For MSPs and contractors with light recurring receiving, organization, and short-term storage needs. Assigned shelf/bin capacity with monthly usage summaries and up to 3 outbound shipment coordinations. Up to 10 active devices, 1 pallet/month, 10 boxes/month, 30-day storage.",
    amountCents: 75000, // $750/month
    mode: "subscription",
    interval: "month",
    stripeProductId: "prod_UlTpMNfWuHsT0l",
    stripePriceId: "price_1TlwrWBWI1iQIluc1KtWclDs",
  },
  professional: {
    name: "Shared Staging Bay",
    description:
      "Our most popular tier — purpose-built for recurring deployment work. Includes dock/ramp coordination and up to 8 outbound shipment coordinations per month. Up to 25 active devices, 3 pallets/month, 30 boxes/month, 30-day storage.",
    amountCents: 150000, // $1,500/month
    mode: "subscription",
    interval: "month",
    stripeProductId: "prod_UlTpDwAMt41ksw",
    stripePriceId: "price_1TlwrXBWI1iQIluccXgMZ33o",
  },
  enterprise: {
    name: "Dedicated Staging Area",
    description:
      "Separated project area with dedicated LayerOne-managed workflow. Includes weekly inventory reports, 20 outbound shipment coordinations, and one project coordination call per month. Up to 75 active devices, 6 pallets/month, 75 boxes/month, 45-day storage.",
    amountCents: 350000, // $3,500/month
    mode: "subscription",
    interval: "month",
    stripeProductId: "prod_UlTpXgOldGKdzy",
    stripePriceId: "price_1TlwrXBWI1iQIlucOTO4AsyU",
  },
  custom: {
    name: "Rollout Suite",
    description:
      "For multi-site deployments, national rollout vendors, POS projects, security deployments, and franchise technology rollouts. Sole-use project area or dedicated suite with chain-of-custody tracking. Up to 150 active devices, 20 pallets/month, 200 boxes/month, 60-day storage.",
    amountCents: 500000, // $5,000/month base — overridden per client
    mode: "subscription",
    interval: "month",
    stripeProductId: "prod_UlTph9k38PGSJy",
    stripePriceId: "price_1TlwrYBWI1iQIlucrRzcoOrR",
  },
};

/** Add-on products with Stripe Price IDs */
export const ADDON_PRICING = {
  extra_device: {
    name: "Extra Device Storage (per device/month)",
    amountCents: 1800, // $18/device/mo
    stripeProductId: "prod_UlTpicu5U4krfg",
    stripePriceId: "price_1TlwrZBWI1iQIlucVz8fskrE",
  },
  extra_box: {
    name: "Extra Parcel Received (per box)",
    amountCents: 750, // $7.50/box
    stripeProductId: "prod_UlTpa5jrrPSxFr",
    stripePriceId: "price_1TlwrZBWI1iQIlucIZNS9ESt",
  },
  extra_pallet: {
    name: "Extra Pallet (per pallet)",
    amountCents: 3000, // $30/pallet
    stripeProductId: "prod_UlTp8cPV1b8vkK",
    stripePriceId: "price_1TlwraBWI1iQIlucfnlVRJaU",
  },
  extended_storage: {
    name: "Extended Storage (per item/day)",
    amountCents: 350, // $3.50/day
    stripeProductId: "prod_UlTpPSAbKJVS8b",
    stripePriceId: "price_1TlwraBWI1iQIlucFGry61iY",
  },
  extra_shipment: {
    name: "Extra Outbound Shipment",
    amountCents: 2500, // $25/shipment
    stripeProductId: "prod_UlTpknojKw5ViG",
    stripePriceId: "price_1TlwraBWI1iQIlucrYXziXCj",
  },
  asset_capture: {
    name: "Inventory & Asset Capture (per device)",
    amountCents: 1500, // $15/device
    stripeProductId: "prod_UlTp13j8pywOB1",
    stripePriceId: "price_1TlwrbBWI1iQIlucX2Nf8Q24",
  },
  site_kit: {
    name: "Site-Kit Assembly (per site kit)",
    amountCents: 25000, // $250/site kit
    stripeProductId: "prod_UlTphMV4I7H4Le",
    stripePriceId: "price_1TlwrcBWI1iQIlucXzuboc0S",
  },
  labor_staging: {
    name: "Layer One Staging Technician (per hour)",
    amountCents: 11000, // $110/hr
    stripeProductId: "prod_UlTp9zKDuo3c7p",
    stripePriceId: "price_1TlwrcBWI1iQIluc7siZiu9a",
  },
  labor_network: {
    name: "Senior Network Technician (per hour)",
    amountCents: 15500, // $155/hr
    stripeProductId: "prod_UlTph008N7Gqwk",
    stripePriceId: "price_1TlwrdBWI1iQIlucAezIks1O",
  },
} as const;

export type AddonKey = keyof typeof ADDON_PRICING;

/** Legacy add-on rates kept for backward compatibility with invoice line-item calculations */
export const ADDON_RATES = {
  extraDevicePerMonth: 1800,       // $18/device/mo
  extraBoxPerMonth: 750,           // $7.50/box
  extraPalletPerMonth: 3000,        // $30/pallet
  extraStorageDayPerBox: 350,        // $3.50/day
  laborHourStandard: 11000,        // $110/hr
  laborHourRush: 15500,            // $155/hr
  rushFeeFlat: 15000,              // $150 flat rush fee
  inboundReceivingPerPallet: 1200, // $12/pallet
  outboundShippingPerPallet: 2500, // $25/shipment
  photoDocumentationFlat: 5000,    // $50 flat
};
