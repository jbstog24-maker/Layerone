/**
 * Creates Layer One products and prices in Stripe to match the website pricing.
 * Run once: node scripts/create-stripe-products.mjs
 */
import "dotenv/config";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-05-27.dahlia" });

const PRODUCTS = [
  {
    key: "basic",
    name: "Project Staging Pilot",
    description: "For first-time customers testing Layer One on a single project. Includes full receiving, organization, intake photos, serial/MAC capture, and one outbound shipment coordination — no monthly commitment. Up to 5 active devices, 5 boxes received, 14-day project window.",
    mode: "payment",
    amountCents: 49900, // $499 one-time
  },
  {
    key: "standard",
    name: "Shared Staging Shelf",
    description: "For MSPs and contractors with light recurring receiving, organization, and short-term storage needs. Assigned shelf/bin capacity with monthly usage summaries and up to 3 outbound shipment coordinations. Up to 10 active devices, 1 pallet/month, 10 boxes/month, 30-day storage.",
    mode: "subscription",
    amountCents: 75000, // $750/month
  },
  {
    key: "professional",
    name: "Shared Staging Bay",
    description: "Our most popular tier — purpose-built for recurring deployment work. Includes dock/ramp coordination and up to 8 outbound shipment coordinations per month. Up to 25 active devices, 3 pallets/month, 30 boxes/month, 30-day storage.",
    mode: "subscription",
    amountCents: 150000, // $1,500/month
  },
  {
    key: "enterprise",
    name: "Dedicated Staging Area",
    description: "Separated project area with dedicated LayerOne-managed workflow. Includes weekly inventory reports, 20 outbound shipment coordinations, and one project coordination call per month. Up to 75 active devices, 6 pallets/month, 75 boxes/month, 45-day storage.",
    mode: "subscription",
    amountCents: 350000, // $3,500/month
  },
  {
    key: "custom",
    name: "Rollout Suite",
    description: "For multi-site deployments, national rollout vendors, POS projects, security deployments, and franchise technology rollouts. Sole-use project area or dedicated suite with chain-of-custody tracking. Up to 150 active devices, 20 pallets/month, 200 boxes/month, 60-day storage.",
    mode: "subscription",
    amountCents: 500000, // $5,000/month base — overridden per client
  },
];

// Add-on products (metered/one-time line items)
const ADDON_PRODUCTS = [
  {
    key: "extra_device",
    name: "Extra Device Storage (per device/month)",
    description: "Additional device stored beyond package limit. Billed per device per month.",
    amountCents: 1800, // $18/device/mo (midpoint of $15–$25)
    mode: "payment",
  },
  {
    key: "extra_box",
    name: "Extra Parcel Received (per box)",
    description: "Additional parcel received beyond package limit. Includes intake logging, photos & project assignment.",
    amountCents: 750, // $7.50/box (midpoint of $5–$10)
    mode: "payment",
  },
  {
    key: "extra_pallet",
    name: "Extra Pallet (per pallet)",
    description: "Additional pallet beyond package limit. Rate depends on facility, size, handling & storage duration.",
    amountCents: 3000, // $30/pallet (midpoint of $25–$40)
    mode: "payment",
  },
  {
    key: "extended_storage",
    name: "Extended Storage (per item/day)",
    description: "Storage beyond included duration. After 14d Pilot · 30d Shelf/Bay · 45d Dedicated · 60d Rollout.",
    amountCents: 350, // $3.50/day (midpoint of $2–$5)
    mode: "payment",
  },
  {
    key: "extra_shipment",
    name: "Extra Outbound Shipment",
    description: "Outbound shipment coordination beyond package limit. Includes packing, labels, carrier handoff & documentation.",
    amountCents: 2500, // $25/shipment (midpoint of $20–$35)
    mode: "payment",
  },
  {
    key: "asset_capture",
    name: "Inventory & Asset Capture (per device)",
    description: "Model, serial, MAC address, asset photo & inventory log per device.",
    amountCents: 1500, // $15/device
    mode: "payment",
  },
  {
    key: "site_kit",
    name: "Site-Kit Assembly (per site kit)",
    description: "Devices, patch cables, labels, packing list & install notes per site kit.",
    amountCents: 25000, // $250/site kit
    mode: "payment",
  },
  {
    key: "labor_staging",
    name: "Layer One Staging Technician (per hour)",
    description: "Labeling, firmware checks, packing, site-kit prep & approved staging tasks.",
    amountCents: 11000, // $110/hr (midpoint of $95–$125)
    mode: "payment",
  },
  {
    key: "labor_network",
    name: "Senior Network Technician (per hour)",
    description: "Switch, firewall, VLAN, VPN, IP plan & deployment readiness review.",
    amountCents: 15500, // $155/hr (midpoint of $135–$175)
    mode: "payment",
  },
];

async function createProduct(p) {
  // Check if product already exists by searching metadata
  const existing = await stripe.products.search({ query: `metadata['layer_one_key']:'${p.key}'` });
  if (existing.data.length > 0) {
    console.log(`  ✓ Already exists: ${p.name} (${existing.data[0].id})`);
    // Get its prices
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true, limit: 1 });
    return { product: existing.data[0], price: prices.data[0] };
  }

  const product = await stripe.products.create({
    name: p.name,
    description: p.description,
    metadata: { layer_one_key: p.key },
  });

  const priceParams = {
    product: product.id,
    currency: "usd",
    unit_amount: p.amountCents,
    metadata: { layer_one_key: p.key },
  };

  if (p.mode === "subscription") {
    priceParams.recurring = { interval: "month" };
  }

  const price = await stripe.prices.create(priceParams);
  console.log(`  ✓ Created: ${p.name} → product=${product.id} price=${price.id}`);
  return { product, price };
}

async function main() {
  console.log("\n=== Creating Layer One Package Products ===");
  const packageResults = {};
  for (const p of PRODUCTS) {
    const result = await createProduct(p);
    packageResults[p.key] = { productId: result.product.id, priceId: result.price?.id };
  }

  console.log("\n=== Creating Layer One Add-On Products ===");
  const addonResults = {};
  for (const p of ADDON_PRODUCTS) {
    const result = await createProduct(p);
    addonResults[p.key] = { productId: result.product.id, priceId: result.price?.id };
  }

  console.log("\n=== RESULTS (copy into stripe-products.ts) ===");
  console.log(JSON.stringify({ packages: packageResults, addons: addonResults }, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
