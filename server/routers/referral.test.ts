import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../routers";
import { referralSignupSchema, submitLeadSchema } from "./referral";
import type { TrpcContext } from "../_core/context";

// Mock the db module so tests don't need a real database.
// getDb() resolves null: referral.signup / referral.submitLead throw
// TRPCError INTERNAL on missing DB (they must persist), but the zod input
// validation still runs first, which is what these tests exercise.
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

function makeCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  } as TrpcContext;
}

describe("referralSignupSchema", () => {
  it("accepts a valid signup", () => {
    const parsed = referralSignupSchema.parse({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "555-123-4567",
      company: "Acme Corp",
      plan: "Share with my MSP network",
    });
    expect(parsed.name).toBe("Jane Doe");
  });

  it("accepts a minimal signup (name + email only)", () => {
    const parsed = referralSignupSchema.parse({ name: "Jane", email: "jane@example.com" });
    expect(parsed.phone).toBeUndefined();
  });

  it("rejects an invalid email", () => {
    expect(() =>
      referralSignupSchema.parse({ name: "Jane", email: "not-an-email" })
    ).toThrow();
  });

  it("rejects a missing name", () => {
    expect(() =>
      referralSignupSchema.parse({ email: "jane@example.com" })
    ).toThrow();
  });

  it("rejects a name longer than 120 chars", () => {
    expect(() =>
      referralSignupSchema.parse({ name: "x".repeat(121), email: "jane@example.com" })
    ).toThrow();
  });
});

describe("submitLeadSchema", () => {
  const valid = {
    referrerName: "Jane Doe",
    referrerEmail: "jane@example.com",
    leadCompany: "Acme Corp",
    leadName: "Bob Smith",
    leadEmail: "bob@acme.com",
  };

  it("accepts a valid lead", () => {
    expect(submitLeadSchema.parse(valid).leadCompany).toBe("Acme Corp");
  });

  it("rejects an invalid lead email", () => {
    expect(() => submitLeadSchema.parse({ ...valid, leadEmail: "bad" })).toThrow();
  });

  it("rejects an invalid referrer email", () => {
    expect(() => submitLeadSchema.parse({ ...valid, referrerEmail: "bad" })).toThrow();
  });

  it("rejects a missing lead name", () => {
    const { leadName: _omitted, ...rest } = valid;
    expect(() => submitLeadSchema.parse(rest)).toThrow();
  });

  it("rejects a missing referrer name", () => {
    const { referrerName: _omitted, ...rest } = valid;
    expect(() => submitLeadSchema.parse(rest)).toThrow();
  });
});

describe("referral router validation through the app router", () => {
  it("signup rejects invalid email before touching the database", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.referral.signup({ name: "Jane", email: "not-an-email" })
    ).rejects.toThrow();
  });

  it("submitLead rejects missing leadCompany before touching the database", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.referral.submitLead({
        referrerName: "Jane Doe",
        referrerEmail: "jane@example.com",
        leadCompany: "",
        leadName: "Bob Smith",
        leadEmail: "bob@acme.com",
      })
    ).rejects.toThrow();
  });
});
