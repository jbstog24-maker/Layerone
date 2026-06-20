import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { packageInquiries } from "../../drizzle/schema";

export const inquiryRouter = router({
  submit: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(120),
      company: z.string().min(1).max(200),
      email: z.string().email().max(320),
      phone: z.string().max(30).optional(),
      tier: z.enum(["basic", "standard", "professional", "enterprise", "custom"]),
      deviceVolume: z.string().max(30).optional(),
      message: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (db) {
        await db.insert(packageInquiries).values({
          name: input.name,
          company: input.company,
          email: input.email,
          phone: input.phone ?? null,
          tier: input.tier,
          deviceVolume: input.deviceVolume ?? null,
          message: input.message ?? null,
        });
      }

      // Notify the owner via Manus notification service
      const content = [
        `**Name:** ${input.name}`,
        `**Company:** ${input.company}`,
        `**Email:** ${input.email}`,
        input.phone ? `**Phone:** ${input.phone}` : null,
        `**Package:** ${input.tier.charAt(0).toUpperCase() + input.tier.slice(1)}`,
        input.deviceVolume ? `**Device Volume:** ${input.deviceVolume}` : null,
        input.message ? `**Message:** ${input.message}` : null,
      ].filter(Boolean).join("\n");

      await notifyOwner({
        title: `New Package Inquiry — ${input.tier.charAt(0).toUpperCase() + input.tier.slice(1)} (${input.company})`,
        content,
      }).catch(() => {
        // Non-fatal: inquiry is already persisted in DB
      });

      return { success: true };
    }),
});
