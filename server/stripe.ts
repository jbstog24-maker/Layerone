import express, { type Express, type Request, type Response } from "express";
import Stripe from "stripe";
import { getClient, updateClient, logActivity } from "./db";
import { notifyOwner } from "./_core/notification";
import { TIER_PRICING, type PackageTier } from "./stripe-products";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

/**
 * Register Stripe routes on the Express app.
 * MUST be called BEFORE express.json() middleware for webhook signature verification.
 */
export function registerStripeRoutes(app: Express) {
  // ── Webhook endpoint (raw body required for signature verification) ──────────
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({ error: "Stripe not configured" });
      }

      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret!);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const clientId = session.metadata?.client_id
              ? parseInt(session.metadata.client_id)
              : null;
            const stripeCustomerId = typeof session.customer === "string"
              ? session.customer
              : session.customer?.id ?? null;
            const subscriptionId = typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id ?? null;

            if (clientId) {
              const client = await getClient(clientId);
              await updateClient(clientId, {
                paymentStatus: "paid",
                stripeCustomerId: stripeCustomerId ?? undefined,
                stripeSubscriptionId: subscriptionId ?? undefined,
                status: "onboarding",
              });

              // Set go-live date if not already set
              if (client && !client.goLiveDate) {
                const goLiveDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
                await updateClient(clientId, { goLiveDate });
              }

              await logActivity({
                clientId,
                action: `Payment confirmed via Stripe. Subscription ID: ${subscriptionId ?? "N/A"}`,
                entityType: "client",
                entityId: clientId,
              });

              const updatedClient = await getClient(clientId);
              const goLive = updatedClient?.goLiveDate
                ? new Date(updatedClient.goLiveDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                : "TBD";

              await notifyOwner({
                title: `💳 Payment Received: ${updatedClient?.companyName ?? "Client"}`,
                content: `Payment confirmed for ${updatedClient?.companyName ?? "a client"}.\n\nStripe Customer ID: ${stripeCustomerId ?? "N/A"}\nSubscription ID: ${subscriptionId ?? "N/A"}\nGo-Live Date: ${goLive}\n\nNext Steps:\n• Assign warehouse space if not yet done\n• Confirm tech assignments\n• Send warehouse details to client`,
              });
            }
            break;
          }

          case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            const stripeCustomerId = typeof invoice.customer === "string"
              ? invoice.customer
              : null;
            if (stripeCustomerId) {
              // Find client by stripeCustomerId and mark paid
              console.log(`[Stripe] Invoice paid for customer ${stripeCustomerId}`);
            }
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const stripeCustomerId = typeof invoice.customer === "string"
              ? invoice.customer
              : null;
            if (stripeCustomerId) {
              console.warn(`[Stripe] Payment failed for customer ${stripeCustomerId}`);
              await notifyOwner({
                title: "⚠️ Stripe Payment Failed",
                content: `A payment failed for Stripe customer ${stripeCustomerId}. Please check the Stripe dashboard and follow up with the client.`,
              });
            }
            break;
          }

          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const stripeCustomerId = typeof sub.customer === "string"
              ? sub.customer
              : null;
            if (stripeCustomerId) {
              console.log(`[Stripe] Subscription cancelled for customer ${stripeCustomerId}`);
            }
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Error processing event:", err);
      }

      res.json({ received: true });
    }
  );

  // ── Create Checkout Session ──────────────────────────────────────────────────
  app.post("/api/stripe/checkout", express.json(), async (req: Request, res: Response) => {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: "Stripe not configured" });
    }

    const { clientId, tier, customAmountCents } = req.body as {
      clientId: number;
      tier: PackageTier;
      customAmountCents?: number;
    };

    if (!clientId || !tier) {
      return res.status(400).json({ error: "clientId and tier are required" });
    }

    const client = await getClient(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const pricing = TIER_PRICING[tier];
    const amount = customAmountCents ?? pricing.amountCents;
    const origin = req.headers.origin || `https://${req.headers.host}`;

    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: pricing.mode,
        customer_email: client.billingEmail ?? client.contactEmail ?? undefined,
        allow_promotion_codes: true,
        client_reference_id: clientId.toString(),
        metadata: {
          client_id: clientId.toString(),
          client_name: client.companyName,
          tier,
          package_name: pricing.name,
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: pricing.name,
                description: pricing.description,
              },
              unit_amount: amount,
              ...(pricing.mode === "subscription" && pricing.interval
                ? { recurring: { interval: pricing.interval } }
                : {}),
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/dashboard?payment=success&clientId=${clientId}`,
        cancel_url: `${origin}/dashboard?payment=cancelled&clientId=${clientId}`,
      };

      const session = await stripe.checkout.sessions.create(sessionParams);

      // Update client payment status to pending
      await updateClient(clientId, { paymentStatus: "pending" });

      res.json({ url: session.url, sessionId: session.id });
    } catch (err: any) {
      console.error("[Stripe] Failed to create checkout session:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
