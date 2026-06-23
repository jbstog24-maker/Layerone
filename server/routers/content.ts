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
                content: `You are a professional marketing image prompt engineer for Layer One Staging Solutions, a B2B IT hardware staging and deployment company based in Dallas-Fort Worth, TX. 
Enhance the user's image prompt to be highly detailed, visually compelling, and suitable for professional B2B marketing materials. 
Focus on: clean modern aesthetics, professional lighting, corporate/industrial settings, IT hardware (servers, network equipment, laptops), warehouse/staging environments, and Layer One brand colors (deep navy blue #07111f, electric blue #39a7ff, mint green #6ee7b7).
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
              content: `You are a professional marketing video producer for Layer One Staging Solutions, a B2B IT hardware staging and deployment company in Dallas-Fort Worth, TX.
Create a complete video production package for a ${input.duration} marketing video.
Layer One brand: deep navy #07111f, electric blue #39a7ff, mint green #6ee7b7. Services: device receiving, staging, imaging, packing, shipping, customer portal.
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
              prompt: `Professional marketing video storyboard frame: ${videoPackage.scenes[0].visual}. Layer One brand colors, navy blue background, clean corporate style, 16:9 aspect ratio.`,
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

  // ─── Generate platform-specific social media captions ───────────────────────
  generateCaptions: staffProcedure
    .input(z.object({
      // Either provide an asset ID (to use a gallery image) or a custom description
      assetId: z.number().optional(),
      imageDescription: z.string().optional(),
      imageUrl: z.string().optional(),
      platforms: z.array(z.enum(["linkedin", "instagram", "twitter", "facebook"])).min(1),
      tone: z.enum(["professional", "conversational", "energetic", "educational"]).default("professional"),
      includeHashtags: z.boolean().default(true),
      includeEmoji: z.boolean().default(true),
      campaignContext: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Build context from asset or custom description
      let imageContext = input.imageDescription ?? "";
      let imageUrlForPrompt = input.imageUrl ?? "";

      if (input.assetId) {
        const asset = await getMarketingAsset(input.assetId);
        if (asset) {
          imageContext = asset.prompt;
          imageUrlForPrompt = asset.fileUrl ?? "";
        }
      }

      if (!imageContext && !imageUrlForPrompt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Provide either an asset ID or an image description" });
      }

      const platformSpecs: Record<string, { maxChars: number; style: string; hashtagCount: string }> = {
        linkedin: {
          maxChars: 700,
          style: "professional, thought-leadership tone, B2B focused, starts with a hook line, ends with a question or CTA",
          hashtagCount: "3–5 professional hashtags",
        },
        instagram: {
          maxChars: 300,
          style: "visual storytelling, engaging, slightly casual but still professional, uses line breaks for readability",
          hashtagCount: "10–15 relevant hashtags in a separate block",
        },
        twitter: {
          maxChars: 280,
          style: "punchy, concise, direct, fits in a single tweet, strong hook",
          hashtagCount: "2–3 hashtags max",
        },
        facebook: {
          maxChars: 500,
          style: "community-friendly, approachable, slightly longer form, good for local DFW business audience",
          hashtagCount: "3–5 hashtags",
        },
      };

      const selectedPlatforms = input.platforms.filter((p) => platformSpecs[p]);

      const platformInstructions = selectedPlatforms
        .map((p) => {
          const spec = platformSpecs[p];
          return `${p.toUpperCase()}: ${spec.style}. Max ${spec.maxChars} characters. Use ${spec.hashtagCount}.`;
        })
        .join("\n");

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional social media copywriter for Layer One Staging Solutions, a B2B IT hardware staging and deployment company based in Dallas-Fort Worth, TX.

Layer One services: device receiving, organizing, staging, imaging, packing, shipping, and deployment prep for MSPs, cabling contractors, security installers, and enterprise IT rollout teams.
Brand voice: expert, trustworthy, efficient, DFW-proud.
Brand colors: deep navy #07111f, electric blue #39a7ff, mint green #6ee7b7.
Website: nsds.io

Tone requested: ${input.tone}
Include emoji: ${input.includeEmoji ? "yes, use sparingly and professionally" : "no"}
Include hashtags: ${input.includeHashtags ? "yes" : "no"}
${input.campaignContext ? `Campaign context: ${input.campaignContext}` : ""}

Generate platform-specific captions. Return JSON only.`,
          },
          {
            role: "user",
            content: `Image description / prompt: "${imageContext}"

Generate captions for these platforms:\n${platformInstructions}

Return JSON with this exact structure:
{
  "captions": {
    ${selectedPlatforms.map((p) => `"${p}": { "text": "...", "hashtags": ["..."], "charCount": 0 }`).join(",\n    ")}
  },
  "altText": "Accessibility alt text for the image (1 sentence)"
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "social_captions",
            strict: false,
            schema: {
              type: "object",
              properties: {
                captions: { type: "object" },
                altText: { type: "string" },
              },
              required: ["captions", "altText"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = result?.choices?.[0]?.message?.content;
      const parsed = typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;

      return {
        captions: parsed.captions as Record<string, { text: string; hashtags: string[]; charCount: number }>,
        altText: parsed.altText as string,
        imageContext,
      };
    }),
});
