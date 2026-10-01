import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  extractCallLogFields,
  registerCallLogRoutes,
  tokenOk,
  type CallLogStore,
} from "./callLog";

const OLD_TOKEN = process.env.PROSPECT_SYNC_TOKEN;

beforeEach(() => {
  process.env.PROSPECT_SYNC_TOKEN = "test-sync-token";
  vi.clearAllMocks();
});

afterEach(() => {
  process.env.PROSPECT_SYNC_TOKEN = OLD_TOKEN;
});

describe("tokenOk", () => {
  it("accepts the correct token", () => {
    expect(tokenOk("test-sync-token")).toBe(true);
  });

  it("rejects a wrong token", () => {
    expect(tokenOk("wrong-token")).toBe(false);
  });

  it("rejects missing / empty tokens", () => {
    expect(tokenOk(undefined)).toBe(false);
    expect(tokenOk("")).toBe(false);
    expect(tokenOk(null)).toBe(false);
  });

  it("rejects everything when the env var is unset", () => {
    delete process.env.PROSPECT_SYNC_TOKEN;
    expect(tokenOk("test-sync-token")).toBe(false);
  });
});

describe("extractCallLogFields", () => {
  it("extracts a Bland phone-call webhook payload", () => {
    const fields = extractCallLogFields({
      call_id: "abc-123",
      direction: "inbound",
      from: "+12145550100",
      to: "+14695374378",
      call_length: 187,
      recording_url: "https://recordings.bland.ai/abc-123.mp3",
      summary: "Caller asked about pallet storage pricing.",
      concatenated_transcript: "Alex: Hi! Caller: How much is storage?",
    });
    expect(fields.blandCallId).toBe("abc-123");
    expect(fields.direction).toBe("inbound");
    expect(fields.fromNumber).toBe("+12145550100");
    expect(fields.toNumber).toBe("+14695374378");
    expect(fields.durationSeconds).toBe(187);
    expect(fields.recordingUrl).toBe("https://recordings.bland.ai/abc-123.mp3");
    expect(fields.summary).toBe("Caller asked about pallet storage pricing.");
    expect(fields.transcript).toBe("Alex: Hi! Caller: How much is storage?");
  });

  it("joins the structured transcripts array into speaker lines", () => {
    const fields = extractCallLogFields({
      transcripts: [
        { user: "assistant", text: "Thanks for calling Layer One!" },
        { user: "user", text: "Hi, do you do kitting?" },
      ],
    });
    expect(fields.transcript).toBe(
      "Alex: Thanks for calling Layer One!\nCaller: Hi, do you do kitting?"
    );
  });

  it("handles the chat-widget conversation_history shape", () => {
    const fields = extractCallLogFields({
      conversation_history: [
        { sender_type: "ASSISTANT", content: "Hello!" },
        { sender_type: "USER", content: "Pricing please" },
      ],
    });
    expect(fields.transcript).toBe("Alex: Hello!\nCaller: Pricing please");
  });

  it("picks caller details out of the variables bag", () => {
    const fields = extractCallLogFields({
      variables: { caller_name: "Jane Smith", company: "Acme Corp" },
    });
    expect(fields.callerName).toBe("Jane Smith");
    expect(fields.company).toBe("Acme Corp");
  });

  it("parses alternate key spellings for dates, durations, and ids", () => {
    const fields = extractCallLogFields({
      callId: "xyz-9",
      callLength: "95.7",
      started_at: "2026-10-01T19:00:00.000Z",
    });
    expect(fields.blandCallId).toBe("xyz-9");
    expect(fields.durationSeconds).toBe(96);
    expect(fields.startedAt).toEqual(new Date("2026-10-01T19:00:00.000Z"));
  });

  it("never throws on weird payloads and returns empty fields", () => {
    for (const weird of [null, undefined, "a string", 42, [], true]) {
      const fields = extractCallLogFields(weird);
      expect(fields.blandCallId).toBeNull();
      expect(fields.direction).toBe("unknown");
      expect(fields.transcript).toBeNull();
    }
    const empty = extractCallLogFields({});
    expect(empty.fromNumber).toBeNull();
    expect(empty.durationSeconds).toBeNull();
  });

  it("ignores unparseable dates and durations instead of throwing", () => {
    const fields = extractCallLogFields({ started_at: "not a date", call_length: "nonsense" });
    expect(fields.startedAt).toBeNull();
    expect(fields.durationSeconds).toBeNull();
  });
});

// ─── Route handler tests (fake express app + in-memory store) ────────────────

type Handler = (req: any, res: any) => Promise<void>;

function makeApp() {
  const handlers = new Map<string, Handler>();
  return {
    handlers,
    post: vi.fn((path: string, h: Handler) => {
      handlers.set(`POST ${path}`, h);
    }),
    get: vi.fn((path: string, h: Handler) => {
      handlers.set(`GET ${path}`, h);
    }),
  };
}

function makeReq(query: any = {}, body: any = undefined) {
  return { query, body };
}

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function memoryStore(): CallLogStore & { rows: any[] } {
  const rows: any[] = [];
  let nextId = 1;
  return {
    rows,
    insert: async (fields: any) => {
      rows.push({ id: nextId++, syncedToSheet: false, createdAt: new Date(), ...fields });
    },
    listUnsynced: async (limit: number) =>
      rows
        .filter((r) => !r.syncedToSheet)
        .sort((a, b) => a.id - b.id)
        .slice(0, limit),
    markSynced: async (ids: unknown[]) => {
      const clean = new Set((Array.isArray(ids) ? ids : []).filter((n) => Number.isInteger(n) && n > 0));
      let n = 0;
      for (const r of rows) {
        if (clean.has(r.id) && !r.syncedToSheet) {
          r.syncedToSheet = true;
          n++;
        }
      }
      return n;
    },
  };
}

function setup() {
  const app = makeApp();
  const store = memoryStore();
  registerCallLogRoutes(app as any, async () => store);
  return { app, store };
}

const GOOD_Q = { token: "test-sync-token" };
const BAD_Q = { token: "nope" };

describe("POST /api/call-log", () => {
  it("rejects an invalid token with 401 and stores nothing", async () => {
    const { app, store } = setup();
    const res = makeRes();
    await app.handlers.get("POST /api/call-log")!(makeReq(BAD_Q, { call_id: "x" }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(store.rows).toHaveLength(0);
  });

  it("stores a valid webhook payload with extracted fields", async () => {
    const { app, store } = setup();
    const payload = {
      call_id: "call-1",
      direction: "outbound",
      from: "+14695374378",
      to: "+12145550100",
      call_length: 120,
      concatenated_transcript: "Alex: Hi Jane! Caller: Hi!",
      summary: "Scheduled callback completed.",
      variables: { caller_name: "Jane Smith", company: "Acme" },
    };
    const res = makeRes();
    await app.handlers.get("POST /api/call-log")!(makeReq(GOOD_Q, payload), res);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(store.rows).toHaveLength(1);
    const row = store.rows[0];
    expect(row.blandCallId).toBe("call-1");
    expect(row.direction).toBe("outbound");
    expect(row.callerName).toBe("Jane Smith");
    expect(row.company).toBe("Acme");
    expect(row.durationSeconds).toBe(120);
    expect(row.summary).toBe("Scheduled callback completed.");
    // The raw payload is always preserved verbatim.
    expect(JSON.parse(row.rawPayload)).toEqual(payload);
  });

  it("stores weird/empty payloads without throwing", async () => {
    const { app, store } = setup();
    for (const body of [null, {}, { unexpected: ["shape"] }, "just a string"]) {
      const res = makeRes();
      await app.handlers.get("POST /api/call-log")!(makeReq(GOOD_Q, body), res);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    }
    expect(store.rows).toHaveLength(4);
    expect(store.rows.every((r) => typeof r.rawPayload === "string")).toBe(true);
  });

  it("returns 503 when the database is unavailable", async () => {
    const app = makeApp();
    registerCallLogRoutes(app as any, async () => null);
    const res = makeRes();
    await app.handlers.get("POST /api/call-log")!(makeReq(GOOD_Q, { call_id: "x" }), res);
    expect(res.status).toHaveBeenCalledWith(503);
  });
});

describe("unsynced / mark-synced round trip", () => {
  it("lists unsynced rows oldest-first, then hides them after marking", async () => {
    const { app, store } = setup();
    const post = app.handlers.get("POST /api/call-log")!;
    await post(makeReq(GOOD_Q, { call_id: "c1", summary: "first" }), makeRes());
    await post(makeReq(GOOD_Q, { call_id: "c2", summary: "second" }), makeRes());

    const getRes = makeRes();
    await app.handlers.get("GET /api/call-log/unsynced")!(makeReq(GOOD_Q), getRes);
    const first = getRes.json.mock.calls[0][0];
    expect(first.ok).toBe(true);
    expect(first.rows).toHaveLength(2);
    expect(first.rows[0].blandCallId).toBe("c1");
    expect(first.rows[1].blandCallId).toBe("c2");

    const markRes = makeRes();
    await app.handlers.get("POST /api/call-log/mark-synced")!(
      makeReq(GOOD_Q, { ids: first.rows.map((r: any) => r.id) }),
      markRes
    );
    expect(markRes.json).toHaveBeenCalledWith({ ok: true, marked: 2 });

    const getRes2 = makeRes();
    await app.handlers.get("GET /api/call-log/unsynced")!(makeReq(GOOD_Q), getRes2);
    expect(getRes2.json.mock.calls[0][0].rows).toHaveLength(0);
    expect(store.rows.every((r) => r.syncedToSheet)).toBe(true);
  });

  it("rejects invalid tokens on the sync endpoints", async () => {
    const { app } = setup();
    const res1 = makeRes();
    await app.handlers.get("GET /api/call-log/unsynced")!(makeReq(BAD_Q), res1);
    expect(res1.status).toHaveBeenCalledWith(401);
    const res2 = makeRes();
    await app.handlers.get("POST /api/call-log/mark-synced")!(makeReq(BAD_Q, { ids: [1] }), res2);
    expect(res2.status).toHaveBeenCalledWith(401);
  });

  it("mark-synced tolerates garbage ids", async () => {
    const { app, store } = setup();
    await app.handlers.get("POST /api/call-log")!(makeReq(GOOD_Q, { call_id: "c1" }), makeRes());
    const res = makeRes();
    await app.handlers.get("POST /api/call-log/mark-synced")!(
      makeReq(GOOD_Q, { ids: ["x", -5, 99999, null] }),
      res
    );
    expect(res.json).toHaveBeenCalledWith({ ok: true, marked: 0 });
    expect(store.rows[0].syncedToSheet).toBe(false);
  });
});
