import { describe, expect, it, vi, afterEach } from "vitest";

// Regression test (2026-09-27): the Messages thread list never loaded.
// listAllThreads() built a GROUP BY query whose ORDER BY referenced
// `latestAt`, but the raw sql<> fragments in the SELECT carried no column
// aliases, so the database rejected the query with "unknown column".
// Every fragment must carry an explicit .as() alias.

const capturedSql: string[] = [];

vi.mock("drizzle-orm/mysql2", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("drizzle-orm/mysql2")>();
  return {
    ...mod,
    drizzle: (...args: unknown[]) =>
      (mod.drizzle as (...a: unknown[]) => unknown)(
        {
          query: async (q: unknown) => {
            capturedSql.push(
              typeof q === "string" ? q : String((q as { sql?: unknown })?.sql ?? q),
            );
            return [[], []];
          },
        },
        args[1],
      ),
  };
});

describe("listAllThreads SQL", () => {
  afterEach(() => {
    capturedSql.length = 0;
    delete process.env.DATABASE_URL;
    vi.resetModules();
  });

  it("aliases every selected fragment so ORDER BY latestAt resolves", async () => {
    process.env.DATABASE_URL = "mysql://fake:fake@localhost/fake";
    const { listAllThreads } = await import("./db");
    await listAllThreads();

    expect(capturedSql.length).toBeGreaterThan(0);
    const sql = capturedSql[0].toLowerCase();
    for (const alias of [
      "latestbody",
      "latestat",
      "latestsenderrole",
      "latestsendername",
      "unreadcount",
      "totalmessages",
    ]) {
      expect(sql).toContain(`as \`${alias}\``);
    }
    expect(sql).toContain("order by latestat desc");
  });
});
