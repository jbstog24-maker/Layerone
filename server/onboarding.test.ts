import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTableName } from "drizzle-orm";

// ── Mocks (hoisted) ───────────────────────────────────────────────────────────
const mockSend = vi.fn();
const mockGetDb = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

vi.mock("./_core/env", () => ({
  ENV: {
    resendApiKey: "re_test_key_123",
    resendFromEmail: "info@layeronestaging.com",
    ownerNotifyEmail: "owner@layeronestaging.com",
    portalUrl: "https://www.layeronestaging.com",
  },
}));

vi.mock("./db", () => ({
  getDb: (...args: unknown[]) => mockGetDb(...args),
}));

// ── Tiny in-memory drizzle fake ───────────────────────────────────────────────
function makeFakeDb(seed: Record<string, any[]> = {}) {
  const store: Record<string, any[]> = {};
  for (const [k, v] of Object.entries(seed)) store[k] = v.map((r) => ({ ...r }));
  let nextId = 100;
  const name = (t: any) => getTableName(t);
  const rowsFor = (t: any) => store[name(t)] ?? [];
  // where() must be both awaitable and chainable (.orderBy().limit()), like drizzle.
  const makeWhere = (rows: any[]) => {
    const w: any = {
      orderBy: (_c: any) => ({
        limit: (n: number) => Promise.resolve(rows.slice(0, n)),
      }),
      then: (resolve: any, reject: any) =>
        Promise.resolve(rows).then(resolve, reject),
    };
    return w;
  };
  return {
    __store: store,
    select: (_fields?: any) => ({
      from: (t: any) => ({
        where: (_c: any) => makeWhere(rowsFor(t)),
      }),
    }),
    insert: (t: any) => ({
      values: (vals: any) => {
        const n = name(t);
        store[n] = store[n] ?? [];
        const arr = (Array.isArray(vals) ? vals : [vals]).map((v) => ({
          ...v,
          id: v.id ?? nextId++,
        }));
        store[n].push(...arr);
        return Promise.resolve([{ insertId: arr[0].id }]);
      },
    }),
    update: (t: any) => ({
      set: (vals: any) => ({
        where: (_c: any) => {
          for (const r of rowsFor(t)) Object.assign(r, vals);
          return Promise.resolve([]);
        },
      }),
    }),
  };
}

import {
  ONBOARDING_TEMPLATE,
  createOnboardingChecklist,
  checkAndTriggerHandoff,
  sendOwnerEmail,
} from "./onboarding";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ONBOARDING_TEMPLATE", () => {
  it("has 8 ordered steps starting with payment/MSA confirmation", () => {
    expect(ONBOARDING_TEMPLATE).toHaveLength(8);
    expect(ONBOARDING_TEMPLATE[0].label).toBe("Payment & MSA confirmed");
    expect(ONBOARDING_TEMPLATE[7].label).toBe("Closeout documentation sent");
    for (const step of ONBOARDING_TEMPLATE) {
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.detail.length).toBeGreaterThan(0);
    }
  });
});

describe("createOnboardingChecklist", () => {
  it("creates a checklist with 8 tasks and pre-completes task 1", async () => {
    const db = makeFakeDb();
    mockGetDb.mockResolvedValueOnce(db);
    const checklist = await createOnboardingChecklist(42);
    expect(checklist).not.toBeNull();
    expect(checklist!.inquiryId).toBe(42);
    expect(checklist!.status).toBe("in_progress");
    const tasks = (db as any).__store["onboarding_tasks"];
    expect(tasks).toHaveLength(8);
    expect(tasks[0].completedAt).not.toBeNull();
    expect(tasks[0].completedBy).toBe("system");
    expect(tasks[1].completedAt).toBeNull();
    expect(tasks.map((t: any) => t.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("is idempotent - returns the existing checklist without duplicating", async () => {
    const db = makeFakeDb({
      onboarding_checklists: [{ id: 7, inquiryId: 42, status: "in_progress" }],
      onboarding_tasks: [],
    });
    mockGetDb.mockResolvedValueOnce(db);
    const checklist = await createOnboardingChecklist(42);
    expect(checklist!.id).toBe(7);
    expect((db as any).__store["onboarding_checklists"]).toHaveLength(1);
    expect((db as any).__store["onboarding_tasks"]).toHaveLength(0);
  });
});

describe("checkAndTriggerHandoff", () => {
  const paidSignedQuote = {
    id: 5,
    inquiryId: 42,
    totalAmount: "1500.00",
    status: "paid",
    msaStatus: "signed",
  };
  const inquiry = {
    id: 42,
    name: "Jane Smith",
    company: "Acme Corp",
    email: "jane@acme.com",
    status: "paid",
  };

  it("triggers when quote is paid and MSA signed", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "x" }, error: null });
    const db = makeFakeDb({
      quotes: [paidSignedQuote],
      package_inquiries: [inquiry],
      onboarding_checklists: [],
      onboarding_tasks: [],
    });
    mockGetDb.mockResolvedValue(db);
    const result = await checkAndTriggerHandoff(42);
    expect(result).toBe(true);
    const updated = (db as any).__store["package_inquiries"][0];
    expect(updated.status).toBe("onboarding");
    expect((db as any).__store["onboarding_tasks"]).toHaveLength(8);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("owner@layeronestaging.com");
    expect(call.subject).toContain("Acme Corp");
    expect(call.html).toContain("$1,500.00");
  });

  it("does not trigger when MSA is still pending", async () => {
    const db = makeFakeDb({
      quotes: [{ ...paidSignedQuote, msaStatus: "pending" }],
      package_inquiries: [inquiry],
    });
    mockGetDb.mockResolvedValue(db);
    const result = await checkAndTriggerHandoff(42);
    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
    expect((db as any).__store["package_inquiries"][0].status).toBe("paid");
  });

  it("does not re-trigger when already onboarding (webhook retry safety)", async () => {
    const db = makeFakeDb({
      quotes: [paidSignedQuote],
      package_inquiries: [{ ...inquiry, status: "onboarding" }],
      onboarding_checklists: [{ id: 9, inquiryId: 42, status: "in_progress" }],
    });
    mockGetDb.mockResolvedValue(db);
    const result = await checkAndTriggerHandoff(42);
    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns false (never throws) when the DB is unavailable", async () => {
    mockGetDb.mockResolvedValue(null);
    await expect(checkAndTriggerHandoff(42)).resolves.toBe(false);
  });
});

describe("sendOwnerEmail", () => {
  it("returns true on success and uses the branded wrapper", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "x" }, error: null });
    const result = await sendOwnerEmail({
      subject: "Test subject",
      title: "Test title",
      contentHtml: "<p>hello</p>",
    });
    expect(result).toBe(true);
    const call = mockSend.mock.calls[0][0];
    expect(call.from).toBe("info@layeronestaging.com");
    expect(call.to).toBe("owner@layeronestaging.com");
    expect(call.html).toContain("Layer One Staging");
    expect(call.html).toContain("<p>hello</p>");
  });

  it("returns false when resend reports an error", async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: "bad key" } });
    const result = await sendOwnerEmail({
      subject: "s",
      title: "t",
      contentHtml: "c",
    });
    expect(result).toBe(false);
  });
});
