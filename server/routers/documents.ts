import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  listDocumentTemplates,
  getDocumentTemplate,
  createDocumentTemplate,
  updateDocumentTemplate,
  listClientDocuments,
  getClientDocument,
  createClientDocument,
  updateClientDocument,
  listAllClientDocuments,
  getClient,
  updateClient,
  listPackages,
  logActivity,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";
import { TIER_PRICING, type PackageTier } from "../stripe-products";

const isAdminOrStaff = (role: string) => role === "admin" || role === "staff";

// ─── MSA Template Content per Tier ───────────────────────────────────────────
function buildMsaContent(params: {
  clientName: string;
  packageName: string;
  tierKey: PackageTier;
  addOns: string[];
  basePrice: string;
  billingCycle: string;
  goLiveDate: string;
}): string {
  const { clientName, packageName, tierKey, addOns, basePrice, billingCycle, goLiveDate } = params;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const tier = TIER_PRICING[tierKey];

  const addOnSection = addOns.length > 0
    ? `\n\nADD-ON SERVICES\nThe following add-on services are included in this agreement:\n${addOns.map(a => `  • ${a}`).join("\n")}`
    : "";

  return `MASTER SERVICE AGREEMENT
NETWORK STAGING & DEPLOYMENT SOLUTIONS (NSDS)

Agreement Date: ${today}
Client: ${clientName}
Package: ${packageName}
Estimated Go-Live Date: ${goLiveDate}

─────────────────────────────────────────────────────────────────────────────

1. SERVICES

NSDS agrees to provide the following staging and logistics services to the Client under the ${packageName} package:

  • ${tier.description}
  • Secure climate-controlled warehouse storage
  • 24/7 security monitoring and surveillance
  • Inbound receiving and inventory tracking
  • Device staging, configuration support, and QA
  • Outbound shipment coordination and tracking
  • Customer portal access for real-time visibility${addOnSection}

2. FEES AND PAYMENT

Base Package Fee: ${basePrice} (${billingCycle})
Payment is due upon execution of this agreement. Recurring charges will be billed on the same date each billing cycle.

Overage charges apply for usage exceeding package limits per the current NSDS rate schedule.
Late payments are subject to a 1.5% monthly finance charge.

3. TERM AND TERMINATION

This agreement commences on the go-live date (${goLiveDate}) following the 2-week onboarding and setup period. Either party may terminate with 30 days written notice. NSDS reserves the right to suspend services for non-payment.

4. ONBOARDING AND SETUP

NSDS requires a 2-week setup period from the date of contract execution to:
  • Allocate and prepare the assigned warehouse space
  • Assign dedicated technicians (if applicable)
  • Configure customer portal access
  • Complete facility orientation and access provisioning

5. LIABILITY AND INSURANCE

NSDS maintains general liability insurance covering stored equipment up to $100,000 per occurrence. Client is responsible for insuring equipment values exceeding this limit. NSDS is not liable for equipment damage resulting from manufacturer defects, improper packaging, or force majeure events.

6. CONFIDENTIALITY

Both parties agree to maintain the confidentiality of proprietary information shared during the term of this agreement.

7. GOVERNING LAW

This agreement is governed by the laws of the State of Texas. Any disputes shall be resolved in Tarrant County, Texas.

─────────────────────────────────────────────────────────────────────────────

CLIENT SIGNATURE

By signing below, the Client agrees to the terms and conditions of this Master Service Agreement.

Client Name: ___________________________  Date: _______________

Authorized Signature: ___________________________

Title: ___________________________

─────────────────────────────────────────────────────────────────────────────

NSDS AUTHORIZED SIGNATURE

Name: ___________________________  Date: _______________

Signature: ___________________________

Title: ___________________________

─────────────────────────────────────────────────────────────────────────────
NSDS | Network Staging & Deployment Solutions
North Richland Hills, TX | nsds.com
`;
}

export const documentsRouter = router({
  // ─── Template Management ────────────────────────────────────────────────────
  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      return listDocumentTemplates(false);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
        const tpl = await getDocumentTemplate(input.id);
        if (!tpl) throw new TRPCError({ code: "NOT_FOUND" });
        return tpl;
      }),

    /** Upload a document template (base64 encoded file) */
    upload: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        category: z.enum(["agreement", "onboarding", "sow", "nda", "authorization", "checklist", "other"]),
        description: z.string().optional(),
        fileName: z.string().min(1),
        mimeType: z.string().default("application/pdf"),
        fileSizeBytes: z.number().optional(),
        version: z.string().optional(),
        fileBase64: z.string(), // base64-encoded file content
      }))
      .mutation(async ({ ctx, input }) => {
        if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
        const buffer = Buffer.from(input.fileBase64, "base64");
        const key = `documents/templates/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        const tpl = await createDocumentTemplate({
          name: input.name,
          category: input.category,
          description: input.description,
          fileKey: key,
          fileUrl: url,
          mimeType: input.mimeType,
          fileName: input.fileName,
          fileSizeBytes: input.fileSizeBytes ?? buffer.length,
          version: input.version ?? "1.0",
          isActive: true,
          createdByUserId: ctx.user.id,
        });
        await logActivity({ userId: ctx.user.id, action: `Uploaded document template: ${input.name}`, entityType: "document_template" });
        return tpl;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        version: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await updateDocumentTemplate(id, data);
        return { success: true };
      }),
  }),

  // ─── Client Documents ───────────────────────────────────────────────────────
  clientDocs: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Admin/staff can see all; customer can only see their own
        if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
          if (ctx.user.clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });
        } else if (!isAdminOrStaff(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return listClientDocuments(input.clientId);
      }),

    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      return listAllClientDocuments();
    }),

    /** Auto-draft an MSA for a client based on their assigned package */
    autoDraftMsa: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        addOns: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });

        const client = await getClient(input.clientId);
        if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });

        // Get package info
        let packageName = "Custom Package";
        let tierKey: PackageTier = "custom";
        let basePrice = "Custom";
        let billingCycle = "monthly";

        if (client.packageId) {
          const pkgs = await listPackages();
          const pkg = pkgs.find(p => p.id === client.packageId);
          if (pkg) {
            packageName = pkg.name;
            tierKey = pkg.tier as PackageTier;
            basePrice = `$${Number(pkg.basePrice).toLocaleString()}`;
            billingCycle = pkg.billingCycle === "one_time" ? "one-time" : "per month";
          }
        }

        const goLiveDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

        const msaContent = buildMsaContent({
          clientName: client.companyName,
          packageName,
          tierKey,
          addOns: input.addOns ?? [],
          basePrice,
          billingCycle,
          goLiveDate,
        });

        // Store MSA as a text file in S3
        const fileName = `MSA-${client.companyName.replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}.txt`;
        const key = `documents/clients/${input.clientId}/${fileName}`;
        const { url } = await storagePut(key, msaContent, "text/plain");

        const doc = await createClientDocument({
          clientId: input.clientId,
          templateId: null,
          name: `Master Service Agreement — ${packageName}`,
          status: "draft",
          sentByUserId: ctx.user.id,
          signedFileKey: key,
          signedFileUrl: url,
          notes: `Auto-generated MSA for ${packageName}. Add-ons: ${(input.addOns ?? []).join(", ") || "None"}`,
        });

        await logActivity({
          userId: ctx.user.id,
          clientId: input.clientId,
          action: `Auto-drafted MSA for ${client.companyName} (${packageName})`,
          entityType: "client_document",
        });

        return { success: true, documentId: doc?.insertId, fileUrl: url };
      }),

    /** Send a document to the client for signature */
    send: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        documentId: z.number().optional(),
        templateId: z.number().optional(),
        name: z.string().optional(),
        sentToEmail: z.string().email(),
        sentMessage: z.string().optional(),
        expiresInDays: z.number().default(30),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });

        const client = await getClient(input.clientId);
        if (!client) throw new TRPCError({ code: "NOT_FOUND" });

        const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);
        let docId = input.documentId;

        if (!docId) {
          // Create a new document record from template
          const tpl = input.templateId ? await getDocumentTemplate(input.templateId) : null;
          const result = await createClientDocument({
            clientId: input.clientId,
            templateId: input.templateId ?? null,
            name: input.name ?? tpl?.name ?? "Document",
            status: "sent",
            sentAt: new Date(),
            sentByUserId: ctx.user.id,
            sentToEmail: input.sentToEmail,
            sentMessage: input.sentMessage,
            expiresAt,
            signedFileKey: tpl?.fileKey ?? "",
            signedFileUrl: tpl?.fileUrl ?? "",
          });
          docId = result?.insertId;
        } else {
          await updateClientDocument(docId, {
            status: "sent",
            sentAt: new Date(),
            sentByUserId: ctx.user.id,
            sentToEmail: input.sentToEmail,
            sentMessage: input.sentMessage,
            expiresAt,
          });
        }

        // Notify owner so they can forward/email the client
        const doc = docId ? await getClientDocument(docId) : null;
        const docName = doc?.name ?? input.name ?? "Document";

        await notifyOwner({
          title: `📄 Document Sent: ${docName}`,
          content: `A document has been sent to ${client.companyName} for signature.\n\nClient: ${client.companyName}\nDocument: ${docName}\nSent To: ${input.sentToEmail}\nExpires: ${expiresAt.toLocaleDateString()}\n\nMessage: ${input.sentMessage ?? "(none)"}\n\nDocument URL: ${doc?.signedFileUrl ?? "N/A"}\n\nPlease forward this document to the client for signature.`,
        });

        await logActivity({
          userId: ctx.user.id,
          clientId: input.clientId,
          action: `Sent document "${docName}" to ${input.sentToEmail}`,
          entityType: "client_document",
          entityId: docId,
        });

        return { success: true, documentId: docId };
      }),

    /** Update document status (viewed, signed, approved, rejected) */
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "sent", "viewed", "signed", "approved", "rejected", "expired"]),
        signedByName: z.string().optional(),
        signedByEmail: z.string().optional(),
        rejectionReason: z.string().optional(),
        notes: z.string().optional(),
        // For uploading signed copy
        signedFileBase64: z.string().optional(),
        signedFileName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });

        const doc = await getClientDocument(input.id);
        if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

        const now = new Date();
        const updateData: Record<string, unknown> = { status: input.status };

        if (input.status === "signed") {
          updateData.signedAt = now;
          updateData.signedByName = input.signedByName;
          updateData.signedByEmail = input.signedByEmail;

          // Upload signed copy if provided
          if (input.signedFileBase64 && input.signedFileName) {
            const buffer = Buffer.from(input.signedFileBase64, "base64");
            const key = `documents/clients/${doc.clientId}/signed/${Date.now()}-${input.signedFileName}`;
            const { url } = await storagePut(key, buffer, "application/pdf");
            updateData.signedFileKey = key;
            updateData.signedFileUrl = url;
          }

          // Auto-set contractSignedAt and goLiveDate on client
          const goLiveDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
          await updateClient(doc.clientId, {
            contractSignedAt: now,
            goLiveDate,
            status: "onboarding",
          });

          // Notify owner about contract signing + go-live date
          const client = await getClient(doc.clientId);
          await notifyOwner({
            title: `✅ Contract Signed: ${client?.companyName}`,
            content: `${client?.companyName} has signed the ${doc.name}.\n\nSigned by: ${input.signedByName ?? "N/A"} (${input.signedByEmail ?? "N/A"})\nGo-Live Date: ${goLiveDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n\nAction Required:\n• Assign warehouse space (Unit #, address, access code)\n• Assign technicians if needed\n• Process first payment via Stripe\n• Complete setup within 14 days`,
          });

          await logActivity({
            userId: ctx.user.id,
            clientId: doc.clientId,
            action: `Contract signed by ${input.signedByName ?? "client"}. Go-live: ${goLiveDate.toLocaleDateString()}`,
            entityType: "client_document",
            entityId: input.id,
          });
        } else if (input.status === "approved") {
          updateData.approvedAt = now;
          updateData.approvedByUserId = ctx.user.id;
        } else if (input.status === "rejected") {
          updateData.rejectedAt = now;
          updateData.rejectionReason = input.rejectionReason;
        }

        if (input.notes) updateData.notes = input.notes;

        await updateClientDocument(input.id, updateData as any);
        return { success: true };
      }),

    /** Upload a signed/completed document back to a client record */
    uploadSigned: protectedProcedure
      .input(z.object({
        id: z.number(),
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string().default("application/pdf"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
        const doc = await getClientDocument(input.id);
        if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
        const buffer = Buffer.from(input.fileBase64, "base64");
        const key = `documents/clients/${doc.clientId}/signed/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await updateClientDocument(input.id, { signedFileKey: key, signedFileUrl: url });
        await logActivity({
          userId: ctx.user.id,
          clientId: doc.clientId,
          action: `Uploaded signed document: ${doc.name}`,
          entityType: "client_document",
          entityId: input.id,
        });
        return { success: true, url };
      }),
  }),

  // ─── Warehouse Assignment ───────────────────────────────────────────────────
  assignWarehouse: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      warehouseUnitNumber: z.string().min(1),
      warehouseAddress: z.string().min(1),
      warehouseAccessCode: z.string().optional(),
      warehouseDimensions: z.string().optional(),
      warehouseNotes: z.string().optional(),
      assignedTechNames: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });

      const client = await getClient(input.clientId);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });

      const { clientId, ...warehouseData } = input;
      await updateClient(clientId, {
        ...warehouseData,
        warehouseAssignedAt: new Date(),
      });

      // Notify owner to email client with warehouse details
      await notifyOwner({
        title: `🏭 Warehouse Assigned: ${client.companyName}`,
        content: `Warehouse space has been assigned to ${client.companyName}.\n\nPlease send the following details to the client at ${client.contactEmail ?? client.billingEmail ?? "their email"}:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nWAREHOUSE SPACE DETAILS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nUnit Number: ${input.warehouseUnitNumber}\nAddress: ${input.warehouseAddress}\nAccess Code: ${input.warehouseAccessCode ?? "Will be provided separately"}\nDimensions: ${input.warehouseDimensions ?? "N/A"}\nAssigned Technicians: ${input.assignedTechNames ?? "TBD"}\nNotes: ${input.warehouseNotes ?? "None"}\n\nGo-Live Date: ${client.goLiveDate ? new Date(client.goLiveDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "TBD"}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      });

      await logActivity({
        userId: ctx.user.id,
        clientId,
        action: `Assigned warehouse space Unit #${input.warehouseUnitNumber} to ${client.companyName}`,
        entityType: "client",
        entityId: clientId,
      });

      return { success: true };
    }),

  // ─── Stripe Checkout ────────────────────────────────────────────────────────
  createCheckout: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      tier: z.enum(["basic", "standard", "professional", "enterprise", "custom"]),
      customAmountCents: z.number().optional(), // for custom tier overrides
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });

      const client = await getClient(input.clientId);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });

      const pricing = TIER_PRICING[input.tier];
      const amount = input.customAmountCents ?? pricing.amountCents;

      // Return pricing info for the admin to use with Stripe dashboard or manual invoice
      // Full Stripe checkout session creation happens via the /api/stripe/checkout endpoint
      return {
        success: true,
        clientId: input.clientId,
        clientName: client.companyName,
        clientEmail: client.billingEmail ?? client.contactEmail ?? "",
        tier: input.tier,
        packageName: pricing.name,
        amountCents: amount,
        amountDisplay: `$${(amount / 100).toLocaleString()}`,
        mode: pricing.mode,
        interval: pricing.interval,
      };
    }),
});
