import { describe, expect, it, vi } from "vitest";

let currentFakeDb: any = null;
vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: () => currentFakeDb,
}));

process.env.DATABASE_URL = "mysql://test:test@localhost:3306/test";

function makeFakeDb(opts: { existingUserIds?: number[]; affectedRows?: number } = {}) {
  const state = { insertCalled: false, existingUserIds: opts.existingUserIds ?? [] };
  return {
    select: vi.fn(() => ({
      from: () => ({
        where: () => {
          const rows = state.existingUserIds.map((id) => ({ id }));
          // Support both `...where(filter)` (count) and `...where(filter).limit(1)` (guard).
          (rows as unknown as { limit: () => Promise<typeof rows> }).limit = async () => rows;
          return rows;
        },
      }),
    })),
    insert: vi.fn(() => ({
      values: () => {
        state.insertCalled = true;
        return { onDuplicateKeyUpdate: async () => {} };
      },
    })),
    delete: vi.fn(() => ({
      where: async () => ({ affectedRows: opts.affectedRows ?? 0 }),
    })),
    _state: state,
  };
}

async function loadDb(opts?: { existingUserIds?: number[]; affectedRows?: number }) {
  vi.resetModules();
  currentFakeDb = makeFakeDb(opts);
  return await import("./db");
}

describe("fallbackUserName", () => {
  it("returns the trimmed provider name when present", async () => {
    const { fallbackUserName } = await loadDb();
    expect(fallbackUserName("  Ada Lovelace ", "ada@example.com")).toBe("Ada Lovelace");
  });
  it("falls back to the email local part", async () => {
    const { fallbackUserName } = await loadDb();
    expect(fallbackUserName(null, "ada@example.com")).toBe("ada");
    expect(fallbackUserName("", "ada@example.com")).toBe("ada");
  });
  it("falls back to Portal User with nothing usable", async () => {
    const { fallbackUserName } = await loadDb();
    expect(fallbackUserName(null, null)).toBe("Portal User");
    expect(fallbackUserName("   ", "")).toBe("Portal User");
  });
});

describe("upsertUser no-unnamed-users guard", () => {
  it("refuses to INSERT a brand-new user without a name", async () => {
    const db = await loadDb({ existingUserIds: [] });
    await expect(
      db.upsertUser({ openId: "local:ghost@example.com", email: "ghost@example.com" })
    ).rejects.toThrow(/no name/i);
    expect(currentFakeDb._state.insertCalled).toBe(false);
  });

  it("refuses INSERT when name is only whitespace", async () => {
    const db = await loadDb({ existingUserIds: [] });
    await expect(
      db.upsertUser({ openId: "local:ghost2@example.com", name: "   " })
    ).rejects.toThrow(/no name/i);
    expect(currentFakeDb._state.insertCalled).toBe(false);
  });

  it("allows INSERT when a name is provided", async () => {
    const db = await loadDb({ existingUserIds: [] });
    await db.upsertUser({
      openId: "local:ada@example.com",
      name: "Ada",
      email: "ada@example.com",
    });
    expect(currentFakeDb._state.insertCalled).toBe(true);
  });

  it("allows name-less UPDATE touches for existing users (e.g. lastSignedIn)", async () => {
    const db = await loadDb({ existingUserIds: [42] });
    await db.upsertUser({ openId: "local:ada@example.com", lastSignedIn: new Date() });
    expect(currentFakeDb._state.insertCalled).toBe(true);
    expect(currentFakeDb.insert).toHaveBeenCalled();
  });
});

describe("unnamed purge helpers", () => {
  it("counts purgeable unnamed users", async () => {
    const db = await loadDb({ existingUserIds: [1, 2, 3] });
    await expect(db.countPurgeableUnnamedUsers(99)).resolves.toBe(3);
  });

  it("deletes purgeable unnamed users and returns affected rows", async () => {
    const db = await loadDb({ affectedRows: 4120 });
    await expect(db.deletePurgeableUnnamedUsers(99)).resolves.toBe(4120);
    expect(currentFakeDb.delete).toHaveBeenCalled();
  });
});
