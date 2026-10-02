import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  listLeads, getLead, createLead, updateLead, deleteLead, countLeadsByStatus,
  listLeadMessages, createLeadMessage, deleteLeadMessage,
  listLeadQuotes, createLeadQuote, updateLeadQuote, deleteLeadQuote,
  listDripSequences, getDripSequence, createDripSequence, updateDripSequence, deleteDripSequence,
  listDripSteps, createDripStep, updateDripStep, deleteDripStep,
  listDripEnrollments, getDripEnrollment, enrollLeadInDrip, updateDripEnrollment,
} from "../db";
import { invokeLLM, Message } from "../_core/llm";
import { makeRequest } from "../_core/map";
import { sendIntroductionEmail } from "../email";
import { INFO_CC } from "../infoCc";
import { sendHtmlEmail } from "../emailText";

export const leadsRouter = router({
  // ─── Leads CRUD ─────────────────────────────────────────────────────────────
  list: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      source: z.string().optional(),
      temperature: z.string().optional(),
    }).optional())
    .query(async ({ input }) => listLeads(input ?? {})),

  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const lead = await getLead(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      return lead;
    }),

  create: adminProcedure
    .input(z.object({
      companyName: z.string().min(1),
      contactName: z.string().optional(),
      contactTitle: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      industry: z.string().optional(),
      employeeCount: z.string().optional(),
      annualRevenue: z.string().optional(),
      source: z.enum(["manual", "inquiry_form", "google_maps", "referral", "linkedin", "other"]).optional(),
      status: z.enum(["new", "contacted", "qualified", "proposal_sent", "negotiating", "won", "lost", "on_hold", "unqualified", "follow_up", "demo_scheduled"]).optional(),
      temperature: z.enum(["cold", "warm", "hot"]).optional(),
      notes: z.string().optional(),
      placeId: z.string().optional(),
    }))
    .mutation(async ({ input }) => createLead({
      ...input,
      source: input.source ?? "manual",
      status: input.status ?? "new",
      temperature: input.temperature ?? "cold",
    })),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      companyName: z.string().optional(),
      contactName: z.string().optional(),
      contactTitle: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      industry: z.string().optional(),
      employeeCount: z.string().optional(),
      annualRevenue: z.string().optional(),
      source: z.enum(["manual", "inquiry_form", "google_maps", "referral", "linkedin", "other"]).optional(),
      status: z.enum(["new", "contacted", "qualified", "proposal_sent", "negotiating", "won", "lost", "on_hold", "unqualified", "follow_up", "demo_scheduled"]).optional(),
      temperature: z.enum(["cold", "warm", "hot"]).optional(),
      score: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateLead(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteLead(input.id);
      return { success: true };
    }),

  stats: adminProcedure
    .query(async () => countLeadsByStatus()),

  // ─── AI Scoring ─────────────────────────────────────────────────────────────
  scoreWithAI: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const lead = await getLead(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });

      const prompt = `You are a B2B sales scoring expert for Layer One Staging Solutions, a DFW company offering device staging, warehouse logistics, and multi-site deployment.

Score this lead 0-100 on likelihood to need Layer One services:
- Company: ${lead.companyName}
- Industry: ${lead.industry ?? "Unknown"}
- City: ${lead.city ?? "Unknown"}, ${lead.state ?? "TX"}
- Employees: ${lead.employeeCount ?? "Unknown"}
- Website: ${lead.website ?? "None"}
- Notes: ${lead.notes ?? "None"}

High-scoring: IT/MSP, retail chains, healthcare, education, government, logistics, multi-location.
Respond ONLY with JSON: {"score":<0-100>,"temperature":"cold"|"warm"|"hot","reasoning":"<1 sentence>"}`;

      const llmResult = await invokeLLM({ messages: [{ role: "user", content: prompt }], maxTokens: 200 });
      const response = (llmResult.choices[0]?.message?.content as string) ?? "";
      let parsed: { score: number; temperature: "cold" | "warm" | "hot"; reasoning: string };
      try {
        const m = response.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(m?.[0] ?? "{}");
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI scoring failed" });
      }

      await updateLead(input.id, {
        score: parsed.score,
        temperature: parsed.temperature,
        notes: lead.notes
          ? `${lead.notes}\n\n[AI]: ${parsed.reasoning}`
          : `[AI]: ${parsed.reasoning}`,
      });

      return parsed;
    }),

  // ─── Campaign Messages ───────────────────────────────────────────────────────
  listMessages: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => listLeadMessages(input.leadId)),

  generateCampaign: adminProcedure
    .input(z.object({
      leadId: z.number(),
      type: z.enum(["cold_email", "follow_up_email", "linkedin_message", "call_script", "sms"]),
      customInstructions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const lead = await getLead(input.leadId);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });

      const typeLabel: Record<string, string> = {
        cold_email: "cold outreach email",
        follow_up_email: "follow-up email",
        linkedin_message: "LinkedIn connection message (under 300 characters)",
        call_script: "phone call script with opening, value prop, and objection handling",
        sms: "SMS text message (under 160 characters)",
      };

      const isEmail = input.type === "cold_email" || input.type === "follow_up_email";
      const prompt = `Write a ${typeLabel[input.type]} for Layer One Staging Solutions, a DFW company offering device staging, warehouse logistics, and multi-site IT deployment.

Target:
- Company: ${lead.companyName}
- Contact: ${lead.contactName ?? "Decision Maker"} (${lead.contactTitle ?? "IT/Operations"})
- Industry: ${lead.industry ?? "Business"}
- City: ${lead.city ?? "DFW area"}
${input.customInstructions ? `\nInstructions: ${input.customInstructions}` : ""}

Be professional, concise, and personalized. Focus on pain points: slow device deployment, multi-location management, IT asset chaos.
${isEmail ? 'Respond with JSON: {"subject":"<subject>","body":"<body with \\n for line breaks>"}' : "Respond with just the message text."}`;

      const llmResult = await invokeLLM({ messages: [{ role: "user", content: prompt }], maxTokens: 800 });
      const response = (llmResult.choices[0]?.message?.content as string) ?? "";

      let subject: string | undefined;
      let body: string;

      if (isEmail) {
        try {
          const m = response.match(/\{[\s\S]*\}/);
          const p = JSON.parse(m?.[0] ?? "{}");
          subject = p.subject;
          body = p.body;
        } catch {
          subject = `Layer One Services for ${lead.companyName}`;
          body = response;
        }
      } else {
        body = response;
      }

      const saved = await createLeadMessage({ leadId: input.leadId, type: input.type, subject, body, generatedByAi: true });
      return { id: saved.id, subject, body };
    }),

  deleteMessage: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteLeadMessage(input.id);
      return { success: true };
    }),

  // ─── Quotes ──────────────────────────────────────────────────────────────────
  listQuotes: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => listLeadQuotes(input.leadId)),

  createQuote: adminProcedure
    .input(z.object({
      leadId: z.number(),
      title: z.string().min(1),
      tier: z.string().optional(),
      deviceCount: z.number().optional(),
      monthlyRate: z.string().optional(),
      setupFee: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => createLeadQuote({ ...input, status: "draft" })),

  updateQuote: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      tier: z.string().optional(),
      deviceCount: z.number().optional(),
      monthlyRate: z.string().optional(),
      setupFee: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["draft", "sent", "accepted", "rejected"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateLeadQuote(id, data);
      return { success: true };
    }),

  deleteQuote: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteLeadQuote(input.id);
      return { success: true };
    }),

  // ─── Google Places Lead Finder ───────────────────────────────────────────────
  searchPlaces: adminProcedure
    .input(z.object({
      query: z.string().min(1),
      location: z.string().optional().default("32.7767,-96.7970"),
      radius: z.number().optional().default(40000),
      subRegion: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Build a targeted query that anchors results to Layer One's DFW service area
      // and appends the sub-region when specified for tighter geographic targeting.
      const region = input.subRegion ? `${input.subRegion}, TX` : "Dallas-Fort Worth, TX";
      const enrichedQuery = `${input.query} ${region}`;

      const result = await makeRequest<any>("/maps/api/place/textsearch/json", {
        query: enrichedQuery,
        location: input.location,
        radius: String(input.radius),
      });
      if (result.status !== "OK" && result.status !== "ZERO_RESULTS") {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Places API: ${result.status}` });
      }

      // Filter out place types that are clearly not B2B prospects
      const EXCLUDED_TYPES = new Set([
        "restaurant", "food", "cafe", "bar", "lodging", "gym", "spa",
        "hair_care", "beauty_salon", "clothing_store", "shoe_store",
        "grocery_or_supermarket", "convenience_store", "gas_station",
        "car_wash", "car_repair", "church", "mosque", "synagogue",
        "school", "university", "hospital", "pharmacy", "dentist",
        "doctor", "veterinary_care", "amusement_park", "movie_theater",
        "night_club", "casino", "park", "tourist_attraction",
      ]);

      const raw = (result.results ?? []) as Array<{
        place_id: string;
        name: string;
        formatted_address: string;
        rating?: number;
        user_ratings_total?: number;
        types?: string[];
        business_status?: string;
      }>;

      // Keep only open/operational businesses that are not in the excluded list
      return raw.filter((place) => {
        if (place.business_status && place.business_status !== "OPERATIONAL") return false;
        const types = place.types ?? [];
        if (types.some((t) => EXCLUDED_TYPES.has(t))) return false;
        return true;
      });
    }),

  getPlaceDetails: adminProcedure
    .input(z.object({ placeId: z.string() }))
    .query(async ({ input }) => {
      const result = await makeRequest<any>("/maps/api/place/details/json", {
        place_id: input.placeId,
        fields: "name,formatted_address,formatted_phone_number,website,rating,business_status,geometry,types",
      });
      if (result.status !== "OK") {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Place Details API: ${result.status}` });
      }
      return result.result as {
        name: string;
        formatted_address?: string;
        formatted_phone_number?: string;
        website?: string;
        rating?: number;
        business_status?: string;
        types?: string[];
      };
    }),

  importPlace: adminProcedure
    .input(z.object({
      placeId: z.string(),
      name: z.string(),
      address: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      industry: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Parse city from formatted_address (e.g. "123 Main St, Plano, TX 75023, USA")
      const parts = input.address?.split(",") ?? [];
      const city = parts.length >= 2 ? parts[parts.length - 3]?.trim() ?? parts[1]?.trim() ?? "DFW" : "DFW";
      return createLead({
        companyName: input.name,
        phone: input.phone,
        website: input.website,
        address: input.address,
        city,
        state: "TX",
        industry: input.industry,
        source: "google_maps",
        status: "new",
        temperature: "cold",
        placeId: input.placeId,
      });
    }),

  // ─── Introduction Email ──────────────────────────────────────────────────────
  draftIntroEmail: adminProcedure
    .input(z.object({
      leadId: z.number().optional(),
      // For Lead Finder cards that haven't been imported yet
      companyName: z.string().optional(),
      industry: z.string().optional(),
      city: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      let companyName = input.companyName ?? "";
      let industry = input.industry ?? "";
      let city = input.city ?? "DFW area";
      let contactName: string | null = null;
      let contactTitle: string | null = null;

      if (input.leadId) {
        const lead = await getLead(input.leadId);
        if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
        companyName = lead.companyName;
        industry = lead.industry ?? industry;
        city = lead.city ?? city;
        contactName = lead.contactName ?? null;
        contactTitle = lead.contactTitle ?? null;
      }

      if (!companyName) throw new TRPCError({ code: "BAD_REQUEST", message: "Company name is required" });

      const greeting = contactName ? `${contactName.split(" ")[0]}` : "there";
      const industryLine = industry ? `We work with a lot of ${industry} companies` : "We work with IT teams across many industries";

      const prompt = `Write a professional introduction email from Layer One Staging Solutions to a prospective client.

Layer One is a DFW-based company that handles IT hardware staging, device imaging, warehouse logistics, and multi-site deployment prep for MSPs, IT VARs, cabling contractors, security integrators, and enterprise IT teams.

Prospect details:
- Company: ${companyName}
- Industry: ${industry || "IT / Technology"}
- City: ${city}
- Contact: ${contactName ?? "Decision Maker"} (${contactTitle ?? "IT/Operations"})

Email requirements:
- Subject line: short, specific, not clickbait
- Opening: address them by first name ("${greeting}"), mention their company and city
- Body: briefly explain what Layer One does in plain language - no jargon, no buzzwords
- ${industryLine} in the DFW area and understand their challenges around device deployment timelines and multi-site logistics
- Mention 2-3 concrete things Layer One can do for them (e.g. receive and stage devices before the truck rolls, handle imaging and configuration, provide a customer portal for real-time tracking)
- Closing: invite them to a short 15-minute call to see if it's a fit - no pressure, no hard sell
- Tone: warm, informative, peer-to-peer - NOT salesy, NOT pushy, NOT full of exclamation points
- Length: 150-200 words max
- Sign off as: Layer One Team | Layer One Staging Solutions | Dallas-Fort Worth, TX

Respond with JSON: {"subject":"<subject line>","body":"<email body with \\n for line breaks>"}`;

      const llmResult = await invokeLLM({ messages: [{ role: "user", content: prompt }], maxTokens: 600 });
      const raw = (llmResult.choices[0]?.message?.content as string) ?? "";

      let subject = `Introduction: Layer One Staging Services for ${companyName}`;
      let body = raw;
      try {
        const m = raw.match(/\{[\s\S]*\}/);
        const p = JSON.parse(m?.[0] ?? "{}");
        if (p.subject) subject = p.subject;
        if (p.body) body = p.body;
      } catch { /* fallback to raw */ }

      return { subject, body };
    }),

  sendIntroEmail: adminProcedure
    .input(z.object({
      leadId: z.number(),
      subject: z.string().min(1),
      body: z.string().min(1),
      recipientEmail: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const lead = await getLead(input.leadId);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });

      const sent = await sendIntroductionEmail({
        to: input.recipientEmail,
        subject: input.subject,
        body: input.body,
        companyName: lead.companyName,
      });

      if (!sent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send email - check Resend configuration" });

      // Save the sent message to campaign history and mark lead as contacted
      await createLeadMessage({
        leadId: input.leadId,
        type: "cold_email",
        subject: input.subject,
        body: input.body,
        generatedByAi: true,
        sentAt: new Date(),
      });
      await updateLead(input.leadId, { lastContactedAt: new Date(), status: "contacted" });

      return { success: true };
    }),

  // ─── Drip Sequences ──────────────────────────────────────────────────────────
  listSequences: adminProcedure
    .query(async () => listDripSequences()),

  getSequence: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const seq = await getDripSequence(input.id);
      if (!seq) throw new TRPCError({ code: "NOT_FOUND" });
      const steps = await listDripSteps(input.id);
      return { ...seq, steps };
    }),

  createSequence: adminProcedure
    .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ input, ctx }) => createDripSequence({ ...input, createdByUserId: ctx.user.id })),

  updateSequence: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateDripSequence(id, data);
      return { success: true };
    }),

  deleteSequence: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteDripSequence(input.id);
      return { success: true };
    }),

  addStep: adminProcedure
    .input(z.object({
      sequenceId: z.number(),
      stepNumber: z.number(),
      delayDays: z.number().default(0),
      subject: z.string().min(1),
      body: z.string().min(1),
    }))
    .mutation(async ({ input }) => createDripStep(input)),

  updateStep: adminProcedure
    .input(z.object({
      id: z.number(),
      stepNumber: z.number().optional(),
      delayDays: z.number().optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateDripStep(id, data);
      return { success: true };
    }),

  deleteStep: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteDripStep(input.id);
      return { success: true };
    }),

  listEnrollments: adminProcedure
    .input(z.object({ leadId: z.number().optional(), sequenceId: z.number().optional() }).optional())
    .query(async ({ input }) => listDripEnrollments(input ?? {})),

  enrollLead: adminProcedure
    .input(z.object({ leadId: z.number(), sequenceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return enrollLeadInDrip({
        leadId: input.leadId,
        sequenceId: input.sequenceId,
        currentStep: 0,
        status: "active",
        nextSendAt: new Date(),
        enrolledByUserId: ctx.user.id,
      });
    }),

  pauseEnrollment: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateDripEnrollment(input.id, { status: "paused" });
      return { success: true };
    }),

  resumeEnrollment: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateDripEnrollment(input.id, { status: "active", nextSendAt: new Date() });
      return { success: true };
    }),

  sendNextStep: adminProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ input }) => {
      const enrollment = await getDripEnrollment(input.enrollmentId);
      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });

      const lead = await getLead(enrollment.leadId);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      if (!lead.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Lead has no email" });

      const steps = await listDripSteps(enrollment.sequenceId);
      const idx = enrollment.currentStep;
      if (idx >= steps.length) {
        await updateDripEnrollment(input.enrollmentId, { status: "completed", completedAt: new Date() });
        return { sent: false, message: "Sequence completed" };
      }

      const step = steps[idx];
      const Resend = (await import("resend")).Resend;
      const resend = new Resend(process.env.RESEND_API_KEY);
      await sendHtmlEmail(resend, {
        from: process.env.RESEND_FROM_EMAIL ?? "noreply@resend.dev",
        cc: INFO_CC,
        to: lead.email,
        subject: step.subject,
        html: step.body.replace(/\n/g, "<br>"),
      });

      const newIdx = idx + 1;
      const isLast = newIdx >= steps.length;
      let nextSendAt: Date | undefined;
      if (!isLast) {
        nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + (steps[newIdx].delayDays || 1));
      }

      await updateDripEnrollment(input.enrollmentId, {
        currentStep: newIdx,
        status: isLast ? "completed" : "active",
        nextSendAt,
        completedAt: isLast ? new Date() : undefined,
      });
      await updateLead(enrollment.leadId, { lastContactedAt: new Date() });

      return { sent: true, step: newIdx, isLast };
    }),

  // ─── Convert Lead → Client ────────────────────────────────────────────────
  convertToClient: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const lead = await getLead(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      // Create client from lead data
      const db = await import("../db");
      const result = await db.createClient({
        companyName: lead.companyName,
        contactName: lead.contactName ?? undefined,
        contactEmail: lead.email ?? undefined,
        contactPhone: lead.phone ?? undefined,
        address: lead.address ?? undefined,
        status: "onboarding",
        projectNotes: lead.notes ?? undefined,
      });
      // Mark lead as won and link to client
      await updateLead(input.id, {
        status: "won",
        convertedToClientAt: new Date(),
        convertedClientId: (result as any)?.insertId ?? undefined,
      } as any);
      return { success: true, clientId: (result as any)?.insertId };
    }),

  // ─── Set Follow-Up Date ───────────────────────────────────────────────────
  setFollowUpDate: adminProcedure
    .input(z.object({
      id: z.number(),
      followUpAt: z.string().nullable(), // ISO date string or null to clear
    }))
    .mutation(async ({ input }) => {
      const lead = await getLead(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      await updateLead(input.id, {
        nextFollowUpAt: input.followUpAt ? new Date(input.followUpAt) : null,
      } as any);
      return { success: true };
    }),

  // ─── Overdue Follow-Ups ───────────────────────────────────────────────────
  listOverdue: protectedProcedure
    .query(async ({ ctx }) => {
      const role = ctx.user.role;
      if (role !== "admin" && role !== "staff") throw new TRPCError({ code: "FORBIDDEN" });
      const all = await listLeads({});
      const now = new Date();
      return all.filter((l: any) =>
        l.nextFollowUpAt &&
        new Date(l.nextFollowUpAt) <= now &&
        l.status !== "won" &&
        l.status !== "lost"
      );
    }),
});
