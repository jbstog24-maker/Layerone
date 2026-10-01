import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { execRows, tableExists, columnExists, inquiryStatusHas } from "./migrate-once";

// Regression test (2026-09-27): db.execute() on the mysql2 driver resolves to
// the raw mysql2 [rows, fields] tuple, NOT the rows array. An earlier version
// of the existence checks read `.length` directly on the tuple (always 2),
// so every check reported "already exists" and the migration silently skipped
// all of its DDL — including the users.inviteToken columns the set-password
// flow needs. These tests pin the unwrapping behavior with a mocked db.

function mockDb(tuple: unknown) {
  return { execute: vi.fn().mockResolvedValue(tuple) };
}

describe("migrate-once existence checks", () => {
  it("execRows unwraps the mysql2 [rows, fields] tuple", async () => {
    const db = mockDb([[{ "1": 1 }], [{ name: "1" }]]);
    const rows = await execRows(db, "SELECT 1");
    expect(rows).toEqual([{ "1": 1 }]);
  });

  it("execRows handles an empty result set", async () => {
    const db = mockDb([[], [{ name: "1" }]]);
    const rows = await execRows(db, "SELECT 1");
    expect(rows).toEqual([]);
  });

  it("columnExists returns true when the column is present", async () => {
    const db = mockDb([[{ "1": 1 }], []]);
    expect(await columnExists(db, "users", "inviteToken")).toBe(true);
  });

  it("columnExists returns false when the column is missing", async () => {
    // This is the case the old code got wrong: the tuple itself has length 2
    // even when zero data rows came back.
    const db = mockDb([[], []]);
    expect(await columnExists(db, "users", "inviteToken")).toBe(false);
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it("tableExists returns false when the table is missing", async () => {
    const db = mockDb([[], []]);
    expect(await tableExists(db, "msa_documents")).toBe(false);
  });

  it("tableExists returns true when the table is present", async () => {
    const db = mockDb([[{ "1": 1 }], []]);
    expect(await tableExists(db, "msa_documents")).toBe(true);
  });

  it("inquiryStatusHas detects an enum value from SHOW COLUMNS", async () => {
    const db = mockDb([
      [{ Type: "enum('new','needs_review','contacted')" }],
      [],
    ]);
    expect(await inquiryStatusHas(db, "needs_review")).toBe(true);
    expect(await inquiryStatusHas(db, "paid")).toBe(false);
  });

  it("inquiryStatusHas returns false when the column row is absent", async () => {
    const db = mockDb([[], []]);
    expect(await inquiryStatusHas(db, "needs_review")).toBe(false);
  });
});

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Regression test (2026-09-30): the soft-delete feature needs a `deletedAt`
// timestamp column on package_inquiries. These tests pin the one-time
// migration step: it must issue the ALTER when the column is missing and skip
// it when the column already exists (idempotent, safe to re-run).
describe("deletedAt soft-delete migration step", () => {
  const OLD_ENV = process.env.RUN_ONCE_MIGRATION;

  beforeEach(() => {
    process.env.RUN_ONCE_MIGRATION = "1";
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.RUN_ONCE_MIGRATION = OLD_ENV;
  });

  async function runWith(executeImpl: (q: any) => Promise<any>) {
    const { getDb } = await import("./db");
    const { runOnceMigration } = await import("./migrate-once");
    const calls: any[] = [];
    const execute = vi.fn(async (q: any) => {
      calls.push(q);
      return executeImpl(q);
    });
    (getDb as any).mockResolvedValue({ execute });
    await runOnceMigration();
    return calls;
  }

  const MISSING: (q: any) => Promise<any> = async () => [[], []];

  it("issues ALTER TABLE ADD deletedAt when the column is missing", async () => {
    const calls = await runWith(MISSING);
    const alters = calls.filter(q => {
      const s = JSON.stringify(q);
      return s.includes("deletedAt") && s.includes("ADD");
    });
    expect(alters.length).toBeGreaterThan(0);
  });

  it("skips the ALTER when deletedAt already exists", async () => {
    const calls = await runWith(async (q: any) => {
      const s = JSON.stringify(q);
      if (s.includes("INFORMATION_SCHEMA.COLUMNS") && s.includes("deletedAt")) {
        return [[{ "1": 1 }], []];
      }
      return [[], []];
    });
    const alters = calls.filter(q => {
      const s = JSON.stringify(q);
      return s.includes("deletedAt") && s.includes("ADD");
    });
    expect(alters).toHaveLength(0);
  });
});
