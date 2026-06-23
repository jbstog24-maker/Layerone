/**
 * Scheduled heartbeat handlers — all mounted at /api/scheduled/*
 * Auth: sdk.authenticateRequest → user.isCron === true
 * These handlers are idempotent and safe to retry.
 */

import { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import {
  listClients, getClient, getPackage, getClientUsage,
  listInvoices, createInvoice, createLineItem, updateInvoice,
  listDueEnrollments, getDripEnrollment, updateDripEnrollment,
  getLead, updateLead, listLeads,
  listDripSteps,
} from "./db";
import { sendDripEmail } from "./email";

// ─── Monthly Invoice Auto-Generation ─────────────────────────────────────────
// Runs on 1st of each month at 06:00 UTC.
// Generates draft invoices for all active clients that don't already have one
// for the current billing period.
export async function handleMonthlyInvoices(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return res.status(403).json({ error: "cron-only" });

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 1st of last month
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);       // last day of last month

    const allClients = await listClients();
    const activeClients = allClients.filter((c: any) => c.status === "active" && c.packageId);

    let generated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const client of activeClients) {
      try {
        // Check if an invoice for this period already exists (idempotency)
        const existing = await listInvoices(client.id);
        const alreadyExists = existing.some((inv: any) => {
          const start = new Date(inv.periodStart);
          return start.getFullYear() === periodStart.getFullYear() &&
                 start.getMonth() === periodStart.getMonth();
        });

        if (alreadyExists) {
          skipped++;
          continue;
        }

        const pkg = client.packageId ? await getPackage(client.packageId) : null;
        const usage = await getClientUsage(client.id);
        const invoiceNumber = `INV-${client.id}-${periodStart.getFullYear()}${String(periodStart.getMonth() + 1).padStart(2, "0")}`;

        await createInvoice({
          invoiceNumber,
          clientId: client.id,
          periodStart,
          periodEnd,
          subtotal: "0.00",
          tax: "0.00",
          total: "0.00",
          createdBy: 0, // system
          dueDate: new Date(now.getFullYear(), now.getMonth(), 15), // due 15th of current month
        });

        // Fetch the new invoice
        const allInvoices = await listInvoices(client.id);
        const newInvoice = allInvoices[0];
        if (!newInvoice) continue;

        const lineItems: any[] = [];

        if (pkg) {
          lineItems.push({
            invoiceId: newInvoice.id,
            description: `${pkg.name} — Base Package`,
            category: "base_package",
            quantity: "1.00",
            unitPrice: String(pkg.basePrice),
            total: String(pkg.basePrice),
          });

          if (usage) {
            const maxDevices = pkg.maxDevices ?? 0;
            const maxBoxes = pkg.maxBoxes ?? 0;
            const maxPallets = pkg.maxPallets ?? 0;
            const maxShipments = pkg.maxOutboundShipments ?? 0;

            if (usage.devices > maxDevices && maxDevices > 0) {
              const extra = usage.devices - maxDevices;
              lineItems.push({ invoiceId: newInvoice.id, description: `Extra devices (${extra} over limit)`, category: "extra_devices", quantity: String(extra), unitPrice: "25.00", total: (extra * 25).toFixed(2) });
            }
            if (usage.boxes > maxBoxes && maxBoxes > 0) {
              const extra = usage.boxes - maxBoxes;
              lineItems.push({ invoiceId: newInvoice.id, description: `Extra boxes (${extra} over limit)`, category: "extra_boxes", quantity: String(extra), unitPrice: "20.00", total: (extra * 20).toFixed(2) });
            }
            if (usage.pallets > maxPallets && maxPallets > 0) {
              const extra = usage.pallets - maxPallets;
              lineItems.push({ invoiceId: newInvoice.id, description: `Extra pallets (${extra} over limit)`, category: "extra_pallets", quantity: String(extra), unitPrice: "150.00", total: (extra * 150).toFixed(2) });
            }
            if (usage.shipments > maxShipments && maxShipments > 0) {
              const extra = usage.shipments - maxShipments;
              lineItems.push({ invoiceId: newInvoice.id, description: `Extra outbound shipments (${extra} over limit)`, category: "packing_shipping", quantity: String(extra), unitPrice: "50.00", total: (extra * 50).toFixed(2) });
            }
          }
        }

        for (const item of lineItems) {
          await createLineItem(item);
        }

        const subtotal = lineItems.reduce((sum: number, li: any) => sum + parseFloat(li.total), 0);
        await updateInvoice(newInvoice.id, { subtotal: subtotal.toFixed(2), total: subtotal.toFixed(2) } as any);
        generated++;
      } catch (err: any) {
        errors.push(`Client ${client.id}: ${err.message}`);
      }
    }

    console.log(`[Scheduled] Monthly invoices: generated=${generated}, skipped=${skipped}, errors=${errors.length}`);
    return res.json({ ok: true, generated, skipped, errors });
  } catch (err: any) {
    console.error("[Scheduled] handleMonthlyInvoices error:", err);
    return res.status(500).json({ error: err.message, stack: err.stack, timestamp: new Date().toISOString() });
  }
}

// ─── Drip Sequence Auto-Send ──────────────────────────────────────────────────
// Runs every 30 minutes. Finds all active enrollments whose nextSendAt <= NOW()
// and sends the next drip email step.
export async function handleDripAutoSend(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return res.status(403).json({ error: "cron-only" });

    const dueEnrollments = await listDueEnrollments();
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const enrollment of dueEnrollments) {
      try {
        const lead = await getLead(enrollment.leadId);
        if (!lead || !lead.email) {
          // Mark as completed if no email — can't send
          await updateDripEnrollment(enrollment.id, { status: "completed" } as any);
          continue;
        }

        const steps = await listDripSteps(enrollment.sequenceId);
        const currentStepIndex = enrollment.currentStep ?? 0;
        const step = steps[currentStepIndex];

        if (!step) {
          // No more steps — mark completed
          await updateDripEnrollment(enrollment.id, { status: "completed", completedAt: new Date() } as any);
          continue;
        }

        // Send the email
        const emailSent = await sendDripEmail({
          to: lead.email,
          toName: lead.contactName ?? lead.companyName,
          subject: step.subject ?? `Following up — ${lead.companyName}`,
          htmlBody: step.body ?? "",
          companyName: lead.companyName,
        });

        if (!emailSent) {
          failed++;
          errors.push(`Enrollment ${enrollment.id}: email send failed`);
          continue;
        }

        // Advance to next step
        const nextStepIndex = currentStepIndex + 1;
        const nextStep = steps[nextStepIndex];

        if (nextStep) {
          const delayDays = nextStep.delayDays ?? 3;
          const nextSendAt = new Date();
          nextSendAt.setDate(nextSendAt.getDate() + delayDays);
          await updateDripEnrollment(enrollment.id, {
            currentStep: nextStepIndex,
            nextSendAt,
            lastSentAt: new Date(),
          } as any);
        } else {
          // All steps sent — mark completed
          await updateDripEnrollment(enrollment.id, {
            status: "completed",
            completedAt: new Date(),
            lastSentAt: new Date(),
          } as any);
        }

        // Update lead lastContactedAt
        await updateLead(enrollment.leadId, { lastContactedAt: new Date() } as any);
        sent++;
      } catch (err: any) {
        failed++;
        errors.push(`Enrollment ${enrollment.id}: ${err.message}`);
      }
    }

    console.log(`[Scheduled] Drip auto-send: sent=${sent}, failed=${failed}`);
    return res.json({ ok: true, sent, failed, errors });
  } catch (err: any) {
    console.error("[Scheduled] handleDripAutoSend error:", err);
    return res.status(500).json({ error: err.message, stack: err.stack, timestamp: new Date().toISOString() });
  }
}

// ─── Lead Score Decay ─────────────────────────────────────────────────────────
// Runs daily at 02:00 UTC. Finds leads with no activity in 30+ days,
// reduces their score by 1 (min 1), and marks them as stale.
export async function handleLeadScoreDecay(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) return res.status(403).json({ error: "cron-only" });

    const allLeads = await listLeads({});
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let decayed = 0;
    let skipped = 0;

    for (const lead of allLeads) {
      // Skip won/lost leads
      if (lead.status === "won" || lead.status === "lost") {
        skipped++;
        continue;
      }

      const lastActivity = lead.lastContactedAt
        ? new Date(lead.lastContactedAt)
        : new Date(lead.createdAt);

      if (lastActivity < thirtyDaysAgo) {
        const currentScore = lead.score ?? 5;
        const newScore = Math.max(1, currentScore - 1);
        const updates: any = { score: newScore };

        // Mark as stale if not already
        if (lead.temperature !== "cold") {
          updates.temperature = "cold";
        }

        await updateLead(lead.id, updates);
        decayed++;
      } else {
        skipped++;
      }
    }

    console.log(`[Scheduled] Lead score decay: decayed=${decayed}, skipped=${skipped}`);
    return res.json({ ok: true, decayed, skipped });
  } catch (err: any) {
    console.error("[Scheduled] handleLeadScoreDecay error:", err);
    return res.status(500).json({ error: err.message, stack: err.stack, timestamp: new Date().toISOString() });
  }
}
