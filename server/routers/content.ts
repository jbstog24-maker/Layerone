import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  listMarketingAssets,
  getMarketingAsset,
  createMarketingAsset,
  updateMarketingAsset,
  deleteMarketingAsset,
  logActivity,
} from "../db";
import { generateImage } from "../_core/imageGeneration";
import { invokeLLM } from "../_core/llm";

// Only admin and staff can access content studio
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "staff"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff or admin access required" });
  }
  return next({ ctx });
});

export const contentRouter = router({
  // ─── List all assets ────────────────────────────────────────────────────────
  list: staffProcedure
    .input(z.object({
      assetType: z.enum(["image", "video"]).optional(),
      status: z.enum(["generating", "ready", "failed"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      return listMarketingAssets(input ?? {});
    }),

  // ─── Get single asset ───────────────────────────────────────────────────────
  get: staffProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const asset = await getMarketingAsset(input.id);
      if (!asset) throw new TRPCError({ code: "NOT_FOUND" });
      return asset;
    }),

  // ─── Generate an image ──────────────────────────────────────────────────────
  generateImage: staffProcedure
    .input(z.object({
      title: z.string().min(1).max(256),
      prompt: z.string().min(1),
      style: z.string().optional(),
      tags: z.string().optional(),
      enhancePrompt: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      // Optionally enhance the prompt with AI for better results
      let finalPrompt = input.prompt;
      if (input.enhancePrompt) {
        try {
          const enhanced = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a professional marketing image prompt engineer for NSDS (Network Staging & Deployment Solutions), a B2B IT hardware staging and deployment company based in Dallas-Fort Worth, TX. 
Enhance the user's image prompt to be highly detailed, visually compelling, and suitable for professional B2B marketing materials. 
Focus on: clean modern aesthetics, professional lighting, corporate/industrial settings, IT hardware (servers, network equipment, laptops), warehouse/staging environments, and NSDS brand colors (deep navy blue #07111f, electric blue #39a7ff, mint green #6ee7b7).
Return ONLY the enhanced prompt text, nothing else.`,
              },
              {
                role: "user",
                content: `Enhance this image prompt for professional B2B marketing: "${input.prompt}"${input.style ? ` Style: ${input.style}` : ""}`,
              },
            ],
          });
          const enhancedText = enhanced?.choices?.[0]?.message?.content;
          if (enhancedText && typeof enhancedText === "string") {
            finalPrompt = enhancedText.trim();
          }
        } catch {
          // Fall back to original prompt if enhancement fails
        }
      }

      // Create a placeholder record first
      const { id } = await createMarketingAsset({
        title: input.title,
        assetType: "image",
        prompt: finalPrompt,
        style: input.style ?? null,
        format: "png",
        status: "generating",
        createdByUserId: ctx.user.id,
        createdByName: ctx.user.name ?? ctx.user.email ?? "Staff",
        tags: input.tags ?? null,
      });

      // Generate the image
      try {
        const { url } = await generateImage({ prompt: finalPrompt });
        await updateMarketingAsset(id, {
          fileUrl: url ?? null,
          fileKey: url ? url.replace("/manus-storage/", "") : null,
          thumbnailUrl: url ?? null,
          status: "ready",
        });
        await logActivity({
          userId: ctx.user.id,
          action: `Generated marketing image: ${input.title}`,
          entityType: "marketing_asset",
          entityId: id,
        });
        return { id, url, status: "ready" as const };
      } catch (err: any) {
        await updateMarketingAsset(id, {
          status: "failed",
          errorMessage: err?.message ?? "Image generation failed",
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message ?? "Image generation failed",
        });
      }
    }),

  // ─── Generate a video script + storyboard (AI text + image frames) ──────────
  generateVideo: staffProcedure
    .input(z.object({
      title: z.string().min(1).max(256),
      concept: z.string().min(1),
      duration: z.enum(["15s", "30s", "60s"]).default("30s"),
      style: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Create placeholder record
      const { id } = await createMarketingAsset({
        title: input.title,
        assetType: "video",
        prompt: input.concept,
        style: input.style ?? null,
        format: input.duration,
        status: "generating",
        createdByUserId: ctx.user.id,
        createdByName: ctx.user.name ?? ctx.user.email ?? "Staff",
        tags: input.tags ?? null,
      });

      try {
        // Generate a full video production package via AI
        const scriptResult = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a professional marketing video producer for NSDS (Network Staging & Deployment Solutions), a B2B IT hardware staging and deployment company in Dallas-Fort Worth, TX.
Create a complete video production package for a ${input.duration} marketing video.
NSDS brand: deep navy #07111f, electric blue #39a7ff, mint green #6ee7b7. Services: device receiving, staging, imaging, packing, shipping, customer portal.
Return JSON only.`,
            },
            {
              role: "user",
              content: `Create a ${input.duration} marketing video production package for: "${input.concept}"${input.style ? ` Style: ${input.style}` : ""}.
Return JSON with this exact structure:
{
  "hook": "Opening line (first 3 seconds)",
  "voiceover": "Full voiceover script",
  "scenes": [
    { "timestamp": "0:00", "visual": "Scene description", "text_overlay": "On-screen text", "duration": "5s" }
  ],
  "cta": "Call-to-action text",
  "music_mood": "Music style description",
  "key_messages": ["message1", "message2", "message3"]
}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "video_package",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  hook: { type: "string" },
                  voiceover: { type: "string" },
                  scenes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        timestamp: { type: "string" },
                        visual: { type: "string" },
                        text_overlay: { type: "string" },
                        duration: { type: "string" },
                      },
                      required: ["timestamp", "visual", "text_overlay", "duration"],
                      additionalProperties: false,
                    },
                  },
                  cta: { type: "string" },
                  music_mood: { type: "string" },
                  key_messages: { type: "array", items: { type: "string" } },
                },
                required: ["hook", "voiceover", "scenes", "cta", "music_mood", "key_messages"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = scriptResult?.choices?.[0]?.message?.content;
        const videoPackage = typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;

        // Generate a storyboard thumbnail from the first scene visual
        let thumbnailUrl: string | null = null;
        if (videoPackage?.scenes?.[0]?.visual) {
          try {
            const thumbResult = await generateImage({
              prompt: `Professional marketing video storyboard frame: ${videoPackage.scenes[0].visual}. NSDS brand colors, navy blue background, clean corporate style, 16:9 aspect ratio.`,
            });
            thumbnailUrl = thumbResult.url ?? null;
          } catch {
            // Thumbnail generation is optional
          }
        }

        // Store the video package as JSON in the fileUrl field
        const packageJson = JSON.stringify(videoPackage);
        await updateMarketingAsset(id, {
          fileUrl: packageJson,
          thumbnailUrl,
          status: "ready",
        });

        await logActivity({
          userId: ctx.user.id,
          action: `Generated marketing video package: ${input.title}`,
          entityType: "marketing_asset",
          entityId: id,
        });

        return { id, videoPackage, thumbnailUrl, status: "ready" as const };
      } catch (err: any) {
        await updateMarketingAsset(id, {
          status: "failed",
          errorMessage: err?.message ?? "Video generation failed",
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message ?? "Video generation failed",
        });
      }
    }),

  // ─── Delete an asset ────────────────────────────────────────────────────────
  delete: staffProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const asset = await getMarketingAsset(input.id);
      if (!asset) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteMarketingAsset(input.id);
      await logActivity({
        userId: ctx.user.id,
        action: `Deleted marketing asset: ${asset.title}`,
        entityType: "marketing_asset",
        entityId: input.id,
      });
      return { success: true };
    }),

  // ─── Update title/tags ──────────────────────────────────────────────────────
  update: staffProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(256).optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateMarketingAsset(id, data);
      return { success: true };
    }),

  // ─── Regenerate image with a variation prompt ───────────────────────────────
  regenerate: staffProcedure
    .input(z.object({
      id: z.number(),
      variationNote: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const asset = await getMarketingAsset(input.id);
      if (!asset) throw new TRPCError({ code: "NOT_FOUND" });
      if (asset.assetType !== "image") throw new TRPCError({ code: "BAD_REQUEST", message: "Can only regenerate images" });

      const prompt = input.variationNote
        ? `${asset.prompt}. Variation: ${input.variationNote}`
        : asset.prompt;

      await updateMarketingAsset(input.id, { status: "generating", errorMessage: null });

      try {
        const { url } = await generateImage({ prompt });
        await updateMarketingAsset(input.id, {
          fileUrl: url ?? null,
          fileKey: url ? url.replace("/manus-storage/", "") : null,
          thumbnailUrl: url ?? null,
          status: "ready",
          prompt,
        });
        await logActivity({
          userId: ctx.user.id,
          action: `Regenerated marketing image: ${asset.title}`,
          entityType: "marketing_asset",
          entityId: input.id,
        });
        return { id: input.id, url, status: "ready" as const };
      } catch (err: any) {
        await updateMarketingAsset(input.id, {
          status: "failed",
          errorMessage: err?.message ?? "Regeneration failed",
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message ?? "Regeneration failed" });
      }
    }),
});
