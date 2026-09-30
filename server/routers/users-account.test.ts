import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock the db module so tests don't need a real database.
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  updateUser: vi.fn().mockResolvedValue(undefined),
  getClient: vi.fn().mockResolvedValue(null),
}));

import { updateUser, getClient } from "../db";

function makeCtx(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  } as TrpcContext;
}

const customerUser = {
  id: 7,
  role: "customer_viewer",
  clientId: 5,
  email: "viewer@acme.com",
} as TrpcContext["user"];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("users.updateMe", () => {
  it("lets a signed-in user update their own profile fields", async () => {
    const caller = appRouter.createCaller(makeCtx(customerUser));
    const result = await caller.users.updateMe({
      name: "Jane Viewer",
      phone: "555-0100",
      jobTitle: "IT Manager",
      department: "Infrastructure",
    });
    expect(result).toEqual({ success: true });
    expect(updateUser).toHaveBeenCalledWith(7, {
      name: "Jane Viewer",
      phone: "555-0100",
      jobTitle: "IT Manager",
      department: "Infrastructure",
    });
  });

  it("updates only the caller's own account", async () => {
    const adminUser = { id: 1, role: "admin", email: "a@x.com" } as TrpcContext["user"];
    const caller = appRouter.createCaller(makeCtx(adminUser));
    await caller.users.updateMe({ name: "Admin Name" });
    expect(updateUser).toHaveBeenCalledWith(1, {
      name: "Admin Name",
      phone: null,
      jobTitle: null,
      department: null,
    });
  });

  it("ignores disallowed fields like role, email, and clientId", async () => {
    const caller = appRouter.createCaller(makeCtx(customerUser));
    await caller.users.updateMe({
      name: "Jane Viewer",
      role: "admin",
      email: "hacker@evil.com",
      clientId: 999,
    } as any);
    // zod strips unknown keys; the db update only carries whitelisted fields
    expect(updateUser).toHaveBeenCalledWith(7, {
      name: "Jane Viewer",
      phone: null,
      jobTitle: null,
      department: null,
    });
  });

  it("rejects blank names", async () => {
    const caller = appRouter.createCaller(makeCtx(customerUser));
    await expect(caller.users.updateMe({ name: "   " })).rejects.toThrow();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.users.updateMe({ name: "Nobody" })).rejects.toThrow();
    expect(updateUser).not.toHaveBeenCalled();
  });
});

describe("clients.myClient", () => {
  it("returns the customer's own client", async () => {
    vi.mocked(getClient).mockResolvedValue({ id: 5, companyName: "Acme Corp", status: "active" } as any);
    const caller = appRouter.createCaller(makeCtx(customerUser));
    const result = await caller.clients.myClient();
    expect(getClient).toHaveBeenCalledWith(5);
    expect(result).toMatchObject({ companyName: "Acme Corp" });
  });

  it("returns null for admin/staff without a linked client", async () => {
    const adminUser = { id: 1, role: "admin", email: "a@x.com" } as TrpcContext["user"];
    const caller = appRouter.createCaller(makeCtx(adminUser));
    const result = await caller.clients.myClient();
    expect(result).toBeNull();
    expect(getClient).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.clients.myClient()).rejects.toThrow();
  });
});
