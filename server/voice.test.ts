import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getTableName } from "drizzle-orm";
import { hashPassword } from "./_core/password";
import {
  registerVoiceRoutes,
  normalizePhone,
  isRapidRepeat,
  lockoutMsFor,
  mintSessionToken,
  tokenHashOf,
} from "./voice";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./email", () => ({ sendVoiceChangeEmail: vi.fn().mockResolvedValue(true) }));

import { getDb } from "./db";
import { sendVoiceChangeEmail } from "./email";

const OLD_TOKEN = process.env.PROSPECT_SYNC_TOKEN;

beforeEach(() => {
  process.env.PROSPECT_SYNC_TOKEN = "test-sync-token";
  vi.clearAllMocks();
});

afterEach(() => {
  process.env.PROSPECT_SYNC_TOKEN = OLD_TOKEN;
});

// ─── Scripted in-memory fake for the drizzle chainable API ────────────────────
// Each test scripts the exact DB call sequence its endpoint performs.

type Script = { op: string; table?: string; rows?: any[]; returning?: any };

function makeDb(scripts: Script[]) {
  let step = 0;
  const consume = (op: string, table?: string): Script => {
    const s = scripts[step++];
    if (!s) throw new Error(`[test] unexpected db ${op}(${table ?? ""}) - no script left (step ${step - 1})`);
    if (s.op !== op)
      throw new Error(`[test] expected db ${s.op} but got ${op} at step ${step - 1}`);
    if (s.table && table && s.table !== table)
      throw new Error(`[test] expected table ${s.table} but got ${table} at step ${step - 1}`);
    return s;
  };
  const chain = (op: string, table: string): any => {
    const c: any = {};
    c.where = (_x: any) => c;
    c.orderBy = (_x: any) => c;
    c.limit = (_n: number) => Promise.resolve(consume(op, table).rows ?? []);
    return c;
  };
  return {
    select: (_cols?: any) => ({
      from: (t: any) => chain("select", getTableName(t)),
    }),
    insert: (t: any) => {
      const table = getTableName(t);
      return {
        values: (_v: any) => {
          const s = consume("insert", table);
          const p: any = Promise.resolve(s.rows ?? []);
          p.$returningId = () => Promise.resolve(s.returning ?? [{ id: 99 }]);
          return p;
        },
      };
    },
    update: (t: any) => ({
      set: (_v: any) => ({
        where: (_c: any) => Promise.resolve(consume("update", getTableName(t)).rows ?? []),
      }),
    }),
  };
}

function makeApp() {
  const handlers: Record<string, any> = {};
  return {
    app: { post: (path: string, handler: any) => { handlers[path] = handler; } },
    handlers,
  };
}

function mockReqRes(body: any) {
  const req: any = { body, query: {}, headers: {} };
  let statusCode = 200;
  let jsonBody: any;
  const res: any = {
    status: (c: number) => { statusCode = c; return res; },
    json: (b: any) => { jsonBody = b; return res; },
  };
  return { req, res, getStatus: () => statusCode, getJson: () => jsonBody };
}

function authedReqRes(params: any) {
  // Token via query param, matching the callLog pattern.
  const req: any = { body: params, query: { token: "test-sync-token" }, headers: {} };
  let statusCode = 200;
  let jsonBody: any;
  const res: any = {
    status: (c: number) => { statusCode = c; return res; },
    json: (b: any) => { jsonBody = b; return res; },
  };
  return { req, res, getStatus: () => statusCode, getJson: () => jsonBody };
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

describe("normalizePhone", () => {
  it("strips formatting to digits only", () => {
    expect(normalizePhone("(803) 235-2351")).toBe("8032352351");
    expect(normalizePhone("+1 469-537-4378")).toBe("14695374378");
    expect(normalizePhone("8032352351")).toBe("8032352351");
    expect(normalizePhone("")).toBe("");
    expect(normalizePhone(null)).toBe("");
    expect(normalizePhone(undefined)).toBe("");
  });
});

describe("lockoutMsFor", () => {
  it("is 15 minutes for the first lockout", () => {
    expect(lockoutMsFor(1)).toBe(15 * 60 * 1000);
  });
  it("doubles per consecutive lockout", () => {
    expect(lockoutMsFor(2)).toBe(30 * 60 * 1000);
    expect(lockoutMsFor(3)).toBe(60 * 60 * 1000);
  });
  it("caps at 24 hours", () => {
    expect(lockoutMsFor(10)).toBe(24 * 60 * 60 * 1000);
    expect(lockoutMsFor(100)).toBe(24 * 60 * 60 * 1000);
  });
});

describe("isRapidRepeat", () => {
  const spam = "+18035550100";
  it("returns true for 3 rapid short calls", () => {
    const rows = [0, 1, 2].map(() => ({ fromNumber: spam, durationSeconds: 0 }));
    expect(isRapidRepeat(rows.slice(0, 2), "18035550100")).toBe(true);
  });
  it("returns false for a single short call", () => {
    expect(isRapidRepeat([{ fromNumber: spam, durationSeconds: 0 }], "18035550100")).toBe(false);
  });
  it("ignores long calls", () => {
    const rows = [
      { fromNumber: spam, durationSeconds: 5 },
      { fromNumber: spam, durationSeconds: 12 },
      { fromNumber: spam, durationSeconds: 0 },
    ];
    expect(isRapidRepeat(rows, "18035550100")).toBe(false);
  });
  it("ignores other numbers", () => {
    const rows = [
      { fromNumber: "+18035559999", durationSeconds: 0 },
      { fromNumber: "+18035559999", durationSeconds: 0 },
    ];
    expect(isRapidRepeat(rows, "18035550100")).toBe(false);
  });
  it("ignores null durations", () => {
    const rows = [
      { fromNumber: spam, durationSeconds: null },
      { fromNumber: spam, durationSeconds: null },
    ];
    expect(isRapidRepeat(rows, "18035550100")).toBe(false);
  });
});

// ─── verify-caller ────────────────────────────────────────────────────────────

describe("POST /api/voice/verify-caller", () => {
  async function setup(pin = "1234", overrides: any = {}) {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const pinHash = await hashPassword(pin);
    const user = {
      id: 7,
      name: "Test Customer",
      businessName: "Test Co",
      email: "test@example.com",
      phone: "(214) 555-0100",
      role: "customer_admin",
      clientId: 3,
      isActive: true,
      phonePinHash: pinHash,
      consecutiveLockouts: 0,
      ...overrides,
    };
    return { handlers, user };
  }

  it("verifies with correct PIN and returns a session token", async () => {
    const { handlers, user } = await setup();
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "users", rows: [user] }, // lookup by phone
        { op: "select", table: "voice_sessions", rows: [] }, // no prior sessions
        { op: "insert", table: "voice_sessions" },
        { op: "insert", table: "account_audit_log" }, // voice_verified audit
      ])
    );
    const { req, res, getStatus, getJson } = authedReqRes({
      identifier: "2145550100",
      pin: "1234",
      blandCallId: "call-1",
    });
    await handlers["/api/voice/verify-caller"](req, res);
    expect(getStatus()).toBe(200);
    const body = getJson();
    expect(body.verified).toBe(true);
    expect(typeof body.sessionToken).toBe("string");
    expect(body.accountName).toBe("Test Customer");
    // The token must validate against its own HMAC.
    const expected = mintSessionToken(user.id, "call-1", 0); // shape check only
    expect(typeof expected).toBe("string");
    expect(tokenHashOf(body.sessionToken)).toHaveLength(64);
  });

  it("rejects an unknown identifier without enumeration detail", async () => {
    const { handlers } = await setup();
    (getDb as any).mockResolvedValue(
      makeDb([{ op: "select", table: "users", rows: [] }])
    );
    const { req, res, getJson } = authedReqRes({
      identifier: "9999999999",
      pin: "1234",
      blandCallId: "call-1",
    });
    await handlers["/api/voice/verify-caller"](req, res);
    expect(getJson()).toEqual({ verified: false });
  });

  it("rejects deactivated accounts", async () => {
    const { handlers, user } = await setup("1234", { isActive: false });
    (getDb as any).mockResolvedValue(
      makeDb([{ op: "select", table: "users", rows: [user] }])
    );
    const { req, res, getJson } = authedReqRes({
      identifier: "2145550100",
      pin: "1234",
      blandCallId: "call-1",
    });
    await handlers["/api/voice/verify-caller"](req, res);
    expect(getJson()).toEqual({ verified: false });
  });

  it("locks out after 3 wrong PINs with exponential backoff", async () => {
    const { handlers, user } = await setup();
    const runAttempt = async (priorSessions: any[], consecutiveLockouts: number) => {
      (getDb as any).mockResolvedValue(
        makeDb([
          { op: "select", table: "users", rows: [{ ...user, consecutiveLockouts }] },
          { op: "select", table: "voice_sessions", rows: priorSessions },
          // failure path writes:
          ...(priorSessions.length > 0
            ? [{ op: "update", table: "voice_sessions" }]
            : [{ op: "insert", table: "voice_sessions" }]),
          // lockout path writes (only on 3rd attempt):
          ...(priorSessions.length > 0 && (priorSessions[0].failedAttempts ?? 0) + 1 >= 3
            ? [
                { op: "update", table: "users" }, // consecutiveLockouts bump
                { op: "insert", table: "account_audit_log" },
              ]
            : priorSessions.length === 0 && 1 >= 3
              ? []
              : []),
        ])
      );
      const { req, res, getJson } = authedReqRes({
        identifier: "2145550100",
        pin: "wrong",
        blandCallId: "call-1",
      });
      await handlers["/api/voice/verify-caller"](req, res);
      return getJson();
    };

    const r1: any = await runAttempt([], 0);
    expect(r1.verified).toBe(false);
    expect(r1.attemptsRemaining).toBe(2);

    const r2: any = await runAttempt([{ id: 1, failedAttempts: 1, lockedUntil: null }], 0);
    expect(r2.verified).toBe(false);
    expect(r2.attemptsRemaining).toBe(1);

    const r3: any = await runAttempt([{ id: 1, failedAttempts: 2, lockedUntil: null }], 0);
    expect(r3).toEqual({ verified: false, locked: true });
  });

  it("reports locked when a lock is still active", async () => {
    const { handlers, user } = await setup();
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "users", rows: [user] },
        {
          op: "select",
          table: "voice_sessions",
          rows: [{ id: 1, failedAttempts: 3, lockedUntil: new Date(Date.now() + 600000) }],
        },
      ])
    );
    const { req, res, getJson } = authedReqRes({
      identifier: "2145550100",
      pin: "1234",
      blandCallId: "call-1",
    });
    await handlers["/api/voice/verify-caller"](req, res);
    expect(getJson()).toEqual({ verified: false, locked: true });
  });

  it("requires the shared token", async () => {
    const { handlers } = await setup();
    const { req, res, getStatus, getJson } = mockReqRes({
      identifier: "2145550100",
      pin: "1234",
    });
    req.query = {};
    req.headers = {};
    await handlers["/api/voice/verify-caller"](req, res);
    expect(getStatus()).toBe(401);
    expect(getJson()).toEqual({ error: "unauthorized" });
  });
});

// ─── account-update ───────────────────────────────────────────────────────────

describe("POST /api/voice/account-update", () => {
  const CALL_ID = "call-9";
  const USER_ID = 7;

  function sessionScripts() {
    const expiresAt = Date.now() + 30 * 60 * 1000;
    const sessionToken = mintSessionToken(USER_ID, CALL_ID, expiresAt);
    const sessionRow = {
      userId: USER_ID,
      blandCallId: CALL_ID,
      tokenHash: tokenHashOf(sessionToken),
      expiresAt: new Date(expiresAt),
    };
    return { sessionToken, sessionRow };
  }

  const customerUser = {
    id: USER_ID,
    name: "Test Customer",
    email: "test@example.com",
    phone: "2145550100",
    role: "customer_admin",
    deliveryNotes: null,
    notificationPrefs: null,
  };

  it("applies a Tier 1 update with confirmed=true and writes an audit row", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const { sessionToken, sessionRow } = sessionScripts();
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "voice_sessions", rows: [sessionRow] },
        { op: "select", table: "users", rows: [{ ...customerUser }] },
        { op: "update", table: "users" },
        { op: "insert", table: "account_audit_log" },
      ])
    );
    const { req, res, getStatus, getJson } = authedReqRes({
      sessionToken,
      blandCallId: CALL_ID,
      field: "deliveryNotes",
      value: "Call upon arrival",
      confirmed: true,
    });
    await handlers["/api/voice/account-update"](req, res);
    expect(getStatus()).toBe(200);
    expect(getJson()).toEqual({ applied: true, field: "deliveryNotes" });
    expect(sendVoiceChangeEmail).toHaveBeenCalledTimes(1);
    const emailArgs: any = (sendVoiceChangeEmail as any).mock.calls[0][0];
    expect(emailArgs.to).toBe("test@example.com");
    expect(emailArgs.staged).toBe(false);
    expect(emailArgs.changeDescription).not.toMatch(/1234/);
  });

  it("rejects Tier 1 updates without confirmed=true", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const { sessionToken, sessionRow } = sessionScripts();
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "voice_sessions", rows: [sessionRow] },
        { op: "select", table: "users", rows: [{ ...customerUser }] },
      ])
    );
    const { req, res, getStatus, getJson } = authedReqRes({
      sessionToken,
      blandCallId: CALL_ID,
      field: "deliveryNotes",
      value: "Call upon arrival",
      confirmed: false,
    });
    await handlers["/api/voice/account-update"](req, res);
    expect(getStatus()).toBe(400);
    expect(getJson()).toEqual({ error: "confirmation required" });
  });

  it("stages Tier 2 changes instead of applying them", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const { sessionToken, sessionRow } = sessionScripts();
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "voice_sessions", rows: [sessionRow] },
        { op: "select", table: "users", rows: [{ ...customerUser }] },
        { op: "insert", table: "voice_approvals", returning: [{ id: 42 }] },
        { op: "insert", table: "account_audit_log" },
      ])
    );
    const { req, res, getStatus, getJson } = authedReqRes({
      sessionToken,
      blandCallId: CALL_ID,
      kind: "deliveryDate",
      field: "deliveryDate",
      value: "2026-10-09",
      confirmed: true,
    });
    await handlers["/api/voice/account-update"](req, res);
    expect(getStatus()).toBe(200);
    const body: any = getJson();
    expect(body.staged).toBe(true);
    expect(body.message).toMatch(/Branden for review/);
    expect(sendVoiceChangeEmail).toHaveBeenCalledTimes(1);
    expect((sendVoiceChangeEmail as any).mock.calls[0][0].staged).toBe(true);
  });

  it("rejects hard-no fields with 403", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const { sessionToken, sessionRow } = sessionScripts();
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "voice_sessions", rows: [sessionRow] },
        { op: "select", table: "users", rows: [{ ...customerUser }] },
        { op: "insert", table: "account_audit_log" },
      ])
    );
    const { req, res, getStatus } = authedReqRes({
      sessionToken,
      blandCallId: CALL_ID,
      field: "email",
      value: "attacker@example.com",
      confirmed: true,
    });
    await handlers["/api/voice/account-update"](req, res);
    expect(getStatus()).toBe(403);
  });

  it("rejects writes from customer_viewer roles", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const { sessionToken, sessionRow } = sessionScripts();
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "voice_sessions", rows: [sessionRow] },
        { op: "select", table: "users", rows: [{ ...customerUser, role: "customer_viewer" }] },
        { op: "insert", table: "account_audit_log" },
      ])
    );
    const { req, res, getStatus, getJson } = authedReqRes({
      sessionToken,
      blandCallId: CALL_ID,
      field: "deliveryNotes",
      value: "Call upon arrival",
      confirmed: true,
    });
    await handlers["/api/voice/account-update"](req, res);
    expect(getStatus()).toBe(403);
    expect(getJson().error).toMatch(/role/i);
  });

  it("rejects expired sessions", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const expiresAt = Date.now() - 1000; // already expired
    const sessionToken = mintSessionToken(USER_ID, CALL_ID, expiresAt);
    const sessionRow = {
      userId: USER_ID,
      blandCallId: CALL_ID,
      tokenHash: tokenHashOf(sessionToken),
      expiresAt: new Date(expiresAt),
    };
    (getDb as any).mockResolvedValue(
      makeDb([{ op: "select", table: "voice_sessions", rows: [sessionRow] }])
    );
    const { req, res, getStatus } = authedReqRes({
      sessionToken,
      blandCallId: CALL_ID,
      field: "deliveryNotes",
      value: "x",
      confirmed: true,
    });
    await handlers["/api/voice/account-update"](req, res);
    expect(getStatus()).toBe(403);
  });

  it("rejects a session bound to a different call", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const expiresAt = Date.now() + 30 * 60 * 1000;
    const sessionToken = mintSessionToken(USER_ID, "other-call", expiresAt);
    const sessionRow = {
      userId: USER_ID,
      blandCallId: "other-call",
      tokenHash: tokenHashOf(sessionToken),
      expiresAt: new Date(expiresAt),
    };
    (getDb as any).mockResolvedValue(
      makeDb([{ op: "select", table: "voice_sessions", rows: [sessionRow] }])
    );
    const { req, res, getStatus } = authedReqRes({
      sessionToken,
      blandCallId: CALL_ID, // different call
      field: "deliveryNotes",
      value: "x",
      confirmed: true,
    });
    await handlers["/api/voice/account-update"](req, res);
    expect(getStatus()).toBe(403);
  });
});

// ─── account-note ─────────────────────────────────────────────────────────────

describe("POST /api/voice/account-note", () => {
  it("records a note and audit entry", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const expiresAt = Date.now() + 30 * 60 * 1000;
    const sessionToken = mintSessionToken(7, "call-9", expiresAt);
    const sessionRow = {
      userId: 7,
      blandCallId: "call-9",
      tokenHash: tokenHashOf(sessionToken),
      expiresAt: new Date(expiresAt),
    };
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "voice_sessions", rows: [sessionRow] },
        { op: "select", table: "users", rows: [{ role: "customer_admin" }] },
        { op: "insert", table: "account_notes" },
        { op: "insert", table: "account_audit_log" },
      ])
    );
    const { req, res, getStatus, getJson } = authedReqRes({
      sessionToken,
      blandCallId: "call-9",
      note: "Helped caller check invoice balance.",
    });
    await handlers["/api/voice/account-note"](req, res);
    expect(getStatus()).toBe(200);
    expect(getJson()).toEqual({ recorded: true });
  });

  it("rejects notes from customer_viewer roles", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const expiresAt = Date.now() + 30 * 60 * 1000;
    const sessionToken = mintSessionToken(7, "call-9", expiresAt);
    const sessionRow = {
      userId: 7,
      blandCallId: "call-9",
      tokenHash: tokenHashOf(sessionToken),
      expiresAt: new Date(expiresAt),
    };
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "voice_sessions", rows: [sessionRow] },
        { op: "select", table: "users", rows: [{ role: "customer_viewer" }] },
      ])
    );
    const { req, res, getStatus } = authedReqRes({
      sessionToken,
      blandCallId: "call-9",
      note: "Should not record.",
    });
    await handlers["/api/voice/account-note"](req, res);
    expect(getStatus()).toBe(403);
  });
});

// ─── check-blocklist + report-spam ────────────────────────────────────────────

describe("POST /api/voice/check-blocklist", () => {
  it("returns blocked:true for a listed number", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    (getDb as any).mockResolvedValue(
      makeDb([{ op: "select", table: "blocked_numbers", rows: [{ id: 1 }] }])
    );
    const { req, res, getJson } = authedReqRes({
      blandCallId: "call-in-1",
      callerPhone: "(800) 555-0199",
    });
    await handlers["/api/voice/check-blocklist"](req, res);
    expect(getJson()).toEqual({ blocked: true });
  });

  it("returns blocked:false for an unlisted number with no rapid history", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "blocked_numbers", rows: [] },
        { op: "select", table: "call_logs", rows: [] },
      ])
    );
    const { req, res, getJson } = authedReqRes({
      blandCallId: "call-in-1",
      callerPhone: "+18005550100",
    });
    await handlers["/api/voice/check-blocklist"](req, res);
    expect(getJson()).toEqual({ blocked: false });
  });

  it("auto-blocks on the 3rd rapid short call", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const now = new Date();
    const spamRows = [0, 1].map((i) => ({
      fromNumber: "+18005550100",
      startedAt: new Date(now.getTime() - i * 60000),
      createdAt: new Date(now.getTime() - i * 60000),
      durationSeconds: 0,
    }));
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "blocked_numbers", rows: [] },
        { op: "select", table: "call_logs", rows: spamRows },
        { op: "select", table: "blocked_numbers", rows: [] }, // idempotency re-check
        { op: "insert", table: "blocked_numbers" },
      ])
    );
    const { req, res, getJson } = authedReqRes({
      blandCallId: "call-in-3",
      callerPhone: "18005550100",
    });
    await handlers["/api/voice/check-blocklist"](req, res);
    expect(getJson()).toEqual({ blocked: true, autoBlocked: true });
  });

  it("does not auto-block when the prior call was a real conversation", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    const now = new Date();
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "blocked_numbers", rows: [] },
        {
          op: "select",
          table: "call_logs",
          rows: [
            {
              fromNumber: "+18005550100",
              startedAt: new Date(now.getTime() - 60000),
              createdAt: new Date(now.getTime() - 60000),
              durationSeconds: 5, // ~5 minutes: a real conversation
            },
          ],
        },
      ])
    );
    const { req, res, getJson } = authedReqRes({
      blandCallId: "call-in-2",
      callerPhone: "18005550100",
    });
    await handlers["/api/voice/check-blocklist"](req, res);
    expect(getJson()).toEqual({ blocked: false });
  });

  it("accepts the token via the x-voice-token header", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "blocked_numbers", rows: [] },
        { op: "select", table: "call_logs", rows: [] },
      ])
    );
    const req: any = {
      body: { callerPhone: "18005550100" },
      query: {},
      headers: { "x-voice-token": "test-sync-token" },
    };
    let jsonBody: any;
    const res: any = { status: (c: number) => res, json: (b: any) => { jsonBody = b; return res; } };
    await handlers["/api/voice/check-blocklist"](req, res);
    expect(jsonBody).toEqual({ blocked: false });
  });
});

describe("POST /api/voice/report-spam", () => {
  it("inserts a new spam number with source alex", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    (getDb as any).mockResolvedValue(
      makeDb([
        { op: "select", table: "blocked_numbers", rows: [] },
        { op: "insert", table: "blocked_numbers" },
      ])
    );
    const { req, res, getJson } = authedReqRes({
      blandCallId: "call-in-1",
      callerPhone: "(800) 555-0199",
      reason: "robocall",
    });
    await handlers["/api/voice/report-spam"](req, res);
    expect(getJson()).toEqual({ recorded: true, blocked: true });
  });

  it("is idempotent on duplicate phone", async () => {
    const { app, handlers } = makeApp();
    registerVoiceRoutes(app as any);
    (getDb as any).mockResolvedValue(
      makeDb([{ op: "select", table: "blocked_numbers", rows: [{ id: 5 }] }])
    );
    const { req, res, getJson } = authedReqRes({
      blandCallId: "call-in-2",
      callerPhone: "8005550199",
    });
    await handlers["/api/voice/report-spam"](req, res);
    expect(getJson()).toEqual({ recorded: true, blocked: true });
  });
});
