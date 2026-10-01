import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock the db module so tests don't need a real database.
// getDb() resolves null; inquiry.submit skips persistence in that case but
// still runs zod input validation and the draft-quote pipeline.
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

vi.mock("../email", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendQuoteEmail: vi.fn().mockResolvedValue(undefined),
  sendInquiryOwnerEmail: vi.fn().mockResolvedValue(undefined),
}));

function makeCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  } as TrpcContext;
}

const baseInput = {
  name: "Jane Doe",
  company: "Acme Corp",
  email: "jane@acme.com",
  phone: "555-123-4567",
  tier: "custom" as const,
};

describe("inquiry.submit rollout scoping fields", () => {
  it("accepts locationCount, equipmentTypes, startDate, rolloutDuration", async () => {
    const caller = appRouter.createCaller(makeCtx());
    // With the DB mocked to null, submit skips persistence but still runs
    // validation + the draft-quote pipeline - success proves the new fields
    // flow through without breaking anything.
    const result = await caller.inquiry.submit({
      ...baseInput,
      locationCount: 25,
      equipmentTypes: ["Network & Switching", "Wi-Fi / Access Points"],
      startDate: "2026-11-01",
      rolloutDuration: "1-3-months",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a submission without rollout fields (backwards compatible)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.inquiry.submit(baseInput);
    expect(result.success).toBe(true);
  });

  it("accepts a per-pallet quote (quoteType=pallet, no tier required)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.inquiry.submit({
      ...baseInput,
      quoteType: "pallet",
      palletCount: 4,
      storageDays: 45,
      addons: ["asset_tagging", "onsite_delivery"],
    });
    expect(result.success).toBe(true);
  });

  it("defaults to the project quote path when quoteType is omitted", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.inquiry.submit({
      name: "No Tier",
      company: "Acme",
      email: "notier@acme.com",
      phone: "2145550100",
      // no tier, no quoteType - PackageDetail-era callers keep working
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative locationCount", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.inquiry.submit({ ...baseInput, locationCount: -1 })
    ).rejects.toThrow();
  });

  it("rejects an over-long equipmentTypes array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.inquiry.submit({
        ...baseInput,
        equipmentTypes: Array.from({ length: 13 }, (_, i) => `type-${i}`),
      })
    ).rejects.toThrow();
  });
});
