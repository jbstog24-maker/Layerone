import { describe, expect, it, vi, beforeEach } from "vitest";
import { scheduledCallRouter } from "./routers/scheduledCalls";

// ── Stable mocks (hoisted) ──────────────────────────────────────────────────
const mockSendCallVerificationEmail = vi.fn().mockResolvedValue(true);

vi.mock("./email", () => ({
  sendCallVerificationEmail: (...args: any[]) => mockSendCallVerificationEmail(...args),
}));

type Row = {
  id: number;
  name: string;
  status: string;
  scheduledFor: Date;
  cancelToken: string | null;
};

// In-memory "table" the fake db reads from / writes to.
let table: Row[];
const updateCalls: Array<{ values: any; id: number }> = [];
const insertCalls: Array<any> = [];

function chainable(result: any[]) {
  // Drizzle chains are awaitable directly AND expose .limit() - emulate both.
  const p = Promise.resolve(result) as any;
  p.limit = async (_n: number) => result;
  return p;
}

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: () => ({
      from: () => ({
        where: () => chainable(table),
      }),
    }),
    update: () => ({
      set: (values: any) => ({
        where: async () => {
          updateCalls.push({ values, id: table[0]?.id });
          if (table[0]) table[0] = { ...table[0], ...values };
        },
      }),
    }),
    insert: () => ({
      values: async (values: any) => {
        insertCalls.push(values);
        return [{ insertId: 42 }];
      },
    }),
  }),
}));

const VALID_TOKEN = "a".repeat(64);
const OTHER_TOKEN = "b".repeat(64);

function caller() {
  return scheduledCallRouter.createCaller({
    req: { headers: {}, ip: "10.0.0.1" },
    res: {},
    user: null,
  } as any);
}

function futureIso(): string {
  return new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
}

beforeEach(() => {
  table = [];
  updateCalls.length = 0;
  insertCalls.length = 0;
  mockSendCallVerificationEmail.mockClear();
});

describe("cancelByToken", () => {
  it("cancels a pending booking and returns the scheduled date", async () => {
    const when = new Date(Date.now() + 3 * 60 * 60 * 1000);
    table = [{ id: 7, name: "Jane Doe", status: "pending", scheduledFor: when, cancelToken: VALID_TOKEN }];
    const res = await caller().cancelByToken({ token: VALID_TOKEN });
    expect(res.ok).toBe(true);
    expect(res.scheduledFor).toBe(when.toISOString());
    expect(res.name).toBe("Jane Doe");
    expect(table[0].status).toBe("cancelled");
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].values.status).toBe("cancelled");
  });

  it("cancels an unverified booking too", async () => {
    table = [{ id: 8, name: "Bob", status: "unverified", scheduledFor: new Date(), cancelToken: VALID_TOKEN }];
    const res = await caller().cancelByToken({ token: VALID_TOKEN });
    expect(res.ok).toBe(true);
    expect(table[0].status).toBe("cancelled");
  });

  it("rejects an unknown but well-formed token", async () => {
    table = [];
    await expect(caller().cancelByToken({ token: OTHER_TOKEN })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(updateCalls).toHaveLength(0);
  });

  it("rejects malformed tokens before touching the database", async () => {
    table = [{ id: 9, name: "Eve", status: "pending", scheduledFor: new Date(), cancelToken: VALID_TOKEN }];
    await expect(caller().cancelByToken({ token: "abc" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller().cancelByToken({ token: "x".repeat(64) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updateCalls).toHaveLength(0);
  });

  it("double-cancel is safe and reports already cancelled", async () => {
    table = [{ id: 10, name: "Sam", status: "cancelled", scheduledFor: new Date(), cancelToken: VALID_TOKEN }];
    await expect(caller().cancelByToken({ token: VALID_TOKEN })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/already been cancelled/),
    });
    expect(updateCalls).toHaveLength(0);
  });

  it("refuses to cancel completed / failed / expired bookings", async () => {
    for (const status of ["completed", "failed", "expired", "calling"]) {
      table = [{ id: 11, name: "Max", status, scheduledFor: new Date(), cancelToken: VALID_TOKEN }];
      await expect(caller().cancelByToken({ token: VALID_TOKEN })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(updateCalls).toHaveLength(0);
  });
});

describe("book generates a cancel token", () => {
  it("stores a 64-hex cancelToken and emails a cancel link", async () => {
    table = []; // no recent bookings → rate limits pass
    const res = await caller().book({
      name: "Jane Doe",
      phone: "4695551234",
      email: "jane@example.com",
      scheduledFor: futureIso(),
    });
    expect(res.ok).toBe(true);
    expect(insertCalls).toHaveLength(1);
    const inserted = insertCalls[0];
    expect(inserted.cancelToken).toMatch(/^[0-9a-f]{64}$/);
    expect(inserted.verificationToken).toMatch(/^[0-9a-f]{64}$/);
    expect(inserted.cancelToken).not.toBe(inserted.verificationToken);
    expect(mockSendCallVerificationEmail).toHaveBeenCalledOnce();
    const params = mockSendCallVerificationEmail.mock.calls[0][0];
    expect(params.cancelUrl).toMatch(new RegExp(`/cancel-call\\?token=${inserted.cancelToken}$`));
    expect(params.verifyUrl).toContain("/verify-call?token=");
  });
});
