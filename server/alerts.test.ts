import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module so tests don't need a real database.
// getDb resolves to null -> alerts endpoints return [].
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getClient: vi.fn().mockImplementation(async (id: number) =>
    id ? { id, companyName: "Test Corp", status: "active" } : null
  ),
}));

function makeCtx(role: string, clientId?: number | null): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "password",
      role: role as any,
      clientId: clientId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as any,
  };
}

describe("alerts.list (admin)", () => {
  it("returns an empty list for admin when the DB is unavailable", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    await expect(caller.alerts.list()).resolves.toEqual([]);
  });

  it("returns an empty list for staff", async () => {
    const caller = appRouter.createCaller(makeCtx("staff"));
    await expect(caller.alerts.list()).resolves.toEqual([]);
  });

  it("rejects customer roles with FORBIDDEN", async () => {
    const caller = appRouter.createCaller(makeCtx("customer_admin", 5));
    await expect(caller.alerts.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("alerts.myList (customer)", () => {
  it("is blocked by the customer gate when the customer has no linked client", async () => {
    const caller = appRouter.createCaller(makeCtx("customer_viewer", null));
    await expect(caller.alerts.myList()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns an empty list when the DB is unavailable", async () => {
    const caller = appRouter.createCaller(makeCtx("customer_admin", 7));
    await expect(caller.alerts.myList()).resolves.toEqual([]);
  });

  it("is reachable by admin/staff too (passthrough)", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    await expect(caller.alerts.myList()).resolves.toEqual([]);
  });
});
